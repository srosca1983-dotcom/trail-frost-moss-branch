export { PERMANENT_CREW } from "./permanents";
import type { ExpiryTone, UnionHall } from "./types";
import type { SmsTrainingSnapshot } from "./sms-training";


export type NseKind = "sash" | "fam" | "cyber" | "cyber_ot" | "cyber_key" | "internet" | "hazmat";

export type NsePair = {
  issued: string;
  expires: string;
};

export const NSE_KINDS: NseKind[] = ["sash", "fam", "cyber", "cyber_ot", "cyber_key", "internet", "hazmat"];

export const NSE_SHORT: Record<NseKind, string> = {
  sash: "SOCP SASH",
  fam: "Familiarization",
  cyber: "M1 Aware",
  cyber_ot: "M2 OT",
  cyber_key: "M3 Key",
  internet: "Internet",
  hazmat: "HAZMAT",
};

export const NSE_LABELS: Record<NseKind, string> = {
  sash: "SOCP SASH (SMM-PER-06)",
  fam: "Familiarization (SMM-PER-05-AP1)",
  cyber: "Cyber awareness · 33 CFR 101.650(d)(1) / SMM-SMM-08 Mod 1",
  cyber_ot: "OT cyber · 33 CFR 101.650(d)(1)(v) / SMM-SMM-08 Mod 2",
  cyber_key: "Key personnel cyber · 33 CFR 101.650(d)(2) / SMM-SMM-08 Mod 3",
  internet: "Internet Usage (SMM-SMM-08-AP4)",
  hazmat: "HAZMAT (49 CFR 172.704 / SMM-PER-06)",
};

export const NSE_CODES: Record<NseKind, string> = {
  sash: "SMM-PER-06",
  fam: "SMM-PER-05-AP1",
  cyber: "SMM-SMM-08 M1",
  cyber_ot: "SMM-SMM-08 M2",
  cyber_key: "SMM-SMM-08 M3",
  internet: "SMM-SMM-08-AP4",
  hazmat: "SMM-PER-06 · 49 CFR",
};

/** Validity: SASH/fam/cyber annual per SMS; HAZMAT 3 years per 49 CFR 172.704(c)(2). */
export const NSE_VALIDITY_YEARS: Record<NseKind, number> = {
  sash: 1,
  fam: 1,
  cyber: 1,
  cyber_ot: 1,
  cyber_key: 1,
  internet: 1,
  hazmat: 3,
};

export const NSE_SOURCE = "NS5 Permanents sheet";

export type NseCertCell = {
  kind: NseKind;
  issued: string | null;
  expires: string | null;
  docId: string | null;
  tone: ExpiryTone;
  placeholder: boolean;
  required: boolean;
  score: number | null;
};

export type NseBoardRow = {
  crewId: string;
  sheetName: string;
  rating: string;
  onSheet: boolean;
  unionHall: UnionHall | string;
  status: string | null;
  fullName: string;
  covering: string | null;
  certs: Record<NseKind, NseCertCell>;
  expiredCount: number;
  watchCount: number;
  missingCount: number;
};

export type NseBoard = {
  rows: NseBoardRow[];
  expired: number;
  watch: number;
  missing: number;
  sms: SmsTrainingSnapshot;
};

export type PermanentCrewSeed = {
  id: string;
  sheetName: string;
  rating: string;
  unionHall: UnionHall;
  onSheet: boolean;
};

/** NSE training certificates from the NS5 Permanents sheet. Sabrina Brown was not listed. */
export const NSE_TRAINING: Record<string, Partial<Record<NseKind, NsePair>>> = {
  "seed-kluck": {
    sash: { issued: "2025-06-21", expires: "2026-06-21" },
    fam: { issued: "2025-06-02", expires: "2026-06-02" },
    cyber: { issued: "2026-05-04", expires: "2027-05-04" },
    internet: { issued: "2026-05-04", expires: "2027-05-04" },
    hazmat: { issued: "2024-06-11", expires: "2027-06-11" },
  },
  "seed-tuck": {
    sash: { issued: "2026-07-06", expires: "2027-07-06" },
    fam: { issued: "2025-12-01", expires: "2026-12-01" },
    cyber: { issued: "2026-03-09", expires: "2027-03-09" },
    internet: { issued: "2026-07-01", expires: "2027-07-01" },
    hazmat: { issued: "2024-04-02", expires: "2027-04-02" },
  },
  "seed-rosca": {
    sash: { issued: "2026-07-06", expires: "2027-07-06" },
    fam: { issued: "2026-07-01", expires: "2027-07-01" },
    cyber: { issued: "2026-07-01", expires: "2027-07-01" },
    internet: { issued: "2026-07-01", expires: "2027-07-01" },
    hazmat: { issued: "2023-11-14", expires: "2026-11-14" },
  },
  "seed-shahbin": {
    sash: { issued: "2026-07-29", expires: "2027-07-29" },
    fam: { issued: "2026-03-23", expires: "2027-03-23" },
    cyber: { issued: "2026-03-23", expires: "2027-03-23" },
    internet: { issued: "2025-11-17", expires: "2026-11-17" },
    hazmat: { issued: "2024-01-12", expires: "2027-01-12" },
  },
  "seed-tesson": {
    sash: { issued: "2024-01-14", expires: "2025-01-14" },
    fam: { issued: "2025-06-19", expires: "2026-06-19" },
    cyber: { issued: "2026-07-01", expires: "2027-07-01" },
    internet: { issued: "2025-06-19", expires: "2026-06-19" },
    hazmat: { issued: "2024-01-05", expires: "2027-01-05" },
  },
  "seed-navarrete": {
    sash: { issued: "2025-05-07", expires: "2026-05-07" },
    fam: { issued: "2022-06-28", expires: "2023-06-28" },
    cyber: { issued: "2023-10-23", expires: "2024-10-23" },
    internet: { issued: "2024-09-18", expires: "2025-09-18" },
    hazmat: { issued: "2019-08-20", expires: "2022-08-20" },
  },
  "seed-jensen": {
    sash: { issued: "2026-05-29", expires: "2027-05-29" },
    fam: { issued: "2026-07-01", expires: "2027-07-01" },
    cyber: { issued: "2026-07-01", expires: "2027-07-01" },
    internet: { issued: "2026-07-01", expires: "2027-07-01" },
    hazmat: { issued: "2025-04-16", expires: "2028-04-16" },
  },
  "seed-novak": {
    sash: { issued: "2026-07-26", expires: "2027-07-26" },
    fam: { issued: "2026-03-31", expires: "2027-03-31" },
    cyber: { issued: "2023-10-23", expires: "2024-10-23" },
    internet: { issued: "1990-01-01", expires: "1991-01-01" },
    hazmat: { issued: "2024-01-08", expires: "2027-01-08" },
  },
  "seed-albrecht": {
    sash: { issued: "2026-05-22", expires: "2027-05-22" },
    fam: { issued: "2026-05-12", expires: "2027-05-12" },
    cyber: { issued: "2026-05-12", expires: "2027-05-12" },
    internet: { issued: "2026-05-12", expires: "2027-05-12" },
    hazmat: { issued: "2024-01-08", expires: "2027-01-08" },
  },
  "seed-walkup": {
    sash: { issued: "2026-04-08", expires: "2027-04-08" },
    fam: { issued: "2025-03-03", expires: "2026-03-03" },
    cyber: { issued: "2025-03-03", expires: "2026-03-03" },
    internet: { issued: "2025-03-03", expires: "2026-03-03" },
    hazmat: { issued: "1990-01-01", expires: "1993-01-01" },
  },
  "seed-gupta": {
    sash: { issued: "2025-01-15", expires: "2026-01-15" },
    fam: { issued: "2025-06-19", expires: "2026-06-19" },
    cyber: { issued: "2025-01-24", expires: "2026-01-24" },
    internet: { issued: "2025-01-24", expires: "2026-01-24" },
    hazmat: { issued: "2024-01-05", expires: "2027-01-05" },
  },
  "seed-huyett": {
    sash: { issued: "2026-08-07", expires: "2027-08-07" },
    fam: { issued: "2025-03-18", expires: "2026-03-18" },
    cyber: { issued: "2025-03-18", expires: "2026-03-18" },
    internet: { issued: "2025-03-18", expires: "2026-03-18" },
    hazmat: { issued: "2024-11-15", expires: "2027-11-15" },
  },
};

export function isNsePlaceholder(issued: string | null | undefined): boolean {
  return Boolean(issued?.startsWith("1990"));
}

export function nseDocuments(id: string): Array<{
  docType: NseKind;
  label: string;
  issuedOn: string;
  expiresOn: string;
  docNumber: string | null;
  notes: string;
}> {
  const row = NSE_TRAINING[id];
  if (!row) return [];
  return (Object.keys(row) as NseKind[]).flatMap((k) => {
    const pair = row[k];
    if (!pair) return [];
    const placeholder = isNsePlaceholder(pair.issued);
    return [
      {
        docType: k,
        label: NSE_LABELS[k],
        issuedOn: pair.issued,
        expiresOn: pair.expires,
        docNumber: null as string | null,
        notes: placeholder ? "NS5 placeholder date — confirm original issue." : NSE_SOURCE,
      },
    ];
  });
}
