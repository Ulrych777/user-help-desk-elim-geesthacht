"use strict";
// Rekonstruktion des Oberflächenprototyps. Keine Anmeldung, Speicherung oder E-Mail-Anbindung.
const $ = (id) => document.getElementById(id);
const app = $("main-content"),
  dialog = $("request-dialog"),
  slot = $("anfrage");
const images = JSON.parse($("prototype-images").textContent);
const usesCatalogApi = document.body.dataset.catalogSource === "api";
const usesPortalApi = document.body.dataset.catalogSource === "portal";
const adminDocument = usesPortalApi && document.body.dataset.admin === "true";
let portalVersion = 0, adminEmail = "";
let mailSettings = { enabled: false, siteKey: "" }, defaultRecipient = "";
let challengeScript;
let catalogReady = !usesCatalogApi && !usesPortalApi;
const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
const symbols = {
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  "arrow-up": '<path d="M12 19V5m-6 6 6-6 6 6"/>',
  "arrow-down": '<path d="M12 5v14m-6-6 6 6 6-6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  copy: '<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M5 21h14"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
};
const icon = (name) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${symbols[name] || symbols.info}</svg>`;
const asset = (name) => images[name] || "";
document.documentElement.style.setProperty(
  "--area-decor",
  `url("${asset("hintergrund-pflanze.webp")}")`,
);
document
  .querySelectorAll("img[data-asset]")
  .forEach((image) => (image.src = asset(image.dataset.asset)));
let sequence = 0;
const newId = (prefix) => usesPortalApi
  ? prefix + "-" + crypto.randomUUID()
  : prefix + "-" + ++sequence;
const areaImageLibrary = [
  {
    id: "it",
    name: "IT und Technik",
    src: "bereich-it.webp",
    filename: "Elim-Bereich-IT.webp",
  },
  {
    id: "house",
    name: "Haus und Gebäude",
    src: "bereich-haus.webp",
    filename: "Elim-Bereich-Haus-und-Hof.webp",
  },
  {
    id: "finance",
    name: "Finanzen und Buchhaltung",
    src: "bereich-finanzen.webp",
    filename: "Elim-Bereich-Finanzbuchhaltung.webp",
  },
];
const areas = [
  {
    id: "it",
    name: "IT",
    description: "Unterstützung bei Computern, Software, Netzwerk und mehr.",
    icon: "it",
    image: { type: "library", id: "it" },
    email: "it@example.org",
    published: true,
    categories: [
      { id: "hilfe", name: "Hilfe & Störungen" },
      { id: "konten", name: "Konten & Zugänge" },
      { id: "software", name: "Software & Zusammenarbeit" },
    ],
  },
  {
    id: "haus",
    name: "Haus & Hof",
    description: "Anliegen rund um Gebäude, Technik und Außenanlagen.",
    icon: "house",
    image: { type: "library", id: "house" },
    email: "hausmeister@example.org",
    published: true,
    categories: [
      { id: "gebaeude", name: "Gebäude & Ausstattung" },
      { id: "aussen", name: "Außenanlagen" },
    ],
  },
  {
    id: "finanzen",
    name: "Finanzbuchhaltung",
    description: "Fragen zu Rechnungen, Zahlungen und finanziellen Prozessen.",
    icon: "finance",
    image: { type: "library", id: "finance" },
    email: "finanzen@example.org",
    published: true,
    categories: [{ id: "erstattungen", name: "Erstattungen" }],
  },
];
const forms = [
  {
    id: "it-allgemein",
    area: "it",
    title: "Allgemeine IT-Anfrage",
    description:
      "Du brauchst Hilfe oder bist unsicher, welches Anliegen passt?",
    categories: ["hilfe"],
    keywords: "Hilfe Technik Computer Drucker Störung",
    upload: true,
    published: true,
    fields: [],
  },
  {
    id: "microsoft365",
    area: "it",
    title: "Microsoft-365-Konto beantragen",
    description:
      "Ein neues Konto für deine Mitarbeit in der Gemeinde anfragen.",
    categories: ["konten", "software"],
    keywords: "Microsoft Office Teams E-Mail Zugang Benutzer Lizenz M365",
    upload: false,
    published: true,
    fields: [
      {
        id: "team",
        label: "In welchem Team arbeitest du mit?",
        type: "text",
        required: true,
        options: [],
      },
      {
        id: "start",
        label: "Ab wann wird das Konto benötigt?",
        type: "date",
        required: false,
        options: [],
      },
    ],
  },
  {
    id: "wlan-problem",
    area: "it",
    title: "WLAN-Problem melden",
    description:
      "Du kommst nicht ins WLAN oder die Internetverbindung funktioniert nicht?",
    categories: ["hilfe"],
    keywords:
      "WLAN WiFi Internet Netzwerk Verbindung funktioniert verbindet Problem Störung",
    upload: true,
    published: true,
    fields: [
      {
        id: "wlan-ort",
        label: "Wo tritt das Problem auf?",
        type: "text",
        required: true,
        options: [],
      },
    ],
  },
  {
    id: "wlan-zugang",
    area: "it",
    title: "Mitarbeiter-WLAN-Zugang beantragen",
    description: "Einen neuen Zugang zum WLAN für deine Mitarbeit anfragen.",
    categories: ["konten"],
    keywords: "WLAN WiFi Zugang beantragen neu Mitarbeiter",
    upload: false,
    published: true,
    fields: [],
  },
  {
    id: "haus-schaden",
    area: "haus",
    title: "Schaden am Gebäude melden",
    description:
      "Eine Beschädigung oder einen Reparaturbedarf mit Foto melden.",
    categories: ["gebaeude"],
    keywords: "Schaden Reparatur kaputt Gebäude Heizung Tür Licht",
    upload: true,
    published: true,
    fields: [
      {
        id: "ort",
        label: "Wo befindet sich der Schaden?",
        type: "text",
        required: true,
        options: [],
      },
      {
        id: "art",
        label: "Welcher Bereich ist betroffen?",
        type: "select",
        required: true,
        options: [
          "Raum oder Ausstattung",
          "Heizung oder Sanitär",
          "Elektrik oder Beleuchtung",
          "Sonstiges",
        ],
      },
    ],
  },
  {
    id: "haus-allgemein",
    area: "haus",
    title: "Allgemeine Anfrage zu Haus & Hof",
    description: "Dein Anliegen rund um unser Gebäude und das Gelände.",
    categories: [],
    keywords: "Hausmeister Raum Garten Gelände",
    upload: true,
    published: true,
    fields: [],
  },
  {
    id: "erstattung",
    area: "finanzen",
    title: "Frage zu einer Erstattung",
    description:
      "Eine Rückfrage zum Ablauf oder zu einer bereits eingereichten Erstattung.",
    categories: ["erstattungen"],
    keywords: "Geld Auslage Beleg Kosten Erstattung Rechnung Zahlung",
    upload: false,
    published: true,
    fields: [],
  },
  {
    id: "finanzen-allgemein",
    area: "finanzen",
    title: "Allgemeine Anfrage an die Finanzbuchhaltung",
    description: "Eine allgemeine Frage an unser Finanzteam stellen.",
    categories: [],
    keywords: "Buchhaltung Finanzen",
    upload: false,
    published: true,
    fields: [],
  },
  {
    id: "wlan-anleitung",
    type: "guide",
    area: "it",
    title: "WLAN-Verbindung selbst prüfen",
    description:
      "Prüfe deine Geräteeinstellungen. Wenn du nicht weiterkommst, schreib uns am Ende der Anleitung.",
    categories: ["hilfe"],
    keywords: "WLAN WiFi Internet Netzwerk Flugmodus Selbsthilfe Verbindung",
    upload: false,
    published: true,
    fields: [],
    guideText:
      "Prüfe zuerst in den Einstellungen deines Geräts, ob WLAN eingeschaltet und der Flugmodus ausgeschaltet ist. Die Darstellung unten ist ein schematisches Beispiel; auf deinem Gerät kann sie anders aussehen.\n\nWähle das von der Gemeinde für dich vorgesehene WLAN. Den richtigen Netzwerknamen und die Zugangsinformationen erhältst du vom zuständigen Team. In dieser Beispielanleitung sind keine echten Zugangsdaten hinterlegt.\n\nWenn die Verbindung weiterhin nicht klappt, schalte WLAN auf deinem Gerät kurz aus und wieder ein. Ändere dabei keine Einstellungen an Routern oder anderer Gemeindetechnik. Beschreibe uns anschließend, an welchem Ort und mit welchem Gerät das Problem auftritt.",
    guideImages: [
      {
        id: "wlan-schema",
        src: "wlan-einstellungen.svg",
        alt: "Schematische Geräteeinstellungen: WLAN ist eingeschaltet, der Flugmodus ist ausgeschaltet.",
        caption:
          "Beispielgrafik zur Orientierung. Vor Veröffentlichung vom IT-Team prüfen.",
        afterParagraph: 1,
      },
    ],
  },
];
const areaById = (id) => areas.find((area) => area.id === id);
const isGuide = (form) => form.type === "guide";
const typeLabel = (form) => (isGuide(form) ? "Anleitung" : "Formular");
const publicForms = () =>
  forms.filter((form) => form.published && areaById(form.area)?.published);
const validUploadSource = (src) =>
  /^data:image\/(?:png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(src || "");
const validStoredSource = (src) => /^\/media\/[a-f0-9-]{36}\.(?:png|webp|jpg)$/.test(src || "");
const mediaSource = (src) => adminDocument
  ? src.replace(/^\/media\//, "/api/admin/media/")
  : src;
function areaImageSource(area) {
  if (area.image?.type === "library")
    return asset(
      areaImageLibrary.find((item) => item.id === area.image.id)?.src,
    );
  if (area.image?.type === "stored" && validStoredSource(area.image.src))
    return mediaSource(area.image.src);
  return area.image?.type === "upload" && validUploadSource(area.image.src)
    ? area.image.src
    : "";
}
function areaImageDownload(image) {
  if (image?.type === "stored" && validStoredSource(image.src))
    return { src: mediaSource(image.src), filename: image.name || "Bereichsbild.png" };
  if (image?.type === "library") {
    const item = areaImageLibrary.find((entry) => entry.id === image.id);
    return item ? { src: asset(item.src), filename: item.filename } : null;
  }
  return image?.type === "upload" && validUploadSource(image.src)
    ? {
        src: image.src,
        filename: image.name || "Elim-Bereichsbild-transparent.png",
      }
    : null;
}
function guideImageSource(src) {
  if (validStoredSource(src)) return mediaSource(src);
  return validUploadSource(src) ? src : asset(src);
}
const options = (values, current) =>
  values
    .map(
      (value) =>
        `<option value="${esc(value.id)}" ${value.id === current ? "selected" : ""}>${esc(value.name)}</option>`,
    )
    .join("");
const input = (id, value = "", required = false, type = "text") =>
  `<input id="${esc(id)}" name="${esc(id)}" type="${esc(type)}" value="${esc(value)}" ${required ? "required" : ""} maxlength="300">`;
const field = (label, id, content, help = "") =>
  `<div class="field"><label for="${esc(id)}">${esc(label)}</label>${content}${help ? `<span class="help">${esc(help)}</span>` : ""}</div>`;
const crumbs = (name) =>
  `<div class="breadcrumb"><a href="#home">Startseite</a><span aria-hidden="true">/</span><span>${esc(name)}</span></div>`;
function readImageData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Bild nicht lesbar"));
    reader.onload = async () => {
      try {
        const image = new Image();
        image.src = reader.result;
        await image.decode();
        resolve(String(reader.result));
      } catch {
        reject(new Error("Ungültiges Bild"));
      }
    };
    reader.readAsDataURL(file);
  });
}
async function normalizeAreaImage(file) {
  const src = await readImageData(file),
    image = new Image();
  image.src = src;
  await image.decode();
  const analysis = document.createElement("canvas"),
    longestEdge = 256,
    analysisScale = Math.min(
      longestEdge / image.naturalWidth,
      longestEdge / image.naturalHeight,
      1,
    );
  analysis.width = Math.max(1, Math.round(image.naturalWidth * analysisScale));
  analysis.height = Math.max(
    1,
    Math.round(image.naturalHeight * analysisScale),
  );
  const analysisContext = analysis.getContext("2d", {
    willReadFrequently: true,
  });
  analysisContext.drawImage(image, 0, 0, analysis.width, analysis.height);
  const pixels = analysisContext.getImageData(
    0,
    0,
    analysis.width,
    analysis.height,
  ).data;
  let transparent = false;
  for (let index = 3; index < pixels.length; index += 4) {
    if (pixels[index] < 250) {
      transparent = true;
      break;
    }
  }
  if (!transparent) {
    const error = new Error("Bild hat keinen transparenten Hintergrund");
    error.code = "opaque";
    throw error;
  }
  const canvas = document.createElement("canvas");
  canvas.width = 1536;
  canvas.height = 1024;
  const context = canvas.getContext("2d"),
    scale = Math.min(
      canvas.width / image.naturalWidth,
      canvas.height / image.naturalHeight,
    ),
    width = Math.round(image.naturalWidth * scale),
    height = Math.round(image.naturalHeight * scale);
  context.drawImage(
    image,
    Math.round((canvas.width - width) / 2),
    Math.round((canvas.height - height) / 2),
    width,
    height,
  );
  const originalName = file.name.replace(/\.[^.]+$/, "").trim() || "Bereich";
  return {
    src: canvas.toDataURL("image/png"),
    name: `${originalName}-transparent-1536x1024.png`,
  };
}

// Lokale, kataloggebundene Suche. Suchtexte verlassen den Browser nicht.
const normalize = (value) =>
  String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ß/g, "ss");
const stopwords = new Set(
  "ich du wir der die das den dem ein eine einen einem ist sind im in am an auf bei mit und oder zu zum zur von fur mein meine nicht kein keine bitte brauche benotige mochte habe hat uns es etwas kann wie was wo".split(
    " ",
  ),
);
const tokens = (value) => [
  ...new Set(
    (normalize(value).match(/[a-z0-9]+/g) || []).filter(
      (word) => word.length > 1 && !stopwords.has(word),
    ),
  ),
];
const aliases = [
  ["wlan", "wifi", "internet", "netzwerk"],
  ["heizung", "heizkorper", "kalt", "warm"],
  ["microsoft", "m365", "office", "lizenz"],
  ["konto", "account", "benutzer"],
  ["gebaude", "haus", "hausmeister"],
  ["erstattung", "auslage", "beleg", "kosten", "geld"],
  ["kaputt", "defekt", "schaden", "reparatur", "storung"],
  ["email", "mail", "postfach"],
];
function similarity(a, b) {
  if (a === b) return 1;
  if (aliases.some((group) => group.includes(a) && group.includes(b)))
    return 0.8;
  if (a.length >= 3 && b.startsWith(a)) return 0.7;
  if (Math.min(a.length, b.length) < 5 || Math.abs(a.length - b.length) > 1)
    return 0;
  let i = 0,
    j = 0,
    edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++;
      j++;
      continue;
    }
    if (++edits > 1) return 0;
    if (a.length >= b.length) i++;
    if (b.length >= a.length) j++;
  }
  return edits + a.length - i + b.length - j <= 1 ? 0.45 : 0;
}
function findForms(available, query) {
  const words = tokens(query);
  if (!words.length) return query.trim() ? [] : available;
  return available
    .map((form) => {
      const area = areaById(form.area);
      const columns = [
        [6, form.title],
        [4, form.keywords],
        [2, form.description],
        [1, isGuide(form) ? form.guideText : ""],
        [
          1,
          area.name +
            " " +
            area.categories
              .filter((c) => form.categories.includes(c.id))
              .map((c) => c.name)
              .join(" "),
        ],
      ];
      let score = 0,
        hits = 0;
      for (const word of words) {
        const best = Math.max(
          ...columns.map(
            ([weight, text]) =>
              weight *
              Math.max(
                0,
                ...tokens(text).map((candidate) => similarity(word, candidate)),
              ),
          ),
        );
        if (best) {
          score += best;
          hits++;
        }
      }
      return { form, score: (score * hits) / words.length };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.form);
}
let searchQuery = "",
  pageRoute = "",
  confirmation = null;
const areaBrowseStates = new Map();
function requestCards(items) {
  return items
    .map(
      (form) =>
        `<a class="request-card" href="#form/${esc(form.id)}"><div><span class="tag ${isGuide(form) ? "guide" : ""}">${typeLabel(form)}</span><h3>${esc(form.title)}</h3><p>${esc(form.description)}</p></div>${icon("arrow")}</a>`,
    )
    .join("");
}
function areaCard(area, preview = false) {
  const source = areaImageSource(area);
  return `<${preview ? "div" : "a"} class="area-card ${preview ? "area-preview-card" : ""}" ${preview ? "" : `href="#area/${esc(area.id)}"`}>${source ? `<span class="area-art" aria-hidden="true"><img src="${esc(source)}" alt="" ${preview ? "" : 'loading="lazy"'}></span>` : ""}<h3>${esc(area.name)}</h3><p>${esc(area.description)}</p></${preview ? "div" : "a"}>`;
}
function renderHome() {
  app.dataset.view = "home";
  delete app.dataset.area;
  if (!areas.some((area) => area.published)) {
    app.innerHTML = '<section class="panel"><h1>Hier ist noch nichts veröffentlicht.</h1><p>Bitte schau später noch einmal vorbei.</p></section>';
    return;
  }
  app.innerHTML = `<div class="home-layout"><section class="home-search-panel" aria-labelledby="home-title"><div class="home-search-surface"><div class="home-search-copy"><h1 id="home-title">Wobei brauchst du Unterstützung?</h1><p>Suche nach einem Thema oder wähle einen Bereich.</p><div role="search" aria-label="Alle Anliegen durchsuchen"><label class="sr-only" for="portal-search">Anliegen suchen</label><div class="searchbox">${icon("search")}<input id="portal-search" type="search" maxlength="300" autocomplete="off" placeholder="Zum Beispiel: WLAN oder Heizung" value="${esc(searchQuery)}" aria-controls="results"></div></div></div><div class="home-service-art" aria-hidden="true"><img src="${asset("service-eingang.webp")}" alt=""></div></div></section><div class="home-content"><section id="search-results" aria-labelledby="search-heading" hidden><div class="section-heading"><h2 id="search-heading">Passende Anliegen</h2><p id="result-count" role="status" aria-live="polite"></p></div><div class="results" id="results"></div></section><section aria-labelledby="areas-heading"><div class="section-heading"><h2 id="areas-heading">Unsere Bereiche</h2></div><div class="areas">${areas
    .filter((area) => area.published)
    .map((area) => areaCard(area))
    .join("")}</div></section></div></div>`;
  $("portal-search").addEventListener("input", (event) => {
    searchQuery = event.target.value;
    renderSearchResults();
    const results = $("search-results");
    if (
      searchQuery.trim() &&
      matchMedia("(min-width:1100px) and (min-height:600px)").matches &&
      results.getBoundingClientRect().top < 24
    )
      results.scrollIntoView({ block: "start" });
  });
  renderSearchResults();
}
function emptyStateMarkup(mode) {
  const unpublished = mode === "empty-area";
  const text = unpublished
    ? "In diesem Bereich sind noch keine Anliegen veröffentlicht. Schau später wieder vorbei oder entdecke die anderen Bereiche."
    : mode === "area-search"
      ? "Unsere Lupe hat noch nichts entdeckt. Versuche einen anderen Suchbegriff oder setze die Filter zurück."
      : "Unsere Lupe hat noch nichts entdeckt. Versuche es mit einem anderen Suchbegriff.";
  const action = unpublished
    ? '<a class="btn secondary" href="#home">Bereiche entdecken</a>'
    : '<button class="btn secondary" type="button" data-empty-reset>Suche zurücksetzen</button>';
  return `<div class="empty empty-illustrated"><img class="empty-illustration" src="${asset("suche-kein-treffer.webp")}" width="768" height="512" alt="" aria-hidden="true"><div class="empty-copy"><p class="empty-eyebrow">${unpublished ? "Noch keine Anliegen" : "Auf Spurensuche"}</p><h3>${unpublished ? "Hier ist noch Platz für Neues" : "Keine passenden Anliegen gefunden"}</h3><p>${text}</p><div class="actions">${action}</div></div></div>`;
}
function renderSearchResults() {
  const hasQuery = Boolean(searchQuery.trim());
  $("search-results").hidden = !hasQuery;
  if (!hasQuery) {
    $("results").innerHTML = "";
    $("result-count").textContent = "";
    return;
  }
  const matches = findForms(publicForms(), searchQuery);
  $("result-count").textContent = `${matches.length} Anliegen gefunden`;
  $("results").innerHTML = matches.length
    ? requestCards(matches)
    : emptyStateMarkup("home-search");
  $("results").querySelector("[data-empty-reset]")?.addEventListener("click", () => {
    searchQuery = "";
    $("portal-search").value = "";
    renderSearchResults();
    $("portal-search").focus();
  });
}
function renderArea(areaId) {
  const area = areaById(areaId);
  if (!area?.published) return renderMissing();
  app.dataset.view = "area";
  app.dataset.area = area.id;
  const state = areaBrowseStates.get(area.id) || { query: "", category: "all" };
  areaBrowseStates.set(area.id, state);
  if (!area.categories.some((c) => c.id === state.category))
    state.category = "all";
  const picture = areaImageSource(area);
  app.innerHTML = `${crumbs(area.name)}<section class="area-banner" aria-labelledby="area-title"><div class="area-banner-copy"><h1 id="area-title">${esc(area.name)}</h1><p>${esc(area.description)}</p></div>${picture ? `<div class="area-banner-art" aria-hidden="true"><img src="${esc(picture)}" alt=""></div>` : ""}</section><section id="requests-section"><div class="section-heading"><h2>Formulare und Anleitungen</h2><p id="area-result-count" role="status" aria-live="polite"></p></div><div class="area-tools" role="search" aria-label="Anliegen in ${esc(area.name)} suchen"><div class="area-query"><label class="control-label" for="area-search">In diesem Bereich suchen</label><div class="searchbox">${icon("search")}<input id="area-search" type="search" maxlength="300" value="${esc(state.query)}" placeholder="Suchbegriff eingeben …" aria-controls="results"></div></div>${area.categories.length ? `<div class="area-category"><label class="control-label" for="area-category">Kategorie</label><select id="area-category" aria-controls="results"><option value="all">Alle Kategorien</option>${options(area.categories, state.category)}</select></div>` : ""}<button class="btn secondary" id="area-reset" type="button" hidden>Suche zurücksetzen</button></div><div class="results" id="results"></div></section>`;
  const update = () => {
    const available = publicForms().filter((form) => form.area === area.id),
      filtered = available.filter(
        (form) =>
          state.category === "all" || form.categories.includes(state.category),
      ),
      matches = findForms(filtered, state.query);
    $("area-result-count").textContent =
      `${matches.length} von ${available.length} Anliegen`;
    $("area-reset").hidden = !state.query && state.category === "all";
    $("results").innerHTML = matches.length
      ? requestCards(matches)
      : emptyStateMarkup(available.length ? "area-search" : "empty-area");
    $("results").querySelector("[data-empty-reset]")?.addEventListener("click", () => $("area-reset").click());
  };
  $("area-search").addEventListener("input", (event) => {
    state.query = event.target.value;
    update();
  });
  $("area-category")?.addEventListener("change", (event) => {
    state.category = event.target.value;
    update();
  });
  $("area-reset").addEventListener("click", () => {
    state.query = "";
    state.category = "all";
    $("area-search").value = "";
    if ($("area-category")) $("area-category").value = "all";
    update();
    $("area-search").focus();
  });
  update();
}

function customField(item) {
  const id = `custom-${item.id}`,
    title = item.label + (item.required ? " *" : "");
  if (item.type === "multiselect")
    return `<fieldset><legend>${esc(title)}</legend>${item.options.map((option) => `<label class="check"><input type="checkbox" name="${esc(id)}" value="${esc(option)}">${esc(option)}</label>`).join("")}</fieldset>`;
  if (item.type === "select")
    return field(
      title,
      id,
      `<select id="${esc(id)}" name="${esc(id)}" ${item.required ? "required" : ""}><option value="">Bitte auswählen</option>${item.options.map((option) => `<option>${esc(option)}</option>`).join("")}</select>`,
    );
  if (item.type === "textarea")
    return field(
      title,
      id,
      `<textarea id="${esc(id)}" name="${esc(id)}" ${item.required ? "required" : ""} maxlength="5000"></textarea>`,
    );
  return field(
    title,
    id,
    input(
      id,
      "",
      item.required,
      ["email", "date"].includes(item.type) ? item.type : "text",
    ),
  );
}
const guideParagraphs = (text) =>
  String(text || "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
function guideContent(form) {
  const paragraphs = guideParagraphs(form.guideText),
    pictures = (form.guideImages || []).filter((image) =>
      guideImageSource(image.src),
    );
  const imageMarkup = (image) =>
    `<figure><img src="${esc(guideImageSource(image.src))}" alt="${esc(image.alt)}">${image.caption ? `<figcaption>${esc(image.caption)}</figcaption>` : ""}</figure>`;
  if (form.guideDocument) return window.GuideEditor.renderDocument(form.guideDocument, id => {
    const image = pictures.find(image => image.id === id);
    return image ? imageMarkup(image) : "";
  });
  return paragraphs
    .map(
      (paragraph, index) =>
        `<p>${esc(paragraph).replace(/\n/g, "<br>")}</p>${pictures
          .filter(
            (image) =>
              Math.min(
                paragraphs.length,
                Math.max(1, Number(image.afterParagraph) || 1),
              ) ===
              index + 1,
          )
          .map(imageMarkup)
          .join("")}`,
    )
    .join("");
}
function prototypeRequestMarkup(form) {
  const area = areaById(form.area);
  const heading = `<div class="page-heading dark"><span class="tag">${esc(area.name)}</span> <span class="tag ${isGuide(form) ? "guide" : ""}">${typeLabel(form)}</span><h2 id="request-title">${esc(form.title)}</h2><p>${esc(form.description)}</p></div>`;
  if (isGuide(form))
    return `<div class="guide-layout">${heading}<article class="panel guide-article" aria-label="Anleitungstext">${guideContent(form)}</article><form class="panel guide-contact" id="request-form"><h3>Du brauchst noch Hilfe?</h3><p>Schreib uns, wenn deine Frage noch offen ist.</p><p class="small muted">Bitte nur Beispieldaten eingeben. Felder mit * sind Pflichtfelder.</p>${field("Deine E-Mail-Adresse *", "request-email", input("request-email", "", true, "email"))}${field("Betreff *", "request-subject", input("request-subject", `Frage zur Anleitung: ${form.title}`.slice(0, 300), true))}${field("Nachricht *", "request-description", '<textarea id="request-description" required maxlength="5000" placeholder="Was hat nicht geklappt oder wobei brauchst du noch Hilfe?"></textarea>', "Bitte keine Passwörter oder vertraulichen Informationen eintragen.")}<div class="error" id="request-error" role="alert"></div><p class="small muted">Diese Vorschau verschickt keine E-Mails und speichert keine Eingaben.</p><button class="btn" type="submit">E-Mail-Versand simulieren ${icon("arrow")}</button></form></div>`;
  return `${heading}<div class="layout"><form class="panel" id="request-form"><h3>Deine Angaben</h3><p class="small muted">Bitte nur Beispieldaten eingeben. Felder mit * sind Pflichtfelder.</p><div class="form-grid">${field("Dein Name *", "request-name", input("request-name", "", true))}${field("Deine E-Mail-Adresse *", "request-email", input("request-email", "", true, "email"))}</div>${field("Betreff *", "request-subject", input("request-subject", form.title, true))}${form.fields.map(customField).join("")}${field("Deine Nachricht *", "request-description", '<textarea id="request-description" required maxlength="5000" placeholder="Was ist passiert oder wobei können wir dich unterstützen?"></textarea>', "Bitte keine Passwörter, vertraulichen Finanzunterlagen oder Seelsorgeinformationen eintragen.")}${form.upload ? `<div class="upload">${field("Dateien hinzufügen (optional)", "request-files", '<input id="request-files" type="file" multiple accept="image/jpeg,image/png,image/webp,application/pdf">', "Bis zu 3 Dateien, insgesamt höchstens 10 MB. JPG, PNG, WebP oder PDF.")}<ul id="request-file-list" class="attachment-list" aria-label="Ausgewählte Dateien" hidden></ul><p id="file-summary" class="small muted" aria-live="polite"></p></div>` : ""}<div class="error" id="request-error" role="alert"></div><p class="small muted">Die spätere Anfrage geht an das zuständige Team. In dieser Vorschau werden Eingaben und Dateien weder übertragen noch gespeichert.</p><button class="btn" type="submit">Absenden simulieren ${icon("arrow")}</button></form><aside class="aside"><h3>Dein Kontakt zum Team</h3><p>Im fertigen Portal geht deine Anfrage per E-Mail an das zuständige Team für ${esc(area.name)}.</p><p>Die Antwort erhältst du an deine E-Mail-Adresse.</p><p class="small">Diese Vorschau zeigt den Ablauf. Sie verschickt keine E-Mails.</p></aside></div>`;
}
function requestMarkup(form) {
  const html = prototypeRequestMarkup(form);
  if (!usesPortalApi) return html;
  return html
    .replaceAll("Bitte nur Beispieldaten eingeben. Felder mit * sind Pflichtfelder.", "Felder mit * sind Pflichtfelder.")
    .replace("Diese Vorschau verschickt keine E-Mails und speichert keine Eingaben.",
      "Deine Nachricht wird an das zuständige Team übermittelt. Du erhältst die Antwort an deine E-Mail-Adresse.")
    .replace("Die spätere Anfrage geht an das zuständige Team. In dieser Vorschau werden Eingaben und Dateien weder übertragen noch gespeichert.",
      "Deine Angaben und Anhänge werden per E-Mail an das zuständige Team übermittelt.")
    .replace("Im fertigen Portal geht deine Anfrage per E-Mail an das zuständige Team für",
      "Deine Anfrage geht per E-Mail an das zuständige Team für")
    .replace('<p class="small">Diese Vorschau zeigt den Ablauf. Sie verschickt keine E-Mails.</p>', "")
    .replace("E-Mail-Versand simulieren", "Nachricht senden")
    .replace("Absenden simulieren", "Anfrage senden");
}
function loadChallengeScript() {
  if (window.turnstile) return Promise.resolve();
  if (!challengeScript) {
    challengeScript = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.onload = resolve;
      script.onerror = () => { script.remove(); challengeScript = undefined; reject(new Error("Die Sicherheitsprüfung konnte nicht geladen werden.")); };
      document.head.append(script);
    });
  }
  return challengeScript;
}
function renderRequest(formId) {
  const form = publicForms().find((item) => item.id === formId);
  ensurePublic(form?.area);
  if (!form) {
    delete dialog.dataset.shareForm;
    delete slot.dataset.form;
    slot.innerHTML =
      '<div class="panel"><h2 id="request-title">Hier ist noch nichts veröffentlicht.</h2><p>Dieses Anliegen oder dieser Bereich ist nicht verfügbar. Schließe den Dialog und suche nach einem anderen Anliegen.</p></div>';
    return;
  }
  dialog.dataset.shareForm = form.id;
  if (slot.dataset.form === form.id && slot.querySelector("#request-form"))
    return;
  slot.dataset.form = form.id;
  if (slot.dataset.widget && window.turnstile) window.turnstile.remove(slot.dataset.widget);
  delete slot.dataset.widget;
  slot.innerHTML = requestMarkup(form);
  const requestForm = $("request-form");
  let verificationToken = "", sending = false;
  const requestId = crypto.randomUUID();
  if (usesPortalApi) {
    const honeypot = document.createElement("div");
    honeypot.className = "sr-only";
    honeypot.setAttribute("aria-hidden", "true");
    honeypot.innerHTML = '<label>Website<input name="website" tabindex="-1" autocomplete="off"></label>';
    requestForm.append(honeypot);
    const verification = document.createElement("div");
    verification.id = "request-verification";
    requestForm.querySelector('button[type="submit"]').before(verification);
    if (!mailSettings.enabled) {
      verification.textContent = "Der E-Mail-Versand wird noch eingerichtet. Bitte versuche es später erneut.";
      requestForm.querySelector('button[type="submit"]').disabled = true;
    } else {
      loadChallengeScript().then(() => {
        if (!requestForm.isConnected) return;
        slot.dataset.widget = window.turnstile.render(verification, {
          sitekey: mailSettings.siteKey, action: "service-request", theme: "light",
          callback: token => { verificationToken = token; },
          "expired-callback": () => { verificationToken = ""; },
          "error-callback": () => { verificationToken = ""; $("request-error").textContent = "Die Sicherheitsprüfung ist fehlgeschlagen. Bitte erneut versuchen."; },
        });
      }).catch(error => {
        if (requestForm.isConnected) $("request-error").textContent = error.message;
      });
    }
  }
  const upload = $("request-files");
  const renderAttachments = (notice = "") => {
    const files = Array.from(upload?.files || []);
    const list = $("request-file-list");
    if (!list) return;
    list.hidden = !files.length;
    const size = bytes => new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 }).format(bytes / (bytes < 1024 * 1024 ? 1024 : 1024 * 1024)) + (bytes < 1024 * 1024 ? " KB" : " MB");
    list.innerHTML = files.map((file, index) => `<li><div class="attachment-details"><span class="attachment-name">${esc(file.name)}</span><span class="small muted">${size(file.size)}</span></div><button class="btn secondary attachment-remove" type="button" data-remove-attachment="${index}" aria-label="${esc("Datei „" + file.name + "“ entfernen")}">Entfernen</button></li>`).join("");
    $("file-summary").textContent = notice + (files.length ? `${files.length} ${files.length === 1 ? "Datei" : "Dateien"} ausgewählt · ${size(files.reduce((sum, file) => sum + file.size, 0))} insgesamt.` : "Keine Dateien ausgewählt.");
  };
  upload?.addEventListener("change", () => { renderAttachments(); $("request-error").textContent = ""; });
  $("request-file-list")?.addEventListener("click", event => {
    const button = event.target.closest("[data-remove-attachment]");
    if (!button || sending) return;
    const index = Number(button.dataset.removeAttachment), files = Array.from(upload.files);
    if (!Number.isInteger(index) || !files[index]) return;
    const removed = files[index], remaining = files.filter((_, position) => position !== index);
    if (!remaining.length) upload.value = "";
    else {
      const transfer = new DataTransfer();
      remaining.forEach(file => transfer.items.add(file));
      upload.files = transfer.files;
    }
    renderAttachments(`„${removed.name}“ wurde entfernt. `);
    $("request-error").textContent = "";
    const next = $("request-file-list").querySelectorAll("[data-remove-attachment]");
    (next[Math.min(index, next.length - 1)] || upload).focus();
  });
  $("request-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (sending) return;
    const error = $("request-error"),
      files = Array.from(upload?.files || []);
    error.textContent = "";
    if (files.length > 3) {
      error.textContent = "Bitte höchstens drei Dateien auswählen.";
      return;
    }
    if (files.reduce((sum, file) => sum + file.size, 0) > 10 * 1024 * 1024) {
      error.textContent =
        "Die Dateien dürfen zusammen höchstens 10 MB groß sein.";
      return;
    }
    if (
      files.some(
        (file) =>
          ![
            "image/jpeg",
            "image/png",
            "image/webp",
            "application/pdf",
          ].includes(file.type),
      )
    ) {
      error.textContent =
        "Bitte nur JPG-, PNG-, WebP- oder PDF-Dateien auswählen.";
      return;
    }
    for (const item of (isGuide(form) ? [] : form.fields).filter(
      (item) => item.type === "multiselect" && item.required,
    )) {
      if (
        !Array.from(event.target.elements).some(
          (el) => el.name === `custom-${item.id}` && el.checked,
        )
      ) {
        error.textContent = `Bitte bei „${item.label}“ mindestens eine Auswahl treffen.`;
        return;
      }
    }
    if (usesPortalApi) {
      if (!mailSettings.enabled || !verificationToken) {
        error.textContent = "Bitte zuerst die Sicherheitsprüfung abschließen.";
        return;
      }
      const fields = {};
      for (const item of isGuide(form) ? [] : form.fields) {
        fields[item.id] = item.type === "multiselect"
          ? Array.from(requestForm.elements).filter(el => el.name === "custom-" + item.id && el.checked).map(el => el.value)
          : $("custom-" + item.id).value;
      }
      const data = new FormData();
      data.set("formId", form.id);
      data.set("requestId", requestId);
      data.set("name", $("request-name")?.value || "");
      data.set("email", $("request-email").value);
      data.set("subject", $("request-subject").value);
      data.set("message", $("request-description").value);
      data.set("fields", JSON.stringify(fields));
      data.set("website", requestForm.elements.namedItem("website").value);
      data.set("turnstileToken", verificationToken);
      const controls = Array.from(requestForm.querySelectorAll("input, textarea, select, button"));
      const disabled = controls.map(control => control.disabled);
      const button = requestForm.querySelector('button[type="submit"]'), label = button.innerHTML;
      sending = true;
      controls.forEach(control => { control.disabled = true; });
      button.textContent = "Wird gesendet …";
      try {
        // Send memory-backed snapshots rather than lazy references to local
        // files, which Chromium can reject as ERR_UPLOAD_FILE_CHANGED.
        for (const file of files) {
          let bytes;
          try { bytes = await file.arrayBuffer(); }
          catch { throw new Error("Die Datei „" + file.name + "“ konnte nicht gelesen werden. Bitte wähle sie erneut aus. Deine übrigen Angaben bleiben erhalten."); }
          data.append("files", new File([bytes], file.name, { type: file.type }));
        }
        const response = await fetch("/api/requests", {
          method: "POST", body: data, signal: AbortSignal.timeout(30000),
        });
        const retryHint = "Deine Eingaben und Dateien bleiben erhalten. Bitte mit denselben Angaben erneut versuchen.";
        if (!response.headers.get("content-type")?.includes("application/json")) {
          const ray = response.headers.get("cf-ray");
          const support = ray && /^[a-z0-9-]{1,80}$/i.test(ray) ? " Fehlerkennung: " + ray + "." : "";
          throw new Error("Das Serviceportal hat keine gültige Versandbestätigung geliefert (HTTP " + response.status + ")." + support + " " + retryHint);
        }
        const result = await response.json();
        if (!response.ok) throw new Error(typeof result?.error === "string" ? result.error : "Der Versand konnte nicht bestätigt werden. " + retryHint);
        if (result?.accepted !== true || typeof result.reference !== "string" || !/^SP-[A-F0-9]{8}-[A-F0-9]{4}$/.test(result.reference))
          throw new Error("Das Serviceportal hat keine gültige Versandbestätigung geliefert. " + retryHint);
        confirmation = { form: form.id, reference: result.reference, accepted: true };
        requestForm.reset();
        delete slot.dataset.form;
        if (slot.dataset.widget && window.turnstile) window.turnstile.remove(slot.dataset.widget);
        delete slot.dataset.widget;
        location.hash = "bestaetigung";
      } catch (sendError) {
        const retryHint = "Deine Eingaben und Dateien bleiben erhalten. Bitte mit denselben Angaben erneut versuchen.";
        error.textContent = ["TimeoutError", "AbortError"].includes(sendError.name)
          ? "Der Versand dauert länger als erwartet und konnte noch nicht bestätigt werden. " + retryHint
          : sendError instanceof TypeError
            ? "Beim Senden konnte keine Verbindung zum Serviceportal hergestellt werden. Der Versand konnte nicht bestätigt werden. " + retryHint
            : sendError instanceof SyntaxError
              ? "Das Serviceportal hat keine gültige Versandbestätigung geliefert. " + retryHint
              : sendError.message || "Der Versand konnte nicht bestätigt werden. " + retryHint;
        verificationToken = "";
        if (slot.dataset.widget && window.turnstile) window.turnstile.reset(slot.dataset.widget);
      } finally {
        sending = false;
        controls.forEach((control, index) => { control.disabled = disabled[index]; });
        button.innerHTML = label;
      }
      return;
    }
    confirmation = {
      form: form.id,
      reference: `VORSCHAU-${String(++sequence).padStart(3, "0")}`,
    };
    event.target.reset();
    location.hash = "bestaetigung";
  });
}
function renderPrototypeConfirmation() {
  const form = publicForms().find((item) => item.id === confirmation?.form);
  if (!form) {
    confirmation = null;
    renderRequest("");
    return;
  }
  ensurePublic(form.area);
  delete slot.dataset.form;
  dialog.dataset.shareForm = form.id;
  slot.innerHTML = `<section class="panel success"><span class="success-icon">${icon("check")}</span><p class="eyebrow">${esc(confirmation.reference)}</p><h2 id="request-title">So sieht die Bestätigung aus.</h2><p>Die Vorschau ist abgeschlossen. Es wurde keine E-Mail verschickt. Deine Eingaben und Dateien wurden nicht gespeichert.</p><p class="muted">Im fertigen Portal erscheint hier die Bestätigung nach Annahme durch den Versanddienst. Die Bearbeitung erfolgt anschließend per E-Mail.</p><div class="actions"><a class="btn" href="#home">Zur Startseite</a><a class="btn secondary" href="#form/${esc(form.id)}">${isGuide(form) ? "Anleitung erneut ansehen" : "Formular erneut ansehen"}</a></div></section>`;
}

function renderConfirmation() {
  renderPrototypeConfirmation();
  if (usesPortalApi && confirmation?.accepted) {
    slot.innerHTML = '<section class="panel success success-sent">' + sentIllustration() +
      '<p class="eyebrow">' + esc(confirmation.reference) +
      '</p><h2 id="request-title">Deine Anfrage ist auf dem Weg!</h2>' +
      '<p>Der Versanddienst hat deine Nachricht angenommen. Die Antwort erhältst du an deine angegebene E-Mail-Adresse.</p>' +
      '<p class="muted">Bitte bewahre die Vorgangsnummer für Rückfragen auf.</p>' +
      '<a class="btn" href="#home">Zur Startseite</a></section>';
  }
}

function sentIllustration() {
  return `<svg class="sent-illustration" viewBox="0 0 240 170" fill="none" aria-hidden="true">
    <ellipse cx="120" cy="150" rx="74" ry="8" fill="#0b2540" opacity=".08"/>
    <circle cx="116" cy="80" r="65" fill="#e7edf3"/>
    <path d="M24 77h23M31 91h16M35 105h12" stroke="#91acc1" stroke-width="4" stroke-linecap="round"/>
    <g class="sent-envelope">
      <rect x="61" y="48" width="126" height="88" rx="12" fill="#fdf8f0" stroke="#355773" stroke-width="3"/>
      <path d="m64 130 43-36m77 36-43-36" stroke="#c3cfd9" stroke-width="3"/>
      <path d="m63 53 53 40a14 14 0 0 0 16 0l53-40" fill="#f4eadb" stroke="#355773" stroke-width="3" stroke-linejoin="round"/>
      <circle cx="181" cy="53" r="22" fill="#f49a43" stroke="#fdf8f0" stroke-width="5"/>
      <path d="m172 53 6 6 12-13" stroke="#0b2540" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
    <path d="M207 95v10m-5-5h10M63 24v8m-4-4h8" stroke="#f49a43" stroke-width="3" stroke-linecap="round"/>
  </svg>`;
}

// Native modale Dialoge und temporäre Kopierbestätigung.
let dialogReturnFocus = null,
  dialogReturnRoute = "#home",
  dialogScrollY = 0,
  previousOverflow = "";
let copyLinkTimer = null,
  copyLinkVersion = 0;
function resetCopyLink() {
  clearTimeout(copyLinkTimer);
  copyLinkVersion++;
  const button = $("copy-request-link");
  button.innerHTML = `${icon("copy")}<span>Link kopieren</span>`;
  button.disabled = !dialog.dataset.shareForm;
  delete button.dataset.copyState;
  button.removeAttribute("aria-busy");
  button.removeAttribute("title");
  $("copy-link-status").textContent = "";
}
function showDialog() {
  resetCopyLink();
  if (!dialog.open) {
    dialogReturnFocus = document.activeElement;
    dialogReturnRoute = pageRoute.startsWith("#area/") ? pageRoute : "#home";
    dialogScrollY = window.scrollY;
    previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    dialog.showModal();
  }
  dialog.scrollTop = 0;
  $("request-title")?.setAttribute("tabindex", "-1");
  $("request-title")?.focus({ preventScroll: true });
}
function hideDialog() {
  if (!dialog.open) return false;
  resetCopyLink();
  dialog.close();
  document.documentElement.style.overflow = previousOverflow;
  if (dialogReturnFocus?.isConnected)
    dialogReturnFocus.focus({ preventScroll: true });
  window.scrollTo(0, dialogScrollY);
  return true;
}
const dismissDialog = () => {
  location.hash = dialogReturnRoute;
};
$("close-request-dialog").addEventListener("click", dismissDialog);
dialog.addEventListener("cancel", (event) => {
  // File pickers also emit a bubbling cancel event when the same file is
  // selected again. Only the dialog's own Escape event should close it.
  if (event.target !== dialog) return;
  event.preventDefault();
  dismissDialog();
});
dialog.addEventListener("click", (event) => {
  const r = dialog.getBoundingClientRect();
  if (
    event.target === dialog &&
    (event.clientX < r.left ||
      event.clientX > r.right ||
      event.clientY < r.top ||
      event.clientY > r.bottom)
  )
    dismissDialog();
});
dialog.addEventListener("keydown", (event) => {
  if (event.key !== "Tab" || event.ctrlKey || event.altKey || event.metaKey)
    return;
  const controls = Array.from(
    dialog.querySelectorAll(
      'a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])',
    ),
  ).filter(
    (el) =>
      !el.disabled &&
      el.getClientRects().length &&
      getComputedStyle(el).visibility !== "hidden",
  );
  const first = controls[0],
    last = controls.at(-1);
  if (!first) return;
  if (
    event.shiftKey &&
    (document.activeElement === first ||
      !controls.includes(document.activeElement))
  ) {
    event.preventDefault();
    last.focus();
  } else if (
    !event.shiftKey &&
    (document.activeElement === last ||
      !controls.includes(document.activeElement))
  ) {
    event.preventDefault();
    first.focus();
  }
});
function legacyCopy(text) {
  const input = document.createElement("textarea");
  input.value = text;
  input.readOnly = true;
  input.tabIndex = -1;
  input.setAttribute("aria-hidden", "true");
  input.style.cssText =
    "position:fixed;left:-9999px;top:0;opacity:0;pointer-events:none;font-size:16px";
  const focused = document.activeElement,
    scroll = dialog.scrollTop;
  dialog.append(input);
  try {
    input.focus({ preventScroll: true });
    input.select();
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    input.remove();
    focused?.focus({ preventScroll: true });
    dialog.scrollTop = scroll;
  }
}
$("copy-request-link").addEventListener("click", async () => {
  const button = $("copy-request-link"),
    formId = dialog.dataset.shareForm;
  if (
    button.dataset.copyState === "pending" ||
    !publicForms().some((form) => form.id === formId)
  )
    return;
  const url = new URL(location.href);
  url.search = "";
  url.hash = `form/${encodeURIComponent(formId)}`;
  clearTimeout(copyLinkTimer);
  const version = ++copyLinkVersion;
  button.dataset.copyState = "pending";
  button.setAttribute("aria-busy", "true");
  $("copy-link-status").textContent = "";
  let copied = false;
  try {
    if (!navigator.clipboard?.writeText)
      throw new Error("Clipboard unavailable");
    await navigator.clipboard.writeText(url.href);
    copied = true;
  } catch {
    if (
      version !== copyLinkVersion ||
      !dialog.open ||
      dialog.dataset.shareForm !== formId
    )
      return;
    copied = legacyCopy(url.href);
  }
  if (
    version !== copyLinkVersion ||
    !dialog.open ||
    dialog.dataset.shareForm !== formId
  )
    return;
  button.removeAttribute("aria-busy");
  button.dataset.copyState = copied ? "copied" : "error";
  button.innerHTML = `${icon(copied ? "check" : "info")}<span>${copied ? "Link kopiert" : "Nicht kopiert"}</span>`;
  const message = copied
    ? "Link kopiert."
    : "Kopieren nicht möglich. Bitte kopiere den Link aus der Adressleiste.";
  button.title = message;
  $("copy-link-status").textContent = message;
  copyLinkTimer = setTimeout(resetCopyLink, copied ? 2500 : 4000);
});

function renderAdminShell(section, content) {
  app.dataset.view = "admin";
  delete app.dataset.area;
  app.innerHTML = `${crumbs(adminDocument ? "Verwaltung" : "Admin-Vorschau")}<div class="page-heading dark"><p class="eyebrow">Für das IT-Team</p><h1>Portal verwalten</h1><p>Bereiche, Zuständigkeiten, Formulare und Anleitungen zentral pflegen.</p></div><div class="admin-note"><strong>Admin-Vorschau ohne Anmeldung:</strong> Änderungen gelten nur in diesem geöffneten Entwurf und gehen beim Neuladen verloren. Alle Empfängeradressen sind Beispiele.</div><div class="admin-layout"><nav class="admin-nav" aria-label="Verwaltung"><a class="${section === "areas" ? "active" : ""}" href="#admin/areas">Bereiche & Kategorien</a><a class="${section === "forms" ? "active" : ""}" href="#admin/forms">Anliegen</a></nav><section>${content}</section></div>`;
}
function adminShell(section, content) {
  if (adminDocument)
    content = content.replace("Bilder bleiben in dieser Vorschau nur bis zum Neuladen erhalten.", "Bilder werden dauerhaft gespeichert.");
  renderAdminShell(section, content);
  if (adminDocument) {
    const adminLink = document.createElement("a");
    adminLink.href = "#admin/administrators";
    adminLink.textContent = "Administratoren";
    if (section === "administrators") adminLink.className = "active";
    app.querySelector(".admin-nav").append(adminLink);
    const session = app.querySelector(".admin-note");
    session.classList.add("admin-session");
    session.innerHTML =
      '<div class="admin-session-identity"><span class="admin-session-icon" aria-hidden="true">' + icon("check") +
      '</span><div><span class="admin-session-label">Angemeldet als</span> ' +
      '<strong class="admin-session-email">' + esc(adminEmail).replace("@", "@<wbr>") +
      '</strong></div></div><a class="btn secondary" href="/cdn-cgi/access/logout">Abmelden</a>';
    app.querySelectorAll('button[type="submit"]').forEach(button => {
      if (button.textContent === "In Vorschau speichern") button.textContent = "Speichern";
    });
  }
}

async function savePortalState(nextAreas, nextForms, editor) {
  if (!usesPortalApi) {
    areas.splice(0, areas.length, ...nextAreas);
    forms.splice(0, forms.length, ...nextForms);
    return true;
  }
  const buttons = [...editor.querySelectorAll('button[type="submit"]')];
  buttons.forEach(button => { button.disabled = true; });
  let notice = editor.querySelector(".save-notice");
  if (!notice) {
    notice = document.createElement("p");
    notice.className = "save-notice";
    editor.append(notice);
  }
  notice.setAttribute("role", "status");
  notice.textContent = "Änderungen werden gespeichert …";
  try {
    const state = structuredClone({ areas: nextAreas, forms: nextForms });
    const upload = async (src) => {
      const blob = await (await fetch(src)).blob();
      const response = await fetch("/api/admin/media", {
        method: "POST", headers: { "Content-Type": blob.type }, body: blob,
      });
      if (!response.ok || !response.headers.get("content-type")?.includes("application/json"))
        throw new Error("Das Bild konnte nicht gespeichert werden. Bitte Anmeldung und Dateityp prüfen.");
      return (await response.json()).src;
    };
    for (const area of state.areas) {
      if (area.image?.type === "upload") {
        area.image = { type: "stored", src: await upload(area.image.src), name: area.image.name || "Bereichsbild.png" };
      }
    }
    for (const form of state.forms) {
      for (const img of form.guideImages || []) {
        if (validUploadSource(img.src)) img.src = await upload(img.src);
      }
    }
    const response = await fetch("/api/admin/portal", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ version: portalVersion, ...state }),
    });
    if (!response.headers.get("content-type")?.includes("application/json"))
      throw new Error("Die Anmeldung ist möglicherweise abgelaufen. Deine Änderungen wurden nicht gespeichert.");
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Speichern fehlgeschlagen.");
    portalVersion = result.version;
    areas.splice(0, areas.length, ...result.areas);
    forms.splice(0, forms.length, ...result.forms);
    notice.remove();
    return true;
  } catch (error) {
    notice.setAttribute("role", "alert");
    notice.textContent = error.message || "Speichern fehlgeschlagen. Bitte erneut versuchen.";
    return false;
  } finally {
    buttons.forEach(button => { button.disabled = false; });
  }
}

function renderAdministrators() {
  if (!adminDocument) {
    adminShell("administrators", '<section class="panel"><h2>Administratoren</h2><p>Die Kontoverwaltung ist in der angemeldeten Online-Verwaltung verfügbar.</p></section>');
    return;
  }
  adminShell("administrators",
    '<div id="administrators-view"><div class="section-heading"><div><h2>Administratoren</h2>' +
    '<p>Aktive Konten können sich mit ihrer E-Mail-Adresse anmelden und das Serviceportal verwalten.</p></div></div>' +
    '<div id="administrator-error" class="error" role="alert"></div>' +
    '<p id="administrator-status" role="status" aria-live="polite">Administratoren werden geladen …</p>' +
    '<div id="administrator-list"></div>' +
    '<form class="panel" id="new-administrator"><h3>Administrator anlegen</h3>' +
    field("Name *", "administrator-name", '<input id="administrator-name" required maxlength="150" autocomplete="name">') +
    field("E-Mail-Adresse *", "administrator-email", '<input id="administrator-email" type="email" required maxlength="254" autocomplete="email">') +
    '<p class="small muted">Der Zugang erfolgt per E-Mail-Code. Eine Einladung wird nicht automatisch versendet.</p>' +
    '<button class="btn" type="submit">Administrator anlegen</button></form></div>');
  const view = $("administrators-view"), list = $("administrator-list"),
    error = $("administrator-error"), status = $("administrator-status"),
    createForm = $("new-administrator");
  let accounts = [], busy = false;
  const endpoint = "/api/admin/administrators";
  const api = async (path, method = "GET", data) => {
    const response = await fetch(path, {
      method, cache: "no-store",
      ...(data === undefined ? {} : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }),
    });
    if (!response.headers.get("content-type")?.includes("application/json"))
      throw new Error("Die Anmeldung ist möglicherweise abgelaufen. Bitte erneut anmelden.");
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Die Änderung konnte nicht gespeichert werden.");
    return result;
  };
  const draw = () => {
    list.innerHTML = accounts.map(admin => {
      const protectedAccount = admin.isSelf || admin.isLastActive;
      const reason = admin.isSelf ? "Dein eigenes Konto ist geschützt." :
        admin.isLastActive ? "Das letzte aktive Administratorkonto ist geschützt." : "";
      return '<div class="manage-card administrator-account"><div class="administrator-identity">' +
        '<span class="status ' + (admin.active ? "" : "off") + '">' + (admin.active ? "Aktiv" : "Inaktiv") + '</span>' +
        '<h3>' + esc(admin.name) + (admin.isSelf ? ' <span class="small muted">(Du)</span>' : "") + '</h3>' +
        '<p>' + esc(admin.email) + '</p>' +
        (protectedAccount ? '<p class="small muted">' + reason + '</p>' : "") +
        '</div><div class="actions">' +
        '<button class="btn secondary" type="button" data-admin-action="toggle" data-email="' + esc(admin.email) + '"' +
        ((admin.active ? !admin.canDeactivate : admin.isSelf) ? ' disabled title="' + esc(reason) + '"' : "") + '>' +
        (admin.active ? "Inaktiv setzen" : "Aktivieren") + '</button>' +
        '<button class="btn ghost" type="button" data-admin-action="delete" data-email="' + esc(admin.email) + '"' +
        (!admin.canDelete ? ' disabled title="' + esc(reason) + '"' : "") + '>Löschen</button></div></div>';
    }).join("");
  };
  const refresh = async () => {
    const result = await api(endpoint);
    if (!view.isConnected) return;
    accounts = result.administrators;
    draw();
  };
  const change = async (path, method, data, message, after) => {
    if (busy) return;
    busy = true;
    error.textContent = "";
    status.textContent = "Änderung wird gespeichert …";
    view.querySelectorAll("button").forEach(button => { button.disabled = true; });
    try {
      await api(path, method, data);
      if (!view.isConnected) return;
      if (after) after();
      await refresh();
      if (view.isConnected) status.textContent = message;
    } catch (failure) {
      if (view.isConnected) {
        error.textContent = failure.message;
        status.textContent = "";
      }
    } finally {
      busy = false;
      if (view.isConnected) {
        draw();
        createForm.querySelector('button[type="submit"]').disabled = false;
      }
    }
  };
  createForm.addEventListener("submit", event => {
    event.preventDefault();
    change(endpoint, "POST", {
      name: $("administrator-name").value.trim(), email: $("administrator-email").value.trim(),
    }, "Administrator wurde angelegt.", () => createForm.reset());
  });
  list.addEventListener("click", event => {
    const button = event.target.closest("[data-admin-action]");
    if (!button || button.disabled || busy) return;
    const admin = accounts.find(account => account.email === button.dataset.email);
    if (!admin) return;
    const path = endpoint + "/" + encodeURIComponent(admin.email);
    if (button.dataset.adminAction === "delete") {
      if (window.confirm("Administrator „" + admin.name + "“ (" + admin.email + ") wirklich löschen?"))
        change(path, "DELETE", { version: admin.version }, "Administrator wurde gelöscht.");
    } else {
      change(path, "PATCH", { version: admin.version, active: !admin.active },
        admin.active ? "Administrator wurde inaktiv gesetzt." : "Administrator wurde aktiviert.");
    }
  });
  refresh().then(() => {
    if (view.isConnected) status.textContent = "";
  }).catch(failure => {
    if (view.isConnected) { error.textContent = failure.message; status.textContent = ""; }
  });
}

function renderAdminList(section) {
  if (section === "areas") {
    adminShell(
      "areas",
      `<div class="section-heading"><div><h2>Bereiche & Kategorien</h2><p>Jeder Bereich leitet an eine eigene E-Mail-Adresse weiter.</p></div><a class="btn" href="#admin/area/new">${icon("plus")} Bereich anlegen</a></div>${areas.map((area) => `<div class="manage-card"><div><span class="status ${area.published ? "" : "off"}">${area.published ? "Veröffentlicht" : "Entwurf"}</span><h3>${esc(area.name)}</h3><p>${esc(area.email)}</p><p>${area.categories.length} Kategorien · ${forms.filter((form) => form.area === area.id).length} Anliegen${areaImageSource(area) ? "" : " · Bild fehlt"}</p></div><a class="btn secondary" href="#admin/area/${esc(area.id)}">Bearbeiten</a></div>`).join("")}`,
    );
  } else {
    adminShell(
      "forms",
      `<div class="section-heading"><div><h2>Anliegen</h2><p>Formulare und Anleitungen zentral pflegen.</p></div><a class="btn" href="#admin/form/new">${icon("plus")} Anliegen anlegen</a></div>${forms.map((form) => `<div class="manage-card"><div><span class="status ${form.published ? "" : "off"}">${form.published ? "Veröffentlicht" : "Entwurf"}</span><h3>${esc(form.title)}</h3><p>${esc(areaById(form.area)?.name)} · ${typeLabel(form)} · ${isGuide(form) ? `${(form.guideImages || []).length} Bilder` : `${form.fields.length} zusätzliche Felder`}</p></div><a class="btn secondary" href="#admin/form/${esc(form.id)}">Bearbeiten</a></div>`).join("")}`,
    );
  }
}
const categoryRow = (category) =>
  `<div class="field-row" data-category-row="${esc(category.id)}"><label class="field"><span>Kategoriename</span><input value="${esc(category.name)}" maxlength="100" placeholder="Zum Beispiel: Konten & Zugänge"></label><button class="btn ghost" data-remove-category type="button">Kategorie entfernen</button></div>`;
function bindCategoryRemovals() {
  document
    .querySelectorAll("[data-remove-category]")
    .forEach(
      (button) =>
        (button.onclick = () => button.closest("[data-category-row]").remove()),
    );
}
function renderAreaEditor(id) {
  const existing = areaById(id);
  if (id !== "new" && !existing) return renderMissing();
  const area = existing || {
    name: "",
    description: "",
    email: usesPortalApi ? defaultRecipient : "",
    icon: "it",
    image: null,
    published: false,
    categories: [],
  };
  let draftImage = area.image ? { ...area.image } : null,
    imagePending = false;
  adminShell(
    "areas",
    `<form class="panel" id="area-editor"><h2>${existing ? "Bereich bearbeiten" : "Neuer Bereich"}</h2>${field("Bereichsname *", "area-name", input("area-name", area.name, true))}${field("Kurzbeschreibung *", "area-description", input("area-description", area.description, true))}${field("Empfängeradresse *", "area-email", input("area-email", area.email, true, "email"), "Anfragen aus Formularen und Anleitungen dieses Bereichs gehen an diese Adresse.")}<fieldset><legend>Bereichsbild</legend><p class="small muted">Dieses Bild gehört nur zu diesem Bereich. Du kannst es als Stilvorlage herunterladen oder durch ein neues transparentes Motiv ersetzen.</p>${field(existing && draftImage ? "Bild ersetzen" : "Bereichsbild hinzufügen", "area-image-file", '<input id="area-image-file" type="file" accept="image/png,image/webp">', "Transparentes PNG oder WebP, maximal 5 MB. Das Bild wird automatisch auf 1536 × 1024 Pixel vereinheitlicht.")}<p id="area-image-file-name" class="small muted"></p><div class="error" id="area-image-error" role="alert"></div><div id="area-image-preview" class="area-image-preview" hidden></div><button class="btn ghost" id="remove-area-image" type="button" hidden>Bild entfernen</button><p class="help">Die Vorschau zeigt den einheitlichen Bildbereich der Startseite. Dasselbe Motiv erscheint auch auf der Bereichsseite.</p></fieldset><fieldset><legend>Kategorien</legend><p class="small muted">Kategorien helfen beim Finden. Sie haben keine eigene Empfängeradresse.</p><div id="category-editor">${area.categories.map(categoryRow).join("")}</div><button class="btn secondary" id="add-category" type="button">${icon("plus")} Kategorie ergänzen</button></fieldset><label class="check"><input id="area-published" type="checkbox" ${area.published ? "checked" : ""}>Bereich veröffentlichen</label><div class="actions"><button class="btn" type="submit">In Vorschau speichern</button><a href="#admin/areas">Abbrechen</a></div></form>`,
  );
  const editor = $("area-editor"),
    fileInput = $("area-image-file"),
    error = $("area-image-error");
  const validate = () => {
    fileInput.setCustomValidity(
      $("area-published").checked && !areaImageSource({ image: draftImage })
        ? "Bitte lade ein gültiges Bereichsbild hoch."
        : "",
    );
  };
  const preview = () => {
    const source = areaImageSource({ image: draftImage }),
      download = areaImageDownload(draftImage);
    $("area-image-preview").hidden = !source;
    $("area-image-preview").innerHTML = source
      ? `<p class="control-label">Vorschau der Bereichskachel</p>${areaCard({ image: draftImage, name: $("area-name").value.trim() || "Dein Bereich", description: $("area-description").value.trim() || "So erscheint dein Bereich auf der Startseite." }, true)}${download ? `<a class="btn secondary area-image-download" id="download-area-image" href="${esc(download.src)}" download="${esc(download.filename)}">${icon("download")} Aktuelles Bild herunterladen</a>` : ""}`
      : "";
    $("remove-area-image").hidden = !source;
    $("area-image-file-name").textContent =
      ["upload", "stored"].includes(draftImage?.type)
        ? `Aktuelles Bild: ${draftImage.name || "Eigenes Bild"}`
        : source
          ? "Aktuelles Bild: vorhandene Stilvorlage"
          : "Noch kein Bereichsbild hinterlegt.";
    validate();
  };
  ["area-name", "area-description"].forEach((id) =>
    $(id).addEventListener("input", preview),
  );
  $("area-published").addEventListener("change", validate);
  $("remove-area-image").addEventListener("click", () => {
    draftImage = null;
    fileInput.value = "";
    error.textContent = "";
    preview();
  });
  fileInput.addEventListener("change", async () => {
    const file = fileInput.files[0];
    error.textContent = "";
    if (!file) return;
    if (
      !["image/png", "image/webp"].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    ) {
      error.textContent =
        "Bitte nur transparente PNG- oder WebP-Dateien mit maximal 5 MB hinzufügen.";
      fileInput.value = "";
      return;
    }
    imagePending = true;
    fileInput.disabled = true;
    editor.querySelector("button[type=submit]").disabled = true;
    try {
      const normalized = await normalizeAreaImage(file);
      if (!editor.isConnected) return;
      draftImage = { type: "upload", ...normalized };
      preview();
    } catch (uploadError) {
      if (editor.isConnected)
        error.textContent =
          uploadError.code === "opaque"
            ? "Das Bereichsbild benötigt einen transparenten Hintergrund. Verwende bitte ein freigestelltes PNG oder WebP."
            : "Das Bild konnte nicht gelesen werden. Bitte verwende eine gültige Bilddatei.";
    } finally {
      imagePending = false;
      if (editor.isConnected) {
        fileInput.disabled = false;
        fileInput.value = "";
        editor.querySelector("button[type=submit]").disabled = false;
        validate();
      }
    }
  });
  preview();
  bindCategoryRemovals();
  $("add-category").addEventListener("click", () => {
    $("category-editor").insertAdjacentHTML(
      "beforeend",
      categoryRow({ id: newId("kategorie"), name: "" }),
    );
    bindCategoryRemovals();
  });
  editor.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (imagePending) return;
    validate();
    if (!fileInput.reportValidity()) return;
    const categories = Array.from(
      editor.querySelectorAll("[data-category-row]"),
    )
      .map((row) => ({
        id: row.dataset.categoryRow,
        name: row.querySelector("input").value.trim(),
      }))
      .filter((category) => category.name);
    const values = {
      id: existing?.id || newId("bereich"),
      name: $("area-name").value.trim(),
      description: $("area-description").value.trim(),
      email: $("area-email").value.trim(),
      icon: area.icon,
      image: draftImage ? { ...draftImage } : null,
      published: $("area-published").checked,
      categories,
    };
    const nextAreas = areas.map(area => area.id === values.id ? values : area);
    if (!existing) nextAreas.push(values);
    const nextForms = structuredClone(forms);
    nextForms
      .filter((form) => form.area === values.id)
      .forEach(
        (form) =>
          (form.categories = form.categories.filter((id) =>
            categories.some((category) => category.id === id),
          )),
      );
    if (await savePortalState(nextAreas, nextForms, editor))
      location.hash = "admin/areas";
  });
}

const fieldTypes = [
  { id: "text", name: "Kurzer Text" },
  { id: "textarea", name: "Langer Text" },
  { id: "email", name: "E-Mail" },
  { id: "select", name: "Einfachauswahl" },
  { id: "multiselect", name: "Mehrfachauswahl" },
  { id: "date", name: "Datum" },
];
function fieldRow(item) {
  return `<div class="field-row" data-field-row="${esc(item.id)}"><div class="field-row-header"><button class="btn secondary field-drag-handle" type="button" data-field-drag aria-label="Feld verschieben" aria-describedby="field-order-help" title="Ziehen zum Sortieren · Pfeiltasten zum Verschieben"><svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/></svg></button><span data-field-position>Feld</span><div class="field-order-actions"><button class="btn secondary" type="button" data-field-move="-1" aria-label="Feld nach oben" title="Feld nach oben">${icon("arrow-up")}</button><button class="btn secondary" type="button" data-field-move="1" aria-label="Feld nach unten" title="Feld nach unten">${icon("arrow-down")}</button></div></div><div class="form-grid"><label class="field"><span>Feldbeschriftung *</span><input data-property="label" value="${esc(item.label)}" required maxlength="150"></label><label class="field"><span>Feldtyp</span><select data-property="type">${options(fieldTypes, item.type)}</select></label></div><label class="field"><span>Auswahlwerte (bei Auswahlfeldern)</span><input data-property="options" value="${esc(item.options.join(", "))}" maxlength="1000" placeholder="Zum Beispiel: Büro, Saal, Außenbereich"><span class="help">Mehrere Werte durch Kommas trennen.</span></label><label class="check"><input data-property="required" type="checkbox" ${item.required ? "checked" : ""}>Pflichtfeld</label><button class="btn ghost" data-remove-field type="button">Feld entfernen</button></div>`;
}
let currentGuideEditor = null;
let currentFieldSorter = null;
function guideImageRow(image) {
  return `<div class="field-row guide-image-editor" data-guide-image="${esc(image.id)}"><img src="${esc(guideImageSource(image.src))}" alt="Vorschau des Anleitungsbildes"><label class="field"><span>Bildbeschreibung für die Barrierefreiheit *</span><input data-image-property="alt" value="${esc(image.alt)}" required maxlength="300"></label><label class="field"><span>Bildunterschrift (optional)</span><input data-image-property="caption" value="${esc(image.caption)}" maxlength="300"></label><div class="actions"><button class="btn secondary" data-insert-image type="button">An Textposition einfügen</button><button class="btn ghost" data-remove-image type="button">Bild löschen</button></div></div>`;
}
function guideToolbarIcon(command) {
  const paths = {
    undo: '<path d="M9 5 4 10l5 5M4 10h10a6 6 0 0 1 0 12" transform="translate(0 -3)"/>',
    redo: '<path d="m15 5 5 5-5 5m5-5H10a6 6 0 0 0 0 12" transform="translate(0 -3)"/>',
    bulletList: '<circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/><path d="M9 6h11M9 12h11M9 18h11"/>',
    orderedList: '<path d="M10 6h10M10 12h10M10 18h10M3 3h1v6M3 9h2M3 14c0-2 3-2 3 0 0 1-3 2-3 4h3"/>',
    blockquote: '<path d="M10 6H4v6h6V6Zm10 0h-6v6h6V6ZM10 12c0 4-2 6-5 7m15-7c0 4-2 6-5 7"/>',
    link: '<path d="m10 13 4-4m-6 6-2 2a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0m2 2 2-2a4 4 0 0 1 6 6l-5 5a4 4 0 0 1-6 0" transform="translate(1 1)"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="1.5"/><path d="m21 15-5-5L5 21"/>',
    clear: '<path d="M4 4h14M11 4l-4 14m8-4 6 6m0-6-6 6"/>'
  };
  if (["bold", "italic", "underline"].includes(command)) return `<span aria-hidden="true" class="guide-letter ${command}">${{bold:"B",italic:"I",underline:"U"}[command]}</span>`;
  return `<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths[command] || ""}</svg>`;
}
function guideEditorMarkup() {
  const button = (command, label) => `<button class="btn secondary guide-tool" type="button" data-guide-command="${command}" aria-label="${label}" title="${label}">${guideToolbarIcon(command)}</button>`;
  const group = (label, content) => `<div class="guide-tool-group" role="group" aria-label="${label}">${content}</div>`;
  const toolbar =
    group("Verlauf", button("undo", "Rückgängig") + button("redo", "Wiederholen")) +
    group("Absatzformat", '<select id="guide-format" aria-label="Absatzformat" title="Absatzformat"><option value="paragraph">Absatz</option><option value="h2">Überschrift 1</option><option value="h3">Überschrift 2</option></select>') +
    group("Schriftformatierung", button("bold", "Fett") + button("italic", "Kursiv") + button("underline", "Unterstrichen")) +
    group("Listen und Zitat", button("bulletList", "Aufzählung") + button("orderedList", "Nummerierte Liste") + button("blockquote", "Zitat")) +
    group("Einfügen", button("link", "Link") + `<button class="btn secondary guide-tool" type="button" id="guide-upload" aria-label="Bild hochladen" title="Bild hochladen">${guideToolbarIcon("image")}</button>`) +
    group("Formatierung", button("clear", "Formatierung entfernen"));
  return `<div class="field"><span id="guide-editor-label">Anleitungstext *</span><p id="guide-editor-help" class="help">Schreibe und formatiere deine Anleitung. Setze den Cursor an die gewünschte Stelle, bevor du ein Bild hochlädst oder einfügst. Bilder lassen sich im Text nach oben und unten verschieben.</p><div class="guide-editor-shell"><div id="guide-toolbar" class="guide-toolbar" role="group" aria-label="Text formatieren">${toolbar}</div><div id="guide-editor"></div></div><div id="guide-link-editor" class="guide-link-editor" hidden><label class="field"><span>Link-Adresse</span><input id="guide-link-url" type="text" inputmode="url" placeholder="https://…" maxlength="2000"></label><div class="actions"><button class="btn secondary" id="guide-link-apply" type="button">Link übernehmen</button><button class="btn ghost" id="guide-link-remove" type="button">Link entfernen</button><button class="btn ghost" id="guide-link-cancel" type="button">Abbrechen</button></div><p id="guide-link-error" role="alert" class="small"></p></div><p id="guide-text-count" class="help" aria-live="polite"></p></div>`;
}
function renderFormEditor(id) {
  const existing = forms.find((form) => form.id === id);
  if (id !== "new" && !existing) return renderMissing();
  const draft = existing || {
    title: "",
    description: "",
    type: "form",
    area: areas[0].id,
    categories: [],
    keywords: "",
    upload: false,
    published: false,
    fields: [],
    guideText: "",
    guideImages: [],
  };
  let guideImages = (draft.guideImages || []).map((image) => ({ ...image })),
    imagePending = false;
  const imageArchive = new Map(guideImages.map(image => [image.id, image]));
  adminShell(
    "forms",
    `<form class="panel" id="form-editor"><h2>${existing ? "Anliegen bearbeiten" : "Neues Anliegen"}</h2>${field("Titel *", "form-title", input("form-title", draft.title, true))}${field("Kurzbeschreibung *", "form-description", input("form-description", draft.description, true))}${field(
      "Art des Anliegens *",
      "form-type",
      `<select id="form-type" required>${options(
        [
          { id: "form", name: "Formular" },
          { id: "guide", name: "Anleitung" },
        ],
        isGuide(draft) ? "guide" : "form",
      )}</select>`,
    )}${field("Bereich *", "form-area", `<select id="form-area" required>${options(areas, draft.area)}</select>`)}<fieldset><legend>Kategorien</legend><div id="form-categories"></div></fieldset>${field("Suchbegriffe", "form-keywords", input("form-keywords", draft.keywords), "Zum Beispiel: WLAN, Internet, Verbindung")}<fieldset id="form-settings"><legend>Formular</legend><p class="small muted">Name, E-Mail-Adresse, Betreff und Nachricht sind immer enthalten.</p><p id="field-order-help" class="help">Felder am Griff ziehen oder mit den Pfeilen verschieben. Die Reihenfolge wird beim Speichern übernommen.</p><div id="field-editor">${draft.fields.map(fieldRow).join("")}</div><p id="field-order-status" class="sr-only" role="status" aria-live="polite"></p><button class="btn secondary" id="add-field" type="button">${icon("plus")} Feld hinzufügen</button><label class="check"><input id="form-upload" type="checkbox" ${draft.upload ? "checked" : ""}>Dateiupload anbieten (3 Dateien, zusammen maximal 10 MB)</label></fieldset><fieldset id="guide-settings"><legend>Anleitung</legend>${guideEditorMarkup()}<p class="small muted">Bis zu fünf Bilder mit je maximal 5 MB. JPG, PNG oder WebP. Bilder bleiben in dieser Vorschau nur bis zum Neuladen erhalten.</p><label class="field"><span>Bilder hinzufügen</span><input id="guide-image-files" type="file" multiple accept="image/jpeg,image/png,image/webp"></label><div class="error" id="guide-image-error" role="alert"></div><div id="guide-images"></div><p class="small muted">Am Ende steht immer ein Kontaktformular mit eigener E-Mail-Adresse, Betreff und Nachricht.</p></fieldset><label class="check"><input id="form-published" type="checkbox" ${draft.published ? "checked" : ""}>Anliegen veröffentlichen</label><div class="error" id="editor-error" role="alert"></div><div class="actions"><button class="btn" type="submit">In Vorschau speichern</button><button class="btn secondary" type="submit" data-preview="true">Speichern und ansehen</button><a href="#admin/forms">Abbrechen</a></div></form>`,
  );
  const editor = $("form-editor");
  const richGuide = window.GuideEditor.create({
    element: $("guide-editor"), toolbar: $("guide-toolbar"),
    content: draft.guideDocument || window.GuideEditor.legacyDocument(draft.guideText, guideImages),
    images: () => guideImages, source: guideImageSource,
    onChange: () => {
      $("guide-text-count").textContent = `${richGuide.text().length} / 20.000 Zeichen`;
      let restored = false;
      richGuide.editor.state.doc.descendants(node => {
        if (node.type.name === "guideImage" && !guideImages.some(image => image.id === node.attrs.imageId) && imageArchive.has(node.attrs.imageId)) {
          guideImages.push({ ...imageArchive.get(node.attrs.imageId) }); restored = true;
        }
      });
      if (restored) { renderImages(); richGuide.refreshImages(); }
    },
    openLink: href => { $("guide-link-editor").hidden = false; $("guide-link-url").value = href; $("guide-link-url").focus(); }
  });
  currentGuideEditor = richGuide;
  $("guide-upload").onmousedown = event => event.preventDefault();
  $("guide-upload").onclick = () => $("guide-image-files").click();
  $("guide-text-count").textContent = `${richGuide.text().length} / 20.000 Zeichen`;
  const closeLink = () => { $("guide-link-editor").hidden = true; $("guide-link-error").textContent = ""; richGuide.editor.commands.focus(); };
  $("guide-link-apply").onclick = () => {
    if (richGuide.setLink($("guide-link-url").value.trim())) closeLink();
    else $("guide-link-error").textContent = "Bitte einen gültigen Link mit https://, http:// oder mailto: eintragen.";
  };
  $("guide-link-remove").onclick = () => { richGuide.setLink(""); closeLink(); };
  $("guide-link-cancel").onclick = closeLink;
  $("guide-link-url").onkeydown = event => {
    if (event.key === "Enter") { event.preventDefault(); $("guide-link-apply").click(); }
    if (event.key === "Escape") { event.preventDefault(); closeLink(); }
  };
  const updateType = () => {
    const guide = $("form-type").value === "guide";
    $("form-settings").hidden = $("form-settings").disabled = guide;
    $("guide-settings").hidden = $("guide-settings").disabled = !guide;
  };
  $("form-type").addEventListener("change", updateType);
  updateType();
  const renderCategories = (selected) => {
    $("form-categories").innerHTML =
      areaById($("form-area").value)
        .categories.map(
          (category) =>
            `<label class="check"><input type="checkbox" name="categories" value="${esc(category.id)}" ${selected.includes(category.id) ? "checked" : ""}>${esc(category.name)}</label>`,
        )
        .join("") ||
      '<p class="small muted">Dieser Bereich hat noch keine Kategorien.</p>';
  };
  renderCategories(draft.categories);
  $("form-area").addEventListener("change", () => renderCategories([]));
  currentFieldSorter = window.FieldSorter.setup($("field-editor"), $("field-order-status"));
  const bindFields = () => currentFieldSorter.refresh();
  bindFields();
  $("add-field").addEventListener("click", () => {
    $("field-editor").insertAdjacentHTML(
      "beforeend",
      fieldRow({
        id: newId("feld"),
        label: "",
        type: "text",
        required: false,
        options: [],
      }),
    );
    bindFields();
  });
  const collectImages = () => {
    guideImages = Array.from(editor.querySelectorAll("[data-guide-image]")).map(
      (row) => ({
        ...guideImages.find((image) => image.id === row.dataset.guideImage),
        alt: row.querySelector("[data-image-property=alt]").value.trim(),
        caption: row
          .querySelector("[data-image-property=caption]")
          .value.trim(),
        afterParagraph: 1,
      }),
    );
    guideImages.forEach(image => imageArchive.set(image.id, { ...image }));
  };
  const renderImages = () => {
    $("guide-images").innerHTML = guideImages.map(guideImageRow).join("");
    editor.querySelectorAll("[data-remove-image]").forEach(
      (button) =>
        (button.onclick = () => {
          collectImages();
          richGuide.removeImage(button.closest("[data-guide-image]").dataset.guideImage);
          guideImages = guideImages.filter(
            (image) =>
              image.id !==
              button.closest("[data-guide-image]").dataset.guideImage,
          );
          renderImages();
        }),
    );
  };
  $("guide-images").addEventListener("input", () => { collectImages(); richGuide.refreshImages(); });
  $("guide-images").addEventListener("click", event => {
    const button = event.target.closest("[data-insert-image]");
    if (button) { collectImages(); richGuide.insertImage(button.closest("[data-guide-image]").dataset.guideImage); }
  });
  renderImages();
  $("guide-image-files").addEventListener("change", async (event) => {
    const fileInput = event.target,
      files = Array.from(fileInput.files),
      error = $("guide-image-error");
    error.textContent = "";
    if (!files.length) return;
    if (files.length + guideImages.length > 5) {
      error.textContent = "Bitte höchstens fünf Bilder verwenden.";
      fileInput.value = "";
      return;
    }
    if (
      files.some(
        (file) =>
          !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
          file.size > 5 * 1024 * 1024,
      )
    ) {
      error.textContent =
        "Bitte nur JPG, PNG oder WebP mit maximal 5 MB pro Bild hinzufügen.";
      fileInput.value = "";
      return;
    }
    collectImages();
    imagePending = true;
    fileInput.disabled = true;
    editor
      .querySelectorAll("button[type=submit]")
      .forEach((button) => (button.disabled = true));
    try {
      const added = await Promise.all(
        files.map(async (file) => ({
          id: newId("bild"),
          src: await readImageData(file),
          alt: "",
          caption: "",
          afterParagraph: 1,
        })),
      );
      if (!editor.isConnected) return;
      guideImages.push(...added);
      added.forEach(image => imageArchive.set(image.id, { ...image }));
      added.forEach(image => richGuide.insertImage(image.id));
      renderImages();
    } catch {
      if (editor.isConnected)
        error.textContent =
          "Ein Bild konnte nicht gelesen werden. Bitte verwende eine gültige Bilddatei.";
    } finally {
      imagePending = false;
      if (editor.isConnected) {
        fileInput.disabled = false;
        fileInput.value = "";
        editor
          .querySelectorAll("button[type=submit]")
          .forEach((button) => (button.disabled = false));
      }
    }
  });
  editor.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (imagePending) return;
    const fields = Array.from(editor.querySelectorAll("[data-field-row]")).map(
      (row) => ({
        id: row.dataset.fieldRow,
        label: row.querySelector("[data-property=label]").value.trim(),
        type: row.querySelector("[data-property=type]").value,
        options: row
          .querySelector("[data-property=options]")
          .value.split(",")
          .map((value) => value.trim())
          .filter(Boolean),
        required: row.querySelector("[data-property=required]").checked,
      }),
    );
    if (
      $("form-type").value === "form" &&
      fields.some(
        (item) =>
          ["select", "multiselect"].includes(item.type) && !item.options.length,
      )
    ) {
      $("editor-error").textContent =
        "Bitte Auswahlwerte für die Auswahlfelder eintragen.";
      return;
    }
    collectImages();
    if ($("form-type").value === "guide" && (!richGuide.text() || richGuide.text().length > 20000)) {
      $("editor-error").textContent = "Bitte einen Anleitungstext mit höchstens 20.000 Zeichen eintragen.";
      richGuide.editor.commands.focus(); return;
    }
    const values = {
      id: existing?.id || newId("anliegen"),
      title: $("form-title").value.trim(),
      description: $("form-description").value.trim(),
      type: $("form-type").value,
      area: $("form-area").value,
      categories: Array.from(
        editor.querySelectorAll("input[name=categories]:checked"),
      ).map((el) => el.value),
      keywords: $("form-keywords").value,
      upload: $("form-upload").checked,
      published: $("form-published").checked,
      fields,
      guideText: richGuide.text(),
      guideDocument: richGuide.document(),
      guideImages: guideImages.map((image) => ({ ...image })),
    };
    const nextForms = forms.map(form => form.id === values.id ? values : form);
    if (!existing) nextForms.push(values);
    if (!await savePortalState(areas, nextForms, editor)) return;
    if (slot.dataset.form === values.id) {
      delete slot.dataset.form;
      slot.innerHTML = "";
    }
    location.hash = event.submitter?.dataset.preview
      ? `form/${values.id}`
      : "admin/forms";
  });
}

function renderMissing() {
  app.dataset.view = "missing";
  delete app.dataset.area;
  app.innerHTML =
    '<section class="panel success"><h1>Hier ist noch nichts veröffentlicht.</h1><p>Dieser Bereich oder dieses Anliegen ist nicht verfügbar.</p><a class="btn" href="#home">Zur Startseite</a></section>';
}
function renderPage(route, force = false) {
  if (pageRoute === route && !force) return;
  currentFieldSorter?.destroy();
  currentFieldSorter = null;
  currentGuideEditor?.destroy();
  currentGuideEditor = null;
  pageRoute = route;
  const parts = route.slice(1).split("/");
  if (parts[0] === "home" || !parts[0]) renderHome();
  else if (parts[0] === "area") renderArea(parts[1]);
  else if (parts[0] === "admin") {
    if (parts[1] === "administrators") renderAdministrators();
    else if (parts[1] === "area") renderAreaEditor(parts[2]);
    else if (parts[1] === "form") renderFormEditor(parts[2]);
    else renderAdminList(parts[1] === "forms" ? "forms" : "areas");
  } else renderMissing();
}
function ensurePublic(areaId) {
  if (app.dataset.view === "home") return;
  if (app.dataset.view === "area" && areaById(app.dataset.area)?.published)
    return;
  renderPage(areaById(areaId)?.published ? `#area/${areaId}` : "#home");
}
function route() {
  if (!catalogReady) return;
  const next = location.hash || (adminDocument ? "#admin/areas" : "#home");
  if (next === "#main-content") {
    app.focus();
    return;
  }
  const parts = next.slice(1).split("/");
  if (usesPortalApi && parts[0] === "admin" && !adminDocument) {
    location.assign("/admin/" + next);
    return;
  }
  if (usesCatalogApi && parts[0] === "admin") {
    hideDialog();
    app.innerHTML = '<section class="panel"><h1>Verwaltung noch nicht verfügbar</h1><p>Die Verwaltung mit Anmeldung und dauerhafter Speicherung wird noch eingerichtet.</p><a class="btn" href="#home">Zur Startseite</a></section>';
    pageRoute = "";
    document.title = "Verwaltung · Elim Kirche Serviceportal";
    return;
  }
  if (parts[0] === "form") {
    let id;
    try {
      id = decodeURIComponent(parts[1] || "");
    } catch {
      id = "";
    }
    renderRequest(id);
    showDialog();
    const form = publicForms().find((item) => item.id === id);
    document.title =
      (form ? form.title + " · " : "") + "Elim Kirche Serviceportal";
    return;
  }
  if (parts[0] === "bestaetigung") {
    renderConfirmation();
    showDialog();
    return;
  }
  const closed = hideDialog(),
    changed = pageRoute !== next;
  renderPage(next);
  document.title =
    (app.dataset.view === "admin"
      ? "Verwaltung · "
      : app.dataset.view === "area"
        ? areaById(app.dataset.area).name + " · "
        : "") + "Elim Kirche Serviceportal";
  if (changed && !closed) window.scrollTo(0, 0);
}
window.addEventListener("hashchange", route);
async function loadCatalog() {
  catalogReady = false;
  app.setAttribute("aria-busy", "true");
  app.innerHTML = '<section class="panel" role="status"><h1>Serviceportal wird geladen …</h1></section>';
  try {
    const response = await fetch("/api/catalog", {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error("Katalog nicht verfügbar");
    const catalog = await response.json();
    if (!Array.isArray(catalog.areas) || !Array.isArray(catalog.concerns))
      throw new Error("Ungültiger Katalog");
    if (
      catalog.areas.some((area) =>
        typeof area.id !== "string" || typeof area.name !== "string" ||
        !Array.isArray(area.categories)) ||
      catalog.concerns.some((concern) =>
        typeof concern.id !== "string" || typeof concern.title !== "string" ||
        !catalog.areas.some((area) => area.id === concern.area_id) ||
        !["form", "guide"].includes(concern.type) ||
        !Array.isArray(concern.categories) || !Array.isArray(concern.fields) ||
        concern.fields.some((field) => !Array.isArray(field.options)))
    ) throw new Error("Ungültiger Katalog");
    // Map the public API explicitly; never mix database content with demo records.
    const catalogAreas = catalog.areas.map((area) => ({
      id: area.id,
      name: area.name,
      description: area.description,
      icon: area.icon,
      image: {
        type: "library",
        id: { "areas/it.webp": "it", "areas/haus.webp": "house", "areas/finanzen.webp": "finance" }[area.image_key],
      },
      published: true,
      categories: area.categories.map((category) => ({
        id: category.id,
        name: category.name,
      })),
    }));
    const catalogForms = catalog.concerns.map((concern) => ({
      id: concern.id,
      area: concern.area_id,
      type: concern.type,
      title: concern.title,
      description: concern.description,
      keywords: concern.keywords,
      categories: concern.categories,
      upload: concern.upload_enabled,
      published: true,
      fields: concern.fields,
      guideText: concern.guide_text || "",
      guideImages: [],
    }));
    areas.splice(0, areas.length, ...catalogAreas);
    forms.splice(0, forms.length, ...catalogForms);
    catalogReady = true;
    pageRoute = "";
    route();
  } catch {
    catalogReady = false;
    app.innerHTML = '<section class="panel" role="alert"><h1>Das Serviceportal ist gerade nicht erreichbar.</h1><p>Bitte versuche es noch einmal.</p><button class="btn" id="retry-catalog" type="button">Erneut versuchen</button></section>';
    $("retry-catalog").addEventListener("click", loadCatalog);
  } finally {
    app.removeAttribute("aria-busy");
  }
}
async function loadPortal() {
  catalogReady = false;
  app.setAttribute("aria-busy", "true");
  app.innerHTML = '<section class="panel" role="status"><h1>Serviceportal wird geladen …</h1></section>';
  try {
    const response = await fetch(adminDocument ? "/api/admin/portal" : "/api/portal", {
      cache: "no-store", headers: { Accept: "application/json" }, signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error("Portal nicht verfügbar");
    const state = await response.json();
    if (!Array.isArray(state.areas) || !Array.isArray(state.forms) || !Number.isInteger(state.version))
      throw new Error("Ungültiger Portalstand");
    portalVersion = state.version;
    adminEmail = state.email || "";
    mailSettings = state.submission || { enabled: false, siteKey: "" };
    defaultRecipient = state.defaultRecipient || "";
    document.querySelector(".prototype-note").textContent = "Serviceportal · Testbetrieb";
    areas.splice(0, areas.length, ...state.areas);
    forms.splice(0, forms.length, ...state.forms);
    catalogReady = true;
    pageRoute = "";
    route();
  } catch {
    catalogReady = false;
    app.innerHTML = '<section class="panel" role="alert"><h1>Das Serviceportal ist gerade nicht erreichbar.</h1><p>Bitte versuche es noch einmal. Im Admin-Bereich kann eine erneute Anmeldung nötig sein.</p><button class="btn" id="retry-portal" type="button">Erneut versuchen</button></section>';
    $("retry-portal").addEventListener("click", loadPortal);
  } finally {
    app.removeAttribute("aria-busy");
  }
}
if (usesPortalApi) {
  document.querySelector('footer a[href="#admin/areas"]')?.setAttribute("href", "/admin/#admin/areas");
  loadPortal();
} else if (usesCatalogApi) {
  document.querySelector('footer a[href="#admin/areas"]')?.remove();
  loadCatalog();
} else {
  route();
}
