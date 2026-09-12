import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { emptyPerson, mergeParsed, missingForPacket, betterDate } from "./merge.ts";

describe("mergeParsed", () => {
  it("keeps uploaded fields and fills gaps from the ledger file", () => {
    const uploaded = emptyPerson();
    uploaded.fullName = "John F. Huyett";
    uploaded.firstName = "John";
    uploaded.lastName = "Huyett";
    uploaded.mmcNumber = "568739";
    uploaded.mmcExpiration = "2028-06-11";

    const ledger = emptyPerson();
    ledger.fullName = "John F. Huyett";
    ledger.firstName = "John";
    ledger.lastName = "Huyett";
    ledger.ssLast4 = "9162";
    ledger.dob = "1964-01-12";
    ledger.addressLine = "27809 Morningmist Dr";
    ledger.city = "Wesley Chapel";
    ledger.state = "FL";
    ledger.zip = "33543";
    ledger.cellPhone = "360-255-1986";
    ledger.passportNumber = "584512100";
    ledger.passportExpiration = "2028-06-20";
    ledger.lastPosition = "STEWARD";
    ledger.nextOfKin = { fullName: "Nadwa Huyett", relationship: "Wife", addressLine: null, city: null, state: null, zip: null, phone: null, cellPhone: "360-506-7049" };

    const merged = mergeParsed([uploaded, ledger]);
    assert.equal(merged.mmcNumber, "568739");
    assert.equal(merged.ssLast4, "9162");
    assert.equal(merged.passportNumber, "584512100");
    assert.equal(merged.addressLine, "27809 Morningmist Dr");
    assert.equal(merged.nextOfKin?.fullName, "Nadwa Huyett");
    assert.equal(merged.lastPosition, "STEWARD");
    assert.ok(!missingForPacket(merged).includes("Passport number"));
    assert.ok(!missingForPacket(merged).includes("Address"));
  });

  it("does not let the ledger overwrite a value from the upload", () => {
    const uploaded = emptyPerson();
    uploaded.fullName = "John Huyett";
    uploaded.cellPhone = "555-000-1111";
    const ledger = emptyPerson();
    ledger.fullName = "John F. Huyett";
    ledger.cellPhone = "360-255-1986";
    const merged = mergeParsed([uploaded, ledger]);
    assert.equal(merged.fullName, "John Huyett");
    assert.equal(merged.cellPhone, "555-000-1111");
  });

  it("keeps the uploaded ticket date when the ledger has an older one of the same type", () => {
    const uploaded = emptyPerson();
    uploaded.documents = [
      { docType: "twic", label: "TWIC", docNumber: "123", issuedOn: "2026-01-15", expiresOn: "2031-01-15", notes: null },
    ];
    const ledger = emptyPerson();
    ledger.documents = [
      { docType: "twic", label: "TWIC", docNumber: "old", issuedOn: "2020-01-01", expiresOn: "2025-01-01", notes: null },
      { docType: "mmc", label: "MMC", docNumber: "568739", issuedOn: "2023-06-11", expiresOn: "2028-06-11", notes: null },
    ];
    const merged = mergeParsed([uploaded, ledger]);
    const twic = merged.documents.find((d) => d.docType === "twic");
    assert.equal(twic?.expiresOn, "2031-01-15");
    assert.equal(twic?.docNumber, "123");
    assert.ok(merged.documents.some((d) => d.docType === "mmc"));
  });

  it("does not replace a later ledger passport date with an illegible scan", () => {
    assert.equal(betterDate("2033-11-27", "2027-12-11", "Number illegible on scan"), "2033-11-27");
    const uploaded = emptyPerson();
    uploaded.documents = [
      { docType: "passport", label: "US Passport", docNumber: null, issuedOn: null, expiresOn: "2027-12-11", notes: "illegible" },
    ];
    const ledger = emptyPerson();
    ledger.documents = [
      { docType: "passport", label: "US Passport", docNumber: "A2599987", issuedOn: null, expiresOn: "2033-11-27", notes: null },
    ];
    const merged = mergeParsed([uploaded, ledger]);
    const pp = merged.documents.find((d) => d.docType === "passport");
    assert.equal(pp?.expiresOn, "2033-11-27");
    assert.equal(pp?.docNumber, "A2599987");
  });

  it("keeps the later MMC expiration when one read is the issue date", () => {
    const first = emptyPerson();
    first.mmcExpiration = "2025-03-15";
    const second = emptyPerson();
    second.mmcExpiration = "2030-03-15";
    const merged = mergeParsed([first, second]);
    assert.equal(merged.mmcExpiration, "2030-03-15");
    const reversed = mergeParsed([second, first]);
    assert.equal(reversed.mmcExpiration, "2030-03-15");
  });

  it("keeps one medical certificate — the National date that expires last", () => {
    const p = emptyPerson();
    p.documents = [
      { docType: "medical", label: "USCG Medical STCW", docNumber: "3790914", issuedOn: "2023-06-13", expiresOn: "2025-06-13", notes: "STCW 13 Jun 2025" },
      { docType: "medical", label: "USCG Medical National", docNumber: "3790914", issuedOn: "2023-06-13", expiresOn: "2028-06-13", notes: "National 13 Jun 2028" },
      { docType: "medical", label: "USCG Medical photocopy", docNumber: null, issuedOn: "2023-06-13", expiresOn: "2025-06-13", notes: null },
    ];
    const merged = mergeParsed([p]);
    const medical = merged.documents.filter((d) => d.docType === "medical");
    assert.equal(medical.length, 1);
    assert.equal(medical[0]?.expiresOn, "2028-06-13");
    assert.equal(medical[0]?.docNumber, "3790914");
  });

  it("lifts National expiry off a single medical card that stored the STCW date", () => {
    const p = emptyPerson();
    p.documents = [
      {
        docType: "medical",
        label: "USCG Medical Certificate",
        docNumber: "3232716",
        issuedOn: "2022-07-30",
        expiresOn: "2025-07-30",
        notes: "STCW 30 Jul 2025 (expired) · National 30 Jul 2027. CN 3232716.",
      },
    ];
    const merged = mergeParsed([p]);
    assert.equal(merged.documents.find((d) => d.docType === "medical")?.expiresOn, "2027-07-30");
  });

  it("keeps the newest MMC when a packet has two copies", () => {
    const p = emptyPerson();
    p.mmcNumber = "000338014";
    p.mmcExpiration = "2023-06-13";
    p.documents = [
      { docType: "mmc", label: "MMC old photo", docNumber: "000338014", issuedOn: "2018-06-13", expiresOn: "2023-06-13", notes: null },
      { docType: "mmc", label: "MMC", docNumber: "000338014", issuedOn: "2023-06-13", expiresOn: "2028-06-13", notes: null },
    ];
    const merged = mergeParsed([p]);
    assert.equal(merged.documents.filter((d) => d.docType === "mmc").length, 1);
    assert.equal(merged.mmcExpiration, "2028-06-13");
    assert.equal(merged.documents.find((d) => d.docType === "mmc")?.expiresOn, "2028-06-13");
  });

  it("does not collapse unrelated 'other' certificates", () => {
    const p = emptyPerson();
    p.documents = [
      { docType: "other", label: "Fitness for Duty (SIU)", docNumber: null, issuedOn: "2026-08-13", expiresOn: "2027-02-13", notes: null },
      { docType: "other", label: "Benzene Clearance", docNumber: null, issuedOn: "2026-04-15", expiresOn: "2027-04-15", notes: null },
    ];
    const merged = mergeParsed([p]);
    assert.equal(merged.documents.filter((d) => d.docType === "other").length, 2);
  });
});
