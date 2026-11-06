let playwright;
try {
  playwright = require("playwright");
} catch {
  playwright = require("/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
}
const { chromium } = playwright;
const fs = require("node:fs"),
  http = require("node:http"),
  assert = require("node:assert/strict"),
  crypto = require("node:crypto");
(async () => {
  const root = require("node:path").resolve(__dirname, "../prototype");
  const html = fs.readFileSync(root + "/index.html");
  const server = http.createServer((req, res) => {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(html);
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  let browser;
  let passed = 0;
  const pass = (text) => {
    passed++;
    console.log("OK: " + text);
  };
  try {
    const executablePath =
      process.env.CHROMIUM_PATH ||
      (fs.existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined);
    browser = await chromium.launch({
      headless: true,
      ...(executablePath ? { executablePath } : {}),
    });
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      locale: "de-DE",
    });
    const base = "http://127.0.0.1:" + server.address().port;
    await context.grantPermissions(["clipboard-read", "clipboard-write"], {
      origin: base,
    });
    const page = await context.newPage();
    page.setDefaultTimeout(8000);
    const errors = [];
    context.on("page", (p) => p.on("pageerror", (e) => errors.push(e.message)));
    page.on("pageerror", (e) => errors.push(e.message));
    const visit = (route) => page.goto(base + "/#" + route);
    const pictures = () =>
      page.locator("img").evaluateAll((images) =>
        Promise.all(
          images.map((image) => {
            image.loading = "eager";
            return image.decode();
          }),
        ),
      );
    const save = () =>
      page
        .getByRole("button", { name: "In Vorschau speichern", exact: true })
        .click();
    await page.goto(base + "/?preview=1#home");
    await pictures();
    assert.equal(await page.locator(".area-card").count(), 3);
    const areaImageMetrics = await page.locator(".area-art").evaluateAll(
      (frames) =>
        frames.map((frame) => {
          const image = frame.querySelector("img"),
            rect = frame.getBoundingClientRect();
          return {
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            naturalWidth: image.naturalWidth,
            naturalHeight: image.naturalHeight,
            objectFit: getComputedStyle(image).objectFit,
          };
        }),
    );
    assert(
      areaImageMetrics.every(
        (metric) =>
          metric.width === areaImageMetrics[0].width &&
          metric.height === areaImageMetrics[0].height &&
          metric.naturalWidth === 1536 &&
          metric.naturalHeight === 1024 &&
          metric.objectFit === "contain",
      ),
    );
    assert.equal(await page.locator(".request-card").count(), 0);
    assert.equal(
      await page
        .locator(".areas")
        .evaluate(
          (el) => getComputedStyle(el).gridTemplateColumns.split(" ").length,
        ),
      2,
    );
    const logo = await page.locator("header .brand-logo").getAttribute("src");
    assert.equal(
      crypto
        .createHash("sha256")
        .update(Buffer.from(logo.split(",")[1], "base64"))
        .digest("hex"),
      "9658f8152049cc9a5f2b28cece646c95cadfa21987f441a7c2bb7f7da7eff9cb",
    );
    assert.equal(
      await page
        .getByRole("link", { name: "Admin-Bereich", exact: true })
        .evaluate((el) => getComputedStyle(el).textDecorationLine),
      "none",
    );
    await page.screenshot({
      path: "/tmp/elim-rekonstruktion-startseite.png",
      fullPage: true,
    });
    await page
      .locator("#portal-search")
      .fill("Ich brauche ein neues Microsoft Konto");
    assert.equal(
      await page.locator(".request-card").first().getAttribute("href"),
      "#form/microsoft365",
    );
    await page.locator(".request-card").first().click();
    await page
      .getByRole("dialog", { name: "Microsoft-365-Konto beantragen" })
      .waitFor();
    await page.locator("#request-name").fill("Beispielperson");
    const geometry = () => page.locator("#request-title").boundingBox();
    const before = await geometry();
    await page.locator("#copy-request-link").click();
    await page
      .getByRole("button", { name: "Link kopiert", exact: true })
      .waitFor();
    const shared = await page.evaluate(() => navigator.clipboard.readText());
    assert.equal(shared, base + "/#form/microsoft365");
    assert.deepEqual(await geometry(), before);
    assert.equal(await page.locator("#share-panel,#share-url").count(), 0);
    await page.screenshot({ path: "/tmp/elim-rekonstruktion-formular.png" });
    for (let i = 0; i < 16; i++) {
      await page.keyboard.press("Tab");
      assert(
        await page
          .locator("#request-dialog")
          .evaluate((dialog) => dialog.contains(document.activeElement)),
      );
    }
    await page.keyboard.press("Escape");
    assert.equal(
      await page.locator("#portal-search").inputValue(),
      "Ich brauche ein neues Microsoft Konto",
    );
    await page.locator(".request-card").first().click();
    await page.locator("dialog[open]").waitFor();
    assert.equal(
      await page.locator("#request-name").inputValue(),
      "Beispielperson",
    );
    const tab = await context.newPage();
    await tab.goto(shared);
    await tab
      .getByRole("dialog", { name: "Microsoft-365-Konto beantragen" })
      .waitFor();
    assert.equal(await tab.locator("#request-name").inputValue(), "");
    await tab.reload();
    await tab.locator("dialog[open]").waitFor();
    await tab.close();
    pass(
      "Original-Logo, Startseite, Suchtreffer, echter Direktlink und Kopierbestätigung; Dialogfokus und Erhalt desselben Formularentwurfs.",
    );
    await visit("area/it");
    await page.locator("#area-category").selectOption("hilfe");
    await page.locator("#area-search").fill("Flugmodus");
    assert.equal(await page.locator(".request-card").count(), 1);
    await page.locator(".request-card").click();
    await page
      .getByRole("dialog", { name: "WLAN-Verbindung selbst prüfen" })
      .waitFor();
    await pictures();
    assert.equal(await page.locator(".guide-article p").count(), 3);
    assert.equal(await page.locator(".guide-article img").count(), 1);
    assert.deepEqual(
      await page
        .locator("#request-form input,#request-form textarea")
        .evaluateAll((els) => els.map((el) => el.id)),
      ["request-email", "request-subject", "request-description"],
    );
    await page.locator("#request-email").fill("person@example.org");
    await page.locator("#request-description").fill("Ich brauche noch Hilfe.");
    await page
      .getByRole("button", { name: "E-Mail-Versand simulieren" })
      .click();
    await page
      .getByRole("dialog", { name: "So sieht die Bestätigung aus." })
      .waitFor();
    await page.locator("#copy-request-link").click();
    await page
      .getByRole("button", { name: "Link kopiert", exact: true })
      .waitFor();
    assert.equal(
      new URL(await page.evaluate(() => navigator.clipboard.readText())).hash,
      "#form/wlan-anleitung",
    );
    await page.getByRole("link", { name: "Anleitung erneut ansehen" }).click();
    assert.equal(await page.locator("#request-email").inputValue(), "");
    await page.keyboard.press("Escape");
    assert.equal(await page.locator("#area-category").inputValue(), "hilfe");
    assert.equal(await page.locator("#area-search").inputValue(), "Flugmodus");
    await visit("form/haus-schaden");
    await page.locator("#request-name").fill("Beispielperson");
    await page.locator("#request-email").fill("person@example.org");
    await page.locator("#custom-ort").fill("Saal");
    await page.locator("#custom-art").selectOption("Sonstiges");
    await page.locator("#request-description").fill("Ein Beispielschaden.");
    const pdf = {
      name: "beleg.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4 Beispiel"),
    };
    await page
      .locator("#request-files")
      .setInputFiles(
        Array.from({ length: 4 }, (_, i) => ({ ...pdf, name: i + ".pdf" })),
      );
    await page.getByRole("button", { name: "Absenden simulieren" }).click();
    await page.getByText("Bitte höchstens drei Dateien auswählen.").waitFor();
    await page
      .locator("#request-files")
      .setInputFiles({ ...pdf, buffer: Buffer.alloc(10 * 1024 * 1024 + 1) });
    await page.getByRole("button", { name: "Absenden simulieren" }).click();
    await page
      .getByText("Die Dateien dürfen zusammen höchstens 10 MB groß sein.")
      .waitFor();
    await page
      .locator("#request-files")
      .setInputFiles({
        name: "test.svg",
        mimeType: "image/svg+xml",
        buffer: Buffer.from("<svg/>"),
      });
    await page.getByRole("button", { name: "Absenden simulieren" }).click();
    await page
      .getByText("Bitte nur JPG-, PNG-, WebP- oder PDF-Dateien auswählen.")
      .waitFor();
    await page.locator("#request-files").setInputFiles(pdf);
    await page.keyboard.press("Escape");
    await visit("form/haus-schaden");
    assert.equal(
      await page.locator("#request-files").evaluate((el) => el.files.length),
      1,
    );
    await page.getByRole("button", { name: "Absenden simulieren" }).click();
    await page
      .getByRole("dialog", { name: "So sieht die Bestätigung aus." })
      .waitFor();
    pass(
      "Bereichssuche und Kategorien, Anleitung mit Bild und Kontaktfeldern, simulierter Versand und drei Uploadgrenzen.",
    );
    const png = Buffer.from(
      await page.evaluate(() => {
        const c = document.createElement("canvas");
        c.width = 320;
        c.height = 200;
        const ctx = c.getContext("2d");
        ctx.fillStyle = "#eae5dd";
        ctx.fillRect(20, 20, 280, 160);
        return c.toDataURL("image/png").split(",")[1];
      }),
      "base64",
    );
    await visit("admin/area/it");
    assert.equal(await page.locator("a[download]").count(), 1);
    assert.equal(
      await page.locator("#download-area-image").getAttribute("download"),
      "Elim-Bereich-IT.webp",
    );
    const downloadPromise = page.waitForEvent("download");
    await page.locator("#download-area-image").click();
    const downloadedImage = await downloadPromise;
    assert.equal(downloadedImage.suggestedFilename(), "Elim-Bereich-IT.webp");
    assert.equal(
      fs.readFileSync(await downloadedImage.path()).subarray(0, 4).toString(),
      "RIFF",
    );
    await visit("admin/area/new");
    assert.equal(await page.locator("a[download]").count(), 0);
    assert.equal(await page.locator("#area-image-choice").count(), 0);
    await page.locator("#area-name").fill("Veranstaltungen");
    await page
      .locator("#area-description")
      .fill("Anfragen zu Veranstaltungen.");
    await page.locator("#area-email").fill("events@example.org");
    await page.locator("#area-published").check();
    await save();
    assert.equal(new URL(page.url()).hash, "#admin/area/new");
    assert(
      await page
        .locator("#area-image-file")
        .evaluate((el) => !el.checkValidity()),
    );
    await page.locator("#area-published").uncheck();
    await save();
    await page.waitForURL("**/#admin/areas");
    const row = page
      .locator(".manage-card")
      .filter({
        has: page.getByRole("heading", {
          name: "Veranstaltungen",
          exact: true,
        }),
      });
    const editRoute = (
        await row.getByRole("link", { name: "Bearbeiten" }).getAttribute("href")
      ).slice(1),
      areaId = editRoute.split("/").at(-1);
    await visit("home");
    assert.equal(await page.locator(".area-card").count(), 3);
    await visit(editRoute);
    await page.locator("#area-image-file").setInputFiles({
      name: "veranstaltungen.png",
      mimeType: "image/png",
      buffer: png,
    });
    await page.waitForFunction(
      () =>
        document.querySelector("#area-image-preview img")?.naturalWidth ===
        1536,
    );
    const preset = await page
      .locator("#area-image-preview img")
      .getAttribute("src");
    await page.locator("#area-icon").selectOption("finance");
    assert.equal(
      await page.locator("#area-image-preview img").getAttribute("src"),
      preset,
    );
    await page.locator("#area-published").check();
    await save();
    await page.waitForURL("**/#admin/areas");
    await visit("home");
    assert.equal(await page.locator(".area-card").count(), 4);
    await visit("area/" + areaId);
    assert.equal(
      await page.locator(".area-banner-art img").getAttribute("src"),
      preset,
    );
    assert.equal(await page.locator("#area-category").count(), 0);
    await visit(editRoute);
    await page
      .locator("#area-image-file")
      .setInputFiles({
        name: "defekt.png",
        mimeType: "image/png",
        buffer: Buffer.from("kein Bild"),
      });
    await page
      .getByText(
        "Das Bild konnte nicht gelesen werden. Bitte verwende eine gültige Bilddatei.",
      )
      .waitFor();
    const opaquePng = Buffer.from(
      await page.evaluate(() => {
        const c = document.createElement("canvas");
        c.width = 320;
        c.height = 200;
        const ctx = c.getContext("2d");
        ctx.fillStyle = "#eae5dd";
        ctx.fillRect(0, 0, 320, 200);
        return c.toDataURL("image/png").split(",")[1];
      }),
      "base64",
    );
    await page
      .locator("#area-image-file")
      .setInputFiles({
        name: "ohne-transparenz.png",
        mimeType: "image/png",
        buffer: opaquePng,
      });
    await page
      .getByText(
        "Das Bereichsbild benötigt einen transparenten Hintergrund. Verwende bitte ein freigestelltes PNG oder WebP.",
      )
      .waitFor();
    await page.locator("#area-image-file").setInputFiles({
      name: "test.png",
      mimeType: "image/png",
      buffer: png,
    });
    await page.waitForFunction(
      () =>
        document.querySelector("#area-image-preview img")?.naturalWidth ===
          1536 &&
        document.querySelector("#area-image-preview img")?.naturalHeight ===
          1024,
    );
    assert.equal(
      await page.locator("#download-area-image").getAttribute("download"),
      "test-transparent-1536x1024.png",
    );
    await save();
    await page.waitForURL("**/#admin/areas");
    await visit("area/" + areaId);
    assert.equal(
      await page
        .locator(".area-banner-art img")
        .evaluate((el) => el.naturalWidth),
      1536,
    );
    await visit(editRoute);
    await page.locator("#remove-area-image").click();
    await save();
    assert.equal(new URL(page.url()).hash, "#" + editRoute);
    await page.getByRole("link", { name: "Abbrechen", exact: true }).click();
    await visit("area/" + areaId);
    assert.equal(
      await page
        .locator(".area-banner-art img")
        .evaluate((el) => el.naturalWidth),
      1536,
    );
    pass(
      "Bereichsentwürfe ohne Bild, Bildpflicht beim Veröffentlichen, bereichseigener Bilddownload, transparenter vereinheitlichter Upload und Abbrechen ohne Datenänderung.",
    );
    await visit("admin/form/new");
    await page.locator("#form-title").fill("Selbsthilfe im Saal");
    await page
      .locator("#form-description")
      .fill("Eine neue Beispielanleitung.");
    await page.locator("#form-type").selectOption("guide");
    assert(await page.locator("#form-settings").evaluate((el) => el.disabled));
    await page
      .locator("#guide-text")
      .fill(
        "Erster Absatz.\n\nZweiter Absatz.\n\n<script>window.injected=true</script>",
      );
    await page
      .locator("#guide-image-files")
      .setInputFiles({
        name: "test.svg",
        mimeType: "image/svg+xml",
        buffer: Buffer.from("<svg/>"),
      });
    await page
      .getByText(
        "Bitte nur JPG, PNG oder WebP mit maximal 5 MB pro Bild hinzufügen.",
      )
      .waitFor();
    await page
      .locator("#guide-image-files")
      .setInputFiles({ name: "test.png", mimeType: "image/png", buffer: png });
    await page.locator("[data-guide-image]").waitFor();
    await page.locator("#form-published").check();
    await page.getByRole("button", { name: "Speichern und ansehen" }).click();
    assert(
      await page
        .locator("[data-image-property=alt]")
        .evaluate((el) => el.validity.valueMissing),
    );
    await page
      .locator("[data-image-property=alt]")
      .fill("Schematisches Beispielbild");
    await page
      .locator("[data-image-property=caption]")
      .fill("Bild zur Orientierung.");
    await page.locator("[data-image-property=position]").fill("2");
    await page.getByRole("button", { name: "Speichern und ansehen" }).click();
    await page.getByRole("dialog", { name: "Selbsthilfe im Saal" }).waitFor();
    const guideId = new URL(page.url()).hash.split("/").at(-1);
    assert.equal(await page.locator(".guide-article p").count(), 3);
    assert.equal(await page.evaluate(() => window.injected), undefined);
    assert(
      (await page.locator(".guide-article").innerText()).includes("<script>"),
    );
    await visit("admin/form/" + guideId);
    await page.locator("#form-type").selectOption("form");
    await page.locator("#add-field").click();
    let field = page.locator("[data-field-row]").last();
    await field.locator("[data-property=label]").fill("Welche Ausstattung?");
    await field.locator("[data-property=type]").selectOption("multiselect");
    await field.locator("[data-property=options]").fill("Ton, Licht");
    await field.locator("[data-property=required]").check();
    await page.getByRole("button", { name: "Speichern und ansehen" }).click();
    await page.locator("dialog[open]").waitFor();
    assert.equal(await page.locator(".guide-article").count(), 0);
    await page.locator("#request-name").fill("Beispielperson");
    await page.locator("#request-email").fill("person@example.org");
    await page.locator("#request-description").fill("Bitte helfen.");
    await page.getByRole("button", { name: "Absenden simulieren" }).click();
    await page
      .getByText(
        "Bitte bei „Welche Ausstattung?“ mindestens eine Auswahl treffen.",
      )
      .waitFor();
    await page.locator("#request-form input[type=checkbox]").first().check();
    await page.getByRole("button", { name: "Absenden simulieren" }).click();
    await page
      .getByRole("dialog", { name: "So sieht die Bestätigung aus." })
      .waitFor();
    await visit("admin/form/" + guideId);
    await page.locator("#form-type").selectOption("guide");
    assert.equal(await page.locator("[data-guide-image]").count(), 1);
    await page.locator("#form-published").uncheck();
    await save();
    await page.waitForURL("**/#admin/forms");
    await visit("form/" + guideId);
    await page
      .getByRole("dialog", { name: "Hier ist noch nichts veröffentlicht." })
      .waitFor();
    assert(await page.locator("#copy-request-link").isDisabled());
    pass(
      "Anleitungspflege mit Bildbeschreibung und Absatzposition, HTML als Text, Wechsel der Anliegenart, Pflicht-Mehrfachauswahl und unveröffentlichte Inhalte.",
    );
    await page.goto(base + "/#home");
    await page.reload();
    for (const name of [
      "Veranstaltungen",
      "Gemeindebüro",
      "Musik",
      "Kinder",
      "Kommunikation",
    ]) {
      await visit("admin/area/new");
      await page.locator("#area-name").fill(name);
      await page
        .locator("#area-description")
        .fill("Ein weiterer Beispielbereich.");
      await page.locator("#area-email").fill("test@example.org");
      await page.locator("#area-image-file").setInputFiles({
        name: name.toLowerCase() + ".png",
        mimeType: "image/png",
        buffer: png,
      });
      await page.waitForFunction(
        () =>
          document.querySelector("#area-image-preview img")?.naturalWidth ===
          1536,
      );
      await page.locator("#area-published").check();
      await save();
      await page.waitForURL("**/#admin/areas");
    }
    await visit("home");
    await pictures();
    assert.equal(await page.locator(".area-card").count(), 8);
    await page.evaluate(() => scrollTo(0, 350));
    await page.waitForFunction(
      () =>
        Math.abs(
          document.querySelector(".home-search-panel").getBoundingClientRect()
            .top - 24,
        ) < 1,
    );
    let first = await page.locator("#portal-search").boundingBox();
    await page.evaluate(() => scrollTo(0, 650));
    let second = await page.locator("#portal-search").boundingBox();
    assert(Math.abs(first.y - second.y) < 1);
    await page.evaluate(() =>
      scrollTo(0, document.documentElement.scrollHeight),
    );
    assert(
      await page
        .locator(".home-search-panel")
        .evaluate(
          (el) =>
            el.getBoundingClientRect().bottom <=
            document.querySelector("footer").getBoundingClientRect().top,
        ),
    );
    await page.locator("#portal-search").fill("WLAN");
    await page.waitForFunction(
      () =>
        document.querySelector("#search-results").getBoundingClientRect().top >=
        23,
    );
    await page.reload();
    for (const area of ["haus", "finanzen"]) {
      await visit("area/" + area);
      await pictures();
      assert(
        Math.abs(
          (await page.locator("footer").boundingBox()).y +
            (await page.locator("footer").boundingBox()).height -
            1000,
        ) < 1,
      );
      await page.screenshot({
        path: "/tmp/elim-rekonstruktion-" + area + ".png",
        fullPage: true,
      });
    }
    const routes = [
      "home",
      "area/it",
      "area/haus",
      "area/finanzen",
      "form/haus-schaden",
      "form/wlan-anleitung",
      "admin/areas",
      "admin/area/it",
      "admin/form/wlan-anleitung",
      "admin/form/new",
    ];
    for (const width of [768, 390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      for (const route of routes) {
        await visit(route);
        assert(
          await page.evaluate(
            () =>
              document.documentElement.scrollWidth <=
              document.documentElement.clientWidth,
          ),
          width + ": " + route,
        );
        if (route.startsWith("form/"))
          assert(
            await page
              .locator("#request-dialog")
              .evaluate((el) => el.scrollWidth <= el.clientWidth),
            width + ": Dialog",
          );
      }
      if (width === 390) {
        await visit("home");
        await pictures();
        await page.screenshot({
          path: "/tmp/elim-rekonstruktion-mobil.png",
          fullPage: true,
        });
      }
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await visit("admin/area/it");
    await pictures();
    await page.screenshot({
      path: "/tmp/elim-rekonstruktion-admin.png",
      fullPage: true,
    });
    assert.deepEqual(errors, []);
    pass(
      "Mitlaufende Suche mit acht Bereichen, Footer bei kurzen Seiten und alle Ansichten bei 768/390/320 px ohne Überlauf oder JavaScript-Fehler.",
    );
    console.log(JSON.stringify({ passed }));
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
