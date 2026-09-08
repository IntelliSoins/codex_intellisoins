import { useEffect, useState } from "react"
import { Sidebar } from "./components/Sidebar"
import { Topbar } from "./components/Topbar"
import { LockScreen } from "./components/LockScreen"
import { useSession } from "./state/session"
import { NAV, VIEW_TITLES, type ViewKey } from "./nav"
import { bridge } from "./lib/bridge"
import { DashboardView } from "./views/DashboardView"
import { AssistantView } from "./views/AssistantView"
import { WebSearchView } from "./views/WebSearchView"
import { CalendarView } from "./views/CalendarView"
import { DatabaseView } from "./views/DatabaseView"
import { ConnectorsView } from "./views/ConnectorsView"
import { McpView } from "./views/McpView"
import { BackendsView } from "./views/BackendsView"
import { SecurityView } from "./views/SecurityView"

export function App() {
  const { user } = useSession()
  const [view, setView] = useState<ViewKey>("dashboard")
  const [alerts, setAlerts] = useState(0)

  useEffect(() => {
    if (user?.vaultUnlocked) bridge.dashboard().then((d) => setAlerts(d.securityAlerts))
  }, [user?.vaultUnlocked])

  if (!user) {
    return <div className="lock">Chargement…</div>
  }
  if (!user.vaultUnlocked) {
    return <LockScreen />
  }

  // Garde-fou de rôle : un salarié ne peut pas ouvrir une vue réservée.
  const allowed = NAV.find((n) => n.key === view)?.roles.includes(user.role) ?? false
  const current: ViewKey = allowed ? view : "dashboard"
  const meta = VIEW_TITLES[current]

  return (
    <div className="app">
      <Sidebar active={current} onNavigate={setView} alerts={alerts} />
      <div className="main">
        <Topbar title={meta.title} sub={meta.sub} />
        <div className="content">
          {current === "dashboard" && <DashboardView onNavigate={setView} />}
          {current === "assistant" && <AssistantView />}
          {current === "websearch" && <WebSearchView />}
          {current === "calendar" && <CalendarView />}
          {current === "database" && <DatabaseView />}
          {current === "connectors" && <ConnectorsView />}
          {current === "mcp" && <McpView />}
          {current === "backends" && <BackendsView />}
          {current === "security" && <SecurityView />}
        </div>
      </div>
    </div>
  )
}
