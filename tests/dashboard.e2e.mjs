import assert from "node:assert/strict";
import { chromium, devices } from "playwright";

const BASE = process.env.DASHBOARD_TEST_URL || "http://127.0.0.1:8765/";
const errors = [];
const browser = await chromium.launch({ headless: true });
async function validate(page, label) {
  page.on("pageerror", err => errors.push(label + ": " + err.message));
  const response = await page.goto(BASE, {waitUntil:"networkidle"});
  assert.equal(response?.status(), 200, label + ": dashboard returned non-200");
  await page.waitForFunction(() => document.getElementById("count")?.textContent?.includes("16 of 16 reviewed cases"), {timeout:15000});
  assert.equal(await page.locator("#total-cases").innerText(), "16");
  assert.equal(await page.locator("#outcome-bars button").count(), 3, label + ": expected outcome bars");
  assert.ok(await page.locator("#function-bars button").count() >= 4, label + ": expected function bars");
  await page.locator("#outcome-bars button[data-value='Negative']").click();
  assert.match(await page.locator("#count").innerText(), /^4 of 16/);
  assert.equal(await page.locator(".case").count(), 4);
  await page.locator("#reset").click();
  await page.locator("#industry").selectOption("Financial services");
  assert.match(await page.locator("#count").innerText(), /^4 of 16/);
  await page.locator("#outcome").selectOption("Mixed");
  assert.match(await page.locator("#count").innerText(), /^1 of 16/);
  await page.locator("#search").fill("Klarna");
  assert.match(await page.locator("#count").innerText(), /^1 of 16/);
  await page.locator("#reset").click();
  await page.locator("[data-tab='table']").click();
  assert.equal(await page.locator(".comparison tbody tr").count(), 16);
  await page.locator("#search").fill("Air Canada");
  assert.equal(await page.locator(".comparison tbody tr").count(), 1);
  await page.locator("#reset").click();
  await page.locator("[data-tab='evidence']").click();
  assert.equal(await page.locator(".ledger-card").count(), 16);
  await page.locator("[data-tab='compare']").click();
  assert.ok((await page.locator(".compare-empty").innerText()).includes("Select up to three cases"));
  await page.locator("[data-tab='cards']").click();
  await page.locator(".compare-button").first().click();
  await page.locator(".compare-button").nth(1).click();
  await page.locator("[data-tab='compare']").click();
  assert.equal(await page.locator(".compare-col").count(), 2);
  await page.locator("[data-tab='story']").click();
  assert.equal(await page.locator(".story").count(), 16);
  assert.ok(await page.locator(".story-chapter").count() >= 3);
  await page.locator("#learning-view").click();
  assert.ok((await page.locator(".story").first().innerText()).includes("A question for students"));
  await page.locator("#professional-view").click();
  assert.ok((await page.locator(".story").first().innerText()).includes("The next business test"));
  await page.locator("[data-tab='cards']").click();
  await page.locator("#learning-view").click();
  assert.ok((await page.locator(".audience-spotlight").first().innerText()).includes("STUDENT LENS"));
  assert.ok((await page.locator(".audience-spotlight").first().innerText()).includes("?"));
  await page.locator("#professional-view").click();
  assert.ok((await page.locator(".audience-spotlight").first().innerText()).includes("BUSINESS LENS"));
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
async function validateLanguage(page, label) {
  const response = await page.goto(new URL("language.html", BASE).href, {waitUntil:"networkidle"});
  assert.equal(response?.status(), 200, label + ": language atlas unavailable");
  await page.waitForFunction(() => document.querySelectorAll("#terms .term-line").length > 5, {timeout:15000});
  assert.equal(await page.locator("#doc-count").innerText(), "16");
  assert.ok(await page.locator("#terms .term-line").count() > 15);
  await page.locator("#terms .term-line").first().click();
  assert.ok(await page.locator("#document-results .word-source").count() > 0);
  assert.ok(await page.locator("#document-results .word-source a[href^='https:']").count() > 0);
  await page.locator("#metric").selectOption("frequency");
  assert.ok(await page.locator("#terms .term-line").count() > 10);
  await page.locator("#min-length").selectOption("1");
  await page.locator("#include-common").check();
  assert.ok(await page.locator("#terms .term-line").count() > 10);
  const [download] = await Promise.all([page.waitForEvent("download"),page.locator("#export-terms").click()]);
  assert.match(download.suggestedFilename(), /words\.csv$/);
  await page.locator("[data-corpus='studies']").click();
  assert.ok((await page.locator("#corpus-description").innerText()).toLowerCase().includes("selected"));
  const dimensions = await page.evaluate(() => ({scroll:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth}));
  assert.ok(dimensions.scroll <= dimensions.viewport + 2, label + ": language atlas horizontal overflow " + JSON.stringify(dimensions));
  console.log("PASS", label, "language atlas, source trails, rankings, stopwords, export, corpus switch");
}
try {
  const desktop = await browser.newPage({viewport:{width:1440,height:900},acceptDownloads:true});
  await validate(desktop,"desktop");
  await validateLanguage(desktop,"desktop");
  await desktop.close();
  const mobile = await browser.newPage({...devices["iPhone 13"],acceptDownloads:true});
  await validate(mobile,"iPhone 13");
  await validateLanguage(mobile,"iPhone 13");
  await mobile.close();
  assert.deepEqual(errors,[], "Uncaught browser errors: " + errors.join("; "));
} finally {
  await browser.close();
}
