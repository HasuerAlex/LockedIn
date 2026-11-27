import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { SPORTS, daysBetween, fmtDate, fromKey, toKey } from '../lib/utils'

/*
 * Signatur-Element: Die Vorbereitung als Rennstrecke.
 * Breiten grob nach der typischen Zeitverteilung eines Ironman (Schwimmen ≈ 1/6, Rad ≈ 1/2, Laufen ≈ 1/3),
 * damit auch das Schwimm-Segment auf dem Handy lesbar bleibt.
 */
const COURSE = [
  { sport: 'swim', share: 18, distance: '3,8 km', phase: 'im Wasser' },
  { sport: 'bike', share: 46, distance: '180 km', phase: 'auf der Radstrecke' },
  { sport: 'run', share: 36, distance: '42,2 km', phase: 'auf der Laufstrecke' },
]

export default function GoalBanner({ goal, setGoal, today }) {
  const [editing, setEditing] = useState(false)

  if (!goal) {
    return (
      <section aria-labelledby="goal-title" className="rounded-3xl bg-surface p-5 sm:p-8">
        {editing ? (
          <GoalForm
            goal={{ title: '', startDate: toKey(today), targetDate: '' }}
            onCancel={() => setEditing(false)}
            onSave={(g) => (setGoal(g), setEditing(false))}
          />
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 id="goal-title" className="text-title-2 font-bold">
                Noch kein Ziel
              </h1>
              <p className="mt-1 text-subhead text-label-2">Leg deinen Wettkampf fest, dann zählt die App die Tage bis zum Start.</p>
            </div>
            <button
              onClick={() => setEditing(true)}
              className="h-11 rounded-full bg-label px-5 text-headline font-semibold text-on-label hover:opacity-85 active:opacity-70"
            >
              Ziel festlegen
            </button>
          </div>
        )}
      </section>
    )
  }

  const start = fromKey(goal.startDate)
  const target = fromKey(goal.targetDate)
  const total = Math.max(1, daysBetween(start, target))
  const elapsed = Math.min(total, Math.max(0, daysBetween(start, today)))
  const daysLeft = Math.max(0, daysBetween(today, target))
  const progress = (elapsed / total) * 100

  let offset = 0
  const segments = COURSE.map((c) => {
    const from = offset
    offset += c.share
    const filled = Math.min(100, Math.max(0, ((progress - from) / c.share) * 100))
    return { ...c, from, filled }
  })
  const current = segments.find((s) => progress < s.from + s.share)

  return (
    <section aria-labelledby="goal-title" className="rounded-3xl bg-surface p-5 sm:p-8">
      {editing ? (
        <GoalForm goal={goal} onCancel={() => setEditing(false)} onSave={(g) => (setGoal(g), setEditing(false))} />
      ) : (
        <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
          <div className="min-w-0">
            <p className="text-subhead text-label-2">Hauptziel</p>
            <div className="flex items-start gap-1">
              <h1 id="goal-title" className="text-large-title font-bold tracking-tight text-balance">
                {goal.title}
              </h1>
              <button
                onClick={() => setEditing(true)}
                aria-label="Ziel bearbeiten"
                className="-mt-0.5 grid size-11 shrink-0 place-items-center rounded-full text-label-2 hover:bg-fill hover:text-label active:bg-fill"
              >
                <Pencil className="size-5" />
              </button>
            </div>
            <p className="mt-1 text-subhead text-label-2">
              Race Day {fmtDate(target, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          <p className="sm:text-right" aria-live="polite">
            {daysLeft > 0 ? (
              <>
                <span className="block text-large-title font-bold tabular-nums tracking-tight">{daysLeft} Tage</span>
                <span className="text-subhead text-label-2">bis zum Start</span>
              </>
            ) : (
              <span className="text-title-2 font-bold">
                {daysBetween(today, target) === 0 ? 'Heute ist Race Day!' : 'Ziel erreicht 🏅'}
              </span>
            )}
          </p>
        </div>
      )}

      {/* Rennstrecke */}
      <div className="mt-8">
        <div
          role="progressbar"
          aria-label="Fortschritt der Vorbereitung"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={elapsed}
          aria-valuetext={`Tag ${elapsed} von ${total}, ${Math.round(progress)} Prozent`}
          className="relative flex gap-1"
        >
          {segments.map((s) => (
            <div key={s.sport} className="h-2.5 overflow-hidden rounded-full bg-fill" style={{ width: `${s.share}%` }}>
              <div
                className={`h-full rounded-full ${SPORTS[s.sport].bg} transition-[width] duration-700 ease-out`}
                style={{ width: `${s.filled}%` }}
              />
            </div>
          ))}
          {/* Positionsmarke */}
          {progress > 0 && progress < 100 && (
            <span
              aria-hidden
              className="absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-surface bg-label shadow transition-[left] duration-700 ease-out"
              style={{ left: `${progress}%` }}
            />
          )}
        </div>

        <div className="mt-2 flex gap-1" aria-hidden>
          {segments.map((s) => {
            const Icon = SPORTS[s.sport].icon
            return (
              <div key={s.sport} className="flex min-w-0 items-center gap-0.5 whitespace-nowrap text-caption text-label-2" style={{ width: `${s.share}%` }}>
                <Icon className={`size-3 shrink-0 ${SPORTS[s.sport].text}`} />
                <span>{s.distance}</span>
              </div>
            )
          })}
        </div>

        <p className="mt-4 text-subhead text-label-2">
          <span className="font-semibold text-label">
            Tag {elapsed} von {total} · {Math.round(progress)} %
          </span>
          {current
            ? ` – wäre deine Vorbereitung ein Rennen, wärst du jetzt ${current.phase}.`
            : ' – Vorbereitung abgeschlossen. Du bist bereit.'}
        </p>
      </div>
    </section>
  )
}

function GoalForm({ goal, onCancel, onSave }) {
  const [draft, setDraft] = useState(goal)
  const invalid = !draft.title.trim() || !draft.startDate || !draft.targetDate || draft.targetDate <= draft.startDate
  const field =
    'mt-1 block w-full rounded-xl border border-separator bg-bg px-3 py-2.5 text-body text-label outline-none focus:border-label'

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (!invalid) onSave({ ...draft, title: draft.title.trim() })
      }}
      onKeyDown={(e) => e.key === 'Escape' && onCancel()}
      className="space-y-4"
    >
      <label className="block text-subhead text-label-2">
        Ziel
        <input
          autoFocus
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          placeholder="z. B. Ironman Klagenfurt"
          className={`${field} text-title-3 font-semibold`}
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-subhead text-label-2">
          Vorbereitung ab
          <input type="date" value={draft.startDate} onChange={(e) => setDraft({ ...draft, startDate: e.target.value })} className={field} />
        </label>
        <label className="block text-subhead text-label-2">
          Race Day
          <input type="date" value={draft.targetDate} onChange={(e) => setDraft({ ...draft, targetDate: e.target.value })} className={field} />
        </label>
      </div>
      {draft.targetDate && draft.startDate && draft.targetDate <= draft.startDate && (
        <p className="text-subhead text-label-2" role="alert">
          Der Race Day muss nach dem Start der Vorbereitung liegen.
        </p>
      )}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="h-11 rounded-full px-5 text-headline font-semibold hover:bg-fill">
          Abbrechen
        </button>
        <button
          type="submit"
          disabled={invalid}
          className="h-11 rounded-full bg-label px-5 text-headline font-semibold text-on-label hover:opacity-85 active:opacity-70 disabled:opacity-30"
        >
          Speichern
        </button>
      </div>
    </form>
  )
}
