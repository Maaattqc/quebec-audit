export type Status = "prospect" | "contacted" | "demo_sent" | "negotiating" | "closed_won" | "closed_lost" | "archived";
export type Grade = "A" | "B" | "C" | "D" | "E" | "F";

export interface Contact {
  name: string;
  role: string;
  phone: string;
}

export interface HistoryEntry {
  ts: string;
  action: string;
}

export interface Business {
  id: string;
  name: string;
  url: string;
  sector: string;
  grade: Grade;
  phone: string;
  email: string;
  contacts: Contact[];
  status: Status;
  notes: string;
  issues: string[];
  improvements: string[];
  estimatedValue: string;
  hasDemo: boolean;
  demoNotes: string;
  history: HistoryEntry[];
  score?: number;
  categoryScores?: CategoryScores;
  categoryIssues?: Record<CategoryKey, string[]>;
}

export const STATUSES: Record<Status, { label: string; color: string }> = {
  prospect: { label: "Prospect", color: "#64748b" },
  contacted: { label: "Contacté", color: "#3b82f6" },
  demo_sent: { label: "Démo envoyée", color: "#a855f7" },
  negotiating: { label: "Négociation", color: "#f59e0b" },
  closed_won: { label: "Gagné", color: "#22c55e" },
  closed_lost: { label: "Perdu", color: "#ef4444" },
  archived: { label: "Archivé", color: "#9ca3af" },
};

export const GRADES: Record<Grade, { color: string; label: string }> = {
  A: { color: "#22c55e", label: "Excellent" },
  B: { color: "#84cc16", label: "Bon" },
  C: { color: "#eab308", label: "Correct" },
  D: { color: "#f97316", label: "Faible" },
  E: { color: "#ef4444", label: "Mauvais" },
  F: { color: "#991b1b", label: "Très mauvais" },
};

export type CategoryKey = 'seo' | 'technique' | 'performance' | 'contenu' | 'ux' | 'accessibilite' | 'contact' | 'confiance';
export type CategoryScores = Record<CategoryKey, number>;

export const CATEGORIES: Record<CategoryKey, { label: string; max: number; color: string }> = {
  seo:            { label: 'SEO',            max: 15, color: '#3b82f6' },
  technique:      { label: 'Technique',      max: 15, color: '#0ea5e9' },
  performance:    { label: 'Performance',    max: 10, color: '#f59e0b' },
  contenu:        { label: 'Contenu',        max: 15, color: '#a855f7' },
  ux:             { label: 'UX',             max: 10, color: '#06b6d4' },
  accessibilite:  { label: 'Accessibilité',  max: 10, color: '#14b8a6' },
  contact:        { label: 'Contact',        max: 15, color: '#22c55e' },
  confiance:      { label: 'Confiance',      max: 10, color: '#ef4444' },
};

export interface ScanResult {
  name: string;
  url: string;
  grade: Grade;
  phone: string;
  email: string;
  score?: number;
  issues: string[];
  sector: string;
  durationMs: number;
  failed?: boolean;
  failReason?: string;
  categoryScores?: CategoryScores;
  categoryIssues?: Record<CategoryKey, string[]>;
}

export type ChecklistItems = Record<string, boolean>;

export interface ScanStats {
  urlsFound: number;
  sitesScanned: number;
  sitesSuccess: number;
  durationMs: number;
  grades: Record<string, number>;
}

export interface ScanResponse {
  results: ScanResult[];
  stats: ScanStats;
}

export interface ScanHistoryEntry {
  id: number;
  sector: string;
  region: string;
  mode: string;
  urlsFound: number;
  sitesScanned: number;
  sitesSuccess: number;
  durationMs: number;
  grades: Record<string, number>;
  env: string | null;
  createdAt: string;
}

export interface NoSiteResult {
  name: string;
  address: string;
  phone: string;
  email: string;
  source: string;
  hasWebsite: boolean;
  url: string;
  rating?: number;
  reviewCount?: number;
}

export interface Email {
  id: number;
  resendId: string;
  businessId: string;
  direction: "sent" | "received";
  from: string;
  to: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  status: string;
  createdAt: string;
}

export interface Reminder {
  id: number;
  businessId: string;
  dueDate: string;
  note: string;
  done: boolean;
  createdAt: string;
}

export interface Attachment {
  id: number;
  businessId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

export interface LogEntry {
  id: number;
  action: string;
  detail: string;
  businessId: string | null;
  createdAt: string;
}

export interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  body: string;
  createdAt: string;
}

export interface ReqResult {
  neq: string;
  name: string;
  activityCode: string;
  activityDesc: string;
  activityCode2: string;
  activityDesc2: string;
  employeeLabel: string;
  employeeBracket: string;
  formeJuridique: string;
  faillite: boolean;
  dateImmat: string;
  dateStatImmat: string;
  dateConstitution: string;
  lieuConstitution: string;
  objetSocial: string;
  anDeclaration: string;
  anProduction: string;
  address: string;
  city: string;
  postalCode: string;
  url?: string;
  phone?: string;
  email?: string;
}
