# Elim Kirche Serviceportal

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

**Prototyp:** Es gibt noch keine echte Anmeldung, keine dauerhafte Speicherung, keinen Spam-Schutz und keinen E-Mail-Versand. Alle Änderungen und hinzugefügten Bilder gehen beim Neuladen verloren. Empfängeradressen unter `example.org` sind Beispiele. Die WLAN-Anleitung ist ein ungeprüfter Beispielinhalt und enthält keine echten Zugangsdaten.

Anfrageanhänge: höchstens drei Dateien mit zusammen 10 MB, JPG/PNG/WebP/PDF. Eigene Bereichsbilder: JPG/PNG/WebP bis 5 MB. Anleitungsbilder: höchstens fünf Bilder mit je 5 MB, einschließlich Bildbeschreibung, optionaler Bildunterschrift und Absatzposition. Die Bildlesbarkeit wird im Browser geprüft; verbindliche serverseitige Prüfungen gehören zur späteren Anwendung.

## Quellcode und Sicherung

Die bearbeitbaren Quellen liegen in `prototype/portal.template.html`, `prototype/portal.css`, `prototype/form-controls.css` und `prototype/portal.js`. Nach Änderungen erstellt `node scripts/build-prototype.cjs` die vollständig eigenständige `prototype/index.html` neu. Die reine [Formularvorschau](prototype/formular-design-vorschau.html) wird mit `node scripts/build-form-controls-preview.cjs` aktualisiert.

`python3 scripts/backup-project.py` erstellt unter `backups/` eine ZIP-Datei mit Quellen, Vorschau, Dokumentation, Originalbildern und Prüfsummen. Git-Sicherungen sollen zusätzlich nach abgeschlossenen Änderungen auf einen Remote-Branch übertragen werden; eine ausschließlich lokale Cloud-Arbeitskopie genügt nicht als dauerhafte Sicherung.

Die automatisierte Browserprüfung läuft mit `node scripts/check-prototype.cjs`. Dafür werden Playwright und Chromium benötigt; in der aktuellen Cloud-Umgebung sind beide vorhanden. Die Prüfung verwendet nur einen temporären lokalen Server und simulierte Anfragen.

Weitere Informationen: [Wiederherstellung](docs/WIEDERHERSTELLUNG.md), [Projektplan](docs/PROJEKTPLAN.md), [Bildherkunft](prototype/assets/README.md).
