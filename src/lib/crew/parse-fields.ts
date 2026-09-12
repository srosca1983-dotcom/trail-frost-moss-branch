import { addYears, credentialExpiryIso, laterExpiry, toIsoDate } from "./dates.ts";
import { emptyPerson } from "./merge.ts";
import type { ParsedPerson, SiuClass } from "./types.ts";

export function parseSiuClass(text: string | null | undefined): SiuClass | null {
  if (!text) return null;
  const t = text.replace(/\s+/g, " ");
  const patterns = [
    /seniority\s*[:.]?\s*([ABC])\b/i,
    /registration group\s*[:.]?\s*([ABC])\b/i,
    /siu class\s*([ABC])\b/i,
    /\bclass\s*[:.]?\s*([ABC])\b/i,
  ];
  for (const p of patterns) {
    const m = p.exec(t);
    if (m) return m[1].toUpperCase() as SiuClass;
  }
  return null;
}

export function parseDrugFreeDate(text: string | null | undefined): string | null {
  if (!text) return null;
  const t = text.replace(/\s+/g, " ");
  const m =
    /(?:meets random exception regulations through|drug[- ]free through|chemical[- ]test through)\s*[:.]?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i.exec(
      t,
    );
  return m ? toIsoDate(m[1]) : null;
}

const FILENAME_JUNK =
  /^(sash|socp|certificate|cert|certs|certificates|crew|batch|scan|scn|scanned|screenshot|copy|signed|svo|smm|per|training|awareness|sexual|assault|harassment|pdf|img|image|photo|pic|page|packet|ticket|ns5|the|and|for|of|doc|docs|document|documents|file|files|id|sign|on|information|george|sunrise|vessel|operations|llc|mv|sro|mmc|twic|pp|passport|med|medical|cred|credential|exp|expires|expiration|steward|elec|electrician|qmed|qee|qe|abw|abd|abe|abm|ab|os|osa|sa|cook|master|mate|cadet|apprentice|app|wiper|bosun|oiler|pumpman|chief|engineer|assistant|second|third|rating|gude|ii|iii|iv|relief|1st|2nd|3rd|1ae|2ae|3ae|1m|2m|3m|cm|ae|jpg|jpeg|png|heic|tif|tiff|final|revised|updated|original|cyber|security|mtsa|otsa|ot|clearance|dispatch|shipping|drug|test|dot|member|male|female|sex|day|w|hall|union|siu|mmp|meba|nse|quiz|enrollment|participant|converted|nametag|door|clinic|shbp|vaccination|record|card|covid)$/i;

const FILENAME_RATING = /^(?:\d+[a-z]{1,3}|c\/m|c\/e|1\/ae|2\/ae|3\/ae|1\/m|2\/m|3\/m)$/i;

export function isFilenameNoise(s: string | null | undefined): boolean {
  const t = (s ?? "").trim();
  if (!t) return false;
  return FILENAME_JUNK.test(t) || FILENAME_RATING.test(t);
}

function titleCaseName(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[._]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** "SASH_Rosca.pdf" / "Kluck, Brian SASH cert.pdf" → a name we can match. Filename is a hint, not the identity. */
export function nameFromFilename(filename: string | null | undefined): {
  fullName: string;
  firstName: string | null;
  lastName: string | null;
} | null {
  if (!filename) return null;
  const base = filename.replace(/\.[^.]+$/, "").replace(/\s*[·#].*$/, "");
  const comma = /([A-Za-z][A-Za-z'.-]*)\s*,\s*([A-Za-z][A-Za-z'.-]*)/.exec(base);
  if (comma && !isFilenameNoise(comma[1]) && !isFilenameNoise(comma[2])) {
    const last = titleCaseName(comma[1]);
    const first = titleCaseName(comma[2]);
    return { lastName: last, firstName: first, fullName: `${first} ${last}` };
  }
  const parts = base
    .split(/[\s,_-]+/)
    .map((p) => p.trim().replace(/\.+$/, ""))
    .filter(
      (p) =>
        p &&
        !FILENAME_JUNK.test(p) &&
        !FILENAME_RATING.test(p) &&
        !/^\d+$/.test(p) &&
        !/^[\d.]+$/.test(p) &&
        !/^[ivx]+$/i.test(p),
    );
  if (!parts.length) return null;
  if (parts.length === 1) {
    if (parts[0].length < 2) return null;
    const last = titleCaseName(parts[0]);
    return { lastName: last, firstName: null, fullName: last };
  }
  if (parts.length >= 3 && parts[0].length >= 3 && parts[0].length <= 4 && parts[0] === parts[0].toUpperCase()) {
    const first = titleCaseName(parts[parts.length - 2]);
    const last = titleCaseName(parts[parts.length - 1]);
    return { firstName: first, lastName: last, fullName: `${first} ${last}` };
  }
  const first = titleCaseName(parts[0]);
  const last = titleCaseName(parts[parts.length - 1]);
  return { firstName: first, lastName: last, fullName: `${first} ${last}` };
}

/** "Cooper, Zaid MMC exp 5-23-2028.pdf" / "Flynn, Thomas Passport expires 11-29-2028.pdf" */
export function ticketsFromFilename(filename: string | null | undefined): {
  mmcExpiration: string | null;
  passportExpiration: string | null;
} {
  const base = filename ?? "";
  const mmc = /\bmmc\b[\s._-]*exp(?:ires|iration)?[\s._-]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i.exec(base);
  const pp = /(?:\bpp\b|passport)[\s._-]*exp(?:ires|iration)?[\s._-]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i.exec(base);
  return {
    mmcExpiration: mmc ? packetDate(mmc[1]) : null,
    passportExpiration: pp ? packetDate(pp[1]) : null,
  };
}

export function looksLikeSash(text: string | null | undefined, filename = ""): boolean {
  return /sash|sexual assault|sexual harassment|svo-smm-03|socp/.test(`${filename} ${text ?? ""}`.toLowerCase());
}

/** Stacked SASH scans split per page. A sign-on packet / DOCS PDF stays one file. */
export function shouldSplitPacket(filename: string, pageCount: number, sashPages: number) {
  if (pageCount < 2 || sashPages < 2) return false;
  if (/\b(packet|docs?|documents?)\b/i.test(filename)) return false;
  return true;
}

/** Completion / issued date on an SOCP SASH certificate. */
export function parseSashIssued(text: string | null | undefined): string | null {
  if (!text) return null;
  const patterns = [
    /completed(?:\s+on)?\s*[:.]?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i,
    /date(?:\s+of\s+(?:training|completion|issue))?\s*[:.]?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i,
    /issued(?:\s+on)?\s*[:.]?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i,
    /(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/,
    /((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4})/i,
  ];
  for (const p of patterns) {
    const m = p.exec(text);
    if (m) return toIsoDate(m[1]);
  }
  return null;
}

function emptyTour(): NonNullable<ParsedPerson["tour"]> {
  return {
    vessel: null,
    position: null,
    signOn: null,
    signOff: null,
    port: null,
    relieving: null,
    assignmentType: null,
    lengthDays: null,
    dispatchRef: null,
    unionHall: null,
    watch: null,
    billetCode: null,
    seniorityClass: null,
    dueOff: null,
  };
}

const NAME_STOP =
  /^(book|no|number|seniority|rating|ssn|ss|dob|date|vessel|position|sex|male|female|address|city|state|zip|phone|email|credential|passport|mmc|twic|signed|signature|print|nationality|nationalite|gandee|member)$/i;

function tokenLooksLikeName(t: string): boolean {
  const w = t.replace(/[.]/g, "");
  if (w.length === 1) return /[A-Za-z]/.test(w);
  if (!/^[A-Za-z][A-Za-z'.-]*$/.test(t)) return false;
  if (NAME_STOP.test(w) || isFilenameNoise(w)) return false;
  if (w.length >= 3 && !/[aeiouy]/i.test(w)) return false;
  return true;
}

function looksLikePersonName(first: string | null | undefined, last: string | null | undefined): boolean {
  if (!last || last.length < 2) return false;
  if (!tokenLooksLikeName(last)) return false;
  if (first && !tokenLooksLikeName(first)) return false;
  if (first && first.toLowerCase() === last.toLowerCase()) return false;
  return true;
}

function familyAgrees(aRaw: string | null | undefined, bRaw: string | null | undefined): boolean {
  const a = (aRaw ?? "").toLowerCase().replace(/[^a-z]/g, "");
  const b = (bRaw ?? "").toLowerCase().replace(/[^a-z]/g, "");
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.length >= 4 && b.includes(a)) return true;
  if (b.length >= 4 && a.includes(b)) return true;
  return false;
}

/** Overlay local regex on LLM output so a scanned 86-067 still stamps class and drug-free. */
export function overlayParsedFields(person: ParsedPerson, text: string | null | undefined, filename?: string): ParsedPerson {
  const blob = text ?? "";
  const cls = parseSiuClass(blob);
  const drug = parseDrugFreeDate(blob);
  const sash = looksLikeSash(blob, filename);
  const sashIssued = sash ? parseSashIssued(blob) : null;
  const fromFile = nameFromFilename(filename);
  const fileTickets = ticketsFromFilename(filename);
  if (!cls && !drug && !sash && !fromFile && !fileTickets.mmcExpiration && !fileTickets.passportExpiration) {
    return fillNameParts(person);
  }

  const next: ParsedPerson = {
    ...person,
    documents: person.documents.map((d) => ({ ...d })),
    formsFound: person.formsFound.map((f) => ({ ...f })),
    tour: person.tour ? { ...person.tour } : null,
  };

  const packetNamed = looksLikePersonName(next.firstName, next.lastName);
  if (fromFile) {
    const clash = packetNamed && fromFile.lastName && next.lastName && !familyAgrees(next.lastName, fromFile.lastName);
    if (!packetNamed || clash) {
      if (fromFile.lastName && fromFile.firstName) {
        next.lastName = fromFile.lastName;
        next.firstName = fromFile.firstName;
        next.fullName = fromFile.fullName;
      } else if (fromFile.lastName && !fromFile.firstName) {
        if (!next.lastName || clash || !looksLikePersonName(next.firstName, next.lastName)) next.lastName = fromFile.lastName;
        if (!next.fullName || next.fullName === "Unknown" || clash) {
          next.fullName = next.firstName && !clash ? `${next.firstName} ${fromFile.lastName}` : fromFile.lastName;
        }
      } else {
        if (!next.lastName) next.lastName = fromFile.lastName;
        if (!next.firstName) next.firstName = fromFile.firstName;
        if (!next.fullName || next.fullName === "Unknown") next.fullName = fromFile.fullName;
      }
    }
  }

  if (cls) {
    if (!next.tour) next.tour = emptyTour();
    next.tour.seniorityClass = cls;
    if (!next.tour.unionHall) next.tour.unionHall = "SIU";
  }

  if (drug) {
    const existing = next.documents.find((d) => d.docType === "drug_free");
    if (existing) existing.expiresOn = drug;
    else {
      next.documents.push({
        docType: "drug_free",
        label: "Drug-free / random exception",
        docNumber: null,
        issuedOn: null,
        expiresOn: drug,
        notes: "86-067 random exception",
      });
    }
  }

  if (sash) {
    const expires = sashIssued ? addYears(sashIssued, 1) : null;
    const existing = next.documents.find((d) => d.docType === "sash");
    if (existing) {
      if (sashIssued) existing.issuedOn = sashIssued;
      if (expires) existing.expiresOn = expires;
    } else {
      next.documents.push({
        docType: "sash",
        label: "SOCP SASH",
        docNumber: null,
        issuedOn: sashIssued,
        expiresOn: expires,
        notes: "Ship Operations Cooperative Program",
      });
    }
    if (!next.formsFound.some((f) => /sash/i.test(f.code) || /sash/i.test(f.label))) {
      next.formsFound = [...next.formsFound, { code: "SASH", label: "SASH course", completedOn: sashIssued }];
    }
  }

  if (fileTickets.mmcExpiration) stampDoc(next, "mmc", "MMC", null, null, fileTickets.mmcExpiration);
  if (fileTickets.passportExpiration) stampDoc(next, "passport", "US Passport", null, null, fileTickets.passportExpiration);

  return fillNameParts(next);
}

/** Split "Rosca, Sorin" / "Sorin Rosca" so later tickets can match the file. */
export function fillNameParts(person: ParsedPerson): ParsedPerson {
  let first = (person.firstName ?? "").trim() || null;
  let last = (person.lastName ?? "").trim() || null;
  let full = (person.fullName ?? "").trim();
  if (/^unknown$/i.test(full)) full = "";
  if (!last || !first) {
    if (full.includes(",")) {
      const [l, rest] = full.split(",", 2);
      last = last || l.trim() || null;
      first = first || rest.trim().split(/\s+/).filter(Boolean)[0] || null;
    } else if (full) {
      const parts = full.split(/\s+/).filter(Boolean);
      if (parts.length === 1) last = last || parts[0];
      else if (parts.length >= 2) {
        first = first || parts[0];
        last = last || parts[parts.length - 1];
      }
    }
  }
  if (!full && (first || last)) full = [first, last].filter(Boolean).join(" ");
  if (!full && !last && !first) return person;
  const tidy = (s: string | null) => {
    if (!s) return s;
    const t = s.trim();
    if (t.length > 1 && t === t.toUpperCase() && /[A-Z]/.test(t)) return titleCaseName(t);
    return t;
  };
  first = tidy(first);
  last = tidy(last);
  if (last && isFilenameNoise(last) && first && !isFilenameNoise(first)) {
    last = first;
    first = null;
  } else if (first && isFilenameNoise(first) && last && !isFilenameNoise(last)) {
    first = null;
  }
  full = tidy([first, last].filter(Boolean).join(" ")) || tidy(full) || full;
  return { ...person, firstName: first, lastName: last, fullName: full || person.fullName };
}

const JUNK_PERSON = /^(unknown|certificate|cert|sash|socp|page|scan|scn|training|crew|mariner|security|dispatch|clearance|shipping|test|drug)$/i;

export function usableTicketName(person: ParsedPerson): boolean {
  const p = fillNameParts(person);
  const last = (p.lastName ?? "").trim();
  const first = (p.firstName ?? "").trim();
  const full = (p.fullName ?? "").trim();
  if (JUNK_PERSON.test(last) || JUNK_PERSON.test(full) || JUNK_PERSON.test(first)) return false;
  if (isFilenameNoise(last) || isFilenameNoise(first)) return false;
  if (!looksLikePersonName(first || null, last)) return false;
  if (last.length < 2) return false;
  if (first && first.toLowerCase() === last.toLowerCase()) return false;
  if (first) {
    if (first.length === 1 && /[A-Za-z]/.test(first)) return true;
    return first.length >= 2;
  }
  return last.length >= 3;
}

/** True when the PDF text already prints the mariner’s first and last name. Handwritten packets fail this. */
export function textHasReadableName(text: string | null | undefined, filename = ""): boolean {
  const t = (text ?? "").toLowerCase();
  const fromFile = nameFromFilename(filename);
  if (fromFile?.lastName && fromFile.firstName) {
    const last = fromFile.lastName.toLowerCase();
    const first = fromFile.firstName.toLowerCase();
    if (last.length >= 2 && first.length >= 2 && t.includes(last) && t.includes(first)) return true;
  }
  return /(?:full\s*name|seaman'?s\s+name|name of trainee|employee name)\s*[:.]?\s*[A-Za-z][A-Za-z'.-]+\s+[A-Za-z][A-Za-z'.-]+/.test(
    text ?? "",
  );
}

/** Typed SRO packets have real sentences. Scans dump CID glyphs — those still need the page image. */
export function textLooksTyped(text: string | null | undefined): boolean {
  const t = (text ?? "").replace(/\s+/g, " ").trim();
  if (t.length < 80) return false;
  const letters = (t.match(/[A-Za-z]/g) ?? []).length;
  if (letters / t.length < 0.55) return false;
  const words = t.split(" ").filter((w) => /[A-Za-z]{3,}/.test(w));
  return words.length >= 12;
}

function pageLooksLikeScan(text: string | null | undefined): boolean {
  const raw = text ?? "";
  const compact = raw.replace(/\s+/g, "");
  if (compact.length < 80) return true;
  return !textLooksTyped(raw);
}

/** Score a PDF page so we read I-9 / medical / MMC instead of the first eight form sheets. */
export function pageReadScore(text: string | null | undefined, filename = ""): number {
  const raw = text ?? "";
  const t = raw.toLowerCase();
  let s = 0;
  if (/form\s*i-?9|employment eligibility|uscis/.test(t)) s += 8;
  if (/medical certificate|seafarer name|coast guard/.test(t)) s += 8;
  if (/\bmmc\b|merchant mariner|twic|passport no|passport number|passport #/.test(t)) s += 6;
  if (/sign on information|personal\s*&\s*document/.test(t)) s += 9;
  if (/fitness for duty|86-067|clinic drug/.test(t)) s += 8;
  if (/hazardous materials training|49 cfr 172/.test(t)) s += 5;
  const fromFile = nameFromFilename(filename);
  if (fromFile?.lastName && t.includes(fromFile.lastName.toLowerCase())) s += 10;
  if (fromFile?.firstName && t.includes(fromFile.firstName.toLowerCase())) s += 5;
  const compact = raw.replace(/\s+/g, "");
  if (compact.length < 30) s += 5;
  else if (compact.length < 80) s += 2;
  if (raw.length > 1200 && /sunrise operations/.test(t)) {
    const named = Boolean(fromFile?.lastName && t.includes(fromFile.lastName.toLowerCase()));
    if (!named) s -= 4;
  }
  return s;
}

export function pickPacketImagePages(pages: { text?: string }[], filename = "", max = 4): number[] {
  if (!pages.length || max <= 0) return [];
  const n = pages.length;
  const scored = pages.map((p, i) => {
    const text = p.text ?? "";
    const compact = text.replace(/\s+/g, "").length;
    const scan = pageLooksLikeScan(text);
    let score = pageReadScore(text, filename);
    if (i === 0) score += 4;
    if (i >= n - 2) score += 6;
    if (scan && compact < 40) score += 10;
    else if (scan && compact < 80) score += 6;
    if (n >= 12 && i >= Math.floor(n * 0.35) && i <= Math.floor(n * 0.7) && scan && compact < 80) score += 8;
    return { i, score, scan, compact };
  });
  const photoOnly = scored.every((p) => p.scan);
  if (photoOnly) {
    if (n <= max) return pages.map((_, i) => i);
    const out = new Set<number>([0]);
    if (n > 1) out.add(n - 1);
    if (n >= 8) {
      for (const i of [9, 10, 11, Math.floor(n * 0.55), n - 2, n - 3]) {
        if (i > 0 && i < n) out.add(i);
        if (out.size >= max) break;
      }
    }
    const rest = [...scored]
      .filter((p) => !out.has(p.i))
      .sort((a, b) => a.compact - b.compact || b.score - a.score || a.i - b.i);
    for (const p of rest) {
      if (out.size >= max) break;
      out.add(p.i);
    }
    return [...out].sort((a, b) => a - b);
  }
  const hasTypedName = pages.some((p) => textLooksTyped(p.text) && textHasReadableName(p.text, filename));
  const out = new Set<number>();
  if (!hasTypedName) out.add(0);
  const ranked = [...scored].sort((a, b) => b.score - a.score || a.i - b.i);
  for (const p of ranked) {
    if (out.size >= max) break;
    if (p.score >= 4 || (p.scan && p.compact < 80)) out.add(p.i);
  }
  if (!hasTypedName) {
    for (let i = n - 1; i >= 0 && out.size < max; i -= 1) out.add(i);
  }
  return [...out].sort((a, b) => a - b);
}

export function pickPacketTextPages(pages: { text?: string }[], filename = "", max = 6): number[] {
  return pages
    .map((p, i) => ({ i, score: pageReadScore(p.text, filename), len: (p.text ?? "").trim().length }))
    .filter((p) => p.len > 40)
    .sort((a, b) => b.score - a.score || b.len - a.len)
    .slice(0, max)
    .map((p) => p.i)
    .sort((a, b) => a - b);
}

const MONTH_NUM: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

/** US 12/18/1971, ISO, or MMC-style 13-JUN-2023. */
export function packetDate(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const t = raw.trim();
  const iso = toIsoDate(t);
  if (iso) return iso;
  const dmy = /^(\d{1,2})[-\s]([A-Za-z]{3,9})[-\s.,]*(\d{4})$/.exec(t);
  if (dmy) {
    const m = MONTH_NUM[dmy[2].slice(0, 3).toLowerCase()];
    if (m) return `${dmy[3]}-${String(m).padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
  }
  const mdy = /^([A-Za-z]{3,9})\s+(\d{1,2}),?\s+(\d{4})$/.exec(t);
  if (mdy) {
    const m = MONTH_NUM[mdy[1].slice(0, 3).toLowerCase()];
    if (m) return `${mdy[3]}-${String(m).padStart(2, "0")}-${mdy[2].padStart(2, "0")}`;
  }
  return null;
}

const PACKET_FORM_HINTS: { code: string; label: string; re: RegExp }[] = [
  { code: "SRO-PER-003", label: "Sign on Information", re: /sro-per-003/i },
  { code: "SRO-PER-002", label: "Acknowledgement / Notice of SRO Policies", re: /sro-per-002/i },
  { code: "SRO-PER-001", label: "Seaman's Statement of Physical Condition", re: /sro-per-001/i },
  { code: "SMM-PER-05-A2", label: "Medical Sign-On", re: /smm-per-05-a?p?2/i },
  { code: "SRO-PER-008", label: "DOT Drug & Alcohol Release (49 CFR 40)", re: /sro-per-008/i },
  { code: "W-4", label: "Federal W-4", re: /\bform\s*w-?4\b|\bfederal\s+w-?4\b/i },
  { code: "I-9", label: "Form I-9 Employment Eligibility", re: /\bform\s*i-?9\b|employment eligibility verification/i },
  { code: "SRO-PAY-002", label: "Direct Deposit Authorization", re: /sro-pay-002/i },
  { code: "SMM-PER-05-A1", label: "Familiarization Check List", re: /smm-per-05-a?p?1/i },
  { code: "SMM-SMM-08-A3", label: "Cyber Security Training", re: /smm-smm-08-a?p?3/i },
  { code: "SMM-SMM-08-A4", label: "Internet Usage Policy", re: /smm-smm-08-a?p?4/i },
];

function stampDoc(
  person: ParsedPerson,
  docType: string,
  label: string,
  number?: string | null,
  issued?: string | null,
  expires?: string | null,
) {
  const existing = person.documents.find((d) => d.docType === docType);
  if (existing) {
    if (number && !existing.docNumber) existing.docNumber = number;
    if (issued && !existing.issuedOn) existing.issuedOn = issued;
    if (expires) existing.expiresOn = laterExpiry(existing.expiresOn, expires);
    return;
  }
  person.documents.push({
    docType,
    label,
    docNumber: number ?? null,
    issuedOn: issued ?? null,
    expiresOn: expires ?? null,
    notes: null,
  });
}

function applyLabeledName(person: ParsedPerson, raw: string, filename: string) {
  const stop = raw
    .replace(/,/g, " ")
    .replace(/\b(sr|jr|ii|iii|iv)\.?\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  const parts = stop.split(/\s+/).filter((w) => w && !NAME_STOP.test(w) && !isFilenameNoise(w) && tokenLooksLikeName(w));
  if (parts.length < 2 && !(parts.length === 1 && parts[0].length >= 3)) return;
  const first = parts.length >= 2 ? parts[0] : null;
  const last = parts[parts.length - 1];
  if (!looksLikePersonName(first, last)) return;
  const fromFile = nameFromFilename(filename);
  if (fromFile?.lastName && !familyAgrees(last, fromFile.lastName)) return;
  person.firstName = first;
  person.lastName = last;
  person.fullName = parts.join(" ");
  if (parts.length >= 3) person.middleName = parts.slice(1, -1).join(" ");
}

/**
 * Pull name / MMC / passport / dates from typed PDF text with no API call.
 * Photo-only scans return an empty person (filename overlay still runs).
 */
export function extractPersonFromText(text: string | null | undefined, filename = ""): ParsedPerson {
  const p = emptyPerson();
  const blob = (text ?? "").replace(/\s+/g, " ").trim();

  const lastFirst =
    /(?:full\s*name|seaman'?s\s+name|employee\s+name|member name|seafarer name|name of trainee)\s*[:.]\s*([A-Za-z][A-Za-z'.-]{1,24})\s*,\s*([A-Za-z][A-Za-z'.-]{1,24}(?:\s+[A-Za-z][A-Za-z'.-]{1,24})?)/i.exec(
      blob,
    );
  if (lastFirst) {
    applyLabeledName(p, `${lastFirst[2]} ${lastFirst[1]}`, filename);
  }
  if (!looksLikePersonName(p.firstName, p.lastName)) {
    const fwd =
      /(?:full\s*name|seaman'?s\s+name|employee\s+name|member name|seafarer name|name of trainee)\s*[:.]\s*([A-Za-z][A-Za-z'.-]{1,24}(?:[\s,]+[A-Za-z][A-Za-z'.-]{1,24}){0,3})/i.exec(
        blob,
      ) || /\bName\s*[:.]\s*([A-Z][A-Za-z'.-]{1,24}(?:\s+[A-Z][A-Za-z'.-]{1,24}){0,3})/.exec(blob);
    if (fwd) applyLabeledName(p, fwd[1], filename);
  }

  const mmc =
    /(?:\bmmc\b|\bmerchant mariner\b|\bref(?:erence)?\s*(?:no\.?|number|#))\D{0,24}(\d{6,9})\b/i.exec(blob);
  if (mmc) p.mmcNumber = mmc[1];
  const mmcExp =
    /(?:mmc|merchant mariner)[\s\S]{0,90}?(?:expir(?:es|ation|y)|valid (?:through|until))\s*[:.#]?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{1,2}[- ][A-Za-z]{3,9}[- ]\d{4}|[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4})/i.exec(
      blob,
    );
  if (mmcExp) p.mmcExpiration = packetDate(mmcExp[1]);

  const pp = /passport(?:\s*(?:no\.?|number|#))?\s*[:.#]?\s*([A-Z]\d{8,9}|\d{9})\b/i.exec(blob);
  if (pp) p.passportNumber = pp[1];
  const ppExp =
    /passport[\s\S]{0,90}?(?:expir(?:es|ation|y)|valid (?:through|until))\s*[:.#]?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{1,2}[- ][A-Za-z]{3,9}[- ]\d{4}|[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4})/i.exec(
      blob,
    );
  if (ppExp) p.passportExpiration = packetDate(ppExp[1]);

  const twic =
    /twic[\s\S]{0,80}?(?:expir(?:es|ation|y)|valid (?:through|until))?\s*[:.#]?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{1,2}[- ][A-Za-z]{3,9}[- ]\d{4})/i.exec(
      blob,
    );
  const twicDate = twic ? packetDate(twic[1]) : null;

  const dob =
    /(?:date of birth|\bdob\b|born)\s*[:.#]?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{1,2}[- ][A-Za-z]{3,9}[- ]\d{4}|[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4})/i.exec(
      blob,
    );
  if (dob) p.dob = packetDate(dob[1]);

  const email = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.exec(blob);
  if (email && !/seafarers\.org|sunrise|sro[-.]|uscg\.mil|dhs\.gov|uscis|questdiagnostics/i.test(email[0])) {
    p.email = email[0];
  }

  const cell =
    /(?:cell|mobile|home\s*phone)\s*[:.#]?\s*((?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/i.exec(blob);
  if (cell) p.cellPhone = cell[1];

  if (p.mmcNumber) stampDoc(p, "mmc", "MMC", p.mmcNumber, null, p.mmcExpiration);
  if (p.passportNumber) stampDoc(p, "passport", "US Passport", p.passportNumber, null, p.passportExpiration);
  if (twicDate) stampDoc(p, "twic", "TWIC", null, null, twicDate);

  for (const f of PACKET_FORM_HINTS) {
    if (f.re.test(blob) && !p.formsFound.some((x) => x.code === f.code)) {
      p.formsFound.push({ code: f.code, label: f.label, completedOn: null });
    }
  }

  return fixCredentialDates(overlayParsedFields(fillNameParts(p), blob, filename));
}

export function ticketsLookComplete(p: ParsedPerson | null | undefined): boolean {
  if (!p) return false;
  const hasName = Boolean((p.lastName && p.firstName) || (p.fullName && p.fullName !== "Unknown"));
  const hasMmc = Boolean(p.mmcNumber || p.documents.some((d) => d.docType === "mmc" && (d.docNumber || d.expiresOn)));
  const hasPp = Boolean(
    p.passportNumber || p.documents.some((d) => d.docType === "passport" && (d.docNumber || d.expiresOn)),
  );
  return hasName && hasMmc && hasPp;
}

/**
 * Credential cards print Issue Date and Expiration Date side by side.
 * If the reader copies one date into both fields, or swaps them, fix it.
 * MMC 5 years, passport 10, medical 2, TWIC 5.
 */
export function fixCredentialDates(person: ParsedPerson): ParsedPerson {
  const next: ParsedPerson = {
    ...person,
    documents: person.documents.map((d) => ({ ...d })),
  };
  next.mmcExpiration = credentialExpiryIso(next.mmcExpiration) ?? next.mmcExpiration;
  next.passportExpiration = credentialExpiryIso(next.passportExpiration) ?? next.passportExpiration;
  for (const d of next.documents) {
    d.expiresOn = credentialExpiryIso(d.expiresOn) ?? d.expiresOn;
    d.issuedOn = toIsoDate(d.issuedOn) ?? d.issuedOn;
  }

  const asOf = new Date().toISOString().slice(0, 10);
  const yearsFor: Record<string, number> = { mmc: 5, passport: 10, medical: 2, twic: 5 };

  function pair(
    issuedRaw: string | null | undefined,
    expRaw: string | null | undefined,
    years: number,
  ): { issued: string | null; exp: string | null } {
    let issued = toIsoDate(issuedRaw) ?? issuedRaw ?? null;
    let exp = credentialExpiryIso(expRaw) ?? toIsoDate(expRaw) ?? expRaw ?? null;
    if (issued && exp && exp < issued) {
      const swap = issued;
      issued = exp;
      exp = swap;
    }
    if (issued && exp && issued === exp) {
      if (issued < asOf) exp = addYears(issued, years);
      else issued = addYears(exp, -years);
    }
    return { issued: issued ?? null, exp: exp ?? null };
  }

  const mmc = next.documents.find((d) => d.docType === "mmc");
  const mmcPair = pair(mmc?.issuedOn, laterExpiry(next.mmcExpiration, mmc?.expiresOn), yearsFor.mmc);
  if (mmc) {
    if (mmcPair.issued) mmc.issuedOn = mmcPair.issued;
    if (mmcPair.exp) mmc.expiresOn = mmcPair.exp;
  }
  if (mmcPair.exp) next.mmcExpiration = mmcPair.exp;

  const pp = next.documents.find((d) => d.docType === "passport");
  const ppPair = pair(pp?.issuedOn, laterExpiry(next.passportExpiration, pp?.expiresOn), yearsFor.passport);
  if (pp) {
    if (ppPair.issued) pp.issuedOn = ppPair.issued;
    if (ppPair.exp) pp.expiresOn = ppPair.exp;
  }
  if (ppPair.exp) next.passportExpiration = ppPair.exp;

  for (const d of next.documents) {
    if (d.docType === "mmc" || d.docType === "passport") continue;
    const years = yearsFor[d.docType];
    if (!years) continue;
    const fixed = pair(d.issuedOn, d.expiresOn, years);
    if (fixed.issued) d.issuedOn = fixed.issued;
    if (fixed.exp) d.expiresOn = fixed.exp;
  }
  return next;
}
