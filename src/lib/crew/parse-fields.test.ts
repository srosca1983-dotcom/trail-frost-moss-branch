import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { emptyPerson } from "./merge.ts";
import { overlayParsedFields, parseDrugFreeDate, parseSashIssued, parseSiuClass, nameFromFilename, ticketsFromFilename, looksLikeSash, fillNameParts, usableTicketName, shouldSplitPacket, textLooksTyped, textHasReadableName, pickPacketImagePages, pickPacketTextPages, pageReadScore, extractPersonFromText, packetDate, ticketsLookComplete, fixCredentialDates } from "./parse-fields.ts";

const COOPER_CLEARANCE = `
SEAFARERS INTERNATIONAL UNION
CLEARANCE 86-067
Name: ZAID MALIK COOPER
Book No. 026655
Rating: AB
Vessel: GEORGE II
Reporting: 09/01/2026
Seniority: B
Meets Random Exception Regulations Through: 11/11/2026
`;

describe("parse SIU class and drug-free from hall paper", () => {
  it("reads Seniority: B from an 86-067 clearance", () => {
    assert.equal(parseSiuClass(COOPER_CLEARANCE), "B");
  });

  it("reads Registration Group and Class lines", () => {
    assert.equal(parseSiuClass("Registration Group: A"), "A");
    assert.equal(parseSiuClass("SIU Class C rotary"), "C");
    assert.equal(parseSiuClass("Class: B"), "B");
    assert.equal(parseSiuClass("no class printed"), null);
  });

  it("reads random-exception through-date as ISO", () => {
    assert.equal(parseDrugFreeDate(COOPER_CLEARANCE), "2026-11-11");
    assert.equal(parseDrugFreeDate("Drug-free through 05/01/27"), "2027-05-01");
    assert.equal(parseDrugFreeDate("MMC only, no chemical test"), null);
  });

  it("overlays class and drug-free onto a parsed person that the LLM missed", () => {
    const p = emptyPerson();
    p.fullName = "Zaid Malik Cooper";
    const out = overlayParsedFields(p, COOPER_CLEARANCE);
    assert.equal(out.tour?.seniorityClass, "B");
    assert.equal(out.tour?.unionHall, "SIU");
    const drug = out.documents.find((d) => d.docType === "drug_free");
    assert.equal(drug?.expiresOn, "2026-11-11");
  });

  it("paper Seniority line wins over a guessed class", () => {
    const p = emptyPerson();
    p.tour = {
      vessel: "M/V GEORGE II",
      position: "AB/W",
      signOn: "2026-09-01",
      signOff: null,
      port: null,
      relieving: null,
      assignmentType: "ROTARY",
      lengthDays: null,
      dispatchRef: null,
      unionHall: "SIU",
      watch: "12-4",
      billetCode: "07",
      seniorityClass: "A",
      dueOff: null,
    };
    const out = overlayParsedFields(p, COOPER_CLEARANCE);
    assert.equal(out.tour?.seniorityClass, "B");
  });
});

describe("SASH certificates", () => {
  it("reads a name from the filename", () => {
    assert.deepEqual(nameFromFilename("SASH_Rosca.pdf"), {
      lastName: "Rosca",
      firstName: null,
      fullName: "Rosca",
    });
    assert.equal(nameFromFilename("Kluck, Brian SASH cert.pdf")?.fullName, "Brian Kluck");
    assert.equal(nameFromFilename("SOCP-SASH-Sorin-Rosca-2026.pdf")?.fullName, "Sorin Rosca");
    assert.equal(nameFromFilename("Yousuf Mohamed DOCS.pdf")?.fullName, "Yousuf Mohamed");
    assert.equal(nameFromFilename("IMG_4032.jpg"), null);
    assert.deepEqual(nameFromFilename("Kluck scn.pdf"), {
      lastName: "Kluck",
      firstName: null,
      fullName: "Kluck",
    });
    assert.deepEqual(nameFromFilename("Kluck Documents.pdf"), {
      lastName: "Kluck",
      firstName: null,
      fullName: "Kluck",
    });
    const scn = fillNameParts({ ...emptyPerson(), firstName: "Kluck", lastName: "Scn", fullName: "Kluck Scn" });
    assert.equal(scn.lastName, "Kluck");
    assert.equal(scn.firstName, null);
    assert.deepEqual(nameFromFilename("R. Hines PP, MMC, MMC MED.pdf"), {
      firstName: "R",
      lastName: "Hines",
      fullName: "R Hines",
    });
    assert.deepEqual(nameFromFilename("2M S. McGeough.pdf"), {
      firstName: "S",
      lastName: "Mcgeough",
      fullName: "S Mcgeough",
    });
    assert.deepEqual(nameFromFilename("Zaid Cooper Clearance.pdf"), {
      firstName: "Zaid",
      lastName: "Cooper",
      fullName: "Zaid Cooper",
    });
    assert.deepEqual(nameFromFilename("Zaid Cooper Dispatch.pdf"), {
      firstName: "Zaid",
      lastName: "Cooper",
      fullName: "Zaid Cooper",
    });
    assert.deepEqual(nameFromFilename("R. Hines DOT Drug Test.pdf"), {
      firstName: "R",
      lastName: "Hines",
      fullName: "R Hines",
    });
    assert.deepEqual(nameFromFilename("R. Hines Dispatch George II 3M 8.3.26.pdf"), {
      firstName: "R",
      lastName: "Hines",
      fullName: "R Hines",
    });
    assert.deepEqual(nameFromFilename("Abdullah Ali Cyber Security Awareness.pdf"), {
      firstName: "Abdullah",
      lastName: "Ali",
      fullName: "Abdullah Ali",
    });
    assert.deepEqual(nameFromFilename("Alan Arsenault, MTSA Training.pdf"), {
      lastName: "Arsenault",
      firstName: "Alan",
      fullName: "Alan Arsenault",
    });
    assert.deepEqual(nameFromFilename("Alex DiPietro OT Training.pdf"), {
      firstName: "Alex",
      lastName: "Dipietro",
      fullName: "Alex Dipietro",
    });
    assert.deepEqual(nameFromFilename("George II 2nd AE W 14 day relief - Cyrus E. Khaleeli.pdf"), {
      firstName: "Cyrus",
      lastName: "Khaleeli",
      fullName: "Cyrus Khaleeli",
    });
    assert.equal(usableTicketName(fillNameParts({ ...emptyPerson(), firstName: "Drug", lastName: "Test", fullName: "Drug Test" })), false);
  });

  it("reads MMC / passport expiry printed in the filename", () => {
    assert.equal(ticketsFromFilename("Cooper, Zaid MMC exp 5-23-2028.pdf").mmcExpiration, "2028-05-23");
    assert.equal(ticketsFromFilename("Cooper, Zaid PP exp 5-1-2028.pdf").passportExpiration, "2028-05-01");
    assert.equal(ticketsFromFilename("Flynn, Thomas MMC exp 11-4-2029.pdf").mmcExpiration, "2029-11-04");
    assert.equal(ticketsFromFilename("Flynn, Thomas Passport expires 11-29-2028.pdf").passportExpiration, "2028-11-29");
    assert.equal(ticketsFromFilename("R. Hines PP, MMC, MMC MED.pdf").mmcExpiration, null);
    const mmc = overlayParsedFields(emptyPerson(), "", "Cooper, Zaid MMC exp 5-23-2028.pdf");
    assert.equal(mmc.documents.find((d) => d.docType === "mmc")?.expiresOn, "2028-05-23");
    const pp = overlayParsedFields(emptyPerson(), "", "Cooper, Zaid PP exp 5-1-2028.pdf");
    assert.equal(pp.documents.find((d) => d.docType === "passport")?.expiresOn, "2028-05-01");
  });

  it("stamps SASH issued and +1 year expiry", () => {
    assert.equal(looksLikeSash("SOCP Sexual Assault / Sexual Harassment", "ticket.pdf"), true);
    assert.equal(parseSashIssued("Completed on 01/03/2026"), "2026-01-03");
    const p = emptyPerson();
    const out = overlayParsedFields(p, "SOCP SASH\nCompleted on 01/03/2026", "SASH_Rosca.pdf");
    assert.equal(out.lastName, "Rosca");
    const sash = out.documents.find((d) => d.docType === "sash");
    assert.equal(sash?.issuedOn, "2026-01-03");
    assert.equal(sash?.expiresOn, "2027-01-03");
  });

  it("splits a printed name so the next ticket can match", () => {
    const p = fillNameParts({ ...emptyPerson(), fullName: "Rosca, Sorin" });
    assert.equal(p.lastName, "Rosca");
    assert.equal(p.firstName, "Sorin");
    assert.equal(usableTicketName(p), true);
    assert.equal(usableTicketName({ ...emptyPerson(), fullName: "Certificate" }), false);
    assert.equal(usableTicketName(fillNameParts({ ...emptyPerson(), fullName: "Oscar", firstName: "Oscar" })), false);
  });

  it("title-cases a passport-style ALL CAPS name", () => {
    const p = fillNameParts({ ...emptyPerson(), fullName: "TIFFANY DAVIS", firstName: "TIFFANY", lastName: "DAVIS" });
    assert.equal(p.fullName, "Tiffany Davis");
    assert.equal(p.firstName, "Tiffany");
    assert.equal(p.lastName, "Davis");
  });

  it("does not split a DOCS packet page by page", () => {
    assert.equal(shouldSplitPacket("Yousuf Mohamed DOCS.pdf", 18, 0), false);
    assert.equal(shouldSplitPacket("Tiffany Davis packet.pdf", 12, 2), false);
    assert.equal(shouldSplitPacket("SASH batch.pdf", 6, 6), true);
  });

  it("keeps the page image when PDF text is CID junk", () => {
    assert.equal(textLooksTyped(""), false);
    assert.equal(textLooksTyped("abc def"), false);
    assert.equal(textLooksTyped("!@# $%^ &*( )_ 123 456 789 !!! ???"), false);
    assert.equal(
      textLooksTyped(
        "SUNRISE VESSEL OPERATIONS Sign on Information Name Tiffany Davis Rating AB Vessel M/V GEORGE II Port Long Beach Date of birth April 11 1985 Passport 653981229",
      ),
      true,
    );
  });

  it("does not treat a handwritten sign-on form as a readable name", () => {
    const form =
      "SUNRISE OPERATIONS, LLC M.V. GEORGE II SIGN ON INFORMATION PLEASE WRITE NEATLY PERSONAL & DOCUMENT INFORMATION Full Name: Qrou::: Position: QE.E.";
    assert.equal(textHasReadableName(form, "Cesena, Oscar.pdf"), false);
    assert.equal(
      textHasReadableName(
        "SUNRISE OPERATIONS Full Name: Oscar Cesena Position: QEE",
        "Cesena, Oscar.pdf",
      ),
      true,
    );
    assert.deepEqual(nameFromFilename("Cesena, Oscar.pdf"), {
      lastName: "Cesena",
      firstName: "Oscar",
      fullName: "Oscar Cesena",
    });
    assert.deepEqual(nameFromFilename("Jaquaz Jenkins.pdf"), {
      firstName: "Jaquaz",
      lastName: "Jenkins",
      fullName: "Jaquaz Jenkins",
    });
    assert.equal(nameFromFilename("George II sign-on packet.pdf"), null);
    assert.deepEqual(nameFromFilename("Jasmine Garrett Steward.pdf"), {
      firstName: "Jasmine",
      lastName: "Garrett",
      fullName: "Jasmine Garrett",
    });
    assert.deepEqual(nameFromFilename("GUDE Kevin Barrera.pdf"), {
      firstName: "Kevin",
      lastName: "Barrera",
      fullName: "Kevin Barrera",
    });
    assert.deepEqual(nameFromFilename("Electrician T. Van.pdf"), {
      firstName: "T",
      lastName: "Van",
      fullName: "T Van",
    });
    assert.deepEqual(nameFromFilename("3AE M. Welsh .pdf"), {
      firstName: "M",
      lastName: "Welsh",
      fullName: "M Welsh",
    });
    assert.deepEqual(nameFromFilename("3AE Electrician D. Thompson.pdf"), {
      firstName: "D",
      lastName: "Thompson",
      fullName: "D Thompson",
    });
    assert.deepEqual(nameFromFilename("3AE A. Dipietro.pdf"), {
      firstName: "A",
      lastName: "Dipietro",
      fullName: "A Dipietro",
    });
    assert.deepEqual(nameFromFilename("Aaron Robb 3AE.pdf"), {
      firstName: "Aaron",
      lastName: "Robb",
      fullName: "Aaron Robb",
    });
    assert.equal(usableTicketName(fillNameParts({ ...emptyPerson(), firstName: "M", lastName: "Welsh", fullName: "M Welsh" })), true);
  });

  it("reads Cesena I-9 and medical pages instead of the first eight form sheets", () => {
    const pages = [
      { text: "SUNRISE OPERATIONS, LLC M.V. GEORGE II SIGN ON INFORMATION PLEASE WRITE NEATLY PERSONAL & DOCUMENT INFORMATION Full Name: Qrou::: Position: QE.E. Note officers and department heads" },
      { text: "Doc: SMM-PER-05-A2 Personnel Medical Sign-On To be completed by all officers and unlicensed personnel upon signing onboard NAME: ~Gear" },
      { text: "SUNRISE OPERATIONS SEAMAN'S STATEMENT OF PHYSICAL CONDITION Seaman's Name garbled Rating QEE" },
      { text: "Release of Information Form 49 CFR Part 40 Drug and Alcohol Testing Section I new employer" },
      { text: "Employment Eligibility Verification Department of Homeland Security USCIS Form I-9 Last Name Cesena First Name Oscar Passport A2599987" },
      { text: "United States Coast Guard Medical Certificate Seafarer Name: CESENA OSCAR DAVID Sex: Male DOB: 28-NOV-1987" },
      { text: "" },
      { text: "~" },
    ];
    const file = "Cesena, Oscar.pdf";
    assert.ok(pageReadScore(pages[4].text, file) > pageReadScore(pages[0].text, file));
    const textPages = pickPacketTextPages(pages, file, 4);
    assert.ok(textPages.includes(4), `text pages ${textPages}`);
    assert.ok(textPages.includes(5), `text pages ${textPages}`);
    const images = pickPacketImagePages(pages, file, 4);
    assert.ok(images.includes(6) || images.includes(7), `images ${images}`);
  });

  it("photographs every page of a 4-page MMC/passport scan", () => {
    const pages = [{ text: "" }, { text: "" }, { text: "" }, { text: "" }];
    assert.deepEqual(pickPacketImagePages(pages, "R. Hines PP, MMC, MMC MED.pdf", 4), [0, 1, 2, 3]);
  });

  it("photographs the ID pages at the back of a junk-OCR packet", () => {
    const junk = "l1l1l1 mmn vv %% ## ~~~ / / / cid:22 cid:23";
    const pages = Array.from({ length: 10 }, (_, i) => ({ text: i < 8 ? junk : "" }));
    const images = pickPacketImagePages(pages, "ABW Aldo Thomas.pdf", 4);
    assert.ok(images.includes(8) && images.includes(9), `images ${images}`);
  });

  it("photographs I-9 / ID pages on a 19-page photo-only packet, not only the first sheets", () => {
    const pages = Array.from({ length: 19 }, () => ({ text: "" }));
    const images = pickPacketImagePages(pages, "Kluck Documents.pdf", 4);
    assert.ok(images.includes(0), `first ${images}`);
    assert.ok(images.includes(18), `last ${images}`);
    assert.ok(images.some((i) => i >= 8 && i <= 11), `I-9 zone ${images}`);
  });

  it("photographs middle ID pages on a 24-page handwritten packet, not only the last forms", () => {
    const junk = "l1l1l1 mmn vv %% ## ~~~ / / / cid:22 cid:23 sunrise operations sign on";
    const pages = Array.from({ length: 24 }, (_, i) => {
      if (i === 10 || i === 11 || i === 12 || i === 14) return { text: "" };
      if (i === 9) return { text: "Employment Eligibility Verification Form I-9 USCIS A86394669" };
      return { text: junk };
    });
    const images = pickPacketImagePages(pages, "ABW Aldo Thomas.pdf", 4);
    assert.ok(images.includes(0), `first page ${images}`);
    assert.ok(images.includes(10) || images.includes(11) || images.includes(12), `ID photos ${images}`);
  });
});

describe("local packet text — no API", () => {
  it("parses MMC-style 13-JUN-2023 dates", () => {
    assert.equal(packetDate("13-JUN-2023"), "2023-06-13");
    assert.equal(packetDate("02 JUN 2026"), "2026-06-02");
    assert.equal(packetDate("12/18/1971"), "1971-12-18");
  });

  it("reads name, MMC, passport, class and drug-free from typed hall paper", () => {
    const text = `
SEAFARERS INTERNATIONAL UNION CLEARANCE 86-067
Name: ZAID MALIK COOPER
MMC 000266551 expires 5/23/2028
Passport A11223344 expires 05/01/2028
Book No. 026655 Rating: AB Seniority: B
Meets Random Exception Regulations Through: 11/11/2026
`;
    const out = extractPersonFromText(text, "Cooper, Zaid MMC exp 5-23-2028.pdf");
    assert.equal(out.lastName, "Cooper");
    assert.equal(out.firstName, "Zaid");
    assert.equal(out.mmcNumber, "000266551");
    assert.equal(out.passportNumber, "A11223344");
    assert.equal(out.mmcExpiration, "2028-05-23");
    assert.equal(out.passportExpiration, "2028-05-01");
    assert.equal(out.tour?.seniorityClass, "B");
    assert.equal(ticketsLookComplete(out), true);
  });

  it("reads Hines-style ID lines without calling vision", () => {
    const text =
      "RAYMOND HINES DOB 18-MAY-1977 MMC Ref Number 000338014 expires 13-JUN-2028 Passport A86943389 expires 23 JUL 2036";
    const out = extractPersonFromText(text, "R. Hines PP, MMC, MMC MED.pdf");
    assert.equal(out.mmcNumber, "000338014");
    assert.equal(out.passportNumber, "A86943389");
    assert.equal(out.mmcExpiration, "2028-06-13");
    assert.equal(out.passportExpiration, "2036-07-23");
    assert.equal(out.dob, "1977-05-18");
  });

  it("does not invent IDs on a photo-only scan", () => {
    const out = extractPersonFromText("", "2M S. McGeough.pdf");
    assert.equal(out.lastName, "Mcgeough");
    assert.equal(out.mmcNumber, null);
    assert.equal(ticketsLookComplete(out), false);
    assert.equal(usableTicketName(out), true);
  });

  it("does not steal a union clinic email or Book No as a last name", () => {
    const text = `
SEAFARERS INTERNATIONAL UNION
Member Name: Cooper, Zaid Malik
Name: Zaid Cooper Book No.: 026655 Seniority: B Rating: AB
Meets Random Exception Regulations Through: 11/11/2026
Email: shbpmedical@seafarers.org Phone: 301-994-0010
`;
    const out = extractPersonFromText(text, "Zaid Cooper Clearance.pdf");
    assert.equal(out.firstName, "Zaid");
    assert.equal(out.lastName, "Cooper");
    assert.equal(out.email, null);
    assert.equal(out.tour?.seniorityClass, "B");
  });

  it("does not treat the MMC issue date as the expiration", () => {
    const p = emptyPerson();
    p.fullName = "Scott McGeough";
    p.firstName = "Scott";
    p.lastName = "McGeough";
    p.mmcNumber = "1234567";
    p.mmcExpiration = "2025-03-15";
    p.documents = [
      {
        docType: "mmc",
        label: "MMC",
        docNumber: "1234567",
        issuedOn: "2025-03-15",
        expiresOn: "2025-03-15",
        notes: null,
      },
    ];
    const out = fixCredentialDates(p);
    assert.equal(out.mmcExpiration, "2030-03-15");
    assert.equal(out.documents.find((d) => d.docType === "mmc")?.expiresOn, "2030-03-15");
    assert.equal(out.documents.find((d) => d.docType === "mmc")?.issuedOn, "2025-03-15");
  });

  it("swaps MMC dates when expiration is before issue", () => {
    const p = emptyPerson();
    p.mmcExpiration = "2025-03-15";
    p.documents = [
      { docType: "mmc", label: "MMC", docNumber: "1", issuedOn: "2030-03-15", expiresOn: "2025-03-15", notes: null },
    ];
    const out = fixCredentialDates(p);
    assert.equal(out.mmcExpiration, "2030-03-15");
    assert.equal(out.documents[0]?.issuedOn, "2025-03-15");
  });

  it("treats a future equal date as the expiry, not a new issue", () => {
    const p = emptyPerson();
    p.documents = [
      { docType: "medical", label: "STCW Medical", docNumber: null, issuedOn: "2027-09-12", expiresOn: "2027-09-12", notes: null },
    ];
    const out = fixCredentialDates(p);
    const med = out.documents.find((d) => d.docType === "medical");
    assert.equal(med?.expiresOn, "2027-09-12");
    assert.equal(med?.issuedOn, "2025-09-12");
  });
});
