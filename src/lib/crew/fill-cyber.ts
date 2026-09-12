import { PDFDocument, StandardFonts, degrees, rgb, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";
import { CYBER_MODULES, type CyberModuleId, type CyberSeat } from "./cyber.ts";
import { formatMdY } from "./dates.ts";
import { VESSEL } from "./types.ts";

const INK = rgb(0.07, 0.08, 0.1);
const FAINT = rgb(0.38, 0.4, 0.42);
const GOLD = rgb(0.76, 0.58, 0.22);
const RED = rgb(0.55, 0.14, 0.14);
const BLACK = rgb(0.08, 0.07, 0.06);
const PAPER = rgb(0.99, 0.98, 0.96);
const RULE = rgb(0.18, 0.18, 0.2);

const COMPASS_URL = "/templates/cyber/pasha-compass.png";

export type CyberSession = {
  date: string;
  durationMin: number;
  facilitatorName: string;
  facilitatorOrg: string;
};

export const DEFAULT_CYBER_SESSION: CyberSession = {
  date: "",
  durationMin: 15,
  facilitatorName: "Sorin Rosca, Chief Mate",
  facilitatorOrg: VESSEL,
};

function ascii(text: string) {
  return text.replace(/[^\x20-\x7E]/g, " ").replace(/\s+/g, " ").trim();
}

function us4(d: string | null | undefined) {
  return formatMdY(d, false);
}

function wrap(font: PDFFont, text: string, size: number, maxWidth: number): string[] {
  const words = ascii(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(next, size) > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

function center(page: PDFPage, font: PDFFont, text: string, y: number, size: number, color: ReturnType<typeof rgb>, minX: number, maxX: number) {
  const t = ascii(text);
  if (!t) return;
  const w = font.widthOfTextAtSize(t, size);
  const x = Math.max(minX, minX + (maxX - minX - w) / 2);
  page.drawText(t, { x, y, size, font, color });
}

async function loadBytes(url: string): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return res.arrayBuffer();
  } catch {
    return null;
  }
}



async function compass(pdf: PDFDocument): Promise<PDFImage | null> {
  const buf = await loadBytes(COMPASS_URL);
  if (!buf) return null;
  return pdf.embedPng(buf);
}

function paintBrand(page: PDFPage, logo: PDFImage | null) {
  const { width: w, height: h } = page.getSize();

  page.drawRectangle({ x: 0, y: 0, width: w, height: h, color: PAPER });

  // Right Pasha bar
  page.drawRectangle({ x: w - 42, y: 0, width: 42, height: h, color: RED });
  page.drawRectangle({ x: w - 46, y: 0, width: 4, height: h, color: GOLD });

  // Top-left gold / black chevron
  page.drawSvgPath("M 0 612 L 210 612 L 0 430 Z", { color: GOLD });
  page.drawSvgPath("M 0 612 L 118 612 L 0 512 Z", { color: BLACK });
  page.drawSvgPath("M 0 0 L 168 0 L 0 118 Z", { color: RED });
  page.drawSvgPath("M 0 0 L 86 0 L 0 62 Z", { color: GOLD });

  if (logo) {
    const lw = 56;
    const lh = lw * (logo.height / logo.width);
    page.drawImage(logo, { x: w - 54, y: h - lh - 14, width: lw, height: lh });
  }
}

function drawCert(
  page: PDFPage,
  fonts: { roman: PDFFont; bold: PDFFont; italic: PDFFont },
  logo: PDFImage | null,
  moduleId: CyberModuleId,
  name: string,
  session: CyberSession,
) {
  const mod = CYBER_MODULES[moduleId];
  paintBrand(page, logo);

  const left = 52;
  const right = 732;
  const mid = (left + right) / 2;

  center(page, fonts.italic, "Certificate of Completion", 548, 28, INK, left, right);

  const displayName = ascii(name) || " ";
  const nameSize = displayName.length > 28 ? 16 : 20;
  center(page, fonts.italic, displayName, 500, nameSize, INK, left, right);
  page.drawLine({ start: { x: left + 40, y: 492 }, end: { x: right - 40, y: 492 }, thickness: 0.8, color: RULE });

  center(page, fonts.roman, "has successfully completed", 470, 11, INK, left, right);

  const titleLines = wrap(fonts.bold, mod.courseTitle, 13, right - left - 24);
  let y = 444;
  for (const line of titleLines) {
    center(page, fonts.bold, line, y, 13, INK, left, right);
    y -= 16;
  }
  const titleWidth = Math.min(
    right - left - 80,
    fonts.bold.widthOfTextAtSize(titleLines[titleLines.length - 1] ?? mod.courseTitle, 13) + 24,
  );
  page.drawLine({
    start: { x: mid - titleWidth / 2, y: y + 10 },
    end: { x: mid + titleWidth / 2, y: y + 10 },
    thickness: 1.1,
    color: INK,
  });

  y -= 8;
  const intro = `This certificate verifies that the individual named above has successfully completed ${mod.title}, which addresses the following training topics in accordance with ${mod.cfr}:`;
  for (const line of wrap(fonts.roman, intro, 10, right - left - 20)) {
    page.drawText(line, { x: left + 8, y, size: 10, font: fonts.roman, color: INK });
    y -= 13;
  }
  y -= 4;
  for (const topic of mod.topics) {
    page.drawText("•", { x: left + 16, y, size: 10, font: fonts.roman, color: INK });
    const wrapped = wrap(fonts.roman, topic, 10, right - left - 50);
    for (const line of wrapped) {
      page.drawText(line, { x: left + 30, y, size: 10, font: fonts.roman, color: INK });
      y -= 13;
    }
    y -= 2;
  }

  const fieldX = 430;
  const lineX = 560;
  let fy = 148;
  const rows: Array<[string, string]> = [
    ["Date of Training:", us4(session.date)],
    ["Duration:", session.durationMin ? `${session.durationMin}` : ""],
    [`${mod.signerLabel} Signature:`, ""],
    [`${mod.signerLabel} Name:`, ascii(session.facilitatorName)],
    [`${mod.signerLabel} Organization:`, ascii(session.facilitatorOrg)],
  ];
  for (const [label, value] of rows) {
    page.drawText(label, { x: fieldX, y: fy, size: 9, font: fonts.roman, color: INK });
    page.drawLine({ start: { x: lineX, y: fy - 2 }, end: { x: 724, y: fy - 2 }, thickness: 0.6, color: RULE });
    if (value) {
      page.drawText(value, { x: lineX + 4, y: fy, size: 10, font: fonts.bold, color: INK });
    }
    if (label.startsWith("Duration")) {
      page.drawText("minutes", { x: 680, y: fy, size: 9, font: fonts.roman, color: INK });
    }
    fy -= 22;
  }

  page.drawText("THE PASHA GROUP", {
    x: 778,
    y: 70,
    size: 10,
    font: fonts.bold,
    color: PAPER,
    rotate: degrees(90),
  });

  page.drawText(`${VESSEL}  ·  ${mod.cfr}  ·  signatures left blank`, {
    x: left + 8,
    y: 22,
    size: 7,
    font: fonts.roman,
    color: FAINT,
  });
}

export async function fillCyberCertificate(
  moduleId: CyberModuleId,
  seat: CyberSeat | { fullName: string },
  session: CyberSession,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([792, 612]);
  const roman = await pdf.embedFont(StandardFonts.TimesRoman);
  const bold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const italic = await pdf.embedFont(StandardFonts.TimesRomanBoldItalic);
  const logo = await compass(pdf);
  drawCert(page, { roman, bold, italic }, logo, moduleId, seat.fullName, session);
  return pdf.save();
}

export async function fillCyberCertificates(
  moduleId: CyberModuleId,
  seats: CyberSeat[],
  session: CyberSession,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const roman = await pdf.embedFont(StandardFonts.TimesRoman);
  const bold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const italic = await pdf.embedFont(StandardFonts.TimesRomanBoldItalic);
  const logo = await compass(pdf);
  for (const seat of seats) {
    const page = pdf.addPage([792, 612]);
    drawCert(page, { roman, bold, italic }, logo, moduleId, seat.fullName, session);
  }
  if (seats.length === 0) {
    const page = pdf.addPage([792, 612]);
    drawCert(page, { roman, bold, italic }, logo, moduleId, "", session);
  }
  return pdf.save();
}

export async function fillCyberRoster(
  moduleId: CyberModuleId,
  seats: CyberSeat[],
  session: CyberSession,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([612, 792]);
  const roman = await pdf.embedFont(StandardFonts.TimesRoman);
  const bold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const mod = CYBER_MODULES[moduleId];

  page.drawRectangle({ x: 36, y: 36, width: 540, height: 720, borderColor: RULE, borderWidth: 1.2 });
  page.drawText(VESSEL, { x: 52, y: 730, size: 11, font: bold, color: INK });
  page.drawText("USCG 33 CFR §101.650 training roster", { x: 52, y: 714, size: 9, font: roman, color: FAINT });
  page.drawText(`${mod.short}  ·  ${mod.title}`, { x: 52, y: 688, size: 14, font: bold, color: INK });
  page.drawText(mod.cfr, { x: 52, y: 672, size: 9, font: roman, color: FAINT });

  page.drawText(`Date of training: ${us4(session.date) || "__________"}`, { x: 52, y: 648, size: 10, font: roman, color: INK });
  page.drawText(`Duration: ${session.durationMin || "____"} minutes`, { x: 320, y: 648, size: 10, font: roman, color: INK });
  page.drawText(`${mod.signerLabel}: ${ascii(session.facilitatorName) || "____________________"}`, {
    x: 52,
    y: 632,
    size: 10,
    font: roman,
    color: INK,
  });
  page.drawText(ascii(session.facilitatorOrg), { x: 320, y: 632, size: 10, font: roman, color: INK });

  const headers = ["#", "Name", "Rating", "Attended", "Signature"];
  const xs = [52, 78, 250, 390, 460];
  let y = 600;
  page.drawLine({ start: { x: 48, y: y + 14 }, end: { x: 564, y: y + 14 }, thickness: 0.8, color: RULE });
  headers.forEach((h, i) => page.drawText(h, { x: xs[i], y, size: 8, font: bold, color: FAINT }));
  y -= 8;
  page.drawLine({ start: { x: 48, y }, end: { x: 564, y }, thickness: 0.6, color: RULE });
  y -= 18;

  seats.forEach((s, i) => {
    if (y < 80) return;
    page.drawText(String(i + 1), { x: xs[0], y, size: 9, font: roman, color: INK });
    page.drawText(ascii(s.fullName).slice(0, 28), { x: xs[1], y, size: 9, font: roman, color: INK });
    page.drawText(ascii(s.positionLabel).slice(0, 18), { x: xs[2], y, size: 9, font: roman, color: INK });
    page.drawRectangle({ x: xs[3], y: y - 2, width: 10, height: 10, borderColor: RULE, borderWidth: 0.7 });
    page.drawLine({ start: { x: xs[4], y: y - 2 }, end: { x: 556, y: y - 2 }, thickness: 0.5, color: RULE });
    y -= 22;
  });

  page.drawText("Attendance marks and signatures filled by hand after the session. Do not pre-sign.", {
    x: 52,
    y: 52,
    size: 8,
    font: roman,
    color: FAINT,
  });
  return pdf.save();
}

export async function fillPersonCyberPack(seat: CyberSeat, session: CyberSession): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const roman = await pdf.embedFont(StandardFonts.TimesRoman);
  const bold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const italic = await pdf.embedFont(StandardFonts.TimesRomanBoldItalic);
  const logo = await compass(pdf);
  for (const id of seat.modules) {
    const page = pdf.addPage([792, 612]);
    drawCert(page, { roman, bold, italic }, logo, id, seat.fullName, session);
  }
  return pdf.save();
}

export function cyberCertFilename(moduleId: CyberModuleId, seat: { lastName?: string; fullName: string }, date: string): string {
  const last = (seat.lastName || seat.fullName || "crew").replace(/[^A-Za-z0-9]+/g, "");
  return `George-II-Cyber-${CYBER_MODULES[moduleId].short.replace(/\s+/g, "")}-${last}-${date}.pdf`;
}

export function cyberModuleFilename(moduleId: CyberModuleId, kind: "certs" | "roster", date: string): string {
  return `George-II-Cyber-${CYBER_MODULES[moduleId].short.replace(/\s+/g, "")}-${kind}-${date}.pdf`;
}

export function cyberPersonFilename(seat: CyberSeat, date: string): string {
  const last = (seat.lastName || seat.fullName).replace(/[^A-Za-z0-9]+/g, "");
  return `George-II-Cyber-certs-${last}-${date}.pdf`;
}


