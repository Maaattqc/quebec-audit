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
  grade: string;
  phone: string;
  email: string;
  contacts: Contact[];
  status: string;
  notes: string;
  issues: string[];
  improvements: string[];
  estimatedValue: string;
  hasDemo: boolean;
  demoNotes: string;
  history: HistoryEntry[];
}

export const STATUSES: Record<string, { label: string; color: string }> = {
  prospect: { label: "Prospect", color: "#64748b" },
  contacted: { label: "Contacté", color: "#3b82f6" },
  demo_sent: { label: "Démo envoyée", color: "#a855f7" },
  negotiating: { label: "Négociation", color: "#f59e0b" },
  closed_won: { label: "Gagné ✓", color: "#22c55e" },
  closed_lost: { label: "Perdu", color: "#ef4444" },
};

export const GRADES: Record<string, { color: string; label: string }> = {
  A: { color: "#22c55e", label: "Excellent" },
  "A-": { color: "#4ade80", label: "Très bon" },
  B: { color: "#84cc16", label: "Bon" },
  "B-": { color: "#eab308", label: "Correct" },
  C: { color: "#f97316", label: "Faible" },
  D: { color: "#ef4444", label: "Très faible" },
};

export const INITIAL_BUSINESSES: Business[] = [
  {
    id: "lapointe",
    name: "Excavations Lapointe & Fils",
    url: "https://www.excavationslapointe.com/",
    sector: "Excavation",
    grade: "D",
    phone: "(418) 774-6457",
    email: "info@excavationslapointe.com",
    contacts: [
      { name: "Maxime Lapointe", role: "Contact", phone: "(418) 221-2822" },
      { name: "Mathieu Lapointe", role: "Contact", phone: "(418) 226-6735" },
    ],
    status: "prospect",
    notes: "",
    issues: [
      "Template générique Optilog/Construction411 — aucune identité de marque",
      "Vidéo hero = stock du template (dossier 'ParDefaut'), pas leurs chantiers",
      "1 seule image (carte d'affaires) — 0 photos de réalisations ou équipements",
      "Texte générique copié-collé, pas personnalisé",
      "Certains liens réseaux sociaux inactifs",
      "Aucun témoignage client",
      "Liste spécialités en majuscules brutes, mal structurée",
    ],
    improvements: [
      "Réutiliser leur vidéo MP4 dans un hero premium avec overlays",
      "Galerie de réalisations avant/après",
      "Section témoignages clients avec étoiles",
      "Services en liste interactive numérotée",
      "SEO local Saint-Georges / Beauce-Sartigan",
      "Formulaire de soumission avec type de projet",
      "FAQ avec accordion",
    ],
    estimatedValue: "2 500$ - 4 000$",
    hasDemo: true,
    demoNotes: "Redesign complet light mode — Bebas Neue + Libre Franklin, vidéo hero réutilisée, 13 sections",
    history: [],
  },
  {
    id: "renovation-chaudiere",
    name: "Rénovation de la Chaudière",
    url: "https://www.renovationdelachaudiere.com/",
    sector: "Entrepreneur général",
    grade: "C",
    phone: "(418) 230-6435",
    email: "info@renovationdelachaudiere.com",
    contacts: [{ name: "Propriétaire", role: "Contact", phone: "(418) 957-4402" }],
    status: "prospect",
    notes: "",
    issues: [
      "Design HTML statique par Stylla-web, vieillot",
      "A un logo et 2 images de chantier (01.jpg, 02.jpg) — à réutiliser",
      "Navigation multi-pages (7 services) mais aucune animation",
      "RBQ #5596-0074-01 affiché",
      "Pas de témoignages ou avis",
      "Galerie réalisations très limitée",
      "Pas de blog ou contenu SEO",
      "CTA peu visibles",
    ],
    improvements: [
      "Refonte moderne avec animations subtiles",
      "Galerie avant/après interactive",
      "Intégration Google Reviews",
      "Blog SEO rénovation en Beauce",
      "Badges confiance RBQ mis en évidence",
      "Chat ou WhatsApp pour contact rapide",
    ],
    estimatedValue: "2 000$ - 3 500$",
    hasDemo: false,
    demoNotes: "",
    history: [],
  },
  {
    id: "gl-electrique",
    name: "GL Électrique",
    url: "https://www.glelectrique.com/",
    sector: "Maître Électricien",
    grade: "B-",
    phone: "(418) 228-3665",
    email: "frederic.t@glelectrique.com",
    contacts: [
      { name: "Frédéric Talbot", role: "Propriétaire", phone: "(418) 228-3665" },
      { name: "Urgence St-Martin", role: "Urgence", phone: "(418) 222-2902" },
      { name: "Urgence St-Georges", role: "Urgence", phone: "(418) 226-5879" },
    ],
    status: "prospect",
    notes: "",
    issues: [
      "Site Duda (website builder) bien structuré mais limité",
      "Logos affiliations (CMEQ, CCQ, Hydro, RBQ) et fournisseurs — à garder",
      "Sections bornes EV, acéricole, chauffage existent déjà",
      "Numéros urgence soir/weekend affichés",
      "Pas de témoignages clients",
      "Pas de FAQ",
      "Section blog absente",
      "CTA peu visibles sur mobile",
    ],
    improvements: [
      "FAQ interactive avec accordion",
      "Section témoignages clients",
      "Bouton urgence 24h plus visible",
      "Blog SEO bornes de recharge, acéricole",
      "Calculateur coût borne EV en ligne",
      "Section acéricole améliorée",
    ],
    estimatedValue: "1 500$ - 2 500$",
    hasDemo: false,
    demoNotes: "",
    history: [],
  },
  {
    id: "bourque-electrique",
    name: "Bourque Électrique",
    url: "https://www.bourqueelectrique.com/",
    sector: "Électricien",
    grade: "B",
    phone: "(418) 228-5020",
    email: "annie@bourqueelectrique.com",
    contacts: [
      { name: "Annie", role: "Admin", phone: "(418) 228-5020" },
      { name: "Steeve Bourque", role: "Propriétaire", phone: "(418) 230-8777" },
    ],
    status: "prospect",
    notes: "",
    issues: [
      "Site WordPress récent par Ubéo — déjà bien fait",
      "A logo SVG, photos famille, 4 articles presse, accréditations CMEQ/CCQ/RBQ/APCHQ",
      "Pas de témoignages/avis",
      "Blog ou section conseils absente",
      "Page carrière peu engageante",
      "Manque de contenu vidéo",
      "Pas de FAQ",
    ],
    improvements: [
      "Section témoignages Google Reviews intégré",
      "FAQ interactive",
      "Blog SEO bornes EV, génératrices",
      "Vidéo corporative accueil",
      "Page carrière avec vidéos équipe",
    ],
    estimatedValue: "1 000$ - 2 000$",
    hasDemo: false,
    demoNotes: "",
    history: [],
  },
];

export function generateEmail(b: Business): string {
  return `Bonjour,\n\nJe me permets de vous contacter car j'ai analysé votre site web (${b.url}) et j'ai identifié des améliorations concrètes qui pourraient vous aider à attirer plus de clients.\n\nPoints observés :\n${b.issues.slice(0, 3).map((i) => `• ${i}`).join("\n")}\n\nSolutions proposées :\n${b.improvements.slice(0, 3).map((i) => `• ${i}`).join("\n")}\n\nInvestissement estimé : ${b.estimatedValue}\n${b.hasDemo ? "\nJ'ai préparé une maquette gratuite de votre nouveau site pour vous montrer le potentiel. Je peux vous l'envoyer par courriel ou vous la présenter en personne.\n" : ""}\nSeriez-vous disponible pour un appel de 15 minutes cette semaine ?\n\nCordialement,\n[Votre nom]\n[Votre téléphone]`;
}

export function generateSMS(b: Business): string {
  return `Bonjour! J'ai analysé votre site ${b.url} et trouvé des améliorations concrètes pour attirer plus de clients. ${b.hasDemo ? "J'ai même préparé une maquette gratuite! " : ""}Estimation: ${b.estimatedValue}. Intéressé? [Votre nom]`;
}

export function generateFollowUp(b: Business): string {
  return `Bonjour,\n\nJe fais suite à mon message précédent concernant votre site web. ${b.hasDemo ? "La maquette que j'ai préparée pour vous est toujours disponible — elle montre concrètement à quoi pourrait ressembler votre nouveau site.\n\n" : ""}Je comprends que vous êtes occupé, mais je crois vraiment que ces améliorations pourraient faire une différence pour votre entreprise.\n\nJe suis disponible quand ça vous convient.\n\nCordialement,\n[Votre nom]`;
}
