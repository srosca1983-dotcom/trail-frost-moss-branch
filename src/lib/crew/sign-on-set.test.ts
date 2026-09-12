import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { emptyPerson } from "./merge.ts";
import { doorRank, paperworkForJoining, ticketsForPerson } from "./sign-on-set.ts";

describe("SRO-CM-06 / SMM-PER-05 paperwork set", () => {
  it("new joiners get I-9, W-4, DOT, and sign-on information", () => {
    const set = paperworkForJoining({ returning: false, unionHall: "SIU" });
    assert.ok(set.packetPages.includes("per003"));
    assert.ok(set.packetPages.includes("i9"));
    assert.ok(set.packetPages.includes("w4"));
    assert.ok(set.packetPages.includes("dot"));
    assert.ok(set.packetPages.includes("fam"));
    assert.ok(set.packetPages.includes("physical"));
    assert.ok(set.packetPages.includes("policies"));
    assert.ok(!set.packetPages.includes("hazmatQuiz"));
    assert.ok(set.extras.includes("siu-401k"));
    assert.ok(set.extras.includes("door-tag"));
    assert.ok(!set.extras.includes("hazmat-cert"));
  });

  it("deck officers get a HAZMAT certificate only when the 3-year card is due", () => {
    const due = paperworkForJoining({ returning: false, unionHall: "MMP", position: "C/M", hazmatExpired: true });
    assert.ok(due.extras.includes("hazmat-cert"));
    const current = paperworkForJoining({ returning: true, unionHall: "MMP", position: "MASTER", hazmatExpired: false });
    assert.ok(!current.extras.includes("hazmat-cert"));
    const steward = paperworkForJoining({ returning: false, unionHall: "SIU", position: "STEWARD", hazmatExpired: true });
    assert.ok(!steward.extras.includes("hazmat-cert"));
  });

  it("returning crew skip I-9 / W-4 / DOT unless asked, and still get familiarization", () => {
    const set = paperworkForJoining({ returning: true, unionHall: "MMP" });
    assert.ok(set.packetPages.includes("fam"));
    assert.ok(set.packetPages.includes("physical"));
    assert.ok(set.packetPages.includes("policies"));
    assert.ok(set.packetPages.includes("medical"));
    assert.ok(!set.packetPages.includes("i9"));
    assert.ok(!set.packetPages.includes("w4"));
    assert.ok(!set.packetPages.includes("dot"));
    assert.ok(!set.packetPages.includes("per003"));
    assert.ok(set.extras.includes("mmp-401k-optout"));
    assert.ok(!set.extras.includes("mmp-401k-enroll"));
  });

  it("returning MM&P can take the enrollment form instead of opt-out", () => {
    const set = paperworkForJoining({ returning: true, unionHall: "MMP", enroll401k: true, identityChanged: true, w4Needed: true });
    assert.ok(set.extras.includes("mmp-401k-enroll"));
    assert.ok(!set.extras.includes("mmp-401k-optout"));
    assert.ok(set.packetPages.includes("per003"));
    assert.ok(set.packetPages.includes("w4"));
  });

  it("MEBA gets 401k and converted OT; SIU gets Empower", () => {
    const meba = paperworkForJoining({ returning: true, unionHall: "MEBA" });
    assert.ok(meba.extras.includes("meba-401k"));
    assert.ok(meba.extras.includes("meba-ot"));
    const siu = paperworkForJoining({ returning: false, unionHall: "SIU" });
    assert.ok(siu.extras.includes("siu-401k"));
  });

  it("lists expired tickets from the file", () => {
    const p = emptyPerson();
    p.mmcExpiration = "2024-01-01";
    p.documents = [{ docType: "hazmat", label: "HAZMAT", docNumber: null, issuedOn: "2023-09-01", expiresOn: "2026-09-01", notes: null }];
    const rows = ticketsForPerson(p);
    const mmc = rows.find((r) => r.code === "MMC");
    assert.equal(mmc?.tone, "expired");
    const haz = rows.find((r) => r.code === "HAZMAT");
    assert.ok(haz);
    assert.equal(haz?.required, false);
  });

  it("HAZMAT ticket is required for a deck officer", () => {
    const p = emptyPerson();
    p.lastPosition = "2/M";
    const haz = ticketsForPerson(p).find((r) => r.code === "HAZMAT");
    assert.equal(haz?.required, true);
  });

  it("prints the internet usage policy as three pages when it is due", () => {
    const set = paperworkForJoining({ returning: true, unionHall: "MMP", internetExpired: true });
    assert.ok(set.packetPages.includes("internet"));
    assert.ok(!set.packetPages.includes("cyber"));
  });

  it("door tag is only for the joining person and uses template ranks", () => {
    const set = paperworkForJoining({ returning: false, unionHall: "SIU" });
    assert.ok(set.extras.includes("door-tag"));
    const item = set.forms.find((f) => f.key === "door-tag");
    assert.match(item?.why ?? "", /joining/i);
    assert.equal(doorRank("00"), "Captain");
    assert.equal(doorRank("08"), "AB watch 4 x 8");
    assert.equal(doorRank("06"), "AB Day 4 x 8");
    assert.equal(doorRank("24"), "Second Engineer day");
    assert.equal(doorRank(null, "AB/W", "12-4"), "AB watch 12 x 4");
  });
});
