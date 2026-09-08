import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { bridge } from "../lib/bridge"
import type { ComputeBackend, SessionUser } from "../lib/types"

interface SessionState {
  user: SessionUser | null
  backends: ComputeBackend[]
  activeBackendId: string
  setActiveBackendId: (id: string) => void
  unlock: (passphrase: string) => Promise<void>
  lock: () => Promise<void>
  refreshBackends: () => Promise<void>
}

const SessionContext = createContext<SessionState | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [backends, setBackends] = useState<ComputeBackend[]>([])
  const [activeBackendId, setActiveBackendId] = useState<string>("")

  useEffect(() => {
    bridge.currentUser().then(setUser)
    bridge.backends().then((b) => {
      setBackends(b)
      const firstOnline = b.find((x) => x.status === "en-ligne") ?? b[0]
      if (firstOnline) setActiveBackendId(firstOnline.id)
    })
  }, [])

  const value = useMemo<SessionState>(
    () => ({
      user,
      backends,
      activeBackendId,
      setActiveBackendId,
      unlock: async (passphrase) => setUser(await bridge.unlockVault(passphrase)),
      lock: async () => setUser(await bridge.lockVault()),
      refreshBackends: async () => setBackends(await bridge.backends()),
    }),
    [user, backends, activeBackendId],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession(): SessionState {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error("useSession doit être utilisé dans un SessionProvider")
  return ctx
}
