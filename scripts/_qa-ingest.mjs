import { chromium } from "playwright";

const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
page.setDefaultTimeout(90000);

async function dump(label) {
  const t = (await page.locator("body").innerText()).replace(/\s+/g, " ");
  console.log(label, t.slice(-1200));
}

async function drop(file) {
  const input = page.locator("input[type=file]").first();
  const t0 = Date.now();
  await input.setInputFiles(file);
  for (let i = 0; i < 90; i++) {
    const t = await page.locator("body").innerText();
    if (!/Reading 1/.test(t) && i > 1) break;
    await page.waitForTimeout(1000);
  }
  console.log("ms", Date.now() - t0, file.split("/").pop());
}

try {
  await page.goto("http://127.0.0.1:8080/ingest", { waitUntil: "networkidle" });
  await page.evaluate(() => {
    try {
      localStorage.removeItem("inbox-last-filed");
      localStorage.removeItem("inbox-last-results");
      sessionStorage.clear();
    } catch {}
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(600);

  await drop("/workspace/attachments/Cooper, Zaid MMC exp 5-23-2028.pdf");
  await dump("COOPER_MMC");
  await page.screenshot({ path: "/workspace/screenshots/qa-cooper-mmc-ingest.png" });

  await drop("/workspace/attachments/R. Hines PP, MMC, MMC MED.pdf");
  await dump("HINES");
  await page.screenshot({ path: "/workspace/screenshots/qa-audit-ingest-hines.png" });

  await drop("/workspace/attachments/Flynn, Thomas Passport expires 11-29-2028.pdf");
  await dump("FLYNN_PP");
  await page.screenshot({ path: "/workspace/screenshots/qa-flynn-pp-ingest.png" });
} catch (e) {
  console.log("ERR", e.stack || e);
  await page.screenshot({ path: "/workspace/screenshots/qa-audit-err.png" }).catch(() => {});
} finally {
  await browser.close();
}
