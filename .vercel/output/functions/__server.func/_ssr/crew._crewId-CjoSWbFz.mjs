import { o as __toESM } from "../_runtime.mjs";
import { n as COMPANY_ADDRESS, s as VESSEL, t as COMPANY } from "./types-DLRYosVU.mjs";
import { S as todayUtc, a as daysUntil, b as requirementApplies, d as formatShort, i as daysAboard, l as formatDate, t as addDays, u as formatMdY, y as positionLabel } from "./ratings-WR-IukGV.mjs";
import { _ as watchLabel, a as isOfficerRotary, i as extraTripsLabel, p as setDateFromTour, t as computeDueOff, u as remainingCoveredDays } from "./shipping-CitWW3XC.mjs";
import { a as coveringLabel, c as isRatedUp, d as remainingUpgrades, n as PERMANENT_CREW } from "./permanents-isWOFthL.mjs";
import { i as NSE_SHORT, n as NSE_KINDS, t as NSE_CODES } from "./nse-D-shPCWK.mjs";
import { t as detailToParsed } from "./map-BNPCZVrT.mjs";
import { a as sameGivenName, i as sameFamilyName, n as DOC_TYPE_TO_REQ } from "./requirements-DItXa5vY.mjs";
import { f as walkOff, o as enoadGaps } from "./ports-C0XwVrj0.mjs";
import { l as require_react_dom, u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { b as useNavigate, v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { t as Button } from "./button-DnbeV2iT.mjs";
import { S as ArrowLeft } from "../_libs/lucide-react.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { D as getVesselRun, F as rateUp, H as updateCrewIdentity, M as mergeCrewFiles, N as parsePackets, O as listCrew, _ as commitTickets, c as Route$2, j as listRequirements, n as addExtraDays, v as deleteCrew, x as getCrew, y as dropBackToPermanent, z as setCrewStatus } from "./router-QLPwsRgl.mjs";
import { n as Desk, t as Badge } from "./badge-DfXuB0XH.mjs";
import { t as Input } from "./input-B2bEx-Se.mjs";
import { t as ExtraDaysControl } from "./extra-days-DIx_BHCm.mjs";
import { t as ExpiryChip } from "./expiry-chip-Booas4nG.mjs";
import { t as PortSelect } from "./port-select-ClZxXIOw.mjs";
import { t as CrewPicker } from "./crew-picker-Cxok1PNn.mjs";
import { n as StandardFonts, r as rgb, t as PDFDocument } from "../_libs/pdf-lib.mjs";
import { o as downloadPdf } from "./crew-list-C9XRi5ZX.mjs";
import { a as ticketFileProblem, i as slimPacket, n as packetFromFile, t as TICKET_ACCEPT } from "./pdf-ibO_ah6S.mjs";
import { t as invalidateDesk } from "./desk-query-IlzSwsjD.mjs";
import { n as expiredPrintableSmm, t as SmmPrintPanel } from "./smm-print-panel-C6DUru57.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/crew._crewId-CjoSWbFz.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var import_react_dom = /* @__PURE__ */ __toESM(require_react_dom());
var INK = rgb(.05, .08, .1);
var RULE = rgb(.15, .18, .2);
var MUTED = rgb(.35, .38, .4);
function ascii(text) {
	return text.replace(/[^\x20-\x7E]/g, " ").replace(/\s+/g, " ").trim();
}
function signOffFilename(input, date = todayUtc().toISOString().slice(0, 10)) {
	return `George-II-leaving-${(input.lastName || input.fullName || "crew").replace(/[^A-Za-z0-9]+/g, "")}-${date}.pdf`;
}
/** One-page leaving sheet for the person getting off. Not the join packet. */
async function buildSignOffPdf(input) {
	const pdf = await PDFDocument.create();
	const page = pdf.addPage([612, 792]);
	const font = await pdf.embedFont(StandardFonts.Helvetica);
	const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
	const off = input.signOff || todayUtc().toISOString().slice(0, 10);
	const port = input.thisPort || input.port || "";
	let y = 740;
	page.drawText(VESSEL, {
		x: 54,
		y,
		size: 11,
		font: bold,
		color: INK
	});
	y -= 16;
	page.drawText(COMPANY, {
		x: 54,
		y,
		size: 9,
		font,
		color: MUTED
	});
	y -= 28;
	page.drawText("Leaving articles", {
		x: 54,
		y,
		size: 22,
		font: bold,
		color: INK
	});
	y -= 18;
	page.drawText("For the person getting off this port. Billet goes vacant after they sign off.", {
		x: 54,
		y,
		size: 10,
		font,
		color: MUTED
	});
	y -= 16;
	page.drawLine({
		start: {
			x: 54,
			y
		},
		end: {
			x: 558,
			y
		},
		thickness: .8,
		color: RULE
	});
	y -= 28;
	const rows = [
		["Name", ascii(input.fullName)],
		["Billet", ascii([input.billetCode, positionLabel(input.position)].filter(Boolean).join(" · "))],
		["Watch", ascii(input.watch ?? "")],
		["Assignment", ascii((input.assignmentType ?? "").toLowerCase())],
		["Signed on", formatShort(input.signOn)],
		["Due off", formatShort(input.dueOff)],
		["Discharge", formatShort(off)],
		["This port", ascii(port)]
	];
	for (const [k, v] of rows) {
		page.drawText(k, {
			x: 54,
			y,
			size: 9,
			font,
			color: MUTED
		});
		page.drawText(v || "—", {
			x: 180,
			y,
			size: 11,
			font: bold,
			color: INK
		});
		y -= 22;
	}
	y -= 12;
	page.drawLine({
		start: {
			x: 54,
			y
		},
		end: {
			x: 558,
			y
		},
		thickness: .6,
		color: RULE
	});
	y -= 28;
	page.drawText("Mariner", {
		x: 54,
		y,
		size: 9,
		font,
		color: MUTED
	});
	page.drawText("Chief Mate", {
		x: 320,
		y,
		size: 9,
		font,
		color: MUTED
	});
	y -= 36;
	page.drawLine({
		start: {
			x: 54,
			y
		},
		end: {
			x: 250,
			y
		},
		thickness: .7,
		color: RULE
	});
	page.drawLine({
		start: {
			x: 320,
			y
		},
		end: {
			x: 516,
			y
		},
		thickness: .7,
		color: RULE
	});
	y -= 14;
	page.drawText("Signature / date", {
		x: 54,
		y,
		size: 8,
		font,
		color: MUTED
	});
	page.drawText("Signature / date", {
		x: 320,
		y,
		size: 8,
		font,
		color: MUTED
	});
	page.drawText(`${COMPANY_ADDRESS}  ·  ${formatMdY(off)}`, {
		x: 54,
		y: 48,
		size: 8,
		font,
		color: MUTED
	});
	return pdf.save();
}
function Page() {
	const { crewId } = Route$2.useParams();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Desk, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Profile, { id: crewId }, crewId) });
}
function Profile({ id }) {
	const qc = useQueryClient();
	const nav = useNavigate();
	const q = useQuery({
		queryKey: ["crew", id],
		queryFn: () => getCrew({ data: { id } }),
		initialData: Route$2.useLoaderData()
	});
	const reqs = useQuery({
		queryKey: ["requirements"],
		queryFn: () => listRequirements()
	});
	const [tab, setTab] = (0, import_react.useState)("overview");
	const [reading, setReading] = (0, import_react.useState)(false);
	const [over, setOver] = (0, import_react.useState)(false);
	const [deleteTyped, setDeleteTyped] = (0, import_react.useState)("");
	const [mergePick, setMergePick] = (0, import_react.useState)("");
	const [mergeTyped, setMergeTyped] = (0, import_react.useState)("");
	const statusMut = useMutation({
		mutationFn: (status) => setCrewStatus({ data: {
			id,
			status,
			signOff: status === "current" ? null : (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)
		} }),
		onSuccess: (res, status) => {
			invalidateDesk(qc);
			if (status === "past") toast.success("Off articles. Billet vacant. Leaving sheet downloaded.");
			else if (res.resumed && res.dueOff) {
				const left = res.remaining != null && res.tourDays != null ? `${res.remaining} of ${res.tourDays} days left · ` : "";
				toast.success(`Back aboard. ${left}due off ${formatDate(res.dueOff)}`);
			} else if (res.remaining != null && !res.resumed) toast.success(`Rotary leave started. Clock paused with ${res.remaining} of ${res.tourDays ?? 120} days left.`);
			else toast.success("Back aboard.");
			if (res.warning) toast.message(res.warning);
		},
		onError: (e) => toast.error(e instanceof Error ? e.message : "Could not update articles")
	});
	const rateMut = useMutation({
		mutationFn: rateUp,
		onSuccess: (res) => {
			invalidateDesk(qc);
			toast.success(res.question ?? "Rate updated");
		},
		onError: (e) => toast.error(e instanceof Error ? e.message : "Could not rate up")
	});
	const dropMut = useMutation({
		mutationFn: dropBackToPermanent,
		onSuccess: () => {
			invalidateDesk(qc);
			toast.success("Back on their permanent job");
		},
		onError: (e) => toast.error(e instanceof Error ? e.message : "Could not drop back")
	});
	const extraMut = useMutation({
		mutationFn: addExtraDays,
		onSuccess: (res) => {
			invalidateDesk(qc);
			toast.success(res.due.date ? `Due off ${formatDate(res.due.date)}` : "Extra days saved");
		},
		onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save extra days")
	});
	const deleteMut = useMutation({
		mutationFn: () => deleteCrew({ data: { id } }),
		onSuccess: (res) => {
			invalidateDesk(qc);
			toast.success(`${res.fullName} removed from the ledger.`);
			nav({ to: "/crew" });
		},
		onError: (e) => toast.error(e instanceof Error ? e.message : "Could not delete that file")
	});
	const rosterQ = useQuery({
		queryKey: ["crew"],
		queryFn: () => listCrew(),
		staleTime: 6e4
	});
	const mergeMut = useMutation({
		mutationFn: (otherId) => mergeCrewFiles({ data: {
			a: id,
			b: otherId
		} }),
		onSuccess: (res) => {
			invalidateDesk(qc);
			toast.success(`Kept ${res.keepName}. Removed ${res.absorbedName}.`);
			setMergePick("");
			setMergeTyped("");
			if (res.keepId !== id) nav({
				to: "/crew/$crewId",
				params: { crewId: res.keepId }
			});
			else q.refetch();
		},
		onError: (e) => toast.error(e instanceof Error ? e.message : "Could not combine those files")
	});
	const identMut = useMutation({
		mutationFn: updateCrewIdentity,
		onSuccess: () => {
			invalidateDesk(qc);
			toast.success("Coast Guard fields saved");
			setEditingIdent(false);
		},
		onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save identity")
	});
	const runQ = useQuery({
		queryKey: ["vessel-run"],
		queryFn: () => getVesselRun()
	});
	const [editingIdent, setEditingIdent] = (0, import_react.useState)(false);
	const [signOffOpen, setSignOffOpen] = (0, import_react.useState)(false);
	const c = q.data;
	if (q.isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-muted",
		children: "Opening file…"
	});
	if (!c) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-muted",
		children: "Mariner not found."
	});
	const formCodes = new Set(c.forms.map((f) => f.formCode.toUpperCase()));
	const docCodes = new Set(c.documents.map((d) => DOC_TYPE_TO_REQ[d.docType]).filter(Boolean));
	const permanent = PERMANENT_CREW.find((p) => p.id === c.id);
	const ratedUp = isRatedUp(c.permanentRating, c.lastPosition);
	const upgrades = remainingUpgrades(c.permanentRating, c.lastPosition);
	const openTour = c.tours.find((t) => !t.signOff) ?? c.tours[0];
	const rotary = isOfficerRotary(openTour?.unionHall ?? c.unionHall, openTour?.assignmentType ?? c.assignmentType);
	const kind = (openTour?.assignmentType ?? c.assignmentType ?? "").toUpperCase();
	const leaveUsed = rotary && ((openTour?.leaveCount ?? 0) >= 1 || Boolean(openTour?.leaveStartedOn));
	const canLeave = c.status === "current" && kind !== "RELIEF" && kind !== "CADET" && kind !== "APPRENTICE" && !leaveUsed;
	const crewId = c.id;
	const crewName = c.fullName;
	async function ingestTicket(file) {
		const problem = ticketFileProblem(file);
		if (problem) {
			toast.error(problem);
			return;
		}
		setReading(true);
		try {
			const payload = slimPacket(await packetFromFile(file));
			const r = (await parsePackets({ data: {
				packets: [payload],
				skipBust: true
			} }))[0];
			if (!r?.person) throw new Error(r?.error ?? "Could not read that file. Drop the passport or MMC photo by itself.");
			if (r.person.lastName && c.lastName && !sameFamilyName(r.person.lastName, c.lastName)) {
				toast.error(`That packet is ${r.person.fullName}, not ${crewName}. Drop it on Inbox so it opens its own file.`);
				return;
			}
			if (r.person.lastName && c.lastName && sameFamilyName(r.person.lastName, c.lastName) && r.person.firstName && c.firstName && r.person.firstName.replace(/[^A-Za-z]/g, "").length >= 2 && !sameGivenName(r.person.firstName, c.firstName)) {
				toast.error(`That packet is ${r.person.fullName}, not ${crewName}. Drop it on Inbox if it is a different mariner.`);
				return;
			}
			if (!r.person.documents.length) {
				toast.error("Matched the name. Tickets were not on that scan — drop the passport or MMC photo.");
				return;
			}
			const res = await commitTickets({ data: {
				crewId,
				person: r.person,
				filename: file.name
			} });
			await invalidateDesk(qc);
			const readAs = r.person.fullName && r.person.fullName !== crewName ? ` Read as ${r.person.fullName}.` : "";
			toast.success(`Saved ${res.upserted} ticket${res.upserted === 1 ? "" : "s"} to ${crewName}.${readAs}`);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Could not read that file");
		} finally {
			setReading(false);
		}
	}
	const openLeave = openTour?.leaveStartedOn ? daysAboard(openTour.leaveStartedOn) ?? 0 : 0;
	const clock = openTour ? remainingCoveredDays({
		signOn: openTour.signOn,
		unionHall: openTour.unionHall ?? c.unionHall,
		assignmentType: openTour.assignmentType ?? c.assignmentType,
		siuClass: openTour.seniorityClass ?? c.seniorityClass ?? null,
		lengthDays: openTour.lengthDays,
		extraDays: openTour.extraDays,
		leaveDays: openTour.leaveDays,
		leaveStartedOn: openTour.leaveStartedOn
	}) : null;
	const computedDue = openTour ? computeDueOff({
		signOn: openTour.signOn,
		unionHall: openTour.unionHall ?? c.unionHall,
		assignmentType: openTour.assignmentType ?? c.assignmentType,
		siuClass: openTour.seniorityClass ?? c.seniorityClass ?? null,
		lengthDays: openTour.lengthDays,
		explicitEnd: setDateFromTour(openTour),
		extraDays: openTour.extraDays,
		leaveDays: (openTour.leaveDays ?? 0) + openLeave
	}) : null;
	const daysLeft = daysUntil(computedDue?.date ?? openTour?.dueOff);
	const walk = walkOff({
		daysLeft,
		embarkPort: openTour?.port,
		thisPort: runQ.data?.thisPort ?? "Long Beach",
		nextPort: runQ.data?.nextPort ?? "Honolulu"
	});
	const medical = c.documents.find((d) => d.docType === "medical");
	const drugFree = c.documents.find((d) => d.docType === "drug_free");
	const expiredSmm = expiredPrintableSmm(c.documents);
	const mergeOther = (rosterQ.data ?? []).find((p) => p.id === mergePick) ?? null;
	const namesDiffer = Boolean(mergeOther?.lastName && c.lastName && !sameFamilyName(c.lastName, mergeOther.lastName));
	const coastGaps = enoadGaps({
		lastName: c.lastName,
		fullName: c.fullName,
		dob: c.dob,
		sex: c.sex,
		passportNumber: c.passportNumber,
		mmcNumber: c.mmcNumber,
		passportExpiration: c.passportExpiration,
		mmcExpiration: c.mmcExpiration,
		embarkPort: openTour?.port
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
			to: "/crew",
			className: "mb-4 inline-flex items-center gap-1 text-sm text-steel-2 hover:underline",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "size-4" }), " Roster"]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[11px] uppercase tracking-[0.16em] text-sage",
					children: VESSEL
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-1 font-display text-3xl tracking-tight sm:text-4xl",
					children: c.fullName
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-2 flex flex-wrap items-center gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							tone: c.status === "current" ? "current" : c.status === "vacation" ? "steel" : c.status === "applicant" ? "steel" : "past",
							children: c.status === "vacation" && openTour?.leaveStartedOn ? "rotary leave" : c.status
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-sm text-muted",
							children: [
								c.billetCode ? `${c.billetCode} · ` : "",
								positionLabel(c.lastPosition),
								c.watch ? ` · ${watchLabel(c.watch)}` : ""
							]
						}),
						c.ssLast4 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "font-mono text-xs text-faint",
							children: ["··", c.ssLast4]
						}) : null,
						ratedUp ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							tone: "watch",
							children: "rated up"
						}) : null
					]
				})
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-2",
				children: [c.status !== "current" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					onClick: () => statusMut.mutate("current"),
					children: openTour?.leaveStartedOn ? "Return from leave" : "Mark aboard"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					type: "button",
					onClick: () => setSignOffOpen(true),
					children: "Sign off — they are leaving"
				}), canLeave ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					onClick: () => statusMut.mutate("vacation"),
					children: rotary ? "Rotary leave" : "On vacation"
				}) : null] }), c.status !== "current" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					asChild: true,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/sign-on",
						search: { crewId: c.id },
						children: "Sign them back on"
					})
				}) : null]
			})]
		}),
		c.tours.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-4 rounded-lg bg-paper-2 px-4 py-3 text-sm",
			children: openTour?.leaveStartedOn && c.status === "vacation" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				"On rotary leave since ",
				formatDate(openTour.leaveStartedOn),
				".",
				clock?.remaining != null && clock.tourDays != null ? ` ${clock.remaining} of ${clock.tourDays} covered days left.` : "",
				computedDue?.date ? ` Due off ${formatDate(computedDue.date)} if they return today.` : ""
			] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				"Been on ",
				VESSEL,
				" ",
				c.tours.length === 1 ? "once" : `${c.tours.length} times`,
				". Last signed on",
				" ",
				formatDate(c.tours[0].signOn),
				c.tours[0].signOff ? ` · off ${formatDate(c.tours[0].signOff)}` : c.status === "current" ? ` · articles open${computedDue?.date ?? c.tours[0].dueOff ? ` · due off ${formatDate(computedDue?.date ?? c.tours[0].dueOff)}` : ""}${walk.when === "next" ? ` · they walk next ${walk.port}, not this ${runQ.data?.thisPort ?? "call"}` : walk.thisCall ? ` · this ${walk.port}` : ""}` : " · signed off",
				"."
			] })
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-4 rounded-lg bg-paper-2 px-4 py-3 text-sm",
			children: c.status === "vacation" ? "Permanent on vacation. No open tour." : "No George II tour on file yet."
		}),
		c.status === "current" && coastGaps.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 rounded-xl bg-warn/15 px-4 py-3 text-sm",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "font-medium",
				children: [
					"Master cannot file eNOAD until: ",
					coastGaps.join(", "),
					"."
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-muted",
				children: "Type it on this file. Long Beach and Honolulu both need it."
			})]
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-6 flex gap-1 rounded-lg bg-paper-2 p-1",
			children: [
				"overview",
				"docs",
				"tours",
				"packet"
			].map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => setTab(t),
				className: `rounded-md px-3 py-1.5 text-sm capitalize ${tab === t ? "bg-ink text-paper" : "text-muted"}`,
				children: t === "docs" ? "Tickets" : t
			}, t))
		}),
		tab === "overview" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-6 grid gap-4 lg:grid-cols-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					title: "Assignment",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							k: "Sailing",
							v: c.billetCode ? `${c.billetCode} · ${positionLabel(c.lastPosition)}` : positionLabel(c.lastPosition)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							k: "Permanent job",
							v: c.permanentRating ? positionLabel(c.permanentRating) : c.assignmentType === "PERMANENT" ? "Permanent — seat not assigned" : null
						}),
						ratedUp ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							k: "Covering",
							v: coveringLabel(c.permanentRating, c.lastPosition)
						}) : null,
						openTour?.assignmentType === "RELIEF" && openTour.relieving ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							k: "Covering",
							v: openTour.relieving
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							k: "Watch",
							v: watchLabel(c.watch)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							k: "Union",
							v: c.unionHall
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							k: "Type",
							v: c.assignmentType === "RELIEF" && openTour?.relieving ? `relief covering ${openTour.relieving}` : c.assignmentType ? c.assignmentType.toLowerCase() : null
						}),
						c.seniorityClass ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							k: "SIU class",
							v: c.seniorityClass
						}) : null,
						openTour && !openTour.signOff ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								k: "Due off",
								v: formatDate(computedDue?.date ?? openTour.dueOff),
								extra: daysLeft != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									tone: daysLeft < 0 ? "expired" : walk.thisCall ? "soon" : walk.when === "next" ? "watch" : "ok",
									children: daysLeft < 0 ? `Overdue ${Math.abs(daysLeft)}d` : walk.when === "next" ? `${daysLeft}d left · next ${walk.port}` : `${daysLeft}d left`
								}) : void 0
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								k: "Rule",
								v: computedDue?.rule ?? openTour.dueOffRule
							}),
							rotary && clock && clock.tourDays != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								k: (openTour.unionHall ?? c.unionHall) === "MEBA" ? "MEBA 90-day clock" : "MM&P 120-day clock",
								v: clock.remaining == null ? null : `${clock.covered ?? 0} covered · ${clock.remaining} remaining`,
								extra: openTour.leaveStartedOn ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									tone: "steel",
									children: "paused"
								}) : void 0
							}) : null,
							openTour.leaveDays ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								k: "Leave taken",
								v: `${openTour.leaveDays}d (not covered employment)`
							}) : null,
							openTour.leaveStartedOn ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								k: "Leave started",
								v: formatDate(openTour.leaveStartedOn)
							}) : null,
							c.status === "current" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "pt-2",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExtraDaysControl, {
									extraDays: openTour.extraDays ?? 0,
									baseDate: computedDue?.date ?? openTour.dueOff ? addDays(computedDue?.date ?? openTour.dueOff, -(openTour.extraDays ?? 0)) : null,
									dueOff: computedDue?.date ?? openTour.dueOff,
									saving: extraMut.isPending,
									onSave: (n) => extraMut.mutate({ data: {
										crewId: c.id,
										extraDays: n
									} })
								})
							}) : null
						] }) : null,
						c.status === "current" && (upgrades.length || ratedUp) ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap gap-2 pt-2",
							children: [upgrades.map((u) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								size: "sm",
								disabled: rateMut.isPending,
								onClick: () => rateMut.mutate({ data: {
									crewId: c.id,
									toBillet: u.billet
								} }),
								children: ["Rate up to ", u.title]
							}, u.billet)), ratedUp ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								size: "sm",
								variant: "outline",
								disabled: dropMut.isPending,
								onClick: () => dropMut.mutate({ data: { crewId: c.id } }),
								children: ["Drop back to ", positionLabel(c.permanentRating)]
							}) : null]
						}) : null,
						c.permanentRating || c.assignmentType === "PERMANENT" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "pt-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								variant: "outline",
								asChild: true,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/permanents",
									children: "Change permanents list"
								})
							})
						}) : null
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IdentityCard, {
					crew: c,
					embarkPort: openTour?.port ?? "",
					editing: editingIdent,
					saving: identMut.isPending,
					onEdit: () => setEditingIdent(true),
					onCancel: () => setEditingIdent(false),
					onSave: (patch) => identMut.mutate({ data: {
						crewId: c.id,
						...patch
					} })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					title: "Credentials",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							k: "MMC",
							v: c.mmcNumber,
							extra: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExpiryChip, { date: c.mmcExpiration })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							k: "Medical",
							v: medical?.expiresOn ? formatDate(medical.expiresOn) : medical ? "On file" : "Missing",
							extra: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExpiryChip, { date: medical?.expiresOn })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							k: "Drug-free",
							v: drugFree?.expiresOn ? formatDate(drugFree.expiresOn) : drugFree ? "On file" : "Missing",
							extra: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExpiryChip, { date: drugFree?.expiresOn })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							k: "Passport",
							v: c.passportNumber,
							extra: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExpiryChip, { date: c.passportExpiration })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							k: "Hair / eyes",
							v: [c.hairColor, c.eyeColor].filter(Boolean).join(" / ")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							k: "Height / weight",
							v: [c.height, c.weight].filter(Boolean).join(" · ")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							k: "Glasses",
							v: c.glasses ? c.spareGlasses ? "Yes, spare aboard" : "Yes" : "No"
						}),
						c.medications ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							k: "Medications",
							v: c.medications
						}) : null,
						c.medicalRemarks ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							k: "Medical notes",
							v: c.medicalRemarks
						}) : null
					]
				}),
				permanent || c.permanentRating ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					title: "NSE training",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mb-2 text-xs text-muted",
							children: permanent?.onSheet ? `${permanent.sheetName} on the NS5 permanents list.` : permanent ? "Permanent — omitted from the NS5 sheet." : `Permanent ${positionLabel(c.permanentRating)}.`
						}),
						NSE_KINDS.map((k) => {
							const d = c.documents.find((doc) => doc.docType === k);
							return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								k: `${NSE_SHORT[k]} · ${NSE_CODES[k]}`,
								v: d?.expiresOn ? formatDate(d.expiresOn) : "Missing",
								extra: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExpiryChip, { date: d?.expiresOn })
							}, k);
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "pt-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								variant: "outline",
								asChild: true,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/training",
									children: "Open NSE board"
								})
							})
						}),
						expiredSmm.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "pt-3",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SmmPrintPanel, {
								items: [{
									crewId: c.id,
									fullName: c.fullName,
									position: c.lastPosition,
									kinds: expiredSmm,
									person: detailToParsed(c)
								}],
								compact: true
							})
						}) : null
					]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					title: "Next of kin",
					children: [c.nok.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: "None on file."
					}) : null, c.nok.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-3 text-sm last:mb-0",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "font-medium",
								children: n.fullName
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "text-muted",
								children: [
									n.relationship,
									n.phone ? ` · ${n.phone}` : "",
									n.cellPhone && n.cellPhone !== n.phone ? ` · ${n.cellPhone}` : ""
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-xs text-faint",
								children: [
									n.addressLine,
									n.city,
									n.state,
									n.zip
								].filter(Boolean).join(", ")
							})
						]
					}, n.id))]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
					title: "Sign-on checklist",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "space-y-1.5 text-sm",
						children: (reqs.data ?? []).filter((r) => requirementApplies(r.appliesTo, c.lastPosition)).map((r) => {
							const present = formCodes.has(r.code.toUpperCase()) || docCodes.has(r.code);
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex items-center justify-between gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: present ? "text-ink" : "text-muted",
									children: r.label
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									tone: present ? "ok" : r.required ? "expired" : "neutral",
									children: present ? "On file" : "Missing"
								})]
							}, r.id);
						})
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					title: "Combine with another file",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted",
							children: "If two files were opened for the same person, pick the other one. Tickets, tours, and next of kin land on the stronger file. The extra file is removed."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-3",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CrewPicker, {
								people: rosterQ.data ?? [],
								excludeIds: [c.id],
								value: mergePick,
								onChange: (id) => {
									setMergePick(id);
									setMergeTyped("");
								},
								emptyLabel: "Search the other file…",
								placeholder: "Type a last name…"
							})
						}),
						mergeOther ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-2 text-sm text-muted",
							children: [
								"Combining with ",
								mergeOther.fullName,
								mergeOther.lastPosition ? ` · ${positionLabel(mergeOther.lastPosition)}` : "",
								mergeOther.status ? ` · ${mergeOther.status}` : "",
								"."
							]
						}) : null,
						namesDiffer ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm text-warn",
							children: "Last names do not match. Only continue if this is the same person."
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "mt-3 block text-xs text-muted",
							children: [
								"Type ",
								c.lastName || "this last name",
								" to confirm",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: mergeTyped,
									onChange: (e) => setMergeTyped(e.target.value),
									className: "mt-1",
									autoComplete: "off",
									placeholder: c.lastName ?? ""
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							className: "mt-3",
							variant: "outline",
							disabled: mergeMut.isPending || !mergePick || mergeTyped.trim().toLowerCase() !== (c.lastName ?? "").trim().toLowerCase() || !(c.lastName ?? "").trim(),
							onClick: () => mergeMut.mutate(mergePick),
							children: mergeMut.isPending ? "Combining…" : "Combine files"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					title: "Delete this file",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted",
							children: "Removes the whole profile — tickets, tours, and next of kin. This does not sign them off; use Sign off if they are leaving the ship."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "mt-3 block text-xs text-muted",
							children: [
								"Type ",
								c.lastName || "their last name",
								" to confirm",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: deleteTyped,
									onChange: (e) => setDeleteTyped(e.target.value),
									className: "mt-1",
									autoComplete: "off",
									placeholder: c.lastName ?? ""
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							className: "mt-3",
							variant: "outline",
							disabled: deleteMut.isPending || deleteTyped.trim().toLowerCase() !== (c.lastName ?? "").trim().toLowerCase() || !(c.lastName ?? "").trim(),
							onClick: () => deleteMut.mutate(),
							children: deleteMut.isPending ? "Removing…" : "Delete profile"
						})
					]
				})
			]
		}) : null,
		tab === "docs" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					onDragOver: (e) => {
						e.preventDefault();
						setOver(true);
					},
					onDragLeave: () => setOver(false),
					onDrop: (e) => {
						e.preventDefault();
						setOver(false);
						const file = e.dataTransfer.files?.[0];
						if (file) ingestTicket(file);
					},
					className: `mb-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-6 py-6 text-center ${over ? "border-steel-2 bg-steel/10" : "border-border bg-paper-2/50"}`,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "file",
							accept: TICKET_ACCEPT,
							className: "sr-only",
							disabled: reading,
							onChange: (e) => {
								const file = e.target.files?.[0];
								e.target.value = "";
								if (file) ingestTicket(file);
							}
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-medium",
							children: reading ? "Reading…" : "Drop a ticket on this file"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-xs text-muted",
							children: "PDF or a photo of the MMC, TWIC, passport, medical, HAZMAT cert — not a full packet."
						})
					]
				}),
				expiredSmm.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mb-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SmmPrintPanel, {
						items: [{
							crewId: c.id,
							fullName: c.fullName,
							position: c.lastPosition,
							kinds: expiredSmm,
							person: detailToParsed(c)
						}],
						compact: true
					})
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "min-w-0 overflow-x-auto rounded-xl shadow-border",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full text-left text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
							className: "bg-paper-2 text-[11px] uppercase tracking-wider text-sage",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-4 py-3 font-medium",
									children: "Document"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-4 py-3 font-medium",
									children: "Number"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-4 py-3 font-medium",
									children: "Issued"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-4 py-3 font-medium",
									children: "Expires"
								})
							] })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", {
							className: "divide-y divide-border",
							children: [c.documents.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: "px-4 py-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "font-medium",
										children: d.label
									}), d.notes ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-xs text-muted",
										children: d.notes
									}) : null]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-3 font-mono text-xs",
									children: d.docNumber ?? "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-3 text-xs text-muted",
									children: formatDate(d.issuedOn)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-3",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExpiryChip, { date: d.expiresOn })
								})
							] }, d.id)), c.documents.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								colSpan: 4,
								className: "px-4 py-8 text-center text-muted",
								children: "No tickets on file."
							}) }) : null]
						})]
					})
				})
			]
		}) : null,
		tab === "tours" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
			className: "mt-6 space-y-3",
			children: [c.tours.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "rounded-xl bg-paper p-5 shadow-border",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-baseline justify-between gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
							className: "font-display text-xl",
							children: [
								positionLabel(t.position),
								" · ",
								t.vessel
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "font-mono text-xs text-muted",
							children: [
								formatDate(t.signOn),
								" – ",
								t.signOff ? formatDate(t.signOff) : c.status === "current" ? "open" : "signed off"
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-muted",
						children: [
							t.port,
							t.assignmentType,
							t.watch ? watchLabel(t.watch) : null,
							t.billetCode ? `billet ${t.billetCode}` : null,
							t.relieving ? `relieving ${t.relieving}` : null,
							t.lengthDays ? `${t.lengthDays} days` : null
						].filter(Boolean).join(" · ")
					}),
					t.dueOff && !t.signOff ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 text-sm",
						children: [
							"Due off ",
							formatShort(t.dueOff),
							t.dueOffRule ? ` · ${t.dueOffRule}` : "",
							t.extraDays ? ` · ${extraTripsLabel(t.extraDays)}` : "",
							t.leaveDays ? ` · +${t.leaveDays}d rotary leave` : "",
							t.leaveStartedOn ? ` · on leave since ${formatDate(t.leaveStartedOn)}` : ""
						]
					}) : null,
					t.notes ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm",
						children: t.notes
					}) : null
				]
			}, t.id)), c.tours.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "No tours recorded."
			}) : null]
		}) : null,
		tab === "packet" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
			className: "mt-6 divide-y divide-border rounded-xl bg-paper shadow-border",
			children: [c.forms.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "flex items-center justify-between gap-3 px-4 py-3 text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-mono text-xs text-sage",
					children: f.formCode
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "ml-2",
					children: f.formLabel
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-xs text-muted",
					children: formatDate(f.completedOn)
				})]
			}, f.id)), c.forms.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
				className: "px-4 py-8 text-center text-muted",
				children: "No packet forms stored."
			}) : null]
		}) : null,
		c.notes ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-6 text-sm text-muted",
			children: c.notes
		}) : null,
		signOffOpen && typeof document !== "undefined" ? (0, import_react_dom.createPortal)(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "fixed inset-0 z-[80] flex items-end justify-center bg-ink/50 p-4 sm:items-center",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				role: "dialog",
				"aria-modal": "true",
				className: "w-full max-w-md rounded-xl bg-paper p-5 shadow-border",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] uppercase tracking-[0.16em] text-sage",
						children: "Leaving this call"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
						className: "mt-1 font-display text-xl tracking-tight",
						children: [
							"Take ",
							c.fullName,
							" off articles?"
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 text-sm text-muted",
						children: [
							"This is discharge — they walk at ",
							runQ.data?.thisPort ?? "this port",
							". Their name comes off the crew list,",
							" ",
							c.billetCode ? `billet ${c.billetCode} goes vacant` : "the slot goes vacant",
							", and a one-page leaving sheet downloads for the file. Not a join packet. Not a watch trade."
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-5 flex flex-wrap gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							disabled: statusMut.isPending,
							onClick: () => {
								(async () => {
									try {
										const bytes = await buildSignOffPdf({
											fullName: c.fullName,
											lastName: c.lastName,
											position: c.lastPosition,
											billetCode: c.billetCode,
											watch: c.watch,
											signOn: openTour?.signOn,
											dueOff: computedDue?.date ?? openTour?.dueOff,
											port: openTour?.port,
											thisPort: runQ.data?.thisPort,
											assignmentType: openTour?.assignmentType ?? c.assignmentType,
											signOff: todayUtc().toISOString().slice(0, 10)
										});
										downloadPdf(bytes, signOffFilename({
											fullName: c.fullName,
											lastName: c.lastName
										}));
									} catch (e) {
										toast.error(e instanceof Error ? e.message : "Could not print leaving papers");
									}
									statusMut.mutate("past");
									setSignOffOpen(false);
								})();
							},
							children: "Print leaving sheet and sign off"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							onClick: () => setSignOffOpen(false),
							children: "Cancel"
						})]
					})
				]
			})
		}), document.body) : null
	] });
}
function Card({ title, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "rounded-xl bg-paper p-5 shadow-border",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "font-display text-lg tracking-tight",
			children: title
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-3 space-y-2",
			children
		})]
	});
}
function Row({ k, v, extra }) {
	if (!v) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-start justify-between gap-3 text-sm",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-muted",
			children: k
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "flex items-center gap-2 text-right",
			children: [v, extra]
		})]
	});
}
function IdentityCard({ crew, embarkPort, editing, saving, onEdit, onCancel, onSave }) {
	const [sex, setSex] = (0, import_react.useState)(crew.sex ?? "");
	const [dob, setDob] = (0, import_react.useState)(crew.dob ?? "");
	const [pob, setPob] = (0, import_react.useState)(crew.placeOfBirth ?? "");
	const [cit, setCit] = (0, import_react.useState)(crew.citizenship ?? "UNITED STATES");
	const [phone, setPhone] = (0, import_react.useState)(crew.cellPhone ?? "");
	const [pass, setPass] = (0, import_react.useState)(crew.passportNumber ?? "");
	const [passExp, setPassExp] = (0, import_react.useState)(crew.passportExpiration ?? "");
	const [port, setPort] = (0, import_react.useState)(embarkPort);
	(0, import_react.useEffect)(() => {
		if (!editing) return;
		setSex(crew.sex ?? "");
		setDob(crew.dob ?? "");
		setPob(crew.placeOfBirth ?? "");
		setCit(crew.citizenship ?? "UNITED STATES");
		setPhone(crew.cellPhone ?? "");
		setPass(crew.passportNumber ?? "");
		setPassExp(crew.passportExpiration ?? "");
		setPort(embarkPort);
	}, [editing]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
		title: "Coast Guard / personal",
		children: editing ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-3 sm:grid-cols-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "text-xs",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-muted",
						children: "Sex"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						className: "mt-1 flex h-10 w-full rounded-md border border-border bg-paper px-2 text-sm",
						value: sex,
						onChange: (e) => setSex(e.target.value),
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
					className: "text-xs",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-muted",
						children: "Date of birth"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						type: "date",
						className: "mt-1",
						value: dob,
						onChange: (e) => setDob(e.target.value)
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "text-xs",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-muted",
						children: "Place of birth"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						className: "mt-1",
						value: pob,
						onChange: (e) => setPob(e.target.value)
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "text-xs",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-muted",
						children: "Citizenship"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						className: "mt-1",
						value: cit,
						onChange: (e) => setCit(e.target.value)
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "text-xs",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-muted",
						children: "Phone"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						className: "mt-1",
						value: phone,
						onChange: (e) => setPhone(e.target.value)
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "text-xs",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-muted",
						children: "Embarked"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PortSelect, {
						value: port,
						onChange: setPort,
						allowEmpty: true,
						emptyLabel: "Where they joined"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "text-xs",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-muted",
						children: "Passport number"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						className: "mt-1",
						value: pass,
						onChange: (e) => setPass(e.target.value)
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "text-xs",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-muted",
						children: "Passport expires"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						type: "date",
						className: "mt-1",
						value: passExp,
						onChange: (e) => setPassExp(e.target.value)
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2 sm:col-span-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						size: "sm",
						disabled: saving,
						onClick: () => onSave({
							sex: sex || null,
							dob: dob || null,
							placeOfBirth: pob || null,
							citizenship: cit || null,
							cellPhone: phone || null,
							passportNumber: pass || null,
							passportExpiration: passExp || null,
							embarkPort: port || null
						}),
						children: "Save"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: "ghost",
						onClick: onCancel,
						children: "Cancel"
					})]
				})
			]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
				k: "Sex",
				v: crew.sex
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
				k: "Date of birth",
				v: formatDate(crew.dob)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
				k: "Place of birth",
				v: crew.placeOfBirth
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
				k: "Citizenship",
				v: crew.citizenship
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
				k: "Contact",
				v: crew.cellPhone
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
				k: "Email",
				v: crew.email
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
				k: "Embarked",
				v: embarkPort
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
				k: "Passport",
				v: crew.passportNumber,
				extra: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExpiryChip, { date: crew.passportExpiration })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
				k: "Address",
				v: [
					crew.addressLine,
					crew.city,
					crew.state,
					crew.zip
				].filter(Boolean).join(", ")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
				k: "Airport",
				v: [crew.nearestAirport, crew.airportCode].filter(Boolean).join(" · ")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
				k: "College",
				v: [crew.maritimeCollege, crew.yearGraduated].filter(Boolean).join(", ")
			}),
			crew.combatVeteran ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
				k: "Veteran",
				v: "Combat veteran"
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pt-2",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					size: "sm",
					variant: "outline",
					onClick: onEdit,
					children: "Edit Coast Guard fields"
				})
			})
		] })
	});
}
//#endregion
export { Page as component };
