import { expiryTone } from "./dates.ts";
import { positionLabel } from "./ratings.ts";
import { needsSmsHazmat } from "./sms-training.ts";
import type { ExpiryTone, ParsedDocument, ParsedPerson, UnionHall } from "./types.ts";

/** SRO packet pages we can fill (0-based indexes in the 19-page template). */
export type PacketPageKey =
  | "cover"
  | "per003"
  | "policies"
  | "physical"
  | "medical"
  | "dot"
  | "w4"
  | "deposit"
  | "i9"
  | "fam"
  | "hazmatQuiz"
  | "cyber"
  | "internet";

export const PACKET_PAGE_INDEX: Record<PacketPageKey, number[]> = {
  cover: [0],
  per003: [1],
  policies: [2],
  physical: [3, 4],
  medical: [5],
  dot: [6],
  w4: [7],
  deposit: [8],
  i9: [9],
  fam: [10, 11],
  hazmatQuiz: [12],
  cyber: [15],
  internet: [16, 17, 18],
};

export const PACKET_PAGE_LABEL: Record<PacketPageKey, string> = {
  cover: "Cover checklist",
  per003: "SRO-PER-003 Sign-on information",
  policies: "SRO-PER-002 Acknowledgement of SRO policies",
  physical: "SRO-PER-001 Statement of physical condition",
  medical: "SMM-PER-05-AP2 Medical sign-on",
  dot: "SRO-PER-008 DOT drug & alcohol release",
  w4: "Federal W-4",
  deposit: "SRO-PAY-002 Direct deposit",
  i9: "Form I-9",
  fam: "SMM-PER-05-AP1 Familiarization checklist",
  hazmatQuiz: "HAZMAT quiz (use the HAZMAT desk — not this packet page)",
  cyber: "SMM-SMM-08-AP3 Cyber security training",
  internet: "SMM-SMM-08-AP4 Internet usage policy",
};

export type ExtraFormKey =
  | "mmp-401k-enroll"
  | "mmp-401k-optout"
  | "meba-401k"
  | "siu-401k"
  | "meba-ot"
  | "door-tag"
  | "hazmat-cert";

export const EXTRA_FORM_LABEL: Record<ExtraFormKey, string> = {
  "mmp-401k-enroll": "MM&P 401(k) enrollment",
  "mmp-401k-optout": "MM&P 401(k) opt-out",
  "meba-401k": "MEBA 401(k) enrollment",
  "siu-401k": "SIU Empower 401(k)",
  "meba-ot": "MEBA converted overtime worksheet",
  "door-tag": "Door nametag",
  "hazmat-cert": "HAZMAT training certificate",
};

export type PaperworkOpts = {
  returning: boolean;
  unionHall: UnionHall | null;
  position?: string | null;
  identityChanged?: boolean;
  w4Needed?: boolean;
  depositChanged?: boolean;
  enroll401k?: boolean;
  cyberExpired?: boolean;
  internetExpired?: boolean;
  hazmatExpired?: boolean;
};

export type PaperworkItem = {
  key: string;
  label: string;
  why: string;
  required: boolean;
};

export type PaperworkSet = {
  packetPages: PacketPageKey[];
  extras: ExtraFormKey[];
  forms: PaperworkItem[];
  notes: string[];
};

/**
 * SRO-CM-06 Crew Changes and Travel + SMM-PER-05 Familiarization (rev 5, 28 Aug 2026).
 * New joiners get the full company packet. Returning crew only get what the book
 * still requires this assignment — plus familiarization every time they come back.
 */
export function paperworkForJoining(opts: PaperworkOpts): PaperworkSet {
  const pages: PacketPageKey[] = [];
  const extras: ExtraFormKey[] = [];
  const forms: PaperworkItem[] = [];
  const notes: string[] = [];
  const union = (opts.unionHall ?? "").toUpperCase();

  function addPage(key: PacketPageKey, why: string, required = true) {
    if (!pages.includes(key)) pages.push(key);
    forms.push({ key, label: PACKET_PAGE_LABEL[key], why, required });
  }
  function addExtra(key: ExtraFormKey, why: string, required = true) {
    if (!extras.includes(key)) extras.push(key);
    forms.push({ key, label: EXTRA_FORM_LABEL[key], why, required });
  }

  addPage("cover", "Checklist of this joining.");
  addPage("policies", "SRO-CM-06 — SRO-PER-002 every assignment, new or returning.");
  addPage("physical", "SRO-CM-06 — SRO-PER-001 every assignment.");
  addPage("medical", "SMM-PER-05 — medical sign-on (AP2) at the Master’s interview.");
  addPage(
    "fam",
    "SMM-PER-05 rev 5 — familiarization applies to new employees and permanents re-joining. Section 1 before sailing; 24h / 72h after.",
  );

  if (!opts.returning) {
    addPage("per003", "SRO-CM-06 4.1 — sign-on information for a first joining.");
    addPage("dot", "SRO-CM-06 4.1 — SRO-PER-008 DOT release. Scan to the office after sign-on.");
    addPage("w4", "SRO-CM-06 4.1 — W-4 on a first joining.");
    addPage("i9", "SRO-CM-06 4.1 — I-9 on a first joining.");
    addPage("deposit", "SRO-CM-06 4.1 — direct deposit if they want pay in the bank. Name only; account stays blank.", false);
    notes.push("New to the vessel — full SRO-CM-06 4.1 packet.");
  } else {
    notes.push("Returning — SRO-CM-06 4.2. MMC, drug-free card, and medical certificate checked every time.");
    if (opts.identityChanged) {
      addPage("per003", "SRO-CM-06 4.2 — sign-on information only if anything changed.");
    } else {
      notes.push("Sign-on information (PER-003) skipped unless address, NOK, or tickets changed.");
    }
    if (opts.w4Needed) addPage("w4", "SRO-CM-06 4.2 — W-4 only if needed.");
    if (opts.depositChanged) addPage("deposit", "SRO-CM-06 4.2 — direct deposit only if they want a change. Account stays blank.", false);
  }

  if (opts.cyberExpired) addPage("cyber", "SMM-PER-05 — confirm / renew cyber training if it is not current.");
  if (opts.internetExpired) addPage("internet", "SMM-PER-05 — confirm / renew internet usage policy if it is not current.");

  if (union === "MMP") {
    if (opts.enroll401k) addExtra("mmp-401k-enroll", "SRO-CM-06 — 401(k) if desired. Contribution % left blank.");
    else addExtra("mmp-401k-optout", "MM&P opt-out is required each assignment if they are not enrolling.");
  } else if (union === "MEBA") {
    addExtra("meba-401k", "SRO-CM-06 — MEBA 401(k). Name and employer only; elections left blank unless they enroll.", false);
    addExtra("meba-ot", "MEBA vacation plan — converted OT worksheet, filed with vacation pay. Hours left blank.", false);
  } else if (union === "SIU") {
    addExtra("siu-401k", opts.enroll401k
      ? "SIU AGLIW Empower 401(k) — identity filled, elections blank."
      : "SIU AGLIW Empower 401(k) — decline checked; they can enroll later.");
  }

  addExtra("door-tag", "Cabin door nametag for the person joining only — not the rest of the crew.");
  if (needsSmsHazmat(opts.position) && (opts.hazmatExpired ?? true)) {
    addExtra(
      "hazmat-cert",
      "SMM-PER-06 H = 1 per vessel if carrying HAZMAT. Deck officers. Current company form cites 49 CFR 172.704 but does not record a test — print only if the 3-year card is missing or expired.",
    );
  }

  return { packetPages: pages, extras, forms, notes };
}

export type TicketRow = {
  code: string;
  label: string;
  expiresOn: string | null;
  tone: ReturnType<typeof expiryTone>;
  required: boolean;
  note?: string;
};

const TICKET_SPEC: Array<{ code: string; label: string; types: string[]; required: boolean; note?: string }> = [
  { code: "MMC", label: "Merchant Mariner Credential", types: ["mmc"], required: true, note: "SRO-CM-06 — check every joining." },
  { code: "MEDICAL", label: "Medical certificate", types: ["medical"], required: true, note: "SRO-CM-06 — check every joining." },
  { code: "DRUG_FREE", label: "Drug-free / chemical test", types: ["drug_free"], required: true, note: "SRO-CM-06 — check every joining." },
  { code: "PASSPORT", label: "Passport", types: ["passport"], required: true },
  { code: "TWIC", label: "TWIC", types: ["twic"], required: true },
  { code: "STCW", label: "STCW / Basic Training", types: ["stcw", "bst"], required: true },
  { code: "SASH", label: "SOCP SASH", types: ["sash"], required: true, note: "SMM-PER-05 — confirm / renew if required." },
  { code: "FAM", label: "Familiarization (NSE record)", types: ["fam"], required: true, note: "Checklist is still filled this joining even if last year’s card is current." },
  { code: "CYBER", label: "Cyber security", types: ["cyber"], required: true },
  { code: "INTERNET", label: "Internet usage", types: ["internet"], required: true },
  { code: "HAZMAT", label: "HAZMAT training", types: ["hazmat"], required: false, note: "SMM-PER-06 H for deck officers. 3-year 49 CFR 172.704 card. Do not auto-issue for the whole crew." },
];

export function ticketsForPerson(p: ParsedPerson): TicketRow[] {
  const docs = p.documents ?? [];
  return TICKET_SPEC.map((spec) => {
    const hits = spec.types
      .map((t) => docs.find((d) => d.docType === t))
      .filter((d): d is ParsedDocument => Boolean(d));
    let expiresOn = hits.map((d) => d.expiresOn).find(Boolean) ?? null;
    if (spec.code === "MMC" && !expiresOn) expiresOn = p.mmcExpiration;
    if (spec.code === "PASSPORT" && !expiresOn) expiresOn = p.passportExpiration;
    return {
      code: spec.code,
      label: spec.label,
      expiresOn,
      tone: expiryTone(expiresOn),
      required: spec.code === "HAZMAT" ? needsSmsHazmat(p.lastPosition) : spec.required,
      note: spec.note,
    };
  });
}

export function union401kLabel(union: UnionHall | null | undefined): string {
  const u = (union ?? "").toUpperCase();
  if (u === "MMP") return "MM&P 401(k)";
  if (u === "MEBA") return "MEBA 401(k)";
  if (u === "SIU") return "SIU Empower 401(k)";
  return "401(k)";
}

export function needsRenew(tone: ExpiryTone): boolean {
  return tone === "expired" || tone === "missing" || tone === "soon";
}

const DOOR_RANK_BY_CODE: Record<string, string> = {
  "00": "Captain",
  "01": "Chief Mate",
  "02": "Second Mate",
  "03": "Third Mate",
  "04": "Boatswain",
  "05": "AB Day 12 x 4",
  "06": "AB Day 4 x 8",
  "07": "AB watch 12 x 4",
  "08": "AB watch 4 x 8",
  "09": "AB watch 8 x 12",
  "10": "Chief Engineer",
  "11": "First Engineer",
  "12": "Second Engineer 4 x 8",
  "13": "Third Engineer 8 x 12",
  "14": "Third Engineer 12 x 4",
  "15": "Electrician",
  "16": "QMED 12 x 4",
  "17": "QMED 4 x 8",
  "18": "QMED 8 x 12",
  "19": "Deck Engine Utility",
  "20": "Steward",
  "21": "Cook",
  "22": "Steward Assistant",
  "24": "Second Engineer day",
  "25": "Deck Cadet",
  "26": "Engine Cadet",
  "27": "S.I.U. Apprentice - A",
  "28": "S.I.U. Apprentice - B",
};

/** Rank line on the cabin tag — matches the ship’s door-tag template. */
export function doorRank(
  billetCode?: string | null,
  position?: string | null,
  watch?: string | null,
): string {
  if (billetCode && DOOR_RANK_BY_CODE[billetCode]) return DOOR_RANK_BY_CODE[billetCode];
  const p = (position ?? "").toUpperCase().replace(/×/g, "X").replace(/\s+/g, " ").trim();
  const w = (watch ?? "").replace(/–/g, "-");
  if (/MASTER|\bCAPT/.test(p)) return "Captain";
  if (/CHIEF MATE|\bC\/M\b/.test(p)) return "Chief Mate";
  if (/SECOND MATE|\b2\/M\b/.test(p)) return "Second Mate";
  if (/THIRD MATE|\b3\/M\b/.test(p)) return "Third Mate";
  if (/BOATSWAIN|\bBOSUN\b/.test(p)) return "Boatswain";
  if (/AB\s*DAY|ABLE.*DAY/.test(p)) {
    if (w === "4-8") return "AB Day 4 x 8";
    return "AB Day 12 x 4";
  }
  if (/AB\/W|AB W|ABLE.*WATCH|\bAB\b/.test(p)) {
    if (w === "4-8") return "AB watch 4 x 8";
    if (w === "8-12") return "AB watch 8 x 12";
    return "AB watch 12 x 4";
  }
  if (/CHIEF ENG|\bC\/E\b/.test(p)) return "Chief Engineer";
  if (/1ST A|FIRST A|\b1A\/E\b/.test(p)) return "First Engineer";
  if (/2ND A|SECOND A|\b2A\/E\b|2 A\/E/.test(p)) {
    if (w === "day") return "Second Engineer day";
    return "Second Engineer 4 x 8";
  }
  if (/3RD A|THIRD A|\b3A\/E\b|3 A\/E/.test(p)) {
    if (w === "8-12") return "Third Engineer 8 x 12";
    return "Third Engineer 12 x 4";
  }
  if (/ELECTRIC|\bQEE\b/.test(p)) return "Electrician";
  if (/\bQMED\b/.test(p)) {
    if (w === "4-8") return "QMED 4 x 8";
    if (w === "8-12") return "QMED 8 x 12";
    return "QMED 12 x 4";
  }
  if (/\bDEU\b|DECK ENGINE/.test(p)) return "Deck Engine Utility";
  if (/STEWARD ASS/.test(p)) return "Steward Assistant";
  if (/\bSTEWARD\b/.test(p)) return "Steward";
  if (/\bCOOK\b/.test(p)) return "Cook";
  if (/DECK CADET/.test(p)) return "Deck Cadet";
  if (/ENGINE CADET|CADET ENG/.test(p)) return "Engine Cadet";
  if (/APPRENTICE A/.test(p)) return "S.I.U. Apprentice - A";
  if (/APPRENTICE B/.test(p)) return "S.I.U. Apprentice - B";
  return positionLabel(position);
}

