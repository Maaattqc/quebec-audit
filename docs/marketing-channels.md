# Canaux Marketing — Plateforme donnees Quebec

## Hierarchie des canaux

Tous les canaux ne se valent pas. Prioriser selon le ratio effort/ROI :

| Priorite | Canal | Cout mensuel | Temps/semaine | ROI attendu | Delai |
|---|---|---|---|---|---|
| 1 | **SEO** | 0$ | 10-15h | Tres eleve | 3-6 mois |
| 2 | **Google Ads** | 100-500$ | 3-5h | Eleve | Immediat |
| 3 | **Email** | 0-50$ | 2-3h | Tres eleve | 1-2 mois |
| 4 | **Social organique** | 0$ | 3-5h | Moyen | 2-4 mois |
| 5 | **Partenariats** | 0$ | 2-3h | Eleve | 1-3 mois |
| 6 | **Referral** | Variable | 1h setup | Eleve | 3-6 mois |
| 7 | **PR / Medias** | 0$ | 1-2h | Variable | Variable |

### Regle d'allocation

```
Temps total marketing : ~25h/semaine

SEO (contenu + technique) : 50% = 12-13h
Google Ads (gestion)      : 10% = 2-3h
Email (sequences + news)  : 15% = 3-4h
Social organique          : 10% = 2-3h
Partenariats              : 10% = 2-3h
PR / Referral             :  5% = 1-2h
```

---

## Social organique

### LinkedIn (B2B — priorite #1 social)

**Cadence** : 3 posts/semaine (lundi, mercredi, vendredi matin)

**Types de contenu :**

| Type | Frequence | Exemple |
|---|---|---|
| Data insight | 2x/semaine | "42% des entrepreneurs en Beauce ont une licence expiree — voici comment verifier" |
| Outil showcase | 1x/semaine | "On a lance AlertePermis : recevez les nouveaux permis de construction dans votre zone" |
| Behind the scenes | 1x/2 semaines | "Comment on collecte et traite les donnees ouvertes du Quebec" |
| Temoignage client | 1x/mois | "Un courtier de Quebec a trouve 3 terrains contamines grace a TerraCheck" |

**Groupes LinkedIn a cibler :**
- Courtiers immobiliers du Quebec
- Entrepreneurs en construction Quebec
- Association de la construction du Quebec (ACQ)
- Professionnels de l'immobilier
- Notaires du Quebec

**Format optimal** : texte + 1 image/graphique de donnees. Pas de liens externes dans le post (LinkedIn penalise). Mettre le lien en premier commentaire.

### Facebook (B2C — priorite #2 social)

**Groupes a rejoindre et publier (avec valeur, pas de spam) :**

| Groupe | Cible | Outil a promouvoir |
|---|---|---|
| Immobilier Quebec / Montreal | Acheteurs maison | FloodCheck, TerraCheck, PropTech |
| Parents [ville] | Parents | GarderieFind |
| Renovation Quebec | Proprietaires | ContractorCheck, RenoPrix |
| Premiers acheteurs immobilier | Millennials | FloodCheck, ZonageExpress |

**Strategie** : repondre aux questions des membres avec des reponses utiles + lien vers l'outil pertinent. Ratio 80% valeur / 20% promo.

**Page Facebook** : publier 2-3x/semaine, meme contenu que LinkedIn adapte pour un ton plus casual.

### Reddit

**Subreddits cibles :**
- r/quebec — questions generales sur la vie au Quebec
- r/montreal — questions immobilier, garderies, quartiers
- r/PersonalFinanceCanada — questions salaire, impots
- r/canadahousing — immobilier, zones inondables

**Regles strictes :**
- **Jamais de spam** — Reddit detecte et ban rapidement
- Repondre a des questions existantes avec une reponse complete + "j'ai utilise [outil] pour verifier"
- Faire un "Show HN" / "J'ai cree un outil" post 1x par outil majeur
- Compte actif avec karma avant de poster des liens

### YouTube (mois 6+)

**Format** : tutos ecran + voix, 5-10 minutes

**Videos a creer :**

| Video | Outil | Keywords YouTube |
|---|---|---|
| "Comment verifier un entrepreneur au Quebec" | ContractorCheck | "verifier entrepreneur quebec" |
| "Votre maison est-elle en zone inondable?" | FloodCheck | "zone inondable quebec" |
| "Trouver une place en garderie — guide complet" | GarderieFind | "place garderie quebec" |
| "Combien vaut votre terrain? Verification en 2 min" | PropTech | "evaluation terrain quebec" |
| "Cout renovation maison Quebec 2026" | RenoPrix | "cout renovation quebec" |

**Cadence** : 1-2 videos/mois. Qualite > quantite. Description avec lien vers l'outil + timestamps.

### TikTok (mois 9+ — experimental)

**Format** : videos courtes 30-60 sec, donnees surprenantes

**Exemples :**
- "Le quartier le plus cher de Montreal vs le moins cher" (avec donnees)
- "J'ai verifie mon entrepreneur et voici ce que j'ai trouve"
- "Zone inondable : est-ce que votre maison est a risque?"

**Cible** : millennials/Gen Z premiers acheteurs. Faible priorite mais potentiel viral.

---

## Partenariats

### Organisations professionnelles

| Organisation | Contact | Proposition | Valeur pour eux |
|---|---|---|---|
| **OACIQ** (courtiers) | Directeur communication | Tarif Pro courtiers -30%, co-branding rapports | Outil pour leurs membres |
| **ACQ** (construction) | Responsable numerique | ContractorCheck valide leurs membres gratuitement | Badge "verifie ACQ" |
| **Chambre des notaires** | Service aux membres | PropTech + TerraCheck pour notaires | Due diligence facilitee |
| **UMQ** (municipalites) | Service TI | MuniDash gratuit contre backlink .gouv.qc.ca | Dashboard gratuit = valeur immense |
| **APCHQ** (habitation) | Marketing | RenoPrix powered by APCHQ | Donnees de prix pour leurs membres |

### Municipalites (backlinks .gouv.qc.ca = or SEO)

Proposer MuniDash gratuit aux municipalites en echange de :
1. Un lien sur leur site web (backlink .gouv.qc.ca = tres haute autorite)
2. Une mention dans leur newsletter citoyenne
3. L'acces a leurs donnees ouvertes en priorite

**Cibles prioritaires** : municipalites avec site web actif et > 10,000 habitants.

### Courtiers et notaires individuels

Programme de referral pour les professionnels :

```
Le courtier/notaire recommande nos outils a ses clients
→ Lien personnalise : donneesquebec.ca/?ref=courtier-abc
→ Le client achete un rapport
→ Le courtier recoit 20% de la premiere transaction
→ Le client recoit 10% de rabais
```

Implementation : URL avec `?ref=` → stocker dans la session → appliquer a Stripe → payer via Stripe Connect ou manuellement mensuellement.

---

## Programme referral

### Structure

| Segment | Recompense referrer | Recompense refere | Implementation |
|---|---|---|---|
| Pay-per-use | 20% de la premiere transaction (3-5$) | 10% rabais sur le rapport | Stripe Coupon |
| Abonnement | 1 mois gratuit | 10% off premier mois | Stripe Credit |
| Pro | 1 mois gratuit | 10% off premier mois | Stripe Credit |
| B2B API | 50$ flat par referral converti | 1 mois gratuit sandbox | Manuel |

### Implementation technique

```
URL referral : donneesquebec.ca/?ref={user_id}

1. Visiteur clique le lien referral
2. Stocker ref={user_id} dans un cookie 30 jours
3. Si le visiteur achete → appliquer le coupon refere
4. Crediter le referrer (Stripe Customer Balance ou paiement mensuel)
5. Notification email au referrer : "Vous avez gagne X$"
```

### Page referral dans le compte utilisateur

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Votre lien de parrainage :
donneesquebec.ca/?ref=abc123   [Copier]

Vos stats :
- 12 personnes ont clique votre lien
- 3 ont achete un rapport
- Vous avez gagne 14.50$
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Promouvoir le referral

- Lien dans l'email post-achat (J+7)
- Bouton "Partager ce resultat" apres chaque rapport
- Page referral dans le dashboard utilisateur
- Mention dans la newsletter mensuelle

---

## PR et medias

### Publications cibles

| Publication | Type | Angle | Priorite |
|---|---|---|---|
| **Les Affaires** | Business | "Un dev de la Beauce democratise les donnees publiques" | Haute |
| **Protegez-Vous** | Consommateur | "Comment verifier un entrepreneur en 10 secondes" | Haute |
| **Radio-Canada** | General | "Donnees ouvertes : ce que vous pouvez verifier gratuitement" | Haute |
| **TVA regions** | Regional | "Un Beauceron cree un outil pour verifier les entrepreneurs" | Haute |
| **Le Soleil** | Regional Quebec | "FloodCheck : verifier les zones inondables avant d'acheter" | Moyenne |
| **Journal de Montreal** | Grand public | "La crise des garderies : un outil pour trouver une place" | Moyenne |
| **L'actualite** | Magazine | "Les donnees ouvertes au Quebec : potentiel inexploite" | Basse |

### Angles mediatiques

1. **L'histoire du fondateur** : dev de la Beauce qui utilise les donnees ouvertes pour aider les Quebecois
2. **La crise des garderies** : GarderieFind comme solution concrete au probleme
3. **Verifier avant de payer** : ContractorCheck protege les consommateurs (angle Protegez-Vous)
4. **Donnees ouvertes = democratisation** : le gouvernement publie les donnees, on les rend accessibles
5. **Immobilier et risques** : zones inondables, terrains contamines — ce que les acheteurs ne savent pas

### Podcasts tech Quebec

| Podcast | Audience | Angle |
|---|---|---|
| Startup Montreal | Entrepreneurs tech | Comment builder une plateforme de donnees au Quebec |
| Rad (Radio-Canada) | Grand public tech | Donnees ouvertes et vie quotidienne |
| Balado en affaires | PME | Micro-SaaS et donnees ouvertes comme business model |

### Timeline PR

- **Mois 1-2** : Construire un dossier de presse (1 page, stats, screenshots, bio)
- **Mois 3** : Pitcher 3-5 medias regionaux (angle local Beauce)
- **Mois 4-6** : Pitcher publications nationales avec des donnees concretes (nombre d'utilisateurs, stats)
- **Mois 6+** : Podcasts et conferences tech

---

## Communaute

### Product Hunt

- Lancer 1 outil phare (ContractorCheck ou FloodCheck) sur Product Hunt
- **Preparation** : 50+ upvotes de contacts le jour du lancement
- Jour optimal : mardi ou mercredi (moins de competition)
- Description en anglais pour maximiser la visibilite (meme si le produit est en francais)

### Hacker News "Show HN"

- Post "Show HN: I built a platform to check contractors, flood zones and daycare in Quebec using open data"
- **Timing** : matin EST (8-10h) pour capter l'audience nord-americaine
- Etre present pour repondre aux commentaires pendant 2-3 heures
- Angle technique : open data + scraping + stack technique

### Showcase donneesquebec.ca

- Soumettre la plateforme comme exemple d'utilisation de donnees ouvertes
- Lien retour = backlink .gouv.qc.ca (haute autorite)
- Contacter le responsable des donnees ouvertes du Tresor

### Meetups tech locaux

| Meetup | Ville | Frequence | Presentation |
|---|---|---|---|
| Montreal Python / JS | Montreal | Mensuel | "Scraping et analyse de donnees ouvertes Quebec" |
| Quebec Numerique | Quebec | Trimestriel | "Builder un micro-SaaS avec les donnees ouvertes" |
| Startup Beauce | Saint-Georges | Variable | "De 0 a plateforme : l'histoire" |

### Universites

- **Pro gratuit pour etudiants** en urbanisme, immobilier, environnement
- En echange : feedback, bug reports, et backlinks des pages de ressources universitaires
- Cibles : ULaval (urbanisme), UQAM (environnement), HEC (entrepreneuriat), ETS (tech)

---

## Bouche-a-oreille

### Bouton "Partager ce resultat"

Apres chaque resultat (gratuit ou payant), afficher un bouton de partage :

```
[Partager sur Facebook] [Partager sur LinkedIn] [Copier le lien]
```

Le lien partage une version publique du resultat (sans les donnees payantes) qui sert de landing page pour les nouveaux visiteurs.

### Cartes data partageables

Generer automatiquement une image (Open Graph) pour chaque resultat :

```
┌─────────────────────────────────────┐
│ FloodCheck                          │
│ 123 rue Principale, Quebec          │
│                                     │
│ ✓ HORS zone inondable              │
│                                     │
│ Verifiez votre adresse →            │
│ donneesquebec.ca/zone-inondable     │
└─────────────────────────────────────┘
```

Quand quelqu'un partage le lien sur Facebook/LinkedIn, cette carte s'affiche automatiquement (via `og:image`). Ca genere de la curiosite et des clics.

---

## Campagnes saisonnieres cross-canal

### Calendrier 12 mois

| Mois | Campagne | Canaux | Outils | Budget special |
|---|---|---|---|---|
| Janvier | "Nouvelles evaluations foncieres" | Email + SEO + Ads | ImmoTax, PropTech | +20% Ads |
| Fevrier | "Planifiez vos renos" | Social + Email + Blog | ContractorCheck, RenoPrix | — |
| Mars | "Saison immo commence" | Ads + Email + LinkedIn | FloodCheck, TerraCheck, PropTech | +30% Ads |
| Avril | "Saison construction" | Ads + Social + PR | ContractorCheck, AlertePermis | +40% Ads |
| Mai | "Achetez en confiance" | Ads + Email + Partenariats courtiers | FloodCheck, ZonageExpress | +40% Ads |
| Juin | "Reno ete" | Social + Blog | RenoPrix, ContractorCheck | — |
| Juillet | Pause estivale | Email auto seulement | — | -20% Ads |
| Aout | "Rentree garderie" | Ads + Facebook groupes parents + PR | GarderieFind | +40% Ads |
| Septembre | "Budgets municipaux" | LinkedIn + Email B2B | MuniDash, BidWatch | +20% Ads |
| Octobre | "Avant l'hiver" | Blog + Email | ClimatRisk, InsureScore | — |
| Novembre | "Black Friday outils" | Email + Ads + Social | Tous (20% off) | +30% Ads |
| Decembre | "Bilan annuel" | Newsletter + Blog | SalaireLab (salaires 2027) | -20% Ads |

---

## Budget et allocation

### Budget marketing total (annee 1)

| Canal | Budget annuel | % budget | % temps | % revenue attendu |
|---|---|---|---|---|
| SEO (contenu + technique) | 0$ (temps) | 0% | 50% | 60% |
| Google Ads | 2,000-5,000$ | 60% | 10% | 20% |
| Email | 0-600$ (Resend) | 10% | 15% | 10% |
| Social | 0$ | 0% | 10% | 5% |
| Partenariats | 0$ | 0% | 10% | 3% |
| PR / Referral | 0-500$ | 5% | 5% | 2% |
| **Total** | **2,000-6,100$** | **100%** | **100%** | **100%** |

### ROI par canal (projection mois 12)

| Canal | Depense cumulee | Revenue genere | ROI |
|---|---|---|---|
| SEO | 0$ (temps seulement) | 6,000-18,000$ | Infini (temps investi) |
| Google Ads | 2,000-5,000$ | 4,000-10,000$ | 2-3x |
| Email | 0-600$ | 1,000-3,000$ | 5-10x |
| Social | 0$ | 500-1,500$ | Infini (temps investi) |
| Partenariats | 0$ | 300-900$ | Infini |

**Regle** : si un canal ne genere pas de revenue apres 3 mois d'effort, reduire le temps investi et reallouer vers les canaux performants.
