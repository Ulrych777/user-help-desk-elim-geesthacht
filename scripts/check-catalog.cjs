// Run against the local Worker started with npm run dev.
const assert = require("node:assert/strict");
const fs = require("node:fs");
let playwright;
try {
  playwright = require("playwright");
} catch {
  playwright = require("/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
}

(async () => {
  const base = process.env.PORTAL_TEST_URL || "http://127.0.0.1:8787";
  const response = await fetch(base + "/api/catalog");
  assert.equal(response.status, 200);
  const catalog = await response.json();
  assert(catalog.areas.length > 0, "A seeded local database is required");
  const browser = await playwright.chromium.launch({
    headless: true,
    ...(fs.existsSync("/usr/bin/chromium") ? { executablePath: "/usr/bin/chromium" } : {}),
  });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.setDefaultTimeout(8000);
    const waitFor = (selector) => page.locator(selector).first().waitFor();
    await page.goto(base);
    await waitFor(".area-card");
    assert.equal(await page.locator(".area-card").count(), catalog.areas.length);
    assert.equal(await page.locator('footer a[href="#admin/areas"]').count(), 0);
    const form = catalog.concerns.find((item) => item.type === "form" && item.fields.length);
    assert(form, "A form with fields is required");
    await page.goto(base + "/#form/" + form.id);
    await page.reload();
    await waitFor("#request-form");
    assert.equal(await page.locator("#request-title").textContent(), form.title);
    for (const field of form.fields) {
      const control = page.locator('[id="custom-' + field.id + '"]');
      assert.equal(await control.count(), 1);
      assert.equal(await control.evaluate((el) => el.required), field.required);
    }
    const guide = catalog.concerns.find((item) => item.type === "guide");
    await page.goto(base + "/#form/" + guide.id);
    await waitFor(".guide-article");
    assert((await page.locator(".guide-article").textContent()).includes(guide.guide_text.split("\n")[0]));
    console.log("OK: D1 catalog, direct links, fields and guide text.");

    // Distinct data proves that the UI uses the response rather than embedded demos.
    const fixture = {
      areas: [{ id: "test-area", name: "API-Testbereich", description: "Aus der API", icon: "it", image_key: "areas/it.webp", categories: [{ id: "test-category", name: "API-Kategorie" }] }],
      concerns: [{ id: "test-concern", area_id: "test-area", type: "form", title: "API-Testanliegen", description: "Aus der Datenbank", keywords: "Datenquelle", upload_enabled: true, categories: ["test-category"], fields: [{ id: "test-field", type: "select", label: "API-Auswahl", required: true, options: ["Erste", "Zweite"] }] }],
    };
    let mode = "fixture";
    await page.route("**/api/catalog", async (route) => {
      if (mode === "error") return route.fulfill({ status: 503, body: "{}" });
      if (mode === "invalid") return route.fulfill({ json: { areas: [], concerns: [{}] } });
      if (mode === "empty") return route.fulfill({ json: { areas: [], concerns: [] } });
      return route.fulfill({ json: fixture });
    });
    await page.goto(base);
    await waitFor(".area-card");
    assert.equal(await page.locator(".area-card").count(), 1);
    await page.getByRole("link", { name: /API-Testbereich/ }).click();
    await waitFor("#area-search");
    await page.locator("#area-search").fill("Datenquelle");
    await page.getByRole("link", { name: /API-Testanliegen/ }).click();
    await waitFor("#request-form");
    assert.equal(await page.locator("#custom-test-field option").allTextContents().then((values) => values.join("|")), "Bitte auswählen|Erste|Zweite");
    console.log("OK: API-only records, search, category IDs and select options.");

    mode = "error";
    await page.goto(base + "/?catalog-test=error#form/test-concern");
    await waitFor("#retry-catalog");
    assert.equal(await page.locator(".area-card").count(), 0);
    await page.evaluate(() => { location.hash = "area/test-area"; });
    assert.equal(await page.locator(".request-card").count(), 0);
    mode = "fixture";
    await page.getByRole("button", { name: "Erneut versuchen" }).click();
    await waitFor("#area-search");
    console.log("OK: error, no demo fallback, retry respects current route.");

    mode = "invalid";
    await page.goto(base);
    await waitFor("#retry-catalog");
    mode = "empty";
    await page.getByRole("button", { name: "Erneut versuchen" }).click();
    await page.getByRole("heading", { name: "Hier ist noch nichts veröffentlicht." }).waitFor();
    assert.equal(await page.locator(".area-card").count(), 0);
    await page.goto(base + "/#admin/areas");
    await page.getByRole("heading", { name: "Verwaltung noch nicht verfügbar" }).waitFor();
    assert.equal(await page.locator("#area-editor").count(), 0);
    assert.deepEqual(errors, []);
    console.log("OK: invalid/empty catalogs and admin route; no browser errors.");
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
