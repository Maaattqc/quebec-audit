# Plan d'action — Plateforme donnees Quebec

## Phase 1 : Infrastructure (semaine 1)

### Objectif : tout le boilerplate pret pour ajouter des outils rapidement

- [ ] Init projet Next.js (App Router) + Tailwind + shadcn/ui
- [ ] Setup Clerk (auth) — login Google + email
- [ ] Setup Supabase — PostgreSQL + PostGIS active
- [ ] Drizzle schema — tables donnees Quebec + tables business
- [ ] Stripe integration — Checkout (pay-per-use) + Billing (abos) + Tax (TPS/TVQ)
- [ ] Template outil reutilisable — input, resultat gratuit, CTA payant, rapport PDF
- [ ] Layout global — navbar, footer, catalogue d'outils
- [ ] Sitemap dynamique + robots.txt
- [ ] Deploy sur Vercel (CI/CD sur git push)
- [ ] Sentry + Axiom setup

---

## Phase 2 : Top 5 outils (semaine 2)

### Les 5 outils avec le meilleur ROI immediat

#### 1. ContractorCheck — Verifier un entrepreneur (score: 73)
- [ ] Fetch donnees RBQ (registre des entrepreneurs)
- [ ] Page `/verifier-entrepreneur` + `/verifier-entrepreneur/[ville]`
- [ ] Resultat gratuit : nom + licence valide/invalide
- [ ] Rapport payant (19.99$) : historique, plaintes, inspections, score
- [ ] Blog post : "Comment verifier un entrepreneur au Quebec"

#### 2. FloodCheck — Zones inondables (score: 67)
- [ ] Fetch donnees zones inondables (GeoJSON → PostGIS)
- [ ] Page `/zone-inondable` + `/zone-inondable/[ville]`
- [ ] Resultat gratuit : zone inondable oui/non
- [ ] Rapport payant (14.99$) : carte, historique crues, impact valeur
- [ ] Blog post : "Zones inondables au Quebec : carte interactive"

#### 3. TerraCheck — Terrains contamines (score: 67)
- [ ] Fetch inventaire terrains contamines
- [ ] Page `/terrain-contamine` + `/terrain-contamine/[ville]`
- [ ] Resultat gratuit : contamine oui/non
- [ ] Rapport payant (14.99$) : details, historique, zonage, risques
- [ ] Blog post : "Terrains contamines : ce que vous devez savoir"

#### 4. GarderieFind — Trouver une garderie (score: 68)
- [ ] Fetch donnees garderies/CPE
- [ ] Page `/garderies` + `/garderies/[ville]`
- [ ] Resultat gratuit : liste des garderies par ville
- [ ] Alerte payante (10$/mois) : notification quand une place se libere
- [ ] Blog post : "La crise des garderies : comment trouver une place"

#### 5. SalaireLab — Benchmark salarial (score: 59)
- [ ] Fetch donnees salaires (Emploi Quebec, Stats Canada)
- [ ] Page `/salaires` + `/salaires/[metier]`
- [ ] Resultat gratuit : salaire median par metier
- [ ] Premium : details par region, tendances, comparaison
- [ ] Blog post : "Combien gagne un [metier] au Quebec en 2026"

---

## Phase 3 : SEO de base (semaine 3, puis continu)

- [ ] Google Search Console — soumettre sitemap
- [ ] Google Business Profile (si applicable)
- [ ] Pages par ville pour les 5 premiers outils (20 villes x 5 = 100 pages)
- [ ] 5 blog posts SEO initiaux (1 par outil)
- [ ] Donnees structurees JSON-LD (FAQs, outils)
- [ ] Open Graph meta tags pour partages sociaux
- [ ] Rythme : 2-3 articles/semaine

---

## Phase 4 : Scale outils (semaines 4-8)

### Ajouter 3-5 outils par semaine

**Semaine 4 : Immobilier**
- [ ] ZonageExpress — verification de zonage
- [ ] ProspectImmo — prospection immobiliere
- [ ] ImmoTax — calculateur fiscal immobilier

**Semaine 5 : Emploi et PME**
- [ ] LouerSmart — score de logement
- [ ] AlertePermis — monitoring de permis
- [ ] SubventionQC — subventions disponibles

**Semaine 6 : Securite et risques**
- [ ] CrimMap — criminalite par quartier
- [ ] ClimatRisk — score de risque climatique
- [ ] InsureScore — score d'assurance (API B2B)

**Semaine 7 : Contrats et business**
- [ ] BidWatch — veille contrats publics
- [ ] BizObitu — monitoring fermetures
- [ ] LeadGen Local — generateur de leads

**Semaine 8 : Niche a fort potentiel**
- [ ] ChassePeche QC — app chasseurs/pecheurs
- [ ] MineSite — intelligence miniere
- [ ] ForetPro — industrie forestiere

---

## Phase 5 : Mesurer et optimiser (mois 2+)

### Metriques cles a suivre

| Metrique | Outil | Cible mois 3 |
|---|---|---|
| Trafic organique | PostHog / Search Console | 1,000+/mois |
| Taux de conversion (gratuit → payant) | PostHog | > 5% |
| Revenue mensuel | Stripe | 1,000-3,000$ |
| Outils live | — | 20-30 |
| Pages indexees | Search Console | 500+ |

### Decision framework

Pour chaque outil apres 30 jours :

```
Trafic > 100/mois ET conversion > 3% → AMELIORER (ajouter features, blog posts)
Trafic > 100/mois ET conversion < 3% → OPTIMISER (tester prix, CTA, landing page)
Trafic < 100/mois ET bon SEO potential → ATTENDRE (SEO prend du temps)
Trafic < 100/mois ET pas de SEO potential → LAISSER TEL QUEL (coute rien)
```

---

## Phase 6 : Pub Google Ads (mois 2-3)

- [ ] Creer campagnes pour les 3 outils qui convertissent le mieux
- [ ] Budget initial : 50-100$/mois
- [ ] Mesurer CPA vs prix du rapport
- [ ] Scale les outils rentables, couper les autres
- [ ] Voir `docs/pub-google-ads.md` pour les details

---

## Phase 7 : Pro et B2B (mois 3-6)

- [ ] Lancer l'abonnement Pro (99$/mois)
- [ ] Dashboard Pro avec usage illimite
- [ ] API B2B pour InsureScore, CrimMap, ClimatRisk
- [ ] Documentation API
- [ ] Outreach courtiers, notaires, assureurs

---

## Priorites absolues

1. **Mettre en ligne les 5 premiers outils** — pas besoin qu'ils soient parfaits
2. **Soumettre a Google** — chaque jour sans indexation = du trafic perdu
3. **Mesurer les conversions** — savoir quoi ameliorer
4. **Ecrire du contenu SEO** — le contenu compose avec le temps
5. **NE PAS** passer 3 mois a coder sans rien mettre en ligne

---

## Milestones

| Milestone | Quand | Quoi |
|---|---|---|
| **v0.1** | Semaine 1 | Infra prete, 0 outil |
| **v0.5** | Semaine 2 | 5 outils live, premieres pages indexees |
| **v1.0** | Mois 1 | 10-15 outils, blog, premiere vente |
| **v2.0** | Mois 3 | 30+ outils, 1,000$/mois, pub lancee |
| **v3.0** | Mois 6 | 50+ outils, 5,000$/mois, Pro lance |
| **v4.0** | Mois 12 | 75+ outils, 15,000$/mois, API B2B |
