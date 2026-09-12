import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { addDays, parseDate } from "./dates.ts";
import {
  computeDueOff,
  defaultTourDays,
  extraDaysToTrips,
  extraTripsLabel,
  extraTripsRule,
  normalizeAssignment,
  normalizeUnion,
  onExpiryBoard,
  parseWatch,
  remainingCoveredDays,
  rotaryLeaveCheck,
  rotaryLeaveDurationNote,
  setDateFromTour,
  snapExtraDays,
  tripsToExtraDays,
  unionForPosition,
} from "./shipping.ts";

describe("shipping rules", () => {
  it("MM&P permanent is 56 days; rotary stays 120", () => {
    const perm = defaultTourDays({ unionHall: "MMP", assignmentType: "PERMANENT" });
    assert.equal(perm.days, 56);
    assert.equal(perm.window?.max, 120);
    assert.equal(defaultTourDays({ unionHall: "MMP", assignmentType: "ROTARY" }).days, 120);
  });

  it("MEBA rotary is 90, permanent officers are 56, and the rule does not mention MM&P", () => {
    const rotary = defaultTourDays({ unionHall: "MEBA", assignmentType: "ROTARY" });
    assert.equal(rotary.days, 90);
    assert.equal(rotary.rule, "MEBA rotary · 90 days");
    assert.equal(defaultTourDays({ unionHall: "MEBA", assignmentType: "PERMANENT" }).days, 56);
  });

  it("SIU permanent is 75–120, Class A freightship is 75–120 not 240, B/C keep retain", () => {
    const perm = defaultTourDays({ unionHall: "SIU", assignmentType: "PERMANENT" });
    assert.equal(perm.days, 120);
    assert.equal(perm.window?.min, 75);
    const classA = defaultTourDays({ unionHall: "SIU", assignmentType: "ROTARY", siuClass: "A" });
    assert.equal(classA.days, 120);
    assert.equal(classA.window?.min, 75);
    assert.equal(classA.window?.max, 120);
    assert.match(classA.rule, /75–120/);
    assert.equal(defaultTourDays({ unionHall: "SIU", assignmentType: "ROTARY", siuClass: "B" }).days, 180);
    assert.equal(defaultTourDays({ unionHall: "SIU", assignmentType: "ROTARY", siuClass: "C" }).days, 60);
    const unk = defaultTourDays({ unionHall: "SIU", assignmentType: "ROTARY" });
    assert.equal(unk.days, 120);
    assert.equal(unk.assumed, true);
    assert.match(unk.rule, /class not on file/);
  });

  it("relief uses set length; SIU trip relief covering a permanent is 45–60", () => {
    assert.equal(defaultTourDays({ unionHall: "MEBA", assignmentType: "RELIEF", lengthDays: 14 }).days, 14);
    const siu = defaultTourDays({ unionHall: "SIU", assignmentType: "RELIEF" });
    assert.equal(siu.days, 60);
    assert.equal(siu.window?.min, 45);
    assert.equal(siu.assumed, true);
    assert.match(siu.rule, /trip relief/);
    assert.equal(defaultTourDays({ unionHall: "NONE", assignmentType: "CADET" }).days, null);
    const flynn = computeDueOff({ signOn: "2026-09-01", unionHall: "SIU", assignmentType: "RELIEF" });
    assert.equal(flynn.date, "2026-10-31");
    const yahia = computeDueOff({ signOn: "2026-07-27", unionHall: "SIU", assignmentType: "RELIEF" });
    assert.equal(yahia.date, "2026-09-25");
  });

  it("computes due-off from sign-on", () => {
    const mmp = computeDueOff({ signOn: "2026-09-01", unionHall: "MMP", assignmentType: "PERMANENT" });
    assert.equal(mmp.date, "2026-10-27");
    assert.match(mmp.rule, /56-day rotation/);
    const rotary = computeDueOff({ signOn: "2026-09-01", unionHall: "MMP", assignmentType: "ROTARY" });
    assert.equal(rotary.date, "2026-12-30");
    const meba = computeDueOff({ signOn: "2026-07-07", unionHall: "MEBA", assignmentType: "ROTARY" });
    assert.equal(meba.date, addDays("2026-07-07", 90));
    const relief = computeDueOff({
      signOn: "2026-09-01",
      unionHall: "MEBA",
      assignmentType: "RELIEF",
      lengthDays: 14,
    });
    assert.equal(relief.date, "2026-09-15");
    const set = computeDueOff({
      signOn: "2026-09-07",
      unionHall: "MMP",
      assignmentType: "PERMANENT",
      explicitEnd: "2026-11-02",
    });
    assert.equal(set.date, "2026-11-02");
    assert.equal(set.source, "set-date");
    assert.match(set.rule, /^Discharge/);
    const extra = computeDueOff({
      signOn: "2026-09-07",
      unionHall: "MMP",
      assignmentType: "PERMANENT",
      explicitEnd: "2026-11-02",
      extraDays: 14,
    });
    assert.equal(extra.date, "2026-11-16");
    assert.equal(extra.baseDate, "2026-11-02");
    assert.equal(extra.extraDays, 14);
    assert.match(extra.rule, /\+1 trip \(14d\)/);

    const early = computeDueOff({
      signOn: "2026-09-01",
      unionHall: "MMP",
      assignmentType: "PERMANENT",
      extraDays: -14,
    });
    assert.equal(early.date, addDays("2026-10-27", -14));
  });

  it("snaps extra days to 14-day trips", () => {
    assert.equal(snapExtraDays(0), 0);
    assert.equal(snapExtraDays(7), 14);
    assert.equal(snapExtraDays(20), 14);
    assert.equal(snapExtraDays(21), 28);
    assert.equal(tripsToExtraDays(2), 28);
    assert.equal(extraDaysToTrips(42), 3);
    assert.equal(extraTripsLabel(14), "+1 trip");
    assert.equal(extraTripsLabel(-28), "−2 trips early");
    assert.equal(extraTripsRule(14), "+1 trip (14d)");
  });

  it("infers union and watch from rating text", () => {
    assert.equal(unionForPosition("Chief Mate"), "MMP");
    assert.equal(unionForPosition("3 A/E 8 x 12"), "MEBA");
    assert.equal(unionForPosition("AB/W 12 x 4"), "SIU");
    assert.equal(parseWatch("07 - AB/W 12 x 4"), "12-4");
    assert.equal(parseWatch("2 A/E Day"), "day");
  });

  it("recovers the original discharge date after extra days", () => {
    assert.equal(
      setDateFromTour({ dueOff: "2026-11-16", dueOffRule: "Discharge · 56 day assignment · +1 trip (14d)", extraDays: 14 }),
      "2026-11-02",
    );
    assert.equal(setDateFromTour({ dueOff: "2026-11-02", dueOffRule: "Discharge · 56 day assignment", extraDays: 0 }), "2026-11-02");
    assert.equal(setDateFromTour({ dueOff: "2026-11-02", dueOffRule: "Set date · 56 day assignment", extraDays: 0 }), "2026-11-02");
    assert.equal(setDateFromTour({ dueOff: "2026-10-27", dueOffRule: "MM&P permanent · 56-day rotation (4 trips)", extraDays: 0 }), null);
  });

  it("normalizes union hall and assignment labels", () => {
    assert.equal(normalizeUnion("MM&P"), "MMP");
    assert.equal(normalizeUnion("meba"), "MEBA");
    assert.equal(normalizeAssignment("14 day relief"), "RELIEF");
    assert.equal(normalizeAssignment("Permanent"), "PERMANENT");
  });

  it("expiry board is aboard, rotary on vacation, and permanents", () => {
    assert.equal(onExpiryBoard({ status: "current", assignmentType: "RELIEF" }), true);
    assert.equal(onExpiryBoard({ status: "vacation", assignmentType: "ROTARY" }), true);
    assert.equal(onExpiryBoard({ status: "vacation", assignmentType: "PERMANENT" }), true);
    assert.equal(onExpiryBoard({ status: "vacation", permanentRating: "Chief Mate" }), true);
    assert.equal(onExpiryBoard({ status: "past", assignmentType: "PERMANENT", permanentRating: "Master" }), false);
    assert.equal(onExpiryBoard({ status: "applicant", assignmentType: "ROTARY" }), false);
    assert.equal(onExpiryBoard({ status: "past", assignmentType: "ROTARY" }), false);
  });

  it("rotary leave pauses the 120/90 clock and slides due-off", () => {
    const mmp = computeDueOff({
      signOn: "2026-09-01",
      unionHall: "MMP",
      assignmentType: "ROTARY",
      leaveDays: 14,
    });
    assert.equal(mmp.date, "2027-01-13");
    assert.equal(mmp.leaveDays, 14);
    assert.match(mmp.rule, /rotary leave/);

    const meba = computeDueOff({
      signOn: "2026-09-01",
      unionHall: "MEBA",
      assignmentType: "ROTARY",
      leaveDays: 14,
    });
    assert.equal(meba.date, addDays("2026-09-01", 90 + 14));

    const asOf = parseDate("2026-09-29")!;
    const clock = remainingCoveredDays({
      signOn: "2026-09-01",
      unionHall: "MMP",
      assignmentType: "ROTARY",
      leaveDays: 14,
      asOf,
    });
    assert.equal(clock.covered, 14);
    assert.equal(clock.remaining, 106);
    assert.equal(clock.tourDays, 120);

    const paused = remainingCoveredDays({
      signOn: "2026-09-01",
      unionHall: "MMP",
      assignmentType: "ROTARY",
      leaveStartedOn: "2026-09-15",
      asOf: parseDate("2026-10-15")!,
    });
    assert.equal(paused.covered, 14);
    assert.equal(paused.remaining, 106);

    assert.equal(
      setDateFromTour({
        dueOff: "2027-01-13",
        dueOffRule: "Discharge · 120 day assignment · +14d rotary leave",
        extraDays: 0,
        leaveDays: 14,
      }),
      "2026-12-30",
    );
  });

  it("rotary leave is one per assignment, not for relief, after 14 days, by day 98", () => {
    const asOf14 = parseDate("2026-09-15")!;
    const asOf13 = parseDate("2026-09-14")!;
    const asOf98 = parseDate("2026-12-08")!;
    const asOf99 = parseDate("2026-12-09")!;

    assert.equal(
      rotaryLeaveCheck({ unionHall: "MEBA", assignmentType: "RELIEF", signOn: "2026-09-01", asOf: asOf14 }).ok,
      false,
    );
    assert.equal(
      rotaryLeaveCheck({ unionHall: "NONE", assignmentType: "CADET", signOn: "2026-09-01", asOf: asOf14 }).ok,
      false,
    );
    assert.equal(
      rotaryLeaveCheck({
        unionHall: "MMP",
        assignmentType: "ROTARY",
        signOn: "2026-09-01",
        leaveCount: 1,
        asOf: asOf14,
      }).ok,
      false,
    );
    assert.equal(
      rotaryLeaveCheck({
        unionHall: "MMP",
        assignmentType: "ROTARY",
        signOn: "2026-09-01",
        leaveStartedOn: "2026-09-15",
        asOf: asOf14,
      }).ok,
      false,
    );
    assert.equal(
      rotaryLeaveCheck({ unionHall: "MMP", assignmentType: "ROTARY", signOn: "2026-09-01", asOf: asOf13 }).ok,
      false,
    );
    assert.equal(
      rotaryLeaveCheck({ unionHall: "MMP", assignmentType: "ROTARY", signOn: "2026-09-01", asOf: asOf14 }).ok,
      true,
    );
    assert.equal(
      rotaryLeaveCheck({ unionHall: "MEBA", assignmentType: "ROTARY", signOn: "2026-09-01", asOf: asOf98 }).ok,
      true,
    );
    assert.equal(
      rotaryLeaveCheck({ unionHall: "MEBA", assignmentType: "ROTARY", signOn: "2026-09-01", asOf: asOf99 }).ok,
      false,
    );
    assert.equal(
      rotaryLeaveCheck({ unionHall: "MMP", assignmentType: "PERMANENT", signOn: "2026-09-01", asOf: asOf14 }).ok,
      true,
    );
    assert.match(rotaryLeaveDurationNote(10) ?? "", /under one round trip/);
    assert.match(rotaryLeaveDurationNote(61) ?? "", /over 60/);
    assert.equal(rotaryLeaveDurationNote(30), null);
  });
});

