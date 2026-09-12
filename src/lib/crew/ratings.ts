import type { CrewDepartment } from "./types";

export const POSITION_LABELS: Record<string, string> = {
  MASTER: "Master",
  CAPT: "Master",
  "C/M": "Chief Mate",
  CM: "Chief Mate",
  "CHIEF MATE": "Chief Mate",
  "2/M": "Second Mate",
  "2M": "Second Mate",
  "SECOND MATE": "Second Mate",
  "3/M": "Third Mate",
  "3M": "Third Mate",
  "THIRD MATE": "Third Mate",
  "C/E": "Chief Engineer",
  CE: "Chief Engineer",
  "CHIEF ENGINEER": "Chief Engineer",
  "1A/E": "First Assistant Engineer",
  "1AE": "First Assistant Engineer",
  "1ST A/E": "First Assistant Engineer",
  "2A/E": "Second Assistant Engineer",
  "2AE": "Second Assistant Engineer",
  "2ND AE": "Second Assistant Engineer",
  "2 A/E": "Second Assistant Engineer",
  "2 A/E DAY": "2 A/E Day",
  "3A/E": "Third Assistant Engineer",
  "3AE": "Third Assistant Engineer",
  "3 A/E": "Third Assistant Engineer",
  QEE: "Electrician",
  QMED: "QMED",
  ELECTRICIAN: "Electrician",
  DEU: "DEU",
  ABH: "Able Seaman (Harbor)",
  AB: "Able Seaman",
  "AB DAY": "AB Day",
  "AB/W": "AB Watch",
  OS: "Ordinary Seaman",
  "CADET ENG": "Engine Cadet",
  "ENGINE CADET": "Engine Cadet",
  "CADET DECK": "Deck Cadet",
  "DECK CADET": "Deck Cadet",
  CADET: "Cadet",
  COOK: "Cook",
  STEWARD: "Steward",
  "STEWARD ASSIST": "Steward Assist",
  BOSUN: "Boatswain",
  BOATSWAIN: "Boatswain",
  "APPRENTICE A": "Apprentice A",
  "APPRENTICE B": "Apprentice B",
};

export const DECK_OFFICER = new Set(["MASTER", "CAPT", "C/M", "CM", "CHIEF MATE", "2/M", "2M", "SECOND MATE", "3/M", "3M", "THIRD MATE"]);
export const ENGINE_OFFICER = new Set([
  "C/E",
  "CE",
  "CHIEF ENGINEER",
  "1A/E",
  "1AE",
  "1ST A/E",
  "2A/E",
  "2AE",
  "2ND AE",
  "2 A/E",
  "2 A/E DAY",
  "3A/E",
  "3AE",
  "3 A/E",
]);

export function normalizePosition(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw.trim().toUpperCase().replace(/\s+/g, " ");
}

export function positionLabel(raw: string | null | undefined): string {
  const key = normalizePosition(raw);
  if (!key) return "Unrated";
  return POSITION_LABELS[key] ?? raw!.trim();
}

export function appliesBucket(position: string | null | undefined): "deck_officer" | "engine_officer" | "rating" {
  const key = normalizePosition(position);
  if (DECK_OFFICER.has(key)) return "deck_officer";
  if (ENGINE_OFFICER.has(key)) return "engine_officer";
  return "rating";
}

export function requirementApplies(appliesTo: string, position: string | null | undefined): boolean {
  if (appliesTo === "all") return true;
  return appliesTo === appliesBucket(position);
}

const DECK_RATING = new Set(["AB", "ABH", "AB DAY", "AB/W", "OS", "BOSUN", "BOATSWAIN", "CADET DECK", "DECK CADET", "CADET", "APPRENTICE A", "APPRENTICE B"]);
const ENGINE_RATING = new Set(["QMED", "QEE", "ELECTRICIAN", "OILER", "WIPER", "CADET ENG", "ENGINE CADET", "DEU"]);
const STEWARD_RATING = new Set(["COOK", "STEWARD", "CHIEF COOK", "MESSMAN", "STEWARD ASSIST"]);

export function inferDepartment(position: string | null | undefined): CrewDepartment | null {
  const key = normalizePosition(position);
  if (!key) return null;
  if (DECK_OFFICER.has(key) || DECK_RATING.has(key)) return "deck";
  if (ENGINE_OFFICER.has(key) || ENGINE_RATING.has(key)) return "engine";
  if (STEWARD_RATING.has(key)) return "steward";
  if (/(MASTER|CAPT|MATE|BOSUN|ABLE|ORDINARY|\bAB\b|\bOS\b|DECK)/.test(key)) return "deck";
  if (/(ENG|QMED|QEE|OILER|WIPER|\bAE\b|ELECTRIC)/.test(key)) return "engine";
  if (/(COOK|STEWARD|MESS)/.test(key)) return "steward";
  return null;
}

export function departmentLabel(d: CrewDepartment): string {
  if (d === "deck") return "Deck";
  if (d === "engine") return "Engine";
  return "Steward";
}

export function isLicensedOfficer(position: string | null | undefined): boolean {
  const key = normalizePosition(position);
  if (!key) return false;
  if (DECK_OFFICER.has(key) || ENGINE_OFFICER.has(key)) return true;
  if (/\b(MASTER|CAPT|MATE|CHIEF ENG|\bC\/E\b|\bCE\b|A\/E|A\/ENG|ASSISTANT ENGINEER)\b/.test(key)) return true;
  return false;
}

export function isElectrician(position: string | null | undefined): boolean {
  const key = normalizePosition(position);
  return /ELECTRIC/.test(key) || key === "QEE";
}

export function isDeckOfficer(position: string | null | undefined): boolean {
  const key = normalizePosition(position);
  if (!key) return false;
  if (DECK_OFFICER.has(key)) return true;
  return /\b(MASTER|CAPT|MATE)\b/.test(key);
}
