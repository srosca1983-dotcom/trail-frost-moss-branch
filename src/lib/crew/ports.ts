import { daysUntil, expiryTone } from "./dates.ts";
import type { VesselRun } from "./types.ts";

export type PortKind = "regular" | "occasional" | "shipyard";

export type RunPort = {
  id: "LB" | "HNL" | "OAK" | "NTG";
  name: string;
  label: string;
  country: string;
  countryCode: string;
  kind: PortKind;
};

/** GEORGE II run. Regular is Long Beach ↔ Honolulu. Oakland if it happens. Nantong is the yard. */
export const RUN_PORTS: RunPort[] = [
  { id: "LB", name: "Long Beach", label: "Long Beach, CA", country: "UNITED STATES", countryCode: "US", kind: "regular" },
  { id: "HNL", name: "Honolulu", label: "Honolulu, HI", country: "UNITED STATES", countryCode: "US", kind: "regular" },
  { id: "OAK", name: "Oakland", label: "Oakland, CA", country: "UNITED STATES", countryCode: "US", kind: "occasional" },
  { id: "NTG", name: "Nantong", label: "Nantong, China (shipyard)", country: "CHINA", countryCode: "CN", kind: "shipyard" },
];

export const DEFAULT_VESSEL_RUN: VesselRun = {
  thisPort: "Long Beach",
  nextPort: "Honolulu",
  eta: null,
  voyageNumber: null,
};

const ALIASES: Record<string, string> = {
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
  cntng: "Nantong",
};

function hasSex(raw: string | null | undefined): boolean {
  const s = (raw ?? "").trim().toUpperCase();
  if (!s) return false;
  return s.startsWith("F") || s === "M" || s.startsWith("MALE") || (s.startsWith("M") && !s.startsWith("MI"));
}

export function normalizePortName(raw: string | null | undefined): string | null {
  const s = (raw ?? "").trim();
  if (!s) return null;
  const hit = ALIASES[s.toLowerCase().replace(/\./g, "").replace(/\s+/g, " ")];
  if (hit) return hit;
  const port = RUN_PORTS.find((p) => p.name.toLowerCase() === s.toLowerCase() || p.label.toLowerCase() === s.toLowerCase());
  return port?.name ?? s;
}

export function portByName(raw: string | null | undefined): RunPort | undefined {
  const name = normalizePortName(raw);
  if (!name) return undefined;
  return RUN_PORTS.find((p) => p.name === name);
}

/** Other end of the regular run. Oakland still turns around to Honolulu. Yard comes home to Long Beach. */
export function matePort(thisPort: string | null | undefined): string {
  const name = normalizePortName(thisPort);
  if (name === "Honolulu") return "Long Beach";
  if (name === "Oakland") return "Honolulu";
  if (name === "Nantong") return "Long Beach";
  return "Honolulu";
}

export function isShipyardPort(raw: string | null | undefined): boolean {
  return portByName(raw)?.kind === "shipyard";
}

export function isForeignCall(nextPort: string | null | undefined): boolean {
  return isShipyardPort(nextPort);
}

/** Nantong yard — heading there or already there. Regular run never hits this. */
export function isYardCall(run: Pick<VesselRun, "thisPort" | "nextPort"> | null | undefined): boolean {
  if (!run) return false;
  return isShipyardPort(run.thisPort) || isShipyardPort(run.nextPort);
}

export function embarkCountry(port: string | null | undefined): string {
  const p = portByName(port);
  if (p) return p.country;
  if (!(port ?? "").trim()) return "";
  return "UNITED STATES";
}

export function runLine(run: VesselRun): string {
  const eta = run.eta ? ` · ETA ${run.eta}` : "";
  const voy = run.voyageNumber ? `Voy ${run.voyageNumber} · ` : "";
  return `${voy}${run.thisPort} → ${run.nextPort}${eta}`;
}

export type TicketGap = {
  code: string;
  label: string;
  expiresOn: string | null;
};

/** MMC, medical, TWIC, DOT drug-free that are already expired. Missing is not a hard stop. */
export function deadJoinTickets(input: {
  mmcExpiration?: string | null;
  documents?: Array<{ docType: string; label?: string | null; expiresOn: string | null }>;
}): TicketGap[] {
  const docs = input.documents ?? [];
  const gaps: TicketGap[] = [];
  if (input.mmcExpiration && expiryTone(input.mmcExpiration) === "expired") {
    gaps.push({ code: "mmc", label: "MMC", expiresOn: input.mmcExpiration });
  }
  for (const code of ["medical", "twic", "drug_free"] as const) {
    const d = docs.find((x) => x.docType === code);
    if (d?.expiresOn && expiryTone(d.expiresOn) === "expired") {
      const label = code === "drug_free" ? "DOT drug-free" : code === "twic" ? "TWIC" : "Medical";
      gaps.push({ code, label, expiresOn: d.expiresOn });
    }
  }
  return gaps;
}

/** 33 CFR 160.206 fields the Master still needs on this person. */
export function enoadGaps(input: {
  lastName?: string | null;
  fullName?: string | null;
  dob?: string | null;
  sex?: string | null;
  passportNumber?: string | null;
  mmcNumber?: string | null;
  passportExpiration?: string | null;
  mmcExpiration?: string | null;
  embarkPort?: string | null;
}): string[] {
  const miss: string[] = [];
  const last = (input.lastName ?? "").trim() || (input.fullName ?? "").trim().split(/\s+/).pop() || "";
  if (!last) miss.push("Last name");
  if (!input.dob) miss.push("Date of birth");
  if (!hasSex(input.sex)) miss.push("Sex");
  const id = (input.passportNumber ?? "").trim() || (input.mmcNumber ?? "").trim();
  if (!id) miss.push("Passport or MMC");
  else {
    const expiry = input.passportNumber ? input.passportExpiration : input.mmcExpiration;
    if (expiry && (daysUntil(expiry) ?? 0) < 0) miss.push("ID expired");
  }
  if (!normalizePortName(input.embarkPort)) miss.push("Where embarked");
  return miss;
}

const CHINA_PASSPORT_DAYS = 180;

export function chinaPassportGaps(input: {
  fullName: string;
  crewId: string;
  passportNumber?: string | null;
  passportExpiration?: string | null;
}): { crewId: string; fullName: string; reason: string; expiresOn: string | null } | null {
  if (!input.passportNumber) {
    return { crewId: input.crewId, fullName: input.fullName, reason: "No passport", expiresOn: null };
  }
  const days = daysUntil(input.passportExpiration);
  if (days === null) {
    return { crewId: input.crewId, fullName: input.fullName, reason: "Passport date missing", expiresOn: input.passportExpiration ?? null };
  }
  if (days < 0) {
    return { crewId: input.crewId, fullName: input.fullName, reason: "Passport expired", expiresOn: input.passportExpiration ?? null };
  }
  if (days < CHINA_PASSPORT_DAYS) {
    return {
      crewId: input.crewId,
      fullName: input.fullName,
      reason: `Passport ${days}d left — China wants 6 months`,
      expiresOn: input.passportExpiration ?? null,
    };
  }
  return null;
}

export function withMateNext(thisPort: string, nextPort?: string | null): Pick<VesselRun, "thisPort" | "nextPort"> {
  const here = normalizePortName(thisPort) ?? DEFAULT_VESSEL_RUN.thisPort;
  const next = nextPort ? normalizePortName(nextPort) : null;
  return { thisPort: here, nextPort: next ?? matePort(here) };
}

/**
 * Leftover days that still make another Long Beach ↔ Honolulu round trip.
 * 12 days left at this Long Beach is the next Long Beach — the trip after, not this call.
 */
export const ANOTHER_TRIP_DAYS = 12;

export type WalkOff = {
  thisCall: boolean;
  when: "this" | "next" | "later" | "unknown";
  port: string;
};

export function walkOff(opts: {
  daysLeft: number | null;
  embarkPort?: string | null;
  thisPort: string;
  nextPort?: string | null;
}): WalkOff {
  const here = normalizePortName(opts.thisPort) ?? opts.thisPort;
  const home = normalizePortName(opts.embarkPort) ?? here;
  if (opts.daysLeft === null) return { thisCall: false, when: "unknown", port: home };

  const atHome = home === here;
  if (atHome && opts.daysLeft < ANOTHER_TRIP_DAYS) {
    return { thisCall: true, when: "this", port: here };
  }
  if (opts.daysLeft < ANOTHER_TRIP_DAYS * 2) {
    return { thisCall: false, when: "next", port: home };
  }
  return { thisCall: false, when: "later", port: home };
}
