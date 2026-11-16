import assert from "node:assert/strict";
import { chromium, devices } from "playwright";

const BASE = process.env.DASHBOARD_TEST_URL || "http://127.0.0.1:8765/";
const errors = [];
const browser = await chromium.launch({ headless: true });
async function validate(page, label) {
  page.on("pageerror", err => errors.push(label + ": " + err.message));
  const response = await page.goto(BASE, {waitUntil:"networkidle"});
  assert.equal(response?.status(), 200, label + ": dashboard returned non-200");
  await page.waitForFunction(() => document.getElementById("count")?.textContent?.includes("8 of 8 reviewed cases"), {timeout:15000});
  assert.equal(await page.locator("#total-cases").innerText(), "8");
  assert.equal(await page.locator("#outcome-bars button").count(), 3, label + ": expected outcome bars");
  assert.ok(await page.locator("#function-bars button").count() >= 4, label + ": expected function bars");
  await page.locator("#outcome-bars button[data-value='Negative']").click();
  assert.match(await page.locator("#count").innerText(), /^2 of 8/);
  assert.equal(await page.locator(".case").count(), 2);
  await page.locator("#reset").click();
  await page.locator("#industry").selectOption("Financial services");
  assert.match(await page.locator("#count").innerText(), /^3 of 8/);
  await page.locator("#outcome").selectOption("Mixed");
  assert.match(await page.locator("#count").innerText(), /^1 of 8/);
  await page.locator("#search").fill("Klarna");
  assert.match(await page.locator("#count").innerText(), /^1 of 8/);
  await page.locator("#reset").click();
  await page.locator("[data-tab='table']").click();
  assert.equal(await page.locator(".comparison tbody tr").count(), 8);
  await page.locator("#search").fill("Air Canada");
  assert.equal(await page.locator(".comparison tbody tr").count(), 1);
  await page.locator("#reset").click();
  await page.locator("[data-tab='evidence']").click();
  assert.equal(await page.locator(".ledger-card").count(), 8);
  await page.locator("[data-tab='story']").click();
  assert.equal(await page.locator(".story").count(), 8);
  await page.locator("#learning-view").click();
  assert.ok((await page.locator(".story").first().innerText()).includes("A question for students"));
  await page.locator("#professional-view").click();
  assert.ok((await page.locator(".story").first().innerText()).includes("The next business test"));
  await page.locator("[data-tab='cards']").click();
  await page.locator(".case-btn").first().click();
  assert.equal(await page.locator(".details.open").count(), 1);
  assert.ok(await page.locator(".details.open a[href^='https:']").count() >= 1);
  const [download] = await Promise.all([page.waitForEvent("download"),page.locator("#export").click()]);
  assert.match(download.suggestedFilename(), /\.csv$/i);
  const dims = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    viewport: document.documentElement.clientWidth
  }));
  assert.ok(dims.scroll <= dims.viewport + 2, label + ": horizontal overflow " + JSON.stringify(dims));
  console.log("PASS", label, "charts, filters, table, evidence, briefing, expansion, CSV, viewport");
}
try {
  const desktop = await browser.newPage({viewport:{width:1440,height:900},acceptDownloads:true});
  await validate(desktop,"desktop");
  await desktop.close();
  const mobile = await browser.newPage({...devices["iPhone 13"],acceptDownloads:true});
  await validate(mobile,"iPhone 13");
  await mobile.close();
  assert.deepEqual(errors,[], "Uncaught browser errors: " + errors.join("; "));
} finally {
  await browser.close();
}
