import { a as daysUntil, i as daysAboard, t as addDays, v as parseDate } from "./ratings-WR-IukGV.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/shipping-CitWW3XC.js
function extraDaysToTrips(days) {
	if (!Number.isFinite(days) || days === 0) return 0;
	return Math.round(days / 14);
}
function snapExtraDays(days) {
	const trips = extraDaysToTrips(Math.trunc(days || 0));
	return Math.max(-8, Math.min(12, trips)) * 14;
}
function tripsToExtraDays(trips) {
	return snapExtraDays((Number.isFinite(trips) ? trips : 0) * 14);
}
function extraTripsLabel(days) {
	const trips = extraDaysToTrips(snapExtraDays(days));
	if (!trips) return "On the rule date";
	const n = Math.abs(trips);
	const unit = n === 1 ? "trip" : "trips";
	if (trips > 0) return `+${n} ${unit}`;
	return `−${n} ${unit} early`;
}
function extraTripsRule(days) {
	const extra = snapExtraDays(days);
	const trips = extraDaysToTrips(extra);
	if (!trips) return null;
	const n = Math.abs(trips);
	const unit = n === 1 ? "trip" : "trips";
	if (trips > 0) return `+${n} ${unit} (${extra}d)`;
	return `−${n} ${unit} early (${Math.abs(extra)}d)`;
}
function defaultTourDays(opts) {
	const kind = (opts.assignmentType ?? "").toUpperCase();
	const union = (opts.unionHall ?? "").toUpperCase();
	if (kind === "RELIEF") {
		if (opts.lengthDays && opts.lengthDays > 0) return {
			days: opts.lengthDays,
			rule: `Relief · ${opts.lengthDays} days (set length)`,
			assumed: false
		};
		if (union === "SIU") return {
			days: 60,
			rule: "SIU trip relief · 45–60 days covering the permanent (planning 60)",
			assumed: true,
			window: {
				min: 45,
				max: 60
			}
		};
		return {
			days: null,
			rule: "Relief · needs a set sign-off date",
			assumed: false
		};
	}
	if (kind === "CADET" || kind === "APPRENTICE") return {
		days: null,
		rule: "Cadet / apprentice · school sets the off date",
		assumed: false
	};
	if (union === "MMP") {
		if (kind === "PERMANENT") return {
			days: 56,
			rule: "MM&P permanent · 56-day rotation (4 trips)",
			assumed: false,
			window: {
				min: 56,
				max: 120
			}
		};
		return {
			days: 120,
			rule: "MM&P rotary · 120-day assignment",
			assumed: false
		};
	}
	if (union === "MEBA") {
		if (kind === "ROTARY") return {
			days: 90,
			rule: "MEBA rotary · 90 days",
			assumed: false
		};
		return {
			days: 56,
			rule: "MEBA permanent · 56-day rotation (4 trips)",
			assumed: false,
			window: {
				min: 56,
				max: 120
			}
		};
	}
	if (union === "SIU") {
		if (kind === "PERMANENT") return {
			days: 120,
			rule: "SIU permanent · 75–120 day tour (planning 120)",
			assumed: false,
			window: {
				min: 75,
				max: 120
			}
		};
		if (opts.siuClass === "A") return {
			days: 120,
			rule: "SIU rotary Class A · freightship 75–120 day tour (planning 120)",
			assumed: false,
			window: {
				min: 75,
				max: 120
			}
		};
		if (opts.siuClass === "B") return {
			days: 180,
			rule: "SIU rotary Class B · 180 days or 1 round trip",
			assumed: false
		};
		if (opts.siuClass === "C") return {
			days: 60,
			rule: "SIU rotary Class C · 60 days or 1 round trip",
			assumed: false
		};
		return {
			days: 120,
			rule: "SIU rotary · class not on file, planning Class A freightship 75–120",
			assumed: true,
			window: {
				min: 75,
				max: 120
			}
		};
	}
	if (opts.lengthDays && opts.lengthDays > 0) return {
		days: opts.lengthDays,
		rule: `Dispatch length · ${opts.lengthDays} days`,
		assumed: false
	};
	return {
		days: null,
		rule: "No union rule matched",
		assumed: true
	};
}
function computeDueOff(opts) {
	const extraDays = snapExtraDays(opts.extraDays ?? 0);
	const leaveDays = Math.max(0, Math.trunc(opts.leaveDays ?? 0));
	const explicit = opts.explicitEnd?.trim() || null;
	let base;
	if (explicit && parseDate(explicit)) {
		const days = opts.signOn ? daysUntil(explicit, parseDate(opts.signOn) ?? void 0) : null;
		base = {
			date: explicit,
			rule: days != null ? `Discharge · ${days} day assignment` : "Discharge date on articles",
			days,
			assumed: false,
			source: "set-date"
		};
	} else {
		const planned = defaultTourDays({
			unionHall: opts.unionHall ?? null,
			assignmentType: opts.assignmentType,
			siuClass: opts.siuClass ?? null,
			lengthDays: opts.lengthDays ?? null
		});
		if (!opts.signOn || !parseDate(opts.signOn) || planned.days == null) base = {
			date: null,
			rule: planned.rule,
			days: planned.days,
			assumed: planned.assumed,
			source: planned.days == null ? "unknown" : "rule",
			window: planned.window
		};
		else base = {
			date: addDays(opts.signOn, planned.days),
			rule: planned.rule,
			days: planned.days,
			assumed: planned.assumed,
			source: "rule",
			window: planned.window
		};
	}
	return applyLeaveDays(applyExtraDays(base, extraDays), leaveDays);
}
/** Recover the original discharge / set-date (before extra days and rotary leave) from a stored tour. */
function setDateFromTour(t) {
	if (!isDischargeRule(t.dueOffRule) || !t.dueOff) return null;
	const extra = snapExtraDays(t.extraDays ?? 0);
	const leave = Math.max(0, Math.trunc(t.leaveDays ?? 0));
	if (!extra && !leave) return t.dueOff;
	return addDays(t.dueOff, -(extra + leave));
}
function isDischargeRule(rule) {
	if (!rule) return false;
	return /^(Discharge|Set date)\b/i.test(rule);
}
function applyExtraDays(base, extraDays) {
	const extra = snapExtraDays(extraDays);
	if (!extra) return {
		...base,
		extraDays: 0,
		baseDate: base.date
	};
	const extraLabel = extraTripsRule(extra) ?? extraTripsLabel(extra);
	return {
		...base,
		date: base.date ? addDays(base.date, extra) : null,
		rule: `${base.rule} · ${extraLabel}`,
		extraDays: extra,
		baseDate: base.date
	};
}
function applyLeaveDays(base, leaveDays) {
	const leave = Math.max(0, Math.trunc(leaveDays || 0));
	if (!leave) return {
		...base,
		leaveDays: 0
	};
	return {
		...base,
		date: base.date ? addDays(base.date, leave) : null,
		rule: `${base.rule} · +${leave}d rotary leave`,
		leaveDays: leave
	};
}
function isOfficerRotary(unionHall, assignmentType) {
	const kind = (assignmentType ?? "").toUpperCase();
	const union = (unionHall ?? "").toUpperCase();
	if (kind !== "ROTARY") return false;
	return union === "MMP" || union === "MEBA";
}
function onExpiryBoard(p) {
	const status = (p.status ?? "").toLowerCase();
	if (status === "current") return true;
	if (status === "applicant" || status === "past") return false;
	const perm = Boolean(p.permanentRating) || (p.assignmentType ?? "").toUpperCase() === "PERMANENT";
	if (status === "vacation") {
		if (perm) return true;
		return (p.assignmentType ?? "").toUpperCase() === "ROTARY";
	}
	return perm;
}
function coveredEmploymentDays(opts) {
	const asOf = opts.asOf ?? /* @__PURE__ */ new Date();
	const span = daysAboard(opts.signOn, asOf);
	if (span == null) return null;
	const stored = Math.max(0, Math.trunc(opts.leaveDays ?? 0));
	const open = opts.leaveStartedOn ? Math.max(0, daysAboard(opts.leaveStartedOn, asOf) ?? 0) : 0;
	return Math.max(0, span - stored - open);
}
function remainingCoveredDays(opts) {
	const planned = defaultTourDays({
		unionHall: opts.unionHall ?? null,
		assignmentType: opts.assignmentType,
		siuClass: opts.siuClass ?? null,
		lengthDays: opts.lengthDays ?? null
	});
	const covered = coveredEmploymentDays({
		signOn: opts.signOn,
		leaveDays: opts.leaveDays,
		leaveStartedOn: opts.leaveStartedOn,
		asOf: opts.asOf
	});
	const extra = snapExtraDays(opts.extraDays ?? 0);
	if (planned.days == null || covered == null) return {
		remaining: null,
		covered,
		tourDays: planned.days,
		rule: planned.rule
	};
	return {
		remaining: planned.days + extra - covered,
		covered,
		tourDays: planned.days,
		rule: planned.rule
	};
}
function rotaryLeaveCheck(opts) {
	const kind = (opts.assignmentType ?? "").toUpperCase();
	if (kind === "RELIEF") return {
		ok: false,
		error: "Relief assignments cannot take leave. The officer they are covering already used the one leave."
	};
	if (kind === "CADET" || kind === "APPRENTICE") return {
		ok: false,
		error: "Cadets and apprentices do not take rotary leave."
	};
	if (!isOfficerRotary(opts.unionHall, opts.assignmentType)) return { ok: true };
	if (opts.leaveStartedOn) return {
		ok: false,
		error: "Already on the one rotary leave for this assignment."
	};
	if ((opts.leaveCount ?? 0) >= 1) return {
		ok: false,
		error: "MM&P/MEBA rotary gets one leave per assignment. They already used it."
	};
	const on = daysAboard(opts.signOn, opts.asOf);
	if (on == null) return {
		ok: false,
		error: "No sign-on date on this assignment."
	};
	if (on < 14) return {
		ok: false,
		error: "Need one round trip (14 days) aboard before rotary leave."
	};
	if (on > 98) return {
		ok: false,
		error: "Rotary leave must start by the 90th day of shipboard employment, or at the end of that voyage."
	};
	return { ok: true };
}
function rotaryLeaveDurationNote(days) {
	if (!Number.isFinite(days) || days <= 0) return null;
	if (days < 14) return `Leave was ${days} day${days === 1 ? "" : "s"} (under one round trip of 14).`;
	if (days > 60) return `Leave was ${days} days (over 60). Needs agreement.`;
	return null;
}
function unionForPosition(position) {
	const p = (position ?? "").toUpperCase();
	if (/(MASTER|CAPT|\bC\/M\b|\bCM\b|CHIEF MATE|\b2\/M\b|\b2M\b|SECOND MATE|\b3\/M\b|\b3M\b|THIRD MATE|MATE)/.test(p)) return "MMP";
	if (/(C\/E|\bCE\b|CHIEF ENG|\b1A\/E\b|\b1AE\b|1ST A|\b2A\/E\b|\b2AE\b|2ND A|2 A\/E|\b3A\/E\b|\b3AE\b|3RD A|3 A\/E|ASSIST ENG|ASSISTANT ENG)/.test(p)) return "MEBA";
	if (/(CADET|APPRENTICE)/.test(p)) return "NONE";
	if (/(BOSUN|BOATSWAIN|\bAB\b|ABLE|QMED|QEE|ELECTRIC|DEU|STEWARD|COOK|MESS|WIPER|OILER|ORDINARY|\bOS\b)/.test(p)) return "SIU";
	return "NONE";
}
function defaultAssignmentForPosition(position) {
	const p = (position ?? "").toUpperCase();
	if (/(CADET)/.test(p)) return "CADET";
	if (/(APPRENTICE)/.test(p)) return "APPRENTICE";
	if (/(MASTER|CAPT|CHIEF MATE|\bC\/M\b|\bCM\b|CHIEF ENG|\bC\/E\b|\bCE\b|1ST A|\b1A\/E\b|\b1AE\b|BOSUN|BOATSWAIN|STEWARD(?! ASS)|CHIEF COOK|^COOK$|ELECTRIC)/.test(p)) return "PERMANENT";
	return "ROTARY";
}
function parseWatch(raw) {
	if (!raw) return null;
	const s = raw.toUpperCase().replace(/×/g, "X").replace(/\s+/g, " ");
	if (/\bDAY\b/.test(s) && !/\d\s*X\s*\d/.test(s)) return "day";
	if (/\b12\s*X\s*4\b/.test(s) || /\b12-4\b/.test(s) || /\b12\/4\b/.test(s)) return "12-4";
	if (/\b4\s*X\s*8\b/.test(s) || /\b4-8\b/.test(s) || /\b4\/8\b/.test(s)) return "4-8";
	if (/\b8\s*X\s*12\b/.test(s) || /\b8-12\b/.test(s) || /\b8\/12\b/.test(s)) return "8-12";
	if (/\bDAY\b/.test(s)) return "day";
	return null;
}
function watchLabel(watch) {
	if (!watch) return "—";
	if (watch === "day") return "Day";
	if (watch === "12-4") return "12–4";
	if (watch === "4-8") return "4–8";
	if (watch === "8-12") return "8–12";
	return watch;
}
function normalizeUnion(raw) {
	if (!raw) return null;
	const s = raw.toUpperCase().replace(/[^A-Z]/g, "");
	if (s === "MMP" || s.includes("MASTER")) return "MMP";
	if (s === "MEBA") return "MEBA";
	if (s === "SIU") return "SIU";
	if (s === "NONE") return "NONE";
	return null;
}
function normalizeAssignment(raw) {
	if (!raw) return null;
	const s = raw.toUpperCase();
	if (/RELIEF/.test(s)) return "RELIEF";
	if (/PERM/.test(s)) return "PERMANENT";
	if (/ROT/.test(s)) return "ROTARY";
	if (/CADET/.test(s)) return "CADET";
	if (/APPRENT/.test(s)) return "APPRENTICE";
	return null;
}
//#endregion
export { watchLabel as _, isOfficerRotary as a, onExpiryBoard as c, rotaryLeaveCheck as d, rotaryLeaveDurationNote as f, unionForPosition as g, tripsToExtraDays as h, extraTripsLabel as i, parseWatch as l, snapExtraDays as m, defaultAssignmentForPosition as n, normalizeAssignment as o, setDateFromTour as p, extraDaysToTrips as r, normalizeUnion as s, computeDueOff as t, remainingCoveredDays as u };
