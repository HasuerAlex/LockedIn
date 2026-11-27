import { useEffect, useState } from 'react'
import { Plus, Check, Trash2, Copy } from 'lucide-react'
import { SPORTS, WEEKDAYS, WEEKDAYS_LONG, addDays, fmtDate, fmtDuration, fmtHours, toKey, uid } from '../lib/utils'

export default function WeeklyPlan({ weekStart, today, plans, setPlans, onDeleted }) {
  const weekKey = toKey(weekStart)
  const sessions = plans[weekKey] ?? []
  const [sheetDay, setSheetDay] = useState(null) // null = Sheet geschlossen

  const updateWeek = (fn) => setPlans((p) => ({ ...p, [weekKey]: fn(p[weekKey] ?? []) }))
  const toggle = (id) => updateWeek((list) => list.map((s) => (s.id === id ? { ...s, done: !s.done } : s)))
  const add = (session) => updateWeek((list) => [...list, { ...session, id: uid(), done: false }])
  const remove = (session) => {
    const index = sessions.findIndex((s) => s.id === session.id)
    updateWeek((list) => list.filter((s) => s.id !== session.id))
    onDeleted(`„${session.title}“ gelöscht`, () =>
      setPlans((p) => {
        const list = [...(p[weekKey] ?? [])]
        list.splice(index, 0, session)
        return { ...p, [weekKey]: list }
      }),
    )
  }

  const prevSessions = plans[toKey(addDays(weekStart, -7))] ?? []
  const copyPrevWeek = () => updateWeek(() => prevSessions.map((s) => ({ ...s, id: uid(), done: false })))

  const plannedMin = sessions.reduce((a, s) => a + s.duration, 0)
  const doneMin = sessions.filter((s) => s.done).reduce((a, s) => a + s.duration, 0)
  const pct = plannedMin ? (doneMin / plannedMin) * 100 : 0

  const bySport = Object.keys(SPORTS)
    .map((key) => {
      const list = sessions.filter((s) => s.sport === key)
      return {
        key,
        planned: list.reduce((a, s) => a + s.duration, 0),
        done: list.filter((s) => s.done).reduce((a, s) => a + s.duration, 0),
      }
    })
    .filter((s) => s.planned > 0)

  const todayIdx = Math.round((today - weekStart) / 864e5)

  return (
    <section aria-labelledby="plan-title" className="space-y-4">
      <div className="flex items-end justify-between gap-3 px-1">
        <h2 id="plan-title" className="text-title-2 font-bold">
          Training
        </h2>
        <button
          onClick={() => setSheetDay(todayIdx >= 0 && todayIdx <= 6 ? todayIdx : 0)}
          className="inline-flex h-11 items-center gap-1.5 rounded-full bg-label px-4 text-subhead font-semibold text-on-label hover:opacity-85 active:opacity-70"
        >
          <Plus className="size-5" /> Einheit
        </button>
      </div>

      {/* Zusammenfassung */}
      <div className="rounded-3xl bg-surface p-5">
        <p className="text-subhead text-label-2">Trainingsstunden diese Woche</p>
        <p className="mt-0.5 text-title-2 font-bold tabular-nums">
          {fmtHours(doneMin)} <span className="font-semibold text-label-2">von {fmtHours(plannedMin)} h</span>
        </p>
        <div
          role="progressbar"
          aria-label="Erledigte Trainingsstunden"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pct)}
          className="mt-3 h-2 overflow-hidden rounded-full bg-fill"
        >
          <div className="h-full rounded-full bg-label transition-[width] duration-500" style={{ width: `${pct}%` }} />
        </div>

        {bySport.length > 0 && (
          <ul className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
            {bySport.map(({ key, planned, done }) => {
              const sport = SPORTS[key]
              const Icon = sport.icon
              return (
                <li key={key}>
                  <div className="flex items-center gap-1.5 text-subhead font-semibold">
                    <Icon className={`size-4 ${sport.text}`} aria-hidden />
                    {sport.label}
                  </div>
                  <div className="mt-0.5 text-footnote tabular-nums text-label-2">
                    {fmtHours(done)} von {fmtHours(planned)} h
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-fill" aria-hidden>
                    <div className={`h-full rounded-full ${sport.bg} transition-[width] duration-500`} style={{ width: `${(done / planned) * 100}%` }} />
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {sessions.length === 0 && (
        <div className="rounded-3xl bg-surface p-5 text-subhead text-label-2">
          <p>Für diese Woche ist noch nichts geplant.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {prevSessions.length > 0 && (
              <button
                onClick={copyPrevWeek}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-fill px-4 font-semibold text-label hover:opacity-80"
              >
                <Copy className="size-4" /> Plan der Vorwoche übernehmen
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tage */}
      <ol className="overflow-hidden rounded-3xl bg-surface">
        {WEEKDAYS_LONG.map((name, dayIdx) => {
          const date = addDays(weekStart, dayIdx)
          const isToday = dayIdx === todayIdx
          const daySessions = sessions.filter((s) => s.day === dayIdx)
          const dayMin = daySessions.reduce((a, s) => a + s.duration, 0)
          return (
            <li key={name} className="border-separator [&:not(:first-child)]:border-t">
              <div className="flex items-center gap-3 py-2 pr-2 pl-5">
                <h3 className="flex-1 text-headline font-semibold">
                  {name}
                  {isToday && (
                    <span className="ml-2 rounded-full bg-label px-2 py-0.5 align-[2px] text-caption font-semibold text-on-label">
                      Heute
                    </span>
                  )}
                  <span className="ml-2 text-footnote font-normal text-label-2">
                    {fmtDate(date)}
                    {dayMin > 0 && ` · ${fmtDuration(dayMin)}`}
                  </span>
                </h3>
                <button
                  onClick={() => setSheetDay(dayIdx)}
                  aria-label={`Einheit am ${name} hinzufügen`}
                  className="grid size-11 place-items-center rounded-full text-label-2 hover:bg-fill hover:text-label"
                >
                  <Plus className="size-5" />
                </button>
              </div>

              {daySessions.length === 0 ? (
                <p className="pb-4 pl-5 text-subhead text-label-2">Ruhetag</p>
              ) : (
                <ul className="pb-2">
                  {daySessions.map((s) => (
                    <SessionRow key={s.id} s={s} onToggle={() => toggle(s.id)} onDelete={() => remove(s)} />
                  ))}
                </ul>
              )}
            </li>
          )
        })}
      </ol>

      {sheetDay !== null && (
        <AddSessionSheet
          defaultDay={sheetDay}
          onClose={() => setSheetDay(null)}
          onAdd={(s) => {
            add(s)
            setSheetDay(null)
          }}
        />
      )}
    </section>
  )
}

function SessionRow({ s, onToggle, onDelete }) {
  const sport = SPORTS[s.sport] ?? SPORTS.run
  const Icon = sport.icon
  return (
    <li className="flex items-center gap-1 pr-2 pl-2">
      <button
        role="checkbox"
        aria-checked={s.done}
        aria-label={`${s.title} erledigt`}
        onClick={onToggle}
        className="group grid size-11 shrink-0 place-items-center rounded-full"
      >
        <span
          className={`grid size-6 place-items-center rounded-full border-2 transition-colors ${
            s.done ? `${sport.bg} ${sport.border} text-on-tint` : 'border-label-2 group-hover:border-label'
          }`}
        >
          {s.done && <Check className="size-4" strokeWidth={3} />}
        </span>
      </button>

      <div className="min-w-0 flex-1 py-1.5">
        <p className={`text-body ${s.done ? 'text-label-2 line-through' : ''}`}>{s.title}</p>
        <p className="flex flex-wrap items-center gap-x-1.5 text-footnote text-label-2">
          <span className={`inline-flex items-center gap-1 font-semibold ${sport.text}`}>
            <Icon className="size-3.5" aria-hidden />
            {sport.label}
          </span>
          <span aria-hidden>·</span>
          <span>{fmtDuration(s.duration)}</span>
          {s.distance ? (
            <>
              <span aria-hidden>·</span>
              <span>{String(s.distance).replace('.', ',')} km</span>
            </>
          ) : null}
        </p>
      </div>

      <button
        onClick={onDelete}
        aria-label={`${s.title} löschen`}
        className="grid size-11 shrink-0 place-items-center rounded-full text-label-2 hover:bg-fill hover:text-label"
      >
        <Trash2 className="size-[18px]" />
      </button>
    </li>
  )
}

function AddSessionSheet({ defaultDay, onClose, onAdd }) {
  const [form, setForm] = useState({ day: defaultDay, sport: 'run', title: '', duration: '60', distance: '' })

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  const duration = Number(form.duration)
  const distance = form.distance ? Number(String(form.distance).replace(',', '.')) : null
  const durationError = !duration || duration <= 0 ? 'Gib eine Dauer in Minuten ein.' : null
  const distanceError = form.distance && (!distance || distance < 0) ? 'Gib die Distanz als Zahl ein, z. B. 10,5.' : null
  const valid = !durationError && !distanceError

  const submit = (e) => {
    e.preventDefault()
    if (!valid) return
    onAdd({
      day: Number(form.day),
      sport: form.sport,
      title: form.title.trim() || `${SPORTS[form.sport].label}-Einheit`,
      duration,
      distance: form.sport === 'strength' ? null : distance,
    })
  }

  const field = 'mt-1 block w-full rounded-xl border border-separator bg-bg px-3 py-2.5 text-body text-label outline-none focus:border-label'

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4" onClick={onClose}>
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-surface pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-3xl"
      >
        {/* Kopfzeile wie bei einem iOS-Sheet: Abbrechen · Titel · Hinzufügen */}
        <div className="sticky top-0 grid grid-cols-[1fr_auto_1fr] items-center border-b border-separator bg-surface px-2 py-1">
          <button type="button" onClick={onClose} className="h-11 justify-self-start rounded-full px-3 text-body hover:bg-fill">
            Abbrechen
          </button>
          <h3 id="sheet-title" className="text-headline font-semibold">
            Neue Einheit
          </h3>
          <button
            type="submit"
            disabled={!valid}
            className="h-11 justify-self-end rounded-full px-3 text-body font-semibold hover:bg-fill disabled:opacity-30"
          >
            Hinzufügen
          </button>
        </div>

        <div className="space-y-5 px-5 pt-5">
          <fieldset>
            <legend className="text-subhead text-label-2">Sportart</legend>
            <div className="mt-1.5 grid grid-cols-4 gap-1 rounded-2xl bg-fill p-1">
              {Object.entries(SPORTS).map(([key, sp]) => {
                const Icon = sp.icon
                const active = form.sport === key
                return (
                  <button
                    type="button"
                    key={key}
                    aria-pressed={active}
                    onClick={() => setForm({ ...form, sport: key })}
                    className={`flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl text-footnote font-semibold transition-colors ${
                      active ? 'bg-surface text-label shadow-sm' : 'text-label-2 hover:text-label'
                    }`}
                  >
                    <Icon className={`size-5 ${active ? sp.text : ''}`} aria-hidden />
                    {sp.label}
                  </button>
                )
              })}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-subhead text-label-2">Tag</legend>
            <div className="mt-1.5 grid grid-cols-7 gap-1 rounded-2xl bg-fill p-1">
              {WEEKDAYS.map((d, i) => (
                <button
                  type="button"
                  key={d}
                  aria-pressed={Number(form.day) === i}
                  aria-label={WEEKDAYS_LONG[i]}
                  onClick={() => setForm({ ...form, day: i })}
                  className={`h-11 rounded-xl text-subhead font-semibold transition-colors ${
                    Number(form.day) === i ? 'bg-surface text-label shadow-sm' : 'text-label-2 hover:text-label'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="block text-subhead text-label-2">
            Titel
            <input
              autoFocus
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder={`${SPORTS[form.sport].label}-Einheit`}
              enterKeyHint="done"
              className={field}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-subhead text-label-2">
              Dauer in Minuten
              <input
                inputMode="numeric"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value.replace(/\D/g, '') })}
                aria-invalid={Boolean(durationError)}
                className={field}
              />
            </label>
            {form.sport !== 'strength' && (
              <label className="block text-subhead text-label-2">
                Distanz in km
                <input
                  inputMode="decimal"
                  value={form.distance}
                  onChange={(e) => setForm({ ...form, distance: e.target.value })}
                  placeholder="optional"
                  aria-invalid={Boolean(distanceError)}
                  className={field}
                />
              </label>
            )}
          </div>
          <div className="flex flex-wrap gap-2" aria-label="Dauer schnell wählen">
            {[30, 45, 60, 90, 120, 180].map((m) => (
              <button
                type="button"
                key={m}
                onClick={() => setForm({ ...form, duration: String(m) })}
                className={`h-9 rounded-full px-3 text-footnote font-semibold ${
                  Number(form.duration) === m ? 'bg-label text-on-label' : 'bg-fill text-label hover:opacity-80'
                }`}
              >
                {fmtDuration(m)}
              </button>
            ))}
          </div>
          {(durationError || distanceError) && (
            <p className="text-subhead text-label-2" role="alert">
              {durationError || distanceError}
            </p>
          )}
        </div>
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
    s(1, 'bike', 'Sweet-Spot-Intervalle', 90, 45),
    s(2, 'run', 'Lockerer Dauerlauf', 50, 9),
    s(2, 'swim', 'Ausdauer 10 × 200 m', 60, 3),
    s(3, 'bike', 'Grundlage auf der Rolle', 75, 35),
    s(3, 'strength', 'Beine & Hüfte', 40),
    s(4, 'swim', 'Freiwasser-Simulation', 45, 2),
    s(5, 'bike', 'Lange Ausfahrt', 240, 110),
    s(5, 'run', 'Koppellauf', 25, 5),
    s(6, 'run', 'Langer Lauf', 110, 20),
  ]
}
