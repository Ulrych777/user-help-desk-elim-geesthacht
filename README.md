# Elim Kirche Serviceportal

**Vollständige Entwicklungsseite:** https://serviceportal.glennritter.de

**Admin-Vorschau:** https://serviceportal.glennritter.de/#admin/areas

Diese Adresse zeigt den vollständigen Prototyp aus GitHub `main` mit allen
Bereichen, Formularen, Anleitungen und Admin-Editoren. Der Entwicklungsablauf ist:
Feedback im Chat → Quellcode ändern → prüfen → Commit auf GitHub `main` →
`npm run deploy:preview` → dieselbe Seite im Browser neu laden.
GitHub-Pushes allein lösen kein automatisches Deployment aus.

Änderungen am Code werden über diesen Ablauf dauerhaft veröffentlicht. Änderungen
innerhalb der Admin-Vorschau gelten weiterhin nur bis zum Neuladen; Anmeldung,
dauerhafte Verwaltung und echter E-Mail-Versand sind noch nicht umgesetzt.

Rekonstruktion des gemeinsam entwickelten Oberflächenprototyps, Stand 5. November 2026. Die ursprünglichen Dateien vom 30./31. Oktober waren nach einem Wechsel der Cloud-Umgebung nicht mehr verfügbar und nicht in Git gesichert. Funktionen und Gestaltung wurden anhand des Gesprächsverlaufs neu aufgebaut. Das Original-Logo ist unverändert aus der bereitgestellten ZIP übernommen; die übrigen Illustrationen sind neu erstellt. Dies ist keine bytegenaue Wiederherstellung.

## Vorschau öffnen

[Serviceportal öffnen](prototype/index.html). Die Datei enthält CSS, JavaScript, Logo und Illustrationen direkt und lässt sich auch ohne Build oder Bildserver öffnen. Kopieren in die Zwischenablage hängt von den Berechtigungen des Browsers ab; alternativ kann der Anliegenlink aus der Adressleiste kopiert werden.

Bei Bedarf lokal ausliefern: `python3 -m http.server 8000 --directory prototype` und anschließend `http://localhost:8000` öffnen.

## Wieder aufgebauter Stand

- Geteilte Startseite mit dunkelblauer Suchfläche und großen Bereichskacheln; auf Desktop zwei pro Reihe, auf Smartphones untereinander. Die Suche bleibt bei langen Bereichslisten auf ausreichend breiten und hohen Bildschirmen erreichbar.
- Bereiche IT, Haus & Hof und Finanzbuchhaltung als Beispiele, jeweils mit eigener Suche und Kategorienfilter. Die globale Suche gewichtet Begriffe, Synonyme und einfache Tippfehler lokal im Browser; es ist kein LLM angebunden.
- Formulare und Anleitungen als Dialoge mit eigenen Links. Ein Anliegen kann mehreren Kategorien des eigenen Bereichs zugeordnet werden. Schließen, Escape, Hintergrundklick und Browser-Zurück funktionieren; derselbe Formularentwurf bleibt beim Wiederöffnen erhalten.
- Direkte Linkkopie mit kurzer Bestätigung „Link kopiert“ und Häkchen im Button, ohne zusätzliches Linkfeld.
- Formulare mit konfigurierbaren zusätzlichen Feldern und optionalen Anhängen. Anleitungen mit Text, Bildern und abschließendem Kontaktformular (eigene E-Mail-Adresse, Betreff, Nachricht).
- Zentrale Admin-Vorschau über „Admin-Bereich“ im Footer. Bereiche, Empfängeradressen, Kategorien, Anliegenarten, Felder und Bilder lassen sich bearbeiten.
- Eigenes Bereichsbild unabhängig vom Symbol, vorhandenes Motiv oder Upload mit Kachelvorschau. Ein Bild ist zur Veröffentlichung erforderlich; unveröffentlichte Bereiche dürfen zunächst ohne Bild gespeichert werden.
- Vereinheitlichte warme Formularfelder, dunkelblaue Auswahlzustände und passende Fokusmarkierungen. Der Footer bleibt auch bei kurzen Seiten am unteren Rand.

**Entwicklungsstand:** Die vollständige Entwicklungsseite (`preview`) und die eigenständige Datei `prototype/index.html` verwenden die eingebetteten Prototypdaten samt Admin-Vorschau. Die separate API-Version (`test`) lädt Bereiche, Kategorien, Anliegen, Formularfelder und Anleitungstexte aus D1 über `/api/catalog`; dort ist die Admin-Vorschau ausgeblendet. Eine Verwaltung mit Anmeldung und dauerhafter Speicherung fehlt noch. Ebenso fehlen Spam-Schutz und E-Mail-Versand. Anfragen werden weiterhin nur simuliert. Änderungen in der Admin-Vorschau und hinzugefügte Bilder gehen beim Neuladen verloren. Empfängeradressen unter `example.org` sind Beispiele. Die WLAN-Anleitung ist ein ungeprüfter Beispielinhalt und enthält keine echten Zugangsdaten.

Der separate API-Build kennzeichnet seine HTML-Datei mit `data-catalog-source="api"`. Bis zum Laden zeigt die Oberfläche einen Ladehinweis. Fehler bieten einen Wiederholungsbutton; es gibt keinen Rückfall auf eingebettete Beispieldaten. Ein leerer Katalog zeigt einen Leerzustand. Die drei bestehenden Bereichsbilder werden über ihre bekannten `image_key`-Werte den eingebetteten Motiven zugeordnet. Eigene R2-Bilder und Anleitungsbilder aus D1 sind noch nicht angebunden. Der vollständige Preview-Build setzt diese API-Markierung nicht und erhält sämtliche eingebetteten Inhalte.

Anfrageanhänge: höchstens drei Dateien mit zusammen 10 MB, JPG/PNG/WebP/PDF. Eigene Bereichsbilder: transparente PNG-/WebP-Dateien bis 5 MB; der Editor vereinheitlicht sie auf eine transparente Leinwand mit 1536 × 1024 Pixeln. Im Editor eines Bereichs kann ausschließlich dessen aktuelles Bild als Stilvorlage heruntergeladen oder ersetzt werden. Anleitungsbilder: höchstens fünf Bilder mit je 5 MB, einschließlich Bildbeschreibung, optionaler Bildunterschrift und Absatzposition. Die Bildlesbarkeit wird im Browser geprüft; verbindliche serverseitige Prüfungen gehören zur späteren Anwendung.

## Quellcode und Sicherung

Die bearbeitbaren Quellen liegen in `prototype/portal.template.html`, `prototype/portal.css`, `prototype/form-controls.css` und `prototype/portal.js`. Nach Änderungen erstellt `node scripts/build-prototype.cjs` die vollständig eigenständige `prototype/index.html` neu. Die reine [Formularvorschau](prototype/formular-design-vorschau.html) wird mit `node scripts/build-form-controls-preview.cjs` aktualisiert.

`python3 scripts/backup-project.py` erstellt unter `backups/` eine ZIP-Datei mit Quellen, Vorschau, Dokumentation, Originalbildern und Prüfsummen. Git-Sicherungen sollen zusätzlich nach abgeschlossenen Änderungen auf einen Remote-Branch übertragen werden; eine ausschließlich lokale Cloud-Arbeitskopie genügt nicht als dauerhafte Sicherung.

Die automatisierte Browserprüfung läuft mit `node scripts/check-prototype.cjs`. Dafür werden Playwright und Chromium benötigt; in der aktuellen Cloud-Umgebung sind beide vorhanden. Die Prüfung verwendet nur einen temporären lokalen Server und simulierte Anfragen.

## Cloudflare-Anwendung lokal starten

Voraussetzung ist Node.js. Danach:

```bash
npm install
npm run db:migrate:local
npm run db:seed:local
npm run dev
```

Wrangler stellt die Anwendung standardmäßig unter `http://localhost:8787` bereit. `GET /api/health` prüft die lokale D1-Verbindung; `GET /api/catalog` liefert die veröffentlichten Bereiche, Kategorien, Anliegen und Formularfelder. Die lokale Datenbank liegt im ignorierten Verzeichnis `.wrangler/`.

`npm run check` baut Website und Worker, prüft TypeScript und führt eine Cloudflare-Trockenprüfung aus. Für die öffentliche Testumgebung wird `npm run deploy:test` verwendet. Der allgemeine Befehl `npm run deploy` enthält weiterhin lokale Ressourcen-Platzhalter und ist kein Produktionsdeployment. Zugangsdaten werden als Cloudflare-Secrets oder geschützte Umgebungsvariablen hinterlegt und niemals in Git gespeichert.

## Vollständige Entwicklungsseite veröffentlichen

Die Wrangler-Umgebung `preview` betreibt `elim-serviceportal-preview` mit der
Custom Domain `serviceportal.glennritter.de`. Cloudflare verwaltet DNS und TLS
für diese Domain. Die Assets liegen im ignorierten Buildverzeichnis
`public-preview/`; die bearbeitbaren Quellen bleiben unter `prototype/`.

```bash
npm run check:preview
PORTAL_PREVIEW_FILE=public-preview/index.html node scripts/check-prototype.cjs
git add <bearbeitete-Dateien>
git commit -m "Änderung beschreiben"
git push origin main
npm run deploy:preview
```

Der letzte Befehl baut und prüft die vollständige Vorschau, prüft den sauberen
Git-Stand gegen GitHub `main` und veröffentlicht genau diesen Stand. Die
HTML-Metadaten `serviceportal-build` enthalten den Commit der Bereitstellung.
Mit freigegebener Domain kann die gesamte Browserprüfung auch gegen die
veröffentlichte Seite laufen:

```bash
PORTAL_PREVIEW_URL=https://serviceportal.glennritter.de node scripts/check-prototype.cjs
```

Die Vorschau nutzt für die lesenden API-Endpunkte die vorhandenen
Test-D1-/R2-Bindings; ihre Oberfläche und Admin-Editoren verwenden bewusst den
vollständigen eingebetteten Datenstand. Ein Preview-Deployment ändert keine
Datenbankeinträge.

## Separate API-Testumgebung

Testseite: **https://elim-serviceportal-test.glenn-ritter5994.workers.dev**

Die Adresse läuft auf Cloudflare und ist unabhängig von der Codex-Arbeitsumgebung erreichbar. Sie zeigt den zuletzt bereitgestellten Code; lokale Änderungen werden erst nach einem weiteren Deployment sichtbar. Die Umgebung enthält ausschließlich Beispieldaten und simuliert das Absenden. Es gibt noch keine Anmeldung, dauerhafte Admin-Verwaltung oder E-Mail-Zustellung.

Die benannte Wrangler-Umgebung `test` verwendet eigene Ressourcen:

- Worker: `elim-serviceportal-test`
- D1: `elim-serviceportal-test-db` (EU, ID in `wrangler.jsonc`)
- R2: `elim-serviceportal-test-media`

Die Ehrenamtplattform und die Gemeinde-Domain werden durch diese Befehle nicht verändert.

In diesem Repository arbeiten und nach Änderungen ausführen:

```bash
npm ci
npm run check
# Bei laufendem lokalen Worker:
node scripts/check-catalog.cjs
node scripts/check-prototype.cjs
# Geprüften Stand auf dieselbe öffentliche Test-URL bereitstellen:
npm run deploy:test
```

In der verwalteten Codex-Umgebung zuvor die beschreibbaren Cache-/Konfigurationspfade setzen:

```bash
export npm_config_cache=/workspace/.cache/npm
export XDG_CONFIG_HOME=/workspace/.config
export WRANGLER_SEND_METRICS=false
export CI=true
```

Für Cloudflare-Befehle muss `CLOUDFLARE_API_TOKEN` sicher bereitgestellt und für `api.cloudflare.com` freigegeben sein. `npm run deploy:test` prüft Build und TypeScript, führt einen Trockenlauf aus, wendet ausstehende Migrationen auf die Test-Datenbank an und veröffentlicht den Worker samt Website. Bestehende Testdaten werden nicht automatisch neu geladen. `npm run db:seed:test` lädt die Beispieldaten nur dann, wenn sämtliche Anwendungstabellen leer sind; vorhandene Daten bleiben erhalten.

Nach einem Deployment `/api/health` (ok=true, environment="test", database="ready"), `/api/catalog`, Startseite und einen Anliegen-Direktlink prüfen. Der Browsertest kann über `PORTAL_TEST_URL=https://elim-serviceportal-test.glenn-ritter5994.workers.dev node scripts/check-catalog.cjs` gegen die Testseite laufen. Aus der Codex-Umgebung muss dafür zusätzlich der exakte Test-Hostname freigegeben sein.

Bei laufendem lokalen Worker mit geladenen Beispieldaten prüft `node scripts/check-catalog.cjs` die API-Anbindung im Browser: D1-Daten, Direktlinks, Formularfelder, Anleitungstexte, Suche sowie Ladefehler, Wiederholung und leere/ungültige Kataloge. Die Prüfung benötigt dieselben Playwright-/Chromium-Voraussetzungen wie die Prototypprüfung und verändert keine Datenbankeinträge.

Weitere Informationen: [Wiederherstellung](docs/WIEDERHERSTELLUNG.md), [Projektplan](docs/PROJEKTPLAN.md), [Bildherkunft](prototype/assets/README.md).
