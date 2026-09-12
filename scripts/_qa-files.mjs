import { chromium } from "playwright";
const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
page.setDefaultTimeout(20000);
try {
  await page.goto("http://127.0.0.1:8080/crew", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  async function open(name, shot) {
    await page.goto("http://127.0.0.1:8080/crew", { waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    await page.getByRole("link", { name }).first().click();
    await page.waitForTimeout(1000);
    const t = (await page.locator("body").innerText()).replace(/\s+/g, " ");
    console.log("====", name, "====");
    console.log(t.slice(0, 1400));
    await page.screenshot({ path: `/workspace/screenshots/${shot}` });
  }

  await open(/Hines/i, "qa-audit-hines-file.png");
  await open(/Cooper/i, "qa-audit-cooper-file.png");
  await open(/Flynn/i, "qa-audit-flynn-file.png");
} catch (e) {
  console.log("ERR", e.stack || e);
} finally {
  await browser.close();
}
