import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { fillSignOnPacket } from "./fill-packet.ts";
import { emptyPerson } from "./merge.ts";

const TEMPLATE = readFileSync("/workspace/public/templates/sro-sign-on-packet.pdf");

function samplePerson() {
  const p = emptyPerson();
  p.fullName = "Christopher Eric Kluck";
  p.firstName = "Christopher";
  p.middleName = "Eric";
  p.lastName = "Kluck";
  p.ssLast4 = "4112";
  p.dob = "1964-12-17";
  p.sex = "M";
  p.citizenship = "USA";
  p.addressLine = "P.O. Box 1771";
  p.city = "Port Townsend";
  p.state = "WA";
  p.zip = "98368";
  p.cellPhone = "360-643-1622";
  p.email = "chris.kluck@gmail.com";
  p.maritalStatus = "Married";
  p.mmcNumber = "501128";
  p.passportNumber = "505519190";
  p.passportExpiration = "2028-01-04";
  p.lastPosition = "MASTER";
  p.documents = [
    { docType: "mmc", label: "MMC", docNumber: "501128", issuedOn: null, expiresOn: "2027-07-30", notes: null },
    { docType: "passport", label: "US Passport", docNumber: "505519190", issuedOn: null, expiresOn: "2028-01-04", notes: null },
    { docType: "twic", label: "TWIC", docNumber: null, issuedOn: null, expiresOn: "2028-03-01", notes: null },
    { docType: "medical", label: "STCW Medical", docNumber: null, issuedOn: null, expiresOn: "2027-06-01", notes: null },
  ];
  p.nextOfKin = {
    fullName: "Erin Kluck",
    relationship: "Wife",
    addressLine: null,
    city: null,
    state: null,
    zip: null,
    phone: null,
    cellPhone: "206-495-1389",
  };
  return p;
}

async function itemsOn(bytes: Uint8Array, pageNo: number) {
  const doc = await getDocument({ data: Uint8Array.from(bytes), verbosity: 0 }).promise;
  const page = await doc.getPage(pageNo);
  const content = await page.getTextContent();
  return content.items
    .filter((it): it is typeof it & { str: string; transform: number[] } => "str" in it && Boolean(it.str.trim()))
    .map((it) => ({ str: it.str, x: it.transform[4], y: it.transform[5] }));
}

describe("fillSignOnPacket boxes", () => {
  it("puts W-4 names above the First name caption, not in Step 1 body", async () => {
    const bytes = await fillSignOnPacket(
      { person: samplePerson(), startDate: "2026-09-10", officerInitials: "SR", department: "deck" },
      TEMPLATE.buffer.slice(TEMPLATE.byteOffset, TEMPLATE.byteOffset + TEMPLATE.byteLength),
    );
    const items = await itemsOn(bytes, 8);
    const first = items.find((i) => i.str.includes("Christopher"));
    const last = items.find((i) => i.str === "Kluck");
    const caption = items.find((i) => i.str.includes("First name and middle initial"));
    assert.ok(first, "first name written");
    assert.ok(last, "last name written");
    assert.ok(caption);
    assert.ok(first!.y >= 712, `first name y=${first!.y} should sit in the name box above the caption`);
    assert.ok(last!.y >= 712, `last name y=${last!.y}`);
    assert.ok(first!.y > caption!.y - 2);
  });

  it("puts PER-003 header values after the labels, not on top of them", async () => {
    const bytes = await fillSignOnPacket(
      { person: samplePerson(), startDate: "2026-09-10", officerInitials: "SR", department: "deck" },
      TEMPLATE.buffer.slice(TEMPLATE.byteOffset, TEMPLATE.byteOffset + TEMPLATE.byteLength),
    );
    const items = await itemsOn(bytes, 2);
    const posLabel = items.find((i) => i.str.includes("Position"));
    const master = items.filter((i) => i.str === "MASTER");
    assert.ok(posLabel);
    const headerMaster = master.find((i) => Math.abs(i.y - (posLabel?.y ?? 0)) < 4);
    assert.ok(headerMaster, "position written on the header line");
    assert.ok(headerMaster!.x > posLabel!.x + 40, `MASTER x=${headerMaster!.x} should be after Position:`);
  });

  it("puts medical NAME after the label", async () => {
    const bytes = await fillSignOnPacket(
      { person: samplePerson(), startDate: "2026-09-10", officerInitials: "SR", department: "deck" },
      TEMPLATE.buffer.slice(TEMPLATE.byteOffset, TEMPLATE.byteOffset + TEMPLATE.byteLength),
    );
    const items = await itemsOn(bytes, 6);
    const label = items.find((i) => i.str === "NAME:");
    const name = items.find((i) => i.str.includes("Christopher"));
    assert.ok(label);
    assert.ok(name);
    assert.ok(Math.abs(name!.y - label!.y) < 6, `name y=${name!.y} label y=${label!.y}`);
    assert.ok(name!.x > label!.x + 20, `name x=${name!.x} should be after NAME:`);
  });

  it("include extracts only the requested pages and still writes the name", async () => {
    const bytes = await fillSignOnPacket(
      {
        person: samplePerson(),
        startDate: "2026-09-10",
        officerInitials: "SR",
        department: "deck",
        include: ["medical", "fam"],
      },
      TEMPLATE.buffer.slice(TEMPLATE.byteOffset, TEMPLATE.byteOffset + TEMPLATE.byteLength),
    );
    const doc = await getDocument({ data: Uint8Array.from(bytes), verbosity: 0 }).promise;
    assert.equal(doc.numPages, 3);
    const items = await itemsOn(bytes, 1);
    assert.ok(items.find((i) => i.str.includes("Christopher")), "medical page still named");
  });

  it("inks I-9 phone, SSN last-4, List A passport, and employment date", async () => {
    const bytes = await fillSignOnPacket(
      {
        person: samplePerson(),
        startDate: "2026-09-10",
        officerInitials: "SR",
        officerName: "Sorin Rosca, Chief Mate",
        department: "deck",
      },
      TEMPLATE.buffer.slice(TEMPLATE.byteOffset, TEMPLATE.byteOffset + TEMPLATE.byteLength),
    );
    const items = await itemsOn(bytes, 10);
    const blob = items.map((i) => i.str).join(" ");
    assert.match(blob, /360-643-1622/);
    assert.match(blob, /4112/);
    assert.match(blob, /US Passport/);
    assert.match(blob, /505519190/);
    assert.match(blob, /01\/04\/2028/);
    assert.match(blob, /09\/10\/2026/);
    assert.match(blob, /Sunrise Operations/);
    assert.match(blob, /Sorin Rosca/);
    const citizenX = items.find((i) => i.str === "X" && Math.abs(i.y - 523.3) < 6);
    assert.ok(citizenX, "citizenship box marked");
    assert.ok(citizenX!.x >= 180 && citizenX!.x <= 192, `citizenship X x=${citizenX!.x} should sit in CB_1`);
  });

  it("marks HAZMAT quiz answers from the printed key", async () => {
    const bytes = await fillSignOnPacket(
      { person: samplePerson(), startDate: "2026-09-10", officerInitials: "SR", department: "deck" },
      TEMPLATE.buffer.slice(TEMPLATE.byteOffset, TEMPLATE.byteOffset + TEMPLATE.byteLength),
    );
    const items = await itemsOn(bytes, 13);
    const xs = items.filter((i) => i.str === "X");
    assert.ok(xs.length >= 10, `expected 10 answer marks, got ${xs.length}`);
    const q1True = items.find((i) => i.str === "True" && Math.abs(i.y - 641.3) < 4);
    assert.ok(q1True, "Q1 True label");
    assert.ok(
      xs.some((x) => Math.abs(x.y - (q1True?.y ?? 0)) < 6 && x.x < (q1True?.x ?? 0)),
      "Q1 True is marked",
    );
    const q4False = items.find((i) => i.str === "False" && Math.abs(i.y - 570.8) < 4);
    assert.ok(q4False, "Q4 False label");
    assert.ok(
      xs.some((x) => Math.abs(x.y - (q4False?.y ?? 0)) < 6 && Math.abs(x.x - (q4False?.x ?? 0)) < 30),
      "Q4 False is marked",
    );
  });

  it("puts last-4 on the W-4 social security box", async () => {
    const bytes = await fillSignOnPacket(
      { person: samplePerson(), startDate: "2026-09-10", officerInitials: "SR", department: "deck" },
      TEMPLATE.buffer.slice(TEMPLATE.byteOffset, TEMPLATE.byteOffset + TEMPLATE.byteLength),
    );
    const items = await itemsOn(bytes, 8);
    const ssn = items.find((i) => i.str.includes("4112"));
    assert.ok(ssn, "W-4 last-4 written");
    assert.ok(ssn!.x >= 450, `SSN x=${ssn!.x} should sit in the SSN box`);
    assert.ok(ssn!.y >= 700, `SSN y=${ssn!.y}`);
  });

  it("marks W-4 Married filing jointly, and leaves filing status blank when unknown", async () => {
    const marriedBytes = await fillSignOnPacket(
      { person: samplePerson(), startDate: "2026-09-10", officerInitials: "SR", department: "deck" },
      TEMPLATE.buffer.slice(TEMPLATE.byteOffset, TEMPLATE.byteOffset + TEMPLATE.byteLength),
    );
    const married = await itemsOn(marriedBytes, 8);
    const xs = married.filter((i) => i.str === "X");
    const jointly = married.find((i) => i.str.includes("Married filing jointly"));
    const single = married.find((i) => i.str === "Single");
    assert.ok(jointly && single);
    assert.ok(
      xs.some((x) => Math.abs(x.y - (jointly?.y ?? 0)) < 6),
      "married jointly is marked",
    );
    assert.ok(
      !xs.some((x) => Math.abs(x.y - (single?.y ?? 0)) < 4),
      "single is not marked for a married mariner",
    );

    const unknown = samplePerson();
    unknown.maritalStatus = null;
    const blankBytes = await fillSignOnPacket(
      { person: unknown, startDate: "2026-09-10", officerInitials: "SR", department: "deck" },
      TEMPLATE.buffer.slice(TEMPLATE.byteOffset, TEMPLATE.byteOffset + TEMPLATE.byteLength),
    );
    const blank = await itemsOn(blankBytes, 8);
    const blankXs = blank.filter((i) => i.str === "X" && i.y >= 590 && i.y <= 640);
    assert.equal(blankXs.length, 0, "unknown filing status stays blank");
  });

  it("checks passport / MMC / HAZMAT on the cover, not COVID or LNG", async () => {
    const p = samplePerson();
    p.tour = {
      vessel: "M/V GEORGE II",
      position: "MASTER",
      signOn: "2026-09-10",
      signOff: null,
      port: "Honolulu",
      relieving: null,
      assignmentType: "PERMANENT",
      lengthDays: null,
      dispatchRef: "QEE-1",
      unionHall: "MMP",
      watch: "day",
      billetCode: "01",
      seniorityClass: null,
      dueOff: null,
    };
    const bytes = await fillSignOnPacket(
      { person: p, startDate: "2026-09-10", officerInitials: "SR", department: "deck" },
      TEMPLATE.buffer.slice(TEMPLATE.byteOffset, TEMPLATE.byteOffset + TEMPLATE.byteLength),
    );
    const items = await itemsOn(bytes, 1);
    const xs = items.filter((i) => i.str === "X");
    const at = (y: number) => xs.some((x) => Math.abs(x.y - y) < 4);
    assert.ok(at(564.2), "current passport checked");
    assert.ok(at(544.4), "current MMC checked");
    assert.ok(at(524.6), "medical card checked");
    assert.ok(at(505.0), "TWIC checked");
    assert.ok(at(485.2), "dispatch slip checked");
    assert.ok(at(385.4), "familiarization checked");
    assert.ok(at(322.6), "HAZMAT cert checked");
    assert.ok(!at(425.9), "COVID is not auto-checked");
    assert.ok(!at(406.1), "LNG is not auto-checked");
  });

  it("does not put an expired passport on I-9 List A", async () => {
    const p = samplePerson();
    p.passportExpiration = "2025-01-04";
    p.documents = p.documents.map((d) => (d.docType === "passport" ? { ...d, expiresOn: "2025-01-04" } : d));
    const bytes = await fillSignOnPacket(
      { person: p, startDate: "2026-09-10", officerInitials: "SR", department: "deck" },
      TEMPLATE.buffer.slice(TEMPLATE.byteOffset, TEMPLATE.byteOffset + TEMPLATE.byteLength),
    );
    const items = await itemsOn(bytes, 10);
    const blob = items.map((i) => i.str).join(" ");
    assert.doesNotMatch(blob, /US Dept\. of State/);
    assert.doesNotMatch(blob, /505519190/);
    assert.doesNotMatch(blob, /01\/04\/2025/);
  });
});
