import { Download, FlaskConical } from 'lucide-react'

// Zeigt immer auf die neueste Version im Release des LockedIn-Repos
export const PAINLAB_URL = 'https://github.com/HasuerAlex/LockedIn/releases/latest/download/PainLab-Setup.exe'

// Erst einschalten, wenn PainLab.exe im Release liegt – sonst führt der Knopf ins Leere
export const PAINLAB_RELEASED = true

export default function PainLabCard() {
  if (!PAINLAB_RELEASED) return null
  return (
    <section aria-labelledby="painlab-title" className="space-y-4">
      <h2 id="painlab-title" className="px-1 text-title-2 font-bold">
        PainLab
      </h2>
      <div className="rounded-3xl bg-surface p-5">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-fill text-label" aria-hidden>
            <FlaskConical className="size-6" />
          </span>
          <div className="min-w-0">
            <p className="text-headline font-semibold">PainLab für Windows</p>
            <p className="text-subhead text-label-2">Die Desktop-App aus dem WattLab-Projekt.</p>
          </div>
        </div>
        <a
          href={PAINLAB_URL}
          download
          className="mt-4 flex h-11 items-center justify-center gap-2 rounded-full bg-label px-5 text-headline font-semibold text-on-label hover:opacity-85 active:opacity-70"
        >
          <Download className="size-5" aria-hidden /> PainLab herunterladen
        </a>
        <p className="mt-3 text-footnote text-label-2">
          Installationsprogramm für Windows (37 MB). Windows zeigt beim ersten Start eventuell „Der Computer wurde durch Windows geschützt“. Dann auf „Weitere Informationen“ und
          „Trotzdem ausführen“ klicken.
        </p>
      </div>
    </section>
  )
}
