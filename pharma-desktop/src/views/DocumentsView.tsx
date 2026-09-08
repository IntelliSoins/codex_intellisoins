import { useState } from "react"
import { FileText, Folder, FolderSearch, Search } from "lucide-react"
import { bridge, isTauri } from "../lib/bridge"
import type { DocumentMatch } from "../lib/types"
import { Badge, Card } from "../components/ui"

const DEFAULT_ROOT = "~/Officine/Documents"

export function DocumentsView() {
  const [root, setRoot] = useState(DEFAULT_ROOT)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<DocumentMatch[] | null>(null)
  const [busy, setBusy] = useState(false)

  async function run(e?: React.FormEvent) {
    e?.preventDefault()
    if (busy) return
    setBusy(true)
    try {
      setResults(await bridge.documentSearch(root, query))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="stack">
      <p className="page-intro">
        Recherche floue et parallèle dans les documents locaux de l&apos;officine, propulsée par la crate Rust{" "}
        <code>codex-file-search</code> (moteur <code>nucleo</code>). Tout reste sur le poste : aucun fichier n&apos;est
        envoyé à l&apos;extérieur.
      </p>

      {!isTauri && (
        <div className="banner info">
          Aperçu navigateur : résultats de démonstration. En application Tauri, la recherche balaie réellement le dossier
          indiqué via <code>codex-file-search</code>.
        </div>
      )}

      <form onSubmit={run}>
        <div className="stack" style={{ gap: 10 }}>
          <div className="input-wrap">
            <Folder size={16} />
            <input
              className="input"
              placeholder="Dossier racine à indexer"
              value={root}
              onChange={(e) => setRoot(e.target.value)}
              aria-label="Dossier racine"
            />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <div className="input-wrap" style={{ flex: 1 }}>
              <Search size={16} />
              <input
                className="input"
                placeholder="Nom de fichier, dossier, extension… (ex. stupefiants, .pdf, bernard)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Requête de recherche"
              />
            </div>
            <button className="btn primary" disabled={busy}>
              <FolderSearch size={16} />
              {busy ? "Recherche…" : "Rechercher"}
            </button>
          </div>
        </div>
      </form>

      {results && (
        <Card title={`Résultats (${results.length})`}>
          {results.length === 0 ? (
            <div className="empty">Aucun document ne correspond à cette requête.</div>
          ) : (
            <div className="list">
              {results.map((r) => (
                <div className="row" key={r.fullPath}>
                  <span className="doc-icon" aria-hidden>
                    {r.matchType === "directory" ? <Folder size={16} /> : <FileText size={16} />}
                  </span>
                  <div className="grow">
                    <div className="title">{r.name}</div>
                    <div className="meta mono">{r.fullPath}</div>
                  </div>
                  <Badge tone={r.matchType === "directory" ? "warn" : "neutral"}>
                    {r.matchType === "directory" ? "dossier" : "fichier"}
                  </Badge>
                  <Badge tone="primary">score {r.score}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {!results && !busy && (
        <div className="empty">
          Indiquez un dossier puis lancez une recherche. Laissez la requête vide pour lister les premiers documents.
        </div>
      )}
    </div>
  )
}
