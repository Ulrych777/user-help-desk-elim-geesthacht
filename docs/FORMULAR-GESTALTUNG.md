# Formularfelder – Gestaltungsvorschlag

Vorbereitet am 5. November 2026 für das Elim Kirche Serviceportal.

Ergänzung vom 7. November 2026: Die veröffentlichte Webseite gestaltet auch die geöffneten Auswahllisten über `appearance: base-select` und `::picker(select)`. Cremefarbene Flächen, gemeinsame Rundungen, dunkelblaue Auswahlzustände und ein Häkchen kennzeichnen die Auswahl. Lange Einträge umbrechen innerhalb der Feldbreite; die Liste kann scrollen und bei Platzmangel oberhalb des Feldes öffnen. Browser ohne diese CSS-Unterstützung behalten die native Auswahl mit gestalteter Feldoberfläche. Es werden keine eigenen JavaScript-Comboboxen eingeführt. Mausauswahl sowie Tastaturauswahl und Escape innerhalb des Formulardialogs sind durch den Browsertest abgedeckt.

Individuelle Felder lassen sich im Anliegeneditor am gepunkteten Griff per Drag-and-drop sortieren. Alternativ verschieben die Pfeilschaltflächen ein Feld nach oben oder unten; am fokussierten Griff funktionieren auch die Pfeiltasten. Feldnummern, mögliche Bewegungsrichtungen und die Statusmeldung aktualisieren sich nach jeder Änderung. Die bestehenden Eingabeelemente werden verschoben, sodass ungespeicherte Beschriftungen, Typen, Auswahlwerte und Pflichtfeld-Einstellungen erhalten bleiben. „Speichern“ übernimmt die Reihenfolge für das öffentliche Formular und den Versand. Die festen Kontaktfelder bleiben an ihren bisherigen Positionen. SortableJS wird lokal mit dem Editor gebündelt; die bestehende Array-Speicherung benötigt keine Datenbankmigration.

Zu Beginn der Wiederherstellung enthielten die neu gestartete Cloud-Umgebung und der abgerufene GitHub-Stand ausschließlich die ursprüngliche README. Die damalige `prototype/index.html`, Bilder und Projektdokumente waren nicht verfügbar. Inzwischen wurde ein neuer Prototyp aus dem Gesprächsverlauf rekonstruiert; siehe [Wiederherstellung](WIEDERHERSTELLUNG.md).

Die separate [Designvorschau](../prototype/formular-design-vorschau.html) enthält die neue Gestaltung für Textfelder, Dropdowns, Checkboxen und Suchfelder. Die gemeinsame [CSS-Datei](../prototype/form-controls.css) ist auch in den [rekonstruierten Prototyp](../prototype/index.html) integriert. `scripts/build-prototype.cjs` bettet sie nach den übrigen Portalstyles in die eigenständige HTML-Datei ein.

- Warme cremefarbene Eingabeflächen, sanfte Innenkanten und abgerundete Ecken greifen die Karten auf.
- Dunkelblaue Pfeile und Häkchen passen zu den bestehenden Akzenten. Dropdowns und Checkboxen behalten ihre nativen HTML-Elemente und ihre Tastaturbedienung.
- Aktive Felder erhalten einen dunkelblauen Rand. Die sichtbare Fokusmarkierung liegt direkt an der Feldkante, ohne den bisherigen abgesetzten zweiten Rahmen. Sie bleibt bei der Tastaturbedienung klar erkennbar.
- Suchfelder verwenden dasselbe Verhalten. Auf dem dunkelblauen Hintergrund der Startseite ist die Tastaturkontur hell, um sichtbar zu bleiben.
- Checkboxen sind größer, mit breiter anklickbarer Beschriftung. Systemkontrast und reduzierte Bewegung werden berücksichtigt.

Die HTML-Vorschau enthält die CSS-Daten direkt und benötigt keine externen Dateien. Nach einer Änderung an der CSS-Datei aktualisiert `node scripts/build-form-controls-preview.cjs` die eingebetteten Styles. Die Vorschau enthält keine echte Suchfunktion und verschickt keine Anfragen.

Die Vorschau wurde in Chromium mit Maus, Tab-Taste, Leertaste und nativer Dropdown-Auswahl sowie bei 768, 390 und 320 Pixeln Breite geprüft. Es gibt keinen seitlichen Überlauf. Reduzierte Bewegung und Systemkontrast wurden ebenfalls geprüft. Der Feldrand erreicht mindestens 3,5:1 Kontrast zu den umgebenden hellen Flächen; die dunkelblaue Fokusfarbe erreicht über 8:1 zur Eingabefläche. Die Formularfunktionen und responsive Darstellung wurden zusätzlich im rekonstruierten Portal geprüft.
