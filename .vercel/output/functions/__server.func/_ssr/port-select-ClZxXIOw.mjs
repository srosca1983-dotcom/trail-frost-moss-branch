import { l as cn } from "./types-DLRYosVU.mjs";
import { n as RUN_PORTS } from "./ports-C0XwVrj0.mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/port-select-ClZxXIOw.js
var import_jsx_runtime = require_jsx_runtime();
function PortSelect({ value, onChange, id, allowEmpty = false, emptyLabel = "Pick a port", className }) {
	const listed = RUN_PORTS.some((p) => p.name === value);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
		id,
		className: cn("mt-1 flex h-10 w-full rounded-md border border-border bg-paper px-2 text-sm", className),
		value,
		onChange: (e) => onChange(e.target.value),
		children: [
			allowEmpty ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
				value: "",
				children: emptyLabel
			}) : null,
			!listed && value ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
				value,
				children: [value, " — not on this run"]
			}) : null,
			RUN_PORTS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
				value: p.name,
				children: [p.label, p.kind === "occasional" ? " — if we call" : p.kind === "shipyard" ? " — every ~5 years" : ""]
			}, p.id))
		]
	});
}
//#endregion
export { PortSelect as t };
