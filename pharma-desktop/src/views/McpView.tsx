import { useEffect, useState } from "react"
import { AlertTriangle, Wrench } from "lucide-react"
import { bridge } from "../lib/bridge"
import type { McpServer } from "../lib/types"
import { Badge, Card, StatusDot, toneFor } from "../components/ui"

const STATUS_LABEL: Record<McpServer["status"], string> = {
  connecte: "Connecté",
  deconnecte: "Déconnecté",
  erreur: "Erreur",
}

export function McpView() {
  const [servers, setServers] = useState<McpServer[]>([])

  useEffect(() => {
    bridge.mcpServers().then(setServers)
  }, [])

  return (
    <div className="stack">
      <p className="page-intro">
        Serveurs Model Context Protocol pilotés par la crate <span className="mono">codex-mcp</span>. Les outils marqués
        comme sensibles nécessitent une validation explicite et s'exécutent sous sandbox (<span className="mono">codex-sandboxing</span>).
      </p>

      {servers.map((s) => (
        <Card key={s.id}>
          <div className="card-head">
            <span className="icon">
              <Wrench size={17} />
            </span>
            <h2>{s.name}</h2>
            <Badge tone={toneFor(s.status)}>
              <StatusDot tone={toneFor(s.status)} />
              {STATUS_LABEL[s.status]}
            </Badge>
            <span className="spacer badge">
              {s.transport}
            </span>
          </div>
          <div className="meta mono" style={{ marginBottom: 12 }}>$ {s.command}</div>
          <div className="list">
            {s.tools.map((t) => (
              <div className="row" key={t.name}>
                <div className="grow">
                  <div className="title mono" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {t.name}
                    {t.dangerous && (
                      <span className="badge err">
                        <AlertTriangle size={12} /> sensible
                      </span>
                    )}
                  </div>
                  <div className="meta">{t.description}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  )
}
