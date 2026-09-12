import { n as clsx } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/types-DLRYosVU.js
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
function newId(prefix = "id") {
	return `${prefix}_${crypto.randomUUID().slice(0, 8)}${Date.now().toString(36)}`;
}
var VESSEL = "M/V GEORGE II";
var COMPANY = "Sunrise Operations, LLC";
var COMPANY_ADDRESS = "P.O. Box 690998, Charlotte, NC 28227";
var SMS_URL = "https://g2sms.grok.me";
var SMS_CREWING_URL = "https://g2sms.grok.me/manuals/crewing";
/** Particulars for crew lists and IMO FAL Form 5. */
var VESSEL_PARTICULARS = {
	name: "GEORGE II",
	displayName: "M/V GEORGE II",
	imo: "7729461",
	callSign: "WFLH",
	mmsi: "366791000",
	flag: "United States of America",
	flagCode: "USA",
	portOfRegistry: "Honolulu",
	officialNumber: "7729461"
};
/** Single-owner id while sign-in is off. Re-scope when auth comes back. */
var LEDGER_OWNER = "dev-user";
var PACKET_TEMPLATE_URL = "/templates/sro-sign-on-packet.pdf";
//#endregion
export { SMS_CREWING_URL as a, VESSEL_PARTICULARS as c, PACKET_TEMPLATE_URL as i, cn as l, COMPANY_ADDRESS as n, SMS_URL as o, LEDGER_OWNER as r, VESSEL as s, COMPANY as t, newId as u };
