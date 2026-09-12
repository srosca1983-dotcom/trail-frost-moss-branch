import { i as PACKET_TEMPLATE_URL, n as COMPANY_ADDRESS, t as COMPANY } from "./types-DLRYosVU.mjs";
import { c as expiryTone, u as formatMdY, y as positionLabel } from "./ratings-WR-IukGV.mjs";
import { n as StandardFonts, r as rgb, t as PDFDocument } from "../_libs/pdf-lib.mjs";
import { s as needsSmsHazmat } from "./sms-training-gdj5DqvS.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/fill-packet-DnOdnJLk.js
var PACKET_PAGE_INDEX = {
	cover: [0],
	per003: [1],
	policies: [2],
	physical: [3, 4],
	medical: [5],
	dot: [6],
	w4: [7],
	deposit: [8],
	i9: [9],
	fam: [10, 11],
	hazmatQuiz: [12],
	cyber: [15],
	internet: [
		16,
		17,
		18
	]
};
var PACKET_PAGE_LABEL = {
	cover: "Cover checklist",
	per003: "SRO-PER-003 Sign-on information",
	policies: "SRO-PER-002 Acknowledgement of SRO policies",
	physical: "SRO-PER-001 Statement of physical condition",
	medical: "SMM-PER-05-AP2 Medical sign-on",
	dot: "SRO-PER-008 DOT drug & alcohol release",
	w4: "Federal W-4",
	deposit: "SRO-PAY-002 Direct deposit",
	i9: "Form I-9",
	fam: "SMM-PER-05-AP1 Familiarization checklist",
	hazmatQuiz: "HAZMAT quiz (use the HAZMAT desk — not this packet page)",
	cyber: "SMM-SMM-08-AP3 Cyber security training",
	internet: "SMM-SMM-08-AP4 Internet usage policy"
};
var EXTRA_FORM_LABEL = {
	"mmp-401k-enroll": "MM&P 401(k) enrollment",
	"mmp-401k-optout": "MM&P 401(k) opt-out",
	"meba-401k": "MEBA 401(k) enrollment",
	"siu-401k": "SIU Empower 401(k)",
	"meba-ot": "MEBA converted overtime worksheet",
	"door-tag": "Door nametag",
	"hazmat-cert": "HAZMAT training certificate"
};
/**
* SRO-CM-06 Crew Changes and Travel + SMM-PER-05 Familiarization (rev 5, 28 Aug 2026).
* New joiners get the full company packet. Returning crew only get what the book
* still requires this assignment — plus familiarization every time they come back.
*/
function paperworkForJoining(opts) {
	const pages = [];
	const extras = [];
	const forms = [];
	const notes = [];
	const union = (opts.unionHall ?? "").toUpperCase();
	function addPage(key, why, required = true) {
		if (!pages.includes(key)) pages.push(key);
		forms.push({
			key,
			label: PACKET_PAGE_LABEL[key],
			why,
			required
		});
	}
	function addExtra(key, why, required = true) {
		if (!extras.includes(key)) extras.push(key);
		forms.push({
			key,
			label: EXTRA_FORM_LABEL[key],
			why,
			required
		});
	}
	addPage("cover", "Checklist of this joining.");
	addPage("policies", "SRO-CM-06 — SRO-PER-002 every assignment, new or returning.");
	addPage("physical", "SRO-CM-06 — SRO-PER-001 every assignment.");
	addPage("medical", "SMM-PER-05 — medical sign-on (AP2) at the Master’s interview.");
	addPage("fam", "SMM-PER-05 rev 5 — familiarization applies to new employees and permanents re-joining. Section 1 before sailing; 24h / 72h after.");
	if (!opts.returning) {
		addPage("per003", "SRO-CM-06 4.1 — sign-on information for a first joining.");
		addPage("dot", "SRO-CM-06 4.1 — SRO-PER-008 DOT release. Scan to the office after sign-on.");
		addPage("w4", "SRO-CM-06 4.1 — W-4 on a first joining.");
		addPage("i9", "SRO-CM-06 4.1 — I-9 on a first joining.");
		addPage("deposit", "SRO-CM-06 4.1 — direct deposit if they want pay in the bank. Name only; account stays blank.", false);
		notes.push("New to the vessel — full SRO-CM-06 4.1 packet.");
	} else {
		notes.push("Returning — SRO-CM-06 4.2. MMC, drug-free card, and medical certificate checked every time.");
		if (opts.identityChanged) addPage("per003", "SRO-CM-06 4.2 — sign-on information only if anything changed.");
		else notes.push("Sign-on information (PER-003) skipped unless address, NOK, or tickets changed.");
		if (opts.w4Needed) addPage("w4", "SRO-CM-06 4.2 — W-4 only if needed.");
		if (opts.depositChanged) addPage("deposit", "SRO-CM-06 4.2 — direct deposit only if they want a change. Account stays blank.", false);
	}
	if (opts.cyberExpired) addPage("cyber", "SMM-PER-05 — confirm / renew cyber training if it is not current.");
	if (opts.internetExpired) addPage("internet", "SMM-PER-05 — confirm / renew internet usage policy if it is not current.");
	if (union === "MMP") {
		if (opts.enroll401k) addExtra("mmp-401k-enroll", "SRO-CM-06 — 401(k) if desired. Contribution % left blank.");
		else addExtra("mmp-401k-optout", "MM&P opt-out is required each assignment if they are not enrolling.");
	} else if (union === "MEBA") {
		addExtra("meba-401k", "SRO-CM-06 — MEBA 401(k). Name and employer only; elections left blank unless they enroll.", false);
		addExtra("meba-ot", "MEBA vacation plan — converted OT worksheet, filed with vacation pay. Hours left blank.", false);
	} else if (union === "SIU") addExtra("siu-401k", opts.enroll401k ? "SIU AGLIW Empower 401(k) — identity filled, elections blank." : "SIU AGLIW Empower 401(k) — decline checked; they can enroll later.");
	addExtra("door-tag", "Cabin door nametag for the person joining only — not the rest of the crew.");
	if (needsSmsHazmat(opts.position) && (opts.hazmatExpired ?? true)) addExtra("hazmat-cert", "SMM-PER-06 H = 1 per vessel if carrying HAZMAT. Deck officers. Current company form cites 49 CFR 172.704 but does not record a test — print only if the 3-year card is missing or expired.");
	return {
		packetPages: pages,
		extras,
		forms,
		notes
	};
}
var TICKET_SPEC = [
	{
		code: "MMC",
		label: "Merchant Mariner Credential",
		types: ["mmc"],
		required: true,
		note: "SRO-CM-06 — check every joining."
	},
	{
		code: "MEDICAL",
		label: "Medical certificate",
		types: ["medical"],
		required: true,
		note: "SRO-CM-06 — check every joining."
	},
	{
		code: "DRUG_FREE",
		label: "Drug-free / chemical test",
		types: ["drug_free"],
		required: true,
		note: "SRO-CM-06 — check every joining."
	},
	{
		code: "PASSPORT",
		label: "Passport",
		types: ["passport"],
		required: true
	},
	{
		code: "TWIC",
		label: "TWIC",
		types: ["twic"],
		required: true
	},
	{
		code: "STCW",
		label: "STCW / Basic Training",
		types: ["stcw", "bst"],
		required: true
	},
	{
		code: "SASH",
		label: "SOCP SASH",
		types: ["sash"],
		required: true,
		note: "SMM-PER-05 — confirm / renew if required."
	},
	{
		code: "FAM",
		label: "Familiarization (NSE record)",
		types: ["fam"],
		required: true,
		note: "Checklist is still filled this joining even if last year’s card is current."
	},
	{
		code: "CYBER",
		label: "Cyber security",
		types: ["cyber"],
		required: true
	},
	{
		code: "INTERNET",
		label: "Internet usage",
		types: ["internet"],
		required: true
	},
	{
		code: "HAZMAT",
		label: "HAZMAT training",
		types: ["hazmat"],
		required: false,
		note: "SMM-PER-06 H for deck officers. 3-year 49 CFR 172.704 card. Do not auto-issue for the whole crew."
	}
];
function ticketsForPerson(p) {
	const docs = p.documents ?? [];
	return TICKET_SPEC.map((spec) => {
		let expiresOn = spec.types.map((t) => docs.find((d) => d.docType === t)).filter((d) => Boolean(d)).map((d) => d.expiresOn).find(Boolean) ?? null;
		if (spec.code === "MMC" && !expiresOn) expiresOn = p.mmcExpiration;
		if (spec.code === "PASSPORT" && !expiresOn) expiresOn = p.passportExpiration;
		return {
			code: spec.code,
			label: spec.label,
			expiresOn,
			tone: expiryTone(expiresOn),
			required: spec.code === "HAZMAT" ? needsSmsHazmat(p.lastPosition) : spec.required,
			note: spec.note
		};
	});
}
function union401kLabel(union) {
	const u = (union ?? "").toUpperCase();
	if (u === "MMP") return "MM&P 401(k)";
	if (u === "MEBA") return "MEBA 401(k)";
	if (u === "SIU") return "SIU Empower 401(k)";
	return "401(k)";
}
function needsRenew(tone) {
	return tone === "expired" || tone === "missing" || tone === "soon";
}
var DOOR_RANK_BY_CODE = {
	"00": "Captain",
	"01": "Chief Mate",
	"02": "Second Mate",
	"03": "Third Mate",
	"04": "Boatswain",
	"05": "AB Day 12 x 4",
	"06": "AB Day 4 x 8",
	"07": "AB watch 12 x 4",
	"08": "AB watch 4 x 8",
	"09": "AB watch 8 x 12",
	"10": "Chief Engineer",
	"11": "First Engineer",
	"12": "Second Engineer 4 x 8",
	"13": "Third Engineer 8 x 12",
	"14": "Third Engineer 12 x 4",
	"15": "Electrician",
	"16": "QMED 12 x 4",
	"17": "QMED 4 x 8",
	"18": "QMED 8 x 12",
	"19": "Deck Engine Utility",
	"20": "Steward",
	"21": "Cook",
	"22": "Steward Assistant",
	"24": "Second Engineer day",
	"25": "Deck Cadet",
	"26": "Engine Cadet",
	"27": "S.I.U. Apprentice - A",
	"28": "S.I.U. Apprentice - B"
};
/** Rank line on the cabin tag — matches the ship’s door-tag template. */
function doorRank(billetCode, position, watch) {
	if (billetCode && DOOR_RANK_BY_CODE[billetCode]) return DOOR_RANK_BY_CODE[billetCode];
	const p = (position ?? "").toUpperCase().replace(/×/g, "X").replace(/\s+/g, " ").trim();
	const w = (watch ?? "").replace(/–/g, "-");
	if (/MASTER|\bCAPT/.test(p)) return "Captain";
	if (/CHIEF MATE|\bC\/M\b/.test(p)) return "Chief Mate";
	if (/SECOND MATE|\b2\/M\b/.test(p)) return "Second Mate";
	if (/THIRD MATE|\b3\/M\b/.test(p)) return "Third Mate";
	if (/BOATSWAIN|\bBOSUN\b/.test(p)) return "Boatswain";
	if (/AB\s*DAY|ABLE.*DAY/.test(p)) {
		if (w === "4-8") return "AB Day 4 x 8";
		return "AB Day 12 x 4";
	}
	if (/AB\/W|AB W|ABLE.*WATCH|\bAB\b/.test(p)) {
		if (w === "4-8") return "AB watch 4 x 8";
		if (w === "8-12") return "AB watch 8 x 12";
		return "AB watch 12 x 4";
	}
	if (/CHIEF ENG|\bC\/E\b/.test(p)) return "Chief Engineer";
	if (/1ST A|FIRST A|\b1A\/E\b/.test(p)) return "First Engineer";
	if (/2ND A|SECOND A|\b2A\/E\b|2 A\/E/.test(p)) {
		if (w === "day") return "Second Engineer day";
		return "Second Engineer 4 x 8";
	}
	if (/3RD A|THIRD A|\b3A\/E\b|3 A\/E/.test(p)) {
		if (w === "8-12") return "Third Engineer 8 x 12";
		return "Third Engineer 12 x 4";
	}
	if (/ELECTRIC|\bQEE\b/.test(p)) return "Electrician";
	if (/\bQMED\b/.test(p)) {
		if (w === "4-8") return "QMED 4 x 8";
		if (w === "8-12") return "QMED 8 x 12";
		return "QMED 12 x 4";
	}
	if (/\bDEU\b|DECK ENGINE/.test(p)) return "Deck Engine Utility";
	if (/STEWARD ASS/.test(p)) return "Steward Assistant";
	if (/\bSTEWARD\b/.test(p)) return "Steward";
	if (/\bCOOK\b/.test(p)) return "Cook";
	if (/DECK CADET/.test(p)) return "Deck Cadet";
	if (/ENGINE CADET|CADET ENG/.test(p)) return "Engine Cadet";
	if (/APPRENTICE A/.test(p)) return "S.I.U. Apprentice - A";
	if (/APPRENTICE B/.test(p)) return "S.I.U. Apprentice - B";
	return positionLabel(position);
}
var INK = rgb(.05, .12, .28);
function ascii(text) {
	return text.replace(/[^\x20-\x7E]/g, " ").replace(/\s+/g, " ").trim();
}
function fit(font, text, size, maxWidth) {
	let t = ascii(text);
	if (!t) return "";
	if (font.widthOfTextAtSize(t, size) <= maxWidth) return t;
	while (t.length > 2 && font.widthOfTextAtSize(`${t}...`, size) > maxWidth) t = t.slice(0, -1);
	return `${t}...`;
}
function us2(d) {
	return formatMdY(d, true);
}
function us4(d) {
	return formatMdY(d, false);
}
function cityLine(p) {
	return [
		p.city,
		p.state,
		p.zip
	].filter(Boolean).join(", ");
}
function isUs(citizenship) {
	const v = (citizenship ?? "").toUpperCase();
	return v === "US" || v === "USA" || v === "UNITED STATES" || v === "U.S." || v === "U.S.A." || v === "AMERICAN";
}
function maritalIsSingle(v) {
	return (v ?? "").toLowerCase().includes("single");
}
function maritalIsMarried(v) {
	const s = (v ?? "").toLowerCase();
	return s.includes("married") && !s.includes("single");
}
function priorEmployer(p) {
	return p.previousEmployers.find((e) => !/sunrise|pasha/i.test(e.name)) ?? p.previousEmployers[0] ?? null;
}
function ratingOf(p) {
	const raw = (p.lastPosition || p.tour?.position || "").trim();
	if (!raw) return "";
	if (raw.length <= 8) return raw;
	return positionLabel(raw);
}
function lastFirst(p) {
	return [p.lastName, p.firstName].filter(Boolean).join(", ") || p.fullName;
}
function stateCode(raw) {
	const v = (raw ?? "").trim().toUpperCase();
	if (v.length === 2) return v;
	return {
		FLORIDA: "FL",
		HAWAII: "HI",
		CALIFORNIA: "CA",
		WASHINGTON: "WA",
		TEXAS: "TX",
		"NEW YORK": "NY",
		"NEW HAMPSHIRE": "NH",
		MICHIGAN: "MI",
		"NORTH CAROLINA": "NC",
		PENNSYLVANIA: "PA"
	}[v] ?? "";
}
function setText(form, name, value) {
	if (!value) return;
	try {
		const field = form.getTextField(name);
		field.setFontSize(9);
		field.setText(ascii(value).slice(0, 140));
	} catch {}
}
function setCheck(form, name, on) {
	try {
		const box = form.getCheckBox(name);
		if (on) box.check();
		else box.uncheck();
	} catch {}
}
function setDropdown(form, name, value) {
	if (!value) return;
	try {
		form.getDropdown(name).select(value);
	} catch {}
}
function markBox(page, font, form, name) {
	try {
		const box = form.getCheckBox(name);
		box.check();
		if (!page) return;
		for (const widget of box.acroField.getWidgets()) {
			const r = widget.getRectangle();
			const size = Math.min(9, Math.max(7, r.height - 1.5));
			writeAt(page, font, r.x + 1, r.y + 1.3, "X", size, Math.max(8, r.width - 1));
		}
	} catch {}
}
/** Draw text in crop-box space, PDF bottom-origin (same as pdf.js text items). */
function cropOrigin(page) {
	try {
		const c = page.getCropBox();
		return {
			x: c.x,
			y: c.y
		};
	} catch {
		return {
			x: 0,
			y: 0
		};
	}
}
function writeAt(page, font, x, y, value, size = 9, maxWidth = 220) {
	if (!value) return;
	const origin = cropOrigin(page);
	const text = fit(font, value, size, maxWidth);
	if (!text) return;
	page.drawText(text, {
		x: origin.x + x,
		y: origin.y + y,
		size,
		font,
		color: INK
	});
}
function markAt(page, font, x, y, size = 10) {
	writeAt(page, font, x, y, "X", size, 14);
}
async function loadPacketTemplate() {
	const res = await fetch(PACKET_TEMPLATE_URL);
	if (!res.ok) throw new Error("Could not load the blank SRO sign-on packet.");
	return res.arrayBuffer();
}
async function fillSignOnPacket(input, template) {
	const bytes = template ?? await loadPacketTemplate();
	const pdf = await PDFDocument.load(bytes);
	const font = await pdf.embedFont(StandardFonts.Helvetica);
	const pages = pdf.getPages();
	const form = pdf.getForm();
	const p = input.person;
	const start = input.startDate;
	const port = input.port || p.tour?.port || "";
	const rating = ratingOf(p);
	const include = input.include?.length ? input.include : void 0;
	const want = (key) => !include || include.includes(key);
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
		for (const field of form.getFields()) try {
			const anyField = field;
			if (typeof anyField.updateAppearances === "function") anyField.updateAppearances(font);
			else if (typeof anyField.defaultUpdateAppearances === "function") anyField.defaultUpdateAppearances(font);
		} catch {}
	} catch {}
	if (!include) return pdf.save({ updateFieldAppearances: false });
	try {
		form.flatten();
	} catch {}
	const keep = [];
	const seen = /* @__PURE__ */ new Set();
	for (const key of include) for (const i of PACKET_PAGE_INDEX[key] ?? []) {
		if (seen.has(i) || i < 0 || i >= pages.length) continue;
		seen.add(i);
		keep.push(i);
	}
	keep.sort((a, b) => a - b);
	const out = await PDFDocument.create();
	if (keep.length) {
		const copied = await out.copyPages(pdf, keep);
		for (const page of copied) out.addPage(page);
	}
	return out.save({ updateFieldAppearances: false });
}
function fillPer003(form, page, font, p, start, port, rating) {
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
	if (maritalIsSingle(p.maritalStatus) || !p.maritalStatus) setCheck(form, "Check Box32", true);
	else if (maritalIsMarried(p.maritalStatus)) setCheck(form, "Check Box33", true);
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
function fillPolicies(page, font, p, start) {
	if (!page) return;
	writeAt(page, font, 432, 678.2, us4(start), 10, 95);
	writeAt(page, font, 72, 661, p.lastName || p.fullName, 8, 70);
	writeAt(page, font, 60, 90, p.fullName, 8, 130);
}
function fillPhysical(p1, p2, font, p, start, rating) {
	if (p1) {
		writeAt(p1, font, 128, 698.4, p.fullName, 9, 150);
		writeAt(p1, font, 322, 697.9, rating, 9, 72);
		writeAt(p1, font, 470, 696.5, us2(p.dob), 9, 80);
		writeAt(p1, font, 360, 683, p.ssLast4, 9, 70);
	}
	if (p2) {
		writeAt(p2, font, 125, 677.3, p.fullName, 9, 140);
		writeAt(p2, font, 312, 677, rating, 9, 80);
		writeAt(p2, font, 458, 676.8, us2(p.dob), 9, 80);
		writeAt(p2, font, 385, 655.7, p.ssLast4, 9, 70);
		writeAt(p2, font, 320, 137.8, rating, 9, 140);
		writeAt(p2, font, 430, 98.2, us2(start), 9, 80);
	}
}
function fillMedical(page, font, p, start, rating) {
	if (!page) return;
	writeAt(page, font, 128, 607.2, p.fullName, 10, 210);
	writeAt(page, font, 418, 607.2, rating, 10, 85);
	if (!p.medications) markAt(page, font, 85, 537.8, 11);
	else markAt(page, font, 85, 481.9, 11);
	if (!p.allergies) markAt(page, font, 86, 316.6, 11);
	else {
		markAt(page, font, 86, 274.1, 11);
		writeAt(page, font, 100, 250, p.allergies, 9, 380);
	}
	if (p.glasses) {
		markAt(page, font, 87, 145.4, 11);
		if (p.spareGlasses) markAt(page, font, 87, 117.6, 11);
		else markAt(page, font, 138, 117.6, 11);
	} else markAt(page, font, 87, 173, 11);
	writeAt(page, font, 412, 76.8, us4(start), 10, 85);
}
function fillRelease(page, font, p, start) {
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
function fillW4(page, font, p, start) {
	if (!page) return;
	writeAt(page, font, 42, 715, [p.firstName, p.middleName ? `${p.middleName[0]}.` : ""].filter(Boolean).join(" "), 10, 220);
	writeAt(page, font, 282, 715, p.lastName, 10, 180);
	writeAt(page, font, 482, 715, p.ssLast4 ? `xxx-xx-${p.ssLast4}` : "", 9, 100);
	writeAt(page, font, 42, 687, p.addressLine, 9, 400);
	writeAt(page, font, 42, 662, cityLine(p), 9, 400);
	if (maritalIsMarried(p.maritalStatus)) markAt(page, font, 114.7, 614.5, 10);
	else if (maritalIsSingle(p.maritalStatus)) markAt(page, font, 114.7, 626.5, 10);
	writeAt(page, font, 42, 77, COMPANY, 8, 280);
	writeAt(page, font, 398, 77, us4(start), 8, 70);
}
function fillDirectDeposit(page, font, p) {
	if (!page) return;
	markAt(page, font, 136, 653, 10);
	writeAt(page, font, 138, 592.8, p.fullName, 9, 155);
	writeAt(page, font, 418, 592.8, p.ssLast4, 9, 45);
	writeAt(page, font, 75, 359.5, p.lastName || p.fullName, 9, 130);
}
function inkField(page, font, form, name, value, size = 8) {
	if (!value) return;
	try {
		const field = form.getTextField(name);
		for (const widget of field.acroField.getWidgets()) {
			const r = widget.getRectangle();
			writeAt(page, font, r.x + 2, r.y + 3.2, value, size, Math.max(24, r.width - 4));
		}
	} catch {}
}
function fillI9(form, page, font, p, start, officerName) {
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
	if (officerName) setText(form, "Last Name First Name and Title of Employer or Authorized Representative", officerName);
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
	if (officerName) inkField(page, font, form, "Last Name First Name and Title of Employer or Authorized Representative", officerName, 8);
	inkField(page, font, form, "S2 Todays Date mmddyyyy", us4(start));
}
function fillFamRow(page, font, y, initials, start) {
	writeAt(page, font, 430, y, initials, 8, 36);
	writeAt(page, font, 536, y, us2(start), 7, 36);
}
function fillFamRows(page, font, ys, initials, start) {
	for (const y of ys) fillFamRow(page, font, y, initials, start);
}
function fillFamiliarization(p1, p2, font, p, start, rating, initialsRaw, department, officerName) {
	const initials = ascii(initialsRaw).slice(0, 6).toUpperCase();
	const officer = ascii(officerName ?? "") || initials;
	if (p1) {
		writeAt(p1, font, 58, 663.5, lastFirst(p), 9, 120);
		writeAt(p1, font, 185, 663.5, rating, 9, 120);
		writeAt(p1, font, 328, 663.5, "George II", 9, 150);
		writeAt(p1, font, 506, 663.5, us4(start), 9, 70);
		if (initials) fillFamRows(p1, font, [
			565,
			541,
			524,
			501,
			484,
			461,
			447,
			423,
			409,
			374,
			351,
			337,
			302,
			288,
			273,
			250,
			227,
			213,
			189,
			175,
			160,
			128,
			93
		], initials, start);
	}
	if (p2 && initials) {
		fillFamRows(p2, font, [
			637,
			602,
			578,
			555,
			532,
			509,
			474,
			460,
			437,
			422,
			407,
			393,
			378
		], initials, start);
		if (department === "deck") fillFamRows(p2, font, [
			329,
			283,
			269,
			255,
			240
		], initials, start);
		else if (department === "engine") fillFamRows(p2, font, [
			217,
			194,
			179,
			165
		], initials, start);
		else fillFamRows(p2, font, [142, 127], initials, start);
		fillFamRow(p2, font, 113, initials, start);
		if (officer) writeAt(p2, font, 298, 70, officer, 9, 250);
	}
}
function currentOn(expires, asOf) {
	if (!expires) return true;
	return expires >= asOf;
}
function fillCover(page, font, p, start, rating) {
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
	const rows = [
		[true, 729.7],
		[true, 709],
		[true, 688.2],
		[true, 667.6],
		[true, 646.8],
		[true, 626.2],
		[true, 605],
		[true, 583.9],
		[passportOn, 564.2],
		[mmcOn, 544.4],
		[medicalOn, 524.6],
		[twicOn, 505],
		[dispatchOn, 485.2],
		[drugOn, 445.7],
		[true, 385.4],
		[types.has("cyber"), 364.7],
		[types.has("sash"), 343.7],
		[true, 322.6],
		[types.has("radio"), 302.4]
	];
	for (const [on, y] of rows) if (on) markAt(page, font, 48, y, 11);
}
function fillHazmat(page, font, p) {
	if (!page) return;
	writeAt(page, font, 76, 744.7, p.fullName, 10, 160);
	const trueX = 449;
	const falseX = 494;
	for (const [y, isTrue] of [
		[641.3, true],
		[613.2, true],
		[598.9, true],
		[570.8, false],
		[542.8, false],
		[528.4, false],
		[500.3, true],
		[472.2, true],
		[444.1, true],
		[416, true]
	]) markAt(page, font, isTrue ? trueX : falseX, y, 11);
}
function fillCyber(page, font, p, start, officerName) {
	if (!page) return;
	writeAt(page, font, 62, 618, lastFirst(p), 10, 175);
	writeAt(page, font, 400, 618, us4(start), 10, 80);
	if (officerName) writeAt(page, font, 62, 411, ascii(officerName), 10, 220);
}
function fillInternet(page, font, p, start, _officerName) {
	if (!page) return;
	writeAt(page, font, 62, 607, lastFirst(p), 10, 190);
	writeAt(page, font, 276, 607, "George II", 10, 170);
	writeAt(page, font, 482, 607, us4(start), 10, 75);
}
function packetFilename(p, startDate) {
	return `George-II-Sign-On-${(p.lastName || p.fullName || "crew").replace(/[^A-Za-z0-9]+/g, "")}-${startDate}.pdf`;
}
//#endregion
export { needsRenew as a, ticketsForPerson as c, loadPacketTemplate as i, union401kLabel as l, doorRank as n, packetFilename as o, fillSignOnPacket as r, paperworkForJoining as s, EXTRA_FORM_LABEL as t };
