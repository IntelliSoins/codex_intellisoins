import { useState } from "react"
import { Cpu, Activity, Server, Cloud, HardDrive } from "lucide-react"
import { bridge } from "../lib/bridge"
import type { ComputeBackend, ComputeKind } from "../lib/types"
import { Badge, Card, StatusDot, toneFor } from "../components/ui"
import { useSession } from "../state/session"

const KIND_META: Record<ComputeKind, { label: string; icon: typeof Cpu }> = {
  "dgx-spark": { label: "NVIDIA DGX Spark", icon: Server },
  "mac-silicon": { label: "Apple Silicon", icon: HardDrive },
  "llm-externe": { label: "LLM externe", icon: Cloud },
  "local-cpu": { label: "CPU local", icon: Cpu },
}

const STATUS_LABEL: Record<ComputeBackend["status"], string> = {
  "en-ligne": "En ligne",
  "hors-ligne": "Hors ligne",
  degrade: "Dégradé",
}

export function BackendsView() {
  const { backends, activeBackendId, setActiveBackendId, refreshBackends } = useSession()
  const [pinging, setPinging] = useState<string | null>(null)

  async function ping(id: string) {
    setPinging(id)
    try {
      await bridge.pingBackend(id)
      await refreshBackends()
    } finally {
      setPinging(null)
    }
  }

  return (
    <div className="stack">
      <p className="page-intro">
        Sélectionne où s'exécutent les modèles selon la tâche : calcul local haute performance (DGX Spark, Mac Silicon)
        pour les données sensibles, ou LLM externe (avec pseudonymisation) pour les tâches non confidentielles.
      </p>

      <div className="grid cols-2">
        {backends.map((b) => {
          const meta = KIND_META[b.kind]
          const Icon = meta.icon
          const isActive = b.id === activeBackendId
          return (
            <Card key={b.id}>
              <div style={{ display: "flex", gap: 12 }}>
                <span
                  className="brand-mark"
                  style={{
                    width: 40,
                    height: 40,
                    background: b.externe ? "var(--amber-soft)" : "var(--primary-soft)",
                    color: b.externe ? "var(--amber)" : "var(--primary)",
                  }}
                >
                  <Icon size={18} />
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <strong>{b.label}</strong>
                    <Badge tone={toneFor(b.status)}>
                      <StatusDot tone={toneFor(b.status)} />
                      {STATUS_LABEL[b.status]}
                    </Badge>
                    {b.externe ? <Badge tone="warn">Externe</Badge> : <Badge tone="primary">Local</Badge>}
                  </div>
                  <div className="meta mono" style={{ marginTop: 4 }}>{meta.label} · {b.model}</div>
                  <div className="meta mono" style={{ marginTop: 2 }}>{b.endpoint}</div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
                    <span className="badge">
                      <Activity size={13} /> {b.latencyMs} ms
                    </span>
                    <button className="btn sm" onClick={() => ping(b.id)} disabled={pinging === b.id}>
                      {pinging === b.id ? "Test…" : "Tester"}
                    </button>
                    <button
                      className={isActive ? "btn primary sm" : "btn sm"}
                      onClick={() => setActiveBackendId(b.id)}
                      disabled={b.status === "hors-ligne"}
                    >
                      {isActive ? "Actif" : "Activer"}
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
