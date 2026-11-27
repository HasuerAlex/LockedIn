/*
 * Gemeinsame Standardwerte für App und Erinnerungs-Skript (scripts/send-reminders.mjs).
 * Bewusst ohne React-Abhängigkeiten, damit Node die Datei direkt laden kann.
 */

/** Grundpunkte – Startliste für alle, die noch keine eigenen Habits haben */
export const DEFAULT_HABITS = [
  { id: 'water', name: '3L Wasser getrunken', icon: 'water' },
  { id: 'sport', name: 'Sport gemacht', icon: 'sport' },
  { id: 'sleep', name: '8h geschlafen', icon: 'sleep' },
]

/** Standard-Uhrzeiten für Erinnerungen */
export const DEFAULT_REMINDERS = {
  training: { enabled: false, time: '07:00' },
  habits: { enabled: false, time: '20:00' },
}
