import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { firebaseConfigured } from './env'

export interface AuthUser {
  uid: string
  email: string | null
}

export type AuthStatus = 'disabled' | 'loading' | 'guest' | 'signedIn'

interface AuthApi {
  status: AuthStatus
  user: AuthUser | null
  /** True when Firebase is configured, so account features can be offered. */
  available: boolean
  signIn: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  google: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  signOut: () => Promise<void>
}

const Ctx = createContext<AuthApi | null>(null)

export const SESSION_KEY = 'tasktango:session'

export function useAuth(): AuthApi {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAuth must be used inside <AuthProvider>')
  return v
}

/** Hint that a user was signed in last time, so we do not flash guest data before auth resolves. */
export function hadSession(): boolean {
  if (!firebaseConfigured) return false
  try {
    return !!localStorage.getItem(SESSION_KEY)
  } catch {
    return false
  }
}

const loadAuth = () => import('firebase/auth')
const fb = async () => (await import('./firebase')).getFirebase()

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [status, setStatus] = useState<AuthStatus>(firebaseConfigured ? 'loading' : 'disabled')

  useEffect(() => {
    if (!firebaseConfigured) return
    let off = () => {}
    let cancelled = false
    void (async () => {
      const [{ onAuthStateChanged }, { auth }] = await Promise.all([loadAuth(), fb()])
      if (cancelled) return
      off = onAuthStateChanged(auth, (u) => {
        try {
          if (u) localStorage.setItem(SESSION_KEY, u.uid)
          else localStorage.removeItem(SESSION_KEY)
        } catch {
          /* ignore */
        }
        setUser(u ? { uid: u.uid, email: u.email } : null)
        setStatus(u ? 'signedIn' : 'guest')
      })
    })()
    return () => {
      cancelled = true
      off()
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const [{ signInWithEmailAndPassword }, { auth }] = await Promise.all([loadAuth(), fb()])
    await signInWithEmailAndPassword(auth, email.trim(), password)
  }, [])
  const register = useCallback(async (email: string, password: string) => {
    const [{ createUserWithEmailAndPassword }, { auth }] = await Promise.all([loadAuth(), fb()])
    await createUserWithEmailAndPassword(auth, email.trim(), password)
  }, [])
  const google = useCallback(async () => {
    const [{ GoogleAuthProvider, signInWithPopup }, { auth }] = await Promise.all([loadAuth(), fb()])
    await signInWithPopup(auth, new GoogleAuthProvider())
  }, [])
  const resetPassword = useCallback(async (email: string) => {
    const [{ sendPasswordResetEmail }, { auth }] = await Promise.all([loadAuth(), fb()])
    await sendPasswordResetEmail(auth, email.trim())
  }, [])
  const signOut = useCallback(async () => {
    const [{ signOut: out }, { auth }] = await Promise.all([loadAuth(), fb()])
    await out(auth)
  }, [])

  const value = useMemo<AuthApi>(
    () => ({ status, user, available: firebaseConfigured, signIn, register, google, resetPassword, signOut }),
    [status, user, signIn, register, google, resetPassword, signOut],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
