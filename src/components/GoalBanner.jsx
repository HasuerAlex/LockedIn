import { useState } from 'react'
import { Trophy, Pencil, Check, X, CalendarDays, Flag } from 'lucide-react'
import { daysBetween, fmtDate, fromKey, toKey } from '../lib/utils'

export default function GoalBanner({ goal, setGoal, today }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(goal)

  const start = fromKey(goal.startDate)
  const target = fromKey(goal.targetDate)
  const total = Math.max(1, daysBetween(start, target))
  const elapsed = Math.min(total, Math.max(0, daysBetween(start, today)))
  const daysLeft = daysBetween(today, target)
  const progress = Math.round((elapsed / total) * 100)
  const weeksLeft = Math.max(0, Math.floor(daysLeft / 7))

  const openEdit = () => {
    setDraft(goal)
    setEditing(true)
  }
  const save = () => {
    if (!draft.title.trim() || !draft.startDate || !draft.targetDate) return
    if (draft.targetDate <= draft.startDate) return
    setGoal({ ...draft, title: draft.title.trim() })
    setEditing(false)
  }

  const invalid = draft.targetDate <= draft.startDate

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-6 sm:p-8">
      {/* Akzent-Glows in den drei Disziplin-Farben */}
      <div className="pointer-events-none absolute -top-24 -left-16 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -top-20 right-1/3 h-56 w-56 rounded-full bg-orange-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-10 h-64 w-64 rounded-full bg-emerald-500/15 blur-3xl" />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-slate-300 ring-1 ring-white/10">
            <Trophy className="h-3.5 w-3.5 text-amber-300" />
            Hauptziel
          </div>

          {editing ? (
            <div className="space-y-3">
              <input
                autoFocus
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && save()}
                className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-2 text-2xl font-extrabold text-white outline-none focus:border-cyan-400 sm:text-3xl"
                placeholder="Wettkampf / Ziel"
              />
              <div className="flex flex-wrap items-end gap-3">
                <label className="text-xs font-medium text-slate-400">
                  Vorbereitung ab
                  <input
                    type="date"
                    value={draft.startDate}
                    onChange={(e) => setDraft({ ...draft, startDate: e.target.value })}
                    className="mt-1 block rounded-lg border border-white/10 bg-slate-950/60 px-3 py-1.5 text-sm text-white outline-none focus:border-cyan-400"
                  />
                </label>
                <label className="text-xs font-medium text-slate-400">
                  Wettkampftag
                  <input
                    type="date"
                    value={draft.targetDate}
                    onChange={(e) => setDraft({ ...draft, targetDate: e.target.value })}
                    className="mt-1 block rounded-lg border border-white/10 bg-slate-950/60 px-3 py-1.5 text-sm text-white outline-none focus:border-cyan-400"
                  />
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={save}
                    disabled={invalid}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-40"
                  >
                    <Check className="h-4 w-4" /> Speichern
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-white/10"
                  >
                    <X className="h-4 w-4" /> Abbrechen
                  </button>
                </div>
              </div>
              {invalid && <p className="text-xs text-rose-400">Der Wettkampftag muss nach dem Start liegen.</p>}
            </div>
          ) : (
            <>
              <div className="group flex items-start gap-3">
                <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
                  {goal.title}
                </h1>
                <button
                  onClick={openEdit}
                  title="Ziel bearbeiten"
                  className="mt-1 rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-400">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4" />
                  Start {fmtDate(start, { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Flag className="h-4 w-4" />
                  Race Day {fmtDate(target, { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </p>
            </>
          )}
        </div>

        {/* Countdown */}
        <div className="flex shrink-0 items-end gap-6">
          <div className="text-right">
            <div className="bg-gradient-to-r from-cyan-300 via-orange-300 to-emerald-300 bg-clip-text text-6xl font-black tabular-nums leading-none text-transparent sm:text-7xl">
              {daysLeft > 0 ? daysLeft : 0}
            </div>
            <div className="mt-1 text-sm font-semibold uppercase tracking-widest text-slate-400">
              {daysLeft > 0 ? `Tage · noch ${weeksLeft} Wochen` : daysLeft === 0 ? 'Heute ist Race Day! 🏁' : 'Ziel erreicht 🏅'}
            </div>
          </div>
        </div>
      </div>

      {/* Fortschritt der Vorbereitung */}
      <div className="relative mt-8">
        <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-400">
          <span>Vorbereitung: Tag {elapsed} von {total}</span>
          <span className="font-bold text-white">{progress}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-white/5 ring-1 ring-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-orange-400 to-emerald-400 transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </section>
  )
}

export function defaultGoal(today) {
  const start = new Date(today)
  start.setDate(start.getDate() - 70)
  const target = new Date(today)
  target.setDate(target.getDate() + 210)
  return { title: 'Ironman Vorbereitung', startDate: toKey(start), targetDate: toKey(target) }
}
