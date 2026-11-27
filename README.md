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

## Online
Live-Version: https://hasueralex.github.io/athleten-dashboard/ – wird bei jedem Push auf `main` automatisch über GitHub Actions neu gebaut und veröffentlicht.
