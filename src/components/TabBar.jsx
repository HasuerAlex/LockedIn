import { useEffect, useState } from 'react'
import { CalendarRange, Apple, FlaskConical } from 'lucide-react'

/**
 * true, solange die Bildschirmtastatur offen ist (Textfeld fokussiert oder sichtbarer Bereich deutlich kleiner).
 * Sonst schiebt das Handy die fixierte Tab-Leiste über die Tastatur – sie „schwebt“ mitten im Bild.
 */
function useKeyboardOpen() {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const isTyping = () => {
      const el = document.activeElement
      if (!el) return false
      if (el.tagName === 'TEXTAREA' || el.isContentEditable) return true
      return el.tagName === 'INPUT' && !['checkbox', 'radio', 'button', 'submit', 'range', 'color', 'file'].includes(el.type)
    }
    const vv = window.visualViewport
    const update = () => {
      const shrunk = vv ? window.innerHeight - vv.height > 150 : false
      setOpen(isTyping() || shrunk)
    }
    // focusout feuert, bevor das nächste Feld den Fokus hat → kurz warten
    const onFocusOut = () => setTimeout(update, 50)
    document.addEventListener('focusin', update)
    document.addEventListener('focusout', onFocusOut)
    vv?.addEventListener('resize', update)
    return () => {
      document.removeEventListener('focusin', update)
      document.removeEventListener('focusout', onFocusOut)
      vv?.removeEventListener('resize', update)
    }
  }, [])
  return open
}

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
  const keyboardOpen = useKeyboardOpen()
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
        hidden={keyboardOpen}
        // !m-0: liegt in einem space-y-Container, dessen Abstand die fixierte Leiste sonst nach oben schiebt.
        // Hintergrund reicht weit nach unten: Wenn Safari beim Scrollen seine Leiste ein-/ausblendet
        // oder die Seite unten nachfedert, blitzt darunter kein Seiteninhalt durch.
        className="fixed inset-x-0 bottom-0 z-30 !m-0 border-t border-separator bg-surface pb-[env(safe-area-inset-bottom)] after:absolute after:inset-x-0 after:top-full after:h-[50vh] after:bg-surface lg:hidden"
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
