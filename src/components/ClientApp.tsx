'use client'

import { useSyncExternalStore } from 'react'
import App from '../App'
import { Skeleton } from './Skeleton'

const subscribe = () => () => {}

/**
 * The app reads localStorage, the clock and media queries, so it only renders in the
 * browser. The server (and first hydration pass) render the skeleton, which avoids mismatches.
 */
export function ClientApp() {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false)
  return mounted ? <App /> : <Skeleton />
}
