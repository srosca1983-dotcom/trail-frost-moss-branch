import type { CrewMatch, CrewPerson, CrewTour, MatchReason, ParsedPerson } from "./types";

function norm(s: string | null | undefined) {
  return (s ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function digits(s: string | null | undefined) {
  return (s ?? "").replace(/\D/g, "");
}

function tokens(p: { firstName?: string | null; lastName?: string | null; fullName?: string | null }) {
  if (p.lastName && p.firstName) return [norm(p.lastName), norm(p.firstName)].sort().join(" ");
  const parts = norm(p.fullName).split(" ").filter(Boolean);
  if (parts.length >= 2) return [...parts].sort().join(" ");
  return "";
}

function firstToken(s: string | null | undefined) {
  return norm(s).split(" ").filter(Boolean)[0] ?? "";
}

function familyTokens(s: string | null | undefined): string[] {
  return norm(s)
    .replace(/\b(jr|sr|ii|iii|iv|junior|senior)\b/g, " ")
    .split(" ")
    .filter((t) => t.length >= 2);
}

/** Guardiola = Guardiola-Berrios Jr. Exact last names still win for short names (Lee). */
export function sameFamilyName(aRaw: string | null | undefined, bRaw: string | null | undefined): boolean {
  const a = familyTokens(aRaw);
  const b = familyTokens(bRaw);
  if (!a.length || !b.length) return false;
  if (a.join(" ") === b.join(" ")) return true;
  return a.some((t) => t.length >= 4 && b.includes(t)) || b.some((t) => t.length >= 4 && a.includes(t));
}

/** Ray=Raymond, Mike=Michael. Prefix of 3+ letters (Joe/Joseph). Not first name alone. */
const GIVEN_ROOT: Record<string, string> = {
  ray: "raymond",
  raymond: "raymond",
  mike: "michael",
  michael: "michael",
  mick: "michael",
  bob: "robert",
  bobby: "robert",
  rob: "robert",
  robert: "robert",
  bill: "william",
  billy: "william",
  will: "william",
  william: "william",
  dave: "david",
  david: "david",
  jim: "james",
  jimmy: "james",
  jamie: "james",
  james: "james",
  tony: "anthony",
  anthony: "anthony",
  rick: "richard",
  dick: "richard",
  rich: "richard",
  ricky: "richard",
  richard: "richard",
  chuck: "charles",
  charlie: "charles",
  charles: "charles",
  jack: "john",
  johnny: "john",
  john: "john",
  matt: "matthew",
  matthew: "matthew",
  steve: "steven",
  steven: "steven",
  stephen: "steven",
  ted: "edward",
  ed: "edward",
  eddie: "edward",
  edward: "edward",
  joe: "joseph",
  joey: "joseph",
  joseph: "joseph",
  tom: "thomas",
  tommy: "thomas",
  thomas: "thomas",
  chris: "christopher",
  christopher: "christopher",
  nick: "nicholas",
  nicholas: "nicholas",
  dan: "daniel",
  danny: "daniel",
  daniel: "daniel",
  alex: "alexander",
  alexander: "alexander",
  ben: "benjamin",
  benjamin: "benjamin",
  sam: "samuel",
  samuel: "samuel",
  tim: "timothy",
  timothy: "timothy",
  greg: "gregory",
  gregory: "gregory",
  ken: "kenneth",
  kenny: "kenneth",
  kenneth: "kenneth",
  ron: "ronald",
  ronald: "ronald",
  don: "donald",
  donald: "donald",
  larry: "lawrence",
  lawrence: "lawrence",
  phil: "philip",
  philip: "philip",
  pat: "patrick",
  patrick: "patrick",
  andy: "andrew",
  drew: "andrew",
  andrew: "andrew",
};

export function sameGivenName(aRaw: string | null | undefined, bRaw: string | null | undefined): boolean {
  const a = firstToken(aRaw);
  const b = firstToken(bRaw);
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.length === 1 && b.startsWith(a)) return true;
  if (b.length === 1 && a.startsWith(b)) return true;
  const ra = GIVEN_ROOT[a];
  const rb = GIVEN_ROOT[b];
  if (ra && rb && ra === rb) return true;
  if (a.length >= 3 && b.startsWith(a)) return true;
  if (b.length >= 3 && a.startsWith(b)) return true;
  if (Math.min(a.length, b.length) >= 5 && editDistanceAtMost1(a, b)) return true;
  return false;
}

function editDistanceAtMost1(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) return false;
  if (a.length === b.length) {
    let d = 0;
    for (let i = 0; i < a.length; i += 1) if (a[i] !== b[i] && ++d > 1) return false;
    return d === 1;
  }
  const [sh, lo] = a.length < b.length ? [a, b] : [b, a];
  let i = 0;
  let j = 0;
  let d = 0;
  while (i < sh.length && j < lo.length) {
    if (sh[i] === lo[j]) {
      i += 1;
      j += 1;
    } else {
      j += 1;
      d += 1;
      if (d > 1) return false;
    }
  }
  return true;
}

export function scoreMatch(parsed: ParsedPerson, crew: CrewPerson, tours: CrewTour[]): CrewMatch | null {
  const reasons: MatchReason[] = [];
  if (parsed.ssLast4 && crew.ssLast4 && parsed.ssLast4 === crew.ssLast4) {
    reasons.push("ss_last4");
  }
  if (parsed.mmcNumber && crew.mmcNumber && digits(parsed.mmcNumber) && digits(parsed.mmcNumber) === digits(crew.mmcNumber)) {
    reasons.push("mmc");
  }
  if (
    parsed.passportNumber &&
    crew.passportNumber &&
    digits(parsed.passportNumber) === digits(crew.passportNumber) &&
    digits(parsed.passportNumber).length >= 6
  ) {
    reasons.push("passport");
  }
  const parsedLast = norm(parsed.lastName);
  const crewLast = norm(crew.lastName);
  const parsedFirst = firstToken(parsed.firstName);
  const crewFirst = firstToken(crew.firstName);
  const sameLast = sameFamilyName(parsed.lastName, crew.lastName);
  const sameFirst = sameGivenName(parsedFirst, crewFirst);
  const sameDob = parsed.dob && crew.dob && parsed.dob === crew.dob;
  const idHit = reasons.includes("ss_last4") || reasons.includes("mmc") || reasons.includes("passport");
  const haveLast = familyTokens(parsed.lastName).length > 0 && familyTokens(crew.lastName).length > 0;

  // Alex Baird is not Jennifer Bono — a misread MMC/passport/SSN last-4 must not join them.
  if (haveLast && !sameLast) return null;

  if (sameLast && sameFirst) reasons.push("name");
  else if (sameLast && sameDob) reasons.push("name_dob");
  else if (sameLast && !parsedFirst && !idHit) {
    reasons.push("name");
  } else {
    const a = tokens(parsed);
    const b = tokens(crew);
    if (a && a === b && parsedLast && crewLast) reasons.push("name");
  }

  if (parsedFirst && crewFirst && !sameFirst && !sameDob) {
    const strongId = reasons.includes("mmc") || reasons.includes("passport");
    if (!idHit) return null;
    if (!strongId) return null;
    if (!sameLast) return null;
  }

  if (reasons.length === 0) return null;

  let confidence: CrewMatch["confidence"] = "low";
  if (reasons.includes("ss_last4") || reasons.includes("mmc") || reasons.includes("passport")) confidence = "high";
  else if (reasons.includes("name_dob")) confidence = "medium";
  else if (reasons.includes("name") && reasons.length > 1) confidence = "medium";

  return {
    crewId: crew.id,
    fullName: crew.fullName,
    status: crew.status,
    lastPosition: crew.lastPosition,
    confidence,
    reasons,
    priorTours: tours,
  };
}

const STATUS_RANK: Record<string, number> = { current: 4, vacation: 3, past: 2, applicant: 1 };

export function bestMatch(parsed: ParsedPerson, people: CrewPerson[], toursByCrew: Map<string, CrewTour[]>): CrewMatch | null {
  const scored = people
    .map((p) => scoreMatch(parsed, p, toursByCrew.get(p.id) ?? []))
    .filter((m): m is CrewMatch => m !== null)
    .sort((a, b) => {
      const rank = { high: 3, medium: 2, low: 1 };
      return (
        rank[b.confidence] - rank[a.confidence] ||
        (STATUS_RANK[b.status] ?? 0) - (STATUS_RANK[a.status] ?? 0) ||
        b.reasons.length - a.reasons.length
      );
    });
  return scored[0] ?? null;
}
