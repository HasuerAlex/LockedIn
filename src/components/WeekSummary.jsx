import { Star, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { SPORTS, WEEKDAYS_LONG, fmtHours } from '../lib/utils'
import { HABIT_ICONS, iconKeyOf } from '../lib/habitIcons'

const km = (v) => v.toLocaleString('de-AT', { maximumFractionDigits: 1 })
const pct = (v) => `${Math.round(v * 100)} %`

/** Wochenrückblick: erscheint am Sonntag der laufenden Woche und bei allen vergangenen Wochen */
export default function WeekSummary({ summary, previous, isCurrent, weekLabel }) {
  const { done, planned, sessionsDone, sessionsTotal, bySport, rating, habits } = summary
  const delta = previous && !previous.isEmpty ? done - previous.done : null

  return (
    <section aria-labelledby="summary-title" className="rounded-3xl bg-surface p-5 sm:p-6">
      <p className="text-subhead text-label-2">{isCurrent ? 'Deine Woche im Überblick' : weekLabel}</p>
      <h2 id="summary-title" className="text-title-2 font-bold">
        Wochenrückblick
      </h2>

      {/* Kennzahlen */}
      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Training">
          {fmtHours(done)} <span className="text-label-2">von {fmtHours(planned)} h</span>
        </Stat>
        <Stat label="Einheiten">
          {sessionsDone} <span className="text-label-2">von {sessionsTotal}</span>
        </Stat>
        <Stat label="Ø Bewertung">
          {rating.count ? (
            <span className="inline-flex items-center gap-1">
              <Star className="size-5 fill-rating text-rating" aria-hidden />
              {rating.avg.toLocaleString('de-AT', { maximumFractionDigits: 1 })}
            </span>
          ) : (
            <span className="text-label-2">–</span>
          )}
        </Stat>
        <Stat label="Habits">{habits.total ? pct(habits.pct) : <span className="text-label-2">–</span>}</Stat>
      </dl>

      {delta !== null && (
        <p className="mt-3 flex items-center gap-1.5 text-subhead">
          {delta > 0 ? (
            <TrendingUp className="size-4" aria-hidden />
          ) : delta < 0 ? (
            <TrendingDown className="size-4" aria-hidden />
          ) : (
            <Minus className="size-4" aria-hidden />
          )}
          {delta === 0
            ? 'Gleich viel Training wie letzte Woche'
            : `${fmtHours(Math.abs(delta))} h ${delta > 0 ? 'mehr' : 'weniger'} als letzte Woche`}
        </p>
      )}

      <div className="mt-5 grid gap-6 lg:grid-cols-2">
        {/* Sportarten */}
        {bySport.length > 0 && (
          <div>
            <h3 className="text-footnote font-semibold text-label-2">Nach Sportart</h3>
            <ul className="mt-2 space-y-2.5">
              {bySport.map((s) => {
                const sport = SPORTS[s.sport]
                const Icon = sport.icon
                return (
                  <li key={s.sport}>
                    <div className="flex items-center justify-between gap-2 text-subhead">
                      <span className="inline-flex items-center gap-1.5 font-semibold">
                        <Icon className={`size-4 ${sport.text}`} aria-hidden />
                        {sport.label}
                      </span>
                      <span className="tabular-nums text-label-2">
                        {fmtHours(s.done)} von {fmtHours(s.planned)} h{s.km > 0 && ` · ${km(s.km)} km`}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-fill" aria-hidden>
                      <div className={`h-full rounded-full ${sport.bg}`} style={{ width: `${(s.done / s.planned) * 100}%` }} />
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {/* Habits */}
        {habits.per.length > 0 && habits.total > 0 && (
          <div>
            <h3 className="text-footnote font-semibold text-label-2">
              Habits{habits.perfectDays > 0 && ` · ${habits.perfectDays} perfekte${habits.perfectDays === 1 ? 'r Tag' : ' Tage'}`}
            </h3>
            <ul className="mt-2 space-y-2">
              {habits.per.map((h) => {
                const Icon = HABIT_ICONS[iconKeyOf(h)].icon
                return (
                  <li key={h.id} className="flex items-center gap-2 text-subhead">
                    <Icon className="size-4 shrink-0 text-label-2" aria-hidden />
                    <span className="min-w-0 flex-1 truncate">{h.name}</span>
                    <span className="flex gap-0.5" aria-hidden>
                      {Array.from({ length: h.possible }, (_, i) => (
                        <span key={i} className={`h-3 w-1.5 rounded-full ${i < h.done ? 'bg-label' : 'bg-fill'}`} />
                      ))}
                    </span>
                    <span className="w-9 text-right tabular-nums text-label-2" aria-label={`${h.done} von ${h.possible} Tagen`}>
                      {h.done}/{h.possible}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>

      {/* Bester Tag */}
      {rating.best && (
        <div className="mt-5 rounded-2xl bg-bg p-4">
          <p className="flex items-center gap-1.5 text-footnote font-semibold text-label-2">
            Bester Tag
            <span className="inline-flex" aria-label={`${rating.best.rating} von 5 Sternen`}>
              {Array.from({ length: rating.best.rating }, (_, i) => (
                <Star key={i} className="size-3.5 fill-rating text-rating" aria-hidden />
              ))}
            </span>
          </p>
          <p className="text-headline font-semibold">{WEEKDAYS_LONG[rating.best.dayIdx]}</p>
          {rating.best.note && <p className="mt-0.5 line-clamp-3 text-subhead text-label-2">„{rating.best.note}“</p>}
        </div>
      )}
    </section>
  )
}

function Stat({ label, children }) {
  return (
    <div className="rounded-2xl bg-bg p-3">
      <dt className="text-footnote text-label-2">{label}</dt>
      <dd className="mt-0.5 text-title-3 font-bold tabular-nums">{children}</dd>
    </div>
  )
}
