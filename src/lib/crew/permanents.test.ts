import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canRateUp,
  coveringLabel,
  coveringTripRelief,
  isRatedUp,
  ratingKey,
  remainingUpgrades,
  rotationReturn,
  upgradeOptions,
} from "./permanents.ts";

describe("permanent rating vs sailing rank", () => {
  it("maps officer nicknames onto the same key", () => {
    assert.equal(ratingKey("Chief Mate"), "CM");
    assert.equal(ratingKey("C/M"), "CM");
    assert.equal(ratingKey("1st A/E"), "1AE");
    assert.equal(ratingKey("1A/E"), "1AE");
    assert.equal(ratingKey("Watch 2 A/E"), "2AE");
    assert.equal(ratingKey("2A/E"), "2AE");
    assert.equal(ratingKey("Gas 2 / 2 A/E Day"), "GAS2");
    assert.equal(ratingKey("C/E"), "CE");
  });

  it("every chief mate, 1st A/E, and 2nd A/E can rate up", () => {
    const capable = ["C/M", "Chief Mate", "1A/E", "1st A/E", "2A/E", "Watch 2 A/E", "2 A/E DAY", "Gas 2"];
    for (const r of capable) {
      assert.equal(canRateUp(r), true, r);
      assert.ok(upgradeOptions(r).length > 0, r);
    }
    assert.equal(upgradeOptions("C/M")[0].rating, "MASTER");
    assert.equal(upgradeOptions("1A/E")[0].rating, "C/E");
    assert.deepEqual(
      upgradeOptions("2A/E").map((o) => o.rating),
      ["1A/E", "C/E"],
    );
    assert.deepEqual(
      upgradeOptions("2 A/E DAY").map((o) => o.rating),
      ["1A/E", "C/E"],
    );
    assert.equal(canRateUp("MASTER"), false);
    assert.equal(canRateUp("C/E"), false);
    assert.equal(canRateUp("3A/E"), false);
    assert.equal(upgradeOptions("BOSUN").length, 0);
  });

  it("Novak is permanent 1st rated as chief", () => {
    assert.equal(isRatedUp("1A/E", "C/E"), true);
    assert.equal(coveringLabel("1A/E", "C/E"), "rated as Chief Engineer");
    assert.deepEqual(remainingUpgrades("1A/E", "C/E"), []);
  });

  it("Sabrina is permanent 2AE rated as first", () => {
    assert.equal(isRatedUp("2A/E", "1A/E"), true);
    assert.equal(coveringLabel("Watch 2 A/E", "1A/E"), "rated as 1st A/E");
    const left = remainingUpgrades("2A/E", "1A/E");
    assert.equal(left.length, 1);
    assert.equal(left[0].rating, "C/E");
  });

  it("chief mate can rate up to master", () => {
    const opts = upgradeOptions("C/M");
    assert.equal(opts[0].rating, "MASTER");
    assert.equal(isRatedUp("C/M", "MASTER"), true);
    assert.equal(isRatedUp("C/M", "C/M"), false);
    assert.equal(remainingUpgrades("C/M", "C/M").length, 1);
  });

  it("does not treat a drop in rank as a rate up", () => {
    assert.equal(isRatedUp("C/E", "1A/E"), false);
    assert.equal(isRatedUp("1A/E", "2A/E"), false);
  });
});

describe("covering a permanent is trip relief, not rotary", () => {
  const slots = [
    { sailingBillet: "15", crewId: "seed-huffman" },
    { sailingBillet: "21", crewId: "seed-kenya-scott" },
    { sailingBillet: "01", crewId: "seed-rosca" },
    { sailingBillet: "01", crewId: "seed-shahbin" },
    { sailingBillet: "10", crewId: "seed-tesson" },
    { sailingBillet: "10", crewId: "seed-navarrete" },
    { sailingBillet: "11", crewId: "seed-jensen" },
    { sailingBillet: "11", crewId: "seed-novak" },
  ];
  const people = [
    { id: "seed-huffman", fullName: "Richard Huffman", status: "vacation", permanentRating: "ELECTRICIAN", lastPosition: "ELECTRICIAN", billetCode: "15" },
    { id: "seed-flynn-thomas", fullName: "Thomas Flynn", status: "current", lastPosition: "ELECTRICIAN", billetCode: "15" },
    { id: "seed-kenya-scott", fullName: "Kenya Scott", status: "vacation", permanentRating: "COOK", lastPosition: "COOK", billetCode: "21" },
    { id: "seed-yahia", fullName: "Khaled Yahia", status: "current", lastPosition: "COOK", billetCode: "21" },
    { id: "seed-rosca", fullName: "Sorin Rosca", status: "current", permanentRating: "C/M", lastPosition: "C/M", billetCode: "01" },
    { id: "seed-shahbin", fullName: "Rafik Shahbin", status: "vacation", permanentRating: "C/M", lastPosition: "C/M", billetCode: "01" },
    { id: "seed-tesson", fullName: "Raymond Tesson", status: "vacation", permanentRating: "C/E", lastPosition: "C/E", billetCode: "10" },
    { id: "seed-navarrete", fullName: "Navarrete", status: "vacation", permanentRating: "C/E", lastPosition: "C/E", billetCode: "10" },
    { id: "seed-novak", fullName: "Ryan Novak", status: "current", permanentRating: "1A/E", lastPosition: "C/E", billetCode: "10" },
    { id: "seed-jensen", fullName: "Austin Jensen", status: "vacation", permanentRating: "1A/E", lastPosition: "1A/E", billetCode: "11" },
    { id: "seed-brown", fullName: "Sabrina Brown", status: "current", permanentRating: "2A/E", lastPosition: "1A/E", billetCode: "11" },
  ];

  it("Flynn covering Huffman is trip relief", () => {
    const hit = coveringTripRelief({ joiningCrewId: "seed-flynn-thomas", billetCode: "15", slots, people });
    assert.equal(hit?.relieving, "Richard Huffman");
  });

  it("Yahia covering Kenya Scott is trip relief", () => {
    const hit = coveringTripRelief({ joiningCrewId: "seed-yahia", billetCode: "21", slots, people });
    assert.equal(hit?.relieving, "Kenya Scott");
  });

  it("Huffman returning to his own seat is not relief", () => {
    assert.equal(coveringTripRelief({ joiningCrewId: "seed-huffman", billetCode: "15", slots, people }), null);
  });

  it("C/M rotation pair is permanent, not relief", () => {
    assert.equal(coveringTripRelief({ joiningCrewId: "seed-new-mate", billetCode: "01", slots, people }), null);
  });

  it("rate-up covering C/E or 1AE is not trip relief", () => {
    assert.equal(coveringTripRelief({ joiningCrewId: "seed-other", billetCode: "10", slots, people }), null);
    assert.equal(coveringTripRelief({ joiningCrewId: "seed-other", billetCode: "11", slots, people }), null);
  });
});

describe("permanent return date is the person aboard that job", () => {
  const partners = [
    { sailingBillet: "01", holder: { id: "seed-rosca", status: "current", fullName: "Sorin Rosca", dueOff: "2026-10-26" } },
    { sailingBillet: "01", holder: { id: "seed-shahbin", status: "vacation", fullName: "Rafik Shahbin", dueOff: null } },
    { sailingBillet: "15", holder: { id: "seed-huffman", status: "vacation", fullName: "Richard Huffman", dueOff: null } },
    { sailingBillet: "21", holder: { id: "seed-kenya-scott", status: "vacation", fullName: "Kenya Scott", dueOff: null } },
  ];
  const sailors = [
    { id: "seed-rosca", fullName: "Sorin Rosca", status: "current", billetCode: "01", lastDueOff: "2026-10-26" },
    { id: "seed-flynn-thomas", fullName: "Thomas Flynn", status: "current", billetCode: "15", lastDueOff: "2026-11-02" },
    { id: "seed-yahia", fullName: "Khaled Yahia", status: "current", billetCode: "21", lastDueOff: "2026-10-19" },
  ];

  it("Rafik returns when Sorin is due off", () => {
    const hit = rotationReturn({
      sailingBillet: "01",
      holder: partners[1].holder,
      partners,
      sailors,
    });
    assert.equal(hit.returnOn, "2026-10-26");
    assert.equal(hit.returnFrom, "Sorin Rosca");
  });

  it("Huffman returns when Flynn covering him is due off", () => {
    const hit = rotationReturn({
      sailingBillet: "15",
      holder: partners[2].holder,
      partners,
      sailors,
    });
    assert.equal(hit.returnOn, "2026-11-02");
    assert.equal(hit.returnFrom, "Thomas Flynn");
  });

  it("Kenya returns when Yahia covering her is due off", () => {
    const hit = rotationReturn({
      sailingBillet: "21",
      holder: partners[3].holder,
      partners,
      sailors,
    });
    assert.equal(hit.returnOn, "2026-10-19");
    assert.equal(hit.returnFrom, "Khaled Yahia");
  });

  it("the permanent aboard has no return date", () => {
    const hit = rotationReturn({
      sailingBillet: "01",
      holder: partners[0].holder,
      partners,
      sailors,
    });
    assert.equal(hit.returnOn, null);
  });
});
