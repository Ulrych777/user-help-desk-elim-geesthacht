# Wiederherstellung und Rekonstruktion

Stand: 5. November 2026. Gemeint sind Freitag, 30. Oktober, und Samstag, 31. Oktober 2026.

## Was tatsächlich geprüft wurde

- Aktuelle Arbeitsumgebung, Arbeitsverzeichnisse und erreichbare temporäre Dateien.
- Alle Git-Branches, Reflogs, Stashes und nicht referenzierten Git-Objekte.
- Der aktuell von GitHub abgerufene Stand von `Ulrych777/user-help-desk-elim-geesthacht`.

Der einzige erreichbare alte Commit ist `17a09ba` (Initial commit) mit der ursprünglichen README. Für den früheren Prototyp wurden keine Dateien oder Git-Sicherungen gefunden. Die alte Cloud-Umgebung ist nicht mehr verfügbar; ihr Dateisystem lässt sich aus der aktuellen Umgebung nicht auslesen. Ein Chatverlauf enthält Entscheidungen und Teile des Codes, ist aber keine vollständige Dateisicherung.

## Möglichkeiten für eine exakte Wiederherstellung

1. Frühere Nachrichten mit den Links zur Webvorschau öffnen. Falls der HTML-Download noch funktioniert, die damalige `prototype/index.html` herunterladen.
2. Falls ein Browser-Tab mit dem alten Portal noch geöffnet ist, diesen zunächst nicht neu laden. Mit „Seite speichern unter“ (`Strg+S`) als HTML speichern. Der damalige Prototyp enthielt seine Bilder und seinen Code direkt in der HTML-Datei.
3. Downloads, lokale Projektkopien und GitHub-Branches beziehungsweise Pull Requests auf eigene Sicherungen prüfen.
4. Falls die Oberfläche der Cloud-Umgebung eine Rückkehr zum früheren Workspace anbietet, diese prüfen. Ein solcher Wiederherstellungszugriff steht den hier verfügbaren Werkzeugen nicht zur Verfügung.

Eine gefundene alte HTML-Datei hat Vorrang vor einer Rekonstruktion. Darin enthaltene individuelle Änderungen oder Illustrationen lassen sich zuverlässiger erhalten als aus Beschreibungen neu erzeugen.

## Aus dem Verlauf rekonstruierter Stand

- Name: Elim Kirche Serviceportal. Unveränderte originale Wort-Bild-Marke „Elim Kirche“ plus Trennlinie und „Serviceportal“ in Header und Footer (Variante B).
- Geteilte Startseite: große dunkelblaue Suchfläche links, cremefarbene Bereichskacheln rechts. Desktop zwei Kacheln nebeneinander, Smartphone untereinander. Die Suche läuft auf breiten, ausreichend hohen Fenstern innerhalb der Startseite mit und endet vor dem Footer.
- Startseite ohne weitere Navigation, Erklärabschnitte oder dauerhafte Anliegenliste. Treffer erscheinen erst nach einer Suche. Der Footer enthält „Admin-Bereich“ ohne Unterstreichung und bleibt auch bei kurzen Seiten am unteren Bildschirmrand.
- Bereichsseiten mit eigener Suche und Kategorienfilter. Ein Anliegen wird einmal gepflegt und kann mehreren Kategorien des eigenen Bereichs zugeordnet werden.
- Anliegen sind Formulare oder Anleitungen und öffnen als Dialog mit eigenem Link `#form/<kennung>`. Anleitungen enthalten Fließtext und optionale Bilder, danach immer Kontaktfelder für E-Mail, Betreff und Nachricht.
- Formulare mit Name, E-Mail, Betreff, Nachricht und zusätzlichen konfigurierbaren Feldern: kurzer Text, langer Text, E-Mail, Datum, Einfach- oder Mehrfachauswahl.
- Optional bis zu drei Anfrageanhänge mit zusammen maximal 10 MB (JPG, PNG, WebP, PDF). Im Entwurf wird nichts wirklich verschickt oder dauerhaft gespeichert.
- Zentraler Adminbereich für Bereiche, Kategorien, Empfängeradressen und Anliegen. Änderungen gelten im Prototyp nur bis zum Neuladen.
- Bereichsbilder unabhängig vom Symbol: vorhandenes Motiv oder eigener Upload, Kachelvorschau und Pflichtbild zur Veröffentlichung. Eigene Bereichsbilder: JPG, PNG, WebP, bis 5 MB.
- Anleitungsbilder mit Bildbeschreibung, optionaler Bildunterschrift und Absatzposition; bis fünf Bilder mit je maximal 5 MB.
- Lokale Suche mit Synonymen und einfacher Tippfehlertoleranz; keine bereits angebundene KI.
- Direkt kopierender Linkbutton mit Häkchen und „Link kopiert“ für etwa 2,5 Sekunden, ohne zusätzliches Linkfeld. Formularinhalte bleiben beim Schließen und Wiederöffnen desselben Dialogs erhalten.
- Die zuletzt vorbereiteten Formularstyles: warme Eingabeflächen, dunkelblaue Auswahlzustände, größere Checkboxen und passende Fokusmarkierung auch für Suchfelder.

## Dauerhafte Umsetzung weiterhin offen

Das bisherige Ergebnis war ein Oberflächenprototyp. E-Mail-Versand, geschützte Adminanmeldung, dauerhafte Konfiguration und Medienablage, Spam-Schutz und serverseitige Dateiprüfung gehören zur anschließenden Umsetzung. Bereichs- und Anleitungsbilder bleiben später dauerhaft gespeichert; eingereichte Anfrageanhänge werden vorübergehend verarbeitet und nach Übergabe an den Versanddienst gelöscht.

## Neuer Prototyp und Prüfung

`prototype/index.html` ist eine neu erstellte, eigenständige Rekonstruktion mit den oben genannten Funktionen. Die originale Wort-Bild-Marke konnte aus dem Upload gerettet werden. Die vier übrigen Illustrationen wurden neu erzeugt; eine bytegenaue Wiederherstellung der alten Gestaltung und Bilder ist damit nicht behauptet. Eine separate dekorative Pflanze im Hintergrund der Bereichsliste ist in der Rekonstruktion nicht enthalten.

Die Browserprüfung in `scripts/check-prototype.cjs` deckt die Original-Logo-Prüfsumme, Startseite, Suchtreffer, Direktlinks, echte Zwischenablage, Dialogfokus, Formulareingaben und Anfrageanhänge ab. Weiter geprüft wurden Bereichsbilder einschließlich Veröffentlichungspflicht und eigenem Upload, Anleitungstext und Bilder, Bildbeschreibung, Wechsel der Anliegenart, Mehrfachauswahl, deaktivierte Inhalte, eine lange Liste mit acht Bereichen und alle Ansichten bei 768, 390 und 320 Pixeln Breite. Die Prüfungen waren erfolgreich.

`scripts/backup-project.py` erstellt zusätzlich eine portable ZIP-Sicherung mit Prüfsummen und dem zugehörigen Git-Stand. Eine Git-Bundle-Datei kann die lokale Versionsgeschichte unabhängig vom Workspace sichern. Die neu erstellte Arbeitskopie muss zusätzlich im Remote-Repository gespeichert oder heruntergeladen werden, damit ein weiterer Workspace-Wechsel sie nicht wieder unzugänglich macht.

Die Rekonstruktion verwendet den Branch `reconstruction/serviceportal-2026-11-05`. Bei einer späteren Cloud-Umgebung muss dieser Branch statt des noch unveränderten `main` ausgewählt werden. In einer vorhandenen Arbeitskopie lautet der Wechsel:

```sh
git fetch origin
git switch reconstruction/serviceportal-2026-11-05
```

Vor einem Branchwechsel eigene ungesicherte Änderungen separat sichern. Eine heruntergeladene ZIP kann auch ohne Git entpackt werden; darin lässt sich `prototype/index.html` unmittelbar öffnen. Ein Git-Bundle lässt sich mit `git clone <bundle-datei> <zielordner>` als vollständige lokale Arbeitskopie wiederherstellen.
