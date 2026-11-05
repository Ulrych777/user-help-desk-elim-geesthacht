# Elim Kirche Serviceportal

Rekonstruierter Planungsstand vom 5. November 2026.

## Ziel und Umfang

Ein öffentliches, einfach bedienbares Serviceportal für Anliegen der Gemeinde ersetzt das überdimensionierte Atlassian-Portal. Anfragen gehen zur Bearbeitung an das zuständige E-Mail-Postfach. Eine eigene Ticketverwaltung, Nutzerkonten für Anfragende und eine Speicherung der Anfragen im Portal sind zunächst nicht vorgesehen.

Die spätere Gemeindedomain ist vorhanden; für die Entwicklung wurde `glennritter.de` genannt. Domain, Hosting, Versanddienst und Adminanmeldung sind noch nicht technisch eingerichtet. Bestehende Weiterleitungen sollen erst nach erfolgreicher Abnahme umgestellt werden.

## Vereinbarte Funktionen

1. Startseite mit globaler Suche und großen Bereichskacheln. Kategorien strukturieren Anliegen innerhalb eines Bereichs; sie verändern nicht den Empfänger.
2. Eigene Bereichsseiten mit Bereichssuche und Kategorienfilter. Ein Anliegen gehört einem Bereich und kann dort mehreren Kategorien angehören, wird aber nur einmal gepflegt und angezeigt.
3. Anliegen sind Formulare oder Anleitungen. Beide öffnen als Dialog mit teilbarem Link. Anleitungen enden immer mit einem Kontaktformular aus E-Mail-Adresse, Betreff und Nachricht.
4. Zentrale Verwaltung durch das IT-Team für Bereiche, Kategorien, Empfängeradressen, Formulare und Anleitungen. Die späteren Adminzugänge müssen geschützt werden; die Empfängerteams bearbeiten ihre Postfächer ohne eigenen Portalzugang.
5. Ein Bereich benötigt ein passendes Bild zur Veröffentlichung. Vorhandene Motive oder eigene Bilder können gewählt und in der Kachelvorschau geprüft werden. Das IT-Team beurteilt die thematische Eignung und den einheitlichen Illustrationsstil.
6. Formularfelder: kurzer/langer Text, E-Mail, Datum, Einfach- und Mehrfachauswahl, Pflichtfelder und optionaler Dateiupload. Ein bedingter Formularbaukasten ist zunächst nicht erforderlich.
7. Lokale Suche mit Synonymen und Tippfehlertoleranz. Eine spätere optionale semantische oder LLM-Suche darf ausschließlich veröffentlichte Katalogeinträge empfehlen und keine Anfrage selbstständig versenden. Anbieter, Kosten und Datenverarbeitung sind offen.

## E-Mail und Dateien im späteren Betrieb

- Jede Bereichsverwaltung enthält eine Empfängeradresse. Die Absenderadresse des Versanddienstes wird fest konfiguriert; die Adresse des Anfragenden wird als Reply-To verwendet.
- Die Nachricht enthält Bereich, Anliegen, alle ausgefüllten Felder und eine Vorgangsnummer. Die konkrete Bestätigungsmail an Anfragende ist noch festzulegen.
- Anfrageanhänge werden vorübergehend geprüft und verarbeitet, als Anhänge verschickt und nach Annahme durch den Versanddienst gelöscht. Die Annahme ist noch kein Nachweis der endgültigen Zustellung.
- Bei Fehlern erscheint keine Erfolgsmeldung. Wiederholungsversuche und automatische Bereinigung verwaister temporärer Dateien sind nötig; eine maximale Aufbewahrungsdauer muss festgelegt werden.
- Bereichs- und Anleitungsbilder sind dauerhaft gespeicherte Portalmedien und werden mit der Konfiguration gesichert. Sie werden beim Versand einer Anfrage nicht gelöscht.
- Spam-Schutz, Ratenbegrenzung, verbindliche serverseitige Eingabe- und Dateiprüfung sowie Datenschutz-/Kontaktinformationen gehören vor die Veröffentlichung.

## Gestaltung

Gewählt ist das geteilte Layout (Variante E): dunkelblaue Suchfläche links, warme cremefarbene Bereichskarten rechts, dezente Rundungen, schmale Lichtkanten und Schatten. Der starke Polstereffekt wurde zugunsten einer leichten Wölbung zurückgenommen. In Bereichskarten steht kein zusätzlicher Linktext. Die originale Wort-Bild-Marke bleibt unverändert; „Serviceportal“ wird nach einer feinen senkrechten Linie ergänzt (Variante B), auch im Footer. Dort steht „Admin-Bereich“ ohne Unterstreichung.

Die Rekonstruktion übernimmt diese Anordnung und die zuletzt überarbeitete Feldgestaltung. Die neuen Illustrationen und einzelne Abstände können vom verlorenen Entwurf abweichen. Die ursprünglichen Mockup-Dateien sind in dieser Umgebung nicht vorhanden.

## Nächste Projektphasen

1. Rekonstruktion gemeinsam mit den letzten Screenshots und Entscheidungen abgleichen. Tatsächliche Startbereiche, Anliegen, Formularfelder, Empfänger und Anleitungstexte festlegen.
2. Hosting, Adminanmeldung, Konfigurationsspeicher und E-Mail-Versand auswählen. Bereichs-/Anleitungsmedien und temporäre Anfrageanhänge getrennt speichern.
3. Backend, Versand, Spam-Schutz, Dateiprüfung und geschützte Verwaltung umsetzen. Fehlerfälle und Löschung nachvollziehbar prüfen.
4. Mit den zuständigen Teams auf Desktop und Smartphone testen: Zuständigkeit, Suchtreffer, Pflichtangaben, Bildverwaltung, Anhänge, Direktlinks und Datenschutz.
5. Erst nach Abnahme die Gemeinde-Domain umstellen. Regelmäßige Sicherungen, Zuständigkeiten und Wartung dokumentieren.

Der aktuelle Prototyp deckt die Oberfläche und simulierte Abläufe ab, nicht den produktiven Betrieb.
