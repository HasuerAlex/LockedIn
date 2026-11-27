import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Activity } from 'lucide-react'
import GoalBanner, { defaultGoal } from './components/GoalBanner'
import WeeklyPlan, { samplePlan } from './components/WeeklyPlan'
import HabitTracker, { DEFAULT_HABITS } from './components/HabitTracker'
import { useLocalStorage, mondayOf, addDays, toKey, fmtDate, isoWeek, startOfDay } from './lib/utils'

function useToday() {
  const [today, setToday] = useState(() => startOfDay(new Date()))
  useEffect(() => {
    // Um Mitternacht (bzw. beim Zurückkehren in den Tab) aktualisieren
    const tick = () => {
      const now = startOfDay(new Date())
      setToday((t) => (t.getTime() === now.getTime() ? t : now))
    }
    const id = setInterval(tick, 60_000)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [])
  return today
}

export default function App() {
  const today = useToday()
  const currentMonday = mondayOf(today)
  const [weekStart, setWeekStart] = useState(currentMonday)

  const [goal, setGoal] = useLocalStorage('goal', () => defaultGoal(today))
  const [plans, setPlans] = useLocalStorage('plans', () => ({ [toKey(currentMonday)]: samplePlan() }))
  const [habits, setHabits] = useLocalStorage('habits', DEFAULT_HABITS)
  const [habitLog, setHabitLog] = useLocalStorage('habitLog', {})

  const isCurrentWeek = toKey(weekStart) === toKey(currentMonday)
  const weekEnd = addDays(weekStart, 6)

  return (
    <div className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_at_top,rgba(34,211,238,0.08),transparent_60%)]">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:py-10">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-slate-300">
            <span className="rounded-xl bg-gradient-to-br from-cyan-400 via-orange-400 to-emerald-400 p-1.5 text-slate-950">
              <Activity className="h-4 w-4" strokeWidth={3} />
            </span>
            Athlete HQ
          </div>
          <div className="text-sm text-slate-400">
            {today.toLocaleDateString('de-AT', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </nav>

        <GoalBanner goal={goal} setGoal={setGoal} today={today} />

        {/* Wochen-Navigation – gilt für Trainingsplan und Habits */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-between">
          <div className="hidden text-sm text-slate-500 sm:block">Woche auswählen</div>
          <div className="flex items-center gap-1 rounded-2xl bg-slate-900/80 p-1 ring-1 ring-white/10">
            <button
              onClick={() => setWeekStart(addDays(weekStart, -7))}
              className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white"
              aria-label="Vorherige Woche"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="min-w-48 px-3 text-center">
              <div className="text-sm font-bold text-white">KW {isoWeek(weekStart)}</div>
              <div className="text-xs text-slate-400">
                {fmtDate(weekStart)} – {fmtDate(weekEnd, { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </div>
            </div>
            <button
              onClick={() => setWeekStart(addDays(weekStart, 7))}
              className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white"
              aria-label="Nächste Woche"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <button
            onClick={() => setWeekStart(currentMonday)}
            disabled={isCurrentWeek}
            className="rounded-xl px-3 py-2 text-sm font-semibold text-cyan-300 hover:bg-cyan-400/10 disabled:hidden sm:disabled:invisible sm:disabled:block"
          >
            Zur aktuellen Woche
          </button>
        </div>

        <WeeklyPlan weekStart={weekStart} today={today} plans={plans} setPlans={setPlans} />
        <HabitTracker
          weekStart={weekStart}
          today={today}
          habits={habits}
          setHabits={setHabits}
          log={habitLog}
          setLog={setHabitLog}
        />

        <footer className="pb-4 text-center text-xs text-slate-600">
          Alle Daten werden lokal in deinem Browser gespeichert. Swim · Bike · Run 🏊‍♂️🚴‍♀️🏃
        </footer>
      </div>
    </div>
  )
}
