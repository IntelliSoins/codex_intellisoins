import { AlertTriangle, Bot, CheckCircle2, Clock3, Loader2, Send, UserRound } from "lucide-react"
import { useState } from "react"
import type { ComputeBackend, PatientWorkflowDetail, WorkflowStatus } from "../../lib/types"
import { Badge, Card } from "../ui"

const statusLabels: Record<WorkflowStatus, string> = {
  "en-cours": "Questionnaire à envoyer",
  "en-attente-patient": "Réponses à collecter",
  "a-analyser": "Analyse pharmacien requise",
  "a-conseiller": "Conseil à consigner",
  clos: "Dossier clos",
}

const actionLabels = {
  1: "Confirmer l’envoi",
  2: "Enregistrer la collecte",
  3: "Valider l’analyse",
  4: "Consigner et clôturer",
} as const

const fieldLabels = {
  1: "Note d’envoi du questionnaire",
  2: "Synthèse des réponses patient",
  3: "Analyse officinale à valider",
  4: "Conseil remis au patient",
} as const

const fieldPlaceholders = {
  1: "Ex. Questionnaire envoyé par SMS après accord du patient.",
  2: "Résumez les réponses, symptômes, mesures et points de vigilance…",
  3: "Analysez les informations collectées puis validez votre conclusion…",
  4: "Consignez le conseil remis, l’orientation et les précautions expliquées…",
} as const

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "medium",
  timeStyle: "short",
})

function initialContent(detail: PatientWorkflowDetail): string {
  const step = detail.workflow.currentStep
  if (step === 1) {
    return detail.questionnaireNote ?? `Questionnaire préparé pour un envoi par ${detail.workflow.channel === "sms" ? "SMS" : "courriel"}.`
  }
  if (step === 2) return detail.collectionSummary ?? ""
  if (step === 3) return detail.analysisDraft ?? ""
  return detail.adviceSummary ?? ""
}

export function WorkflowDetailPanel({
  detail,
  backend,
  isLoading,
  isMutating,
  onAdvance,
  onGenerate,
}: {
  detail: PatientWorkflowDetail | undefined
  backend: ComputeBackend | undefined
  isLoading: boolean
  isMutating: boolean
  onAdvance: (content: string) => Promise<void>
  onGenerate: () => Promise<string>
}) {
  if (isLoading) {
    return (
      <Card title="Détail du dossier">
        <div className="empty workflow-empty"><Loader2 className="spin" size={18} /> Chargement du dossier…</div>
      </Card>
    )
  }
  if (!detail) {
    return (
      <Card title="Détail du dossier">
        <div className="empty">Sélectionnez un dossier pour afficher son parcours.</div>
      </Card>
    )
  }
  return (
    <WorkflowDetailContent
      key={`${detail.workflow.id}-${detail.workflow.currentStep}-${detail.workflow.updatedAt}`}
      detail={detail}
      backend={backend}
      isMutating={isMutating}
      onAdvance={onAdvance}
      onGenerate={onGenerate}
    />
  )
}

function WorkflowDetailContent({
  detail,
  backend,
  isMutating,
  onAdvance,
  onGenerate,
}: {
  detail: PatientWorkflowDetail
  backend: ComputeBackend | undefined
  isMutating: boolean
  onAdvance: (content: string) => Promise<void>
  onGenerate: () => Promise<string>
}) {
  const [content, setContent] = useState(() => initialContent(detail))
  const [isGenerating, setIsGenerating] = useState(false)
  const workflow = detail.workflow
  const isClosed = workflow.status === "clos"

  async function generateDraft() {
    setIsGenerating(true)
    try {
      setContent(await onGenerate())
    } catch {
      // Le parent affiche déjà l'erreur dans le bandeau de la vue.
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Card>
      <div className="workflow-detail-head">
        <div className="workflow-patient-avatar" aria-hidden="true"><UserRound size={20} /></div>
        <div className="grow">
          <span className="eyebrow">Dossier fictif · {workflow.channel === "sms" ? "SMS" : "Courriel"}</span>
          <h2>{workflow.patientDisplay}</h2>
          <p>{workflow.reason}</p>
        </div>
        <Badge tone={isClosed ? "ok" : workflow.status === "a-analyser" ? "warn" : "primary"}>
          {statusLabels[workflow.status]}
        </Badge>
      </div>

      {workflow.alertCount > 0 && (
        <div className="banner warn workflow-detail-alert">
          <AlertTriangle size={16} />
          {workflow.alertCount} signal de vigilance déclaré dans les réponses.
        </div>
      )}

      {!isClosed ? (
        <form
          className="workflow-action-form"
          onSubmit={async (event) => {
            event.preventDefault()
            await onAdvance(content)
          }}
        >
          <div className="workflow-action-title">
            <span>Étape {workflow.currentStep} sur 4</span>
            <strong>{statusLabels[workflow.status]}</strong>
          </div>

          {workflow.currentStep === 3 && (
            <div className="workflow-review-notice">
              <CheckCircle2 size={17} />
              <span><strong>Validation pharmacien obligatoire.</strong> L’IA prépare un brouillon, elle ne valide aucune décision clinique.</span>
            </div>
          )}

          <label className="workflow-field">
            <span>{fieldLabels[workflow.currentStep]}</span>
            <textarea
              className="input"
              rows={5}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder={fieldPlaceholders[workflow.currentStep]}
              disabled={isMutating || isGenerating}
              required
            />
          </label>

          <div className="workflow-form-actions">
            {workflow.currentStep === 3 && (
              <button
                className="btn"
                type="button"
                onClick={generateDraft}
                disabled={isMutating || isGenerating || !backend}
              >
                {isGenerating ? <Loader2 className="spin" size={16} /> : <Bot size={16} />}
                {isGenerating ? "Génération…" : "Générer un brouillon IA"}
              </button>
            )}
            <button className="btn primary" type="submit" disabled={isMutating || isGenerating || !content.trim()}>
              {isMutating ? <Loader2 className="spin" size={16} /> : workflow.currentStep === 1 ? <Send size={16} /> : <CheckCircle2 size={16} />}
              {isMutating ? "Enregistrement…" : actionLabels[workflow.currentStep]}
            </button>
          </div>
          {workflow.currentStep === 3 && backend && (
            <p className="workflow-backend-note">
              Backend sélectionné : <span className="mono">{backend.label}</span>
              {backend.externe && " · données fictives pseudonymisées"}
            </p>
          )}
        </form>
      ) : (
        <div className="workflow-closed-state">
          <CheckCircle2 size={21} />
          <div>
            <strong>Parcours clôturé</strong>
            <p>Le conseil a été consigné. Ce dossier est désormais en lecture seule.</p>
          </div>
        </div>
      )}

      <div className="workflow-record-grid">
        {detail.collectionSummary && (
          <div><span>Collecte patient</span><p>{detail.collectionSummary}</p></div>
        )}
        {detail.analysisDraft && (
          <div><span>Analyse validée</span><p>{detail.analysisDraft}</p></div>
        )}
        {detail.adviceSummary && (
          <div><span>Conseil consigné</span><p>{detail.adviceSummary}</p></div>
        )}
      </div>

      <section className="workflow-history" aria-labelledby="workflow-history-title">
        <h3 id="workflow-history-title"><Clock3 size={15} /> Historique du dossier</h3>
        <ol>
          {detail.events.map((event) => (
            <li key={event.id}>
              <span className="workflow-history-dot" aria-hidden="true" />
              <div>
                <strong>{event.action}</strong>
                <span>{event.actor} · {dateFormatter.format(new Date(event.at))}</span>
                <p>{event.note}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </Card>
  )
}
