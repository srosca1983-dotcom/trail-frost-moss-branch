import { c as VESSEL_PARTICULARS, n as COMPANY_ADDRESS, s as VESSEL, t as COMPANY } from "./types-DLRYosVU.mjs";
import { S as todayUtc, u as formatMdY, y as positionLabel } from "./ratings-WR-IukGV.mjs";
import { n as StandardFonts, r as rgb, t as PDFDocument } from "../_libs/pdf-lib.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/crew-list-C9XRi5ZX.js
var INK = rgb(.05, .08, .1);
var RULE = rgb(.15, .18, .2);
var MUTED = rgb(.35, .38, .4);
var DEFAULT_IMO_HEADER = {
	arrival: true,
	departure: false,
	voyageNumber: "",
	port: "",
	date: todayUtc().toISOString().slice(0, 10),
	lastPort: "",
	nextPort: ""
};
function flattenAboard(slots) {
	const ordered = [...slots].sort((a, b) => a.billet.sortOrder - b.billet.sortOrder || a.billet.code.localeCompare(b.billet.code));
	const rows = [];
	let no = 1;
	for (const slot of ordered) {
		const occupants = [...slot.occupants].sort((a, b) => (a.tour.signOn ?? "").localeCompare(b.tour.signOn ?? "") || a.crew.fullName.localeCompare(b.crew.fullName));
		for (const o of occupants) {
			const c = o.crew;
			const family = (c.lastName ?? "").trim() || lastFromFull(c.fullName);
			const given = [c.firstName, c.middleName].filter(Boolean).join(" ").trim() || givenFromFull(c.fullName, family);
			const id = identityDocument(c.passportNumber, c.passportExpiration, c.mmcNumber, c.mmcExpiration);
			const missing = [];
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
				missing
			});
		}
	}
	return rows;
}
function flattenWatchBill(slots) {
	const groups = [
		{
			watch: "12-4",
			label: "12–4",
			rows: []
		},
		{
			watch: "4-8",
			label: "4–8",
			rows: []
		},
		{
			watch: "8-12",
			label: "8–12",
			rows: []
		},
		{
			watch: "day",
			label: "Day",
			rows: []
		}
	];
	const byWatch = new Map(groups.map((g) => [g.watch, g]));
	const ordered = [...slots].sort((a, b) => a.billet.sortOrder - b.billet.sortOrder || a.billet.code.localeCompare(b.billet.code));
	for (const slot of ordered) {
		const key = slot.billet.watch;
		if (!key) continue;
		const g = byWatch.get(key);
		if (!g) continue;
		if (!slot.occupants.length) {
			g.rows.push({
				code: slot.billet.code,
				title: slot.billet.title,
				name: "VACANT",
				vacant: true
			});
			continue;
		}
		const occupants = [...slot.occupants].sort((a, b) => a.crew.fullName.localeCompare(b.crew.fullName));
		for (const o of occupants) g.rows.push({
			code: slot.billet.code,
			title: slot.billet.title,
			name: o.crew.fullName,
			vacant: false
		});
	}
	return groups;
}
function nationalityOf(raw) {
	const s = (raw ?? "").trim().toUpperCase();
	if (!s) return "USA";
	if (s === "US" || s === "USA" || s === "U.S." || s === "U.S.A." || s.includes("UNITED STATES") || s === "AMERICAN") return "USA";
	return raw.trim();
}
function genderOf(raw) {
	const s = (raw ?? "").trim().toUpperCase();
	if (!s) return "";
	if (s.startsWith("M") && !s.startsWith("MI")) return "M";
	if (s.startsWith("F")) return "F";
	if (s.startsWith("X") || s === "NB") return "X";
	return s.slice(0, 1);
}
function identityDocument(passportNumber, passportExpiration, mmcNumber, mmcExpiration) {
	if (passportNumber) return {
		nature: "Passport",
		number: passportNumber,
		issuing: "USA",
		expiry: passportExpiration ?? ""
	};
	if (mmcNumber) return {
		nature: "MMC",
		number: mmcNumber,
		issuing: "USA",
		expiry: mmcExpiration ?? ""
	};
	return {
		nature: "",
		number: "",
		issuing: "",
		expiry: ""
	};
}
function lastFromFull(full) {
	const parts = full.trim().split(/\s+/);
	return parts[parts.length - 1] ?? full;
}
function givenFromFull(full, family) {
	return full.replace(new RegExp(`\\s*${family}\\s*$`, "i"), "").trim() || full;
}
function ascii(text) {
	return text.replace(/[^\x20-\x7E]/g, " ").replace(/\s+/g, " ").trim();
}
function fit(font, text, size, maxWidth) {
	let t = ascii(text);
	if (!t) return "";
	if (font.widthOfTextAtSize(t, size) <= maxWidth) return t;
	while (t.length > 1 && font.widthOfTextAtSize(`${t}…`, size) > maxWidth) t = t.slice(0, -1);
	return `${t}…`;
}
function write(page, font, x, y, text, size, maxWidth, color = INK) {
	const t = maxWidth ? fit(font, text, size, maxWidth) : ascii(text);
	if (!t) return;
	page.drawText(t, {
		x,
		y,
		size,
		font,
		color
	});
}
function rect(page, x, y, w, h, thickness = .7) {
	page.drawRectangle({
		x,
		y,
		width: w,
		height: h,
		borderWidth: thickness,
		borderColor: RULE,
		color: void 0
	});
}
function hline(page, x1, x2, y, thickness = .5) {
	page.drawLine({
		start: {
			x: x1,
			y
		},
		end: {
			x: x2,
			y
		},
		thickness,
		color: RULE
	});
}
function vline(page, x, y1, y2, thickness = .5) {
	page.drawLine({
		start: {
			x,
			y: y1
		},
		end: {
			x,
			y: y2
		},
		thickness,
		color: RULE
	});
}
function us(d) {
	return formatMdY(d, false) || d;
}
function crewListFilename(kind, date = DEFAULT_IMO_HEADER.date) {
	return `GEORGE-II-${kind === "imo" ? "IMO-FAL5" : kind === "watch" ? "watch-bill" : "crew-list"}-${date || "list"}.pdf`;
}
async function buildGenericCrewListPdf(rows, issuedOn = DEFAULT_IMO_HEADER.date) {
	const pdf = await PDFDocument.create();
	const font = await pdf.embedFont(StandardFonts.TimesRoman);
	const bold = await pdf.embedFont(StandardFonts.TimesRomanBold);
	const pageW = 612;
	const pageH = 792;
	const margin = 36;
	const cols = [
		{
			key: "no",
			label: "No.",
			w: 24
		},
		{
			key: "name",
			label: "Name (family, given)",
			w: 148
		},
		{
			key: "rank",
			label: "Rank / rating",
			w: 92
		},
		{
			key: "nat",
			label: "Nat.",
			w: 36
		},
		{
			key: "dob",
			label: "Date of birth",
			w: 68
		},
		{
			key: "pob",
			label: "Place of birth",
			w: 92
		},
		{
			key: "sex",
			label: "Sex",
			w: 24
		},
		{
			key: "id",
			label: "Passport / MMC",
			w: 92
		}
	];
	const tableW = cols.reduce((n, c) => n + c.w, 0);
	const rowH = 16;
	const headerH = 18;
	const perPage = 32;
	const pages = Math.max(1, Math.ceil(rows.length / perPage));
	for (let p = 0; p < pages; p++) {
		const page = pdf.addPage([pageW, pageH]);
		let y = 756;
		write(page, bold, margin, y - 12, COMPANY.toUpperCase(), 11);
		write(page, font, margin, y - 26, COMPANY_ADDRESS, 8, 320, MUTED);
		write(page, font, 416, y - 12, `Page ${p + 1} of ${pages}`, 8, 160, MUTED);
		y -= 42;
		write(page, bold, margin, y, "CREW LIST", 16);
		y -= 16;
		write(page, font, margin, y, `${VESSEL}  ·  IMO ${VESSEL_PARTICULARS.imo}  ·  Call sign ${VESSEL_PARTICULARS.callSign}  ·  Flag ${VESSEL_PARTICULARS.flagCode}`, 8, 540);
		y -= 12;
		write(page, font, margin, y, `Port of registry ${VESSEL_PARTICULARS.portOfRegistry}  ·  Date ${us(issuedOn)}  ·  ${rows.length} souls on board`, 8, 540);
		y -= 20;
		const tableTop = y;
		const tableBot = y - headerH - Math.min(perPage, rows.length - p * perPage) * rowH;
		rect(page, margin, tableBot, tableW, tableTop - tableBot, .9);
		let x = margin;
		for (const col of cols) {
			write(page, bold, x + 3, y - 12, col.label, 7, col.w - 6);
			x += col.w;
			if (x < margin + tableW) vline(page, x, tableBot, tableTop);
		}
		hline(page, margin, margin + tableW, y - headerH, .8);
		y -= headerH;
		const slice = rows.slice(p * perPage, (p + 1) * perPage);
		for (const r of slice) {
			x = margin;
			[
				String(r.no),
				r.fullName,
				r.rank,
				r.nationality,
				us(r.dob),
				r.placeOfBirth,
				r.gender,
				r.idNumber ? `${r.idNature} ${r.idNumber}` : ""
			].forEach((cell, i) => {
				write(page, font, x + 3, y - 11, cell, 7.5, cols[i].w - 6);
				x += cols[i].w;
			});
			y -= rowH;
			hline(page, margin, margin + tableW, y, .3);
		}
		write(page, font, margin, 42, "Master / authorized officer", 8, 200, MUTED);
		hline(page, margin, 216, 36, .6);
		write(page, font, 256, 42, "Date", 8, 80, MUTED);
		hline(page, 256, 356, 36, .6);
	}
	return pdf.save();
}
async function buildImoCrewListPdf(rows, header = DEFAULT_IMO_HEADER) {
	const pdf = await PDFDocument.create();
	const font = await pdf.embedFont(StandardFonts.TimesRoman);
	const bold = await pdf.embedFont(StandardFonts.TimesRomanBold);
	const pageW = 841.89;
	const pageH = 595.28;
	const margin = 22;
	const cols = [
		{
			key: "no",
			label: "6. No.",
			w: 22
		},
		{
			key: "fam",
			label: "7. Family name",
			w: 78
		},
		{
			key: "giv",
			label: "8. Given names",
			w: 86
		},
		{
			key: "rank",
			label: "9. Rank or rating",
			w: 78
		},
		{
			key: "nat",
			label: "10. Nationality",
			w: 52
		},
		{
			key: "dob",
			label: "11. Date of birth",
			w: 58
		},
		{
			key: "pob",
			label: "12. Place of birth",
			w: 72
		},
		{
			key: "sex",
			label: "13. Gender",
			w: 36
		},
		{
			key: "natid",
			label: "14. Nature of ID",
			w: 54
		},
		{
			key: "num",
			label: "15. Number of ID",
			w: 78
		},
		{
			key: "iss",
			label: "16. Issuing State",
			w: 56
		},
		{
			key: "exp",
			label: "17. Expiry date of ID",
			w: 66
		}
	];
	const tableW = cols.reduce((n, c) => n + c.w, 0);
	const rowH = 14;
	const headerH = 22;
	const perPage = 22;
	const pages = Math.max(1, Math.ceil(rows.length / perPage));
	for (let p = 0; p < pages; p++) {
		const page = pdf.addPage([pageW, pageH]);
		let y = 573.28;
		write(page, bold, margin, y - 10, "CREW LIST", 14);
		write(page, font, 114, y - 8, "(IMO FAL Form 5)", 9, 140, MUTED);
		write(page, font, 609.89, y - 6, "Arrival", 8);
		box(page, 651.89, y - 8, 9, 9, header.arrival);
		write(page, font, 671.89, y - 6, "Departure", 8);
		box(page, 729.89, y - 8, 9, 9, header.departure);
		write(page, font, 749.89, y - 6, `Page ${p + 1} of ${pages}`, 8, 70, MUTED);
		y -= 18;
		const gridH = 46;
		rect(page, margin, y - gridH, tableW, gridH, .8);
		const half = tableW / 2;
		vline(page, margin + half, y - gridH, y);
		hline(page, margin, margin + tableW, y - gridH / 2);
		write(page, font, 26, y - 12, `1.1 Name of ship   ${VESSEL_PARTICULARS.displayName}`, 8, half - 8);
		write(page, font, 26, y - 24, `1.2 IMO number     ${VESSEL_PARTICULARS.imo}`, 8, half - 8);
		write(page, font, margin + half + 4, y - 12, `1.3 Call sign      ${VESSEL_PARTICULARS.callSign}`, 8, half - 8);
		write(page, font, margin + half + 4, y - 24, `1.4 Voyage number  ${header.voyageNumber || ""}`, 8, half - 8);
		write(page, font, 26, y - 36, `2. Port of arrival/departure   ${header.port || ""}`, 8, half - 8);
		write(page, font, 26, y - 46, `3. Date of arrival/departure   ${us(header.date)}`, 8, half - 8);
		write(page, font, margin + half + 4, y - 36, `4. Flag State of ship   ${VESSEL_PARTICULARS.flag}`, 8, half - 8);
		write(page, font, margin + half + 4, y - 46, `5. Last port of call   ${header.lastPort || ""}`, 8, half - 8);
		y -= 54;
		const tableTop = y;
		const slice = rows.slice(p * perPage, (p + 1) * perPage);
		const tableBot = y - headerH - slice.length * rowH;
		rect(page, margin, tableBot, tableW, tableTop - tableBot, .9);
		let x = margin;
		for (const col of cols) {
			write(page, bold, x + 2, y - 14, col.label, 6.5, col.w - 4);
			x += col.w;
			if (x < margin + tableW) vline(page, x, tableBot, tableTop);
		}
		hline(page, margin, margin + tableW, y - headerH, .8);
		y -= headerH;
		for (const r of slice) {
			x = margin;
			[
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
				us(r.idExpiry)
			].forEach((cell, i) => {
				write(page, font, x + 2, y - 10, cell, 7, cols[i].w - 4);
				x += cols[i].w;
			});
			y -= rowH;
			hline(page, margin, margin + tableW, y, .3);
		}
		write(page, font, margin, 28, "18. Date and signature by master, authorized agent or officer", 8, 400, MUTED);
		hline(page, 362, 542, 26, .6);
		write(page, font, 552, 28, us(header.date), 8, 80, MUTED);
	}
	return pdf.save();
}
async function buildWatchBillPdf(groups, issuedOn = DEFAULT_IMO_HEADER.date) {
	const pdf = await PDFDocument.create();
	const font = await pdf.embedFont(StandardFonts.Helvetica);
	const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
	const page = pdf.addPage([792, 612]);
	const margin = 28;
	write(page, bold, margin, 584, COMPANY.toUpperCase(), 10);
	write(page, font, margin, 570, `${VESSEL}  ·  IMO ${VESSEL_PARTICULARS.imo}  ·  ${us(issuedOn)}`, 9, 480, MUTED);
	write(page, bold, margin, 548, "WATCH BILL", 18);
	write(page, font, 564, 584, "Wheelhouse / mess", 9, 200, MUTED);
	const colW = 175;
	groups.forEach((g, i) => {
		const x = margin + i * 187;
		page.drawRectangle({
			x,
			y: 36,
			width: colW,
			height: 492,
			borderColor: RULE,
			borderWidth: .8
		});
		write(page, bold, x + 8, 510, g.label, 13);
		write(page, font, x + 8, 496, `${g.rows.filter((r) => !r.vacant).length} on watch`, 8, 159, MUTED);
		let y = 478;
		for (const r of g.rows) {
			write(page, font, x + 8, y, r.title, 7, 159, MUTED);
			y -= 12;
			write(page, r.vacant ? font : bold, x + 8, y, r.name, 10, 159, r.vacant ? MUTED : INK);
			y -= 18;
			if (y < 50) break;
		}
	});
	write(page, font, margin, 22, "Watch follows the job. Print for the wheelhouse and the mess.", 8, 500, MUTED);
	return pdf.save();
}
function box(page, x, y, w, h, checked) {
	rect(page, x, y, w, h, .8);
	if (checked) {
		page.drawLine({
			start: {
				x: x + 1.5,
				y: y + 2
			},
			end: {
				x: x + w / 2,
				y: y + h - 1.5
			},
			thickness: 1,
			color: INK
		});
		page.drawLine({
			start: {
				x: x + w / 2,
				y: y + h - 1.5
			},
			end: {
				x: x + w - 1.5,
				y: y + 1.5
			},
			thickness: 1,
			color: INK
		});
	}
}
function downloadPdf(bytes, filename) {
	const copy = new Uint8Array(bytes.byteLength);
	copy.set(bytes);
	const blob = new Blob([copy], { type: "application/pdf" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.click();
	setTimeout(() => URL.revokeObjectURL(url), 4e3);
}
//#endregion
export { crewListFilename as a, flattenWatchBill as c, buildWatchBillPdf as i, identityDocument as l, buildGenericCrewListPdf as n, downloadPdf as o, buildImoCrewListPdf as r, flattenAboard as s, DEFAULT_IMO_HEADER as t, nationalityOf as u };
