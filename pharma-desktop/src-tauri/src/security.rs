//! Contrôle d'accès basé sur les rôles (RBAC) et état du coffre local.
//!
//! Point de branchement codex : `codex-agent-roles` pour la définition des
//! rôles/capacités, `codex-keyring-store` + `codex-secrets` pour le
//! déverrouillage réel du coffre chiffré.

use crate::model::Role;

/// Capacités protégées du poste. Le frontend masque déjà les vues, mais
/// chaque commande sensible DOIT revérifier ici côté backend.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Capability {
    ConsulterDossiers,
    Delivrer,
    RegistreStupefiants,
    GererBackends,
    GererSecurite,
    ConfigurerConnecteurs,
}

impl Capability {
    /// Détermine si un rôle possède la capacité demandée.
    pub fn allowed_for(self, role: Role) -> bool {
        match role {
            Role::Proprietaire => true,
            Role::Salarie => matches!(self, Capability::ConsulterDossiers | Capability::Delivrer),
        }
    }
}

#[derive(Debug, thiserror::Error)]
pub enum SecurityError {
    #[error("accès refusé pour ce rôle")]
    Forbidden,
    #[error("coffre verrouillé")]
    VaultLocked,
    #[error("phrase secrète invalide")]
    InvalidPassphrase,
}

/// Garde-fou réutilisable par les commandes Tauri.
pub fn require(role: Role, capability: Capability) -> Result<(), SecurityError> {
    if capability.allowed_for(role) {
        Ok(())
    } else {
        Err(SecurityError::Forbidden)
    }
}

/// Vérifie une phrase secrète de déverrouillage du coffre.
///
/// Implémentation de démonstration : refuse uniquement les phrases vides.
/// En production, remplacer par une dérivation de clé (Argon2) et un
/// descellement via `codex-secrets` / trousseau système.
pub fn verify_passphrase(passphrase: &str) -> Result<(), SecurityError> {
    if passphrase.trim().is_empty() {
        Err(SecurityError::InvalidPassphrase)
    } else {
        Ok(())
    }
}
