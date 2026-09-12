import { c as VESSEL_PARTICULARS } from "./types-DLRYosVU.mjs";
import { S as todayUtc, a as daysUntil, u as formatMdY, y as positionLabel } from "./ratings-WR-IukGV.mjs";
import { a as embarkCountry } from "./ports-C0XwVrj0.mjs";
import { l as identityDocument, u as nationalityOf } from "./crew-list-C9XRi5ZX.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/enoad-DcToIuEP.js
var ENOAD_COLUMNS = [
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
	"Performing Longshore Work in U.S.?"
];
function enoadSex(raw) {
	const s = (raw ?? "").trim().toUpperCase();
	if (!s) return "";
	if (s.startsWith("F")) return "Female";
	if (s === "M" || s.startsWith("MALE") || s.startsWith("M") && !s.startsWith("MI")) return "Male";
	return "";
}
function enoadNationality(raw) {
	const code = nationalityOf(raw);
	if (code === "USA" || code === "US") return {
		name: "UNITED STATES",
		code: "US"
	};
	return {
		name: code,
		code: code.replace(/[^A-Z]/gi, "").slice(0, 2).toUpperCase() || code
	};
}
function enoadIdType(nature) {
	if (nature === "Passport") return "Passport";
	if (nature === "MMC") return "Merchant Mariner Document";
	return nature;
}
function splitNames(fullName, first, middle, last) {
	const family = (last ?? "").trim() || (fullName.trim().split(/\s+/).pop() ?? fullName);
	const givenFirst = (first ?? "").trim();
	const givenMiddle = (middle ?? "").trim();
	if (givenFirst) return {
		last: family,
		first: givenFirst,
		middle: givenMiddle
	};
	const parts = (fullName.replace(new RegExp(`\\s*${family}\\s*$`, "i"), "").trim() || fullName).split(/\s+/);
	return {
		last: family,
		first: parts[0] ?? "",
		middle: parts.slice(1).join(" ")
	};
}
function flattenEnoad(slots) {
	const ordered = [...slots].sort((a, b) => a.billet.sortOrder - b.billet.sortOrder || a.billet.code.localeCompare(b.billet.code));
	const rows = [];
	let no = 1;
	for (const slot of ordered) {
		const occupants = [...slot.occupants].sort((a, b) => (a.tour.signOn ?? "").localeCompare(b.tour.signOn ?? "") || a.crew.fullName.localeCompare(b.crew.fullName));
		for (const o of occupants) {
			const c = o.crew;
			const names = splitNames(c.fullName, c.firstName, c.middleName, c.lastName);
			const id = identityDocument(c.passportNumber, c.passportExpiration, c.mmcNumber, c.mmcExpiration);
			const nat = enoadNationality(c.citizenship);
			const sex = enoadSex(c.sex);
			const embarkPort = (o.tour.port ?? "").trim();
			const embarkDate = o.tour.signOn ?? c.lastSignOn ?? "";
			const idExpired = Boolean(id.expiry && (daysUntil(id.expiry) ?? 0) < 0);
			const missing = [];
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
				missing
			});
		}
	}
	return rows;
}
function enoadFilename(kind, date = todayUtc().toISOString().slice(0, 10)) {
	return `GEORGE-II-eNOAD-crew-${date || "list"}.${kind}`;
}
function csvCell(value) {
	if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, "\"\"")}"`;
	return value;
}
function buildEnoadCsv(rows) {
	const lines = [ENOAD_COLUMNS.map((h) => csvCell(h)).join(",")];
	for (const r of rows) lines.push(enoadCells(r).map(csvCell).join(","));
	return `\uFEFF${lines.join("\r\n")}\r\n`;
}
function enoadCells(r) {
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
		r.longshore
	];
}
function xmlText(value) {
	const amp = String.fromCharCode(38);
	return value.replace(/&/g, `${amp}amp;`).replace(/</g, `${amp}lt;`).replace(/>/g, `${amp}gt;`).replace(/"/g, `${amp}quot;`);
}
function ssCell(value) {
	return `<Cell><Data ss:Type="String">${xmlText(value)}</Data></Cell>`;
}
function buildEnoadWorkbook(rows, header) {
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
		["Need a ticket first", String(blocked.length)]
	];
	const crewRows = [`<Row>${ENOAD_COLUMNS.map((h) => ssCell(h)).join("")}</Row>`, ...rows.map((r) => `<Row>${enoadCells(r).map(ssCell).join("")}</Row>`)];
	const needRows = [`<Row>${[
		"No.",
		"Name",
		"Position",
		"What is missing",
		"Open the file"
	].map(ssCell).join("")}</Row>`, ...blocked.map((r) => `<Row>${[
		String(r.no),
		`${r.lastName}, ${r.firstName} ${r.middleName}`.replace(/\s+/g, " ").trim(),
		r.position,
		r.missing.join("; "),
		r.crewId
	].map(ssCell).join("")}</Row>`)];
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
  <Table>${instructions.map((line) => `<Row>${line.map(ssCell).join("")}</Row>`).join("")}</Table>
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
function downloadText(contents, filename, mime) {
	const blob = new Blob([contents], { type: mime });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.click();
	setTimeout(() => URL.revokeObjectURL(url), 4e3);
}
//#endregion
export { flattenEnoad as a, enoadFilename as i, buildEnoadWorkbook as n, downloadText as r, buildEnoadCsv as t };
