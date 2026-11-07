import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { DatabaseSync } from "node:sqlite";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const root = path.resolve(import.meta.dirname, "..");
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "portal-mail-test-"));
const originalFetch = globalThis.fetch;
let database, server, browser, passed = 0;
const pass = message => { passed++; console.log("OK: " + message); };
try {
  const result = spawnSync(path.join(root, "node_modules/.bin/tsc"), [
    "--project", path.join(root, "tsconfig.json"), "--noEmit", "false",
    "--outDir", temporary, "--rootDir", path.join(root, "src"),
  ], { cwd: root, encoding: "utf8" });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  fs.writeFileSync(path.join(temporary, "package.json"), '{"type":"module"}');
  const worker = (await import(pathToFileURL(path.join(temporary, "index.js")))).default;
  database = new DatabaseSync(path.join(temporary, "mail.sqlite"));
  for (const file of ["0002_portal_content.sql", "0003_submission_receipts.sql"])
    database.exec(fs.readFileSync(path.join(root, "migrations", file), "utf8"));
  const initial = JSON.parse(fs.readFileSync(path.join(root, "seeds/portal.json"), "utf8"));
  const custom = {
    ...structuredClone(initial.forms[0]), id: "mail-fields", title: "Alle Felder",
    fields: [
      { id: "text", type: "text", label: "Team", required: true, options: [] },
      { id: "date", type: "date", label: "Datum", required: true, options: [] },
      { id: "email", type: "email", label: "Kontakt", required: false, options: [] },
      { id: "select", type: "select", label: "Auswahl", required: true, options: ["A", "B"] },
      { id: "multi", type: "multiselect", label: "Mehrfachauswahl", required: true, options: ["X", "Y"] },
      { id: "long", type: "textarea", label: "Details", required: false, options: [] },
    ],
  };
  initial.forms.push(custom);
  database.prepare("INSERT INTO portal_content (id,version,data_json) VALUES ('main',1,?)").run(JSON.stringify(initial));
  const DB = {
    prepare(sql) {
      let args = [];
      const statement = {
        bind(...values) { args = values; return statement; },
        async first() { return database.prepare(sql).get(...args) || null; },
        async run() {
          const result = database.prepare(sql).run(...args);
          return { success: true, meta: { changes: Number(result.changes) } };
        },
      };
      return statement;
    },
  };
  let rateAllowed = true, providerMode = "success", challengeMode = "valid";
  const delivered = new Map(), providerCalls = [];
  let holdProvider;
  const env = {
    DB, PORTAL_MODE: "persistent", MAIL_ENABLED: "true",
    RESEND_API_KEY: "test-only-not-a-real-key", RESEND_FROM: "Serviceportal <noreply@example.test>",
    MAIL_TEST_TO: "recipient@example.test", PUBLIC_HOSTNAME: "portal.example.test",
    TURNSTILE_SECRET_KEY: "test-only-challenge-secret", TURNSTILE_SITE_KEY: "test-sitekey",
    REQUEST_RATE_LIMITER: { async limit({ key }) { assert(key.startsWith("service-request:")); return { success: rateAllowed }; } },
    ASSETS: { async fetch() { return new Response(fs.readFileSync(path.join(root, "public-preview/index.html")), { headers: { "content-type": "text/html" } }); } },
  };
  globalThis.fetch = async (input, init) => {
    const url = typeof input === "string" ? input : input.url || input.toString();
    if (url === "https://challenges.cloudflare.com/turnstile/v0/siteverify") {
      assert.equal(init.body.get("secret"), env.TURNSTILE_SECRET_KEY);
      if (challengeMode === "offline") throw new TypeError("test outage");
      return Response.json({
        success: challengeMode !== "invalid" && init.body.get("response") === "good-token",
        hostname: challengeMode === "wrong-host" ? "other.example.test" : env.PUBLIC_HOSTNAME,
        action: challengeMode === "wrong-action" ? "other-action" : "service-request",
      });
    }
    if (url === "https://api.resend.com/emails") {
      assert.equal(init.headers.Authorization, "Bearer " + env.RESEND_API_KEY);
      const payload = JSON.parse(init.body), key = init.headers["Idempotency-Key"];
      providerCalls.push({ payload, key });
      if (providerMode === "fail") return Response.json({ message: "test failure" }, { status: 503 });
      if (providerMode === "no-id") return Response.json({});
      const old = delivered.get(key);
      if (old) {
        assert.equal(JSON.stringify(payload), JSON.stringify(old.payload), "Provider retries must preserve exactly the same message");
        return Response.json({ id: old.id });
      }
      const record = { id: "provider-" + crypto.randomUUID(), payload };
      delivered.set(key, record);
      if (providerMode === "lost-response") { providerMode = "success"; throw new TypeError("response lost after acceptance"); }
      if (providerMode === "hold") await new Promise(resolve => { holdProvider = resolve; });
      return Response.json({ id: record.id });
    }
    return originalFetch(input, init);
  };
  let base = "https://portal.example.test";
  const data = (overrides = {}, files = []) => {
    const form = new FormData();
    const values = {
      requestId: crypto.randomUUID(), formId: "it-allgemein", name: "Test Person",
      email: "sender@example.test", subject: "Testanfrage", message: "Test mit Umlauten: äöü.",
      fields: "{}", website: "", turnstileToken: "good-token", ...overrides,
    };
    for (const [key, value] of Object.entries(values)) form.set(key, typeof value === "string" ? value : JSON.stringify(value));
    for (const file of files) form.append("files", file);
    return form;
  };
  const send = (form, options = {}) => worker.fetch(new Request(base + "/api/requests", {
    method: "POST",
    headers: { Origin: base, "cf-connecting-ip": "203.0.113.17", ...options.headers },
    body: form,
  }), options.env || env);
  assert.equal((await worker.fetch(new Request(base + "/api/requests"), env)).status, 405);
  assert.equal((await send(data(), { env: { ...env, RESEND_API_KEY: undefined } })).status, 503);
  assert.equal((await send(data(), { headers: { Origin: "https://attacker.example" } })).status, 403);
  assert.equal((await send(data(), { headers: { "sec-fetch-site": "cross-site" } })).status, 403);
  rateAllowed = false;
  assert.equal((await send(data())).status, 429);
  rateAllowed = true;
  assert.equal((await send(data({ website: "bot-filled" }))).status, 400);
  for (const mode of ["invalid", "wrong-host", "wrong-action", "offline"]) {
    challengeMode = mode;
    assert.equal((await send(data())).status, mode === "offline" ? 503 : 400);
  }
  challengeMode = "valid";
  assert.equal(providerCalls.length, 0);
  pass("mail readiness, method, Origin/CSRF, rate limit, honeypot and Turnstile hostname/action checks");

  for (const overrides of [
    { formId: "not-published" }, { email: "bad\r\nemail@example.test" }, { subject: "Bad\r\nheader" },
    { message: "" }, { fields: { undeclared: "must not send" } }, { requestId: "bad-id" },
  ]) assert([400,404].includes((await send(data(overrides))).status));
  const fields = { text: "Technik", date: "2026-11-07", email: "other@example.test", select: "A", multi: ["Y"], long: "Längerer Text" };
  for (const wrong of [
    { ...fields, text: "" }, { ...fields, select: "C" }, { ...fields, multi: [] },
    { ...fields, multi: ["X", "X"] }, { ...fields, date: "2026-02-31" }, { ...fields, email: "bad" },
  ]) assert.equal((await send(data({ formId: "mail-fields", fields: wrong }))).status, 400);
  const png = new File([fs.readFileSync(path.join(root, "prototype/assets/Elim_Logo_L_Mini_Marine.png"))], "logo.png", { type: "image/png" });
  const pdf = new File(["%PDF-1.7\nTest attachment\n%%EOF"], "beleg.pdf", { type: "application/pdf" });
  assert.equal((await send(data({}, [png,png,png,png]))).status, 400);
  assert.equal((await send(data({ formId: "wlan-anleitung", name: "" }, [pdf]))).status, 400);
  assert.equal((await send(data({}, [new File(["fake"], "fake.png", { type: "image/png" })]))).status, 400);
  assert.equal((await send(data({}, [new File([await png.arrayBuffer()], "fake.exe", { type: "image/png" })]))).status, 400);
  assert.equal((await send(data({}, [new File([new Uint8Array(10 * 1024 * 1024 + 1)], "too-large.png", { type: "image/png" })]))).status, 413);
  assert.equal(providerCalls.length, 0);
  pass("server-side required fields, option/date/email validation and attachment count/type/signature/size limits");

  const id = crypto.randomUUID();
  const accepted = await send(data({ requestId: id, formId: "mail-fields", fields, to: "attacker@example.test" }, [png,pdf]));
  assert.equal(accepted.status, 200);
  const receipt = await accepted.json();
  assert.equal(receipt.accepted, true);
  assert(receipt.reference.startsWith("SP-"));
  const outgoing = providerCalls.at(-1).payload;
  assert.deepEqual(outgoing.to, [env.MAIL_TEST_TO]);
  assert.equal(outgoing.reply_to, "sender@example.test");
  assert.equal(outgoing.from, env.RESEND_FROM);
  assert(outgoing.text.includes("Team: Technik"));
  assert(outgoing.text.includes("Auswahl: A"));
  assert(outgoing.text.includes("Mehrfachauswahl: Y"));
  assert.equal(outgoing.attachments.length, 2);
  assert.deepEqual(Buffer.from(outgoing.attachments[0].content, "base64"), Buffer.from(await png.arrayBuffer()));
  const deliveredCount = delivered.size, callsCount = providerCalls.length;
  assert.equal((await send(data({ requestId: id, formId: "mail-fields", fields, to: "attacker@example.test" }, [png,pdf]))).status, 200);
  assert.equal(delivered.size, deliveredCount);
  assert.equal(providerCalls.length, callsCount);
  assert.equal((await send(data({ requestId: id, message: "changed" }))).status, 409);
  assert.equal((await send(data({ formId: "wlan-anleitung", name: "" }))).status, 200);
  assert(providerCalls.at(-1).payload.text.includes("Rückfrage zur Anleitung"));
  pass("accepted receipt, fixed test recipient, Reply-To, all dynamic fields, byte-exact attachments and duplicate protection");

  const retryId = crypto.randomUUID();
  providerMode = "lost-response";
  assert.equal((await send(data({ requestId: retryId }))).status, 503);
  const lostCount = delivered.size;
  assert.equal((await send(data({ requestId: retryId }))).status, 200);
  assert.equal(delivered.size, lostCount);
  providerMode = "fail";
  assert.equal((await send(data())).status, 503);
  providerMode = "no-id";
  assert.equal((await send(data())).status, 503);
  providerMode = "success";
  const concurrentId = crypto.randomUUID(), beforeRace = delivered.size;
  const responses = await Promise.all([send(data({ requestId: concurrentId })), send(data({ requestId: concurrentId }))]);
  assert(responses.every(response => response.status === 200));
  assert.equal(delivered.size, beforeRace + 1);
  const columns = database.prepare("PRAGMA table_info(submission_receipts)").all().map(c => c.name);
  assert.deepEqual(columns, ["request_id","digest","status","provider_id","created_at"]);
  const oldId = crypto.randomUUID();
  database.prepare("INSERT INTO submission_receipts VALUES (?,?, 'pending', NULL, ?)").run(oldId, "old-digest", 1);
  await worker.scheduled({}, env);
  assert.equal(database.prepare("SELECT COUNT(*) AS count FROM submission_receipts WHERE request_id=?").get(oldId).count, 0);
  pass("provider errors never confirm success; lost-response and simultaneous retries do not duplicate mail; metadata cleanup");

  server = http.createServer(async (incoming, outgoing) => {
    try {
      const chunks = [];
      for await (const chunk of incoming) chunks.push(chunk);
      const response = await worker.fetch(new Request(base + incoming.url, {
        method: incoming.method, headers: { ...incoming.headers, "cf-connecting-ip": "203.0.113.17" },
        ...(["GET","HEAD"].includes(incoming.method) ? {} : { body: Buffer.concat(chunks) }),
      }), env);
      outgoing.writeHead(response.status, Object.fromEntries(response.headers));
      outgoing.end(Buffer.from(await response.arrayBuffer()));
    } catch (error) { outgoing.writeHead(500); outgoing.end(String(error)); }
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  base = "http://127.0.0.1:" + server.address().port;
  const require = createRequire(import.meta.url);
  let playwright;
  try { playwright = require("playwright"); }
  catch { playwright = require("/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright"); }
  browser = await playwright.chromium.launch({ headless: true,
    ...(fs.existsSync("/usr/bin/chromium") ? { executablePath: "/usr/bin/chromium" } : {}),
  });
  const context = await browser.newContext();
  await context.route("https://challenges.cloudflare.com/turnstile/v0/api.js?*", route => route.fulfill({
    contentType: "text/javascript",
    body: 'window.turnstile={render(el,opts){this.options=opts;el.textContent="Sicherheitsprüfung (Test)";opts.callback("good-token");return "test-widget";},reset(){this.options.callback("good-token");},remove(){}};',
  }));
  const page = await context.newPage(), errors = [];
  page.on("pageerror", error => errors.push(error.message));
  page.setDefaultTimeout(8000);
  await page.goto(base + "/#form/it-allgemein");
  await page.locator("#request-name").fill("Browser Test");
  await page.locator("#request-email").fill("browser@example.test");
  await page.locator("#request-description").fill("Diese Angaben müssen bei einem Versandfehler erhalten bleiben.");
  await page.locator("#request-files").setInputFiles({ name: "test.pdf", mimeType: "application/pdf", buffer: Buffer.from(await pdf.arrayBuffer()) });
  await page.getByText("Sicherheitsprüfung (Test)", { exact: true }).waitFor();
  providerMode = "fail";
  await page.getByRole("button", { name: "Anfrage senden", exact: true }).click();
  await page.locator("#request-error").filter({ hasText: "Versanddienst" }).waitFor();
  assert.equal(await page.locator("#request-name").inputValue(), "Browser Test");
  assert.equal(await page.locator("#request-files").evaluate(input => input.files.length), 1);
  assert(!page.url().includes("bestaetigung"));
  providerMode = "hold";
  const beforeBrowser = delivered.size;
  await page.getByRole("button", { name: "Anfrage senden", exact: true }).click();
  await page.getByRole("button", { name: "Wird gesendet …", exact: true }).waitFor();
  await page.evaluate(() => document.querySelector("#request-form").dispatchEvent(new Event("submit", { cancelable: true })));
  await page.waitForFunction(() => document.querySelector('button[type="submit"]').disabled);
  for (let i = 0; !holdProvider && i < 100; i++) await new Promise(resolve => setTimeout(resolve, 10));
  assert(holdProvider);
  holdProvider();
  await page.getByRole("heading", { name: "Deine Anfrage wurde übergeben.", exact: true }).waitFor();
  assert.equal(delivered.size, beforeBrowser + 1);
  assert(providerCalls.at(-1).payload.text.includes("Browser Test"));
  assert.equal(providerCalls.at(-1).payload.reply_to, "browser@example.test");
  assert.equal(await page.locator(".prototype-note").textContent(), "Serviceportal · Testbetrieb");
  providerMode = "success";
  await page.goto(base + "/#form/wlan-anleitung");
  await page.locator("#request-email").fill("guide@example.test");
  await page.locator("#request-description").fill("Rückfrage aus der Anleitung");
  await page.getByRole("button", { name: "Nachricht senden", exact: true }).click();
  await page.getByRole("heading", { name: "Deine Anfrage wurde übergeben.", exact: true }).waitFor();
  assert(providerCalls.at(-1).payload.text.includes("Rückfrage zur Anleitung"));
  assert.deepEqual(errors, []);
  pass("browser error retains inputs/files; retry and double-click protection; actual success state for forms and guides");
  console.log(JSON.stringify({ passed }));
} finally {
  globalThis.fetch = originalFetch;
  if (browser) await browser.close();
  if (server) await new Promise(resolve => server.close(resolve));
  if (database) database.close();
  fs.rmSync(temporary, { recursive: true, force: true });
}
