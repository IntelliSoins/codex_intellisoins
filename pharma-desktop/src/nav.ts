import {
  LayoutDashboard,
  Bot,
  Globe,
  CalendarDays,
  Database,
  Plug,
  Wrench,
  Cpu,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react"
import type { Role } from "./lib/types"

export type ViewKey =
  | "dashboard"
  | "assistant"
  | "websearch"
  | "calendar"
  | "database"
  | "connectors"
  | "mcp"
  | "backends"
  | "security"

export interface NavEntry {
  key: ViewKey
  label: string
  section: "Espace de travail" | "Intégrations" | "Administration"
  icon: LucideIcon
  /** Rôles autorisés à voir l'entrée. */
  roles: Role[]
}

export const NAV: NavEntry[] = [
  { key: "dashboard", label: "Tableau de bord", section: "Espace de travail", icon: LayoutDashboard, roles: ["proprietaire", "salarie"] },
  { key: "assistant", label: "Assistant IA", section: "Espace de travail", icon: Bot, roles: ["proprietaire", "salarie"] },
  { key: "websearch", label: "Recherche web", section: "Espace de travail", icon: Globe, roles: ["proprietaire", "salarie"] },
  { key: "calendar", label: "Calendrier & rappels", section: "Espace de travail", icon: CalendarDays, roles: ["proprietaire", "salarie"] },
  { key: "database", label: "Base de données", section: "Espace de travail", icon: Database, roles: ["proprietaire", "salarie"] },
  { key: "connectors", label: "Connecteurs pharmacie", section: "Intégrations", icon: Plug, roles: ["proprietaire", "salarie"] },
  { key: "mcp", label: "Outils MCP", section: "Intégrations", icon: Wrench, roles: ["proprietaire", "salarie"] },
  { key: "backends", label: "Backends de calcul", section: "Intégrations", icon: Cpu, roles: ["proprietaire"] },
  { key: "security", label: "Sécurité & audit", section: "Administration", icon: ShieldCheck, roles: ["proprietaire"] },
]

export const VIEW_TITLES: Record<ViewKey, { title: string; sub: string }> = {
  dashboard: { title: "Tableau de bord", sub: "Vue d'ensemble de l'officine" },
  assistant: { title: "Assistant IA", sub: "Agent d'aide au workflow officinal" },
  websearch: { title: "Recherche web", sub: "Sources santé fiables et à jour" },
  calendar: { title: "Calendrier & rappels", sub: "Rendez-vous, gardes et échéances" },
  database: { title: "Base de données locale", sub: "Patients, ordonnances, stock, fournisseurs" },
  connectors: { title: "Connecteurs pharmacie", sub: "LGO, Dossier Pharmaceutique, grossistes" },
  mcp: { title: "Outils MCP", sub: "Serveurs Model Context Protocol" },
  backends: { title: "Backends de calcul", sub: "DGX Spark, Mac Silicon, LLM externes" },
  security: { title: "Sécurité & audit", sub: "Rôles, accès et journal d'activité" },
}
