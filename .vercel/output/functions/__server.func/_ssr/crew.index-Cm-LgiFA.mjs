import { o as __toESM } from "../_runtime.mjs";
import { l as cn, s as VESSEL } from "./types-DLRYosVU.mjs";
import { d as formatShort, y as positionLabel } from "./ratings-WR-IukGV.mjs";
import { _ as watchLabel, a as isOfficerRotary, i as extraTripsLabel } from "./shipping-CitWW3XC.mjs";
import { d as remainingUpgrades } from "./permanents-isWOFthL.mjs";
import { f as walkOff } from "./ports-C0XwVrj0.mjs";
import { l as require_react_dom, u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { t as Button } from "./button-DnbeV2iT.mjs";
import { c as Printer } from "../_libs/lucide-react.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { F as rateUp, O as listCrew, T as getShipRoster, V as updateAssignment, l as Route$3, n as addExtraDays, r as changeBillet } from "./router-QLPwsRgl.mjs";
import { n as Desk, t as Badge } from "./badge-DfXuB0XH.mjs";
import { t as Input } from "./input-B2bEx-Se.mjs";
import { t as ExtraDaysControl } from "./extra-days-DIx_BHCm.mjs";
import { t as ExpiryChip } from "./expiry-chip-Booas4nG.mjs";
import { t as invalidateDesk } from "./desk-query-IlzSwsjD.mjs";
import { a as listBilletChanges, n as billetByCode } from "./billets-ArYXOA2k.mjs";
import { t as PageHeader } from "./page-header--nmhDNO6.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/crew.index-Cm-LgiFA.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var import_react_dom = /* @__PURE__ */ __toESM(require_react_dom());
function displayName(s) {
	const t = s.trim();
	if (t.length > 1 && t === t.toUpperCase() && /[A-Z]/.test(t)) return t.toLowerCase().split(/\s+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
	return t;
}
function foldName(s) {
	return s.toLowerCase().replace(/yous[aeu]f/g, "yusuf").replace(/[^a-z0-9]+/g, " ").trim();
}
function Page() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Desk, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Roster, {}) });
}
function dueTone(days, walk) {
	if (days === null) return "missing";
	if (days < 0) return "expired";
	if (walk?.when === "next") return "watch";
	if (walk?.thisCall || days <= 11) return "soon";
	if (days <= 30) return "watch";
	return "ok";
}
function dueText(days, date, walk) {
	if (days === null) return date ? formatShort(date) : "No due-off";
	if (days < 0) return `Overdue ${Math.abs(days)}d`;
	if (days === 0) return "Due today";
	if (days === 1) return "Due tomorrow";
	const left = days <= 21 ? `${days}d left` : formatShort(date);
	if (walk?.when === "next") return `${left} · next ${walk.port}`;
	return left;
}
function occupantWalk(o, thisPort, nextPort) {
	return walkOff({
		daysLeft: o.daysLeft,
		embarkPort: o.tour.port,
		thisPort,
		nextPort
	});
}
function Roster() {
	const qc = useQueryClient();
	const view = Route$3.useSearch().view ?? "aboard";
	const initial = Route$3.useLoaderData();
	const ship = useQuery({
		queryKey: ["ship-roster"],
		queryFn: () => getShipRoster(),
		initialData: initial
	});
	const ledger = useQuery({
		queryKey: ["crew"],
		queryFn: () => listCrew(),
		enabled: view === "ledger"
	});
	const [tab, setTab] = (0, import_react.useState)("applicant");
	const [qstr, setQstr] = (0, import_react.useState)("");
	const [editing, setEditing] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		if (view === "ledger") setTab("applicant");
	}, [view]);
	const mut = useMutation({
		mutationFn: updateAssignment,
		onSuccess: async () => {
			toast.success("Assignment updated");
			await invalidateDesk(qc);
			setEditing(null);
		},
		onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save")
	});
	const extraMut = useMutation({
		mutationFn: addExtraDays,
		onSuccess: async (res) => {
			toast.success(res.due.date ? `Due off ${formatShort(res.due.date)}` : "Extra days saved");
			await invalidateDesk(qc);
		},
		onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save extra days")
	});
	const rateMut = useMutation({
		mutationFn: rateUp,
		onSuccess: async (res) => {
			toast.success(res.question ?? "Rate updated");
			await invalidateDesk(qc);
		},
		onError: (e) => toast.error(e instanceof Error ? e.message : "Could not rate up")
	});
	const jobMut = useMutation({
		mutationFn: changeBillet,
		onSuccess: async (res) => {
			if (res.kind === "trade") toast.success(`Traded watches with ${res.withName}.`);
			else if (res.kind === "move") toast.success(`Moved to ${res.toTitle}.`);
			await invalidateDesk(qc);
			setEditing(null);
		},
		onError: (e) => toast.error(e instanceof Error ? e.message : "Could not change watch")
	});
	const rows = (0, import_react.useMemo)(() => {
		const list = ledger.data ?? [];
		const needle = foldName(qstr.trim());
		const rank = {
			applicant: 0,
			current: 1,
			vacation: 2,
			past: 3
		};
		return list.filter((c) => {
			if (tab !== "all" && c.status !== tab) return false;
			if (!needle) return true;
			return foldName([
				c.fullName,
				c.firstName,
				c.lastName,
				c.ssLast4,
				c.mmcNumber,
				c.email,
				c.cellPhone,
				c.lastPosition,
				c.city,
				c.state,
				c.billetCode
			].filter(Boolean).join(" ")).includes(needle);
		}).sort((a, b) => (rank[a.status] ?? 9) - (rank[b.status] ?? 9) || a.fullName.localeCompare(b.fullName));
	}, [
		ledger.data,
		tab,
		qstr
	]);
	const data = ship.data;
	const byDept = (0, import_react.useMemo)(() => {
		const slots = data?.slots ?? [];
		return {
			deck: slots.filter((s) => s.billet.department === "deck"),
			engine: slots.filter((s) => s.billet.department === "engine"),
			steward: slots.filter((s) => s.billet.department === "steward")
		};
	}, [data]);
	const aboardNames = (0, import_react.useMemo)(() => (data?.slots ?? []).flatMap((s) => s.occupants.map((o) => ({
		id: o.crew.id,
		fullName: o.crew.fullName,
		billetCode: s.billet.code,
		assignmentType: o.tour.assignmentType
	}))), [data]);
	async function saveJob(crewId, fromBillet, patch) {
		try {
			if (patch.billetCode && patch.billetCode !== fromBillet) {
				await jobMut.mutateAsync({ data: {
					crewId,
					toBillet: patch.billetCode
				} });
				return;
			}
			await mut.mutateAsync({ data: {
				crewId,
				watch: billetByCode(fromBillet)?.watch ?? patch.watch,
				assignmentType: patch.assignmentType,
				seniorityClass: patch.seniorityClass,
				dueOff: patch.dueOff
			} });
		} catch {}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			kicker: VESSEL,
			title: "Who is aboard, and when they are due off.",
			description: "Joined and due-off on one page, in ship order: Master, Chief Mate, down. They walk at the port they signed on. 12 days left is the next home-port call — the trip after, not this Long Beach. Extra time is whole trips — one trip is 14 days.",
			actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					asChild: true,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/crew/print",
						search: { kind: "generic" },
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Printer, { className: "size-4" }), " Crew list"]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					asChild: true,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/crew/print",
						search: { kind: "imo" },
						children: "IMO list"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					asChild: true,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/crew/print",
						search: { kind: "watch" },
						children: "Watch bill"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					asChild: true,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/crew/print",
						search: { kind: "enoad" },
						children: "eNOAD"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					asChild: true,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/sign-on",
						children: "Sign on"
					})
				})
			] })
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-wrap gap-1 rounded-lg bg-paper-2 p-1",
				children: [
					["aboard", "Aboard"],
					["change", "Crew change"],
					["vacant", "Vacant"],
					["due", "Due off"],
					["board", "Board"],
					["ledger", "Ledger"]
				].map(([id, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/crew",
					search: id === "aboard" ? {} : { view: id },
					className: cn("rounded-md px-3 py-1.5 text-sm", view === id ? "bg-ink text-paper" : "text-muted hover:text-ink"),
					children: label
				}, id))
			}), data ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-sm text-muted",
				children: [
					data.aboard,
					" aboard · ",
					data.vacant,
					" vacant · ",
					data.dueSoon,
					" walking this call",
					data.overdue ? ` · ${data.overdue} overdue` : ""
				]
			}) : null]
		}),
		view === "aboard" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AboardView, {
			slots: data?.slots ?? [],
			loading: !data,
			error: ship.isError ? ship.error instanceof Error ? ship.error.message : "unknown error" : null,
			saving: extraMut.isPending || rateMut.isPending || jobMut.isPending,
			thisPort: data?.run?.thisPort ?? "Long Beach",
			nextPort: data?.run?.nextPort ?? "Honolulu",
			onExtra: (crewId, extraDays) => extraMut.mutate({ data: {
				crewId,
				extraDays
			} }),
			onRate: (crewId, toBillet) => rateMut.mutate({ data: {
				crewId,
				toBillet
			} }),
			onChangeJob: (crewId, toBillet) => jobMut.mutate({ data: {
				crewId,
				toBillet
			} })
		}) : view === "change" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChangeView, {
			slots: data?.slots ?? [],
			loading: !data,
			thisPort: data?.run?.thisPort ?? "this port",
			nextPort: data?.run?.nextPort ?? "Honolulu"
		}) : view === "vacant" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VacantView, {
			slots: data?.slots ?? [],
			loading: !data
		}) : view === "due" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DueView, {
			slots: data?.slots ?? [],
			loading: !data,
			error: ship.isError ? ship.error instanceof Error ? ship.error.message : "unknown error" : null,
			saving: extraMut.isPending || rateMut.isPending || jobMut.isPending,
			thisPort: data?.run?.thisPort ?? "Long Beach",
			nextPort: data?.run?.nextPort ?? "Honolulu",
			onExtra: (crewId, extraDays) => extraMut.mutate({ data: {
				crewId,
				extraDays
			} }),
			onRate: (crewId, toBillet) => rateMut.mutate({ data: {
				crewId,
				toBillet
			} }),
			onChangeJob: (crewId, toBillet) => jobMut.mutate({ data: {
				crewId,
				toBillet
			} })
		}) : view === "board" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			data?.questions.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mb-6 rounded-xl bg-paper p-4 shadow-border sm:p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-lg tracking-tight",
						children: "Need a call"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted",
						children: "If a rating or watch is ambiguous, it stays here until you pick."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-3 space-y-3",
						children: data.questions.map((q) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "rounded-lg bg-paper-2 px-3 py-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "font-medium",
									children: q.title
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-0.5 text-sm text-muted",
									children: q.detail
								}),
								q.crewId ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-2",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										size: "sm",
										variant: "outline",
										asChild: true,
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
											to: "/crew/$crewId",
											params: { crewId: q.crewId },
											children: "Open file"
										})
									})
								}) : null
							]
						}, q.id))
					})
				]
			}) : null,
			data?.vacation.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mb-6 rounded-xl bg-ink p-4 text-paper shadow-border sm:p-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[11px] uppercase tracking-[0.16em] text-sage",
					children: "Off the ship"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-3 space-y-2",
					children: data.vacation.map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "flex items-center justify-between gap-3 text-sm",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/crew/$crewId",
							params: { crewId: v.id },
							className: "hover:underline",
							children: [v.fullName, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "ml-2 text-paper/60",
								children: [
									positionLabel(v.lastPosition),
									" ·",
									" ",
									isOfficerRotary(v.unionHall, v.lastAssignment ?? v.assignmentType) ? "rotary leave" : "vacation"
								]
							})]
						})
					}, v.id))
				})]
			}) : null,
			!data ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: ship.isError ? `Could not load the board: ${ship.error instanceof Error ? ship.error.message : "unknown error"}` : "Loading the board…"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-8",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DeptBlock, {
						title: "Deck",
						slots: byDept.deck,
						aboard: aboardNames,
						editing,
						setEditing,
						saving: mut.isPending || jobMut.isPending,
						onSave: (crewId, fromBillet, patch) => void saveJob(crewId, fromBillet, patch)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DeptBlock, {
						title: "Engine",
						slots: byDept.engine,
						aboard: aboardNames,
						editing,
						setEditing,
						saving: mut.isPending || jobMut.isPending,
						onSave: (crewId, fromBillet, patch) => void saveJob(crewId, fromBillet, patch)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DeptBlock, {
						title: "Steward",
						slots: byDept.steward,
						aboard: aboardNames,
						editing,
						setEditing,
						saving: mut.isPending || jobMut.isPending,
						onSave: (crewId, fromBillet, patch) => void saveJob(crewId, fromBillet, patch)
					})
				]
			})
		] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-wrap gap-1 rounded-lg bg-paper-2 p-1",
				children: [
					"all",
					"current",
					"applicant",
					"vacation",
					"past"
				].map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setTab(t),
					className: `rounded-md px-3 py-1.5 text-sm capitalize ${tab === t ? "bg-ink text-paper" : "text-muted hover:text-ink"}`,
					children: t === "all" ? "All" : t === "applicant" ? "New files" : t
				}, t))
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
				value: qstr,
				onChange: (e) => setQstr(e.target.value),
				placeholder: "Name, last 4, MMC…",
				className: "sm:max-w-xs",
				"aria-label": "Search roster"
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "overflow-hidden rounded-xl shadow-border",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "min-w-0 overflow-x-auto",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full min-w-[720px] text-left text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
						className: "bg-paper-2 text-[11px] uppercase tracking-wider text-sage",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-4 py-3 font-medium",
								children: "Mariner"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-4 py-3 font-medium",
								children: "Billet"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-4 py-3 font-medium",
								children: "Status"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-4 py-3 font-medium",
								children: "On / due"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-4 py-3 font-medium",
								children: "MMC"
							})
						] })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", {
						className: "divide-y divide-border bg-paper",
						children: [rows.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "hover:bg-paper-2/60",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: "px-4 py-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
										to: "/crew/$crewId",
										params: { crewId: c.id },
										className: "font-medium hover:underline",
										children: displayName(c.fullName)
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-xs text-muted",
										children: c.city && c.state ? `${c.city}, ${c.state}` : c.email
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: "px-4 py-3 font-mono text-xs",
									children: [c.lastBillet ? `${c.lastBillet} · ` : "", positionLabel(c.lastPosition)]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-3",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										tone: c.status === "current" ? "current" : c.status === "vacation" ? "steel" : c.status === "applicant" ? "neutral" : "past",
										children: c.status === "current" ? "aboard" : c.status === "vacation" ? "off the ship" : c.status === "applicant" ? "not aboard yet" : "past"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: "px-4 py-3 text-xs text-muted",
									children: [formatShort(c.lastSignOn), c.lastDueOff ? ` → ${formatShort(c.lastDueOff)}` : ""]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-3",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExpiryChip, { date: c.mmcExpiration })
								})
							]
						}, c.id)), rows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							colSpan: 5,
							className: "px-4 py-10 text-center text-muted",
							children: ledger.isLoading ? "Loading ledger…" : "No mariners match."
						}) }) : null]
					})]
				})
			})
		})] })
	] });
}
function AboardView({ slots, occupancySlots, loading, error, saving, thisPort, nextPort, onExtra, onRate, onChangeJob }) {
	const people = (0, import_react.useMemo)(() => {
		return slots.flatMap((slot) => slot.occupants.map((o) => ({
			slot,
			occupant: o
		}))).sort((a, b) => a.slot.billet.sortOrder - b.slot.billet.sortOrder || a.slot.billet.code.localeCompare(b.slot.billet.code) || (a.occupant.tour.signOn ?? "").localeCompare(b.occupant.tour.signOn ?? "") || a.occupant.crew.fullName.localeCompare(b.occupant.crew.fullName));
	}, [slots]);
	const aboard = (0, import_react.useMemo)(() => (occupancySlots ?? slots).flatMap((slot) => slot.occupants.map((occupant) => ({
		id: occupant.crew.id,
		fullName: occupant.crew.fullName,
		billetCode: slot.billet.code,
		assignmentType: occupant.tour.assignmentType
	}))), [occupancySlots, slots]);
	if (loading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-muted",
		children: error ? `Could not load articles: ${error}` : "Loading who is aboard…"
	});
	if (people.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-xl bg-paper p-6 shadow-border",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "font-medium",
			children: "No one is signed on."
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-sm text-muted",
			children: "Open sign-on to put a name on articles."
		})]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mb-4 hidden overflow-hidden rounded-xl shadow-border md:block",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "overflow-x-auto",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "w-full min-w-[920px] text-left text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
					className: "bg-paper-2 text-[11px] uppercase tracking-wider text-sage",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-4 py-3 font-medium",
							children: "No."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-4 py-3 font-medium",
							children: "Rank"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-4 py-3 font-medium",
							children: "Name"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-4 py-3 font-medium",
							children: "Joined"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-4 py-3 font-medium",
							children: "Due off"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-4 py-3 font-medium",
							children: "Extra trips"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-4 py-3 font-medium",
							children: "Change watch"
						})
					] })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
					className: "divide-y divide-border bg-paper",
					children: people.map(({ slot, occupant: o }, i) => {
						const walk = occupantWalk(o, thisPort, nextPort);
						const tone = dueTone(o.daysLeft, walk);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "align-middle",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-3 font-mono text-xs text-muted",
									children: i + 1
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: "px-4 py-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "font-medium",
										children: slot.billet.title
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "text-xs text-muted",
										children: [
											slot.billet.code,
											" · ",
											watchLabel(o.tour.watch ?? slot.billet.watch)
										]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: "px-4 py-3",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
											to: "/crew/$crewId",
											params: { crewId: o.crew.id },
											className: "font-medium hover:underline",
											children: o.crew.fullName
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "text-xs text-muted",
											children: [o.daysOn != null ? `${o.daysOn}d on` : "", o.sailingUp ? " · rated up" : ""]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RateUpButtons, {
											permanentRating: o.crew.permanentRating,
											lastPosition: o.crew.lastPosition,
											crewId: o.crew.id,
											saving,
											onRate
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-3 text-sm",
									children: formatShort(o.tour.signOn)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: "px-4 py-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										tone: tone === "missing" ? "neutral" : tone,
										children: dueText(o.daysLeft, o.due.date, walk)
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "mt-1 text-[11px] leading-snug text-muted",
										children: o.due.baseDate && o.extraDays ? `Rule ${formatShort(o.due.baseDate)}` : o.due.rule
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-3",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExtraDaysControl, {
										compact: true,
										extraDays: o.extraDays ?? 0,
										baseDate: o.due.baseDate ?? o.due.date,
										dueOff: o.due.date,
										saving,
										onSave: (n) => onExtra(o.crew.id, n)
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-3",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChangeJobSelect, {
										fromCode: slot.billet.code,
										crewId: o.crew.id,
										aboard,
										saving,
										onPick: (to) => onChangeJob(o.crew.id, to)
									})
								})
							]
						}, o.crew.id);
					})
				})]
			})
		})
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
		className: "block space-y-3 md:hidden",
		children: people.map(({ slot, occupant: o }, i) => {
			const walk = occupantWalk(o, thisPort, nextPort);
			const tone = dueTone(o.daysLeft, walk);
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "rounded-xl bg-paper p-4 shadow-border",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-[11px] uppercase tracking-[0.14em] text-sage",
						children: [
							i + 1,
							" · ",
							slot.billet.title
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-1 flex items-start justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/crew/$crewId",
								params: { crewId: o.crew.id },
								className: "font-medium hover:underline",
								children: o.crew.fullName
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted",
								children: watchLabel(o.tour.watch ?? slot.billet.watch)
							}),
							o.sailingUp ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted",
								children: "rated up"
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RateUpButtons, {
								permanentRating: o.crew.permanentRating,
								lastPosition: o.crew.lastPosition,
								crewId: o.crew.id,
								saving,
								onRate
							})
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							tone: tone === "missing" ? "neutral" : tone,
							children: dueText(o.daysLeft, o.due.date, walk)
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
						className: "mt-3 grid grid-cols-2 gap-2 text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
							className: "text-[11px] uppercase tracking-wider text-sage",
							children: "Joined"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: formatShort(o.tour.signOn) })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
							className: "text-[11px] uppercase tracking-wider text-sage",
							children: "Due off"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: formatShort(o.due.date) })] })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExtraDaysControl, {
							extraDays: o.extraDays ?? 0,
							baseDate: o.due.baseDate ?? o.due.date,
							dueOff: o.due.date,
							saving,
							onSave: (n) => onExtra(o.crew.id, n)
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChangeJobSelect, {
							fromCode: slot.billet.code,
							crewId: o.crew.id,
							aboard,
							saving,
							onPick: (to) => onChangeJob(o.crew.id, to)
						})
					})
				]
			}, o.crew.id);
		})
	})] });
}
function VacantView({ slots, loading }) {
	const vacant = slots.filter((s) => s.occupants.length === 0);
	if (loading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-muted",
		children: "Loading vacant billets…"
	});
	if (!vacant.length) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-xl bg-paper p-6 shadow-border",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "font-medium",
			children: "No vacant billets."
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-sm text-muted",
			children: "Every slot on articles has a name."
		})]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "overflow-hidden rounded-xl shadow-border",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
			className: "w-full text-left text-sm",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
				className: "bg-paper-2 text-[11px] uppercase tracking-wider text-sage",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "px-4 py-3 font-medium",
						children: "Billet"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "px-4 py-3 font-medium",
						children: "Watch"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "px-4 py-3 font-medium",
						children: "Hall"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "px-4 py-3 font-medium",
						children: "Usual assignment"
					})
				] })
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
				className: "divide-y divide-border bg-paper",
				children: vacant.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
						className: "px-4 py-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "font-medium",
							children: s.billet.title
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "font-mono text-xs text-muted",
							children: s.billet.code
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "px-4 py-3 text-sm",
						children: watchLabel(s.billet.watch)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "px-4 py-3 text-sm",
						children: s.billet.unionHall
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "px-4 py-3 text-sm capitalize text-muted",
						children: s.billet.defaultAssignment.toLowerCase()
					})
				] }, s.billet.code))
			})]
		})
	});
}
function ChangeView({ slots, loading, thisPort, nextPort }) {
	const tagged = slots.flatMap((slot) => slot.occupants.map((o) => ({
		slot,
		occupant: o,
		walk: occupantWalk(o, thisPort, nextPort)
	})));
	const leavingThis = tagged.filter((row) => row.walk.thisCall);
	const leavingNext = tagged.filter((row) => row.walk.when === "next");
	const vacantNow = slots.filter((s) => s.occupants.length === 0);
	const opening = leavingThis.filter(({ slot }) => slot.occupants.length === 1);
	if (loading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-muted",
		children: "Loading crew change…"
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-sm text-muted",
				children: [
					thisPort,
					" this call · ",
					nextPort,
					" next. They walk at the port they signed on. 12 days left is the trip after — next home port, not this ",
					thisPort,
					"."
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "overflow-hidden rounded-xl shadow-border",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "bg-paper-2 px-4 py-3",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
						className: "font-display text-lg tracking-tight",
						children: [
							"Getting off ",
							thisPort,
							" this call"
						]
					})
				}), leavingThis.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "bg-paper px-4 py-6 text-sm text-muted",
					children: [
						"Nobody walks this ",
						thisPort,
						"."
					]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "divide-y divide-border bg-paper",
					children: leavingThis.map(({ slot, occupant: o, walk }) => {
						const tone = dueTone(o.daysLeft, walk);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex items-center justify-between gap-3 px-4 py-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/crew/$crewId",
								params: { crewId: o.crew.id },
								className: "font-medium hover:underline",
								children: o.crew.fullName
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "text-xs text-muted",
								children: [
									slot.billet.shortTitle,
									" · ",
									watchLabel(o.tour.watch ?? slot.billet.watch)
								]
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									tone: tone === "missing" ? "neutral" : tone,
									children: dueText(o.daysLeft, o.due.date, walk)
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/crew/$crewId",
									params: { crewId: o.crew.id },
									className: "text-sm text-steel-2 hover:underline",
									children: "Sign off"
								})]
							})]
						}, o.crew.id);
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "overflow-hidden rounded-xl shadow-border",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "bg-paper-2 px-4 py-3",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-lg tracking-tight",
						children: "Trip after — next home port"
					})
				}), leavingNext.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "bg-paper px-4 py-6 text-sm text-muted",
					children: "Nobody is walking the next home-port call."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "divide-y divide-border bg-paper",
					children: leavingNext.map(({ slot, occupant: o, walk }) => {
						const tone = dueTone(o.daysLeft, walk);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex items-center justify-between gap-3 px-4 py-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/crew/$crewId",
								params: { crewId: o.crew.id },
								className: "font-medium hover:underline",
								children: o.crew.fullName
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "text-xs text-muted",
								children: [
									slot.billet.shortTitle,
									" · ",
									watchLabel(o.tour.watch ?? slot.billet.watch),
									" · signed on ",
									o.tour.port || "this run"
								]
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								tone: tone === "missing" ? "neutral" : tone,
								children: dueText(o.daysLeft, o.due.date, walk)
							})]
						}, o.crew.id);
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "overflow-hidden rounded-xl shadow-border",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "bg-paper-2 px-4 py-3",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
						className: "font-display text-lg tracking-tight",
						children: ["Empty now — joining ", thisPort]
					})
				}), vacantNow.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "bg-paper px-4 py-6 text-sm text-muted",
					children: "No vacant billets until someone signs off."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "divide-y divide-border bg-paper",
					children: vacantNow.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex items-center justify-between gap-3 px-4 py-3 text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-medium",
							children: s.billet.shortTitle
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "ml-2 text-xs text-muted",
							children: [
								watchLabel(s.billet.watch),
								" · ",
								s.billet.unionHall
							]
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/sign-on",
							className: "text-sm text-steel-2 hover:underline",
							children: "Sign on"
						})]
					}, s.billet.code))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "overflow-hidden rounded-xl shadow-border",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "bg-paper-2 px-4 py-3",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-lg tracking-tight",
						children: "Opens when they leave this call"
					})
				}), opening.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "bg-paper px-4 py-6 text-sm text-muted",
					children: "No extra slots open from this call’s walk-offs."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "divide-y divide-border bg-paper",
					children: opening.map(({ slot, occupant: o }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex items-center justify-between gap-3 px-4 py-3 text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-medium",
							children: slot.billet.shortTitle
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "ml-2 text-xs text-muted",
							children: ["after ", o.crew.fullName]
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/sign-on",
							className: "text-sm text-steel-2 hover:underline",
							children: "Sign on"
						})]
					}, o.crew.id))
				})]
			})
		]
	});
}
function DueView({ slots, loading, error, saving, thisPort, nextPort, onExtra, onRate, onChangeJob }) {
	const thisSlots = slots.map((slot) => ({
		...slot,
		occupants: slot.occupants.filter((o) => occupantWalk(o, thisPort, nextPort).thisCall)
	})).filter((slot) => slot.occupants.length > 0);
	const nextSlots = slots.map((slot) => ({
		...slot,
		occupants: slot.occupants.filter((o) => occupantWalk(o, thisPort, nextPort).when === "next")
	})).filter((slot) => slot.occupants.length > 0);
	if (loading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-muted",
		children: error ? `Could not load articles: ${error}` : "Loading who is due off…"
	});
	if (!thisSlots.length && !nextSlots.length) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-xl bg-paper p-6 shadow-border",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "font-medium",
			children: "Nobody is walking this call or the trip after."
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "mt-1 text-sm text-muted",
			children: [
				"12 days left means next home port, not this ",
				thisPort,
				"."
			]
		})]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-8",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
			className: "mb-3 font-display text-lg tracking-tight",
			children: [
				"Walking ",
				thisPort,
				" this call"
			]
		}), thisSlots.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AboardView, {
			slots: thisSlots,
			occupancySlots: slots,
			loading: false,
			error: null,
			saving,
			thisPort,
			nextPort,
			onExtra,
			onRate,
			onChangeJob
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "rounded-xl bg-paper px-4 py-6 text-sm text-muted shadow-border",
			children: [
				"Nobody walks this ",
				thisPort,
				"."
			]
		})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "mb-3 font-display text-lg tracking-tight",
			children: "Trip after — next home port"
		}), nextSlots.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AboardView, {
			slots: nextSlots,
			occupancySlots: slots,
			loading: false,
			error: null,
			saving,
			thisPort,
			nextPort,
			onExtra,
			onRate,
			onChangeJob
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "rounded-xl bg-paper px-4 py-6 text-sm text-muted shadow-border",
			children: "Nobody is walking the next home-port call."
		})] })]
	});
}
function DeptBlock({ title, slots, aboard, editing, setEditing, saving, onSave }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
		className: "font-display text-xl tracking-tight",
		children: title
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mt-3 overflow-hidden rounded-xl shadow-border",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "min-w-0 overflow-x-auto",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "w-full min-w-[860px] text-left text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
					className: "bg-paper-2 text-[11px] uppercase tracking-wider text-sage",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-4 py-3 font-medium",
							children: "Billet"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-4 py-3 font-medium",
							children: "Watch"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-4 py-3 font-medium",
							children: "Name"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-4 py-3 font-medium",
							children: "Type"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-4 py-3 font-medium",
							children: "On"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-4 py-3 font-medium",
							children: "Due off"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: "px-4 py-3 font-medium" })
					] })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
					className: "divide-y divide-border bg-paper",
					children: slots.map((slot) => slot.occupants.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "bg-paper-2/40",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3 font-mono text-xs",
								children: slot.billet.shortTitle
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3 text-xs text-muted",
								children: watchLabel(slot.billet.watch)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3 text-sm text-faint",
								children: "Vacant"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
								className: "px-4 py-3 text-xs text-muted",
								children: [
									slot.billet.unionHall,
									" · ",
									slot.billet.defaultAssignment.toLowerCase()
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3 text-muted",
								children: "—"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3 text-muted",
								children: "—"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { className: "px-4 py-3" })
						]
					}, slot.billet.code) : slot.occupants.map((o, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SlotRow, {
						slot,
						aboard,
						showBillet: i === 0,
						occupant: o,
						editing: editing === o.crew.id,
						saving,
						onEdit: () => setEditing(editing === o.crew.id ? null : o.crew.id),
						onSave: (patch) => onSave(o.crew.id, slot.billet.code, patch)
					}, `${slot.billet.code}-${o.crew.id}`)))
				})]
			})
		})
	})] });
}
function SlotRow({ slot, aboard, showBillet, occupant, editing, saving, onEdit, onSave }) {
	const o = occupant;
	const tone = dueTone(o.daysLeft);
	const [watch, setWatch] = (0, import_react.useState)(o.tour.watch ?? slot.billet.watch ?? "");
	const [kind, setKind] = (0, import_react.useState)(o.tour.assignmentType ?? "");
	const [siu, setSiu] = (0, import_react.useState)(o.tour.seniorityClass ?? "");
	const [due, setDue] = (0, import_react.useState)(o.due.date ?? "");
	const [billet, setBillet] = (0, import_react.useState)(slot.billet.code);
	const jobOptions = listBilletChanges(slot.billet.code, aboard, o.crew.id);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
		className: cn(slot.occupants.length > 1 ? "bg-warn/5" : void 0),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "px-4 py-3 align-top font-mono text-xs",
				children: showBillet ? slot.billet.shortTitle : ""
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "px-4 py-3 align-top text-xs text-muted",
				children: watchLabel(o.tour.watch ?? slot.billet.watch)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
				className: "px-4 py-3 align-top",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/crew/$crewId",
						params: { crewId: o.crew.id },
						className: "font-medium hover:underline",
						children: o.crew.fullName
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "text-xs text-muted",
						children: [o.daysOn != null ? `${o.daysOn}d on` : "", o.crew.expiredCount > 0 ? ` · ${o.crew.expiredCount} expired tickets` : ""]
					}),
					o.sailingUp ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-1 flex flex-wrap items-center gap-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							tone: "watch",
							children: "rated up"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-[11px] text-muted",
							children: [
								"Perm ",
								positionLabel(o.crew.permanentRating),
								" · ",
								o.covering
							]
						})]
					}) : (o.tour.assignmentType ?? "").toUpperCase() === "RELIEF" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-0.5 text-[11px] text-faint",
						children: o.tour.relieving ? `Relief covering ${o.tour.relieving}` : "Trip relief"
					}) : o.crew.permanentRating ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-0.5 text-[11px] text-faint",
						children: ["Permanent ", positionLabel(o.crew.permanentRating)]
					}) : null,
					editing ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 grid max-w-lg gap-2 sm:grid-cols-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "text-xs",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted",
									children: "Change watch · same family only"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
									className: "mt-1 flex h-10 w-full rounded-md border border-border bg-paper px-2 text-sm",
									value: billet,
									onChange: (e) => {
										const code = e.target.value;
										setBillet(code);
										const next = billetByCode(code);
										if (next?.watch) setWatch(next.watch);
									},
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: slot.billet.code,
										children: slot.billet.shortTitle
									}), jobOptions.map((opt) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: opt.code,
										children: opt.label
									}, `${opt.kind}-${opt.code}-${opt.label}`))]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "text-xs",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted",
									children: "Watch"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
									className: "mt-1 flex h-10 w-full rounded-md border border-border bg-paper px-2 text-sm",
									value: watch,
									onChange: (e) => setWatch(e.target.value),
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
								className: "text-xs",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted",
									children: "Assignment"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
									className: "mt-1 flex h-10 w-full rounded-md border border-border bg-paper px-2 text-sm",
									value: kind,
									onChange: (e) => setKind(e.target.value),
									children: [
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
								className: "text-xs",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted",
									children: "SIU class"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
									className: "mt-1 flex h-10 w-full rounded-md border border-border bg-paper px-2 text-sm",
									value: siu,
									onChange: (e) => setSiu(e.target.value),
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "",
											children: "Not on file · A 75–120"
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
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "text-xs sm:col-span-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted",
									children: "Discharge date (this wins over the 56-day / union rule)"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "date",
									className: "mt-1",
									value: due,
									onChange: (e) => setDue(e.target.value)
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex gap-2 sm:col-span-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "sm",
									disabled: saving,
									onClick: () => onSave({
										billetCode: billet,
										watch: watch || null,
										assignmentType: kind || null,
										seniorityClass: siu || null,
										dueOff: due || null
									}),
									children: "Save"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "sm",
									variant: "ghost",
									onClick: onEdit,
									children: "Cancel"
								})]
							})
						]
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
				className: "px-4 py-3 align-top text-xs",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: (o.tour.assignmentType ?? "—").toLowerCase() }), (o.tour.assignmentType ?? "").toUpperCase() === "RELIEF" && o.tour.relieving ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "text-muted",
					children: ["covering ", o.tour.relieving]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-muted",
					children: o.tour.unionHall ?? ""
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "px-4 py-3 align-top text-xs text-muted",
				children: formatShort(o.tour.signOn)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
				className: "px-4 py-3 align-top",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						tone: tone === "missing" ? "neutral" : tone,
						children: dueText(o.daysLeft, o.due.date)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-1 max-w-[14rem] text-[11px] leading-snug text-muted",
						children: o.due.rule
					}),
					o.extraDays ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-1 text-[11px] text-warn",
						children: extraTripsLabel(o.extraDays)
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "px-4 py-3 align-top",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "sm",
					variant: "ghost",
					onClick: onEdit,
					children: editing ? "Close" : "Edit"
				})
			})
		]
	});
}
function ChangeJobSelect({ fromCode, crewId, aboard, saving, onPick }) {
	const options = listBilletChanges(fromCode, aboard, crewId);
	const [pending, setPending] = (0, import_react.useState)(null);
	if (!options.length && !pending) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [options.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
		className: "block h-9 w-full min-w-[11rem] max-w-[16rem] rounded-md border border-border bg-paper px-2 text-xs",
		defaultValue: "",
		disabled: saving,
		"aria-label": "Change watch",
		onChange: (e) => {
			const v = e.target.value;
			const picked = options.find((o) => o.code === v) ?? null;
			e.target.value = "";
			if (picked) setPending(picked);
		},
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
			value: "",
			children: "Change watch…"
		}), options.map((opt) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
			value: opt.code,
			children: opt.label
		}, `${opt.kind}-${opt.code}-${opt.label}`))]
	}, `${crewId}-${fromCode}`) : null, pending && typeof document !== "undefined" ? (0, import_react_dom.createPortal)(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-4 sm:items-center",
		onClick: () => setPending(null),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			role: "dialog",
			"aria-modal": "true",
			"aria-labelledby": `trade-title-${crewId}`,
			className: "w-full max-w-md rounded-xl bg-paper p-5 shadow-border",
			onClick: (e) => e.stopPropagation(),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[11px] uppercase tracking-[0.16em] text-sage",
					children: "Change watch"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
					id: `trade-title-${crewId}`,
					className: "mt-1 font-display text-xl tracking-tight",
					children: [pending.label, "?"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted",
					children: "They swap watches. Due-off stays with each person."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5 flex flex-wrap gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: () => {
							onPick(pending.code);
							setPending(null);
						},
						children: pending.kind === "trade" ? "Yes, trade" : "Yes, move"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						onClick: () => setPending(null),
						children: "Cancel"
					})]
				})
			]
		})
	}), document.body) : null] });
}
function RateUpButtons({ permanentRating, lastPosition, crewId, saving, onRate }) {
	const upgrades = remainingUpgrades(permanentRating, lastPosition);
	if (!upgrades.length) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mt-1 flex flex-wrap gap-1",
		children: upgrades.map((u) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			disabled: saving,
			onClick: () => onRate(crewId, u.billet),
			className: "rounded-md bg-paper-2 px-2 py-0.5 text-[11px] text-ink hover:bg-paper-3 disabled:opacity-40",
			children: ["Rate up to ", u.title]
		}, u.billet))
	});
}
//#endregion
export { Page as component };
