import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'
import { DATA_KEY, LEGACY_KEY, PREFS_KEY } from './lib/storage'

const storedTitles = () =>
  (JSON.parse(localStorage.getItem(DATA_KEY) ?? '{"tasks":[]}').tasks as { title: string }[]).map((t) => t.title)

describe('App', () => {
  beforeEach(() => {
    localStorage.setItem(PREFS_KEY, JSON.stringify({ theme: 'light', sort: 'manual', notifications: false, onboarded: true }))
  })

  it('shows the empty state and adds a task from quick add, persisting the latest change', async () => {
    const user = userEvent.setup()
    render(<App />)
    expect(await screen.findByText('Nothing due today')).toBeInTheDocument()

    await user.click(screen.getByLabelText('Quick add a task'))
    await user.keyboard('Buy milk !high tomorrow')
    // live chips
    expect(await screen.findByText('High priority')).toBeInTheDocument()
    expect(screen.getByText('Tomorrow')).toBeInTheDocument()
    await user.keyboard('{Enter}')

    // Persisted immediately, including the very last change.
    await waitFor(() => expect(storedTitles()).toEqual(['Buy milk']))
  })

  it('loads tasks migrated from the original app format', async () => {
    localStorage.setItem(LEGACY_KEY, JSON.stringify([{ id: '1', todo: 'Legacy task', isCompleted: false }]))
    const user = userEvent.setup()
    render(<App />)
    await user.click(await screen.findByRole('button', { name: /^All tasks/ }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Edit Legacy task' })).toBeInTheDocument())
    const item = screen.getByRole('button', { name: 'Edit Legacy task' })
    expect(within(item.closest('li')!).getByRole('checkbox')).not.toBeChecked()
    expect(JSON.parse(localStorage.getItem(DATA_KEY)!).version).toBe(2)
  })
})
