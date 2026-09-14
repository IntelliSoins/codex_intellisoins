use super::{next_transition, status_from_db, Transition, WorkflowError};
use crate::model::WorkflowStatus;

#[test]
fn transitions_are_strictly_sequential() {
    let cases = [
        (
            1,
            WorkflowStatus::EnCours,
            Transition {
                from_step: 1,
                to_step: 2,
                status: WorkflowStatus::EnAttentePatient,
                action: "Questionnaire envoyé",
            },
        ),
        (
            2,
            WorkflowStatus::EnAttentePatient,
            Transition {
                from_step: 2,
                to_step: 3,
                status: WorkflowStatus::AAnalyser,
                action: "Collecte patient enregistrée",
            },
        ),
        (
            3,
            WorkflowStatus::AAnalyser,
            Transition {
                from_step: 3,
                to_step: 4,
                status: WorkflowStatus::AConseiller,
                action: "Analyse validée par le pharmacien",
            },
        ),
        (
            4,
            WorkflowStatus::AConseiller,
            Transition {
                from_step: 4,
                to_step: 4,
                status: WorkflowStatus::Clos,
                action: "Conseil consigné et dossier clôturé",
            },
        ),
    ];

    for (step, status, expected) in cases {
        assert_eq!(
            next_transition(step, status).expect("transition valide"),
            expected
        );
    }
}

#[test]
fn closed_workflow_cannot_advance() {
    assert!(matches!(
        next_transition(4, WorkflowStatus::Clos),
        Err(WorkflowError::Closed)
    ));
}

#[test]
fn database_statuses_map_to_domain_statuses() {
    let cases = [
        ("en-cours", WorkflowStatus::EnCours),
        ("en-attente-patient", WorkflowStatus::EnAttentePatient),
        ("a-analyser", WorkflowStatus::AAnalyser),
        ("a-conseiller", WorkflowStatus::AConseiller),
        ("clos", WorkflowStatus::Clos),
    ];

    for (stored, expected) in cases {
        assert_eq!(status_from_db(stored).expect("statut connu"), expected);
    }
}
