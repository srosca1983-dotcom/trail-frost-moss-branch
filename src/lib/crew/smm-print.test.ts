import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { expiredPrintableSmm, fillExpiredSmmPack, personForSmmPrint } from "./smm-print.ts";

const TEMPLATE = readFileSync("/workspace/public/templates/sro-sign-on-packet.pdf");
const BUF = TEMPLATE.buffer.slice(TEMPLATE.byteOffset, TEMPLATE.byteOffset + TEMPLATE.byteLength);

describe("expired SMM print pack", () => {
  it("only lists expired printable SMM tickets, not SASH or MMC", () => {
    const kinds = expiredPrintableSmm([
      { docType: "fam", expiresOn: "2023-06-28" },
      { docType: "sash", expiresOn: "2023-01-01" },
      { docType: "mmc", expiresOn: "2020-01-01" },
      { docType: "cyber", expiresOn: "2027-01-01" },
      { docType: "internet", expiresOn: "2025-01-01" },
    ]);
    assert.deepEqual(kinds, ["fam", "internet"]);
  });

  it("fills familiarization with the mariner name, date, and officer initials", async () => {
    const person = personForSmmPrint({ fullName: "Luis Navarrete", position: "C/E" });
    const bytes = await fillExpiredSmmPack(
      {
        jobs: [{ person, kinds: ["fam"], department: "engine" }],
        date: "2026-09-11",
        officerInitials: "sr",
        officerName: "Sorin Rosca",
      },
      BUF,
    );
    const doc = await getDocument({ data: Uint8Array.from(bytes), verbosity: 0 }).promise;
    assert.equal(doc.numPages, 2);
    const page = await doc.getPage(1);
    const content = await page.getTextContent();
    const text = content.items.map((it) => ("str" in it ? String(it.str) : "")).join(" ");
    assert.match(text, /Navarrete/);
    assert.match(text, /SR/);
    assert.match(text, /09\/11\/26/);
    const page2 = await doc.getPage(2);
    const content2 = await page2.getTextContent();
    const items2 = content2.items.filter((it): it is { str: string; transform: number[] } => "str" in it && Boolean(it.str.trim()));
    const officer = items2.find((i) => i.str.includes("Sorin Rosca"));
    assert.ok(officer, "officer name on familiarization page 2");
    assert.ok(officer!.transform[4] >= 280, `officer name x=${officer!.transform[4]} belongs on the right (officer) line`);
    assert.ok(officer!.transform[5] >= 64 && officer!.transform[5] <= 80, `officer name y=${officer!.transform[5]} on the signature line`);
    const crewSig = items2.find((i) => i.str.includes("Sorin") && i.transform[4] < 250);
    assert.equal(crewSig, undefined, "officer name must not sit on crewmember signature");
  });

  it("puts the officer on the cyber Trainer line, not Crew Member", async () => {
    const person = personForSmmPrint({ fullName: "Luis Navarrete", position: "C/E" });
    const bytes = await fillExpiredSmmPack(
      {
        jobs: [{ person, kinds: ["cyber", "internet"], department: "engine" }],
        date: "2026-09-11",
        officerInitials: "sr",
        officerName: "Sorin Rosca",
      },
      BUF,
    );
    const doc = await getDocument({ data: Uint8Array.from(bytes), verbosity: 0 }).promise;
    const cyber = await doc.getPage(1);
    const cItems = (await cyber.getTextContent()).items.filter(
      (it): it is { str: string; transform: number[] } => "str" in it && Boolean(it.str.trim()),
    );
    const trainer = cItems.find((i) => i.str.includes("Sorin Rosca"));
    assert.ok(trainer, "trainer named");
    assert.ok(trainer!.transform[5] < 430 && trainer!.transform[5] > 395, `trainer y=${trainer!.transform[5]}`);
    const crewLine = cItems.find((i) => i.str.includes("Sorin") && i.transform[5] > 430 && i.transform[5] < 470);
    assert.equal(crewLine, undefined, "officer is not the crew member");
    const net = await doc.getPage(4);
    const nItems = (await net.getTextContent()).items.filter(
      (it): it is { str: string; transform: number[] } => "str" in it && Boolean(it.str.trim()),
    );
    const header = nItems.find((i) => i.str.includes("Navarrete") && i.transform[5] > 590);
    assert.ok(header, "mariner name at top of internet ack");
    const master = nItems.find((i) => i.str.includes("Sorin") && i.transform[5] < 520);
    assert.equal(master, undefined, "do not put the officer on Crew Member or invent a master signature");
  });
});
