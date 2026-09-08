import { useEffect, useState } from "react"
import { KeyRound, ShieldCheck, UserCog } from "lucide-react"
import { bridge } from "../lib/bridge"
import type { AuditEntry } from "../lib/types"
import { Badge, Card, StatusDot, toneFor } from "../components/ui"

const SEVERITY_LABEL: Record<AuditEntry["severity"], string> = {
  info: "Info",
  avertissement: "Avertissement",
  critique: "Critique",
}

const ROLE_MATRIX = [
  { capability: "Consulter patients & ordonnances", proprietaire: true, salarie: true },
  { capability: "Délivrer et télétransmettre", proprietaire: true, salarie: true },
  { capability: "Registre des stupéfiants", proprietaire: true, salarie: false },
  { capability: "Gérer les backends de calcul", proprietaire: true, salarie: false },
  { capability: "Gérer les rôles & la sécurité", proprietaire: true, salarie: false },
  { capability: "Configurer les connecteurs externes", proprietaire: true, salarie: false },
]

export function SecurityView() {
  const [entries, setEntries] = useState<AuditEntry[]>([])

  useEffect(() => {
    bridge.auditLog().then(setEntries)
  }, [])

  return (
    <div className="stack">
      <div className="grid cols-3">
        <Card icon={ShieldCheck} title="Coffre local">
          <p className="muted" style={{ margin: 0, fontSize: 13 }}>
            Chiffrement au repos via le trousseau système (<span className="mono">codex-keyring-store</span>) et
            secrets scellés (<span className="mono">codex-secrets</span>).
          </p>
        </Card>
        <Card icon={KeyRound} title="Sandbox d'exécution">
          <p className="muted" style={{ margin: 0, fontSize: 13 }}>
            Toute commande outil passe par <span className="mono">codex-sandboxing</span> avec politique d'accès
            réseau et fichiers restreinte par défaut.
          </p>
        </Card>
        <Card icon={UserCog} title="Rôles">
          <p className="muted" style={{ margin: 0, fontSize: 13 }}>
            Contrôle d'accès (<span className="mono">codex-agent-roles</span>) : propriétaire vs salarié, appliqué
            côté backend Rust et dans l'UI.
          </p>
        </Card>
      </div>

      <Card icon={UserCog} title="Matrice des habilitations">
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Capacité</th>
                <th style={{ textAlign: "center" }}>Propriétaire</th>
                <th style={{ textAlign: "center" }}>Salarié</th>
              </tr>
            </thead>
            <tbody>
              {ROLE_MATRIX.map((r) => (
                <tr key={r.capability}>
                  <td>{r.capability}</td>
                  <td style={{ textAlign: "center" }}>
                    <Badge tone={r.proprietaire ? "ok" : "err"}>{r.proprietaire ? "Autorisé" : "Refusé"}</Badge>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <Badge tone={r.salarie ? "ok" : "err"}>{r.salarie ? "Autorisé" : "Refusé"}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card icon={ShieldCheck} title="Journal d'audit">
        <div className="list">
          {entries.map((e) => (
            <div className="row" key={e.id}>
              <StatusDot tone={toneFor(e.severity)} />
              <div className="grow">
                <div className="title">{e.action}</div>
                <div className="meta">
                  {e.actor} · {e.role === "proprietaire" ? "propriétaire" : "salarié"} · cible <span className="mono">{e.target}</span>
                </div>
              </div>
              <Badge tone={toneFor(e.severity)}>{SEVERITY_LABEL[e.severity]}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
