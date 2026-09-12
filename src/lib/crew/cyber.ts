import { inferDepartment, positionLabel } from "./ratings.ts";
import { needsSmsCyber } from "./sms-training.ts";
import type { CrewDepartment } from "./types.ts";

export type CyberModuleId = "awareness" | "ot" | "key";

export type CyberMaterial = {
  kind: "facilitator" | "handout";
  label: string;
  href: string;
};

export type CyberModule = {
  id: CyberModuleId;
  short: string;
  title: string;
  courseTitle: string;
  cfr: string;
  durationMin: number;
  audience: string;
  who: string;
  why: string;
  topics: string[];
  signerLabel: "Facilitator" | "Approved by";
  materials: CyberMaterial[];
};

export const CYBER_MODULES: Record<CyberModuleId, CyberModule> = {
  awareness: {
    id: "awareness",
    short: "Mod 1",
    title: "Maritime Cybersecurity Awareness",
    courseTitle: "MARITIME CYBERSECURITY AWARENESS TRAINING",
    cfr: "33 CFR §101.650(d)(1)(ii)–(iv)",
    durationMin: 15,
    audience: "Everyone aboard",
    who: "Everyone aboard with access to IT or OT — SMM-SMM-08 Mod 1 is the whole crew.",
    why: "Recognize threats, how they bypass controls, and how to report to the CySO. SMM-SMM-08-AP3 is the older 1-year company form; this is the USCG MTSA module.",
    topics: [
      "Recognition and detection of cybersecurity threats and all types of cyber incidents",
      "Techniques used to circumvent cybersecurity measures",
      "Procedures for reporting a cyber incident to the Cybersecurity Officer (CySO)",
    ],
    signerLabel: "Facilitator",
    materials: [
      { kind: "facilitator", label: "Facilitator guide", href: "/templates/cyber/mod1-facilitator.pdf" },
      { kind: "handout", label: "Trainee handout", href: "/templates/cyber/mod1-handout.pdf" },
    ],
  },
  ot: {
    id: "ot",
    short: "Mod 2",
    title: "Operational Technology (OT) Cybersecurity",
    courseTitle: "OPERATIONAL TECHNOLOGY (OT) CYBERSECURITY TRAINING",
    cfr: "33 CFR §101.650(d)(1)(v)",
    durationMin: 15,
    audience: "OT systems",
    who: "SMM-SMM-08 Mod 2: all officers plus the electrician. Add any rating who actually uses OT.",
    why: "ECDIS, IBS, AIS, ECS, ballast, PLCs, fire detection, cargo automation. Extra module on top of awareness.",
    topics: [
      "IT vs. OT system fundamentals",
      "Common OT risks in maritime environments",
      "Physical and logical access risks",
      "Expected vs. suspicious OT behavior",
      "Actions to take if an OT cyber incident is suspected",
    ],
    signerLabel: "Facilitator",
    materials: [
      { kind: "facilitator", label: "Facilitator guide", href: "/templates/cyber/mod2-facilitator.pdf" },
      { kind: "handout", label: "Trainee handout", href: "/templates/cyber/mod2-handout.pdf" },
    ],
  },
  key: {
    id: "key",
    short: "Mod 3",
    title: "MTSA Cybersecurity for Key Personnel",
    courseTitle: "MTSA CYBERSECURITY TRAINING FOR KEY PERSONNEL",
    cfr: "33 CFR §101.650(d)(2)",
    durationMin: 15,
    audience: "Key personnel",
    who: "SMM-SMM-08 Mod 3: all officers plus the electrician (elevated access). Owner/operator designation — add anyone the Cybersecurity Plan names.",
    why: "Incident roles, response/coordination, and staying current on threats.",
    topics: [
      "Roles and responsibilities during a cybersecurity incident",
      "Cyber incident response procedures and coordination responsibilities",
      "Methods for maintaining current knowledge of evolving cybersecurity threats and countermeasures",
    ],
    signerLabel: "Approved by",
    materials: [{ kind: "handout", label: "Key personnel slides", href: "/templates/cyber/mod3-handout.pdf" }],
  },
};

export const CYBER_MODULE_ORDER: CyberModuleId[] = ["awareness", "ot", "key"];

export type CyberCrewInput = {
  id: string;
  fullName: string;
  firstName?: string | null;
  lastName?: string | null;
  lastPosition: string | null;
  lastBillet?: string | null;
  status?: string | null;
  mmcNumber?: string | null;
};

export type CyberSeat = {
  crewId: string;
  fullName: string;
  lastName: string;
  firstName: string;
  position: string | null;
  positionLabel: string;
  department: CrewDepartment | null;
  billet: string | null;
  mmcNumber: string | null;
  modules: CyberModuleId[];
  awareness: boolean;
  ot: boolean;
  key: boolean;
};

/** SMM-SMM-08 Rev 3: all officers plus electrician (elevated access / OT maintenance). */
export function isKeyPersonnel(position: string | null | undefined): boolean {
  return needsSmsCyber("key", position);
}

/** SMM-SMM-08 Rev 3: all officers plus electrician. Ratings only if they actually use OT. */
export function needsOtTraining(position: string | null | undefined): boolean {
  return needsSmsCyber("ot", position);
}

export function needsAwareness(_position?: string | null): boolean {
  return true;
}

export function modulesFor(position: string | null | undefined): CyberModuleId[] {
  const out: CyberModuleId[] = [];
  if (needsAwareness(position)) out.push("awareness");
  if (needsOtTraining(position)) out.push("ot");
  if (isKeyPersonnel(position)) out.push("key");
  return out;
}

export function classifySeat(c: CyberCrewInput): CyberSeat {
  const position = c.lastPosition;
  const modules = modulesFor(position);
  const lastName = (c.lastName ?? "").trim() || lastFromFull(c.fullName);
  const firstName = (c.firstName ?? "").trim() || givenFromFull(c.fullName, lastName);
  return {
    crewId: c.id,
    fullName: c.fullName,
    lastName,
    firstName,
    position,
    positionLabel: positionLabel(position),
    department: inferDepartment(position),
    billet: c.lastBillet ?? null,
    mmcNumber: c.mmcNumber ?? null,
    modules,
    awareness: modules.includes("awareness"),
    ot: modules.includes("ot"),
    key: modules.includes("key"),
  };
}

export function classifyCrew(list: CyberCrewInput[], aboardOnly = true): CyberSeat[] {
  return list
    .filter((c) => (aboardOnly ? c.status === "current" : true))
    .map(classifySeat)
    .sort((a, b) => (a.billet ?? "99").localeCompare(b.billet ?? "99") || a.fullName.localeCompare(b.fullName));
}

export function seatsForModule(seats: CyberSeat[], module: CyberModuleId): CyberSeat[] {
  return seats.filter((s) => s.modules.includes(module));
}

export function moduleCounts(seats: CyberSeat[]): Record<CyberModuleId, number> {
  return {
    awareness: seatsForModule(seats, "awareness").length,
    ot: seatsForModule(seats, "ot").length,
    key: seatsForModule(seats, "key").length,
  };
}

function lastFromFull(full: string): string {
  const parts = full.trim().split(/\s+/);
  return parts[parts.length - 1] ?? full;
}

function givenFromFull(full: string, last: string): string {
  const trimmed = full.trim();
  if (last && trimmed.toLowerCase().endsWith(last.toLowerCase())) {
    return trimmed.slice(0, trimmed.length - last.length).trim();
  }
  const parts = trimmed.split(/\s+/);
  return parts.slice(0, -1).join(" ");
}
