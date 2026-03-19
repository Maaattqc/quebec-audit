# Tech Stack — Plateforme donnees Quebec

Plateforme de 100 micro-outils bases sur les donnees ouvertes du Quebec.

---

## Stack complet

| Besoin | Choix | Prix | Notes |
|---|---|---|---|
| **Framework** | Next.js (App Router) | Gratuit | SSR/SSG natif pour SEO, pages dynamiques `/outil/[ville]` |
| **Auth** | Clerk | Gratuit < 10K MAU | Setup en 5 min, social login, gestion users |
| **Database** | PostgreSQL + PostGIS (Supabase) | Gratuit 500MB | PostGIS en 1 clic, storage inclus, dashboard SQL |
| **ORM** | Drizzle | Gratuit | Type-safe, support PostGIS natif, leger, serverless-friendly |
| **Paiements** | Stripe | 2.9% + 0.30$/tx | Checkout (one-time) + Billing (abos) + Tax (TPS/TVQ) |
| **UI** | Tailwind + shadcn/ui | Gratuit | Composants accessibles, rapide a dev |
| **Hosting** | Vercel | Gratuit (hobby) | CDN, SSL, DDoS, deploy sur git push |
| **Cartes** | Leaflet | Gratuit | Open source → upgrade Mapbox quand revenue > 3K$/mois |
| **PDF** | @react-pdf/renderer | Gratuit | Leger, React-based → upgrade Puppeteer si besoin |
| **Logs** | Axiom | Gratuit (Vercel natif) | Logs structures, recherche, integre directement dans Vercel |
| **Erreurs** | Sentry | Gratuit 5K events/mois | Crash frontend + backend, stack traces, alertes |
| **Analytics** | PostHog | Gratuit 1M events/mois | Funnels, retention, feature flags, A/B tests |
| **Rate limiting** | Arcjet ou Upstash Ratelimit | Gratuit | Protection scraping, limite par IP par endpoint |
| **Background jobs** | Inngest | Gratuit 5K runs/mois | Jobs async, retries, scheduling, integre Next.js |
| **Cache** | Upstash Redis | Gratuit 10K cmd/jour | Cache requetes PostGIS frequentes, sessions |
| **Email** | Resend | Gratuit 3K/mois | Rapports PDF, alertes, confirmations paiement |
| **Monitoring** | UptimeRobot | Gratuit | Ping toutes les 5 min, alerte si down |

**Cout total au lancement : 0$/mois** (tout est gratuit en free tier)

---

## Pourquoi chaque choix

### Next.js (App Router)

Le SEO est le canal de croissance principal. Sans SEO, pas de trafic, pas de clients.

- **SSR/SSG natif** : chaque page est crawlable par Google des le jour 1
- **Pages dynamiques** : `/verifier-entrepreneur/[ville]` → 20 pages generees automatiquement
- **ISR** (Incremental Static Regeneration) : pages se mettent a jour sans rebuild
- **API Routes** : endpoints dans le meme projet (auth, Stripe, rapports)
- **Image optimization** : built-in
- React est identique a 95% — c'est l'organisation qui change

**Alternative rejetee** : Vite + React SPA → Google crawle `<div id="root"></div>` vide = SEO nul.

### Clerk (Auth)

- Setup en 5 min (pas de code auth custom)
- Social login (Google, GitHub, email)
- Webhooks pour syncer avec ta DB
- Dashboard de gestion des users
- Gratuit jusqu'a 10K monthly active users

**Alternative rejetee** : NextAuth → plus de code a maintenir, moins de features.

### PostgreSQL + PostGIS (Supabase)

La moitie des outils de la plateforme sont geographiques. PostGIS est indispensable.

**PostGIS permet** :
```sql
-- Ce point est-il dans une zone inondable?
SELECT * FROM zones_inondables
WHERE ST_Contains(geom, ST_Point(-71.2, 46.8));

-- Tous les terrains contamines dans un rayon de 2km
SELECT * FROM terrains_contamines
WHERE ST_DWithin(geom, ST_Point(-71.2, 46.8), 2000);

-- Surface d'un terrain en metres carres
SELECT ST_Area(geom) FROM parcelles WHERE id = 123;
```

Sans PostGIS, faut charger le GeoJSON en memoire et calculer en JS → lent, pas scalable.

**Pourquoi Supabase plutot que Neon** :
- PostGIS active en 1 clic
- Storage inclus (rapports PDF, fichiers uploades)
- Dashboard SQL + visualisation
- Realtime pour alertes push (si besoin)
- Free tier : 500MB DB + 1GB storage

### Drizzle (ORM)

**Pourquoi Drizzle au lieu de Prisma** :
- PostGIS natif sans `$queryRaw` hacky
- Plus proche du SQL (moins de magie, plus de controle)
- Plus leger (pas de binary engine a deployer)
- Meilleur en serverless (Vercel) car pas de cold start lourd
- Type-safe comme Prisma
- Migrations integrees

```typescript
// Drizzle — requete PostGIS type-safe
const zones = await db.execute(sql`
  SELECT id, nom, niveau
  FROM zones_inondables
  WHERE ST_Contains(geom, ST_Point(${lng}, ${lat}))
`);
```

### Stripe (Paiements)

3 modes de paiement sur la plateforme :

**1. Pay-per-report (Stripe Checkout)** :
```
Produit: "Rapport ContractorCheck" → 19.99$
Produit: "Rapport FloodCheck" → 14.99$
→ Stripe Checkout session, paiement one-time, redirect vers rapport
```

**2. Abonnement individuel (Stripe Billing)** :
```
Plan: "AlertePermis" → 49$/mois
Plan: "GarderieFind Alertes" → 10$/mois
→ Stripe Customer Portal pour gerer l'abo
```

**3. Abonnement Pro (Stripe Billing)** :
```
Plan: "Pro" → 99$/mois
→ Acces illimite a tous les rapports pay-per-use
```

**Stripe Tax** gere automatiquement TPS (5%) + TVQ (9.975%) pour le Quebec.

### Leaflet (Cartes)

- 100% gratuit et open source
- Tiles OpenStreetMap (gratuites)
- Leger et rapide
- A 100K visites/mois : 0$/mois

**Upgrade path** : Mapbox (plus beau, geocoding API) quand revenue > 3K$/mois. Mapbox = gratuit < 50K loads, puis ~5$/1000.

### @react-pdf/renderer (PDF)

Pour generer les rapports payants (15-25$).

- Leger, pas de headless browser
- React-based (coherent avec le stack)
- Rapide, peu de RAM
- Suffisant pour des rapports structures (tableaux, scores, cartes statiques)

**Upgrade path** : Puppeteer (HTML → PDF pixel-perfect) si les clients exigent des rapports plus beaux. Mais plus lourd (Chrome headless, 250MB RAM, 2-5s par PDF).

### Axiom (Logs)

- Integre nativement dans Vercel (1 clic pour activer)
- Tous les logs (API routes, SSR, cron jobs) sont centralises et searchables
- Requetes SQL-like : "montre-moi toutes les erreurs de FloodCheck cette semaine"
- Gratuit sur Vercel

**Pourquoi c'est critique** : avec 100 outils et 100+ endpoints, tu dois pouvoir chercher "pourquoi ce rapport a fail" en 10 secondes.

### Sentry (Erreurs)

- Catch les crashes frontend ET backend
- Stack trace complet + contexte (quel user, quel input, quel outil)
- Alertes email/Slack quand un nouveau bug apparait
- Source maps pour debug le JS minifie
- Gratuit 5K events/mois

**Pourquoi c'est critique** : un utilisateur paie 20$ pour un rapport et ca crash → tu dois savoir pourquoi immediatement.

### PostHog (Analytics)

Pas juste du trafic (ca Vercel Analytics le fait). PostHog te dit :

- **Funnels** : "ContractorCheck: 500 visites → 120 clics rapport → 45 paiements = 8.5% conversion"
- **Retention** : "Les users Pro reviennent 4x/mois en moyenne"
- **Feature flags** : A/B test le prix (19.99$ vs 24.99$) sans deployer
- **Session replay** : voir exactement ce que l'utilisateur a fait avant de drop

**Pourquoi c'est critique** : tu as 100 outils, tu dois savoir lesquels marchent et lesquels sont morts. PostHog te donne les donnees pour decider ou investir ton temps.

### Arcjet / Upstash Ratelimit

Avec 100 endpoints publics qui retournent des donnees gratuites :
- Quelqu'un VA scraper tes donnees avec un bot
- Quelqu'un VA spam tes API routes
- Rate limiting = X requetes/minute par IP par endpoint

```typescript
// Exemple Arcjet dans un API route Next.js
import arcjet, { rateLimit } from "@arcjet/next";

const aj = arcjet({
  rules: [rateLimit({ mode: "LIVE", rate: 10, interval: "1m" })],
});
```

### Inngest (Background Jobs)

Les taches qui ne doivent PAS bloquer la requete HTTP :

- **Fetch donnees Quebec** : cron nightly, telechargement CSV/GeoJSON, parsing, upsert en DB
- **Generation PDF** : utilisateur paie → job async genere le PDF → email avec le lien
- **Alertes** : nouveau permis detecte → envoyer email a tous les abonnes AlertePermis
- **Retries** : si un fetch echoue, Inngest retry automatiquement

```typescript
// Inngest — job de generation de rapport
export const generateReport = inngest.createFunction(
  { id: "generate-report" },
  { event: "report/requested" },
  async ({ event }) => {
    const pdf = await generatePDF(event.data);
    await uploadToSupabase(pdf);
    await sendEmail(event.data.userEmail, pdf.url);
  }
);
```

### Upstash Redis (Cache)

Quand 50 personnes cherchent "zone inondable Levis" le meme jour :
- Sans cache : 50 requetes PostGIS (chaque 10-50ms)
- Avec cache : 1 requete PostGIS + 49 reads Redis (chaque <1ms)

```typescript
// Check cache d'abord
const cached = await redis.get(`flood:${lat}:${lng}`);
if (cached) return JSON.parse(cached);

// Sinon, requete PostGIS + cache 24h
const result = await db.execute(sql`...`);
await redis.set(`flood:${lat}:${lng}`, JSON.stringify(result), { ex: 86400 });
```

Pas necessaire au lancement. Ajouter quand le trafic depasse 1000 requetes/jour.

### Resend (Email)

Deja utilise dans Beauce-Audit. Memes cas d'usage :
- Envoi de rapports PDF par email
- Alertes (nouveau permis, place garderie, contrat public)
- Confirmations de paiement
- Gratuit 3K emails/mois

---

## Architecture complete

```
┌─────────────────────────────────────────┐
│                 VERCEL                   │
│                                         │
│  Next.js App Router                     │
│  ├── Pages SSR/SSG (100 outils x 20    │
│  │   villes = 2000 pages SEO)           │
│  ├── API Routes (Stripe, auth, data)    │
│  ├── Inngest functions (background)     │
│  └── Vercel Cron (fetch data nightly)   │
│                                         │
│  Clerk (auth)  │  Sentry (erreurs)      │
│  Axiom (logs)  │  PostHog (analytics)   │
│  Arcjet (rate limit)                    │
└──────────────┬──────────────────────────┘
               │
    ┌──────────┴──────────┐
    │                     │
    ▼                     ▼
┌────────────┐    ┌──────────────┐
│  SUPABASE  │    │   SERVICES   │
│            │    │              │
│ PostgreSQL │    │ Stripe       │
│ + PostGIS  │    │ Resend       │
│ + Storage  │    │ Upstash Redis│
└────────────┘    └──────────────┘
```

---

## Tables principales (Drizzle schema)

```sql
-- Donnees Quebec (cachees, refresh nightly)
zones_inondables    (id, geom GEOMETRY, niveau, source, updated_at)
terrains_contamines (id, geom GEOMETRY, adresse, statut, details JSONB)
permis_construction (id, adresse, geom, type, date, cout_estime, ville)
evaluations_fonc    (id, adresse, geom, valeur, annee, type_batiment)
zonage              (id, geom GEOMETRY, code_zone, usages_permis JSONB, ville)
entrepreneurs_rbq   (id, nom, licence, statut, specialites, region)
inspections_mapaq   (id, etablissement, date, infractions JSONB, score)
garderies_cpe       (id, nom, adresse, geom, type, places_total)

-- Business
users               (id, clerk_id, email, stripe_customer_id, plan)
reports             (id, user_id, tool, input JSONB, output JSONB, paid, created_at)
subscriptions       (id, user_id, tool, stripe_sub_id, status, current_period_end)
alerts              (id, user_id, tool, criteria JSONB, active)
```

---

## Commandes de dev

```bash
# Dev
npx next dev                    # Frontend + API (port 3000)

# Build + deploy
git push origin main            # Vercel deploy automatique

# Database
npx drizzle-kit generate        # Generer migration
npx drizzle-kit push            # Appliquer migration

# Tests
npx vitest run                  # Tests unitaires

# Inngest
npx inngest-cli dev             # Dev server Inngest local
```

---

## Cout mensuel par palier

| Palier | Visiteurs/mois | Cout total | Revenue estime |
|---|---|---|---|
| **Lancement** | 0-1K | 0$/mois | 0-500$ |
| **Traction** | 1K-10K | 0-20$/mois | 500-3000$ |
| **Croissance** | 10K-50K | 20-100$/mois | 3000-15000$ |
| **Scale** | 50K-200K | 100-500$/mois | 15000-50000$ |

Tout est gratuit pour commencer. Les couts augmentent avec le trafic mais le revenue aussi.
