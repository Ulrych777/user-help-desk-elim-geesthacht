import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { DatabaseSync } from "node:sqlite";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

let passed = 0;
const pass = message => { passed++; console.log("OK: " + message); };
const root = path.resolve(import.meta.dirname, "..");
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "serviceportal-check-"));
let database, server, browser;
const realFetch = globalThis.fetch;
try {
  const compiled = spawnSync(path.join(root, "node_modules/.bin/tsc"), [
    "--project", path.join(root, "tsconfig.json"), "--noEmit", "false",
    "--outDir", temporary, "--rootDir", path.join(root, "src"),
  ], { cwd: root, encoding: "utf8" });
  assert.equal(compiled.status, 0, compiled.stdout + compiled.stderr);
  fs.writeFileSync(path.join(temporary, "package.json"), '{"type":"module"}');
  const worker = (await import(pathToFileURL(path.join(temporary, "index.js")))).default;
  const initial = JSON.parse(fs.readFileSync(path.join(root, "seeds/portal.json"), "utf8"));
  database = new DatabaseSync(path.join(temporary, "portal.sqlite"));
  database.exec(fs.readFileSync(path.join(root, "migrations/0002_portal_content.sql"), "utf8"));
  database.exec(fs.readFileSync(path.join(root, "migrations/0004_administrators.sql"), "utf8"));
  database.prepare("INSERT INTO admins (email,display_name,active) VALUES (?,?,1)")
    .run("admin@example.test", "Test Admin");
  database.prepare("DELETE FROM admins WHERE email=?").run("glenn.ritter@elimgeesthacht.de");
  database.prepare("INSERT INTO portal_content (id,version,data_json) VALUES ('main',1,?)").run(JSON.stringify(initial));
  const DB = {
    prepare(sql) {
      const values = [];
      const query = {
        bind(...args) { values.push(...args); return query; },
        async first() { return database.prepare(sql).get(...values) || null; },
        async all() { return { success: true, results: database.prepare(sql).all(...values) }; },
        async run() {
          const result = database.prepare(sql).run(...values);
          return { success: true, meta: { changes: Number(result.changes) } };
        },
      };
      return query;
    },
  };
  const objects = new Map();
  const MEDIA = {
    async put(key, bytes, options) { objects.set(key, { bytes: new Uint8Array(bytes), httpMetadata: options.httpMetadata }); },
    async head(key) { return objects.has(key) ? { key } : null; },
    async get(key) {
      const object = objects.get(key);
      return object ? { httpMetadata: object.httpMetadata, body: new Response(object.bytes).body } : null;
    },
  };
  const pair = await crypto.subtle.generateKey(
    { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1,0,1]), hash: "SHA-256" },
    true, ["sign", "verify"],
  );
  const key = { ...await crypto.subtle.exportKey("jwk", pair.publicKey), kid: "local-test-key", alg: "RS256" };
  const env = {
    DB, MEDIA, PORTAL_MODE: "persistent",
    CF_ACCESS_TEAM_DOMAIN: "test-portal.cloudflareaccess.com", CF_ACCESS_AUD: "test-audience",
    ASSETS: { async fetch() { return new Response(fs.readFileSync(path.join(root, "public-preview/index.html")), { headers: { "content-type": "text/html" } }); } },
  };
  // Only tests supply a JWKS. Production code has no authentication bypass.
  globalThis.fetch = async (input, init) => {
    const url = typeof input === "string" ? input : input.url || input.toString();
    if (url === "https://test-portal.cloudflareaccess.com/cdn-cgi/access/certs")
      return Response.json({ keys: [key] });
    return realFetch(input, init);
  };
  const encode = value => Buffer.from(JSON.stringify(value)).toString("base64url");
  async function token(overrides = {}, header = {}) {
    const now = Math.floor(Date.now() / 1000);
    const a = encode({ alg: "RS256", kid: key.kid, ...header });
    const b = encode({ iss: "https://" + env.CF_ACCESS_TEAM_DOMAIN, aud: [env.CF_ACCESS_AUD],
      email: "admin@example.test", sub: "test-user", iat: now, exp: now + 3600, ...overrides });
    const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", pair.privateKey, Buffer.from(a + "." + b));
    return a + "." + b + "." + Buffer.from(signature).toString("base64url");
  }
  const validToken = await token();
  let base = "https://portal.example.test";
  async function request(route, method = "GET", data, jwt = validToken, extra = {}) {
    const headers = { ...(jwt ? { "Cf-Access-Jwt-Assertion": jwt } : {}), ...extra };
    if (method !== "GET" && method !== "HEAD") {
      if (!Object.hasOwn(headers, "origin")) headers.origin = base;
      if (!Object.hasOwn(headers, "content-type")) headers["content-type"] = "application/json";
    }
    return worker.fetch(new Request(base + route, { method, headers,
      ...(data === undefined ? {} : { body: typeof data === "string" || data instanceof Uint8Array ? data : JSON.stringify(data) }),
    }), env);
  }
  const publicState = await (await request("/api/portal", "GET", undefined, null)).json();
  assert.equal(publicState.areas.length, 3);
  assert.equal(publicState.forms.length, 9);
  assert(publicState.areas.every(area => !("email" in area)));
  for (const route of ["/admin", "/admin/", "/admin/anything", "/api/admin/portal", "/api/admin/media/file"]) {
    assert.equal((await request(route, "GET", undefined, null)).status, 401);
  }
  for (const invalid of [
    "forged-token", await token({ email: "outsider@example.test" }),
    await token({ exp: 1 }), await token({ aud: ["wrong-app"] }),
    await token({ iss: "https://attacker.example" }), await token({ nbf: 9999999999 }),
    await token({}, { alg: "HS256" }), await token({}, { kid: "wrong-key" }),
  ]) assert.equal((await request("/api/admin/portal", "GET", undefined, invalid)).status, 401);
  const parts = validToken.split(".");
  parts[2] = (parts[2][0] === "A" ? "B" : "A") + parts[2].slice(1);
  assert.equal((await request("/api/admin/portal", "GET", undefined, parts.join("."))).status, 401);
  assert.equal((await request("/api/admin/portal")).status, 200);
  const adminHtml = await (await request("/admin/")).text();
  assert(adminHtml.includes('data-catalog-source="portal" data-admin="true"'));
  pass("valid JWT; rejection of absent, forged, expired, wrong issuer/audience/key/email tokens.");

  const snapshot = await (await request("/api/admin/portal")).json();
  const update = structuredClone(snapshot);
  update.areas[0].name = "Dauerhaft gespeichert";
  update.areas[0].email = "private-recipient@example.test";
  update.areas[1].published = false;
  update.forms[0].published = false;
  for (const headers of [{ origin: "https://attacker.example" }, { origin: "" }, { "sec-fetch-site": "cross-site" }]) {
    assert.equal((await request("/api/admin/portal", "PUT", update, validToken, headers)).status, 403);
  }
  assert.equal((await request("/api/admin/portal", "PUT", update, null)).status, 401);
  assert.equal((await request("/api/admin/portal", "PUT", "{broken")).status, 400);
  const invalid = structuredClone(update);
  invalid.forms[0].categories = ["not-in-this-area"];
  assert.equal((await request("/api/admin/portal", "PUT", invalid)).status, 400);
  invalid.forms[0].categories = update.forms[0].categories;
  invalid.areas[0].image = { type: "stored", src: "javascript:alert(1)", name: "invalid" };
  assert.equal((await request("/api/admin/portal", "PUT", invalid)).status, 400);
  const races = await Promise.all([request("/api/admin/portal", "PUT", update), request("/api/admin/portal", "PUT", update)]);
  assert.deepEqual(races.map(r => r.status).sort(), [200, 409]);
  database.close();
  database = new DatabaseSync(path.join(temporary, "portal.sqlite"));
  const persisted = await (await request("/api/admin/portal")).json();
  assert.equal(persisted.areas[0].name, "Dauerhaft gespeichert");
  const published = await (await request("/api/portal", "GET", undefined, null)).json();
  assert(!JSON.stringify(published).includes("private-recipient"));
  assert(!published.areas.some(area => area.id === update.areas[1].id));
  assert(!published.forms.some(form => form.id === update.forms[0].id || form.area === update.areas[1].id));
  pass("persistence across SQLite reopen, server validation, CSRF, optimistic conflicts, drafts and recipient privacy.");

  const png = fs.readFileSync(path.join(root, "prototype/assets/Elim_Logo_L_Mini_Marine.png"));
  assert.equal((await request("/api/admin/media", "POST", png, null, { "content-type": "image/png" })).status, 401);
  assert.equal((await request("/api/admin/media", "POST", "not a png", validToken, { "content-type": "image/png" })).status, 400);
  assert.equal((await request("/api/admin/media", "POST", png, validToken, { "content-type": "image/jpeg" })).status, 400);
  assert.equal((await request("/api/admin/media", "POST", new Uint8Array(5 * 1024 * 1024 + 1), validToken, { "content-type": "image/png" })).status, 413);
  const upload = await request("/api/admin/media", "POST", png, validToken, { "content-type": "image/png" });
  assert.equal(upload.status, 201);
  const { src } = await upload.json();
  assert.equal((await request(src, "GET", undefined, null)).status, 404);
  assert.equal((await request(src.replace("/media/", "/api/admin/media/"))).status, 200);
  persisted.areas[0].image = { type: "stored", src, name: "test.png" };
  assert.equal((await request("/api/admin/portal", "PUT", persisted)).status, 200);
  assert.equal((await request(src, "GET", undefined, null)).status, 200);
  const fresh = await (await request("/api/admin/portal")).json();
  fresh.areas[0].published = false;
  assert.equal((await request("/api/admin/portal", "PUT", fresh)).status, 200);
  assert.equal((await request(src, "GET", undefined, null)).status, 404);
  pass("authenticated media uploads, MIME/signature/size validation and visibility of published versus draft images.");

  const adminEndpoint = "/api/admin/administrators";
  const accountPath = email => adminEndpoint + "/" + encodeURIComponent(email);
  const currentAdmin = async email => (await (await request(adminEndpoint)).json()).administrators.find(a => a.email === email);
  assert.equal((await request(adminEndpoint, "GET", undefined, null)).status, 401);
  assert.equal((await request(adminEndpoint, "POST", { name: "Blocked", email: "blocked@example.test" }, validToken, { origin: "https://attacker.example" })).status, 403);
  const self = await currentAdmin("admin@example.test");
  assert(self.isSelf && self.isLastActive && !self.canDelete && !self.canDeactivate);
  for (const method of ["PATCH", "DELETE"])
    assert.equal((await request(accountPath("ADMIN@EXAMPLE.TEST"), method, { version: self.version, ...(method === "PATCH" ? { active: false } : {}) })).status, 403);
  assert.throws(() => database.prepare("UPDATE admins SET active=0 WHERE email=?").run("admin@example.test"), /last_active_admin/);
  assert.throws(() => database.prepare("DELETE FROM admins WHERE email=?").run("admin@example.test"), /last_active_admin/);
  assert.equal((await request(adminEndpoint, "POST", { name: "", email: "bad" })).status, 400);
  assert.equal((await request(adminEndpoint, "POST", { name: "Second", email: "SECOND@EXAMPLE.TEST" })).status, 201);
  assert.equal((await request(adminEndpoint, "POST", { name: "Duplicate", email: "second@example.test" })).status, 409);
  const secondToken = await token({ email: "second@example.test" });
  assert.equal((await request("/api/admin/portal", "GET", undefined, secondToken)).status, 200);
  const secondSelf = (await (await request(adminEndpoint, "GET", undefined, secondToken)).json()).administrators.find(a => a.isSelf);
  assert.equal(secondSelf.email, "second@example.test");
  assert.equal((await request(accountPath("second@example.test"), "DELETE", { version: secondSelf.version }, secondToken)).status, 403);
  assert.equal((await request(accountPath("second@example.test"), "PATCH", { version: 1, active: false })).status, 200);
  for (const protectedPath of ["/admin/", "/api/admin/portal", adminEndpoint])
    assert.equal((await request(protectedPath, "GET", undefined, secondToken)).status, 401);
  assert.equal((await request(adminEndpoint, "POST", { name: "Escalate", email: "escalate@example.test" }, secondToken)).status, 401);
  assert.equal((await request(accountPath("second@example.test"), "PATCH", { version: 1, active: true })).status, 409);
  assert.equal((await request(accountPath("second@example.test"), "PATCH", { version: 2, active: true })).status, 200);
  assert.equal((await request("/api/admin/portal", "GET", undefined, secondToken)).status, 200);
  assert.equal((await request(accountPath("second@example.test"), "DELETE", { version: 3 })).status, 200);
  assert.equal((await request("/api/admin/portal", "GET", undefined, secondToken)).status, 401);
  assert.equal((await request(adminEndpoint, "POST", { name: "Inactive", email: "inactive@example.test" })).status, 201);
  assert.equal((await request(accountPath("inactive@example.test"), "PATCH", { version: 1, active: false })).status, 200);
  assert.equal((await request(accountPath("inactive@example.test"), "DELETE", { version: 2 })).status, 200);
  assert.equal((await request(adminEndpoint, "POST", { name: "Racing", email: "racing@example.test" })).status, 201);
  const racingToken = await token({ email: "racing@example.test" });
  const race = await Promise.all([
    request(accountPath("racing@example.test"), "PATCH", { version: 1, active: false }),
    request(accountPath("admin@example.test"), "PATCH", { version: 1, active: false }, racingToken),
  ]);
  assert.equal(race.filter(r => r.status === 200).length, 1);
  assert(race.some(r => [401,403,409].includes(r.status)));
  assert.equal(database.prepare("SELECT COUNT(*) AS n FROM admins WHERE active=1").get().n, 1);
  database.prepare("UPDATE admins SET active=1,version=1 WHERE email=?").run("admin@example.test");
  database.prepare("DELETE FROM admins WHERE email=?").run("racing@example.test");
  pass("administrator API: create, normalize, revoke existing sessions, reactivate, delete, duplicates, stale versions, self/last protection and concurrent revocation.");

  database.prepare("UPDATE portal_content SET version=1,data_json=? WHERE id='main'").run(JSON.stringify(initial));
  server = http.createServer(async (incoming, outgoing) => {
    try {
      const buffers = [];
      for await (const chunk of incoming) buffers.push(chunk);
      const response = await worker.fetch(new Request(base + incoming.url, {
        method: incoming.method, headers: incoming.headers,
        ...(["GET", "HEAD"].includes(incoming.method) ? {} : { body: Buffer.concat(buffers) }),
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
  const anonymous = await browser.newContext();
  const context = await browser.newContext({ extraHTTPHeaders: { "Cf-Access-Jwt-Assertion": validToken } });
  const page = await context.newPage(), publicPage = await anonymous.newPage();
  page.setDefaultTimeout(8000);
  publicPage.setDefaultTimeout(8000);
  const errors = [];
  context.on("page", p => p.on("pageerror", error => errors.push(error.message)));
  anonymous.on("page", p => p.on("pageerror", error => errors.push(error.message)));
  page.on("pageerror", error => errors.push(error.message));
  publicPage.on("pageerror", error => errors.push(error.message));
  await publicPage.goto(base);
  await publicPage.locator(".area-card").first().waitFor();
  assert.equal(await publicPage.locator(".area-card").count(), 3);
  assert.equal((await publicPage.goto(base + "/admin/")).status(), 401);
  await page.goto(base + "/admin/#admin/area/it");
  await page.locator(".admin-session").waitFor();
  const sessionAppearance = await page.locator(".admin-session").evaluate(session => ({
    background: getComputedStyle(session).backgroundImage,
    panelBackground: getComputedStyle(document.querySelector(".panel")).backgroundImage,
    emailFont: getComputedStyle(session.querySelector("strong")).fontFamily,
    bodyFont: getComputedStyle(document.body).fontFamily,
    logout: session.querySelector("a").getAttribute("href")
  }));
  assert.equal(sessionAppearance.background, sessionAppearance.panelBackground);
  assert.equal(sessionAppearance.emailFont, sessionAppearance.bodyFont);
  assert.equal(sessionAppearance.logout, "/cdn-cgi/access/logout");
  await page.locator("#area-name").fill("IT dauerhaft");
  await page.getByRole("button", { name: "Speichern", exact: true }).click();
  await page.waitForURL("**/#admin/areas");
  await page.reload();
  await page.getByRole("heading", { name: "IT dauerhaft", exact: true }).waitFor();
  await publicPage.goto(base);
  await publicPage.getByRole("heading", { name: "IT dauerhaft", exact: true }).waitFor();
  for (const name of ["Entwurf eins", "Entwurf zwei"]) {
    await page.goto(base + "/admin/#admin/area/new");
    await page.locator("#area-name").fill(name);
    await page.locator("#area-description").fill("Noch nicht öffentlich");
    await page.locator("#area-email").fill("draft@example.test");
    await page.getByRole("button", { name: "Speichern", exact: true }).click();
    await page.waitForURL("**/#admin/areas");
    await page.reload();
    await page.getByRole("heading", { name, exact: true }).waitFor();
  }
  await publicPage.reload();
  await publicPage.locator(".area-card").first().waitFor();
  assert.equal(await publicPage.locator(".area-card").count(), 3);
  pass("browser admin save/reload, public update, two distinct new drafts surviving reload without public leakage.");

  await page.goto(base + "/admin/#admin/form/microsoft365");
  await page.locator("#form-title").fill("Microsoft dauerhaft");
  await page.getByRole("button", { name: "Speichern", exact: true }).click();
  await page.waitForURL("**/#admin/forms");
  await publicPage.goto(base + "/#form/microsoft365");
  await publicPage.reload();
  await publicPage.locator("#request-form").waitFor();
  assert.equal(await publicPage.locator("#request-title").textContent(), "Microsoft dauerhaft");
  const contactAppearance = await publicPage.locator(".aside").evaluate(aside => ({
    paragraphs: [...aside.querySelectorAll("p")].map(p => ({
      size: getComputedStyle(p).fontSize,
      family: getComputedStyle(p).fontFamily
    })),
    bodyFamily: getComputedStyle(document.body).fontFamily,
    bodySize: getComputedStyle(document.body).fontSize
  }));
  assert.equal(contactAppearance.paragraphs.length, 2, "Contact card should explain delivery and reply once each");
  for (const paragraph of contactAppearance.paragraphs) {
    assert.equal(paragraph.size, contactAppearance.bodySize);
    assert.equal(paragraph.family, contactAppearance.bodyFamily);
  }
  await page.goto(base + "/admin/#admin/area/it");
  const buffer = await page.evaluate(() => {
    const canvas = document.createElement("canvas"); canvas.width = 200; canvas.height = 200;
    const ctx = canvas.getContext("2d"); ctx.fillStyle = "red"; ctx.fillRect(50,50,100,100);
    return canvas.toDataURL("image/png").split(",")[1];
  });
  await page.locator("#area-image-file").setInputFiles({ name: "transparent.png", mimeType: "image/png", buffer: Buffer.from(buffer, "base64") });
  await page.getByText("Aktuelles Bild: transparent", { exact: false }).waitFor();
  await page.getByRole("button", { name: "Speichern", exact: true }).click();
  await page.waitForURL("**/#admin/areas");
  await publicPage.goto(base);
  const image = publicPage.locator('a[href="#area/it"] img');
  await image.waitFor();
  assert((await image.getAttribute("src")).startsWith("/media/"));
  assert(await image.evaluate(img => img.decode().then(() => img.naturalWidth === 1536)));
  await page.goto(base + "/admin/#admin/area/it");
  await page.locator("#download-area-image").waitFor();
  assert((await page.locator("#download-area-image").getAttribute("href")).startsWith("/api/admin/media/"));
  pass("persisted form edit and normalized image upload, public delivery and protected admin download.");

  await page.goto(base + "/admin/#admin/form/wlan-anleitung");
  await page.locator("#guide-image-files").setInputFiles({ name: "guide.png", mimeType: "image/png", buffer: Buffer.from(buffer, "base64") });
  const addedImage = page.locator(".guide-image-editor").nth(1);
  await addedImage.locator('[data-image-property="alt"]').fill("Dauerhaftes Anleitungsbild");
  await page.getByRole("button", { name: "Speichern", exact: true }).click();
  await page.waitForURL("**/#admin/forms");
  await publicPage.goto(base + "/#form/wlan-anleitung");
  await publicPage.reload();
  const guideImage = publicPage.getByRole("img", { name: "Dauerhaftes Anleitungsbild", exact: true });
  await guideImage.waitFor();
  assert((await guideImage.getAttribute("src")).startsWith("/media/"));
  assert(await guideImage.evaluate(img => img.decode().then(() => img.naturalWidth > 0)));
  await page.goto(base + "/admin/#admin/area/it");
  const second = await context.newPage();
  await second.goto(base + "/admin/#admin/area/it");
  await second.locator("#area-name").waitFor();
  await page.locator("#area-name").fill("Neuer Stand");
  await page.getByRole("button", { name: "Speichern", exact: true }).click();
  await page.waitForURL("**/#admin/areas");
  await second.locator("#area-name").fill("Nicht überschreiben");
  await second.getByRole("button", { name: "Speichern", exact: true }).click();
  await second.getByRole("alert").filter({ hasText: "Inzwischen" }).waitFor();
  assert.equal(await second.locator("#area-name").inputValue(), "Nicht überschreiben");
  assert(second.url().endsWith("#admin/area/it"));
  await page.goto(base + "/admin/#admin/area/it");
  await page.locator("#area-name").fill("Nicht bei abgelaufener Anmeldung speichern");
  await context.setExtraHTTPHeaders({ "Cf-Access-Jwt-Assertion": await token({ exp: 1 }) });
  await page.getByRole("button", { name: "Speichern", exact: true }).click();
  await page.getByRole("alert").filter({ hasText: "anmelden" }).waitFor();
  assert.equal(await page.locator("#area-name").inputValue(), "Nicht bei abgelaufener Anmeldung speichern");
  assert.deepEqual(errors, []);
  pass("guide-image persistence, stale browser tab and expired login preserve unsaved inputs; no browser errors.");
  await context.setExtraHTTPHeaders({ "Cf-Access-Jwt-Assertion": validToken });
  await page.goto(base + "/admin/#admin/areas");
  await page.getByRole("link", { name: "Administratoren", exact: true }).click();
  await page.getByRole("heading", { name: "Administratoren", exact: true }).waitFor();
  const ownCard = page.locator(".administrator-account").filter({ hasText: "admin@example.test" });
  await ownCard.waitFor();
  assert(await ownCard.getByRole("button", { name: "Inaktiv setzen", exact: true }).isDisabled());
  assert(await ownCard.getByRole("button", { name: "Löschen", exact: true }).isDisabled());
  await page.locator("#administrator-name").fill("Neue Administratorin");
  await page.locator("#administrator-email").fill("new.person@example.test");
  await page.getByRole("button", { name: "Administrator anlegen", exact: true }).click();
  await page.locator("#administrator-status").filter({ hasText: "wurde angelegt" }).waitFor();
  await page.reload();
  const newCard = page.locator(".administrator-account").filter({ hasText: "new.person@example.test" });
  await newCard.waitFor();
  const newPerson = await context.newPage();
  await newPerson.setExtraHTTPHeaders({ "Cf-Access-Jwt-Assertion": await token({ email: "new.person@example.test" }) });
  assert.equal((await newPerson.goto(base + "/admin/")).status(), 200);
  await newPerson.getByRole("link", { name: "Administratoren", exact: true }).click();
  await newPerson.getByText("Dein eigenes Konto ist geschützt.", { exact: true }).waitFor();
  await newCard.getByRole("button", { name: "Inaktiv setzen", exact: true }).click();
  await page.locator("#administrator-status").filter({ hasText: "inaktiv gesetzt" }).waitFor();
  assert.equal((await newPerson.reload()).status(), 401);
  await newCard.getByRole("button", { name: "Aktivieren", exact: true }).click();
  await page.locator("#administrator-status").filter({ hasText: "wurde aktiviert" }).waitFor();
  assert.equal((await newPerson.goto(base + "/admin/")).status(), 200);
  await page.locator("#administrator-name").fill("Doppelt");
  await page.locator("#administrator-email").fill("NEW.PERSON@EXAMPLE.TEST");
  await page.getByRole("button", { name: "Administrator anlegen", exact: true }).click();
  await page.locator("#administrator-error").filter({ hasText: "bereits" }).waitFor();
  assert.equal(await page.locator("#administrator-name").inputValue(), "Doppelt");
  await newCard.getByRole("button", { name: "Inaktiv setzen", exact: true }).click();
  await page.locator("#administrator-status").filter({ hasText: "inaktiv gesetzt" }).waitFor();
  page.once("dialog", dialog => dialog.accept());
  await newCard.getByRole("button", { name: "Löschen", exact: true }).click();
  await page.locator("#administrator-status").filter({ hasText: "wurde gelöscht" }).waitFor();
  assert.equal(await newCard.count(), 0);
  assert.equal((await newPerson.goto(base + "/admin/")).status(), 401);
  for (const width of [768,390,320]) {
    await page.setViewportSize({ width, height: 900 });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  }
  assert.deepEqual(errors, []);
  pass("administrator browser UI: navigation, own-account locks, create/reload, active login, immediate revocation, reactivation, duplicate error, confirmed deletion and mobile widths.");
  console.log(JSON.stringify({ passed }));
} finally {
  globalThis.fetch = realFetch;
  if (browser) await browser.close();
  if (server) await new Promise(resolve => server.close(resolve));
  if (database) database.close();
  fs.rmSync(temporary, { recursive: true, force: true });
}
