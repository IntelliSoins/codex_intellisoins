//! État applicatif partagé entre les commandes Tauri.

use std::sync::Mutex;

use crate::data;
use crate::model::{ComputeBackend, Reminder, SessionUser};

pub struct AppState {
    pub user: Mutex<SessionUser>,
    pub backends: Mutex<Vec<ComputeBackend>>,
    pub reminders: Mutex<Vec<Reminder>>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            user: Mutex::new(data::seed_user()),
            backends: Mutex::new(data::seed_backends()),
            reminders: Mutex::new(data::seed_reminders()),
        }
    }
}
