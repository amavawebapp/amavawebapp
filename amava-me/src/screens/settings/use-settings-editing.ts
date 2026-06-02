import { useState } from 'react'
import { useAuth } from '../../auth/auth-context'
import { useConfigData } from '../../hooks/use-config-data'
import { useOnlineStatus } from '../../hooks/use-online-status'

export function useSettingsEditing() {
  const { session } = useAuth()
  const { ref, refresh, hasAssessments } = useConfigData()
  const online = useOnlineStatus()
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const me = ref?.facilitators.find(f => f.id === session?.user.id)
  const isCoordinator = me?.role === 'coordinator'
  const run = async (p: Promise<void>) => {
    setError(null); setBusy(true)
    try { await p; await refresh() }
    catch (e) { setError(e instanceof Error ? e.message : 'Save failed. Please try again.') }
    finally { setBusy(false) }
  }
  return { ref, refresh, hasAssessments, online, isCoordinator, error, busy, run }
}
