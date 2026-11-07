# Anleitungen bearbeiten

Im Anliegeneditor die Art „Anleitung“ wählen. Der Texteditor bietet Fett, Kursiv, Unterstrichen, zwei Überschriftenebenen, Aufzählungen, nummerierte Listen, Zitate, Links und das Entfernen von Formatierungen. Rückgängig und Wiederholen funktionieren auch über die üblichen Tastenkürzel.

Die klassische Werkzeugleiste gruppiert diese Funktionen als kompakte Symbole mit Beschriftung beim Überfahren und zugänglichen Namen für Screenreader. Das Dropdown „Absatzformat“ bietet Absatz sowie Überschrift 1 und 2 und zeigt das Format an der aktuellen Textposition. Aktive Formatierungen sind hervorgehoben; nicht verfügbare Verlaufsschritte sind ausgegraut. Auf schmalen Bildschirmen umbrechen die Werkzeuggruppen.

Zum Einfügen eines Bildes den Cursor an die gewünschte Textstelle setzen und „Bild hochladen“ wählen. Neue Bilder erscheinen unmittelbar dort. Über „Bild nach oben“ und „Bild nach unten“ lassen sie sich im Text verschieben. „Aus Text entfernen“ nimmt nur die Einfügung heraus; das hochgeladene Bild bleibt darunter für eine erneute Einfügung verfügbar. „An Textposition einfügen“ fügt ein vorhandenes Bild erneut ein.

Unter dem Editor werden Bildbeschreibung und optionale Bildunterschrift gepflegt. Änderungen erscheinen auch im Texteditor. „Bild löschen“ entfernt das Bild einschließlich seiner Einfügungen aus der Anleitung. Es bleiben höchstens fünf unterschiedliche Bilder mit je 5 MB möglich; erlaubt sind JPG, PNG und WebP. Anleitungstext: höchstens 20.000 Zeichen. „Speichern und ansehen“ öffnet die veröffentlichte Vorschau des gespeicherten Anliegens.

Bestehende Anleitungen werden im Editor mit ihren bisherigen Absätzen und Bildpositionen geöffnet. Beim Speichern ergänzt das Portal ein strukturiertes `guideDocument`; vorhandene Anleitungen ohne dieses Feld bleiben lesbar. Eine Datenbankmigration ist nicht erforderlich. `guideText` bleibt für die Suche erhalten. Bilder bleiben in `guideImages` und im bestehenden geschützten Medienspeicher; Dokumentknoten verweisen ausschließlich auf deren Kennungen.

Tiptap/ProseMirror wird lokal gebündelt und benötigt keinen externen Editor-Dienst oder CDN. Der Server prüft erlaubte Dokumentknoten, Formatierungen, Links und Bildreferenzen sowie Textlänge, Knotenzahl und Verschachtelung. Die öffentliche Ausgabe erzeugt ausschließlich erlaubte HTML-Elemente und maskiert Text. Eingefügtes HTML kann weder Skripte, externe Bilder noch beliebige Stilvorgaben einschleusen.
