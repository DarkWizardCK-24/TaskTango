// NEXT_PUBLIC_* values must be referenced literally so Next can inline them.
export const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}
export const databaseId = process.env.NEXT_PUBLIC_FIRESTORE_DATABASE_ID || '(default)'
export const useEmulator = process.env.NEXT_PUBLIC_USE_EMULATOR === 'true'

export const firebaseConfigured = Boolean(config.apiKey && config.projectId && config.appId)

