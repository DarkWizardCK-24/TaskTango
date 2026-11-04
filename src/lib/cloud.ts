import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  writeBatch,
  type DocumentData,
  type Unsubscribe,
  type WriteBatch,
} from 'firebase/firestore'
import { ROOT, getFirebase } from './firebase'
import {
  diffMeta,
  diffTasks,
  mergeRemote,
  metaFromDoc,
  metaSig,
  tasksSig,
  type MetaState,
  type SyncedEntry,
  type SyncedMap,
} from './sync'
import type { Task, TaskList } from './types'

export type SyncStatus = 'syncing' | 'synced' | 'offline' | 'error'

export interface CloudHandlers {
  getTasks: () => Task[]
  getMeta: () => MetaState
  applyTasks: (tasks: Task[]) => void
  applyMeta: (lists: TaskList[], sort: MetaState['sort']) => void
  onStatus: (s: SyncStatus) => void
  onError: (message: string) => void
}

export interface CloudSync {
  /** Call whenever local tasks, lists or sort changed. Writes are debounced. */
  notify: () => void
  stop: () => void
}

const DEBOUNCE_MS = 500
const BATCH_LIMIT = 400

const userPath = (uid: string) => [...ROOT, 'users', uid] as const

export function startCloudSync(uid: string, h: CloudHandlers): CloudSync {
  const { db } = getFirebase()
  const tasksCol = collection(db, ...userPath(uid), 'tasks') // apps/tasktango/users/{uid}/tasks
  const metaRef = doc(db, ...userPath(uid), 'meta', 'state') // apps/tasktango/users/{uid}/meta/state

  const synced: SyncedMap = new Map()
  let syncedMeta: string | null = null
  let tasksReady = false
  let metaReady = false
  let inflight = 0
  let pendingWrites = false
  let failed = false
  let stopped = false
  let timer: ReturnType<typeof setTimeout> | undefined
  let retryMs = 3000

  const dirty = () => {
    const plan = diffTasks(h.getTasks(), synced, 0)
    return plan.upserts.length > 0 || plan.deletes.length > 0 || diffMeta(h.getMeta(), syncedMeta) !== null
  }

  const emit = () => {
    if (stopped) return
    if (typeof navigator !== 'undefined' && !navigator.onLine) return h.onStatus('offline')
    if (failed) return h.onStatus('error')
    if (!tasksReady || !metaReady || inflight > 0 || pendingWrites || dirty()) return h.onStatus('syncing')
    h.onStatus('synced')
  }

  const schedule = (ms = DEBOUNCE_MS) => {
    if (stopped) return
    clearTimeout(timer)
    timer = setTimeout(flush, ms)
  }

  function flush() {
    if (stopped || !tasksReady || !metaReady) return
    const plan = diffTasks(h.getTasks(), synced, Date.now())
    const metaWrite = diffMeta(h.getMeta(), syncedMeta)
    if (plan.upserts.length === 0 && plan.deletes.length === 0 && !metaWrite) return emit()

    const previous = new Map<string, SyncedEntry | undefined>()
    const prevMeta = syncedMeta
    const batches: WriteBatch[] = []
    let batch = writeBatch(db)
    let count = 0
    const bump = () => {
      if (++count >= BATCH_LIMIT) {
        batches.push(batch)
        batch = writeBatch(db)
        count = 0
      }
    }
    // Local bookkeeping is optimistic: the SDK queues the writes (also while offline).
    for (const u of plan.upserts) {
      previous.set(u.id, synced.get(u.id))
      synced.set(u.id, { sig: u.sig, order: u.doc.order, updatedAt: u.doc.updatedAt })
      batch.set(doc(tasksCol, u.id), u.doc as unknown as DocumentData)
      bump()
    }
    for (const id of plan.deletes) {
      previous.set(id, synced.get(id))
      synced.delete(id)
      batch.delete(doc(tasksCol, id))
      bump()
    }
    if (metaWrite) {
      syncedMeta = metaSig(h.getMeta())
      batch.set(metaRef, { ...metaWrite, updatedAt: Date.now() })
      bump()
    }
    if (count > 0) batches.push(batch)

    inflight += batches.length
    failed = false
    emit()
    for (const b of batches) {
      b.commit()
        .then(() => {
          inflight--
          retryMs = 3000
          emit()
        })
        .catch((err: unknown) => {
          inflight--
          failed = true
          // Forget the optimistic bookkeeping so the next flush retries these writes.
          for (const [id, prev] of previous) {
            if (prev) synced.set(id, prev)
            else synced.delete(id)
          }
          syncedMeta = prevMeta
          const code = (err as { code?: string }).code ?? ''
          h.onError(
            code === 'permission-denied'
              ? 'Cloud sync was refused. Check you are signed in.'
              : 'Could not sync your changes. Retrying shortly.',
          )
          emit()
          schedule(retryMs)
          retryMs = Math.min(retryMs * 2, 30_000)
        })
    }
  }

  const unsubs: Unsubscribe[] = []
  unsubs.push(
    onSnapshot(
      tasksCol,
      { includeMetadataChanges: true },
      (snap) => {
        const remote = snap.docs.map((d) => ({ id: d.id, data: d.data() as Record<string, unknown> }))
        const res = mergeRemote(h.getTasks(), synced, remote)
        synced.clear()
        res.synced.forEach((v, k) => synced.set(k, v))
        tasksReady = true
        pendingWrites = snap.metadata.hasPendingWrites
        failed = false
        if (tasksSig(res.tasks) !== tasksSig(h.getTasks())) h.applyTasks(res.tasks)
        if (dirty()) schedule()
        emit()
      },
      () => {
        failed = true
        h.onError('Could not load your tasks from the cloud.')
        emit()
      },
    ),
  )
  unsubs.push(
    onSnapshot(
      metaRef,
      (snap) => {
        const local = h.getMeta()
        const wasDirty = metaSig(local) !== syncedMeta
        if (snap.exists()) {
          const remote = metaFromDoc(snap.data() as Record<string, unknown>)
          const remoteSig = metaSig(remote)
          if (!wasDirty && remoteSig !== metaSig(local)) h.applyMeta(remote.lists, remote.sort)
          syncedMeta = remoteSig
        } else {
          syncedMeta = null
        }
        metaReady = true
        if (dirty()) schedule()
        emit()
      },
      () => {
        failed = true
        emit()
      },
    ),
  )

  const onNet = () => {
    emit()
    if (navigator.onLine) schedule(200)
  }
  window.addEventListener('online', onNet)
  window.addEventListener('offline', onNet)
  emit()

  return {
    notify: () => schedule(),
    stop: () => {
      stopped = true
      clearTimeout(timer)
      unsubs.forEach((u) => u())
      window.removeEventListener('online', onNet)
      window.removeEventListener('offline', onNet)
    },
  }
}

/** Permanently deletes every task and the meta document of this user (nothing else). */
export async function deleteAllCloudData(uid: string): Promise<number> {
  const { db } = getFirebase()
  const snap = await getDocs(collection(db, ...userPath(uid), 'tasks'))
  let n = 0
  for (let i = 0; i < snap.docs.length; i += BATCH_LIMIT) {
    const b = writeBatch(db)
    snap.docs.slice(i, i + BATCH_LIMIT).forEach((d) => {
      b.delete(d.ref)
      n++
    })
    await b.commit()
  }
  const b = writeBatch(db)
  b.delete(doc(db, ...userPath(uid), 'meta', 'state'))
  await b.commit()
  return n
}
