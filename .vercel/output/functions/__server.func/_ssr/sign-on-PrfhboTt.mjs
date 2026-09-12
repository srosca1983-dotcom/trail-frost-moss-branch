import { o as __toESM } from "../_runtime.mjs";
import { l as cn, n as COMPANY_ADDRESS, s as VESSEL, t as COMPANY } from "./types-DLRYosVU.mjs";
import { c as expiryTone, d as formatShort, l as formatDate, n as addYears, o as departmentLabel, p as inferDepartment, u as formatMdY, y as positionLabel } from "./ratings-WR-IukGV.mjs";
import { _ as watchLabel, o as normalizeAssignment, s as normalizeUnion, t as computeDueOff } from "./shipping-CitWW3XC.mjs";
import { t as detailToParsed } from "./map-BNPCZVrT.mjs";
import { i as deadJoinTickets, o as enoadGaps } from "./ports-C0XwVrj0.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { b as useNavigate, v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { t as Button } from "./button-DnbeV2iT.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { D as getVesselRun, N as parsePackets, O as listCrew, P as proposeJoin, d as Route$5, g as commitParsed, x as getCrew } from "./router-QLPwsRgl.mjs";
import { n as Desk, t as Badge } from "./badge-DfXuB0XH.mjs";
import { t as Input } from "./input-B2bEx-Se.mjs";
import { t as ExpiryChip } from "./expiry-chip-Booas4nG.mjs";
import { t as PortSelect } from "./port-select-ClZxXIOw.mjs";
import { n as StandardFonts, r as rgb, t as PDFDocument } from "../_libs/pdf-lib.mjs";
import { d as missingForPacket, t as clusterResults, u as mergeParsed } from "./parse-fields-D8gZUQV3.mjs";
import { a as ticketFileProblem, i as slimPacket, n as packetFromFile, t as TICKET_ACCEPT } from "./pdf-ibO_ah6S.mjs";
import { t as invalidateDesk } from "./desk-query-IlzSwsjD.mjs";
import { a as needsRenew, c as ticketsForPerson, l as union401kLabel, n as doorRank, o as packetFilename, r as fillSignOnPacket, s as paperworkForJoining, t as EXTRA_FORM_LABEL } from "./fill-packet-DnOdnJLk.mjs";
import { n as billetByCode, t as VESSEL_BILLETS } from "./billets-ArYXOA2k.mjs";
import { t as PageHeader } from "./page-header--nmhDNO6.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/sign-on-PrfhboTt.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var INK = rgb(.07, .09, .16);
var RULE = rgb(.15, .18, .22);
var PAPER = rgb(.96, .94, .88);
var FAINT = rgb(.35, .38, .4);
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
function us4(d) {
	return formatMdY(d, false);
}
function last4(p) {
	return p.ssLast4 ? `xxx-xx-${p.ssLast4}` : "";
}
function cityLine(p) {
	return [
		p.city,
		p.state,
		p.zip
	].filter(Boolean).join(", ");
}
function ratingOf(p) {
	return positionLabel(p.lastPosition || p.tour?.position);
}
async function loadTemplate(url) {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`Could not load ${url}`);
	return res.arrayBuffer();
}
function phoneParts(raw) {
	const digits = (raw ?? "").replace(/\D/g, "");
	const n = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
	if (n.length !== 10) return null;
	return [
		n.slice(0, 3),
		n.slice(3, 6),
		n.slice(6)
	];
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
async function fillMmpEnroll(input) {
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
async function fillMmpOptOut(input) {
	const pdf = await PDFDocument.load(await loadTemplate("/templates/mmp-401k-optout.pdf"));
	const font = await pdf.embedFont(StandardFonts.HelveticaBold);
	const page = pdf.getPage(0);
	const p = input.person;
	markAt(page, font, 73, 448, 12);
	writeAt(page, font, 72, 248, p.fullName, 11, 260);
	writeAt(page, font, 400, 288, us4(input.startDate), 11, 90);
	return pdf.save({ updateFieldAppearances: false });
}
async function fillMeba401k(input) {
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
	} else setText(form, "Daytime Phone", p.cellPhone || p.homePhone);
	const eve = phoneParts(p.homePhone);
	if (eve) {
		setText(form, "Evening Phone", eve[0]);
		setText(form, "undefined_7", eve[1]);
		setText(form, "undefined_8", eve[2]);
	} else setText(form, "Evening Phone", p.homePhone);
	setText(form, "oyer Name", COMPANY);
	setText(form, "Month Day  Year_2", us4(input.startDate));
	setText(form, "if applicable", VESSEL);
	setText(form, "Date", us4(input.startDate));
	if ((p.maritalStatus ?? "").toLowerCase().includes("married")) setCheck(form, "Married", true);
	else setCheck(form, "Sing", true);
	try {
		form.updateFieldAppearances(font);
	} catch {}
	return pdf.save({ updateFieldAppearances: false });
}
async function fillSiu401k(input) {
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
async function fillMebaOt(input) {
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
	} catch {}
	return pdf.save({ updateFieldAppearances: false });
}
async function fillDoorTag(input) {
	const pdf = await PDFDocument.create();
	const page = pdf.addPage([612, 792]);
	const font = await pdf.embedFont(StandardFonts.Helvetica);
	const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
	const p = input.person;
	const rank = doorRank(p.tour?.billetCode, p.lastPosition || p.tour?.position, p.tour?.watch);
	const name = p.fullName;
	const phone = p.cellPhone || p.homePhone || "";
	page.drawRectangle({
		x: 0,
		y: 0,
		width: 612,
		height: 792,
		color: rgb(.93, .91, .86)
	});
	page.drawText("M/V GEORGE II  ·  cabin door", {
		x: 56,
		y: 748,
		size: 10,
		font,
		color: FAINT
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
	const tagX = 126;
	const tagY = 200;
	page.drawRectangle({
		x: 120,
		y: 194,
		width: 372,
		height: 492,
		color: rgb(.2, .22, .24)
	});
	if (doorImg) page.drawImage(doorImg, {
		x: tagX,
		y: tagY,
		width: tagW,
		height: tagH
	});
	else page.drawRectangle({
		x: tagX,
		y: tagY,
		width: tagW,
		height: tagH,
		color: rgb(.55, .38, .22)
	});
	const labelW = 300;
	const labelH = 118;
	const labelX = 156;
	page.drawRectangle({
		x: labelX,
		y: 248,
		width: labelW,
		height: labelH,
		color: PAPER
	});
	page.drawRectangle({
		x: 162,
		y: 254,
		width: 288,
		height: 106,
		borderColor: RULE,
		borderWidth: 1.2,
		color: PAPER
	});
	const rankSize = 11;
	const nameSize = 18;
	const rankW = bold.widthOfTextAtSize(ascii(rank).slice(0, 40), rankSize);
	page.drawText(ascii(rank).slice(0, 40), {
		x: labelX + (labelW - rankW) / 2,
		y: 326,
		size: rankSize,
		font: bold,
		color: FAINT
	});
	const nm = fit(bold, name, nameSize, 276);
	const nmW = bold.widthOfTextAtSize(nm, nameSize);
	page.drawText(nm, {
		x: labelX + (labelW - nmW) / 2,
		y: 296,
		size: nameSize,
		font: bold,
		color: INK
	});
	if (phone) {
		const phW = font.widthOfTextAtSize(ascii(phone), 11);
		page.drawText(ascii(phone), {
			x: labelX + (labelW - phW) / 2,
			y: 272,
			size: 11,
			font,
			color: INK
		});
	}
	page.drawText("Print, cut on the black frame, tape on the cabin door.", {
		x: 56,
		y: 160,
		size: 9,
		font,
		color: FAINT
	});
	return pdf.save();
}
function longDate(iso) {
	if (!iso) return "";
	const d = /* @__PURE__ */ new Date(`${iso}T00:00:00Z`);
	if (Number.isNaN(d.getTime())) return us4(iso);
	return `${String(d.getUTCDate()).padStart(2, "0")} ${[
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
		"December"
	][d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
async function fillHazmatCert(input) {
	const pdf = await PDFDocument.create();
	const page = pdf.addPage([612, 792]);
	const font = await pdf.embedFont(StandardFonts.TimesRoman);
	const bold = await pdf.embedFont(StandardFonts.TimesRomanBold);
	const p = input.person;
	const start = input.startDate;
	const until = addYears(start, 3) ?? start;
	const instructor = input.instructorName?.trim() || "Sorin Rosca, Chief Mate";
	page.drawRectangle({
		x: 36,
		y: 36,
		width: 540,
		height: 720,
		borderColor: RULE,
		borderWidth: 1.5
	});
	page.drawRectangle({
		x: 42,
		y: 42,
		width: 528,
		height: 708,
		borderColor: RULE,
		borderWidth: .6
	});
	page.drawText("PASHA HAWAII", {
		x: 220,
		y: 710,
		size: 11,
		font: bold,
		color: INK
	});
	const v = "M.V. GEORGE II";
	const vw = bold.widthOfTextAtSize(v, 16);
	page.drawText(v, {
		x: (612 - vw) / 2,
		y: 684,
		size: 16,
		font: bold,
		color: INK
	});
	const off = "OFFICIAL NUMBER 625873";
	const ow = font.widthOfTextAtSize(off, 10);
	page.drawText(off, {
		x: (612 - ow) / 2,
		y: 666,
		size: 10,
		font,
		color: INK
	});
	page.drawLine({
		start: {
			x: 90,
			y: 650
		},
		end: {
			x: 522,
			y: 650
		},
		thickness: .8,
		color: RULE
	});
	const title = "HAZARDOUS MATERIALS TRAINING CERTIFICATE";
	const tw = bold.widthOfTextAtSize(title, 13);
	page.drawText(title, {
		x: (612 - tw) / 2,
		y: 618,
		size: 13,
		font: bold,
		color: INK
	});
	page.drawText("This is to certify that", {
		x: 72,
		y: 575,
		size: 11,
		font,
		color: INK
	});
	page.drawLine({
		start: {
			x: 72,
			y: 530
		},
		end: {
			x: 540,
			y: 530
		},
		thickness: .7,
		color: RULE
	});
	page.drawText(ascii(p.fullName), {
		x: 72,
		y: 536,
		size: 13,
		font: bold,
		color: INK
	});
	page.drawText(ascii(ratingOf(p)), {
		x: 280,
		y: 536,
		size: 12,
		font,
		color: INK
	});
	page.drawText(ascii(p.mmcNumber ?? ""), {
		x: 430,
		y: 536,
		size: 12,
		font,
		color: INK
	});
	page.drawText("NAME", {
		x: 72,
		y: 516,
		size: 8,
		font,
		color: FAINT
	});
	page.drawText("RATING", {
		x: 280,
		y: 516,
		size: 8,
		font,
		color: FAINT
	});
	page.drawText("Mariner#", {
		x: 430,
		y: 516,
		size: 8,
		font,
		color: FAINT
	});
	const when = longDate(start);
	const ww = bold.widthOfTextAtSize(when, 12);
	page.drawText(when, {
		x: (612 - ww) / 2,
		y: 470,
		size: 12,
		font: bold,
		color: INK
	});
	const words = "Has successfully completed the shipboard Hazardous Materials Training course in conformance with the requirements of 49 CFR Part 172.700–704. Test materials and instruction retained aboard George II.".split(" ");
	let line = "";
	let y = 430;
	for (const w of words) {
		const next = line ? `${line} ${w}` : w;
		if (font.widthOfTextAtSize(next, 11) > 460) {
			page.drawText(line, {
				x: 76,
				y,
				size: 11,
				font,
				color: INK
			});
			y -= 16;
			line = w;
		} else line = next;
	}
	if (line) page.drawText(line, {
		x: 76,
		y,
		size: 11,
		font,
		color: INK
	});
	page.drawLine({
		start: {
			x: 72,
			y: 280
		},
		end: {
			x: 340,
			y: 280
		},
		thickness: .7,
		color: RULE
	});
	page.drawText(ascii(instructor), {
		x: 72,
		y: 286,
		size: 11,
		font,
		color: INK
	});
	page.drawText("INSTRUCTOR", {
		x: 72,
		y: 264,
		size: 8,
		font,
		color: FAINT
	});
	const valid = `This certificate is valid until ${longDate(until)}`;
	page.drawText(valid, {
		x: 72,
		y: 210,
		size: 12,
		font: bold,
		color: INK
	});
	page.drawText(COMPANY, {
		x: 72,
		y: 70,
		size: 8,
		font,
		color: FAINT
	});
	page.drawText(COMPANY_ADDRESS, {
		x: 72,
		y: 58,
		size: 8,
		font,
		color: FAINT
	});
	return pdf.save();
}
async function fillExtraForm(key, input) {
	switch (key) {
		case "mmp-401k-enroll": return fillMmpEnroll(input);
		case "mmp-401k-optout": return fillMmpOptOut(input);
		case "meba-401k": return fillMeba401k(input);
		case "siu-401k": return fillSiu401k(input);
		case "meba-ot": return fillMebaOt(input);
		case "door-tag": return fillDoorTag(input);
		case "hazmat-cert": return fillHazmatCert(input);
		default: throw new Error(`Unknown extra form ${key}`);
	}
}
function extraFilename(key, p, startDate) {
	const last = (p.lastName || p.fullName || "crew").replace(/[^A-Za-z0-9]+/g, "");
	return `George-II-${{
		"mmp-401k-enroll": "MMP-401k-enroll",
		"mmp-401k-optout": "MMP-401k-opt-out",
		"meba-401k": "MEBA-401k",
		"siu-401k": "SIU-Empower-401k",
		"meba-ot": "MEBA-converted-OT",
		"door-tag": "door-tag",
		"hazmat-cert": "HAZMAT-certificate"
	}[key]}-${last}-${startDate}.pdf`;
}
function Page() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Desk, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SignOn, {}) });
}
function SignOn() {
	const nav = useNavigate();
	const qc = useQueryClient();
	const search = Route$5.useSearch();
	const initial = Route$5.useLoaderData();
	const roster = useQuery({
		queryKey: ["crew"],
		queryFn: () => listCrew(),
		initialData: initial.roster
	});
	const runQ = useQuery({
		queryKey: ["vessel-run"],
		queryFn: () => getVesselRun(),
		initialData: initial.run
	});
	const [files, setFiles] = (0, import_react.useState)([]);
	const [over, setOver] = (0, import_react.useState)(false);
	const [busy, setBusy] = (0, import_react.useState)("idle");
	const [progress, setProgress] = (0, import_react.useState)(null);
	const [results, setResults] = (0, import_react.useState)([]);
	const [clusterIx, setClusterIx] = (0, import_react.useState)(0);
	const [draft, setDraft] = (0, import_react.useState)(null);
	const [match, setMatch] = (0, import_react.useState)(null);
	const [warnings, setWarnings] = (0, import_react.useState)([]);
	const [startDate, setStartDate] = (0, import_react.useState)("");
	const [port, setPort] = (0, import_react.useState)("");
	const [fromLedger, setFromLedger] = (0, import_react.useState)(false);
	const [packetUrl, setPacketUrl] = (0, import_react.useState)(null);
	const [packetName, setPacketName] = (0, import_react.useState)(null);
	const [extraFiles, setExtraFiles] = (0, import_react.useState)([]);
	const [pick, setPick] = (0, import_react.useState)("");
	const [officerInitials, setOfficerInitials] = (0, import_react.useState)(() => {
		if (typeof window === "undefined") return "";
		return localStorage.getItem("crew-ledger-fam-initials") ?? "";
	});
	const [department, setDepartment] = (0, import_react.useState)("");
	const [deptManual, setDeptManual] = (0, import_react.useState)(false);
	const [billetCode, setBilletCode] = (0, import_react.useState)("");
	const [watch, setWatch] = (0, import_react.useState)("");
	const [assignmentType, setAssignmentType] = (0, import_react.useState)("");
	const [unionHall, setUnionHall] = (0, import_react.useState)("");
	const [seniorityClass, setSeniorityClass] = (0, import_react.useState)("");
	const [dueOff, setDueOff] = (0, import_react.useState)("");
	const [dueOffManual, setDueOffManual] = (0, import_react.useState)(false);
	const [dueRule, setDueRule] = (0, import_react.useState)("");
	const [lengthDays, setLengthDays] = (0, import_react.useState)("");
	const [relieving, setRelieving] = (0, import_react.useState)("");
	const [ask, setAsk] = (0, import_react.useState)(null);
	const [confidence, setConfidence] = (0, import_react.useState)(null);
	const [assignTouched, setAssignTouched] = (0, import_react.useState)(false);
	const [identityChanged, setIdentityChanged] = (0, import_react.useState)(false);
	const [w4Needed, setW4Needed] = (0, import_react.useState)(false);
	const [depositChanged, setDepositChanged] = (0, import_react.useState)(false);
	const [enroll401k, setEnroll401k] = (0, import_react.useState)(false);
	const [ticketOverride, setTicketOverride] = (0, import_react.useState)("");
	const [instructorName, setInstructorName] = (0, import_react.useState)(() => {
		if (typeof window === "undefined") return "Sorin Rosca, Chief Mate";
		return localStorage.getItem("crew-ledger-hazmat-instructor") ?? "Sorin Rosca, Chief Mate";
	});
	const stored = useQuery({
		queryKey: ["crew", search.crewId],
		queryFn: () => getCrew({ data: { id: search.crewId } }),
		enabled: Boolean(search.crewId),
		initialData: search.crewId && initial.stored?.id === search.crewId ? initial.stored : void 0
	});
	(0, import_react.useEffect)(() => {
		if (!port && runQ.data?.thisPort) setPort(runQ.data.thisPort);
	}, [runQ.data, port]);
	(0, import_react.useEffect)(() => {
		return () => {
			if (packetUrl) URL.revokeObjectURL(packetUrl);
		};
	}, [packetUrl]);
	(0, import_react.useEffect)(() => {
		return () => {
			for (const e of extraFiles) URL.revokeObjectURL(e.url);
		};
	}, [extraFiles]);
	(0, import_react.useEffect)(() => {
		if (!stored.data || files.length) return;
		const person = detailToParsed(stored.data);
		const m = {
			crewId: stored.data.id,
			fullName: stored.data.fullName,
			status: stored.data.status,
			lastPosition: stored.data.lastPosition,
			confidence: "high",
			reasons: ["name"],
			priorTours: stored.data.tours
		};
		const w = stored.data.documents.filter((d) => expiryTone(d.expiresOn) === "expired" || expiryTone(d.expiresOn) === "soon").map((d) => expiryTone(d.expiresOn) === "expired" ? `${d.label} is expired.` : `${d.label} expires within 30 days.`);
		setDraft(person);
		setMatch(m);
		setWarnings(w);
		setFromLedger(true);
		setStartDate("");
		setPort(runQ.data?.thisPort || person.tour?.port || "");
		setResults([]);
		setDeptManual(false);
		const inferred = inferDepartment(person.lastPosition);
		setDepartment(inferred ?? "");
		setAssignTouched(false);
		setBilletCode(stored.data.billetCode ?? "");
		setWatch(stored.data.watch ?? "");
		setAssignmentType(stored.data.assignmentType ?? "");
		setUnionHall(stored.data.unionHall ?? "");
		setSeniorityClass(stored.data.seniorityClass ?? "");
		setDueOffManual(false);
		setLengthDays("");
		setRelieving(stored.data.tours.find((t) => !t.signOff)?.relieving ?? stored.data.tours[0]?.relieving ?? "");
		setIdentityChanged(false);
		setW4Needed(false);
		setDepositChanged(false);
		setEnroll401k(false);
		setTicketOverride("");
		clearPacket();
	}, [stored.data, files.length]);
	const parseMut = useMutation({ mutationFn: parsePackets });
	const commitMut = useMutation({
		mutationFn: commitParsed,
		onSuccess: async (res) => {
			toast.success(res.returning ? "Returning mariner updated" : "Mariner added to the ledger");
			invalidateDesk(qc);
			await nav({
				to: "/crew/$crewId",
				params: { crewId: res.crewId }
			});
		},
		onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save")
	});
	function clearPacket() {
		setPacketUrl((prev) => {
			if (prev) URL.revokeObjectURL(prev);
			return null;
		});
		setPacketName(null);
		setExtraFiles((prev) => {
			for (const e of prev) URL.revokeObjectURL(e.url);
			return [];
		});
	}
	function onPick(list) {
		if (!list) return;
		const next = [...files];
		for (const f of Array.from(list)) {
			const problem = ticketFileProblem(f);
			if (problem) {
				toast.error(problem);
				continue;
			}
			next.push(f);
		}
		if (next.length > 40) toast.error(`Cap is 40 files at a time.`);
		setFiles(next.slice(0, 40));
		setFromLedger(false);
	}
	function onDrop(e) {
		e.preventDefault();
		setOver(false);
		onPick(e.dataTransfer.files);
	}
	const clusters = (0, import_react.useMemo)(() => clusterResults(results), [results]);
	async function applyCluster(c) {
		let person = c.person;
		let fromFile = false;
		if (c.match?.crewId) try {
			const stored = await getCrew({ data: { id: c.match.crewId } });
			if (stored) {
				const before = missingForPacket(c.person).length;
				person = mergeParsed([c.person, detailToParsed(stored)]);
				fromFile = missingForPacket(person).length < before;
			}
		} catch {}
		setDraft(person);
		setMatch(c.match);
		setWarnings(fromFile ? [...c.warnings.filter((w) => !/ledger file/i.test(w)), "Blank fields were filled from their ledger file."] : c.warnings);
		setFromLedger(fromFile);
		setStartDate(person.tour?.signOn ?? "");
		setPort(runQ.data?.thisPort || person.tour?.port || "");
		setDeptManual(false);
		setDepartment(inferDepartment(person.lastPosition) ?? "");
		setAssignTouched(false);
		setBilletCode(person.tour?.billetCode ?? "");
		setWatch(person.tour?.watch ?? "");
		setAssignmentType(normalizeAssignment(person.tour?.assignmentType) ?? "");
		setUnionHall(normalizeUnion(person.tour?.unionHall) ?? "");
		setSeniorityClass(person.tour?.seniorityClass ?? "");
		setLengthDays(person.tour?.lengthDays ? String(person.tour.lengthDays) : "");
		setRelieving(person.tour?.relieving ?? "");
		setDueOffManual(Boolean(person.tour?.dueOff));
		setDueOff(person.tour?.dueOff ?? "");
		setIdentityChanged(false);
		setW4Needed(false);
		setDepositChanged(false);
		setEnroll401k(false);
		setTicketOverride("");
		clearPacket();
	}
	async function readFiles() {
		if (!files.length) return;
		setBusy("reading");
		setResults([]);
		const out = [];
		try {
			for (let i = 0; i < files.length; i += 1) {
				const f = files[i];
				setProgress(`${i + 1} / ${files.length} · ${f.name}`);
				setBusy(i === 0 ? "reading" : "parsing");
				const payload = slimPacket(await packetFromFile(f));
				setBusy("parsing");
				const parsed = await parseMut.mutateAsync({ data: { packets: [payload] } });
				out.push(parsed[0] ?? {
					filename: f.name,
					pageCount: 0,
					person: null,
					match: null,
					warnings: [],
					error: "Empty result"
				});
				setResults([...out]);
			}
			const grouped = clusterResults(out);
			setClusterIx(0);
			if (grouped[0]) applyCluster(grouped[0]);
			toast.success(`Read ${out.length} file${out.length === 1 ? "" : "s"}`);
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Could not read files");
		} finally {
			setBusy("idle");
			setProgress(null);
		}
	}
	function withTour(person) {
		return {
			...person,
			lastPosition: person.lastPosition,
			tour: {
				vessel: VESSEL,
				position: person.lastPosition,
				signOn: startDate || person.tour?.signOn || null,
				signOff: person.tour?.signOff ?? null,
				port: port || person.tour?.port || null,
				relieving: relieving || person.tour?.relieving || null,
				assignmentType: assignmentType || person.tour?.assignmentType || null,
				lengthDays: lengthDays ? Number(lengthDays) : person.tour?.lengthDays ?? null,
				dispatchRef: person.tour?.dispatchRef ?? null,
				unionHall: unionHall || person.tour?.unionHall || null,
				watch: watch || person.tour?.watch || null,
				billetCode: billetCode || person.tour?.billetCode || null,
				seniorityClass: seniorityClass || person.tour?.seniorityClass || null,
				dueOff: dueOff || person.tour?.dueOff || null
			}
		};
	}
	const personForAssign = draft;
	(0, import_react.useEffect)(() => {
		const position = personForAssign?.lastPosition ?? null;
		if (!position) return;
		let cancelled = false;
		proposeJoin({ data: {
			position,
			watch: watch || null,
			crewId: match?.crewId ?? search.crewId ?? null,
			billetCode: billetCode || null
		} }).then((p) => {
			if (cancelled) return;
			setAsk(p.question);
			setConfidence(p.confidence);
			if (assignTouched) return;
			if (p.pick && !billetCode) setBilletCode(p.pick.code);
			if (p.watch && !watch) setWatch(p.watch);
			if (p.unionHall && !unionHall) setUnionHall(p.unionHall);
			if (p.assignmentType && !assignmentType) setAssignmentType(p.assignmentType);
			if (p.relieving && !relieving) setRelieving(p.relieving);
		});
		return () => {
			cancelled = true;
		};
	}, [personForAssign?.lastPosition]);
	(0, import_react.useEffect)(() => {
		if (dueOffManual) return;
		if (!startDate) {
			setDueOff("");
			setDueRule("");
			return;
		}
		const due = computeDueOff({
			signOn: startDate,
			unionHall: unionHall || null,
			assignmentType: assignmentType || null,
			siuClass: seniorityClass || null,
			lengthDays: lengthDays ? Number(lengthDays) : personForAssign?.tour?.lengthDays ?? null
		});
		setDueOff(due.date ?? "");
		setDueRule(due.rule);
	}, [
		startDate,
		unionHall,
		assignmentType,
		seniorityClass,
		lengthDays,
		dueOffManual,
		personForAssign?.tour?.lengthDays
	]);
	const tickets = (0, import_react.useMemo)(() => draft ? ticketsForPerson(draft) : [], [draft]);
	const joiningRating = billetByCode(billetCode)?.title ?? draft?.lastPosition ?? null;
	const joiningSet = (0, import_react.useMemo)(() => {
		const cyber = tickets.find((t) => t.code === "CYBER");
		const net = tickets.find((t) => t.code === "INTERNET");
		const haz = tickets.find((t) => t.code === "HAZMAT");
		return paperworkForJoining({
			returning: Boolean(match),
			unionHall: unionHall || null,
			position: joiningRating,
			identityChanged,
			w4Needed,
			depositChanged,
			enroll401k,
			cyberExpired: cyber ? needsRenew(cyber.tone) : true,
			internetExpired: net ? needsRenew(net.tone) : true,
			hazmatExpired: haz ? needsRenew(haz.tone) : true
		});
	}, [
		match,
		unionHall,
		identityChanged,
		w4Needed,
		depositChanged,
		enroll401k,
		tickets,
		joiningRating
	]);
	async function fillPacket() {
		if (!draft) return;
		if (!startDate) {
			toast.error("Enter the starting date first.");
			return;
		}
		if (!officerInitials.trim()) {
			toast.error("Enter your initials for the Fam. Officer column.");
			return;
		}
		if (!department) {
			toast.error("Pick the department — Deck, Engine, or Steward.");
			return;
		}
		setBusy("filling");
		try {
			const person = withTour(draft);
			const set = joiningSet;
			const bytes = await fillSignOnPacket({
				person,
				startDate,
				port,
				officerInitials: officerInitials.trim().toUpperCase(),
				department,
				include: set.packetPages
			});
			const blob = new Blob([Uint8Array.from(bytes)], { type: "application/pdf" });
			const url = URL.createObjectURL(blob);
			setPacketUrl((prev) => {
				if (prev) URL.revokeObjectURL(prev);
				return url;
			});
			setPacketName(packetFilename(person, startDate));
			const nextExtras = [];
			for (const key of set.extras) try {
				const extraBytes = await fillExtraForm(key, {
					person,
					startDate,
					port,
					unionHall,
					enroll401k,
					instructorName: instructorName.trim() || "Sorin Rosca, Chief Mate",
					returning: Boolean(match)
				});
				const extraBlob = new Blob([Uint8Array.from(extraBytes)], { type: "application/pdf" });
				nextExtras.push({
					key,
					label: EXTRA_FORM_LABEL[key],
					url: URL.createObjectURL(extraBlob),
					name: extraFilename(key, person, startDate)
				});
			} catch (e) {
				toast.error(e instanceof Error ? e.message : `Could not fill ${EXTRA_FORM_LABEL[key]}`);
			}
			setExtraFiles((prev) => {
				for (const e of prev) URL.revokeObjectURL(e.url);
				return nextExtras;
			});
			toast.success("This joining’s papers filled. Signatures, full SSN, and bank numbers left blank.");
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Could not fill packet");
		} finally {
			setBusy("idle");
		}
	}
	const suggestions = (0, import_react.useMemo)(() => {
		const needle = pick.trim().toLowerCase();
		const list = roster.data ?? [];
		if (!needle) return list.filter((c) => c.status !== "current").slice(0, 6);
		return list.filter((c) => [
			c.fullName,
			c.ssLast4,
			c.mmcNumber,
			c.lastPosition
		].filter(Boolean).join(" ").toLowerCase().includes(needle)).slice(0, 8);
	}, [roster.data, pick]);
	const person = draft;
	const saving = commitMut.isPending;
	const missing = person ? missingForPacket(person) : [];
	const deadTickets = person ? deadJoinTickets({
		mmcExpiration: person.mmcExpiration,
		documents: person.documents
	}) : [];
	const coastGaps = person ? enoadGaps({
		lastName: person.lastName,
		fullName: person.fullName,
		dob: person.dob,
		sex: person.sex,
		passportNumber: person.passportNumber,
		mmcNumber: person.mmcNumber,
		passportExpiration: person.passportExpiration,
		mmcExpiration: person.mmcExpiration,
		embarkPort: port
	}) : [];
	function patch(key, value) {
		setDraft((d) => d ? {
			...d,
			[key]: value
		} : d);
		if (key === "lastPosition") {
			if (!deptManual) setDepartment(inferDepartment(typeof value === "string" ? value : null) ?? "");
			setAssignTouched(false);
			setBilletCode("");
			setWatch("");
		}
		clearPacket();
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			kicker: "Articles",
			title: "Fill this joining’s papers.",
			description: "SRO-CM-06 and SMM-PER-05 decide the set. New joiners get the company packet. Returning crew only get what the book still requires this assignment — familiarization every time they come back. Union 401(k) and door tag print with the packet. HAZMAT certificate only for deck officers when the 3-year card is missing or expired. Signatures, full SSN, and bank numbers stay blank.",
			actions: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "outline",
				asChild: true,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/ingest",
					children: "Load many packets"
				})
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
			onDragOver: (e) => {
				e.preventDefault();
				setOver(true);
			},
			onDragLeave: () => setOver(false),
			onDrop,
			className: cn("flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-6 py-10 text-center transition-colors duration-150", over ? "border-steel-2 bg-steel/10" : "border-border bg-paper-2/50"),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "file",
					accept: TICKET_ACCEPT,
					multiple: true,
					className: "sr-only",
					onChange: (e) => onPick(e.target.files)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-xl",
					children: "Drop union docs here"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted",
					children: "SIU · MM&P · MEBA · MMC · passport · dispatch · DOT · medical · PDF or photo"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1 text-xs text-faint",
					children: [
						files.length,
						" selected · ",
						40,
						" max this pass"
					]
				})
			]
		}),
		files.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-4 divide-y divide-border rounded-xl bg-paper shadow-border",
			children: files.map((f, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "flex items-center justify-between gap-3 px-4 py-2 text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "truncate",
					children: f.name
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "font-mono text-xs text-muted",
					children: [(f.size / 1024 / 1024).toFixed(1), " MB"]
				})]
			}, `${f.name}-${i}`))
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 flex flex-wrap gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				disabled: !files.length || busy !== "idle",
				onClick: () => void readFiles(),
				children: busy === "reading" || busy === "parsing" ? "Reading…" : "Read files"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "outline",
				disabled: busy !== "idle",
				onClick: () => {
					setFiles([]);
					setResults([]);
					setDraft(null);
					setMatch(null);
					setFromLedger(false);
					setAssignTouched(false);
					setBilletCode("");
					setWatch("");
					setAssignmentType("");
					setUnionHall("");
					setAsk(null);
					setIdentityChanged(false);
					setW4Needed(false);
					setDepositChanged(false);
					setEnroll401k(false);
					setTicketOverride("");
					clearPacket();
				},
				children: "Clear"
			})]
		}),
		progress ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 text-sm text-muted",
			children: progress
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "mt-6 rounded-xl bg-paper p-5 shadow-border",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-lg",
					children: "Or pick a returning mariner"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted",
					children: "Auto-fill the packet from their file. You still enter the starting date."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: pick,
					onChange: (e) => setPick(e.target.value),
					placeholder: "Search name, last 4, MMC…",
					className: "mt-3",
					"aria-label": "Search returning crew"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-3 divide-y divide-border",
					children: suggestions.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "flex min-h-11 w-full items-center justify-between gap-3 py-2.5 text-left text-sm hover:bg-paper-2/80",
						onClick: () => {
							setFiles([]);
							setPick("");
							nav({
								to: "/sign-on",
								search: { crewId: c.id }
							});
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-medium",
							children: c.fullName
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "ml-2 text-xs text-muted",
							children: [positionLabel(c.lastPosition), c.ssLast4 ? ` · ··${c.ssLast4}` : ""]
						})] }), c.expiredCount > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
							tone: "expired",
							children: [c.expiredCount, " expired"]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							tone: "ok",
							children: "Clear"
						})]
					}) }, c.id))
				})
			]
		}),
		clusters.length > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-6 flex flex-wrap gap-2",
			children: clusters.map((c, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "sm",
				variant: i === clusterIx ? "default" : "outline",
				onClick: () => {
					setClusterIx(i);
					applyCluster(c);
				},
				children: c.person.fullName
			}, c.key))
		}) : null,
		person ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-8 space-y-4",
			children: [
				person.signOnRequired === false && match ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-xl bg-warn/15 p-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-medium text-warn",
						children: "Hall marked this job no sign-on required."
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted",
						children: "They have a prior file on this ship. You can still fill a packet if the Master wants one on file."
					})]
				}) : null,
				match ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-xl bg-ink p-5 text-paper",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[11px] uppercase tracking-[0.16em] text-sage",
							children: "Returning crew"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
							className: "mt-1 font-display text-2xl",
							children: [match.fullName, " has been on this ship before."]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-2 text-sm text-paper/80",
							children: [
								match.priorTours.length ? match.priorTours.slice(0, 3).map((t) => `${positionLabel(t.position)} ${formatDate(t.signOn)}${t.signOff ? `–${formatDate(t.signOff)}` : ""}`).join(" · ") : "Prior file exists in the ledger.",
								" ",
								"Match: ",
								match.reasons.join(", "),
								" (",
								match.confidence,
								").",
								fromLedger ? " Blank fields on the upload were filled from that file." : ""
							]
						})
					]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-xl bg-ink p-5 text-paper",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[11px] uppercase tracking-[0.16em] text-sage",
							children: "New to the vessel"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "mt-1 font-display text-2xl",
							children: "Full sign-on packet required."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-2 text-sm text-paper/80",
							children: ["No matching MMC, passport, last four, or name+DOB in the ledger", person.signOnRequired === false ? " — hall marked no sign-on required, but they have never sailed this ship, so we still fill a new packet." : "."]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "rounded-xl bg-paper p-5 shadow-border",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-xl",
							children: "Starting date"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-muted",
							children: "Required before we fill the packet. Dispatch reporting date is suggested when we have it."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 grid gap-3 sm:grid-cols-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-muted",
										children: "Sign-on date"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										type: "date",
										className: "mt-1",
										value: startDate,
										onChange: (e) => {
											setStartDate(e.target.value);
											clearPacket();
										}
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-muted",
										children: "Port they join"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PortSelect, {
										value: port,
										onChange: (v) => {
											setPort(v);
											clearPacket();
										},
										allowEmpty: true,
										emptyLabel: "This port"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-muted",
										children: "Sex"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
										className: "mt-1 flex h-10 w-full rounded-md border border-border bg-paper px-2 text-sm",
										value: person.sex ?? "",
										onChange: (e) => patch("sex", e.target.value || null),
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "",
												children: "Needed for eNOAD"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "Male",
												children: "Male"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "Female",
												children: "Female"
											})
										]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-muted",
										children: "Rating"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										className: "mt-1",
										value: person.lastPosition ?? "",
										onChange: (e) => patch("lastPosition", e.target.value || null),
										placeholder: "AB, QEE, 3/M…"
									})]
								})
							]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "rounded-xl bg-paper p-5 shadow-border",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-xl",
							children: "Billet and watch"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-muted",
							children: "Auto-assigned from the rating when we can. If two slots fit, or the watch is not on the articles, pick it here."
						}),
						ask ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 rounded-lg bg-warn/15 px-3 py-3 text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-medium text-warn",
								children: confidence === "low" ? "Need a call" : "Confirm"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-0.5 text-muted",
								children: ask
							})]
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 grid gap-3 sm:grid-cols-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-muted",
										children: "Billet"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
										className: "mt-1 flex h-10 w-full rounded-md border border-border bg-paper px-2 text-sm",
										value: billetCode,
										onChange: (e) => {
											setAssignTouched(true);
											const next = e.target.value;
											setBilletCode(next);
											const b = VESSEL_BILLETS.find((x) => x.code === next);
											if (b) {
												if (b.watch) setWatch(b.watch);
												setUnionHall(b.unionHall);
												proposeJoin({ data: {
													position: person.lastPosition,
													watch: b.watch,
													crewId: match?.crewId ?? search.crewId ?? null,
													billetCode: next
												} }).then((p) => {
													if (p.assignmentType) setAssignmentType(p.assignmentType);
													if (p.relieving) setRelieving(p.relieving);
													else if (p.assignmentType !== "RELIEF") setRelieving("");
													if (p.question) setAsk(p.question);
												});
											}
										},
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "",
											children: "Pick a slot"
										}), VESSEL_BILLETS.filter((b) => b.code === billetCode || !(inferDepartment(person.lastPosition) || department) || b.department === (inferDepartment(person.lastPosition) || department)).map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: b.code,
											children: b.shortTitle
										}, b.code))]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-muted",
										children: "Watch"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
										className: "mt-1 flex h-10 w-full rounded-md border border-border bg-paper px-2 text-sm",
										value: watch,
										onChange: (e) => {
											setAssignTouched(true);
											setWatch(e.target.value);
										},
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "",
												children: "Unassigned"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "day",
												children: "Day"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "12-4",
												children: "12–4"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "4-8",
												children: "4–8"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "8-12",
												children: "8–12"
											})
										]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-muted",
										children: "Assignment"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
										className: "mt-1 flex h-10 w-full rounded-md border border-border bg-paper px-2 text-sm",
										value: assignmentType,
										onChange: (e) => {
											setAssignTouched(true);
											setAssignmentType(e.target.value);
										},
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "",
												children: "—"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "PERMANENT",
												children: "Permanent"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "ROTARY",
												children: "Rotary"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "RELIEF",
												children: "Relief"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "CADET",
												children: "Cadet"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "APPRENTICE",
												children: "Apprentice"
											})
										]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-muted",
										children: "Union"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
										className: "mt-1 flex h-10 w-full rounded-md border border-border bg-paper px-2 text-sm",
										value: unionHall,
										onChange: (e) => {
											setAssignTouched(true);
											setUnionHall(e.target.value);
										},
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "",
												children: "—"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "MMP",
												children: "MM&P"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "MEBA",
												children: "MEBA"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "SIU",
												children: "SIU"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "NONE",
												children: "None"
											})
										]
									})]
								}),
								unionHall === "SIU" && assignmentType === "ROTARY" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-muted",
										children: "SIU class"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
										className: "mt-1 flex h-10 w-full rounded-md border border-border bg-paper px-2 text-sm",
										value: seniorityClass,
										onChange: (e) => {
											setAssignTouched(true);
											setSeniorityClass(e.target.value);
										},
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "",
												children: "Not on file · Class A 75–120"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "A",
												children: "A · 75–120d"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "B",
												children: "B · 180d or 1 RT"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "C",
												children: "C · 60d or 1 RT"
											})
										]
									})]
								}) : null,
								assignmentType === "RELIEF" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-muted",
										children: "Covering (relieving)"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										className: "mt-1",
										value: relieving,
										onChange: (e) => {
											setAssignTouched(true);
											setRelieving(e.target.value);
										},
										placeholder: "Permanent who still holds the job"
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-muted",
										children: "Relief length (days)"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										className: "mt-1",
										inputMode: "numeric",
										value: lengthDays,
										onChange: (e) => {
											setAssignTouched(true);
											setLengthDays(e.target.value);
										},
										placeholder: unionHall === "SIU" ? "SIU 45–60 or dispatch days" : "Dispatch days"
									})]
								})] }) : null,
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "text-sm sm:col-span-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-muted",
											children: ["Discharge ", dueOffManual ? "(overrides the rule)" : ""]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											type: "date",
											className: "mt-1",
											value: dueOff,
											onChange: (e) => {
												setDueOffManual(true);
												setDueOff(e.target.value);
											}
										}),
										dueRule ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "mt-1 text-xs text-muted",
											children: [dueRule, dueOff ? ` · ${formatShort(dueOff)}` : ""]
										}) : null
									]
								})
							]
						}),
						watch ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-2 text-xs text-muted",
							children: ["Watch: ", watchLabel(watch)]
						}) : null
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "rounded-xl bg-paper p-5 shadow-border",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-xl",
							children: "Familiarization officer"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-muted",
							children: "Your initials go in the Fam. Officer column on every row. Crew member column stays blank. 72-hour items fill for their department only."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 grid gap-3 sm:grid-cols-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted",
									children: "Your initials"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									className: "mt-1 uppercase",
									value: officerInitials,
									onChange: (e) => {
										const v = e.target.value.toUpperCase().slice(0, 8);
										setOfficerInitials(v);
										try {
											localStorage.setItem("crew-ledger-fam-initials", v.trim());
										} catch {}
										clearPacket();
									},
									placeholder: "e.g. JDS",
									"aria-label": "Familiarization officer initials"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "text-sm",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-muted",
										children: "Department"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "mt-1 flex flex-wrap gap-2",
										children: [
											"deck",
											"engine",
											"steward"
										].map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											type: "button",
											size: "sm",
											variant: department === d ? "default" : "outline",
											onClick: () => {
												setDepartment(d);
												setDeptManual(true);
												clearPacket();
											},
											children: departmentLabel(d)
										}, d))
									}),
									department ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "mt-2 text-xs text-muted",
										children: [
											deptManual ? "Set by you." : `From rating (${positionLabel(person.lastPosition)}).`,
											" 72-hour block: ",
											departmentLabel(department),
											"."
										]
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-2 text-xs text-warn",
										children: "Could not read department from the papers — pick one."
									})
								]
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "rounded-xl bg-paper p-5 shadow-border",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-xl",
							children: person.fullName
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
							className: "mt-3 grid gap-2 text-sm sm:grid-cols-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									k: "Rating",
									v: positionLabel(person.lastPosition)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									k: "DOB",
									v: formatDate(person.dob)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									k: "MMC",
									v: person.mmcNumber,
									extra: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExpiryChip, { date: person.mmcExpiration })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									k: "Passport",
									v: person.passportNumber,
									extra: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExpiryChip, { date: person.passportExpiration })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									k: "Phone",
									v: person.cellPhone || person.homePhone
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									k: "Email",
									v: person.email
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									k: "Address",
									v: [
										person.addressLine,
										person.city,
										person.state,
										person.zip
									].filter(Boolean).join(", ")
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									k: "Next of kin",
									v: person.nextOfKin ? `${person.nextOfKin.fullName} (${person.nextOfKin.relationship ?? "—"})` : null
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									k: "Prior employers",
									v: person.previousEmployers.length ? person.previousEmployers.slice(0, 3).map((e) => e.name).join(" · ") : null
								})
							]
						}),
						missing.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-3 text-sm text-warn",
							children: [
								"Still missing: ",
								missing.join(", "),
								". Packet fills what we have; blanks stay blank."
							]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 text-sm text-ok",
							children: "Enough to fill identity fields on the original forms."
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "rounded-xl bg-paper p-5 shadow-border",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-xl",
							children: "This joining"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-muted",
							children: match ? "Returning — SRO-CM-06 4.2. MMC, drug-free card, and medical certificate checked every time. Familiarization (SMM-PER-05 rev 5) is filled every return." : "New to the vessel — SRO-CM-06 4.1 full company packet, plus familiarization and medical sign-on."
						}),
						joiningSet.notes.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-xs text-muted",
							children: n
						}, n)),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "mt-5 text-[11px] font-medium uppercase tracking-[0.16em] text-sage",
							children: "Tickets"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-2 divide-y divide-border",
							children: tickets.slice().sort((a, b) => {
								const rank = {
									expired: 0,
									soon: 1,
									missing: 2,
									watch: 3,
									ok: 4
								};
								return (rank[a.tone] ?? 9) - (rank[b.tone] ?? 9);
							}).map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex items-center justify-between gap-3 py-2 text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-medium",
									children: t.label
								}), t.note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "ml-2 text-xs text-muted",
									children: t.note
								}) : null] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-mono text-xs text-muted",
										children: t.expiresOn ? formatShort(t.expiresOn) : "—"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExpiryChip, { date: t.expiresOn })]
								})]
							}, t.code))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "mt-5 text-[11px] font-medium uppercase tracking-[0.16em] text-sage",
							children: "Forms this assignment"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-2 space-y-2 text-sm",
							children: joiningSet.forms.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex items-start justify-between gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-medium",
									children: f.label
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mt-0.5 block text-xs text-muted",
									children: f.why
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									tone: f.required ? "steel" : "neutral",
									children: f.required ? "Print" : "If needed"
								})]
							}, f.key))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-5 space-y-3 rounded-lg bg-paper-2/80 p-4",
							children: [
								match ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "flex items-start gap-3 text-sm",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "checkbox",
											className: "mt-1 size-4 accent-steel",
											checked: identityChanged,
											onChange: (e) => {
												setIdentityChanged(e.target.checked);
												clearPacket();
											}
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Address, next of kin, or tickets changed", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "mt-0.5 block text-xs text-muted",
											children: "SRO-CM-06 4.2 — fill SRO-PER-003 only if anything changed."
										})] })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "flex items-start gap-3 text-sm",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "checkbox",
											className: "mt-1 size-4 accent-steel",
											checked: w4Needed,
											onChange: (e) => {
												setW4Needed(e.target.checked);
												clearPacket();
											}
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Need a new W-4", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "mt-0.5 block text-xs text-muted",
											children: "Returning crew only get a W-4 if withholding changed."
										})] })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "flex items-start gap-3 text-sm",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "checkbox",
											className: "mt-1 size-4 accent-steel",
											checked: depositChanged,
											onChange: (e) => {
												setDepositChanged(e.target.checked);
												clearPacket();
											}
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Direct deposit change", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "mt-0.5 block text-xs text-muted",
											children: "Account and routing stay blank for them to write in."
										})] })]
									})
								] }) : null,
								unionHall === "MMP" || unionHall === "SIU" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "flex items-start gap-3 text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "checkbox",
										className: "mt-1 size-4 accent-steel",
										checked: enroll401k,
										onChange: (e) => {
											setEnroll401k(e.target.checked);
											clearPacket();
										}
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
										"Enroll in ",
										union401kLabel(unionHall),
										" this assignment",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "mt-0.5 block text-xs text-muted",
											children: unionHall === "MMP" ? "Off = MM&P opt-out, which they must complete each time they sign on. Contribution % stays blank." : "Off = decline on the Empower form. Contribution % stays blank either way."
										})
									] })]
								}) : unionHall === "MEBA" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-muted",
									children: "MEBA 401(k) and converted overtime print with name and employer only. Elections and hours stay blank."
								}) : null,
								joiningSet.extras.includes("hazmat-cert") ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "block text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-muted",
										children: "HAZMAT instructor"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										className: "mt-1",
										value: instructorName,
										onChange: (e) => {
											const v = e.target.value;
											setInstructorName(v);
											try {
												localStorage.setItem("crew-ledger-hazmat-instructor", v);
											} catch {}
											clearPacket();
										},
										placeholder: "Sorin Rosca, Chief Mate"
									})]
								}) : null
							]
						})
					]
				}),
				deadTickets.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-xl bg-danger/10 px-4 py-3 text-sm",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-medium text-danger",
							children: "Dead ticket — cannot finish articles."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-1 list-disc pl-5 text-muted",
							children: deadTickets.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [t.label, t.expiresOn ? ` expired ${formatShort(t.expiresOn)}` : ""] }, t.code))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "mt-3 block text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-muted",
								children: "Why they are still signing on"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								className: "mt-1",
								value: ticketOverride,
								onChange: (e) => setTicketOverride(e.target.value),
								placeholder: "Master’s call, replacement arriving, etc."
							})]
						})
					]
				}) : null,
				coastGaps.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-xl bg-warn/15 px-4 py-3 text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "font-medium",
						children: [
							"eNOAD still needs: ",
							coastGaps.join(", "),
							"."
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-muted",
						children: "You can sign them on. The Master cannot file until these are on the file."
					})]
				}) : null,
				warnings.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "space-y-1 text-sm text-danger",
					children: warnings.map((w) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: w }, w))
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							disabled: busy !== "idle" || !startDate || !officerInitials.trim() || !department,
							onClick: () => void fillPacket(),
							children: busy === "filling" ? "Filling this joining…" : "Fill papers for this joining"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							disabled: saving || !startDate,
							onClick: () => {
								if (!billetCode) {
									toast.error("Pick which billet they are joining.");
									return;
								}
								if (deadTickets.length && !ticketOverride.trim()) {
									toast.error("MMC, medical, TWIC, or drug-free is expired. Type why you are still signing them on.");
									return;
								}
								const ready = withTour(person);
								commitMut.mutate({ data: {
									person: ready,
									matchCrewId: match?.crewId ?? null,
									signOn: true,
									filename: fromLedger ? "ledger" : files.map((f) => f.name).join(", ") || "union-docs",
									ticketOverride: deadTickets.length ? ticketOverride.trim() : null
								} });
							},
							children: saving ? "Saving…" : match ? "Sign on returning mariner" : "Sign on as new"
						}),
						fromLedger ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							disabled: saving,
							onClick: () => commitMut.mutate({ data: {
								person: withTour(person),
								matchCrewId: match?.crewId ?? null,
								signOn: false,
								filename: files.map((f) => f.name).join(", ") || "union-docs"
							} }),
							children: "Save to ledger only"
						})
					]
				}),
				packetUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "rounded-xl bg-paper p-5 shadow-border",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-xl",
							children: "Company packet this joining"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted",
							children: "Only the SRO-CM-06 / SMM-PER-05 pages for this assignment. Fam. Officer initials on the checklist; crew-member column left blank."
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							asChild: true,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								href: packetUrl,
								download: packetName ?? "sign-on-packet.pdf",
								children: "Download packet"
							})
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("iframe", {
						title: "Filled sign-on packet",
						src: packetUrl,
						className: "mt-4 h-[720px] w-full rounded-lg bg-paper-2 outline outline-1 -outline-offset-1 outline-ink/10"
					})]
				}) : null,
				extraFiles.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "rounded-xl bg-paper p-5 shadow-border",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-xl",
							children: "Also print"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-sm text-muted",
							children: ["Union 401(k), MEBA converted OT if they sail MEBA, and a door nametag for this joining person only", joiningSet.extras.includes("hazmat-cert") ? ". HAZMAT certificate for this deck officer if the 3-year card is due." : ". HAZMAT certificate is not printed for this rate."]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-4 divide-y divide-border",
							children: extraFiles.map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex flex-wrap items-center justify-between gap-3 py-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-medium",
									children: e.label
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									asChild: true,
									size: "sm",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
										href: e.url,
										download: e.name,
										children: "Download"
									})
								})]
							}, e.key))
						}),
						extraFiles[0] ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("iframe", {
							title: extraFiles[0].label,
							src: extraFiles[0].url,
							className: "mt-4 h-[520px] w-full rounded-lg bg-paper-2 outline outline-1 -outline-offset-1 outline-ink/10"
						}) : null
					]
				}) : null
			]
		}) : null
	] });
}
function Field({ k, v, extra }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center justify-between gap-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
			className: "text-muted",
			children: k
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", {
			className: "flex items-center gap-2 text-right",
			children: [v || "—", extra]
		})]
	});
}
//#endregion
export { Page as component };
