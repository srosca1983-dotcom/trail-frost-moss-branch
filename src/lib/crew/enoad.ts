import { daysUntil, formatMdY, todayUtc } from "./dates.ts";
import { identityDocument, nationalityOf } from "./crew-list.ts";
import { embarkCountry } from "./ports.ts";
import { positionLabel } from "./ratings.ts";
import { VESSEL_PARTICULARS, type RosterSlot } from "./types.ts";

/** 33 CFR 160.206(a) Table — crewmember items the NVMC / eNOAD must have. */
export const ENOAD_REQUIRED = [
  "Last name",
  "Date of birth",
  "Nationality",
  "Passport or MMC",
  "Position",
  "Where embarked",
] as const;

export type EnoadHeader = {
  arrival: boolean;
  departure: boolean;
  port: string;
  date: string;
};

export type EnoadCrewRow = {
  no: number;
  crewId: string;
  lastName: string;
  firstName: string;
  middleName: string;
  position: string;
  nationality: string;
  nationalityCode: string;
  residence: string;
  dob: string;
  dobUs: string;
  sex: "Male" | "Female" | "";
  idType: string;
  idNumber: string;
  idCountry: string;
  idExpiry: string;
  idExpiryUs: string;
  idExpired: boolean;
  embarkCountry: string;
  embarkPort: string;
  embarkDate: string;
  embarkDateUs: string;
  phone: string;
  longshore: string;
  missing: string[];
};

export const ENOAD_COLUMNS = [
  "Last Name",
  "First Name",
  "Middle Name",
  "Position",
  "Nationality",
  "Country of Residence",
  "Date of Birth",
  "Sex",
  "ID Type",
  "ID Number",
  "Issue Country",
  "Expiration Date",
  "Embark Country",
  "Embark Port",
  "Embark Date",
  "Debark Country",
  "Debark Port",
  "Debark Date",
  "Primary Contact Phone",
  "Performing Longshore Work in U.S.?",
] as const;

export function enoadSex(raw: string | null | undefined): "Male" | "Female" | "" {
  const s = (raw ?? "").trim().toUpperCase();
  if (!s) return "";
  if (s.startsWith("F")) return "Female";
  if (s === "M" || s.startsWith("MALE") || (s.startsWith("M") && !s.startsWith("MI"))) return "Male";
  return "";
}

export function enoadNationality(raw: string | null | undefined): { name: string; code: string } {
  const code = nationalityOf(raw);
  if (code === "USA" || code === "US") return { name: "UNITED STATES", code: "US" };
  return { name: code, code: code.replace(/[^A-Z]/gi, "").slice(0, 2).toUpperCase() || code };
}

export function enoadIdType(nature: string): string {
  if (nature === "Passport") return "Passport";
  if (nature === "MMC") return "Merchant Mariner Document";
  return nature;
}

function splitNames(fullName: string, first: string | null, middle: string | null, last: string | null) {
  const family = (last ?? "").trim() || (fullName.trim().split(/\s+/).pop() ?? fullName);
  const givenFirst = (first ?? "").trim();
  const givenMiddle = (middle ?? "").trim();
  if (givenFirst) return { last: family, first: givenFirst, middle: givenMiddle };
  const cut = fullName.replace(new RegExp(`\\s*${family}\\s*$`, "i"), "").trim() || fullName;
  const parts = cut.split(/\s+/);
  return { last: family, first: parts[0] ?? "", middle: parts.slice(1).join(" ") };
}

export function flattenEnoad(slots: RosterSlot[]): EnoadCrewRow[] {
  const ordered = [...slots].sort(
    (a, b) => a.billet.sortOrder - b.billet.sortOrder || a.billet.code.localeCompare(b.billet.code),
  );
  const rows: EnoadCrewRow[] = [];
  let no = 1;
  for (const slot of ordered) {
    const occupants = [...slot.occupants].sort(
      (a, b) =>
        (a.tour.signOn ?? "").localeCompare(b.tour.signOn ?? "") || a.crew.fullName.localeCompare(b.crew.fullName),
    );
    for (const o of occupants) {
      const c = o.crew;
      const names = splitNames(c.fullName, c.firstName, c.middleName, c.lastName);
      const id = identityDocument(c.passportNumber, c.passportExpiration, c.mmcNumber, c.mmcExpiration);
      const nat = enoadNationality(c.citizenship);
      const sex = enoadSex(c.sex);
      const embarkPort = (o.tour.port ?? "").trim();
      const embarkDate = o.tour.signOn ?? c.lastSignOn ?? "";
      const idExpired = Boolean(id.expiry && (daysUntil(id.expiry) ?? 0) < 0);
      const missing: string[] = [];
      if (!names.last) missing.push("Last name");
      if (!c.dob) missing.push("Date of birth");
      if (!id.number) missing.push("Passport or MMC");
      else if (idExpired) missing.push("ID expired");
      if (!sex) missing.push("Sex");
      if (!embarkPort) missing.push("Where embarked");
      rows.push({
        no: no++,
        crewId: c.id,
        lastName: names.last,
        firstName: names.first,
        middleName: names.middle,
        position: slot.billet.title || positionLabel(c.lastPosition),
        nationality: nat.name,
        nationalityCode: nat.code,
        residence: nat.name,
        dob: c.dob ?? "",
        dobUs: formatMdY(c.dob),
        sex,
        idType: enoadIdType(id.nature),
        idNumber: id.number,
        idCountry: id.issuing === "USA" ? "UNITED STATES" : id.issuing,
        idExpiry: id.expiry,
        idExpiryUs: formatMdY(id.expiry),
        idExpired,
        embarkCountry: embarkCountry(embarkPort),
        embarkPort,
        embarkDate,
        embarkDateUs: formatMdY(embarkDate),
        phone: (c.cellPhone ?? c.homePhone ?? "").trim(),
        longshore: "No",
        missing,
      });
    }
  }
  return rows;
}

export function enoadFilename(kind: "csv" | "xls", date = todayUtc().toISOString().slice(0, 10)) {
  return `GEORGE-II-eNOAD-crew-${date || "list"}.${kind}`;
}

function csvCell(value: string) {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function buildEnoadCsv(rows: EnoadCrewRow[]): string {
  const lines = [ENOAD_COLUMNS.map((h) => csvCell(h)).join(",")];
  for (const r of rows) {
    lines.push(enoadCells(r).map(csvCell).join(","));
  }
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}

function enoadCells(r: EnoadCrewRow): string[] {
  return [
    r.lastName,
    r.firstName,
    r.middleName,
    r.position,
    r.nationality,
    r.residence,
    r.dobUs,
    r.sex,
    r.idType,
    r.idNumber,
    r.idCountry,
    r.idExpiryUs,
    r.embarkCountry,
    r.embarkPort,
    r.embarkDateUs,
    "",
    "",
    "",
    r.phone,
    r.longshore,
  ];
}

function xmlText(value: string) {
  const amp = String.fromCharCode(38);
  return value
    .replace(/&/g, `${amp}amp;`)
    .replace(/</g, `${amp}lt;`)
    .replace(/>/g, `${amp}gt;`)
    .replace(/"/g, `${amp}quot;`);
}

function ssCell(value: string) {
  return `<Cell><Data ss:Type="String">${xmlText(value)}</Data></Cell>`;
}

export function buildEnoadWorkbook(rows: EnoadCrewRow[], header: EnoadHeader): string {
  const notice = header.arrival && header.departure ? "Arrival and departure" : header.departure ? "Departure" : "Arrival";
  const ready = rows.filter((r) => r.missing.length === 0);
  const blocked = rows.filter((r) => r.missing.length > 0);
  const instructions = [
    ["M/V GEORGE II — crew list for eNOAD (USCG NVMC)"],
    [""],
    ["This file is the people on articles. It is not a full Notice of Arrival."],
    ["The Master or agent still files vessel, voyage, last five ports, cargo, and ISSC in eNOAD."],
    [""],
    ["How to file"],
    ["1. Open eNOAD and sign in (National Vessel Movement Center)."],
    ["2. Copy the last accepted notice, or start a new one. Update the arrival / departure port and date."],
    ["3. On Crew List, enter these names (or paste from the Crew sheet). Sex must be Male or Female."],
    ["4. Validate and submit. Do not email this spreadsheet to NVMC — they only accept the official workbook or XML of a complete notice."],
    [""],
    ["33 CFR 160.206 for each crewmember: full name, date of birth, nationality, passport or mariner’s document (type and number), position, and where they embarked."],
    ["Watch or billet trades do not require an eNOAD update."],
    [""],
    ["Vessel", VESSEL_PARTICULARS.displayName],
    ["IMO number", VESSEL_PARTICULARS.imo],
    ["Call sign", VESSEL_PARTICULARS.callSign],
    ["Flag", VESSEL_PARTICULARS.flag],
    ["Notice", notice],
    ["Port", header.port],
    ["Date", formatMdY(header.date) || header.date],
    ["Souls on board", String(rows.length)],
    ["Ready to file", String(ready.length)],
    ["Need a ticket first", String(blocked.length)],
  ];

  const crewRows = [
    `<Row>${ENOAD_COLUMNS.map((h) => ssCell(h)).join("")}</Row>`,
    ...rows.map((r) => `<Row>${enoadCells(r).map(ssCell).join("")}</Row>`),
  ];

  const needCols = ["No.", "Name", "Position", "What is missing", "Open the file"];
  const needRows = [
    `<Row>${needCols.map(ssCell).join("")}</Row>`,
    ...blocked.map(
      (r) =>
        `<Row>${[
          String(r.no),
          `${r.lastName}, ${r.firstName} ${r.middleName}`.replace(/\s+/g, " ").trim(),
          r.position,
          r.missing.join("; "),
          r.crewId,
        ]
          .map(ssCell)
          .join("")}</Row>`,
    ),
  ];

  const instructionRows = instructions.map((line) => `<Row>${line.map(ssCell).join("")}</Row>`);

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal"><Font ss:FontName="Calibri" ss:Size="11"/></Style>
 </Styles>
 <Worksheet ss:Name="Read me">
  <Table>${instructionRows.join("")}</Table>
 </Worksheet>
 <Worksheet ss:Name="Crew">
  <Table>${crewRows.join("")}</Table>
 </Worksheet>
 <Worksheet ss:Name="Needs a ticket">
  <Table>${needRows.join("")}</Table>
 </Worksheet>
</Workbook>
`;
}

export function downloadText(contents: string, filename: string, mime: string) {
  const blob = new Blob([contents], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4_000);
}
