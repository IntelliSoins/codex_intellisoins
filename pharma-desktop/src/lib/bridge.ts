// Couche d'abstraction entre React et le backend Rust (Tauri).
//
// En fenêtre Tauri : les appels sont transmis aux commandes #[tauri::command]
// définies dans src-tauri/src/commands/*, qui délèguent aux crates codex-*.
//
// Hors Tauri (aperçu navigateur, tests) : on renvoie des données de
// démonstration pour que l'interface reste pleinement navigable.

import type {
  AgentMessage,
  AuditEntry,
  CalendarEvent,
  ComputeBackend,
  DashboardSummary,
  DbEntity,
  DbRecord,
  McpServer,
  PharmacyConnector,
  Reminder,
  SessionUser,
  WebSearchResult,
} from "./types"
import * as demo from "./demo-data"

// @ts-expect-error : injecté par le runtime Tauri uniquement.
export const isTauri: boolean = typeof window !== "undefined" && !!window.__TAURI_INTERNALS__

async function call<T>(cmd: string, args: Record<string, unknown>, fallback: () => T | Promise<T>): Promise<T> {
  if (!isTauri) {
    // Petite latence simulée pour reproduire le ressenti d'un vrai backend.
    await new Promise((r) => setTimeout(r, 120))
    return fallback()
  }
  const { invoke } = await import("@tauri-apps/api/core")
  return invoke<T>(cmd, args)
}

export const bridge = {
  // --- Session & sécurité -------------------------------------------------
  currentUser: () => call<SessionUser>("current_user", {}, () => demo.currentUser),
  unlockVault: (passphrase: string) =>
    call<SessionUser>("unlock_vault", { passphrase }, () => ({ ...demo.currentUser, vaultUnlocked: true })),
  lockVault: () => call<SessionUser>("lock_vault", {}, () => ({ ...demo.currentUser, vaultUnlocked: false })),
  auditLog: () => call<AuditEntry[]>("audit_log", {}, () => demo.auditEntries),

  // --- Tableau de bord ----------------------------------------------------
  dashboard: () => call<DashboardSummary>("dashboard_summary", {}, () => demo.dashboardSummary),

  // --- Assistant IA -------------------------------------------------------
  sendMessage: (backendId: string, history: AgentMessage[], input: string) =>
    call<AgentMessage>("agent_send", { backendId, history, input }, () => demo.assistantReply(input, backendId)),

  // --- Recherche web ------------------------------------------------------
  webSearch: (query: string) =>
    call<WebSearchResult[]>("web_search", { query }, () => demo.webResults(query)),

  // --- Calendrier & rappels ----------------------------------------------
  reminders: () => call<Reminder[]>("reminders_list", {}, () => demo.reminders),
  toggleReminder: (id: string) =>
    call<Reminder[]>("reminders_toggle", { id }, () => demo.toggleReminder(id)),
  calendar: () => call<CalendarEvent[]>("calendar_list", {}, () => demo.calendarEvents),

  // --- Base de données locale --------------------------------------------
  dbQuery: (entity: DbEntity, search: string) =>
    call<DbRecord[]>("db_query", { entity, search }, () => demo.dbQuery(entity, search)),

  // --- Connecteurs pharmacie ---------------------------------------------
  connectors: () => call<PharmacyConnector[]>("connectors_list", {}, () => demo.connectors),
  syncConnector: (id: string) =>
    call<PharmacyConnector[]>("connectors_sync", { id }, () => demo.syncConnector(id)),

  // --- Outils MCP ---------------------------------------------------------
  mcpServers: () => call<McpServer[]>("mcp_servers", {}, () => demo.mcpServers),

  // --- Backends de calcul -------------------------------------------------
  backends: () => call<ComputeBackend[]>("backends_list", {}, () => demo.backends),
  pingBackend: (id: string) =>
    call<ComputeBackend[]>("backends_ping", { id }, () => demo.pingBackend(id)),
}

export type Bridge = typeof bridge
