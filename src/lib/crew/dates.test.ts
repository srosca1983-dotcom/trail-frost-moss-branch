import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { credentialExpiryIso, expiryTone, parseDate, toIsoDate } from "./dates.ts";

describe("MMC / USCG dates", () => {
  it("reads 13-JUN-30 as 2030, not 1930", () => {
    assert.equal(toIsoDate("13-JUN-30"), "2030-06-13");
    assert.equal(toIsoDate("13 JUN 2030"), "2030-06-13");
    assert.equal(toIsoDate("Jun 13, 30"), "2030-06-13");
    assert.equal(toIsoDate("06/13/30"), "2030-06-13");
    assert.equal(toIsoDate("13/06/2030"), "2030-06-13");
    assert.equal(expiryTone("2030-06-13"), "ok");
  });

  it("does not shift a 1971 date of birth", () => {
    assert.equal(toIsoDate("1971-12-18"), "1971-12-18");
    assert.equal(toIsoDate("12/18/71"), "1971-12-18");
  });

  it("lifts a 1930 ticket expiry to 2030", () => {
    assert.equal(credentialExpiryIso("1930-06-13"), "2030-06-13");
    assert.equal(credentialExpiryIso("2030-06-13"), "2030-06-13");
  });

  it("parses an ISO date without using local time", () => {
    const d = parseDate("2025-03-15");
    assert.equal(d?.toISOString().slice(0, 10), "2025-03-15");
  });
});
