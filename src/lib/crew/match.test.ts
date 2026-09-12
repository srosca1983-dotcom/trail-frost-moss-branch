import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { bestMatch, scoreMatch } from "./match.ts";
import { emptyPerson } from "./merge.ts";
import { fillNameParts } from "./parse-fields.ts";
import type { CrewPerson } from "./types.ts";

function crew(partial: Partial<CrewPerson>): CrewPerson {
  return {
    id: "c1",
    fullName: "Sorin Rosca",
    firstName: "Sorin",
    lastName: "Rosca",
    middleName: null,
    ssLast4: null,
    dob: null,
    sex: null,
    placeOfBirth: null,
    citizenship: null,
    race: null,
    hairColor: null,
    eyeColor: null,
    height: null,
    weight: null,
    addressLine: null,
    city: null,
    state: null,
    zip: null,
    homePhone: null,
    cellPhone: null,
    email: null,
    nearestAirport: null,
    airportCode: null,
    maritimeCollege: null,
    yearGraduated: null,
    combatVeteran: false,
    maritalStatus: null,
    mmcNumber: null,
    mmcPlaceOfIssue: null,
    mmcExpiration: null,
    passportNumber: null,
    passportExpiration: null,
    status: "applicant",
    lastPosition: null,
    lastVessel: null,
    glasses: false,
    spareGlasses: false,
    allergies: null,
    medications: null,
    medicalRemarks: null,
    notes: null,
    unionHall: null,
    assignmentType: null,
    seniorityClass: null,
    watch: null,
    billetCode: null,
    permanentRating: null,
    createdAt: "",
    updatedAt: "",
    ...partial,
  };
}

describe("scoreMatch names", () => {
  it("matches a last-name-only ticket to the file we just opened", () => {
    const parsed = fillNameParts({ ...emptyPerson(), fullName: "Rosca", lastName: "Rosca" });
    const hit = scoreMatch(parsed, crew({ firstName: null, fullName: "Rosca" }), []);
    assert.ok(hit);
    assert.ok(hit?.reasons.includes("name"));
  });

  it("matches Sorin Rosca to Rosca, Sorin", () => {
    const parsed = fillNameParts({ ...emptyPerson(), fullName: "Sorin Rosca" });
    const hit = scoreMatch(parsed, crew({ fullName: "Rosca, Sorin", firstName: "Sorin", lastName: "Rosca" }), []);
    assert.ok(hit);
  });

  it("does not match Oscar Cesena from the first name Oscar alone", () => {
    const parsed = fillNameParts({ ...emptyPerson(), fullName: "Oscar", firstName: "Oscar" });
    const hit = scoreMatch(
      parsed,
      crew({ id: "seed-cesena", fullName: "Oscar D. Cesena", firstName: "Oscar", lastName: "Cesena" }),
      [],
    );
    assert.equal(hit, null);
  });

  it("matches Oscar Cesena to Oscar D. Cesena", () => {
    const parsed = fillNameParts({ ...emptyPerson(), fullName: "Oscar Cesena", firstName: "Oscar", lastName: "Cesena" });
    const hit = scoreMatch(
      parsed,
      crew({ id: "seed-cesena", fullName: "Oscar D. Cesena", firstName: "Oscar", lastName: "Cesena" }),
      [],
    );
    assert.ok(hit);
    assert.ok(hit?.reasons.includes("name"));
  });

  it("does not file Jaquaz Jenkins onto a different Jenkins", () => {
    const parsed = fillNameParts({
      ...emptyPerson(),
      fullName: "Jaquaz Jenkins",
      firstName: "Jaquaz",
      lastName: "Jenkins",
    });
    const hit = scoreMatch(
      parsed,
      crew({ fullName: "Robert Jenkins", firstName: "Robert", lastName: "Jenkins" }),
      [],
    );
    assert.equal(hit, null);
  });

  it("matches M. Welsh to an existing Welsh with first name Michael", () => {
    const parsed = fillNameParts({ ...emptyPerson(), firstName: "M", lastName: "Welsh", fullName: "M Welsh" });
    const hit = scoreMatch(
      parsed,
      crew({ fullName: "Michael Welsh", firstName: "Michael", lastName: "Welsh" }),
      [],
    );
    assert.ok(hit);
  });

  it("matches Ray Tesson to permanent C/E Raymond Tesson", () => {
    const parsed = fillNameParts({ ...emptyPerson(), firstName: "Ray", lastName: "Tesson", fullName: "Ray Tesson" });
    const hit = scoreMatch(
      parsed,
      crew({
        id: "seed-tesson",
        fullName: "Raymond Edward Tesson",
        firstName: "Raymond",
        lastName: "Tesson",
        status: "vacation",
        lastPosition: "C/E",
        permanentRating: "C/E",
      }),
      [],
    );
    assert.ok(hit);
    assert.equal(hit?.crewId, "seed-tesson");
  });

  it("matches a last-name-only Kluck scan to Christopher Kluck", () => {
    const parsed = fillNameParts({ ...emptyPerson(), lastName: "Kluck", fullName: "Kluck" });
    const hit = scoreMatch(
      parsed,
      crew({
        id: "seed-kluck",
        fullName: "Christopher Eric Kluck",
        firstName: "Christopher",
        lastName: "Kluck",
        status: "current",
        lastPosition: "MASTER",
      }),
      [],
    );
    assert.ok(hit);
    assert.equal(hit?.crewId, "seed-kluck");
  });

  it("matches Gabriel Guardiola to Guardiola-Berrios Jr on articles", () => {
    const parsed = fillNameParts({
      ...emptyPerson(),
      firstName: "Gabriel",
      lastName: "Guardiola",
      fullName: "Gabriel Guardiola",
    });
    const hit = scoreMatch(
      parsed,
      crew({
        id: "seed-guardiola",
        fullName: "Gabriel Guardiola-Berrios Jr.",
        firstName: "Gabriel",
        lastName: "Guardiola-Berrios",
        status: "current",
        lastPosition: "AB DAY",
      }),
      [],
    );
    assert.ok(hit);
    assert.equal(hit?.crewId, "seed-guardiola");
  });

  it("prefers the permanent file over a Ray Tesson applicant", () => {
    const parsed = fillNameParts({ ...emptyPerson(), firstName: "Ray", lastName: "Tesson", fullName: "Ray Tesson" });
    const hit = bestMatch(
      parsed,
      [
        crew({ id: "dup-ray", fullName: "Ray Tesson", firstName: "Ray", lastName: "Tesson", status: "applicant" }),
        crew({
          id: "seed-tesson",
          fullName: "Raymond Edward Tesson",
          firstName: "Raymond",
          lastName: "Tesson",
          status: "vacation",
        }),
      ],
      new Map(),
    );
    assert.equal(hit?.crewId, "seed-tesson");
  });

  it("matches Sunjay Gupta filename to Sanjay Gupta on articles", () => {
    const people = [
      crew({ id: "seed-gupta", fullName: "Sanjay Gupta", firstName: "Sanjay", lastName: "Gupta", status: "vacation" }),
    ];
    const hit = bestMatch(
      { ...emptyPerson(), firstName: "Sunjay", lastName: "Gupta", fullName: "Sunjay Gupta" },
      people,
      new Map(),
    );
    assert.equal(hit?.crewId, "seed-gupta");
  });

  it("does not file Alex Baird onto Jennifer Bono even with a colliding MMC", () => {
    const parsed = fillNameParts({
      ...emptyPerson(),
      firstName: "Alex",
      lastName: "Baird",
      fullName: "Alex Baird",
      mmcNumber: "2565364",
      ssLast4: "9325",
      passportNumber: "680824856",
    });
    const hit = scoreMatch(
      parsed,
      crew({
        id: "seed-bono",
        fullName: "Jennifer Marie Bono",
        firstName: "Jennifer",
        lastName: "Bono",
        mmcNumber: "2565364",
        ssLast4: "9325",
        passportNumber: "680824856",
        status: "past",
      }),
      [],
    );
    assert.equal(hit, null);
  });

  it("does not match Baird to Bono by name", () => {
    const parsed = fillNameParts({
      ...emptyPerson(),
      firstName: "Alex",
      lastName: "Baird",
      fullName: "Alex Baird",
    });
    const hit = scoreMatch(
      parsed,
      crew({
        id: "seed-bono",
        fullName: "Jennifer Marie Bono",
        firstName: "Jennifer",
        lastName: "Bono",
      }),
      [],
    );
    assert.equal(hit, null);
  });
});
