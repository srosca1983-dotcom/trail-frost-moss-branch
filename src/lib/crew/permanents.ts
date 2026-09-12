import type { CrewDepartment, CrewStatus, UnionHall } from "./types";

/**
 * Official permanents for George II. Two seats per officer job (the rotation
 * pair), plus Watch 2 A/E (Sabrina, omitted from the NS5 workbook), and the
 * unlicensed jobs we treat as changeable permanents.
 */
export type PermanentSlotDef = {
  key: string;
  rating: string;
  title: string;
  seat: string;
  unionHall: UnionHall;
  sailingBillet: string | null;
  department: CrewDepartment;
  onSheet: boolean;
  sheetName: string | null;
  sortOrder: number;
  defaultCrewId: string | null;
  notes?: string | null;
};

export const PERMANENT_SLOT_DEFS: PermanentSlotDef[] = [
  { key: "perm-master-a", rating: "MASTER", title: "Master", seat: "A", unionHall: "MMP", sailingBillet: "00", department: "deck", onSheet: true, sheetName: "Captain Kluck", sortOrder: 10, defaultCrewId: "seed-kluck" },
  { key: "perm-master-b", rating: "MASTER", title: "Master", seat: "B", unionHall: "MMP", sailingBillet: "00", department: "deck", onSheet: true, sheetName: "Captain Tuck", sortOrder: 11, defaultCrewId: "seed-tuck" },
  { key: "perm-cm-a", rating: "C/M", title: "Chief Mate", seat: "A", unionHall: "MMP", sailingBillet: "01", department: "deck", onSheet: true, sheetName: "C/M Rosca", sortOrder: 20, defaultCrewId: "seed-rosca" },
  { key: "perm-cm-b", rating: "C/M", title: "Chief Mate", seat: "B", unionHall: "MMP", sailingBillet: "01", department: "deck", onSheet: true, sheetName: "C/M Shahbin", sortOrder: 21, defaultCrewId: "seed-shahbin" },
  { key: "perm-ce-a", rating: "C/E", title: "Chief Engineer", seat: "A", unionHall: "MEBA", sailingBillet: "10", department: "engine", onSheet: true, sheetName: "C/E Tesson", sortOrder: 30, defaultCrewId: "seed-tesson" },
  { key: "perm-ce-b", rating: "C/E", title: "Chief Engineer", seat: "B", unionHall: "MEBA", sailingBillet: "10", department: "engine", onSheet: true, sheetName: "C/E Navarrete", sortOrder: 31, defaultCrewId: "seed-navarrete" },
  { key: "perm-1ae-a", rating: "1A/E", title: "1st A/E", seat: "A", unionHall: "MEBA", sailingBillet: "11", department: "engine", onSheet: true, sheetName: "1AE Jensen", sortOrder: 40, defaultCrewId: "seed-jensen" },
  { key: "perm-1ae-b", rating: "1A/E", title: "1st A/E", seat: "B", unionHall: "MEBA", sailingBillet: "11", department: "engine", onSheet: true, sheetName: "1AE Novak", sortOrder: 41, defaultCrewId: "seed-novak" },
  { key: "perm-2ae-w", rating: "2A/E", title: "Watch 2 A/E", seat: "A", unionHall: "MEBA", sailingBillet: "12", department: "engine", onSheet: false, sheetName: "2AE Brown", sortOrder: 50, defaultCrewId: "seed-brown" },
  { key: "perm-gas2-a", rating: "2 A/E DAY", title: "Gas 2 / 2 A/E Day", seat: "A", unionHall: "MEBA", sailingBillet: "24", department: "engine", onSheet: true, sheetName: "Gas 2 Albrecht", sortOrder: 60, defaultCrewId: "seed-albrecht" },
  { key: "perm-gas2-b", rating: "2 A/E DAY", title: "Gas 2 / 2 A/E Day", seat: "B", unionHall: "MEBA", sailingBillet: "24", department: "engine", onSheet: true, sheetName: "Gas 2 Walkup", sortOrder: 61, defaultCrewId: "seed-walkup" },
  { key: "perm-bosun-a", rating: "BOSUN", title: "Boatswain", seat: "A", unionHall: "SIU", sailingBillet: "04", department: "deck", onSheet: true, sheetName: "Bosun Gupta", sortOrder: 70, defaultCrewId: "seed-gupta" },
  { key: "perm-bosun-b", rating: "BOSUN", title: "Boatswain", seat: "B", unionHall: "SIU", sailingBillet: "04", department: "deck", onSheet: false, sheetName: "Bosun Gonzalez", sortOrder: 71, defaultCrewId: "seed-gonzalez-joel" },
  { key: "perm-elec-a", rating: "ELECTRICIAN", title: "Electrician", seat: "A", unionHall: "SIU", sailingBillet: "15", department: "engine", onSheet: false, sheetName: "Electrician Huffman", sortOrder: 80, defaultCrewId: "seed-huffman" },
  { key: "perm-steward-a", rating: "STEWARD", title: "Steward", seat: "A", unionHall: "SIU", sailingBillet: "20", department: "steward", onSheet: true, sheetName: "Steward Huyett", sortOrder: 90, defaultCrewId: "seed-huyett" },
  { key: "perm-cook-a", rating: "COOK", title: "Cook", seat: "A", unionHall: "SIU", sailingBillet: "21", department: "steward", onSheet: false, sheetName: "Cook Scott", sortOrder: 91, defaultCrewId: "seed-kenya-scott" },
];

export const PERMANENT_CREW = PERMANENT_SLOT_DEFS.filter((s) => s.defaultCrewId).map((s) => ({
  id: s.defaultCrewId as string,
  sheetName: s.sheetName,
  rating: s.title,
  unionHall: s.unionHall,
  onSheet: s.onSheet,
}));

export function ratingKey(value: string | null | undefined): string {
  const u = (value ?? "").toUpperCase();
  if (/MASTER|CAPT/.test(u)) return "MASTER";
  if (/CHIEF MATE|C\/M|\bCM\b/.test(u)) return "CM";
  if (/CHIEF ENG|C\/E|\bCE\b/.test(u)) return "CE";
  if (/1ST A|1A\/E|1AE/.test(u)) return "1AE";
  if (/GAS 2|2 A\/E DAY|2AE DAY/.test(u)) return "GAS2";
  if (/WATCH 2/.test(u)) return "2AE";
  if (/2A\/E|2 A\/E|2ND A/.test(u)) return "2AE";
  if (/3A\/E|3 A\/E|3RD A/.test(u)) return "3AE";
  if (/BOSUN|BOATSWAIN/.test(u)) return "BOSUN";
  if (/STEWARD ASS/.test(u)) return "STEWARD_ASST";
  if (/STEWARD/.test(u)) return "STEWARD";
  if (/ELECTRIC/.test(u)) return "ELEC";
  if (/COOK/.test(u)) return "COOK";
  return u.replace(/[^A-Z0-9]/g, "");
}

function family(key: string): string {
  if (key === "MASTER" || key === "CM") return "deck-off";
  if (key === "CE" || key === "1AE" || key === "2AE" || key === "GAS2" || key === "3AE") return "eng-off";
  return "other";
}

function rankIndex(key: string): number {
  if (key === "2AE" || key === "GAS2" || key === "3AE") return 1;
  if (key === "1AE" || key === "CM") return 2;
  if (key === "CE" || key === "MASTER") return 3;
  return 0;
}

/** Permanent C/M, 1st A/E, Watch 2 A/E, and Gas 2 / 2 A/E Day can rate up without losing the seat. */
const RATE_UP_FROM = new Set(["CM", "1AE", "2AE", "GAS2"]);

export function canRateUp(permanentRating: string | null | undefined): boolean {
  return RATE_UP_FROM.has(ratingKey(permanentRating));
}

export function isRatedUp(permanentRating: string | null | undefined, sailing: string | null | undefined): boolean {
  if (!permanentRating || !sailing) return false;
  const a = ratingKey(permanentRating);
  const b = ratingKey(sailing);
  if (!b || a === b) return false;
  if (family(a) !== family(b)) return a !== b;
  return rankIndex(b) > rankIndex(a);
}

export type UpgradeOption = {
  rating: string;
  title: string;
  billet: string;
};

export function upgradeOptions(permanentRating: string | null | undefined): UpgradeOption[] {
  const k = ratingKey(permanentRating);
  if (!RATE_UP_FROM.has(k)) return [];
  if (k === "CM") return [{ rating: "MASTER", title: "Master", billet: "00" }];
  if (k === "1AE") return [{ rating: "C/E", title: "Chief Engineer", billet: "10" }];
  return [
    { rating: "1A/E", title: "1st A/E", billet: "11" },
    { rating: "C/E", title: "Chief Engineer", billet: "10" },
  ];
}

export function remainingUpgrades(permanentRating: string | null | undefined, sailing: string | null | undefined): UpgradeOption[] {
  const current = ratingKey(sailing ?? permanentRating);
  return upgradeOptions(permanentRating).filter((opt) => {
    const t = ratingKey(opt.rating);
    if (family(t) !== family(ratingKey(permanentRating))) return false;
    return rankIndex(t) > rankIndex(current);
  });
}

const COVERING_TITLE: Record<string, string> = {
  MASTER: "Master",
  CM: "Chief Mate",
  CE: "Chief Engineer",
  "1AE": "1st A/E",
  "2AE": "2nd A/E",
  GAS2: "Gas 2",
};

export function coveringLabel(permanentRating: string | null | undefined, sailing: string | null | undefined): string | null {
  if (!isRatedUp(permanentRating, sailing)) return null;
  return `rated as ${COVERING_TITLE[ratingKey(sailing)] ?? sailing}`;
}

/**
 * Covering someone who still holds the job is trip relief, not rotary.
 * Rotary means you have the job and can take vacation.
 * SIU Rule 5.A.(13)(h): seamen shipped for relief trips are designated Temporary Relief.
 * Officer rotation pairs (both seats permanent) and rate-up are not trip relief.
 */
export function coveringTripRelief(opts: {
  joiningCrewId?: string | null;
  billetCode: string | null;
  slots: Array<{ sailingBillet: string | null; crewId: string | null }>;
  people: Array<{
    id: string;
    fullName: string;
    status?: string | null;
    permanentRating?: string | null;
    lastPosition?: string | null;
    billetCode?: string | null;
  }>;
}): { relieving: string; holderId: string } | null {
  const code = opts.billetCode;
  if (!code) return null;
  const forJob = opts.slots.filter((s) => s.sailingBillet === code);
  if (!forJob.length) return null;
  if (opts.joiningCrewId && forJob.some((s) => s.crewId === opts.joiningCrewId)) return null;
  const byId = new Map(opts.people.map((p) => [p.id, p]));
  const holders = forJob.map((s) => (s.crewId ? byId.get(s.crewId) : null)).filter((p): p is NonNullable<typeof p> => Boolean(p));
  if (
    holders.some((h) => {
      if ((h.status ?? "").toLowerCase() !== "current") return false;
      if ((h.billetCode ?? "") === code) return true;
      return isRatedUp(h.permanentRating, h.lastPosition);
    })
  )
    return null;
  if (
    opts.people
      .filter((p) => (p.status ?? "").toLowerCase() === "current" && (p.billetCode ?? "") === code && p.id !== opts.joiningCrewId)
      .some((p) => isRatedUp(p.permanentRating, p.lastPosition))
  )
    return null;
  const off = holders.find((h) => (h.status ?? "").toLowerCase() !== "current");
  if (!off) return null;
  return { relieving: off.fullName, holderId: off.id };
}

export function eventTypeLabel(eventType: string | null | undefined): string {
  const t = (eventType ?? "").toLowerCase();
  if (t === "sailed_up" || t === "rated_up") return "rated up";
  if (t === "dropped_back") return "dropped back";
  if (t === "vacated") return "vacated";
  if (t === "promoted") return "promoted";
  if (t === "assigned") return "assigned";
  return (eventType ?? "").replaceAll("_", " ");
}

export type PermanentChangeReason = "quit" | "fired" | "promoted" | "replaced" | "assigned";

export function reasonLabel(reason: string | null | undefined): string {
  if (reason === "quit") return "Quit";
  if (reason === "fired") return "Fired";
  if (reason === "promoted") return "Promoted in rank";
  if (reason === "replaced") return "Replaced";
  return "Assigned";
}

export const CHANGE_REASONS: PermanentChangeReason[] = ["quit", "fired", "promoted", "replaced"];

export function slotDefByKey(key: string): PermanentSlotDef | undefined {
  return PERMANENT_SLOT_DEFS.find((s) => s.key === key);
}

export type PermanentHolder = {
  id: string;
  fullName: string;
  status: CrewStatus;
  permanentRating: string | null;
  lastPosition: string | null;
  billetCode: string | null;
  watch: string | null;
  assignmentType: string | null;
  dueOff: string | null;
};

export type PermanentBoardSlot = {
  id: string;
  key: string;
  rating: string;
  title: string;
  seat: string;
  unionHall: UnionHall;
  sailingBillet: string | null;
  onSheet: boolean;
  sheetName: string | null;
  notes: string | null;
  sortOrder: number;
  holder: PermanentHolder | null;
  covering: string | null;
  coveringNames: string[];
  sailingUp: boolean;
  upgrades: UpgradeOption[];
  returnOn: string | null;
  returnFrom: string | null;
};

export type PermanentEvent = {
  id: string;
  slotId: string;
  crewId: string | null;
  eventType: string;
  reason: string | null;
  fromRating: string | null;
  toRating: string | null;
  notes: string | null;
  occurredOn: string | null;
  createdAt: string;
};

export type PermanentsBoard = {
  slots: PermanentBoardSlot[];
  sailingUp: number;
  vacant: number;
  events: PermanentEvent[];
};

export type RotationPerson = {
  id: string;
  fullName: string;
  status: string | null;
  billetCode: string | null;
  lastDueOff: string | null;
};

/**
 * A permanent who is off comes back when the person sailing that job is due off.
 * Rotation pair first (Rafik ← Sorin). If the partner is not aboard, the sailor
 * on that billet (Huffman ← Flynn covering as trip relief).
 */
export function rotationReturn(opts: {
  sailingBillet: string | null;
  holder: { id: string; status: string | null; fullName: string; dueOff?: string | null } | null;
  partners: Array<{
    sailingBillet: string | null;
    holder: { id: string; status: string | null; fullName: string; dueOff?: string | null } | null;
  }>;
  sailors?: RotationPerson[];
}): { returnOn: string | null; returnFrom: string | null } {
  const holder = opts.holder;
  if (!holder) return { returnOn: null, returnFrom: null };
  if ((holder.status ?? "").toLowerCase() === "current") return { returnOn: null, returnFrom: null };

  const partner = opts.partners.find(
    (s) =>
      s.sailingBillet &&
      opts.sailingBillet &&
      s.sailingBillet === opts.sailingBillet &&
      s.holder &&
      s.holder.id !== holder.id &&
      (s.holder.status ?? "").toLowerCase() === "current",
  )?.holder;
  if (partner?.dueOff) return { returnOn: partner.dueOff, returnFrom: partner.fullName };

  const sailor = (opts.sailors ?? []).find(
    (p) =>
      (p.status ?? "").toLowerCase() === "current" &&
      opts.sailingBillet &&
      p.billetCode === opts.sailingBillet &&
      p.id !== holder.id &&
      p.lastDueOff,
  );
  if (sailor?.lastDueOff) return { returnOn: sailor.lastDueOff, returnFrom: sailor.fullName };

  return { returnOn: null, returnFrom: null };
}
