//#region node_modules/.nitro/vite/services/ssr/assets/requirements-DItXa5vY.js
function norm(s) {
	return (s ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
function digits(s) {
	return (s ?? "").replace(/\D/g, "");
}
function tokens(p) {
	if (p.lastName && p.firstName) return [norm(p.lastName), norm(p.firstName)].sort().join(" ");
	const parts = norm(p.fullName).split(" ").filter(Boolean);
	if (parts.length >= 2) return [...parts].sort().join(" ");
	return "";
}
function firstToken(s) {
	return norm(s).split(" ").filter(Boolean)[0] ?? "";
}
function familyTokens(s) {
	return norm(s).replace(/\b(jr|sr|ii|iii|iv|junior|senior)\b/g, " ").split(" ").filter((t) => t.length >= 2);
}
/** Guardiola = Guardiola-Berrios Jr. Exact last names still win for short names (Lee). */
function sameFamilyName(aRaw, bRaw) {
	const a = familyTokens(aRaw);
	const b = familyTokens(bRaw);
	if (!a.length || !b.length) return false;
	if (a.join(" ") === b.join(" ")) return true;
	return a.some((t) => t.length >= 4 && b.includes(t)) || b.some((t) => t.length >= 4 && a.includes(t));
}
/** Ray=Raymond, Mike=Michael. Prefix of 3+ letters (Joe/Joseph). Not first name alone. */
var GIVEN_ROOT = {
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
	andrew: "andrew"
};
function sameGivenName(aRaw, bRaw) {
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
function editDistanceAtMost1(a, b) {
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
	while (i < sh.length && j < lo.length) if (sh[i] === lo[j]) {
		i += 1;
		j += 1;
	} else {
		j += 1;
		d += 1;
		if (d > 1) return false;
	}
	return true;
}
function scoreMatch(parsed, crew, tours) {
	const reasons = [];
	if (parsed.ssLast4 && crew.ssLast4 && parsed.ssLast4 === crew.ssLast4) reasons.push("ss_last4");
	if (parsed.mmcNumber && crew.mmcNumber && digits(parsed.mmcNumber) && digits(parsed.mmcNumber) === digits(crew.mmcNumber)) reasons.push("mmc");
	if (parsed.passportNumber && crew.passportNumber && digits(parsed.passportNumber) === digits(crew.passportNumber) && digits(parsed.passportNumber).length >= 6) reasons.push("passport");
	const parsedLast = norm(parsed.lastName);
	const crewLast = norm(crew.lastName);
	const parsedFirst = firstToken(parsed.firstName);
	const crewFirst = firstToken(crew.firstName);
	const sameLast = sameFamilyName(parsed.lastName, crew.lastName);
	const sameFirst = sameGivenName(parsedFirst, crewFirst);
	const sameDob = parsed.dob && crew.dob && parsed.dob === crew.dob;
	const idHit = reasons.includes("ss_last4") || reasons.includes("mmc") || reasons.includes("passport");
	if (familyTokens(parsed.lastName).length > 0 && familyTokens(crew.lastName).length > 0 && !sameLast) return null;
	if (sameLast && sameFirst) reasons.push("name");
	else if (sameLast && sameDob) reasons.push("name_dob");
	else if (sameLast && !parsedFirst && !idHit) reasons.push("name");
	else {
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
	let confidence = "low";
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
		priorTours: tours
	};
}
var STATUS_RANK = {
	current: 4,
	vacation: 3,
	past: 2,
	applicant: 1
};
function bestMatch(parsed, people, toursByCrew) {
	return people.map((p) => scoreMatch(parsed, p, toursByCrew.get(p.id) ?? [])).filter((m) => m !== null).sort((a, b) => {
		const rank = {
			high: 3,
			medium: 2,
			low: 1
		};
		return rank[b.confidence] - rank[a.confidence] || (STATUS_RANK[b.status] ?? 0) - (STATUS_RANK[a.status] ?? 0) || b.reasons.length - a.reasons.length;
	})[0] ?? null;
}
/** Controlled sign-on list from SRO packets + SMM-PER (the live SMS crewing book). */
var DEFAULT_REQUIREMENTS = [
	{
		code: "SRO-PER-003",
		label: "Sign on Information",
		kind: "form",
		appliesTo: "all",
		required: true,
		source: "sro",
		sortOrder: 10,
		notes: "Personal, MMC, passport, next of kin."
	},
	{
		code: "SRO-PER-002",
		label: "Acknowledgement / Notice of SRO Policies",
		kind: "form",
		appliesTo: "all",
		required: true,
		source: "sro",
		sortOrder: 20,
		notes: "Drugs, alcohol, contraband, rest hours, PPE, harassment."
	},
	{
		code: "SRO-PER-001",
		label: "Seaman's Statement of Physical Condition",
		kind: "form",
		appliesTo: "all",
		required: true,
		source: "sro",
		sortOrder: 30,
		notes: null
	},
	{
		code: "SMM-PER-05-A2",
		label: "Medical Sign-On",
		kind: "form",
		appliesTo: "all",
		required: true,
		source: "sms",
		sortOrder: 40,
		notes: "Medications, allergies, eyeglasses."
	},
	{
		code: "SRO-PER-008",
		label: "DOT Drug & Alcohol Release (49 CFR 40)",
		kind: "form",
		appliesTo: "all",
		required: true,
		source: "sro",
		sortOrder: 50,
		notes: null
	},
	{
		code: "W-4",
		label: "Federal W-4",
		kind: "form",
		appliesTo: "all",
		required: true,
		source: "sro",
		sortOrder: 60,
		notes: null
	},
	{
		code: "I-9",
		label: "Form I-9 Employment Eligibility",
		kind: "form",
		appliesTo: "all",
		required: true,
		source: "sro",
		sortOrder: 70,
		notes: null
	},
	{
		code: "SRO-PAY-002",
		label: "Direct Deposit Authorization",
		kind: "form",
		appliesTo: "all",
		required: true,
		source: "sro",
		sortOrder: 80,
		notes: "Do not store account numbers in this ledger."
	},
	{
		code: "401K",
		label: "401(k) enrollment or opt-out",
		kind: "form",
		appliesTo: "all",
		required: true,
		source: "sro",
		sortOrder: 90,
		notes: "MM&P / union plan as applicable."
	},
	{
		code: "SMM-SMM-08-A3",
		label: "Cyber Security Training",
		kind: "form",
		appliesTo: "all",
		required: true,
		source: "sms",
		sortOrder: 100,
		notes: null
	},
	{
		code: "SMM-SMM-08-A4",
		label: "Internet Usage Policy",
		kind: "form",
		appliesTo: "all",
		required: true,
		source: "sms",
		sortOrder: 110,
		notes: null
	},
	{
		code: "SMM-PER-05-A1",
		label: "Familiarization Check List",
		kind: "form",
		appliesTo: "all",
		required: true,
		source: "sms",
		sortOrder: 120,
		notes: "ISM 6.3 / STCW A-VI/1. Complete before assigned duties."
	},
	{
		code: "SASH",
		label: "Sexual Assault / Sexual Harassment",
		kind: "certificate",
		appliesTo: "all",
		required: true,
		source: "sms",
		sortOrder: 130,
		notes: "SOCP SASH / SVO-SMM-03. 1-year validity on the NS5 sheet."
	},
	{
		code: "FAM",
		label: "Familiarization (SMM-PER-05-AP1)",
		kind: "certificate",
		appliesTo: "all",
		required: true,
		source: "sms",
		sortOrder: 140,
		notes: "1-year validity. NSE training list."
	},
	{
		code: "CYBER",
		label: "Cyber awareness (SMM-SMM-08 Mod 1 / AP3)",
		kind: "certificate",
		appliesTo: "all",
		required: true,
		source: "sms",
		sortOrder: 150,
		notes: "1-year. NSE tracks the three 101.650 modules separately; AP3 is the company form."
	},
	{
		code: "INTERNET",
		label: "Internet Usage (SMM-SMM-08-AP4)",
		kind: "certificate",
		appliesTo: "all",
		required: true,
		source: "sms",
		sortOrder: 160,
		notes: "1-year validity. NSE training list."
	},
	{
		code: "HAZMAT",
		label: "HAZMAT (SMM-PER-06 / 49 CFR 172.704)",
		kind: "certificate",
		appliesTo: "deck_officer",
		required: true,
		source: "sms",
		sortOrder: 170,
		notes: "H = 1 per vessel if carrying HAZMAT. Deck officers. 3-year HMR recurrent. Not SMM-OPS-11 (cargo ops)."
	},
	{
		code: "MMC",
		label: "Merchant Mariner Credential",
		kind: "certificate",
		appliesTo: "all",
		required: true,
		source: "uscg",
		sortOrder: 200,
		notes: null
	},
	{
		code: "PASSPORT",
		label: "Passport",
		kind: "certificate",
		appliesTo: "all",
		required: true,
		source: "uscg",
		sortOrder: 210,
		notes: null
	},
	{
		code: "TWIC",
		label: "TWIC",
		kind: "certificate",
		appliesTo: "all",
		required: true,
		source: "uscg",
		sortOrder: 220,
		notes: null
	},
	{
		code: "STCW",
		label: "STCW / Basic Training",
		kind: "certificate",
		appliesTo: "all",
		required: true,
		source: "uscg",
		sortOrder: 230,
		notes: null
	},
	{
		code: "MEDICAL",
		label: "Medical Certificate (CG-719K)",
		kind: "certificate",
		appliesTo: "all",
		required: true,
		source: "uscg",
		sortOrder: 240,
		notes: null
	},
	{
		code: "DRUG_FREE",
		label: "Drug-Free / chemical test",
		kind: "certificate",
		appliesTo: "all",
		required: true,
		source: "uscg",
		sortOrder: 250,
		notes: "Must be current at sign-on."
	},
	{
		code: "RADAR",
		label: "Radar / ARPA",
		kind: "certificate",
		appliesTo: "deck_officer",
		required: true,
		source: "uscg",
		sortOrder: 300,
		notes: null
	},
	{
		code: "ECDIS",
		label: "ECDIS",
		kind: "certificate",
		appliesTo: "deck_officer",
		required: true,
		source: "uscg",
		sortOrder: 310,
		notes: null
	},
	{
		code: "GMDSS",
		label: "GMDSS Operator",
		kind: "certificate",
		appliesTo: "deck_officer",
		required: true,
		source: "uscg",
		sortOrder: 320,
		notes: null
	},
	{
		code: "VSO",
		label: "Vessel Security Officer",
		kind: "certificate",
		appliesTo: "deck_officer",
		required: false,
		source: "uscg",
		sortOrder: 330,
		notes: "Required if designated VSO."
	}
];
var DOC_TYPE_TO_REQ = {
	mmc: "MMC",
	passport: "PASSPORT",
	twic: "TWIC",
	stcw: "STCW",
	bst: "STCW",
	medical: "MEDICAL",
	drug_free: "DRUG_FREE",
	radar: "RADAR",
	ecdis: "ECDIS",
	gmdss: "GMDSS",
	vso: "VSO",
	sash: "SASH",
	cyber: "CYBER",
	cyber_ot: "CYBER",
	cyber_key: "CYBER",
	fam: "FAM",
	internet: "INTERNET",
	hazmat: "HAZMAT"
};
//#endregion
export { sameGivenName as a, sameFamilyName as i, DOC_TYPE_TO_REQ as n, bestMatch as r, DEFAULT_REQUIREMENTS as t };
