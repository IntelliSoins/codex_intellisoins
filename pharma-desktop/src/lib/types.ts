// Types partagés entre le frontend React et les commandes Tauri (backend Rust).
// Ils doivent rester alignés avec les structures sérialisées côté Rust
// (src-tauri/src/commands/*). Voir aussi src-tauri/src/model.rs.

export type Role = "proprietaire" | "salarie"

export interface SessionUser {
  id: string
  displayName: string
  role: Role
  officine: string
  /** Empreinte de la clé matérielle / passphrase utilisée pour déverrouiller le coffre local. */
  vaultUnlocked: boolean
}

export type ComputeKind = "dgx-spark" | "mac-silicon" | "llm-externe" | "local-cpu"

export interface ComputeBackend {
  id: string
  kind: ComputeKind
  label: string
  endpoint: string
  model: string
  /** Latence médiane observée en millisecondes. */
  latencyMs: number
  status: "en-ligne" | "hors-ligne" | "degrade"
  /** true si les données peuvent quitter le poste vers ce backend. */
  externe: boolean
}

export interface AgentMessage {
  id: string
  role: "user" | "assistant" | "system" | "tool"
  content: string
  createdAt: string
  backendId?: string
  toolName?: string
}

export interface WebSearchResult {
  title: string
  url: string
  snippet: string
  source: string
  fetchedAt: string
}

export type ReminderPriority = "haute" | "normale" | "basse"

export interface Reminder {
  id: string
  title: string
  due: string
  priority: ReminderPriority
  category: "ordonnance" | "stock" | "patient" | "administratif" | "reglementaire"
  done: boolean
}

export interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  kind: "rdv" | "livraison" | "garde" | "formation"
}

export type DbEntity = "patients" | "ordonnances" | "stock" | "fournisseurs"

export interface DbRecord {
  id: string
  fields: Record<string, string | number>
}

/** Résultat de la recherche floue de documents (codex-file-search). */
export interface DocumentMatch {
  name: string
  /** Chemin relatif à la racine de recherche. */
  path: string
  /** Chemin absolu sur le poste. */
  fullPath: string
  /** Score de pertinence nucleo (plus élevé = plus pertinent). */
  score: number
  matchType: "file" | "directory"
}

export interface McpServer {
  id: string
  name: string
  transport: "stdio" | "sse" | "http"
  command: string
  status: "connecte" | "deconnecte" | "erreur"
  tools: McpTool[]
}

export interface McpTool {
  name: string
  description: string
  dangerous: boolean
}

export type ConnectorStatus = "connecte" | "a-configurer" | "erreur"

export interface PharmacyConnector {
  id: string
  name: string
  vendor: string
  category: "lgo" | "dossier-pharmaceutique" | "grossiste" | "teletransmission" | "messagerie-securisee"
  status: ConnectorStatus
  lastSync: string | null
}

export interface AuditEntry {
  id: string
  at: string
  actor: string
  role: Role
  action: string
  target: string
  severity: "info" | "avertissement" | "critique"
}

export interface DashboardSummary {
  tasksActives: number
  remindersToday: number
  connectorsOnline: number
  connectorsTotal: number
  backendsOnline: number
  backendsTotal: number
  securityAlerts: number
}
