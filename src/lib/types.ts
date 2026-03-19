export type Status = "prospect" | "contacted" | "demo_sent" | "negotiating" | "closed_won" | "closed_lost";
export type Grade = "A" | "A-" | "B" | "B-" | "C" | "D";

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
}

export const STATUSES: Record<Status, { label: string; color: string }> = {
  prospect: { label: "Prospect", color: "#64748b" },
  contacted: { label: "Contacté", color: "#3b82f6" },
  demo_sent: { label: "Démo envoyée", color: "#a855f7" },
  negotiating: { label: "Négociation", color: "#f59e0b" },
  closed_won: { label: "Gagné ✓", color: "#22c55e" },
  closed_lost: { label: "Perdu", color: "#ef4444" },
};

export const GRADES: Record<Grade, { color: string; label: string }> = {
  A: { color: "#22c55e", label: "Excellent" },
  "A-": { color: "#4ade80", label: "Très bon" },
  B: { color: "#84cc16", label: "Bon" },
  "B-": { color: "#eab308", label: "Correct" },
  C: { color: "#f97316", label: "Faible" },
  D: { color: "#ef4444", label: "Très faible" },
};
