import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { DexieLocalStore } from './data/local-store'
import { SyncEngine } from './data/sync-engine'
import { SupabaseSyncClient } from './data/supabase-sync-client'
import { supabase } from './lib/supabase'
import { useAuth } from './auth/auth-context'

interface AppServices { store: DexieLocalStore; engine: SyncEngine }
const Ctx = createContext<AppServices | null>(null)

export function AppServicesProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const value = useMemo<AppServices | null>(() => {
    if (!session) return null
    const store = new DexieLocalStore()
    const client = new SupabaseSyncClient(supabase)
    return { store, engine: new SyncEngine(store, client) }
  }, [session])
  if (!value) return <>{children}</>
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAppServices(): AppServices {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('AppServices unavailable (not signed in)')
  return ctx
}
