import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react'
import { useIsDesktop } from './hooks'
import type { View } from './types'

/** The id of the task open in the editor, if any. */
export type EditTarget = string | null

interface Ui {
  view: View
  setView: (v: View) => void
  query: string
  setQuery: (q: string) => void
  editing: EditTarget
  openEdit: (t: EditTarget) => void
  composerOpen: boolean
  setComposerOpen: (b: boolean) => void
  helpOpen: boolean
  setHelpOpen: (b: boolean) => void
  settingsOpen: boolean
  setSettingsOpen: (b: boolean) => void
  authOpen: boolean
  setAuthOpen: (b: boolean) => void
  listDialogOpen: boolean
  setListDialogOpen: (b: boolean) => void
  quickAddRef: RefObject<HTMLInputElement | null>
  searchRef: RefObject<HTMLInputElement | null>
  focusQuickAdd: () => void
  anyDialogOpen: boolean
}

const Ctx = createContext<Ui | null>(null)

export function useUi(): Ui {
  const v = useContext(Ctx)
  if (!v) throw new Error('useUi must be used inside <UiProvider>')
  return v
}

export function UiProvider({ children }: { children: ReactNode }) {
  const [view, setViewState] = useState<View>({ kind: 'today' })
  const [query, setQuery] = useState('')
  const [editing, openEdit] = useState<EditTarget>(null)
  const [composerOpen, setComposerOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [listDialogOpen, setListDialogOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const quickAddRef = useRef<HTMLInputElement | null>(null)
  const searchRef = useRef<HTMLInputElement | null>(null)
  const desktop = useIsDesktop()

  const setView = useCallback((v: View) => {
    setViewState(v)
    setQuery('')
    window.scrollTo({ top: 0 })
  }, [])

  const focusQuickAdd = useCallback(() => {
    if (desktop) quickAddRef.current?.focus()
    else setComposerOpen(true)
  }, [desktop])

  const value = useMemo<Ui>(
    () => ({
      view,
      setView,
      query,
      setQuery,
      editing,
      openEdit,
      composerOpen,
      setComposerOpen,
      helpOpen,
      setHelpOpen,
      settingsOpen,
      setSettingsOpen,
      authOpen,
      setAuthOpen,
      listDialogOpen,
      setListDialogOpen,
      quickAddRef,
      searchRef,
      focusQuickAdd,
      anyDialogOpen: editing !== null || composerOpen || helpOpen || settingsOpen || listDialogOpen || authOpen,
    }),
    [view, setView, query, editing, composerOpen, helpOpen, settingsOpen, listDialogOpen, authOpen, focusQuickAdd],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
