import { o as __toESM } from "../_runtime.mjs";
import { l as cn } from "./types-DLRYosVU.mjs";
import { y as positionLabel } from "./ratings-WR-IukGV.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { _ as ChevronDown, s as Search } from "../_libs/lucide-react.mjs";
import { t as Input } from "./input-B2bEx-Se.mjs";
import { i as Trigger, n as Portal, r as Root2, t as Content2 } from "../_libs/@radix-ui/react-popover+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/crew-picker-Cxok1PNn.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var STATUS_ORDER = {
	current: 0,
	vacation: 1,
	applicant: 2,
	past: 3
};
function statusLabel(s) {
	if (s === "current") return "aboard";
	if (s === "vacation") return "leave";
	if (s === "applicant") return "applicant";
	if (s === "past") return "past";
	return s ?? "";
}
function matchesQuery(p, q) {
	if (!q) return true;
	const hay = [
		p.fullName,
		p.lastName,
		p.firstName,
		p.lastPosition,
		positionLabel(p.lastPosition),
		p.mmcNumber,
		p.status
	].filter(Boolean).join(" ").toLowerCase();
	return q.toLowerCase().split(/\s+/).filter(Boolean).every((tok) => hay.includes(tok));
}
function CrewPicker({ people, value, onChange, excludeIds = [], placeholder = "Search mariners…", emptyLabel = "Pick mariner…", compact = false, disabled = false }) {
	const [open, setOpen] = (0, import_react.useState)(false);
	const [q, setQ] = (0, import_react.useState)("");
	const [hi, setHi] = (0, import_react.useState)(0);
	const options = (0, import_react.useMemo)(() => {
		const skip = new Set(excludeIds);
		return people.filter((p) => !skip.has(p.id) && matchesQuery(p, q)).sort((a, b) => {
			const sa = STATUS_ORDER[a.status ?? ""] ?? 9;
			const sb = STATUS_ORDER[b.status ?? ""] ?? 9;
			if (sa !== sb) return sa - sb;
			return (a.lastName ?? a.fullName).localeCompare(b.lastName ?? b.fullName);
		});
	}, [
		people,
		excludeIds,
		q
	]);
	const selected = people.find((p) => p.id === value) ?? null;
	function choose(id) {
		onChange(id);
		setOpen(false);
		setQ("");
		setHi(0);
	}
	function onKey(e) {
		if (e.key === "ArrowDown") {
			e.preventDefault();
			setHi((i) => Math.min(i + 1, Math.max(options.length - 1, 0)));
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			setHi((i) => Math.max(i - 1, 0));
		} else if (e.key === "Enter") {
			e.preventDefault();
			const hit = options[hi];
			if (hit) choose(hit.id);
		} else if (e.key === "Escape") setOpen(false);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Root2, {
		open,
		onOpenChange: (next) => {
			setOpen(next);
			if (!next) {
				setQ("");
				setHi(0);
			}
		},
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Trigger, {
			disabled,
			className: cn("inline-flex w-full items-center justify-between gap-2 rounded-md border border-border bg-paper px-3 font-normal text-ink hover:bg-paper-2", compact ? "h-8 max-w-64 px-2 text-xs" : "h-10 text-sm", disabled && "pointer-events-none opacity-50"),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: cn("truncate", selected ? "text-ink" : "text-faint"),
				children: selected ? selected.fullName : emptyLabel
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "size-4 shrink-0 text-muted" })]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Portal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Content2, {
			side: "bottom",
			align: "start",
			sideOffset: 4,
			onOpenAutoFocus: (e) => e.preventDefault(),
			className: "z-50 w-80 rounded-lg border border-border bg-paper p-2 shadow-border",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-faint" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					autoFocus: true,
					value: q,
					onChange: (e) => {
						setQ(e.target.value);
						setHi(0);
					},
					onKeyDown: onKey,
					placeholder,
					className: "h-10 pl-8",
					autoComplete: "off"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-2 max-h-64 overflow-y-auto",
				role: "listbox",
				children: options.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					className: "px-2 py-3 text-sm text-muted",
					children: people.length === 0 ? "Loading roster…" : "No mariner matches that name."
				}) : options.map((p, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					role: "option",
					"aria-selected": p.id === value,
					className: cn("flex min-h-11 w-full flex-col items-start rounded-md px-2 py-1.5 text-left text-sm", i === hi ? "bg-paper-2" : "hover:bg-paper-2", p.id === value ? "text-ink" : "text-ink"),
					onMouseEnter: () => setHi(i),
					onClick: () => choose(p.id),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-medium",
						children: p.fullName
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-xs text-muted",
						children: [positionLabel(p.lastPosition) || null, statusLabel(p.status)].filter(Boolean).join(" · ")
					})]
				}) }, p.id))
			})]
		}) })]
	});
}
//#endregion
export { CrewPicker as t };
