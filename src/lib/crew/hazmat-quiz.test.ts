import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  HAZMAT_PASS,
  HAZMAT_QUESTIONS,
  classifyHazmatCrew,
  classifyHazmatSeat,
  parseHazmatScore,
  passedHazmat,
  requiredHazmatSeats,
} from "./hazmat-quiz.ts";
import { needsSmsHazmat } from "./sms-training.ts";

describe("HAZMAT who-needs-what · SMM-PER-06 Table 4.5", () => {
  it("Master and mates need it; bosun and ABs do not under SMS", () => {
    assert.equal(needsSmsHazmat("MASTER"), true);
    assert.equal(needsSmsHazmat("C/M"), true);
    assert.equal(needsSmsHazmat("2/M"), true);
    assert.equal(needsSmsHazmat("3/M"), true);
    assert.equal(needsSmsHazmat("BOSUN"), false);
    assert.equal(needsSmsHazmat("BOATSWAIN"), false);
    assert.equal(needsSmsHazmat("AB"), false);
    assert.equal(needsSmsHazmat("AB DAY"), false);
    assert.equal(needsSmsHazmat("AB/W"), false);
    assert.equal(needsSmsHazmat("OS"), false);
    assert.equal(needsSmsHazmat("C/E"), false);
    assert.equal(needsSmsHazmat("STEWARD"), false);
  });

  it("classifies current articles: four required seats", () => {
    const seats = classifyHazmatCrew([
      { id: "m", fullName: "Kluck", lastPosition: "MASTER", status: "current" },
      { id: "cm", fullName: "Rosca", lastPosition: "C/M", status: "current" },
      { id: "b", fullName: "Gonzalez", lastPosition: "BOSUN", status: "current" },
      { id: "ab", fullName: "Garcia", lastPosition: "AB DAY", status: "current" },
      { id: "past", fullName: "Old", lastPosition: "2/M", status: "past" },
    ]);
    assert.equal(requiredHazmatSeats(seats).length, 2);
    assert.equal(seats.find((s) => s.crewId === "b")?.required, false);
    assert.equal(seats.find((s) => s.crewId === "past"), undefined);
  });

  it("quiz has 20 unique questions, unique answers keyed A–D, pass at 16", () => {
    assert.equal(HAZMAT_QUESTIONS.length, 20);
    const prompts = new Set(HAZMAT_QUESTIONS.map((q) => q.prompt));
    assert.equal(prompts.size, 20);
    for (const q of HAZMAT_QUESTIONS) {
      assert.equal(q.choices.length, 4);
      assert.ok(q.choices.some((c) => c.key === q.answer));
    }
    assert.equal(passedHazmat(15), false);
    assert.equal(passedHazmat(16), true);
    assert.equal(passedHazmat(20), true);
    assert.equal(passedHazmat(-1), false);
    assert.ok(HAZMAT_QUESTIONS.some((q) => q.element === "security"));
    assert.ok(HAZMAT_QUESTIONS.some((q) => /172\.704/.test(q.prompt)));
  });

  it("seat label for chief mate", () => {
    const s = classifyHazmatSeat({ id: "1", fullName: "Sorin Rosca", lastPosition: "C/M" });
    assert.equal(s.positionLabel, "Chief Mate");
    assert.equal(s.required, true);
  });

  it("parses quiz scores from notes and certificate numbers", () => {
    assert.equal(parseHazmatScore("Quiz 18/20 pass · trained and tested"), 18);
    assert.equal(parseHazmatScore("18/20"), 18);
    assert.equal(parseHazmatScore("16 / 20"), 16);
    assert.equal(parseHazmatScore(null), null);
    assert.equal(parseHazmatScore("expired"), null);
    assert.equal(parseHazmatScore("21/20"), null);
  });
});
