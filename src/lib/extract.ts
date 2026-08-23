import mammoth from "mammoth";
import JSZip from "jszip";

export const SUPPORTED_EXTENSIONS = [
  "pdf",
  "docx",
  "doc",
  "pptx",
  "ppt",
  "txt",
  "md",
] as const;

export async function extractText(
  buffer: Buffer,
  filename: string
): Promise<string> {
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "pdf":
      return extractPDF(buffer);
    case "docx":
      return extractDOCX(buffer);
    case "doc":
      return extractDOC(buffer);
    case "pptx":
      return extractPPTX(buffer);
    case "ppt":
      return extractPPT(buffer);
    case "txt":
    case "md":
      return buffer.toString("utf8");
    default:
      throw new Error(`Unsupported file type: .${ext}`);
  }
}

async function extractPDF(buffer: Buffer): Promise<string> {
  const { extractText: pdfExtract } = await import("unpdf");
  const result = await pdfExtract(new Uint8Array(buffer));
  const pages = result.text as string[];
  return pages
    .map((page, i) => `[Page ${i + 1}]\n${page.trim()}`)
    .filter((page) => page.length > 12)
    .join("\n\n");
}

async function extractDOCX(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

/**
 * Legacy Word 97-2003 (.doc) — an OLE2 compound file, not a zip.
 * word-extractor walks the WordDocument stream and the piece table for us.
 */
async function extractDOC(buffer: Buffer): Promise<string> {
  const { default: WordExtractor } = await import("word-extractor");
  const doc = await new WordExtractor().extract(buffer);
  const parts = [doc.getBody(), doc.getFootnotes(), doc.getEndnotes()]
    .map((part) => (part || "").trim())
    .filter(Boolean);
  const text = parts.join("\n\n");
  if (!text.trim()) {
    throw new Error("No text found in .doc file");
  }
  return text;
}

/**
 * Keep slide boundaries and speaker notes so the reviewer can cite "slide 7"
 * instead of judging one undifferentiated blob of text.
 */
async function extractPPTX(buffer: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);

  const slideNumber = (name: string) =>
    parseInt(name.match(/(\d+)\.xml$/)?.[1] || "0", 10);
  const byNumber = (a: string, b: string) => slideNumber(a) - slideNumber(b);

  const slideFiles = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort(byNumber);

  const notesByNumber = new Map<number, string>();
  for (const name of Object.keys(zip.files).filter((n) =>
    /^ppt\/notesSlides\/notesSlide\d+\.xml$/.test(n)
  )) {
    const xml = await zip.files[name].async("text");
    const text = joinTextRuns(xml);
    if (text) notesByNumber.set(slideNumber(name), text);
  }

  const sections: string[] = [];
  for (const slidePath of slideFiles) {
    const n = slideNumber(slidePath);
    const xml = await zip.files[slidePath].async("text");
    const body = joinTextRuns(xml);
    const notes = notesByNumber.get(n);
    if (!body && !notes) continue;

    let section = `[Slide ${n}]`;
    if (body) section += `\n${body}`;
    if (notes) section += `\n(Speaker notes: ${notes})`;
    sections.push(section);
  }

  return sections.join("\n\n");
}

/** Pull the <a:t> text runs out of a DrawingML part, preserving paragraph breaks. */
function joinTextRuns(xml: string): string {
  return xml
    .split(/<a:p[\s>]/)
    .map((paragraph) => {
      const runs = paragraph.match(/<a:t>([\s\S]*?)<\/a:t>/g) || [];
      return runs
        .map((run) => decodeXmlEntities(run.replace(/<\/?a:t>/g, "")))
        .join("")
        .trim();
    })
    .filter(Boolean)
    .join("\n")
    .trim();
}

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(parseInt(d, 10)))
    .replace(/&amp;/g, "&");
}

// MS-PPT record types that carry slide text.
const TEXT_CHARS_ATOM = 0x0fa0; // UTF-16LE
const TEXT_BYTES_ATOM = 0x0fa8; // Latin-1, high byte implied zero
const RECORD_HEADER_BYTES = 8;
const CONTAINER_VERSION = 0xf;

/**
 * Legacy PowerPoint 97-2003 (.ppt) — an OLE2 compound file whose
 * "PowerPoint Document" stream is a tree of records. Container records
 * (recVer == 0xF) hold children; text lives in TextChars/TextBytes atoms.
 * Walking the tree in stream order approximates reading order.
 */
async function extractPPT(buffer: Buffer): Promise<string> {
  const CFB = await import("cfb");
  const container = CFB.read(buffer, { type: "buffer" });

  const stream = container.FileIndex.find(
    (entry: { name?: string }) => entry.name === "PowerPoint Document"
  );
  if (!stream?.content) {
    throw new Error("No PowerPoint Document stream found in .ppt file");
  }

  const data = Buffer.from(stream.content as Uint8Array);
  const chunks: string[] = [];
  walkRecords(data, 0, data.length, chunks, 0);

  const text = chunks
    .map((chunk) => chunk.replace(/[\r\v\x0b]+/g, "\n").trim())
    .filter(Boolean)
    .join("\n");

  if (!text.trim()) {
    throw new Error("No text found in .ppt file");
  }
  return text;
}

function walkRecords(
  data: Buffer,
  start: number,
  end: number,
  out: string[],
  depth: number
): void {
  // Malformed lengths can point back into the stream; cap recursion.
  if (depth > 24) return;

  let offset = start;
  while (offset + RECORD_HEADER_BYTES <= end) {
    const versionAndInstance = data.readUInt16LE(offset);
    const recordType = data.readUInt16LE(offset + 2);
    const recordLength = data.readUInt32LE(offset + 4);
    const bodyStart = offset + RECORD_HEADER_BYTES;
    const bodyEnd = bodyStart + recordLength;

    if (recordLength < 0 || bodyEnd > end) return;

    if ((versionAndInstance & 0x000f) === CONTAINER_VERSION) {
      walkRecords(data, bodyStart, bodyEnd, out, depth + 1);
    } else if (recordType === TEXT_CHARS_ATOM) {
      out.push(data.toString("utf16le", bodyStart, bodyEnd));
    } else if (recordType === TEXT_BYTES_ATOM) {
      out.push(data.toString("latin1", bodyStart, bodyEnd));
    }

    offset = bodyEnd;
  }
}
