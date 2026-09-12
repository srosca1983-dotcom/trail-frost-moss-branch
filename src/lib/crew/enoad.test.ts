import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildEnoadCsv,
  buildEnoadWorkbook,
  enoadIdType,
  enoadNationality,
  enoadSex,
  flattenEnoad,
} from "./enoad.ts";
import type { BilletDef, CrewListItem, RosterSlot } from "./types.ts";

const masterBillet: BilletDef = {
  code: "00",
  sortOrder: 0,
  title: "Master",
  shortTitle: "00 · Master",
  department: "deck",
  watch: "day",
  unionHall: "MMP",
  defaultAssignment: "PERMANENT",
};

function occupantSlot(crew: CrewListItem, port: string | null = "Wilmington"): RosterSlot {
  return {
    billet: masterBillet,
    occupants: [
      {
        crew,
        tour: {
          id: "t1",
          crewId: crew.id,
          vessel: "M/V GEORGE II",
          position: "MASTER",
          signOn: "2026-09-07",
          signOff: null,
          port,
          relieving: null,
          assignmentType: "PERMANENT",
          lengthDays: null,
          dispatchRef: null,
          unionHall: "MMP",
          notes: null,
          watch: "day",
          dueOff: "2026-11-02",
          dueOffRule: "Set date",
          billetCode: "00",
          seniorityClass: null,
          extraDays: 0,
          leaveDays: 0,
          leaveCount: 0,
          leaveStartedOn: null,
        },
        due: { date: "2026-11-02", rule: "Set date", days: 56, assumed: false, source: "set-date" },
        daysOn: 3,
        daysLeft: 53,
        extraDays: 0,
        sailingUp: false,
        covering: null,
      },
    ],
  };
}

const kluck = {
  id: "seed-kluck",
  fullName: "Christopher Eric Kluck",
  firstName: "Christopher",
  lastName: "Kluck",
  middleName: "Eric",
  dob: "1964-12-17",
  sex: "M",
  placeOfBirth: "Japan",
  citizenship: "USA",
  cellPhone: "808-555-0100",
  ssLast4: "1234",
  passportNumber: "505519190",
  passportExpiration: "2028-01-04",
  mmcNumber: "501128",
  mmcExpiration: "2027-07-30",
  lastPosition: "MASTER",
  lastSignOn: "2026-09-07",
  lastDueOff: "2026-11-02",
  status: "current",
} as CrewListItem;

describe("eNOAD crew export", () => {
  it("maps sex to Male/Female and US nationality to UNITED STATES", () => {
    assert.equal(enoadSex("M"), "Male");
    assert.equal(enoadSex("Female"), "Female");
    assert.equal(enoadSex(""), "");
    assert.equal(enoadNationality("USA").name, "UNITED STATES");
    assert.equal(enoadNationality("USA").code, "US");
    assert.equal(enoadIdType("MMC"), "Merchant Mariner Document");
  });

  it("prefers passport, uses Male/Female, and does not put SSN in the file", () => {
    const rows = flattenEnoad([occupantSlot(kluck)]);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].lastName, "Kluck");
    assert.equal(rows[0].firstName, "Christopher");
    assert.equal(rows[0].middleName, "Eric");
    assert.equal(rows[0].sex, "Male");
    assert.equal(rows[0].nationality, "UNITED STATES");
    assert.equal(rows[0].idType, "Passport");
    assert.equal(rows[0].idNumber, "505519190");
    assert.equal(rows[0].embarkPort, "Wilmington");
    assert.equal(rows[0].embarkCountry, "UNITED STATES");
    assert.equal(rows[0].longshore, "No");
    assert.equal(rows[0].missing.length, 0);
    const csv = buildEnoadCsv(rows);
    assert.match(csv, /Last Name,First Name,Middle Name,Position/);
    assert.match(csv, /Kluck,Christopher,Eric,Master/);
    assert.equal(csv.includes("1234"), false);
    assert.equal(csv.includes("ssLast4"), false);
  });

  it("flags missing 33 CFR 160.206 items and expired ID", () => {
    const thin = occupantSlot(
      {
        ...kluck,
        id: "thin",
        dob: null,
        sex: null,
        passportNumber: null,
        passportExpiration: null,
        mmcNumber: null,
        mmcExpiration: null,
      } as CrewListItem,
      null,
    );
    const rows = flattenEnoad([thin]);
    assert.ok(rows[0].missing.includes("Date of birth"));
    assert.ok(rows[0].missing.includes("Passport or MMC"));
    assert.ok(rows[0].missing.includes("Sex"));
    assert.ok(rows[0].missing.includes("Where embarked"));

    const expired = flattenEnoad([
      occupantSlot({
        ...kluck,
        id: "exp",
        passportExpiration: "2025-01-04",
      } as CrewListItem),
    ]);
    assert.ok(expired[0].idExpired);
    assert.ok(expired[0].missing.includes("ID expired"));
    assert.equal(expired[0].idType, "Passport");
  });

  it("builds an Excel workbook the Master can open, with a Needs a ticket sheet", () => {
    const ready = flattenEnoad([occupantSlot(kluck)]);
    const xls = buildEnoadWorkbook(ready, {
      arrival: true,
      departure: false,
      port: "San Pedro",
      date: "2026-09-20",
    });
    assert.match(xls, /^<\?xml/);
    assert.match(xls, /ss:Name="Crew"/);
    assert.match(xls, /ss:Name="Read me"/);
    assert.match(xls, /not a full Notice of Arrival/);
    assert.match(xls, /San Pedro/);
    assert.match(xls, /Kluck/);
    assert.equal(xls.includes("1234"), false);

    const blocked = flattenEnoad([
      occupantSlot(
        {
          ...kluck,
          id: "no-id",
          passportNumber: null,
          passportExpiration: null,
          mmcNumber: null,
        } as CrewListItem,
        null,
      ),
    ]);
    const withNeed = buildEnoadWorkbook(blocked, {
      arrival: true,
      departure: false,
      port: "",
      date: "2026-09-20",
    });
    assert.match(withNeed, /ss:Name="Needs a ticket"/);
    assert.match(withNeed, /Passport or MMC/);
  });
});
