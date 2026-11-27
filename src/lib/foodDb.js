/*
 * Lebensmittel-Datenbank für die Suche im Ess-Tracker.
 * Quelle: public/foods-de.json, erzeugt aus @thereforejs/foods (Bundeslebensmittelschlüssel 4.0 u. a., CC BY 4.0).
 * Die Datei (~100 KB komprimiert) wird erst geladen, wenn die Suche geöffnet wird.
 */

let cache = null

export function loadFoodDb() {
  if (!cache) {
    cache = fetch('foods-de.json')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(({ attribution, foods }) => ({
        attribution,
        foods: foods.map(([name, kcal, protein, carbs, fat]) => ({
          name,
          kcal,
          protein,
          carbs,
          fat,
          key: normalize(name),
          words: normalize(name, true).split(/[\s,/()-]+/).filter(Boolean),
        })),
      }))
      .catch((e) => {
        cache = null // beim nächsten Öffnen erneut versuchen
        throw e
      })
  }
  return cache
}

/** Kleinbuchstaben, ohne Leerzeichen (der BLS schreibt oft getrennt: „Hafer Flocken“) */
function normalize(text, keepSpaces = false) {
  const t = text.toLowerCase().replace(/ß/g, 'ss')
  return keepSpaces ? t : t.replace(/[\s-]+/g, '')
}

// Alltagswörter (auch österreichisch) → Begriffe im BLS
const SYNONYMS = {
  ei: ['hühnerei', 'eier'],
  eier: ['hühnerei'],
  nudeln: ['teigwaren'],
  pasta: ['teigwaren'],
  brokkoli: ['broccoli'],
  quark: ['speisequark', 'quark'],
  topfen: ['speisequark', 'magerquark'],
  paradeiser: ['tomate'],
  paradeis: ['tomate'],
  erdäpfel: ['kartoffel'],
  erdapfel: ['kartoffel'],
  kartoffeln: ['kartoffel'],
  hendl: ['hähnchen'],
  huhn: ['hähnchen', 'huhn'],
  faschiertes: ['hackfleisch'],
  marille: ['aprikose'],
  marillen: ['aprikose'],
  karfiol: ['blumenkohl'],
  obers: ['sahne'],
  schlagobers: ['schlagsahne'],
  semmel: ['brötchen'],
  kren: ['meerrettich'],
  fisolen: ['bohnen'],
  kohlsprossen: ['rosenkohl'],
  melanzani: ['aubergine'],
  zwetschken: ['zwetschge', 'pflaume'],
  ribisel: ['johannisbeere'],
  germ: ['hefe'],
  porridge: ['haferflocken', 'haferbrei'],
  oatmeal: ['haferflocken'],
  müsliriegel: ['müsliriegel', 'müsli-riegel'],
  iso: ['isotonisch'],
  sportgetränk: ['isotonisch'],
}

const alternatives = (token) => {
  const t = normalize(token)
  const syn = (SYNONYMS[t] ?? []).map((s) => normalize(s))
  // Sehr kurze Wörter („ei“, „iso“) nur über ihre Synonyme suchen – sonst passt „iso“ auch auf „Risotto“
  if (syn.length && t.length <= 3) return syn
  return [t, ...syn.filter((x) => x !== t)]
}

/** Suche: jedes Wort der Anfrage muss vorkommen; Treffer am Anfang und kurze Namen zuerst */
export function searchFoods(db, query, limit = 40) {
  const tokens = query.trim().split(/\s+/).filter((t) => t.length >= 2)
  if (!tokens.length) return []
  const alts = tokens.map(alternatives)
  const results = []
  for (const food of db.foods) {
    let score = 0
    let ok = true
    for (let i = 0; i < alts.length; i++) {
      let best = -1
      for (const a of alts[i]) {
        if (!food.key.includes(a)) continue
        // genauer Name > erstes Wort > ganzes Wort > Namensanfang > Wortanfang > irgendwo drin
        const after = food.key[a.length]
        const s =
          food.key.startsWith(a) && (after === undefined || !/[a-zäöü]/.test(after))
            ? 6
            : food.words[0] === a
              ? 5
              : food.words.includes(a)
                ? 4
                : food.key.startsWith(a)
                  ? 3
                  : food.words.some((w) => w.startsWith(a))
                    ? 2
                    : 1
        if (s > best) best = s
      }
      if (best < 0) {
        ok = false
        break
      }
      score += best * (i === 0 ? 40 : 15)
    }
    if (!ok) continue
    score -= food.name.length * 0.6
    if (/beikost|säugling/i.test(food.name)) score -= 60
    if (/\b(roh|natur|gekocht)\b/.test(food.name)) score += 4
    // Weiterverarbeitetes nur oben, wenn danach gesucht wird
    const processed = food.name.match(/\b(mehl|grieß|kleie|pulver|sirup|stärke|grütze)\b/i)
    if (processed && !query.toLowerCase().includes(processed[1].toLowerCase())) score -= 25
    results.push([score, food])
  }
  results.sort((a, b) => b[0] - a[0])
  return results.slice(0, limit).map((r) => r[1])
}

/** Nährwerte für eine Menge in Gramm */
export const portion = (per100, grams) => ({
  kcal: Math.round((per100.kcal * grams) / 100),
  protein: Math.round((per100.protein * grams) / 10) / 10,
  carbs: Math.round((per100.carbs * grams) / 10) / 10,
  fat: Math.round((per100.fat * grams) / 10) / 10,
})
