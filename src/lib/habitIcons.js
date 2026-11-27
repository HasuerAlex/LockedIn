import {
  Activity,
  Apple,
  Ban,
  Bed,
  Bike,
  BookOpen,
  Brain,
  CircleCheck,
  Coffee,
  Droplet,
  Dumbbell,
  Footprints,
  HeartPulse,
  Leaf,
  Moon,
  NotebookPen,
  PersonStanding,
  Pill,
  Salad,
  Smartphone,
  Snowflake,
  Sun,
  Timer,
  Waves,
  Beef,
} from 'lucide-react'

/** Auswahl für Habits. Der Schlüssel wird beim Habit gespeichert. */
export const HABIT_ICONS = {
  water: { icon: Droplet, label: 'Wasser' },
  sport: { icon: HeartPulse, label: 'Sport' },
  sleep: { icon: Moon, label: 'Schlaf' },
  protein: { icon: Beef, label: 'Protein' },
  food: { icon: Salad, label: 'Ernährung' },
  fruit: { icon: Apple, label: 'Obst' },
  stretch: { icon: PersonStanding, label: 'Mobility' },
  strength: { icon: Dumbbell, label: 'Kraft' },
  steps: { icon: Footprints, label: 'Schritte' },
  bike: { icon: Bike, label: 'Rad' },
  swim: { icon: Waves, label: 'Schwimmen' },
  cold: { icon: Snowflake, label: 'Kälte' },
  sun: { icon: Sun, label: 'Draußen' },
  rest: { icon: Bed, label: 'Erholung' },
  mind: { icon: Brain, label: 'Meditation' },
  read: { icon: BookOpen, label: 'Lesen' },
  journal: { icon: NotebookPen, label: 'Tagebuch' },
  supplements: { icon: Pill, label: 'Supplements' },
  coffee: { icon: Coffee, label: 'Koffein' },
  screen: { icon: Smartphone, label: 'Bildschirmzeit' },
  no: { icon: Ban, label: 'Verzicht' },
  time: { icon: Timer, label: 'Zeit' },
  green: { icon: Leaf, label: 'Gesund' },
  activity: { icon: Activity, label: 'Aktivität' },
  check: { icon: CircleCheck, label: 'Allgemein' },
}

// Vorschlag nach Stichwort im Namen (Reihenfolge = Priorität)
const KEYWORDS = [
  [/wasser|trink|liter|\bl\b/i, 'water'],
  [/schlaf|schlief|geschlafen|bett/i, 'sleep'],
  [/protein|eiwei/i, 'protein'],
  [/mobil|dehn|stretch|yoga/i, 'stretch'],
  [/kraft|gym|hantel|liegest/i, 'strength'],
  [/schritt|spazier|geh/i, 'steps'],
  [/rad|bike|fahrrad/i, 'bike'],
  [/schwimm/i, 'swim'],
  [/lauf|jogg|run/i, 'steps'],
  [/sport|training|workout|bewegung/i, 'sport'],
  [/obst|frucht|apfel/i, 'fruit'],
  [/gemüse|essen|ernähr|kalorie|zucker|salat/i, 'food'],
  [/kalt|eisbad|dusch/i, 'cold'],
  [/sonne|draußen|frische luft|licht/i, 'sun'],
  [/medit|atem|achtsam/i, 'mind'],
  [/les|buch/i, 'read'],
  [/tagebuch|journal|notiz/i, 'journal'],
  [/vitamin|supplement|kreatin|magnes|pille/i, 'supplements'],
  [/kaffee|koffein/i, 'coffee'],
  [/handy|bildschirm|social|screen/i, 'screen'],
  [/kein|ohne|verzicht|alkohol|rauch/i, 'no'],
  [/pause|erhol|ruhe/i, 'rest'],
]

export function suggestIcon(name) {
  for (const [re, key] of KEYWORDS) if (re.test(name)) return key
  return 'check'
}

/** Icon-Schlüssel eines Habits – ältere Habits ohne gespeichertes Icon bekommen einen Vorschlag */
export const iconKeyOf = (habit) => (HABIT_ICONS[habit.icon] ? habit.icon : HABIT_ICONS[habit.id] ? habit.id : suggestIcon(habit.name))
