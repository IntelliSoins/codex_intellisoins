// Données de démonstration utilisées hors fenêtre Tauri (aperçu navigateur).
// Aucune donnée réelle de patient : ce sont des exemples fictifs.

import type {
  AgentMessage,
  AuditEntry,
  CalendarEvent,
  ComputeBackend,
  DashboardSummary,
  DbEntity,
  DbRecord,
  DocumentMatch,
  McpServer,
  PharmacyConnector,
  Reminder,
  SessionUser,
  WebSearchResult,
} from "./types"

const now = () => new Date().toISOString()

export const currentUser: SessionUser = {
  id: "u-001",
  displayName: "Dr. Amélie Rousseau",
  role: "proprietaire",
  officine: "Pharmacie du Grand Chêne",
  vaultUnlocked: false,
}

export const dashboardSummary: DashboardSummary = {
  tasksActives: 4,
  remindersToday: 6,
  connectorsOnline: 3,
  connectorsTotal: 5,
  backendsOnline: 2,
  backendsTotal: 4,
  securityAlerts: 1,
}

export const backends: ComputeBackend[] = [
  {
    id: "b-dgx",
    kind: "dgx-spark",
    label: "DGX Spark (local)",
    endpoint: "grpc://dgx-spark.local:8443",
    model: "llama-3.3-70b-instruct",
    latencyMs: 180,
    status: "en-ligne",
    externe: false,
  },
  {
    id: "b-mac",
    kind: "mac-silicon",
    label: "Mac Studio M3 Ultra",
    endpoint: "http://mac-studio.local:11434",
    model: "qwen2.5-32b",
    latencyMs: 240,
    status: "en-ligne",
    externe: false,
  },
  {
    id: "b-ext",
    kind: "llm-externe",
    label: "LLM externe (chiffré)",
    endpoint: "https://gateway.exemple.fr/v1",
    model: "gpt-4o-mini",
    latencyMs: 620,
    status: "degrade",
    externe: true,
  },
  {
    id: "b-cpu",
    kind: "local-cpu",
    label: "Poste local (CPU)",
    endpoint: "in-process",
    model: "phi-3-mini",
    latencyMs: 95,
    status: "hors-ligne",
    externe: false,
  },
]

export function pingBackend(id: string): ComputeBackend[] {
  return backends.map((b) =>
    b.id === id ? { ...b, latencyMs: Math.max(60, Math.round(b.latencyMs * (0.8 + Math.random() * 0.4))) } : b,
  )
}

export const reminders: Reminder[] = [
  { id: "r-1", title: "Renouvellement ordonnance — M. Bernard", due: "Aujourd'hui 14:30", priority: "haute", category: "ordonnance", done: false },
  { id: "r-2", title: "Commande grossiste avant 17h", due: "Aujourd'hui 17:00", priority: "haute", category: "stock", done: false },
  { id: "r-3", title: "Vérifier péremptions rayon B4", due: "Aujourd'hui", priority: "normale", category: "stock", done: false },
  { id: "r-4", title: "Déclaration de garde", due: "Demain 09:00", priority: "normale", category: "reglementaire", done: false },
  { id: "r-5", title: "Rappel vaccination grippe — Mme Léa", due: "Aujourd'hui", priority: "basse", category: "patient", done: true },
  { id: "r-6", title: "Signer registre stupéfiants", due: "Aujourd'hui 18:00", priority: "haute", category: "reglementaire", done: false },
]

export function toggleReminder(id: string): Reminder[] {
  const r = reminders.find((x) => x.id === id)
  if (r) r.done = !r.done
  return [...reminders]
}

export const calendarEvents: CalendarEvent[] = [
  { id: "e-1", title: "Entretien pharmaceutique — asthme", start: "10:00", end: "10:30", kind: "rdv" },
  { id: "e-2", title: "Livraison CERP", start: "11:15", end: "11:30", kind: "livraison" },
  { id: "e-3", title: "Bilan de médication — M. Petit", start: "14:30", end: "15:00", kind: "rdv" },
  { id: "e-4", title: "Garde de nuit", start: "20:00", end: "08:00", kind: "garde" },
  { id: "e-5", title: "Formation TROD angine", start: "16:00", end: "17:00", kind: "formation" },
]

const db: Record<DbEntity, DbRecord[]> = {
  patients: [
    { id: "p-1", fields: { nom: "Bernard Jacques", ne: "1951", regime: "ALD", medecin: "Dr Fontaine" } },
    { id: "p-2", fields: { nom: "Léa Moreau", ne: "1988", regime: "Général", medecin: "Dr Aziz" } },
    { id: "p-3", fields: { nom: "Petit Marcel", ne: "1943", regime: "ALD", medecin: "Dr Fontaine" } },
  ],
  ordonnances: [
    { id: "o-1", fields: { patient: "Bernard Jacques", date: "2026-09-01", statut: "À renouveler", prescripteur: "Dr Fontaine" } },
    { id: "o-2", fields: { patient: "Léa Moreau", date: "2026-09-05", statut: "Délivrée", prescripteur: "Dr Aziz" } },
  ],
  stock: [
    { id: "s-1", fields: { produit: "Doliprane 1000mg", cip: "3400930", quantite: 42, seuil: 20, peremption: "2027-03" } },
    { id: "s-2", fields: { produit: "Amoxicilline 500mg", cip: "3400931", quantite: 8, seuil: 15, peremption: "2026-11" } },
    { id: "s-3", fields: { produit: "Ventoline", cip: "3400932", quantite: 25, seuil: 10, peremption: "2027-01" } },
  ],
  fournisseurs: [
    { id: "f-1", fields: { nom: "CERP Rouen", contact: "commande@cerp.fr", delai: "2h" } },
    { id: "f-2", fields: { nom: "OCP", contact: "edi@ocp.fr", delai: "4h" } },
  ],
}

export function dbQuery(entity: DbEntity, search: string): DbRecord[] {
  const rows = db[entity] ?? []
  if (!search.trim()) return rows
  const q = search.toLowerCase()
  return rows.filter((r) => Object.values(r.fields).some((v) => String(v).toLowerCase().includes(q)))
}

// Corpus fictif reflétant le repli Rust `data::document_matches`.
const documentCorpus: Array<{ path: string; matchType: "file" | "directory" }> = [
  { path: "procedures/plan-assurance-qualite.pdf", matchType: "file" },
  { path: "procedures/gestion-stupefiants.docx", matchType: "file" },
  { path: "procedures/chaine-du-froid.pdf", matchType: "file" },
  { path: "ordonnances/2026-09/bernard-jacques.pdf", matchType: "file" },
  { path: "ordonnances/2026-09/moreau-lea.pdf", matchType: "file" },
  { path: "formations/trod-angine-support.pptx", matchType: "file" },
  { path: "reglementaire/registre-stupefiants-2026.xlsx", matchType: "file" },
  { path: "fournisseurs/contrat-cerp.pdf", matchType: "file" },
  { path: "archives", matchType: "directory" },
]

export function documentSearch(root: string, query: string): DocumentMatch[] {
  const base = root.trim() || "~/Officine/Documents"
  const q = query.trim().toLowerCase()
  return documentCorpus
    .filter((d) => !q || d.path.toLowerCase().includes(q))
    .slice(0, 30)
    .map((d, i) => ({
      name: d.path.split("/").pop() ?? d.path,
      path: d.path,
      fullPath: `${base}/${d.path}`,
      score: Math.max(10, 1000 - i * 40),
      matchType: d.matchType,
    }))
}

export const connectors: PharmacyConnector[] = [
  { id: "c-lgo", name: "LGPI Winpharma", vendor: "Pharmagest", category: "lgo", status: "connecte", lastSync: "il y a 3 min" },
  { id: "c-dp", name: "Dossier Pharmaceutique", vendor: "CNOP", category: "dossier-pharmaceutique", status: "connecte", lastSync: "il y a 12 min" },
  { id: "c-cerp", name: "CERP EDI", vendor: "CERP", category: "grossiste", status: "connecte", lastSync: "il y a 1 min" },
  { id: "c-tlt", name: "Télétransmission SESAM-Vitale", vendor: "GIE Sesam-Vitale", category: "teletransmission", status: "a-configurer", lastSync: null },
  { id: "c-mss", name: "Messagerie Sécurisée Santé", vendor: "MSSanté", category: "messagerie-securisee", status: "erreur", lastSync: "il y a 2 h" },
]

export function syncConnector(id: string): PharmacyConnector[] {
  return connectors.map((c) => (c.id === id ? { ...c, status: "connecte", lastSync: "à l'instant" } : c))
}

export const mcpServers: McpServer[] = [
  {
    id: "m-vidal",
    name: "vidal-mcp",
    transport: "stdio",
    command: "codex-mcp --server vidal",
    status: "connecte",
    tools: [
      { name: "interactions_medicamenteuses", description: "Analyse d'interactions entre molécules", dangerous: false },
      { name: "posologie_reference", description: "Posologies recommandées par tranche d'âge", dangerous: false },
    ],
  },
  {
    id: "m-fs",
    name: "file-search",
    transport: "stdio",
    command: "codex-file-search",
    status: "connecte",
    tools: [{ name: "recherche_documents", description: "Recherche floue dans les documents de l'officine", dangerous: false }],
  },
  {
    id: "m-shell",
    name: "shell-tools",
    transport: "stdio",
    command: "codex-exec-server",
    status: "deconnecte",
    tools: [{ name: "executer_commande", description: "Exécute une commande système (sous sandbox)", dangerous: true }],
  },
]

export const auditEntries: AuditEntry[] = [
  { id: "a-1", at: now(), actor: "Dr. Amélie Rousseau", role: "proprietaire", action: "Déverrouillage du coffre", target: "vault", severity: "info" },
  { id: "a-2", at: now(), actor: "Karim Salhi", role: "salarie", action: "Consultation ordonnance", target: "o-1", severity: "info" },
  { id: "a-3", at: now(), actor: "système", role: "proprietaire", action: "Échec connexion MSSanté", target: "c-mss", severity: "avertissement" },
  { id: "a-4", at: now(), actor: "Karim Salhi", role: "salarie", action: "Tentative d'accès registre stupéfiants refusée", target: "registre-stup", severity: "critique" },
]

const canned: Record<string, string> = {
  default:
    "Voici une analyse fondée sur les données locales de l'officine. Je peux croiser l'ordonnance avec le Dossier Pharmaceutique, vérifier les interactions via le serveur MCP Vidal, puis préparer la délivrance. Souhaitez-vous que je lance la vérification d'interactions ?",
}

export function assistantReply(input: string, backendId: string): AgentMessage {
  const backend = backends.find((b) => b.id === backendId)
  const prefix = backend?.externe
    ? "[Backend externe — données pseudonymisées avant envoi] "
    : `[${backend?.label ?? "backend local"}] `
  return {
    id: `msg-${Date.now()}`,
    role: "assistant",
    content: prefix + (canned[input.toLowerCase()] ?? canned.default),
    createdAt: now(),
    backendId,
  }
}

export function webResults(query: string): WebSearchResult[] {
  const q = query.trim() || "recommandations HAS"
  return [
    { title: `${q} — Haute Autorité de Santé`, url: "https://has-sante.fr", snippet: "Recommandations de bonne pratique et fiches de bon usage du médicament.", source: "has-sante.fr", fetchedAt: now() },
    { title: `${q} — Base de données publique des médicaments`, url: "https://base-donnees-publique.medicaments.gouv.fr", snippet: "Notices, RCP et conditions de prescription et de délivrance.", source: "medicaments.gouv.fr", fetchedAt: now() },
    { title: `${q} — ANSM`, url: "https://ansm.sante.fr", snippet: "Informations de sécurité, ruptures de stock et retraits de lots.", source: "ansm.sante.fr", fetchedAt: now() },
  ]
}
