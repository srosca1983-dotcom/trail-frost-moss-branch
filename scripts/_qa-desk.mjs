import { chromium } from "playwright";

const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
page.setDefaultTimeout(25000);
const notes = [];
function log(s) { notes.push(s); console.log(s); }

try {
  await page.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });
  const home = await page.locator("body").innerText();
  log("HOME " + home.slice(0, 200).replace(/\s+/g, " "));
  await page.screenshot({ path: "/workspace/screenshots/qa-audit-home.png" });

  await page.goto("http://127.0.0.1:8080/crew", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  const crew = await page.locator("body").innerText();
  for (const n of ["Kluck", "Hines", "Thomas", "Cooper", "McGeough", "Tesson", "Gupta"]) {
    log(`CREW has ${n}: ${crew.includes(n)}`);
  }
  await page.screenshot({ path: "/workspace/screenshots/qa-audit-crew.png" });

  // Kluck file
  const kluck = page.getByRole("link", { name: /Kluck/i }).first();
  if (await kluck.count()) {
    await kluck.click();
    await page.waitForTimeout(1200);
    const ktxt = await page.locator("body").innerText();
    log("KLUCK mmc " + /501128/.test(ktxt) + " passport " + /505519190/.test(ktxt));
    log("KLUCK forms PER-003 " + /SRO-PER-003|Sign on Information/.test(ktxt));
    log("KLUCK slice " + ktxt.slice(0, 400).replace(/\s+/g, " "));
    await page.screenshot({ path: "/workspace/screenshots/qa-audit-kluck.png" });
  } else log("KLUCK link missing");

  // Ingest Cooper clearance — typed, no vision needed
  await page.goto("http://127.0.0.1:8080/ingest", { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  const input = page.locator('input[type=file]').first();
  const t0 = Date.now();
  await input.setInputFiles("/workspace/attachments/Zaid Cooper Clearance.pdf");
  // wait for a result or 25s
  let saw = false;
  for (let i = 0; i < 25; i++) {
    await page.waitForTimeout(1000);
    const t = await page.locator("body").innerText();
    if (/Cooper|Class B|filed|Read |Could not|timed out|heavy scan/i.test(t) && !/Choose files from this computer/.test(t.split("\n").slice(-8).join(" "))) {
      if (/Zaid|Cooper|Class B|drug/i.test(t)) { saw = true; log("INGEST cooper " + (Date.now()-t0) + "ms :: " + t.slice(-600).replace(/\s+/g, " ")); break; }
    }
    if (/timed out|heavy scan|42/i.test(t)) { log("INGEST TIMEOUT " + t.slice(-400).replace(/\s+/g, " ")); break; }
  }
  if (!saw) log("INGEST cooper body " + (await page.locator("body").innerText()).slice(-800).replace(/\s+/g, " "));
  await page.screenshot({ path: "/workspace/screenshots/qa-audit-ingest-cooper.png" });

  // Hines photo IDs — this is the timeout case
  const t1 = Date.now();
  await input.setInputFiles("/workspace/attachments/R. Hines PP, MMC, MMC MED.pdf");
  saw = false;
  for (let i = 0; i < 40; i++) {
    await page.waitForTimeout(1000);
    const t = await page.locator("body").innerText();
    if (/Hines|timed out|heavy scan|42 second|A86943389|000338014|Raymond/i.test(t)) {
      log("INGEST hines " + (Date.now()-t1) + "ms i=" + i + " :: " + t.slice(-700).replace(/\s+/g, " "));
      saw = true;
      if (/timed out|heavy scan|42/.test(t) && i < 5) continue;
      break;
    }
  }
  if (!saw) log("INGEST hines no signal " + (Date.now()-t1) + "ms " + (await page.locator("body").innerText()).slice(-700).replace(/\s+/g, " "));
  await page.screenshot({ path: "/workspace/screenshots/qa-audit-ingest-hines.png" });
} catch (e) {
  log("ERR " + (e && e.stack ? e.stack : e));
  await page.screenshot({ path: "/workspace/screenshots/qa-audit-err.png" }).catch(() => {});
} finally {
  await browser.close();
}
