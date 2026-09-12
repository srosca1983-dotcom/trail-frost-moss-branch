//#region node_modules/.nitro/vite/services/ssr/assets/ratings-WR-IukGV.js
var MONTHS = {
	jan: 1,
	feb: 2,
	mar: 3,
	apr: 4,
	may: 5,
	jun: 6,
	jul: 7,
	aug: 8,
	sep: 9,
	oct: 10,
	nov: 11,
	dec: 12
};
/** 30 → 2030, 85 → 1985. Four-digit years pass through. */
function expandYear(year) {
	if (year < 100) return year >= 70 ? 1900 + year : 2e3 + year;
	return year;
}
function utcYmd(year, month, day) {
	if (month < 1 || month > 12 || day < 1 || day > 31) return null;
	const d = new Date(Date.UTC(year, month - 1, day));
	if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) return null;
	return d;
}
function parseDate(value) {
	if (!value) return null;
	const v = value.trim();
	if (!v) return null;
	const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
	if (iso) return utcYmd(Number(iso[1]), Number(iso[2]), Number(iso[3]));
	const numeric = /^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/.exec(v);
	if (numeric) {
		let month = Number(numeric[1]);
		let day = Number(numeric[2]);
		const year = expandYear(Number(numeric[3]));
		if (month > 12 && day <= 12) {
			const swapped = utcYmd(year, day, month);
			if (swapped) return swapped;
		}
		return utcYmd(year, month, day);
	}
	const dmy = /^(\d{1,2})[-\s]([A-Za-z]{3,9})[-\s.,]*(\d{2,4})$/.exec(v);
	if (dmy) {
		const month = MONTHS[dmy[2].slice(0, 3).toLowerCase()];
		if (month) return utcYmd(expandYear(Number(dmy[3])), month, Number(dmy[1]));
	}
	const mdy = /^([A-Za-z]{3,9})[-\s]+(\d{1,2}),?[-\s]+(\d{2,4})$/.exec(v);
	if (mdy) {
		const month = MONTHS[mdy[1].slice(0, 3).toLowerCase()];
		if (month) return utcYmd(expandYear(Number(mdy[3])), month, Number(mdy[2]));
	}
	const fallback = new Date(v);
	if (Number.isNaN(fallback.getTime())) return null;
	return new Date(Date.UTC(fallback.getUTCFullYear(), fallback.getUTCMonth(), fallback.getUTCDate()));
}
function toIsoDate(value) {
	const d = parseDate(value);
	if (!d) return null;
	return d.toISOString().slice(0, 10);
}
/**
* Ticket expiry only — never use on DOB.
* A 2-digit year of 30 must not land as 1930 and mark a live MMC expired.
*/
function credentialExpiryIso(value) {
	const iso = toIsoDate(value);
	if (!iso) return null;
	const y = Number(iso.slice(0, 4));
	if (y >= 1900 && y < 2e3) return `${y + 100}${iso.slice(4)}`;
	return iso;
}
/** Keep the later ISO expiry so an issue date cannot replace 2030. */
function laterExpiry(a, b) {
	const A = credentialExpiryIso(a) ?? toIsoDate(a);
	const B = credentialExpiryIso(b) ?? toIsoDate(b);
	if (!A) return B;
	if (!B) return A;
	return A >= B ? A : B;
}
function todayUtc() {
	const n = /* @__PURE__ */ new Date();
	return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()));
}
function daysUntil(value, from = todayUtc()) {
	const d = parseDate(value);
	if (!d) return null;
	const a = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());
	const b = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
	return Math.round((b - a) / 864e5);
}
function expiryTone(value) {
	const days = daysUntil(value);
	if (days === null) return "missing";
	if (days < 0) return "expired";
	if (days <= 30) return "soon";
	if (days <= 90) return "watch";
	return "ok";
}
function formatDate(value) {
	const d = parseDate(value);
	if (!d) return "—";
	return d.toLocaleDateString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
		timeZone: "UTC"
	});
}
function formatShort(value) {
	const d = parseDate(value);
	if (!d) return "—";
	return d.toLocaleDateString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
		timeZone: "UTC"
	});
}
function expiryLabel(value) {
	const days = daysUntil(value);
	if (days === null) return "No date";
	if (days < 0) return `Expired ${Math.abs(days)}d`;
	if (days === 0) return "Expires today";
	if (days === 1) return "Expires tomorrow";
	if (days <= 90) return `${days}d left`;
	return formatShort(value);
}
function addDays(value, days) {
	const d = parseDate(value);
	if (!d) return null;
	const next = new Date(d.getTime());
	next.setUTCDate(next.getUTCDate() + days);
	return next.toISOString().slice(0, 10);
}
function addYears(value, years) {
	const d = parseDate(value);
	if (!d) return null;
	const next = new Date(d.getTime());
	next.setUTCFullYear(next.getUTCFullYear() + years);
	return next.toISOString().slice(0, 10);
}
function daysAboard(signOn, from = todayUtc()) {
	const d = parseDate(signOn);
	if (!d) return null;
	const a = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
	const b = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());
	return Math.round((b - a) / 864e5);
}
function formatMdY(value, twoDigitYear = false) {
	const d = parseDate(value);
	if (!d) return "";
	const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
	const dd = String(d.getUTCDate()).padStart(2, "0");
	const y = d.getUTCFullYear();
	return twoDigitYear ? `${mm}/${dd}/${String(y).slice(-2)}` : `${mm}/${dd}/${y}`;
}
/** Watch-trade stamp: "11 Sep 26". */
function formatStamp(value) {
	const d = value ? parseDate(value) : todayUtc();
	if (!d) return "";
	return `${d.getUTCDate()} ${[
		"Jan",
		"Feb",
		"Mar",
		"Apr",
		"May",
		"Jun",
		"Jul",
		"Aug",
		"Sep",
		"Oct",
		"Nov",
		"Dec"
	][d.getUTCMonth()]} ${String(d.getUTCFullYear()).slice(2)}`;
}
var POSITION_LABELS = {
	MASTER: "Master",
	CAPT: "Master",
	"C/M": "Chief Mate",
	CM: "Chief Mate",
	"CHIEF MATE": "Chief Mate",
	"2/M": "Second Mate",
	"2M": "Second Mate",
	"SECOND MATE": "Second Mate",
	"3/M": "Third Mate",
	"3M": "Third Mate",
	"THIRD MATE": "Third Mate",
	"C/E": "Chief Engineer",
	CE: "Chief Engineer",
	"CHIEF ENGINEER": "Chief Engineer",
	"1A/E": "First Assistant Engineer",
	"1AE": "First Assistant Engineer",
	"1ST A/E": "First Assistant Engineer",
	"2A/E": "Second Assistant Engineer",
	"2AE": "Second Assistant Engineer",
	"2ND AE": "Second Assistant Engineer",
	"2 A/E": "Second Assistant Engineer",
	"2 A/E DAY": "2 A/E Day",
	"3A/E": "Third Assistant Engineer",
	"3AE": "Third Assistant Engineer",
	"3 A/E": "Third Assistant Engineer",
	QEE: "Electrician",
	QMED: "QMED",
	ELECTRICIAN: "Electrician",
	DEU: "DEU",
	ABH: "Able Seaman (Harbor)",
	AB: "Able Seaman",
	"AB DAY": "AB Day",
	"AB/W": "AB Watch",
	OS: "Ordinary Seaman",
	"CADET ENG": "Engine Cadet",
	"ENGINE CADET": "Engine Cadet",
	"CADET DECK": "Deck Cadet",
	"DECK CADET": "Deck Cadet",
	CADET: "Cadet",
	COOK: "Cook",
	STEWARD: "Steward",
	"STEWARD ASSIST": "Steward Assist",
	BOSUN: "Boatswain",
	BOATSWAIN: "Boatswain",
	"APPRENTICE A": "Apprentice A",
	"APPRENTICE B": "Apprentice B"
};
var DECK_OFFICER = /* @__PURE__ */ new Set([
	"MASTER",
	"CAPT",
	"C/M",
	"CM",
	"CHIEF MATE",
	"2/M",
	"2M",
	"SECOND MATE",
	"3/M",
	"3M",
	"THIRD MATE"
]);
var ENGINE_OFFICER = /* @__PURE__ */ new Set([
	"C/E",
	"CE",
	"CHIEF ENGINEER",
	"1A/E",
	"1AE",
	"1ST A/E",
	"2A/E",
	"2AE",
	"2ND AE",
	"2 A/E",
	"2 A/E DAY",
	"3A/E",
	"3AE",
	"3 A/E"
]);
function normalizePosition(raw) {
	if (!raw) return "";
	return raw.trim().toUpperCase().replace(/\s+/g, " ");
}
function positionLabel(raw) {
	const key = normalizePosition(raw);
	if (!key) return "Unrated";
	return POSITION_LABELS[key] ?? raw.trim();
}
function appliesBucket(position) {
	const key = normalizePosition(position);
	if (DECK_OFFICER.has(key)) return "deck_officer";
	if (ENGINE_OFFICER.has(key)) return "engine_officer";
	return "rating";
}
function requirementApplies(appliesTo, position) {
	if (appliesTo === "all") return true;
	return appliesTo === appliesBucket(position);
}
var DECK_RATING = /* @__PURE__ */ new Set([
	"AB",
	"ABH",
	"AB DAY",
	"AB/W",
	"OS",
	"BOSUN",
	"BOATSWAIN",
	"CADET DECK",
	"DECK CADET",
	"CADET",
	"APPRENTICE A",
	"APPRENTICE B"
]);
var ENGINE_RATING = /* @__PURE__ */ new Set([
	"QMED",
	"QEE",
	"ELECTRICIAN",
	"OILER",
	"WIPER",
	"CADET ENG",
	"ENGINE CADET",
	"DEU"
]);
var STEWARD_RATING = /* @__PURE__ */ new Set([
	"COOK",
	"STEWARD",
	"CHIEF COOK",
	"MESSMAN",
	"STEWARD ASSIST"
]);
function inferDepartment(position) {
	const key = normalizePosition(position);
	if (!key) return null;
	if (DECK_OFFICER.has(key) || DECK_RATING.has(key)) return "deck";
	if (ENGINE_OFFICER.has(key) || ENGINE_RATING.has(key)) return "engine";
	if (STEWARD_RATING.has(key)) return "steward";
	if (/(MASTER|CAPT|MATE|BOSUN|ABLE|ORDINARY|\bAB\b|\bOS\b|DECK)/.test(key)) return "deck";
	if (/(ENG|QMED|QEE|OILER|WIPER|\bAE\b|ELECTRIC)/.test(key)) return "engine";
	if (/(COOK|STEWARD|MESS)/.test(key)) return "steward";
	return null;
}
function departmentLabel(d) {
	if (d === "deck") return "Deck";
	if (d === "engine") return "Engine";
	return "Steward";
}
function isLicensedOfficer(position) {
	const key = normalizePosition(position);
	if (!key) return false;
	if (DECK_OFFICER.has(key) || ENGINE_OFFICER.has(key)) return true;
	if (/\b(MASTER|CAPT|MATE|CHIEF ENG|\bC\/E\b|\bCE\b|A\/E|A\/ENG|ASSISTANT ENGINEER)\b/.test(key)) return true;
	return false;
}
function isElectrician(position) {
	const key = normalizePosition(position);
	return /ELECTRIC/.test(key) || key === "QEE";
}
function isDeckOfficer(position) {
	const key = normalizePosition(position);
	if (!key) return false;
	if (DECK_OFFICER.has(key)) return true;
	return /\b(MASTER|CAPT|MATE)\b/.test(key);
}
//#endregion
export { todayUtc as S, laterExpiry as _, daysUntil as a, requirementApplies as b, expiryTone as c, formatShort as d, formatStamp as f, isLicensedOfficer as g, isElectrician as h, daysAboard as i, formatDate as l, isDeckOfficer as m, addYears as n, departmentLabel as o, inferDepartment as p, credentialExpiryIso as r, expiryLabel as s, addDays as t, formatMdY as u, parseDate as v, toIsoDate as x, positionLabel as y };
