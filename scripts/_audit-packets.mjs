import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

const DIR = "/workspace/attachments";
const FILES = fs.readdirSync(DIR).filter(f => f.toLowerCase().endsWith(".pdf")).sort();

function skip(name) {
  const n = name.toLowerCase();
  return /hazmat|401k|empower|worksheet|agreement|shipping rules|facilitator|handout|mod\.|template|sign on packet full/.test(n);
}

async function pageText(pdf, i) {
  const page = await pdf.getPage(i);
  const tc = await page.getTextContent();
  return tc.items.map(it => ("str" in it ? it.str : "")).join(" ").replace(/\s+/g, " ").trim();
}

const out = [];
for (const f of FILES) {
  if (skip(f)) continue;
  const data = new Uint8Array(fs.readFileSync(path.join(DIR, f)));
  let pdf;
  try {
    pdf = await pdfjs.getDocument({ data, disableWorker: true }).promise;
  } catch (e) {
    out.push({ file: f, error: String(e).slice(0, 120) });
    continue;
  }
  const n = pdf.numPages;
  const pages = [];
  const max = Math.min(n, 32);
  for (let i = 1; i <= max; i++) {
    try { pages.push(await pageText(pdf, i)); }
    catch { pages.push(""); }
  }
  const compact = pages.map(t => t.replace(/\s+/g, "").length);
  const letters = pages.map(t => (t.match(/[A-Za-z]/g) || []).length);
  out.push({
    file: f,
    pages: n,
    chars: pages.reduce((a,t)=>a+t.length,0),
    compactMin: Math.min(...compact),
    compactMax: Math.max(...compact),
    compactAvg: Math.round(compact.reduce((a,b)=>a+b,0)/compact.length),
    emptyish: compact.filter(c => c < 80).length,
    sample: pages.map((t,i) => `p${i+1}(${compact[i]}): ${t.slice(0, 180)}`).slice(0, 6),
    lastSample: n > 6 ? pages.slice(-2).map((t,i) => `p${pages.length-1+i}(${compact[pages.length-2+i]}): ${t.slice(0, 140)}`) : [],
    blob: pages.join("\n").slice(0, 8000),
  });
  try { await pdf.destroy(); } catch {}
}
fs.writeFileSync("/tmp/packet-audit.json", JSON.stringify(out, null, 2));
for (const r of out) {
  if (r.error) { console.log("ERR", r.file, r.error); continue; }
  console.log(`${r.file} | ${r.pages}p chars=${r.chars} emptyish=${r.emptyish} min=${r.compactMin} avg=${r.compactAvg}`);
}
