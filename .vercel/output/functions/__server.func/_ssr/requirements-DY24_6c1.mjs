import { a as SMS_CREWING_URL, o as SMS_URL } from "./types-DLRYosVU.mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { t as Button } from "./button-DnbeV2iT.mjs";
import { m as ExternalLink } from "../_libs/lucide-react.mjs";
import { n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { B as syncSmsRequirements, E as getSmsSync, j as listRequirements } from "./router-QLPwsRgl.mjs";
import { n as Desk, t as Badge } from "./badge-DfXuB0XH.mjs";
import { t as PageHeader } from "./page-header--nmhDNO6.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/requirements-DY24_6c1.js
var import_jsx_runtime = require_jsx_runtime();
function Page() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Desk, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Reqs, {}) });
}
function Reqs() {
	const reqs = useQuery({
		queryKey: ["requirements"],
		queryFn: () => listRequirements()
	});
	const sms = useQuery({
		queryKey: ["sms-sync"],
		queryFn: () => getSmsSync()
	});
	const sync = useMutation({
		mutationFn: () => syncSmsRequirements(),
		onSuccess: (r) => {
			toast.success(r.status.startsWith("ok") ? "Pulled the crewing book" : `SMS responded: ${r.status}`);
			sms.refetch();
		},
		onError: () => toast.error("Could not reach the SMS app")
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			kicker: "SMS · Crewing",
			title: "Newest sign-on requirements.",
			description: "This list is the SRO packet plus SMM-PER from the Safety Management crewing book. Sync pulls the live compiled copy.",
			actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				onClick: () => sync.mutate(),
				disabled: sync.isPending,
				children: sync.isPending ? "Syncing…" : "Sync from SMS"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "outline",
				asChild: true,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
					href: SMS_CREWING_URL,
					target: "_blank",
					rel: "noreferrer",
					children: ["Open crewing book", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "size-4" })]
				})
			})] })
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-6 rounded-xl bg-ink p-5 text-paper sm:p-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[11px] uppercase tracking-[0.16em] text-sage",
					children: "Controlled copy"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-2 text-sm text-paper/80",
					children: [
						"SMS app:",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: SMS_URL,
							className: "underline",
							target: "_blank",
							rel: "noreferrer",
							children: "g2sms.grok.me"
						}),
						". Last sync ",
						sms.data?.lastSyncedAt ? String(sms.data.lastSyncedAt).slice(0, 16) : "never",
						" · status",
						" ",
						sms.data?.status ?? "not yet",
						"."
					]
				}),
				sms.data?.procedures?.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-3 space-y-1 font-mono text-xs text-paper/70",
					children: sms.data.procedures.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
						p.id,
						" coded Rev ",
						p.codedRev,
						p.liveRev ? ` · live Rev ${p.liveRev}${p.match === false ? " — drifted" : ""}` : " · live rev not in the HTML shell"
					] }, p.id))
				}) : null,
				sms.data?.found?.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-2 font-mono text-xs text-paper/70",
					children: ["IDs seen: ", sms.data.found.slice(0, 12).join(" · ")]
				}) : null
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "overflow-hidden rounded-xl shadow-border",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "w-full text-left text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
					className: "bg-paper-2 text-[11px] uppercase tracking-wider text-sage",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-4 py-3",
							children: "Code"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-4 py-3",
							children: "Requirement"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-4 py-3",
							children: "Kind"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-4 py-3",
							children: "Applies"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-4 py-3",
							children: "Source"
						})
					] })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
					className: "divide-y divide-border",
					children: (reqs.data ?? []).map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "px-4 py-3 font-mono text-xs",
							children: r.code
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
							className: "px-4 py-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "font-medium",
								children: r.label
							}), r.notes ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-xs text-muted",
								children: r.notes
							}) : null]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "px-4 py-3",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								tone: r.kind === "certificate" ? "steel" : "neutral",
								children: r.kind
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "px-4 py-3 text-xs capitalize text-muted",
							children: r.appliesTo.replace("_", " ")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "px-4 py-3 text-xs uppercase text-sage",
							children: r.source
						})
					] }, r.id))
				})]
			})
		})
	] });
}
//#endregion
export { Page as component };
