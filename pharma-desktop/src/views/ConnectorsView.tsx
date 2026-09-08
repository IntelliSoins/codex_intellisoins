import { useEffect, useState } from "react"
import { Plug, RefreshCw } from "lucide-react"
import { bridge } from "../lib/bridge"
import type { PharmacyConnector } from "../lib/types"
import { Badge, Card, StatusDot, toneFor } from "../components/ui"

const CATEGORY_LABEL: Record<PharmacyConnector["category"], string> = {
  lgo: "Logiciel de gestion d'officine",
  "dossier-pharmaceutique": "Dossier Pharmaceutique",
  grossiste: "Grossiste-répartiteur",
  teletransmission: "Télétransmission",
  "messagerie-securisee": "Messagerie sécurisée santé",
}

const STATUS_LABEL: Record<PharmacyConnector["status"], string> = {
  connecte: "Connecté",
  "a-configurer": "À configurer",
  erreur: "Erreur",
}

export function ConnectorsView() {
  const [connectors, setConnectors] = useState<PharmacyConnector[]>([])
  const [syncing, setSyncing] = useState<string | null>(null)

  useEffect(() => {
    bridge.connectors().then(setConnectors)
  }, [])

  async function sync(id: string) {
    setSyncing(id)
    try {
      setConnectors(await bridge.syncConnector(id))
    } finally {
      setSyncing(null)
    }
  }

  return (
    <div className="stack">
      <p className="page-intro">
        Passerelles vers les applications externes de la pharmacie. Chaque connecteur s'exécute côté backend Rust dans un
        périmètre réseau restreint, avec identifiants stockés dans le trousseau chiffré (<span className="mono">codex-keyring-store</span>).
      </p>

      <div className="grid cols-2">
        {connectors.map((c) => (
          <Card key={c.id}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <span className="brand-mark" style={{ width: 40, height: 40, background: "var(--surface-3)", color: "var(--primary)" }}>
                <Plug size={18} />
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <strong>{c.name}</strong>
                  <Badge tone={toneFor(c.status)}>
                    <StatusDot tone={toneFor(c.status)} />
                    {STATUS_LABEL[c.status]}
                  </Badge>
                </div>
                <div className="meta" style={{ marginTop: 2 }}>
                  {c.vendor} · {CATEGORY_LABEL[c.category]}
                </div>
                <div className="meta" style={{ marginTop: 6 }}>
                  {c.lastSync ? `Dernière synchronisation ${c.lastSync}` : "Jamais synchronisé"}
                </div>
                <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                  <button className="btn sm" onClick={() => sync(c.id)} disabled={syncing === c.id}>
                    <RefreshCw size={14} className={syncing === c.id ? "spin" : ""} />
                    {c.status === "a-configurer" ? "Configurer" : "Synchroniser"}
                  </button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
