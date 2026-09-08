import { useState } from "react"
import { ExternalLink, Globe, Search } from "lucide-react"
import { bridge } from "../lib/bridge"
import type { WebSearchResult } from "../lib/types"
import { Badge, Card } from "../components/ui"

export function WebSearchView() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<WebSearchResult[] | null>(null)
  const [busy, setBusy] = useState(false)

  async function run(e?: React.FormEvent) {
    e?.preventDefault()
    if (!query.trim() || busy) return
    setBusy(true)
    try {
      setResults(await bridge.webSearch(query))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="stack">
      <p className="page-intro">
        Recherche filtrée sur des sources santé de référence (HAS, ANSM, base publique des médicaments). Les requêtes
        transitent par un proxy réseau contrôlé côté backend Rust.
      </p>

      <form onSubmit={run}>
        <div style={{ display: "flex", gap: 10 }}>
          <div className="input-wrap" style={{ flex: 1 }}>
            <Search size={16} />
            <input
              className="input"
              placeholder="Ex. interactions AVK et antibiotiques, rupture amoxicilline…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button className="btn primary" disabled={busy || !query.trim()}>
            <Globe size={16} />
            {busy ? "Recherche…" : "Rechercher"}
          </button>
        </div>
      </form>

      {results && (
        <Card title={`Résultats (${results.length})`}>
          <div className="list">
            {results.map((r) => (
              <div className="row" key={r.url}>
                <div className="grow">
                  <div className="title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <a href={r.url} target="_blank" rel="noreferrer" style={{ color: "var(--text)", textDecoration: "none" }}>
                      {r.title}
                    </a>
                    <ExternalLink size={13} className="muted" />
                  </div>
                  <div className="meta" style={{ margin: "3px 0" }}>
                    {r.snippet}
                  </div>
                </div>
                <Badge tone="primary">{r.source}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {!results && !busy && (
        <div className="empty">Lancez une recherche pour afficher des résultats issus de sources vérifiées.</div>
      )}
    </div>
  )
}
