import { c as expiryTone, s as expiryLabel } from "./ratings-WR-IukGV.mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { t as Badge } from "./badge-DfXuB0XH.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/expiry-chip-Booas4nG.js
var import_jsx_runtime = require_jsx_runtime();
function ExpiryChip({ date }) {
	const tone = expiryTone(date);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
		tone: tone === "expired" ? "expired" : tone === "soon" ? "soon" : tone === "watch" ? "watch" : tone === "ok" ? "ok" : "neutral",
		children: expiryLabel(date)
	});
}
//#endregion
export { ExpiryChip as t };
