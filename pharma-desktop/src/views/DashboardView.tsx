import { useEffect, useState } from "react"
import { AlertTriangle, Bell, CheckCircle2, Cpu, ListTodo, Plug, Bot, Globe } from "lucide-react"
import { bridge } from "../lib/bridge"
import type { ComputeBackend, DashboardSummary, PharmacyConnector, Reminder } from "../lib/types"
import type { ViewKey } from "../nav"
import { Badge, Card, StatCard, StatusDot, toneFor } from "../components/ui"

export function DashboardView({ onNavigate }: { onNavigate: (v: ViewKey) => void }) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [backends, setBackends] = useState<ComputeBackend[]>([])
  const [connectors, setConnectors] = useState<PharmacyConnector[]>([])

  useEffect(() => {
    bridge.dashboard().then(setSummary)
    bridge.reminders().then(setReminders)
    bridge.backends().then(setBackends)
    bridge.connectors().then(setConnectors)
  }, [])

  const today = reminders.filter((r) => !r.done).slice(0, 5)

  return (
    <div className="stack">
      {summary && summary.securityAlerts > 0 && (
        <div className="banner warn">
          <AlertTriangle size={16} />
          {summary.securityAlerts} alerte(s) de sécurité à examiner dans le journal d'audit.
          <button className="btn ghost sm" style={{ marginLeft: "auto" }} onClick={() => onNavigate("security")}>
            Consulter
          </button>
        </div>
      )}

      <div className="grid cols-4">
        <StatCard icon={ListTodo} label="Tâches actives" value={summary?.tasksActives ?? "—"} />
        <StatCard icon={Bell} label="Rappels aujourd'hui" value={summary?.remindersToday ?? "—"} />
        <StatCard
          icon={Plug}
          label="Connecteurs en ligne"
          value={summary ? summary.connectorsOnline : "—"}
          suffix={summary ? `/ ${summary.connectorsTotal}` : undefined}
        />
        <StatCard
          icon={Cpu}
          label="Backends en ligne"
          value={summary ? summary.backendsOnline : "—"}
          suffix={summary ? `/ ${summary.backendsTotal}` : undefined}
        />
      </div>

      <div className="grid cols-2">
        <Card icon={Bell} title="Rappels du jour" action={<button className="btn ghost sm" onClick={() => onNavigate("calendar")}>Tout voir</button>}>
          <div className="list">
            {today.length === 0 && <div className="empty">Aucun rappel en attente.</div>}
            {today.map((r) => (
              <div className="row" key={r.id}>
                <StatusDot tone={r.priority === "haute" ? "err" : r.priority === "normale" ? "warn" : "neutral"} />
                <div className="grow">
                  <div className="title">{r.title}</div>
                  <div className="meta">{r.due}</div>
                </div>
                <Badge tone="neutral">{r.category}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <div className="stack">
          <Card icon={Cpu} title="Backends de calcul">
            <div className="list">
              {backends.map((b) => (
                <div className="row" key={b.id}>
                  <StatusDot tone={toneFor(b.status)} />
                  <div className="grow">
                    <div className="title">{b.label}</div>
                    <div className="meta mono">{b.model}</div>
                  </div>
                  <Badge tone={b.externe ? "warn" : "primary"}>{b.externe ? "Externe" : "Local"}</Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card icon={Plug} title="Connecteurs pharmacie">
            <div className="list">
              {connectors.slice(0, 4).map((c) => (
                <div className="row" key={c.id}>
                  <StatusDot tone={toneFor(c.status)} />
                  <div className="grow">
                    <div className="title">{c.name}</div>
                    <div className="meta">{c.lastSync ? `Sync ${c.lastSync}` : "Non configuré"}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Card title="Actions rapides">
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button className="btn primary" onClick={() => onNavigate("assistant")}>
            <Bot size={16} /> Ouvrir l'assistant
          </button>
          <button className="btn" onClick={() => onNavigate("websearch")}>
            <Globe size={16} /> Recherche santé
          </button>
          <button className="btn" onClick={() => onNavigate("database")}>
            <CheckCircle2 size={16} /> Vérifier une ordonnance
          </button>
          <button className="btn" onClick={() => onNavigate("connectors")}>
            <Plug size={16} /> Gérer les connecteurs
          </button>
        </div>
      </Card>
    </div>
  )
}
