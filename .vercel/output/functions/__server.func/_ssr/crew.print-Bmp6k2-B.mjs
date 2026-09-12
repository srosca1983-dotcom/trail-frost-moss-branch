import { o as __toESM } from "../_runtime.mjs";
import { c as VESSEL_PARTICULARS, n as COMPANY_ADDRESS, s as VESSEL, t as COMPANY } from "./types-DLRYosVU.mjs";
import { d as formatShort, u as formatMdY } from "./ratings-WR-IukGV.mjs";
import { l as matePort } from "./ports-C0XwVrj0.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { t as Button } from "./button-DnbeV2iT.mjs";
import { S as ArrowLeft, c as Printer, h as Download } from "../_libs/lucide-react.mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { T as getShipRoster, s as Route$1 } from "./router-QLPwsRgl.mjs";
import { t as Input } from "./input-B2bEx-Se.mjs";
import { a as crewListFilename, c as flattenWatchBill, i as buildWatchBillPdf, n as buildGenericCrewListPdf, o as downloadPdf, r as buildImoCrewListPdf, s as flattenAboard, t as DEFAULT_IMO_HEADER } from "./crew-list-C9XRi5ZX.mjs";
import { a as flattenEnoad, i as enoadFilename, n as buildEnoadWorkbook, r as downloadText, t as buildEnoadCsv } from "./enoad-DcToIuEP.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/crew.print-Bmp6k2-B.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Page() {
	const search = Route$1.useSearch();
	const kind = search.kind === "imo" ? "imo" : search.kind === "watch" ? "watch" : search.kind === "enoad" ? "enoad" : "generic";
	const ship = useQuery({
		queryKey: ["ship-roster"],
		queryFn: () => getShipRoster()
	});
	const rows = (0, import_react.useMemo)(() => flattenAboard(ship.data?.slots ?? []), [ship.data]);
	const enoadRows = (0, import_react.useMemo)(() => flattenEnoad(ship.data?.slots ?? []), [ship.data]);
	const watches = (0, import_react.useMemo)(() => flattenWatchBill(ship.data?.slots ?? []), [ship.data]);
	const [header, setHeader] = (0, import_react.useState)(() => {
		if (typeof window === "undefined") return DEFAULT_IMO_HEADER;
		try {
			const raw = localStorage.getItem("crew-ledger-imo-header");
			if (raw) return {
				...DEFAULT_IMO_HEADER,
				...JSON.parse(raw)
			};
		} catch {}
		return DEFAULT_IMO_HEADER;
	});
	const [busy, setBusy] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const run = ship.data?.run;
		if (!run) return;
		setHeader((h) => {
			if (h.port && h.lastPort) return h;
			const next = {
				...h,
				port: h.port || run.thisPort,
				lastPort: h.lastPort || matePort(run.thisPort),
				nextPort: h.nextPort || run.nextPort,
				voyageNumber: h.voyageNumber || run.voyageNumber || "",
				date: h.date || run.eta || DEFAULT_IMO_HEADER.date
			};
			try {
				localStorage.setItem("crew-ledger-imo-header", JSON.stringify(next));
			} catch {}
			return next;
		});
	}, [ship.data?.run]);
	function persist(next) {
		setHeader(next);
		try {
			localStorage.setItem("crew-ledger-imo-header", JSON.stringify(next));
		} catch {}
	}
	async function download(format = "pdf") {
		setBusy(true);
		try {
			if (kind === "enoad") {
				if (format === "csv") downloadText(buildEnoadCsv(enoadRows), enoadFilename("csv", header.date), "text/csv;charset=utf-8");
				else downloadText(buildEnoadWorkbook(enoadRows, header), enoadFilename("xls", header.date), "application/vnd.ms-excel");
				toast.success(format === "csv" ? "CSV saved." : "Excel saved. Crew sheet is what the Master pastes into eNOAD.");
				return;
			}
			const bytes = kind === "imo" ? await buildImoCrewListPdf(rows, header) : kind === "watch" ? await buildWatchBillPdf(watches, header.date) : await buildGenericCrewListPdf(rows, header.date);
			downloadPdf(bytes, crewListFilename(kind, header.date));
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Could not build the file");
		} finally {
			setBusy(false);
		}
	}
	const enoadMissing = enoadRows.filter((r) => r.missing.length);
	const listMissing = rows.filter((r) => r.missing.length);
	const issued = formatMdY(header.date) || formatShort(header.date);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-dvh bg-paper text-ink",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "no-print mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/crew",
						className: "inline-flex items-center gap-1 text-sm text-steel-2 hover:underline",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "size-4" }), " Roster"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-1 font-display text-2xl tracking-tight",
						children: kind === "imo" ? "IMO crew list (FAL Form 5)" : kind === "watch" ? "Watch bill" : kind === "enoad" ? "eNOAD crew list" : "Crew list"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: kind === "imo" ? "For a Nantong / China call. Fill the voyage header, then print or download. Long Beach and Honolulu use the generic list and eNOAD." : kind === "watch" ? "One page for the wheelhouse and the mess. 12–4, 4–8, 8–12, and day workers." : kind === "enoad" ? "Excel for the Master to paste into eNOAD. Not a full Notice of Arrival — voyage, last five ports, and cargo stay on his last notice." : "Generic list with date of birth. Print or download a PDF."
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: kind === "generic" ? "default" : "outline",
							asChild: true,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/crew/print",
								search: { kind: "generic" },
								children: "Generic"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: kind === "imo" ? "default" : "outline",
							asChild: true,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/crew/print",
								search: { kind: "imo" },
								children: "IMO FAL 5"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: kind === "watch" ? "default" : "outline",
							asChild: true,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/crew/print",
								search: { kind: "watch" },
								children: "Watch bill"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: kind === "enoad" ? "default" : "outline",
							asChild: true,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/crew/print",
								search: { kind: "enoad" },
								children: "eNOAD"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "outline",
							onClick: () => window.print(),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Printer, { className: "size-4" }), " Print"]
						}),
						kind === "enoad" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							disabled: busy || !enoadRows.length,
							onClick: () => void download("xls"),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-4" }),
								" ",
								busy ? "Building…" : "Download Excel"
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							disabled: busy || !enoadRows.length,
							onClick: () => void download("csv"),
							children: "CSV"
						})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							disabled: busy || (kind === "watch" ? !watches.some((g) => g.rows.length) : !rows.length),
							onClick: () => void download("pdf"),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-4" }),
								" ",
								busy ? "Building…" : "Download PDF"
							]
						})
					]
				})]
			}),
			kind === "imo" || kind === "enoad" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "no-print mx-auto mb-4 grid max-w-6xl gap-3 rounded-xl bg-paper-2 p-4 sm:grid-cols-2 lg:grid-cols-4",
				onSubmit: (e) => e.preventDefault(),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "text-xs",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-muted",
							children: "Port of arrival / departure"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							className: "mt-1",
							value: header.port,
							onChange: (e) => persist({
								...header,
								port: e.target.value
							})
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "text-xs",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-muted",
							children: "Date"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							type: "date",
							className: "mt-1",
							value: header.date,
							onChange: (e) => persist({
								...header,
								date: e.target.value
							})
						})]
					}),
					kind === "imo" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "text-xs",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-muted",
							children: "Voyage number"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							className: "mt-1",
							value: header.voyageNumber,
							onChange: (e) => persist({
								...header,
								voyageNumber: e.target.value
							})
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "text-xs",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-muted",
							children: "Last port of call"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							className: "mt-1",
							value: header.lastPort,
							onChange: (e) => persist({
								...header,
								lastPort: e.target.value
							})
						})]
					})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "self-end text-xs text-muted sm:col-span-2",
						children: "Port and date go on the Read me sheet so the Master has them. They do not file this file as the notice."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
						className: "flex items-end gap-4 text-sm sm:col-span-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "checkbox",
								checked: header.arrival,
								onChange: (e) => persist({
									...header,
									arrival: e.target.checked
								})
							}), "Arrival"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "checkbox",
								checked: header.departure,
								onChange: (e) => persist({
									...header,
									departure: e.target.checked
								})
							}), "Departure"]
						})]
					})
				]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "no-print mx-auto mb-4 flex max-w-6xl items-end gap-3 px-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "text-xs",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-muted",
						children: "Date on the list"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						type: "date",
						className: "mt-1 w-44",
						value: header.date,
						onChange: (e) => persist({
							...header,
							date: e.target.value
						})
					})]
				})
			}),
			kind === "enoad" && enoadMissing.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "no-print mx-auto mb-3 max-w-6xl px-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm text-warn",
					children: [
						enoadMissing.length,
						" ",
						enoadMissing.length === 1 ? "name is" : "names are",
						" short of 33 CFR 160.206. Fill the file before the Master pastes into eNOAD."
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-2 space-y-1 text-sm",
					children: enoadMissing.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/crew/$crewId",
						params: { crewId: r.crewId },
						className: "font-medium hover:underline",
						children: [
							r.lastName,
							", ",
							r.firstName
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "text-muted",
						children: [" — ", r.missing.join(", ")]
					})] }, r.crewId))
				})]
			}) : kind !== "watch" && kind !== "enoad" && listMissing.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "no-print mx-auto mb-3 max-w-6xl px-4 text-sm text-warn",
				children: [
					listMissing.length,
					" ",
					listMissing.length === 1 ? "name is" : "names are",
					" missing DOB, place of birth, or an ID. Blanks print so they can be filled by hand."
				]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("article", {
				className: "print-sheet mx-auto max-w-6xl bg-paper px-4 pb-10 sm:px-6",
				children: kind === "imo" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImoSheet, {
					rows,
					header,
					loading: !ship.data
				}) : kind === "watch" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WatchSheet, {
					groups: watches,
					issued,
					loading: !ship.data
				}) : kind === "enoad" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EnoadSheet, {
					rows: enoadRows,
					header,
					loading: !ship.data
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GenericSheet, {
					rows,
					issued,
					loading: !ship.data
				})
			}),
			kind === "watch" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: `@media print { @page { size: landscape; } }` }) : null
		]
	});
}
function WatchSheet({ groups, issued, loading }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "text-ink",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "border-b border-ink pb-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs uppercase tracking-[0.16em] text-sage",
					children: COMPANY
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-3xl tracking-tight",
					children: "Watch bill"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1 text-sm",
					children: [
						VESSEL,
						" · IMO ",
						VESSEL_PARTICULARS.imo,
						" · ",
						issued
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: "Wheelhouse and mess. Watch follows the job."
				})
			]
		}), loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "py-8 text-sm text-muted",
			children: "Loading articles…"
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-4",
			children: groups.map((g) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-xl bg-paper-2 p-3 print:rounded-none print:border print:border-ink print:bg-paper",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "font-display text-2xl tracking-tight",
						children: g.label
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-[11px] uppercase tracking-wider text-sage",
						children: [g.rows.filter((r) => !r.vacant).length, " on watch"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-3 space-y-3",
						children: g.rows.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-[11px] uppercase tracking-wider text-sage",
							children: r.title
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: r.vacant ? "text-sm text-muted" : "font-medium",
							children: r.name
						})] }, `${r.code}-${r.name}`))
					})
				]
			}, g.watch))
		})]
	});
}
function GenericSheet({ rows, issued, loading }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "text-ink",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "border-b border-ink pb-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs uppercase tracking-[0.16em] text-sage",
						children: COMPANY
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-3xl tracking-tight",
						children: "Crew list"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 text-sm",
						children: [
							VESSEL,
							" · IMO ",
							VESSEL_PARTICULARS.imo,
							" · Call sign ",
							VESSEL_PARTICULARS.callSign,
							" · Flag ",
							VESSEL_PARTICULARS.flagCode
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-muted",
						children: [
							COMPANY_ADDRESS,
							" · Port of registry ",
							VESSEL_PARTICULARS.portOfRegistry,
							" · ",
							issued,
							" · ",
							rows.length,
							" souls on board"
						]
					})
				]
			}),
			loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "py-8 text-sm text-muted",
				children: "Loading articles…"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-4 space-y-2 md:hidden print:hidden",
				children: rows.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "rounded-lg bg-paper-2 px-3 py-2 text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "font-medium",
						children: r.fullName
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "text-xs text-muted",
						children: [
							r.rank,
							" · DOB ",
							formatMdY(r.dob) || "needs date",
							" · ",
							r.nationality,
							r.idNumber ? ` · ${r.idNature} ${r.idNumber}` : ""
						]
					})]
				}, r.crewId))
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4 hidden overflow-x-auto md:block print:block",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full min-w-[720px] border-collapse text-left text-xs",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-b border-ink text-[10px] uppercase tracking-wider",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-2 pr-2",
								children: "No."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-2 pr-2",
								children: "Name"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-2 pr-2",
								children: "Rank / rating"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-2 pr-2",
								children: "Nat."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-2 pr-2",
								children: "Date of birth"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-2 pr-2",
								children: "Place of birth"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-2 pr-2",
								children: "Sex"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-2",
								children: "Passport / MMC"
							})
						]
					}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: rows.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-b border-border",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-1.5 pr-2 font-mono",
								children: r.no
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-1.5 pr-2 font-medium",
								children: r.fullName
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-1.5 pr-2",
								children: r.rank
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-1.5 pr-2",
								children: r.nationality
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-1.5 pr-2",
								children: formatMdY(r.dob) || " "
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-1.5 pr-2",
								children: r.placeOfBirth || " "
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-1.5 pr-2",
								children: r.gender
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-1.5",
								children: r.idNumber ? `${r.idNature} ${r.idNumber}` : " "
							})
						]
					}, r.crewId)) })]
				})
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
				className: "mt-10 grid gap-8 text-sm sm:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-muted",
					children: "Master / authorized officer"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mt-8 border-b border-ink" })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-muted",
					children: "Date"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mt-8 border-b border-ink" })] })]
			})
		]
	});
}
function ImoSheet({ rows, header, loading }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "text-ink",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex flex-wrap items-start justify-between gap-3 border-b border-ink pb-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-2xl tracking-tight",
					children: "Crew list"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: "(IMO FAL Form 5)"
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-4 text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [header.arrival ? "☑" : "☐", " Arrival"] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [header.departure ? "☑" : "☐", " Departure"] })]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
				className: "mt-3 grid gap-x-6 gap-y-1 text-xs sm:grid-cols-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: ["1.1 Name of ship · ", VESSEL_PARTICULARS.displayName] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: ["1.3 Call sign · ", VESSEL_PARTICULARS.callSign] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: ["1.2 IMO number · ", VESSEL_PARTICULARS.imo] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: ["1.4 Voyage number · ", header.voyageNumber || "—"] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: ["2. Port of arrival/departure · ", header.port || "—"] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: ["4. Flag State of ship · ", VESSEL_PARTICULARS.flag] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: ["3. Date of arrival/departure · ", formatMdY(header.date) || "—"] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: ["5. Last port of call · ", header.lastPort || "—"] })
				]
			}),
			loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "py-8 text-sm text-muted",
				children: "Loading articles…"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-4 space-y-2 md:hidden print:hidden",
				children: rows.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "rounded-lg bg-paper-2 px-3 py-2 text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "font-medium",
						children: [
							r.no,
							". ",
							r.familyName,
							", ",
							r.givenNames
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "text-xs text-muted",
						children: [
							r.rank,
							" · ",
							r.nationality,
							" · DOB ",
							formatMdY(r.dob) || "needs date",
							" · ",
							r.placeOfBirth || "POB —"
						]
					})]
				}, r.crewId))
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4 hidden overflow-x-auto md:block print:block",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full min-w-[960px] border-collapse text-left text-[11px]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-b border-ink",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-2 pr-1",
								children: "6. No."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-2 pr-1",
								children: "7. Family name"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-2 pr-1",
								children: "8. Given names"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-2 pr-1",
								children: "9. Rank or rating"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-2 pr-1",
								children: "10. Nationality"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-2 pr-1",
								children: "11. Date of birth"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-2 pr-1",
								children: "12. Place of birth"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-2 pr-1",
								children: "13. Gender"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-2 pr-1",
								children: "14. Nature of ID"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-2 pr-1",
								children: "15. Number of ID"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-2 pr-1",
								children: "16. Issuing State"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-2",
								children: "17. Expiry of ID"
							})
						]
					}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: rows.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-b border-border",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-1 pr-1 font-mono",
								children: r.no
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-1 pr-1 font-medium",
								children: r.familyName
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-1 pr-1",
								children: r.givenNames
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-1 pr-1",
								children: r.rank
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-1 pr-1",
								children: r.nationality
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-1 pr-1",
								children: formatMdY(r.dob) || " "
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-1 pr-1",
								children: r.placeOfBirth || " "
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-1 pr-1",
								children: r.gender
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-1 pr-1",
								children: r.idNature
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-1 pr-1",
								children: r.idNumber
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-1 pr-1",
								children: r.idIssuing
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-1",
								children: formatMdY(r.idExpiry) || " "
							})
						]
					}, r.crewId)) })]
				})
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-10 text-xs text-muted",
				children: "18. Date and signature by master, authorized agent or officer"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mt-8 max-w-sm border-b border-ink" })
		]
	});
}
function EnoadSheet({ rows, header, loading }) {
	const notice = header.arrival && header.departure ? "Arrival and departure" : header.departure ? "Departure" : "Arrival";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "text-ink",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "border-b border-ink pb-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs uppercase tracking-[0.16em] text-sage",
						children: COMPANY
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-3xl tracking-tight",
						children: "eNOAD crew list"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 text-sm",
						children: [
							VESSEL,
							" · IMO ",
							VESSEL_PARTICULARS.imo,
							" · Call sign ",
							VESSEL_PARTICULARS.callSign,
							" · Flag ",
							VESSEL_PARTICULARS.flagCode
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-muted",
						children: [
							notice,
							header.port ? ` · ${header.port}` : "",
							header.date ? ` · ${formatMdY(header.date) || header.date}` : "",
							" · ",
							rows.length,
							" souls on board · 33 CFR 160.206"
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
				className: "mt-4 list-decimal space-y-1 pl-5 text-sm text-muted",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Master or agent copies the last accepted notice in eNOAD and updates the voyage." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "On Crew List, enter these names. Sex is Male or Female. Debark stays blank until the US port is known." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Do not email this spreadsheet to NVMC. They only take the official workbook or XML of a complete notice." })
				]
			}),
			loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "py-8 text-sm text-muted",
				children: "Loading articles…"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-4 space-y-2 md:hidden print:hidden",
				children: rows.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "rounded-lg bg-paper-2 px-3 py-2 text-sm",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "font-medium",
							children: [
								r.no,
								". ",
								r.lastName,
								", ",
								r.firstName,
								" ",
								r.middleName
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-xs text-muted",
							children: [
								r.position,
								" · ",
								r.nationality,
								" · DOB ",
								r.dobUs || "needs date",
								" · ",
								r.sex || "sex —",
								r.idNumber ? ` · ${r.idType} ${r.idNumber}` : " · no ID",
								r.embarkPort ? ` · joined ${r.embarkPort}` : " · embark —"
							]
						}),
						r.missing.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-1 text-xs text-warn",
							children: r.missing.join(", ")
						}) : null
					]
				}, r.crewId))
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4 hidden overflow-x-auto md:block print:block",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full min-w-[960px] border-collapse text-left text-[11px]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-b border-ink text-[10px] uppercase tracking-wider",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-2 pr-1",
								children: "No."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-2 pr-1",
								children: "Last"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-2 pr-1",
								children: "First"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-2 pr-1",
								children: "Middle"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-2 pr-1",
								children: "Position"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-2 pr-1",
								children: "Nat."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-2 pr-1",
								children: "DOB"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-2 pr-1",
								children: "Sex"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-2 pr-1",
								children: "ID type"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-2 pr-1",
								children: "ID number"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-2 pr-1",
								children: "ID exp."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-2 pr-1",
								children: "Embarked"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-2",
								children: "Missing"
							})
						]
					}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: rows.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-b border-border",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-1 pr-1 font-mono",
								children: r.no
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-1 pr-1 font-medium",
								children: r.lastName
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-1 pr-1",
								children: r.firstName
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-1 pr-1",
								children: r.middleName
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-1 pr-1",
								children: r.position
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-1 pr-1",
								children: r.nationalityCode
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-1 pr-1",
								children: r.dobUs || " "
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-1 pr-1",
								children: r.sex || " "
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-1 pr-1",
								children: r.idType
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-1 pr-1",
								children: r.idNumber
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-1 pr-1",
								children: r.idExpiryUs || " "
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-1 pr-1",
								children: r.embarkPort || " "
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-1 text-warn",
								children: r.missing.join(", ")
							})
						]
					}, r.crewId)) })]
				})
			})] })
		]
	});
}
//#endregion
export { Page as component };
