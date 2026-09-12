import { addDays, daysAboard, daysUntil, parseDate } from "./dates.ts";
import type { AssignmentKind, DueOffResult, SiuClass, UnionHall } from "./types";

/** One voyage is 14 days. Extra time on board is always a whole number of trips. */
export const TRIP_DAYS = 14;
export const MAX_EXTRA_TRIPS = 12;
export const MIN_EXTRA_TRIPS = -8;

/** MM&P rotary licensed deck officers: CBA 120-day assignment. */
export const MMP_ROTARY_DAYS = 120;
export const MMP_TOUR_DAYS = MMP_ROTARY_DAYS;

/** Permanent licensed officers (MM&P and MEBA) usually take a 56-day / 4-trip rotation. CBA still allows 120. */
export const OFFICER_PERMANENT_DAYS = 56;
export const MMP_PERMANENT_DAYS = 56;

/** MEBA licensed engineers: rotary is 90 days; permanent officers use the 56-day rotation. */
export const MEBA_PERMANENT_DAYS = 56;
export const MEBA_ROTARY_DAYS = 90;

/**
 * SIU Freightship Shipping Rules (2022 Standard Freightship Agreement):
 * - Designated permanent ratings (Rule 5.A.(13)(a)): tours of no less ~75 days
 *   and no more ~120 days, then 45–60 off. We plan the latest (120).
 * - Trip relief covering a designated permanent (Rule 5.A.(13)): 45–60 days.
 *   The dispatcher designates them “Temporary Relief” (5.A.(13)(h)). They do
 *   not hold the job. Rotary means you have the job and can take vacation.
 * - Class A on a dry-cargo freightship (Rule 5.A.(13)(t)): same 75–120 on /
 *   45–60 off (2:1). The general Class A retain of 240 days or 1 round trip
 *   (Rule 2.G) does not set the tour on George II.
 * - Class B: 180 days or 1 round trip.
 * - Class C: 60 days or 1 round trip.
 * - Class not on file: plan the Class A freightship latest (120) and flag it.
 */
export const SIU_PERMANENT_DAYS = 120;
export const SIU_PERMANENT_MIN_DAYS = 75;
export const SIU_CLASS_A_DAYS = 120;
export const SIU_CLASS_B_DAYS = 180;
export const SIU_CLASS_C_DAYS = 60;
export const SIU_UNKNOWN_CLASS_DAYS = 120;
/** SIU trip relief covering a designated permanent: 45–60 days off for the permanent (Rule 5.A.(13)(a)). Plan the latest. */
export const SIU_TRIP_RELIEF_DAYS = 60;
export const SIU_TRIP_RELIEF_MIN_DAYS = 45;


export function extraDaysToTrips(days: number): number {
  if (!Number.isFinite(days) || days === 0) return 0;
  return Math.round(days / TRIP_DAYS);
}

export function snapExtraDays(days: number): number {
  const trips = extraDaysToTrips(Math.trunc(days || 0));
  const clamped = Math.max(MIN_EXTRA_TRIPS, Math.min(MAX_EXTRA_TRIPS, trips));
  return clamped * TRIP_DAYS;
}

export function tripsToExtraDays(trips: number): number {
  return snapExtraDays((Number.isFinite(trips) ? trips : 0) * TRIP_DAYS);
}

export function extraTripsLabel(days: number): string {
  const extra = snapExtraDays(days);
  const trips = extraDaysToTrips(extra);
  if (!trips) return "On the rule date";
  const n = Math.abs(trips);
  const unit = n === 1 ? "trip" : "trips";
  if (trips > 0) return `+${n} ${unit}`;
  return `−${n} ${unit} early`;
}

export function extraTripsRule(days: number): string | null {
  const extra = snapExtraDays(days);
  const trips = extraDaysToTrips(extra);
  if (!trips) return null;
  const n = Math.abs(trips);
  const unit = n === 1 ? "trip" : "trips";
  if (trips > 0) return `+${n} ${unit} (${extra}d)`;
  return `−${n} ${unit} early (${Math.abs(extra)}d)`;
}

export function defaultTourDays(opts: {
  unionHall: UnionHall | null | undefined;
  assignmentType: AssignmentKind | string | null | undefined;
  siuClass?: SiuClass | null;
  lengthDays?: number | null;
}): { days: number | null; rule: string; assumed: boolean; window?: { min: number; max: number } } {
  const kind = (opts.assignmentType ?? "").toUpperCase();
  const union = (opts.unionHall ?? "").toUpperCase();

  if (kind === "RELIEF") {
    if (opts.lengthDays && opts.lengthDays > 0) {
      return { days: opts.lengthDays, rule: `Relief · ${opts.lengthDays} days (set length)`, assumed: false };
    }
    if (union === "SIU") {
      return {
        days: SIU_TRIP_RELIEF_DAYS,
        rule: "SIU trip relief · 45–60 days covering the permanent (planning 60)",
        assumed: true,
        window: { min: SIU_TRIP_RELIEF_MIN_DAYS, max: SIU_TRIP_RELIEF_DAYS },
      };
    }
    return { days: null, rule: "Relief · needs a set sign-off date", assumed: false };
  }
  if (kind === "CADET" || kind === "APPRENTICE") {
    return { days: null, rule: "Cadet / apprentice · school sets the off date", assumed: false };
  }

  if (union === "MMP") {
    if (kind === "PERMANENT") {
      return {
        days: MMP_PERMANENT_DAYS,
        rule: "MM&P permanent · 56-day rotation (4 trips)",
        assumed: false,
        window: { min: OFFICER_PERMANENT_DAYS, max: MMP_ROTARY_DAYS },
      };
    }
    return { days: MMP_ROTARY_DAYS, rule: "MM&P rotary · 120-day assignment", assumed: false };
  }
  if (union === "MEBA") {
    if (kind === "ROTARY") {
      return { days: MEBA_ROTARY_DAYS, rule: "MEBA rotary · 90 days", assumed: false };
    }
    return {
      days: MEBA_PERMANENT_DAYS,
      rule: "MEBA permanent · 56-day rotation (4 trips)",
      assumed: false,
      window: { min: OFFICER_PERMANENT_DAYS, max: MMP_ROTARY_DAYS },
    };
  }
  if (union === "SIU") {
    if (kind === "PERMANENT") {
      return {
        days: SIU_PERMANENT_DAYS,
        rule: "SIU permanent · 75–120 day tour (planning 120)",
        assumed: false,
        window: { min: SIU_PERMANENT_MIN_DAYS, max: SIU_PERMANENT_DAYS },
      };
    }
    if (opts.siuClass === "A") {
      return {
        days: SIU_CLASS_A_DAYS,
        rule: "SIU rotary Class A · freightship 75–120 day tour (planning 120)",
        assumed: false,
        window: { min: SIU_PERMANENT_MIN_DAYS, max: SIU_CLASS_A_DAYS },
      };
    }
    if (opts.siuClass === "B") {
      return { days: SIU_CLASS_B_DAYS, rule: "SIU rotary Class B · 180 days or 1 round trip", assumed: false };
    }
    if (opts.siuClass === "C") {
      return { days: SIU_CLASS_C_DAYS, rule: "SIU rotary Class C · 60 days or 1 round trip", assumed: false };
    }
    return {
      days: SIU_UNKNOWN_CLASS_DAYS,
      rule: "SIU rotary · class not on file, planning Class A freightship 75–120",
      assumed: true,
      window: { min: SIU_PERMANENT_MIN_DAYS, max: SIU_UNKNOWN_CLASS_DAYS },
    };
  }

  if (opts.lengthDays && opts.lengthDays > 0) {
    return { days: opts.lengthDays, rule: `Dispatch length · ${opts.lengthDays} days`, assumed: false };
  }
  return { days: null, rule: "No union rule matched", assumed: true };
}

export function computeDueOff(opts: {
  signOn: string | null | undefined;
  unionHall?: UnionHall | string | null;
  assignmentType?: AssignmentKind | string | null;
  siuClass?: SiuClass | null;
  lengthDays?: number | null;
  explicitEnd?: string | null;
  extraDays?: number | null;
  leaveDays?: number | null;
}): DueOffResult {
  const extraDays = snapExtraDays(opts.extraDays ?? 0);
  const leaveDays = Math.max(0, Math.trunc(opts.leaveDays ?? 0));
  const explicit = opts.explicitEnd?.trim() || null;
  let base: DueOffResult;
  if (explicit && parseDate(explicit)) {
    const days = opts.signOn ? daysUntil(explicit, parseDate(opts.signOn) ?? undefined) : null;
    base = {
      date: explicit,
      rule: days != null ? `Discharge · ${days} day assignment` : "Discharge date on articles",
      days: days,
      assumed: false,
      source: "set-date",
    };
  } else {
    const planned = defaultTourDays({
      unionHall: (opts.unionHall as UnionHall) ?? null,
      assignmentType: opts.assignmentType,
      siuClass: opts.siuClass ?? null,
      lengthDays: opts.lengthDays ?? null,
    });

    if (!opts.signOn || !parseDate(opts.signOn) || planned.days == null) {
      base = {
        date: null,
        rule: planned.rule,
        days: planned.days,
        assumed: planned.assumed,
        source: planned.days == null ? "unknown" : "rule",
        window: planned.window,
      };
    } else {
      base = {
        date: addDays(opts.signOn, planned.days),
        rule: planned.rule,
        days: planned.days,
        assumed: planned.assumed,
        source: "rule",
        window: planned.window,
      };
    }
  }

  return applyLeaveDays(applyExtraDays(base, extraDays), leaveDays);
}

/** Recover the original discharge / set-date (before extra days and rotary leave) from a stored tour. */
export function setDateFromTour(t: {
  dueOff?: string | null;
  dueOffRule?: string | null;
  extraDays?: number | null;
  leaveDays?: number | null;
}): string | null {
  if (!isDischargeRule(t.dueOffRule) || !t.dueOff) return null;
  const extra = snapExtraDays(t.extraDays ?? 0);
  const leave = Math.max(0, Math.trunc(t.leaveDays ?? 0));
  if (!extra && !leave) return t.dueOff;
  return addDays(t.dueOff, -(extra + leave));
}

export function isDischargeRule(rule: string | null | undefined): boolean {
  if (!rule) return false;
  return /^(Discharge|Set date)\b/i.test(rule);
}

export function applyExtraDays(base: DueOffResult, extraDays: number): DueOffResult {
  const extra = snapExtraDays(extraDays);
  if (!extra) {
    return { ...base, extraDays: 0, baseDate: base.date };
  }
  const extraLabel = extraTripsRule(extra) ?? extraTripsLabel(extra);
  return {
    ...base,
    date: base.date ? addDays(base.date, extra) : null,
    rule: `${base.rule} · ${extraLabel}`,
    extraDays: extra,
    baseDate: base.date,
  };
}

export function applyLeaveDays(base: DueOffResult, leaveDays: number): DueOffResult {
  const leave = Math.max(0, Math.trunc(leaveDays || 0));
  if (!leave) {
    return { ...base, leaveDays: 0 };
  }
  return {
    ...base,
    date: base.date ? addDays(base.date, leave) : null,
    rule: `${base.rule} · +${leave}d rotary leave`,
    leaveDays: leave,
  };
}

/** One round trip before a rotary officer can take the one allowed leave. */
export const ROTARY_LEAVE_MIN_DAYS_ON = 14;
/** Non-permanent officers must start leave by the 90th day, or at the end of that voyage (14-day trips). */
export const ROTARY_LEAVE_BY_DAY = 90;
export const ROTARY_LEAVE_VOYAGE_END = 98;
export const ROTARY_LEAVE_MAX_DURATION = 60;
export const ROTARY_LEAVE_MAX_PER_TOUR = 1;

export function isOfficerRotary(
  unionHall: string | null | undefined,
  assignmentType: string | null | undefined,
): boolean {
  const kind = (assignmentType ?? "").toUpperCase();
  const union = (unionHall ?? "").toUpperCase();
  if (kind !== "ROTARY") return false;
  return union === "MMP" || union === "MEBA";
}

export function onExpiryBoard(p: {
  status?: string | null;
  assignmentType?: string | null;
  permanentRating?: string | null;
}): boolean {
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

export function coveredEmploymentDays(opts: {
  signOn: string | null | undefined;
  leaveDays?: number | null;
  leaveStartedOn?: string | null;
  asOf?: Date;
}): number | null {
  const asOf = opts.asOf ?? new Date();
  const span = daysAboard(opts.signOn, asOf);
  if (span == null) return null;
  const stored = Math.max(0, Math.trunc(opts.leaveDays ?? 0));
  const open = opts.leaveStartedOn ? Math.max(0, daysAboard(opts.leaveStartedOn, asOf) ?? 0) : 0;
  return Math.max(0, span - stored - open);
}

export function remainingCoveredDays(opts: {
  signOn: string | null | undefined;
  unionHall?: string | null;
  assignmentType?: string | null;
  siuClass?: SiuClass | null;
  lengthDays?: number | null;
  extraDays?: number | null;
  leaveDays?: number | null;
  leaveStartedOn?: string | null;
  asOf?: Date;
}): { remaining: number | null; covered: number | null; tourDays: number | null; rule: string } {
  const planned = defaultTourDays({
    unionHall: (opts.unionHall as UnionHall) ?? null,
    assignmentType: opts.assignmentType,
    siuClass: opts.siuClass ?? null,
    lengthDays: opts.lengthDays ?? null,
  });
  const covered = coveredEmploymentDays({
    signOn: opts.signOn,
    leaveDays: opts.leaveDays,
    leaveStartedOn: opts.leaveStartedOn,
    asOf: opts.asOf,
  });
  const extra = snapExtraDays(opts.extraDays ?? 0);
  if (planned.days == null || covered == null) {
    return { remaining: null, covered, tourDays: planned.days, rule: planned.rule };
  }
  return {
    remaining: planned.days + extra - covered,
    covered,
    tourDays: planned.days,
    rule: planned.rule,
  };
}

export function rotaryLeaveCheck(opts: {
  unionHall?: string | null;
  assignmentType?: string | null;
  signOn?: string | null;
  leaveCount?: number | null;
  leaveStartedOn?: string | null;
  asOf?: Date;
}): { ok: boolean; error?: string } {
  const kind = (opts.assignmentType ?? "").toUpperCase();
  if (kind === "RELIEF") {
    return { ok: false, error: "Relief assignments cannot take leave. The officer they are covering already used the one leave." };
  }
  if (kind === "CADET" || kind === "APPRENTICE") {
    return { ok: false, error: "Cadets and apprentices do not take rotary leave." };
  }
  if (!isOfficerRotary(opts.unionHall, opts.assignmentType)) {
    return { ok: true };
  }
  if (opts.leaveStartedOn) {
    return { ok: false, error: "Already on the one rotary leave for this assignment." };
  }
  if ((opts.leaveCount ?? 0) >= ROTARY_LEAVE_MAX_PER_TOUR) {
    return { ok: false, error: "MM&P/MEBA rotary gets one leave per assignment. They already used it." };
  }
  const on = daysAboard(opts.signOn, opts.asOf);
  if (on == null) {
    return { ok: false, error: "No sign-on date on this assignment." };
  }
  if (on < ROTARY_LEAVE_MIN_DAYS_ON) {
    return { ok: false, error: "Need one round trip (14 days) aboard before rotary leave." };
  }
  if (on > ROTARY_LEAVE_VOYAGE_END) {
    return {
      ok: false,
      error: "Rotary leave must start by the 90th day of shipboard employment, or at the end of that voyage.",
    };
  }
  return { ok: true };
}

export function rotaryLeaveDurationNote(days: number): string | null {
  if (!Number.isFinite(days) || days <= 0) return null;
  if (days < ROTARY_LEAVE_MIN_DAYS_ON) {
    return `Leave was ${days} day${days === 1 ? "" : "s"} (under one round trip of 14).`;
  }
  if (days > ROTARY_LEAVE_MAX_DURATION) {
    return `Leave was ${days} days (over 60). Needs agreement.`;
  }
  return null;
}

export function unionForPosition(position: string | null | undefined): UnionHall {
  const p = (position ?? "").toUpperCase();
  if (/(MASTER|CAPT|\bC\/M\b|\bCM\b|CHIEF MATE|\b2\/M\b|\b2M\b|SECOND MATE|\b3\/M\b|\b3M\b|THIRD MATE|MATE)/.test(p)) {
    return "MMP";
  }
  if (/(C\/E|\bCE\b|CHIEF ENG|\b1A\/E\b|\b1AE\b|1ST A|\b2A\/E\b|\b2AE\b|2ND A|2 A\/E|\b3A\/E\b|\b3AE\b|3RD A|3 A\/E|ASSIST ENG|ASSISTANT ENG)/.test(p)) {
    return "MEBA";
  }
  if (/(CADET|APPRENTICE)/.test(p)) return "NONE";
  if (/(BOSUN|BOATSWAIN|\bAB\b|ABLE|QMED|QEE|ELECTRIC|DEU|STEWARD|COOK|MESS|WIPER|OILER|ORDINARY|\bOS\b)/.test(p)) {
    return "SIU";
  }
  return "NONE";
}

export function defaultAssignmentForPosition(position: string | null | undefined): AssignmentKind {
  const p = (position ?? "").toUpperCase();
  if (/(CADET)/.test(p)) return "CADET";
  if (/(APPRENTICE)/.test(p)) return "APPRENTICE";
  if (/(MASTER|CAPT|CHIEF MATE|\bC\/M\b|\bCM\b|CHIEF ENG|\bC\/E\b|\bCE\b|1ST A|\b1A\/E\b|\b1AE\b|BOSUN|BOATSWAIN|STEWARD(?! ASS)|CHIEF COOK|^COOK$|ELECTRIC)/.test(p)) {
    return "PERMANENT";
  }
  return "ROTARY";
}

export function parseWatch(raw: string | null | undefined): "day" | "12-4" | "4-8" | "8-12" | null {
  if (!raw) return null;
  const s = raw.toUpperCase().replace(/×/g, "X").replace(/\s+/g, " ");
  if (/\bDAY\b/.test(s) && !/\d\s*X\s*\d/.test(s)) return "day";
  if (/\b12\s*X\s*4\b/.test(s) || /\b12-4\b/.test(s) || /\b12\/4\b/.test(s)) return "12-4";
  if (/\b4\s*X\s*8\b/.test(s) || /\b4-8\b/.test(s) || /\b4\/8\b/.test(s)) return "4-8";
  if (/\b8\s*X\s*12\b/.test(s) || /\b8-12\b/.test(s) || /\b8\/12\b/.test(s)) return "8-12";
  if (/\bDAY\b/.test(s)) return "day";
  return null;
}

export function watchLabel(watch: string | null | undefined): string {
  if (!watch) return "—";
  if (watch === "day") return "Day";
  if (watch === "12-4") return "12–4";
  if (watch === "4-8") return "4–8";
  if (watch === "8-12") return "8–12";
  return watch;
}

export function normalizeUnion(raw: string | null | undefined): UnionHall | null {
  if (!raw) return null;
  const s = raw.toUpperCase().replace(/[^A-Z]/g, "");
  if (s === "MMP" || s.includes("MASTER")) return "MMP";
  if (s === "MEBA") return "MEBA";
  if (s === "SIU") return "SIU";
  if (s === "NONE") return "NONE";
  return null;
}

export function normalizeAssignment(raw: string | null | undefined): AssignmentKind | null {
  if (!raw) return null;
  const s = raw.toUpperCase();
  if (/RELIEF/.test(s)) return "RELIEF";
  if (/PERM/.test(s)) return "PERMANENT";
  if (/ROT/.test(s)) return "ROTARY";
  if (/CADET/.test(s)) return "CADET";
  if (/APPRENT/.test(s)) return "APPRENTICE";
  return null;
}
