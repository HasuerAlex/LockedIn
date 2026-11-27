import { useEffect, useRef, useState } from 'react'
import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth, GoogleAuthProvider, signInWithCredential, onAuthStateChanged, signInWithPopup, signInWithRedirect, signOut } from 'firebase/auth'
import { clearIndexedDbPersistence, connectFirestoreEmulator, doc, terminate, initializeFirestore, onSnapshot, persistentLocalCache, persistentMultipleTabManager, serverTimestamp, setDoc } from 'firebase/firestore'
import { firebaseConfig } from './firebase-config'

/*
 * Synchronisierung über Firebase.
 * Datenmodell: users/{uid}/data/{key} = { value, updatedAt }  (key: goal, plans, habits, habitLog)
 * – Ohne Anmeldung ist alles leer und wird nicht gespeichert.
 * – Angemeldet kommt alles aus der Cloud; Firestore puffert offline gemachte Änderungen
 *   in seinem Gerätespeicher und lädt sie hoch, sobald wieder Netz da ist.
 */

// Nur für lokale Tests: VITE_FIREBASE_EMULATOR=1 verbindet mit dem Firebase-Emulator statt mit der echten Cloud.
const useEmulator = import.meta.env.VITE_FIREBASE_EMULATOR === '1'
const config = useEmulator ? { apiKey: 'demo-key', authDomain: 'localhost', projectId: 'demo-athlete' } : firebaseConfig

export const syncAvailable = Boolean(config)

let auth = null
let db = null
if (syncAvailable) {
  const app = initializeApp(config)
  auth = getAuth(app)
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  })
  if (useEmulator) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
    connectFirestoreEmulator(db, '127.0.0.1', 8080)
    // Test-Login ohne Google-Pop-up (der Emulator akzeptiert ein unsigniertes Google-Token)
    window.__uid = () => auth.currentUser?.uid
    window.__testSignIn = (email) =>
      signInWithCredential(auth, GoogleAuthProvider.credential(JSON.stringify({ sub: email, email, email_verified: true })))
  }
}

export function useAuth() {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(!syncAvailable)
  useEffect(() => {
    if (!auth) return
    return onAuthStateChanged(auth, (u) => {
      setUser(u)
      setReady(true)
    })
  }, [])
  return { user, ready }
}

export async function signIn() {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  try {
    await signInWithPopup(auth, provider)
  } catch (e) {
    // Manche Browser (v. a. am Handy) blockieren Pop-ups → Weiterleitung stattdessen
    if (e?.code === 'auth/popup-blocked' || e?.code === 'auth/operation-not-supported-in-this-environment') {
      await signInWithRedirect(auth, provider)
    } else if (e?.code !== 'auth/popup-closed-by-user' && e?.code !== 'auth/cancelled-popup-request') {
      throw e
    }
  }
}

/** Abmelden und alle Daten dieses Kontos vom Gerät entfernen (Firestore-Offline-Cache). */
export async function signOutUser() {
  await signOut(auth)
  try {
    await terminate(db)
    await clearIndexedDbPersistence(db)
  } finally {
    location.reload()
  }
}

// Frühere Versionen haben alles im Browser-Speicher abgelegt – diese Reste werden entfernt.
try {
  for (const k of ['goal', 'plans', 'habits', 'habitLog']) localStorage.removeItem(`athlete-dashboard:${k}`)
} catch {
  /* Speicher nicht verfügbar */
}

const init = (v) => (typeof v === 'function' ? v() : v)

/**
 * Zustand, der nur in der Cloud gespeichert wird.
 * – Nicht angemeldet: leerer Startwert, nichts wird gespeichert.
 * – Angemeldet: Stand aus Firestore (offline aus dessen Cache); jede Änderung wird hochgeladen.
 */
export function useSyncedState(key, emptyValue, user, onError) {
  const [value, setValue] = useState(() => init(emptyValue))
  const valueRef = useRef(value)
  const connected = useRef(false) // erster Stand aus der Cloud empfangen?
  const remoteValue = useRef(value) // zuletzt aus der Cloud übernommener Wert → nicht zurückschreiben
  const uid = user?.uid

  useEffect(() => {
    connected.current = false
    // Kontowechsel / Abmelden: wieder leer starten
    const empty = init(emptyValue)
    remoteValue.current = empty
    setValue(empty)
    if (!db || !uid) return
    const ref = doc(db, 'users', uid, 'data', key)
    return onSnapshot(
      ref,
      // Metadaten-Änderungen nötig, sonst kommt die Server-Bestätigung „Dokument existiert nicht“ nie an
      { includeMetadataChanges: true },
      (snap) => {
        if (snap.metadata.hasPendingWrites) return // eigenes Echo
        if (!snap.exists()) {
          // Neues Konto: erst nach echter Server-Antwort als verbunden gelten,
          // damit ein leerer Offline-Cache nie vorhandene Cloud-Daten überschreibt.
          if (snap.metadata.fromCache || connected.current) return
          connected.current = true
          // Was schon vor der Server-Antwort eingegeben wurde, jetzt hochladen
          if (valueRef.current !== remoteValue.current) {
            setDoc(ref, { value: valueRef.current, updatedAt: serverTimestamp() }).catch(onError)
          }
          return
        }
        connected.current = true
        const remote = snap.data().value
        if (JSON.stringify(remote) !== JSON.stringify(valueRef.current)) {
          remoteValue.current = remote
          setValue(remote)
        }
      },
      onError,
    )
    // emptyValue ist absichtlich nicht in den Abhängigkeiten (wäre bei jedem Render neu)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, key, onError])

  useEffect(() => {
    valueRef.current = value
    if (value === remoteValue.current) return
    if (!db || !uid || !connected.current) return
    setDoc(doc(db, 'users', uid, 'data', key), { value, updatedAt: serverTimestamp() }).catch(onError)
  }, [value, uid, key, onError])

  return [value, setValue]
}
