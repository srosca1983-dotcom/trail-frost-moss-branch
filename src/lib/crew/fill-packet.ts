import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFForm, type PDFPage } from "pdf-lib";
import { formatMdY } from "./dates.ts";
import { positionLabel } from "./ratings.ts";
import { PACKET_PAGE_INDEX, type PacketPageKey } from "./sign-on-set.ts";
import { COMPANY, COMPANY_ADDRESS, PACKET_TEMPLATE_URL } from "./types.ts";
import type { CrewDepartment, ParsedPerson } from "./types.ts";

export type FillPacketInput = {
  person: ParsedPerson;
  startDate: string;
  port?: string | null;
  officerInitials: string;
  officerName?: string | null;
  department: CrewDepartment;
  /** When set, only these pages are filled and copied into the print pack. */
  include?: PacketPageKey[];
};

const INK = rgb(0.05, 0.12, 0.28);

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

function us2(d: string | null | undefined) {
  return formatMdY(d, true);
}
function us4(d: string | null | undefined) {
  return formatMdY(d, false);
}

function cityLine(p: ParsedPerson) {
  return [p.city, p.state, p.zip].filter(Boolean).join(", ");
}

function isUs(citizenship: string | null) {
  const v = (citizenship ?? "").toUpperCase();
  return v === "US" || v === "USA" || v === "UNITED STATES" || v === "U.S." || v === "U.S.A." || v === "AMERICAN";
}

function maritalIsSingle(v: string | null) {
  return (v ?? "").toLowerCase().includes("single");
}

function maritalIsMarried(v: string | null) {
  const s = (v ?? "").toLowerCase();
  return s.includes("married") && !s.includes("single");
}

function priorEmployer(p: ParsedPerson) {
  const notSro = p.previousEmployers.find((e) => !/sunrise|pasha/i.test(e.name));
  return notSro ?? p.previousEmployers[0] ?? null;
}

function ratingOf(p: ParsedPerson) {
  const raw = (p.lastPosition || p.tour?.position || "").trim();
  if (!raw) return "";
  if (raw.length <= 8) return raw;
  return positionLabel(raw);
}

function lastFirst(p: ParsedPerson) {
  return [p.lastName, p.firstName].filter(Boolean).join(", ") || p.fullName;
}

function stateCode(raw: string | null | undefined) {
  const v = (raw ?? "").trim().toUpperCase();
  if (v.length === 2) return v;
  const map: Record<string, string> = {
    FLORIDA: "FL",
    HAWAII: "HI",
    CALIFORNIA: "CA",
    WASHINGTON: "WA",
    TEXAS: "TX",
    "NEW YORK": "NY",
    "NEW HAMPSHIRE": "NH",
    MICHIGAN: "MI",
    "NORTH CAROLINA": "NC",
    PENNSYLVANIA: "PA",
  };
  return map[v] ?? "";
}

function setText(form: PDFForm, name: string, value: string | null | undefined) {
  if (!value) return;
  try {
    const field = form.getTextField(name);
    field.setFontSize(9);
    field.setText(ascii(value).slice(0, 140));
  } catch {
    /* field missing on this revision */
  }
}

function setCheck(form: PDFForm, name: string, on: boolean) {
  try {
    const box = form.getCheckBox(name);
    if (on) box.check();
    else box.uncheck();
  } catch {
    /* ignore */
  }
}

function setDropdown(form: PDFForm, name: string, value: string | null | undefined) {
  if (!value) return;
  try {
    form.getDropdown(name).select(value);
  } catch {
    /* value not in list */
  }
}

function markBox(page: PDFPage | undefined, font: PDFFont, form: PDFForm, name: string) {
  try {
    const box = form.getCheckBox(name);
    box.check();
    if (!page) return;
    for (const widget of box.acroField.getWidgets()) {
      const r = widget.getRectangle();
      const size = Math.min(9, Math.max(7, r.height - 1.5));
      writeAt(page, font, r.x + 1, r.y + 1.3, "X", size, Math.max(8, r.width - 1));
    }
  } catch {
    /* missing */
  }
}

/** Draw text in crop-box space, PDF bottom-origin (same as pdf.js text items). */
function cropOrigin(page: PDFPage): { x: number; y: number } {
  try {
    const c = page.getCropBox();
    return { x: c.x, y: c.y };
  } catch {
    return { x: 0, y: 0 };
  }
}

function writeAt(
  page: PDFPage,
  font: PDFFont,
  x: number,
  y: number,
  value: string | null | undefined,
  size = 9,
  maxWidth = 220,
) {
  if (!value) return;
  const origin = cropOrigin(page);
  const text = fit(font, value, size, maxWidth);
  if (!text) return;
  page.drawText(text, {
    x: origin.x + x,
    y: origin.y + y,
    size,
    font,
    color: INK,
  });
}

function markAt(page: PDFPage, font: PDFFont, x: number, y: number, size = 10) {
  writeAt(page, font, x, y, "X", size, 14);
}

export async function loadPacketTemplate(): Promise<ArrayBuffer> {
  const res = await fetch(PACKET_TEMPLATE_URL);
  if (!res.ok) throw new Error("Could not load the blank SRO sign-on packet.");
  return res.arrayBuffer();
}

export async function fillSignOnPacket(input: FillPacketInput, template?: ArrayBuffer): Promise<Uint8Array> {
  const bytes = template ?? (await loadPacketTemplate());
  const pdf = await PDFDocument.load(bytes);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const pages = pdf.getPages();
  const form = pdf.getForm();
  const p = input.person;
  const start = input.startDate;
  const port = input.port || p.tour?.port || "";
  const rating = ratingOf(p);
  const include = input.include?.length ? input.include : undefined;
  const want = (key: PacketPageKey) => !include || include.includes(key);

  if (want("cover")) fillCover(pages[0], font, p, start, rating);
  if (want("per003")) fillPer003(form, pages[1], font, p, start, port, rating);
  if (want("policies")) fillPolicies(pages[2], font, p, start);
  if (want("physical")) fillPhysical(pages[3], pages[4], font, p, start, rating);
  if (want("medical")) fillMedical(pages[5], font, p, start, rating);
  if (want("dot")) fillRelease(pages[6], font, p, start);
  if (want("w4")) fillW4(pages[7], font, p, start);
  if (want("deposit")) fillDirectDeposit(pages[8], font, p);
  if (want("i9")) fillI9(form, pages[9], font, p, start, input.officerName);
  if (want("fam")) fillFamiliarization(pages[10], pages[11], font, p, start, rating, input.officerInitials, input.department, input.officerName);
  if (want("hazmatQuiz")) fillHazmat(pages[12], font, p);
  if (want("cyber")) fillCyber(pages[15], font, p, start, input.officerName);
  if (want("internet")) fillInternet(pages[18], font, p, start, input.officerName);

  try {
    for (const field of form.getFields()) {
      try {
        const anyField = field as {
          updateAppearances?: (f: PDFFont) => void;
          defaultUpdateAppearances?: (f: PDFFont) => void;
        };
        if (typeof anyField.updateAppearances === "function") anyField.updateAppearances(font);
        else if (typeof anyField.defaultUpdateAppearances === "function") anyField.defaultUpdateAppearances(font);
      } catch {
        /* I-9 widgets with a custom DA still keep their values */
      }
    }
  } catch {
    /* form.flatten path still copies overlay ink */
  }

  if (!include) {
    return pdf.save({ updateFieldAppearances: false });
  }

  try {
    form.flatten();
  } catch {
    /* overlay text still copies; some I-9 widgets may stay live */
  }

  const keep: number[] = [];
  const seen = new Set<number>();
  for (const key of include) {
    for (const i of PACKET_PAGE_INDEX[key] ?? []) {
      if (seen.has(i) || i < 0 || i >= pages.length) continue;
      seen.add(i);
      keep.push(i);
    }
  }
  keep.sort((a, b) => a - b);

  const out = await PDFDocument.create();
  if (keep.length) {
    const copied = await out.copyPages(pdf, keep);
    for (const page of copied) out.addPage(page);
  }
  return out.save({ updateFieldAppearances: false });
}

function fillPer003(
  form: PDFForm,
  page: PDFPage | undefined,
  font: PDFFont,
  p: ParsedPerson,
  start: string,
  port: string,
  rating: string,
) {
  setDropdown(form, "Dropdown1", "M/V");
  setText(form, "Text2", "GEORGE II");
  setText(form, "Text1", p.fullName);
  setText(form, "Text6", p.ssLast4);
  setText(form, "Text3", p.addressLine);
  setText(form, "Text4", p.city);
  setText(form, "Text7", p.state);
  setText(form, "Text8", p.zip);
  setText(form, "Text5", p.homePhone);
  setText(form, "Text9", p.cellPhone);
  setText(form, "Text10", p.nearestAirport);
  setText(form, "Text11", p.airportCode);
  setText(form, "Text12", p.email);
  setText(form, "Text13", us2(p.dob));
  setText(form, "Text14", p.sex);
  setText(form, "Text15", p.placeOfBirth);
  setText(form, "Text16", p.citizenship);
  setText(form, "Text17", p.race);
  setText(form, "Text22", p.mmcNumber);
  setText(form, "Text21", p.mmcPlaceOfIssue);
  setText(form, "Text19", us4(p.mmcExpiration));
  setText(form, "Text18", p.passportNumber);
  setText(form, "Text20", us4(p.passportExpiration));
  setText(form, "Text23", p.hairColor);
  setText(form, "Text24", p.eyeColor);
  setText(form, "Text25", p.height);
  setText(form, "Text26", p.weight);
  setText(form, "Text27", p.maritimeCollege);
  setText(form, "Text28", p.yearGraduated);
  setCheck(form, "Check Box1", p.combatVeteran);
  setCheck(form, "Check Box2", !p.combatVeteran);
  if (maritalIsSingle(p.maritalStatus) || !p.maritalStatus) {
    setCheck(form, "Check Box32", true);
  } else if (maritalIsMarried(p.maritalStatus)) {
    setCheck(form, "Check Box33", true);
  }
  const n = p.nextOfKin;
  if (n) {
    setText(form, "Text35", n.fullName);
    setText(form, "Text39", n.relationship);
    setText(form, "Text36", n.addressLine);
    setText(form, "Text37", n.city);
    setText(form, "Text40", n.state);
    setText(form, "Text41", n.zip);
    setText(form, "Text38", n.phone);
    setText(form, "Text42", n.cellPhone);
  }
  setText(form, "Text43", p.fullName);
  setText(form, "Text45", us2(start));
  setText(form, "Text46", port);
  if (page) {
    writeAt(page, font, 99, 749.2, us2(start), 9, 70);
    writeAt(page, font, 178, 748.8, rating, 9, 115);
  }
}

function fillPolicies(page: PDFPage | undefined, font: PDFFont, p: ParsedPerson, start: string) {
  if (!page) return;
  writeAt(page, font, 432, 678.2, us4(start), 10, 95);
  writeAt(page, font, 72, 661.0, p.lastName || p.fullName, 8, 70);
  writeAt(page, font, 60, 90, p.fullName, 8, 130);
}

function fillPhysical(
  p1: PDFPage | undefined,
  p2: PDFPage | undefined,
  font: PDFFont,
  p: ParsedPerson,
  start: string,
  rating: string,
) {
  if (p1) {
    writeAt(p1, font, 128, 698.4, p.fullName, 9, 150);
    writeAt(p1, font, 322, 697.9, rating, 9, 72);
    writeAt(p1, font, 470, 696.5, us2(p.dob), 9, 80);
    writeAt(p1, font, 360, 683.0, p.ssLast4, 9, 70);
  }
  if (p2) {
    writeAt(p2, font, 125, 677.3, p.fullName, 9, 140);
    writeAt(p2, font, 312, 677.0, rating, 9, 80);
    writeAt(p2, font, 458, 676.8, us2(p.dob), 9, 80);
    writeAt(p2, font, 385, 655.7, p.ssLast4, 9, 70);
    writeAt(p2, font, 320, 137.8, rating, 9, 140);
    writeAt(p2, font, 430, 98.2, us2(start), 9, 80);
  }
}

function fillMedical(page: PDFPage | undefined, font: PDFFont, p: ParsedPerson, start: string, rating: string) {
  if (!page) return;
  writeAt(page, font, 128, 607.2, p.fullName, 10, 210);
  writeAt(page, font, 418, 607.2, rating, 10, 85);
  if (!p.medications) {
    markAt(page, font, 85, 537.8, 11);
  } else {
    markAt(page, font, 85, 481.9, 11);
  }
  if (!p.allergies) {
    markAt(page, font, 86, 316.6, 11);
  } else {
    markAt(page, font, 86, 274.1, 11);
    writeAt(page, font, 100, 250, p.allergies, 9, 380);
  }
  if (p.glasses) {
    markAt(page, font, 87, 145.4, 11);
    if (p.spareGlasses) markAt(page, font, 87, 117.6, 11);
    else markAt(page, font, 138, 117.6, 11);
  } else {
    markAt(page, font, 87, 173.0, 11);
  }
  writeAt(page, font, 412, 76.8, us4(start), 10, 85);
}

function fillRelease(page: PDFPage | undefined, font: PDFFont, p: ParsedPerson, start: string) {
  if (!page) return;
  writeAt(page, font, 196, 676.8, p.fullName, 9, 250);
  writeAt(page, font, 174, 660.2, p.ssLast4 ? `xxx-xx-${p.ssLast4}` : "", 9, 180);
  writeAt(page, font, 430, 551.5, us4(start), 9, 90);
  writeAt(page, font, 160, 517.2, COMPANY, 9, 280);
  writeAt(page, font, 110, 497.8, COMPANY_ADDRESS, 9, 360);
  const prev = priorEmployer(p);
  if (prev) {
    writeAt(page, font, 168, 422.4, prev.name, 9, 280);
    writeAt(page, font, 110, 404.9, prev.address, 9, 360);
    writeAt(page, font, 110, 375.1, prev.phone, 9, 160);
  }
}

function fillW4(page: PDFPage | undefined, font: PDFFont, p: ParsedPerson, start: string) {
  if (!page) return;
  const first = [p.firstName, p.middleName ? `${p.middleName[0]}.` : ""].filter(Boolean).join(" ");
  writeAt(page, font, 42, 715, first, 10, 220);
  writeAt(page, font, 282, 715, p.lastName, 10, 180);
  writeAt(page, font, 482, 715, p.ssLast4 ? `xxx-xx-${p.ssLast4}` : "", 9, 100);
  writeAt(page, font, 42, 687, p.addressLine, 9, 400);
  writeAt(page, font, 42, 662, cityLine(p), 9, 400);
  if (maritalIsMarried(p.maritalStatus)) markAt(page, font, 114.7, 614.5, 10);
  else if (maritalIsSingle(p.maritalStatus)) markAt(page, font, 114.7, 626.5, 10);
  writeAt(page, font, 42, 77, COMPANY, 8, 280);
  writeAt(page, font, 398, 77, us4(start), 8, 70);
}

function fillDirectDeposit(page: PDFPage | undefined, font: PDFFont, p: ParsedPerson) {
  if (!page) return;
  markAt(page, font, 136, 653.0, 10);
  writeAt(page, font, 138, 592.8, p.fullName, 9, 155);
  writeAt(page, font, 418, 592.8, p.ssLast4, 9, 45);
  writeAt(page, font, 75, 359.5, p.lastName || p.fullName, 9, 130);
}

function inkField(
  page: PDFPage,
  font: PDFFont,
  form: PDFForm,
  name: string,
  value: string | null | undefined,
  size = 8,
) {
  if (!value) return;
  try {
    const field = form.getTextField(name);
    for (const widget of field.acroField.getWidgets()) {
      const r = widget.getRectangle();
      writeAt(page, font, r.x + 2, r.y + 3.2, value, size, Math.max(24, r.width - 4));
    }
  } catch {
    /* field missing on this revision */
  }
}

function fillI9(
  form: PDFForm,
  page: PDFPage | undefined,
  font: PDFFont,
  p: ParsedPerson,
  start: string,
  officerName?: string | null,
) {
  const phone = p.cellPhone || p.homePhone;
  const ssn = p.ssLast4 ? `XXX-XX-${p.ssLast4}` : "";
  setText(form, "Last Name (Family Name)", p.lastName);
  setText(form, "First Name Given Name", p.firstName);
  setText(form, "Employee Middle Initial (if any)", p.middleName ? p.middleName[0] : "");
  setText(form, "Address Street Number and Name", p.addressLine);
  setText(form, "City or Town", p.city);
  setDropdown(form, "State", stateCode(p.state));
  setText(form, "ZIP Code", p.zip);
  setText(form, "Date of Birth mmddyyyy", us4(p.dob));
  setText(form, "US Social Security Number", ssn);
  setText(form, "Employees E-mail Address", p.email);
  setText(form, "Telephone Number", phone);
  if (isUs(p.citizenship)) markBox(page, font, form, "CB_1");
  setText(form, "Today's Date mmddyyy", us4(start));
  const passportLive = Boolean(p.passportNumber) && currentOn(p.passportExpiration, start);
  if (passportLive) {
    setText(form, "Document Title 1", "US Passport");
    setText(form, "Issuing Authority 1", "US Dept. of State");
    setText(form, "Document Number 0 (if any)", p.passportNumber);
    setText(form, "Expiration Date if any", us4(p.passportExpiration));
  }
  setText(form, "FirstDayEmployed mmddyyyy", us4(start));
  setText(form, "Employers Business or Org Name", COMPANY);
  setText(form, "Employers Business or Org Address", COMPANY_ADDRESS);
  if (officerName) {
    setText(form, "Last Name First Name and Title of Employer or Authorized Representative", officerName);
  }
  setText(form, "S2 Todays Date mmddyyyy", us4(start));

  if (!page) return;
  inkField(page, font, form, "Telephone Number", phone);
  inkField(page, font, form, "US Social Security Number", ssn);
  inkField(page, font, form, "Today's Date mmddyyy", us4(start));
  if (passportLive) {
    inkField(page, font, form, "Document Title 1", "US Passport");
    inkField(page, font, form, "Issuing Authority 1", "US Dept. of State");
    inkField(page, font, form, "Document Number 0 (if any)", p.passportNumber);
    inkField(page, font, form, "Expiration Date if any", us4(p.passportExpiration));
  }
  inkField(page, font, form, "FirstDayEmployed mmddyyyy", us4(start));
  inkField(page, font, form, "Employers Business or Org Name", COMPANY, 7);
  inkField(page, font, form, "Employers Business or Org Address", COMPANY_ADDRESS, 7);
  if (officerName) {
    inkField(
      page,
      font,
      form,
      "Last Name First Name and Title of Employer or Authorized Representative",
      officerName,
      8,
    );
  }
  inkField(page, font, form, "S2 Todays Date mmddyyyy", us4(start));
}

function fillFamRow(page: PDFPage, font: PDFFont, y: number, initials: string, start: string) {
  writeAt(page, font, 430, y, initials, 8, 36);
  writeAt(page, font, 536, y, us2(start), 7, 36);
}

function fillFamRows(page: PDFPage, font: PDFFont, ys: number[], initials: string, start: string) {
  for (const y of ys) fillFamRow(page, font, y, initials, start);
}

function fillFamiliarization(
  p1: PDFPage | undefined,
  p2: PDFPage | undefined,
  font: PDFFont,
  p: ParsedPerson,
  start: string,
  rating: string,
  initialsRaw: string,
  department: CrewDepartment,
  officerName?: string | null,
) {
  const initials = ascii(initialsRaw).slice(0, 6).toUpperCase();
  const officer = ascii(officerName ?? "") || initials;
  if (p1) {
    writeAt(p1, font, 58, 663.5, lastFirst(p), 9, 120);
    writeAt(p1, font, 185, 663.5, rating, 9, 120);
    writeAt(p1, font, 328, 663.5, "George II", 9, 150);
    writeAt(p1, font, 506, 663.5, us4(start), 9, 70);
    if (initials) {
      fillFamRows(
        p1,
        font,
        [565, 541, 524, 501, 484, 461, 447, 423, 409, 374, 351, 337, 302, 288, 273, 250, 227, 213, 189, 175, 160, 128, 93],
        initials,
        start,
      );
    }
  }
  if (p2 && initials) {
    fillFamRows(p2, font, [637, 602, 578, 555, 532, 509, 474, 460, 437, 422, 407, 393, 378], initials, start);
    if (department === "deck") {
      fillFamRows(p2, font, [329, 283, 269, 255, 240], initials, start);
    } else if (department === "engine") {
      fillFamRows(p2, font, [217, 194, 179, 165], initials, start);
    } else {
      fillFamRows(p2, font, [142, 127], initials, start);
    }
    fillFamRow(p2, font, 113, initials, start);
    if (officer) writeAt(p2, font, 298, 70, officer, 9, 250);
  }
}

function currentOn(expires: string | null | undefined, asOf: string) {
  if (!expires) return true;
  return expires >= asOf;
}

function fillCover(page: PDFPage | undefined, font: PDFFont, p: ParsedPerson, start: string, rating: string) {
  if (!page) return;
  writeAt(page, font, 48, 772, lastFirst(p), 9, 220);
  writeAt(page, font, 280, 772, rating, 8, 90);
  writeAt(page, font, 430, 772, us2(start), 8, 80);
  const types = new Set(p.documents.map((d) => d.docType));
  const passportOn = Boolean(p.passportNumber || types.has("passport")) && currentOn(p.passportExpiration ?? p.documents.find((d) => d.docType === "passport")?.expiresOn, start);
  const mmcOn = Boolean(p.mmcNumber || types.has("mmc")) && currentOn(p.mmcExpiration ?? p.documents.find((d) => d.docType === "mmc")?.expiresOn, start);
  const medicalOn = p.documents.some((d) => d.docType === "medical" && currentOn(d.expiresOn, start));
  const twicOn = p.documents.some((d) => d.docType === "twic" && currentOn(d.expiresOn, start));
  const dispatchOn = Boolean(p.tour?.dispatchRef) || types.has("dispatch");
  const drugOn = p.documents.some((d) => d.docType === "drug_free" && currentOn(d.expiresOn, start));
  const rows: Array<[boolean, number]> = [
    [true, 729.7], // Sign-On Information
    [true, 709.0], // Acknowledgement of Policies
    [true, 688.2], // Statement of Physical Condition
    [true, 667.6], // Medical Sign-On
    [true, 646.8], // Release of Information
    [true, 626.2], // W-4
    [true, 605.0], // Direct Deposit
    [true, 583.9], // I-9
    [passportOn, 564.2],
    [mmcOn, 544.4],
    [medicalOn, 524.6],
    [twicOn, 505.0],
    [dispatchOn, 485.2],
    [drugOn, 445.7],
    [true, 385.4], // Familiarization checklist
    [types.has("cyber"), 364.7],
    [types.has("sash"), 343.7],
    [true, 322.6], // HAZMAT cert we print with the quiz
    [types.has("radio"), 302.4],
  ];
  for (const [on, y] of rows) {
    if (on) markAt(page, font, 48, y, 11);
  }
}

function fillHazmat(page: PDFPage | undefined, font: PDFFont, p: ParsedPerson) {
  if (!page) return;
  writeAt(page, font, 76, 744.7, p.fullName, 10, 160);
  // Printed answer key on the form: 1–3 true, 4–6 false, 7–10 true.
  const trueX = 449;
  const falseX = 494;
  const rows: Array<[number, boolean]> = [
    [641.3, true],
    [613.2, true],
    [598.9, true],
    [570.8, false],
    [542.8, false],
    [528.4, false],
    [500.3, true],
    [472.2, true],
    [444.1, true],
    [416.0, true],
  ];
  for (const [y, isTrue] of rows) markAt(page, font, isTrue ? trueX : falseX, y, 11);
}

function fillCyber(page: PDFPage | undefined, font: PDFFont, p: ParsedPerson, start: string, officerName?: string | null) {
  if (!page) return;
  writeAt(page, font, 62, 618, lastFirst(p), 10, 175);
  writeAt(page, font, 400, 618, us4(start), 10, 80);
  if (officerName) writeAt(page, font, 62, 411, ascii(officerName), 10, 220);
}

function fillInternet(page: PDFPage | undefined, font: PDFFont, p: ParsedPerson, start: string, _officerName?: string | null) {
  if (!page) return;
  writeAt(page, font, 62, 607, lastFirst(p), 10, 190);
  writeAt(page, font, 276, 607, "George II", 10, 170);
  writeAt(page, font, 482, 607, us4(start), 10, 75);
}

export function packetFilename(p: ParsedPerson, startDate: string) {
  const last = (p.lastName || p.fullName || "crew").replace(/[^A-Za-z0-9]+/g, "");
  return `George-II-Sign-On-${last}-${startDate}.pdf`;
}
