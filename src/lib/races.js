/*
 * Wettkampfarten fürs Hauptziel.
 * goal.race = { type: 'triathlon' | 'run' | 'bike', variant?: string, distance?: number (nur Radrennen) }
 */

export const RACE_TYPES = {
  triathlon: {
    label: 'Triathlon',
    sport: 'swim', // Symbol in der Auswahl
    variants: {
      sprint: { label: 'Sprint', legs: { swim: 0.75, bike: 20, run: 5 } },
      olympic: { label: 'Olympisch', legs: { swim: 1.5, bike: 40, run: 10 } },
      half: { label: 'Mitteldistanz (70.3)', legs: { swim: 1.9, bike: 90, run: 21.1 } },
      full: { label: 'Langdistanz (Ironman)', legs: { swim: 3.8, bike: 180, run: 42.2 } },
    },
    defaultVariant: 'full',
  },
  run: {
    label: 'Laufen',
    sport: 'run',
    variants: {
      marathon: { label: 'Marathon', legs: { run: 42.195 } },
      half: { label: 'Halbmarathon', legs: { run: 21.0975 } },
      '10k': { label: '10 km', legs: { run: 10 } },
      '5k': { label: '5 km', legs: { run: 5 } },
    },
    defaultVariant: 'marathon',
  },
  bike: {
    label: 'Radrennen',
    sport: 'bike',
    variants: null, // Distanz wird eingegeben
  },
}

export const DEFAULT_RACE = { type: 'triathlon', variant: 'full' }

export const fmtKm = (km) => `${km.toLocaleString('de-AT', { maximumFractionDigits: km < 1 ? 2 : 1 })} km`

/** Ziele aus früheren Versionen haben keine Wettkampfart → Ironman */
export const raceOf = (goal) => goal?.race ?? DEFAULT_RACE

/** Teilstrecken in Reihenfolge: [{ sport, km }] */
export function legsOf(race) {
  if (race.type === 'bike') return [{ sport: 'bike', km: Number(race.distance) || 0 }]
  const type = RACE_TYPES[race.type] ?? RACE_TYPES.triathlon
  const variant = type.variants[race.variant] ?? type.variants[type.defaultVariant]
  return Object.entries(variant.legs).map(([sport, km]) => ({ sport, km }))
}

/** z. B. „Triathlon · Langdistanz (Ironman)“, „Laufen · Halbmarathon“, „Radrennen · 120 km“ */
export function raceLabel(race) {
  const type = RACE_TYPES[race.type] ?? RACE_TYPES.triathlon
  if (race.type === 'bike') return `${type.label} · ${fmtKm(Number(race.distance) || 0)}`
  const variant = type.variants[race.variant] ?? type.variants[type.defaultVariant]
  return `${type.label} · ${variant.label}`
}

export function isValidRace(race) {
  if (!RACE_TYPES[race?.type]) return false
  if (race.type === 'bike') return Number(race.distance) > 0
  return Boolean(RACE_TYPES[race.type].variants[race.variant])
}
