import type { CrewMatch, ParsedDocument, ParsedForm, ParsedPacketResult, ParsedPerson, PreviousEmployer } from "./types";
import { laterExpiry, credentialExpiryIso, toIsoDate } from "./dates.ts";

function pick(a: string | null | undefined, b: string | null | undefined): string | null {
  const av = (a ?? "").trim();
  const bv = (b ?? "").trim();
  const aOk = av && av.toLowerCase() !== "unknown";
  const bOk = bv && bv.toLowerCase() !== "unknown";
  if (aOk) return av;
  if (bOk) return bv;
  return av || bv || null;
}

function normName(s: string | null | undefined) {
  return (s ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function digits(s: string | null | undefined) {
  return (s ?? "").replace(/\D/g, "");
}

/** Keep the later expiry. Do not let an illegible scan replace a good date. */
export function betterDate(
  existing: string | null | undefined,
  incoming: string | null | undefined,
  incomingNotes?: string | null,
): string | null {
  const a = (existing ?? "").trim() || null;
  const b = (incoming ?? "").trim() || null;
  if (b && /illegible|unreadable|uncertain|ocr|guess/i.test(incomingNotes ?? "")) return a ?? b;
  if (!a) return b;
  if (!b) return a;
  return b > a ? b : a;
}

export function emptyPerson(): ParsedPerson {
  return {
    fullName: "",
    firstName: null,
    lastName: null,
    middleName: null,
    ssLast4: null,
    dob: null,
    sex: null,
    placeOfBirth: null,
    citizenship: null,
    race: null,
    hairColor: null,
    eyeColor: null,
    height: null,
    weight: null,
    addressLine: null,
    city: null,
    state: null,
    zip: null,
    homePhone: null,
    cellPhone: null,
    email: null,
    nearestAirport: null,
    airportCode: null,
    maritimeCollege: null,
    yearGraduated: null,
    combatVeteran: false,
    maritalStatus: null,
    mmcNumber: null,
    mmcPlaceOfIssue: null,
    mmcExpiration: null,
    passportNumber: null,
    passportExpiration: null,
    lastPosition: null,
    glasses: false,
    spareGlasses: false,
    allergies: null,
    medications: null,
    medicalRemarks: null,
    notes: null,
    signOnRequired: true,
    nextOfKin: null,
    previousEmployers: [],
    documents: [],
    tour: null,
    formsFound: [],
  };
}

const STR_KEYS = [
  "fullName",
  "firstName",
  "lastName",
  "middleName",
  "ssLast4",
  "dob",
  "sex",
  "placeOfBirth",
  "citizenship",
  "race",
  "hairColor",
  "eyeColor",
  "height",
  "weight",
  "addressLine",
  "city",
  "state",
  "zip",
  "homePhone",
  "cellPhone",
  "email",
  "nearestAirport",
  "airportCode",
  "maritimeCollege",
  "yearGraduated",
  "maritalStatus",
  "mmcNumber",
  "mmcPlaceOfIssue",
  "mmcExpiration",
  "passportNumber",
  "passportExpiration",
  "lastPosition",
  "allergies",
  "medications",
  "medicalRemarks",
] as const;

/** Same-kind tickets collapse together. `other` stays split by label (FFD ≠ benzene). */
function docGroupKey(d: ParsedDocument): string {
  const t = (d.docType ?? "").trim().toLowerCase();
  if (!t || t === "other" || t === "form") return `${t || "other"}:${normName(d.label)}`;
  return t;
}

const DATE_IN_TEXT =
  /\b(\d{4}-\d{2}-\d{2}|\d{1,2}[-\s][A-Za-z]{3}[A-Za-z]*[-\s.,]*\d{2,4}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b/g;

/**
 * USCG medical cards print STCW (2 yr) and National (5 yr). Keep National.
 * Any other note date that is later than the stored expiry also wins.
 */
export function liftLatestExpiry(d: ParsedDocument): ParsedDocument {
  const next: ParsedDocument = { ...d };
  next.expiresOn = credentialExpiryIso(next.expiresOn) ?? toIsoDate(next.expiresOn) ?? next.expiresOn;
  next.issuedOn = toIsoDate(next.issuedOn) ?? next.issuedOn;
  if ((next.docType ?? "").toLowerCase() !== "medical") return next;
  const blob = `${next.label ?? ""} ${next.notes ?? ""}`;
  const nat =
    /national(?:\s*(?:endorsement|expiry|expires?|valid(?:ity)?|through|to|:))?\s*[:.]?\s*(\d{1,2}[-\s][A-Za-z]{3,9}[-\s.,]*\d{2,4}|\d{4}-\d{2}-\d{2}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i.exec(
      blob,
    );
  if (nat?.[1]) next.expiresOn = laterExpiry(next.expiresOn, nat[1]);
  for (const raw of blob.match(DATE_IN_TEXT) ?? []) {
    next.expiresOn = laterExpiry(next.expiresOn, raw);
  }
  return next;
}

function pickLatestDoc(group: ParsedDocument[]): ParsedDocument {
  const lifted = group.map(liftLatestExpiry);
  if (lifted.length === 1) return lifted[0]!;
  const ranked = [...lifted].sort((a, b) => {
    const later = laterExpiry(a.expiresOn, b.expiresOn);
    if (later && later !== (a.expiresOn ?? "") && later === (b.expiresOn ?? "")) return 1;
    if (later && later !== (b.expiresOn ?? "") && later === (a.expiresOn ?? "")) return -1;
    if ((a.expiresOn ?? "") !== (b.expiresOn ?? "")) return (b.expiresOn ?? "") > (a.expiresOn ?? "") ? 1 : -1;
    if ((a.issuedOn ?? "") !== (b.issuedOn ?? "")) return (b.issuedOn ?? "") > (a.issuedOn ?? "") ? 1 : -1;
    return digits(b.docNumber).length - digits(a.docNumber).length;
  });
  const winner: ParsedDocument = { ...ranked[0]! };
  for (const d of ranked.slice(1)) {
    winner.label = pick(winner.label, d.label) ?? winner.label;
    winner.docNumber = pick(winner.docNumber, d.docNumber);
    winner.issuedOn =
      winner.issuedOn && d.issuedOn && d.issuedOn < winner.issuedOn ? d.issuedOn : pick(winner.issuedOn, d.issuedOn);
    winner.expiresOn = laterExpiry(winner.expiresOn, d.expiresOn);
    winner.notes = pick(winner.notes, d.notes);
  }
  return winner;
}

/** One row per certificate kind — the copy that expires furthest in the future. */
export function keepLatestDocuments(docs: ParsedDocument[]): ParsedDocument[] {
  const groups = new Map<string, ParsedDocument[]>();
  for (const d of docs) {
    const key = docGroupKey(d);
    const arr = groups.get(key) ?? [];
    arr.push(d);
    groups.set(key, arr);
  }
  return [...groups.values()].map(pickLatestDoc);
}

/** Collapse duplicate tickets on a person and lift MMC / passport expiry to the later date. */
export function keepLatestTickets(person: ParsedPerson): ParsedPerson {
  const documents = keepLatestDocuments(person.documents ?? []);
  const mmc = documents.find((d) => d.docType === "mmc");
  const pp = documents.find((d) => d.docType === "passport");
  return {
    ...person,
    documents,
    mmcNumber: pick(person.mmcNumber, mmc?.docNumber) ?? person.mmcNumber,
    passportNumber: pick(person.passportNumber, pp?.docNumber) ?? person.passportNumber,
    mmcExpiration: laterExpiry(person.mmcExpiration, mmc?.expiresOn),
    passportExpiration: laterExpiry(person.passportExpiration, pp?.expiresOn),
  };
}

export function mergeParsed(people: ParsedPerson[]): ParsedPerson {
  const out = emptyPerson();
  if (!people.length) return out;
  const notes: string[] = [];
  let signOnRequired = true;

  for (const p of people) {
    for (const k of STR_KEYS) {
      if (k === "mmcExpiration" || k === "passportExpiration") {
        out[k] = laterExpiry(out[k], p[k]);
      } else {
        out[k] = pick(out[k], p[k]) as never;
      }
    }
    out.combatVeteran = out.combatVeteran || p.combatVeteran;
    out.glasses = out.glasses || p.glasses;
    out.spareGlasses = out.spareGlasses || p.spareGlasses;
    if (p.signOnRequired === false) signOnRequired = false;
    if (p.notes) notes.push(p.notes);
    if (p.nextOfKin?.fullName && !out.nextOfKin) out.nextOfKin = p.nextOfKin;
    else if (p.nextOfKin && out.nextOfKin) {
      out.nextOfKin = {
        fullName: pick(out.nextOfKin.fullName, p.nextOfKin.fullName) ?? out.nextOfKin.fullName,
        relationship: pick(out.nextOfKin.relationship, p.nextOfKin.relationship),
        addressLine: pick(out.nextOfKin.addressLine, p.nextOfKin.addressLine),
        city: pick(out.nextOfKin.city, p.nextOfKin.city),
        state: pick(out.nextOfKin.state, p.nextOfKin.state),
        zip: pick(out.nextOfKin.zip, p.nextOfKin.zip),
        phone: pick(out.nextOfKin.phone, p.nextOfKin.phone),
        cellPhone: pick(out.nextOfKin.cellPhone, p.nextOfKin.cellPhone),
      };
    }
    out.documents = mergeDocs(out.documents, p.documents);
    out.formsFound = mergeForms(out.formsFound, p.formsFound);
    out.previousEmployers = mergeEmployers(out.previousEmployers, p.previousEmployers);
    if (p.tour) {
      out.tour = out.tour
        ? {
            vessel: pick(out.tour.vessel, p.tour.vessel),
            position: pick(out.tour.position, p.tour.position),
            signOn: pick(p.tour.signOn, out.tour.signOn),
            signOff: pick(out.tour.signOff, p.tour.signOff),
            port: pick(out.tour.port, p.tour.port),
            relieving: pick(out.tour.relieving, p.tour.relieving),
            assignmentType: pick(out.tour.assignmentType, p.tour.assignmentType),
            lengthDays: p.tour.lengthDays ?? out.tour.lengthDays,
            dispatchRef: pick(out.tour.dispatchRef, p.tour.dispatchRef),
            unionHall: pick(out.tour.unionHall, p.tour.unionHall),
            watch: pick(out.tour.watch, p.tour.watch),
            billetCode: pick(out.tour.billetCode, p.tour.billetCode),
            seniorityClass: pick(out.tour.seniorityClass, p.tour.seniorityClass),
            dueOff: pick(out.tour.dueOff, p.tour.dueOff),
          }
        : { ...p.tour };
    }
  }

  const name = [out.firstName, out.middleName, out.lastName].filter(Boolean).join(" ");
  if (name && (!out.fullName || out.fullName.toLowerCase() === "unknown")) out.fullName = name;
  if (!out.fullName) out.fullName = "Unknown";
  if (!out.lastPosition && out.tour?.position) out.lastPosition = out.tour.position;
  out.signOnRequired = signOnRequired;
  out.notes = notes.filter(Boolean).join(" · ") || null;
  return keepLatestTickets(out);
}

function mergeDocs(a: ParsedDocument[], b: ParsedDocument[]): ParsedDocument[] {
  const out = [...a];
  for (const d of b) {
    const same = out.find((e) => sameCertificate(e, d));
    if (!same) {
      out.push(d);
      continue;
    }
    same.label = pick(same.label, d.label) ?? same.label;
    same.docNumber = pick(same.docNumber, d.docNumber);
    same.issuedOn =
      same.issuedOn && d.issuedOn && d.issuedOn < same.issuedOn ? d.issuedOn : pick(same.issuedOn, d.issuedOn);
    same.expiresOn = betterDate(same.expiresOn, d.expiresOn, d.notes);
    same.notes = pick(same.notes, d.notes);
  }
  return keepLatestDocuments(out);
}

export function sameCertificate(a: ParsedDocument, b: ParsedDocument): boolean {
  if (a.docNumber && b.docNumber && digits(a.docNumber) === digits(b.docNumber) && digits(a.docNumber).length >= 4) {
    return true;
  }
  if (a.docType !== b.docType) return false;
  const t = (a.docType ?? "").toLowerCase();
  if (t === "other" || t === "form") return normName(a.label) === normName(b.label);
  return true;
}

function mergeForms(a: ParsedForm[], b: ParsedForm[]): ParsedForm[] {
  const out = [...a];
  for (const f of b) {
    const same = out.find((e) => e.code.toUpperCase() === f.code.toUpperCase());
    if (!same) out.push(f);
    else same.completedOn = pick(same.completedOn, f.completedOn);
  }
  return out;
}

function mergeEmployers(a: PreviousEmployer[], b: PreviousEmployer[]): PreviousEmployer[] {
  const out = [...a];
  for (const e of b) {
    if (!e.name) continue;
    if (out.some((x) => normName(x.name) === normName(e.name))) continue;
    out.push(e);
  }
  return out;
}

export function personKey(p: ParsedPerson): string {
  if (p.ssLast4 && p.ssLast4.length === 4) return `ss:${p.ssLast4}`;
  const mmc = digits(p.mmcNumber);
  if (mmc.length >= 5) return `mmc:${mmc}`;
  const pass = digits(p.passportNumber);
  if (pass.length >= 6) return `pp:${pass}`;
  if (p.lastName && p.firstName) return `n:${normName(p.lastName)}|${normName(p.firstName)}`;
  return `name:${normName(p.fullName)}`;
}

export type PersonCluster = {
  key: string;
  files: string[];
  person: ParsedPerson;
  match: CrewMatch | null;
  warnings: string[];
};

export function clusterResults(results: ParsedPacketResult[]): PersonCluster[] {
  const groups = new Map<string, ParsedPacketResult[]>();
  for (const r of results) {
    if (!r.person) {
      groups.set(`file:${r.filename}`, [r]);
      continue;
    }
    const key = personKey(r.person);
    const arr = groups.get(key) ?? [];
    arr.push(r);
    groups.set(key, arr);
  }
  const clusters: PersonCluster[] = [];
  for (const [key, items] of groups) {
    const people = items.map((i) => i.person).filter((p): p is ParsedPerson => !!p);
    const person = people.length ? mergeParsed(people) : emptyPerson();
    const match = items
      .map((i) => i.match)
      .filter((m): m is CrewMatch => !!m)
      .sort((a, b) => {
        const rank = { high: 3, medium: 2, low: 1 };
        return rank[b.confidence] - rank[a.confidence];
      })[0] ?? null;
    const warnings = [...new Set(items.flatMap((i) => i.warnings))];
    if (items.some((i) => i.error) && !people.length) {
      warnings.push(items.map((i) => i.error).filter(Boolean).join("; "));
    }
    clusters.push({
      key,
      files: items.map((i) => i.filename),
      person,
      match,
      warnings,
    });
  }
  return clusters.sort((a, b) => a.person.fullName.localeCompare(b.person.fullName));
}

export function missingForPacket(p: ParsedPerson): string[] {
  const miss: string[] = [];
  if (!p.fullName || p.fullName === "Unknown") miss.push("Full name");
  if (!p.lastPosition) miss.push("Rating");
  if (!p.ssLast4) miss.push("SSN last 4");
  if (!p.dob) miss.push("Date of birth");
  if (!p.addressLine) miss.push("Address");
  if (!p.mmcNumber) miss.push("MMC number");
  if (!p.passportNumber) miss.push("Passport number");
  if (!p.cellPhone && !p.homePhone) miss.push("Phone");
  if (!p.nextOfKin?.fullName) miss.push("Next of kin");
  return miss;
}
