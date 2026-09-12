export const VESSEL = "M/V GEORGE II";
export const COMPANY = "Sunrise Operations, LLC";
export const COMPANY_ADDRESS = "P.O. Box 690998, Charlotte, NC 28227";
export const SMS_URL = "https://g2sms.grok.me";
export const SMS_CREWING_URL = "https://g2sms.grok.me/manuals/crewing";

/** Particulars for crew lists and IMO FAL Form 5. */
export const VESSEL_PARTICULARS = {
  name: "GEORGE II",
  displayName: "M/V GEORGE II",
  imo: "7729461",
  callSign: "WFLH",
  mmsi: "366791000",
  flag: "United States of America",
  flagCode: "USA",
  portOfRegistry: "Honolulu",
  officialNumber: "7729461",
};

/** Single-owner id while sign-in is off. Re-scope when auth comes back. */
export const LEDGER_OWNER = "dev-user";

export const MAX_PACKET_BYTES = 33554432;
export const MAX_PACKET_FILES = 40;
export const MAX_PACKET_PAGES = 32;
export const PACKET_TEMPLATE_URL = "/templates/sro-sign-on-packet.pdf";

export type CrewStatus = "current" | "vacation" | "past" | "applicant";
export type DocKind = "certificate" | "form";
export type CrewDepartment = "deck" | "engine" | "steward";
export type UnionHall = "MMP" | "MEBA" | "SIU" | "NONE";
export type AssignmentKind = "PERMANENT" | "ROTARY" | "RELIEF" | "CADET" | "APPRENTICE";
export type SiuClass = "A" | "B" | "C";
export type WatchCode = "12-4" | "4-8" | "8-12" | "day";
export type ExpiryTone = "ok" | "watch" | "soon" | "expired" | "missing";
export type MatchReason = "ss_last4" | "mmc" | "passport" | "name_dob" | "name";

export type DueOffResult = {
  date: string | null;
  rule: string;
  days: number | null;
  assumed: boolean;
  source: "set-date" | "rule" | "unknown" | "discharge";
  window?: { min: number; max: number };
  extraDays?: number;
  leaveDays?: number;
  baseDate?: string | null;
};

export type BilletDef = {
  code: string;
  sortOrder: number;
  title: string;
  shortTitle: string;
  department: CrewDepartment;
  watch: WatchCode | null;
  unionHall: UnionHall;
  defaultAssignment: AssignmentKind;
  notes?: string | null;
};

export type CrewPerson = {
  id: string;
  fullName: string;
  firstName: string | null;
  lastName: string | null;
  middleName: string | null;
  ssLast4: string | null;
  dob: string | null;
  sex: string | null;
  placeOfBirth: string | null;
  citizenship: string | null;
  race: string | null;
  hairColor: string | null;
  eyeColor: string | null;
  height: string | null;
  weight: string | null;
  addressLine: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  homePhone: string | null;
  cellPhone: string | null;
  email: string | null;
  nearestAirport: string | null;
  airportCode: string | null;
  maritimeCollege: string | null;
  yearGraduated: string | null;
  combatVeteran: boolean;
  maritalStatus: string | null;
  mmcNumber: string | null;
  mmcPlaceOfIssue: string | null;
  mmcExpiration: string | null;
  passportNumber: string | null;
  passportExpiration: string | null;
  status: CrewStatus;
  lastPosition: string | null;
  lastVessel: string | null;
  glasses: boolean;
  spareGlasses: boolean;
  allergies: string | null;
  medications: string | null;
  medicalRemarks: string | null;
  notes: string | null;
  unionHall: string | null;
  assignmentType: string | null;
  seniorityClass: string | null;
  watch: string | null;
  billetCode: string | null;
  permanentRating: string | null;
  createdAt: string;
  updatedAt: string;
};

export type NextOfKin = {
  id: string;
  crewId: string;
  fullName: string;
  relationship: string | null;
  addressLine: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  phone: string | null;
  cellPhone: string | null;
};

export type CrewDocument = {
  id: string;
  crewId: string;
  docType: string;
  label: string;
  docNumber: string | null;
  issuedOn: string | null;
  expiresOn: string | null;
  notes: string | null;
  sourcePacket: string | null;
};

export type CrewTour = {
  id: string;
  crewId: string;
  vessel: string;
  position: string | null;
  signOn: string | null;
  signOff: string | null;
  port: string | null;
  relieving: string | null;
  assignmentType: string | null;
  lengthDays: number | null;
  dispatchRef: string | null;
  unionHall: string | null;
  notes: string | null;
  watch: string | null;
  dueOff: string | null;
  dueOffRule: string | null;
  billetCode: string | null;
  seniorityClass: string | null;
  extraDays: number;
  leaveDays: number;
  leaveCount: number;
  leaveStartedOn: string | null;
};

export type CrewForm = {
  id: string;
  crewId: string;
  tourId: string | null;
  formCode: string;
  formLabel: string;
  completedOn: string | null;
  present: boolean;
};

export type SignOnRequirement = {
  id: string;
  code: string;
  label: string;
  kind: DocKind;
  appliesTo: string;
  required: boolean;
  source: string;
  sortOrder: number;
  notes: string | null;
};

export type InboxLogRow = {
  id: string;
  filename: string;
  crewId: string | null;
  fullName: string | null;
  created: boolean;
  error: string | null;
  loggedAt: string;
};

export type CrewListItem = CrewPerson & {
  tourCount: number;
  lastSignOn: string | null;
  lastSignOff: string | null;
  lastDueOff: string | null;
  lastWatch: string | null;
  lastAssignment: string | null;
  lastBillet: string | null;
  expiredCount: number;
  soonCount: number;
  hazmatScore: number | null;
  hazmatIssued: string | null;
};

export type CrewDetail = CrewPerson & {
  nok: NextOfKin[];
  documents: CrewDocument[];
  tours: CrewTour[];
  forms: CrewForm[];
};

export type PreviousEmployer = {
  name: string;
  address: string | null;
  phone: string | null;
  employedFrom: string | null;
  employedTo: string | null;
};

export type ParsedDocument = {
  docType: string;
  label: string;
  docNumber: string | null;
  issuedOn: string | null;
  expiresOn: string | null;
  notes: string | null;
};

export type ParsedForm = {
  code: string;
  label: string;
  completedOn: string | null;
};

export type ParsedTour = {
  vessel: string | null;
  position: string | null;
  signOn: string | null;
  signOff: string | null;
  port: string | null;
  relieving: string | null;
  assignmentType: string | null;
  lengthDays: number | null;
  dispatchRef: string | null;
  unionHall: string | null;
  watch: string | null;
  billetCode: string | null;
  seniorityClass: string | null;
  dueOff: string | null;
};

export type ParsedPerson = {
  fullName: string;
  firstName: string | null;
  lastName: string | null;
  middleName: string | null;
  ssLast4: string | null;
  dob: string | null;
  sex: string | null;
  placeOfBirth: string | null;
  citizenship: string | null;
  race: string | null;
  hairColor: string | null;
  eyeColor: string | null;
  height: string | null;
  weight: string | null;
  addressLine: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  homePhone: string | null;
  cellPhone: string | null;
  email: string | null;
  nearestAirport: string | null;
  airportCode: string | null;
  maritimeCollege: string | null;
  yearGraduated: string | null;
  combatVeteran: boolean;
  maritalStatus: string | null;
  mmcNumber: string | null;
  mmcPlaceOfIssue: string | null;
  mmcExpiration: string | null;
  passportNumber: string | null;
  passportExpiration: string | null;
  lastPosition: string | null;
  glasses: boolean;
  spareGlasses: boolean;
  allergies: string | null;
  medications: string | null;
  medicalRemarks: string | null;
  notes: string | null;
  signOnRequired: boolean;
  nextOfKin: {
    fullName: string;
    relationship: string | null;
    addressLine: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
    phone: string | null;
    cellPhone: string | null;
  } | null;
  previousEmployers: PreviousEmployer[];
  documents: ParsedDocument[];
  tour: ParsedTour | null;
  formsFound: ParsedForm[];
};

export type CrewMatch = {
  crewId: string;
  fullName: string;
  status: CrewStatus;
  lastPosition: string | null;
  confidence: "high" | "medium" | "low";
  reasons: MatchReason[];
  priorTours: CrewTour[];
};

export type ParsedPacketResult = {
  filename: string;
  pageCount: number;
  person: ParsedPerson | null;
  match: CrewMatch | null;
  warnings: string[];
  error: string | null;
};

export type RosterOccupant = {
  crew: CrewListItem;
  tour: CrewTour;
  due: DueOffResult;
  daysOn: number | null;
  daysLeft: number | null;
  extraDays: number;
  sailingUp: boolean;
  covering: string | null;
};

export type RosterSlot = {
  billet: BilletDef;
  occupants: RosterOccupant[];
};

export type RosterQuestion = {
  id: string;
  severity: "ask" | "warn";
  title: string;
  detail: string;
  billetCode?: string;
  crewId?: string;
};

export type VesselRun = {
  thisPort: string;
  nextPort: string;
  eta: string | null;
  voyageNumber: string | null;
};

export type ShipRoster = {
  slots: RosterSlot[];
  vacation: CrewListItem[];
  questions: RosterQuestion[];
  dueSoon: number;
  overdue: number;
  vacant: number;
  aboard: number;
  run: VesselRun;
};

export type DashboardStats = {
  current: number;
  past: number;
  total: number;
  expiredDocs: number;
  soonDocs: number;
  watchDocs: number;
  returningReady: number;
  dueSoonCrew: number;
  vacantBillets: number;
  overdueCrew: number;
  sailingUp: number;
};

export type ExpiryAlert = CrewDocument & {
  marinerName: string;
};
