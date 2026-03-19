# Standards de tests — Plateforme donnees Quebec

Chaque nouvelle fonctionnalite, composant, endpoint ou modification de logique doit etre accompagnee de tests. Pas de merge sans tests. Ce document definit quoi tester, comment tester, et les patterns a suivre.

---

## 1. Regle fondamentale

**Aucune feature ne ship sans tests.** Que ce soit un nouvel outil, un endpoint API, un composant UI, ou un fix de bug — les tests correspondants font partie de la feature, pas d'un backlog "a faire plus tard".

| Changement | Tests requis |
|---|---|
| Nouvelle fonction pure / utilitaire | Tests unitaires |
| Nouveau composant React | Tests composants (render + interactions) |
| Nouvel endpoint API | Tests d'integration backend |
| Nouveau flux utilisateur complet | Tests d'integration frontend (user flow) |
| Bug fix | Test de regression qui reproduit le bug |
| Refactoring | Les tests existants doivent passer sans modification |

---

## 2. Stack de tests

| Outil | Role | Config |
|---|---|---|
| **Vitest** | Test runner (rapide, compatible Vite) | `vitest.workspace.ts` a la racine |
| **React Testing Library** | Render + interactions composants | `@testing-library/react` + `@testing-library/user-event` |
| **happy-dom** | DOM simule pour les tests frontend | Environment dans `vitest.config.ts` |
| **vi.mock / vi.fn** | Mocks et spies | Built-in Vitest |
| **cheerio** | Parse HTML pour tests backend (gradeWebsite) | Tests server |

### Configuration existante

```
vitest.workspace.ts          # Orchestre les deux configs
├── vitest.config.ts         # Frontend : happy-dom, react plugin, alias @/
└── server/vitest.config.ts  # Backend : node environment
```

**Commande** : `npm test` lance tous les tests (frontend + backend).

---

## 3. Organisation des fichiers de tests

### Structure actuelle

```
src/tests/
├── setup.ts                 # Setup global (happy-dom config)
├── unit.test.ts             # Tests unitaires — types, constantes, fonctions pures
├── components.test.tsx      # Tests composants — render, sidebar, tabs, detail view
└── integration.test.tsx     # Tests integration — flux utilisateur complets

server/tests/
└── lib.test.ts              # Tests backend — gradeWebsite, rowToBusiness, scoring
```

### Convention de nommage

| Type de test | Fichier | Emplacement |
|---|---|---|
| Unitaire frontend | `unit.test.ts` | `src/tests/` |
| Composants React | `components.test.tsx` | `src/tests/` |
| Integration frontend | `integration.test.tsx` | `src/tests/` |
| Unitaire backend | `lib.test.ts` | `server/tests/` |
| Integration backend (futur) | `api.test.ts` | `server/tests/` |
| Tests outil specifique (futur) | `[tool-slug].test.ts` | `src/tests/tools/` ou `server/tests/tools/` |

### Regles d'organisation

- **1 fichier de test par type** — pas de `business-detail.test.tsx` + `sidebar.test.tsx` + `pipeline.test.tsx`. Grouper dans `components.test.tsx` avec des `describe` blocs
- **`describe` blocs** pour organiser par composant/fonctionnalite dans le fichier
- **Helpers partages** (mock data, render helpers) en haut du fichier ou dans `src/tests/helpers/`
- Les tests backend sont dans `server/tests/`, jamais dans `src/tests/`

---

## 4. Types de tests

### 4.1 Tests unitaires

Testent une **fonction pure** isolee, sans DOM, sans API, sans effets de bord.

**Quoi tester** :
- Constantes et types (STATUSES, GRADES, CATEGORIES — format, completude, sommes)
- Fonctions pures (generateEmail, generateSMS, gradeWebsite, rowToBusiness)
- Validations de donnees, formatters, calculateurs
- Configs d'outils (structure correcte, champs requis presents)

**Pattern** :

```typescript
// src/tests/unit.test.ts
import { describe, it, expect } from "vitest";
import { CATEGORIES } from "@/lib/types";

describe("CATEGORIES", () => {
  it("has all 8 categories", () => {
    expect(Object.keys(CATEGORIES)).toEqual([
      "seo", "technique", "performance", "contenu",
      "ux", "accessibilite", "contact", "confiance",
    ]);
  });

  it("max scores sum to 100", () => {
    const total = Object.values(CATEGORIES).reduce((a, c) => a + c.max, 0);
    expect(total).toBe(100);
  });
});
```

**Regles** :
- Pas de `vi.mock` dans les tests unitaires — si tu as besoin de mock, c'est un test d'integration
- Pas de `render()` — si tu renders un composant, c'est un test composant
- Rapide : chaque test unitaire < 10ms

### 4.2 Tests de composants

Testent qu'un composant **s'affiche correctement** et **repond aux interactions**.

**Quoi tester** :
- Le composant render sans crash
- Les elements visibles (texte, boutons, inputs, badges)
- Les interactions basiques (click tab, voir contenu, remplir formulaire)
- Les etats conditionnels (loading, empty, error, data)
- Les props dynamiques (business avec/sans demo, grades differents)

**Pattern** :

```tsx
// src/tests/components.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "@/App";

// Mock API complet (OBLIGATOIRE)
vi.mock("@/lib/api", () => ({
  api: {
    getBusinesses: vi.fn(() => Promise.resolve(mockBusinesses)),
    createBusiness: vi.fn((b: any) => Promise.resolve({ ...b, history: [] })),
    updateBusiness: vi.fn((id, updates) => Promise.resolve({ ...mockBusinesses[0], ...updates })),
    deleteBusiness: vi.fn(() => Promise.resolve({ ok: true })),
    // ... TOUTES les fonctions de l'API doivent etre mockees
    getEmails: vi.fn(() => Promise.resolve([])),
    sendEmail: vi.fn(() => Promise.resolve({ id: 1 })),
    getAnalytics: vi.fn(() => Promise.resolve({ /* ... */ })),
    getHealth: vi.fn(() => Promise.resolve({})),
    getHealthRemote: vi.fn(() => Promise.resolve({})),
    getLogs: vi.fn(() => Promise.resolve([])),
    // ... etc.
  },
  ApiError: class extends Error {
    status: number;
    data: any;
    constructor(s: number, d: any) { super(`API ${s}`); this.status = s; this.data = d; }
  },
}));

beforeEach(() => vi.clearAllMocks());

// Helper de render
async function renderApp() {
  render(<App />);
  await waitFor(() => {
    expect(screen.getAllByText("Entreprise Alpha").length).toBeGreaterThan(0);
  });
}

describe("App rendering", () => {
  it("renders businesses after loading", async () => {
    await renderApp();
    expect(screen.getAllByText("Entreprise Alpha").length).toBeGreaterThan(0);
  });
});
```

**Regles** :
- **Toujours mocker l'API complete** via `vi.mock("@/lib/api")` — chaque nouvelle fonction ajoutee a `api.ts` doit etre ajoutee au mock
- `beforeEach(() => vi.clearAllMocks())` obligatoire
- Utiliser `userEvent.setup()` pour les interactions (pas `fireEvent`)
- Utiliser `waitFor` pour les actions asynchrones
- Queries prioritaires : `getByText` > `getByRole` > `getByPlaceholderText` > `getByTestId`
- **Jamais** `getByTestId` sauf si aucune autre query ne marche (c'est un detail d'implementation)

### 4.3 Tests d'integration frontend

Testent un **flux utilisateur complet** de bout en bout (dans le navigateur simule).

**Quoi tester** :
- Creer une entreprise (remplir formulaire → soumettre → verifier API appelee)
- Changer le status d'une entreprise (ouvrir compose → cliquer "Marquer contacte" → verifier)
- Copier un message (ouvrir compose → cliquer copier → verifier clipboard)
- Naviguer entre les onglets
- Scanner un site web → voir les resultats
- Envoyer un email → verifier l'appel API

**Pattern** :

```tsx
// src/tests/integration.test.tsx
describe("Add new business flow", () => {
  it("creates a business via the API", async () => {
    const user = userEvent.setup();
    await renderApp();

    // 1. Naviguer vers le formulaire
    await user.click(screen.getByText("Nouveau"));
    await waitFor(() => screen.getByText("Nouvelle entreprise"));

    // 2. Remplir les champs
    await user.type(screen.getByPlaceholderText("Ex: Toiture ABC"), "Plomberie Pro");
    await user.type(screen.getByPlaceholderText("https://..."), "https://plomberie-pro.com");

    // 3. Soumettre
    await user.click(screen.getByText("Ajouter au pipeline"));

    // 4. Verifier l'appel API
    await waitFor(() => {
      expect(apiMocks.createBusiness).toHaveBeenCalledOnce();
      const call = apiMocks.createBusiness.mock.calls[0][0];
      expect(call.name).toBe("Plomberie Pro");
      expect(call.url).toBe("https://plomberie-pro.com");
    });
  });
});
```

**Regles** :
- Chaque test = 1 flux utilisateur (pas de "megatest" qui fait tout)
- Simuler les actions comme un vrai utilisateur : click, type, navigation
- Verifier les **resultats observables** (texte affiche, API appelee), pas les details d'implementation
- Le mock API retourne des donnees realistes

### 4.4 Tests unitaires backend

Testent la **logique metier serveur** sans demarrer le serveur Express.

**Quoi tester** :
- `gradeWebsite()` : scoring, categories, issues detectees, grades
- `rowToBusiness()` : mapping snake_case → camelCase, parsing JSON, valeurs par defaut
- Fonctions pures dans `server/lib.ts`
- Parsers de donnees (CSV, GeoJSON) — futur
- Validations de donnees entrants

**Pattern** :

```typescript
// server/tests/lib.test.ts
import { describe, it, expect } from "vitest";
import * as cheerio from "cheerio";
import { gradeWebsite, rowToBusiness } from "../lib";

// Helper pour generer du HTML test
function makeHtml(overrides: { title?: string; h1?: string } = {}) {
  return `<!DOCTYPE html>
<html lang="fr">
<head><title>${overrides.title ?? "Mon Entreprise"}</title></head>
<body>${overrides.h1 ?? "<h1>Titre</h1>"}<p>Contenu</p></body>
</html>`;
}

describe("gradeWebsite — SEO checks", () => {
  it("deducts for missing title", async () => {
    const html = makeHtml({ title: "" });
    const page$ = cheerio.load(html);
    const result = await gradeWebsite(page$, html, "https://example.com");
    expect(result.issues).toContain("Titre absent");
  });
});
```

**Regles** :
- Environment `node` (pas `happy-dom`)
- Pas de `vi.mock` pour les fonctions internes — tester la vraie logique
- Mocker seulement les appels reseau (fetch pour robots.txt/sitemap)
- Helpers `makeHtml()` pour generer du HTML avec overrides

### 4.5 Tests d'integration backend (futur)

Testent les **endpoints API** avec des requetes HTTP simulees.

**Quoi tester** :
- Chaque endpoint retourne le bon status code
- Validation des parametres (400 si manquant)
- Auth requise (401 sans cookie)
- Rate limiting fonctionne
- CORS correct

**Pattern prevu** :

```typescript
// server/tests/api.test.ts
import { describe, it, expect, vi } from "vitest";

// Mock de la DB
vi.mock("../db", () => ({
  pool: { query: vi.fn() },
}));

describe("GET /api/businesses", () => {
  it("returns 401 without auth cookie", async () => {
    const res = await fetch("http://localhost:3849/api/businesses");
    expect(res.status).toBe(401);
  });

  it("returns businesses with valid auth", async () => {
    const res = await fetch("http://localhost:3849/api/businesses", {
      headers: { Cookie: "mf_auth=valid_token" },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });
});
```

### 4.6 Tests de regression

Pour chaque bug corrige, **ecrire un test qui reproduit le bug** avant de le fixer.

**Pattern** :

```typescript
describe("Bug fix: #42 — grade calculation overflow", () => {
  it("does not return score > 100 when all criteria met", async () => {
    const html = makeHtml({ /* HTML qui causait le bug */ });
    const page$ = cheerio.load(html);
    const result = await gradeWebsite(page$, html, "https://example.com");
    expect(result.score).toBeLessThanOrEqual(100);
  });
});
```

---

## 5. Mock API — regles strictes

Le mock de l'API est la partie la plus critique des tests frontend. Un mock incomplet = des tests qui crash.

### Regle : mocker TOUTES les fonctions

Chaque fois qu'une nouvelle fonction est ajoutee dans `src/lib/api.ts`, elle doit etre ajoutee dans **tous les fichiers de tests** qui mockent l'API.

**Fichiers a mettre a jour** :
- `src/tests/components.test.tsx`
- `src/tests/integration.test.tsx`

### Template de mock complet

```typescript
const apiMocks = {
  // Business CRUD
  getBusinesses: vi.fn(() => Promise.resolve(mockBusinesses)),
  createBusiness: vi.fn((b) => Promise.resolve({ ...b, history: [] })),
  updateBusiness: vi.fn((id, updates) => Promise.resolve({ ...mockBusinesses[0], ...updates })),
  deleteBusiness: vi.fn(() => Promise.resolve({ ok: true })),
  addHistory: vi.fn((_id, action) => Promise.resolve({ ts: "2026-01-01", action })),

  // Scan
  scan: vi.fn(() => Promise.resolve({ results: [], stats: { urlsFound: 0, sitesScanned: 0, sitesSuccess: 0, durationMs: 0, grades: {} } })),
  addScanResult: vi.fn(() => Promise.resolve(mockBusinesses[0])),
  scanNoSite: vi.fn(() => Promise.resolve([])),
  addNoSiteResult: vi.fn(() => Promise.resolve(mockBusinesses[0])),
  getScanHistory: vi.fn(() => Promise.resolve([])),
  rescanBusiness: vi.fn(() => Promise.resolve(mockBusinesses[0])),

  // Email
  getEmails: vi.fn(() => Promise.resolve([])),
  getEmail: vi.fn(() => Promise.resolve({})),
  sendEmail: vi.fn(() => Promise.resolve({ id: 1, resendId: "r1", status: "sent" })),

  // Analytics & monitoring
  getAnalytics: vi.fn(() => Promise.resolve({
    pipeline: {}, totalBusinesses: 0, totalValue: 0, mrr: 0,
    grades: {},
    emails: { total: 0, sent: 0, received: 0, linkedBusinesses: 0 },
    scans: { totalScans: 0, totalUrls: 0, totalSuccess: 0, totalDurationMs: 0 },
    conversion: { contacted: 0, won: 0, lost: 0, conversionRate: 0, closeRate: 0 },
    recentActivity: [], timeline: [], topSectors: [],
  })),
  getHealth: vi.fn(() => Promise.resolve({})),
  getHealthRemote: vi.fn(() => Promise.resolve({})),
  getLogs: vi.fn(() => Promise.resolve([])),

  // Checklist
  getChecklist: vi.fn(() => Promise.resolve({})),
  updateChecklist: vi.fn(() => Promise.resolve({ ok: true })),

  // Reminders
  getReminders: vi.fn(() => Promise.resolve([])),
  createReminder: vi.fn(() => Promise.resolve({ id: 1, businessId: "", dueDate: "", note: "", done: false, createdAt: "" })),
  updateReminder: vi.fn(() => Promise.resolve({})),
  deleteReminder: vi.fn(() => Promise.resolve({ ok: true })),

  // Email templates
  getEmailTemplates: vi.fn(() => Promise.resolve([])),
  createEmailTemplate: vi.fn(() => Promise.resolve({ id: 1, name: "", subject: "", body: "", createdAt: "" })),
  updateEmailTemplate: vi.fn(() => Promise.resolve({})),
  deleteEmailTemplate: vi.fn(() => Promise.resolve({ ok: true })),

  // Bulk operations
  bulkUpdateBusinesses: vi.fn(() => Promise.resolve({ ok: true })),
  bulkDeleteBusinesses: vi.fn(() => Promise.resolve({ ok: true })),

  // Attachments
  getAttachments: vi.fn(() => Promise.resolve([])),
  uploadAttachment: vi.fn(() => Promise.resolve({})),
  downloadAttachmentUrl: vi.fn(() => "/api/attachments/1/download"),
  deleteAttachment: vi.fn(() => Promise.resolve({ ok: true })),

  // Proxy
  siteProxyUrl: vi.fn((url) => `/api/site-proxy?url=${encodeURIComponent(url)}`),

  // REQ
  getReqCities: vi.fn(() => Promise.resolve([])),
  scanReq: vi.fn(() => Promise.resolve([])),
  reqSearchSite: vi.fn(() => Promise.resolve({ url: "", found: false, phone: "", email: "" })),
};
```

### Mock data realiste

Les donnees mockees doivent ressembler aux vraies donnees de production :

```typescript
const mockBusinesses: Business[] = [
  {
    id: "test-1",
    name: "Toiture Beauce",
    url: "https://toiture-beauce.com",
    sector: "Toiture",
    grade: "D",
    phone: "(418) 333-3333",
    email: "info@toiture-beauce.com",
    contacts: [{ name: "Jean-Pierre", role: "Proprietaire", phone: "(418) 333-4444" }],
    status: "prospect",
    notes: "",
    issues: ["Site tres vieux", "Pas responsive"],
    improvements: ["Refonte complete", "SEO local"],
    estimatedValue: "4 000$",
    hasDemo: true,
    demoNotes: "Maquette faite",
    history: [{ ts: "2026-03-01 10:00", action: "Creee" }],
    score: 35,
    categoryScores: { seo: 3, technique: 5, performance: 4, contenu: 6, ux: 4, accessibilite: 3, contact: 6, confiance: 4 },
  },
];
```

---

## 6. Quoi tester pour chaque type de changement

### Nouveau composant React

```
1. Test de render    — le composant s'affiche sans crash
2. Test de contenu   — les elements attendus sont visibles (texte, icones, badges)
3. Test d'etats      — loading, empty, error, data
4. Test interactions — click, hover, type, submit
5. Test conditionnel — props differentes = affichage different
```

### Nouvelle fonction dans api.ts

```
1. Ajouter au mock   — dans components.test.tsx ET integration.test.tsx
2. Test integration  — flux utilisateur qui utilise la nouvelle fonction
3. Test mock         — verifier les args passes a la fonction
```

### Nouvel endpoint API (server)

```
1. Test unitaire     — la logique metier (si extraite dans lib.ts)
2. Test validation   — parametres manquants = erreur
3. Test auth         — sans auth = 401
4. Test happy path   — requete valide = reponse correcte
5. Test edge cases   — donnees vides, caracteres speciaux, limites
```

### Nouvel outil (plateforme future)

```
1. Test config       — la ToolConfig a tous les champs requis
2. Test render       — la page outil s'affiche correctement
3. Test input        — l'utilisateur peut entrer des donnees
4. Test resultat     — le resultat gratuit s'affiche avec les bonnes donnees
5. Test CTA          — le bouton payant est visible avec le bon prix
6. Test FAQ          — les questions s'affichent en accordion
7. Test SEO          — metadata generee correctement
8. Test ville        — la page ville ajoute le nom de la ville au bon endroit
```

### Bug fix

```
1. Test regression   — reproduire le bug dans un test (qui fail)
2. Fixer le code     — le test passe
3. Verifier          — les tests existants passent toujours
```

---

## 7. Patterns et bonnes pratiques

### Nommer les tests clairement

```typescript
// BON — descriptif, on comprend ce qui est teste
it("deducts for missing title", async () => { ... });
it("returns 401 without auth cookie", async () => { ... });
it("creates a business via the API", async () => { ... });

// MAUVAIS — vague, on ne sait pas ce qui fail
it("works", async () => { ... });
it("should be correct", async () => { ... });
it("test 1", async () => { ... });
```

### AAA — Arrange, Act, Assert

```typescript
it("marks business as contacted", async () => {
  // Arrange — setup
  const user = userEvent.setup();
  await renderApp();

  // Act — action utilisateur
  await user.click(screen.getByText("Message"));
  await user.click(screen.getByText("Marquer contacte"));

  // Assert — verification
  await waitFor(() => {
    expect(apiMocks.updateBusiness).toHaveBeenCalledWith("test-1", { status: "contacted" });
  });
});
```

### Un assert par concept

```typescript
// BON — chaque test verifie une chose
it("has all 8 categories", () => {
  expect(Object.keys(CATEGORIES)).toHaveLength(8);
});

it("max scores sum to 100", () => {
  const total = Object.values(CATEGORIES).reduce((a, c) => a + c.max, 0);
  expect(total).toBe(100);
});

// ACCEPTABLE — assertions liees dans le meme test
it("each category has label, max, and color", () => {
  for (const val of Object.values(CATEGORIES)) {
    expect(val.label).toBeTruthy();
    expect(val.max).toBeGreaterThan(0);
    expect(val.color).toMatch(/^#[0-9a-f]{6}$/i);
  }
});
```

### Pas de logique dans les tests

```typescript
// BON — valeurs explicites
it("has grades A through F", () => {
  expect(Object.keys(GRADES)).toEqual(["A", "B", "C", "D", "E", "F"]);
});

// MAUVAIS — la logique du test duplique la logique du code
it("has the right grades", () => {
  const expected = "ABCDEF".split("");
  expect(Object.keys(GRADES)).toEqual(expected);
});
```

### Tests independants

Chaque test doit pouvoir tourner seul, dans n'importe quel ordre.

```typescript
// BON — chaque test cree son propre etat
beforeEach(() => vi.clearAllMocks());

// MAUVAIS — tests dependants de l'ordre d'execution
it("creates a business", async () => { /* ... */ });
it("updates the business created above", async () => { /* depend du test precedent */ });
```

---

## 8. Tests pour la plateforme Next.js (futur)

Quand on migrera vers Next.js, les tests s'adapteront :

### Tests de pages (Server Components)

```typescript
// Tests de generateMetadata
describe("ToolPage metadata", () => {
  it("generates correct title for ContractorCheck", async () => {
    const metadata = await generateMetadata({ params: { tool: "verifier-entrepreneur" } });
    expect(metadata.title).toBe("Verifier un entrepreneur | DonneesQuebec");
  });

  it("generates city-specific title", async () => {
    const metadata = await generateMetadata({
      params: { tool: "verifier-entrepreneur", ville: "quebec" },
    });
    expect(metadata.title).toContain("Quebec");
  });
});
```

### Tests de generateStaticParams

```typescript
describe("generateStaticParams", () => {
  it("generates params for all tools", async () => {
    const params = await generateStaticParams();
    expect(params.length).toBeGreaterThan(0);
    expect(params[0]).toHaveProperty("tool");
  });

  it("generates params for all cities", async () => {
    const params = await generateStaticParams();
    const cities = params.map(p => p.ville);
    expect(cities).toContain("quebec");
    expect(cities).toContain("montreal");
  });
});
```

### Tests de config outils

```typescript
import { getAllTools, getToolConfig } from "@/lib/tools/registry";

describe("Tool configs", () => {
  const tools = getAllTools();

  it.each(tools)("$toolSlug has all required fields", (tool) => {
    expect(tool.toolSlug).toBeTruthy();
    expect(tool.toolName).toBeTruthy();
    expect(tool.toolTitle).toBeTruthy();
    expect(tool.inputType).toBeTruthy();
    expect(tool.faqItems.length).toBeGreaterThanOrEqual(5);
    expect(tool.price).toBeGreaterThan(0);
    expect(tool.metaData.titleTemplate).toContain("{ville}");
  });
});
```

### Tests de routes API

```typescript
// Tests avec le test client Next.js (ou supertest)
describe("POST /api/reports/[tool]", () => {
  it("returns 400 for missing input", async () => {
    const res = await POST("/api/reports/verifier-entrepreneur", { body: {} });
    expect(res.status).toBe(400);
  });

  it("returns report data for valid input", async () => {
    const res = await POST("/api/reports/verifier-entrepreneur", {
      body: { licence: "1234-5678-01" },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("result");
  });
});
```

---

## 9. Couverture et metriques

### Cibles de couverture

| Type | Couverture cible | Priorite |
|---|---|---|
| Fonctions pures (lib.ts, types.ts) | > 90% | Haute |
| Composants React | > 80% (render + interactions cles) | Haute |
| Flux utilisateur (integration) | Tous les happy paths couverts | Haute |
| Endpoints API | > 80% (happy path + erreurs) | Moyenne |
| Edge cases | Cas critiques couverts | Moyenne |

### Ce qu'on ne teste PAS

- Le style CSS (pas de snapshot tests sur le HTML rendu)
- Les composants shadcn/ui (deja testes par la librairie)
- Les animations et transitions
- Le layout pixel-perfect (pas de visual regression tests pour l'instant)
- Les imports/exports (si ca compile, c'est bon)

### Rapport de couverture

```bash
# Generer un rapport de couverture
npx vitest run --coverage

# Rapport HTML (ouvre dans le navigateur)
npx vitest run --coverage --reporter=html
```

---

## 10. Quand et comment executer les tests

### En developpement

```bash
# Tous les tests (une seule fois)
npm test

# Watch mode (re-run quand les fichiers changent)
npx vitest

# Un seul fichier
npx vitest src/tests/unit.test.ts

# Un seul describe/test (par nom)
npx vitest -t "gradeWebsite"

# Seulement backend
npx vitest --workspace server

# Seulement frontend
npx vitest --workspace root
```

### Avant chaque commit

```bash
npm test    # DOIT passer a 100% — 0 fail = on commit
```

### CI/CD (futur)

```yaml
# GitHub Actions
- name: Run tests
  run: npm test

- name: Check coverage
  run: npx vitest run --coverage
  # Fail si couverture < seuil
```

---

## 11. Checklist de tests par PR

Avant chaque merge, verifier :

### Nouveau code

- [ ] Tests unitaires pour les nouvelles fonctions pures
- [ ] Tests composants pour les nouveaux composants React
- [ ] Tests d'integration pour les nouveaux flux utilisateur
- [ ] Mock API mis a jour si nouvelle fonction dans `api.ts`

### Bug fix

- [ ] Test de regression qui reproduit le bug
- [ ] Le test failait avant le fix, passe apres

### Refactoring

- [ ] Aucun test existant modifie (sauf si l'API publique change)
- [ ] Tous les tests passent sans modification

### Qualite

- [ ] Tests nommes clairement (on comprend ce qui est teste)
- [ ] Pas de `console.log` ou `console.warn` dans les tests
- [ ] Pas de `.only` ou `.skip` oublie
- [ ] Pas de dependance entre les tests (ordre d'execution)
- [ ] `beforeEach(() => vi.clearAllMocks())` present
- [ ] Donnees mockees realistes (pas de "foo", "bar", "test123")

### Execution

- [ ] `npm test` passe a 100% (0 fail)
- [ ] Pas de tests flakey (qui passent/failent aleatoirement)

---

## References

| Document | Relation |
|---|---|
| `vitest.workspace.ts` | Configuration workspace (frontend + backend) |
| `vitest.config.ts` | Config frontend (happy-dom, react, alias) |
| `server/vitest.config.ts` | Config backend (node environment) |
| `src/tests/setup.ts` | Setup global des tests frontend |
| `src/lib/api.ts` | Source de verite pour les fonctions a mocker |
| `server/lib.ts` | Fonctions pures backend a tester |
| `docs/coding-design-standards.md` | Standards de design et code |
| `docs/security-audit.md` | Audit de securite et correctifs |
| `CLAUDE.md` | Instructions generales du projet |
