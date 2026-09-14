import { AlertTriangle, CheckCircle2, Plus, ShieldAlert, X } from "lucide-react"
import { useState, type FormEvent } from "react"
import useSWR from "swr"
import { WorkflowDetailPanel } from "../components/workflow/WorkflowDetailPanel"
import { WorkflowQueue } from "../components/workflow/WorkflowQueue"
import { WorkflowStepper } from "../components/workflow/WorkflowStepper"
import { bridge } from "../lib/bridge"
import type { CreatePatientWorkflowInput, WorkflowChannel } from "../lib/types"
import { useSession } from "../state/session"

export function PatientWorkflowsView() {
  const { backends, activeBackendId } = useSession()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [isMutating, setIsMutating] = useState(false)
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(null)
  const [patientDisplay, setPatientDisplay] = useState("")
  const [reason, setReason] = useState("")
  const [channel, setChannel] = useState<WorkflowChannel>("sms")

  const {
    data: workflows = [],
    error: listError,
    isLoading: isListLoading,
    mutate: refreshWorkflows,
  } = useSWR("patient-workflows", bridge.patientWorkflows)
  const effectiveSelectedId =
    selectedId && workflows.some((workflow) => workflow.id === selectedId)
      ? selectedId
      : workflows[0]?.id ?? null
  const {
    data: detail,
    error: detailError,
    isLoading: isDetailLoading,
    mutate: updateDetail,
  } = useSWR(
    effectiveSelectedId ? ["patient-workflow", effectiveSelectedId] : null,
    () => bridge.patientWorkflowDetail(effectiveSelectedId as string),
  )
  const activeBackend = backends.find((backend) => backend.id === activeBackendId)
  const visibleError = listError ?? detailError

  async function createWorkflow(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsMutating(true)
    setFeedback(null)
    const input: CreatePatientWorkflowInput = { patientDisplay, reason, channel }
    try {
      const created = await bridge.createPatientWorkflow(input)
      await refreshWorkflows()
      setSelectedId(created.workflow.id)
      setPatientDisplay("")
      setReason("")
      setChannel("sms")
      setShowCreate(false)
      setFeedback({ tone: "success", message: `Dossier fictif de ${created.workflow.patientDisplay} créé.` })
    } catch (error) {
      setFeedback({ tone: "error", message: error instanceof Error ? error.message : String(error) })
    } finally {
      setIsMutating(false)
    }
  }

  async function advanceWorkflow(content: string) {
    if (!detail) return
    setIsMutating(true)
    setFeedback(null)
    try {
      const updated = await bridge.advancePatientWorkflow({ id: detail.workflow.id, content })
      setSelectedId(updated.workflow.id)
      await updateDetail(updated, { revalidate: false })
      await refreshWorkflows()
      setFeedback({
        tone: "success",
        message: updated.workflow.status === "clos" ? "Conseil consigné et dossier clôturé." : "Étape enregistrée. Le dossier a avancé.",
      })
    } catch (error) {
      setFeedback({ tone: "error", message: error instanceof Error ? error.message : String(error) })
    } finally {
      setIsMutating(false)
    }
  }

  async function generateAnalysisDraft(): Promise<string> {
    if (!detail || !activeBackendId) throw new Error("Aucun backend IA actif")
    setFeedback(null)
    try {
      const reply = await bridge.sendMessage(
        activeBackendId,
        [],
        [
          "Prépare un brouillon concis de note d’analyse officinale pour validation par un pharmacien.",
          "Les informations ci-dessous sont strictement fictives.",
          `Motif : ${detail.workflow.reason}.`,
          `Collecte : ${detail.collectionSummary ?? "aucune synthèse disponible"}.`,
          "Distingue observations, points de vigilance et proposition de conduite à tenir. N’affirme aucune décision clinique.",
        ].join("\n"),
      )
      setFeedback({ tone: "success", message: "Brouillon IA généré. Relisez-le avant toute validation." })
      return reply.content
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setFeedback({ tone: "error", message })
      throw error
    }
  }

  return (
    <div className="stack workflow-page">
      <div className="banner warn workflow-prototype-banner">
        <ShieldAlert size={16} />
        <span><strong>Prototype — données fictives uniquement.</strong> Le stockage local n’est pas encore chiffré par SQLCipher.</span>
      </div>

      {visibleError && (
        <div className="banner workflow-error" role="alert">
          <AlertTriangle size={16} /> Impossible de charger les dossiers : {visibleError.message}
        </div>
      )}
      {feedback && (
        <div className={`banner workflow-feedback ${feedback.tone}`} role="status">
          {feedback.tone === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          {feedback.message}
          <button className="workflow-feedback-close" onClick={() => setFeedback(null)} aria-label="Fermer le message">
            <X size={15} />
          </button>
        </div>
      )}

      <WorkflowStepper workflow={detail?.workflow ?? null} />

      {showCreate && (
        <form className="card workflow-create" onSubmit={createWorkflow}>
          <div className="workflow-create-head">
            <div>
              <span className="eyebrow">Création rapide</span>
              <h2>Nouveau dossier fictif</h2>
            </div>
            <button className="btn ghost sm" type="button" onClick={() => setShowCreate(false)}>
              <X size={15} /> Fermer
            </button>
          </div>
          <div className="workflow-create-fields">
            <label className="workflow-field">
              <span>Patient fictif</span>
              <input className="input" value={patientDisplay} onChange={(event) => setPatientDisplay(event.target.value)} placeholder="Ex. Camille Martin" required />
            </label>
            <label className="workflow-field workflow-reason-field">
              <span>Motif du parcours</span>
              <input className="input" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Ex. Suivi de l’observance" required />
            </label>
            <label className="workflow-field">
              <span>Canal</span>
              <select className="input" value={channel} onChange={(event) => setChannel(event.target.value as WorkflowChannel)}>
                <option value="sms">SMS</option>
                <option value="email">Courriel</option>
              </select>
            </label>
          </div>
          <div className="workflow-create-actions">
            <button className="btn primary" type="submit" disabled={isMutating}>
              <Plus size={16} /> {isMutating ? "Création…" : "Créer le dossier"}
            </button>
          </div>
        </form>
      )}

      <div className="workflow-layout">
        <WorkflowQueue
          workflows={workflows}
          selectedId={effectiveSelectedId}
          isLoading={isListLoading}
          onSelect={(id) => {
            setSelectedId(id)
            setFeedback(null)
          }}
          onCreate={() => setShowCreate(true)}
        />
        <WorkflowDetailPanel
          detail={detail}
          backend={activeBackend}
          isLoading={isDetailLoading}
          isMutating={isMutating}
          onAdvance={advanceWorkflow}
          onGenerate={generateAnalysisDraft}
        />
      </div>
    </div>
  )
}
