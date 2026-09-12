import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import {
  fillHazmatAnswerKey,
  fillHazmatCertificate,
  fillHazmatPersonPack,
  fillHazmatQuiz,
  fillHazmatStudy,
} from "./fill-hazmat.ts";
import { classifyHazmatSeat } from "./hazmat-quiz.ts";

const session = { date: "2026-09-10", instructorName: "Sorin Rosca, Chief Mate" };

async function pageText(bytes: Uint8Array, pageNo = 1) {
  const doc = await getDocument({ data: Uint8Array.from(bytes), verbosity: 0 }).promise;
  const page = await doc.getPage(pageNo);
  const content = await page.getTextContent();
  return content.items
    .filter((it): it is typeof it & { str: string } => "str" in it && Boolean(it.str.trim()))
    .map((it) => it.str)
    .join(" ");
}

const kluck = classifyHazmatSeat({
  id: "seed-kluck",
  fullName: "Christopher Eric Kluck",
  lastName: "Kluck",
  lastPosition: "MASTER",
  mmcNumber: "501128",
});

describe("HAZMAT papers", () => {
  it("quiz names the mate and does not leak answers", async () => {
    const bytes = await fillHazmatQuiz(kluck, session);
    const text = await pageText(bytes);
    assert.match(text, /Christopher Eric Kluck/);
    assert.match(text, /20 questions/i);
    assert.match(text, /16/);
    assert.match(text, /do not copy the answer key/i);
    assert.doesNotMatch(text, /Chief Mate only/i);
    assert.doesNotMatch(text, /1\.\s+B\s+—/);
  });

  it("study sheet is self-contained and cites 172.704", async () => {
    const text = await pageText(await fillHazmatStudy(kluck, session));
    assert.match(text, /172\.704/);
    assert.match(text, /three years|3 years/i);
    assert.match(text, /Bosun/i);
  });

  it("answer key lists letters and is marked Chief Mate only", async () => {
    const text = await pageText(await fillHazmatAnswerKey(session));
    assert.match(text, /Chief Mate only/i);
    assert.match(text, /\bB\b/);
    assert.match(text, /Flammable liquids/i);
  });

  it("certificate records the test score, 3-year validity, trainer address, trained and tested", async () => {
    const text = await pageText(await fillHazmatCertificate(kluck, session, 18));
    assert.match(text, /Christopher Eric Kluck/);
    assert.match(text, /18 of 20/);
    assert.match(text, /trained and tested/i);
    assert.match(text, /172\.704/);
    assert.match(text, /176\.13/);
    assert.match(text, /09\/10\/2029|10 September 2029|2029/);
    assert.match(text, /Sorin Rosca/);
    assert.match(text, /Sunrise Operations/);
    assert.match(text, /Charlotte/);
    assert.match(text, /signatures left blank|signature left blank/i);
    assert.match(text, /501128/);
  });

  it("person pack includes study then quiz", async () => {
    const bytes = await fillHazmatPersonPack(kluck, session);
    const doc = await getDocument({ data: Uint8Array.from(bytes), verbosity: 0 }).promise;
    assert.ok(doc.numPages >= 2);
    const p1 = await pageText(bytes, 1);
    assert.match(p1, /study sheet/i);
  });
});
