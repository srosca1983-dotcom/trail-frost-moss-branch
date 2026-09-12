import { isDeckOfficer, isElectrician, isLicensedOfficer } from "./ratings.ts";
import type { NseKind } from "./nse.ts";

/**
 * Live SMS training rules pulled from SMM-PER-06 Table 4.5 and SMM-SMM-08.
 * Sync compares these revs to the SMS app; if the book moves, the desk flags it.
 */
export const SMS_TRAINING = {
  per06: {
    id: "SMM-PER-06",
    title: "Training",
    rev: "3",
    date: "2025-09-11",
    url: "https://g2sms.grok.me/docs/SMM-PER-06",
  },
  smm08: {
    id: "SMM-SMM-08",
    title: "Cyber Security",
    rev: "3",
    date: "2026-07-31",
    url: "https://g2sms.grok.me/docs/SMM-SMM-08",
  },
  ap3: {
    id: "SMM-SMM-08-AP3",
    title: "Cyber Security Training",
    rev: "1",
    date: "2024-01-09",
    url: "https://g2sms.grok.me/docs/SMM-SMM-08-AP3",
  },
  ap4: {
    id: "SMM-SMM-08-AP4",
    title: "Internet Usage Policy",
    rev: "0",
    date: "2018-05-15",
    url: "https://g2sms.grok.me/docs/SMM-SMM-08-AP4",
  },
  per05: {
    id: "SMM-PER-05",
    title: "Familiarization",
    rev: "5",
    date: "2026-08-28",
    url: "https://g2sms.grok.me/docs/SMM-PER-05",
  },
} as const;

export const SMS_DOC_URLS = [
  SMS_TRAINING.per06.url,
  SMS_TRAINING.smm08.url,
  SMS_TRAINING.ap3.url,
  "https://g2sms.grok.me/manuals/sms",
] as const;

/** SMM-PER-06 legend: H = 1 per vessel if carrying HAZMAT. Deck officers only. */
export const HAZMAT_MARK =
  "H = 1 per vessel if carrying HAZMAT (SMM-PER-06 Table 4.5). Marked on Master / C/M / 2/M / 3/M. Not SMM-OPS-11.";

export const SMS_BOARD_NOTES = [
  "SMM-SMM-08 Rev 3 (31 Jul 2026) owns 33 CFR 101.650: Mod 1 all crew; Mod 2 and 3 all officers plus electrician.",
  "SMM-PER-06 Rev 3 (11 Sep 2025) still marks OT for everyone and key personnel only on deck officers. When they disagree, this desk follows SMM-SMM-08.",
  "SMM-SMM-08-AP3 remains the 1-year company form (calendar year, 7 days of joining). NSE tracks it as Mod 1.",
  HAZMAT_MARK,
  "49 CFR 172.704 still requires every hazmat employee to be trained and tested. SMS H is the company minimum, not a substitute for the HMR.",
] as const;

export type SmsProcCheck = {
  id: string;
  title: string;
  codedRev: string;
  codedDate: string;
  liveRev: string | null;
  liveDate: string | null;
  match: boolean | null;
  url: string;
};

export type SmsTrainingSnapshot = {
  status: string;
  checkedAt: string | null;
  procedures: SmsProcCheck[];
  notes: string[];
  found: string[];
};

export function codedProcedureChecks(): SmsProcCheck[] {
  return [SMS_TRAINING.per06, SMS_TRAINING.smm08].map((p) => ({
    id: p.id,
    title: p.title,
    codedRev: p.rev,
    codedDate: p.date,
    liveRev: null,
    liveDate: null,
    match: null,
    url: p.url,
  }));
}

export function emptySmsSnapshot(): SmsTrainingSnapshot {
  return {
    status: "not-checked",
    checkedAt: null,
    procedures: codedProcedureChecks(),
    notes: [...SMS_BOARD_NOTES],
    found: [],
  };
}

/**
 * SMM-SMM-08 Rev 3 (31 Jul 2026) is newer than PER-06's matrix and is the
 * owner/operator designation for 33 CFR 101.650:
 *   Mod 1 — all crew
 *   Mod 2 — all officers (plus electrician: OT maintenance / elevated access)
 *   Mod 3 — all officers (plus electrician: same third-party test in that procedure)
 */
export function needsSmsCyber(module: "awareness" | "ot" | "key", position: string | null | undefined): boolean {
  if (module === "awareness") return true;
  return isLicensedOfficer(position) || isElectrician(position);
}

export function needsSmsHazmat(position: string | null | undefined): boolean {
  return isDeckOfficer(position);
}

export function nseApplies(kind: NseKind, position: string | null | undefined): boolean {
  if (kind === "hazmat") return needsSmsHazmat(position);
  if (kind === "cyber_ot") return needsSmsCyber("ot", position);
  if (kind === "cyber_key") return needsSmsCyber("key", position);
  return true;
}

export function nseKindForCyber(module: "awareness" | "ot" | "key"): NseKind {
  if (module === "ot") return "cyber_ot";
  if (module === "key") return "cyber_key";
  return "cyber";
}

export function parseSmsRev(html: string): { rev: string | null; date: string | null; id: string | null } {
  const text = html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ");
  const id = text.match(/\b(SMM-[A-Z]+-\d+(?:-AP?\d+)?|SRO-[A-Z]+-\d+)\b/)?.[1] ?? null;
  const revs: string[] = [];
  for (const m of text.matchAll(/\bRev(?:ision)?\s*[:·]?\s*(\d+)\b/gi)) {
    const idx = m.index ?? 0;
    const around = text.slice(Math.max(0, idx - 24), idx + 28).toLowerCase();
    if (around.includes("guideline")) continue;
    revs.push(m[1]);
  }
  const rev = mostCommon(revs);
  const dateRaw =
    text.match(/\bDate\s+(\d{2}\/\d{2}\/\d{2})\b/)?.[1] ??
    text.match(/\b(\d{2}\/\d{2}\/\d{2})\s*Rev\b/)?.[1] ??
    null;
  let date: string | null = null;
  if (dateRaw) {
    const [mm, dd, yy] = dateRaw.split("/");
    const year = Number(yy) < 70 ? 2000 + Number(yy) : 1900 + Number(yy);
    date = `${year}-${mm}-${dd}`;
  }
  return { rev, date, id };
}

function mostCommon(values: string[]): string | null {
  if (!values.length) return null;
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

export function overlayLiveRev(coded: SmsProcCheck, html: string): SmsProcCheck {
  const live = parseSmsRev(html);
  const liveRev = live.rev;
  const liveDate = live.date;
  let match: boolean | null = null;
  if (liveRev) match = liveRev === coded.codedRev;
  return { ...coded, liveRev, liveDate, match };
}
