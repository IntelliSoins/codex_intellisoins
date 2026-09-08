import { useEffect, useState } from "react"
import { Database, Lock, Search } from "lucide-react"
import { bridge } from "../lib/bridge"
import type { DbEntity, DbRecord } from "../lib/types"
import { Card } from "../components/ui"

const ENTITIES: { key: DbEntity; label: string }[] = [
  { key: "patients", label: "Patients" },
  { key: "ordonnances", label: "Ordonnances" },
  { key: "stock", label: "Stock" },
  { key: "fournisseurs", label: "Fournisseurs" },
]

export function DatabaseView() {
  const [entity, setEntity] = useState<DbEntity>("patients")
  const [search, setSearch] = useState("")
  const [rows, setRows] = useState<DbRecord[]>([])

  useEffect(() => {
    bridge.dbQuery(entity, search).then(setRows)
  }, [entity, search])

  const columns = rows.length ? Object.keys(rows[0].fields) : []

  return (
    <div className="stack">
      <div className="banner info">
        <Lock size={16} />
        Base SQLite chiffrée locale (crate <span className="mono">sqlx</span> + coffre). Aucune donnée n'est synchronisée
        sans connecteur explicite.
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div className="segmented">
          {ENTITIES.map((e) => (
            <button key={e.key} className={entity === e.key ? "active" : ""} onClick={() => setEntity(e.key)}>
              {e.label}
            </button>
          ))}
        </div>
        <div className="input-wrap" style={{ flex: 1, minWidth: 220 }}>
          <Search size={16} />
          <input className="input" placeholder="Filtrer…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <Card icon={Database} title={ENTITIES.find((e) => e.key === entity)?.label}>
        {rows.length === 0 ? (
          <div className="empty">Aucun enregistrement.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  {columns.map((c) => (
                    <th key={c}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    {columns.map((c) => (
                      <td key={c} className={typeof r.fields[c] === "number" ? "mono" : ""}>
                        {String(r.fields[c])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
