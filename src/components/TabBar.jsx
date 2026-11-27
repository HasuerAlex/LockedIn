import { CalendarRange, Apple, FlaskConical } from 'lucide-react'

export const TABS = [
  { id: 'training', label: 'Training', icon: CalendarRange },
  { id: 'ernaehrung', label: 'Ernährung', icon: Apple },
  { id: 'painlab', label: 'PainLab', icon: FlaskConical },
]

/**
 * Navigation zwischen den Bereichen.
 * Handy/Tablet: Tab-Leiste unten (wie in iOS-Apps), große Bildschirme: Segmente oben.
 */
export default function TabBar({ tab, setTab }) {
  return (
    <>
      {/* oben, ab lg */}
      <nav aria-label="Bereiche" className="hidden lg:block">
        <div role="tablist" className="inline-flex gap-1 rounded-2xl bg-fill p-1">
          {TABS.map((t) => {
            const Icon = t.icon
            const active = tab === t.id
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.id)}
                className={`inline-flex h-11 items-center gap-2 rounded-xl px-5 text-subhead font-semibold transition-colors ${
                  active ? 'bg-surface text-label shadow-sm' : 'text-label-2 hover:text-label'
                }`}
              >
                <Icon className="size-5" aria-hidden />
                {t.label}
              </button>
            )
          })}
        </div>
      </nav>

      {/* unten, bis lg */}
      <nav
        aria-label="Bereiche"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-separator bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
      >
        <div role="tablist" className="mx-auto grid max-w-md grid-cols-3">
          {TABS.map((t) => {
            const Icon = t.icon
            const active = tab === t.id
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.id)}
                className={`flex h-14 flex-col items-center justify-center gap-0.5 text-caption font-semibold ${active ? 'text-label' : 'text-label-2'}`}
              >
                <Icon className="size-6" strokeWidth={active ? 2.4 : 1.8} aria-hidden />
                {t.label}
              </button>
            )
          })}
        </div>
      </nav>
    </>
  )
}
