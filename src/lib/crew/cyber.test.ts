import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { classifyCrew, isKeyPersonnel, modulesFor, needsOtTraining, seatsForModule } from "./cyber.ts";
import { needsSmsHazmat, nseApplies, parseSmsRev } from "./sms-training.ts";

describe("33 CFR 101.650 who-needs-what · SMM-SMM-08 Rev 3", () => {
  it("all licensed officers and the electrician take Mod 1–3", () => {
    for (const p of ["MASTER", "C/M", "CHIEF MATE", "2/M", "3/M", "C/E", "CHIEF ENGINEER", "1A/E", "1ST A/E", "2A/E", "3A/E", "ELECTRICIAN", "QEE"]) {
      assert.equal(isKeyPersonnel(p), true, p);
      assert.equal(needsOtTraining(p), true, p);
      assert.deepEqual(modulesFor(p), ["awareness", "ot", "key"], p);
    }
  });

  it("ratings and steward take Mod 1 only", () => {
    for (const p of ["BOSUN", "AB/W", "AB DAY", "QMED", "DEU", "ENGINE CADET", "STEWARD", "COOK", "STEWARD ASSIST"]) {
      assert.equal(isKeyPersonnel(p), false, p);
      assert.equal(needsOtTraining(p), false, p);
      assert.deepEqual(modulesFor(p), ["awareness"], p);
    }
  });

  it("HAZMAT is deck officers only under SMM-PER-06 Table 4.5", () => {
    assert.equal(needsSmsHazmat("MASTER"), true);
    assert.equal(needsSmsHazmat("3/M"), true);
    assert.equal(needsSmsHazmat("C/E"), false);
    assert.equal(needsSmsHazmat("BOSUN"), false);
    assert.equal(needsSmsHazmat("STEWARD"), false);
    assert.equal(nseApplies("hazmat", "C/M"), true);
    assert.equal(nseApplies("hazmat", "QMED"), false);
    assert.equal(nseApplies("cyber_ot", "AB/W"), false);
    assert.equal(nseApplies("cyber_key", "2A/E"), true);
    assert.equal(nseApplies("sash", "COOK"), true);
  });

  it("classifies a mixed articles list", () => {
    const seats = classifyCrew([
      { id: "1", fullName: "Christopher Kluck", lastPosition: "MASTER", lastBillet: "00", status: "current" },
      { id: "2", fullName: "John Huyett", lastPosition: "STEWARD", lastBillet: "20", status: "current" },
      { id: "3", fullName: "Joe Tuck", lastPosition: "MASTER", lastBillet: "00", status: "vacation" },
      { id: "4", fullName: "Mark Garcia", lastPosition: "AB/W", lastBillet: "08", status: "current" },
    ]);
    assert.equal(seats.length, 3);
    assert.deepEqual(
      seats.map((s) => s.fullName),
      ["Christopher Kluck", "Mark Garcia", "John Huyett"],
    );
    assert.equal(seatsForModule(seats, "key").length, 1);
    assert.equal(seatsForModule(seats, "ot").length, 1);
    assert.equal(seatsForModule(seats, "awareness").length, 3);
  });

  it("parses SMS revision headers", () => {
    const a = parseSmsRev("SMM-PER-06 Date 09/11/25 Rev 3 Training");
    assert.equal(a.id, "SMM-PER-06");
    assert.equal(a.rev, "3");
    assert.equal(a.date, "2025-09-11");
    const b = parseSmsRev("SMM-SMM-08 Rev 3 · 07/31/26");
    assert.equal(b.id, "SMM-SMM-08");
    assert.equal(b.rev, "3");
    const c = parseSmsRev("Revision 4 guidelines. Doc SMM-SMM-08 Page 1-50 Date 07/31/26 Rev: 3");
    assert.equal(c.rev, "3");
    const d = parseSmsRev("<p>SMM-PER-06</p><span>Date <!-- -->09/11/25</span><span>Rev <!-- -->3</span>");
    assert.equal(d.rev, "3");
    assert.equal(d.date, "2025-09-11");
  });
});

