import { a as daysUntil, c as expiryTone } from "./ratings-WR-IukGV.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ports-C0XwVrj0.js
/** GEORGE II run. Regular is Long Beach ↔ Honolulu. Oakland if it happens. Nantong is the yard. */
var RUN_PORTS = [
	{
		id: "LB",
		name: "Long Beach",
		label: "Long Beach, CA",
		country: "UNITED STATES",
		countryCode: "US",
		kind: "regular"
	},
	{
		id: "HNL",
		name: "Honolulu",
		label: "Honolulu, HI",
		country: "UNITED STATES",
		countryCode: "US",
		kind: "regular"
	},
	{
		id: "OAK",
		name: "Oakland",
		label: "Oakland, CA",
		country: "UNITED STATES",
		countryCode: "US",
		kind: "occasional"
	},
	{
		id: "NTG",
		name: "Nantong",
		label: "Nantong, China (shipyard)",
		country: "CHINA",
		countryCode: "CN",
		kind: "shipyard"
	}
];
var DEFAULT_VESSEL_RUN = {
	thisPort: "Long Beach",
	nextPort: "Honolulu",
	eta: null,
	voyageNumber: null
};
var ALIASES = {
	lb: "Long Beach",
	lgb: "Long Beach",
	"long beach": "Long Beach",
	"long beach ca": "Long Beach",
	"long beach, ca": "Long Beach",
	uslgb: "Long Beach",
	hnl: "Honolulu",
	hon: "Honolulu",
	honolulu: "Honolulu",
	"honolulu hi": "Honolulu",
	"honolulu, hi": "Honolulu",
	ushnl: "Honolulu",
	oak: "Oakland",
	oakland: "Oakland",
	"oakland ca": "Oakland",
	"oakland, ca": "Oakland",
	usoak: "Oakland",
	ntg: "Nantong",
	nantong: "Nantong",
	"nantong china": "Nantong",
	china: "Nantong",
	shipyard: "Nantong",
	yard: "Nantong",
	cntng: "Nantong"
};
function hasSex(raw) {
	const s = (raw ?? "").trim().toUpperCase();
	if (!s) return false;
	return s.startsWith("F") || s === "M" || s.startsWith("MALE") || s.startsWith("M") && !s.startsWith("MI");
}
function normalizePortName(raw) {
	const s = (raw ?? "").trim();
	if (!s) return null;
	const hit = ALIASES[s.toLowerCase().replace(/\./g, "").replace(/\s+/g, " ")];
	if (hit) return hit;
	return RUN_PORTS.find((p) => p.name.toLowerCase() === s.toLowerCase() || p.label.toLowerCase() === s.toLowerCase())?.name ?? s;
}
function portByName(raw) {
	const name = normalizePortName(raw);
	if (!name) return void 0;
	return RUN_PORTS.find((p) => p.name === name);
}
/** Other end of the regular run. Oakland still turns around to Honolulu. Yard comes home to Long Beach. */
function matePort(thisPort) {
	const name = normalizePortName(thisPort);
	if (name === "Honolulu") return "Long Beach";
	if (name === "Oakland") return "Honolulu";
	if (name === "Nantong") return "Long Beach";
	return "Honolulu";
}
function isShipyardPort(raw) {
	return portByName(raw)?.kind === "shipyard";
}
/** Nantong yard — heading there or already there. Regular run never hits this. */
function isYardCall(run) {
	if (!run) return false;
	return isShipyardPort(run.thisPort) || isShipyardPort(run.nextPort);
}
function embarkCountry(port) {
	const p = portByName(port);
	if (p) return p.country;
	if (!(port ?? "").trim()) return "";
	return "UNITED STATES";
}
function runLine(run) {
	const eta = run.eta ? ` · ETA ${run.eta}` : "";
	return `${run.voyageNumber ? `Voy ${run.voyageNumber} · ` : ""}${run.thisPort} → ${run.nextPort}${eta}`;
}
/** MMC, medical, TWIC, DOT drug-free that are already expired. Missing is not a hard stop. */
function deadJoinTickets(input) {
	const docs = input.documents ?? [];
	const gaps = [];
	if (input.mmcExpiration && expiryTone(input.mmcExpiration) === "expired") gaps.push({
		code: "mmc",
		label: "MMC",
		expiresOn: input.mmcExpiration
	});
	for (const code of [
		"medical",
		"twic",
		"drug_free"
	]) {
		const d = docs.find((x) => x.docType === code);
		if (d?.expiresOn && expiryTone(d.expiresOn) === "expired") {
			const label = code === "drug_free" ? "DOT drug-free" : code === "twic" ? "TWIC" : "Medical";
			gaps.push({
				code,
				label,
				expiresOn: d.expiresOn
			});
		}
	}
	return gaps;
}
/** 33 CFR 160.206 fields the Master still needs on this person. */
function enoadGaps(input) {
	const miss = [];
	if (!((input.lastName ?? "").trim() || (input.fullName ?? "").trim().split(/\s+/).pop() || "")) miss.push("Last name");
	if (!input.dob) miss.push("Date of birth");
	if (!hasSex(input.sex)) miss.push("Sex");
	if (!((input.passportNumber ?? "").trim() || (input.mmcNumber ?? "").trim())) miss.push("Passport or MMC");
	else {
		const expiry = input.passportNumber ? input.passportExpiration : input.mmcExpiration;
		if (expiry && (daysUntil(expiry) ?? 0) < 0) miss.push("ID expired");
	}
	if (!normalizePortName(input.embarkPort)) miss.push("Where embarked");
	return miss;
}
var CHINA_PASSPORT_DAYS = 180;
function chinaPassportGaps(input) {
	if (!input.passportNumber) return {
		crewId: input.crewId,
		fullName: input.fullName,
		reason: "No passport",
		expiresOn: null
	};
	const days = daysUntil(input.passportExpiration);
	if (days === null) return {
		crewId: input.crewId,
		fullName: input.fullName,
		reason: "Passport date missing",
		expiresOn: input.passportExpiration ?? null
	};
	if (days < 0) return {
		crewId: input.crewId,
		fullName: input.fullName,
		reason: "Passport expired",
		expiresOn: input.passportExpiration ?? null
	};
	if (days < CHINA_PASSPORT_DAYS) return {
		crewId: input.crewId,
		fullName: input.fullName,
		reason: `Passport ${days}d left — China wants 6 months`,
		expiresOn: input.passportExpiration ?? null
	};
	return null;
}
function walkOff(opts) {
	const here = normalizePortName(opts.thisPort) ?? opts.thisPort;
	const home = normalizePortName(opts.embarkPort) ?? here;
	if (opts.daysLeft === null) return {
		thisCall: false,
		when: "unknown",
		port: home
	};
	if (home === here && opts.daysLeft < 12) return {
		thisCall: true,
		when: "this",
		port: here
	};
	if (opts.daysLeft < 24) return {
		thisCall: false,
		when: "next",
		port: home
	};
	return {
		thisCall: false,
		when: "later",
		port: home
	};
}
//#endregion
export { embarkCountry as a, isYardCall as c, runLine as d, walkOff as f, deadJoinTickets as i, matePort as l, RUN_PORTS as n, enoadGaps as o, chinaPassportGaps as r, isShipyardPort as s, DEFAULT_VESSEL_RUN as t, normalizePortName as u };
