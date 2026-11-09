# Lokal eingebundene Schrift

Raleway, normale Schnitte 400, 500, 600 und 700, Latin-Untermenge einschließlich
Deutsch und westeuropäischer Zeichen. Quelle: `@fontsource/raleway` 5.3.0,
Dateien `files/raleway-latin-<gewicht>-normal.woff2` aus dem npm-Paket.
Lizenz: SIL Open Font License 1.1, unverändert in `OFL.txt` beigelegt.

Die in der Testervorlage genannten URLs unter elimgeesthacht.de waren aus der
Arbeitsumgebung netzwerkseitig gesperrt. Deshalb stammen die lokal gespeicherten
Dateien aus Fontsource; Bytegleichheit mit den Gemeindedateien wird nicht behauptet.
Es gibt keine Google-Fonts-/Fontsource-Anfragen aus dem Browser.

Der Build bettet die vier WOFF2-Dateien per @font-face in die HTML-Datei ein,
mit font-display: swap. Die Offline-Vorschau und das veröffentlichte Worker-Asset
verwenden damit dieselben Schriftdateien. Andere Schriftsysteme können auf die
lokale Ersatzschrift zurückfallen. Der Schriftzug „Serviceportal“ neben dem
unveränderten Logo bleibt bei der bisherigen Systemschrift.
