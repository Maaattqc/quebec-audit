# Standards de design et de code — Plateforme donnees Quebec

Ce document definit COMMENT construire chaque page de la plateforme. Le doc `architecture-projet.md` definit QUOI builder (structure de fichiers, composants, DB). Celui-ci definit les regles de design, les patterns de code, et les anti-patterns visuels.

---

## 1. Introduction et philosophie

La plateforme aura 100+ outils x 20+ villes = **2000+ pages**. Chaque page doit etre consistante, scalable, et generee a partir de templates — jamais du copy-paste.

### Principes fondamentaux

1. **Systematiser via templates** : un nouvel outil = 20-40 lignes de config, pas un composant 500 lignes
2. **Esthetique cible** : "Desjardins rencontre StatsCan" — credibilite institutionnelle + chaleur quebecoise
3. **Zero friction** : chaque page est un outil, pas une landing page. L'utilisateur entre des donnees, il recoit un resultat
4. **Anti-modele** : pages SaaS generiques IA avec violet, blobs abstraits, et glassmorphism

**Test ultime** : prendre un screenshot de la page. Est-ce que ca ressemble a un outil gouvernemental de confiance ou a une landing page SaaS generee par IA? Si SaaS → refaire.

---

## 2. Architecture des composants

### Hierarchie 4 niveaux

```
Niveau 1 — UI Primitive (shadcn/ui)
  Button, Card, Input, Select, Badge, Accordion, Table, Dialog...
  → Ne jamais modifier directement, utiliser les variants CVA

Niveau 2 — Section (composants reutilisables)
  ToolHero, ToolResult, ToolFAQ, ToolCTA, ToolRelated, CityStats
  → Composants partages entre tous les outils

Niveau 3 — Template (pages type)
  ToolPage, CityToolPage, PillarPage, BlogPage
  → Assemblent les sections dans un layout fixe

Niveau 4 — Layout (enveloppes)
  RootLayout, ToolLayout
  → Navigation, footer, providers, metadata
```

### Fichiers de reference (voir `architecture-projet.md`)

```
components/
├── ui/                    # Niveau 1 — shadcn/ui primitives
├── tools/
│   ├── tool-input.tsx     # Niveau 2 — Input generique (adresse, nom, secteur)
│   ├── tool-result-free.tsx
│   ├── tool-result-paid.tsx
│   ├── tool-cta.tsx       # CTA "Obtenir le rapport complet — 19.99$"
│   └── tool-layout.tsx    # Niveau 4 — Layout commun a tous les outils
├── maps/
│   ├── leaflet-map.tsx
│   └── map-markers.tsx
└── layout/
    ├── navbar.tsx
    └── footer.tsx
```

### Template ToolPage — interface de configuration

Chaque outil est defini par un objet de configuration, pas un composant custom :

```typescript
interface ToolConfig {
  // Identite
  toolSlug: string;            // "verifier-entrepreneur"
  toolName: string;            // "ContractorCheck"
  toolTitle: string;           // "Verifier un entrepreneur"
  toolDescription: string;     // Description pour meta + hero

  // Input
  inputType: "address" | "name" | "licence" | "sector" | "postal-code";
  inputPlaceholder: string;    // "Entrez un nom ou numero de licence RBQ"

  // Resultat
  freeResultComponent: React.ComponentType<{ data: unknown }>;
  paidFeatures: string[];      // ["Historique complet", "Score de fiabilite", ...]

  // FAQ
  faqItems: { question: string; answer: string }[];

  // Navigation
  relatedTools: string[];      // ["zone-inondable", "permis-construction"]
  category: string;            // "entrepreneurs" (pour la page pilier)

  // Monetisation
  price: number;               // 19.99
  priceLabel: string;          // "Rapport complet"

  // SEO
  metaData: {
    titleTemplate: string;     // "Verifier un entrepreneur a {ville} | DonneesQuebec"
    descriptionTemplate: string;
    keywords: string[];
  };
}
```

### Template CityToolPage

Wrap `ToolPage` avec les donnees de la ville :

```typescript
interface CityToolConfig extends ToolConfig {
  citySlug: string;            // "quebec"
  cityName: string;            // "Quebec"
  cityStats: CityStats;        // Donnees locales specifiques
  localFAQ: { question: string; answer: string }[];  // FAQ ville-specifique
}

// Genere les 20+ pages par ville au build time
export async function generateStaticParams() {
  const villes = await getAllVilles();
  return villes.map(v => ({ ville: v.slug }));
}
```

### Regle : config minimale, pas de composant geant

**MAUVAIS** — 2000 fichiers JSX avec du code duplique :

```
app/verifier-entrepreneur/page.tsx     (500 lignes)
app/zone-inondable/page.tsx            (480 lignes)
app/terrain-contamine/page.tsx         (520 lignes)
... x 100 outils
```

**BON** — 1 config par outil + 1 template qui le consomme :

```
lib/tools/verifier-entrepreneur.ts     (30 lignes de config)
lib/tools/zone-inondable.ts            (30 lignes de config)
lib/tools/terrain-contamine.ts         (30 lignes de config)
app/[tool]/page.tsx                    (ToolPage template)
app/[tool]/[ville]/page.tsx            (CityToolPage template)
```

### Table de decisions : composant vs reutilisation

| Situation | Action |
|---|---|
| Meme section utilisee par 3+ outils | Creer un composant Section (niveau 2) |
| Section unique a un seul outil | Slot/children dans le ToolPage template |
| Variation mineure (couleur, texte) | Variant CVA ou prop sur le composant existant |
| Logique metier differente | Nouveau `freeResultComponent` dans la config |
| Layout completement different | Nouveau template (niveau 3) — rare, a justifier |

### Pattern slot/children

Le template ToolPage utilise des slots pour injecter le contenu specifique a chaque outil dans le layout fixe :

```tsx
// components/tools/tool-layout.tsx
export function ToolLayout({ children, config }: { children: React.ReactNode; config: ToolConfig }) {
  return (
    <main>
      <Breadcrumb tool={config} />
      <ToolHero config={config} />
      {children}  {/* ← Resultat specifique a l'outil */}
      <ToolCTA config={config} />
      <ToolFAQ items={config.faqItems} />
      <ToolRelated tools={config.relatedTools} />
      <FooterVilles tool={config.toolSlug} />
    </main>
  );
}
```

---

## 3. Design system tokens

### Palette de couleurs

Les tokens sont definis dans `src/index.css` et doivent etre utilises via les classes Tailwind semantiques.

#### Couleurs primaires (gold)

| Token | Valeur (light) | Valeur (dark) | Usage |
|---|---|---|---|
| `--primary` | `hsl(36 80% 46%)` | `hsl(38 75% 50%)` | Boutons principaux, accents, liens actifs |
| `--gold-light` | `#f5d478` | — | Highlights, hover subtil |
| `--gold` | `#c9952b` | — | Reference visuelle, icones |
| `--gold-dark` | `#8b6914` | — | **Texte sur fond clair** (contraste suffisant) |
| `--gold-gradient` | `linear-gradient(135deg, ...)` | Variante sombre | Boutons CTA, badges premium |

#### Couleurs neutres (warm)

| Token | Light HSL | Dark HSL | Classe Tailwind |
|---|---|---|---|
| `--background` | `35 25% 96%` | `25 12% 8%` | `bg-background` |
| `--foreground` | `25 15% 10%` | `38 20% 90%` | `text-foreground` |
| `--card` | `38 30% 99%` | `25 10% 11%` | `bg-card` |
| `--muted` | `34 16% 93%` | `25 8% 14%` | `bg-muted` |
| `--muted-foreground` | `28 10% 42%` | `30 8% 50%` | `text-muted-foreground` |
| `--border` | `34 18% 88%` | `25 10% 18%` | `border-border` |
| `--input` | `34 16% 85%` | `25 8% 20%` | `border-input` |

#### Couleurs fonctionnelles

| Usage | Couleur | Classe |
|---|---|---|
| Succes / Valide | `#22c55e` (green-500) | `text-green-500`, `bg-green-500` |
| Avertissement | `#f59e0b` (amber-500) | `text-amber-500`, `bg-amber-500` |
| Erreur / Danger | `#ef4444` (red-500) | `text-red-500`, `bg-red-500` |
| Info | `#3b82f6` (blue-500) | `text-blue-500`, `bg-blue-500` |

#### Couleurs INTERDITES

| Couleur | Hex exemples | Pourquoi c'est interdit |
|---|---|---|
| Violet/purple comme primary ou accent | `#7c3aed`, `#a855f7`, `#8b5cf6`, `#6d28d9` | Look IA generique, SaaS template |
| Neon / saturees | `#00ff00`, `#ff00ff`, `#00ffff` | Manque de professionnalisme |
| Hot pink | `#ec4899`, `#f472b6` | Hors palette |
| Pastel rainbow | Combinaisons multi-couleurs pastel | Esthetique Notion/Linear clone |

> **Exception** : le CRM interne (`beauce-audit`) utilise `#a855f7` pour le status `demo_sent`. C'est acceptable en interne seulement — jamais sur les pages publiques de la plateforme.

### Typographie

**Police** : Plus Jakarta Sans (deja configuree dans `index.css`)

| Element | Classe Tailwind | Poids | Usage |
|---|---|---|---|
| H1 page | `text-4xl font-bold` | 700 | 1 seul par page, titre principal |
| H2 section | `text-2xl font-semibold` | 600 | Titres de sections majeures |
| H3 sous-section | `text-xl font-semibold` | 600 | Sous-titres, titres de cards |
| Body | `text-base font-normal` | 400 | Texte courant |
| Secondary | `text-sm text-muted-foreground` | 400 | Labels, descriptions secondaires |
| Caption | `text-xs text-muted-foreground` | 400 | Timestamps, metadata |

**Regles typographiques** :
- **Jamais** `text-5xl` ou plus grand sur les pages outils — c'est un outil, pas une landing page
- **Jamais** de gradient text sur les headings — `text-foreground` solide partout
- Gold sur texte seulement pour les CTA (`text-primary` sur boutons)
- Poids charges : 400 (normal), 500 (medium), 600 (semibold), 700 (bold) — pas de 100/200/300/800/900

### Espacement

Suivre le systeme Tailwind (base 4px). Ne jamais utiliser de valeurs arbitraires (`px-[13px]`).

| Contexte | Classe | Valeur |
|---|---|---|
| Padding interne cards | `p-4` | 16px |
| Padding sections | `p-6` | 24px |
| Gap entre elements | `gap-4` | 16px |
| Gap entre cards dans grids | `gap-6` | 24px |
| Espace entre sections majeures | `space-y-12` | 48px |
| Espace entre sous-sections | `space-y-6` | 24px |
| Padding page (mobile) | `px-4` | 16px |
| Padding page (desktop) | `px-6` ou `max-w-7xl mx-auto` | 24px ou centre |

**Regle** : jamais de `px-[17px]`, `mt-[23px]`, ou autres valeurs arbitraires. Si le systeme Tailwind ne couvre pas le besoin, c'est que le design est trop precis.

### Bordures et ombres

| Element | Classe | Usage |
|---|---|---|
| Cards | `rounded-lg` | Border radius standard |
| Inputs | `rounded-md` | Legererement plus petit que les cards |
| Badges | `rounded-sm` ou `rounded-full` | Selon le type |
| Boutons | `rounded-md` | Coherent avec les inputs |

**Ombres** — maximum 3 niveaux :

| Niveau | Classe | Usage |
|---|---|---|
| Subtile | `shadow-sm` | Cards au repos, badges |
| Standard | `shadow` | Cards hover, dropdowns |
| Forte | `shadow-lg` | Modals, popovers |

**Regle** : flat + subtil. Pas de `shadow-2xl`, pas de glow excessifs, pas de `ring-4`.

### Dark mode

Le dark mode est **supporte** sur chaque page mais le **light mode est le defaut**. Configuration : `darkMode: ["class"]` dans Tailwind.

**Mode par defaut** : light. L'utilisateur peut activer le dark mode via un toggle dans la navbar. Au premier chargement, la page est toujours en light mode (pas de detection `prefers-color-scheme` automatique). Le choix de l'utilisateur est persiste dans `localStorage`.

```tsx
// Toggle dark mode — composant navbar
function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <button onClick={() => setDark(!dark)} aria-label="Changer le theme">
      {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
```

Chaque variable CSS dans `index.css` a deja ses valeurs light et dark. Utiliser les classes semantiques (`bg-background`, `text-foreground`, `bg-card`, etc.) garantit le dark mode automatiquement.

**Regles dark mode** :
- **Light mode = defaut**, dark mode = opt-in via toggle
- Ne jamais hardcoder `bg-white` ou `bg-black` — utiliser `bg-background`
- Ne jamais hardcoder `text-gray-900` — utiliser `text-foreground`
- Tester chaque composant en dark mode avant merge
- Les gradients gold ont deja leurs variantes dark dans `index.css`
- Le toggle dark/light doit etre accessible sur **toutes les pages** (dans la navbar globale)

---

## 4. Anti-patterns — "Pas de look IA"

### Tableau INTERDIT / ALTERNATIVE

| Pattern INTERDIT | Alternative REQUISE | Pourquoi |
|---|---|---|
| Violet/purple comme primary | Gold/amber (`--primary`) | Le violet est devenu le cliche #1 des SaaS IA |
| Blobs abstraits en hero | Vrai input avec exemple concret | On est un outil, pas une landing page |
| Glassmorphism (`backdrop-blur`, `bg-white/10`) | Fonds solides + bordures subtiles (`bg-card`, `border`) | Tendance deja passee, illisible en plein soleil |
| Rounded excessifs (`rounded-3xl`, `rounded-full` sur cards) | `rounded-lg` standard | Esthetique "app for kids" |
| Emoji dans l'UI (🚀 📊 ✨) | Icones Lucide coherentes | Les emoji varient entre OS, pas professionnel |
| Stock photo laptop/coffee | Aucune photo OU landmarks Quebec (Chateau Frontenac, etc.) | Les stock photos crient "template" |
| "Get Started Free" / "Unlock the power" | "Verifier maintenant" / "Obtenir le rapport" — factuel | Growth-hacking ≠ credibilite institutionnelle |
| Confetti / celebrations / particules | Animation `float-in` subtile (deja dans `index.css`) | Infantilisant |
| Gradient text sur headings | `text-foreground` solide, gold seulement sur boutons CTA | Illisible, SaaS generique |
| Hero plein ecran avec 3 lignes de texte | Hero compact avec input fonctionnel | Gaspillage d'espace, pas un outil |
| Dark mode "fancy" (Mapbox dark tiles, glow neon) | Leaflet + OSM standard, couleurs attenuees | On veut fiable, pas cool |
| Charts rainbow (6+ couleurs) | Charts simples bar/line, 2-3 couleurs max | Lisibilite > esthetique |
| Testimonials carousels | Donnees reelles et stats | Les faux temoignages n'inspirent pas confiance |

### Elements REQUIS sur chaque page outil

1. **Hero = vrai input** : pas un message marketing. L'utilisateur doit pouvoir entrer ses donnees immediatement
2. **Cartes = Leaflet + OpenStreetMap** : tiles standard, pas de Mapbox dark-mode fancy. Upgrade prevu quand revenue > 3K$/mois (ref: `tech-stack.md`)
3. **Charts = simples** : bar charts ou line charts, 2-3 couleurs maximum, labels lisibles
4. **Tables = composant de base** : pour les donnees tabulaires, utiliser le composant Table de shadcn/ui — pas de cards fancy pour des donnees qui sont naturellement tabulaires
5. **Breadcrumbs** : sur chaque page, format `Accueil > Categorie > Outil > Ville`
6. **FAQ** : accordion en bas de page, minimum 5 questions (ref: `seo-strategy.md` section FAQPage)

### Test "screenshot"

Avant chaque merge, prendre un screenshot de la page et se demander :

> "Est-ce que ca ressemble a un outil de donnees gouvernemental digne de confiance, ou a une landing page SaaS?"

Si la reponse est "SaaS" → refaire le design. On vise le territoire entre Statistique Canada et Desjardins : professionnel, credible, chaleureux, utile.

---

## 5. Composant vs inline — regle definitive

### Regles absolues

1. **JAMAIS `style={{}}`** sauf pour des valeurs dynamiques calculees a partir de donnees :

```tsx
// ACCEPTE — couleur basee sur une donnee dynamique
<span style={{ color: gradeColor(business.grade) }}>A+</span>

// INTERDIT — styling statique en inline
<div style={{ backgroundColor: '#f5f5f5', padding: '16px', borderRadius: '8px' }}>
```

2. **JAMAIS `className="bg-[#hex]"`** (valeurs arbitraires Tailwind) — utiliser les semantic tokens :

```tsx
// INTERDIT
<div className="bg-[#c9952b] text-[#1a1a1a]">

// REQUIS
<div className="bg-primary text-foreground">
```

3. **Tout via Tailwind classes + CVA variants** : le styling est dans les classes, pas dans le JSX

### Pattern CVA (class-variance-authority)

Ref: `src/components/ui/button.tsx` — pattern a suivre pour tout composant avec variants.

```typescript
import { cva, type VariantProps } from "class-variance-authority";

// Definir les variants
const badgeVariants = cva(
  // Classes de base (toujours appliquees)
  "inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        success: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        warning: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
        danger: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
        info: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);
```

**Quand creer un variant CVA** :
- Le meme style est repete 3+ fois dans le codebase
- Un composant a 2+ etats visuels distincts (default, success, error...)
- On veut pouvoir changer l'apparence via une prop sans toucher aux classes

**Quand NE PAS creer un variant** :
- Style utilise 1-2 fois → classes Tailwind directes
- Difference uniquement de contenu (texte, icone) → props normales

### Pour 2000 pages : config > composant

**MAUVAIS** — chaque outil est un composant JSX de 500 lignes :

```tsx
// app/verifier-entrepreneur/page.tsx (500 lignes)
export default function VerifierEntrepreneur() {
  return (
    <main className="max-w-7xl mx-auto px-6">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        {/* Breadcrumb copie-colle */}
      </nav>
      <h1 className="text-4xl font-bold mb-4">Verifier un entrepreneur</h1>
      {/* ... 450 lignes de plus, copiees dans chaque outil */}
    </main>
  );
}
```

**BON** — 1 objet config + le template qui le consomme :

```typescript
// lib/tools/verifier-entrepreneur.ts
import { ContractorResult } from "@/components/tools/results/contractor-result";

export const verifierEntrepreneur: ToolConfig = {
  toolSlug: "verifier-entrepreneur",
  toolName: "ContractorCheck",
  toolTitle: "Verifier un entrepreneur",
  toolDescription: "Verifiez la licence RBQ, les plaintes et l'historique d'un entrepreneur.",
  inputType: "name",
  inputPlaceholder: "Nom ou numero de licence RBQ",
  freeResultComponent: ContractorResult,
  paidFeatures: ["Historique complet RBQ", "Plaintes deposees", "Score de fiabilite"],
  faqItems: [
    { question: "Comment verifier une licence RBQ?", answer: "..." },
    // ...
  ],
  relatedTools: ["permis-construction", "renovation-prix"],
  category: "entrepreneurs",
  price: 19.99,
  priceLabel: "Rapport complet",
  metaData: {
    titleTemplate: "Verifier un entrepreneur a {ville} | DonneesQuebec",
    descriptionTemplate: "Verifiez la licence RBQ d'un entrepreneur a {ville}. Resultat instantane.",
    keywords: ["verifier entrepreneur", "licence RBQ", "plaintes entrepreneur"],
  },
};
```

```tsx
// app/[tool]/page.tsx — template unique pour tous les outils
import { getToolConfig } from "@/lib/tools/registry";
import { ToolLayout } from "@/components/tools/tool-layout";

export default async function ToolPage({ params }: { params: { tool: string } }) {
  const config = getToolConfig(params.tool);
  if (!config) notFound();

  return (
    <ToolLayout config={config}>
      <config.freeResultComponent data={null} />
    </ToolLayout>
  );
}
```

---

## 6. Structure des templates de pages

### ToolPage — wireframe

```
┌──────────────────────────────────────────────────────┐
│  Accueil > Entrepreneurs > ContractorCheck           │  ← Breadcrumb
├──────────────────────────────────────────────────────┤
│                                                      │
│  Verifier un entrepreneur au Quebec                  │  ← H1 (text-4xl bold)
│  Verifiez la licence RBQ et l'historique.            │  ← Description (text-muted)
│                                                      │
│  ┌──────────────────────────────────────────┐       │
│  │  🔍 Entrez un nom ou numero de licence   │       │  ← Input hero (le coeur)
│  └──────────────────────────────────────────┘       │
│  [ Verifier maintenant ]                             │  ← Bouton primary (gold)
│                                                      │
├──────────────────────────────────────────────────────┤
│                                                      │
│  RESULTAT GRATUIT                                    │  ← Section resultat libre
│  ┌─────────────────────────────────────────────┐    │
│  │  Licence: VALIDE ✓                          │    │
│  │  Specialites: Electrique, Plomberie         │    │
│  │  Region: Chaudiere-Appalaches               │    │
│  └─────────────────────────────────────────────┘    │
│                                                      │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌─────────────────────────────────────────────┐    │
│  │  RAPPORT COMPLET — 19.99$          [ OR ]   │    │  ← CTA payant (card gold border)
│  │                                             │    │
│  │  ✓ Historique complet RBQ                   │    │
│  │  ✓ Plaintes deposees                        │    │
│  │  ✓ Score de fiabilite                       │    │
│  │  ✓ Rapport PDF telechargeable               │    │
│  │                                             │    │
│  │  [ Obtenir le rapport ]                     │    │
│  └─────────────────────────────────────────────┘    │
│                                                      │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Questions frequentes                                │  ← FAQ accordion
│  ▸ Comment verifier une licence RBQ?                 │
│  ▸ Que faire si l'entrepreneur n'a pas de licence?   │
│  ▸ Combien coute le rapport complet?                 │
│  ▸ Les donnees sont-elles a jour?                    │
│  ▸ ...                                               │
│                                                      │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Outils lies                                         │  ← Grid 3 colonnes
│  ┌──────┐ ┌──────┐ ┌──────┐                         │
│  │Permis│ │Reno  │ │Zonage│                         │
│  │Constr│ │Prix  │ │Expres│                         │
│  └──────┘ └──────┘ └──────┘                         │
│                                                      │
├──────────────────────────────────────────────────────┤
│  Disponible a : Quebec | Montreal | Sherbrooke | ... │  ← Footer villes
└──────────────────────────────────────────────────────┘
```

### CityToolPage

Meme structure que ToolPage, avec :
- Ville dans le H1 : "Verifier un entrepreneur **a Quebec**"
- Ville dans le breadcrumb : `Accueil > Entrepreneurs > ContractorCheck > Quebec`
- Ville dans les meta tags (`generateMetadata`)
- Section stats locales inseree apres le resultat gratuit
- FAQ ville-specifique ajoutee apres la FAQ generale
- Liens vers les autres villes dans le footer

```tsx
// Metadata dynamique par ville
export async function generateMetadata({ params }: { params: { tool: string; ville: string } }) {
  const config = getToolConfig(params.tool);
  const ville = getVille(params.ville);

  return {
    title: config.metaData.titleTemplate.replace("{ville}", ville.name),
    description: config.metaData.descriptionTemplate.replace("{ville}", ville.name),
  };
}
```

### PillarPage (page pilier)

```
┌──────────────────────────────────────────────────────┐
│  Accueil > Immobilier                                │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Outils immobiliers — Quebec                         │  ← H1
│  Tous les outils pour vos decisions immobilieres.    │
│                                                      │
│  [Introduction editoriale — 150-200 mots]            │  ← Texte SEO
│                                                      │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Nos outils                                          │  ← Grid outils (cards)
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐               │
│  │Flood │ │Terra │ │Zona  │ │Prop  │               │
│  │Check │ │Check │ │ge    │ │Tech  │               │
│  └──────┘ └──────┘ └──────┘ └──────┘               │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐               │
│  │Bati  │ │Immo  │ │Climat│ │Insure│               │
│  │Scan  │ │Tax   │ │Risk  │ │Score │               │
│  └──────┘ └──────┘ └──────┘ └──────┘               │
│                                                      │
├──────────────────────────────────────────────────────┤
│  Articles populaires                                 │  ← 3-5 articles blog lies
│  • "5 choses a verifier avant d'acheter un terrain"  │
│  • "Zones inondables au Quebec : carte interactive"  │
│  • "Comment lire votre evaluation fonciere"          │
│                                                      │
├──────────────────────────────────────────────────────┤
│  Disponible par ville                                │  ← Grid villes
│  Quebec | Montreal | Sherbrooke | Levis | ...        │
└──────────────────────────────────────────────────────┘
```

### BlogPage

```
┌──────────────────────────────────────────────────────┐
│  Accueil > Blog > Comment verifier un entrepreneur   │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌────────────────────────┐ ┌──────────────────┐    │
│  │                        │ │                  │    │
│  │  [Contenu MDX]         │ │  SIDEBAR         │    │
│  │  prose, 800-1500 mots  │ │                  │    │
│  │                        │ │  CTA outil       │    │
│  │                        │ │  ┌────────────┐  │    │
│  │                        │ │  │ Verifier   │  │    │
│  │                        │ │  │ maintenant │  │    │
│  │                        │ │  └────────────┘  │    │
│  │                        │ │                  │    │
│  │                        │ │  Articles lies   │    │
│  │                        │ │  • Article 1     │    │
│  │                        │ │  • Article 2     │    │
│  │                        │ │  • Article 3     │    │
│  │                        │ │                  │    │
│  └────────────────────────┘ └──────────────────┘    │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## 7. Patterns de code

### Nommage de fichiers

| Type | Convention | Exemple |
|---|---|---|
| Composant React | `kebab-case.tsx` | `tool-input.tsx`, `leaflet-map.tsx` |
| Config/utilitaire | `kebab-case.ts` | `verifier-entrepreneur.ts`, `metadata.ts` |
| Types | `kebab-case.ts` ou dans le fichier composant | `types.ts` |
| Page Next.js | `page.tsx` (convention App Router) | `app/[tool]/page.tsx` |
| Layout Next.js | `layout.tsx` | `app/layout.tsx` |
| API Route | `route.ts` | `app/api/stripe/checkout/route.ts` |

### Ordre des imports

```typescript
// 1. External packages
import { notFound } from "next/navigation";
import { Suspense } from "react";

// 2. Internal lib (@/lib)
import { getToolConfig } from "@/lib/tools/registry";
import { cn } from "@/lib/utils";

// 3. Components (@/components)
import { Button } from "@/components/ui/button";
import { ToolLayout } from "@/components/tools/tool-layout";

// 4. Types (si separes)
import type { ToolConfig } from "@/lib/tools/types";
```

### Structure d'un composant

```typescript
// 1. Types et interfaces
interface ToolHeroProps {
  config: ToolConfig;
  onSubmit: (value: string) => void;
}

// 2. Constantes
const INPUT_PLACEHOLDERS: Record<string, string> = {
  address: "Entrez une adresse",
  name: "Entrez un nom",
};

// 3. Composant (function declaration)
export function ToolHero({ config, onSubmit }: ToolHeroProps) {
  // hooks
  const [value, setValue] = useState("");

  // handlers
  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit(value);
  }

  // render
  return (
    <section className="space-y-4">
      {/* ... */}
    </section>
  );
}
```

**Regles** :
- Named exports partout sauf `page.tsx` et `layout.tsx` (export default requis par Next.js)
- Un composant par fichier sauf pour les petits sous-composants prives
- Pas de `export default` sur les composants reutilisables

### Data fetching Next.js

```typescript
// Generer les pages statiques au build time
export async function generateStaticParams() {
  const tools = getAllTools();
  return tools.map(t => ({ tool: t.slug }));
}

// Metadata dynamique par page
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const config = getToolConfig(params.tool);
  return {
    title: config.metaData.titleTemplate,
    description: config.metaData.descriptionTemplate,
  };
}

// ISR — revalidation toutes les 24h
export const revalidate = 86400;
```

**Regles de data fetching** :
- Server components par defaut — `"use client"` seulement pour les composants interactifs (inputs, formulaires, cartes)
- `generateStaticParams()` pour les routes dynamiques (`[tool]`, `[ville]`)
- `generateMetadata()` pour les meta tags dynamiques
- ISR avec `revalidate = 86400` (24h) pour les pages qui utilisent des donnees live
- Pas de `useEffect` + `fetch` pour les donnees qui peuvent etre chargees cote serveur

### Ajouter un outil en 7 etapes

1. **Creer la config** : `lib/tools/mon-outil.ts` — objet `ToolConfig` (~30 lignes)
2. **Creer le composant resultat** : `components/tools/results/mon-outil-result.tsx` — affichage du resultat gratuit
3. **Creer la page outil** : `app/mon-outil/page.tsx` — importe la config + utilise `ToolLayout`
4. **Creer les pages ville** : `app/mon-outil/[ville]/page.tsx` — avec `generateStaticParams()`
5. **Ajouter au registre** : `lib/tools/registry.ts` — ajouter la config dans le map
6. **Ajouter a la page pilier** : `app/[categorie]/page.tsx` — ajouter le tool dans la grid
7. **Creer la route API** (si besoin) : `app/api/data/[dataset]/route.ts`
8. **Verifier** : `npm run build` pour confirmer que tout compile

---

## 8. Accessibilite

### Standard minimum : WCAG 2.1 AA

Chaque page doit respecter les criteres d'accessibilite WCAG 2.1 niveau AA.

### Contraste des couleurs

Le gold primary `#c9952b` sur fond blanc a un ratio de contraste de **3.2:1** — c'est **insuffisant** pour du texte (minimum 4.5:1 pour AA).

| Paire | Ratio | Verdict | Usage |
|---|---|---|---|
| `#c9952b` (gold) sur `#fff` | 3.2:1 | FAIL texte | Boutons seulement (texte blanc sur gold = OK car large) |
| `#8b6914` (gold-dark) sur `#fff` | 5.1:1 | PASS AA | Texte gold sur fond clair |
| `#f5d478` (gold-light) sur `#1a1a1a` | 9.4:1 | PASS AAA | Texte gold en dark mode |
| `text-foreground` sur `bg-background` | 14.5:1+ | PASS AAA | Texte standard (les deux modes) |
| `text-muted-foreground` sur `bg-background` | 5.8:1 | PASS AA | Texte secondaire |

**Regles de contraste** :
- Texte small (`text-sm`, `text-xs`) : ratio minimum 4.5:1
- Texte large (`text-xl`+, `font-bold`) : ratio minimum 3:1
- Elements interactifs (bordures, icones) : ratio minimum 3:1
- Utiliser `--gold-dark` (#8b6914) pour tout texte gold sur fond clair
- Ne jamais utiliser `--gold-light` (#f5d478) comme texte sur fond clair

### HTML semantique

```html
<!-- Structure de page requise -->
<header>
  <nav aria-label="Navigation principale">...</nav>
</header>

<main>
  <nav aria-label="Fil d'Ariane">
    <!-- Breadcrumbs -->
  </nav>

  <h1>Verifier un entrepreneur a Quebec</h1>

  <section aria-label="Recherche">
    <form>
      <label for="search-input">Nom ou numero de licence</label>
      <input id="search-input" ... />
    </form>
  </section>

  <section aria-label="Resultat">...</section>
  <section aria-label="Questions frequentes">...</section>
  <aside aria-label="Outils lies">...</aside>
</main>

<footer>...</footer>
```

**Regles HTML** :
- **1 seul `<h1>` par page** — le titre principal de l'outil/article
- **Hierarchie stricte** : `h1` → `h2` → `h3`, jamais sauter un niveau (pas de h1 → h3)
- **Landmarks** : `<main>`, `<nav>`, `<aside>`, `<footer>` — chaque section a un role
- **Labels** : tous les inputs ont un `<label>` associe (via `htmlFor` ou wrapper)
- **Formulaires** : chaque `<form>` a une action claire, les erreurs sont annoncees

### Navigation clavier

- **Tab** : navigation sequentielle a travers les elements interactifs
- **Escape** : ferme les modals, popovers, dropdowns
- **Enter/Space** : active les boutons et liens (Radix UI gere automatiquement)
- **Fleches** : navigation dans les accordions, selects, tabs (Radix UI gere)

**Regles clavier** :
- Tout element cliquable doit etre focusable (pas de `div onClick` sans `tabIndex`)
- L'ordre de focus doit suivre l'ordre visuel (pas de `tabIndex` > 0)
- Le focus ring gold est deja configure dans `index.css` (`box-shadow: 0 0 0 2px hsl(36 80% 46% / 0.3)`)

### Screen readers

```tsx
// Icones decoratives — cachees des lecteurs d'ecran
<MapPin className="h-4 w-4" aria-hidden="true" />

// Icones-boutons — label obligatoire
<button aria-label="Fermer le modal">
  <X className="h-4 w-4" aria-hidden="true" />
</button>

// Resultats dynamiques — annonces aux lecteurs d'ecran
<div aria-live="polite" aria-atomic="true">
  {result && <p>Licence trouvee : {result.status}</p>}
</div>

// Status badges — texte lisible
<Badge variant="success">
  <span className="sr-only">Statut : </span>Valide
</Badge>
```

**Regles screen readers** :
- `aria-hidden="true"` sur toutes les icones decoratives
- `aria-label` sur les boutons qui contiennent seulement une icone
- `aria-live="polite"` sur les zones de resultats dynamiques (apres une recherche)
- Texte `sr-only` pour donner du contexte invisible aux badges et statuts

---

## 9. Responsive design — mobile, desktop, TV

Chaque page doit etre parfaitement utilisable sur **tous les ecrans** : telephone (320px), tablette (768px), laptop (1024px), desktop (1440px), et grand ecran/TV (1920px+).

### Breakpoints Tailwind

| Prefix | Min-width | Cible |
|---|---|---|
| (default) | 0px | Mobile first — styles de base |
| `sm:` | 640px | Grands telephones / petit paysage |
| `md:` | 768px | Tablettes |
| `lg:` | 1024px | Laptops |
| `xl:` | 1280px | Desktops |
| `2xl:` | 1536px | Grands ecrans, TV |

### Approche mobile-first obligatoire

Ecrire les styles pour mobile d'abord, puis ajouter les breakpoints pour les ecrans plus grands. **Jamais l'inverse.**

```tsx
// BON — mobile first
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">

// INTERDIT — desktop first avec override mobile
<div className="grid grid-cols-4 sm:grid-cols-1">
```

### Regles par type de page

#### ToolPage

```tsx
// Hero input : pleine largeur mobile, centree desktop
<section className="w-full max-w-2xl mx-auto px-4 md:px-0">
  <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">...</h1>
  <form className="flex flex-col sm:flex-row gap-3">
    <Input className="flex-1" />
    <Button className="w-full sm:w-auto">Verifier</Button>
  </form>
</section>

// Resultat : stack vertical mobile, layout plus aere desktop
<section className="px-4 md:px-6 lg:px-0 max-w-5xl mx-auto">
  ...
</section>
```

#### Grids de cards (outils, villes)

```tsx
// 1 colonne mobile → 2 tablette → 3 laptop → 4 desktop
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
  {tools.map(tool => <ToolCard key={tool.slug} tool={tool} />)}
</div>
```

#### BlogPage (contenu + sidebar)

```tsx
// Sidebar en dessous sur mobile, a droite sur desktop
<div className="flex flex-col lg:flex-row gap-8">
  <article className="flex-1 min-w-0">
    {/* Contenu MDX */}
  </article>
  <aside className="w-full lg:w-80 lg:shrink-0">
    {/* CTA outil + articles lies */}
  </aside>
</div>
```

#### Tables de donnees

```tsx
// Tables : scroll horizontal sur mobile, full width desktop
<div className="overflow-x-auto -mx-4 md:mx-0">
  <Table className="min-w-[600px] md:min-w-0">
    ...
  </Table>
</div>

// OU pour les tables simples : transformer en cards sur mobile
<div className="hidden md:block">
  <Table>...</Table>
</div>
<div className="md:hidden space-y-3">
  {data.map(row => <MobileCard key={row.id} data={row} />)}
</div>
```

#### Cartes Leaflet

```tsx
// Hauteur responsive
<div className="h-64 sm:h-80 md:h-96 lg:h-[500px] rounded-lg overflow-hidden">
  <LeafletMap />
</div>
```

### Conteneur principal

```tsx
// Layout global — centree avec padding adaptatif
<main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  {children}
</main>
```

**Regles du conteneur** :
- `max-w-7xl` (1280px) pour le contenu principal — pas plus large
- `px-4` mobile, `sm:px-6` tablette, `lg:px-8` desktop
- Sur TV/grand ecran (2xl+) : le contenu reste centre a 1280px max, le fond s'etend

### Typographie responsive

```tsx
// H1 : plus petit sur mobile
<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">

// H2 : ajustement subtil
<h2 className="text-xl md:text-2xl font-semibold">

// Body : taille fixe (lisible partout)
<p className="text-base">
```

**Regle** : `text-base` (16px) est la taille minimale de body text partout — jamais de `text-sm` pour du contenu principal sur mobile. `text-sm` est reserve aux labels et metadata.

### Touch targets mobile

- Taille minimale des boutons et liens : **44x44px** (WCAG 2.5.5)
- Sur mobile, les boutons prennent la pleine largeur : `w-full sm:w-auto`
- Espacement entre les elements cliquables : minimum `gap-3` (12px)

```tsx
// Bouton : pleine largeur mobile, auto desktop
<Button className="w-full sm:w-auto h-11">Verifier maintenant</Button>

// Liste de liens : espacement suffisant pour le touch
<nav className="flex flex-col sm:flex-row gap-3 sm:gap-4">
  {links.map(link => (
    <a key={link.href} className="py-3 sm:py-0">{link.label}</a>
  ))}
</nav>
```

### Navigation responsive

```tsx
// Navbar : hamburger mobile, liens visibles desktop
<header>
  <nav className="flex items-center justify-between h-14 md:h-16 px-4 md:px-6">
    <Logo />
    {/* Desktop nav */}
    <div className="hidden md:flex items-center gap-6">
      <NavLinks />
    </div>
    {/* Mobile hamburger */}
    <button className="md:hidden" aria-label="Menu">
      <Menu className="h-6 w-6" />
    </button>
  </nav>
</header>
```

### Grand ecran / TV (2xl+)

Sur les tres grands ecrans, le contenu ne doit pas s'etirer indefiniment :
- Le conteneur principal reste a `max-w-7xl` (1280px)
- Les grids peuvent passer a 4-5 colonnes : `2xl:grid-cols-5`
- La typographie ne grandit PAS au-dela des tailles `lg:` — pas de `2xl:text-6xl`
- Les cartes Leaflet peuvent prendre plus de hauteur : `2xl:h-[600px]`

### Regles generales responsive

1. **Jamais de largeur fixe en pixels** sur un conteneur (`w-[500px]`) — utiliser `max-w-*` + `w-full`
2. **Jamais de `hidden` sans breakpoint correspondant** — si on cache un element, il doit reapparaitre quelque part
3. **Images** : `sizes` prop obligatoire avec les breakpoints pertinents
4. **Pas de scroll horizontal** sur la page principale — seulement dans les containers de tables
5. **Tester sur** : iPhone SE (375px), iPad (768px), laptop 13" (1280px), ecran 27" (2560px)

---

## 10. Performance

### Core Web Vitals — cibles

| Metrique | Cible | Seuil "bon" Google |
|---|---|---|
| LCP (Largest Contentful Paint) | < 2.5s | < 2.5s |
| INP (Interaction to Next Paint) | < 200ms | < 200ms |
| CLS (Cumulative Layout Shift) | < 0.1 | < 0.1 |

### Images

```tsx
// REQUIS — next/image pour toutes les images
import Image from "next/image";

<Image
  src="/images/chateau-frontenac.webp"
  alt="Chateau Frontenac, Quebec"
  width={800}
  height={600}
  sizes="(max-width: 768px) 100vw, 50vw"
  loading="lazy"  // lazy par defaut, sauf hero
  priority={false} // true seulement pour l'image hero
/>
```

**Regles images** :
- `next/image` obligatoire — jamais de `<img>` HTML direct
- Format WebP ou AVIF (Next.js convertit automatiquement)
- `sizes` prop obligatoire pour les images responsives
- `loading="lazy"` partout sauf l'image hero (si applicable)
- `priority={true}` seulement pour le LCP element
- Pas de stock photos (voir section 4)

### Fonts

```css
/* Deja configure dans index.css */
font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
```

**Regles fonts** :
- Plus Jakarta Sans uniquement, poids 400/500/600/700
- `font-display: swap` pour eviter FOIT (Flash of Invisible Text)
- Subset Latin + Latin Extended seulement (pas de Cyrillic, Arabic, etc.)
- Preload de la font dans le `<head>` via Next.js font optimization

### Bundle size

| Cible | Valeur |
|---|---|
| JS par page (gzip) | < 100KB |
| CSS total (gzip) | < 30KB |
| First Load JS | < 150KB |

**Regles bundle** :
- Code splitting automatique par Next.js (chaque page = son propre chunk)
- Leaflet en dynamic import (`next/dynamic` avec `ssr: false`) — la carte n'a pas besoin de SSR
- Pas de librairies lourdes en import global (moment.js, lodash entier, etc.)
- Tree-shaking : imports nommes (`import { Button } from ...`), pas de `import * as`

```tsx
// Leaflet — import dynamique, pas de SSR
const LeafletMap = dynamic(() => import("@/components/maps/leaflet-map"), {
  ssr: false,
  loading: () => <div className="h-96 bg-muted animate-pulse rounded-lg" />,
});
```

### Lazy loading des sections lourdes

```tsx
// FAQ — lazy loaded (en bas de page, pas visible au chargement)
const ToolFAQ = dynamic(() => import("@/components/tools/tool-faq"));

// Cartes — lazy loaded + no SSR
const LeafletMap = dynamic(() => import("@/components/maps/leaflet-map"), {
  ssr: false,
});
```

---

## 11. Checklist de validation

Cocher chaque item avant de merger une PR qui touche aux pages publiques.

### Design

- [ ] Pas de violet/purple comme couleur primaire ou accent
- [ ] Gold (`--primary`, `--gold`, `--gold-dark`) utilise correctement
- [ ] Hero = vrai input fonctionnel, pas un message marketing
- [ ] Donnees reelles affichees (pas de "Lorem ipsum" ou donnees fictives)
- [ ] Pas de stock photos, blobs, glassmorphism, confetti
- [ ] Pas de texte gradient sur les headings
- [ ] Pas de `text-5xl` ou plus grand
- [ ] Test screenshot : "Outil gouvernemental ou SaaS?" → Gouvernemental

### Composants

- [ ] Page utilise un template (`ToolPage`, `CityToolPage`, etc.), pas un composant custom 500 lignes
- [ ] Nouveau composant necessaire? → Justification dans la PR
- [ ] CVA pour les variants (2+ etats visuels)
- [ ] Pas de `style={{}}` (sauf valeurs dynamiques)
- [ ] Pas de `className="bg-[#hex]"` arbitraires

### Responsive

- [ ] Teste sur mobile (375px), tablette (768px), desktop (1280px), grand ecran (2560px)
- [ ] Mobile-first : styles de base = mobile, breakpoints pour agrandir
- [ ] Pas de largeur fixe en pixels sur les conteneurs
- [ ] Pas de scroll horizontal sur la page principale
- [ ] Grids : 1 col mobile → 2 tablette → 3-4 desktop
- [ ] Boutons : `w-full sm:w-auto` sur les actions principales
- [ ] Touch targets : minimum 44x44px sur mobile
- [ ] Tables : scroll horizontal OU transformation en cards mobile
- [ ] Navigation : hamburger mobile, liens visibles desktop
- [ ] Typographie : `text-2xl md:text-3xl lg:text-4xl` pour H1 (pas plus grand)

### Accessibilite

- [ ] 1 seul `<h1>` par page
- [ ] Hierarchie h1 → h2 → h3 respectee
- [ ] Landmarks presents (`<main>`, `<nav>`, `<footer>`)
- [ ] Tous les inputs ont un `<label>`
- [ ] Contraste AA verifie (gold-dark pour texte, pas gold)
- [ ] Focus visible sur les elements interactifs
- [ ] Icones decoratives : `aria-hidden="true"`
- [ ] Icones-boutons : `aria-label`

### Performance

- [ ] `next/image` pour toutes les images
- [ ] Leaflet en `dynamic()` avec `ssr: false`
- [ ] Pas d'import de librairie lourde en global
- [ ] FAQ et cartes lazy-loaded
- [ ] `sizes` prop sur les images responsives (avec breakpoints)

### SEO

- [ ] `generateMetadata()` avec title et description uniques
- [ ] JSON-LD : BreadcrumbList + FAQPage (+ SoftwareApplication si outil)
- [ ] Breadcrumbs visibles en haut de page
- [ ] `generateStaticParams()` pour les routes dynamiques
- [ ] `hreflang="fr-CA"` present
- [ ] Termes quebecois (ref: `seo-strategy.md` section "Termes quebecois")

### Code

- [ ] Nommage kebab-case pour les fichiers
- [ ] Imports dans l'ordre (external → @/lib → @/components → types)
- [ ] Named exports (sauf page.tsx/layout.tsx)
- [ ] Types TypeScript explicites (pas de `any`)
- [ ] Pas de inline styles statiques

### Dark mode

- [ ] Light mode = defaut (pas de detection `prefers-color-scheme`)
- [ ] Toggle dark/light present et accessible dans la navbar
- [ ] Teste en light mode
- [ ] Teste en dark mode
- [ ] Pas de couleurs hardcodees (`bg-white`, `bg-black`, etc.)
- [ ] Classes semantiques utilisees (`bg-background`, `text-foreground`, etc.)

---

## References croisees

| Document | Contenu | Relation avec ce doc |
|---|---|---|
| `docs/architecture-projet.md` | Structure de fichiers, composants, DB schema | Definit QUOI — ce doc definit COMMENT |
| `docs/tech-stack.md` | Choix technologiques et justifications | Stack a utiliser (Next.js, Leaflet, etc.) |
| `docs/seo-strategy.md` | Keywords, pages par ville, structured data | Contraintes SEO sur les templates |
| `src/index.css` | Tokens CSS (gold, dark mode, animations) | Source de verite pour les couleurs |
| `src/components/ui/button.tsx` | Pattern CVA de reference | Modele pour tous les composants avec variants |
| `docs/testing-standards.md` | Standards de tests | Quoi tester, comment tester, patterns |
| `docs/security-audit.md` | Audit de securite | Vulnerabilites, correctifs, checklist deploy |
