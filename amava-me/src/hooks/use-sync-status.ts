import { useCallback, useEffect, useState } from 'react'
import type { LocalStore } from '../data/datastore'
import type { SyncEngine } from '../data/sync-engine'
import { useOnlineStatus } from './use-online-status'

export function useSyncStatus(store: LocalStore, engine: SyncEngine) {
  const online = useOnlineStatus()
  const [pendingCount, setPendingCount] = useState(0)

  const refresh = useCallback(async () => {
    setPendingCount((await store.getPendingAssessments()).length)
  }, [store])

  const sync = useCallback(async () => {
    if (!online) return
    await engine.push()
    await refresh()
  }, [online, engine, refresh])

  useEffect(() => { refresh() }, [refresh])
  useEffect(() => { if (online) sync() }, [online, sync])

  return { online, pendingCount, refresh, sync }
}
