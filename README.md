# LockedIn

LockedIn – Trainingsplan + Habit-Tracker für die Triathlon-/Ironman-Vorbereitung.
React · Tailwind CSS v4 · Lucide-Icons · Vite. Daten werden nach Google-Anmeldung in Firebase gespeichert (siehe unten).

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
Gespeichert wird nur mit Google-Anmeldung: Alle Daten liegen in Firebase Firestore und werden auf allen Geräten
synchronisiert (auch offline – Änderungen werden nachgeladen). Ohne Anmeldung startet die App leer und speichert nichts;
beim Abmelden werden die Daten vom Gerät entfernt.

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

## Push-Erinnerungen
Über das Zahnrad oben öffnen sich die Einstellungen. Dort schaltet man Push-Benachrichtigungen pro Gerät ein und stellt
die Uhrzeiten für die Training- und Habit-Erinnerung ein (gespeichert in `reminders/{uid}`).
- Versand: `.github/workflows/reminders.yml` startet alle 15 Minuten `scripts/send-reminders.mjs`, das fällige
  Erinnerungen über Firebase Cloud Messaging verschickt (Secret `FIREBASE_SERVICE_ACCOUNT`).
- Einrichtung: öffentlichen Web-Push-Schlüssel (Firebase → Projekteinstellungen → Cloud Messaging → Web-Push-Zertifikate)
  in `src/lib/firebase-config.js` als `vapidKey` eintragen.
- iPhone/iPad: nur wenn LockedIn über „Teilen → Zum Home-Bildschirm“ installiert ist (iOS 16.4+).
- Lokal testen: Emulator starten, dann `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 node scripts/send-reminders.mjs`
  (verschickt nichts, gibt nur aus).

## Online
Live-Version: **https://lockedin-habit.web.app** (Firebase Hosting), zusätzlich https://hasueralex.github.io/LockedIn/.
Bei jedem Push auf `main` baut GitHub Actions die App und veröffentlicht sie an beiden Orten.
Für Firebase braucht das Repo das Secret `FIREBASE_SERVICE_ACCOUNT` (privater Schlüssel eines Dienstkontos aus den Firebase-Projekteinstellungen).
