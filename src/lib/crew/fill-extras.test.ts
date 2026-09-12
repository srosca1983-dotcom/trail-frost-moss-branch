import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it, mock } from "node:test";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { extraFilename, fillExtraForm } from "./fill-extras.ts";
import { emptyPerson } from "./merge.ts";

mock.method(globalThis, "fetch", async (input: RequestInfo | URL) => {
  const url = String(input);
  const rel = url.replace(/^https?:\/\/[^/]+/, "").replace(/^\//, "");
  const path = rel.startsWith("templates/") ? `/workspace/public/${rel}` : `/workspace/${rel}`;
  const buf = readFileSync(path);
  return new Response(buf, { status: 200 });
});

function samplePerson() {
  const p = emptyPerson();
  p.fullName = "Christopher Eric Kluck";
  p.firstName = "Christopher";
  p.middleName = "Eric";
  p.lastName = "Kluck";
  p.ssLast4 = "4112";
  p.dob = "1964-12-17";
  p.sex = "M";
  p.cellPhone = "360-643-1622";
  p.lastPosition = "MASTER";
  p.mmcNumber = "501128";
  p.addressLine = "P.O. Box 1771";
  p.city = "Port Townsend";
  p.state = "WA";
  p.zip = "98368";
  p.maritalStatus = "Married";
  return p;
}

async function pageText(bytes: Uint8Array, pageNo = 1) {
  const doc = await getDocument({ data: Uint8Array.from(bytes), verbosity: 0 }).promise;
  const page = await doc.getPage(pageNo);
  const content = await page.getTextContent();
  return content.items
    .filter((it): it is typeof it & { str: string } => "str" in it && Boolean(it.str.trim()))
    .map((it) => it.str)
    .join(" ");
}

describe("union extras, door tag, HAZMAT cert", () => {
  it("HAZMAT certificate names the mariner, cites 49 CFR, and is valid 3 years", async () => {
    const bytes = await fillExtraForm("hazmat-cert", {
      person: samplePerson(),
      startDate: "2026-09-10",
      instructorName: "Sorin Rosca, Chief Mate",
    });
    const text = await pageText(bytes);
    assert.match(text, /Christopher Eric Kluck/);
    assert.match(text, /49 CFR/);
    assert.match(text, /625873/);
    assert.match(text, /10 September 2029/);
    assert.match(text, /Sorin Rosca/);
    assert.match(text, /MASTER/i);
    assert.match(text, /501128/);
  });

  it("door tag prints rank and name", async () => {
    const bytes = await fillExtraForm("door-tag", {
      person: samplePerson(),
      startDate: "2026-09-10",
    });
    const text = await pageText(bytes);
    assert.match(text, /Captain/);
    assert.match(text, /Kluck/);
  });

  it("door tag uses the cabin-tag rank for the joining billet", async () => {
    const p = samplePerson();
    p.fullName = "Mark Garcia";
    p.lastName = "Garcia";
    p.firstName = "Mark";
    p.lastPosition = "AB/W";
    p.tour = {
      vessel: "M/V GEORGE II",
      position: "AB/W",
      signOn: "2026-08-18",
      signOff: null,
      port: null,
      relieving: null,
      assignmentType: "ROTARY",
      lengthDays: null,
      dispatchRef: null,
      unionHall: "SIU",
      watch: "4-8",
      billetCode: "08",
      seniorityClass: null,
      dueOff: null,
    };
    const text = await pageText(await fillExtraForm("door-tag", { person: p, startDate: "2026-09-11" }));
    assert.match(text, /AB watch 4 x 8/);
    assert.match(text, /Garcia/);
  });

  it("MM&P opt-out prints the name; enrollment last-4 only", async () => {
    const opt = await fillExtraForm("mmp-401k-optout", {
      person: samplePerson(),
      startDate: "2026-09-10",
    });
    assert.match(await pageText(opt), /Christopher Eric Kluck/);

    const enroll = await fillExtraForm("mmp-401k-enroll", {
      person: samplePerson(),
      startDate: "2026-09-10",
      returning: true,
      port: "Honolulu",
    });
    const text = await pageText(enroll);
    assert.match(text, /Kluck/);
    assert.match(text, /4112/);
    assert.doesNotMatch(text, /xxx-xx-4112/);
    assert.match(text, /Sunrise Operations/);
    assert.match(text, /GEORGE II/);
  });

  it("names extras with the mariner and date", () => {
    const name = extraFilename("hazmat-cert", samplePerson(), "2026-09-10");
    assert.match(name, /HAZMAT-certificate-Kluck-2026-09-10\.pdf/);
  });
});
