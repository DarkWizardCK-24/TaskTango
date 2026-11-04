export type AuthMode = 'signin' | 'register'

export const MIN_REGISTER_PASSWORD = 10

export interface AuthErrors {
  email?: string
  password?: string
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function validateAuthForm(mode: AuthMode, email: string, password: string): AuthErrors {
  const errors: AuthErrors = {}
  if (!email.trim()) errors.email = 'Enter your email address.'
  else if (!EMAIL.test(email.trim())) errors.email = 'That email address does not look right.'
  if (!password) errors.password = 'Enter your password.'
  else if (mode === 'register' && password.length < MIN_REGISTER_PASSWORD) {
    errors.password = `Use at least ${MIN_REGISTER_PASSWORD} characters.`
  }
  return errors
}

export interface Strength {
  score: 0 | 1 | 2 | 3 | 4
  label: string
}

/** A gentle nudge, not a policy: length first, then variety. */
export function passwordStrength(pw: string): Strength {
  if (!pw) return { score: 0, label: '' }
  let score = 0
  if (pw.length >= MIN_REGISTER_PASSWORD) score++
  if (pw.length >= 14) score++
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++
  if (pw.length < MIN_REGISTER_PASSWORD) score = Math.min(score, 1)
  const s = Math.min(4, Math.max(pw.length < 6 ? 0 : 1, score)) as Strength['score']
  return { score: s, label: ['Too short', 'Weak', 'Okay', 'Good', 'Strong'][s] }
}

/** Maps Firebase auth error codes to friendly sentences. */
export function friendlyAuthError(code: string | undefined): string {
  switch (code) {
    case 'auth/invalid-email':
      return 'That email address does not look right.'
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
      return 'Email or password is incorrect.'
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Try signing in instead.'
    case 'auth/weak-password':
      return 'Please choose a stronger password.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a moment and try again.'
    case 'auth/network-request-failed':
      return 'You appear to be offline. Check your connection and try again.'
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Sign-in was cancelled.'
    case 'auth/operation-not-allowed':
    case 'auth/unauthorized-domain':
    case 'auth/popup-blocked':
      return 'This sign-in method is not available yet. Please use email and password.'
    case 'auth/user-disabled':
      return 'This account has been disabled.'
    default:
      return 'Something went wrong. Please try again.'
  }
}
