import type { ExpiryTone } from "./types";

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

/** 30 → 2030, 85 → 1985. Four-digit years pass through. */
export function expandYear(year: number): number {
  if (year < 100) return year >= 70 ? 1900 + year : 2000 + year;
  return year;
}

function utcYmd(year: number, month: number, day: number): Date | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const d = new Date(Date.UTC(year, month - 1, day));
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) return null;
  return d;
}

export function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const v = value.trim();
  if (!v) return null;

  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (iso) return utcYmd(Number(iso[1]), Number(iso[2]), Number(iso[3]));

  const numeric = /^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/.exec(v);
  if (numeric) {
    let month = Number(numeric[1]);
    let day = Number(numeric[2]);
    const year = expandYear(Number(numeric[3]));
    // MMC / EU cards print DD/MM. Swap when the first number cannot be a month.
    if (month > 12 && day <= 12) {
      const swapped = utcYmd(year, day, month);
      if (swapped) return swapped;
    }
    return utcYmd(year, month, day);
  }

  // 13-JUN-2030 / 13 JUN 30 (USCG MMC style)
  const dmy = /^(\d{1,2})[-\s]([A-Za-z]{3,9})[-\s.,]*(\d{2,4})$/.exec(v);
  if (dmy) {
    const month = MONTHS[dmy[2].slice(0, 3).toLowerCase()];
    if (month) return utcYmd(expandYear(Number(dmy[3])), month, Number(dmy[1]));
  }

  // Jan 15, 2025 / JUN-13-2030
  const mdy = /^([A-Za-z]{3,9})[-\s]+(\d{1,2}),?[-\s]+(\d{2,4})$/.exec(v);
  if (mdy) {
    const month = MONTHS[mdy[1].slice(0, 3).toLowerCase()];
    if (month) return utcYmd(expandYear(Number(mdy[3])), month, Number(mdy[2]));
  }

  const fallback = new Date(v);
  if (Number.isNaN(fallback.getTime())) return null;
  return new Date(Date.UTC(fallback.getUTCFullYear(), fallback.getUTCMonth(), fallback.getUTCDate()));
}

export function toIsoDate(value: string | null | undefined): string | null {
  const d = parseDate(value);
  if (!d) return null;
  return d.toISOString().slice(0, 10);
}

/**
 * Ticket expiry only — never use on DOB.
 * A 2-digit year of 30 must not land as 1930 and mark a live MMC expired.
 */
export function credentialExpiryIso(value: string | null | undefined): string | null {
  const iso = toIsoDate(value);
  if (!iso) return null;
  const y = Number(iso.slice(0, 4));
  if (y >= 1900 && y < 2000) return `${y + 100}${iso.slice(4)}`;
  return iso;
}

/** Keep the later ISO expiry so an issue date cannot replace 2030. */
export function laterExpiry(
  a: string | null | undefined,
  b: string | null | undefined,
): string | null {
  const A = credentialExpiryIso(a) ?? toIsoDate(a);
  const B = credentialExpiryIso(b) ?? toIsoDate(b);
  if (!A) return B;
  if (!B) return A;
  return A >= B ? A : B;
}

export function todayUtc(): Date {
  const n = new Date();
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()));
}

export function daysUntil(value: string | null | undefined, from = todayUtc()): number | null {
  const d = parseDate(value);
  if (!d) return null;
  const a = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());
  const b = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return Math.round((b - a) / 86400000);
}

export function expiryTone(value: string | null | undefined): ExpiryTone {
  const days = daysUntil(value);
  if (days === null) return "missing";
  if (days < 0) return "expired";
  if (days <= 30) return "soon";
  if (days <= 90) return "watch";
  return "ok";
}

export function formatDate(value: string | null | undefined): string {
  const d = parseDate(value);
  if (!d) return "—";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function formatShort(value: string | null | undefined): string {
  const d = parseDate(value);
  if (!d) return "—";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function expiryLabel(value: string | null | undefined): string {
  const days = daysUntil(value);
  if (days === null) return "No date";
  if (days < 0) return `Expired ${Math.abs(days)}d`;
  if (days === 0) return "Expires today";
  if (days === 1) return "Expires tomorrow";
  if (days <= 90) return `${days}d left`;
  return formatShort(value);
}

export function addDays(value: string | null | undefined, days: number): string | null {
  const d = parseDate(value);
  if (!d) return null;
  const next = new Date(d.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
}

export function addYears(value: string | null | undefined, years: number): string | null {
  const d = parseDate(value);
  if (!d) return null;
  const next = new Date(d.getTime());
  next.setUTCFullYear(next.getUTCFullYear() + years);
  return next.toISOString().slice(0, 10);
}

export function daysAboard(signOn: string | null | undefined, from = todayUtc()): number | null {
  const d = parseDate(signOn);
  if (!d) return null;
  const a = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const b = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());
  return Math.round((b - a) / 86400000);
}

export function formatMdY(value: string | null | undefined, twoDigitYear = false): string {
  const d = parseDate(value);
  if (!d) return "";
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const y = d.getUTCFullYear();
  return twoDigitYear ? `${mm}/${dd}/${String(y).slice(-2)}` : `${mm}/${dd}/${y}`;
}

/** Watch-trade stamp: "11 Sep 26". */
export function formatStamp(value?: string | null): string {
  const d = value ? parseDate(value) : todayUtc();
  if (!d) return "";
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${String(d.getUTCFullYear()).slice(2)}`;
}

