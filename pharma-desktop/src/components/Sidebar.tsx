import { Cross, Lock } from "lucide-react"
import { NAV, type NavEntry, type ViewKey } from "../nav"
import { useSession } from "../state/session"

export function Sidebar({
  active,
  onNavigate,
  alerts,
}: {
  active: ViewKey
  onNavigate: (v: ViewKey) => void
  alerts: number
}) {
  const { user, lock } = useSession()
  const role = user?.role ?? "salarie"
  const visible = NAV.filter((e) => e.roles.includes(role))

  const sections = Array.from(new Set(visible.map((e) => e.section)))

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark">
          <Cross size={20} strokeWidth={2.5} />
        </span>
        <div>
          <div className="brand-name">PharmaCore</div>
          <div className="brand-sub">Poste sécurisé</div>
        </div>
      </div>

      <nav className="nav">
        {sections.map((section) => (
          <div key={section}>
            <div className="nav-section">{section}</div>
            {visible
              .filter((e) => e.section === section)
              .map((entry: NavEntry) => {
                const Icon = entry.icon
                return (
                  <button
                    key={entry.key}
                    className={`nav-item ${active === entry.key ? "active" : ""}`}
                    onClick={() => onNavigate(entry.key)}
                  >
                    <Icon size={17} />
                    {entry.label}
                    {entry.key === "security" && alerts > 0 && <span className="nav-badge">{alerts}</span>}
                  </button>
                )
              })}
          </div>
        ))}
      </nav>

      <div className="sidebar-foot">
        <button className="btn ghost sm" style={{ width: "100%" }} onClick={() => lock()}>
          <Lock size={15} />
          Verrouiller le poste
        </button>
      </div>
    </aside>
  )
}
