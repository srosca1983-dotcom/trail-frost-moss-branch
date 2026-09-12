import { o as __toESM } from "../_runtime.mjs";
import { s as VESSEL } from "./types-DLRYosVU.mjs";
import { a as daysUntil, d as formatShort, y as positionLabel } from "./ratings-WR-IukGV.mjs";
import { _ as watchLabel } from "./shipping-CitWW3XC.mjs";
import { c as isYardCall, d as runLine, l as matePort, r as chinaPassportGaps, s as isShipyardPort } from "./ports-C0XwVrj0.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { t as Button } from "./button-DnbeV2iT.mjs";
import { b as BookOpenCheck, h as Download, n as Users, o as ShieldCheck, p as Flame, r as Upload, v as CalendarClock, x as ArrowRight, y as Briefcase } from "../_libs/lucide-react.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { R as saveVesselRun, S as getDashboard, b as exportLedger, m as Route$13 } from "./router-QLPwsRgl.mjs";
import { n as Desk, t as Badge } from "./badge-DfXuB0XH.mjs";
import { t as Input } from "./input-B2bEx-Se.mjs";
import { t as ExpiryChip } from "./expiry-chip-Booas4nG.mjs";
import { t as PortSelect } from "./port-select-ClZxXIOw.mjs";
import { t as invalidateDesk } from "./desk-query-IlzSwsjD.mjs";
import { t as VESSEL_BILLETS } from "./billets-ArYXOA2k.mjs";
import { t as PageHeader } from "./page-header--nmhDNO6.mjs";
import { r as downloadText } from "./enoad-DcToIuEP.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-COgEWQLn.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function dueTone(days) {
	if (days === null) return "neutral";
	if (days < 0) return "expired";
	if (days <= 14) return "soon";
	if (days <= 30) return "watch";
	return "ok";
}
function dueText(days, date) {
	if (days === null) return date ? formatShort(date) : "No due-off";
	if (days < 0) return `Overdue ${Math.abs(days)}d`;
	if (days === 0) return "Due today";
	if (days <= 21) return `${days}d left`;
	return formatShort(date);
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Desk, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DeskHome, {}) });
}
function DeskHome() {
	const initial = Route$13.useLoaderData();
	const data = useQuery({
		queryKey: ["dashboard"],
		queryFn: () => getDashboard(),
		initialData: initial
	}).data;
	const china = isYardCall(data?.run) ? (data?.current ?? []).map((c) => chinaPassportGaps({
		crewId: c.id,
		fullName: c.fullName,
		passportNumber: c.passportNumber,
		passportExpiration: c.passportExpiration
	})).filter((x) => Boolean(x)) : [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			kicker: "Sunrise Vessel Operations",
			title: "Who is aboard, and when they are due off.",
			description: `${VESSEL} manning board. Regular run is Long Beach ↔ Honolulu. Oakland if we call. Nantong only for the yard. Due-off follows MM&P, MEBA, and SIU shipping rules.`,
			actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					asChild: true,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/sign-on",
						children: ["Sign someone on", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-4" })]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					asChild: true,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/crew",
						search: { view: "change" },
						children: "Crew change"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BackupButton, {})
			] })
		}),
		data?.run ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RunStrip, { run: data.run }) : null,
		china.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 rounded-xl bg-warn/15 px-4 py-3 text-sm",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "font-medium",
				children: [
					data?.run && isShipyardPort(data.run.thisPort) ? "At Nantong shipyard" : "China shipyard call",
					" — ",
					china.length,
					" ",
					"passport",
					china.length === 1 ? "" : "s",
					" not ready."
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-2 space-y-1",
				children: china.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/crew/$crewId",
					params: { crewId: p.crewId },
					className: "hover:underline",
					children: p.fullName
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "text-muted",
					children: [" — ", p.reason]
				})] }, p.crewId))
			})]
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
					label: "Aboard now",
					value: data?.stats.current ?? "—",
					href: "/crew",
					hint: "Current articles"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
					label: "Vacant billets",
					value: data?.stats.vacantBillets ?? "—",
					href: "/crew",
					search: { view: "vacant" },
					hint: "Open slots only"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
					label: "Walking this call",
					value: data?.stats.dueSoonCrew ?? "—",
					href: "/crew",
					search: { view: "due" },
					hint: data?.stats.overdueCrew ? `${data.stats.overdueCrew} overdue` : "12d left is next home port",
					danger: Boolean(data?.stats.overdueCrew)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
					label: "Expired tickets",
					value: data?.stats.expiredDocs ?? "—",
					href: "/expiry",
					hint: "Aboard, rotary leave, permanents",
					danger: true
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
					label: "Rated up",
					value: data?.stats.sailingUp ?? "—",
					href: "/permanents",
					search: { view: "rated" },
					hint: "Perm C/M, 1st, 2nd above rate"
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-8 grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "min-w-0 overflow-hidden rounded-xl bg-paper p-5 shadow-border sm:p-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex min-w-0 flex-wrap items-baseline justify-between gap-x-3 gap-y-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "min-w-0 font-display text-xl tracking-tight",
						children: "Currently aboard"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/crew",
						className: "shrink-0 text-sm text-steel-2 hover:underline",
						children: "Full roster"
					})]
				}), !data ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-6 text-sm text-muted",
					children: "Loading articles…"
				}) : data.current.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 rounded-lg bg-paper-2 p-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-medium",
							children: "No one is signed on."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-sm text-muted",
							children: [
								data.stats.past,
								" mariners are on file from prior ",
								VESSEL,
								" tours. Sign-on will flag anyone who has been here before",
								data.stats.returningReady ? ` · ${data.stats.returningReady} have current tickets` : "",
								"."
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							className: "mt-4",
							asChild: true,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/sign-on",
								children: "Open sign-on"
							})
						})
					]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-4 min-w-0 divide-y divide-border",
					children: data.current.map((c) => {
						const left = daysUntil(c.lastDueOff);
						const watch = c.lastWatch || VESSEL_BILLETS.find((b) => b.code === c.lastBillet)?.watch || null;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex min-w-0 items-center justify-between gap-3 py-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: "/crew/$crewId",
								params: { crewId: c.id },
								className: "min-w-0 flex-1 overflow-hidden hover:underline",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "truncate font-medium",
									children: c.fullName
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "truncate text-xs text-muted",
									children: [
										c.lastBillet ? `${c.lastBillet} · ` : "",
										positionLabel(c.lastPosition),
										c.permanentRating && c.permanentRating !== c.lastPosition ? ` · perm ${positionLabel(c.permanentRating)}` : "",
										watch ? ` · ${watchLabel(watch)}` : "",
										c.lastSignOn ? ` · on ${formatShort(c.lastSignOn)}` : ""
									]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								className: "shrink-0",
								tone: dueTone(left),
								children: dueText(left, c.lastDueOff)
							})]
						}, c.id);
					})
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "min-w-0 overflow-hidden rounded-xl bg-ink p-5 text-paper shadow-border sm:p-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] uppercase tracking-[0.16em] text-sage",
						children: "Tickets"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mt-2 font-display text-2xl tracking-tight",
						children: "Expiry board"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-paper/75",
						children: "Expired and 30-day warnings for people aboard, rotary on leave, and permanents."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
						className: "mt-4 space-y-3",
						children: [(data?.alerts ?? []).slice(0, 6).map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex items-start justify-between gap-3 text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: "/crew/$crewId",
								params: { crewId: a.crewId },
								className: "min-w-0 hover:underline",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block truncate text-paper/90",
									children: a.label
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block truncate text-xs text-paper/60",
									children: a.marinerName
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExpiryChip, { date: a.expiresOn })]
						}, a.id)), data && data.alerts.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
							className: "text-sm text-paper/70",
							children: "No urgent tickets."
						}) : null]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-5 flex flex-wrap gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "inverse",
							asChild: true,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: "/expiry",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarClock, { className: "size-4" }), "Open expiry"]
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							className: "text-paper hover:bg-ink-3 hover:text-paper",
							asChild: true,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: "/ingest",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "size-4" }), "Load packets"]
							})
						})]
					})
				]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Quick, {
					to: "/crew",
					icon: Users,
					title: "Manning board",
					body: "Deck, engine, steward. Vacant slots stay open until you assign them."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Quick, {
					to: "/permanents",
					icon: Briefcase,
					title: "Permanents",
					body: "Rate a C/M, 1st or 2nd up without losing the seat, or replace someone who quit, got fired, or promoted."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Quick, {
					to: "/training",
					icon: BookOpenCheck,
					title: "NSE tickets",
					body: "SASH, fam, cyber, internet, HAZMAT — who is expired."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Quick, {
					to: "/cyber",
					icon: ShieldCheck,
					title: "Cyber class",
					body: "Three talks. Print the handouts, run the class, print certificates."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Quick, {
					to: "/hazmat",
					icon: Flame,
					title: "HAZMAT quiz",
					body: "Study sheet and test for Master and the mates. Grade later. Print the cert if they pass."
				})
			]
		})
	] });
}
function Stat({ label, value, href, search, hint, danger }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to: href,
		search,
		className: "min-w-0 rounded-xl bg-paper p-4 shadow-border transition-[box-shadow] duration-150 hover:shadow-border-hover",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[11px] uppercase tracking-wider text-sage",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: `mt-1 font-mono text-3xl tabular-nums ${danger && value !== 0 && value !== "—" ? "text-danger" : "text-ink"}`,
				children: value
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-xs text-muted",
				children: hint
			})
		]
	});
}
function Quick({ to, icon: Icon, title, body }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to,
		className: "min-w-0 rounded-xl bg-paper p-5 shadow-border transition-[box-shadow] duration-150 hover:shadow-border-hover",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
				className: "size-5 text-steel-2",
				strokeWidth: 1.75
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "mt-3 font-display text-lg tracking-tight",
				children: title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-muted",
				children: body
			})
		]
	});
}
function RunStrip({ run }) {
	const qc = useQueryClient();
	const mut = useMutation({
		mutationFn: saveVesselRun,
		onSuccess: async (next) => {
			await invalidateDesk(qc);
			toast.success(runLine(next));
		},
		onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save the run")
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "rounded-xl bg-paper p-4 shadow-border sm:p-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[11px] uppercase tracking-[0.16em] text-sage",
				children: "This run"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-muted",
				children: "Long Beach ↔ Honolulu. Oakland if we call. Nantong is the yard, about every five years."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 grid gap-3 sm:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "text-xs",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-muted",
							children: "This port"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PortSelect, {
							value: run.thisPort,
							onChange: (thisPort) => mut.mutate({ data: {
								thisPort,
								nextPort: matePort(thisPort),
								eta: run.eta,
								voyageNumber: run.voyageNumber
							} })
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "text-xs",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-muted",
							children: "Next port"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PortSelect, {
							value: run.nextPort,
							onChange: (nextPort) => mut.mutate({ data: {
								thisPort: run.thisPort,
								nextPort,
								eta: run.eta,
								voyageNumber: run.voyageNumber
							} })
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "text-xs",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-muted",
							children: "ETA"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							type: "date",
							className: "mt-1",
							value: run.eta ?? "",
							onChange: (e) => mut.mutate({ data: {
								thisPort: run.thisPort,
								nextPort: run.nextPort,
								eta: e.target.value || null,
								voyageNumber: run.voyageNumber
							} })
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "text-xs",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-muted",
							children: "Voyage"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							className: "mt-1",
							defaultValue: run.voyageNumber ?? "",
							onBlur: (e) => mut.mutate({ data: {
								thisPort: run.thisPort,
								nextPort: run.nextPort,
								eta: run.eta,
								voyageNumber: e.target.value || null
							} }),
							placeholder: "Optional"
						}, run.voyageNumber ?? "voy")]
					})
				]
			})
		]
	});
}
function BackupButton() {
	const [busy, setBusy] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
		variant: "outline",
		disabled: busy,
		onClick: () => {
			setBusy(true);
			exportLedger().then((data) => {
				const day = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
				downloadText(JSON.stringify(data, null, 2), `GEORGE-II-ledger-${day}.json`, "application/json");
				toast.success("Ledger saved. People, tickets, and tours.");
			}).catch((e) => toast.error(e instanceof Error ? e.message : "Could not export")).finally(() => setBusy(false));
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-4" }),
			" ",
			busy ? "Exporting…" : "Backup ledger"
		]
	});
}
//#endregion
export { Home as component };
