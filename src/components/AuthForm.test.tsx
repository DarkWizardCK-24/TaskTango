import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { friendlyAuthError, passwordStrength, validateAuthForm } from '../lib/authForm'
import { AuthForm } from './AuthForm'

describe('auth form validation', () => {
  it('validates email and password for sign-in', () => {
    expect(validateAuthForm('signin', '', '')).toEqual({ email: 'Enter your email address.', password: 'Enter your password.' })
    expect(validateAuthForm('signin', 'nope', 'x').email).toMatch(/does not look right/)
    expect(validateAuthForm('signin', 'a@b.co', 'x')).toEqual({})
  })

  it('requires 10+ characters to register', () => {
    expect(validateAuthForm('register', 'a@b.co', 'short').password).toMatch(/at least 10/)
    expect(validateAuthForm('register', 'a@b.co', '0123456789')).toEqual({})
  })

  it('scores password strength and maps firebase errors', () => {
    expect(passwordStrength('').score).toBe(0)
    expect(passwordStrength('abc').label).toBe('Too short')
    expect(passwordStrength('correct horse battery 42!').score).toBeGreaterThanOrEqual(3)
    expect(friendlyAuthError('auth/invalid-credential')).toMatch(/incorrect/)
    expect(friendlyAuthError('auth/operation-not-allowed')).toMatch(/not available yet/)
    expect(friendlyAuthError(undefined)).toMatch(/Something went wrong/)
  })
})

function setup(mode: 'signin' | 'register') {
  const props = { onSubmit: vi.fn(), onGoogle: vi.fn(), onForgot: vi.fn(), onModeChange: vi.fn() }
  render(<AuthForm mode={mode} {...props} />)
  return props
}

describe('<AuthForm />', () => {
  it('shows messages and does not submit invalid input', async () => {
    const user = userEvent.setup()
    const p = setup('register')
    await user.type(screen.getByLabelText('Email'), 'me@example.com')
    await user.type(screen.getByLabelText('Password'), 'tooshort')
    await user.click(screen.getByRole('button', { name: 'Create account', hidden: false }))
    expect(await screen.findByText('Use at least 10 characters.')).toBeInTheDocument()
    expect(p.onSubmit).not.toHaveBeenCalled()
  })

  it('submits a valid registration and offers Google and password reset', async () => {
    const user = userEvent.setup()
    const p = setup('register')
    await user.type(screen.getByLabelText('Email'), 'me@example.com')
    await user.type(screen.getByLabelText('Password'), 'a-long-enough-password')
    await user.click(screen.getAllByRole('button', { name: 'Create account' }).find((b) => b.getAttribute('type') === 'submit')!)
    expect(p.onSubmit).toHaveBeenCalledWith('me@example.com', 'a-long-enough-password')
    await user.click(screen.getByRole('button', { name: 'Continue with Google' }))
    expect(p.onGoogle).toHaveBeenCalled()
  })

  it('sign-in mode has a forgot password action', async () => {
    const user = userEvent.setup()
    const p = setup('signin')
    await user.type(screen.getByLabelText('Email'), 'me@example.com')
    await user.click(screen.getByRole('button', { name: 'Forgot password?' }))
    expect(p.onForgot).toHaveBeenCalledWith('me@example.com')
  })
})
