import { AlertTriangle, ListFilter, Plus, Search } from "lucide-react"
import { useMemo, useState } from "react"
import type { PatientWorkflow, WorkflowStatus } from "../../lib/types"
import { Badge, Card } from "../ui"

type QueueFilter = "actifs" | "tous" | "clos"

const statusLabels: Record<WorkflowStatus, string> = {
  "en-cours": "À envoyer",
  "en-attente-patient": "Attente patient",
  "a-analyser": "À analyser",
  "a-conseiller": "À conseiller",
  clos: "Clos",
}

function statusTone(status: WorkflowStatus): "primary" | "warn" | "ok" | "neutral" {
  if (status === "a-analyser") return "warn"
  if (status === "clos") return "ok"
  if (status === "en-cours" || status === "a-conseiller") return "primary"
  return "neutral"
}

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
})

export function WorkflowQueue({
  workflows,
  selectedId,
  isLoading,
  onSelect,
  onCreate,
}: {
  workflows: PatientWorkflow[]
  selectedId: string | null
  isLoading: boolean
  onSelect: (id: string) => void
  onCreate: () => void
}) {
  const [filter, setFilter] = useState<QueueFilter>("actifs")
  const [query, setQuery] = useState("")
  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("fr")
    return workflows.filter((workflow) => {
      const matchesFilter =
        filter === "tous" ||
        (filter === "clos"
          ? workflow.status === "clos"
          : workflow.status !== "clos" || workflow.id === selectedId)
      const matchesQuery =
        !needle ||
        workflow.patientDisplay.toLocaleLowerCase("fr").includes(needle) ||
        workflow.reason.toLocaleLowerCase("fr").includes(needle)
      return matchesFilter && matchesQuery
    })
  }, [filter, query, workflows])

  return (
    <Card
      icon={ListFilter}
      title="File des dossiers"
      action={
        <button className="btn primary sm" onClick={onCreate}>
          <Plus size={15} /> Nouveau
        </button>
      }
    >
      <label className="workflow-search">
        <span className="sr-only">Rechercher un patient ou un motif</span>
        <Search size={15} aria-hidden="true" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Patient ou motif…"
        />
      </label>
      <div className="workflow-filters" role="group" aria-label="Filtrer les dossiers">
        {(["actifs", "tous", "clos"] as const).map((option) => (
          <button
            className={filter === option ? "active" : ""}
            key={option}
            onClick={() => setFilter(option)}
            aria-pressed={filter === option}
          >
            {option === "actifs" ? "Actifs" : option === "tous" ? "Tous" : "Clos"}
          </button>
        ))}
      </div>
      <div className="workflow-queue" aria-live="polite">
        {isLoading && <div className="empty workflow-empty">Chargement des dossiers…</div>}
        {!isLoading && visible.length === 0 && (
          <div className="empty workflow-empty">Aucun dossier pour ce filtre.</div>
        )}
        {visible.map((workflow) => (
          <button
            className={`workflow-queue-item ${selectedId === workflow.id ? "active" : ""}`}
            key={workflow.id}
            onClick={() => onSelect(workflow.id)}
            aria-current={selectedId === workflow.id ? "true" : undefined}
          >
            <span className="workflow-queue-topline">
              <strong>{workflow.patientDisplay}</strong>
              <Badge tone={statusTone(workflow.status)}>{statusLabels[workflow.status]}</Badge>
            </span>
            <span className="workflow-queue-reason">{workflow.reason}</span>
            <span className="workflow-queue-meta">
              Étape {workflow.currentStep}/4 · {dateFormatter.format(new Date(workflow.updatedAt))}
              {workflow.alertCount > 0 && (
                <span className="workflow-alert-count">
                  <AlertTriangle size={13} aria-hidden="true" />
                  {workflow.alertCount} signal
                </span>
              )}
            </span>
          </button>
        ))}
      </div>
    </Card>
  )
}
