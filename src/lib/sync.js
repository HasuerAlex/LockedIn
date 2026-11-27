import { useEffect, useRef, useState } from 'react'
import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth, GoogleAuthProvider, signInWithCredential, onAuthStateChanged, signInWithPopup, signInWithRedirect, signOut } from 'firebase/auth'
import { connectFirestoreEmulator, doc, initializeFirestore, onSnapshot, persistentLocalCache, persistentMultipleTabManager, serverTimestamp, setDoc } from 'firebase/firestore'
import { firebaseConfig } from './firebase-config'
import { useLocalStorage } from './utils'

/*
 * Synchronisierung über Firebase.
 * Datenmodell: users/{uid}/data/{key} = { value, updatedAt }  (key: goal, plans, habits, habitLog)
 * – Der Browser-Speicher bleibt der schnelle lokale Stand (sofort beim Öffnen da).
 * – Ist man angemeldet, gewinnt der Stand in der Cloud; jede Änderung wird hochgeladen.
 * – Firestore puffert offline gemachte Änderungen und lädt sie hoch, sobald wieder Netz da ist.
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

export const signOutUser = () => signOut(auth)

/** Wie useLocalStorage, aber zusätzlich mit der Cloud synchronisiert, solange `user` angemeldet ist. */
export function useSyncedState(key, initialValue, user, onError) {
  const [value, setValue] = useLocalStorage(key, initialValue)
  const valueRef = useRef(value)
  const connected = useRef(false) // erster Server-Stand empfangen?
  const fromRemote = useRef(false) // aktuelle Änderung kam aus der Cloud → nicht zurückschreiben
  const uid = user?.uid

  useEffect(() => {
    connected.current = false
    if (!db || !uid) return
    const ref = doc(db, 'users', uid, 'data', key)
    return onSnapshot(
      ref,
      { includeMetadataChanges: false },
      (snap) => {
        if (snap.metadata.hasPendingWrites) return // eigenes Echo
        if (!snap.exists()) {
          // Noch nichts in der Cloud: lokalen Stand hochladen – aber nur mit echter Server-Antwort,
          // damit ein leerer Offline-Cache nie vorhandene Cloud-Daten überschreibt.
          if (snap.metadata.fromCache) return
          connected.current = true
          setDoc(ref, { value: valueRef.current, updatedAt: serverTimestamp() }).catch(onError)
          return
        }
        connected.current = true
        const remote = snap.data().value
        if (JSON.stringify(remote) !== JSON.stringify(valueRef.current)) {
          fromRemote.current = true
          setValue(remote)
        }
      },
      onError,
    )
  }, [uid, key, setValue, onError])

  useEffect(() => {
    valueRef.current = value
    if (fromRemote.current) {
      fromRemote.current = false
      return
    }
    if (!db || !uid || !connected.current) return
    setDoc(doc(db, 'users', uid, 'data', key), { value, updatedAt: serverTimestamp() }).catch(onError)
  }, [value, uid, key, onError])

  return [value, setValue]
}
