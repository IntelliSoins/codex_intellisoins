import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"

type Tone = "ok" | "warn" | "err" | "neutral" | "primary"

/** Traduit un statut métier en tonalité visuelle. */
export function toneFor(status: string): Tone {
  switch (status) {
    case "en-ligne":
    case "connecte":
      return "ok"
    case "degrade":
    case "a-configurer":
    case "avertissement":
      return "warn"
    case "hors-ligne":
    case "deconnecte":
    case "erreur":
    case "critique":
      return "err"
    default:
      return "neutral"
  }
}

export function StatusDot({ tone }: { tone: Tone }) {
  return <span className={`dot ${tone === "neutral" ? "" : tone}`} />
}

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  const cls = tone === "neutral" ? "" : tone === "primary" ? "primary" : tone
  return <span className={`badge ${cls}`}>{children}</span>
}

export function Card({
  icon: Icon,
  title,
  action,
  children,
}: {
  icon?: LucideIcon
  title?: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="card">
      {(title || action) && (
        <div className="card-head">
          {Icon && (
            <span className="icon">
              <Icon size={17} />
            </span>
          )}
          {title && <h2>{title}</h2>}
          {action && <span className="spacer">{action}</span>}
        </div>
      )}
      {children}
    </section>
  )
}

export function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
}: {
  icon: LucideIcon
  label: string
  value: ReactNode
  suffix?: string
}) {
  return (
    <div className="card stat">
      <span className="label">
        <Icon size={14} />
        {label}
      </span>
      <span className="value">
        {value}
        {suffix && <small> {suffix}</small>}
      </span>
    </div>
  )
}
