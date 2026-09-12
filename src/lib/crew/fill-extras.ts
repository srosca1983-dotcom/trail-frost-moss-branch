import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { addYears, formatMdY } from "./dates.ts";
import { positionLabel } from "./ratings.ts";
import { doorRank, type ExtraFormKey } from "./sign-on-set.ts";
import { COMPANY, COMPANY_ADDRESS, VESSEL } from "./types.ts";
import type { ParsedPerson } from "./types.ts";

const INK = rgb(0.07, 0.09, 0.16);
const RULE = rgb(0.15, 0.18, 0.22);
const PAPER = rgb(0.96, 0.94, 0.88);
const FAINT = rgb(0.35, 0.38, 0.4);

export type FillExtrasInput = {
  person: ParsedPerson;
  startDate: string;
  port?: string | null;
  unionHall?: string | null;
  enroll401k?: boolean;
  instructorName?: string | null;
  returning?: boolean;
};

function ascii(text: string) {
  return text.replace(/[^\x20-\x7E]/g, " ").replace(/\s+/g, " ").trim();
}

function fit(font: PDFFont, text: string, size: number, maxWidth: number) {
  let t = ascii(text);
  if (!t) return "";
  if (font.widthOfTextAtSize(t, size) <= maxWidth) return t;
  while (t.length > 2 && font.widthOfTextAtSize(`${t}...`, size) > maxWidth) t = t.slice(0, -1);
  return `${t}...`;
}

function cropOrigin(page: PDFPage): { x: number; y: number } {
  try {
    const c = page.getCropBox();
    return { x: c.x, y: c.y };
  } catch {
    return { x: 0, y: 0 };
  }
}

function writeAt(page: PDFPage, font: PDFFont, x: number, y: number, value: string | null | undefined, size = 9, maxWidth = 220) {
  if (!value) return;
  const origin = cropOrigin(page);
  const text = fit(font, value, size, maxWidth);
  if (!text) return;
  page.drawText(text, { x: origin.x + x, y: origin.y + y, size, font, color: INK });
}

function markAt(page: PDFPage, font: PDFFont, x: number, y: number, size = 10) {
  writeAt(page, font, x, y, "X", size, 14);
}

function us4(d: string | null | undefined) {
  return formatMdY(d, false);
}

function last4(p: ParsedPerson) {
  return p.ssLast4 ? `xxx-xx-${p.ssLast4}` : "";
}

function cityLine(p: ParsedPerson) {
  return [p.city, p.state, p.zip].filter(Boolean).join(", ");
}

function ratingOf(p: ParsedPerson) {
  return positionLabel(p.lastPosition || p.tour?.position);
}

async function loadTemplate(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not load ${url}`);
  return res.arrayBuffer();
}

function phoneParts(raw: string | null | undefined): [string, string, string] | null {
  const digits = (raw ?? "").replace(/\D/g, "");
  const n = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  if (n.length !== 10) return null;
  return [n.slice(0, 3), n.slice(3, 6), n.slice(6)];
}

function setText(form: ReturnType<PDFDocument["getForm"]>, name: string, value: string | null | undefined) {
  if (!value) return;
  try {
    const field = form.getTextField(name);
    field.setFontSize(9);
    field.setText(ascii(value).slice(0, 140));
  } catch {
    /* missing */
  }
}

function setCheck(form: ReturnType<PDFDocument["getForm"]>, name: string, on: boolean) {
  try {
    const box = form.getCheckBox(name);
    if (on) box.check();
    else box.uncheck();
  } catch {
    /* missing */
  }
}

async function fillMmpEnroll(input: FillExtrasInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(await loadTemplate("/templates/mmp-401k-enroll.pdf"));
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const page = pdf.getPage(0);
  const p = input.person;
  const start = input.startDate;
  writeAt(page, font, 198, 943, p.ssLast4, 9, 50);
  writeAt(page, font, 310, 943, p.cellPhone || p.homePhone, 9, 70);
  writeAt(page, font, 470, 943, p.homePhone, 9, 90);
  if (input.returning) markAt(page, font, 219, 923, 10);
  else markAt(page, font, 76, 924, 10);
  writeAt(page, font, 90, 893, COMPANY, 9, 240);
  writeAt(page, font, 400, 887, VESSEL, 9, 170);
  writeAt(page, font, 70, 873, input.port || p.tour?.port, 9, 130);
  writeAt(page, font, 455, 868, us4(start), 9, 90);
  writeAt(page, font, 116, 842, p.lastName, 10, 180);
  writeAt(page, font, 324, 842, p.firstName, 10, 150);
  writeAt(page, font, 510, 842, p.middleName ? p.middleName[0] : "", 10, 30);
  writeAt(page, font, 110, 815, us4(p.dob), 9, 110);
  writeAt(page, font, 330, 815, p.email, 9, 200);
  writeAt(page, font, 144, 792, p.addressLine, 9, 360);
  writeAt(page, font, 144, 774, p.city, 9, 150);
  writeAt(page, font, 330, 774, p.state, 9, 80);
  writeAt(page, font, 510, 774, p.zip, 9, 70);
  return pdf.save({ updateFieldAppearances: false });
}

async function fillMmpOptOut(input: FillExtrasInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(await loadTemplate("/templates/mmp-401k-optout.pdf"));
  const font = await pdf.embedFont(StandardFonts.HelveticaBold);
  const page = pdf.getPage(0);
  const p = input.person;
  markAt(page, font, 73, 448, 12);
  writeAt(page, font, 72, 248, p.fullName, 11, 260);
  writeAt(page, font, 400, 288, us4(input.startDate), 11, 90);
  return pdf.save({ updateFieldAppearances: false });
}

async function fillMeba401k(input: FillExtrasInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(await loadTemplate("/templates/meba-401k-enroll.pdf"));
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const form = pdf.getForm();
  const p = input.person;
  setText(form, "Last Name", p.lastName);
  setText(form, "First Name  MI", [p.firstName, p.middleName ? `${p.middleName[0]}.` : ""].filter(Boolean).join(" "));
  setText(form, "undefined_2", p.ssLast4);
  setText(form, "Month Day  Year", us4(p.dob));
  setText(form, "Street Address", p.addressLine);
  setText(form, "undefined_4", p.city);
  setText(form, "State", p.state);
  setText(form, "p", p.zip);
  const day = phoneParts(p.cellPhone || p.homePhone);
  if (day) {
    setText(form, "Daytime Phone", day[0]);
    setText(form, "undefined_5", day[1]);
    setText(form, "undefined_6", day[2]);
  } else {
    setText(form, "Daytime Phone", p.cellPhone || p.homePhone);
  }
  const eve = phoneParts(p.homePhone);
  if (eve) {
    setText(form, "Evening Phone", eve[0]);
    setText(form, "undefined_7", eve[1]);
    setText(form, "undefined_8", eve[2]);
  } else {
    setText(form, "Evening Phone", p.homePhone);
  }
  setText(form, "oyer Name", COMPANY);
  setText(form, "Month Day  Year_2", us4(input.startDate));
  setText(form, "if applicable", VESSEL);
  setText(form, "Date", us4(input.startDate));
  if ((p.maritalStatus ?? "").toLowerCase().includes("married")) setCheck(form, "Married", true);
  else setCheck(form, "Sing", true);
  try {
    form.updateFieldAppearances(font);
  } catch {
    /* ok */
  }
  return pdf.save({ updateFieldAppearances: false });
}

async function fillSiu401k(input: FillExtrasInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(await loadTemplate("/templates/siu-401k-enroll.pdf"));
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const page = pdf.getPage(0);
  const p = input.person;
  writeAt(page, font, 74, 638, p.lastName, 10, 100);
  writeAt(page, font, 185, 638, p.firstName, 10, 90);
  writeAt(page, font, 300, 638, p.middleName ? p.middleName[0] : "", 10, 20);
  writeAt(page, font, 410, 638, last4(p), 10, 140);
  writeAt(page, font, 74, 596, p.addressLine, 9, 240);
  writeAt(page, font, 410, 596, p.email, 9, 160);
  writeAt(page, font, 74, 566, p.city, 9, 130);
  writeAt(page, font, 230, 566, p.state, 9, 28);
  writeAt(page, font, 262, 566, p.zip, 9, 50);
  if ((p.maritalStatus ?? "").toLowerCase().includes("married")) markAt(page, font, 316, 563, 9);
  else markAt(page, font, 366, 563, 9);
  const sex = (p.sex ?? "").toUpperCase();
  if (sex === "F") markAt(page, font, 316, 543, 9);
  else if (sex === "M") markAt(page, font, 366, 543, 9);
  writeAt(page, font, 76, 536, p.homePhone, 9, 110);
  writeAt(page, font, 215, 536, p.cellPhone, 9, 110);
  writeAt(page, font, 424, 508, p.cellPhone, 9, 120);
  writeAt(page, font, 76, 492, us4(p.dob), 9, 90);
  if (!input.enroll401k) markAt(page, font, 38, 294, 10);
  writeAt(page, font, 110, 262, us4(input.startDate), 9, 80);
  writeAt(page, font, 327, 262, us4(input.startDate), 9, 80);
  return pdf.save({ updateFieldAppearances: false });
}

async function fillMebaOt(input: FillExtrasInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(await loadTemplate("/templates/meba-ot-worksheet.pdf"));
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const form = pdf.getForm();
  const p = input.person;
  setText(form, "NAME Please Print", p.fullName);
  setText(form, "Social Security Number", last4(p));
  setText(form, "XXXXX", p.ssLast4);
  setText(form, "Birth Date", us4(p.dob));
  setText(form, "PERMANENT ADDRESS StreetPO Box", p.addressLine);
  setText(form, "City State  Zip", cityLine(p));
  setText(form, "Telephone Number", p.homePhone);
  setText(form, "Cell Phone Number", p.cellPhone);
  setText(form, "Filing Date", us4(input.startDate));
  setText(form, "VESSEL NAME", VESSEL);
  setText(form, "NAME", p.fullName);
  setText(form, "VESSELRow1", VESSEL);
  setText(form, "RATINGRow1", ratingOf(p));
  try {
    form.updateFieldAppearances(font);
  } catch {
    /* ok */
  }
  return pdf.save({ updateFieldAppearances: false });
}

async function fillDoorTag(input: FillExtrasInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([612, 792]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const p = input.person;
  const rank = doorRank(p.tour?.billetCode, p.lastPosition || p.tour?.position, p.tour?.watch);
  const name = p.fullName;
  const phone = p.cellPhone || p.homePhone || "";

  page.drawRectangle({ x: 0, y: 0, width: 612, height: 792, color: rgb(0.93, 0.91, 0.86) });
  page.drawText("M/V GEORGE II  ·  cabin door", {
    x: 56,
    y: 748,
    size: 10,
    font,
    color: FAINT,
  });

  let doorImg = null;
  try {
    const bytes = new Uint8Array(await loadTemplate("/templates/door-tag.jpg"));
    doorImg = await pdf.embedJpg(bytes);
  } catch {
    doorImg = null;
  }
  const tagW = 360;
  const tagH = 480;
  const tagX = (612 - tagW) / 2;
  const tagY = 200;
  page.drawRectangle({ x: tagX - 6, y: tagY - 6, width: tagW + 12, height: tagH + 12, color: rgb(0.2, 0.22, 0.24) });
  if (doorImg) {
    page.drawImage(doorImg, { x: tagX, y: tagY, width: tagW, height: tagH });
  } else {
    page.drawRectangle({ x: tagX, y: tagY, width: tagW, height: tagH, color: rgb(0.55, 0.38, 0.22) });
  }
  const labelW = 300;
  const labelH = 118;
  const labelX = tagX + (tagW - labelW) / 2;
  const labelY = tagY + 48;
  page.drawRectangle({ x: labelX, y: labelY, width: labelW, height: labelH, color: PAPER });
  page.drawRectangle({
    x: labelX + 6,
    y: labelY + 6,
    width: labelW - 12,
    height: labelH - 12,
    borderColor: RULE,
    borderWidth: 1.2,
    color: PAPER,
  });
  const rankSize = 11;
  const nameSize = 18;
  const rankW = bold.widthOfTextAtSize(ascii(rank).slice(0, 40), rankSize);
  page.drawText(ascii(rank).slice(0, 40), {
    x: labelX + (labelW - rankW) / 2,
    y: labelY + 78,
    size: rankSize,
    font: bold,
    color: FAINT,
  });
  const nm = fit(bold, name, nameSize, labelW - 24);
  const nmW = bold.widthOfTextAtSize(nm, nameSize);
  page.drawText(nm, {
    x: labelX + (labelW - nmW) / 2,
    y: labelY + 48,
    size: nameSize,
    font: bold,
    color: INK,
  });
  if (phone) {
    const phW = font.widthOfTextAtSize(ascii(phone), 11);
    page.drawText(ascii(phone), {
      x: labelX + (labelW - phW) / 2,
      y: labelY + 24,
      size: 11,
      font,
      color: INK,
    });
  }

  page.drawText("Print, cut on the black frame, tape on the cabin door.", {
    x: 56,
    y: 160,
    size: 9,
    font,
    color: FAINT,
  });
  return pdf.save();
}

function longDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return us4(iso);
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return `${String(d.getUTCDate()).padStart(2, "0")} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

async function fillHazmatCert(input: FillExtrasInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([612, 792]);
  const font = await pdf.embedFont(StandardFonts.TimesRoman);
  const bold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const p = input.person;
  const start = input.startDate;
  const until = addYears(start, 3) ?? start;
  const instructor = input.instructorName?.trim() || "Sorin Rosca, Chief Mate";

  page.drawRectangle({ x: 36, y: 36, width: 540, height: 720, borderColor: RULE, borderWidth: 1.5 });
  page.drawRectangle({ x: 42, y: 42, width: 528, height: 708, borderColor: RULE, borderWidth: 0.6 });

  page.drawText("PASHA HAWAII", { x: 220, y: 710, size: 11, font: bold, color: INK });
  const v = "M.V. GEORGE II";
  const vw = bold.widthOfTextAtSize(v, 16);
  page.drawText(v, { x: (612 - vw) / 2, y: 684, size: 16, font: bold, color: INK });
  const off = "OFFICIAL NUMBER 625873";
  const ow = font.widthOfTextAtSize(off, 10);
  page.drawText(off, { x: (612 - ow) / 2, y: 666, size: 10, font, color: INK });

  page.drawLine({ start: { x: 90, y: 650 }, end: { x: 522, y: 650 }, thickness: 0.8, color: RULE });

  const title = "HAZARDOUS MATERIALS TRAINING CERTIFICATE";
  const tw = bold.widthOfTextAtSize(title, 13);
  page.drawText(title, { x: (612 - tw) / 2, y: 618, size: 13, font: bold, color: INK });

  page.drawText("This is to certify that", { x: 72, y: 575, size: 11, font, color: INK });

  page.drawLine({ start: { x: 72, y: 530 }, end: { x: 540, y: 530 }, thickness: 0.7, color: RULE });
  page.drawText(ascii(p.fullName), { x: 72, y: 536, size: 13, font: bold, color: INK });
  page.drawText(ascii(ratingOf(p)), { x: 280, y: 536, size: 12, font, color: INK });
  page.drawText(ascii(p.mmcNumber ?? ""), { x: 430, y: 536, size: 12, font, color: INK });
  page.drawText("NAME", { x: 72, y: 516, size: 8, font, color: FAINT });
  page.drawText("RATING", { x: 280, y: 516, size: 8, font, color: FAINT });
  page.drawText("Mariner#", { x: 430, y: 516, size: 8, font, color: FAINT });

  const when = longDate(start);
  const ww = bold.widthOfTextAtSize(when, 12);
  page.drawText(when, { x: (612 - ww) / 2, y: 470, size: 12, font: bold, color: INK });

  const body =
    "Has successfully completed the shipboard Hazardous Materials Training course in conformance with the requirements of 49 CFR Part 172.700–704. Test materials and instruction retained aboard George II.";
  const words = body.split(" ");
  let line = "";
  let y = 430;
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(next, 11) > 460) {
      page.drawText(line, { x: 76, y, size: 11, font, color: INK });
      y -= 16;
      line = w;
    } else line = next;
  }
  if (line) page.drawText(line, { x: 76, y, size: 11, font, color: INK });

  page.drawLine({ start: { x: 72, y: 280 }, end: { x: 340, y: 280 }, thickness: 0.7, color: RULE });
  page.drawText(ascii(instructor), { x: 72, y: 286, size: 11, font, color: INK });
  page.drawText("INSTRUCTOR", { x: 72, y: 264, size: 8, font, color: FAINT });

  const valid = `This certificate is valid until ${longDate(until)}`;
  page.drawText(valid, { x: 72, y: 210, size: 12, font: bold, color: INK });

  page.drawText(COMPANY, { x: 72, y: 70, size: 8, font, color: FAINT });
  page.drawText(COMPANY_ADDRESS, { x: 72, y: 58, size: 8, font, color: FAINT });
  return pdf.save();
}

export async function fillExtraForm(key: ExtraFormKey, input: FillExtrasInput): Promise<Uint8Array> {
  switch (key) {
    case "mmp-401k-enroll":
      return fillMmpEnroll(input);
    case "mmp-401k-optout":
      return fillMmpOptOut(input);
    case "meba-401k":
      return fillMeba401k(input);
    case "siu-401k":
      return fillSiu401k(input);
    case "meba-ot":
      return fillMebaOt(input);
    case "door-tag":
      return fillDoorTag(input);
    case "hazmat-cert":
      return fillHazmatCert(input);
    default:
      throw new Error(`Unknown extra form ${key}`);
  }
}

export function extraFilename(key: ExtraFormKey, p: ParsedPerson, startDate: string): string {
  const last = (p.lastName || p.fullName || "crew").replace(/[^A-Za-z0-9]+/g, "");
  const names: Record<ExtraFormKey, string> = {
    "mmp-401k-enroll": "MMP-401k-enroll",
    "mmp-401k-optout": "MMP-401k-opt-out",
    "meba-401k": "MEBA-401k",
    "siu-401k": "SIU-Empower-401k",
    "meba-ot": "MEBA-converted-OT",
    "door-tag": "door-tag",
    "hazmat-cert": "HAZMAT-certificate",
  };
  return `George-II-${names[key]}-${last}-${startDate}.pdf`;
}
