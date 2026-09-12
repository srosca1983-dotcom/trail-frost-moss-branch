import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { formatMdY, todayUtc } from "./dates.ts";
import { positionLabel } from "./ratings.ts";
import { COMPANY, COMPANY_ADDRESS, VESSEL, VESSEL_PARTICULARS, type RosterSlot } from "./types.ts";

const INK = rgb(0.05, 0.08, 0.1);
const RULE = rgb(0.15, 0.18, 0.2);
const MUTED = rgb(0.35, 0.38, 0.4);

export type CrewListKind = "generic" | "imo" | "watch";

export type ImoHeader = {
  arrival: boolean;
  departure: boolean;
  voyageNumber: string;
  port: string;
  date: string;
  lastPort: string;
  nextPort?: string;
};

export type CrewListRow = {
  no: number;
  crewId: string;
  familyName: string;
  givenNames: string;
  fullName: string;
  rank: string;
  nationality: string;
  dob: string;
  placeOfBirth: string;
  gender: string;
  idNature: string;
  idNumber: string;
  idIssuing: string;
  idExpiry: string;
  signOn: string;
  dueOff: string;
  extraDays: number;
  missing: string[];
};

export const DEFAULT_IMO_HEADER: ImoHeader = {
  arrival: true,
  departure: false,
  voyageNumber: "",
  port: "",
  date: todayUtc().toISOString().slice(0, 10),
  lastPort: "",
  nextPort: "",
};

export function flattenAboard(slots: RosterSlot[]): CrewListRow[] {
  const ordered = [...slots].sort(
    (a, b) => a.billet.sortOrder - b.billet.sortOrder || a.billet.code.localeCompare(b.billet.code),
  );
  const rows: CrewListRow[] = [];
  let no = 1;
  for (const slot of ordered) {
    const occupants = [...slot.occupants].sort(
      (a, b) =>
        (a.tour.signOn ?? "").localeCompare(b.tour.signOn ?? "") || a.crew.fullName.localeCompare(b.crew.fullName),
    );
    for (const o of occupants) {
      const c = o.crew;
      const family = (c.lastName ?? "").trim() || lastFromFull(c.fullName);
      const given = [c.firstName, c.middleName].filter(Boolean).join(" ").trim() || givenFromFull(c.fullName, family);
      const id = identityDocument(c.passportNumber, c.passportExpiration, c.mmcNumber, c.mmcExpiration);
      const missing: string[] = [];
      if (!c.dob) missing.push("DOB");
      if (!id.number) missing.push("ID");
      if (!c.placeOfBirth) missing.push("POB");
      rows.push({
        no: no++,
        crewId: c.id,
        familyName: family,
        givenNames: given,
        fullName: family && given ? `${family}, ${given}` : c.fullName,
        rank: slot.billet.title || positionLabel(c.lastPosition),
        nationality: nationalityOf(c.citizenship),
        dob: c.dob ?? "",
        placeOfBirth: c.placeOfBirth ?? "",
        gender: genderOf(c.sex),
        idNature: id.nature,
        idNumber: id.number,
        idIssuing: id.issuing,
        idExpiry: id.expiry,
        signOn: o.tour.signOn ?? c.lastSignOn ?? "",
        dueOff: o.due.date ?? "",
        extraDays: o.extraDays ?? 0,
        missing,
      });
    }
  }
  return rows;
}

export type WatchBillRow = {
  code: string;
  title: string;
  name: string;
  vacant: boolean;
};

export type WatchBillGroup = {
  watch: "12-4" | "4-8" | "8-12" | "day";
  label: string;
  rows: WatchBillRow[];
};

export function flattenWatchBill(slots: RosterSlot[]): WatchBillGroup[] {
  const groups: WatchBillGroup[] = [
    { watch: "12-4", label: "12–4", rows: [] },
    { watch: "4-8", label: "4–8", rows: [] },
    { watch: "8-12", label: "8–12", rows: [] },
    { watch: "day", label: "Day", rows: [] },
  ];
  const byWatch = new Map(groups.map((g) => [g.watch, g]));
  const ordered = [...slots].sort(
    (a, b) => a.billet.sortOrder - b.billet.sortOrder || a.billet.code.localeCompare(b.billet.code),
  );
  for (const slot of ordered) {
    const key = slot.billet.watch;
    if (!key) continue;
    const g = byWatch.get(key);
    if (!g) continue;
    if (!slot.occupants.length) {
      g.rows.push({ code: slot.billet.code, title: slot.billet.title, name: "VACANT", vacant: true });
      continue;
    }
    const occupants = [...slot.occupants].sort((a, b) => a.crew.fullName.localeCompare(b.crew.fullName));
    for (const o of occupants) {
      g.rows.push({
        code: slot.billet.code,
        title: slot.billet.title,
        name: o.crew.fullName,
        vacant: false,
      });
    }
  }
  return groups;
}

export function nationalityOf(raw: string | null | undefined): string {
  const s = (raw ?? "").trim().toUpperCase();
  if (!s) return "USA";
  if (s === "US" || s === "USA" || s === "U.S." || s === "U.S.A." || s.includes("UNITED STATES") || s === "AMERICAN") {
    return "USA";
  }
  return raw!.trim();
}

export function genderOf(raw: string | null | undefined): string {
  const s = (raw ?? "").trim().toUpperCase();
  if (!s) return "";
  if (s.startsWith("M") && !s.startsWith("MI")) return "M";
  if (s.startsWith("F")) return "F";
  if (s.startsWith("X") || s === "NB") return "X";
  return s.slice(0, 1);
}

export function identityDocument(
  passportNumber: string | null | undefined,
  passportExpiration: string | null | undefined,
  mmcNumber: string | null | undefined,
  mmcExpiration: string | null | undefined,
): { nature: string; number: string; issuing: string; expiry: string } {
  if (passportNumber) {
    return { nature: "Passport", number: passportNumber, issuing: "USA", expiry: passportExpiration ?? "" };
  }
  if (mmcNumber) {
    return { nature: "MMC", number: mmcNumber, issuing: "USA", expiry: mmcExpiration ?? "" };
  }
  return { nature: "", number: "", issuing: "", expiry: "" };
}

function lastFromFull(full: string) {
  const parts = full.trim().split(/\s+/);
  return parts[parts.length - 1] ?? full;
}

function givenFromFull(full: string, family: string) {
  const cut = full.replace(new RegExp(`\\s*${family}\\s*$`, "i"), "").trim();
  return cut || full;
}

function ascii(text: string) {
  return text.replace(/[^\x20-\x7E]/g, " ").replace(/\s+/g, " ").trim();
}

function fit(font: PDFFont, text: string, size: number, maxWidth: number) {
  let t = ascii(text);
  if (!t) return "";
  if (font.widthOfTextAtSize(t, size) <= maxWidth) return t;
  while (t.length > 1 && font.widthOfTextAtSize(`${t}…`, size) > maxWidth) t = t.slice(0, -1);
  return `${t}…`;
}

function write(
  page: PDFPage,
  font: PDFFont,
  x: number,
  y: number,
  text: string,
  size: number,
  maxWidth?: number,
  color = INK,
) {
  const t = maxWidth ? fit(font, text, size, maxWidth) : ascii(text);
  if (!t) return;
  page.drawText(t, { x, y, size, font, color });
}

function rect(page: PDFPage, x: number, y: number, w: number, h: number, thickness = 0.7) {
  page.drawRectangle({ x, y, width: w, height: h, borderWidth: thickness, borderColor: RULE, color: undefined });
}

function hline(page: PDFPage, x1: number, x2: number, y: number, thickness = 0.5) {
  page.drawLine({ start: { x: x1, y }, end: { x: x2, y }, thickness, color: RULE });
}

function vline(page: PDFPage, x: number, y1: number, y2: number, thickness = 0.5) {
  page.drawLine({ start: { x, y: y1 }, end: { x, y: y2 }, thickness, color: RULE });
}

function us(d: string) {
  return formatMdY(d, false) || d;
}

export function crewListFilename(kind: CrewListKind, date = DEFAULT_IMO_HEADER.date) {
  const tag = kind === "imo" ? "IMO-FAL5" : kind === "watch" ? "watch-bill" : "crew-list";
  return `GEORGE-II-${tag}-${date || "list"}.pdf`;
}

export async function buildGenericCrewListPdf(rows: CrewListRow[], issuedOn = DEFAULT_IMO_HEADER.date): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.TimesRoman);
  const bold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const pageW = 612;
  const pageH = 792;
  const margin = 36;
  const cols = [
    { key: "no", label: "No.", w: 24 },
    { key: "name", label: "Name (family, given)", w: 148 },
    { key: "rank", label: "Rank / rating", w: 92 },
    { key: "nat", label: "Nat.", w: 36 },
    { key: "dob", label: "Date of birth", w: 68 },
    { key: "pob", label: "Place of birth", w: 92 },
    { key: "sex", label: "Sex", w: 24 },
    { key: "id", label: "Passport / MMC", w: 92 },
  ] as const;
  const tableW = cols.reduce((n, c) => n + c.w, 0);
  const rowH = 16;
  const headerH = 18;
  const perPage = 32;

  const pages = Math.max(1, Math.ceil(rows.length / perPage));
  for (let p = 0; p < pages; p++) {
    const page = pdf.addPage([pageW, pageH]);
    let y = pageH - margin;
    write(page, bold, margin, y - 12, COMPANY.toUpperCase(), 11);
    write(page, font, margin, y - 26, COMPANY_ADDRESS, 8, 320, MUTED);
    write(page, font, pageW - margin - 160, y - 12, `Page ${p + 1} of ${pages}`, 8, 160, MUTED);
    y -= 42;
    write(page, bold, margin, y, "CREW LIST", 16);
    y -= 16;
    write(page, font, margin, y, `${VESSEL}  ·  IMO ${VESSEL_PARTICULARS.imo}  ·  Call sign ${VESSEL_PARTICULARS.callSign}  ·  Flag ${VESSEL_PARTICULARS.flagCode}`, 8, 540);
    y -= 12;
    write(page, font, margin, y, `Port of registry ${VESSEL_PARTICULARS.portOfRegistry}  ·  Date ${us(issuedOn)}  ·  ${rows.length} souls on board`, 8, 540);
    y -= 20;

    const tableTop = y;
    const tableBot = y - headerH - Math.min(perPage, rows.length - p * perPage) * rowH;
    rect(page, margin, tableBot, tableW, tableTop - tableBot, 0.9);
    let x = margin;
    for (const col of cols) {
      write(page, bold, x + 3, y - 12, col.label, 7, col.w - 6);
      x += col.w;
      if (x < margin + tableW) vline(page, x, tableBot, tableTop);
    }
    hline(page, margin, margin + tableW, y - headerH, 0.8);
    y -= headerH;

    const slice = rows.slice(p * perPage, (p + 1) * perPage);
    for (const r of slice) {
      x = margin;
      const cells = [
        String(r.no),
        r.fullName,
        r.rank,
        r.nationality,
        us(r.dob),
        r.placeOfBirth,
        r.gender,
        r.idNumber ? `${r.idNature} ${r.idNumber}` : "",
      ];
      cells.forEach((cell, i) => {
        write(page, font, x + 3, y - 11, cell, 7.5, cols[i].w - 6);
        x += cols[i].w;
      });
      y -= rowH;
      hline(page, margin, margin + tableW, y, 0.3);
    }

    write(page, font, margin, 42, "Master / authorized officer", 8, 200, MUTED);
    hline(page, margin, margin + 180, 36, 0.6);
    write(page, font, margin + 220, 42, "Date", 8, 80, MUTED);
    hline(page, margin + 220, margin + 320, 36, 0.6);
  }

  return pdf.save();
}

export async function buildImoCrewListPdf(
  rows: CrewListRow[],
  header: ImoHeader = DEFAULT_IMO_HEADER,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.TimesRoman);
  const bold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const pageW = 841.89;
  const pageH = 595.28;
  const margin = 22;
  const cols = [
    { key: "no", label: "6. No.", w: 22 },
    { key: "fam", label: "7. Family name", w: 78 },
    { key: "giv", label: "8. Given names", w: 86 },
    { key: "rank", label: "9. Rank or rating", w: 78 },
    { key: "nat", label: "10. Nationality", w: 52 },
    { key: "dob", label: "11. Date of birth", w: 58 },
    { key: "pob", label: "12. Place of birth", w: 72 },
    { key: "sex", label: "13. Gender", w: 36 },
    { key: "natid", label: "14. Nature of ID", w: 54 },
    { key: "num", label: "15. Number of ID", w: 78 },
    { key: "iss", label: "16. Issuing State", w: 56 },
    { key: "exp", label: "17. Expiry date of ID", w: 66 },
  ] as const;
  const tableW = cols.reduce((n, c) => n + c.w, 0);
  const rowH = 14;
  const headerH = 22;
  const perPage = 22;

  const pages = Math.max(1, Math.ceil(rows.length / perPage));
  for (let p = 0; p < pages; p++) {
    const page = pdf.addPage([pageW, pageH]);
    let y = pageH - margin;
    write(page, bold, margin, y - 10, "CREW LIST", 14);
    write(page, font, margin + 92, y - 8, "(IMO FAL Form 5)", 9, 140, MUTED);
    write(page, font, pageW - margin - 210, y - 6, "Arrival", 8);
    box(page, pageW - margin - 168, y - 8, 9, 9, header.arrival);
    write(page, font, pageW - margin - 148, y - 6, "Departure", 8);
    box(page, pageW - margin - 90, y - 8, 9, 9, header.departure);
    write(page, font, pageW - margin - 70, y - 6, `Page ${p + 1} of ${pages}`, 8, 70, MUTED);
    y -= 18;

    const gridTop = y;
    const gridH = 46;
    rect(page, margin, y - gridH, tableW, gridH, 0.8);
    const half = tableW / 2;
    vline(page, margin + half, y - gridH, y);
    hline(page, margin, margin + tableW, y - gridH / 2);
    write(page, font, margin + 4, y - 12, `1.1 Name of ship   ${VESSEL_PARTICULARS.displayName}`, 8, half - 8);
    write(page, font, margin + 4, y - 24, `1.2 IMO number     ${VESSEL_PARTICULARS.imo}`, 8, half - 8);
    write(page, font, margin + half + 4, y - 12, `1.3 Call sign      ${VESSEL_PARTICULARS.callSign}`, 8, half - 8);
    write(page, font, margin + half + 4, y - 24, `1.4 Voyage number  ${header.voyageNumber || ""}`, 8, half - 8);
    write(page, font, margin + 4, y - 36, `2. Port of arrival/departure   ${header.port || ""}`, 8, half - 8);
    write(page, font, margin + 4, y - 46, `3. Date of arrival/departure   ${us(header.date)}`, 8, half - 8);
    write(page, font, margin + half + 4, y - 36, `4. Flag State of ship   ${VESSEL_PARTICULARS.flag}`, 8, half - 8);
    write(page, font, margin + half + 4, y - 46, `5. Last port of call   ${header.lastPort || ""}`, 8, half - 8);
    y -= gridH + 8;

    const tableTop = y;
    const slice = rows.slice(p * perPage, (p + 1) * perPage);
    const tableBot = y - headerH - slice.length * rowH;
    rect(page, margin, tableBot, tableW, tableTop - tableBot, 0.9);
    let x = margin;
    for (const col of cols) {
      write(page, bold, x + 2, y - 14, col.label, 6.5, col.w - 4);
      x += col.w;
      if (x < margin + tableW) vline(page, x, tableBot, tableTop);
    }
    hline(page, margin, margin + tableW, y - headerH, 0.8);
    y -= headerH;

    for (const r of slice) {
      x = margin;
      const cells = [
        String(r.no),
        r.familyName,
        r.givenNames,
        r.rank,
        r.nationality,
        us(r.dob),
        r.placeOfBirth,
        r.gender,
        r.idNature,
        r.idNumber,
        r.idIssuing,
        us(r.idExpiry),
      ];
      cells.forEach((cell, i) => {
        write(page, font, x + 2, y - 10, cell, 7, cols[i].w - 4);
        x += cols[i].w;
      });
      y -= rowH;
      hline(page, margin, margin + tableW, y, 0.3);
    }

    write(page, font, margin, 28, "18. Date and signature by master, authorized agent or officer", 8, 400, MUTED);
    hline(page, margin + 340, margin + 520, 26, 0.6);
    write(page, font, margin + 530, 28, us(header.date), 8, 80, MUTED);
  }

  return pdf.save();
}

export async function buildWatchBillPdf(
  groups: WatchBillGroup[],
  issuedOn = DEFAULT_IMO_HEADER.date,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pageW = 792;
  const pageH = 612;
  const page = pdf.addPage([pageW, pageH]);
  const margin = 28;
  write(page, bold, margin, pageH - 28, COMPANY.toUpperCase(), 10);
  write(page, font, margin, pageH - 42, `${VESSEL}  ·  IMO ${VESSEL_PARTICULARS.imo}  ·  ${us(issuedOn)}`, 9, 480, MUTED);
  write(page, bold, margin, pageH - 64, "WATCH BILL", 18);
  write(page, font, pageW - margin - 200, pageH - 28, "Wheelhouse / mess", 9, 200, MUTED);

  const colGap = 12;
  const colW = (pageW - margin * 2 - colGap * 3) / 4;
  const top = pageH - 84;
  groups.forEach((g, i) => {
    const x = margin + i * (colW + colGap);
    page.drawRectangle({
      x,
      y: 36,
      width: colW,
      height: top - 36,
      borderColor: RULE,
      borderWidth: 0.8,
    });
    write(page, bold, x + 8, top - 18, g.label, 13);
    write(page, font, x + 8, top - 32, `${g.rows.filter((r) => !r.vacant).length} on watch`, 8, colW - 16, MUTED);
    let y = top - 50;
    for (const r of g.rows) {
      write(page, font, x + 8, y, r.title, 7, colW - 16, MUTED);
      y -= 12;
      write(page, r.vacant ? font : bold, x + 8, y, r.name, 10, colW - 16, r.vacant ? MUTED : INK);
      y -= 18;
      if (y < 50) break;
    }
  });

  write(page, font, margin, 22, "Watch follows the job. Print for the wheelhouse and the mess.", 8, 500, MUTED);
  return pdf.save();
}

function box(page: PDFPage, x: number, y: number, w: number, h: number, checked: boolean) {
  rect(page, x, y, w, h, 0.8);
  if (checked) {
    page.drawLine({ start: { x: x + 1.5, y: y + 2 }, end: { x: x + w / 2, y: y + h - 1.5 }, thickness: 1, color: INK });
    page.drawLine({ start: { x: x + w / 2, y: y + h - 1.5 }, end: { x: x + w - 1.5, y: y + 1.5 }, thickness: 1, color: INK });
  }
}

export function downloadPdf(bytes: Uint8Array, filename: string) {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const blob = new Blob([copy], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4_000);
}
