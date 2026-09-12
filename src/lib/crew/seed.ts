import type { CrewStatus } from "./types";

export type SeedNok = {
  fullName: string;
  relationship: string;
  addressLine?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  cellPhone?: string;
};

export type SeedDoc = {
  docType: string;
  label: string;
  docNumber?: string;
  issuedOn?: string;
  expiresOn?: string;
  notes?: string;
};

export type SeedTour = {
  vessel?: string;
  position: string;
  signOn: string;
  signOff?: string;
  port?: string;
  relieving?: string;
  assignmentType?: string;
  lengthDays?: number;
  dispatchRef?: string;
  unionHall?: string;
  watch?: string;
  dueOff?: string;
  dueOffRule?: string;
  billetCode?: string;
  seniorityClass?: string;
  notes?: string;
};

export type SeedForm = {
  formCode: string;
  formLabel: string;
  completedOn?: string;
};

export type SeedPerson = {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  ssLast4: string;
  dob: string;
  sex: string;
  placeOfBirth?: string;
  citizenship?: string;
  race?: string;
  hairColor?: string;
  eyeColor?: string;
  height?: string;
  weight?: string;
  addressLine?: string;
  city?: string;
  state?: string;
  zip?: string;
  homePhone?: string;
  cellPhone?: string;
  email?: string;
  nearestAirport?: string;
  airportCode?: string;
  maritimeCollege?: string;
  yearGraduated?: string;
  combatVeteran?: boolean;
  maritalStatus?: string;
  mmcNumber?: string;
  mmcPlaceOfIssue?: string;
  mmcExpiration?: string;
  passportNumber?: string;
  passportExpiration?: string;
  status: CrewStatus;
  lastPosition?: string;
  unionHall?: string;
  assignmentType?: string;
  seniorityClass?: string;
  watch?: string;
  billetCode?: string;
  permanentRating?: string;
  glasses?: boolean;
  spareGlasses?: boolean;
  allergies?: string;
  medications?: string;
  medicalRemarks?: string;
  notes?: string;
  nok?: SeedNok[];
  documents: SeedDoc[];
  tours: SeedTour[];
  forms: SeedForm[];
};

const PACKET = "George II sign-on packet";

export const SEED_CREW: SeedPerson[] = [
  {
    id: "seed-bertotti",
    fullName: "Kyle Eric Bertotti",
    firstName: "Kyle",
    lastName: "Bertotti",
    middleName: "Eric",
    ssLast4: "9046",
    dob: "1995-07-22",
    sex: "M",
    placeOfBirth: "Sacramento, CA",
    citizenship: "USA",
    hairColor: "Brown",
    eyeColor: "Brown",
    height: "5'11\"",
    weight: "155",
    addressLine: "949 Ala Nanala St #1401",
    city: "Honolulu",
    state: "HI",
    zip: "96818",
    cellPhone: "916-616-7835",
    email: "kbertotti60@gmail.com",
    nearestAirport: "Honolulu",
    airportCode: "HNL",
    maritimeCollege: "California Maritime Academy",
    yearGraduated: "2017",
    maritalStatus: "Single",
    mmcNumber: "200123625",
    mmcPlaceOfIssue: "USA",
    mmcExpiration: "2027-04-23",
    passportNumber: "A14127168",
    passportExpiration: "2033-01-29",
    status: "past",
    lastPosition: "C/M",
    notes: "14-day relief Chief Mate. MM&P 401(k) opt-out on file.",
    nok: [
      {
        fullName: "Nora Bertotti",
        relationship: "Mother",
        addressLine: "7021 21st Ave",
        city: "Sacramento",
        state: "CA",
        zip: "95820",
        phone: "916-201-1437",
      },
    ],
    documents: [
      { docType: "mmc", label: "MMC — Chief Mate", docNumber: "627406", expiresOn: "2027-04-23", notes: "National serial 627406 / credential 200123625" },
      { docType: "passport", label: "US Passport", docNumber: "A14127168", issuedOn: "2023-01-30", expiresOn: "2033-01-29" },
      { docType: "twic", label: "TWIC", expiresOn: "2028-10-05" },
      { docType: "drug_free", label: "Drug-Free", expiresOn: "2025-09-18" },
      { docType: "vso", label: "VSO", expiresOn: "2027-04-23" },
      { docType: "radar", label: "Radar / ARPA", expiresOn: "2027-04-23" },
      { docType: "stcw", label: "STCW", expiresOn: "2027-04-23" },
      { docType: "stcwmc", label: "STCW Medical Care", expiresOn: "2026-05-02" },
      { docType: "gmdss", label: "GMDSS-FCC", expiresOn: "2027-04-23" },
      { docType: "other", label: "DOT Specimen Collection / BAT (MITAGS)", docNumber: "152844", issuedOn: "2023-11-16" },
    ],
    tours: [
      {
        position: "C/M",
        signOn: "2025-06-24",
        signOff: "2025-07-08",
        port: "LALB",
        relieving: "Sorin Rosca",
        assignmentType: "RELIEF",
        lengthDays: 14,
        dispatchRef: "3594067",
        unionHall: "MM&P",
        notes: "Vacation relief. Dispatched 23 Jun 2025.",
      },
    ],
    forms: [
      { formCode: "SRO-PER-003", formLabel: "Sign on Information", completedOn: "2025-06-24" },
      { formCode: "W-4", formLabel: "Federal W-4", completedOn: "2025-06-24" },
      { formCode: "I-9", formLabel: "Form I-9", completedOn: "2025-06-24" },
      { formCode: "SRO-PAY-002", formLabel: "Direct Deposit", completedOn: "2025-06-24" },
      { formCode: "401K", formLabel: "401(k) opt-out", completedOn: "2025-06-24" },
    ],
  },
  {
    id: "seed-bono",
    fullName: "Jennifer Marie Bono",
    firstName: "Jennifer",
    lastName: "Bono",
    middleName: "Marie",
    ssLast4: "9325",
    dob: "1982-09-12",
    sex: "F",
    placeOfBirth: "New York, NY",
    citizenship: "US",
    race: "White",
    hairColor: "Blonde",
    eyeColor: "Green",
    height: "4'11\"",
    weight: "143",
    addressLine: "158 Appletree Rd",
    city: "Auburn",
    state: "NH",
    zip: "03032",
    homePhone: "808-367-2172",
    cellPhone: "808-367-2172",
    email: "jenbono01@gmail.com",
    nearestAirport: "Boston",
    airportCode: "BOS",
    maritimeCollege: "Texas A&M",
    yearGraduated: "2005",
    maritalStatus: "Single",
    mmcNumber: "2565364",
    mmcPlaceOfIssue: "US",
    mmcExpiration: "2025-11-12",
    passportNumber: "680824856",
    passportExpiration: "2032-08-25",
    status: "past",
    lastPosition: "2/M",
    glasses: true,
    spareGlasses: true,
    notes: "Rotary 2/M. MMC and most STCW tickets expired Nov 2025 — do not sign on until renewed.",
    nok: [
      {
        fullName: "Gene Bono",
        relationship: "Father",
        addressLine: "5139 County Hwy 7",
        city: "Roscoe",
        state: "NY",
        zip: "12776",
        phone: "607-498-4752",
        cellPhone: "607-434-7836",
      },
      {
        fullName: "Rachael Thompson",
        relationship: "Sister",
        phone: "985-519-2451",
      },
    ],
    documents: [
      { docType: "mmc", label: "MMC — Chief Mate / Master <1000 GRT", docNumber: "382644", issuedOn: "2019-04-24", expiresOn: "2025-11-12", notes: "Ref 2565364" },
      { docType: "passport", label: "US Passport", docNumber: "680824856", issuedOn: "2022-08-25", expiresOn: "2032-08-25" },
      { docType: "twic", label: "TWIC", expiresOn: "2028-01-04" },
      { docType: "drug_free", label: "Drug-Free", expiresOn: "2025-11-08" },
      { docType: "vso", label: "VSO", expiresOn: "2025-11-12" },
      { docType: "radar", label: "Radar", expiresOn: "2025-11-12" },
      { docType: "gmdss", label: "GMDSS-FCC", expiresOn: "2025-11-12" },
      { docType: "stcw", label: "STCW", expiresOn: "2025-11-12" },
      { docType: "ecdis", label: "ECDIS", expiresOn: "2025-11-12" },
      { docType: "stcwmc", label: "STCW Medical Care", expiresOn: "2027-01-13" },
      { docType: "other", label: "Basic IGF Code Operations", expiresOn: "2025-11-12" },
      { docType: "covid", label: "COVID-19 vaccination", issuedOn: "2021-03-07" },
    ],
    tours: [
      {
        position: "2/M",
        signOn: "2025-06-09",
        signOff: "2025-10-07",
        port: "LALB",
        relieving: "Sean Gingras",
        assignmentType: "ROTARY",
        lengthDays: 120,
        dispatchRef: "2565364",
        unionHall: "MM&P",
        notes: "Voyage 37. Pay start 09 Jun 2025.",
      },
    ],
    forms: [
      { formCode: "SRO-PER-003", formLabel: "Sign on Information", completedOn: "2025-06-09" },
      { formCode: "SRO-PER-002", formLabel: "Notice of SRO Policies", completedOn: "2025-06-09" },
      { formCode: "SRO-PER-001", formLabel: "Statement of Physical Condition", completedOn: "2025-06-09" },
      { formCode: "SMM-PER-05-A2", formLabel: "Medical Sign-On", completedOn: "2025-06-09" },
      { formCode: "SRO-PER-008", formLabel: "DOT Drug & Alcohol Release", completedOn: "2025-06-09" },
      { formCode: "W-4", formLabel: "Federal W-4", completedOn: "2025-06-09" },
      { formCode: "I-9", formLabel: "Form I-9", completedOn: "2025-06-09" },
      { formCode: "SRO-PAY-002", formLabel: "Direct Deposit", completedOn: "2025-06-09" },
      { formCode: "401K", formLabel: "401(k) enrollment 3%", completedOn: "2025-06-09" },
      { formCode: "SMM-SMM-08-A3", formLabel: "Cyber Security Training", completedOn: "2025-06-09" },
      { formCode: "SMM-SMM-08-A4", formLabel: "Internet Usage Policy", completedOn: "2025-06-09" },
      { formCode: "SMM-PER-05-A1", formLabel: "Familiarization Check List", completedOn: "2025-06-09" },
    ],
  },
  {
    id: "seed-cesena",
    fullName: "Oscar D. Cesena",
    firstName: "Oscar",
    lastName: "Cesena",
    middleName: "D.",
    ssLast4: "8715",
    dob: "1987-11-28",
    sex: "M",
    placeOfBirth: "La Paz, Mexico",
    citizenship: "US",
    race: "White / Latino",
    hairColor: "Black",
    eyeColor: "Brown",
    height: "6'2\"",
    weight: "285",
    addressLine: "1418 E 20th",
    city: "National City",
    state: "CA",
    zip: "91950",
    cellPhone: "619-246-0565",
    email: "oscar.d.cesena@gmail.com",
    nearestAirport: "San Diego",
    airportCode: "SAN",
    maritalStatus: "Single",
    mmcNumber: "F2808974",
    mmcPlaceOfIssue: "CA",
    mmcExpiration: "2027-11-28",
    passportNumber: "A2599987",
    passportExpiration: "2033-11-27",
    status: "past",
    lastPosition: "QEE",
    nok: [
      { fullName: "Setsuko Sahatani", relationship: "Sister", phone: "858-344-1029" },
    ],
    documents: [
      { docType: "mmc", label: "MMC", docNumber: "F2808974", expiresOn: "2027-11-28" },
      { docType: "passport", label: "US Passport", docNumber: "A2599987", expiresOn: "2033-11-27" },
      { docType: "medical", label: "Dental exam", issuedOn: "2025-01-01", notes: "Result: good" },
    ],
    tours: [
      {
        position: "QEE",
        signOn: "2025-07-14",
        port: "HON",
        assignmentType: "ROTARY",
      },
    ],
    forms: [
      { formCode: "SRO-PER-003", formLabel: "Sign on Information", completedOn: "2025-07-14" },
      { formCode: "SMM-PER-05-A2", formLabel: "Medical Sign-On", completedOn: "2025-07-14" },
      { formCode: "SRO-PER-001", formLabel: "Statement of Physical Condition", completedOn: "2025-07-14" },
    ],
  },
  {
    id: "seed-anderson",
    fullName: "Christopher Anderson",
    firstName: "Christopher",
    lastName: "Anderson",
    ssLast4: "2448",
    dob: "1989-07-05",
    sex: "M",
    placeOfBirth: "Seattle, WA",
    citizenship: "American",
    race: "White",
    hairColor: "Brown",
    eyeColor: "Blue",
    height: "6'1\"",
    weight: "240",
    addressLine: "13799 W Big Lake Blvd",
    city: "Mount Vernon",
    state: "WA",
    zip: "98274",
    cellPhone: "360-840-6797",
    email: "cmanderson77@hotmail.com",
    nearestAirport: "SEA",
    airportCode: "SEA",
    maritimeCollege: "California Maritime Academy",
    yearGraduated: "2012",
    combatVeteran: true,
    maritalStatus: "Single",
    mmcNumber: "3186831",
    mmcPlaceOfIssue: "USA",
    mmcExpiration: "2027-01-05",
    passportNumber: "A11708224",
    passportExpiration: "2029-07-26",
    status: "past",
    lastPosition: "3/M",
    medications: "Amoxicillin (as needed)",
    medicalRemarks: "Childhood eye cancer (resolved). Dental Aug 2024 — nice teeth.",
    nok: [
      {
        fullName: "Rick Anderson",
        relationship: "Father",
        addressLine: "13799 W Big Lake Blvd",
        city: "Mount Vernon",
        state: "WA",
        zip: "98274",
        phone: "360-422-1271",
        cellPhone: "360-770-4560",
      },
    ],
    documents: [
      { docType: "mmc", label: "MMC", docNumber: "3186831", expiresOn: "2027-01-05" },
      { docType: "passport", label: "US Passport", docNumber: "A11708224", expiresOn: "2029-07-26" },
      { docType: "medical", label: "Dental exam", issuedOn: "2024-08-01", notes: "Nice teeth" },
    ],
    tours: [
      {
        position: "3/M",
        signOn: "2025-01-21",
        port: "LA",
        assignmentType: "ROTARY",
      },
    ],
    forms: [
      { formCode: "SRO-PER-003", formLabel: "Sign on Information", completedOn: "2025-01-21" },
      { formCode: "SRO-PER-002", formLabel: "Notice of SRO Policies", completedOn: "2025-01-21" },
      { formCode: "SRO-PER-001", formLabel: "Statement of Physical Condition", completedOn: "2025-01-21" },
    ],
  },
  {
    id: "seed-baxter",
    fullName: "Christopher J. Baxter",
    firstName: "Christopher",
    lastName: "Baxter",
    middleName: "J.",
    ssLast4: "4606",
    dob: "1959-03-20",
    sex: "M",
    placeOfBirth: "Longford, Ireland",
    citizenship: "USA",
    race: "White",
    hairColor: "White",
    eyeColor: "Green",
    height: "6'0\"",
    weight: "200",
    addressLine: "8441 Norfolk Dr",
    city: "Huntington Beach",
    state: "CA",
    zip: "92646",
    homePhone: "616-834-9964",
    cellPhone: "616-834-9964",
    email: "christysradio@yahoo.com",
    nearestAirport: "John Wayne / SNA",
    airportCode: "SNA",
    maritalStatus: "Married",
    mmcNumber: "2605119",
    mmcPlaceOfIssue: "Martinsburg",
    mmcExpiration: "2026-07-06",
    passportNumber: "658364580",
    passportExpiration: "2033-03-01",
    status: "past",
    lastPosition: "ABH",
    notes: "MMC expired 6 Jul 2026. Do not sign on until credential is renewed.",
    nok: [
      {
        fullName: "Celine Baxter",
        relationship: "Wife",
        addressLine: "8441 Norfolk Dr",
        city: "Huntington Beach",
        state: "CA",
        zip: "92646",
        phone: "616-416-4159",
        cellPhone: "616-416-4159",
      },
    ],
    documents: [
      { docType: "mmc", label: "MMC — AB", docNumber: "2605119", expiresOn: "2026-07-06" },
      { docType: "passport", label: "US Passport", docNumber: "658364580", expiresOn: "2033-03-01" },
      { docType: "medical", label: "Dental exam", issuedOn: "2024-07-01", notes: "Good" },
    ],
    tours: [
      {
        position: "ABH",
        signOn: "2025-01-21",
        port: "Long Beach",
        assignmentType: "ROTARY",
      },
    ],
    forms: [
      { formCode: "SRO-PER-003", formLabel: "Sign on Information", completedOn: "2025-01-21" },
      { formCode: "SRO-PER-002", formLabel: "Notice of SRO Policies", completedOn: "2025-01-21" },
      { formCode: "SRO-PER-001", formLabel: "Statement of Physical Condition", completedOn: "2025-01-21" },
    ],
  },
  {
    id: "seed-nicholas",
    fullName: "Nicholas James Christopher",
    firstName: "Nicholas",
    lastName: "Christopher",
    middleName: "James",
    ssLast4: "6266",
    dob: "2002-06-10",
    sex: "M",
    placeOfBirth: "Pontiac, MI",
    citizenship: "US",
    race: "White",
    hairColor: "Brown",
    eyeColor: "Brown",
    height: "6'1\"",
    weight: "216",
    addressLine: "878 Suchava Dr",
    city: "White Lake",
    state: "MI",
    zip: "48386",
    cellPhone: "248-765-2161",
    email: "niko.christopher@gmail.com",
    nearestAirport: "Detroit",
    airportCode: "DTW",
    maritimeCollege: "Great Lakes Maritime Academy",
    maritalStatus: "Single",
    mmcNumber: "8436995",
    mmcPlaceOfIssue: "Martinsburg, WV",
    mmcExpiration: "2028-08-30",
    passportNumber: "653906177",
    passportExpiration: "2030-06-15",
    status: "past",
    lastPosition: "CADET ENG",
    medicalRemarks: "Dental 19 Oct 2024 — patient has good oral health (Brett Toran).",
    nok: [
      {
        fullName: "Andrew Christopher",
        relationship: "Brother",
        addressLine: "878 Suchava Dr",
        city: "White Lake",
        state: "MI",
        zip: "48386",
        phone: "248-824-5365",
      },
    ],
    documents: [
      { docType: "mmc", label: "MMC", docNumber: "8436995", expiresOn: "2028-08-30" },
      { docType: "passport", label: "US Passport", docNumber: "653906177", expiresOn: "2030-06-15" },
      { docType: "medical", label: "Dental exam", issuedOn: "2024-10-19", notes: "Good oral health" },
    ],
    tours: [
      {
        position: "CADET ENG",
        signOn: "2025-02-03",
        port: "LGB",
        assignmentType: "CADET",
      },
    ],
    forms: [
      { formCode: "SRO-PER-003", formLabel: "Sign on Information", completedOn: "2025-02-03" },
      { formCode: "SRO-PER-002", formLabel: "Notice of SRO Policies", completedOn: "2025-02-03" },
      { formCode: "SRO-PER-001", formLabel: "Statement of Physical Condition", completedOn: "2025-02-03" },
    ],
  },
  {
    id: "seed-nunez",
    fullName: "Christian Mercado Nunez",
    firstName: "Christian",
    lastName: "Nunez",
    middleName: "Mercado",
    ssLast4: "",
    dob: "",
    sex: "M",
    status: "applicant",
    lastPosition: undefined,
    notes: "Incomplete file — only SOCP SASH certificate received 3 Jan 2026. No sign-on packet yet.",
    documents: [
      { docType: "sash", label: "SOCP Sexual Assault / Sexual Harassment", issuedOn: "2026-01-03", notes: "Ship Operations Cooperative Program" },
    ],
    tours: [],
    forms: [{ formCode: "SASH", formLabel: "SASH course", completedOn: "2026-01-03" }],
  },
];

export const SEED_COOPER: SeedPerson = {
  id: "seed-cooper",
  fullName: "Zaid Malik Cooper",
  firstName: "Zaid",
  lastName: "Cooper",
  middleName: "Malik",
  ssLast4: "6159",
  dob: "2000-05-21",
  sex: "M",
  placeOfBirth: "Jacksonville, FL",
  citizenship: "USA",
  hairColor: "Black",
  eyeColor: "Brown",
  height: "5'09\"",
  weight: "197",
  addressLine: "720 Celebration Ln",
  city: "Middleburg",
  state: "FL",
  zip: "32068",
  cellPhone: "904-382-7989",
  email: "zaidcooper904@yahoo.com",
  nearestAirport: "Jacksonville",
  airportCode: "JAX",
  maritimeCollege: "Paul Hall Center Marine Training",
  yearGraduated: "2020",
  maritalStatus: "Single",
  mmcNumber: "6225814",
  mmcPlaceOfIssue: "NMC Martinsburg",
  mmcExpiration: "2028-05-23",
  passportNumber: "593642437",
  passportExpiration: "2028-05-01",
  status: "past",
  lastPosition: "AB",
  notes: "Prior SRO tour Mar–May 2026. SIU rotary AB.",
  nok: [
    {
      fullName: "Torri Baker",
      relationship: "Mother",
      addressLine: "1552 Elisa Dr",
      city: "Jacksonville",
      state: "FL",
      zip: "32218",
      phone: "904-233-2583",
    },
  ],
  documents: [
    { docType: "mmc", label: "MMC — AB Unlimited", docNumber: "6225814", issuedOn: "2024-09-11", expiresOn: "2028-05-23" },
    { docType: "passport", label: "US Passport", docNumber: "593642437", issuedOn: "2018-05-02", expiresOn: "2028-05-01" },
    { docType: "medical", label: "USCG Medical / STCW", expiresOn: "2028-01-28" },
    { docType: "drug_free", label: "Random exception (86-067)", expiresOn: "2026-11-11" },
    { docType: "stcw", label: "STCW / Basic Training", expiresOn: "2028-05-23" },
  ],
  tours: [
    {
      position: "AB",
      signOn: "2026-03-07",
      signOff: "2026-05-14",
      port: "Jacksonville",
      assignmentType: "ROTARY",
      unionHall: "SIU",
      notes: "Prior George II tour listed on DOT 40.25.",
    },
  ],
  forms: [
    { formCode: "SRO-PER-008", formLabel: "DOT 40.25 consent", completedOn: "2026-08-25" },
  ],
};

SEED_CREW.push(SEED_COOPER);

export const EXTRA_SEED: SeedPerson[] = [SEED_COOPER];

export const SEED_PACKET_NOTE = PACKET;
