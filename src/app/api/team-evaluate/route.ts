import { NextRequest } from "next/server";
import { requestSource } from "@/lib/request-source";
import { evaluateForTeam, isUsableReview } from "@/lib/team-evaluate";
import {
  countTeamReviewToday,
  saveTeamReview,
  getTeamReview,
} from "@/lib/redis";
import { TeamReviewResult } from "@/lib/team-types";
import { hasTeamAccess } from "@/lib/team-auth";

export const maxDuration = 300;

const MAX_FILE_SIZE = 4.5 * 1024 * 1024; // Vercel request body limit
const MIN_TEXT_LENGTH = 100;
const MAX_TEXT_LENGTH = 300_000; // ~75k tokens, well inside the context window
const DAILY_LIMIT = Number(process.env.TEAM_DAILY_LIMIT || 40);

interface ParsedRequest {
  text: string;
  previousId?: string;
}

function jsonLine(payload: unknown): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(payload) + "\n");
}

function errorResponse(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function parseRequest(request: NextRequest): Promise<ParsedRequest> {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) throw new Error("No file provided");
    if (file.size > MAX_FILE_SIZE) {
      throw new Error("File too large. Maximum size is 4.5MB.");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let text: string;
    try {
      const { extractText } = await import("@/lib/extract");
      text = await extractText(buffer, file.name);
    } catch {
      throw new Error(
        "Couldn't extract text from this file. Try pasting the content directly."
      );
    }

    return {
      text,
      previousId: (formData.get("previousId") as string) || undefined,
    };
  }

  const body = await request.json();
  if (!body.text || typeof body.text !== "string") {
    throw new Error("No text provided");
  }
  return {
    text: body.text,
    previousId:
      typeof body.previousId === "string" ? body.previousId : undefined,
  };
}

export async function POST(request: NextRequest) {
  // The proxy already redirected an unauthenticated page request, but its check
  // is optimistic by design. This is the one that guards the Opus call.
  if (!(await hasTeamAccess())) {
    return errorResponse("Session expired. Reload the page and sign in again.", 401);
  }

  let parsed: ParsedRequest;
  try {
    parsed = await parseRequest(request);
  } catch (error) {
    return errorResponse((error as Error).message, 400);
  }

  let { text } = parsed;
  const { previousId } = parsed;

  if (text.trim().length < MIN_TEXT_LENGTH) {
    return errorResponse(
      "That document is too short to review. Paste at least 100 characters.",
      400
    );
  }

  // Checked before the model call, since the point of the cap is the spend.
  const { allowed } = await countTeamReviewToday(DAILY_LIMIT);
  if (!allowed) {
    return errorResponse(
      `The reviewer has hit its limit of ${DAILY_LIMIT} documents for today. It resets at midnight UTC.`,
      429
    );
  }

  let truncated = false;
  if (text.length > MAX_TEXT_LENGTH) {
    text = text.slice(0, MAX_TEXT_LENGTH);
    truncated = true;
  }

  // Look up the prior review so a re-review can report on what moved.
  let previous: { overall: number; fixes: string[] } | undefined;
  if (previousId) {
    const stored = (await getTeamReview(previousId)) as {
      review?: TeamReviewResult;
    } | null;
    if (stored?.review) {
      previous = {
        overall: stored.review.overall,
        fixes: stored.review.top_fixes || [],
      };
    }
  }

  // Resolve before the stream: cookies() only work in the request scope, and the
  // ReadableStream callbacks run after the handler has returned.
  const source = await requestSource();

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      const send = (payload: unknown) => {
        if (!closed) controller.enqueue(jsonLine(payload));
      };

      try {
        let lastPartial = 0;
        const review = await evaluateForTeam(
          text,
          {
            previous,
            onPartial: (partialJson) => {
              // Throttle: the reveal only needs to keep up with the eye.
              const now = Date.now();
              if (now - lastPartial < 120) return;
              lastPartial = now;
              send({ type: "partial", json: partialJson });
            },
          },
          source
        );

        // A review missing its scores or verdict is a failed generation. Saying so
        // beats rendering a confident one-star the document never earned.
        if (!isUsableReview(review)) {
          throw new Error("Incomplete review returned from Claude");
        }

        const id =
          Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        const saved = await saveTeamReview(id, {
          review,
          createdAt: new Date().toISOString(),
        });

        send({ type: "done", review, id: saved ? id : undefined, truncated });
      } catch (error) {
        console.error("Team review error:", error);
        send({
          type: "error",
          error: "That review didn't generate. Please try again.",
        });
      } finally {
        closed = true;
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
