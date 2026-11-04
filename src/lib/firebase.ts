import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app'
import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth'
import {
  connectFirestoreEmulator,
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore'

import { config, databaseId, firebaseConfigured, useEmulator } from './env'

export { firebaseConfigured }

export interface Fb {
  app: FirebaseApp
  auth: Auth
  db: Firestore
}

let cached: Fb | null = null

/** Root of every TaskTango document. Nothing outside this path is ever read or written. */
export const ROOT = ['apps', 'tasktango'] as const

export function getFirebase(): Fb {
  if (cached) return cached
  const app = getApps().length ? getApp() : initializeApp(config)
  const auth = getAuth(app)
  let db: Firestore
  try {
    db = initializeFirestore(
      app,
      { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) },
      databaseId,
    )
  } catch {
    db = getFirestore(app, databaseId)
  }
  if (useEmulator) {
    try {
      connectAuthEmulator(auth, 'http://127.0.0.1:9199', { disableWarnings: true })
      connectFirestoreEmulator(db, '127.0.0.1', 8180)
    } catch {
      /* already connected */
    }
  }
  cached = { app, auth, db }
  return cached
}
