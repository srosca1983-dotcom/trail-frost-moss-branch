import { o as __toESM } from "../_runtime.mjs";
import { S as todayUtc, c as expiryTone, o as departmentLabel, p as inferDepartment } from "./ratings-WR-IukGV.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { t as Button } from "./button-DnbeV2iT.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Input } from "./input-B2bEx-Se.mjs";
import { t as PDFDocument } from "../_libs/pdf-lib.mjs";
import { o as downloadPdf } from "./crew-list-C9XRi5ZX.mjs";
import { i as fillNameParts, n as emptyPerson } from "./parse-fields-D8gZUQV3.mjs";
import { i as loadPacketTemplate, r as fillSignOnPacket } from "./fill-packet-DnOdnJLk.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/smm-print-panel-C6DUru57.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** Company SMM appendices we can fill and print. SOCP SASH is a course cert, not this packet. */
var PRINTABLE_SMM_KINDS = [
	"fam",
	"cyber",
	"internet"
];
var PRINTABLE_SMM = {
	fam: {
		page: "fam",
		label: "Familiarization",
		code: "SMM-PER-05-AP1",
		short: "Familiarization"
	},
	cyber: {
		page: "cyber",
		label: "Cyber security training",
		code: "SMM-SMM-08-AP3",
		short: "M1 Aware"
	},
	internet: {
		page: "internet",
		label: "Internet usage policy",
		code: "SMM-SMM-08-AP4",
		short: "Internet"
	}
};
function isPrintableSmm(kind) {
	return PRINTABLE_SMM_KINDS.includes(kind);
}
function expiredPrintableSmm(certs) {
	if (Array.isArray(certs)) return PRINTABLE_SMM_KINDS.filter((k) => certs.some((d) => d.docType === k && expiryTone(d.expiresOn ?? null) === "expired"));
	return PRINTABLE_SMM_KINDS.filter((k) => {
		const cell = certs[k];
		if (!cell) return false;
		if (cell.required === false) return false;
		return cell.tone === "expired";
	});
}
function personForSmmPrint(opts) {
	const p = emptyPerson();
	p.fullName = opts.fullName;
	p.firstName = opts.firstName ?? null;
	p.lastName = opts.lastName ?? null;
	p.lastPosition = opts.position ?? null;
	return fillNameParts(p);
}
function departmentForSmm(position, fallback = "deck") {
	return inferDepartment(position) ?? fallback;
}
async function fillExpiredSmmPack(input, template) {
	const initials = input.officerInitials.trim().toUpperCase();
	if (!initials) throw new Error("Enter your initials for the Fam. Officer column.");
	if (!input.officerName?.trim()) throw new Error("Enter your full name — it goes on the form as the officer.");
	if (!input.jobs.length) throw new Error("Pick a mariner and a certificate to print.");
	const blank = template ?? await loadPacketTemplate();
	const out = await PDFDocument.create();
	for (const job of input.jobs) {
		if (!job.kinds.length) continue;
		const bytes = await fillSignOnPacket({
			person: job.person,
			startDate: input.date,
			officerInitials: initials,
			officerName: input.officerName.trim(),
			department: job.department,
			include: job.kinds.map((k) => PRINTABLE_SMM[k].page)
		}, blank);
		const src = await PDFDocument.load(bytes);
		const copied = await out.copyPages(src, src.getPageIndices());
		for (const page of copied) out.addPage(page);
	}
	if (out.getPageCount() === 0) throw new Error("No expired SMM forms to print.");
	return out.save({ updateFieldAppearances: false });
}
function smmPackFilename(date, oneName) {
	return `George-II-SMM-${(oneName ?? "expired").replace(/[^A-Za-z0-9]+/g, "")}-${date}.pdf`;
}
function smmLine(kind) {
	return `${PRINTABLE_SMM[kind].short} · ${PRINTABLE_SMM[kind].code}`;
}
var INITIALS_KEY = "crew-ledger-fam-initials";
var NAME_KEY = "crew-ledger-fam-officer-name";
function SmmPrintPanel({ items, compact }) {
	const [initials, setInitials] = (0, import_react.useState)(() => {
		if (typeof window === "undefined") return "";
		return localStorage.getItem(INITIALS_KEY) ?? "";
	});
	const [officerName, setOfficerName] = (0, import_react.useState)(() => {
		if (typeof window === "undefined") return "";
		return localStorage.getItem(NAME_KEY) ?? "";
	});
	const [date, setDate] = (0, import_react.useState)(() => todayUtc().toISOString().slice(0, 10));
	const [dept, setDept] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [picked, setPicked] = (0, import_react.useState)({});
	const [kinds, setKinds] = (0, import_react.useState)({});
	const available = (0, import_react.useMemo)(() => items.filter((i) => i.kinds.length), [items]);
	function selectedKinds(id, fallback) {
		return kinds[id] ?? fallback;
	}
	const jobsReady = available.filter((i) => compact ? true : picked[i.crewId]).filter((i) => selectedKinds(i.crewId, i.kinds).length);
	const needsDept = jobsReady.some((i) => selectedKinds(i.crewId, i.kinds).includes("fam") && !inferDepartment(i.position ?? i.person?.lastPosition));
	if (!available.length) return null;
	function togglePerson(id) {
		setPicked((prev) => ({
			...prev,
			[id]: !prev[id]
		}));
	}
	function toggleKind(id, kind, allowed) {
		setKinds((prev) => {
			const cur = prev[id] ?? allowed;
			const next = cur.includes(kind) ? cur.filter((k) => k !== kind) : [...cur, kind];
			return {
				...prev,
				[id]: next.filter((k) => allowed.includes(k))
			};
		});
	}
	async function print() {
		const who = initials.trim().toUpperCase();
		const name = officerName.trim();
		if (!name) {
			toast.error("Type your full name — it goes on the form as the officer.");
			return;
		}
		if (!who) {
			toast.error("Enter your initials — they go in the Fam. Officer column.");
			return;
		}
		if (!jobsReady.length) {
			toast.error(compact ? "No expired SMM on this file." : "Check the mariner and the certificate to print.");
			return;
		}
		if (needsDept && !dept) {
			toast.error("Pick Deck, Engine, or Steward for familiarization.");
			return;
		}
		try {
			localStorage.setItem(INITIALS_KEY, who);
			localStorage.setItem(NAME_KEY, name);
		} catch {}
		setBusy(true);
		try {
			const pack = jobsReady.map((i) => ({
				person: i.person ?? personForSmmPrint({
					fullName: i.fullName,
					position: i.position
				}),
				kinds: selectedKinds(i.crewId, i.kinds),
				department: departmentForSmm(i.position ?? i.person?.lastPosition, dept || "deck")
			}));
			const bytes = await fillExpiredSmmPack({
				jobs: pack,
				date,
				officerInitials: who,
				officerName: name
			});
			const one = pack.length === 1 ? jobsReady[0].fullName : "expired";
			downloadPdf(bytes, smmPackFilename(date, one));
			toast.success(`Printed ${pack.length} SMM form${pack.length === 1 ? "" : "s"}. Ticket dates stay expired until you update them.`);
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Could not fill the SMM forms");
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "rounded-xl bg-paper p-4 shadow-border",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-start justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-lg tracking-tight",
					children: "Print expired SMM"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted",
					children: "Pick the person and the form. Familiarization, cyber (AP3), and internet policy only. Your name and initials are filled in. They still sign. This does not renew the ticket."
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					onClick: () => void print(),
					disabled: busy,
					children: busy ? "Filling…" : compact ? "Print" : "Print selected"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 flex flex-wrap gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "block text-xs text-muted",
						children: ["Your full name", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: officerName,
							onChange: (e) => setOfficerName(e.target.value),
							className: "mt-1 w-56",
							placeholder: "Christopher Kluck",
							autoComplete: "name"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "block text-xs text-muted",
						children: ["Your initials", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: initials,
							onChange: (e) => setInitials(e.target.value.toUpperCase()),
							className: "mt-1 w-28 uppercase",
							maxLength: 6,
							placeholder: "CK",
							autoComplete: "off"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "block text-xs text-muted",
						children: ["Date on the form", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							type: "date",
							value: date,
							onChange: (e) => setDate(e.target.value),
							className: "mt-1 w-44"
						})]
					}),
					needsDept ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "block text-xs text-muted",
						children: ["Department", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							value: dept,
							onChange: (e) => setDept(e.target.value),
							className: "mt-1 flex h-10 w-40 rounded-md border border-border bg-paper px-3 text-sm text-ink",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "",
								children: "Pick…"
							}), [
								"deck",
								"engine",
								"steward"
							].map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: d,
								children: departmentLabel(d)
							}, d))]
						})]
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-3 divide-y divide-border rounded-lg bg-paper-2/60 text-sm",
				children: available.map((i) => {
					const on = compact || Boolean(picked[i.crewId]);
					const sel = selectedKinds(i.crewId, i.kinds);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "px-3 py-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "flex items-center gap-2 font-medium",
							children: [compact ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "checkbox",
								checked: on,
								onChange: () => togglePerson(i.crewId)
							}), i.fullName]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-1 flex flex-wrap gap-3 pl-6 text-xs text-muted",
							children: PRINTABLE_SMM_KINDS.filter((k) => i.kinds.includes(k)).map((k) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "inline-flex items-center gap-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "checkbox",
									checked: sel.includes(k),
									disabled: !on,
									onChange: () => toggleKind(i.crewId, k, i.kinds)
								}), smmLine(k)]
							}, k))
						})]
					}, i.crewId);
				})
			})
		]
	});
}
//#endregion
export { expiredPrintableSmm as n, isPrintableSmm as r, SmmPrintPanel as t };
