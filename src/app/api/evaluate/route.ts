import { NextRequest } from "next/server";
import { requestSource } from "@/lib/request-source";
import { evaluateDocument } from "@/lib/evaluate";
import { saveReview, getReview } from "@/lib/redis";
import { DocumentContext, EvaluationResult } from "@/lib/types";

export const maxDuration = 300;

const MAX_FILE_SIZE = 4.5 * 1024 * 1024; // Vercel request body limit
const MIN_TEXT_LENGTH = 100;
const MAX_TEXT_LENGTH = 300_000; // ~75k tokens, well inside the context window

interface ParsedRequest {
  text: string;
  context?: DocumentContext;
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
      context: {
        audience: (formData.get("audience") as string) || undefined,
        intended: (formData.get("intended") as string) || undefined,
      },
      previousId: (formData.get("previousId") as string) || undefined,
    };
  }

  const body = await request.json();
  if (!body.text || typeof body.text !== "string") {
    throw new Error("No text provided");
  }
  return {
    text: body.text,
    context: {
      audience:
        typeof body.audience === "string" ? body.audience : undefined,
      intended:
        typeof body.intended === "string" ? body.intended : undefined,
    },
    previousId:
      typeof body.previousId === "string" ? body.previousId : undefined,
  };
}

export async function POST(request: NextRequest) {
  let parsed: ParsedRequest;
  try {
    parsed = await parseRequest(request);
  } catch (error) {
    return errorResponse((error as Error).message, 400);
  }

  let { text } = parsed;
  const { context, previousId } = parsed;

  if (text.trim().length < MIN_TEXT_LENGTH) {
    return errorResponse(
      "Document is too short to evaluate meaningfully. Please provide at least 100 characters.",
      400
    );
  }

  let truncated = false;
  if (text.length > MAX_TEXT_LENGTH) {
    text = text.slice(0, MAX_TEXT_LENGTH);
    truncated = true;
  }

  // Look up the prior review so a re-review can report on what changed.
  let previous: { overall: number; actions: string[] } | undefined;
  if (previousId) {
    const stored = (await getReview(previousId)) as {
      evaluation?: EvaluationResult;
    } | null;
    if (stored?.evaluation) {
      previous = {
        overall: stored.evaluation.overall,
        actions: stored.evaluation.categories.flatMap((c) => c.actions || []),
      };
    }
  }

  // Resolve before the stream: cookies() only works in the request scope, and
  // the ReadableStream callbacks run after the handler has returned.
  const source = await requestSource();

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      const send = (payload: unknown) => {
        if (!closed) controller.enqueue(jsonLine(payload));
      };

      try {
        let lastPartial = 0;
        const evaluation = await evaluateDocument(text, {
          context,
          previous,
          onPartial: (partialJson) => {
            // Throttle: the reveal only needs to keep up with the eye.
            const now = Date.now();
            if (now - lastPartial < 120) return;
            lastPartial = now;
            send({ type: "partial", json: partialJson });
          },
        }, source);

        const id =
          Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        await saveReview(id, {
          evaluation,
          createdAt: new Date().toISOString(),
        });

        send({ type: "done", evaluation, id, truncated });
      } catch (error) {
        console.error("Evaluation error:", error);
        send({
          type: "error",
          error: "Sorry, this evaluation didn't generate. Please try again.",
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
