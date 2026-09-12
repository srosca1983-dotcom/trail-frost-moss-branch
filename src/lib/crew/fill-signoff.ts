import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { formatMdY, formatShort, todayUtc } from "./dates.ts";
import { positionLabel } from "./ratings.ts";
import { COMPANY, COMPANY_ADDRESS, VESSEL } from "./types.ts";

const INK = rgb(0.05, 0.08, 0.1);
const RULE = rgb(0.15, 0.18, 0.2);
const MUTED = rgb(0.35, 0.38, 0.4);

export type SignOffSheetInput = {
  fullName: string;
  lastName?: string | null;
  position?: string | null;
  billetCode?: string | null;
  watch?: string | null;
  signOn?: string | null;
  dueOff?: string | null;
  port?: string | null;
  thisPort?: string | null;
  assignmentType?: string | null;
  signOff?: string | null;
};

function ascii(text: string) {
  return text.replace(/[^\x20-\x7E]/g, " ").replace(/\s+/g, " ").trim();
}

export function signOffFilename(input: SignOffSheetInput, date = todayUtc().toISOString().slice(0, 10)) {
  const last = (input.lastName || input.fullName || "crew").replace(/[^A-Za-z0-9]+/g, "");
  return `George-II-leaving-${last}-${date}.pdf`;
}

/** One-page leaving sheet for the person getting off. Not the join packet. */
export async function buildSignOffPdf(input: SignOffSheetInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([612, 792]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const off = input.signOff || todayUtc().toISOString().slice(0, 10);
  const port = input.thisPort || input.port || "";

  let y = 740;
  page.drawText(VESSEL, { x: 54, y, size: 11, font: bold, color: INK });
  y -= 16;
  page.drawText(COMPANY, { x: 54, y, size: 9, font, color: MUTED });
  y -= 28;
  page.drawText("Leaving articles", { x: 54, y, size: 22, font: bold, color: INK });
  y -= 18;
  page.drawText("For the person getting off this port. Billet goes vacant after they sign off.", {
    x: 54,
    y,
    size: 10,
    font,
    color: MUTED,
  });
  y -= 16;
  page.drawLine({ start: { x: 54, y }, end: { x: 558, y }, thickness: 0.8, color: RULE });
  y -= 28;

  const rows: Array<[string, string]> = [
    ["Name", ascii(input.fullName)],
    ["Billet", ascii([input.billetCode, positionLabel(input.position)].filter(Boolean).join(" · "))],
    ["Watch", ascii(input.watch ?? "")],
    ["Assignment", ascii((input.assignmentType ?? "").toLowerCase())],
    ["Signed on", formatShort(input.signOn)],
    ["Due off", formatShort(input.dueOff)],
    ["Discharge", formatShort(off)],
    ["This port", ascii(port)],
  ];
  for (const [k, v] of rows) {
    page.drawText(k, { x: 54, y, size: 9, font, color: MUTED });
    page.drawText(v || "—", { x: 180, y, size: 11, font: bold, color: INK });
    y -= 22;
  }

  y -= 12;
  page.drawLine({ start: { x: 54, y }, end: { x: 558, y }, thickness: 0.6, color: RULE });
  y -= 28;
  page.drawText("Mariner", { x: 54, y, size: 9, font, color: MUTED });
  page.drawText("Chief Mate", { x: 320, y, size: 9, font, color: MUTED });
  y -= 36;
  page.drawLine({ start: { x: 54, y }, end: { x: 250, y }, thickness: 0.7, color: RULE });
  page.drawLine({ start: { x: 320, y }, end: { x: 516, y }, thickness: 0.7, color: RULE });
  y -= 14;
  page.drawText("Signature / date", { x: 54, y, size: 8, font, color: MUTED });
  page.drawText("Signature / date", { x: 320, y, size: 8, font, color: MUTED });

  page.drawText(`${COMPANY_ADDRESS}  ·  ${formatMdY(off)}`, { x: 54, y: 48, size: 8, font, color: MUTED });
  return pdf.save();
}
