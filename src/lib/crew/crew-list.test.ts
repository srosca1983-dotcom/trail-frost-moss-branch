import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildGenericCrewListPdf, flattenAboard, flattenWatchBill, genderOf, identityDocument, nationalityOf } from "./crew-list.ts";
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

function occupantSlot(crew: CrewListItem): RosterSlot {
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
          port: null,
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

describe("crew list identity", () => {
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
    passportNumber: "505519190",
    passportExpiration: "2025-01-04",
    mmcNumber: "501128",
    mmcExpiration: "2027-07-30",
    lastPosition: "MASTER",
    lastSignOn: "2026-09-07",
    lastDueOff: "2026-11-02",
    status: "current",
  } as CrewListItem;

  it("normalizes US nationality and gender", () => {
    assert.equal(nationalityOf(null), "USA");
    assert.equal(nationalityOf("United States"), "USA");
    assert.equal(nationalityOf("PH"), "PH");
    assert.equal(genderOf("Male"), "M");
    assert.equal(genderOf("F"), "F");
    assert.equal(genderOf(""), "");
  });

  it("prefers passport over MMC for IMO identity", () => {
    const pass = identityDocument("505519190", "2025-01-04", "501128", "2027-07-30");
    assert.equal(pass.nature, "Passport");
    assert.equal(pass.number, "505519190");
    const mmc = identityDocument(null, null, "501128", "2027-07-30");
    assert.equal(mmc.nature, "MMC");
    const none = identityDocument(null, null, null, null);
    assert.equal(none.number, "");
  });

  it("flattens occupied billets in ship order with DOB", () => {
    const rows = flattenAboard([occupantSlot(kluck)]);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].familyName, "Kluck");
    assert.equal(rows[0].givenNames, "Christopher Eric");
    assert.equal(rows[0].dob, "1964-12-17");
    assert.equal(rows[0].idNature, "Passport");
    assert.equal(rows[0].rank, "Master");
  });

  it("lists souls Master, Chief Mate, down even if slots arrive out of order", () => {
    const stewardBillet: BilletDef = {
      code: "20",
      sortOrder: 20,
      title: "Steward",
      shortTitle: "20 · Steward",
      department: "steward",
      watch: "day",
      unionHall: "SIU",
      defaultAssignment: "PERMANENT",
    };
    const cmBillet: BilletDef = {
      ...masterBillet,
      code: "01",
      sortOrder: 1,
      title: "Chief Mate",
      shortTitle: "01 · Chief Mate",
    };
    const steward = occupantSlot({
      ...kluck,
      id: "seed-steward",
      fullName: "Ramon Dela Cruz",
      firstName: "Ramon",
      lastName: "Dela Cruz",
      lastPosition: "STEWARD",
    } as CrewListItem);
    steward.billet = stewardBillet;
    const mate = occupantSlot({
      ...kluck,
      id: "seed-rosca",
      fullName: "Sorin Rosca",
      firstName: "Sorin",
      lastName: "Rosca",
      lastPosition: "CHIEF MATE",
    } as CrewListItem);
    mate.billet = cmBillet;
    const rows = flattenAboard([steward, mate, occupantSlot(kluck)]);
    assert.deepEqual(
      rows.map((r) => r.rank),
      ["Master", "Chief Mate", "Steward"],
    );
    assert.deepEqual(
      rows.map((r) => r.no),
      [1, 2, 3],
    );
  });

  it("builds a generic crew list PDF", async () => {
    const bytes = await buildGenericCrewListPdf(flattenAboard([occupantSlot(kluck)]), "2026-09-10");
    assert.ok(bytes.byteLength > 500);
    assert.equal(bytes[0], 0x25);
  });

  it("groups the watch bill 12–4 / 4–8 / 8–12 / Day and marks vacant", () => {
    const mateBillet: BilletDef = {
      ...masterBillet,
      code: "02",
      sortOrder: 2,
      title: "Second Mate",
      watch: "12-4",
    };
    const vacantFour: RosterSlot = {
      billet: { ...masterBillet, code: "08", sortOrder: 8, title: "AB/W 4 x 8", watch: "4-8", unionHall: "SIU" },
      occupants: [],
    };
    const mateSlot: RosterSlot = {
      ...occupantSlot({
        ...kluck,
        id: "seed-ranosa",
        fullName: "Christian Ranosa",
        firstName: "Christian",
        lastName: "Ranosa",
        lastPosition: "2/M",
      } as CrewListItem),
      billet: mateBillet,
    };
    const groups = flattenWatchBill([occupantSlot(kluck), mateSlot, vacantFour]);
    assert.deepEqual(
      groups.map((g) => g.label),
      ["12–4", "4–8", "8–12", "Day"],
    );
    assert.equal(groups[0].rows[0].name, "Christian Ranosa");
    assert.equal(groups[1].rows[0].vacant, true);
    assert.equal(groups[3].rows[0].name, "Christopher Eric Kluck");
  });
});

