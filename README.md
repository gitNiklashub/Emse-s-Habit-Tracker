# Emse's Habit Tracker 🌸

Ein simpler, cleaner Habit Tracker in Pastellfarben — ohne Build-Tools, ohne Backend.
Alle Daten bleiben **lokal auf dem Gerät** (localStorage im Browser).

## Features

- Habits anlegen mit Name, Emoji, Pastellfarbe und Regelmäßigkeit
  (täglich, x-mal pro Woche, x-mal pro Monat)
- Tägliches Abhaken mit Streak-Anzeige 🔥
- Wochen-Auswertung: 7-Tage-Übersicht pro Habit + Gesamtquote
- Monats-Auswertung: Kalender-Grid pro Habit + Gesamtquote
- Vergangene Tage nachtragen (in der Statistik auf einen Tag tippen)
- Export/Import als JSON-Backup (Einstellungen ⚙︎)
- Offline nutzbar (PWA mit Service Worker)

## Auf GitHub Pages veröffentlichen

1. Repo auf GitHub anlegen und diese Dateien pushen (auf den `main`-Branch).
2. Im Repo: **Settings → Pages → Source: „Deploy from a branch“**,
   Branch `main`, Ordner `/ (root)` auswählen, speichern.
3. Nach 1–2 Minuten ist die App unter
   `https://<username>.github.io/<repo-name>/` erreichbar.

Alle Pfade sind relativ — die App funktioniert also auch im Unterpfad
von GitHub Pages ohne Anpassung.

## Aufs iPhone holen (Home-Bildschirm)

1. Die GitHub-Pages-URL in **Safari** öffnen (nicht Chrome).
2. **Teilen-Button** (Quadrat mit Pfeil) → **„Zum Home-Bildschirm“**.
3. Die App startet dann im Vollbild wie eine native App und
   funktioniert auch offline.

> **Wichtig:** Die Daten liegen im Browser-Speicher der installierten
> Web-App. Wer das App-Icon vom Homescreen löscht, löscht auch die Daten.
> Regelmäßig über ⚙︎ → Exportieren ein Backup sichern.

## Entwicklung

Kein Build nötig. Lokal testen:

```bash
python3 -m http.server 8080
# → http://localhost:8080
```

Bei jedem Update drei Stellen pflegen:
1. `VERSION` in `sw.js` hochzählen (Cache-Invalidierung)
2. `?v=` an den Asset-Links in `index.html` anpassen
3. `APP_VERSION` + `CHANGELOG`-Eintrag in `app.js` ergänzen —
   daraus baut die App die einmalige „Was ist neu"-Karte

## Dateien

| Datei | Zweck |
|---|---|
| `index.html` | App-Shell (Heute, Statistik, Sheets) |
| `style.css` | Pastell-Design |
| `app.js` | Logik: Habits, Logs, Streaks, Auswertungen |
| `manifest.webmanifest` | PWA-Manifest (Name, Icons, Standalone) |
| `sw.js` | Service Worker (Offline-Cache) |
| `icons/` | App-Icons (180/192/512 px) |
