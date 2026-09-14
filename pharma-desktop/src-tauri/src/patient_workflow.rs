use crate::model::{
    AdvancePatientWorkflowInput, CreatePatientWorkflowInput, PatientWorkflow,
    PatientWorkflowDetail, WorkflowChannel, WorkflowEvent, WorkflowStatus,
};
use chrono::{Duration, Utc};
use sqlx::sqlite::SqliteRow;
use sqlx::{Row, SqlitePool};

#[derive(Debug, thiserror::Error)]
pub enum WorkflowError {
    #[error("erreur de stockage local")]
    Database(#[from] sqlx::Error),
    #[error("dossier introuvable")]
    NotFound,
    #[error("ce dossier est déjà clôturé")]
    Closed,
    #[error("état du parcours invalide")]
    InvalidState,
    #[error("une synthèse est requise pour valider cette étape")]
    EmptyContent,
    #[error("le patient et le motif sont obligatoires")]
    InvalidInput,
}

#[derive(Debug, Clone, PartialEq, Eq)]
struct Transition {
    from_step: u8,
    to_step: u8,
    status: WorkflowStatus,
    action: &'static str,
}

fn next_transition(current_step: u8, status: WorkflowStatus) -> Result<Transition, WorkflowError> {
    if status == WorkflowStatus::Clos {
        return Err(WorkflowError::Closed);
    }
    match current_step {
        1 => Ok(Transition {
            from_step: 1,
            to_step: 2,
            status: WorkflowStatus::EnAttentePatient,
            action: "Questionnaire envoyé",
        }),
        2 => Ok(Transition {
            from_step: 2,
            to_step: 3,
            status: WorkflowStatus::AAnalyser,
            action: "Collecte patient enregistrée",
        }),
        3 => Ok(Transition {
            from_step: 3,
            to_step: 4,
            status: WorkflowStatus::AConseiller,
            action: "Analyse validée par le pharmacien",
        }),
        4 => Ok(Transition {
            from_step: 4,
            to_step: 4,
            status: WorkflowStatus::Clos,
            action: "Conseil consigné et dossier clôturé",
        }),
        _ => Err(WorkflowError::InvalidState),
    }
}

fn channel_to_db(channel: WorkflowChannel) -> &'static str {
    match channel {
        WorkflowChannel::Sms => "sms",
        WorkflowChannel::Email => "email",
    }
}

fn channel_from_db(value: &str) -> Result<WorkflowChannel, WorkflowError> {
    match value {
        "sms" => Ok(WorkflowChannel::Sms),
        "email" => Ok(WorkflowChannel::Email),
        _ => Err(WorkflowError::InvalidState),
    }
}

fn status_to_db(status: WorkflowStatus) -> &'static str {
    match status {
        WorkflowStatus::EnCours => "en-cours",
        WorkflowStatus::EnAttentePatient => "en-attente-patient",
        WorkflowStatus::AAnalyser => "a-analyser",
        WorkflowStatus::AConseiller => "a-conseiller",
        WorkflowStatus::Clos => "clos",
    }
}

fn status_from_db(value: &str) -> Result<WorkflowStatus, WorkflowError> {
    match value {
        "en-cours" => Ok(WorkflowStatus::EnCours),
        "en-attente-patient" => Ok(WorkflowStatus::EnAttentePatient),
        "a-analyser" => Ok(WorkflowStatus::AAnalyser),
        "a-conseiller" => Ok(WorkflowStatus::AConseiller),
        "clos" => Ok(WorkflowStatus::Clos),
        _ => Err(WorkflowError::InvalidState),
    }
}

fn workflow_from_row(row: &SqliteRow) -> Result<PatientWorkflow, WorkflowError> {
    let current_step = u8::try_from(row.try_get::<i64, _>("current_step")?)
        .map_err(|_| WorkflowError::InvalidState)?;
    let alert_count = u32::try_from(row.try_get::<i64, _>("alert_count")?)
        .map_err(|_| WorkflowError::InvalidState)?;
    Ok(PatientWorkflow {
        id: row.try_get("id")?,
        patient_display: row.try_get("patient_display")?,
        reason: row.try_get("reason")?,
        channel: channel_from_db(&row.try_get::<String, _>("channel")?)?,
        current_step,
        status: status_from_db(&row.try_get::<String, _>("status")?)?,
        alert_count,
        created_at: row.try_get("created_at")?,
        updated_at: row.try_get("updated_at")?,
    })
}

pub async fn initialize(pool: &SqlitePool) -> Result<(), WorkflowError> {
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS patient_workflows (
            id TEXT PRIMARY KEY,
            patient_display TEXT NOT NULL,
            reason TEXT NOT NULL,
            channel TEXT NOT NULL CHECK (channel IN ('sms', 'email')),
            current_step INTEGER NOT NULL CHECK (current_step BETWEEN 1 AND 4),
            status TEXT NOT NULL CHECK (status IN (
                'en-cours', 'en-attente-patient', 'a-analyser', 'a-conseiller', 'clos'
            )),
            questionnaire_note TEXT,
            collection_summary TEXT,
            analysis_draft TEXT,
            advice_summary TEXT,
            alert_count INTEGER NOT NULL DEFAULT 0 CHECK (alert_count >= 0),
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            closed_at TEXT
        )
        "#,
    )
    .execute(pool)
    .await?;
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS patient_workflow_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            workflow_id TEXT NOT NULL,
            at TEXT NOT NULL,
            actor TEXT NOT NULL,
            action TEXT NOT NULL,
            note TEXT NOT NULL,
            from_step INTEGER NOT NULL,
            to_step INTEGER NOT NULL,
            FOREIGN KEY (workflow_id) REFERENCES patient_workflows(id) ON DELETE CASCADE
        )
        "#,
    )
    .execute(pool)
    .await?;
    sqlx::query(
        "CREATE INDEX IF NOT EXISTS idx_patient_workflows_status_updated ON patient_workflows(status, updated_at DESC)",
    )
    .execute(pool)
    .await?;
    sqlx::query(
        "CREATE INDEX IF NOT EXISTS idx_patient_workflow_events_workflow ON patient_workflow_events(workflow_id, id)",
    )
    .execute(pool)
    .await?;

    let count = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM patient_workflows")
        .fetch_one(pool)
        .await?;
    if count == 0 {
        let now = Utc::now();
        let samples: [(
            &str,
            &str,
            &str,
            &str,
            i64,
            &str,
            Option<&str>,
            Option<&str>,
            Option<&str>,
            Option<&str>,
            i64,
            String,
        ); 3] = [
            (
                "wf-demo-lea",
                "Léa Moreau",
                "Suivi tensionnel et observance",
                "sms",
                3_i64,
                "a-analyser",
                Some("Questionnaire envoyé après accord oral."),
                Some("Tension irrégulière, deux oublis déclarés cette semaine."),
                None,
                None,
                1_i64,
                (now - Duration::minutes(18)).to_rfc3339(),
            ),
            (
                "wf-demo-marcel",
                "Marcel Petit",
                "Bilan de médication",
                "email",
                2_i64,
                "en-attente-patient",
                Some("Questionnaire envoyé à l'aidante désignée."),
                None,
                None,
                None,
                0_i64,
                (now - Duration::hours(2)).to_rfc3339(),
            ),
            (
                "wf-demo-nora",
                "Nora Benali",
                "Conseil suite à un TROD angine",
                "sms",
                4_i64,
                "a-conseiller",
                Some("Questionnaire remis au comptoir."),
                Some("Symptômes depuis 48 h, aucune allergie rapportée."),
                Some("Orientation médicale recommandée selon les réponses collectées."),
                None,
                0_i64,
                (now - Duration::minutes(42)).to_rfc3339(),
            ),
        ];
        let mut transaction = pool.begin().await?;
        for sample in samples {
            sqlx::query(
                r#"
                INSERT INTO patient_workflows (
                    id, patient_display, reason, channel, current_step, status,
                    questionnaire_note, collection_summary, analysis_draft,
                    advice_summary, alert_count, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                "#,
            )
            .bind(sample.0)
            .bind(sample.1)
            .bind(sample.2)
            .bind(sample.3)
            .bind(sample.4)
            .bind(sample.5)
            .bind(sample.6)
            .bind(sample.7)
            .bind(sample.8)
            .bind(sample.9)
            .bind(sample.10)
            .bind(&sample.11)
            .bind(&sample.11)
            .execute(&mut *transaction)
            .await?;
            sqlx::query(
                r#"
                INSERT INTO patient_workflow_events (
                    workflow_id, at, actor, action, note, from_step, to_step
                ) VALUES (?, ?, 'système', 'Dossier fictif amorcé',
                    'Jeu de démonstration — aucune donnée patient réelle.', 0, ?)
                "#,
            )
            .bind(sample.0)
            .bind(&sample.11)
            .bind(sample.4)
            .execute(&mut *transaction)
            .await?;
        }
        transaction.commit().await?;
    }
    Ok(())
}

pub async fn list(pool: &SqlitePool) -> Result<Vec<PatientWorkflow>, WorkflowError> {
    let rows = sqlx::query(
        r#"
        SELECT id, patient_display, reason, channel, current_step, status,
               alert_count, created_at, updated_at
        FROM patient_workflows
        ORDER BY CASE WHEN status = 'clos' THEN 1 ELSE 0 END, updated_at DESC
        "#,
    )
    .fetch_all(pool)
    .await?;
    rows.iter().map(workflow_from_row).collect()
}

pub async fn detail(pool: &SqlitePool, id: &str) -> Result<PatientWorkflowDetail, WorkflowError> {
    let row = sqlx::query(
        r#"
        SELECT id, patient_display, reason, channel, current_step, status,
               alert_count, created_at, updated_at, questionnaire_note,
               collection_summary, analysis_draft, advice_summary
        FROM patient_workflows WHERE id = ?
        "#,
    )
    .bind(id)
    .fetch_optional(pool)
    .await?
    .ok_or(WorkflowError::NotFound)?;
    let workflow = workflow_from_row(&row)?;
    let event_rows = sqlx::query(
        r#"
        SELECT id, at, actor, action, note, from_step, to_step
        FROM patient_workflow_events WHERE workflow_id = ? ORDER BY id DESC
        "#,
    )
    .bind(id)
    .fetch_all(pool)
    .await?;
    let events = event_rows
        .iter()
        .map(|event| {
            Ok(WorkflowEvent {
                id: event.try_get("id")?,
                at: event.try_get("at")?,
                actor: event.try_get("actor")?,
                action: event.try_get("action")?,
                note: event.try_get("note")?,
                from_step: u8::try_from(event.try_get::<i64, _>("from_step")?)
                    .map_err(|_| WorkflowError::InvalidState)?,
                to_step: u8::try_from(event.try_get::<i64, _>("to_step")?)
                    .map_err(|_| WorkflowError::InvalidState)?,
            })
        })
        .collect::<Result<Vec<_>, WorkflowError>>()?;
    Ok(PatientWorkflowDetail {
        workflow,
        questionnaire_note: row.try_get("questionnaire_note")?,
        collection_summary: row.try_get("collection_summary")?,
        analysis_draft: row.try_get("analysis_draft")?,
        advice_summary: row.try_get("advice_summary")?,
        events,
    })
}

pub async fn create(
    pool: &SqlitePool,
    input: CreatePatientWorkflowInput,
    actor: &str,
) -> Result<PatientWorkflowDetail, WorkflowError> {
    let patient_display = input.patient_display.trim();
    let reason = input.reason.trim();
    if patient_display.is_empty() || reason.is_empty() {
        return Err(WorkflowError::InvalidInput);
    }
    let id = format!("wf-{}", Utc::now().timestamp_micros());
    let at = Utc::now().to_rfc3339();
    let mut transaction = pool.begin().await?;
    sqlx::query(
        r#"
        INSERT INTO patient_workflows (
            id, patient_display, reason, channel, current_step, status,
            alert_count, created_at, updated_at
        ) VALUES (?, ?, ?, ?, 1, 'en-cours', 0, ?, ?)
        "#,
    )
    .bind(&id)
    .bind(patient_display)
    .bind(reason)
    .bind(channel_to_db(input.channel))
    .bind(&at)
    .bind(&at)
    .execute(&mut *transaction)
    .await?;
    sqlx::query(
        r#"
        INSERT INTO patient_workflow_events (
            workflow_id, at, actor, action, note, from_step, to_step
        ) VALUES (?, ?, ?, 'Dossier créé', 'Parcours officinal initialisé.', 0, 1)
        "#,
    )
    .bind(&id)
    .bind(&at)
    .bind(actor)
    .execute(&mut *transaction)
    .await?;
    transaction.commit().await?;
    detail(pool, &id).await
}

pub async fn advance(
    pool: &SqlitePool,
    input: AdvancePatientWorkflowInput,
    actor: &str,
) -> Result<PatientWorkflowDetail, WorkflowError> {
    let content = input.content.trim();
    if content.is_empty() {
        return Err(WorkflowError::EmptyContent);
    }
    let mut transaction = pool.begin().await?;
    let current = sqlx::query("SELECT current_step, status FROM patient_workflows WHERE id = ?")
        .bind(&input.id)
        .fetch_optional(&mut *transaction)
        .await?
        .ok_or(WorkflowError::NotFound)?;
    let current_step = u8::try_from(current.try_get::<i64, _>("current_step")?)
        .map_err(|_| WorkflowError::InvalidState)?;
    let status = status_from_db(&current.try_get::<String, _>("status")?)?;
    let transition = next_transition(current_step, status)?;
    let at = Utc::now().to_rfc3339();

    let result = match transition.from_step {
        1 => sqlx::query(
            "UPDATE patient_workflows SET questionnaire_note = ?, current_step = ?, status = ?, updated_at = ? WHERE id = ? AND current_step = 1 AND status != 'clos'",
        )
        .bind(content)
        .bind(transition.to_step)
        .bind(status_to_db(transition.status))
        .bind(&at)
        .bind(&input.id)
        .execute(&mut *transaction)
        .await?,
        2 => sqlx::query(
            "UPDATE patient_workflows SET collection_summary = ?, current_step = ?, status = ?, updated_at = ? WHERE id = ? AND current_step = 2 AND status != 'clos'",
        )
        .bind(content)
        .bind(transition.to_step)
        .bind(status_to_db(transition.status))
        .bind(&at)
        .bind(&input.id)
        .execute(&mut *transaction)
        .await?,
        3 => sqlx::query(
            "UPDATE patient_workflows SET analysis_draft = ?, current_step = ?, status = ?, updated_at = ? WHERE id = ? AND current_step = 3 AND status != 'clos'",
        )
        .bind(content)
        .bind(transition.to_step)
        .bind(status_to_db(transition.status))
        .bind(&at)
        .bind(&input.id)
        .execute(&mut *transaction)
        .await?,
        4 => sqlx::query(
            "UPDATE patient_workflows SET advice_summary = ?, status = 'clos', updated_at = ?, closed_at = ? WHERE id = ? AND current_step = 4 AND status != 'clos'",
        )
        .bind(content)
        .bind(&at)
        .bind(&at)
        .bind(&input.id)
        .execute(&mut *transaction)
        .await?,
        _ => return Err(WorkflowError::InvalidState),
    };
    if result.rows_affected() != 1 {
        return Err(WorkflowError::InvalidState);
    }
    sqlx::query(
        r#"
        INSERT INTO patient_workflow_events (
            workflow_id, at, actor, action, note, from_step, to_step
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        "#,
    )
    .bind(&input.id)
    .bind(&at)
    .bind(actor)
    .bind(transition.action)
    .bind(content)
    .bind(transition.from_step)
    .bind(transition.to_step)
    .execute(&mut *transaction)
    .await?;
    transaction.commit().await?;
    detail(pool, &input.id).await
}

#[cfg(test)]
#[path = "patient_workflow_tests.rs"]
mod tests;
