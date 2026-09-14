import { Check } from "lucide-react"
import type { PatientWorkflow } from "../../lib/types"

const steps = [
  {
    title: "Questionnaire",
    description: "Préparer le motif puis envoyer par SMS ou courriel.",
  },
  {
    title: "Collecte patient",
    description: "Recevoir et synthétiser les réponses du patient.",
  },
  {
    title: "Analyse pharmacien",
    description: "Analyser, éditer puis valider le brouillon assisté par IA.",
  },
  {
    title: "Conseil & consignation",
    description: "Remettre le conseil, le consigner et clôturer le dossier.",
  },
] as const

export function WorkflowStepper({ workflow }: { workflow: PatientWorkflow | null }) {
  return (
    <section className="workflow-stepper-card" aria-labelledby="workflow-stepper-title">
      <div className="workflow-stepper-heading">
        <div>
          <span className="eyebrow">Circuit officinal</span>
          <h2 id="workflow-stepper-title">Un parcours clair, sous contrôle pharmacien</h2>
        </div>
        <span className="workflow-stepper-context">
          {workflow ? workflow.patientDisplay : "Sélectionnez un dossier"}
        </span>
      </div>
      <ol className="workflow-stepper">
        {steps.map((step, index) => {
          const number = (index + 1) as 1 | 2 | 3 | 4
          const complete = workflow
            ? workflow.status === "clos" || number < workflow.currentStep
            : false
          const active = workflow?.status !== "clos" && workflow?.currentStep === number
          const state = complete ? "complete" : active ? "active" : "upcoming"
          return (
            <li className={`workflow-step ${state}`} key={step.title} aria-current={active ? "step" : undefined}>
              <div className="workflow-step-track" aria-hidden="true">
                <span className="workflow-step-node">
                  {complete ? <Check size={20} strokeWidth={2.5} /> : number}
                </span>
              </div>
              <div className="workflow-step-copy">
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
