import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it, mock } from "node:test";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { classifySeat } from "./cyber.ts";
import { fillCyberCertificate, fillCyberCertificates, fillCyberRoster, fillPersonCyberPack } from "./fill-cyber.ts";

mock.method(globalThis, "fetch", async (input: RequestInfo | URL) => {
  const url = String(input);
  const rel = url.replace(/^https?:\/\/[^/]+/, "").replace(/^\//, "");
  const path = rel.startsWith("templates/") ? `/workspace/public/${rel}` : `/workspace/${rel}`;
  const buf = readFileSync(path);
  return new Response(buf, { status: 200 });
});

const session = {
  date: "2026-09-10",
  durationMin: 15,
  facilitatorName: "Sorin Rosca, Chief Mate",
  facilitatorOrg: "M/V GEORGE II",
};

async function pageText(bytes: Uint8Array, pageNo = 1) {
  const doc = await getDocument({ data: Uint8Array.from(bytes), verbosity: 0 }).promise;
  const page = await doc.getPage(pageNo);
  const content = await page.getTextContent();
  return content.items
    .filter((it): it is typeof it & { str: string } => "str" in it && Boolean(it.str.trim()))
    .map((it) => it.str)
    .join(" ");
}

describe("USCG cyber certificates", () => {
  it("awareness cert names the mariner, cites 101.650, leaves the signature line empty", async () => {
    const seat = classifySeat({
      id: "seed-kluck",
      fullName: "Christopher Eric Kluck",
      lastName: "Kluck",
      lastPosition: "MASTER",
    });
    const bytes = await fillCyberCertificate("awareness", seat, session);
    const text = await pageText(bytes);
    assert.match(text, /Christopher Eric Kluck/);
    assert.match(text, /101\.650\(d\)\(1\)/);
    assert.match(text, /Awareness/i);
    assert.match(text, /09\/10\/2026/);
    assert.match(text, /15/);
    assert.match(text, /Sorin Rosca/);
    assert.match(text, /GEORGE II/);
    assert.doesNotMatch(text, /Rafik Shahbin/);
    assert.match(text, /signatures left blank/i);
  });

  it("OT and key packs use the right CFR paragraphs", async () => {
    const ot = classifySeat({ id: "2m", fullName: "Mark Garcia", lastPosition: "2/M" });
    const key = classifySeat({ id: "cm", fullName: "Sorin Rosca", lastPosition: "C/M" });
    const otText = await pageText(await fillCyberCertificate("ot", ot, session));
    const keyText = await pageText(await fillCyberCertificate("key", key, session));
    assert.match(otText, /101\.650\(d\)\(1\)\(v\)/);
    assert.match(otText, /Operational Technology/i);
    assert.match(keyText, /101\.650\(d\)\(2\)/);
    assert.match(keyText, /Key Personnel/i);
    assert.match(keyText, /Approved by/);
  });

  it("merged certs and a roster list everyone who needs the module", async () => {
    const seats = [
      classifySeat({ id: "1", fullName: "Christopher Kluck", lastPosition: "MASTER" }),
      classifySeat({ id: "2", fullName: "Thomas Flynn", lastPosition: "ELECTRICIAN" }),
    ];
    const certs = await fillCyberCertificates("key", seats, session);
    const doc = await getDocument({ data: Uint8Array.from(certs), verbosity: 0 }).promise;
    assert.equal(doc.numPages, 2);
    const roster = await pageText(await fillCyberRoster("key", seats, session));
    assert.match(roster, /Kluck/);
    assert.match(roster, /Flynn/);
    assert.match(roster, /Attendance/);
  });

  it("person pack is one page per required module, steward gets awareness only", async () => {
    const steward = classifySeat({ id: "s", fullName: "John Huyett", lastPosition: "STEWARD" });
    const master = classifySeat({ id: "m", fullName: "Christopher Kluck", lastPosition: "MASTER" });
    const sDoc = await getDocument({ data: Uint8Array.from(await fillPersonCyberPack(steward, session)), verbosity: 0 }).promise;
    const mDoc = await getDocument({ data: Uint8Array.from(await fillPersonCyberPack(master, session)), verbosity: 0 }).promise;
    assert.equal(sDoc.numPages, 1);
    assert.equal(mDoc.numPages, 3);
  });
});
