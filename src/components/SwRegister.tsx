'use client'

import { useEffect } from 'react'

/** Registers the offline app-shell service worker, in production only. */
export function SwRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* offline support is optional */
    })
  }, [])
  return null
}
