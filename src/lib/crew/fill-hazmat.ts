import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { addYears, formatMdY } from "./dates.ts";
import {
  HAZMAT_CFR,
  HAZMAT_PASS,
  HAZMAT_QUESTIONS,
  HAZMAT_STUDY,
  HAZMAT_VALIDITY_YEARS,
  type HazmatSeat,
} from "./hazmat-quiz.ts";
import { COMPANY, COMPANY_ADDRESS, VESSEL } from "./types.ts";

const INK = rgb(0.07, 0.09, 0.16);
const FAINT = rgb(0.38, 0.4, 0.42);
const RULE = rgb(0.18, 0.2, 0.24);
const PAPER = rgb(0.97, 0.95, 0.9);
const ACCENT = rgb(0.55, 0.18, 0.12);

export type HazmatSession = {
  date: string;
  instructorName: string;
};

export const DEFAULT_HAZMAT_SESSION: HazmatSession = {
  date: "",
  instructorName: "Sorin Rosca, Chief Mate",
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

function lastOf(s: HazmatSeat) {
  return (s.lastName || s.fullName || "crew").replace(/[^A-Za-z0-9]+/g, "");
}

type Cursor = {
  pdf: PDFDocument;
  page: PDFPage;
  font: PDFFont;
  bold: PDFFont;
  y: number;
  top: number;
  bottom: number;
  left: number;
  width: number;
  footer: string;
};

async function start(footer: string): Promise<Cursor> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.TimesRoman);
  const bold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const page = pdf.addPage([612, 792]);
  return { pdf, page, font, bold, y: 748, top: 748, bottom: 56, left: 48, width: 516, footer };
}

function paintFooter(c: Cursor) {
  c.page.drawLine({ start: { x: c.left, y: 42 }, end: { x: c.left + c.width, y: 42 }, thickness: 0.4, color: RULE });
  c.page.drawText(ascii(c.footer).slice(0, 90), { x: c.left, y: 30, size: 8, font: c.font, color: FAINT });
}

function newPage(c: Cursor) {
  paintFooter(c);
  c.page = c.pdf.addPage([612, 792]);
  c.y = c.top;
}

function need(c: Cursor, h: number) {
  if (c.y - h < c.bottom) newPage(c);
}

function line(c: Cursor, text: string, size = 11, bold = false, color = INK) {
  const font = bold ? c.bold : c.font;
  const rows = wrap(font, text, size, c.width);
  for (const row of rows) {
    need(c, size + 4);
    c.page.drawText(row, { x: c.left, y: c.y, size, font, color });
    c.y -= size + 3;
  }
}

function gap(c: Cursor, n = 8) {
  c.y -= n;
}

function headerBlock(c: Cursor, title: string, seat: HazmatSeat | null, session: HazmatSession, sub?: string) {
  c.page.drawRectangle({ x: 36, y: 742, width: 540, height: 28, color: ACCENT });
  c.page.drawText("PASHA HAWAII  ·  M.V. GEORGE II  ·  OFF. NO. 625873", {
    x: 48,
    y: 752,
    size: 9,
    font: c.bold,
    color: rgb(0.98, 0.96, 0.92),
  });
  c.y = 722;
  line(c, title, 16, true);
  if (sub) line(c, sub, 9, false, FAINT);
  gap(c, 6);
  const meta = [
    seat ? `Name: ${seat.fullName}` : "Name: ______________________________",
    seat ? `Rating: ${seat.positionLabel}` : "Rating: ______________",
    `Date: ${us4(session.date) || "____________"}`,
    seat?.mmcNumber ? `MMC: ${seat.mmcNumber}` : "MMC: ______________",
  ];
  line(c, meta.join("    "), 10);
  line(c, `Vessel: ${VESSEL}    Instructor: ${session.instructorName}`, 10);
  c.page.drawLine({ start: { x: c.left, y: c.y }, end: { x: c.left + c.width, y: c.y }, thickness: 0.6, color: RULE });
  c.y -= 12;
}

function paintStudy(c: Cursor, seat: HazmatSeat | null, session: HazmatSession) {
  headerBlock(c, "HAZMAT study sheet — read this first", seat, session, "Put this away before you start the quiz. 49 CFR 172.704 / 176.13 / IMDG 1.3.");
  for (const block of HAZMAT_STUDY) {
    need(c, 40);
    line(c, block.heading, 12, true, ACCENT);
    gap(c, 2);
    for (const ln of block.lines) {
      line(c, ln, 10);
      gap(c, 3);
    }
    gap(c, 6);
  }
  paintFooter(c);
}

function paintQuiz(c: Cursor, seat: HazmatSeat | null, session: HazmatSession) {
  headerBlock(
    c,
    "HAZMAT quiz — 20 questions",
    seat,
    session,
    `Closed book. Circle ONE letter. ${HAZMAT_PASS} of ${HAZMAT_QUESTIONS.length} to pass (80%). Return to the Chief Mate. Do not copy the answer key.`,
  );
  for (const q of HAZMAT_QUESTIONS) {
    const stem = wrap(c.bold, `${q.n}.  ${q.prompt}`, 10, c.width);
    const choiceLines = q.choices.flatMap((ch) => wrap(c.font, `${ch.key})  ${ch.text}`, 10, c.width - 18));
    need(c, stem.length * 13 + choiceLines.length * 12 + 16);
    for (const row of stem) {
      c.page.drawText(row, { x: c.left, y: c.y, size: 10, font: c.bold, color: INK });
      c.y -= 13;
    }
    for (const ch of q.choices) {
      const rows = wrap(c.font, `${ch.key})  ${ch.text}`, 10, c.width - 18);
      for (const row of rows) {
        c.page.drawText(row, { x: c.left + 14, y: c.y, size: 10, font: c.font, color: INK });
        c.y -= 12;
      }
    }
    c.y -= 8;
  }
  gap(c, 8);
  line(c, "I completed this quiz without the answer key.", 10);
  gap(c, 16);
  line(c, "Signature of mariner: ________________________________    Date: ______________", 10);
  paintFooter(c);
}

export async function fillHazmatStudy(seat: HazmatSeat | null, session: HazmatSession): Promise<Uint8Array> {
  const c = await start(`${VESSEL}  ·  HAZMAT study  ·  ${HAZMAT_CFR}`);
  paintStudy(c, seat, session);
  return c.pdf.save();
}

export async function fillHazmatQuiz(seat: HazmatSeat | null, session: HazmatSession): Promise<Uint8Array> {
  const c = await start(`${VESSEL}  ·  HAZMAT quiz  ·  keep the answer key off this copy`);
  paintQuiz(c, seat, session);
  return c.pdf.save();
}

export async function fillHazmatPersonPack(seat: HazmatSeat, session: HazmatSession): Promise<Uint8Array> {
  const c = await start(`${VESSEL}  ·  HAZMAT pack  ·  ${seat.fullName}`);
  paintStudy(c, seat, session);
  newPage(c);
  paintQuiz(c, seat, session);
  return c.pdf.save();
}

export async function fillHazmatPacks(seats: HazmatSeat[], session: HazmatSession): Promise<Uint8Array> {
  const list = seats.length ? seats : [null];
  const c = await start(`${VESSEL}  ·  HAZMAT packs`);
  list.forEach((seat, i) => {
    if (i > 0) newPage(c);
    paintStudy(c, seat, session);
    newPage(c);
    paintQuiz(c, seat, session);
  });
  return c.pdf.save();
}

export async function fillHazmatAnswerKey(session: HazmatSession): Promise<Uint8Array> {
  const c = await start(`${VESSEL}  ·  HAZMAT ANSWER KEY  ·  Chief Mate only`);
  headerBlock(
    c,
    "HAZMAT answer key — Chief Mate only",
    null,
    session,
    `Do not hand this out. ${HAZMAT_PASS}/${HAZMAT_QUESTIONS.length} to pass. Circle the letter on the quiz, count correct, enter the score on the HAZMAT desk.`,
  );
  line(c, "Keep this copy in the training file. Destroy extras.", 10, false, ACCENT);
  gap(c, 10);
  for (const q of HAZMAT_QUESTIONS) {
    const head = wrap(c.bold, `${q.n}.  ${q.answer}   —  ${q.prompt}`, 10, c.width);
    const why = wrap(c.font, q.why, 9, c.width);
    need(c, head.length * 13 + why.length * 11 + 10);
    for (const row of head) {
      c.page.drawText(row, { x: c.left, y: c.y, size: 10, font: c.bold, color: INK });
      c.y -= 13;
    }
    for (const row of why) {
      c.page.drawText(row, { x: c.left + 18, y: c.y, size: 9, font: c.font, color: FAINT });
      c.y -= 11;
    }
    c.y -= 6;
  }
  paintFooter(c);
  return c.pdf.save();
}

export async function fillHazmatCertificate(
  seat: HazmatSeat,
  session: HazmatSession,
  score: number,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([612, 792]);
  const font = await pdf.embedFont(StandardFonts.TimesRoman);
  const bold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const until = addYears(session.date, HAZMAT_VALIDITY_YEARS) ?? session.date;

  page.drawRectangle({ x: 36, y: 36, width: 540, height: 720, borderColor: RULE, borderWidth: 1.6 });
  page.drawRectangle({ x: 42, y: 42, width: 528, height: 708, borderColor: ACCENT, borderWidth: 0.7 });

  const center = (t: string, y: number, size: number, f: PDFFont, color = INK) => {
    const w = f.widthOfTextAtSize(t, size);
    page.drawText(t, { x: (612 - w) / 2, y, size, font: f, color });
  };

  center("PASHA HAWAII", 710, 11, bold, ACCENT);
  center("M.V. GEORGE II", 688, 16, bold);
  center("OFFICIAL NUMBER 625873", 670, 10, font);
  page.drawLine({ start: { x: 90, y: 656 }, end: { x: 522, y: 656 }, thickness: 0.8, color: RULE });
  center("HAZARDOUS MATERIALS TRAINING CERTIFICATE", 628, 13, bold);
  center("49 CFR 172.700–704  ·  49 CFR 176.13  ·  IMDG Code 1.3", 610, 9, font, FAINT);
  center("Unlimited container vessel", 596, 9, font, FAINT);

  page.drawText("This is to certify that", { x: 72, y: 560, size: 11, font, color: INK });
  page.drawLine({ start: { x: 72, y: 528 }, end: { x: 540, y: 528 }, thickness: 0.7, color: RULE });
  page.drawText(ascii(seat.fullName), { x: 72, y: 534, size: 14, font: bold, color: INK });
  page.drawText(ascii(seat.positionLabel), { x: 280, y: 534, size: 12, font, color: INK });
  page.drawText(ascii(seat.mmcNumber ?? ""), { x: 430, y: 534, size: 11, font, color: INK });
  page.drawText("NAME", { x: 72, y: 514, size: 8, font, color: FAINT });
  page.drawText("RATING", { x: 280, y: 514, size: 8, font, color: FAINT });
  page.drawText("MMC", { x: 430, y: 514, size: 8, font, color: FAINT });

  const body = [
    `has been trained and tested on ${us4(session.date)} in the shipboard hazardous materials functions of M/V GEORGE II, an unlimited container vessel, in conformance with 49 CFR 172.704 and 176.13 and IMDG Code Chapter 1.3.`,
    `Written test score: ${score} of ${HAZMAT_QUESTIONS.length}  (${HAZMAT_PASS} required to pass). Training materials (study sheet and quiz) are retained in the vessel training file.`,
    "Elements completed: (1) general awareness / familiarization  (2) function-specific container / IMDG / 49 CFR 176  (3) safety / emergency response  (4) security awareness. In-depth security training is not required unless the mariner is named in the vessel security plan.",
  ];
  let y = 480;
  for (const para of body) {
    for (const row of wrap(font, para, 11, 468)) {
      page.drawText(row, { x: 72, y, size: 11, font, color: INK });
      y -= 15;
    }
    y -= 8;
  }

  page.drawText(`This certificate is valid until ${us4(until)}  (3 years — 49 CFR 172.704(c)(2)).`, {
    x: 72,
    y: y - 4,
    size: 12,
    font: bold,
    color: INK,
  });

  page.drawLine({ start: { x: 72, y: 168 }, end: { x: 340, y: 168 }, thickness: 0.7, color: RULE });
  page.drawText(ascii(session.instructorName), { x: 72, y: 174, size: 11, font, color: INK });
  page.drawText("INSTRUCTOR — signature left blank", { x: 72, y: 152, size: 8, font, color: FAINT });
  page.drawText(`Trainer address: ${COMPANY}, ${COMPANY_ADDRESS}  (aboard ${VESSEL})`, {
    x: 72,
    y: 132,
    size: 8,
    font,
    color: FAINT,
  });
  page.drawText("I certify that the named mariner has been trained and tested as required by 49 CFR 172.704(d).", {
    x: 72,
    y: 112,
    size: 9,
    font,
    color: INK,
  });
  page.drawText(`${COMPANY}  ·  ${VESSEL}`, { x: 72, y: 64, size: 8, font, color: FAINT });
  return pdf.save();
}

export function hazmatQuizFilename(kind: "study" | "quiz" | "key" | "packs" | "cert", last: string, date: string) {
  return `George-II-HAZMAT-${kind}-${last}-${date}.pdf`;
}

export function hazmatPersonFilename(seat: HazmatSeat, date: string) {
  return hazmatQuizFilename("packs", lastOf(seat), date);
}

export function hazmatCertFilename(seat: HazmatSeat, date: string) {
  return hazmatQuizFilename("cert", lastOf(seat), date);
}
