import { useState } from 'react'
import { Plus, Check, Trash2, X, Clock, Route, Copy, CalendarRange } from 'lucide-react'
import { SPORTS, WEEKDAYS_LONG, WEEKDAYS, addDays, fmtDate, fmtDuration, fmtHours, toKey, uid } from '../lib/utils'

export default function WeeklyPlan({ weekStart, today, plans, setPlans }) {
  const weekKey = toKey(weekStart)
  const sessions = plans[weekKey] ?? []
  const [modalDay, setModalDay] = useState(null) // null = geschlossen

  const updateWeek = (fn) => setPlans((p) => ({ ...p, [weekKey]: fn(p[weekKey] ?? []) }))
  const toggle = (id) => updateWeek((list) => list.map((s) => (s.id === id ? { ...s, done: !s.done } : s)))
  const remove = (id) => updateWeek((list) => list.filter((s) => s.id !== id))
  const add = (session) => updateWeek((list) => [...list, { ...session, id: uid(), done: false }])

  const prevKey = toKey(addDays(weekStart, -7))
  const prevSessions = plans[prevKey] ?? []
  const copyPrevWeek = () =>
    updateWeek(() => prevSessions.map((s) => ({ ...s, id: uid(), done: false })))

  // Zusammenfassung
  const plannedMin = sessions.reduce((a, s) => a + s.duration, 0)
  const doneMin = sessions.filter((s) => s.done).reduce((a, s) => a + s.duration, 0)
  const doneCount = sessions.filter((s) => s.done).length
  const pct = plannedMin ? Math.round((doneMin / plannedMin) * 100) : 0

  const bySport = Object.keys(SPORTS).map((key) => {
    const list = sessions.filter((s) => s.sport === key)
    return {
      key,
      planned: list.reduce((a, s) => a + s.duration, 0),
      done: list.filter((s) => s.done).reduce((a, s) => a + s.duration, 0),
      distance: list.filter((s) => s.done).reduce((a, s) => a + (Number(s.distance) || 0), 0),
    }
  })

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 sm:p-6">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-white">
            <CalendarRange className="h-5 w-5 text-cyan-300" /> Wochen-Trainingsplan
          </h2>
          <p className="text-sm text-slate-400">
            {doneCount} von {sessions.length} Einheiten erledigt
          </p>
        </div>
        <button
          onClick={() => setModalDay(Math.min(6, Math.max(0, Math.round((today - weekStart) / 864e5))))}
          className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/10 transition hover:bg-cyan-100"
        >
          <Plus className="h-4 w-4" /> Einheit hinzufügen
        </button>
      </header>

      {/* Zusammenfassung */}
      <div className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <div className="rounded-2xl bg-slate-950/60 p-5 ring-1 ring-white/5">
          <div className="text-xs font-semibold uppercase tracking-widest text-slate-400">Trainingsstunden</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-4xl font-black tabular-nums text-white">{fmtHours(doneMin)}</span>
            <span className="text-lg font-semibold text-slate-500">/ {fmtHours(plannedMin)} h</span>
          </div>
          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-2 text-right text-xs font-semibold text-slate-400">{pct}% geschafft</div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {bySport.map(({ key, planned, done, distance }) => {
            const sport = SPORTS[key]
            const Icon = sport.icon
            const p = planned ? (done / planned) * 100 : 0
            return (
              <div key={key} className="rounded-2xl bg-slate-950/60 p-4 ring-1 ring-white/5">
                <div className={`flex items-center gap-2 text-sm font-semibold ${sport.text}`}>
                  <span className={`rounded-lg p-1.5 ${sport.soft}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  {sport.label}
                </div>
                <div className="mt-3 text-lg font-bold tabular-nums text-white">
                  {fmtHours(done)}
                  <span className="text-sm font-medium text-slate-500"> / {fmtHours(planned)} h</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
                  <div className={`h-full rounded-full ${sport.bg} transition-all duration-500`} style={{ width: `${p}%` }} />
                </div>
                {sport.unit && distance > 0 && (
                  <div className="mt-2 text-xs text-slate-400">
                    {distance.toLocaleString('de-AT', { maximumFractionDigits: 1 })} {sport.unit} absolviert
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {sessions.length === 0 && prevSessions.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-4 text-sm text-slate-300">
          Für diese Woche ist noch nichts geplant.
          <button
            onClick={copyPrevWeek}
            className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 font-semibold hover:bg-white/15"
          >
            <Copy className="h-4 w-4" /> Plan der Vorwoche übernehmen
          </button>
        </div>
      )}

      {/* Tage */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {WEEKDAYS_LONG.map((name, dayIdx) => {
          const date = addDays(weekStart, dayIdx)
          const isToday = toKey(date) === toKey(today)
          const daySessions = sessions.filter((s) => s.day === dayIdx)
          const dayMin = daySessions.reduce((a, s) => a + s.duration, 0)
          return (
            <div
              key={name}
              className={`flex min-h-40 flex-col rounded-2xl p-3 ring-1 transition ${
                isToday ? 'bg-cyan-400/[0.06] ring-cyan-400/50' : 'bg-slate-950/50 ring-white/5'
              }`}
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <div>
                  <div className={`text-sm font-bold ${isToday ? 'text-cyan-300' : 'text-white'}`}>
                    <span className="xl:hidden">{name}</span>
                    <span className="hidden xl:inline">{WEEKDAYS[dayIdx]}</span>
                    {isToday && <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wider">· Heute</span>}
                  </div>
                  <div className="text-xs text-slate-500">
                    {fmtDate(date)} {dayMin > 0 && `· ${fmtDuration(dayMin)}`}
                  </div>
                </div>
                <button
                  onClick={() => setModalDay(dayIdx)}
                  title="Einheit hinzufügen"
                  className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/10 hover:text-white"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <div className="flex flex-1 flex-col gap-2">
                {daySessions.length === 0 && (
                  <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-white/10 py-4 text-xs text-slate-600">
                    Ruhetag 😴
                  </div>
                )}
                {daySessions.map((s) => (
                  <SessionCard key={s.id} s={s} onToggle={() => toggle(s.id)} onDelete={() => remove(s.id)} />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {modalDay !== null && (
        <AddSessionModal
          defaultDay={modalDay}
          onClose={() => setModalDay(null)}
          onAdd={(s) => {
            add(s)
            setModalDay(null)
          }}
        />
      )}
    </section>
  )
}

function SessionCard({ s, onToggle, onDelete }) {
  const sport = SPORTS[s.sport] ?? SPORTS.run
  const Icon = sport.icon
  return (
    <div
      className={`group relative rounded-xl border-l-4 ${sport.border} bg-slate-800/60 p-2.5 transition ${
        s.done ? 'opacity-60' : 'hover:bg-slate-800'
      }`}
    >
      <div className="flex items-start gap-2">
        <button
          onClick={onToggle}
          aria-label={s.done ? 'Als offen markieren' : 'Als erledigt markieren'}
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition ${
            s.done ? `${sport.bg} ${sport.border} text-slate-950` : 'border-slate-500 hover:border-white'
          }`}
        >
          {s.done && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
        </button>
        <div className="min-w-0 flex-1">
          <div className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${sport.text}`}>
            <Icon className="h-3 w-3" /> {sport.label}
          </div>
          <div className={`text-sm font-semibold leading-snug text-white ${s.done ? 'line-through decoration-2' : ''}`}>
            {s.title}
          </div>
          <div className="mt-1 flex flex-wrap gap-x-2 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" /> {fmtDuration(s.duration)}
            </span>
            {s.distance ? (
              <span className="inline-flex items-center gap-1">
                <Route className="h-3 w-3" /> {String(s.distance).replace('.', ',')} km
              </span>
            ) : null}
          </div>
        </div>
      </div>
      <button
        onClick={onDelete}
        title="Löschen"
        className="absolute right-1.5 top-1.5 rounded-md p-1 text-slate-500 opacity-0 transition hover:bg-rose-500/20 hover:text-rose-300 group-hover:opacity-100 focus:opacity-100"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

function AddSessionModal({ defaultDay, onClose, onAdd }) {
  const [form, setForm] = useState({ day: defaultDay, sport: 'run', title: '', duration: 60, distance: '' })
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = (e) => {
    e.preventDefault()
    const duration = Number(form.duration)
    if (!duration || duration <= 0) return
    onAdd({
      day: Number(form.day),
      sport: form.sport,
      title: form.title.trim() || `${SPORTS[form.sport].label}-Einheit`,
      duration,
      distance: form.distance ? Number(String(form.distance).replace(',', '.')) : null,
    })
  }

  const input =
    'mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400'

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/80 p-4 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Neue Einheit</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 grid grid-cols-4 gap-2">
          {Object.entries(SPORTS).map(([key, sp]) => {
            const Icon = sp.icon
            const active = form.sport === key
            return (
              <button
                type="button"
                key={key}
                onClick={() => setForm({ ...form, sport: key })}
                className={`flex flex-col items-center gap-1 rounded-xl py-3 text-xs font-semibold ring-1 transition ${
                  active ? `${sp.soft} ${sp.text} ${sp.ring} ring-2` : 'bg-slate-950 text-slate-400 ring-white/10 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5" />
                {sp.label}
              </button>
            )
          })}
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-medium text-slate-400">
            Titel
            <input autoFocus value={form.title} onChange={set('title')} placeholder="z. B. Intervalle 6×1 km" className={input} />
          </label>
          <label className="block text-xs font-medium text-slate-400">
            Tag
            <select value={form.day} onChange={set('day')} className={input}>
              {WEEKDAYS_LONG.map((d, i) => (
                <option key={d} value={i}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-medium text-slate-400">
              Dauer (Minuten)
              <input type="number" min="5" step="5" required value={form.duration} onChange={set('duration')} className={input} />
            </label>
            <label className="block text-xs font-medium text-slate-400">
              Distanz (km, optional)
              <input
                inputMode="decimal"
                value={form.distance}
                onChange={set('distance')}
                placeholder={form.sport === 'strength' ? '–' : 'z. B. 10'}
                disabled={form.sport === 'strength'}
                className={`${input} disabled:opacity-40`}
              />
            </label>
          </div>
        </div>

        <button
          type="submit"
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-100"
        >
          <Plus className="h-4 w-4" /> Hinzufügen
        </button>
      </form>
    </div>
  )
}

/** Beispielwoche für den ersten Start */
export function samplePlan() {
  const s = (day, sport, title, duration, distance = null) => ({ id: uid(), day, sport, title, duration, distance, done: false })
  return [
    s(0, 'swim', 'Technik & Drills', 60, 2.5),
    s(0, 'strength', 'Core & Stabi', 30),
    s(1, 'bike', 'Sweet-Spot Intervalle', 90, 45),
    s(2, 'run', 'Lockerer Dauerlauf', 50, 9),
    s(2, 'swim', 'Ausdauer 10×200 m', 60, 3),
    s(3, 'bike', 'GA1 Rolle', 75, 35),
    s(3, 'strength', 'Beine & Hüfte', 40),
    s(4, 'swim', 'Freiwasser-Simulation', 45, 2),
    s(5, 'bike', 'Lange Ausfahrt', 240, 110),
    s(5, 'run', 'Koppellauf', 25, 5),
    s(6, 'run', 'Langer Lauf', 110, 20),
  ]
}
