import { useState } from 'react'
import { Check, Flame, Plus, Trash2 } from 'lucide-react'
import { WEEKDAYS, WEEKDAYS_LONG, addDays, fmtDate, toKey, uid } from '../lib/utils'

/** Tage in Folge bis heute. Ist heute noch offen, zählt die Serie ab gestern – sie ist ja noch nicht gerissen. */
function streakOf(isDone, today) {
  let day = isDone(toKey(today)) ? today : addDays(today, -1)
  let count = 0
  while (isDone(toKey(day))) {
    count++
    day = addDays(day, -1)
  }
  return count
}

const days = (n) => `${n} ${n === 1 ? 'Tag' : 'Tage'}`

export default function HabitTracker({ weekStart, today, habits, setHabits, log, setLog, onDeleted }) {
  const [newHabit, setNewHabit] = useState('')
  const todayKey = toKey(today)
  const week = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const isDone = (habitId, key) => Boolean(log[habitId]?.[key])

  const toggle = (habitId, key) =>
    setLog((l) => {
      const entries = { ...(l[habitId] ?? {}) }
      if (entries[key]) delete entries[key]
      else entries[key] = true
      return { ...l, [habitId]: entries }
    })

  const addHabit = (e) => {
    e.preventDefault()
    const name = newHabit.trim()
    if (!name) return
    setHabits((h) => [...h, { id: uid(), name }])
    setNewHabit('')
  }

  // Löschen ohne Rückfrage, dafür mit „Widerrufen“ (Habit inkl. Verlauf kommt zurück)
  const removeHabit = (habit) => {
    const index = habits.findIndex((h) => h.id === habit.id)
    const history = log[habit.id]
    setHabits((list) => list.filter((h) => h.id !== habit.id))
    setLog((l) => {
      const { [habit.id]: _, ...rest } = l
      return rest
    })
    onDeleted(`„${habit.name}“ gelöscht`, () => {
      setHabits((list) => {
        const next = [...list]
        next.splice(index, 0, habit)
        return next
      })
      if (history) setLog((l) => ({ ...l, [habit.id]: history }))
    })
  }

  const doneToday = habits.filter((h) => isDone(h.id, todayKey)).length
  const perfectStreak = habits.length ? streakOf((key) => habits.every((h) => isDone(h.id, key)), today) : 0

  return (
    <section aria-labelledby="habits-title" className="space-y-4">
      <div className="px-1">
        <h2 id="habits-title" className="text-title-2 font-bold">
          Habits
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-3xl bg-surface p-4">
          <p className="text-subhead text-label-2">Heute erledigt</p>
          <p className="text-title-2 font-bold tabular-nums">
            {doneToday} <span className="font-semibold text-label-2">von {habits.length}</span>
          </p>
        </div>
        <div className="rounded-3xl bg-surface p-4">
          <p className="text-subhead text-label-2">Perfekte Tage</p>
          <p className="text-title-2 font-bold tabular-nums">{days(perfectStreak)}</p>
        </div>
      </div>

      <div className="rounded-3xl bg-surface p-4 sm:p-5">
        {/* Kopfzeile der Woche – gleiche 7 Spalten wie jede Habit-Zeile */}
        <div className="grid grid-cols-7 gap-0.5 text-center" aria-hidden>
          {week.map((d, i) => {
            const isToday = toKey(d) === todayKey
            return (
              <div key={i} className={`text-caption ${isToday ? 'font-bold text-label' : 'text-label-2'}`}>
                <div className="text-footnote font-semibold">{WEEKDAYS[i]}</div>
                <div>{fmtDate(d, { day: 'numeric' })}</div>
              </div>
            )
          })}
        </div>

        {habits.length === 0 ? (
          <p className="py-6 text-center text-subhead text-label-2">Noch keine Habits. Leg unten deine erste Routine an.</p>
        ) : (
          <ul className="mt-2 divide-y divide-separator">
            {habits.map((h) => {
              const streak = streakOf((key) => isDone(h.id, key), today)
              return (
                <li key={h.id} className="py-3">
                  <div className="flex items-center gap-2">
                    <p className="min-w-0 flex-1 truncate text-headline font-semibold">{h.name}</p>
                    <span
                      className={`inline-flex items-center gap-1 text-subhead tabular-nums ${
                        streak > 0 ? 'font-semibold text-label' : 'text-label-2'
                      }`}
                      aria-label={`Serie: ${days(streak)} in Folge`}
                    >
                      <Flame className="size-4" aria-hidden />
                      {days(streak)}
                    </span>
                    <button
                      onClick={() => removeHabit(h)}
                      aria-label={`${h.name} löschen`}
                      className="-mr-2 grid size-11 place-items-center rounded-full text-label-2 hover:bg-fill hover:text-label"
                    >
                      <Trash2 className="size-[18px]" />
                    </button>
                  </div>

                  <div className="mt-1 grid grid-cols-7 gap-0.5">
                    {week.map((d, i) => {
                      const key = toKey(d)
                      const done = isDone(h.id, key)
                      const future = d > today
                      const isToday = key === todayKey
                      return (
                        <div key={key} className="grid place-items-center">
                          <button
                            role="checkbox"
                            aria-checked={done}
                            aria-label={`${h.name}, ${WEEKDAYS_LONG[i]} ${fmtDate(d)}`}
                            onClick={() => toggle(h.id, key)}
                            disabled={future}
                            className={`grid aspect-square w-full max-w-11 place-items-center rounded-full border-2 transition-colors ${
                              done
                                ? 'border-label bg-label text-on-label'
                                : future
                                  ? 'cursor-not-allowed border-dashed border-separator'
                                  : isToday
                                    ? 'border-label hover:bg-fill'
                                    : 'border-label-2/60 hover:border-label'
                            }`}
                          >
                            {done && <Check className="size-5" strokeWidth={3} />}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        <form onSubmit={addHabit} className="mt-3 flex gap-2 border-t border-separator pt-4">
          <label className="sr-only" htmlFor="new-habit">
            Neue Routine
          </label>
          <input
            id="new-habit"
            value={newHabit}
            onChange={(e) => setNewHabit(e.target.value)}
            placeholder="Neue Routine, z. B. Dehnen"
            enterKeyHint="done"
            className="min-w-0 flex-1 rounded-xl border border-separator bg-bg px-3 py-2.5 text-body outline-none focus:border-label"
          />
          <button
            type="submit"
            disabled={!newHabit.trim()}
            aria-label="Routine hinzufügen"
            className="grid size-11 shrink-0 place-items-center rounded-full bg-label text-on-label hover:opacity-85 disabled:opacity-30"
          >
            <Plus className="size-5" />
          </button>
        </form>
      </div>
    </section>
  )
}

/** Grundpunkte – Startliste für alle, die noch keine eigenen Habits haben */
export const DEFAULT_HABITS = [
  { id: 'water', name: 'Wasser getrunken' },
  { id: 'sport', name: 'Sport gemacht' },
  { id: 'sleep', name: 'Genug geschlafen' },
]

/** Alte Standardliste früherer Versionen (8 h Schlaf, 3 l Wasser, Mobility, Protein-Ziel) */
export const isOldDefaultHabits = (habits) => habits.map((h) => h.id).join() === 'sleep,water,mobility,protein'
