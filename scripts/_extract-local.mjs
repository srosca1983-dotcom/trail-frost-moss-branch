import fs from "node:fs";
import { extractPersonFromText, ticketsLookComplete, usableTicketName, nameFromFilename } from "../src/lib/crew/parse-fields.ts";

const rows = JSON.parse(fs.readFileSync("/tmp/packet-audit.json", "utf8"));
for (const r of rows) {
  if (r.error) { console.log("ERR", r.file); continue; }
  const p = extractPersonFromText(r.blob, r.file);
  const nf = nameFromFilename(r.file);
  console.log("---", r.file, `(${r.pages}p chars=${r.chars} empty=${r.emptyish})`);
  console.log("  fileName:", nf);
  console.log("  name:", p.fullName, "|", p.firstName, p.lastName, "usable", usableTicketName(p), "complete", ticketsLookComplete(p));
  console.log("  mmc", p.mmcNumber, p.mmcExpiration, "pp", p.passportNumber, p.passportExpiration, "dob", p.dob);
  console.log("  email", p.email, "phone", p.cellPhone, "class", p.tour?.seniorityClass);
  console.log("  docs", p.documents.map(d => `${d.docType}:${d.docNumber||""}:${d.expiresOn||""}`).join(" | ") || "(none)");
  console.log("  forms", p.formsFound.map(f => f.code).join(",") || "(none)");
}
