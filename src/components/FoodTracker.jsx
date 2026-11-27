import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Trash2, Star, UserRound, Clock, Droplets, Zap, Utensils } from 'lucide-react'
import { SPORTS, addDays, fmtDate, fmtDuration, toKey, uid } from '../lib/utils'
import {
  MEALS,
  dailyTargets,
  fuelPlan,
  kcalFromMacros,
  mealForNow,
  profileComplete,
  shiftTime,
  sessionKcal,
  totals,
} from '../lib/nutrition'

const fmt = (v) => Math.round(v).toLocaleString('de-AT')

export default function FoodTracker({ today, profile, food, setFood, favorites, setFavorites, sessionsFor, onDeleted, openSettings }) {
  const [day, setDay] = useState(today)
  const [sheetMeal, setSheetMeal] = useState(null) // null = Sheet zu
  const dateKey = toKey(day)
  const isToday = dateKey === toKey(today)
  const entries = food[dateKey] ?? []
  const sessions = sessionsFor(day)
  const ready = profileComplete(profile)
  const target = ready ? dailyTargets(profile, sessions) : null
  const eaten = totals(entries)

  const addEntry = (entry) => setFood((all) => ({ ...all, [dateKey]: [...(all[dateKey] ?? []), { ...entry, id: uid() }] }))
  const removeEntry = (entry) => {
    const index = entries.findIndex((e) => e.id === entry.id)
    setFood((all) => {
      const list = (all[dateKey] ?? []).filter((e) => e.id !== entry.id)
      const next = { ...all }
      if (list.length) next[dateKey] = list
      else delete next[dateKey]
      return next
    })
    onDeleted(`„${entry.name}“ gelöscht`, () =>
      setFood((all) => {
        const list = [...(all[dateKey] ?? [])]
        list.splice(index, 0, entry)
        return { ...all, [dateKey]: list }
      }),
    )
  }

  const dayLabel = isToday
    ? 'Heute'
    : dateKey === toKey(addDays(today, -1))
      ? 'Gestern'
      : dateKey === toKey(addDays(today, 1))
        ? 'Morgen'
        : day.toLocaleDateString('de-AT', { weekday: 'long' })

  return (
    <div className="space-y-8">
      {/* Tag wählen */}
      <nav aria-label="Tag wählen" className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button onClick={() => setDay(addDays(day, -1))} aria-label="Vorheriger Tag" className="grid size-11 place-items-center rounded-full bg-surface hover:bg-fill">
            <ChevronLeft className="size-5" />
          </button>
          <button onClick={() => setDay(addDays(day, 1))} aria-label="Nächster Tag" className="grid size-11 place-items-center rounded-full bg-surface hover:bg-fill">
            <ChevronRight className="size-5" />
          </button>
          <p className="ml-2" aria-live="polite">
            <span className="block text-headline font-semibold">{dayLabel}</span>
            <span className="block text-footnote text-label-2">{fmtDate(day, { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
          </p>
        </div>
        {!isToday && (
          <button onClick={() => setDay(today)} className="h-11 rounded-full bg-surface px-4 text-subhead font-semibold hover:bg-fill">
            Heute
          </button>
        )}
      </nav>

      {!ready && (
        <div className="flex flex-wrap items-center gap-4 rounded-3xl bg-surface p-5">
          <span className="grid size-11 place-items-center rounded-xl bg-fill" aria-hidden>
            <UserRound className="size-6" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-headline font-semibold">Profil ausfüllen</p>
            <p className="text-subhead text-label-2">Mit Gewicht, Größe und Alter berechnet LockedIn dein Tagesziel und die Verpflegung fürs Training.</p>
          </div>
          <button onClick={openSettings} className="h-11 rounded-full bg-label px-5 text-headline font-semibold text-on-label hover:opacity-85">
            Zum Profil
          </button>
        </div>
      )}

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-8">
          <Targets target={target} eaten={eaten} />
          <Meals entries={entries} onAdd={(meal) => setSheetMeal(meal)} onRemove={removeEntry} />
        </div>
        <FuelPlanner sessions={sessions} profile={ready ? profile : null} target={target} />
      </div>

      {sheetMeal && (
        <FoodSheet
          defaultMeal={sheetMeal}
          favorites={favorites}
          setFavorites={setFavorites}
          onClose={() => setSheetMeal(null)}
          onAdd={(e) => {
            addEntry(e)
            setSheetMeal(null)
          }}
        />
      )}
    </div>
  )
}

/* ---------- Tagesziel ---------- */

function Bar({ label, value, goal, unit }) {
  const p = goal ? Math.min(100, (value / goal) * 100) : 0
  const over = goal && value > goal * 1.05
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 text-subhead">
        <span className="font-semibold">{label}</span>
        <span className="tabular-nums text-label-2">
          <span className="font-semibold text-label">{fmt(value)}</span>
          {goal ? ` / ${fmt(goal)} ${unit}` : ` ${unit}`}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={goal || 0}
        aria-valuenow={Math.round(value)}
        className="mt-1 h-2 overflow-hidden rounded-full bg-fill"
      >
        <div className={`h-full rounded-full transition-[width] duration-500 ${over ? 'bg-label-2' : 'bg-label'}`} style={{ width: `${goal ? p : 0}%` }} />
      </div>
    </div>
  )
}

function Targets({ target, eaten }) {
  const left = target ? target.kcal - eaten.kcal : 0
  return (
    <section aria-labelledby="targets-title" className="rounded-3xl bg-surface p-5">
      <h2 id="targets-title" className="text-subhead text-label-2">
        Kalorien
      </h2>
      <p className="mt-0.5 text-title-2 font-bold tabular-nums">
        {fmt(eaten.kcal)} {target && <span className="font-semibold text-label-2">von {fmt(target.kcal)} kcal</span>}
        {!target && <span className="font-semibold text-label-2">kcal</span>}
      </p>
      {target && (
        <>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-fill" aria-hidden>
            <div className="h-full rounded-full bg-label transition-[width] duration-500" style={{ width: `${Math.min(100, (eaten.kcal / target.kcal) * 100)}%` }} />
          </div>
          <p className="mt-2 text-footnote text-label-2">
            {left >= 0 ? `Noch ${fmt(left)} kcal` : `${fmt(-left)} kcal über dem Ziel`} · Grundbedarf {fmt(target.base)}
            {target.trainingKcal > 0 && ` + Training ≈ ${fmt(target.trainingKcal)}`} kcal
          </p>
        </>
      )}
      <div className="mt-5 space-y-3">
        <Bar label="Protein" value={eaten.protein} goal={target?.protein} unit="g" />
        <Bar label="Kohlenhydrate" value={eaten.carbs} goal={target?.carbs} unit="g" />
        <Bar label="Fett" value={eaten.fat} goal={target?.fat} unit="g" />
      </div>
    </section>
  )
}

/* ---------- Mahlzeiten ---------- */

function Meals({ entries, onAdd, onRemove }) {
  const groups = Object.keys(MEALS).filter((m) => m !== 'training' || entries.some((e) => e.meal === 'training'))
  return (
    <section aria-labelledby="meals-title" className="space-y-4">
      <div className="flex items-end justify-between gap-3 px-1">
        <h2 id="meals-title" className="text-title-2 font-bold">
          Mahlzeiten
        </h2>
        <button
          onClick={() => onAdd(mealForNow())}
          className="inline-flex h-11 items-center gap-1.5 rounded-full bg-label px-4 text-subhead font-semibold text-on-label hover:opacity-85 active:opacity-70"
        >
          <Plus className="size-5" /> Eintrag
        </button>
      </div>
      <ol className="overflow-hidden rounded-3xl bg-surface">
        {groups.map((meal) => {
          const list = entries.filter((e) => e.meal === meal)
          const sum = totals(list)
          return (
            <li key={meal} className="border-separator [&:not(:first-child)]:border-t">
              <div className="flex items-center gap-3 py-2 pr-2 pl-5">
                <h3 className="flex-1 text-headline font-semibold">
                  {MEALS[meal]}
                  {list.length > 0 && <span className="ml-2 text-footnote font-normal text-label-2">{fmt(sum.kcal)} kcal</span>}
                </h3>
                <button
                  onClick={() => onAdd(meal)}
                  aria-label={`${MEALS[meal]} hinzufügen`}
                  className="grid size-11 place-items-center rounded-full text-label-2 hover:bg-fill hover:text-label"
                >
                  <Plus className="size-5" />
                </button>
              </div>
              {list.length === 0 ? (
                <p className="pb-4 pl-5 text-subhead text-label-2">Noch nichts eingetragen</p>
              ) : (
                <ul className="pb-2">
                  {list.map((e) => (
                    <li key={e.id} className="flex items-center gap-2 pr-2 pl-5">
                      <div className="min-w-0 flex-1 py-1.5">
                        <p className="text-body">{e.name}</p>
                        <p className="text-footnote tabular-nums text-label-2">
                          P {fmt(e.protein || 0)} g · KH {fmt(e.carbs || 0)} g · F {fmt(e.fat || 0)} g
                        </p>
                      </div>
                      <span className="text-subhead font-semibold tabular-nums">{fmt(e.kcal)} kcal</span>
                      <button
                        onClick={() => onRemove(e)}
                        aria-label={`${e.name} löschen`}
                        className="grid size-11 shrink-0 place-items-center rounded-full text-label-2 hover:bg-fill hover:text-label"
                      >
                        <Trash2 className="size-[18px]" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}

/* ---------- Verpflegung fürs Training ---------- */

function FuelPlanner({ sessions, profile, target }) {
  return (
    <section aria-labelledby="fuel-title" className="space-y-4">
      <h2 id="fuel-title" className="px-1 text-title-2 font-bold">
        Training & Verpflegung
      </h2>
      {sessions.length === 0 ? (
        <div className="rounded-3xl bg-surface p-5 text-subhead text-label-2">
          Kein Training an diesem Tag.
          {target && ` Ruhetag: Kohlenhydrate etwas niedriger (${target.carbsPerKg.toLocaleString('de-AT')} g pro kg), Protein gleich hoch.`}
        </div>
      ) : !profile ? (
        <div className="rounded-3xl bg-surface p-5 text-subhead text-label-2">Mit deinem Gewicht im Profil siehst du hier, was du vor, während und nach dem Training essen und trinken solltest.</div>
      ) : (
        sessions.map((s) => <FuelCard key={s.id} session={s} weight={profile.weight} />)
      )}
      {profile && sessions.length > 0 && (
        <p className="px-1 text-footnote text-label-2">
          Richtwerte aus der Sporternährung, berechnet für {profile.weight} kg. Bei Hitze mehr trinken. Neue Produkte nicht am Wettkampftag ausprobieren.
        </p>
      )}
    </section>
  )
}

function FuelCard({ session, weight }) {
  const sport = SPORTS[session.sport] ?? SPORTS.run
  const Icon = sport.icon
  const plan = fuelPlan(session, weight)
  const start = session.start
  return (
    <div className="rounded-3xl bg-surface p-5">
      <div className="flex items-center gap-2">
        <Icon className={`size-5 ${sport.text}`} aria-hidden />
        <p className="min-w-0 flex-1 text-headline font-semibold">{session.title}</p>
        <span className="text-footnote tabular-nums text-label-2">
          {start && `${start} · `}
          {fmtDuration(session.duration)} · ≈ {sessionKcal(session, weight).toLocaleString('de-AT')} kcal
        </span>
      </div>

      <ol className="mt-4 space-y-4">
        <Phase icon={Utensils} title="Vorher" time={start && `ca. ${shiftTime(start, -150)}–${shiftTime(start, -90)}`}>
          {plan.before.carbs} g Kohlenhydrate, {plan.before.fluid} ml trinken
          <Hint>{plan.before.hint}</Hint>
        </Phase>
        {plan.during && (
          <Phase icon={plan.during.carbs > 0 ? Zap : Droplets} title="Unterwegs" time={start && `ab ${shiftTime(start, 20)}`}>
            {plan.during.carbs > 0 ? (
              <>
                {plan.during.carbsPerHour} g KH und {plan.during.fluidPerHour} ml pro Stunde – gesamt ≈ {plan.during.carbs} g ({plan.during.gels}{' '}
                {plan.during.gels === 1 ? 'Gel' : 'Gels'} à 25 g oder Sportgetränk), {(plan.during.fluid / 1000).toLocaleString("de-AT")} l
              </>
            ) : (
              <>≈ {(plan.during.fluid / 1000).toLocaleString("de-AT")} l</>
            )}
            <Hint>{plan.during.hint}</Hint>
          </Phase>
        )}
        <Phase icon={Clock} title="Danach" time={start && `bis ${shiftTime(start, Number(session.duration) + 60)}`}>
          {plan.after.carbs} g Kohlenhydrate + {plan.after.protein} g Protein
          <Hint>{plan.after.hint}</Hint>
        </Phase>
      </ol>
    </div>
  )
}

function Phase({ icon: Icon, title, time, children }) {
  return (
    <li className="flex gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-fill" aria-hidden>
        <Icon className="size-[18px]" />
      </span>
      <div className="min-w-0 text-subhead">
        <p className="font-semibold">
          {title}
          {time && <span className="ml-1.5 font-normal tabular-nums text-label-2">{time}</span>}
        </p>
        <p>{children}</p>
      </div>
    </li>
  )
}

const Hint = ({ children }) => <span className="mt-0.5 block text-footnote text-label-2">{children}</span>

/* ---------- Eintrag hinzufügen ---------- */

const SHORT_MEALS = { breakfast: 'Früh', lunch: 'Mittag', dinner: 'Abend', snack: 'Snack', training: 'Training' }

function FoodSheet({ defaultMeal, favorites, setFavorites, onClose, onAdd }) {
  const [form, setForm] = useState({ meal: defaultMeal, name: '', kcal: '', protein: '', carbs: '', fat: '', favorite: false })

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  const num = (v) => (v === '' ? 0 : Number(String(v).replace(',', '.')) || 0)
  const macros = { protein: num(form.protein), carbs: num(form.carbs), fat: num(form.fat) }
  const autoKcal = kcalFromMacros(macros)
  const kcal = form.kcal === '' ? autoKcal : num(form.kcal)
  const valid = form.name.trim() && kcal > 0

  const entryOf = (src) => ({ name: src.name, kcal: src.kcal, protein: src.protein, carbs: src.carbs, fat: src.fat })

  const submit = (e) => {
    e.preventDefault()
    if (!valid) return
    const entry = { name: form.name.trim(), kcal: Math.round(kcal), ...macros }
    if (form.favorite && !favorites.some((f) => f.name.toLowerCase() === entry.name.toLowerCase())) {
      setFavorites((list) => [...list, { ...entry, id: uid() }])
    }
    onAdd({ ...entry, meal: form.meal })
  }

  const field = 'mt-1 block w-full rounded-xl border border-separator bg-bg px-3 py-2.5 text-body text-label outline-none focus:border-label'
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value.replace(/[^\d.,]/g, '') })

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4" onClick={onClose}>
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="food-sheet-title"
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-surface pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-3xl"
      >
        <div className="sticky top-0 z-10 grid grid-cols-[1fr_auto_1fr] items-center border-b border-separator bg-surface px-2 py-1">
          <button type="button" onClick={onClose} className="h-11 justify-self-start rounded-full px-3 text-body hover:bg-fill">
            Abbrechen
          </button>
          <h3 id="food-sheet-title" className="text-headline font-semibold">
            Neuer Eintrag
          </h3>
          <button type="submit" disabled={!valid} className="h-11 justify-self-end rounded-full px-3 text-body font-semibold hover:bg-fill disabled:opacity-30">
            Hinzufügen
          </button>
        </div>

        <div className="space-y-5 px-5 pt-5">
          <fieldset>
            <legend className="text-subhead text-label-2">Mahlzeit</legend>
            <div className="mt-1.5 grid grid-cols-5 gap-1 rounded-2xl bg-fill p-1">
              {Object.keys(MEALS).map((m) => (
                <button
                  type="button"
                  key={m}
                  aria-pressed={form.meal === m}
                  aria-label={MEALS[m]}
                  onClick={() => setForm({ ...form, meal: m })}
                  className={`h-11 rounded-xl text-footnote font-semibold transition-colors ${
                    form.meal === m ? 'bg-surface text-label shadow-sm' : 'text-label-2 hover:text-label'
                  }`}
                >
                  {SHORT_MEALS[m]}
                </button>
              ))}
            </div>
          </fieldset>

          {favorites.length > 0 && (
            <div>
              <p className="text-subhead text-label-2">Favoriten – mit einem Tipp hinzufügen</p>
              <ul className="mt-1.5 divide-y divide-separator overflow-hidden rounded-2xl bg-bg">
                {favorites.map((f) => (
                  <li key={f.id} className="flex items-center gap-1 pl-3">
                    <button
                      type="button"
                      onClick={() => onAdd({ ...entryOf(f), meal: form.meal })}
                      className="flex min-h-11 min-w-0 flex-1 items-center gap-2 py-1.5 text-left"
                    >
                      <Star className="size-4 shrink-0 fill-label text-label" aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-body">{f.name}</span>
                        <span className="block text-footnote tabular-nums text-label-2">
                          {fmt(f.kcal)} kcal · P {fmt(f.protein)} · KH {fmt(f.carbs)} · F {fmt(f.fat)}
                        </span>
                      </span>
                      <Plus className="size-5 shrink-0 text-label-2" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => setFavorites((list) => list.filter((x) => x.id !== f.id))}
                      aria-label={`Favorit ${f.name} entfernen`}
                      className="grid size-11 shrink-0 place-items-center rounded-full text-label-2 hover:bg-fill hover:text-label"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <label className="block text-subhead text-label-2">
            Was hast du gegessen?
            <input autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="z. B. Haferflocken mit Banane" className={field} />
          </label>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <label className="block text-subhead text-label-2">
              kcal
              <input inputMode="decimal" value={form.kcal} onChange={set('kcal')} placeholder={autoKcal ? `≈ ${autoKcal}` : '0'} className={field} />
            </label>
            <label className="block text-subhead text-label-2">
              Protein g
              <input inputMode="decimal" value={form.protein} onChange={set('protein')} placeholder="0" className={field} />
            </label>
            <label className="block text-subhead text-label-2">
              KH g
              <input inputMode="decimal" value={form.carbs} onChange={set('carbs')} placeholder="0" className={field} />
            </label>
            <label className="block text-subhead text-label-2">
              Fett g
              <input inputMode="decimal" value={form.fat} onChange={set('fat')} placeholder="0" className={field} />
            </label>
          </div>
          <p className="text-footnote text-label-2">Ohne kcal-Angabe rechnet LockedIn die kcal aus den Makros.</p>

          <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-2xl bg-bg px-4 py-2">
            <Star className="size-5 shrink-0 text-label-2" aria-hidden />
            <span className="flex-1 text-body">Als Favorit speichern</span>
            <input
              type="checkbox"
              checked={form.favorite}
              onChange={(e) => setForm({ ...form, favorite: e.target.checked })}
              className="size-5 accent-[var(--color-label)]"
            />
          </label>
        </div>
      </form>
    </div>
  )
}
