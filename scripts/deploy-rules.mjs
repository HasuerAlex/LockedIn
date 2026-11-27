/*
 * Veröffentlicht firestore.rules über das Firebase Admin SDK (Secret FIREBASE_SERVICE_ACCOUNT).
 * Ersetzt `firebase deploy --only firestore:rules`, das zusätzliche Projekt-Berechtigungen bräuchte.
 */
import { readFileSync } from 'node:fs'
import { cert, initializeApp } from 'firebase-admin/app'
import { getSecurityRules } from 'firebase-admin/security-rules'

initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) })
const source = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8')
const ruleset = await getSecurityRules().releaseFirestoreRulesetFromSource(source)
console.log(`Firestore-Regeln veröffentlicht: ${ruleset.name}`)
