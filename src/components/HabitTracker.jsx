import { useState } from 'react'
import { Check, Flame, Plus, Trash2, Sparkles, ListChecks, Crown } from 'lucide-react'
import { WEEKDAYS, addDays, fmtDate, toKey, uid } from '../lib/utils'

/** Tage in Folge bis heute. Ist heute noch offen, zählt die Serie ab gestern (sie ist noch nicht gerissen). */
function streakOf(isDone, today) {
  let day = isDone(toKey(today)) ? today : addDays(today, -1)
  let count = 0
  while (isDone(toKey(day))) {
    count++
    day = addDays(day, -1)
  }
  return count
}

export default function HabitTracker({ weekStart, today, habits, setHabits, log, setLog }) {
  const [newHabit, setNewHabit] = useState('')
  const todayKey = toKey(today)
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

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

  const removeHabit = (id) => {
    const h = habits.find((x) => x.id === id)
    if (!confirm(`Habit „${h?.name}“ wirklich löschen? Der Verlauf geht verloren.`)) return
    setHabits((list) => list.filter((x) => x.id !== id))
    setLog((l) => {
      const { [id]: _, ...rest } = l
      return rest
    })
  }

  const doneToday = habits.filter((h) => isDone(h.id, todayKey)).length
  const todayPct = habits.length ? doneToday / habits.length : 0

  // „Perfekte Tage“: alle Habits erledigt
  const perfectStreak = habits.length ? streakOf((key) => habits.every((h) => isDone(h.id, key)), today) : 0

  const weekTotal = habits.length * days.filter((d) => d <= today).length
  const weekDone = habits.reduce((a, h) => a + days.filter((d) => d <= today && isDone(h.id, toKey(d))).length, 0)

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 sm:p-6">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-white">
            <ListChecks className="h-5 w-5 text-emerald-300" /> Habit-Tracker
          </h2>
          <p className="text-sm text-slate-400">Die kleinen Dinge, die das Rennen entscheiden.</p>
        </div>
      </header>

      {/* Kennzahlen */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-2xl bg-slate-950/60 p-4 ring-1 ring-white/5">
          <ProgressRing value={todayPct} />
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-slate-400">Heute</div>
            <div className="text-2xl font-black tabular-nums text-white">
              {doneToday}
              <span className="text-base font-semibold text-slate-500"> / {habits.length}</span>
            </div>
            {habits.length > 0 && doneToday === habits.length && (
              <div className="text-xs font-semibold text-emerald-300">Alles erledigt! 💪</div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl bg-slate-950/60 p-4 ring-1 ring-white/5">
          <div className="rounded-2xl bg-amber-400/10 p-3 text-amber-300">
            <Crown className="h-7 w-7" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-slate-400">Perfekte Tage in Folge</div>
            <div className="text-2xl font-black tabular-nums text-white">{perfectStreak}</div>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl bg-slate-950/60 p-4 ring-1 ring-white/5">
          <div className="rounded-2xl bg-emerald-400/10 p-3 text-emerald-300">
            <Sparkles className="h-7 w-7" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-slate-400">Diese Woche</div>
            <div className="text-2xl font-black tabular-nums text-white">
              {weekTotal ? Math.round((weekDone / weekTotal) * 100) : 0}%
              <span className="ml-1 text-base font-semibold text-slate-500">
                ({weekDone}/{weekTotal})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabelle */}
      <div className="-mx-1 overflow-x-auto px-1">
        <table className="w-full min-w-[640px] border-separate border-spacing-y-2">
          <thead>
            <tr className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              <th className="px-3 text-left font-semibold">Routine</th>
              {days.map((d, i) => {
                const isToday = toKey(d) === todayKey
                return (
                  <th key={i} className={`w-14 text-center font-semibold ${isToday ? 'text-emerald-300' : ''}`}>
                    <div>{WEEKDAYS[i]}</div>
                    <div className="text-[10px] font-medium normal-case tracking-normal opacity-70">{fmtDate(d)}</div>
                  </th>
                )
              })}
              <th className="w-24 text-center font-semibold">Streak</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {habits.map((h) => {
              const streak = streakOf((key) => isDone(h.id, key), today)
              return (
                <tr key={h.id} className="group">
                  <td className="rounded-l-2xl bg-slate-950/60 px-3 py-3 text-sm font-semibold text-white">{h.name}</td>
                  {days.map((d) => {
                    const key = toKey(d)
                    const done = isDone(h.id, key)
                    const future = d > today
                    const isToday = key === todayKey
                    return (
                      <td key={key} className={`bg-slate-950/60 py-3 text-center ${isToday ? 'bg-emerald-400/[0.05]' : ''}`}>
                        <button
                          onClick={() => toggle(h.id, key)}
                          disabled={future}
                          aria-label={`${h.name} am ${fmtDate(d)} ${done ? 'offen' : 'erledigt'} markieren`}
                          className={`mx-auto flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
                            done
                              ? 'scale-100 bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20'
                              : future
                                ? 'cursor-not-allowed bg-white/[0.02] ring-1 ring-white/5'
                                : `bg-white/5 ring-1 hover:bg-white/10 ${isToday ? 'ring-emerald-400/60' : 'ring-white/10'}`
                          }`}
                        >
                          {done && <Check className="h-5 w-5" strokeWidth={3} />}
                        </button>
                      </td>
                    )
                  })}
                  <td className="bg-slate-950/60 py-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-bold tabular-nums ${
                        streak > 0 ? 'bg-orange-400/15 text-orange-300' : 'bg-white/5 text-slate-500'
                      }`}
                    >
                      <Flame className={`h-4 w-4 ${streak >= 7 ? 'fill-orange-400' : ''}`} />
                      {streak}
                    </span>
                  </td>
                  <td className="rounded-r-2xl bg-slate-950/60 pr-2 text-center">
                    <button
                      onClick={() => removeHabit(h.id)}
                      title="Habit löschen"
                      className="rounded-lg p-1.5 text-slate-600 opacity-0 transition hover:bg-rose-500/20 hover:text-rose-300 group-hover:opacity-100 focus:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              )
            })}
            {habits.length === 0 && (
              <tr>
                <td colSpan={10} className="rounded-2xl bg-slate-950/40 py-8 text-center text-sm text-slate-500">
                  Noch keine Habits – leg unten deine erste Routine an.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <form onSubmit={addHabit} className="mt-4 flex gap-2">
        <input
          value={newHabit}
          onChange={(e) => setNewHabit(e.target.value)}
          placeholder="Neue Routine, z. B. 10 min Dehnen"
          className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-emerald-400"
        />
        <button
          type="submit"
          disabled={!newHabit.trim()}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-40"
        >
          <Plus className="h-4 w-4" /> Hinzufügen
        </button>
      </form>
    </section>
  )
}

function ProgressRing({ value, size = 56 }) {
  const stroke = 6
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <svg width={size} height={size} className="-rotate-90 shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} stroke="currentColor" strokeWidth={stroke} fill="none" className="text-white/5" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="currentColor"
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - value)}
        className="text-emerald-400 transition-all duration-500"
      />
    </svg>
  )
}

export const DEFAULT_HABITS = [
  { id: 'sleep', name: '😴 8 h Schlaf' },
  { id: 'water', name: '💧 3 L Wasser' },
  { id: 'mobility', name: '🧘 Mobility' },
  { id: 'protein', name: '🥩 Protein-Ziel' },
]
