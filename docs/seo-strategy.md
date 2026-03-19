# Strategie SEO — Plateforme donnees Quebec

## Principe fondamental : 1 domaine > 100 domaines

- Chaque page/outil qui recoit un backlink renforce TOUT le domaine (Domain Authority)
- Si `/verifier-entrepreneur` rank bien → `/zone-inondable` beneficie de la credibilite
- Google favorise les sites avec beaucoup de contenu sur un theme ("topical authority")
- 1 seul sitemap, 1 Search Console, 1 effort de link-building
- 100 domaines = 100x le travail SEO technique + 1500$/an en domaines + 3-6 mois de sandbox chacun
- Exemples : Zillow, Canva, HubSpot = tous un seul domaine avec 100+ outils

---

## Chaque outil = 1 page qui rank sur Google

Chaque outil cible des mots-cles COMPLETEMENT DIFFERENTS (pas de cannibalisation) :

| Outil | Keywords cibles |
|---|---|
| ContractorCheck | "verifier entrepreneur construction quebec", "licence RBQ valide" |
| FloodCheck | "zone inondable [adresse]", "carte inondation quebec" |
| TerraCheck | "terrain contamine quebec", "verifier sol avant achat" |
| GarderieFind | "place garderie [ville]", "CPE disponible" |
| SalaireLab | "salaire [metier] quebec 2026" |
| LouerSmart | "verifier appartement avant louer", "score logement" |
| AlertePermis | "permis de construction [ville]", "nouveau permis renovation" |
| ZonageExpress | "zonage [adresse]", "verification zonage quebec" |
| ContractorCheck | "verifier entrepreneur RBQ", "licence entrepreneur quebec" |
| RenoPrix | "cout renovation [type] quebec", "prix toiture maison" |
| PropTech Report | "rapport immobilier [ville]", "evaluation terrain quebec" |
| InsureScore | "risque assurance habitation [adresse]" |
| CrimMap | "criminalite [quartier]", "statistiques crime [ville]" |

---

## Le multiplicateur : pages par ville

Pour chaque outil, creer des pages par ville :

```
/verifier-entrepreneur/quebec
/verifier-entrepreneur/montreal
/verifier-entrepreneur/sherbrooke
/verifier-entrepreneur/levis
/verifier-entrepreneur/trois-rivieres
/verifier-entrepreneur/saint-georges
/verifier-entrepreneur/drummondville
/verifier-entrepreneur/gatineau
/verifier-entrepreneur/saguenay
/verifier-entrepreneur/rimouski
... (20+ villes)
```

**100 outils x 20 villes = 2,000 pages indexees.** Chaque page cible un keyword longue traine specifique.

---

## Structure URL et SEO on-page

### Pattern pour chaque outil

```
/[outil-slug]/                     → Page principale de l'outil
/[outil-slug]/[ville]/             → Page par ville (SSG)
/blog/[article-seo]/              → Article de blog qui mene vers l'outil
```

### Balises SEO par page

```html
<title>Verifier un entrepreneur a Quebec | [nom du site]</title>
<meta name="description" content="Verifiez la licence RBQ, les plaintes et l'historique d'un entrepreneur en construction a Quebec. Resultat instantane." />
<h1>Verifier un entrepreneur a Quebec</h1>
```

- Chaque page a un `<title>`, `<meta description>`, `<h1>` unique
- Donnees structurees (JSON-LD) pour les FAQs et les outils
- Open Graph pour les partages sociaux

---

## Contenu SEO additionnel (blog)

Blog posts qui menent vers les outils :

| Article | Outil cible |
|---|---|
| "Comment verifier un entrepreneur au Quebec en 2026" | ContractorCheck |
| "5 choses a verifier avant d'acheter un terrain" | FloodCheck + TerraCheck |
| "La crise des garderies : comment trouver une place" | GarderieFind |
| "Combien gagne un [metier] au Quebec?" | SalaireLab |
| "Zones inondables au Quebec : carte interactive" | FloodCheck |
| "Cout de la renovation : guide complet 2026" | RenoPrix |
| "Comment lire votre evaluation fonciere" | ImmoTax |
| "Verifier le zonage avant d'acheter" | ZonageExpress |
| "Les terrains contamines : ce que vous devez savoir" | TerraCheck |
| "Score de risque climatique : comment ca marche" | ClimatRisk |

**Strategie** : 2-3 articles/semaine de 800-1500 mots. Chaque article cible 1-2 keywords longue traine et fait un lien vers l'outil pertinent.

---

## SEO technique (Next.js)

### SSR/SSG

- Pages outils : **SSG** (Static Site Generation) avec ISR (revalidation toutes les 24h)
- Pages par ville : **SSG** generees au build time
- Blog : **SSG** avec MDX
- Resultats dynamiques (recherche) : **SSR** pour que Google crawle le resultat

### Sitemap dynamique

```typescript
// app/sitemap.ts
export default async function sitemap() {
  const outils = getAllOutils();
  const villes = getAllVilles();

  const urls = outils.flatMap(outil =>
    villes.map(ville => ({
      url: `https://[domaine].ca/${outil.slug}/${ville.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }))
  );

  return urls;
}
```

### robots.txt

```
User-agent: *
Allow: /
Sitemap: https://[domaine].ca/sitemap.xml
```

### Performance

- Core Web Vitals : LCP < 2.5s, FID < 100ms, CLS < 0.1
- Images : next/image avec lazy loading
- Fonts : preload des polices critiques
- Bundle : code splitting par page (Next.js le fait auto)

---

## Link building

### Strategies gratuites

1. **Donnees uniques** : les journalistes citent des sources de donnees → backlinks naturels
2. **Articles de blog** : contenu utile = partages = backlinks
3. **Reddit/forums** : repondre a des questions avec lien vers l'outil pertinent
4. **Outils gratuits** : les outils gratuits attirent des backlinks naturellement
5. **Medias locaux** : pitcher aux journaux regionaux (Le Soleil, TVA regions)
6. **Partenariats** : courtiers, notaires, entrepreneurs peuvent lier vers la plateforme

### Metriques cibles

| Metrique | Mois 3 | Mois 6 | Mois 12 |
|---|---|---|---|
| Pages indexees | 200+ | 500+ | 2000+ |
| Domain Authority | 10-15 | 20-30 | 35-50 |
| Backlinks | 20-50 | 100-200 | 500+ |
| Trafic organique/mois | 100-500 | 2,000-5,000 | 10,000+ |

---

## Timeline SEO realiste

| Mois | Trafic organique | Ce qui se passe |
|---|---|---|
| 1-2 | ~0 | Google indexe les pages |
| 3-4 | 100-500/mois | Premieres pages rank en page 2-3 |
| 5-6 | 500-2,000/mois | Certaines pages montent en page 1 |
| 6-12 | 2,000-10,000/mois | Effet boule de neige, domaine gagne en autorite |
| 12+ | 10,000+/mois | Nouvelles pages rankent plus vite |

**Point cle** : le SEO est un investissement a long terme. Les 3 premiers mois = quasi zero trafic. Mais apres 6 mois, c'est du trafic gratuit et croissant.

---

## Outils SEO recommandes

| Outil | Prix | Usage |
|---|---|---|
| Google Search Console | Gratuit | Indexation, erreurs, performance keywords |
| Google Analytics (ou PostHog) | Gratuit | Trafic, conversions |
| Ahrefs / SEMrush | ~100$/mois | Recherche keywords, backlinks, concurrence (optionnel au debut) |
| Screaming Frog | Gratuit < 500 URLs | Audit technique SEO |
| PageSpeed Insights | Gratuit | Core Web Vitals |

**Au lancement** : Search Console + PostHog suffisent. Ajouter Ahrefs quand le trafic depasse 5,000/mois et qu'on veut optimiser.

---

## Architecture en cluster (pillar-cluster)

Chaque categorie = 1 page pilier qui lie vers tous les outils et articles de la categorie. Google comprend la hierarchie thematique et booste l'autorite de tout le cluster.

### Categories et pages piliers

| Categorie | Page pilier | Outils lies |
|---|---|---|
| Immobilier | `/immobilier` | FloodCheck, TerraCheck, ZonageExpress, PropTech Report, BatiScan, ImmoTax, ClimatRisk, InsureScore |
| Entrepreneurs | `/entrepreneurs` | ContractorCheck, RenoPrix, AlertePermis, PermisBot, PermisTracker |
| Familles | `/familles` | GarderieFind, LouerSmart, SalaireLab, CrimMap |
| Emploi | `/emploi` | SalaireLab, BizObitu, BidWatch |
| Environnement | `/environnement` | FloodCheck, TerraCheck, ClimatRisk, EcoCollecte |
| Gouvernement | `/gouvernement` | MuniDash, GovBot, DocuMuni, DeneigePro |

### Diagramme hub-and-spoke

```
                         ┌─────────────────┐
                         │   IMMOBILIER     │
                         │  (page pilier)   │
                         └────────┬─────────┘
                                  │
              ┌───────────┬───────┼───────┬───────────┐
              │           │       │       │           │
        ┌─────┴─────┐ ┌──┴──┐ ┌──┴──┐ ┌──┴──┐ ┌─────┴─────┐
        │ FloodCheck │ │Terra│ │Zona │ │Prop │ │  BatiScan  │
        │            │ │Check│ │ ge  │ │Tech │ │            │
        └─────┬──────┘ └──┬──┘ └──┬──┘ └──┬──┘ └─────┬──────┘
              │           │       │       │           │
         ┌────┴────┐  ┌──┴──┐    │    ┌──┴──┐   ┌────┴────┐
         │Blog:    │  │Blog:│    │    │Blog:│   │Blog:    │
         │"Zones   │  │"Ter-│    │    │"Rap-│   │"Diagnos-│
         │inondab."│  │rains│    │    │port │   │tic mai- │
         └─────────┘  │cont"│    │    │immo"│   │son"     │
                      └─────┘    │    └─────┘   └─────────┘
                            ┌────┴────┐
                            │ /immo/  │
                            │ montreal│
                            │ /immo/  │
                            │ quebec  │
                            └─────────┘
```

### Regles de linking pilier-cluster

1. La page pilier lie vers **chaque outil** de la categorie avec ancre descriptive
2. Chaque page outil lie **retour vers la page pilier** (breadcrumb + lien contextuel)
3. Les articles de blog lient vers **l'outil + la page pilier**
4. Les pages par ville lient vers **la page outil + la page pilier**

---

## Maillage interne

### Regles de linking par type de page

| Type de page | Liens sortants requis |
|---|---|
| Page outil | 2-3 outils lies de la meme categorie + page pilier + 1 article blog |
| Article blog | 1 CTA vers l'outil principal + 1-2 liens vers outils secondaires + page pilier |
| Page ville | Outil principal de la ville + 2-3 autres outils pertinents pour cette ville + page pilier |
| Page pilier | Tous les outils de la categorie + 3-5 articles les plus populaires |

### Breadcrumbs

Chaque page affiche un breadcrumb pour le SEO et la navigation :

```
Accueil > Immobilier > FloodCheck > Montreal
Accueil > Entrepreneurs > ContractorCheck
Accueil > Blog > Comment verifier un entrepreneur
```

Implementation JSON-LD :

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Accueil", "item": "https://donneesquebec.ca/" },
    { "@type": "ListItem", "position": 2, "name": "Immobilier", "item": "https://donneesquebec.ca/immobilier" },
    { "@type": "ListItem", "position": 3, "name": "FloodCheck", "item": "https://donneesquebec.ca/zone-inondable" }
  ]
}
```

### Footer "Outils populaires"

Le footer de chaque page inclut une section avec les 8-10 outils les plus utilises. Ca distribue du link juice vers les pages les plus importantes et aide les visiteurs a decouvrir d'autres outils.

```
────────────────────────────────────────────
Outils populaires :
ContractorCheck | FloodCheck | GarderieFind | SalaireLab
TerraCheck | PropTech Report | RenoPrix | AlertePermis
────────────────────────────────────────────
```

---

## Priorisation par difficulte keyword

### Phase 1 — KD < 20, longue traine ville (mois 1-4)

Cibler les keywords faciles avec des pages par ville. Volume faible mais conversion elevee car intent tres specifique.

### Phase 2 — KD 20-40, termes generaux (mois 4-8)

Les pages principales des outils commencent a ranker grace a l'autorite accumulee en Phase 1.

### Phase 3 — KD 40+, head terms (mois 8-12+)

Cibler les termes competitifs seulement quand le domaine a assez d'autorite (DA 25+).

### Tableau de keywords priorises

| Keyword | Outil | KD estime | Volume/mois | Phase |
|---|---|---|---|---|
| "verifier entrepreneur saint-georges" | ContractorCheck | 5 | 20 | 1 |
| "zone inondable levis" | FloodCheck | 5 | 30 | 1 |
| "place garderie sherbrooke" | GarderieFind | 8 | 50 | 1 |
| "terrain contamine trois-rivieres" | TerraCheck | 5 | 15 | 1 |
| "permis construction gatineau" | AlertePermis | 10 | 40 | 1 |
| "salaire plombier quebec 2026" | SalaireLab | 12 | 80 | 1 |
| "cout renovation toiture quebec" | RenoPrix | 15 | 100 | 1 |
| "zonage terrain montreal" | ZonageExpress | 18 | 60 | 1 |
| "verifier entrepreneur quebec" | ContractorCheck | 25 | 300 | 2 |
| "zone inondable quebec carte" | FloodCheck | 22 | 250 | 2 |
| "place garderie montreal" | GarderieFind | 30 | 500 | 2 |
| "rapport immobilier quebec" | PropTech Report | 28 | 150 | 2 |
| "salaire moyen quebec 2026" | SalaireLab | 35 | 1,000 | 2 |
| "licence RBQ" | ContractorCheck | 40 | 2,000 | 3 |
| "garderie quebec" | GarderieFind | 45 | 5,000 | 3 |
| "zone inondable" | FloodCheck | 50 | 8,000 | 3 |
| "evaluation fonciere" | ImmoTax | 42 | 3,000 | 3 |
| "cout renovation maison" | RenoPrix | 48 | 4,000 | 3 |

---

## SEO local (Google Business Profile)

### Profils par region

Creer un profil Google Business Profile par region majeure pour apparaitre dans le local pack (les 3 resultats avec la carte Google Maps) :

| Region | Adresse virtuelle | Outils mis en avant |
|---|---|---|
| Montreal | Co-working/bureau virtuel Montreal | PropTech Report, ContractorCheck, GarderieFind |
| Quebec | Co-working/bureau virtuel Quebec | FloodCheck, ContractorCheck, ZonageExpress |
| Sherbrooke | Co-working/bureau virtuel Sherbrooke | TerraCheck, RenoPrix, SalaireLab |
| Gatineau | Co-working/bureau virtuel Gatineau | AlertePermis, ContractorCheck |

### NAP consistency

- **N**om : exactement le meme partout (ex: "DonneesQuebec.ca")
- **A**dresse : meme format sur le site, GBP, annuaires
- **P**hone : meme numero partout (si applicable)

Verifier la coherence sur : Google, Pages Jaunes, 411.ca, Yelp, indexa.ca, iCi.Radio-Canada.ca.

### Strategie reviews B2B

- Demander un avis Google aux courtiers/notaires qui utilisent Pro
- Cible : 10+ avis 5 etoiles par profil dans les 6 premiers mois
- Email automatise J+7 apres achat Pro : "Comment etait votre experience? Laissez un avis"
- Template de reponse aux avis (merci + mention de l'outil utilise)

### Local pack targeting

Les pages par ville ciblent les recherches locales :
- `verifier entrepreneur [ville]` → local pack + resultat organique
- `zone inondable [ville]` → meme chose
- Inclure le nom de la ville dans le `<title>`, `<h1>`, et la meta description

---

## Cadence de rafraichissement du contenu

| Type de contenu | Frequence de mise a jour | Methode |
|---|---|---|
| Articles de blog | Tous les 6 mois | Review manuelle, update stats et dates |
| Pages par ville | Automatique (ISR) | Revalidation toutes les 24h via Next.js ISR |
| Pages outils | Trimestrielle | Verifier que les donnees sources sont a jour |
| Audit pages mortes | Trimestrielle | Screaming Frog → identifier 404, redirect chains, pages sans trafic |
| Sitemap | Automatique | Regenere au build ou via ISR |
| Schema markup | Semestrielle | Valider avec Google Rich Results Test |

### Process audit trimestriel

1. Crawler le site avec Screaming Frog
2. Identifier les pages avec 0 trafic organique sur 90 jours (Search Console)
3. Decision : mettre a jour le contenu, fusionner avec une autre page, ou 301 redirect
4. Verifier les liens internes brises
5. Mettre a jour les articles de blog les plus populaires (stats, screenshots, dates)

---

## Schema markup detaille

### BreadcrumbList (toutes les pages)

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Accueil", "item": "https://donneesquebec.ca/" },
    { "@type": "ListItem", "position": 2, "name": "Immobilier", "item": "https://donneesquebec.ca/immobilier" },
    { "@type": "ListItem", "position": 3, "name": "FloodCheck" }
  ]
}
```

### FAQPage (pages outils avec FAQ)

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Comment verifier si un entrepreneur a une licence RBQ valide?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Entrez le nom ou le numero de licence de l'entrepreneur dans ContractorCheck. L'outil verifie en temps reel le registre de la RBQ et vous donne le statut de la licence, les restrictions et l'historique des plaintes."
      }
    },
    {
      "@type": "Question",
      "name": "Combien coute le rapport complet ContractorCheck?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Le resultat basique est gratuit. Le rapport complet avec historique, plaintes et score de fiabilite coute 19.99$ CAD (paiement unique, pas d'abonnement)."
      }
    }
  ]
}
```

### SoftwareApplication (pages outils)

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "ContractorCheck",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "CAD",
    "description": "Verification gratuite de licence RBQ"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "156"
  }
}
```

### Product (rapports payants)

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Rapport complet ContractorCheck",
  "description": "Rapport detaille sur un entrepreneur : historique RBQ, plaintes, inspections, score de fiabilite.",
  "offers": {
    "@type": "Offer",
    "price": "19.99",
    "priceCurrency": "CAD",
    "availability": "https://schema.org/InStock",
    "priceValidUntil": "2027-12-31"
  },
  "brand": {
    "@type": "Brand",
    "name": "DonneesQuebec.ca"
  }
}
```

### HowTo (articles de blog)

```json
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "Comment verifier un entrepreneur au Quebec",
  "step": [
    {
      "@type": "HowToStep",
      "name": "Entrez le nom de l'entrepreneur",
      "text": "Allez sur ContractorCheck et entrez le nom ou le numero de licence de l'entrepreneur."
    },
    {
      "@type": "HowToStep",
      "name": "Consultez le resultat gratuit",
      "text": "Le resultat basique vous montre si la licence est valide ou invalide."
    },
    {
      "@type": "HowToStep",
      "name": "Obtenez le rapport complet",
      "text": "Pour l'historique complet, les plaintes et le score de fiabilite, achetez le rapport a 19.99$."
    }
  ]
}
```

---

## Featured snippets + People Also Ask

### Strategie featured snippets

Formater les pages outils pour capturer les featured snippets Google (position 0) :

1. **Format question-reponse** : chaque page outil inclut une section FAQ avec 5-8 questions
2. **Reponse concise** : la premiere phrase repond directement a la question (40-60 mots)
3. **Format liste** : pour les "comment faire", utiliser des listes numerotees
4. **Format tableau** : pour les comparaisons, utiliser des tableaux HTML

### Questions PAA cibles par outil

**ContractorCheck :**
1. Comment verifier si un entrepreneur est licence au Quebec?
2. Ou trouver le numero de licence RBQ d'un entrepreneur?
3. Que faire si un entrepreneur n'a pas de licence?
4. Comment porter plainte contre un entrepreneur au Quebec?
5. Combien de temps est valide une licence RBQ?
6. Quels travaux necessitent une licence RBQ?
7. Comment savoir si un entrepreneur a des plaintes?
8. La licence RBQ est-elle obligatoire pour les petits travaux?
9. Comment verifier les assurances d'un entrepreneur?
10. Quel recours si un entrepreneur fait faillite pendant les travaux?

**FloodCheck :**
1. Comment savoir si ma maison est en zone inondable?
2. Ou trouver la carte des zones inondables au Quebec?
3. Puis-je construire en zone inondable?
4. Quelle est la difference entre zone 0-20 ans et 0-100 ans?
5. L'assurance couvre-t-elle les inondations au Quebec?
6. Comment verifier une zone inondable avant d'acheter?
7. Quels sont les risques d'acheter en zone inondable?
8. Le gouvernement rachete-t-il les maisons en zone inondable?
9. Comment connaitre l'historique des inondations a une adresse?
10. Zone inondable et valeur de la propriete : quel impact?

**GarderieFind :**
1. Comment trouver une place en garderie au Quebec?
2. Combien coute une garderie au Quebec?
3. Quelle est la difference entre CPE et garderie privee?
4. Combien de temps attendre pour une place en garderie?
5. Comment s'inscrire sur la liste d'attente La Place 0-5?
6. Les garderies privees sont-elles subventionnees?
7. A quel age inscrire son enfant en garderie?
8. Garderie a 9.10$ : comment ca marche?
9. Puis-je deduire les frais de garderie aux impots?
10. Comment evaluer la qualite d'une garderie?

---

## SEO specifique Quebec

### Avantage competitif : keywords francais

Les keywords en francais Quebec sont **5 a 10 fois moins competitifs** que leurs equivalents anglais. Le marche SEO francophone est beaucoup moins sature :

| Keyword francais | KD | Keyword anglais equivalent | KD |
|---|---|---|---|
| "verifier entrepreneur quebec" | 15-20 | "check contractor license" | 60-70 |
| "zone inondable adresse" | 10-15 | "flood zone by address" | 50-60 |
| "place garderie montreal" | 20-25 | "daycare availability" | 45-55 |
| "salaire moyen quebec" | 25-30 | "average salary canada" | 55-65 |

### Domaine .ca obligatoire

- Utiliser un domaine `.ca` (pas `.com`) pour signaler a Google que le site cible le Canada
- Google favorise les `.ca` pour les recherches canadiennes
- Bonus : confiance accrue des visiteurs quebecois

### hreflang fr-CA

```html
<link rel="alternate" hreflang="fr-CA" href="https://donneesquebec.ca/verifier-entrepreneur" />
```

- Utiliser `fr-CA` (pas `fr` generique) pour cibler specifiquement le Quebec
- **Pas de pages anglaises.** Le site est 100% francais. Le marche anglophone au Quebec est trop petit pour justifier une traduction, et ca diluerait l'autorite du domaine.
- Si un jour on ajoute l'anglais : sous-domaine `en.donneesquebec.ca` avec hreflang `en-CA`

### Termes quebecois vs francais standard

Utiliser les termes que les Quebecois cherchent reellement, pas le francais de France :

| Terme quebecois (utiliser) | Terme francais standard (eviter) | Terme anglais (jamais) |
|---|---|---|
| Entrepreneur | Artisan / Contracteur | Contractor |
| Garderie / CPE | Creche | Daycare |
| Licence RBQ | Permis de construire | Building permit |
| Evaluation fonciere | Estimation immobiliere | Property assessment |
| Courtier immobilier | Agent immobilier | Real estate agent |
| Renovation | Travaux | Remodeling |
| Zonage | Plan d'urbanisme | Zoning |
| Permis de construction | Autorisation de travaux | Building permit |
| Desjardins, Mouvement | Banque cooperative | Credit union |

### Impact sur le contenu

- Ecrire comme un Quebecois parle : "checker un entrepreneur", "pogner une place en garderie"
- Dans les titres et meta : formel mais quebecois ("Verifier un entrepreneur au Quebec")
- Dans le corps du texte : naturel et accessible
- Jamais de "vous" partout comme en France — le "tu" est acceptable dans le contenu informal
