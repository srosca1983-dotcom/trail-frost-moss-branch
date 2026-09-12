import { o as __toESM } from "../_runtime.mjs";
import { l as formatDate, y as positionLabel } from "./ratings-WR-IukGV.mjs";
import { a as isOfficerRotary } from "./shipping-CitWW3XC.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { k as listExpiring, p as Route$11 } from "./router-QLPwsRgl.mjs";
import { n as Desk } from "./badge-DfXuB0XH.mjs";
import { t as ExpiryChip } from "./expiry-chip-Booas4nG.mjs";
import { n as expiredPrintableSmm, r as isPrintableSmm, t as SmmPrintPanel } from "./smm-print-panel-C6DUru57.mjs";
import { t as PageHeader } from "./page-header--nmhDNO6.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/expiry-D2zwP_XQ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Page() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Desk, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Board, {}) });
}
function Board() {
	const q = useQuery({
		queryKey: ["expiring"],
		queryFn: () => listExpiring(),
		initialData: Route$11.useLoaderData()
	});
	const [filter, setFilter] = (0, import_react.useState)("all");
	const rows = (0, import_react.useMemo)(() => {
		const list = q.data ?? [];
		if (filter === "smm") return list.filter((d) => isPrintableSmm(d.docType) && d.tone === "expired");
		if (filter === "all") return list.filter((d) => d.tone !== "ok" && (d.tone !== "missing" || d.docType === "drug_free"));
		return list.filter((d) => d.tone === filter);
	}, [q.data, filter]);
	const printItems = (0, import_react.useMemo)(() => {
		const byCrew = /* @__PURE__ */ new Map();
		for (const d of q.data ?? []) {
			if (!d.mariner || d.tone !== "expired" || !isPrintableSmm(d.docType)) continue;
			const cur = byCrew.get(d.mariner.id) ?? {
				crewId: d.mariner.id,
				fullName: d.mariner.fullName,
				position: d.mariner.lastPosition,
				docs: []
			};
			cur.docs.push({
				docType: d.docType,
				expiresOn: d.expiresOn
			});
			byCrew.set(d.mariner.id, cur);
		}
		return [...byCrew.values()].map((r) => ({
			crewId: r.crewId,
			fullName: r.fullName,
			position: r.position,
			kinds: expiredPrintableSmm(r.docs)
		}));
	}, [q.data]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			kicker: "Tickets",
			title: "What has expired, and when.",
			description: "People aboard, rotary on vacation, and permanents. MMC, medical, and DOT drug-free sit together. Past relief and applicants stay off this list."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mb-5 flex flex-wrap gap-1 rounded-lg bg-paper-2 p-1",
			children: [
				"all",
				"expired",
				"soon",
				"watch",
				"ok",
				"smm"
			].map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => setFilter(t),
				className: `rounded-md px-3 py-1.5 text-sm capitalize ${filter === t ? "bg-ink text-paper" : "text-muted"}`,
				children: t === "all" ? "Action list" : t === "soon" ? "30 days" : t === "watch" ? "90 days" : t === "smm" ? "Expired SMM" : t
			}, t))
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mb-5",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SmmPrintPanel, { items: printItems })
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "min-w-0 overflow-x-auto rounded-xl shadow-border",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "w-full min-w-[700px] text-left text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
					className: "bg-paper-2 text-[11px] uppercase tracking-wider text-sage",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-4 py-3",
							children: "Mariner"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-4 py-3",
							children: "Document"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-4 py-3",
							children: "Expires"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-4 py-3",
							children: "Status"
						})
					] })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", {
					className: "divide-y divide-border",
					children: [rows.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "hover:bg-paper-2/60",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
								className: "px-4 py-3",
								children: [d.mariner ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/crew/$crewId",
									params: { crewId: d.mariner.id },
									className: "font-medium hover:underline",
									children: d.mariner.fullName
								}) : "—", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "text-xs text-muted",
									children: [positionLabel(d.mariner?.lastPosition ?? null), d.mariner ? ` · ${boardRole(d.mariner)}` : ""]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
								className: "px-4 py-3",
								children: [d.label, d.docNumber ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "font-mono text-xs text-faint",
									children: d.docNumber
								}) : null]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3 font-mono text-xs",
								children: formatDate(d.expiresOn)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExpiryChip, { date: d.expiresOn })
							})
						]
					}, d.id)), rows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						colSpan: 4,
						className: "px-4 py-10 text-center text-muted",
						children: q.isLoading ? "Loading…" : "Nothing in this band."
					}) }) : null]
				})]
			})
		})
	] });
}
function boardRole(m) {
	const status = (m.status ?? "").toLowerCase();
	if (status === "current") return "aboard";
	if (status === "vacation") {
		if (isOfficerRotary(m.unionHall, m.assignmentType)) return "rotary leave";
		return "vacation";
	}
	if (m.permanentRating || (m.assignmentType ?? "").toUpperCase() === "PERMANENT") return "permanent";
	return status || "on file";
}
//#endregion
export { Page as component };
