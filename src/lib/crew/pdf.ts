import { MAX_PACKET_BYTES, MAX_PACKET_PAGES } from "./types";
import {
  looksLikeSash,
  pickPacketImagePages,
  pickPacketTextPages,
  shouldSplitPacket,
  textHasReadableName,
  textLooksTyped,
} from "./parse-fields";

export type PacketPagePayload = { text?: string; image?: string };
export type PacketPayload = { filename: string; pageCount: number; pages: PacketPagePayload[] };

export const TICKET_ACCEPT =
  "application/pdf,image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,image/tiff,.pdf,.jpg,.jpeg,.png,.webp,.gif,.heic,.heif,.tif,.tiff,.bmp";

export function ticketFileProblem(file: File): string | null {
  const n = file.name.toLowerCase();
  if (/\.(docx?|xlsx?|pptx?)$/.test(n)) {
    return `${file.name} is Word/Excel. Save it as a PDF or photograph the page.`;
  }
  if (/\.(zip|rar|7z)$/.test(n)) {
    return `${file.name} is a zip. Open it and drop the PDFs themselves.`;
  }
  const isPdf = n.endsWith(".pdf") || file.type === "application/pdf";
  const isImage =
    file.type.startsWith("image/") || /\.(png|jpe?g|webp|gif|bmp|heic|heif|tiff?)$/.test(n);
  if (!isPdf && !isImage) return `${file.name} is not a PDF or a photo of the ticket`;
  if (file.size > MAX_PACKET_BYTES) return `${file.name} is over 32 MB`;
  return null;
}

let pdfjsCached: typeof import("pdfjs-dist") | null = null;

async function loadPdfjs() {
  if (pdfjsCached) return pdfjsCached;
  const pdfjs = await import("pdfjs-dist");
  const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  pdfjsCached = pdfjs;
  return pdfjs;
}

async function jpegFromBlob(file: Blob, maxEdge = 1280, quality = 0.75): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  const url = canvas.toDataURL("image/jpeg", quality);
  canvas.width = 0;
  canvas.height = 0;
  return url;
}

async function packetFromImage(file: File): Promise<PacketPayload> {
  try {
    const image = await jpegFromBlob(file);
    return { filename: file.name, pageCount: 1, pages: [{ text: "", image }] };
  } catch {
    throw new Error("Could not read that photo. Try a JPEG/PNG, or save the cert as a PDF.");
  }
}

async function pageText(pdf: { getPage: (n: number) => Promise<{ getTextContent: () => Promise<{ items: unknown[] }> }> }, i: number): Promise<string> {
  const page = await pdf.getPage(i);
  const textContent = await page.getTextContent();
  return textContent.items
    .map((it) => ("str" in (it as { str?: string }) ? String((it as { str: string }).str) : ""))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 2200);
}

async function renderPageJpeg(pdf: { getPage: (n: number) => Promise<unknown> }, i: number): Promise<string | undefined> {
  const page = (await pdf.getPage(i)) as {
    getViewport: (o: { scale: number }) => { width: number; height: number };
    render: (o: Record<string, unknown>) => { promise: Promise<void> };
  };
  const base = page.getViewport({ scale: 1 });
  const scale = Math.min(1.55, 1280 / base.width);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) return undefined;
  await page.render({ canvasContext: ctx, viewport, canvas }).promise;
  const image = canvas.toDataURL("image/jpeg", 0.75);
  canvas.width = 0;
  canvas.height = 0;
  return image;
}

async function packetFromPdf(file: File, maxPages = MAX_PACKET_PAGES): Promise<PacketPayload> {
  const pdfjs = await loadPdfjs();
  const data = await file.arrayBuffer();
  let pdf: Awaited<ReturnType<typeof pdfjs.getDocument>["promise"]>;
  try {
    pdf = await pdfjs.getDocument({ data: new Uint8Array(data) }).promise;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (/password/i.test(msg)) throw new Error(`${file.name} is password locked. Print it to a new PDF and drop that.`);
    throw new Error(`${file.name} is not a readable PDF.`);
  }
  const pageCount = pdf.numPages;
  const toRead = Math.min(pageCount, maxPages);
  const texts: string[] = new Array(toRead);

  try {
    const BATCH = 4;
    for (let start = 1; start <= toRead; start += BATCH) {
      const jobs: Promise<void>[] = [];
      for (let i = start; i <= Math.min(start + BATCH - 1, toRead); i += 1) {
        const idx = i;
        jobs.push(
          pageText(pdf, idx).then((t) => {
            texts[idx - 1] = t;
          }),
        );
      }
      await Promise.all(jobs);
    }

    const sketched = texts.map((text) => ({ text }));
    const photoOnly = sketched.every((p) => !textLooksTyped(p.text));
    const imageCap = photoOnly && toRead <= 6 ? Math.min(6, toRead) : 4;
    const imageAt = new Set(pickPacketImagePages(sketched, file.name, imageCap));
    const keepText = new Set(pickPacketTextPages(sketched, file.name, Math.min(toRead, 24)));
    if (!keepText.size) keepText.add(0);

    const pages: PacketPagePayload[] = texts.map((text, i) => ({
      text: keepText.has(i) || imageAt.has(i) ? text : text.slice(0, 180),
      image: undefined,
    }));

    for (const i of [...imageAt].sort((a, b) => a - b)) {
      try {
        pages[i].image = await renderPageJpeg(pdf, i + 1);
      } catch {
        pages[i].image = undefined;
      }
    }

    return { filename: file.name, pageCount, pages };
  } finally {
    try {
      pdf.cleanup();
    } catch {
      /* worker already gone */
    }
    try {
      await (pdf as { destroy?: () => Promise<void> }).destroy?.();
    } catch {
      /* ignore */
    }
  }
}

export async function packetFromFile(file: File): Promise<PacketPayload> {
  const packets = await packetsFromFile(file);
  if (!packets.length) throw new Error("Could not read that file");
  if (packets.length === 1) return packets[0];
  return {
    filename: file.name,
    pageCount: packets.length,
    pages: packets.flatMap((p) => p.pages),
  };
}

export async function packetsFromFile(file: File): Promise<PacketPayload[]> {
  const problem = ticketFileProblem(file);
  if (problem) throw new Error(problem);
  const n = file.name.toLowerCase();
  const isPdf = n.endsWith(".pdf") || file.type === "application/pdf";
  if (!isPdf) return [await packetFromImage(file)];

  const pdf = await packetFromPdf(file, MAX_PACKET_PAGES);
  const sashPages = pdf.pages.filter((p) => looksLikeSash(p.text ?? "", file.name)).length;
  if (!shouldSplitPacket(file.name, pdf.pages.length, sashPages)) return [pdf];
  return pdf.pages.map((page, i) => ({
    filename: `${file.name} · p${i + 1}`,
    pageCount: 1,
    pages: [page],
  }));
}

/** Keep at most six page images so a batch cannot hang the reader. */
export function slimPacket(pkt: PacketPayload): PacketPayload {
  let images = 0;
  const pages = pkt.pages.slice(0, MAX_PACKET_PAGES).map((p) => {
    const text = (p.text ?? "").slice(0, 2200);
    if (!p.image) return { text, image: undefined };
    images += 1;
    if (images > 6) return { text, image: undefined };
    const typedName = textLooksTyped(text) && textHasReadableName(text, pkt.filename);
    if (typedName && images > 1) return { text, image: undefined };
    return { text, image: p.image };
  });
  return { filename: pkt.filename, pageCount: pkt.pageCount, pages };
}
