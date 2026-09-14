//! État applicatif partagé entre les commandes Tauri.

use std::sync::Mutex;

use crate::data;
use crate::model::{ComputeBackend, Reminder, SessionUser};
use sqlx::SqlitePool;

pub struct AppState {
    pub user: Mutex<SessionUser>,
    pub backends: Mutex<Vec<ComputeBackend>>,
    pub reminders: Mutex<Vec<Reminder>>,
    pub database: SqlitePool,
}

impl AppState {
    pub fn new(database: SqlitePool) -> Self {
        Self {
            user: Mutex::new(data::seed_user()),
            backends: Mutex::new(data::seed_backends()),
            reminders: Mutex::new(data::seed_reminders()),
            database,
        }
    }
}
