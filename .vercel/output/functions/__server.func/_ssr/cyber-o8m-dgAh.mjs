import { o as __toESM } from "../_runtime.mjs";
import { l as cn, s as VESSEL } from "./types-DLRYosVU.mjs";
import { S as todayUtc, o as departmentLabel, p as inferDepartment, u as formatMdY, y as positionLabel } from "./ratings-WR-IukGV.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { t as Button } from "./button-DnbeV2iT.mjs";
import { i as useQueryClient, n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { I as recordCyberTraining, O as listCrew } from "./router-QLPwsRgl.mjs";
import { n as Desk, t as Badge } from "./badge-DfXuB0XH.mjs";
import { t as Input } from "./input-B2bEx-Se.mjs";
import { i as degrees, n as StandardFonts, r as rgb, t as PDFDocument } from "../_libs/pdf-lib.mjs";
import { o as needsSmsCyber, r as SMS_TRAINING } from "./sms-training-gdj5DqvS.mjs";
import { t as PageHeader } from "./page-header--nmhDNO6.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/cyber-o8m-dgAh.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var CYBER_MODULES = {
	awareness: {
		id: "awareness",
		short: "Mod 1",
		title: "Maritime Cybersecurity Awareness",
		courseTitle: "MARITIME CYBERSECURITY AWARENESS TRAINING",
		cfr: "33 CFR §101.650(d)(1)(ii)–(iv)",
		durationMin: 15,
		audience: "Everyone aboard",
		who: "Everyone aboard with access to IT or OT — SMM-SMM-08 Mod 1 is the whole crew.",
		why: "Recognize threats, how they bypass controls, and how to report to the CySO. SMM-SMM-08-AP3 is the older 1-year company form; this is the USCG MTSA module.",
		topics: [
			"Recognition and detection of cybersecurity threats and all types of cyber incidents",
			"Techniques used to circumvent cybersecurity measures",
			"Procedures for reporting a cyber incident to the Cybersecurity Officer (CySO)"
		],
		signerLabel: "Facilitator",
		materials: [{
			kind: "facilitator",
			label: "Facilitator guide",
			href: "/templates/cyber/mod1-facilitator.pdf"
		}, {
			kind: "handout",
			label: "Trainee handout",
			href: "/templates/cyber/mod1-handout.pdf"
		}]
	},
	ot: {
		id: "ot",
		short: "Mod 2",
		title: "Operational Technology (OT) Cybersecurity",
		courseTitle: "OPERATIONAL TECHNOLOGY (OT) CYBERSECURITY TRAINING",
		cfr: "33 CFR §101.650(d)(1)(v)",
		durationMin: 15,
		audience: "OT systems",
		who: "SMM-SMM-08 Mod 2: all officers plus the electrician. Add any rating who actually uses OT.",
		why: "ECDIS, IBS, AIS, ECS, ballast, PLCs, fire detection, cargo automation. Extra module on top of awareness.",
		topics: [
			"IT vs. OT system fundamentals",
			"Common OT risks in maritime environments",
			"Physical and logical access risks",
			"Expected vs. suspicious OT behavior",
			"Actions to take if an OT cyber incident is suspected"
		],
		signerLabel: "Facilitator",
		materials: [{
			kind: "facilitator",
			label: "Facilitator guide",
			href: "/templates/cyber/mod2-facilitator.pdf"
		}, {
			kind: "handout",
			label: "Trainee handout",
			href: "/templates/cyber/mod2-handout.pdf"
		}]
	},
	key: {
		id: "key",
		short: "Mod 3",
		title: "MTSA Cybersecurity for Key Personnel",
		courseTitle: "MTSA CYBERSECURITY TRAINING FOR KEY PERSONNEL",
		cfr: "33 CFR §101.650(d)(2)",
		durationMin: 15,
		audience: "Key personnel",
		who: "SMM-SMM-08 Mod 3: all officers plus the electrician (elevated access). Owner/operator designation — add anyone the Cybersecurity Plan names.",
		why: "Incident roles, response/coordination, and staying current on threats.",
		topics: [
			"Roles and responsibilities during a cybersecurity incident",
			"Cyber incident response procedures and coordination responsibilities",
			"Methods for maintaining current knowledge of evolving cybersecurity threats and countermeasures"
		],
		signerLabel: "Approved by",
		materials: [{
			kind: "handout",
			label: "Key personnel slides",
			href: "/templates/cyber/mod3-handout.pdf"
		}]
	}
};
var CYBER_MODULE_ORDER = [
	"awareness",
	"ot",
	"key"
];
/** SMM-SMM-08 Rev 3: all officers plus electrician (elevated access / OT maintenance). */
function isKeyPersonnel(position) {
	return needsSmsCyber("key", position);
}
/** SMM-SMM-08 Rev 3: all officers plus electrician. Ratings only if they actually use OT. */
function needsOtTraining(position) {
	return needsSmsCyber("ot", position);
}
function needsAwareness(_position) {
	return true;
}
function modulesFor(position) {
	const out = [];
	if (needsAwareness(position)) out.push("awareness");
	if (needsOtTraining(position)) out.push("ot");
	if (isKeyPersonnel(position)) out.push("key");
	return out;
}
function classifySeat(c) {
	const position = c.lastPosition;
	const modules = modulesFor(position);
	const lastName = (c.lastName ?? "").trim() || lastFromFull(c.fullName);
	const firstName = (c.firstName ?? "").trim() || givenFromFull(c.fullName, lastName);
	return {
		crewId: c.id,
		fullName: c.fullName,
		lastName,
		firstName,
		position,
		positionLabel: positionLabel(position),
		department: inferDepartment(position),
		billet: c.lastBillet ?? null,
		mmcNumber: c.mmcNumber ?? null,
		modules,
		awareness: modules.includes("awareness"),
		ot: modules.includes("ot"),
		key: modules.includes("key")
	};
}
function classifyCrew(list, aboardOnly = true) {
	return list.filter((c) => aboardOnly ? c.status === "current" : true).map(classifySeat).sort((a, b) => (a.billet ?? "99").localeCompare(b.billet ?? "99") || a.fullName.localeCompare(b.fullName));
}
function seatsForModule(seats, module) {
	return seats.filter((s) => s.modules.includes(module));
}
function moduleCounts(seats) {
	return {
		awareness: seatsForModule(seats, "awareness").length,
		ot: seatsForModule(seats, "ot").length,
		key: seatsForModule(seats, "key").length
	};
}
function lastFromFull(full) {
	const parts = full.trim().split(/\s+/);
	return parts[parts.length - 1] ?? full;
}
function givenFromFull(full, last) {
	const trimmed = full.trim();
	if (last && trimmed.toLowerCase().endsWith(last.toLowerCase())) return trimmed.slice(0, trimmed.length - last.length).trim();
	return trimmed.split(/\s+/).slice(0, -1).join(" ");
}
var INK = rgb(.07, .08, .1);
var FAINT = rgb(.38, .4, .42);
var GOLD = rgb(.76, .58, .22);
var RED = rgb(.55, .14, .14);
var BLACK = rgb(.08, .07, .06);
var PAPER = rgb(.99, .98, .96);
var RULE = rgb(.18, .18, .2);
var COMPASS_URL = "/templates/cyber/pasha-compass.png";
var DEFAULT_CYBER_SESSION = {
	date: "",
	durationMin: 15,
	facilitatorName: "Sorin Rosca, Chief Mate",
	facilitatorOrg: VESSEL
};
function ascii(text) {
	return text.replace(/[^\x20-\x7E]/g, " ").replace(/\s+/g, " ").trim();
}
function us4(d) {
	return formatMdY(d, false);
}
function wrap(font, text, size, maxWidth) {
	const words = ascii(text).split(/\s+/).filter(Boolean);
	const lines = [];
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
function center(page, font, text, y, size, color, minX, maxX) {
	const t = ascii(text);
	if (!t) return;
	const w = font.widthOfTextAtSize(t, size);
	const x = Math.max(minX, minX + (maxX - minX - w) / 2);
	page.drawText(t, {
		x,
		y,
		size,
		font,
		color
	});
}
async function loadBytes(url) {
	try {
		const res = await fetch(url);
		if (!res.ok) return null;
		return res.arrayBuffer();
	} catch {
		return null;
	}
}
async function compass(pdf) {
	const buf = await loadBytes(COMPASS_URL);
	if (!buf) return null;
	return pdf.embedPng(buf);
}
function paintBrand(page, logo) {
	const { width: w, height: h } = page.getSize();
	page.drawRectangle({
		x: 0,
		y: 0,
		width: w,
		height: h,
		color: PAPER
	});
	page.drawRectangle({
		x: w - 42,
		y: 0,
		width: 42,
		height: h,
		color: RED
	});
	page.drawRectangle({
		x: w - 46,
		y: 0,
		width: 4,
		height: h,
		color: GOLD
	});
	page.drawSvgPath("M 0 612 L 210 612 L 0 430 Z", { color: GOLD });
	page.drawSvgPath("M 0 612 L 118 612 L 0 512 Z", { color: BLACK });
	page.drawSvgPath("M 0 0 L 168 0 L 0 118 Z", { color: RED });
	page.drawSvgPath("M 0 0 L 86 0 L 0 62 Z", { color: GOLD });
	if (logo) {
		const lw = 56;
		const lh = lw * (logo.height / logo.width);
		page.drawImage(logo, {
			x: w - 54,
			y: h - lh - 14,
			width: lw,
			height: lh
		});
	}
}
function drawCert(page, fonts, logo, moduleId, name, session) {
	const mod = CYBER_MODULES[moduleId];
	paintBrand(page, logo);
	const left = 52;
	const right = 732;
	const mid = 392;
	center(page, fonts.italic, "Certificate of Completion", 548, 28, INK, left, right);
	const displayName = ascii(name) || " ";
	const nameSize = displayName.length > 28 ? 16 : 20;
	center(page, fonts.italic, displayName, 500, nameSize, INK, left, right);
	page.drawLine({
		start: {
			x: 92,
			y: 492
		},
		end: {
			x: 692,
			y: 492
		},
		thickness: .8,
		color: RULE
	});
	center(page, fonts.roman, "has successfully completed", 470, 11, INK, left, right);
	const titleLines = wrap(fonts.bold, mod.courseTitle, 13, 656);
	let y = 444;
	for (const line of titleLines) {
		center(page, fonts.bold, line, y, 13, INK, left, right);
		y -= 16;
	}
	const titleWidth = Math.min(600, fonts.bold.widthOfTextAtSize(titleLines[titleLines.length - 1] ?? mod.courseTitle, 13) + 24);
	page.drawLine({
		start: {
			x: mid - titleWidth / 2,
			y: y + 10
		},
		end: {
			x: mid + titleWidth / 2,
			y: y + 10
		},
		thickness: 1.1,
		color: INK
	});
	y -= 8;
	const intro = `This certificate verifies that the individual named above has successfully completed ${mod.title}, which addresses the following training topics in accordance with ${mod.cfr}:`;
	for (const line of wrap(fonts.roman, intro, 10, 660)) {
		page.drawText(line, {
			x: 60,
			y,
			size: 10,
			font: fonts.roman,
			color: INK
		});
		y -= 13;
	}
	y -= 4;
	for (const topic of mod.topics) {
		page.drawText("•", {
			x: 68,
			y,
			size: 10,
			font: fonts.roman,
			color: INK
		});
		const wrapped = wrap(fonts.roman, topic, 10, 630);
		for (const line of wrapped) {
			page.drawText(line, {
				x: 82,
				y,
				size: 10,
				font: fonts.roman,
				color: INK
			});
			y -= 13;
		}
		y -= 2;
	}
	const fieldX = 430;
	const lineX = 560;
	let fy = 148;
	const rows = [
		["Date of Training:", us4(session.date)],
		["Duration:", session.durationMin ? `${session.durationMin}` : ""],
		[`${mod.signerLabel} Signature:`, ""],
		[`${mod.signerLabel} Name:`, ascii(session.facilitatorName)],
		[`${mod.signerLabel} Organization:`, ascii(session.facilitatorOrg)]
	];
	for (const [label, value] of rows) {
		page.drawText(label, {
			x: fieldX,
			y: fy,
			size: 9,
			font: fonts.roman,
			color: INK
		});
		page.drawLine({
			start: {
				x: lineX,
				y: fy - 2
			},
			end: {
				x: 724,
				y: fy - 2
			},
			thickness: .6,
			color: RULE
		});
		if (value) page.drawText(value, {
			x: 564,
			y: fy,
			size: 10,
			font: fonts.bold,
			color: INK
		});
		if (label.startsWith("Duration")) page.drawText("minutes", {
			x: 680,
			y: fy,
			size: 9,
			font: fonts.roman,
			color: INK
		});
		fy -= 22;
	}
	page.drawText("THE PASHA GROUP", {
		x: 778,
		y: 70,
		size: 10,
		font: fonts.bold,
		color: PAPER,
		rotate: degrees(90)
	});
	page.drawText(`${VESSEL}  ·  ${mod.cfr}  ·  signatures left blank`, {
		x: 60,
		y: 22,
		size: 7,
		font: fonts.roman,
		color: FAINT
	});
}
async function fillCyberCertificates(moduleId, seats, session) {
	const pdf = await PDFDocument.create();
	const roman = await pdf.embedFont(StandardFonts.TimesRoman);
	const bold = await pdf.embedFont(StandardFonts.TimesRomanBold);
	const italic = await pdf.embedFont(StandardFonts.TimesRomanBoldItalic);
	const logo = await compass(pdf);
	for (const seat of seats) drawCert(pdf.addPage([792, 612]), {
		roman,
		bold,
		italic
	}, logo, moduleId, seat.fullName, session);
	if (seats.length === 0) drawCert(pdf.addPage([792, 612]), {
		roman,
		bold,
		italic
	}, logo, moduleId, "", session);
	return pdf.save();
}
async function fillCyberRoster(moduleId, seats, session) {
	const pdf = await PDFDocument.create();
	const page = pdf.addPage([612, 792]);
	const roman = await pdf.embedFont(StandardFonts.TimesRoman);
	const bold = await pdf.embedFont(StandardFonts.TimesRomanBold);
	const mod = CYBER_MODULES[moduleId];
	page.drawRectangle({
		x: 36,
		y: 36,
		width: 540,
		height: 720,
		borderColor: RULE,
		borderWidth: 1.2
	});
	page.drawText(VESSEL, {
		x: 52,
		y: 730,
		size: 11,
		font: bold,
		color: INK
	});
	page.drawText("USCG 33 CFR §101.650 training roster", {
		x: 52,
		y: 714,
		size: 9,
		font: roman,
		color: FAINT
	});
	page.drawText(`${mod.short}  ·  ${mod.title}`, {
		x: 52,
		y: 688,
		size: 14,
		font: bold,
		color: INK
	});
	page.drawText(mod.cfr, {
		x: 52,
		y: 672,
		size: 9,
		font: roman,
		color: FAINT
	});
	page.drawText(`Date of training: ${us4(session.date) || "__________"}`, {
		x: 52,
		y: 648,
		size: 10,
		font: roman,
		color: INK
	});
	page.drawText(`Duration: ${session.durationMin || "____"} minutes`, {
		x: 320,
		y: 648,
		size: 10,
		font: roman,
		color: INK
	});
	page.drawText(`${mod.signerLabel}: ${ascii(session.facilitatorName) || "____________________"}`, {
		x: 52,
		y: 632,
		size: 10,
		font: roman,
		color: INK
	});
	page.drawText(ascii(session.facilitatorOrg), {
		x: 320,
		y: 632,
		size: 10,
		font: roman,
		color: INK
	});
	const headers = [
		"#",
		"Name",
		"Rating",
		"Attended",
		"Signature"
	];
	const xs = [
		52,
		78,
		250,
		390,
		460
	];
	let y = 600;
	page.drawLine({
		start: {
			x: 48,
			y: y + 14
		},
		end: {
			x: 564,
			y: y + 14
		},
		thickness: .8,
		color: RULE
	});
	headers.forEach((h, i) => page.drawText(h, {
		x: xs[i],
		y,
		size: 8,
		font: bold,
		color: FAINT
	}));
	y -= 8;
	page.drawLine({
		start: {
			x: 48,
			y
		},
		end: {
			x: 564,
			y
		},
		thickness: .6,
		color: RULE
	});
	y -= 18;
	seats.forEach((s, i) => {
		if (y < 80) return;
		page.drawText(String(i + 1), {
			x: xs[0],
			y,
			size: 9,
			font: roman,
			color: INK
		});
		page.drawText(ascii(s.fullName).slice(0, 28), {
			x: xs[1],
			y,
			size: 9,
			font: roman,
			color: INK
		});
		page.drawText(ascii(s.positionLabel).slice(0, 18), {
			x: xs[2],
			y,
			size: 9,
			font: roman,
			color: INK
		});
		page.drawRectangle({
			x: xs[3],
			y: y - 2,
			width: 10,
			height: 10,
			borderColor: RULE,
			borderWidth: .7
		});
		page.drawLine({
			start: {
				x: xs[4],
				y: y - 2
			},
			end: {
				x: 556,
				y: y - 2
			},
			thickness: .5,
			color: RULE
		});
		y -= 22;
	});
	page.drawText("Attendance marks and signatures filled by hand after the session. Do not pre-sign.", {
		x: 52,
		y: 52,
		size: 8,
		font: roman,
		color: FAINT
	});
	return pdf.save();
}
async function fillPersonCyberPack(seat, session) {
	const pdf = await PDFDocument.create();
	const roman = await pdf.embedFont(StandardFonts.TimesRoman);
	const bold = await pdf.embedFont(StandardFonts.TimesRomanBold);
	const italic = await pdf.embedFont(StandardFonts.TimesRomanBoldItalic);
	const logo = await compass(pdf);
	for (const id of seat.modules) drawCert(pdf.addPage([792, 612]), {
		roman,
		bold,
		italic
	}, logo, id, seat.fullName, session);
	return pdf.save();
}
function cyberModuleFilename(moduleId, kind, date) {
	return `George-II-Cyber-${CYBER_MODULES[moduleId].short.replace(/\s+/g, "")}-${kind}-${date}.pdf`;
}
function cyberPersonFilename(seat, date) {
	return `George-II-Cyber-certs-${(seat.lastName || seat.fullName).replace(/[^A-Za-z0-9]+/g, "")}-${date}.pdf`;
}
function readStored(key, fallback) {
	if (typeof window === "undefined") return fallback;
	return localStorage.getItem(key) ?? fallback;
}
function downloadPdf(bytes, name) {
	const blob = new Blob([Uint8Array.from(bytes)], { type: "application/pdf" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = name;
	document.body.appendChild(a);
	a.click();
	a.remove();
	return url;
}
function Page() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Desk, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CyberDesk, {}) });
}
function CyberDesk() {
	const qc = useQueryClient();
	const roster = useQuery({
		queryKey: ["crew"],
		queryFn: () => listCrew()
	});
	const [date, setDate] = (0, import_react.useState)(() => todayUtc().toISOString().slice(0, 10));
	const [facilitator, setFacilitator] = (0, import_react.useState)(() => readStored("crew-ledger-cyber-facilitator", DEFAULT_CYBER_SESSION.facilitatorName));
	const [busy, setBusy] = (0, import_react.useState)(null);
	const [ready, setReady] = (0, import_react.useState)([]);
	const seats = (0, import_react.useMemo)(() => classifyCrew(roster.data ?? []), [roster.data]);
	const counts = moduleCounts(seats);
	const session = {
		date,
		durationMin: DEFAULT_CYBER_SESSION.durationMin,
		facilitatorName: facilitator.trim() || DEFAULT_CYBER_SESSION.facilitatorName,
		facilitatorOrg: VESSEL
	};
	function remember() {
		localStorage.setItem("crew-ledger-cyber-facilitator", session.facilitatorName);
	}
	function pushReady(label, name, url) {
		setReady((prev) => {
			const next = prev.filter((f) => f.name !== name);
			next.unshift({
				id: `${name}-${Date.now()}`,
				label,
				name,
				url
			});
			for (const dropped of prev.filter((f) => f.name === name)) URL.revokeObjectURL(dropped.url);
			return next.slice(0, 12);
		});
	}
	async function stamp(module, crewIds) {
		if (!crewIds.length) return;
		try {
			await recordCyberTraining({ data: {
				module,
				crewIds,
				issued: date
			} });
			await qc.invalidateQueries({ queryKey: ["nse-board"] });
			await qc.invalidateQueries({ queryKey: ["crew"] });
			await qc.invalidateQueries({ queryKey: ["expiring"] });
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Printed, but NSE board did not update");
		}
	}
	async function run(label, work) {
		if (!date) {
			toast.error("Set the date first.");
			return;
		}
		remember();
		setBusy(label);
		try {
			const { bytes, name, readyLabel } = await work();
			pushReady(readyLabel, name, downloadPdf(bytes, name));
			toast.success(`${readyLabel}. Sign after class.`);
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Could not fill papers");
		} finally {
			setBusy(null);
		}
	}
	function fillModuleCerts(id) {
		const list = seatsForModule(seats, id);
		const mod = CYBER_MODULES[id];
		return run(`${id}-certs`, async () => {
			const bytes = await fillCyberCertificates(id, list, session);
			await stamp(id, list.map((s) => s.crewId));
			return {
				bytes,
				name: cyberModuleFilename(id, "certs", date),
				readyLabel: `${mod.short} certificates · ${list.length || 1}`
			};
		});
	}
	function fillModuleRoster(id) {
		const list = seatsForModule(seats, id);
		const mod = CYBER_MODULES[id];
		return run(`${id}-roster`, async () => ({
			bytes: await fillCyberRoster(id, list, session),
			name: cyberModuleFilename(id, "roster", date),
			readyLabel: `${mod.short} sign-in · ${list.length}`
		}));
	}
	function fillSeat(seat) {
		return run(seat.crewId, async () => {
			const bytes = await fillPersonCyberPack(seat, session);
			for (const id of seat.modules) await stamp(id, [seat.crewId]);
			return {
				bytes,
				name: cyberPersonFilename(seat, date),
				readyLabel: `${seat.fullName} · ${seat.modules.length} cert${seat.modules.length === 1 ? "" : "s"}`
			};
		});
	}
	async function fillAll() {
		if (!date) {
			toast.error("Set the date first.");
			return;
		}
		remember();
		setBusy("all");
		try {
			for (const id of CYBER_MODULE_ORDER) {
				const list = seatsForModule(seats, id);
				const certs = await fillCyberCertificates(id, list, session);
				const rosterBytes = await fillCyberRoster(id, list, session);
				const certName = cyberModuleFilename(id, "certs", date);
				const rosterName = cyberModuleFilename(id, "roster", date);
				pushReady(`${CYBER_MODULES[id].short} certificates · ${list.length || 1}`, certName, downloadPdf(certs, certName));
				pushReady(`${CYBER_MODULES[id].short} sign-in · ${list.length}`, rosterName, downloadPdf(rosterBytes, rosterName));
				await stamp(id, list.map((s) => s.crewId));
			}
			toast.success("All three classes printed. Sign after class.");
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Could not fill papers");
		} finally {
			setBusy(null);
		}
	}
	const grouped = (0, import_react.useMemo)(() => {
		return [
			"deck",
			"engine",
			"steward"
		].map((d) => ({
			dept: d,
			rows: seats.filter((s) => s.department === d)
		})).filter((g) => g.rows.length);
	}, [seats]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			kicker: "Cyber class",
			title: "Three talks. Print, teach, sign.",
			description: "Mod 1 is everyone. Mod 2 and 3 are officers and the electrician. Certificates stamp the NSE board. Sign after class."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "mb-6 rounded-xl bg-paper p-5 shadow-border sm:p-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto] sm:items-end",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mb-1 block text-[11px] uppercase tracking-wider text-sage",
							children: "Date"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							type: "date",
							value: date,
							onChange: (e) => setDate(e.target.value)
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mb-1 block text-[11px] uppercase tracking-wider text-sage",
							children: "Your name (prints on the cert)"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: facilitator,
							onChange: (e) => setFacilitator(e.target.value),
							placeholder: "Sorin Rosca, Chief Mate"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "h-10",
						onClick: () => void fillAll(),
						disabled: Boolean(busy) || !seats.length,
						children: busy === "all" ? "Printing…" : "Print all three"
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-3 text-xs text-muted",
				children: [
					"15 minutes each · ",
					VESSEL,
					".",
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: SMS_TRAINING.smm08.url,
						className: "text-steel-2 hover:underline",
						target: "_blank",
						rel: "noreferrer",
						children: "SMM-SMM-08"
					})
				]
			})]
		}),
		ready.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "mb-6 rounded-xl bg-ink p-4 text-paper sm:p-5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[11px] uppercase tracking-[0.16em] text-sage",
				children: "Ready — print these"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-3 space-y-2",
				children: ready.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex items-center justify-between gap-3 text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "min-w-0 truncate text-paper/90",
						children: f.label
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: f.url,
						download: f.name,
						className: "shrink-0 text-steel hover:underline",
						children: "Download"
					})]
				}, f.id))
			})]
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
			className: "grid gap-4 lg:grid-cols-3",
			children: CYBER_MODULE_ORDER.map((id, i) => {
				const mod = CYBER_MODULES[id];
				const n = counts[id];
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex flex-col rounded-xl bg-paper p-5 shadow-border",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-[11px] uppercase tracking-[0.16em] text-sage",
									children: [
										i + 1,
										" · ",
										mod.short
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "mt-1 font-display text-xl tracking-tight",
									children: mod.audience
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-mono text-3xl tabular-nums text-ink",
								children: roster.isLoading ? "—" : n
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm text-muted",
							children: mod.title
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-4 flex flex-wrap gap-x-3 gap-y-1 text-sm",
							children: mod.materials.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								href: m.href,
								target: "_blank",
								rel: "noreferrer",
								className: "text-steel-2 hover:underline",
								children: m.kind === "handout" ? "Open handout" : "Open talking points"
							}) }, m.href))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-auto flex flex-col gap-2 pt-5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								onClick: () => void fillModuleCerts(id),
								disabled: Boolean(busy),
								children: busy === `${id}-certs` ? "Printing…" : `Print ${n} certificate${n === 1 ? "" : "s"}`
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "outline",
								onClick: () => void fillModuleRoster(id),
								disabled: Boolean(busy),
								children: busy === `${id}-roster` ? "Printing…" : "Print sign-in sheet"
							})]
						})
					]
				}, id);
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "mt-8",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-xl tracking-tight",
					children: "Who sits in which class"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted",
					children: "Print one person from the row if they missed the group."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-4 hidden overflow-hidden rounded-xl shadow-border md:block",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full text-left text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
							className: "bg-paper-2 text-[11px] uppercase tracking-wider text-sage",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-4 py-3",
									children: "Name"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-4 py-3",
									children: "Rating"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-4 py-3 text-center",
									children: "1"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-4 py-3 text-center",
									children: "2"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-4 py-3 text-center",
									children: "3"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: "px-4 py-3" })
							] })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", {
							className: "divide-y divide-border bg-paper",
							children: [grouped.map((g) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
								className: "bg-paper-2/80",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									colSpan: 6,
									className: "px-4 py-2 text-[11px] uppercase tracking-wider text-sage",
									children: departmentLabel(g.dept)
								})
							}), g.rows.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-3",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
										to: "/crew/$crewId",
										params: { crewId: s.crewId },
										className: "font-medium hover:underline",
										children: s.fullName
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-3 text-muted",
									children: s.positionLabel
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-3 text-center",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Need, { yes: s.awareness })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-3 text-center",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Need, { yes: s.ot })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-3 text-center",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Need, { yes: s.key })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-3 text-right",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										size: "sm",
										variant: "ghost",
										disabled: Boolean(busy),
										onClick: () => void fillSeat(s),
										children: "Print"
									})
								})
							] }, s.crewId))] }, g.dept)), !seats.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								colSpan: 6,
								className: "px-4 py-10 text-center text-muted",
								children: roster.isLoading ? "Loading articles…" : "Nobody is signed on."
							}) }) : null]
						})]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-4 space-y-3 md:hidden",
					children: seats.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
						className: "rounded-xl bg-paper p-4 shadow-border",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/crew/$crewId",
								params: { crewId: s.crewId },
								className: "font-medium hover:underline",
								children: s.fullName
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted",
								children: s.positionLabel
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								variant: "outline",
								disabled: Boolean(busy),
								onClick: () => void fillSeat(s),
								children: "Print"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 flex flex-wrap gap-1",
							children: [
								s.awareness ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									tone: "steel",
									children: "1"
								}) : null,
								s.ot ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									tone: "steel",
									children: "2"
								}) : null,
								s.key ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									tone: "ok",
									children: "3"
								}) : null
							]
						})]
					}, s.crewId))
				})
			]
		})
	] });
}
function Need({ yes }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("inline-flex size-6 items-center justify-center rounded-full text-xs font-medium", yes ? "bg-ok/15 text-ok" : "bg-paper-2 text-faint"),
		children: yes ? "Y" : "—"
	});
}
//#endregion
export { Page as component };
