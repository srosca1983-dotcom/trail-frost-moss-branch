import { o as __toESM } from "../_runtime.mjs";
import { l as cn, n as COMPANY_ADDRESS, s as VESSEL, t as COMPANY } from "./types-DLRYosVU.mjs";
import { S as todayUtc, n as addYears, u as formatMdY } from "./ratings-WR-IukGV.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { t as Button } from "./button-DnbeV2iT.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { L as recordHazmatQuiz, O as listCrew } from "./router-QLPwsRgl.mjs";
import { n as Desk, t as Badge } from "./badge-DfXuB0XH.mjs";
import { t as Input } from "./input-B2bEx-Se.mjs";
import { n as StandardFonts, r as rgb, t as PDFDocument } from "../_libs/pdf-lib.mjs";
import { r as SMS_TRAINING } from "./sms-training-gdj5DqvS.mjs";
import { t as PageHeader } from "./page-header--nmhDNO6.mjs";
import { i as classifyHazmatCrew, n as HAZMAT_QUESTIONS, o as passedHazmat, r as HAZMAT_STUDY, s as requiredHazmatSeats, t as HAZMAT_CFR } from "./hazmat-quiz-Dpd95m_3.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/hazmat-Byf-vgOs.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var INK = rgb(.07, .09, .16);
var FAINT = rgb(.38, .4, .42);
var RULE = rgb(.18, .2, .24);
rgb(.97, .95, .9);
var ACCENT = rgb(.55, .18, .12);
var DEFAULT_HAZMAT_SESSION = {
	date: "",
	instructorName: "Sorin Rosca, Chief Mate"
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
function lastOf(s) {
	return (s.lastName || s.fullName || "crew").replace(/[^A-Za-z0-9]+/g, "");
}
async function start(footer) {
	const pdf = await PDFDocument.create();
	const font = await pdf.embedFont(StandardFonts.TimesRoman);
	const bold = await pdf.embedFont(StandardFonts.TimesRomanBold);
	return {
		pdf,
		page: pdf.addPage([612, 792]),
		font,
		bold,
		y: 748,
		top: 748,
		bottom: 56,
		left: 48,
		width: 516,
		footer
	};
}
function paintFooter(c) {
	c.page.drawLine({
		start: {
			x: c.left,
			y: 42
		},
		end: {
			x: c.left + c.width,
			y: 42
		},
		thickness: .4,
		color: RULE
	});
	c.page.drawText(ascii(c.footer).slice(0, 90), {
		x: c.left,
		y: 30,
		size: 8,
		font: c.font,
		color: FAINT
	});
}
function newPage(c) {
	paintFooter(c);
	c.page = c.pdf.addPage([612, 792]);
	c.y = c.top;
}
function need(c, h) {
	if (c.y - h < c.bottom) newPage(c);
}
function line(c, text, size = 11, bold = false, color = INK) {
	const font = bold ? c.bold : c.font;
	const rows = wrap(font, text, size, c.width);
	for (const row of rows) {
		need(c, size + 4);
		c.page.drawText(row, {
			x: c.left,
			y: c.y,
			size,
			font,
			color
		});
		c.y -= size + 3;
	}
}
function gap(c, n = 8) {
	c.y -= n;
}
function headerBlock(c, title, seat, session, sub) {
	c.page.drawRectangle({
		x: 36,
		y: 742,
		width: 540,
		height: 28,
		color: ACCENT
	});
	c.page.drawText("PASHA HAWAII  ·  M.V. GEORGE II  ·  OFF. NO. 625873", {
		x: 48,
		y: 752,
		size: 9,
		font: c.bold,
		color: rgb(.98, .96, .92)
	});
	c.y = 722;
	line(c, title, 16, true);
	if (sub) line(c, sub, 9, false, FAINT);
	gap(c, 6);
	line(c, [
		seat ? `Name: ${seat.fullName}` : "Name: ______________________________",
		seat ? `Rating: ${seat.positionLabel}` : "Rating: ______________",
		`Date: ${us4(session.date) || "____________"}`,
		seat?.mmcNumber ? `MMC: ${seat.mmcNumber}` : "MMC: ______________"
	].join("    "), 10);
	line(c, `Vessel: ${VESSEL}    Instructor: ${session.instructorName}`, 10);
	c.page.drawLine({
		start: {
			x: c.left,
			y: c.y
		},
		end: {
			x: c.left + c.width,
			y: c.y
		},
		thickness: .6,
		color: RULE
	});
	c.y -= 12;
}
function paintStudy(c, seat, session) {
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
function paintQuiz(c, seat, session) {
	headerBlock(c, "HAZMAT quiz — 20 questions", seat, session, `Closed book. Circle ONE letter. 16 of ${HAZMAT_QUESTIONS.length} to pass (80%). Return to the Chief Mate. Do not copy the answer key.`);
	for (const q of HAZMAT_QUESTIONS) {
		const stem = wrap(c.bold, `${q.n}.  ${q.prompt}`, 10, c.width);
		const choiceLines = q.choices.flatMap((ch) => wrap(c.font, `${ch.key})  ${ch.text}`, 10, c.width - 18));
		need(c, stem.length * 13 + choiceLines.length * 12 + 16);
		for (const row of stem) {
			c.page.drawText(row, {
				x: c.left,
				y: c.y,
				size: 10,
				font: c.bold,
				color: INK
			});
			c.y -= 13;
		}
		for (const ch of q.choices) {
			const rows = wrap(c.font, `${ch.key})  ${ch.text}`, 10, c.width - 18);
			for (const row of rows) {
				c.page.drawText(row, {
					x: c.left + 14,
					y: c.y,
					size: 10,
					font: c.font,
					color: INK
				});
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
async function fillHazmatStudy(seat, session) {
	const c = await start(`${VESSEL}  ·  HAZMAT study  ·  ${HAZMAT_CFR}`);
	paintStudy(c, seat, session);
	return c.pdf.save();
}
async function fillHazmatQuiz(seat, session) {
	const c = await start(`${VESSEL}  ·  HAZMAT quiz  ·  keep the answer key off this copy`);
	paintQuiz(c, seat, session);
	return c.pdf.save();
}
async function fillHazmatPersonPack(seat, session) {
	const c = await start(`${VESSEL}  ·  HAZMAT pack  ·  ${seat.fullName}`);
	paintStudy(c, seat, session);
	newPage(c);
	paintQuiz(c, seat, session);
	return c.pdf.save();
}
async function fillHazmatPacks(seats, session) {
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
async function fillHazmatAnswerKey(session) {
	const c = await start(`${VESSEL}  ·  HAZMAT ANSWER KEY  ·  Chief Mate only`);
	headerBlock(c, "HAZMAT answer key — Chief Mate only", null, session, `Do not hand this out. 16/${HAZMAT_QUESTIONS.length} to pass. Circle the letter on the quiz, count correct, enter the score on the HAZMAT desk.`);
	line(c, "Keep this copy in the training file. Destroy extras.", 10, false, ACCENT);
	gap(c, 10);
	for (const q of HAZMAT_QUESTIONS) {
		const head = wrap(c.bold, `${q.n}.  ${q.answer}   —  ${q.prompt}`, 10, c.width);
		const why = wrap(c.font, q.why, 9, c.width);
		need(c, head.length * 13 + why.length * 11 + 10);
		for (const row of head) {
			c.page.drawText(row, {
				x: c.left,
				y: c.y,
				size: 10,
				font: c.bold,
				color: INK
			});
			c.y -= 13;
		}
		for (const row of why) {
			c.page.drawText(row, {
				x: c.left + 18,
				y: c.y,
				size: 9,
				font: c.font,
				color: FAINT
			});
			c.y -= 11;
		}
		c.y -= 6;
	}
	paintFooter(c);
	return c.pdf.save();
}
async function fillHazmatCertificate(seat, session, score) {
	const pdf = await PDFDocument.create();
	const page = pdf.addPage([612, 792]);
	const font = await pdf.embedFont(StandardFonts.TimesRoman);
	const bold = await pdf.embedFont(StandardFonts.TimesRomanBold);
	const until = addYears(session.date, 3) ?? session.date;
	page.drawRectangle({
		x: 36,
		y: 36,
		width: 540,
		height: 720,
		borderColor: RULE,
		borderWidth: 1.6
	});
	page.drawRectangle({
		x: 42,
		y: 42,
		width: 528,
		height: 708,
		borderColor: ACCENT,
		borderWidth: .7
	});
	const center = (t, y, size, f, color = INK) => {
		const w = f.widthOfTextAtSize(t, size);
		page.drawText(t, {
			x: (612 - w) / 2,
			y,
			size,
			font: f,
			color
		});
	};
	center("PASHA HAWAII", 710, 11, bold, ACCENT);
	center("M.V. GEORGE II", 688, 16, bold);
	center("OFFICIAL NUMBER 625873", 670, 10, font);
	page.drawLine({
		start: {
			x: 90,
			y: 656
		},
		end: {
			x: 522,
			y: 656
		},
		thickness: .8,
		color: RULE
	});
	center("HAZARDOUS MATERIALS TRAINING CERTIFICATE", 628, 13, bold);
	center("49 CFR 172.700–704  ·  49 CFR 176.13  ·  IMDG Code 1.3", 610, 9, font, FAINT);
	center("Unlimited container vessel", 596, 9, font, FAINT);
	page.drawText("This is to certify that", {
		x: 72,
		y: 560,
		size: 11,
		font,
		color: INK
	});
	page.drawLine({
		start: {
			x: 72,
			y: 528
		},
		end: {
			x: 540,
			y: 528
		},
		thickness: .7,
		color: RULE
	});
	page.drawText(ascii(seat.fullName), {
		x: 72,
		y: 534,
		size: 14,
		font: bold,
		color: INK
	});
	page.drawText(ascii(seat.positionLabel), {
		x: 280,
		y: 534,
		size: 12,
		font,
		color: INK
	});
	page.drawText(ascii(seat.mmcNumber ?? ""), {
		x: 430,
		y: 534,
		size: 11,
		font,
		color: INK
	});
	page.drawText("NAME", {
		x: 72,
		y: 514,
		size: 8,
		font,
		color: FAINT
	});
	page.drawText("RATING", {
		x: 280,
		y: 514,
		size: 8,
		font,
		color: FAINT
	});
	page.drawText("MMC", {
		x: 430,
		y: 514,
		size: 8,
		font,
		color: FAINT
	});
	const body = [
		`has been trained and tested on ${us4(session.date)} in the shipboard hazardous materials functions of M/V GEORGE II, an unlimited container vessel, in conformance with 49 CFR 172.704 and 176.13 and IMDG Code Chapter 1.3.`,
		`Written test score: ${score} of ${HAZMAT_QUESTIONS.length}  (16 required to pass). Training materials (study sheet and quiz) are retained in the vessel training file.`,
		"Elements completed: (1) general awareness / familiarization  (2) function-specific container / IMDG / 49 CFR 176  (3) safety / emergency response  (4) security awareness. In-depth security training is not required unless the mariner is named in the vessel security plan."
	];
	let y = 480;
	for (const para of body) {
		for (const row of wrap(font, para, 11, 468)) {
			page.drawText(row, {
				x: 72,
				y,
				size: 11,
				font,
				color: INK
			});
			y -= 15;
		}
		y -= 8;
	}
	page.drawText(`This certificate is valid until ${us4(until)}  (3 years — 49 CFR 172.704(c)(2)).`, {
		x: 72,
		y: y - 4,
		size: 12,
		font: bold,
		color: INK
	});
	page.drawLine({
		start: {
			x: 72,
			y: 168
		},
		end: {
			x: 340,
			y: 168
		},
		thickness: .7,
		color: RULE
	});
	page.drawText(ascii(session.instructorName), {
		x: 72,
		y: 174,
		size: 11,
		font,
		color: INK
	});
	page.drawText("INSTRUCTOR — signature left blank", {
		x: 72,
		y: 152,
		size: 8,
		font,
		color: FAINT
	});
	page.drawText(`Trainer address: ${COMPANY}, ${COMPANY_ADDRESS}  (aboard ${VESSEL})`, {
		x: 72,
		y: 132,
		size: 8,
		font,
		color: FAINT
	});
	page.drawText("I certify that the named mariner has been trained and tested as required by 49 CFR 172.704(d).", {
		x: 72,
		y: 112,
		size: 9,
		font,
		color: INK
	});
	page.drawText(`${COMPANY}  ·  ${VESSEL}`, {
		x: 72,
		y: 64,
		size: 8,
		font,
		color: FAINT
	});
	return pdf.save();
}
function hazmatQuizFilename(kind, last, date) {
	return `George-II-HAZMAT-${kind}-${last}-${date}.pdf`;
}
function hazmatPersonFilename(seat, date) {
	return hazmatQuizFilename("packs", lastOf(seat), date);
}
function hazmatCertFilename(seat, date) {
	return hazmatQuizFilename("cert", lastOf(seat), date);
}
function readStored(key, fallback) {
	if (typeof window === "undefined") return fallback;
	return localStorage.getItem(key) ?? fallback;
}
function readGrades() {
	if (typeof window === "undefined") return {};
	try {
		const raw = localStorage.getItem("crew-ledger-hazmat-grades");
		if (!raw) return {};
		const parsed = JSON.parse(raw);
		return parsed && typeof parsed === "object" ? parsed : {};
	} catch {
		return {};
	}
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Desk, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HazmatDesk, {}) });
}
function HazmatDesk() {
	const qc = useQueryClient();
	const roster = useQuery({
		queryKey: ["crew"],
		queryFn: () => listCrew()
	});
	const [date, setDate] = (0, import_react.useState)(() => todayUtc().toISOString().slice(0, 10));
	const [instructor, setInstructor] = (0, import_react.useState)(() => readStored("crew-ledger-hazmat-instructor", DEFAULT_HAZMAT_SESSION.instructorName));
	const [busy, setBusy] = (0, import_react.useState)(null);
	const [ready, setReady] = (0, import_react.useState)([]);
	const [grades, setGrades] = (0, import_react.useState)(readGrades);
	const [showAll, setShowAll] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		localStorage.setItem("crew-ledger-hazmat-grades", JSON.stringify(grades));
	}, [grades]);
	(0, import_react.useEffect)(() => {
		if (!roster.data) return;
		setGrades((prev) => {
			const next = { ...prev };
			let changed = false;
			for (const p of roster.data) {
				if (p.hazmatScore == null) continue;
				if (next[p.id]?.score) continue;
				next[p.id] = {
					score: String(p.hazmatScore),
					date: p.hazmatIssued || date
				};
				changed = true;
			}
			return changed ? next : prev;
		});
	}, [roster.data, date]);
	const seats = (0, import_react.useMemo)(() => classifyHazmatCrew(roster.data ?? []), [roster.data]);
	const required = requiredHazmatSeats(seats);
	const visible = showAll ? seats : required;
	const session = {
		date,
		instructorName: instructor.trim() || DEFAULT_HAZMAT_SESSION.instructorName
	};
	function remember() {
		localStorage.setItem("crew-ledger-hazmat-instructor", session.instructorName);
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
			toast.success(readyLabel);
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Could not fill papers");
		} finally {
			setBusy(null);
		}
	}
	function printPacks() {
		return run("packs", async () => ({
			bytes: await fillHazmatPacks(required, session),
			name: hazmatQuizFilename("packs", "deck-officers", date),
			readyLabel: `Study + quiz · ${required.length} mates`
		}));
	}
	function printKey() {
		return run("key", async () => ({
			bytes: await fillHazmatAnswerKey(session),
			name: hazmatQuizFilename("key", "CHIEF-MATE-ONLY", date),
			readyLabel: "Answer key — keep this"
		}));
	}
	function printStudy() {
		return run("study", async () => ({
			bytes: await fillHazmatStudy(null, session),
			name: hazmatQuizFilename("study", "blank", date),
			readyLabel: "Blank study sheet"
		}));
	}
	function printBlankQuiz() {
		return run("quiz", async () => ({
			bytes: await fillHazmatQuiz(null, session),
			name: hazmatQuizFilename("quiz", "blank", date),
			readyLabel: "Blank extra quiz (bosun / AB if you need one)"
		}));
	}
	function printSeat(seat) {
		return run(seat.crewId, async () => ({
			bytes: await fillHazmatPersonPack(seat, session),
			name: hazmatPersonFilename(seat, date),
			readyLabel: `${seat.fullName} · study + quiz`
		}));
	}
	const saveMut = useMutation({
		mutationFn: recordHazmatQuiz,
		onSuccess: async () => {
			await qc.invalidateQueries({ queryKey: ["nse-board"] });
			await qc.invalidateQueries({ queryKey: ["crew"] });
			await qc.invalidateQueries({ queryKey: ["expiring"] });
		}
	});
	async function saveAndPrint(seat) {
		const g = grades[seat.crewId];
		const score = Number(g?.score);
		const issued = g?.date || date;
		if (!passedHazmat(score)) {
			toast.error(`16 of ${HAZMAT_QUESTIONS.length} to pass. No certificate on a fail.`);
			return;
		}
		remember();
		setBusy(`cert-${seat.crewId}`);
		try {
			await saveMut.mutateAsync({ data: {
				crewId: seat.crewId,
				issued,
				score,
				instructorName: session.instructorName
			} });
			const bytes = await fillHazmatCertificate(seat, {
				...session,
				date: issued
			}, score);
			const name = hazmatCertFilename(seat, issued);
			const url = downloadPdf(bytes, name);
			pushReady(`${seat.fullName} · ${score}/${HAZMAT_QUESTIONS.length} cert`, name, url);
			toast.success(`${seat.fullName} passed ${score}/${HAZMAT_QUESTIONS.length}. Sign the cert.`);
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Could not save score");
		} finally {
			setBusy(null);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			kicker: "HAZMAT",
			title: "Hand them the quiz. Grade it later.",
			description: `${required.length} seats required: Master and the three mates. Bosun and ABs are not on the SMS H mark. ${HAZMAT_QUESTIONS.length} questions, 16 to pass, valid 3 years.`
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "mb-6 rounded-xl bg-paper p-5 shadow-border sm:p-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] sm:items-end",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mb-1 block text-[11px] uppercase tracking-wider text-sage",
						children: "Date on the papers"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						type: "date",
						value: date,
						onChange: (e) => setDate(e.target.value)
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mb-1 block text-[11px] uppercase tracking-wider text-sage",
						children: "Your name (prints as instructor)"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: instructor,
						onChange: (e) => setInstructor(e.target.value),
						placeholder: "Sorin Rosca, Chief Mate"
					})]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-3 text-xs text-muted",
				children: [
					VESSEL,
					" · ",
					HAZMAT_CFR,
					".",
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: SMS_TRAINING.per06.url,
						className: "text-steel-2 hover:underline",
						target: "_blank",
						rel: "noreferrer",
						children: "SMM-PER-06"
					}),
					" · ",
					"H = 1 per vessel if carrying HAZMAT. Not SMM-OPS-11."
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
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
			className: "mb-8 grid gap-4 lg:grid-cols-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex flex-col rounded-xl bg-paper p-5 shadow-border",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[11px] uppercase tracking-[0.16em] text-sage",
							children: "1 · Hand out"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "mt-1 font-display text-xl tracking-tight",
							children: "Study + quiz"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm text-muted",
							children: "One pack per mate: study sheet then the 20-question test. They sit it without you."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-auto flex flex-col gap-2 pt-5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								onClick: () => void printPacks(),
								disabled: Boolean(busy) || !required.length,
								children: busy === "packs" ? "Printing…" : `Print ${required.length} packs`
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "outline",
								onClick: () => void printStudy(),
								disabled: Boolean(busy),
								children: "Extra study sheet"
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex flex-col rounded-xl bg-paper p-5 shadow-border",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[11px] uppercase tracking-[0.16em] text-sage",
							children: "2 · You keep"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "mt-1 font-display text-xl tracking-tight",
							children: "Answer key"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm text-muted",
							children: "Do not put this in the stack you hand out. Grade when they come back."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-auto flex flex-col gap-2 pt-5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								onClick: () => void printKey(),
								disabled: Boolean(busy),
								children: busy === "key" ? "Printing…" : "Print answer key"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "outline",
								onClick: () => void printBlankQuiz(),
								disabled: Boolean(busy),
								children: "Extra blank quiz"
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex flex-col rounded-xl bg-paper p-5 shadow-border",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[11px] uppercase tracking-[0.16em] text-sage",
							children: "3 · After they pass"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "mt-1 font-display text-xl tracking-tight",
							children: "Enter the score"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-2 text-sm text-muted",
							children: [
								16,
								" of ",
								HAZMAT_QUESTIONS.length,
								" to pass. Saving prints the certificate and stamps the NSE board."
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-auto pt-5 text-sm text-muted",
							children: "Use the table below. Signature stays blank."
						})
					]
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-xl tracking-tight",
				children: "Who takes it"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-1 flex flex-wrap items-end justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: "SMS H mark is Master and the three mates. Bosun and ABs are not required by the book — if they actually handle DG, 49 CFR 176.13 still applies: print a pack, grade it, save the cert here."
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "shrink-0 text-sm text-steel-2 hover:underline",
					onClick: () => setShowAll((v) => !v),
					children: showAll ? "Hide ratings" : `Show ${seats.length - required.length} ratings (not required)`
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4 min-w-0 overflow-x-auto rounded-xl shadow-border",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full min-w-[720px] text-left text-sm",
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
								className: "px-4 py-3",
								children: "SMS"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("th", {
								className: "px-4 py-3",
								children: ["Score / ", HAZMAT_QUESTIONS.length]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-4 py-3",
								children: "Test date"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: "px-4 py-3" })
						] })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", {
						className: "divide-y divide-border bg-paper",
						children: [visible.map((s) => {
							const g = grades[s.crewId] ?? {
								score: "",
								date
							};
							const n = Number(g.score);
							const ok = passedHazmat(n);
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: s.required ? "" : "opacity-70",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
										className: "px-4 py-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
											to: "/crew/$crewId",
											params: { crewId: s.crewId },
											className: "font-medium hover:underline",
											children: s.fullName
										}), s.lastScore != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "text-xs text-muted",
											children: [
												"On file ",
												s.lastScore,
												"/",
												HAZMAT_QUESTIONS.length,
												s.lastIssued ? ` · ${formatMdY(s.lastIssued)}` : ""
											]
										}) : null]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-4 py-3 text-muted",
										children: s.positionLabel
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-4 py-3",
										children: s.required ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											tone: "ok",
											children: "Required"
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, { children: "Not SMS" })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-4 py-3",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											className: "w-20",
											inputMode: "numeric",
											value: g.score,
											onChange: (e) => setGrades((prev) => ({
												...prev,
												[s.crewId]: {
													...g,
													score: e.target.value
												}
											})),
											placeholder: "0–20"
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-4 py-3",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											type: "date",
											className: "w-40",
											value: g.date,
											onChange: (e) => setGrades((prev) => ({
												...prev,
												[s.crewId]: {
													...g,
													date: e.target.value
												}
											}))
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-4 py-3 text-right",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex justify-end gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												size: "sm",
												variant: "ghost",
												disabled: Boolean(busy),
												onClick: () => void printSeat(s),
												children: "Pack"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												size: "sm",
												disabled: Boolean(busy) || !ok,
												onClick: () => void saveAndPrint(s),
												className: cn(!ok && "opacity-50"),
												children: busy === `cert-${s.crewId}` ? "Saving…" : "Save + cert"
											})]
										})
									})
								]
							}, s.crewId);
						}), !seats.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							colSpan: 6,
							className: "px-4 py-10 text-center text-muted",
							children: roster.isLoading ? "Loading articles…" : "Nobody is signed on."
						}) }) : null]
					})]
				})
			})
		] })
	] });
}
//#endregion
export { Page as component };
