import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { newId } from "@/lib/utils";
import { EXTRA_SEED, SEED_CREW } from "./seed";
import { CURRENT_CREW, PAST_PERMANENTS, ROSTER_SEED_VERSION } from "./current-seed";
import {
  NSE_KINDS,
  NSE_LABELS,
  NSE_SOURCE,
  NSE_VALIDITY_YEARS,
  PERMANENT_CREW,
  isNsePlaceholder,
  nseDocuments,
  type NseBoard,
  type NseBoardRow,
  type NseCertCell,
  type NseKind,
} from "./nse";
import { VESSEL_BILLETS, proposeBillet, billetByCode, canMoveBillet, canTradeBillet } from "./billets";
import {
  PERMANENT_SLOT_DEFS,
  coveringLabel,
  coveringTripRelief,
  isRatedUp,
  ratingKey,
  remainingUpgrades,
  rotationReturn,
  canRateUp,
  slotDefByKey,
  type PermanentBoardSlot,
  type PermanentChangeReason,
  type PermanentEvent,
  type PermanentsBoard,
} from "./permanents";
import { computeDueOff, defaultAssignmentForPosition, isOfficerRotary, normalizeAssignment, normalizeUnion, onExpiryBoard, parseWatch, remainingCoveredDays, rotaryLeaveCheck, rotaryLeaveDurationNote, setDateFromTour, snapExtraDays, unionForPosition, watchLabel } from "./shipping";
import { daysAboard, daysUntil, expiryTone, formatStamp, toIsoDate, addYears, todayUtc, credentialExpiryIso, laterExpiry } from "./dates";
import { mapCrew, mapDoc, mapForm, mapNok, mapReq, mapTour, detailToParsed } from "./map";
import { bestMatch, sameGivenName, sameFamilyName } from "./match";
import { mergeParsed, missingForPacket, emptyPerson, betterDate, keepLatestTickets, keepLatestDocuments, sameCertificate } from "./merge";
import { overlayParsedFields, usableTicketName, fillNameParts, nameFromFilename, pickPacketTextPages, isFilenameNoise, extractPersonFromText, ticketsLookComplete, fixCredentialDates } from "./parse-fields";
import { DEFAULT_VESSEL_RUN, deadJoinTickets, matePort, normalizePortName, walkOff } from "./ports";
import { DEFAULT_REQUIREMENTS, DOC_TYPE_TO_REQ } from "./requirements";
import { LEDGER_OWNER, SMS_CREWING_URL, SMS_URL, VESSEL } from "./types";
import {
  SMS_BOARD_NOTES,
  SMS_TRAINING,
  emptySmsSnapshot,
  overlayLiveRev,
  codedProcedureChecks,
  nseApplies,
  nseKindForCyber,
} from "./sms-training";
import { parseHazmatScore } from "./hazmat-quiz";
import type { CrewDetail, CrewListItem, CrewPerson, CrewStatus, CrewTour, PacketInput, ParsedPacketResult, ParsedPerson, ShipRoster, SignOnRequirement, VesselRun } from "./types";

const OWNER = LEDGER_OWNER;
const seedRef = globalThis as any;

// @ts-nocheck — restored from last compile; types loosened so the desk stays up

function liveCache() {
	seedRef.__ledgerLiveCache__ ??= /* @__PURE__ */ new Map();
	return seedRef.__ledgerLiveCache__;
}
function readLive(key) {
	const hit = liveCache().get(key);
	if (!hit || hit.exp < Date.now()) {
		if (hit) liveCache().delete(key);
		return null;
	}
	return hit.data;
}
function writeLive(key, data, ms = 12e3) {
	liveCache().set(key, {
		exp: Date.now() + ms,
		data
	});
}
function bustLiveCache() {
	liveCache().clear();
}
async function logInbox(row) {
	try {
		const sql = await getSql();
		await sql.query(`create table if not exists inbox_log (
      id text primary key,
      user_id text not null,
      filename text not null,
      crew_id text,
      full_name text,
      created boolean not null default false,
      error text,
      logged_at timestamptz not null default now()
    )`);
		await sql`
      insert into inbox_log (id, user_id, filename, crew_id, full_name, created, error)
      values (${newId("inb")}, ${OWNER}, ${row.filename}, ${txt(row.crewId)}::text, ${txt(row.fullName)}::text, ${Boolean(row.created)}, ${txt(row.error)}::text)
    `;
	} catch {
		/* log is best-effort */
	}
}
async function filePacketToLedger(p, match, filename) {
	const sql = await getSql();
	const warnings = [];
	let created = false;
	let crewId = match?.crewId ?? null;
	if (!crewId) {
		crewId = newId("crew");
		created = true;
		await sql`
      insert into crew (
        id, user_id, full_name, first_name, last_name, middle_name, ss_last4, dob, sex,
        place_of_birth, citizenship, race, hair_color, eye_color, height, weight,
        address_line, city, state, zip, home_phone, cell_phone, email, nearest_airport,
        airport_code, maritime_college, year_graduated, combat_veteran, marital_status,
        mmc_number, mmc_place_of_issue, mmc_expiration, passport_number, passport_expiration,
        status, last_position, last_vessel, glasses, spare_glasses, allergies, medications,
        medical_remarks, notes
      ) values (
        ${crewId}, ${OWNER}, ${p.fullName}, ${p.firstName}, ${p.lastName}, ${p.middleName},
        ${p.ssLast4}, ${p.dob}, ${p.sex}, ${p.placeOfBirth}, ${p.citizenship}, ${p.race},
        ${p.hairColor}, ${p.eyeColor}, ${p.height}, ${p.weight}, ${p.addressLine}, ${p.city},
        ${p.state}, ${p.zip}, ${p.homePhone}, ${p.cellPhone}, ${p.email}, ${p.nearestAirport},
        ${p.airportCode}, ${p.maritimeCollege}, ${p.yearGraduated}, ${Boolean(p.combatVeteran)},
        ${p.maritalStatus}, ${p.mmcNumber}, ${p.mmcPlaceOfIssue}, ${p.mmcExpiration},
        ${p.passportNumber}, ${p.passportExpiration}, ${"applicant"}, ${p.lastPosition}, ${VESSEL},
        ${Boolean(p.glasses)}, ${Boolean(p.spareGlasses)}, ${p.allergies}, ${p.medications}, ${p.medicalRemarks}, ${p.notes}
      )
    `;
		warnings.push(`Opened a new file for ${p.fullName}.`);
	} else {
		await sql`
      update crew set
        mmc_number = coalesce(${p.mmcNumber}, mmc_number),
        mmc_expiration = nullif(greatest(coalesce(mmc_expiration, ''), coalesce(${txt(p.mmcExpiration)}::text, '')), ''),
        passport_number = coalesce(${p.passportNumber}, passport_number),
        passport_expiration = nullif(greatest(coalesce(passport_expiration, ''), coalesce(${txt(p.passportExpiration)}::text, '')), ''),
        dob = coalesce(${p.dob}, dob),
        cell_phone = coalesce(${p.cellPhone}, cell_phone),
        email = coalesce(${p.email}, email),
        address_line = coalesce(${p.addressLine}, address_line),
        updated_at = now()
      where id = ${crewId} and user_id = ${OWNER}
    `;
	}
	if (p.nextOfKin && created) {
		const n = p.nextOfKin;
		await sql`
      insert into crew_nok (id, user_id, crew_id, full_name, relationship, address_line, city, state, zip, phone, cell_phone)
      values (${newId("nok")}, ${OWNER}, ${crewId}, ${n.fullName}, ${n.relationship}, ${n.addressLine},
        ${n.city}, ${n.state}, ${n.zip}, ${n.phone}, ${n.cellPhone})
    `;
	}
	const existingDocs = (await sql`select * from crew_documents where crew_id = ${crewId} and user_id = ${OWNER}`).map(mapDoc);
	for (const d of keepLatestDocuments(p.documents ?? [])) {
		const same = existingDocs.find((e) => sameCertificate(e, d));
		if (same) await sql`
      update crew_documents set
        label = ${d.label},
        doc_number = coalesce(${d.docNumber}, doc_number),
        issued_on = coalesce(${d.issuedOn}, issued_on),
        expires_on = nullif(greatest(coalesce(expires_on, ''), coalesce(${txt(d.expiresOn)}::text, '')), ''),
        notes = coalesce(${d.notes}, notes),
        source_packet = ${filename}
      where id = ${same.id} and user_id = ${OWNER}
    `;
		else await sql`
      insert into crew_documents (id, user_id, crew_id, doc_type, label, doc_number, issued_on, expires_on, notes, source_packet)
      values (${newId("doc")}, ${OWNER}, ${crewId}, ${d.docType}, ${d.label}, ${d.docNumber},
        ${d.issuedOn}, ${d.expiresOn}, ${d.notes}, ${filename})
    `;
	}
	const existingForms = (await sql`select * from crew_forms where crew_id = ${crewId} and user_id = ${OWNER}`).map(mapForm);
	for (const f of p.formsFound ?? []) {
		const same = existingForms.find((e) => e.formCode.toUpperCase() === String(f.code ?? "").toUpperCase());
		if (same) continue;
		await sql`
      insert into crew_forms (id, user_id, crew_id, tour_id, form_code, form_label, completed_on, present)
      values (${newId("form")}, ${OWNER}, ${crewId}, ${null}, ${f.code}, ${f.label}, ${f.completedOn}, true)
    `;
	}
	return {
		match: {
			crewId,
			fullName: match?.fullName || p.fullName,
			status: match?.status ?? "applicant",
			lastPosition: match?.lastPosition ?? p.lastPosition,
			confidence: match?.confidence ?? "low",
			reasons: match?.reasons ?? ["name"],
			priorTours: match?.priorTours ?? [],
		},
		created,
		warnings,
	};
}
/** PGLite cannot infer a type for a raw JS `null` bind. Cast at the SQL site. */
function txt(v) {
	return v ? v : null;
}
async function ensureLeaveColumns() {
	const sql = await getSql();
	await sql.query("alter table crew_tours add column if not exists leave_days integer not null default 0");
	await sql.query("alter table crew_tours add column if not exists leave_count integer not null default 0");
	await sql.query("alter table crew_tours add column if not exists leave_started_on text");
	await sql.query(`create table if not exists vessel_run (
      user_id text primary key,
      this_port text not null default 'Long Beach',
      next_port text not null default 'Honolulu',
      eta text,
      voyage_number text,
      updated_at timestamptz not null default now()
    )`);
}
function mapVesselRun(r) {
	if (!r) return { ...DEFAULT_VESSEL_RUN };
	return {
		thisPort: String(r.this_port || DEFAULT_VESSEL_RUN.thisPort),
		nextPort: String(r.next_port || DEFAULT_VESSEL_RUN.nextPort),
		eta: r.eta ? String(r.eta) : null,
		voyageNumber: r.voyage_number ? String(r.voyage_number) : null
	};
}
async function loadVesselRun() {
	await ensureLeaveColumns();
	const sql = await getSql();
	const rows = await sql`select * from vessel_run where user_id = ${OWNER}`;
	if (!rows[0]) {
		await sql`
      insert into vessel_run (user_id, this_port, next_port)
      values (${OWNER}, ${DEFAULT_VESSEL_RUN.thisPort}, ${DEFAULT_VESSEL_RUN.nextPort})
    `;
		return { ...DEFAULT_VESSEL_RUN };
	}
	return mapVesselRun(rows[0]);
}

async function overlayEmptyFromSeed(userId) {
	const sql = await getSql();
	for (const p of [...CURRENT_CREW, ...PAST_PERMANENTS]) {
		const rows = await sql`select id from crew where id = ${p.id} and user_id = ${userId} limit 1`;
		if (!rows.length) continue;
		const verified = p.id === "seed-thomas" || p.id === "seed-hines" || p.id === "seed-kluck";
		if (verified) {
			await sql`
        update crew set
          full_name = ${p.fullName},
          first_name = ${p.firstName},
          last_name = ${p.lastName},
          middle_name = ${txt(p.middleName)}::text,
          ss_last4 = ${txt(p.ssLast4)}::text,
          dob = ${txt(p.dob)}::text,
          sex = ${txt(p.sex)}::text,
          place_of_birth = ${txt(p.placeOfBirth)}::text,
          citizenship = ${txt(p.citizenship)}::text,
          race = ${txt(p.race)}::text,
          hair_color = ${txt(p.hairColor)}::text,
          eye_color = ${txt(p.eyeColor)}::text,
          height = ${txt(p.height)}::text,
          weight = ${txt(p.weight)}::text,
          address_line = ${txt(p.addressLine)}::text,
          city = ${txt(p.city)}::text,
          state = ${txt(p.state)}::text,
          zip = ${txt(p.zip)}::text,
          home_phone = ${txt(p.homePhone)}::text,
          cell_phone = ${txt(p.cellPhone)}::text,
          email = ${txt(p.email)}::text,
          nearest_airport = ${txt(p.nearestAirport)}::text,
          airport_code = ${txt(p.airportCode)}::text,
          marital_status = ${txt(p.maritalStatus)}::text,
          mmc_number = ${txt(p.mmcNumber)}::text,
          mmc_place_of_issue = ${txt(p.mmcPlaceOfIssue)}::text,
          mmc_expiration = ${txt(p.mmcExpiration)}::text,
          passport_number = ${txt(p.passportNumber)}::text,
          passport_expiration = ${txt(p.passportExpiration)}::text,
          medications = ${txt(p.medications)}::text,
          medical_remarks = ${txt(p.medicalRemarks)}::text,
          notes = ${txt(p.notes)}::text,
          seniority_class = ${txt(p.seniorityClass)}::text,
          glasses = ${p.glasses ?? false},
          updated_at = now()
        where id = ${p.id} and user_id = ${userId}
      `;
		}
		const haveDocs = await sql`select id, doc_type, expires_on, doc_number from crew_documents where crew_id = ${p.id} and user_id = ${userId}`;
		const byType = new Map(haveDocs.map((d) => [d.doc_type, d]));
		const seedDocs = [...(p.documents ?? [])];
		for (const d of nseDocuments(p.id)) {
			if (seedDocs.some((x) => x.docType === d.docType)) continue;
			seedDocs.push(d);
		}
		for (const d of seedDocs) {
			const existing = byType.get(d.docType);
			if (!existing) {
				await sql`
          insert into crew_documents (id, user_id, crew_id, doc_type, label, doc_number, issued_on, expires_on, notes, source_packet)
          values (${newId("doc")}, ${userId}, ${p.id}, ${d.docType}, ${d.label}, ${txt(d.docNumber)}::text,
            ${txt(d.issuedOn)}::text, ${txt(d.expiresOn)}::text, ${txt(d.notes)}::text, ${"sign-on packet"})
        `;
				continue;
			}
			if (!verified) continue;
			await sql`
        update crew_documents set
          label = ${d.label},
          doc_number = ${txt(d.docNumber)}::text,
          issued_on = ${txt(d.issuedOn)}::text,
          expires_on = ${txt(d.expiresOn)}::text,
          notes = ${txt(d.notes)}::text
        where id = ${existing.id} and user_id = ${userId}
      `;
		}
		const haveNok = await sql`select count(*)::int as n from crew_nok where crew_id = ${p.id} and user_id = ${userId}`;
		if (verified && (p.nok ?? []).length) {
			await sql`delete from crew_nok where crew_id = ${p.id} and user_id = ${userId}`;
			for (const n of p.nok) {
				await sql`
          insert into crew_nok (id, user_id, crew_id, full_name, relationship, address_line, city, state, zip, phone, cell_phone)
          values (${newId("nok")}, ${userId}, ${p.id}, ${n.fullName}, ${n.relationship}, ${txt(n.addressLine)}::text,
            ${txt(n.city)}::text, ${txt(n.state)}::text, ${txt(n.zip)}::text, ${txt(n.phone)}::text, ${txt(n.cellPhone)}::text)
        `;
			}
		} else if ((haveNok[0]?.n ?? 0) === 0) {
			for (const n of p.nok ?? []) {
				await sql`
          insert into crew_nok (id, user_id, crew_id, full_name, relationship, address_line, city, state, zip, phone, cell_phone)
          values (${newId("nok")}, ${userId}, ${p.id}, ${n.fullName}, ${n.relationship}, ${txt(n.addressLine)}::text,
            ${txt(n.city)}::text, ${txt(n.state)}::text, ${txt(n.zip)}::text, ${txt(n.phone)}::text, ${txt(n.cellPhone)}::text)
        `;
			}
		}
		const haveForms = await sql`select form_code from crew_forms where crew_id = ${p.id} and user_id = ${userId}`;
		const formHave = new Set(haveForms.map((f) => f.form_code));
		const openTour = await sql`select id from crew_tours where crew_id = ${p.id} and user_id = ${userId} and sign_off is null order by sign_on desc limit 1`;
		const tourId = openTour[0]?.id ?? null;
		for (const f of p.forms ?? []) {
			if (formHave.has(f.formCode)) {
				if (verified) {
					await sql`
            update crew_forms set
              present = true,
              form_label = ${f.formLabel},
              completed_on = coalesce(nullif(completed_on, ''), ${txt(f.completedOn)}::text)
            where crew_id = ${p.id} and user_id = ${userId} and form_code = ${f.formCode}
          `;
				}
				continue;
			}
			await sql`
        insert into crew_forms (id, user_id, crew_id, tour_id, form_code, form_label, completed_on, present)
        values (${newId("form")}, ${userId}, ${p.id}, ${txt(tourId)}::text, ${f.formCode}, ${f.formLabel}, ${txt(f.completedOn)}::text, true)
      `;
		}
		if (p.seniorityClass || p.tours?.[0]?.port) {
			await sql`
        update crew_tours set
          seniority_class = coalesce(nullif(seniority_class, ''), ${txt(p.seniorityClass)}::text),
          port = coalesce(nullif(port, ''), ${txt(p.tours[0]?.port)}::text),
          dispatch_ref = coalesce(nullif(dispatch_ref, ''), ${txt(p.tours[0]?.dispatchRef)}::text)
        where crew_id = ${p.id} and user_id = ${userId} and sign_off is null
      `;
		}
	}
	const mmcRows = await sql`
    select c.id as crew_id, c.mmc_expiration, d.id as doc_id, d.issued_on, d.expires_on
    from crew c
    left join crew_documents d on d.crew_id = c.id and d.user_id = ${userId} and d.doc_type = 'mmc'
    where c.user_id = ${userId}
  `;
	for (const r of mmcRows) {
		const issued = r.issued_on ? String(r.issued_on) : null;
		const exp = r.expires_on ? String(r.expires_on) : r.mmc_expiration ? String(r.mmc_expiration) : null;
		if (!issued || !exp || issued !== exp) continue;
		const next = addYears(issued, 5);
		if (!next) continue;
		await sql`update crew set mmc_expiration = ${next}, updated_at = now() where id = ${r.crew_id} and user_id = ${userId}`;
		if (r.doc_id) await sql`update crew_documents set expires_on = ${next} where id = ${r.doc_id} and user_id = ${userId}`;
	}
	bustLiveCache();
}

async function ensureSeeded(userId) {
	const key = `${userId}:${ROSTER_SEED_VERSION}:facts-7`;
	const hit = seedRef.__ledgerSeedMemo__;
	if (hit?.key === key) return hit.promise;
	let promise;
	promise = seedNow(userId).then(() => overlayEmptyFromSeed(userId)).catch((err) => {
		if (seedRef.__ledgerSeedMemo__?.promise === promise) seedRef.__ledgerSeedMemo__ = void 0;
		throw err;
	});
	seedRef.__ledgerSeedMemo__ = {
		key,
		promise
	};
	return promise;
}
async function seedNow(userId) {
	const sql = await getSql();
	if (((await sql`select version from roster_meta where user_id = ${userId}`)[0]?.version ?? 0) >= ROSTER_SEED_VERSION) return;
	await ensureLeaveColumns();
	if (((await sql`select count(*)::int as n from crew where user_id = ${userId}`)[0]?.n ?? 0) > 0) {
		await ensureRequirements(userId);
		await ensureExtraCrew(userId);
		await ensureRoster(userId);
		return;
	}
	for (const p of SEED_CREW) await insertSeedPerson(userId, p);
	await ensureRequirements(userId);
	await ensureRoster(userId);
}
async function loadCrewTables(scope = "desk", opts) {
	const sql = await getSql();
	const wantDocs = opts?.docs !== false;
	const wantTours = opts?.tours !== false;
	const latestOnly = opts?.tours === "latest" || opts?.tours === void 0 && scope === "desk";
	const people = (scope === "all" ? await sql`select * from crew where user_id = ${OWNER}` : await sql`
          select * from crew
          where user_id = ${OWNER}
            and (
              status in ('current', 'vacation')
              or assignment_type = ${"PERMANENT"}
              or permanent_rating is not null
            )
        `).map(mapCrew);
	const ids = people.map((p) => p.id);
	if (!ids.length) return {
		people,
		docs: [],
		tours: []
	};
	const [docs, tours] = await Promise.all([wantDocs ? rowsForCrewIds("crew_documents", ids) : Promise.resolve([]), wantTours ? latestOnly ? latestToursFor(ids) : rowsForCrewIds("crew_tours", ids, "order by sign_on desc") : Promise.resolve([])]);
	return {
		people,
		docs: docs.map(mapDoc),
		tours: tours.map(mapTour)
	};
}
async function rowsForCrewIds(table, ids, extra = "") {
	if (!ids.length) return [];
	const sql = await getSql();
	const ph = ids.map((_, i) => `$${i + 2}`).join(",");
	return sql.query(`select * from ${table} where user_id = $1 and crew_id in (${ph}) ${extra}`, [OWNER, ...ids]);
}
async function latestToursFor(ids) {
	if (!ids.length) return [];
	const sql = await getSql();
	const ph = ids.map((_, i) => `$${i + 2}`).join(",");
	return sql.query(`select distinct on (crew_id) * from crew_tours
     where user_id = $1 and crew_id in (${ph})
     order by crew_id, (sign_off is null) desc, sign_on desc`, [OWNER, ...ids]);
}
async function countCrewByStatus() {
	const rows = await (await getSql())`
    select status, count(*)::int as n from crew where user_id = ${OWNER} group by status
  `;
	const by = new Map(rows.map((r) => [r.status, r.n]));
	const current = by.get("current") ?? 0;
	const past = by.get("past") ?? 0;
	const vacation = by.get("vacation") ?? 0;
	const applicant = by.get("applicant") ?? 0;
	return {
		current,
		past,
		vacation,
		applicant,
		total: current + past + vacation + applicant
	};
}
async function countReturningReady() {
	return (await (await getSql())`
    select count(*)::int as n
    from crew c
    where c.user_id = ${OWNER}
      and c.status = 'past'
      and c.mmc_number is not null
      and not exists (
        select 1 from crew_documents d
        where d.crew_id = c.id and d.user_id = ${OWNER}
          and d.expires_on is not null and d.expires_on < ${todayUtc().toISOString().slice(0, 10)}
      )
  `)[0]?.n ?? 0;
}
async function ensureExtraCrew(userId) {
	const sql = await getSql();
	for (const p of EXTRA_SEED) {
		if ((await sql`
      select id from crew
      where user_id = ${userId}
        and (
          (${txt(p.mmcNumber)}::text is not null and mmc_number = ${txt(p.mmcNumber)}::text)
          or (ss_last4 = ${txt(p.ssLast4)}::text and last_name = ${p.lastName})
        )
      limit 1
    `).length) continue;
		await insertSeedPerson(userId, p);
	}
}
async function insertSeedPerson(userId, p) {
	const sql = await getSql();
	await sql`
      insert into crew (
        id, user_id, full_name, first_name, last_name, middle_name, ss_last4, dob, sex,
        place_of_birth, citizenship, race, hair_color, eye_color, height, weight,
        address_line, city, state, zip, home_phone, cell_phone, email, nearest_airport,
        airport_code, maritime_college, year_graduated, combat_veteran, marital_status,
        mmc_number, mmc_place_of_issue, mmc_expiration, passport_number, passport_expiration,
        status, last_position, last_vessel, glasses, spare_glasses, allergies, medications,
        medical_remarks, notes, union_hall, assignment_type, seniority_class, watch, billet_code, permanent_rating
      ) values (
        ${p.id}, ${userId}, ${p.fullName}, ${p.firstName}, ${p.lastName}, ${txt(p.middleName)}::text,
        ${txt(p.ssLast4)}::text, ${txt(p.dob)}::text, ${p.sex}, ${txt(p.placeOfBirth)}::text,
        ${txt(p.citizenship)}::text, ${txt(p.race)}::text, ${txt(p.hairColor)}::text, ${txt(p.eyeColor)}::text,
        ${txt(p.height)}::text, ${txt(p.weight)}::text, ${txt(p.addressLine)}::text, ${txt(p.city)}::text,
        ${txt(p.state)}::text, ${txt(p.zip)}::text, ${txt(p.homePhone)}::text, ${txt(p.cellPhone)}::text,
        ${txt(p.email)}::text, ${txt(p.nearestAirport)}::text, ${txt(p.airportCode)}::text,
        ${txt(p.maritimeCollege)}::text, ${txt(p.yearGraduated)}::text, ${p.combatVeteran ?? false},
        ${txt(p.maritalStatus)}::text, ${txt(p.mmcNumber)}::text, ${txt(p.mmcPlaceOfIssue)}::text,
        ${txt(p.mmcExpiration)}::text, ${txt(p.passportNumber)}::text, ${txt(p.passportExpiration)}::text,
        ${p.status}, ${txt(p.lastPosition)}::text, ${VESSEL}, ${p.glasses ?? false},
        ${p.spareGlasses ?? false}, ${txt(p.allergies)}::text, ${txt(p.medications)}::text,
        ${txt(p.medicalRemarks)}::text, ${txt(p.notes)}::text,
        ${txt(p.unionHall)}::text, ${txt(p.assignmentType)}::text, ${txt(p.seniorityClass)}::text,
        ${txt(p.watch)}::text, ${txt(p.billetCode)}::text, ${txt(p.permanentRating)}::text
      )
    `;
	for (const n of p.nok ?? []) await sql`
        insert into crew_nok (id, user_id, crew_id, full_name, relationship, address_line, city, state, zip, phone, cell_phone)
        values (${newId("nok")}, ${userId}, ${p.id}, ${n.fullName}, ${n.relationship}, ${txt(n.addressLine)}::text,
          ${txt(n.city)}::text, ${txt(n.state)}::text, ${txt(n.zip)}::text, ${txt(n.phone)}::text, ${txt(n.cellPhone)}::text)
      `;
	const docs = [...p.documents, ...nseDocuments(p.id).filter((d) => !p.documents.some((x) => x.docType === d.docType))];
	for (const d of docs) await sql`
        insert into crew_documents (id, user_id, crew_id, doc_type, label, doc_number, issued_on, expires_on, notes, source_packet)
        values (${newId("doc")}, ${userId}, ${p.id}, ${d.docType}, ${d.label}, ${txt(d.docNumber)}::text,
          ${txt(d.issuedOn)}::text, ${txt(d.expiresOn)}::text, ${txt(d.notes)}::text, ${"George II sign-on packet"})
      `;
	for (const t of p.tours) {
		const tourId = newId("tour");
		await sql`
        insert into crew_tours (id, user_id, crew_id, vessel, position, sign_on, sign_off, port, relieving, assignment_type, length_days, dispatch_ref, union_hall, notes, watch, due_off, due_off_rule, billet_code, seniority_class)
        values (${tourId}, ${userId}, ${p.id}, ${t.vessel ?? "M/V GEORGE II"}, ${t.position}, ${t.signOn}, ${txt(t.signOff)}::text,
          ${txt(t.port)}::text, ${txt(t.relieving)}::text, ${txt(t.assignmentType)}::text, ${t.lengthDays ?? null}::int,
          ${txt(t.dispatchRef)}::text, ${txt(t.unionHall)}::text, ${txt(t.notes)}::text,
          ${txt(t.watch)}::text, ${txt(t.dueOff)}::text, ${txt(t.dueOffRule)}::text, ${txt(t.billetCode)}::text, ${txt(t.seniorityClass)}::text)
      `;
		for (const f of p.forms) await sql`
          insert into crew_forms (id, user_id, crew_id, tour_id, form_code, form_label, completed_on, present)
          values (${newId("form")}, ${userId}, ${p.id}, ${tourId}, ${f.formCode}, ${f.formLabel}, ${txt(f.completedOn)}::text, true)
        `;
	}
	if (p.tours.length === 0) for (const f of p.forms) await sql`
          insert into crew_forms (id, user_id, crew_id, tour_id, form_code, form_label, completed_on, present)
          values (${newId("form")}, ${userId}, ${p.id}, ${null}::text, ${f.formCode}, ${f.formLabel}, ${txt(f.completedOn)}::text, true)
        `;
}
async function ensureRequirements(userId) {
	const sql = await getSql();
	const existing = await sql`select code from sign_on_requirements where user_id = ${userId}`;
	const have = new Set(existing.map((r) => r.code));
	for (const r of DEFAULT_REQUIREMENTS) {
		if (!have.has(r.code)) {
			await sql`
        insert into sign_on_requirements (id, user_id, code, label, kind, applies_to, required, source, sort_order, notes)
        values (${newId("req")}, ${userId}, ${r.code}, ${r.label}, ${r.kind}, ${r.appliesTo}, ${r.required}, ${r.source}, ${r.sortOrder}, ${txt(r.notes)}::text)
      `;
			continue;
		}
		if (r.code === "HAZMAT" || r.code === "CYBER" || r.code === "INTERNET") await sql`
        update sign_on_requirements set
          label = ${r.label},
          applies_to = ${r.appliesTo},
          notes = ${txt(r.notes)}::text
        where user_id = ${userId} and code = ${r.code}
      `;
	}
}
async function ensureRoster(userId) {
	const sql = await getSql();
	if (((await sql`select count(*)::int as n from vessel_billets where user_id = ${userId}`)[0]?.n ?? 0) === 0) for (const b of VESSEL_BILLETS) await sql`
        insert into vessel_billets (id, user_id, code, sort_order, title, short_title, department, watch, union_hall, default_assignment, notes)
        values (${newId("billet")}, ${userId}, ${b.code}, ${b.sortOrder}, ${b.title}, ${b.shortTitle}, ${b.department},
          ${txt(b.watch)}::text, ${b.unionHall}, ${b.defaultAssignment}, ${txt(b.notes)}::text)
      `;
	await ensurePermanentSlots(userId, false);
	const version = (await sql`select version from roster_meta where user_id = ${userId}`)[0]?.version ?? 0;
	if (version >= ROSTER_SEED_VERSION) return;
	for (const p of [...CURRENT_CREW, ...PAST_PERMANENTS]) await upsertSeedPerson(userId, p);
	await ensureNseDocs(userId);
	await ensurePermanentSlots(userId, version < 6);
	if (version < 10) await applyHuffmanScottPermanents(userId);
	if (version < 12) await applySeedV12(userId);
	await sql`
    insert into roster_meta (user_id, version, updated_at)
    values (${userId}, ${12}, now())
    on conflict (user_id) do update set version = ${12}, updated_at = now()
  `;
}
async function upsertSeedPerson(userId, p) {
	const sql = await getSql();
	const hit = await sql`
    select id from crew
    where user_id = ${userId}
      and (
        id = ${p.id}
        or (lower(coalesce(last_name, '')) = ${p.lastName.toLowerCase()} and lower(coalesce(first_name, '')) = ${p.firstName.toLowerCase()})
      )
    limit 1
  `;
	const crewId = hit[0]?.id ?? p.id;
	if (!hit.length) {
		await insertSeedPerson(userId, p);
		return;
	}
	await sql`
    update crew set
      full_name = ${p.fullName},
      first_name = ${p.firstName},
      last_name = ${p.lastName},
      status = ${p.status},
      last_position = coalesce(${txt(p.lastPosition)}::text, last_position),
      union_hall = coalesce(${txt(p.unionHall)}::text, union_hall),
      assignment_type = coalesce(${txt(p.assignmentType)}::text, assignment_type),
      seniority_class = coalesce(${txt(p.seniorityClass)}::text, seniority_class),
      watch = coalesce(${txt(p.watch)}::text, watch),
      billet_code = coalesce(${txt(p.billetCode)}::text, billet_code),
      permanent_rating = coalesce(${txt(p.permanentRating)}::text, permanent_rating),
      notes = coalesce(${txt(p.notes)}::text, notes),
      mmc_number = coalesce(${txt(p.mmcNumber)}::text, mmc_number),
      mmc_expiration = nullif(greatest(coalesce(mmc_expiration, ''), coalesce(${txt(p.mmcExpiration)}::text, '')), ''),
      passport_number = coalesce(${txt(p.passportNumber)}::text, passport_number),
      passport_expiration = nullif(greatest(coalesce(passport_expiration, ''), coalesce(${txt(p.passportExpiration)}::text, '')), ''),
      cell_phone = coalesce(${txt(p.cellPhone)}::text, cell_phone),
      email = coalesce(${txt(p.email)}::text, email),
      updated_at = now()
    where id = ${crewId} and user_id = ${userId}
  `;
	for (const t of p.tours) {
		const existing = await sql`
      select id from crew_tours
      where user_id = ${userId} and crew_id = ${crewId} and sign_on = ${t.signOn}
        and (sign_off is null or position = ${t.position})
      order by case when sign_off is null then 0 else 1 end
      limit 1
    `;
		if (existing.length) {
			await sql`
        update crew_tours set
          sign_off = ${txt(t.signOff)}::text,
          assignment_type = coalesce(${txt(t.assignmentType)}::text, assignment_type),
          union_hall = coalesce(${txt(t.unionHall)}::text, union_hall),
          watch = coalesce(${txt(t.watch)}::text, watch),
          due_off = coalesce(${txt(t.dueOff)}::text, due_off),
          due_off_rule = coalesce(${txt(t.dueOffRule)}::text, due_off_rule),
          billet_code = coalesce(${txt(t.billetCode)}::text, billet_code),
          seniority_class = coalesce(${txt(t.seniorityClass)}::text, seniority_class),
          length_days = coalesce(${t.lengthDays ?? null}::int, length_days),
          relieving = coalesce(${txt(t.relieving)}::text, relieving)
        where id = ${existing[0].id}
      `;
			continue;
		}
		await sql`
      insert into crew_tours (id, user_id, crew_id, vessel, position, sign_on, sign_off, port, relieving, assignment_type, length_days, dispatch_ref, union_hall, notes, watch, due_off, due_off_rule, billet_code, seniority_class)
      values (${newId("tour")}, ${userId}, ${crewId}, ${t.vessel ?? "M/V GEORGE II"}, ${t.position}, ${t.signOn}, ${txt(t.signOff)}::text,
        ${txt(t.port)}::text, ${txt(t.relieving)}::text, ${txt(t.assignmentType)}::text, ${t.lengthDays ?? null}::int,
        ${txt(t.dispatchRef)}::text, ${txt(t.unionHall)}::text, ${txt(t.notes)}::text,
        ${txt(t.watch)}::text, ${txt(t.dueOff)}::text, ${txt(t.dueOffRule)}::text, ${txt(t.billetCode)}::text, ${txt(t.seniorityClass)}::text)
    `;
	}
}
async function ensurePermanentSlots(userId, forceAssign) {
	const sql = await getSql();
	const existing = await sql`
    select slot_key, crew_id from vessel_permanent_slots where user_id = ${userId}
  `;
	const byKey = new Map(existing.map((r) => [String(r.slot_key), r.crew_id ? String(r.crew_id) : null]));
	for (const def of PERMANENT_SLOT_DEFS) {
		const current = byKey.get(def.key);
		if (current === void 0) {
			await sql`
        insert into vessel_permanent_slots (
          id, user_id, slot_key, rating, title, seat, union_hall, sailing_billet, on_sheet, sheet_name, sort_order, crew_id, notes
        ) values (
          ${newId("pslot")}, ${userId}, ${def.key}, ${def.rating}, ${def.title}, ${def.seat}, ${def.unionHall},
          ${def.sailingBillet}, ${def.onSheet}, ${def.sheetName}, ${def.sortOrder}, ${txt(def.defaultCrewId)}::text, ${null}::text
        )
      `;
			if (def.defaultCrewId) await sql`
          update crew set permanent_rating = coalesce(permanent_rating, ${def.rating}), assignment_type = coalesce(assignment_type, ${"PERMANENT"}), updated_at = now()
          where id = ${def.defaultCrewId} and user_id = ${userId}
        `;
			continue;
		}
		await sql`
      update vessel_permanent_slots
      set sheet_name = ${def.sheetName}, title = ${def.title}, rating = ${def.rating}
      where user_id = ${userId} and slot_key = ${def.key}
        and (sheet_name is distinct from ${def.sheetName} or title is distinct from ${def.title} or rating is distinct from ${def.rating})
    `;
		if (forceAssign && !current && def.defaultCrewId) {
			await sql`
        update vessel_permanent_slots set crew_id = ${def.defaultCrewId}, updated_at = now()
        where user_id = ${userId} and slot_key = ${def.key}
      `;
			await sql`
        update crew set permanent_rating = coalesce(permanent_rating, ${def.rating}), assignment_type = coalesce(assignment_type, ${"PERMANENT"}), updated_at = now()
        where id = ${def.defaultCrewId} and user_id = ${userId}
      `;
		}
	}
	const assigned = await sql`
    select crew_id, rating from vessel_permanent_slots
    where user_id = ${userId} and crew_id is not null
  `;
	for (const row of assigned) await sql`
      update crew set permanent_rating = coalesce(permanent_rating, ${row.rating}), updated_at = now()
      where id = ${row.crew_id} and user_id = ${userId} and permanent_rating is null
    `;
}
/** Huffman electrician / Kenya Scott cook are the permanents. Flynn and Yahia are trip relief covering them — not rotary. */
async function applyHuffmanScottPermanents(userId) {
	const sql = await getSql();
	for (const p of [{
		key: "perm-elec-a",
		crewId: "seed-huffman",
		rating: "ELECTRICIAN",
		covering: "seed-flynn-thomas",
		coveringName: "Richard Huffman"
	}, {
		key: "perm-cook-a",
		crewId: "seed-kenya-scott",
		rating: "COOK",
		covering: "seed-yahia",
		coveringName: "Kenya Scott"
	}]) {
		await sql`
      update vessel_permanent_slots
      set crew_id = ${p.crewId}, updated_at = now()
      where user_id = ${userId} and slot_key = ${p.key}
    `;
		await sql`
      update crew
      set permanent_rating = ${p.rating}, assignment_type = ${"PERMANENT"}, status = ${"vacation"}, updated_at = now()
      where id = ${p.crewId} and user_id = ${userId}
    `;
		await sql`
      update crew
      set permanent_rating = null, assignment_type = ${"RELIEF"}, updated_at = now()
      where id = ${p.covering} and user_id = ${userId}
    `;
		const open = await sql`
      select sign_on, union_hall, length_days from crew_tours
      where crew_id = ${p.covering} and user_id = ${userId} and sign_off is null
      limit 1
    `;
		const due = computeDueOff({
			signOn: open[0]?.sign_on ?? null,
			unionHall: open[0]?.union_hall ?? "SIU",
			assignmentType: "RELIEF",
			lengthDays: null
		});
		await sql`
      update crew_tours
      set assignment_type = ${"RELIEF"},
          relieving = ${p.coveringName},
          length_days = ${null}::int,
          due_off = coalesce(${txt(due.date)}::text, due_off),
          due_off_rule = ${due.rule}
      where crew_id = ${p.covering} and user_id = ${userId} and sign_off is null
    `;
	}
}
/** Stamp Cooper Class B on the open tour and keep Said on 06 — seed v11 missed tours whose position label had drifted. */
async function applySeedV12(userId) {
	const sql = await getSql();
	await sql`
    update crew
    set seniority_class = ${"B"}, notes = coalesce(notes, ${"SIU rotary AB, Class B on 86-067."}), updated_at = now()
    where user_id = ${userId} and id = ${"seed-cooper"}
  `;
	const open = await sql`
    select id, sign_on, union_hall, assignment_type, length_days, extra_days, leave_days, due_off_rule, due_off
    from crew_tours
    where crew_id = ${"seed-cooper"} and user_id = ${userId} and sign_off is null
    order by sign_on desc
  `;
	const keep = open[0];
	if (keep) {
		const explicit = /discharge|set date/i.test(keep.due_off_rule ?? "") ? keep.due_off : null;
		const due = computeDueOff({
			signOn: keep.sign_on,
			unionHall: keep.union_hall ?? "SIU",
			assignmentType: keep.assignment_type ?? "ROTARY",
			siuClass: "B",
			lengthDays: keep.length_days,
			extraDays: keep.extra_days,
			leaveDays: keep.leave_days,
			explicitEnd: explicit
		});
		await sql`
      update crew_tours
      set seniority_class = ${"B"},
          due_off = ${txt(due.date)}::text,
          due_off_rule = ${due.rule}
      where id = ${keep.id} and user_id = ${userId}
    `;
		for (const extra of open.slice(1)) await sql`
        update crew_tours set sign_off = coalesce(sign_off, ${keep.sign_on})
        where id = ${extra.id} and user_id = ${userId}
      `;
	}
	await sql`
    update crew
    set billet_code = ${"06"}, watch = ${"4-8"}, notes = ${"06 AB Day 4×8."}, updated_at = now()
    where user_id = ${userId} and id = ${"seed-said"}
  `;
	await sql`
    update crew_tours
    set billet_code = ${"06"}, watch = ${"4-8"}
    where crew_id = ${"seed-said"} and user_id = ${userId} and sign_off is null
  `;
}
async function logPermanentEvent(userId, slotId, crewId, eventType, reason, fromRating, toRating, notes) {
	const sql = await getSql();
	const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
	await sql`
    insert into permanent_events (id, user_id, slot_id, crew_id, event_type, reason, from_rating, to_rating, notes, occurred_on)
    values (${newId("pevt")}, ${userId}, ${slotId}, ${txt(crewId)}::text, ${eventType}, ${txt(reason)}::text,
      ${txt(fromRating)}::text, ${txt(toRating)}::text, ${txt(notes)}::text, ${today})
  `;
}
function coveringNamesFor(sailing, slots) {
	if (!sailing) return [];
	const key = ratingKey(sailing);
	return slots.filter((s) => ratingKey(s.rating) === key && s.holderName && s.holderStatus && s.holderStatus !== "current").map((s) => s.holderName);
}
async function applySailingRank(crewId, rating, billetCode) {
	const sql = await getSql();
	const billet = billetByCode(billetCode);
	const watch = billet?.watch ?? null;
	const title = billet?.title ?? rating;
	await sql`
    update crew set
      last_position = ${title},
      billet_code = ${billetCode},
      watch = ${txt(watch)}::text,
      updated_at = now()
    where id = ${crewId} and user_id = ${OWNER}
  `;
	await sql`
    update crew_tours set
      position = ${title},
      billet_code = ${billetCode},
      watch = ${txt(watch)}::text
    where crew_id = ${crewId} and user_id = ${OWNER} and sign_off is null
  `;
}
async function ensureNseDocs(userId) {
	const sql = await getSql();
	for (const slot of PERMANENT_CREW) {
		const hit = await sql`
      select id from crew
      where user_id = ${userId} and id = ${slot.id}
      limit 1
    `;
		if (!hit.length) continue;
		const crewId = hit[0].id;
		for (const d of nseDocuments(slot.id)) {
			const existing = await sql`
        select id, notes from crew_documents
        where user_id = ${userId} and crew_id = ${crewId} and doc_type = ${d.docType}
        limit 1
      `;
			if (!existing.length) {
				await sql`
          insert into crew_documents (id, user_id, crew_id, doc_type, label, doc_number, issued_on, expires_on, notes, source_packet)
          values (${newId("doc")}, ${userId}, ${crewId}, ${d.docType}, ${d.label}, ${null}::text,
            ${txt(d.issuedOn)}::text, ${txt(d.expiresOn)}::text, ${txt(d.notes)}::text, ${NSE_SOURCE})
        `;
				continue;
			}
			const notes = existing[0].notes ?? "";
			if (notes.includes("NS5") || notes.includes("placeholder")) await sql`
          update crew_documents set
            label = ${d.label},
            issued_on = ${txt(d.issuedOn)}::text,
            expires_on = ${txt(d.expiresOn)}::text,
            notes = ${txt(d.notes)}::text
          where id = ${existing[0].id} and user_id = ${userId}
        `;
		}
	}
}
function tourDue(t, siuFallback) {
	const openLeave = t.leaveStartedOn ? daysAboard(t.leaveStartedOn) ?? 0 : 0;
	return computeDueOff({
		signOn: t.signOn,
		unionHall: t.unionHall,
		assignmentType: t.assignmentType,
		siuClass: t.seniorityClass ?? siuFallback ?? null,
		lengthDays: t.lengthDays,
		explicitEnd: setDateFromTour(t),
		extraDays: t.extraDays ?? 0,
		leaveDays: (t.leaveDays ?? 0) + openLeave
	});
}
export const bootstrapLedger = createServerFn({ method: "GET" }).handler(async () => {
	await ensureSeeded(OWNER);
	return { ok: true };
});
export const getDashboard = createServerFn({ method: "GET" }).handler(async () => {
	await ensureSeeded(OWNER);
	const cached = readLive("dashboard");
	if (cached?.run) return cached;
	const [{ people, docs, tours }, counts, returningReady, run] = await Promise.all([
		loadCrewTables("desk"),
		countCrewByStatus(),
		countReturningReady(),
		loadVesselRun()
	]);
	const docsByCrew = /* @__PURE__ */ new Map();
	for (const d of docs) {
		const arr = docsByCrew.get(d.crewId) ?? [];
		arr.push(d);
		docsByCrew.set(d.crewId, arr);
	}
	const toursByCrew = /* @__PURE__ */ new Map();
	for (const t of tours) {
		const arr = toursByCrew.get(t.crewId) ?? [];
		arr.push(t);
		toursByCrew.set(t.crewId, arr);
	}
	const list = people.map((p) => toListItem(p, docsByCrew.get(p.id) ?? [], toursByCrew.get(p.id) ?? []));
	const boardIds = new Set(people.filter((p) => onExpiryBoard(p)).map((p) => p.id));
	const onBoard = (d) => boardIds.has(d.crewId);
	const expiredDocs = docs.filter((d) => onBoard(d) && expiryTone(d.expiresOn) === "expired");
	const soonDocs = docs.filter((d) => onBoard(d) && expiryTone(d.expiresOn) === "soon");
	const watchDocs = docs.filter((d) => onBoard(d) && expiryTone(d.expiresOn) === "watch");
	const current = list.filter((p) => p.status === "current");
	const dueSoonCrew = current.filter((p) => {
		const d = daysUntil(p.lastDueOff);
		return d !== null && d >= 0 && d <= 14;
	}).length;
	const overdueCrew = current.filter((p) => {
		const d = daysUntil(p.lastDueOff);
		return d !== null && d < 0;
	}).length;
	const occupied = new Set(current.map((p) => p.lastBillet).filter(Boolean));
	const vacantBillets = VESSEL_BILLETS.filter((b) => !occupied.has(b.code)).length;
	const stats = {
		current: counts.current,
		past: counts.past,
		total: counts.total,
		expiredDocs: expiredDocs.length,
		soonDocs: soonDocs.length,
		watchDocs: watchDocs.length,
		returningReady,
		dueSoonCrew,
		vacantBillets,
		overdueCrew,
		sailingUp: current.filter((p) => isRatedUp(p.permanentRating, p.lastPosition)).length
	};
	const alerts = [...expiredDocs, ...soonDocs].sort((a, b) => (a.expiresOn ?? "").localeCompare(b.expiresOn ?? "")).slice(0, 12).map((d) => ({
		...d,
		marinerName: people.find((p) => p.id === d.crewId)?.fullName ?? "Unknown"
	}));
	const payload = {
		stats,
		current: current.sort((a, b) => (a.lastBillet ?? "99").localeCompare(b.lastBillet ?? "99")),
		alerts,
		run
	};
	writeLive("dashboard", payload);
	return payload;
});
function toListItem(p, docs, tours) {
	const expiredCount = docs.filter((d) => expiryTone(d.expiresOn) === "expired").length;
	const soonCount = docs.filter((d) => expiryTone(d.expiresOn) === "soon").length;
	const last = tours.find((t) => !t.signOff) ?? tours[0];
	const due = last ? tourDue(last) : null;
	const haz = docs.find((d) => d.docType === "hazmat");
	return {
		...p,
		tourCount: tours.length,
		lastSignOn: last?.signOn ?? null,
		lastSignOff: last?.signOff ?? null,
		lastDueOff: due?.date ?? last?.dueOff ?? null,
		lastWatch: last?.watch ?? p.watch,
		lastAssignment: last?.assignmentType ?? p.assignmentType,
		lastBillet: last?.billetCode ?? p.billetCode,
		expiredCount,
		soonCount,
		hazmatScore: parseHazmatScore(haz?.docNumber) ?? parseHazmatScore(haz?.notes),
		hazmatIssued: haz?.issuedOn ?? null
	};
}
export const listCrew = createServerFn({ method: "GET" }).handler(async () => {
	await ensureSeeded(OWNER);
	const cached = readLive("listCrew");
	if (cached) return cached;
	const { people, tours } = await loadCrewTables("all", {
		docs: false,
		tours: "latest"
	});
	const toursByCrew = groupBy(tours, (t) => t.crewId);
	const list = people.map((p) => toListItem(p, [], toursByCrew.get(p.id) ?? []));
	writeLive("listCrew", list);
	return list;
});
function buildRoster(list, toursByCrew) {
	const current = list.filter((p) => p.status === "current");
	const vacation = list.filter((p) => p.status === "vacation");
	const openTour = (p) => (toursByCrew.get(p.id) ?? []).find((t) => !t.signOff) ?? (toursByCrew.get(p.id) ?? [])[0];
	const slots = VESSEL_BILLETS.map((billet) => {
		return {
			billet,
			occupants: current.filter((p) => (p.lastBillet ?? p.billetCode) === billet.code).map((crew) => {
				const tour = openTour(crew);
				const due = tour ? tourDue(tour, crew.seniorityClass) : computeDueOff({
					signOn: crew.lastSignOn,
					unionHall: crew.unionHall,
					assignmentType: crew.assignmentType,
					siuClass: crew.seniorityClass ?? null,
					explicitEnd: crew.lastDueOff
				});
				return {
					crew,
					tour: tour ?? {
						id: "",
						crewId: crew.id,
						vessel: "M/V GEORGE II",
						position: crew.lastPosition,
						signOn: crew.lastSignOn,
						signOff: null,
						port: null,
						relieving: null,
						assignmentType: crew.assignmentType,
						lengthDays: null,
						dispatchRef: null,
						unionHall: crew.unionHall,
						notes: null,
						watch: crew.watch,
						dueOff: due.date,
						dueOffRule: due.rule,
						billetCode: billet.code,
						seniorityClass: crew.seniorityClass,
						extraDays: 0,
						leaveDays: 0,
						leaveCount: 0,
						leaveStartedOn: null
					},
					due,
					daysOn: daysAboard(crew.lastSignOn),
					daysLeft: daysUntil(due.date),
					extraDays: tour?.extraDays ?? due.extraDays ?? 0,
					sailingUp: isRatedUp(crew.permanentRating, crew.lastPosition),
					covering: coveringLabel(crew.permanentRating, crew.lastPosition)
				};
			})
		};
	});
	const questions = [];
	for (const slot of slots) if (slot.occupants.length > 1) questions.push({
		id: `overfill-${slot.billet.code}`,
		severity: "ask",
		title: `${slot.billet.shortTitle} has ${slot.occupants.length} names`,
		detail: `${slot.occupants.map((o) => o.crew.fullName).join(" and ")} are both on this slot. Move one, or confirm a double-up.`,
		billetCode: slot.billet.code
	});
	const six = slots.find((s) => s.billet.code === "06");
	const five = slots.find((s) => s.billet.code === "05");
	if (six && !six.occupants.length && five && five.occupants.length > 1) questions.push({
		id: "q-ab-day-06",
		severity: "ask",
		title: "06 AB Day 4×8 is empty",
		detail: "Articles list two people on 05 AB Day 12×4. Should Zaid Said sit 06 instead?",
		billetCode: "06",
		crewId: five.occupants.find((o) => /said/i.test(o.crew.lastName ?? ""))?.crew.id
	});
	const siuUnknown = [];
	for (const slot of slots) for (const o of slot.occupants) {
		if (o.crew.unionHall === "SIU" && (o.tour.assignmentType ?? "").toUpperCase() === "ROTARY" && !o.tour.seniorityClass && !o.crew.seniorityClass) siuUnknown.push(o);
		if ((o.tour.assignmentType ?? "").toUpperCase() === "CADET" && !o.due.date) questions.push({
			id: `cadet-${o.crew.id}`,
			severity: "ask",
			title: `${o.crew.fullName} · cadet off date`,
			detail: "School assignments don't follow union tour length. Enter the due-off when you have it.",
			crewId: o.crew.id,
			billetCode: slot.billet.code
		});
		if (!slot.billet.watch && !o.tour.watch) questions.push({
			id: `watch-${o.crew.id}`,
			severity: "ask",
			title: `${o.crew.fullName} · watch not on articles`,
			detail: `${slot.billet.title} did not print a watch. Assign 12–4, 4–8, 8–12, or day.`,
			crewId: o.crew.id,
			billetCode: slot.billet.code
		});
	}
	if (siuUnknown.length) questions.push({
		id: "siu-class-unknown",
		severity: "ask",
		title: `${siuUnknown.length} SIU rotary · class not on file`,
		detail: `${siuUnknown.map((o) => o.crew.fullName).join(", ")}. Class is not on file — planning the Class A freightship latest of 75–120 days. Set Class A (75–120), B (180d or 1 RT), or C (60d or 1 RT) on their file.`
	});
	if (vacation.some((v) => /shahbin/i.test(v.fullName))) {
		const rafik = vacation.find((v) => /shahbin/i.test(v.fullName));
		const partner = current.find((p) => (p.lastBillet ?? p.billetCode) === (rafik?.lastBillet ?? rafik?.billetCode ?? "01") && p.id !== rafik?.id);
		questions.push({
			id: "q-shahbin",
			severity: "ask",
			title: "Rafik Shahbin is on vacation",
			detail: partner?.lastDueOff ? `Permanent C/M. Returns when ${partner.fullName} is due off ${partner.lastDueOff}.` : "Permanent C/M, no packet on file. Return is the due-off of the chief mate aboard.",
			crewId: rafik?.id
		});
	}
	if (vacation.some((v) => /huffman/i.test(v.fullName))) {
		const huffman = vacation.find((v) => /huffman/i.test(v.fullName));
		const covering = current.find((p) => (p.lastBillet ?? p.billetCode) === (huffman?.lastBillet ?? huffman?.billetCode ?? "15") && p.id !== huffman?.id);
		questions.push({
			id: "q-huffman",
			severity: "ask",
			title: "Richard Huffman is on vacation",
			detail: covering?.lastDueOff ? `Permanent electrician. ${covering.fullName} is trip relief — not rotary. Returns when ${covering.fullName} is due off ${covering.lastDueOff}.` : "Permanent electrician. Flynn is trip relief covering him — not rotary. Rotary means you have the job and can take vacation.",
			crewId: huffman?.id
		});
	}
	if (vacation.some((v) => /kenya\s+scott/i.test(v.fullName))) {
		const kenya = vacation.find((v) => /kenya\s+scott/i.test(v.fullName));
		const covering = current.find((p) => (p.lastBillet ?? p.billetCode) === (kenya?.lastBillet ?? kenya?.billetCode ?? "21") && p.id !== kenya?.id);
		questions.push({
			id: "q-kenya-scott",
			severity: "ask",
			title: "Kenya Scott is on vacation",
			detail: covering?.lastDueOff ? `Permanent cook. ${covering.fullName} is trip relief — not rotary. Returns when ${covering.fullName} is due off ${covering.lastDueOff}.` : "Permanent cook. Yahia is trip relief covering her — not rotary.",
			crewId: kenya?.id
		});
	}
	for (const slot of slots) for (const o of slot.occupants) if ((o.tour.assignmentType ?? "").toUpperCase() === "ROTARY" && o.tour.relieving) questions.push({
		id: `covering-rotary-${o.crew.id}`,
		severity: "ask",
		title: `${o.crew.fullName} is covering ${o.tour.relieving}`,
		detail: "Covering someone who still holds the job is trip relief, not rotary. Rotary means they have the job and can take vacation. Switch this assignment to Relief.",
		crewId: o.crew.id,
		billetCode: slot.billet.code
	});
	const ratedUp = slots.flatMap((s) => s.occupants).filter((o) => o.sailingUp);
	if (ratedUp.length) questions.push({
		id: "rated-up",
		severity: "warn",
		title: `${ratedUp.length} permanent${ratedUp.length === 1 ? "" : "s"} rated up`,
		detail: ratedUp.map((o) => {
			const perm = o.crew.permanentRating ?? "unrated";
			const sail = o.crew.lastPosition ?? "unknown";
			return `${o.crew.fullName} is permanent ${perm}, ${o.covering ?? `rated as ${sail}`}.`;
		}).join(" ")
	});
	return {
		slots,
		vacation,
		questions,
		dueSoon: slots.flatMap((s) => s.occupants).filter((o) => o.daysLeft !== null && o.daysLeft <= 14 && o.daysLeft >= 0).length,
		overdue: slots.flatMap((s) => s.occupants).filter((o) => o.daysLeft !== null && o.daysLeft < 0).length,
		vacant: slots.filter((s) => s.occupants.length === 0).length,
		aboard: slots.reduce((n, s) => n + s.occupants.length, 0)
	};
}
export const getShipRoster = createServerFn({ method: "GET" }).handler(async () => {
	await ensureSeeded(OWNER);
	const cached = readLive("shipRoster");
	if (cached?.run) return cached;
	const { people, docs, tours } = await loadCrewTables("desk");
	const docsByCrew = groupBy(docs, (d) => d.crewId);
	const toursByCrew = groupBy(tours, (t) => t.crewId);
	const roster = buildRoster(people.map((p) => toListItem(p, docsByCrew.get(p.id) ?? [], toursByCrew.get(p.id) ?? [])), toursByCrew);
	const run = await loadVesselRun();
	const payload = {
		...roster,
		run
	};
	writeLive("shipRoster", payload);
	return payload;
});
export const getVesselRun = createServerFn({ method: "GET" }).handler(async () => {
	await ensureSeeded(OWNER);
	return loadVesselRun();
});
export const saveVesselRun = createServerFn({ method: "POST" }).validator((input) => input).handler(async ({ data }) => {
	bustLiveCache();
	await ensureLeaveColumns();
	const sql = await getSql();
	const thisPort = normalizePortName(data.thisPort) ?? DEFAULT_VESSEL_RUN.thisPort;
	const nextPort = normalizePortName(data.nextPort) ?? matePort(thisPort);
	const eta = data.eta ? data.eta : null;
	const voyageNumber = data.voyageNumber ? data.voyageNumber.trim() || null : null;
	await sql`
      insert into vessel_run (user_id, this_port, next_port, eta, voyage_number, updated_at)
      values (${OWNER}, ${thisPort}, ${nextPort}, ${txt(eta)}::text, ${txt(voyageNumber)}::text, now())
      on conflict (user_id) do update set
        this_port = excluded.this_port,
        next_port = excluded.next_port,
        eta = excluded.eta,
        voyage_number = excluded.voyage_number,
        updated_at = now()
    `;
	return {
		thisPort,
		nextPort,
		eta,
		voyageNumber
	};
});
export const updateCrewIdentity = createServerFn({ method: "POST" }).validator((input) => input).handler(async ({ data }) => {
	bustLiveCache();
	const sql = await getSql();
	if (!(await sql`select * from crew where id = ${data.crewId} and user_id = ${OWNER}`)[0]) throw new Error("Mariner not found");
	const fullName = data.firstName && data.lastName ? [
		data.firstName,
		data.middleName,
		data.lastName
	].filter(Boolean).join(" ").trim() : null;
	await sql`
      update crew set
        sex = coalesce(${txt(data.sex)}::text, sex),
        dob = coalesce(${txt(data.dob)}::text, dob),
        place_of_birth = coalesce(${txt(data.placeOfBirth)}::text, place_of_birth),
        citizenship = coalesce(${txt(data.citizenship)}::text, citizenship),
        cell_phone = coalesce(${txt(data.cellPhone)}::text, cell_phone),
        first_name = coalesce(${txt(data.firstName)}::text, first_name),
        last_name = coalesce(${txt(data.lastName)}::text, last_name),
        middle_name = coalesce(${txt(data.middleName)}::text, middle_name),
        full_name = coalesce(${txt(fullName)}::text, full_name),
        passport_number = coalesce(${txt(data.passportNumber)}::text, passport_number),
        passport_expiration = coalesce(${txt(data.passportExpiration)}::text, passport_expiration),
        updated_at = now()
      where id = ${data.crewId} and user_id = ${OWNER}
    `;
	if (data.embarkPort !== void 0) await sql`
        update crew_tours set port = ${txt(normalizePortName(data.embarkPort))}::text
        where crew_id = ${data.crewId} and user_id = ${OWNER} and sign_off is null
      `;
	return loadCrewDetail(data.crewId);
});
export const exportLedger = createServerFn({ method: "GET" }).handler(async () => {
	await ensureSeeded(OWNER);
	const sql = await getSql();
	const [people, documents, tours, nok, run] = await Promise.all([
		sql`select * from crew where user_id = ${OWNER} order by last_name, full_name`,
		sql`select * from crew_documents where user_id = ${OWNER}`,
		sql`select * from crew_tours where user_id = ${OWNER} order by sign_on desc`,
		sql`select * from crew_nok where user_id = ${OWNER}`,
		loadVesselRun()
	]);
	return {
		vessel: VESSEL,
		exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
		run,
		people: people.map(mapCrew),
		documents: documents.map(mapDoc),
		tours: tours.map(mapTour),
		nok: nok.map(mapNok)
	};
});
export const updateAssignment = createServerFn({ method: "POST" }).validator((input) => input).handler(async ({ data }) => applyAssignment(data));
async function applyAssignment(data) {
	bustLiveCache();
	const sql = await getSql();
	const crewRows = await sql`select * from crew where id = ${data.crewId} and user_id = ${OWNER}`;
	if (!crewRows[0]) throw new Error("Mariner not found");
	const person = mapCrew(crewRows[0]);
	const tours = (await sql`select * from crew_tours where crew_id = ${data.crewId} and user_id = ${OWNER} order by sign_on desc`).map(mapTour);
	const open = tours.find((t) => !t.signOff) ?? tours[0];
	const currentCode = open?.billetCode ?? person.billetCode;
	if (data.billetCode && currentCode && data.billetCode !== currentCode && !canMoveBillet(currentCode, data.billetCode)) {
		const from = billetByCode(currentCode);
		const to = billetByCode(data.billetCode);
		throw new Error(`Stay in ${from?.department ?? "the same"} department. ${from?.title ?? "This job"} does not go to ${to?.title ?? "another department"}.`);
	}
	const billet = VESSEL_BILLETS.find((b) => b.code === (data.billetCode ?? open?.billetCode ?? person.billetCode));
	const assignmentType = data.assignmentType !== void 0 ? data.assignmentType || billet?.defaultAssignment || defaultAssignmentForPosition(person.lastPosition) : open?.assignmentType ?? person.assignmentType ?? billet?.defaultAssignment ?? defaultAssignmentForPosition(person.lastPosition);
	const unionHall = data.unionHall !== void 0 ? normalizeUnion(data.unionHall) ?? billet?.unionHall ?? unionForPosition(person.lastPosition) : normalizeUnion(open?.unionHall ?? person.unionHall) ?? billet?.unionHall ?? unionForPosition(person.lastPosition);
	const watch = data.watch !== void 0 ? data.watch || billet?.watch || null : open?.watch ?? person.watch ?? billet?.watch ?? null;
	const seniorityClass = data.seniorityClass !== void 0 ? data.seniorityClass || null : open?.seniorityClass ?? person.seniorityClass;
	const lengthDays = data.lengthDays !== void 0 ? data.lengthDays : open?.lengthDays ?? null;
	const extraDays = data.extraDays !== void 0 ? snapExtraDays(Math.trunc(data.extraDays ?? 0)) : data.dueOff !== void 0 ? 0 : snapExtraDays(open?.extraDays ?? 0);
	const leaveDays = open?.leaveDays ?? 0;
	const explicitEnd = data.dueOff !== void 0 ? data.dueOff : open ? setDateFromTour(open) : null;
	const due = computeDueOff({
		signOn: open?.signOn ?? null,
		unionHall,
		assignmentType,
		siuClass: seniorityClass ?? null,
		lengthDays,
		explicitEnd,
		extraDays,
		leaveDays
	});
	await sql`
      update crew set
        last_position = coalesce(${txt(billet?.title)}::text, last_position),
        union_hall = ${txt(unionHall)}::text,
        assignment_type = ${txt(assignmentType)}::text,
        seniority_class = ${txt(seniorityClass)}::text,
        watch = ${txt(watch)}::text,
        billet_code = ${txt(billet?.code ?? data.billetCode)}::text,
        updated_at = now()
      where id = ${data.crewId} and user_id = ${OWNER}
    `;
	if (open?.id) {
		const port = data.port !== void 0 ? normalizePortName(data.port) : open.port;
		await sql`
        update crew_tours set
          position = coalesce(${txt(billet?.title)}::text, position),
          assignment_type = ${txt(assignmentType)}::text,
          union_hall = ${txt(unionHall)}::text,
          watch = ${txt(watch)}::text,
          due_off = ${txt(due.date)}::text,
          due_off_rule = ${due.rule},
          billet_code = ${txt(billet?.code ?? data.billetCode)}::text,
          seniority_class = ${txt(seniorityClass)}::text,
          length_days = ${lengthDays ?? null}::int,
          extra_days = ${extraDays}::int,
          port = ${txt(port)}::text
        where id = ${open.id} and user_id = ${OWNER}
      `;
	}
	return {
		ok: true,
		due,
		extraDays
	};
}
function appendNote(existing, line) {
	const cur = (existing ?? "").trim();
	if (!line) return cur;
	if (cur.includes(line)) return cur;
	return cur ? `${cur}\n${line}` : line;
}
function lastNameOf(fullName, lastName) {
	if (lastName?.trim()) return lastName.trim();
	const parts = fullName.trim().split(/\s+/);
	return parts[parts.length - 1] ?? fullName;
}
async function stampTradeNotes(crewId, tourId, line) {
	const sql = await getSql();
	await sql`update crew set notes = ${appendNote((await sql`select notes from crew where id = ${crewId} and user_id = ${OWNER}`)[0]?.notes, line)}, updated_at = now() where id = ${crewId} and user_id = ${OWNER}`;
	if (tourId) await sql`update crew_tours set notes = ${appendNote((await sql`select notes from crew_tours where id = ${tourId} and user_id = ${OWNER}`)[0]?.notes, line)} where id = ${tourId} and user_id = ${OWNER}`;
}
async function stampBillet(crewId, tourId, billet) {
	const sql = await getSql();
	await sql`
    update crew set
      last_position = ${billet.title},
      watch = ${txt(billet.watch)}::text,
      billet_code = ${billet.code},
      updated_at = now()
    where id = ${crewId} and user_id = ${OWNER}
  `;
	if (tourId) await sql`
      update crew_tours set
        position = ${billet.title},
        watch = ${txt(billet.watch)}::text,
        billet_code = ${billet.code}
      where id = ${tourId} and user_id = ${OWNER}
    `;
}
export const changeBillet = createServerFn({ method: "POST" }).validator((input) => input).handler(async ({ data }) => {
	bustLiveCache();
	const to = billetByCode(data.toBillet);
	if (!to) throw new Error("Unknown billet");
	const sql = await getSql();
	const crewRows = await sql`select * from crew where id = ${data.crewId} and user_id = ${OWNER}`;
	if (!crewRows[0]) throw new Error("Mariner not found");
	const person = mapCrew(crewRows[0]);
	const tours = (await sql`select * from crew_tours where crew_id = ${data.crewId} and user_id = ${OWNER} order by sign_on desc`).map(mapTour);
	const open = tours.find((t) => !t.signOff) ?? tours[0];
	const fromCode = open?.billetCode ?? person.billetCode;
	if (!fromCode) throw new Error("No current billet on file");
	if (fromCode === to.code) return {
		ok: true,
		kind: "same",
		toTitle: to.title
	};
	const others = (await sql`
      select * from crew
      where user_id = ${OWNER} and status = ${"current"} and id <> ${data.crewId} and billet_code = ${to.code}
    `).map(mapCrew);
	if (others.length > 1) throw new Error(`${to.shortTitle} already has ${others.length} names. Move one first.`);
	const other = others[0];
	if (other) {
		if (!canTradeBillet(fromCode, to.code)) throw new Error("Trade watches with the same rating only — not across departments, and not AB with Master.");
		const from = billetByCode(fromCode);
		if (!from) throw new Error("Unknown current billet");
		const otherTours = (await sql`select * from crew_tours where crew_id = ${other.id} and user_id = ${OWNER} order by sign_on desc`).map(mapTour);
		const otherOpen = otherTours.find((t) => !t.signOff) ?? otherTours[0];
		await stampBillet(person.id, open?.id ?? null, to);
		await stampBillet(other.id, otherOpen?.id ?? null, from);
		const when = formatStamp();
		const personLine = `Traded ${watchLabel(from.watch)} with ${lastNameOf(other.fullName, other.lastName)}, ${when}.`;
		const otherLine = `Traded ${watchLabel(to.watch)} with ${lastNameOf(person.fullName, person.lastName)}, ${when}.`;
		await stampTradeNotes(person.id, open?.id ?? null, personLine);
		await stampTradeNotes(other.id, otherOpen?.id ?? null, otherLine);
		return {
			ok: true,
			kind: "trade",
			withName: other.fullName,
			toTitle: to.title,
			fromTitle: from.title,
			stamp: personLine
		};
	}
	if (!canMoveBillet(fromCode, to.code)) throw new Error("Stay in the same department. Deck does not go to engine, engine does not go to steward.");
	await stampBillet(person.id, open?.id ?? null, to);
	return {
		ok: true,
		kind: "move",
		toTitle: to.title
	};
});
export const addExtraDays = createServerFn({ method: "POST" }).validator((input) => input).handler(async ({ data }) => applyAssignment({
	crewId: data.crewId,
	extraDays: data.extraDays
}));
export const getPermanentsBoard = createServerFn({ method: "GET" }).handler(async () => {
	await ensureSeeded(OWNER);
	const sql = await getSql();
	const [{ people, tours }, rows] = await Promise.all([loadCrewTables("desk", {
		docs: false,
		tours: "latest"
	}), sql`
        select * from vessel_permanent_slots where user_id = ${OWNER} order by sort_order, seat
      `]);
	const byId = new Map(people.map((p) => [p.id, p]));
	const toursByCrew = groupBy(tours, (t) => t.crewId);
	const sketch = rows.map((r) => {
		const holder = r.crew_id ? byId.get(String(r.crew_id)) : null;
		return {
			rating: r.rating,
			holderName: holder?.fullName ?? null,
			holderStatus: holder?.status ?? null
		};
	});
	const slots = rows.map((r) => {
		const holderPerson = r.crew_id ? byId.get(String(r.crew_id)) : null;
		const lastTour = holderPerson ? (toursByCrew.get(holderPerson.id) ?? []).find((t) => !t.signOff) ?? (toursByCrew.get(holderPerson.id) ?? [])[0] : null;
		const due = lastTour ? tourDue(lastTour) : null;
		const holder = holderPerson ? {
			id: holderPerson.id,
			fullName: holderPerson.fullName,
			status: holderPerson.status,
			permanentRating: holderPerson.permanentRating,
			lastPosition: holderPerson.lastPosition,
			billetCode: holderPerson.billetCode,
			watch: holderPerson.watch,
			assignmentType: holderPerson.assignmentType,
			dueOff: due?.date ?? lastTour?.dueOff ?? null
		} : null;
		const perm = holder?.permanentRating ?? r.rating;
		const sailing = holder?.lastPosition ?? null;
		const names = coveringNamesFor(sailing, sketch).filter((n) => n !== holder?.fullName);
		const covering = coveringLabel(perm, sailing);
		const ret = rotationReturn({
			sailingBillet: r.sailing_billet,
			holder,
			partners: [],
			sailors: []
		});
		return {
			id: String(r.id),
			key: r.slot_key,
			rating: r.rating,
			title: r.title,
			seat: r.seat,
			unionHall: r.union_hall,
			sailingBillet: r.sailing_billet,
			onSheet: Boolean(r.on_sheet),
			sheetName: r.sheet_name,
			notes: r.notes,
			sortOrder: Number(r.sort_order),
			holder,
			covering: covering ? names.length ? `${covering} · covering ${names.join(" · ")}` : covering : null,
			coveringNames: names,
			sailingUp: isRatedUp(perm, sailing),
			upgrades: remainingUpgrades(perm, sailing),
			returnOn: ret.returnOn,
			returnFrom: ret.returnFrom
		};
	});
	const sailors = people.filter((p) => p.status === "current").map((p) => {
		const last = (toursByCrew.get(p.id) ?? []).find((t) => !t.signOff) ?? (toursByCrew.get(p.id) ?? [])[0];
		const due = last ? tourDue(last) : null;
		return {
			id: p.id,
			fullName: p.fullName,
			status: p.status,
			billetCode: p.billetCode,
			lastDueOff: due?.date ?? last?.dueOff ?? null
		};
	});
	for (const slot of slots) {
		const ret = rotationReturn({
			sailingBillet: slot.sailingBillet,
			holder: slot.holder,
			partners: slots,
			sailors
		});
		slot.returnOn = ret.returnOn;
		slot.returnFrom = ret.returnFrom;
	}
	const held = new Set(slots.map((s) => s.holder?.id).filter((id) => Boolean(id)));
	const events = (await sql`
        select * from permanent_events where user_id = ${OWNER} order by created_at desc limit 20
      `).map((e) => ({
		id: String(e.id),
		slotId: String(e.slot_id),
		crewId: e.crew_id ? String(e.crew_id) : null,
		eventType: e.event_type,
		reason: e.reason,
		fromRating: e.from_rating,
		toRating: e.to_rating,
		notes: e.notes,
		occurredOn: e.occurred_on,
		createdAt: String(e.created_at)
	}));
	return {
		slots,
		sailingUp: slots.filter((s) => s.sailingUp).length,
		vacant: slots.filter((s) => !s.holder).length,
		events,
		candidates: people.filter((p) => !held.has(p.id)).map((p) => ({
			id: p.id,
			fullName: p.fullName,
			lastPosition: p.lastPosition,
			status: p.status
		}))
	};
});
export const rateUp = createServerFn({ method: "POST" }).validator((input) => input).handler(async ({ data }) => {
	await ensureSeeded(OWNER);
	bustLiveCache();
	const sql = await getSql();
	const rows = await sql`select * from crew where id = ${data.crewId} and user_id = ${OWNER}`;
	if (!rows[0]) throw new Error("Mariner not found");
	const person = mapCrew(rows[0]);
	if (person.status !== "current") throw new Error("Only people on articles can rate up.");
	const slot = await sql`
      select id, rating from vessel_permanent_slots where user_id = ${OWNER} and crew_id = ${data.crewId} limit 1
    `;
	const source = person.permanentRating || slot[0]?.rating || person.lastPosition;
	if (!canRateUp(source)) throw new Error("Only permanent chief mates, 1st A/Es, and 2nd A/Es can rate up.");
	const opts = remainingUpgrades(source, person.lastPosition);
	const pick = opts.find((o) => o.billet === data.toBillet);
	if (!pick) {
		const names = opts.map((o) => o.title).join(", ") || "none";
		throw new Error(`That is not an allowed rate-up from ${source ?? "this rating"}. Open options: ${names}.`);
	}
	const occupied = await sql`
      select id, full_name from crew
      where user_id = ${OWNER} and status = 'current' and billet_code = ${pick.billet} and id <> ${data.crewId}
    `;
	await applySailingRank(data.crewId, pick.rating, pick.billet);
	if (slot[0]) await logPermanentEvent(OWNER, String(slot[0].id), data.crewId, "rated_up", "covering", person.permanentRating, pick.rating, occupied.length ? `Slot already has ${occupied.map((o) => o.full_name).join(", ")}.` : null);
	return {
		ok: true,
		question: occupied.length ? `${occupied.map((o) => o.full_name).join(" and ")} ${occupied.length === 1 ? "is" : "are"} already on ${pick.title}. Confirm that is a cover, or move them first.` : null
	};
});
export const dropBackToPermanent = createServerFn({ method: "POST" }).validator((input) => input).handler(async ({ data }) => {
	await ensureSeeded(OWNER);
	const sql = await getSql();
	const rows = await sql`select * from crew where id = ${data.crewId} and user_id = ${OWNER}`;
	if (!rows[0]) throw new Error("Mariner not found");
	const person = mapCrew(rows[0]);
	const slot = await sql`
      select id, rating, sailing_billet from vessel_permanent_slots
      where user_id = ${OWNER} and crew_id = ${data.crewId} limit 1
    `;
	const rating = slot[0]?.rating ?? person.permanentRating;
	const billet = slot[0]?.sailing_billet ?? person.billetCode;
	if (!rating || !billet) throw new Error("No permanent seat on file for this mariner.");
	await applySailingRank(data.crewId, rating, billet);
	if (slot[0]) await logPermanentEvent(OWNER, String(slot[0].id), data.crewId, "dropped_back", null, person.lastPosition, rating, null);
	return { ok: true };
});
export const changePermanent = createServerFn({ method: "POST" }).validator((input) => input).handler(async ({ data }) => {
	await ensureSeeded(OWNER);
	const sql = await getSql();
	const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
	const slotRows = await sql`
      select * from vessel_permanent_slots where user_id = ${OWNER} and slot_key = ${data.slotKey} limit 1
    `;
	if (!slotRows[0]) throw new Error("Permanent seat not found");
	const slotId = String(slotRows[0].id);
	const slotRating = String(slotRows[0].rating);
	const holderId = slotRows[0].crew_id ? String(slotRows[0].crew_id) : null;
	if (data.reason === "assigned") {
		if (!data.replacementCrewId) throw new Error("Pick who takes this seat.");
		await moveHolderOffOtherSlots(data.replacementCrewId, slotId);
		await sql`
        update vessel_permanent_slots set crew_id = ${data.replacementCrewId}, updated_at = now()
        where id = ${slotId} and user_id = ${OWNER}
      `;
		await sql`
        update crew set permanent_rating = ${slotRating}, assignment_type = ${"PERMANENT"}, updated_at = now()
        where id = ${data.replacementCrewId} and user_id = ${OWNER}
      `;
		await logPermanentEvent(OWNER, slotId, data.replacementCrewId, "assigned", "assigned", null, slotRating, data.notes ?? null);
		return { ok: true };
	}
	if (!holderId) throw new Error("This seat is already vacant. Assign someone to it.");
	if (data.reason === "quit" || data.reason === "fired") {
		await sql`
        update vessel_permanent_slots set crew_id = ${null}::text, updated_at = now()
        where id = ${slotId} and user_id = ${OWNER}
      `;
		await sql`
        update crew set status = ${"past"}, permanent_rating = ${null}::text, updated_at = now()
        where id = ${holderId} and user_id = ${OWNER}
      `;
		await sql`
        update crew_tours set sign_off = coalesce(sign_off, ${today})
        where crew_id = ${holderId} and user_id = ${OWNER} and sign_off is null
      `;
		await logPermanentEvent(OWNER, slotId, holderId, "vacated", data.reason, slotRating, null, data.notes ?? null);
		return { ok: true };
	}
	if (data.reason === "replaced") {
		if (!data.replacementCrewId) throw new Error("Pick who takes this seat.");
		if (data.replacementCrewId === holderId) throw new Error("That person already holds this seat.");
		await moveHolderOffOtherSlots(data.replacementCrewId, slotId);
		await sql`
        update vessel_permanent_slots set crew_id = ${data.replacementCrewId}, updated_at = now()
        where id = ${slotId} and user_id = ${OWNER}
      `;
		await sql`
        update crew set status = ${"past"}, permanent_rating = ${null}::text, updated_at = now()
        where id = ${holderId} and user_id = ${OWNER}
      `;
		await sql`
        update crew_tours set sign_off = coalesce(sign_off, ${today})
        where crew_id = ${holderId} and user_id = ${OWNER} and sign_off is null
      `;
		await sql`
        update crew set permanent_rating = ${slotRating}, assignment_type = ${"PERMANENT"}, updated_at = now()
        where id = ${data.replacementCrewId} and user_id = ${OWNER}
      `;
		await logPermanentEvent(OWNER, slotId, holderId, "vacated", "replaced", slotRating, null, data.notes ?? null);
		await logPermanentEvent(OWNER, slotId, data.replacementCrewId, "assigned", "replaced", null, slotRating, data.notes ?? null);
		return { ok: true };
	}
	if (data.reason === "promoted") {
		if (!data.promoteToSlotKey) throw new Error("Pick the higher seat they are moving into.");
		const dest = await sql`
        select * from vessel_permanent_slots where user_id = ${OWNER} and slot_key = ${data.promoteToSlotKey} limit 1
      `;
		if (!dest[0]) throw new Error("That higher seat does not exist.");
		if (dest[0].crew_id && String(dest[0].crew_id) !== holderId) {
			const other = await sql`select full_name from crew where id = ${String(dest[0].crew_id)} and user_id = ${OWNER}`;
			throw new Error(`${dest[0].title} seat ${dest[0].seat} still has ${other[0] ? other[0].full_name : "someone"}. Vacate or replace them first.`);
		}
		const destDef = slotDefByKey(data.promoteToSlotKey);
		const destRating = String(dest[0].rating);
		const destBillet = dest[0].sailing_billet ? String(dest[0].sailing_billet) : destDef?.sailingBillet;
		await sql`
        update vessel_permanent_slots set crew_id = ${null}::text, updated_at = now()
        where id = ${slotId} and user_id = ${OWNER}
      `;
		await sql`
        update vessel_permanent_slots set crew_id = ${holderId}, updated_at = now()
        where id = ${String(dest[0].id)} and user_id = ${OWNER}
      `;
		await sql`
        update crew set permanent_rating = ${destRating}, assignment_type = ${"PERMANENT"}, updated_at = now()
        where id = ${holderId} and user_id = ${OWNER}
      `;
		const aboard = await sql`select status from crew where id = ${holderId} and user_id = ${OWNER}`;
		if (aboard[0] && String(aboard[0].status) === "current" && destBillet) await applySailingRank(holderId, destRating, destBillet);
		await logPermanentEvent(OWNER, slotId, holderId, "promoted", "promoted", slotRating, destRating, data.notes ?? null);
		await logPermanentEvent(OWNER, String(dest[0].id), holderId, "assigned", "promoted", slotRating, destRating, data.notes ?? null);
		return { ok: true };
	}
	throw new Error("Unknown change.");
});
async function moveHolderOffOtherSlots(crewId, keepSlotId) {
	const sql = await getSql();
	const others = await sql`
    select id, rating from vessel_permanent_slots
    where user_id = ${OWNER} and crew_id = ${crewId} and id <> ${keepSlotId}
  `;
	for (const o of others) {
		await sql`
      update vessel_permanent_slots set crew_id = ${null}::text, updated_at = now()
      where id = ${o.id} and user_id = ${OWNER}
    `;
		await logPermanentEvent(OWNER, String(o.id), crewId, "vacated", "replaced", o.rating, null, "Moved to another permanent seat.");
	}
}
export const proposeJoin = createServerFn({ method: "POST" }).validator((input) => input).handler(async ({ data }) => {
	await ensureSeeded(OWNER);
	const sql = await getSql();
	const people = (await loadCrewTables("desk", {
		docs: false,
		tours: false
	})).people;
	const current = people.filter((p) => p.status === "current");
	const occupied = new Set(current.map((p) => p.billetCode).filter((c) => Boolean(c)));
	const watch = data.watch ?? parseWatch(data.position);
	const proposal = proposeBillet(data.position, occupied, watch);
	const pick = (data.billetCode ? VESSEL_BILLETS.find((b) => b.code === data.billetCode) : void 0) ?? proposal.pick;
	const unionHall = pick?.unionHall ?? unionForPosition(data.position);
	const permSlots = await sql`
      select sailing_billet, crew_id from vessel_permanent_slots where user_id = ${OWNER}
    `;
	const cover = coveringTripRelief({
		joiningCrewId: data.crewId ?? null,
		billetCode: pick?.code ?? null,
		slots: permSlots.map((s) => ({
			sailingBillet: s.sailing_billet,
			crewId: s.crew_id
		})),
		people: people.map((p) => ({
			id: p.id,
			fullName: p.fullName,
			status: p.status,
			permanentRating: p.permanentRating,
			lastPosition: p.lastPosition,
			billetCode: p.billetCode
		}))
	});
	const assignmentType = cover ? "RELIEF" : pick?.defaultAssignment ?? defaultAssignmentForPosition(data.position);
	const question = cover ? `${cover.relieving} holds this job and is off. Covering them is trip relief, not rotary. Rotary means you have the job and can take vacation.` : proposal.question;
	return {
		...proposal,
		pick: pick ?? proposal.pick,
		unionHall,
		assignmentType,
		relieving: cover?.relieving ?? null,
		watch: pick?.watch ?? proposal.pick?.watch ?? watch,
		question
	};
});
export const getCrew = createServerFn({ method: "GET" }).validator((input) => input).handler(async ({ data }) => {
	await ensureSeeded(OWNER);
	return loadCrewDetail(data.id);
});
async function loadCrewDetail(id) {
	const sql = await getSql();
	const rows = await sql`select * from crew where id = ${id} and user_id = ${OWNER}`;
	if (!rows[0]) return null;
	const person = mapCrew(rows[0]);
	const [nok, documents, tours, forms] = await Promise.all([
		sql`select * from crew_nok where crew_id = ${id} and user_id = ${OWNER}`.then((r) => r.map(mapNok)),
		sql`select * from crew_documents where crew_id = ${id} and user_id = ${OWNER}`.then((r) => r.map(mapDoc)),
		sql`select * from crew_tours where crew_id = ${id} and user_id = ${OWNER} order by sign_on desc`.then((r) => r.map(mapTour)),
		sql`select * from crew_forms where crew_id = ${id} and user_id = ${OWNER}`.then((r) => r.map(mapForm))
	]);
	return {
		...person,
		nok,
		documents,
		tours,
		forms
	};
}
async function matchPerson(parsed) {
	const sql = await getSql();
	const seen = /* @__PURE__ */ new Set();
	const candidates = [];
	const take = (rows) => {
		for (const r of rows) {
			const id = String(r.id);
			if (seen.has(id)) continue;
			seen.add(id);
			candidates.push(mapCrew(r));
		}
	};
	if (parsed.mmcNumber) take(await sql`select * from crew where user_id = ${OWNER} and mmc_number = ${parsed.mmcNumber}`);
	if (parsed.ssLast4) take(await sql`select * from crew where user_id = ${OWNER} and ss_last4 = ${parsed.ssLast4}`);
	if (parsed.passportNumber) take(await sql`select * from crew where user_id = ${OWNER} and passport_number = ${parsed.passportNumber}`);
	if (parsed.lastName && parsed.dob) take(await sql`select * from crew where user_id = ${OWNER} and lower(coalesce(last_name, '')) = ${parsed.lastName.toLowerCase()} and dob = ${parsed.dob}`);
	else if (parsed.lastName && parsed.firstName) {
		const last = parsed.lastName.toLowerCase().replace(/-/g, " ").trim().split(/\s+/)[0] ?? "";
		if (last.length >= 4) {
			const fuzzy = `%${last}%`;
			take(await sql`select * from crew where user_id = ${OWNER}
        and lower(replace(coalesce(last_name, ''), '-', ' ')) like ${fuzzy}
        limit 20`);
		} else {
			take(await sql`select * from crew where user_id = ${OWNER} and lower(coalesce(last_name, '')) = ${last} limit 20`);
		}
	}
	if (!candidates.length && parsed.lastName) {
		const rows = await sql`select * from crew where user_id = ${OWNER} and lower(coalesce(last_name, '')) = ${parsed.lastName.toLowerCase()}`;
		if (rows.length === 1) take(rows);
	}
	if (!candidates.length) return null;
	const toursByCrew = /* @__PURE__ */ new Map();
	await Promise.all(candidates.map(async (c) => {
		const tours = (await sql`select * from crew_tours where crew_id = ${c.id} and user_id = ${OWNER} order by sign_on desc`).map(mapTour);
		toursByCrew.set(c.id, tours);
	}));
	return bestMatch(parsed, candidates, toursByCrew);
}
export const listRequirements = createServerFn({ method: "GET" }).handler(async () => {
	await ensureSeeded(OWNER);
	return (await (await getSql())`select * from sign_on_requirements where user_id = ${OWNER} order by sort_order, code`).map(mapReq);
});
export const listExpiring = createServerFn({ method: "GET" }).handler(async () => {
	await ensureSeeded(OWNER);
	const hit = readLive("expiring");
	if (hit) return hit;
	const { people, docs } = await loadCrewTables("desk", { tours: false });
	const byId = new Map(people.map((p) => [p.id, p]));
	const marinerOf = (p) => ({
		id: p.id,
		fullName: p.fullName,
		lastPosition: p.lastPosition,
		status: p.status,
		assignmentType: p.assignmentType,
		permanentRating: p.permanentRating,
		unionHall: p.unionHall
	});
	const rows = docs.map((d) => {
		const p = byId.get(d.crewId);
		return {
			...d,
			tone: expiryTone(d.expiresOn),
			days: daysUntil(d.expiresOn),
			mariner: p ? marinerOf(p) : null
		};
	}).filter((d) => d.expiresOn && d.mariner && onExpiryBoard(d.mariner));
	for (const p of people) {
		if (!onExpiryBoard(p)) continue;
		if (docs.some((d) => d.crewId === p.id && d.docType === "drug_free")) continue;
		rows.push({
			id: `missing-drug-${p.id}`,
			crewId: p.id,
			docType: "drug_free",
			label: "Drug-free / DOT",
			docNumber: null,
			issuedOn: null,
			expiresOn: null,
			notes: "SRO-CM-06 — check every joining.",
			sourcePacket: null,
			tone: "missing",
			days: null,
			mariner: marinerOf(p)
		});
	}
	const out = rows.sort((a, b) => (a.expiresOn ?? "9999").localeCompare(b.expiresOn ?? "9999"));
	writeLive("expiring", out);
	return out;
});
export const getNseBoard = createServerFn({ method: "GET" }).handler(async () => {
	await ensureSeeded(OWNER);
	const sql = await getSql();
	const [{ people, docs }, liveSlots] = await Promise.all([loadCrewTables("desk", { tours: false }), sql`
        select crew_id, rating, title, sheet_name, on_sheet, union_hall, sort_order
        from vessel_permanent_slots
        where user_id = ${OWNER}
        order by sort_order
      `]);
	const byId = new Map(people.map((p) => [p.id, p]));
	const docsByCrew = groupBy(docs, (d) => d.crewId);
	const rows = (liveSlots.length ? liveSlots.filter((s) => s.crew_id && (Boolean(s.on_sheet) || String(s.rating) === "2A/E")).map((s) => ({
		id: String(s.crew_id),
		sheetName: s.sheet_name || (byId.get(String(s.crew_id))?.fullName ?? s.title),
		rating: s.title,
		unionHall: s.union_hall,
		onSheet: Boolean(s.on_sheet)
	})) : PERMANENT_CREW.filter((s) => s.onSheet || s.rating === "Watch 2 A/E")).map((slot) => {
		const person = byId.get(slot.id);
		const owned = docsByCrew.get(slot.id) ?? [];
		const certs = {};
		let expiredCount = 0;
		let watchCount = 0;
		let missingCount = 0;
		const rating = person?.lastPosition || slot.rating;
		for (const kind of NSE_KINDS) {
			const doc = owned.find((d) => d.docType === kind);
			const placeholder = isNsePlaceholder(doc?.issuedOn);
			const required = nseApplies(kind, rating);
			let tone = expiryTone(placeholder ? null : doc?.expiresOn);
			if (placeholder) tone = "expired";
			if (!required && tone === "missing") tone = "ok";
			const cell = {
				kind,
				issued: placeholder ? null : doc?.issuedOn ?? null,
				expires: placeholder ? null : doc?.expiresOn ?? null,
				docId: doc?.id ?? null,
				tone,
				placeholder,
				required,
				score: kind === "hazmat" ? parseHazmatScore(doc?.docNumber) ?? parseHazmatScore(doc?.notes) : null
			};
			if (required) {
				if (placeholder || tone === "expired") expiredCount += 1;
				else if (!doc || tone === "missing") missingCount += 1;
				else if (tone === "watch" || tone === "soon") watchCount += 1;
			}
			certs[kind] = cell;
		}
		return {
			crewId: slot.id,
			sheetName: slot.sheetName ?? person?.fullName ?? slot.rating,
			rating: slot.rating,
			onSheet: slot.onSheet,
			unionHall: slot.unionHall,
			status: person?.status ?? null,
			fullName: person?.fullName ?? slot.sheetName ?? slot.rating,
			covering: coveringLabel(slot.rating, person?.lastPosition ?? null),
			certs,
			expiredCount,
			watchCount,
			missingCount
		};
	});
	return {
		rows,
		expired: rows.reduce((n, r) => n + r.expiredCount, 0),
		watch: rows.reduce((n, r) => n + r.watchCount, 0),
		missing: rows.reduce((n, r) => n + r.missingCount, 0),
		sms: await loadSmsSnapshot()
	};
});
export const upsertNseTraining = createServerFn({ method: "POST" }).validator((input) => input).handler(async ({ data }) => {
	await ensureSeeded(OWNER);
	const sql = await getSql();
	if (!(await sql`select id from crew where id = ${data.crewId} and user_id = ${OWNER} limit 1`).length) throw new Error("Mariner not found");
	const issued = toIsoDate(data.issued);
	let expires = toIsoDate(data.expires);
	if (issued && !expires) expires = addYears(issued, NSE_VALIDITY_YEARS[data.kind]);
	const existing = await sql`
      select id from crew_documents
      where user_id = ${OWNER} and crew_id = ${data.crewId} and doc_type = ${data.kind}
      limit 1
    `;
	if (existing.length) await sql`
        update crew_documents set
          label = ${NSE_LABELS[data.kind]},
          issued_on = ${txt(issued)}::text,
          expires_on = ${txt(expires)}::text,
          notes = coalesce(notes, ${"Updated on NSE board"})
        where id = ${existing[0].id} and user_id = ${OWNER}
      `;
	else await sql`
        insert into crew_documents (id, user_id, crew_id, doc_type, label, doc_number, issued_on, expires_on, notes, source_packet)
        values (${newId("doc")}, ${OWNER}, ${data.crewId}, ${data.kind}, ${NSE_LABELS[data.kind]}, ${null}::text,
          ${txt(issued)}::text, ${txt(expires)}::text, ${"Updated on NSE board"}, ${NSE_SOURCE})
      `;
	return {
		ok: true,
		issued,
		expires
	};
});
export const recordCyberTraining = createServerFn({ method: "POST" }).validator((input) => input).handler(async ({ data }) => {
	await ensureSeeded(OWNER);
	const sql = await getSql();
	const kind = nseKindForCyber(data.module);
	const issued = toIsoDate(data.issued);
	if (!issued) throw new Error("Training date is required");
	const expires = addYears(issued, NSE_VALIDITY_YEARS[kind]);
	const notes = "Printed from Cyber desk · 33 CFR 101.650 · signatures pending";
	let stamped = 0;
	for (const crewId of data.crewIds) {
		if (!(await sql`select id from crew where id = ${crewId} and user_id = ${OWNER} limit 1`).length) continue;
		const existing = await sql`
        select id from crew_documents
        where user_id = ${OWNER} and crew_id = ${crewId} and doc_type = ${kind}
        limit 1
      `;
		if (existing.length) await sql`
          update crew_documents set
            label = ${NSE_LABELS[kind]},
            issued_on = ${issued},
            expires_on = ${txt(expires)}::text,
            notes = ${notes}
          where id = ${existing[0].id} and user_id = ${OWNER}
        `;
		else await sql`
          insert into crew_documents (id, user_id, crew_id, doc_type, label, doc_number, issued_on, expires_on, notes, source_packet)
          values (${newId("doc")}, ${OWNER}, ${crewId}, ${kind}, ${NSE_LABELS[kind]}, ${null}::text,
            ${issued}, ${txt(expires)}::text, ${notes}, ${"Cyber desk"})
        `;
		stamped += 1;
	}
	return {
		ok: true,
		kind,
		issued,
		expires,
		stamped
	};
});
export const recordHazmatQuiz = createServerFn({ method: "POST" }).validator((input) => input).handler(async ({ data }) => {
	await ensureSeeded(OWNER);
	const sql = await getSql();
	const issued = toIsoDate(data.issued);
	if (!issued) throw new Error("Test date is required");
	const score = Math.round(Number(data.score));
	if (!Number.isFinite(score) || score < 0 || score > 20) throw new Error("Score must be 0–20");
	if (score < 16) throw new Error(`16 of 20 to pass. Do not print a certificate for a fail.`);
	if (!(await sql`select id from crew where id = ${data.crewId} and user_id = ${OWNER} limit 1`).length) throw new Error("Mariner not found");
	const expires = addYears(issued, NSE_VALIDITY_YEARS.hazmat);
	const notes = `Quiz ${score}/20 pass · trained and tested · 49 CFR 172.704 · ${data.instructorName.trim() || "Chief Mate"}`;
	const docNumber = `${score}/20`;
	const existing = await sql`
      select id from crew_documents
      where user_id = ${OWNER} and crew_id = ${data.crewId} and doc_type = ${"hazmat"}
      limit 1
    `;
	if (existing.length) await sql`
        update crew_documents set
          label = ${NSE_LABELS.hazmat},
          doc_number = ${docNumber},
          issued_on = ${issued},
          expires_on = ${txt(expires)}::text,
          notes = ${notes}
        where id = ${existing[0].id} and user_id = ${OWNER}
      `;
	else await sql`
        insert into crew_documents (id, user_id, crew_id, doc_type, label, doc_number, issued_on, expires_on, notes, source_packet)
        values (${newId("doc")}, ${OWNER}, ${data.crewId}, ${"hazmat"}, ${NSE_LABELS.hazmat}, ${docNumber},
          ${issued}, ${txt(expires)}::text, ${notes}, ${"HAZMAT desk"})
      `;
	return {
		ok: true,
		issued,
		expires,
		score
	};
});
export const setCrewStatus = createServerFn({ method: "POST" }).validator((input) => input).handler(async ({ data }) => {
	bustLiveCache();
	await ensureLeaveColumns();
	const sql = await getSql();
	const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
	const rows = await sql`select * from crew where id = ${data.id} and user_id = ${OWNER}`;
	if (!rows[0]) throw new Error("Mariner not found");
	const person = mapCrew(rows[0]);
	const open = (await sql`select * from crew_tours where crew_id = ${data.id} and user_id = ${OWNER} order by sign_on desc`).map(mapTour).find((t) => !t.signOff);
	const unionHall = open?.unionHall ?? person.unionHall;
	const assignmentType = open?.assignmentType ?? person.assignmentType;
	if (data.status === "vacation") {
		if (isOfficerRotary(unionHall, assignmentType)) {
			const check = rotaryLeaveCheck({
				unionHall,
				assignmentType,
				signOn: open?.signOn,
				leaveCount: open?.leaveCount ?? 0,
				leaveStartedOn: open?.leaveStartedOn ?? null
			});
			if (!check.ok) throw new Error(check.error);
			if (!open) throw new Error("No open assignment to pause.");
			await sql`
          update crew_tours set
            leave_started_on = ${today},
            leave_count = ${(open.leaveCount ?? 0) + 1}::int
          where id = ${open.id} and user_id = ${OWNER}
        `;
			await sql`update crew set status = ${"vacation"}, updated_at = now() where id = ${data.id} and user_id = ${OWNER}`;
			const clock = remainingCoveredDays({
				signOn: open.signOn,
				unionHall,
				assignmentType,
				siuClass: open.seniorityClass ?? null,
				lengthDays: open.lengthDays,
				extraDays: open.extraDays,
				leaveDays: open.leaveDays,
				leaveStartedOn: today
			});
			const due = tourDue({
				...open,
				leaveStartedOn: today,
				leaveCount: (open.leaveCount ?? 0) + 1
			});
			return {
				ok: true,
				crewId: data.id,
				resumed: false,
				remaining: clock.remaining,
				tourDays: clock.tourDays,
				dueOff: due.date,
				leaveDays: open.leaveDays ?? 0,
				warning: null
			};
		}
		await sql`update crew set status = ${data.status}, updated_at = now() where id = ${data.id} and user_id = ${OWNER}`;
		await sql`
        update crew_tours set sign_off = ${data.signOff ?? today}
        where crew_id = ${data.id} and user_id = ${OWNER} and sign_off is null
      `;
		return {
			ok: true,
			crewId: data.id,
			resumed: false,
			warning: null
		};
	}
	if (data.status === "past") {
		await sql`update crew set status = ${"past"}, updated_at = now() where id = ${data.id} and user_id = ${OWNER}`;
		const off = data.signOff ?? today;
		if (open?.leaveStartedOn) {
			const elapsed = Math.max(0, daysAboard(open.leaveStartedOn) ?? 0);
			const leaveDays = (open.leaveDays ?? 0) + elapsed;
			const due = computeDueOff({
				signOn: open.signOn,
				unionHall: open.unionHall,
				assignmentType: open.assignmentType,
				siuClass: open.seniorityClass ?? null,
				lengthDays: open.lengthDays,
				explicitEnd: setDateFromTour(open),
				extraDays: open.extraDays,
				leaveDays
			});
			await sql`
          update crew_tours set
            sign_off = ${off},
            leave_days = ${leaveDays}::int,
            leave_started_on = ${null}::text,
            due_off = ${txt(due.date)}::text,
            due_off_rule = ${due.rule}
          where id = ${open.id} and user_id = ${OWNER}
        `;
		} else await sql`
          update crew_tours set sign_off = ${off}
          where crew_id = ${data.id} and user_id = ${OWNER} and sign_off is null
        `;
		return {
			ok: true,
			crewId: data.id,
			resumed: false,
			warning: null
		};
	}
	if (data.status === "current") {
		if (open && isOfficerRotary(unionHall, assignmentType) && (open.leaveStartedOn || person.status === "vacation")) {
			const elapsed = open.leaveStartedOn ? Math.max(0, daysAboard(open.leaveStartedOn) ?? 0) : 0;
			const leaveDays = (open.leaveDays ?? 0) + elapsed;
			const due = computeDueOff({
				signOn: open.signOn,
				unionHall,
				assignmentType,
				siuClass: open.seniorityClass ?? null,
				lengthDays: open.lengthDays,
				explicitEnd: setDateFromTour(open),
				extraDays: open.extraDays,
				leaveDays
			});
			await sql`
          update crew_tours set
            leave_days = ${leaveDays}::int,
            leave_started_on = ${null}::text,
            due_off = ${txt(due.date)}::text,
            due_off_rule = ${due.rule}
          where id = ${open.id} and user_id = ${OWNER}
        `;
			await sql`update crew set status = ${"current"}, updated_at = now() where id = ${data.id} and user_id = ${OWNER}`;
			const notes = [];
			const durationNote = rotaryLeaveDurationNote(elapsed);
			if (durationNote) notes.push(durationNote);
			const billet = open.billetCode ?? person.billetCode;
			if (billet) {
				const others = await sql`
            select full_name from crew
            where user_id = ${OWNER} and status = 'current' and id <> ${data.id} and billet_code = ${billet}
          `;
				if (others[0]) notes.push(`${billet} is occupied by ${others[0].full_name}. Rotary assignment is still theirs.`);
			}
			const clock = remainingCoveredDays({
				signOn: open.signOn,
				unionHall,
				assignmentType,
				siuClass: open.seniorityClass ?? null,
				lengthDays: open.lengthDays,
				extraDays: open.extraDays,
				leaveDays,
				leaveStartedOn: null
			});
			return {
				ok: true,
				crewId: data.id,
				resumed: true,
				leaveDays,
				remaining: clock.remaining,
				tourDays: clock.tourDays,
				dueOff: due.date,
				warning: notes.length ? notes.join(" ") : null
			};
		}
		await sql`update crew set status = ${"current"}, updated_at = now() where id = ${data.id} and user_id = ${OWNER}`;
		await sql`
        update crew_tours set sign_off = coalesce(sign_off, ${today})
        where crew_id = ${data.id} and user_id = ${OWNER} and sign_off is null
      `;
		const aboard = (await sql`select billet_code from crew where user_id = ${OWNER} and status = 'current' and id <> ${data.id}`).map((r) => r.billet_code ? String(r.billet_code) : "");
		const occupied = new Set(aboard.filter(Boolean));
		const pick = proposeBillet(person.lastPosition ?? null, occupied, parseWatch(person.lastPosition)).pick;
		const nextUnion = person.unionHall ?? pick?.unionHall ?? unionForPosition(person.lastPosition);
		const nextAssignment = person.assignmentType ?? pick?.defaultAssignment ?? defaultAssignmentForPosition(person.lastPosition);
		const due = computeDueOff({
			signOn: today,
			unionHall: nextUnion,
			assignmentType: nextAssignment
		});
		await sql`
        update crew set
          union_hall = coalesce(union_hall, ${txt(nextUnion)}::text),
          assignment_type = coalesce(assignment_type, ${txt(nextAssignment)}::text),
          watch = coalesce(watch, ${txt(pick?.watch)}::text),
          billet_code = coalesce(billet_code, ${txt(pick?.code)}::text),
          updated_at = now()
        where id = ${data.id} and user_id = ${OWNER}
      `;
		await sql`
        insert into crew_tours (id, user_id, crew_id, vessel, position, sign_on, sign_off, notes, assignment_type, union_hall, watch, due_off, due_off_rule, billet_code)
        values (${newId("tour")}, ${OWNER}, ${data.id}, ${VESSEL}, ${person.lastPosition ?? pick?.title ?? null}, ${today}, ${null},
          ${"Signed on from ledger"}, ${txt(nextAssignment)}::text, ${txt(nextUnion)}::text, ${txt(pick?.watch)}::text,
          ${txt(due.date)}::text, ${due.rule}, ${txt(pick?.code)}::text)
      `;
		return {
			ok: true,
			crewId: data.id,
			resumed: false,
			dueOff: due.date,
			warning: null
		};
	}
	await sql`update crew set status = ${data.status}, updated_at = now() where id = ${data.id} and user_id = ${OWNER}`;
	return {
		ok: true,
		crewId: data.id,
		resumed: false,
		warning: null
	};
});
export const parsePackets = createServerFn({ method: "POST" }).validator((input) => input).handler(async ({ data }) => {
	await ensureSeeded(OWNER);
	await getSql();
	const out = [];
	for (const pkt of data.packets.slice(0, 20)) try {
		const fromFile = nameFromFilename(pkt.filename);
		let person = null;
		let readWarn = null;
		try {
			person = await extractPersonFromPacket(pkt);
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Read failed";
			if (/timed out/i.test(msg)) {
				readWarn = "That packet is a heavy scan. Drop the passport and MMC pages by themselves if the tickets are blank.";
			} else {
				readWarn = msg;
				throw err;
			}
		}
		if (!person && fromFile) {
			person = fillNameParts({
				...emptyPerson(),
				firstName: fromFile.firstName,
				lastName: fromFile.lastName,
				fullName: fromFile.fullName
			});
		}
		if (!person) {
			out.push({
				filename: pkt.filename,
				pageCount: pkt.pageCount,
				person: null,
				match: null,
				warnings: [],
				error: readWarn ?? "Could not read a mariner from this file."
			});
			continue;
		}
		person = fillNameParts(person);
		if (fromFile && !usableTicketName(person)) {
			person = fillNameParts({
				...person,
				firstName: person.firstName || fromFile.firstName,
				lastName: person.lastName || fromFile.lastName,
				fullName: person.fullName && person.fullName !== "Unknown" ? person.fullName : fromFile.fullName
			});
		}
		person.dob = toIsoDate(person.dob) ?? person.dob;
		person.mmcExpiration = credentialExpiryIso(person.mmcExpiration) ?? toIsoDate(person.mmcExpiration) ?? person.mmcExpiration;
		person.passportExpiration = credentialExpiryIso(person.passportExpiration) ?? toIsoDate(person.passportExpiration) ?? person.passportExpiration;
		if (person.tour?.signOn) person.tour.signOn = toIsoDate(person.tour.signOn) ?? person.tour.signOn;
		if (person.tour?.signOff) person.tour.signOff = toIsoDate(person.tour.signOff) ?? person.tour.signOff;
		for (const d of person.documents) {
			d.expiresOn = credentialExpiryIso(d.expiresOn) ?? toIsoDate(d.expiresOn) ?? d.expiresOn;
			d.issuedOn = toIsoDate(d.issuedOn) ?? d.issuedOn;
		}
		person = fixCredentialDates(person);
		person = keepLatestTickets(person);
		const extractedDocs = person.documents.map((d) => ({ ...d }));
		let match = await matchPerson(person);
		const warnings = [];
		if (readWarn) warnings.push(readWarn);
		if (fromFile && usableTicketName(person) && !person.documents.length && !person.mmcNumber && !person.passportNumber) {
			warnings.push("Name came from the filename — IDs were not on the pages that were photographed. Drop the passport/MMC photos again if the tickets are blank.");
		}
		if (match) {
			warnings.push(match.status === "current" ? `${match.fullName} is already signed on ${VESSEL}.` : `${match.fullName} has sailed ${VESSEL} before.`);
			const detail = await loadCrewDetail(match.crewId);
			if (detail) {
				const before = missingForPacket(person).length;
				person = mergeParsed([person, detailToParsed(detail)]);
				person.documents = extractedDocs;
				const filled = before - missingForPacket(person).length;
				if (filled > 0) warnings.push(`Pulled ${filled} missing field${filled === 1 ? "" : "s"} from ${match.fullName}'s ledger file.`);
			}
		}
		const packetText = pkt.pages.map((p) => p.text ?? "").join("\n");
		const beforeClass = person.tour?.seniorityClass ?? null;
		const beforeDrug = person.documents.some((d) => d.docType === "drug_free" && d.expiresOn);
		person = overlayParsedFields(person, packetText, pkt.filename);
		person = keepLatestTickets(person);
		if (person.tour?.seniorityClass && person.tour.seniorityClass !== beforeClass) warnings.push(`SIU Class ${person.tour.seniorityClass} from dispatch / 86-067.`);
		if (!beforeDrug) {
			const drug = person.documents.find((d) => d.docType === "drug_free" && d.expiresOn);
			if (drug?.expiresOn) warnings.push(`Drug-free through ${drug.expiresOn}.`);
		}
		if (person.signOnRequired === false) warnings.push("Hall marked this job No Sign-on Required.");
		for (const d of person.documents) {
			const tone = expiryTone(d.expiresOn);
			if (tone === "expired") warnings.push(`${d.label} is expired.`);
			if (tone === "soon") warnings.push(`${d.label} expires within 30 days.`);
		}
		if (data.fileIfMissing && usableTicketName(person)) {
			try {
				const filed = await filePacketToLedger(person, match, pkt.filename);
				match = filed.match;
				warnings.push(...filed.warnings);
				await logInbox({ filename: pkt.filename, crewId: match.crewId, fullName: person.fullName, created: filed.created, error: readWarn });
				if (!data.skipBust) bustLiveCache();
			} catch (e) {
				warnings.push(e instanceof Error ? e.message : "Could not save that file");
			}
		}
		out.push({
			filename: pkt.filename,
			pageCount: pkt.pageCount,
			person,
			match,
			warnings,
			error: null
		});
	} catch (err) {
		const error = err instanceof Error ? err.message : "Parse failed";
		const friendly = /timed out/i.test(error)
			? "That packet is a heavy scan. Drop the passport and MMC pages by themselves."
			: error;
		await logInbox({ filename: pkt.filename, error: friendly });
		out.push({
			filename: pkt.filename,
			pageCount: pkt.pageCount,
			person: null,
			match: null,
			warnings: [],
			error: friendly
		});
	}
	return out;
});
async function extractPersonFromPacket(pkt) {
	const textBlob = pkt.pages.map((p, i) => `--- PAGE ${i + 1} ---\n${(p.text ?? "").slice(0, 1400)}`).join("\n").slice(0, 8e3);
	const local = extractPersonFromText(textBlob, pkt.filename);
	const fromFile = nameFromFilename(pkt.filename);
	let person = usableTicketName(local) ? local : null;
	if (!person && fromFile) {
		person = fillNameParts({
			...emptyPerson(),
			firstName: fromFile.firstName,
			lastName: fromFile.lastName,
			fullName: fromFile.fullName
		});
		person = overlayParsedFields(person, textBlob, pkt.filename);
	}
	if (ticketsLookComplete(local) && usableTicketName(local)) return fixCredentialDates(local);

	const images = pkt.pages
		.map((p, i) => ({ image: p.image, i }))
		.filter((p) => p.image)
		.sort((a, b) => a.i - b.i)
		.map((p) => p.image)
		.slice(0, 4);

	if (!images.length) {
		if (person) return fixCredentialDates(overlayParsedFields(person, textBlob, pkt.filename));
		try {
			const next = await visionCall(pkt.filename, textBlob, []);
			if (next) person = next;
		} catch (err) {
			if (person) return fixCredentialDates(person);
			throw err;
		}
		if (person) return fixCredentialDates(overlayParsedFields(person, textBlob, pkt.filename));
		throw new Error("Could not read a mariner from this file.");
	}

	let lastErr = null;
	const batches = [];
	for (let i = 0; i < images.length; i += 2) batches.push(images.slice(i, i + 2));
	for (const batch of batches) {
		try {
			const next = await visionCall(pkt.filename, textBlob.slice(0, 3500), batch);
			if (next) person = person ? mergeParsed([person, next]) : next;
			if (ticketsLookComplete(person) && usableTicketName(person)) break;
		} catch (err) {
			lastErr = err;
			if (!/timed out|abort/i.test(err instanceof Error ? err.message : "")) {
				if (person && usableTicketName(person)) break;
				if (!person) throw err;
			}
		}
	}
	if (person) return fixCredentialDates(overlayParsedFields(person, textBlob, pkt.filename));
	if (usableTicketName(local)) return fixCredentialDates(local);
	if (lastErr) throw lastErr;
	throw new Error("Could not read a mariner from this file.");
}
async function visionCall(filename, textBlob, images) {
	const apiKey = process.env.XAI_API_KEY;
	if (!apiKey) throw new Error("AI is not available in this environment");
	const imageParts = images.map((url) => ({
		type: "image_url",
		image_url: { url, detail: "high" }
	}));
	const content = [{
		type: "text",
		text: `Read every merchant-mariner ID in these page photo(s). JSON only, no markdown:
{"fullName":"","firstName":"","lastName":"","middleName":"","dob":"YYYY-MM-DD","ssLast4":"","sex":"","placeOfBirth":"","citizenship":"","hairColor":"","eyeColor":"","height":"","weight":"","addressLine":"","city":"","state":"","zip":"","cellPhone":"","email":"","mmcNumber":"","mmcExpiration":"YYYY-MM-DD","passportNumber":"","passportExpiration":"YYYY-MM-DD","lastPosition":"","documents":[{"docType":"mmc|passport|twic|medical|drug_free|other","label":"","docNumber":"","issuedOn":"YYYY-MM-DD","expiresOn":"YYYY-MM-DD"}]}
Read MMC, passport, TWIC, and medical cards even if they are photos of a book. MMC card: Issue Date → documents mmc issuedOn. Expiration Date (the LATER date) → mmcExpiration. Never copy Issue Date into mmcExpiration. National MMC is 5 years; year 30 means 2030. Medical STCW (2-year) is documents medical, not MMC. Passport / I-9 List A beat handwritten numbers. Last 4 of SSN only. Never echo bank numbers. Combine facts across pages.
Filename: ${filename}
Text (photo scans may be empty):
${textBlob}`
	}, ...imageParts];
	const ctrl = new AbortController();
	const kill = setTimeout(() => ctrl.abort(), images.length > 1 ? 50e3 : images.length === 1 ? 40e3 : 20e3);
	const models = ["grok-4.20-0309-non-reasoning", "grok-4.5", "grok-4.3"];
	try {
		let lastErr = null;
		for (const model of models) {
			const res = await fetch("https://api.x.ai/v1/chat/completions", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${apiKey}`
				},
				signal: ctrl.signal,
				body: JSON.stringify({
					model,
					temperature: 0,
					max_tokens: 1200,
					messages: [{ role: "user", content }]
				})
			});
			if (!res.ok) {
				const errText = await res.text().catch(() => "");
				lastErr = new Error(`xAI API error ${res.status}${errText.slice(0, 180)}`);
				if (res.status === 404 || res.status === 400) continue;
				throw lastErr;
			}
			const json = extractJson((await res.json()).choices?.[0]?.message?.content ?? "");
			if (!json || typeof json !== "object") return null;
			return normalizeParsed(json);
		}
		throw lastErr ?? new Error("Could not read that scan");
	} catch (err) {
		if (err && (err.name === "AbortError" || /aborted/i.test(err.message ?? ""))) {
			throw new Error("timed out");
		}
		throw err;
	} finally {
		clearTimeout(kill);
	}
}
function extractJson(raw) {
	const trimmed = raw.trim();
	const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(trimmed);
	const candidate = fenced ? fenced[1] : trimmed;
	const start = candidate.indexOf("{");
	const end = candidate.lastIndexOf("}");
	if (start < 0 || end < 0) return null;
	try {
		return JSON.parse(candidate.slice(start, end + 1));
	} catch {
		return null;
	}
}
function s(v) {
	if (v === null || v === void 0) return null;
	const t = String(v).trim();
	return t.length ? t : null;
}
function normalizeParsed(j) {
	const nokRaw = j.nextOfKin && typeof j.nextOfKin === "object" ? j.nextOfKin : null;
	const docsRaw = Array.isArray(j.documents) ? j.documents : [];
	const formsRaw = Array.isArray(j.formsFound) ? j.formsFound : [];
	const tourRaw = j.tour && typeof j.tour === "object" ? j.tour : null;
	const prevRaw = Array.isArray(j.previousEmployers) ? j.previousEmployers : [];
	const notes = s(j.notes);
	const noSign = j.signOnRequired === false || /no sign[- ]?on required/i.test(notes ?? "") || /no sign[- ]?on required/i.test(JSON.stringify(j).slice(0, 4e3));
	const parsed = {
		fullName: s(j.fullName) ?? ([s(j.firstName), s(j.lastName)].filter(Boolean).join(" ") || "Unknown"),
		firstName: s(j.firstName),
		lastName: s(j.lastName),
		middleName: s(j.middleName),
		ssLast4: (s(j.ssLast4) ?? "").replace(/\D/g, "").slice(-4) || null,
		dob: s(j.dob),
		sex: s(j.sex),
		placeOfBirth: s(j.placeOfBirth),
		citizenship: s(j.citizenship),
		race: s(j.race),
		hairColor: s(j.hairColor),
		eyeColor: s(j.eyeColor),
		height: s(j.height),
		weight: s(j.weight),
		addressLine: s(j.addressLine),
		city: s(j.city),
		state: s(j.state),
		zip: s(j.zip),
		homePhone: s(j.homePhone),
		cellPhone: s(j.cellPhone),
		email: s(j.email),
		nearestAirport: s(j.nearestAirport),
		airportCode: s(j.airportCode),
		maritimeCollege: s(j.maritimeCollege),
		yearGraduated: s(j.yearGraduated),
		combatVeteran: Boolean(j.combatVeteran),
		maritalStatus: s(j.maritalStatus),
		mmcNumber: s(j.mmcNumber),
		mmcPlaceOfIssue: s(j.mmcPlaceOfIssue),
		mmcExpiration: s(j.mmcExpiration),
		passportNumber: s(j.passportNumber),
		passportExpiration: s(j.passportExpiration),
		lastPosition: s(j.lastPosition),
		glasses: Boolean(j.glasses),
		spareGlasses: Boolean(j.spareGlasses),
		allergies: s(j.allergies),
		medications: s(j.medications),
		medicalRemarks: s(j.medicalRemarks),
		notes,
		signOnRequired: !noSign,
		nextOfKin: nokRaw && s(nokRaw.fullName) ? {
			fullName: s(nokRaw.fullName),
			relationship: s(nokRaw.relationship),
			addressLine: s(nokRaw.addressLine),
			city: s(nokRaw.city),
			state: s(nokRaw.state),
			zip: s(nokRaw.zip),
			phone: s(nokRaw.phone),
			cellPhone: s(nokRaw.cellPhone)
		} : null,
		previousEmployers: prevRaw.filter((d) => !!d && typeof d === "object").map((d) => ({
			name: s(d.name) ?? "",
			address: s(d.address),
			phone: s(d.phone),
			employedFrom: s(d.employedFrom),
			employedTo: s(d.employedTo)
		})).filter((d) => d.name),
		documents: docsRaw.filter((d) => !!d && typeof d === "object").map((d) => ({
			docType: s(d.docType) ?? "other",
			label: s(d.label) ?? s(d.docType) ?? "Document",
			docNumber: s(d.docNumber),
			issuedOn: s(d.issuedOn),
			expiresOn: s(d.expiresOn),
			notes: s(d.notes)
		})),
		tour: tourRaw ? {
			vessel: s(tourRaw.vessel) ?? "M/V GEORGE II",
			position: s(tourRaw.position),
			signOn: s(tourRaw.signOn),
			signOff: s(tourRaw.signOff),
			port: s(tourRaw.port),
			relieving: s(tourRaw.relieving),
			assignmentType: s(tourRaw.assignmentType),
			lengthDays: typeof tourRaw.lengthDays === "number" ? tourRaw.lengthDays : null,
			dispatchRef: s(tourRaw.dispatchRef),
			unionHall: s(tourRaw.unionHall),
			watch: s(tourRaw.watch),
			billetCode: s(tourRaw.billetCode),
			seniorityClass: s(tourRaw.seniorityClass),
			dueOff: s(tourRaw.dueOff)
		} : null,
		formsFound: formsRaw.filter((f) => !!f && typeof f === "object").map((f) => ({
			code: s(f.code) ?? "UNKNOWN",
			label: s(f.label) ?? s(f.code) ?? "Form",
			completedOn: s(f.completedOn)
		}))
	};
	return fixCredentialDates(parsed);
}
async function applySiuClassToFile(crewId, raw) {
	const siu = (raw ?? "").trim().toUpperCase();
	if (siu !== "A" && siu !== "B" && siu !== "C") return;
	const sql = await getSql();
	await sql`update crew set seniority_class = ${siu}, updated_at = now() where id = ${crewId} and user_id = ${OWNER}`;
	const openRows = await sql`select * from crew_tours where crew_id = ${crewId} and user_id = ${OWNER} and sign_off is null order by sign_on desc limit 1`;
	if (!openRows[0]) return;
	const open = mapTour(openRows[0]);
	const personRows = await sql`select * from crew where id = ${crewId} and user_id = ${OWNER}`;
	if (!personRows[0]) return;
	const person = mapCrew(personRows[0]);
	const explicit = /discharge/i.test(open.dueOffRule ?? "") ? open.dueOff : null;
	const due = computeDueOff({
		signOn: open.signOn,
		unionHall: open.unionHall ?? person.unionHall,
		assignmentType: open.assignmentType ?? person.assignmentType,
		siuClass: siu,
		lengthDays: open.lengthDays,
		extraDays: open.extraDays,
		leaveDays: open.leaveDays,
		explicitEnd: explicit
	});
	await sql`
    update crew_tours set
      seniority_class = ${siu},
      due_off = ${txt(due.date)}::text,
      due_off_rule = ${due.rule}
    where id = ${open.id} and user_id = ${OWNER}
  `;
}
export const commitParsed = createServerFn({ method: "POST" }).validator((input) => input).handler(async ({ data }) => {
	bustLiveCache();
	const sql = await getSql();
	const p = keepLatestTickets(data.person);
	const crewId = data.matchCrewId ?? newId("crew");
	const existing = data.matchCrewId ? await sql`
          select id, status, mmc_expiration from crew where id = ${data.matchCrewId} and user_id = ${OWNER}
        ` : [];
	if (data.signOn) {
		const mmcExpiration = p.mmcExpiration ?? (existing[0]?.mmc_expiration ? String(existing[0].mmc_expiration) : null);
		let docs = [...p.documents ?? []];
		if (existing.length) {
			const fileDocs = (await sql`select doc_type, label, expires_on from crew_documents where crew_id = ${crewId} and user_id = ${OWNER}`).map((r) => ({
				docType: String(r.doc_type),
				label: r.label ? String(r.label) : null,
				expiresOn: r.expires_on ? String(r.expires_on) : null
			}));
			const incoming = new Set(docs.map((d) => d.docType));
			for (const d of fileDocs) if (!incoming.has(d.docType)) docs.push(d);
		}
		const dead = deadJoinTickets({
			mmcExpiration,
			documents: docs
		});
		const override = (data.ticketOverride ?? "").trim();
		if (dead.length && !override) throw new Error(`Cannot sign on: ${dead.map((d) => d.label).join(", ")} expired. Type why you are still signing them on.`);
		if (dead.length && override) {
			const stamp = `Signed on with expired tickets (${dead.map((d) => d.label).join(", ")}): ${override}`;
			if (!(p.notes ?? "").includes("Signed on with expired tickets")) p.notes = [p.notes, stamp].filter(Boolean).join("\n");
		}
	}
	const status = data.signOn ? "current" : existing.length ? existing[0].status || "past" : "applicant";
	if (existing.length) await sql`
        update crew set
          full_name = ${p.fullName},
          first_name = ${p.firstName}, last_name = ${p.lastName}, middle_name = ${p.middleName},
          ss_last4 = coalesce(${p.ssLast4}, ss_last4),
          dob = coalesce(${p.dob}, dob), sex = coalesce(${p.sex}, sex),
          place_of_birth = coalesce(${p.placeOfBirth}, place_of_birth),
          citizenship = coalesce(${p.citizenship}, citizenship),
          cell_phone = coalesce(${p.cellPhone}, cell_phone),
          email = coalesce(${p.email}, email),
          address_line = coalesce(${p.addressLine}, address_line),
          city = coalesce(${p.city}, city), state = coalesce(${p.state}, state), zip = coalesce(${p.zip}, zip),
          mmc_number = coalesce(${p.mmcNumber}, mmc_number),
          mmc_expiration = nullif(greatest(coalesce(mmc_expiration, ''), coalesce(${txt(p.mmcExpiration)}::text, '')), ''),
          passport_number = coalesce(${p.passportNumber}, passport_number),
          passport_expiration = nullif(greatest(coalesce(passport_expiration, ''), coalesce(${txt(p.passportExpiration)}::text, '')), ''),
          last_position = coalesce(${p.lastPosition}, last_position),
          seniority_class = coalesce(${txt(p.tour?.seniorityClass)}::text, seniority_class),
          status = ${status},
          glasses = ${p.glasses}, spare_glasses = ${p.spareGlasses},
          allergies = coalesce(${p.allergies}, allergies),
          medications = coalesce(${p.medications}, medications),
          medical_remarks = coalesce(${p.medicalRemarks}, medical_remarks),
          notes = coalesce(${txt(p.notes)}::text, notes),
          updated_at = now()
        where id = ${crewId} and user_id = ${OWNER}
      `;
	else await sql`
        insert into crew (
          id, user_id, full_name, first_name, last_name, middle_name, ss_last4, dob, sex,
          place_of_birth, citizenship, race, hair_color, eye_color, height, weight,
          address_line, city, state, zip, home_phone, cell_phone, email, nearest_airport,
          airport_code, maritime_college, year_graduated, combat_veteran, marital_status,
          mmc_number, mmc_place_of_issue, mmc_expiration, passport_number, passport_expiration,
          status, last_position, last_vessel, glasses, spare_glasses, allergies, medications,
          medical_remarks, notes
        ) values (
          ${crewId}, ${OWNER}, ${p.fullName}, ${p.firstName}, ${p.lastName}, ${p.middleName},
          ${p.ssLast4}, ${p.dob}, ${p.sex}, ${p.placeOfBirth}, ${p.citizenship}, ${p.race},
          ${p.hairColor}, ${p.eyeColor}, ${p.height}, ${p.weight}, ${p.addressLine}, ${p.city},
          ${p.state}, ${p.zip}, ${p.homePhone}, ${p.cellPhone}, ${p.email}, ${p.nearestAirport},
          ${p.airportCode}, ${p.maritimeCollege}, ${p.yearGraduated}, ${p.combatVeteran},
          ${p.maritalStatus}, ${p.mmcNumber}, ${p.mmcPlaceOfIssue}, ${p.mmcExpiration},
          ${p.passportNumber}, ${p.passportExpiration}, ${status}, ${p.lastPosition}, ${VESSEL},
          ${p.glasses}, ${p.spareGlasses}, ${p.allergies}, ${p.medications}, ${p.medicalRemarks}, ${p.notes}
        )
      `;
	if (p.nextOfKin) {
		const n = p.nextOfKin;
		await sql`delete from crew_nok where crew_id = ${crewId} and user_id = ${OWNER}`;
		await sql`
        insert into crew_nok (id, user_id, crew_id, full_name, relationship, address_line, city, state, zip, phone, cell_phone)
        values (${newId("nok")}, ${OWNER}, ${crewId}, ${n.fullName}, ${n.relationship}, ${n.addressLine},
          ${n.city}, ${n.state}, ${n.zip}, ${n.phone}, ${n.cellPhone})
      `;
	}
	const existingDocs = (await sql`select * from crew_documents where crew_id = ${crewId} and user_id = ${OWNER}`).map(mapDoc);
	for (const d of keepLatestDocuments(p.documents)) {
		const same = existingDocs.find((e) => sameCertificate(e, d));
		if (same) await sql`
          update crew_documents set
            label = ${d.label},
            doc_number = coalesce(${d.docNumber}, doc_number),
            issued_on = coalesce(${d.issuedOn}, issued_on),
            expires_on = nullif(greatest(coalesce(expires_on, ''), coalesce(${txt(d.expiresOn)}::text, '')), ''),
            notes = coalesce(${d.notes}, notes),
            source_packet = ${data.filename}
          where id = ${same.id} and user_id = ${OWNER}
        `;
		else await sql`
          insert into crew_documents (id, user_id, crew_id, doc_type, label, doc_number, issued_on, expires_on, notes, source_packet)
          values (${newId("doc")}, ${OWNER}, ${crewId}, ${d.docType}, ${d.label}, ${d.docNumber},
            ${d.issuedOn}, ${d.expiresOn}, ${d.notes}, ${data.filename})
        `;
	}
	let tourId = null;
	const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
	if (data.signOn) {
		await sql`
        update crew_tours set sign_off = coalesce(sign_off, ${today})
        where crew_id = ${crewId} and user_id = ${OWNER} and sign_off is null
      `;
		const aboard = (await sql`select billet_code from crew where user_id = ${OWNER} and status = 'current' and id <> ${crewId}`).map((r) => r.billet_code ? String(r.billet_code) : "");
		const occupied = new Set(aboard.filter(Boolean));
		const watch = p.tour?.watch ?? parseWatch(p.tour?.position ?? p.lastPosition);
		const proposal = proposeBillet(p.tour?.position ?? p.lastPosition, occupied, watch);
		const pick = (p.tour?.billetCode ? VESSEL_BILLETS.find((b) => b.code === p.tour?.billetCode) : void 0) ?? proposal.pick;
		const unionHall = normalizeUnion(p.tour?.unionHall) ?? pick?.unionHall ?? unionForPosition(p.lastPosition);
		const permSlots = await sql`
        select sailing_billet, crew_id from vessel_permanent_slots where user_id = ${OWNER}
      `;
		const coverPeople = (await loadCrewTables("desk", {
			docs: false,
			tours: false
		})).people;
		const cover = coveringTripRelief({
			joiningCrewId: crewId,
			billetCode: pick?.code ?? null,
			slots: permSlots.map((s) => ({
				sailingBillet: s.sailing_billet,
				crewId: s.crew_id
			})),
			people: coverPeople.map((c) => ({
				id: c.id,
				fullName: c.fullName,
				status: c.status,
				permanentRating: c.permanentRating,
				lastPosition: c.lastPosition,
				billetCode: c.billetCode
			}))
		});
		const assignmentType = cover ? "RELIEF" : normalizeAssignment(p.tour?.assignmentType) ?? pick?.defaultAssignment ?? defaultAssignmentForPosition(p.lastPosition);
		const relieving = p.tour?.relieving ?? cover?.relieving ?? null;
		const due = computeDueOff({
			signOn: p.tour?.signOn ?? today,
			unionHall,
			assignmentType,
			siuClass: p.tour?.seniorityClass ?? null,
			lengthDays: p.tour?.lengthDays ?? null,
			explicitEnd: p.tour?.dueOff ?? (assignmentType === "RELIEF" ? p.tour?.signOff : null)
		});
		await sql`
        update crew set
          last_position = coalesce(${txt(p.lastPosition ?? pick?.title)}::text, last_position),
          union_hall = ${txt(unionHall)}::text,
          assignment_type = ${txt(assignmentType)}::text,
          seniority_class = ${txt(p.tour?.seniorityClass)}::text,
          watch = ${txt(p.tour?.watch ?? pick?.watch ?? watch)}::text,
          billet_code = ${txt(pick?.code ?? p.tour?.billetCode)}::text,
          updated_at = now()
        where id = ${crewId} and user_id = ${OWNER}
      `;
		tourId = newId("tour");
		await sql`
        insert into crew_tours (id, user_id, crew_id, vessel, position, sign_on, sign_off, port, relieving, assignment_type, length_days, dispatch_ref, union_hall, notes, watch, due_off, due_off_rule, billet_code, seniority_class)
        values (${tourId}, ${OWNER}, ${crewId}, ${p.tour?.vessel ?? "M/V GEORGE II"}, ${p.tour?.position ?? p.lastPosition ?? pick?.title},
          ${p.tour?.signOn ?? today}, ${null},
          ${p.tour?.port ?? null}, ${relieving}, ${assignmentType},
          ${p.tour?.lengthDays ?? due.days ?? null}::int, ${p.tour?.dispatchRef ?? null}, ${unionHall}, ${data.filename},
          ${txt(p.tour?.watch ?? pick?.watch ?? watch)}::text, ${txt(due.date)}::text, ${due.rule}, ${txt(pick?.code ?? p.tour?.billetCode)}::text, ${txt(p.tour?.seniorityClass)}::text)
      `;
	} else if (!existing.length && p.tour?.signOn) {
		tourId = newId("tour");
		await sql`
        insert into crew_tours (id, user_id, crew_id, vessel, position, sign_on, sign_off, port, relieving, assignment_type, length_days, dispatch_ref, union_hall, notes)
        values (${tourId}, ${OWNER}, ${crewId}, ${p.tour.vessel ?? "M/V GEORGE II"}, ${p.tour.position ?? p.lastPosition},
          ${p.tour.signOn}, ${p.tour.signOff ?? null},
          ${p.tour.port ?? null}, ${p.tour.relieving ?? null}, ${p.tour.assignmentType ?? null},
          ${p.tour.lengthDays ?? null}, ${p.tour.dispatchRef ?? null}, ${p.tour.unionHall ?? null}, ${data.filename})
      `;
	}
	const existingForms = (await sql`select * from crew_forms where crew_id = ${crewId} and user_id = ${OWNER}`).map(mapForm);
	for (const f of p.formsFound) {
		const same = existingForms.find((e) => e.formCode.toUpperCase() === f.code.toUpperCase());
		if (same) await sql`
          update crew_forms set
            form_label = ${f.label},
            completed_on = coalesce(${f.completedOn}, completed_on),
            tour_id = coalesce(${tourId}, tour_id),
            present = true
          where id = ${same.id} and user_id = ${OWNER}
        `;
		else await sql`
          insert into crew_forms (id, user_id, crew_id, tour_id, form_code, form_label, completed_on, present)
          values (${newId("form")}, ${OWNER}, ${crewId}, ${tourId}, ${f.code}, ${f.label}, ${f.completedOn}, true)
        `;
	}
	await applySiuClassToFile(crewId, p.tour?.seniorityClass);
	return {
		ok: true,
		crewId,
		returning: Boolean(data.matchCrewId)
	};
});
export const commitTickets = createServerFn({ method: "POST" }).validator((input) => input).handler(async ({ data }) => {
	bustLiveCache();
	await ensureSeeded(OWNER);
	const sql = await getSql();
	const p = keepLatestTickets(data.person);
	const crewId = data.crewId;
	if (!(await sql`select id from crew where id = ${crewId} and user_id = ${OWNER} limit 1`).length) throw new Error("Mariner not found");
	await sql`
      update crew set
        mmc_number = coalesce(${p.mmcNumber}, mmc_number),
        mmc_expiration = nullif(greatest(coalesce(mmc_expiration, ''), coalesce(${txt(p.mmcExpiration)}::text, '')), ''),
        passport_number = coalesce(${p.passportNumber}, passport_number),
        passport_expiration = nullif(greatest(coalesce(passport_expiration, ''), coalesce(${txt(p.passportExpiration)}::text, '')), ''),
        updated_at = now()
      where id = ${crewId} and user_id = ${OWNER}
    `;
	const existingDocs = (await sql`select * from crew_documents where crew_id = ${crewId} and user_id = ${OWNER}`).map(mapDoc);
	let upserted = 0;
	for (const d of keepLatestDocuments(p.documents ?? [])) {
		d.expiresOn = toIsoDate(d.expiresOn) ?? d.expiresOn;
		d.issuedOn = toIsoDate(d.issuedOn) ?? d.issuedOn;
		const same = existingDocs.find((e) => sameCertificate(e, d));
		if (same) await sql`
          update crew_documents set
            label = ${d.label},
            doc_number = coalesce(${d.docNumber}, doc_number),
            issued_on = coalesce(${d.issuedOn}, issued_on),
            expires_on = nullif(greatest(coalesce(expires_on, ''), coalesce(${txt(d.expiresOn)}::text, '')), ''),
            notes = coalesce(${d.notes}, notes),
            source_packet = ${data.filename}
          where id = ${same.id} and user_id = ${OWNER}
        `;
		else await sql`
          insert into crew_documents (id, user_id, crew_id, doc_type, label, doc_number, issued_on, expires_on, notes, source_packet)
          values (${newId("doc")}, ${OWNER}, ${crewId}, ${d.docType}, ${d.label}, ${d.docNumber},
            ${d.issuedOn}, ${d.expiresOn}, ${d.notes}, ${data.filename})
        `;
		upserted += 1;
	}
	await applySiuClassToFile(crewId, p.tour?.seniorityClass);
	return {
		ok: true,
		crewId,
		upserted
	};
});
export const syncSmsRequirements = createServerFn({ method: "POST" }).handler(async () => {
	await ensureRequirements(OWNER);
	const sql = await getSql();
	let fetched = 0;
	let status = "cached";
	const found = [];
	const procedures = codedProcedureChecks();
	const headers = { "User-Agent": "CrewLedger/1.0 (Sunrise Operations)" };
	async function pull(url) {
		try {
			const res = await fetch(url, { headers });
			if (!res.ok) return null;
			return await res.text();
		} catch {
			return null;
		}
	}
	const [crewingHtml, per06Html, smm08Html] = await Promise.all([
		pull(SMS_CREWING_URL),
		pull(SMS_TRAINING.per06.url),
		pull(SMS_TRAINING.smm08.url)
	]);
	if (crewingHtml) {
		const ids = Array.from(crewingHtml.matchAll(/SMM-[A-Z]+-\d+(?:-A\d+)?|SRO-[A-Z]+-\d+/g)).map((m) => m[0]);
		const unique = [...new Set(ids)];
		fetched += unique.length;
		found.push(...unique.slice(0, 40));
	}
	const liveById = {
		[SMS_TRAINING.per06.id]: per06Html,
		[SMS_TRAINING.smm08.id]: smm08Html
	};
	const checked = procedures.map((p) => {
		const html = liveById[p.id];
		if (!html) return p;
		const next = overlayLiveRev(p, html);
		if (next.liveRev || next.id) fetched += 1;
		return next;
	});
	const parsedAny = checked.some((p) => p.liveRev);
	if (checked.some((p) => p.match === false)) status = "rev-drift";
	else if (parsedAny) status = "ok";
	else if (crewingHtml || per06Html || smm08Html) status = "spa";
	else status = "unreachable";
	const snapshot = {
		status,
		checkedAt: (/* @__PURE__ */ new Date()).toISOString(),
		procedures: checked,
		notes: [...SMS_BOARD_NOTES],
		found
	};
	await sql`
      insert into sms_sync (user_id, last_synced_at, source_url, snapshot_json, status)
      values (${OWNER}, now(), ${SMS_TRAINING.per06.url}, ${JSON.stringify(snapshot)}, ${status})
      on conflict (user_id) do update set last_synced_at = now(), snapshot_json = excluded.snapshot_json, status = excluded.status, source_url = excluded.source_url
    `;
	return {
		ok: true,
		status,
		fetched,
		found,
		smsUrl: SMS_URL,
		crewingUrl: SMS_CREWING_URL,
		procedures: checked
	};
});
export const getSmsSync = createServerFn({ method: "GET" }).handler(async () => {
	const snap = await loadSmsSnapshot();
	return {
		lastSyncedAt: snap.checkedAt,
		status: snap.status,
		found: snap.found,
		smsUrl: SMS_URL,
		crewingUrl: SMS_CREWING_URL,
		procedures: snap.procedures,
		notes: snap.notes
	};
});
async function loadSmsSnapshot() {
	const r = (await (await getSql())`select * from sms_sync where user_id = ${OWNER}`)[0];
	if (!r) return emptySmsSnapshot();
	let parsed = {};
	try {
		parsed = r.snapshot_json ? JSON.parse(String(r.snapshot_json)) : {};
	} catch {
		parsed = {};
	}
	const coded = codedProcedureChecks();
	const procedures = parsed.procedures && parsed.procedures.length ? coded.map((c) => parsed.procedures?.find((p) => p.id === c.id) ?? c) : coded;
	const found = parsed.found ?? parsed.found ?? [];
	return {
		status: r.status ? String(r.status) : parsed.status ?? "cached",
		checkedAt: r.last_synced_at ? String(r.last_synced_at) : parsed.checkedAt ?? null,
		procedures,
		notes: parsed.notes?.length ? parsed.notes : [...SMS_BOARD_NOTES],
		found
	};
}
function groupBy(items, key) {
	const m = /* @__PURE__ */ new Map();
	for (const item of items) {
		const k = key(item);
		const arr = m.get(k) ?? [];
		arr.push(item);
		m.set(k, arr);
	}
	return m;
}

export const mergeCrewFiles = createServerFn({ method: "POST" }).validator((input) => input).handler(async ({ data }) => {
	bustLiveCache();
	await ensureSeeded(OWNER);
	const aId = String(data.a ?? "");
	const bId = String(data.b ?? "");
	if (!aId || !bId) throw new Error("Pick the other file to combine.");
	if (aId === bId) throw new Error("That is the same file.");
	const [a, b] = await Promise.all([loadCrewDetail(aId), loadCrewDetail(bId)]);
	if (!a || !b) throw new Error("Mariner not found");
	if (a.status === "current" && b.status === "current") {
		throw new Error("Both are signed on. Sign one off before combining.");
	}
	const score = (p) => {
		const rank = { current: 400, vacation: 300, past: 200, applicant: 100 };
		return (rank[p.status] ?? 0)
			+ (p.mmcNumber ? 3 : 0)
			+ (p.passportNumber ? 3 : 0)
			+ (p.ssLast4 ? 1 : 0)
			+ (p.documents?.length ?? 0)
			+ (p.tours?.length ?? 0) * 2
			+ (p.nok?.length ?? 0);
	};
	const keep = score(a) >= score(b) ? a : b;
	const absorb = keep.id === a.id ? b : a;
	const keepId = keep.id;
	const absorbId = absorb.id;
	const merged = keepLatestTickets(mergeParsed([detailToParsed(keep), detailToParsed(absorb)]));
	const firstName = isFilenameNoise(keep.firstName) ? absorb.firstName ?? keep.firstName : keep.firstName || absorb.firstName;
	const lastName = isFilenameNoise(keep.lastName) ? absorb.lastName ?? keep.lastName : keep.lastName || absorb.lastName;
	const fullName = [firstName, keep.middleName || absorb.middleName, lastName].filter(Boolean).join(" ")
		|| (keep.fullName.split(/\s+/).length >= 2 ? keep.fullName : absorb.fullName);
	const sql = await getSql();
	await sql`
      update crew set
        full_name = ${fullName},
        first_name = coalesce(${txt(firstName)}::text, first_name),
        last_name = coalesce(${txt(lastName)}::text, last_name),
        middle_name = coalesce(${txt(merged.middleName)}::text, middle_name),
        ss_last4 = coalesce(${txt(merged.ssLast4)}::text, ss_last4),
        dob = coalesce(${txt(merged.dob)}::text, dob),
        sex = coalesce(${txt(merged.sex)}::text, sex),
        place_of_birth = coalesce(${txt(merged.placeOfBirth)}::text, place_of_birth),
        citizenship = coalesce(${txt(merged.citizenship)}::text, citizenship),
        address_line = coalesce(${txt(merged.addressLine)}::text, address_line),
        city = coalesce(${txt(merged.city)}::text, city),
        state = coalesce(${txt(merged.state)}::text, state),
        zip = coalesce(${txt(merged.zip)}::text, zip),
        home_phone = coalesce(${txt(merged.homePhone)}::text, home_phone),
        cell_phone = coalesce(${txt(merged.cellPhone)}::text, cell_phone),
        email = coalesce(${txt(merged.email)}::text, email),
        mmc_number = coalesce(${txt(merged.mmcNumber)}::text, mmc_number),
        mmc_place_of_issue = coalesce(${txt(merged.mmcPlaceOfIssue)}::text, mmc_place_of_issue),
        mmc_expiration = nullif(greatest(coalesce(mmc_expiration, ''), coalesce(${txt(merged.mmcExpiration)}::text, '')), ''),
        passport_number = coalesce(${txt(merged.passportNumber)}::text, passport_number),
        passport_expiration = nullif(greatest(coalesce(passport_expiration, ''), coalesce(${txt(merged.passportExpiration)}::text, '')), ''),
        last_position = coalesce(last_position, ${txt(merged.lastPosition)}::text),
        allergies = coalesce(${txt(merged.allergies)}::text, allergies),
        medications = coalesce(${txt(merged.medications)}::text, medications),
        medical_remarks = coalesce(${txt(merged.medicalRemarks)}::text, medical_remarks),
        notes = coalesce(notes, ${txt(merged.notes)}::text),
        updated_at = now()
      where id = ${keepId} and user_id = ${OWNER}
    `;
	const keepDocs = [...keep.documents];
	for (const d of absorb.documents) {
		const same = keepDocs.find((e) => sameCertificate(e, d));
		if (same) {
			const expires = laterExpiry(same.expiresOn, d.expiresOn);
			const issued = same.issuedOn && d.issuedOn && d.issuedOn < same.issuedOn ? d.issuedOn : same.issuedOn || d.issuedOn;
			await sql`
        update crew_documents set
          label = ${same.label || d.label},
          doc_number = coalesce(doc_number, ${txt(d.docNumber)}::text),
          issued_on = coalesce(${txt(issued)}::text, issued_on),
          expires_on = nullif(greatest(coalesce(expires_on, ''), coalesce(${txt(expires)}::text, '')), ''),
          notes = coalesce(notes, ${txt(d.notes)}::text)
        where id = ${same.id} and user_id = ${OWNER}
      `;
			await sql`delete from crew_documents where id = ${d.id} and user_id = ${OWNER}`;
		} else {
			await sql`update crew_documents set crew_id = ${keepId} where id = ${d.id} and user_id = ${OWNER}`;
			keepDocs.push({ ...d, crewId: keepId });
		}
	}
	const keepCodes = new Set(keep.forms.map((f) => f.formCode.toUpperCase()));
	for (const f of absorb.forms) {
		if (keepCodes.has(f.formCode.toUpperCase())) {
			await sql`delete from crew_forms where id = ${f.id} and user_id = ${OWNER}`;
		} else {
			await sql`update crew_forms set crew_id = ${keepId} where id = ${f.id} and user_id = ${OWNER}`;
			keepCodes.add(f.formCode.toUpperCase());
		}
	}
	const keepOpen = keep.tours.find((t) => !t.signOff);
	const absorbOpen = absorb.tours.find((t) => !t.signOff);
	if (keepOpen && absorbOpen) {
		const today = todayUtc().toISOString().slice(0, 10);
		await sql`update crew_tours set sign_off = ${today} where id = ${absorbOpen.id} and user_id = ${OWNER}`;
	}
	await sql`update crew_tours set crew_id = ${keepId} where crew_id = ${absorbId} and user_id = ${OWNER}`;
	if (keep.nok.length) {
		await sql`delete from crew_nok where crew_id = ${absorbId} and user_id = ${OWNER}`;
	} else {
		await sql`update crew_nok set crew_id = ${keepId} where crew_id = ${absorbId} and user_id = ${OWNER}`;
	}
	try {
		const absorbSlots = await sql`select id from vessel_permanent_slots where crew_id = ${absorbId} and user_id = ${OWNER}`;
		const keepSlots = await sql`select id from vessel_permanent_slots where crew_id = ${keepId} and user_id = ${OWNER}`;
		if (absorbSlots.length && !keepSlots.length) {
			await sql`update vessel_permanent_slots set crew_id = ${keepId} where crew_id = ${absorbId} and user_id = ${OWNER}`;
		} else {
			await sql`update vessel_permanent_slots set crew_id = null where crew_id = ${absorbId} and user_id = ${OWNER}`;
		}
	} catch { /* */ }
	try { await sql`update permanent_events set crew_id = ${keepId} where crew_id = ${absorbId} and user_id = ${OWNER}`; } catch { /* */ }
	try { await sql`update inbox_log set crew_id = ${keepId} where crew_id = ${absorbId} and user_id = ${OWNER}`; } catch { /* */ }
	await sql`delete from crew_forms where crew_id = ${absorbId} and user_id = ${OWNER}`;
	await sql`delete from crew_nok where crew_id = ${absorbId} and user_id = ${OWNER}`;
	await sql`delete from crew_documents where crew_id = ${absorbId} and user_id = ${OWNER}`;
	await sql`delete from crew_tours where crew_id = ${absorbId} and user_id = ${OWNER}`;
	try { await sql`delete from permanent_events where crew_id = ${absorbId} and user_id = ${OWNER}`; } catch { /* */ }
	try { await sql`delete from inbox_log where crew_id = ${absorbId} and user_id = ${OWNER}`; } catch { /* */ }
	await sql`delete from crew where id = ${absorbId} and user_id = ${OWNER}`;
	return { ok: true, keepId, keepName: fullName, absorbedName: absorb.fullName, absorbedId };
});

export const deleteCrew = createServerFn({ method: "POST" }).validator((input) => input).handler(async ({ data }) => {
	bustLiveCache();
	await ensureSeeded(OWNER);
	const sql = await getSql();
	const rows = await sql`select * from crew where id = ${data.id} and user_id = ${OWNER} limit 1`;
	if (!rows[0]) throw new Error("Mariner not found");
	const name = String(rows[0].full_name ?? "that file");
	await sql`update vessel_permanent_slots set crew_id = null where crew_id = ${data.id} and user_id = ${OWNER}`;
	try { await sql`delete from permanent_events where crew_id = ${data.id} and user_id = ${OWNER}`; } catch { /* */ }
	await sql`delete from crew_forms where crew_id = ${data.id} and user_id = ${OWNER}`;
	await sql`delete from crew_nok where crew_id = ${data.id} and user_id = ${OWNER}`;
	await sql`delete from crew_documents where crew_id = ${data.id} and user_id = ${OWNER}`;
	await sql`delete from crew_tours where crew_id = ${data.id} and user_id = ${OWNER}`;
	try { await sql`delete from inbox_log where crew_id = ${data.id} and user_id = ${OWNER}`; } catch { /* */ }
	await sql`delete from crew where id = ${data.id} and user_id = ${OWNER}`;
	return { ok: true, fullName: name };
});

export const listRecentInbox = createServerFn({ method: "GET" }).handler(async () => {
	try {
		await ensureSeeded(OWNER);
		const sql = await getSql();
		await sql.query(`create table if not exists inbox_log (
      id text primary key,
      user_id text not null,
      filename text not null,
      crew_id text,
      full_name text,
      created boolean not null default false,
      error text,
      logged_at timestamptz not null default now()
    )`);
		const rows = await sql`select id, filename, crew_id, full_name, created, error, logged_at from inbox_log where user_id = ${OWNER} order by logged_at desc limit 40`;
		return rows.map((r) => ({
			id: r.id,
			filename: r.filename,
			crewId: r.crew_id,
			fullName: r.full_name,
			created: Boolean(r.created),
			error: r.error,
			loggedAt: String(r.logged_at ?? ""),
		}));
	} catch {
		return [];
	}
});
