import { o as __toESM } from "../_runtime.mjs";
import { l as cn } from "./types-DLRYosVU.mjs";
import { d as formatShort, t as addDays } from "./ratings-WR-IukGV.mjs";
import { h as tripsToExtraDays, i as extraTripsLabel, r as extraDaysToTrips } from "./shipping-CitWW3XC.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { t as Button } from "./button-DnbeV2iT.mjs";
import { l as Plus, u as Minus } from "../_libs/lucide-react.mjs";
import { t as Input } from "./input-B2bEx-Se.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/extra-days-DIx_BHCm.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var PRESET_TRIPS = [
	0,
	1,
	2,
	3,
	4
];
function ExtraDaysControl({ extraDays, baseDate, dueOff, disabled, saving, onSave, compact = false }) {
	const trips = extraDaysToTrips(extraDays);
	const [value, setValue] = (0, import_react.useState)(String(trips));
	(0, import_react.useEffect)(() => {
		setValue(String(extraDaysToTrips(extraDays)));
	}, [extraDays]);
	const parsed = Number.parseInt(value, 10);
	const nextTrips = Number.isFinite(parsed) ? parsed : trips;
	const nextDays = tripsToExtraDays(nextTrips);
	const origin = baseDate ?? (extraDays && dueOff ? addDays(dueOff, -extraDays) : dueOff);
	const preview = origin ? addDays(origin, nextDays) : dueOff;
	const dirty = nextDays !== extraDays;
	function commitTrips(n) {
		const days = tripsToExtraDays(n);
		setValue(String(extraDaysToTrips(days)));
		if (days !== extraDays) onSave(days);
	}
	const locked = disabled || saving;
	const btn = compact ? "h-8 w-8" : "h-11 w-11";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("min-w-0", compact ? "" : "rounded-lg bg-paper-2 p-3"),
		children: [
			!compact ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-xs text-muted",
				children: [
					"One trip is ",
					14,
					" days. Extra time is whole trips only."
				]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-1 flex flex-wrap items-center gap-1.5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-label": "One less trip",
						disabled: locked || trips <= -8,
						onClick: () => commitTrips(trips - 1),
						className: cn("inline-flex shrink-0 items-center justify-center rounded-md bg-paper-2 text-ink hover:bg-paper-3 disabled:opacity-40", btn),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, { className: "size-4" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						type: "number",
						inputMode: "numeric",
						step: 1,
						"aria-label": "Extra trips",
						className: cn(compact ? "h-8 w-14" : "h-11 w-16", "text-center"),
						value,
						disabled: locked,
						onChange: (e) => setValue(e.target.value),
						onBlur: () => commitTrips(nextTrips),
						onKeyDown: (e) => {
							if (e.key === "Enter") commitTrips(nextTrips);
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-label": "One more trip",
						disabled: locked || trips >= 12,
						onClick: () => commitTrips(trips + 1),
						className: cn("inline-flex shrink-0 items-center justify-center rounded-md bg-paper-2 text-ink hover:bg-paper-3 disabled:opacity-40", btn),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" })
					}),
					PRESET_TRIPS.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						disabled: locked,
						onClick: () => commitTrips(n),
						className: cn("rounded-md px-2 text-xs", compact ? "h-8" : "h-11 px-3", extraDaysToTrips(extraDays) === n ? "bg-ink text-paper" : "bg-paper-2 text-muted hover:text-ink"),
						children: n === 0 ? "Rule" : `+${n}`
					}, n)),
					dirty ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						disabled: saving,
						onClick: () => commitTrips(nextTrips),
						children: "Save"
					}) : null
				]
			}),
			extraDays || dirty ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-1 text-[11px] text-muted",
				children: [
					extraTripsLabel(nextDays),
					nextDays ? ` · ${Math.abs(nextDays)}d` : "",
					preview ? ` · due ${formatShort(preview)}` : ""
				]
			}) : compact ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-[11px] text-muted",
				children: "Rule date · no extra trips"
			})
		]
	});
}
//#endregion
export { ExtraDaysControl as t };
