/**
 * Google Slides and Google Docs links pasted into the review box.
 *
 * The site cannot sign in to anyone's Google account, so it only reads files
 * shared as "Anyone with the link". It downloads them in Office format (pptx /
 * docx) and hands them to the same extractor as an upload, so slide numbers
 * and speaker notes come through. The request URL is built here from the file
 * id alone, always on docs.google.com, so a pasted link cannot point the
 * server anywhere else.
 */

export interface GoogleLink {
  kind: "slides" | "docs";
  id: string;
}

const LINK = /^https?:\/\/docs\.google\.com\/(presentation|document)(?:\/u\/\d+)?\/d\/([A-Za-z0-9_-]{20,})(?:[/?#]\S*)?$/;

/** The pasted text is a Google Slides or Docs link and nothing else. */
export function parseGoogleLink(text: string): GoogleLink | null {
  const m = text.trim().match(LINK);
  if (!m) return null;
  return { kind: m[1] === "presentation" ? "slides" : "docs", id: m[2] };
}

export class GoogleLinkError extends Error {}

const MAX_BYTES = 30 * 1024 * 1024;

const NOT_SHARED =
  "We couldn't open that link. Set sharing to 'Anyone with the link', or download it as a PDF and drop it in.";

/** Download the linked file as pptx or docx. Returns the bytes and a filename the extractor understands. */
export async function fetchGoogleFile(link: GoogleLink): Promise<{ buffer: Buffer; filename: string }> {
  const url =
    link.kind === "slides"
      ? `https://docs.google.com/presentation/d/${link.id}/export/pptx`
      : `https://docs.google.com/document/d/${link.id}/export?format=docx`;
  const expected = link.kind === "slides" ? "presentationml" : "wordprocessingml";

  let res: Response;
  try {
    res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(25_000) });
  } catch {
    throw new GoogleLinkError("Google didn't respond. Try again, or download the file and drop it in.");
  }

  // A private or missing file comes back as a sign-in or error page, not the file.
  const type = res.headers.get("content-type") || "";
  if (!res.ok || !type.includes(expected)) throw new GoogleLinkError(NOT_SHARED);

  const size = Number(res.headers.get("content-length") || 0);
  if (size > MAX_BYTES) throw new GoogleLinkError("That file is too large to review. Try a PDF of it instead.");
  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length > MAX_BYTES) throw new GoogleLinkError("That file is too large to review. Try a PDF of it instead.");

  return { buffer, filename: link.kind === "slides" ? "deck.pptx" : "doc.docx" };
}
