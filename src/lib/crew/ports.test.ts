import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  chinaPassportGaps,
  deadJoinTickets,
  embarkCountry,
  enoadGaps,
  isForeignCall,
  isYardCall,
  matePort,
  normalizePortName,
  walkOff,
  withMateNext,
} from "./ports.ts";

describe("ports", () => {
  it("maps Long Beach to Honolulu and back", () => {
    assert.equal(matePort("Long Beach"), "Honolulu");
    assert.equal(matePort("Honolulu"), "Long Beach");
    assert.equal(matePort("LB"), "Honolulu");
    assert.equal(matePort("HNL"), "Long Beach");
  });

  it("sends Oakland to Honolulu and the yard home to Long Beach", () => {
    assert.equal(matePort("Oakland"), "Honolulu");
    assert.equal(matePort("Nantong"), "Long Beach");
    assert.equal(normalizePortName("shipyard"), "Nantong");
  });

  it("treats only Nantong as a foreign call", () => {
    assert.equal(isForeignCall("Honolulu"), false);
    assert.equal(isForeignCall("Long Beach"), false);
    assert.equal(isForeignCall("Oakland"), false);
    assert.equal(isForeignCall("Nantong"), true);
  });

  it("flags the yard going or already there", () => {
    assert.equal(isYardCall({ thisPort: "Long Beach", nextPort: "Honolulu" }), false);
    assert.equal(isYardCall({ thisPort: "Honolulu", nextPort: "Oakland" }), false);
    assert.equal(isYardCall({ thisPort: "Long Beach", nextPort: "Nantong" }), true);
    assert.equal(isYardCall({ thisPort: "Nantong", nextPort: "Long Beach" }), true);
  });

  it("sets embark country from the port", () => {
    assert.equal(embarkCountry("Long Beach"), "UNITED STATES");
    assert.equal(embarkCountry("Nantong"), "CHINA");
    assert.equal(embarkCountry(""), "");
  });

  it("fills the other end when you pick this port", () => {
    assert.deepEqual(withMateNext("Honolulu"), { thisPort: "Honolulu", nextPort: "Long Beach" });
    assert.deepEqual(withMateNext("Long Beach", "Nantong"), { thisPort: "Long Beach", nextPort: "Nantong" });
  });
});

describe("walkOff", () => {
  it("12 days left at Long Beach is the next Long Beach, not this call", () => {
    const w = walkOff({
      daysLeft: 12,
      embarkPort: "Long Beach",
      thisPort: "Long Beach",
      nextPort: "Honolulu",
    });
    assert.equal(w.thisCall, false);
    assert.equal(w.when, "next");
    assert.equal(w.port, "Long Beach");
  });

  it("under 12 days at the original embarkation is this call", () => {
    const w = walkOff({
      daysLeft: 5,
      embarkPort: "Long Beach",
      thisPort: "Long Beach",
      nextPort: "Honolulu",
    });
    assert.equal(w.thisCall, true);
    assert.equal(w.when, "this");
    assert.equal(w.port, "Long Beach");
  });

  it("they walk the original embarkation, never the other end", () => {
    const w = walkOff({
      daysLeft: 5,
      embarkPort: "Honolulu",
      thisPort: "Long Beach",
      nextPort: "Honolulu",
    });
    assert.equal(w.thisCall, false);
    assert.equal(w.when, "next");
    assert.equal(w.port, "Honolulu");
  });

  it("overdue at home walks this call", () => {
    const w = walkOff({
      daysLeft: -2,
      embarkPort: "Long Beach",
      thisPort: "Long Beach",
      nextPort: "Honolulu",
    });
    assert.equal(w.thisCall, true);
    assert.equal(w.when, "this");
  });
});

describe("enoadGaps", () => {
  it("asks for sex, DOB, ID, and where embarked", () => {
    const miss = enoadGaps({ fullName: "Kluck, Brian", lastName: "Kluck" });
    assert.ok(miss.includes("Date of birth"));
    assert.ok(miss.includes("Sex"));
    assert.ok(miss.includes("Passport or MMC"));
    assert.ok(miss.includes("Where embarked"));
  });

  it("is clear when the Master can file", () => {
    assert.deepEqual(
      enoadGaps({
        lastName: "Rosca",
        dob: "1980-01-01",
        sex: "M",
        mmcNumber: "123",
        mmcExpiration: "2030-01-01",
        embarkPort: "Long Beach",
      }),
      [],
    );
  });
});

describe("deadJoinTickets", () => {
  it("hard-stops only expired MMC, medical, TWIC, drug-free", () => {
    const dead = deadJoinTickets({
      mmcExpiration: "2020-01-01",
      documents: [
        { docType: "medical", expiresOn: "2020-02-01" },
        { docType: "twic", expiresOn: "2031-01-01" },
        { docType: "cyber", expiresOn: "2020-01-01" },
      ],
    });
    assert.deepEqual(
      dead.map((d) => d.code),
      ["mmc", "medical"],
    );
  });
});

describe("chinaPassportGaps", () => {
  it("flags a missing or short passport for the yard", () => {
    assert.equal(chinaPassportGaps({ crewId: "1", fullName: "A", passportNumber: "X", passportExpiration: "2032-01-01" }), null);
    const miss = chinaPassportGaps({ crewId: "1", fullName: "A" });
    assert.equal(miss?.reason, "No passport");
    const short = chinaPassportGaps({ crewId: "1", fullName: "A", passportNumber: "X", passportExpiration: "2026-10-01" });
    assert.ok(short?.reason.includes("6 months"));
  });
});
