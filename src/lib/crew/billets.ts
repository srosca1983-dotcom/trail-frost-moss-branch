import { parseWatch } from "./shipping.ts";
import type { AssignmentKind, BilletDef, CrewDepartment, UnionHall, WatchCode } from "./types";

export const VESSEL_BILLETS: BilletDef[] = [
  { code: "00", sortOrder: 0, title: "Master", shortTitle: "00 · Master", department: "deck", watch: "day", unionHall: "MMP", defaultAssignment: "PERMANENT" },
  { code: "01", sortOrder: 1, title: "Chief Mate", shortTitle: "01 · Chief Mate", department: "deck", watch: "day", unionHall: "MMP", defaultAssignment: "PERMANENT" },
  { code: "02", sortOrder: 2, title: "Second Mate", shortTitle: "02 · Second Mate", department: "deck", watch: "12-4", unionHall: "MMP", defaultAssignment: "ROTARY" },
  { code: "03", sortOrder: 3, title: "Third Mate", shortTitle: "03 · Third Mate", department: "deck", watch: "8-12", unionHall: "MMP", defaultAssignment: "ROTARY" },
  { code: "04", sortOrder: 4, title: "Boatswain", shortTitle: "04 · Boatswain", department: "deck", watch: "day", unionHall: "SIU", defaultAssignment: "PERMANENT" },
  { code: "05", sortOrder: 5, title: "AB Day 12 x 4", shortTitle: "05 · AB Day 12×4", department: "deck", watch: "12-4", unionHall: "SIU", defaultAssignment: "ROTARY" },
  { code: "06", sortOrder: 6, title: "AB Day 4 x 8", shortTitle: "06 · AB Day 4×8", department: "deck", watch: "4-8", unionHall: "SIU", defaultAssignment: "ROTARY" },
  { code: "07", sortOrder: 7, title: "AB/W 12 x 4", shortTitle: "07 · AB/W 12×4", department: "deck", watch: "12-4", unionHall: "SIU", defaultAssignment: "ROTARY" },
  { code: "08", sortOrder: 8, title: "AB/W 4 x 8", shortTitle: "08 · AB/W 4×8", department: "deck", watch: "4-8", unionHall: "SIU", defaultAssignment: "ROTARY" },
  { code: "09", sortOrder: 9, title: "AB/W 8 x 12", shortTitle: "09 · AB/W 8×12", department: "deck", watch: "8-12", unionHall: "SIU", defaultAssignment: "ROTARY" },
  { code: "10", sortOrder: 10, title: "Chief Engineer", shortTitle: "10 · Chief Engineer", department: "engine", watch: "day", unionHall: "MEBA", defaultAssignment: "PERMANENT" },
  { code: "11", sortOrder: 11, title: "1st A/E", shortTitle: "11 · 1st A/E", department: "engine", watch: "day", unionHall: "MEBA", defaultAssignment: "PERMANENT" },
  { code: "12", sortOrder: 12, title: "2 A/E 4 x 8", shortTitle: "12 · 2 A/E 4×8", department: "engine", watch: "4-8", unionHall: "MEBA", defaultAssignment: "ROTARY" },
  { code: "13", sortOrder: 13, title: "3 A/E 8 x 12", shortTitle: "13 · 3 A/E 8×12", department: "engine", watch: "8-12", unionHall: "MEBA", defaultAssignment: "ROTARY" },
  { code: "14", sortOrder: 14, title: "3 A/E 12 x 4", shortTitle: "14 · 3 A/E 12×4", department: "engine", watch: "12-4", unionHall: "MEBA", defaultAssignment: "ROTARY" },
  { code: "15", sortOrder: 15, title: "Electrician", shortTitle: "15 · Electrician", department: "engine", watch: "day", unionHall: "SIU", defaultAssignment: "PERMANENT" },
  { code: "16", sortOrder: 16, title: "QMED 12 x 4", shortTitle: "16 · QMED 12×4", department: "engine", watch: "12-4", unionHall: "SIU", defaultAssignment: "ROTARY" },
  { code: "17", sortOrder: 17, title: "QMED 4 x 8", shortTitle: "17 · QMED 4×8", department: "engine", watch: "4-8", unionHall: "SIU", defaultAssignment: "ROTARY" },
  { code: "18", sortOrder: 18, title: "QMED 8 x 12", shortTitle: "18 · QMED 8×12", department: "engine", watch: "8-12", unionHall: "SIU", defaultAssignment: "ROTARY" },
  { code: "19", sortOrder: 19, title: "DEU", shortTitle: "19 · DEU", department: "engine", watch: "day", unionHall: "SIU", defaultAssignment: "ROTARY" },
  { code: "20", sortOrder: 20, title: "Steward", shortTitle: "20 · Steward", department: "steward", watch: "day", unionHall: "SIU", defaultAssignment: "PERMANENT" },
  { code: "21", sortOrder: 21, title: "Cook", shortTitle: "21 · Cook", department: "steward", watch: "day", unionHall: "SIU", defaultAssignment: "PERMANENT" },
  { code: "22", sortOrder: 22, title: "Steward Assist", shortTitle: "22 · Steward Assist", department: "steward", watch: "day", unionHall: "SIU", defaultAssignment: "ROTARY" },
  { code: "24", sortOrder: 12.5, title: "2 A/E Day", shortTitle: "24 · 2 A/E Day", department: "engine", watch: "day", unionHall: "MEBA", defaultAssignment: "ROTARY" },
  { code: "25", sortOrder: 25, title: "Deck Cadet", shortTitle: "25 · Deck Cadet", department: "deck", watch: "day", unionHall: "NONE", defaultAssignment: "CADET" },
  { code: "26", sortOrder: 26, title: "Engine Cadet", shortTitle: "26 · Engine Cadet", department: "engine", watch: "day", unionHall: "NONE", defaultAssignment: "CADET" },
  { code: "27", sortOrder: 27, title: "Apprentice A", shortTitle: "27 · Apprentice A", department: "deck", watch: "day", unionHall: "NONE", defaultAssignment: "APPRENTICE" },
  { code: "28", sortOrder: 28, title: "Apprentice B", shortTitle: "28 · Apprentice B", department: "deck", watch: "day", unionHall: "NONE", defaultAssignment: "APPRENTICE" },
];

export function billetByCode(code: string | null | undefined): BilletDef | undefined {
  if (!code) return undefined;
  return VESSEL_BILLETS.find((b) => b.code === code);
}

function scoreBillet(position: string, watch: WatchCode | null, b: BilletDef): number {
  const p = position.toUpperCase().replace(/×/g, "X").replace(/\s+/g, " ").trim();
  const title = `${b.title} ${b.shortTitle}`.toUpperCase().replace(/×/g, "X");
  let score = 0;

  if (p.includes(b.code) && /\b\d{2}\b/.test(p)) score += 50;

  const checks: Array<[RegExp, string]> = [
    [/\bMASTER\b|\bCAPT/, "00"],
    [/CHIEF MATE|\bC\/M\b|\bCM\b/, "01"],
    [/SECOND MATE|\b2\/M\b|\b2M\b/, "02"],
    [/THIRD MATE|\b3\/M\b|\b3M\b/, "03"],
    [/BOATSWAIN|\bBOSUN\b/, "04"],
    [/AB\s*DAY|ABLE.*DAY/, "05"],
    [/AB\/W|AB W|AB\(W\)|ABLE.*WATCH/, "07"],
    [/\bAB\b|ABLE SEAM/, "07"],
    [/CHIEF ENG|\bC\/E\b|\bCE\b/, "10"],
    [/1ST A|FIRST A|\b1A\/E\b|\b1AE\b/, "11"],
    [/2ND A|SECOND A|\b2A\/E\b|\b2AE\b|2 A\/E/, "12"],
    [/3RD A|THIRD A|\b3A\/E\b|\b3AE\b|3 A\/E/, "13"],
    [/ELECTRIC/, "15"],
    [/\bQMED\b|\bQEE\b/, "16"],
    [/\bDEU\b|DECK ENGINE UTILITY/, "19"],
    [/STEWARD ASS/, "22"],
    [/\bSTEWARD\b/, "20"],
    [/\bCOOK\b/, "21"],
    [/DECK CADET/, "25"],
    [/ENGINE CADET|CADET ENG/, "26"],
    [/APPRENTICE A/, "27"],
    [/APPRENTICE B/, "28"],
    [/APPRENTICE/, "27"],
    [/CADET/, "26"],
  ];

  for (const [re, code] of checks) {
    if (re.test(p) && b.code === code) {
      score += 20;
      break;
    }
    if (re.test(p) && ["05", "06"].includes(b.code) && /AB.*DAY|DAY.*AB/.test(p)) score += 12;
    if (re.test(p) && ["07", "08", "09"].includes(b.code) && /AB\/W|AB W|WATCH/.test(p)) score += 10;
    if (re.test(p) && ["12", "24"].includes(b.code) && /2A|2 A\/E|2ND A/.test(p)) score += 10;
    if (re.test(p) && ["13", "14"].includes(b.code) && /3A|3 A\/E|3RD A/.test(p)) score += 10;
    if (re.test(p) && ["16", "17", "18"].includes(b.code) && /QMED|QEE/.test(p)) score += 10;
  }

  if (title.includes(p) || p.includes(b.title.toUpperCase())) score += 8;

  const posWatch = watch ?? parseWatch(p);
  if (posWatch && b.watch === posWatch) score += 15;
  else if (posWatch && b.watch && b.watch !== posWatch) score -= 8;

  if (/\bDAY\b/.test(p) && b.watch === "day") score += 6;
  if (/\bDAY\b/.test(p) && b.code === "24" && /2A|2 A\/E|2ND/.test(p)) score += 18;
  if (/AB DAY 4/.test(p) && b.code === "06") score += 20;
  if (/AB DAY 12/.test(p) && b.code === "05") score += 20;
  if (/AB\/W 12|AB W 12/.test(p) && b.code === "07") score += 20;
  if (/AB\/W 4|AB W 4/.test(p) && b.code === "08") score += 20;
  if (/AB\/W 8|AB W 8/.test(p) && b.code === "09") score += 20;
  if (/QMED 12/.test(p) && b.code === "16") score += 20;
  if (/QMED 4/.test(p) && b.code === "17") score += 20;
  if (/QMED 8/.test(p) && b.code === "18") score += 20;
  if (/3 A\/E 8|3AE 8|3 A\/E 8/.test(p) && b.code === "13") score += 20;
  if (/3 A\/E 12|3AE 12/.test(p) && b.code === "14") score += 20;
  if (/2 A\/E 4|2AE 4/.test(p) && b.code === "12") score += 20;

  return score;
}

export type BilletMatch = {
  billet: BilletDef;
  score: number;
  vacant: boolean;
};

export function matchBillets(
  position: string | null | undefined,
  occupiedCodes: Set<string>,
  watch?: WatchCode | null,
): BilletMatch[] {
  if (!position?.trim()) return [];
  const scored = VESSEL_BILLETS.map((b) => ({
    billet: b,
    score: scoreBillet(position, watch ?? parseWatch(position), b),
    vacant: !occupiedCodes.has(b.code),
  }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || Number(b.vacant) - Number(a.vacant));
  return scored;
}

export function proposeBillet(
  position: string | null | undefined,
  occupiedCodes: Set<string>,
  watch?: WatchCode | null,
): { pick: BilletDef | null; alternatives: BilletDef[]; confidence: "high" | "medium" | "low"; question: string | null } {
  const ranked = matchBillets(position, occupiedCodes, watch);
  if (!ranked.length) {
    return {
      pick: null,
      alternatives: VESSEL_BILLETS.filter((b) => !occupiedCodes.has(b.code)),
      confidence: "low",
      question: `Could not match “${position ?? "this rating"}” to a George II billet. Which slot?`,
    };
  }
  const top = ranked[0];
  const close = ranked.filter((r) => r.score >= top.score - 8);
  const vacantClose = close.filter((r) => r.vacant);

  if (vacantClose.length === 1 && vacantClose[0].score >= 20) {
    const note = vacantClose[0].billet.notes;
    return {
      pick: vacantClose[0].billet,
      alternatives: ranked.slice(0, 4).map((r) => r.billet),
      confidence: vacantClose[0].score >= 30 && !note ? "high" : "medium",
      question: note ?? (vacantClose[0].score < 30 ? `Assign to ${vacantClose[0].billet.shortTitle}?` : null),
    };
  }

  if (close.length > 1) {
    const names = (vacantClose.length ? vacantClose : close).map((r) => r.billet.shortTitle).join(", ");
    return {
      pick: (vacantClose[0] ?? top).billet,
      alternatives: close.map((r) => r.billet),
      confidence: "low",
      question: `More than one slot fits this rating (${names}). Which one?`,
    };
  }

  if (!top.vacant) {
    return {
      pick: top.billet,
      alternatives: ranked.filter((r) => r.vacant).slice(0, 4).map((r) => r.billet),
      confidence: "low",
      question: `${top.billet.shortTitle} is already filled. Replace, or pick another slot?`,
    };
  }

  return {
    pick: top.billet,
    alternatives: ranked.slice(0, 4).map((r) => r.billet),
    confidence: top.score >= 28 ? "high" : "medium",
    question: top.score < 20 ? `Assign to ${top.billet.shortTitle}?` : null,
  };
}

export function departmentOf(code: string): CrewDepartment | null {
  return billetByCode(code)?.department ?? null;
}

export function unionOf(code: string): UnionHall | null {
  return billetByCode(code)?.unionHall ?? null;
}

export function assignmentOf(code: string): AssignmentKind | null {
  return billetByCode(code)?.defaultAssignment ?? null;
}

/** Same rating, different watch — the trades a C/M actually does. Permanents have none. */
export function watchFamily(code: string | null | undefined): string | null {
  if (!code) return null;
  if (code === "02" || code === "03") return "mates";
  if (code === "05" || code === "06") return "ab-day";
  if (code === "07" || code === "08" || code === "09") return "ab-watch";
  if (code === "12" || code === "24") return "2ae";
  if (code === "13" || code === "14") return "3ae";
  if (code === "16" || code === "17" || code === "18") return "qmed";
  return null;
}

/** Same department, hall, and watch family. Never deck ↔ engine ↔ steward. Never AB onto Master. */
export function canMoveBillet(fromCode: string | null | undefined, toCode: string | null | undefined): boolean {
  if (!fromCode || !toCode || fromCode === toCode) return false;
  const from = billetByCode(fromCode);
  const to = billetByCode(toCode);
  if (!from || !to) return false;
  if (from.department !== to.department || from.unionHall !== to.unionHall) return false;
  const a = watchFamily(fromCode);
  const b = watchFamily(toCode);
  return Boolean(a && b && a === b);
}

/** Swap two people on the same watch family (AB/W 12–4 with AB/W 8–12, not AB with Master). */
export function canTradeBillet(fromCode: string | null | undefined, toCode: string | null | undefined): boolean {
  return canMoveBillet(fromCode, toCode);
}

export type BilletChangeOption = {
  kind: "trade" | "vacant";
  code: string;
  label: string;
};

export function listBilletChanges(
  fromCode: string | null | undefined,
  aboard: Array<{ id: string; fullName: string; billetCode: string | null; assignmentType?: string | null }>,
  selfId?: string,
): BilletChangeOption[] {
  if (!fromCode || !billetByCode(fromCode)) return [];
  const me = aboard.find((p) => p.id === selfId);
  if ((me?.assignmentType ?? "").toUpperCase() === "PERMANENT") return [];
  const sitting = new Map<string, Array<{ id: string; fullName: string; assignmentType?: string | null }>>();
  for (const p of aboard) {
    if (!p.billetCode || p.id === selfId) continue;
    const arr = sitting.get(p.billetCode) ?? [];
    arr.push(p);
    sitting.set(p.billetCode, arr);
  }
  const trades: BilletChangeOption[] = [];
  const vacant: BilletChangeOption[] = [];
  for (const b of VESSEL_BILLETS) {
    if (b.code === fromCode) continue;
    const names = sitting.get(b.code) ?? [];
    if (names.length > 1) continue;
    if (names.length === 1) {
      if ((names[0].assignmentType ?? "").toUpperCase() === "PERMANENT") continue;
      if (!canTradeBillet(fromCode, b.code)) continue;
      trades.push({
        kind: "trade",
        code: b.code,
        label: `Trade with ${names[0].fullName} · ${b.shortTitle}`,
      });
    } else if (canMoveBillet(fromCode, b.code)) {
      vacant.push({
        kind: "vacant",
        code: b.code,
        label: `Move to ${b.shortTitle} (empty)`,
      });
    }
  }
  return [...trades, ...vacant];
}

export function departmentLabel(dept: CrewDepartment | null | undefined): string {
  if (dept === "deck") return "deck";
  if (dept === "engine") return "engine";
  if (dept === "steward") return "steward";
  return "this department";
}

