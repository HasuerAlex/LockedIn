# Athleten-Dashboard

Trainingsplan + Habit-Tracker für die Triathlon-/Ironman-Vorbereitung.
React · Tailwind CSS v4 · Lucide-Icons · Vite. Alle Daten liegen im `localStorage` (Präfix `athlete-dashboard:`).

```bash
npm install
npm run dev      # Entwicklung: http://localhost:5173
npm run build    # Produktions-Build nach dist/
```

## Struktur
- `src/App.jsx` – Layout, Wochen-Navigation, localStorage-State
- `src/components/GoalBanner.jsx` – Hauptziel, Countdown, Fortschrittsbalken
- `src/components/WeeklyPlan.jsx` – Wochenplan Mo–So, Zusammenfassung, Modal zum Hinzufügen
- `src/components/HabitTracker.jsx` – Habits, Wochenraster, Streaks
- `src/lib/utils.js` – `useLocalStorage`, Datums-Helfer, Sportarten-Farben
- `src/lib/sync.js` – Google-Anmeldung und Synchronisierung mit Firestore
- `src/components/AccountBar.jsx` – Anmelden/Abmelden und Sync-Status

## Geräteübergreifend speichern (Firebase)
Mit Google-Anmeldung werden alle Daten in Firebase Firestore gespeichert und auf allen Geräten synchronisiert
(auch offline – Änderungen werden nachgeladen). Ohne Konfiguration läuft die App nur mit dem Browser-Speicher.

Einrichtung (einmalig):
1. https://console.firebase.google.com → **Projekt hinzufügen** (Google Analytics ist nicht nötig).
2. **Build → Authentication → Jetzt starten → Anmeldemethode → Google** aktivieren.
3. **Authentication → Einstellungen → Autorisierte Domains → Domain hinzufügen:** `hasueralex.github.io`
4. **Build → Firestore Database → Datenbank erstellen** (Standort z. B. `europe-west3`, Produktionsmodus).
5. **Firestore → Regeln:** Inhalt von [`firestore.rules`](firestore.rules) einfügen und veröffentlichen.
6. **Projekteinstellungen → Allgemein → Deine Apps → Web (`</>`)** → App registrieren → das `firebaseConfig`-Objekt
   in `src/lib/firebase-config.js` eintragen.

Datenmodell: `users/{uid}/data/{goal|plans|habits|habitLog}` – jede Person sieht nur ihre eigenen Daten.

Lokal testen mit dem Firebase-Emulator: `VITE_FIREBASE_EMULATOR=1 npm run dev` (Emulator für Auth und Firestore muss laufen).

## Online
Live-Version: https://hasueralex.github.io/athleten-dashboard/ – wird bei jedem Push auf `main` automatisch über GitHub Actions neu gebaut und veröffentlicht.
