# Gestaltung des Elim Kirche Serviceportals

Leere Suchergebnisse erhalten eine freundliche Lupe mit leeren Karten und Pflanze im bestehenden 3D-Stil. Das transparente WebP-Motiv ist lokal eingebettet; es lädt keine externen Ressourcen. „Auf Spurensuche“ ergänzt den klaren Hinweis auf fehlende Treffer, und „Suche zurücksetzen“ leert Suchbegriff und gegebenenfalls Kategorie. Verweise auf allgemeine Anfragen bleiben entfernt. Bereiche ohne veröffentlichte Anliegen zeigen stattdessen „Hier ist noch Platz für Neues“ und führen zur Bereichsübersicht, damit ein leerer Bereich nicht als fehlerhafte Suche erscheint. Auf schmalen Bildschirmen stehen Illustration und Text untereinander.

Die großen Karten verwenden jetzt dieselben kissenförmigen Innenkanten wie die Bereichskacheln der Startseite: Anliegenkacheln, Formular- und Anleitungsflächen, Verwaltungskarten, Suchfilter, Leerzustände und Anmeldestatus. Bereichsbanner, dunkelblaue Überschriften, Kontaktkacheln und die Verwaltungsnavigation erhalten denselben Effekt mit dezenten, zur dunklen Fläche passenden Licht- und Schattenfarben. Gemeinsame CSS-Variablen steuern die Innenkanten. Die dekorative Ebene nimmt keine Klicks entgegen und verändert weder Abstände noch die Bedienung von Feldern und Schaltflächen.

Im Bereichseditor wird das Motiv ausschließlich unter „Bereichsbild“ hochgeladen, ersetzt, entfernt und in der Vorschau kontrolliert. Die unabhängige Symbolauswahl entfällt. Bestehende Bilder bleiben erhalten und werden weiterhin für Startseitenkachel und Bereichsbanner verwendet.

Am 7. November 2026 wurden Typografie und Formulargestaltung vereinheitlicht: Eine gemeinsame Systemschrift gilt für Navigation, Inhalte, Eingaben und Schaltflächen. Zentrale CSS-Variablen legen 14 px für Beschriftungen und Hilfetexte, 16 px für Fließtext und Eingaben, 20 px für Abschnittstitel, 24 px für Kartentitel und 28–36 px für Seitentitel fest. Die große Einstiegsfrage auf der Startseite behält ihre hervorgehobene Größe. Abstände und Rundungen folgen gemeinsamen Vorgaben; die Schriftgrößen skalieren mit der Browser-Grundeinstellung.

Die Kontaktkachel nutzt zwei gleich große Textabsätze ohne wiederholten Antwort-Hinweis. Der Anmeldestatus in der Verwaltung erscheint als helle Karte mit dunkelblauem Text, Kontoadresse und Abmelde-Schaltfläche. Gelbe Warnfarben bleiben damit aus dem normalen Anmeldestatus entfernt. Startseite, Bereiche, Formulare, Anleitungen und Verwaltung verwenden dieselben Textrollen.

Stand 5. November 2026. Die Startseite orientiert sich wieder an der erneut bereitgestellten Vorlage **E · Geteiltes Layout / Service-Station**. Der [Browserabgleich](design/startseite-mockup-abgleich.png) zeigt die Umsetzung.

Links stehen auf dunkelblauem Hintergrund die große Frage, ein kurzer Einstiegstext und das Suchfeld. Darunter erscheint die rechteckige offene Tür mit warmem Innenlicht, Pflanze, Briefsymbol und Werkzeug. Die linke Suchfläche bleibt beim Scrollen auf breiten und ausreichend hohen Bildschirmen erreichbar und endet vor dem Footer.

Die mitlaufende Suchfläche ist mindestens so hoch wie das Browserfenster. Dadurch bleibt unter dem Bild beim Scrollen kein dunkelblauer Hintergrundstreifen sichtbar. Auf großen Bildschirmen bleibt die bisherige Mindesthöhe von 930 px erhalten; die Höhe ist nach oben nicht mehr begrenzt. Sobald der Footer erreicht wird, schließt das Bild bündig mit ihm ab. Die statische Darstellung auf schmalen oder sehr flachen Bildschirmen bleibt bestehen.

Rechts stehen „Unsere Bereiche“ und die warmen, leicht gewölbten Kacheln. Die Bilder zeigen einen Monitor mit leerem Bildschirm, ein schlichtes Haus und einen Rechner mit Dokument. Ihre transparenten Hintergründe fügen sich in die Kartenfläche ein. Eine weich unscharfe Pflanze liegt rechts unten als angeschnittene Dekoration hinter den Kacheln. Sie erhält den Raum bis zum Footer und erscheint auf schmalen Bildschirmen nicht.

Auf dem Desktop stehen zwei Bereichskacheln nebeneinander, auf dem Smartphone untereinander. Das Suchfeld bleibt auf schmalen oder sehr flachen Bildschirmen im normalen Seitenfluss. Weitere Bereiche lassen die Übersicht nach unten wachsen.

Die nach dem ursprünglichen Mockup ausdrücklich beschlossenen Anpassungen bleiben erhalten: unveränderte originale Wort-Bild-Marke mit Trennlinie und Zusatz „Serviceportal“ in Header und Footer, „Admin-Bereich“ ohne Unterstreichung im Footer und kein zusätzlicher Text „Anliegen ansehen“ innerhalb der vollständig anklickbaren Bereichskacheln.

Alle Motive sind direkt in die HTML-Vorschau eingebettet. Das gilt auch für die Hintergrundpflanze. Die bestehenden Abläufe für Suche, Bereichsseiten, Dialoge und Verwaltung wurden in Chromium einschließlich acht Beispielbereichen und Bildschirmbreiten bis 320 Pixeln geprüft. Die ursprünglichen Logo-Bytes bleiben unverändert.
