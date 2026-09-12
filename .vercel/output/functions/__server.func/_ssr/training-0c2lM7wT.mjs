import { o as __toESM } from "../_runtime.mjs";
import { l as cn } from "./types-DLRYosVU.mjs";
import { u as formatMdY } from "./ratings-WR-IukGV.mjs";
import { i as NSE_SHORT, n as NSE_KINDS, o as NSE_VALIDITY_YEARS, t as NSE_CODES } from "./nse-D-shPCWK.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { t as Button } from "./button-DnbeV2iT.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { B as syncSmsRequirements, C as getNseBoard, U as upsertNseTraining, u as Route$4 } from "./router-QLPwsRgl.mjs";
import { n as Desk, t as Badge } from "./badge-DfXuB0XH.mjs";
import { r as SMS_TRAINING, t as HAZMAT_MARK } from "./sms-training-gdj5DqvS.mjs";
import { n as expiredPrintableSmm, t as SmmPrintPanel } from "./smm-print-panel-C6DUru57.mjs";
import { t as PageHeader } from "./page-header--nmhDNO6.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/training-0c2lM7wT.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Page() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Desk, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Board, {}) });
}
function Board() {
	const qc = useQueryClient();
	const q = useQuery({
		queryKey: ["nse-board"],
		queryFn: () => getNseBoard(),
		initialData: Route$4.useLoaderData()
	});
	const [filter, setFilter] = (0, import_react.useState)("action");
	const [editing, setEditing] = (0, import_react.useState)(null);
	const mut = useMutation({
		mutationFn: upsertNseTraining,
		onSuccess: async () => {
			await qc.invalidateQueries({ queryKey: ["nse-board"] });
			await qc.invalidateQueries({ queryKey: ["expiring"] });
			await qc.invalidateQueries({ queryKey: ["dashboard"] });
			await qc.invalidateQueries({ queryKey: ["crew"] });
			setEditing(null);
		},
		onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save")
	});
	const smsMut = useMutation({
		mutationFn: () => syncSmsRequirements(),
		onSuccess: async (r) => {
			await qc.invalidateQueries({ queryKey: ["nse-board"] });
			await qc.invalidateQueries({ queryKey: ["sms-sync"] });
			await qc.invalidateQueries({ queryKey: ["requirements"] });
			if (r.status === "rev-drift") toast.error("SMS revision moved — check the banner.");
			else if (r.status === "spa") toast.message("Reached SMS. Procedure pages are an app shell — coded revs still apply.");
			else toast.success("Checked SMS against SMM-PER-06 and SMM-SMM-08.");
		},
		onError: () => toast.error("Could not reach the SMS app")
	});
	const rows = (0, import_react.useMemo)(() => {
		const list = q.data?.rows ?? [];
		if (filter === "all") return list;
		return list.filter((r) => {
			if (filter === "expired") return r.expiredCount > 0;
			if (filter === "watch") return r.watchCount > 0;
			if (filter === "missing") return r.missingCount > 0;
			return r.expiredCount > 0 || r.watchCount > 0 || r.missingCount > 0;
		});
	}, [q.data, filter]);
	const printItems = (0, import_react.useMemo)(() => (q.data?.rows ?? []).map((r) => ({
		crewId: r.crewId,
		fullName: r.fullName,
		position: r.rating,
		kinds: expiredPrintableSmm(r.certs)
	})).filter((i) => i.kinds.length), [q.data]);
	function save(crewId, kind, field, value, cell) {
		const issued = field === "issued" ? value || null : cell.issued;
		const expires = field === "expires" ? value || null : field === "issued" ? null : cell.expires;
		mut.mutate({ data: {
			crewId,
			kind,
			issued,
			expires
		} });
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			kicker: "NSE training certificates",
			title: "Permanent crew tickets.",
			description: "Columns follow SMM-PER-06 and SMM-SMM-08, not the old NS5 five-column sheet. Grey N/A is not required for that rate. Filling a 101.650 certificate on the cyber desk stamps Mod 1–3 here.",
			actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "outline",
				asChild: true,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/hazmat",
					children: "HAZMAT quiz"
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				onClick: () => smsMut.mutate(),
				disabled: smsMut.isPending,
				children: smsMut.isPending ? "Checking SMS…" : "Check SMS"
			})] })
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SmsBanner, { sms: q.data?.sms }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mb-5",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SmmPrintPanel, { items: printItems })
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-wrap gap-1 rounded-lg bg-paper-2 p-1",
				children: [
					["action", "Action list"],
					["all", "All"],
					["expired", "Expired"],
					["watch", "90 days"],
					["missing", "Missing"]
				].map(([id, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setFilter(id),
					className: cn("rounded-md px-3 py-1.5 text-sm", filter === id ? "bg-ink text-paper" : "text-muted hover:text-ink"),
					children: label
				}, id))
			}), q.data ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-sm text-muted",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "text-danger",
						children: [q.data.expired, " expired"]
					}),
					" · ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "text-warn",
						children: [q.data.watch, " in 90 days"]
					}),
					" · ",
					q.data.missing,
					" missing"
				]
			}) : null]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
			className: "mb-5 grid gap-2 text-xs text-muted sm:grid-cols-2 lg:grid-cols-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					className: "rounded-lg bg-warn/20 px-3 py-2 text-warn",
					children: "Yellow box — expires in 90 days or less"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					className: "rounded-lg bg-danger/10 px-3 py-2 text-danger",
					children: "Red numbers — already expired, needs updating"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					className: "rounded-lg bg-paper-2 px-3 py-2 text-ink",
					children: "Uncolored — still valid"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					className: "rounded-lg bg-paper-2 px-3 py-2 text-steel-2",
					children: "Blue writing — click to edit"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					className: "rounded-lg bg-paper-2 px-3 py-2 text-faint",
					children: "N/A — SMS does not require this rate"
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mb-4 hidden overflow-hidden rounded-xl shadow-border md:block",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "min-w-0 overflow-x-auto",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full min-w-[1280px] text-left text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("thead", {
						className: "bg-paper-2 text-[11px] uppercase tracking-wider text-sage",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "sticky left-0 z-20 min-w-48 bg-paper-2 px-4 py-3 font-medium shadow-[2px_0_8px_rgba(11,16,20,0.08)]",
							rowSpan: 2,
							children: "Permanent crew"
						}), NSE_KINDS.map((k) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("th", {
							className: "px-3 py-2 text-center font-medium",
							colSpan: 2,
							children: [NSE_SHORT[k], /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-0.5 font-mono text-[10px] font-normal normal-case tracking-normal text-faint",
								children: [
									NSE_CODES[k],
									" · ",
									NSE_VALIDITY_YEARS[k],
									" ",
									NSE_VALIDITY_YEARS[k] === 1 ? "year" : "years"
								]
							})]
						}, k))] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: NSE_KINDS.flatMap((k) => [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2 text-center font-normal",
							children: "Issued"
						}, `${k}-i`), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2 text-center font-normal",
							children: "Expires"
						}, `${k}-e`)]) })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", {
						className: "divide-y divide-border bg-paper",
						children: [rows.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "align-top",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "sticky left-0 z-10 bg-paper px-4 py-3 shadow-[2px_0_8px_rgba(11,16,20,0.08)]",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NameCell, { row: r })
							}), NSE_KINDS.flatMap((k) => {
								const cell = r.certs[k];
								return [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DateTd, {
									cell,
									field: "issued",
									editing: editing?.crewId === r.crewId && editing.kind === k && editing.field === "issued",
									saving: mut.isPending,
									onEdit: () => setEditing({
										crewId: r.crewId,
										kind: k,
										field: "issued"
									}),
									onCancel: () => setEditing(null),
									onSave: (v) => save(r.crewId, k, "issued", v, cell)
								}, `${r.crewId}-${k}-i`), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DateTd, {
									cell,
									field: "expires",
									editing: editing?.crewId === r.crewId && editing.kind === k && editing.field === "expires",
									saving: mut.isPending,
									onEdit: () => setEditing({
										crewId: r.crewId,
										kind: k,
										field: "expires"
									}),
									onCancel: () => setEditing(null),
									onSave: (v) => save(r.crewId, k, "expires", v, cell)
								}, `${r.crewId}-${k}-e`)];
							})]
						}, r.crewId)), rows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							colSpan: 1 + NSE_KINDS.length * 2,
							className: "px-4 py-10 text-center text-muted",
							children: q.isLoading ? "Loading the NS5 list…" : "Nobody in this band."
						}) }) : null]
					})]
				})
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-3 md:hidden",
			children: [rows.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
				className: "rounded-xl bg-paper p-4 shadow-border",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NameCell, { row: r }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dl", {
					className: "mt-3 divide-y divide-border",
					children: NSE_KINDS.map((k) => {
						const cell = r.certs[k];
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start justify-between gap-3 py-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dt", {
								className: "min-w-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-sm font-medium",
									children: NSE_SHORT[k]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "font-mono text-[10px] text-faint",
									children: NSE_CODES[k]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", {
								className: "flex gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DateBtn, {
									cell,
									field: "issued",
									editing: editing?.crewId === r.crewId && editing.kind === k && editing.field === "issued",
									saving: mut.isPending,
									onEdit: () => setEditing({
										crewId: r.crewId,
										kind: k,
										field: "issued"
									}),
									onCancel: () => setEditing(null),
									onSave: (v) => save(r.crewId, k, "issued", v, cell)
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DateBtn, {
									cell,
									field: "expires",
									editing: editing?.crewId === r.crewId && editing.kind === k && editing.field === "expires",
									saving: mut.isPending,
									onEdit: () => setEditing({
										crewId: r.crewId,
										kind: k,
										field: "expires"
									}),
									onCancel: () => setEditing(null),
									onSave: (v) => save(r.crewId, k, "expires", v, cell)
								})]
							})]
						}, k);
					})
				})]
			}, r.crewId)), rows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "rounded-xl bg-paper px-4 py-8 text-center text-sm text-muted shadow-border",
				children: q.isLoading ? "Loading the NS5 list…" : "Nobody in this band."
			}) : null]
		})
	] });
}
function NameCell({ row }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-w-0",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/crew/$crewId",
				params: { crewId: row.crewId },
				className: "font-medium hover:underline",
				children: row.sheetName
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-0.5 text-xs text-muted",
				children: [row.rating, row.covering ? ` · ${row.covering}` : ""]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-1 flex flex-wrap gap-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
					tone: row.status === "current" ? "current" : row.status === "vacation" ? "steel" : "past",
					children: row.status === "current" ? "aboard" : row.status === "vacation" ? "vacation" : row.status ?? "off list"
				}), row.onSheet ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
					tone: "steel",
					children: "not on NS5"
				})]
			})
		]
	});
}
function cellFill(cell, field) {
	if (!cell.required && !cell.issued && !cell.expires) return "bg-paper-2/80";
	if (field === "issued") return "bg-transparent";
	if (cell.tone === "expired") return "bg-danger/10";
	if (cell.tone === "watch" || cell.tone === "soon") return "bg-warn/25";
	if (cell.tone === "missing") return "bg-paper-2";
	return "bg-transparent";
}
function cellText(cell, field) {
	if (!cell.required && !cell.issued && !cell.expires) return "text-faint";
	if (field === "expires" && cell.tone === "expired") return "text-danger";
	if (cell.tone === "missing" && field === "expires") return "text-danger";
	return "text-steel-2";
}
function DateTd({ cell, field, editing, saving, onEdit, onCancel, onSave }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
		className: cn("px-1 py-2 text-center", cellFill(cell, field)),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DateBtn, {
			cell,
			field,
			editing,
			saving,
			onEdit,
			onCancel,
			onSave
		})
	});
}
function DateBtn({ cell, field, editing, saving, onEdit, onCancel, onSave }) {
	const value = field === "issued" ? cell.issued : cell.expires;
	const empty = !value;
	const na = !cell.required && empty;
	const needs = empty && cell.required && (cell.tone === "missing" || cell.placeholder || cell.tone === "expired") && field === "expires";
	const label = value ? field === "issued" && cell.kind === "hazmat" && cell.score != null ? `${formatMdY(value)} · ${cell.score}/20` : formatMdY(value) : na ? "N/A" : needs ? "Needs date" : "—";
	if (editing) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		type: "date",
		defaultValue: value ?? "",
		autoFocus: true,
		disabled: saving,
		"aria-label": field === "issued" ? "Issued" : "Expires",
		className: "h-10 min-w-28 rounded-md border border-border bg-paper px-2 font-mono text-xs text-ink",
		onBlur: (e) => {
			if (e.target.value === (value ?? "")) {
				onCancel();
				return;
			}
			onSave(e.target.value);
		},
		onKeyDown: (e) => {
			if (e.key === "Escape") onCancel();
			if (e.key === "Enter") {
				e.preventDefault();
				onSave(e.target.value);
			}
		}
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		onClick: onEdit,
		className: cn("inline-flex min-h-10 min-w-24 items-center justify-center rounded-md px-2 font-mono text-xs tabular-nums", cellFill(cell, field), cellText(cell, field)),
		children: label
	});
}
function SmsBanner({ sms }) {
	const drift = sms?.procedures.some((p) => p.match === false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("mb-5 rounded-xl p-5 sm:p-6", drift ? "bg-danger text-paper" : "bg-ink text-paper"),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[11px] uppercase tracking-[0.16em] text-sage",
				children: "SMS training matrix"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 max-w-3xl text-sm leading-relaxed text-paper/80",
				children: [
					SMS_TRAINING.per06.id,
					" Rev ",
					SMS_TRAINING.per06.rev,
					" · 11 Sep 2025 and ",
					SMS_TRAINING.smm08.id,
					" Rev ",
					SMS_TRAINING.smm08.rev,
					" · 31 Jul 2026. Mod 1 all crew. Mod 2 / 3 officers + electrician. ",
					HAZMAT_MARK
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-3 flex flex-wrap gap-3 font-mono text-[11px] text-paper/70",
				children: (sms?.procedures ?? []).map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
					p.id,
					" coded Rev ",
					p.codedRev,
					p.liveRev ? ` · SMS Rev ${p.liveRev}${p.match === false ? " — drifted" : ""}` : " · SMS not parsed"
				] }, p.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 text-xs text-paper/60",
				children: [
					"Last check ",
					sms?.checkedAt ? String(sms.checkedAt).slice(0, 16) : "never",
					" · ",
					sms?.status ?? "not yet",
					". Filling cyber certificates stamps Mod 1–3 automatically."
				]
			})
		]
	});
}
//#endregion
export { Page as component };
