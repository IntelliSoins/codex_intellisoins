import { ChevronDown, Cpu } from "lucide-react"
import { useSession } from "../state/session"
import { StatusDot, toneFor } from "./ui"

export function Topbar({ title, sub }: { title: string; sub: string }) {
  const { user, backends, activeBackendId, setActiveBackendId } = useSession()
  const active = backends.find((b) => b.id === activeBackendId)
  const initials = (user?.displayName ?? "?")
    .split(" ")
    .map((p) => p[0])
    .slice(-2)
    .join("")

  return (
    <header className="topbar">
      <div>
        <h1>{title}</h1>
        <div className="sub">{sub}</div>
      </div>

      <div className="topbar-right">
        <div className="badge" style={{ padding: 0, border: "none" }}>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <Cpu size={15} style={{ position: "absolute", left: 10, color: "var(--faint)" }} />
            <select
              className="input"
              style={{ paddingLeft: 32, paddingRight: 30, width: "auto", appearance: "none" }}
              value={activeBackendId}
              onChange={(e) => setActiveBackendId(e.target.value)}
              title="Backend de calcul actif"
            >
              {backends.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.label}
                </option>
              ))}
            </select>
            <ChevronDown size={14} style={{ position: "absolute", right: 10, color: "var(--faint)", pointerEvents: "none" }} />
          </div>
        </div>
        {active && (
          <span className="badge">
            <StatusDot tone={toneFor(active.status)} />
            {active.externe ? "Externe" : "Local"} · {active.latencyMs} ms
          </span>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 10, paddingLeft: 6, borderLeft: "1px solid var(--border)" }}>
          <div className="avatar">{initials}</div>
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.displayName}</div>
            <div className="sub" style={{ fontSize: 11 }}>
              {user?.role === "proprietaire" ? "Pharmacien propriétaire" : "Pharmacien salarié"}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
