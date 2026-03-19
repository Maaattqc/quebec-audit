# Strategie de monetisation — Plateforme donnees Quebec

## Approche : "Usine a micro-produits"

Ne PAS builder 100 produits separes. Builder **1 plateforme** avec 1 infrastructure et chaque "produit" = une page/feature en plus.

---

## 3 niveaux de pricing

### Niveau 1 — Pay-per-use (majorite des outils)

La plupart des outils sont des lookups ponctuels. Personne ne s'abonne pour verifier un entrepreneur 1 fois.

- **Gratuit** : resultat basique (nom, statut, 1-2 infos)
- **Rapport complet** : 5-25$ one-time via Stripe Checkout (pas d'abo)

| Outil | Gratuit | Rapport payant | Prix |
|---|---|---|---|
| ContractorCheck | Nom + licence valide/invalide | Historique complet, plaintes, inspections, score | 19.99$ |
| FloodCheck | Zone inondable oui/non | Carte detaillee, historique crues, impact valeur | 14.99$ |
| TerraCheck | Contamine oui/non | Rapport complet, historique, zonage, risques | 14.99$ |
| ZonageExpress | Zone actuelle | Usages permis, hauteur, densification, comparable | 9.99$ |
| BatiScan | Age + type | Diagnostic complet, renovations, risques, energie | 19.99$ |
| RenoPrix | Fourchette de prix | Detail par poste, comparables, entrepreneurs | 14.99$ |
| PropTech Report | Score global | PDF complet 7 datasets, comparable, carte | 24.99$ |
| InsureScore | — | API per-call pour assureurs | 0.50-2$/call |

### Niveau 2 — Abonnement individuel (outils a usage recurrent)

Certains outils ont une valeur continue = abo individuel par outil.

| Outil | Prix/mois | Pourquoi recurrent |
|---|---|---|
| AlertePermis | 50-100$ | Alertes continues nouveaux permis dans ta zone |
| GarderieFind Alertes | 10$ | Alertes places disponibles |
| BidWatch | 100-200$ | Veille contrats publics par secteur |
| TaxeAlert | 30$ | Monitoring changements fiscaux |
| PermisTracker | 30-50$ | Rappels renouvellement licences |
| BizObitu | 50$ | Alertes fermetures entreprises = opportunites |

Chaque outil a SON propre abo. Un plombier s'abonne a AlertePermis mais pas a GarderieFind.

### Niveau 3 — Pro (bundle power users)

Pour professionnels qui utilisent plusieurs outils :

- **99$/mois** → acces illimite a tous les rapports pay-per-use
- **Cible** : courtiers immobiliers, notaires, comptables, promoteurs
- **Upsell** : le courtier qui utilise FloodCheck + TerraCheck + ZonageExpress 10x/mois → "Pro a 99$ au lieu de payer 20$/rapport"

---

## Flux client

```
Visiteur Google (SEO ou pub)
  → Outil gratuit (resultat basique, 0$)
  → "Voir le rapport complet" → Stripe Checkout 15-25$ (one-time)
  → Client satisfait qui revient
    → Alertes/abonnement individuel 10-100$/mois
    → OU upgrade Pro 99$/mois (tout inclus)
```

```
Visiteur B2B (courtier, notaire, entrepreneur)
  → Teste 2-3 rapports pay-per-use
  → Realise qu'il en a besoin souvent
  → Upgrade Pro 99$/mois
  → Revenue recurrent stable
```

---

## Stripe : implementation technique

### Pay-per-use (Stripe Checkout)

```typescript
// Chaque rapport = 1 Stripe Checkout session
const session = await stripe.checkout.sessions.create({
  mode: "payment",
  line_items: [{
    price_data: {
      currency: "cad",
      product_data: { name: "Rapport ContractorCheck" },
      unit_amount: 1999, // 19.99$ CAD
    },
    quantity: 1,
  }],
  automatic_tax: { enabled: true }, // TPS + TVQ auto
  success_url: `${domain}/rapport/{CHECKOUT_SESSION_ID}`,
});
```

### Abonnements (Stripe Billing)

```typescript
// Abonnement AlertePermis
const session = await stripe.checkout.sessions.create({
  mode: "subscription",
  line_items: [{
    price: "price_alertepermis_monthly", // Cree dans Stripe Dashboard
    quantity: 1,
  }],
  automatic_tax: { enabled: true },
});
```

### Pro bundle (Stripe Billing)

```typescript
// Abonnement Pro
const session = await stripe.checkout.sessions.create({
  mode: "subscription",
  line_items: [{
    price: "price_pro_monthly", // 99$/mois
    quantity: 1,
  }],
  automatic_tax: { enabled: true },
});
```

### Taxes (Stripe Tax)

Stripe Tax gere automatiquement :
- **TPS** : 5% (federal)
- **TVQ** : 9.975% (Quebec)
- Total : 14.975% ajoute automatiquement

---

## Chaque micro-produit = meme pattern

1. Un **input** (adresse, nom d'entreprise, secteur)
2. Un **resultat gratuit** (apercu, score basique)
3. Un **upsell payant** (rapport complet, alertes, details)
4. Un bouton **Stripe** (5-25$ one-time ou abonnement)

Ce pattern est replique pour chaque outil → 1 template React, N instances.

---

## Revenue projections (conservateur)

| Mois | Outils live | Trafic/mois | Revenue mensuel |
|---|---|---|---|
| 1 | 5-10 | 500 | 100-500$ |
| 3 | 20-30 | 3,000 | 1,000-3,000$ |
| 6 | 50+ | 10,000 | 3,000-10,000$ |
| 12 | 75+ | 30,000+ | 10,000-30,000$ |

### Sources de revenue a mois 12

| Source | % du revenue | Revenue estime |
|---|---|---|
| Pay-per-use (rapports) | 40% | 4,000-12,000$ |
| Abonnements individuels | 30% | 3,000-9,000$ |
| Pro (99$/mois) | 25% | 2,500-7,500$ |
| API B2B (InsureScore, etc.) | 5% | 500-1,500$ |

---

## Combos de produits (suites)

Vendre des suites = ARPU (average revenue per user) plus eleve.

| Suite | Outils inclus | Cible | Prix/mois |
|---|---|---|---|
| **Immo Suite** | PropTech + FloodCheck + TerraCheck + ZonageExpress + ImmoTax + ClimatRisk + BatiScan | Courtiers, notaires | 149$/mois |
| **Contractor Suite** | ContractorCheck + RenoPrix + AlertePermis + PermisBot | Entrepreneurs reno | 79$/mois |
| **Muni Suite** | MuniDash + GovBot + DocuMuni + DeneigePro + EcoCollecte | Municipalites | 499$/mois |
| **Assurance Suite** | InsureScore + CrimMap + ClimatRisk + FloodCheck | Assureurs | 299$/mois |

---

## Ce qu'il faut PAS faire

- Ne build PAS 100 produits parfaits — build 100 outils basiques qui marchent
- Ne mets PAS 5,000$ en pub avant d'avoir du trafic organique
- Ne cree PAS 100 domaines separes
- Ne passe PAS 3 mois a coder sans avoir mis en ligne
- Ne fais PAS de waitlist — build le MVP minimal et mets-le live
- **Regle d'or : met en ligne vite, mesure ce qui vend, ameliore ce qui marche**

---

## LTV par segment

La lifetime value (LTV) determine combien on peut depenser pour acquerir un client (CAC).

| Segment | Prix moyen | Frequence | Retention moyenne | LTV |
|---|---|---|---|---|
| Pay-per-use | 18$ | 1.5 achats | — | **27$** |
| Abonnement individuel | 40$/mois | Mensuel | 8 mois | **320$** |
| Pro (99$/mois) | 99$/mois | Mensuel | 14 mois | **1,386$** |
| API B2B | 299$/mois | Mensuel | 18 mois | **5,382$** |

### Hypotheses

- **Pay-per-use** : 30% des clients achetent un 2e rapport (1.5 achats moyens x 18$ = 27$)
- **Abonnement** : churn mensuel ~12.5% → retention moyenne 8 mois
- **Pro** : churn mensuel ~7% → retention moyenne 14 mois (clients stickier car usage quotidien)
- **API B2B** : churn mensuel ~5.5% → retention moyenne 18 mois (integration technique = switching cost)

---

## Periode de recuperation du CAC

### CAC cible par segment

Le ratio LTV/CAC doit etre > 3x pour etre viable a long terme.

| Segment | LTV | CAC max (LTV/3) | CAC cible | Payback period |
|---|---|---|---|---|
| Pay-per-use | 27$ | 9$ | 5-7$ | Immediat (1er achat) |
| Abonnement | 320$ | 107$ | 50-80$ | 1-2 mois |
| Pro | 1,386$ | 462$ | 150-300$ | 2-3 mois |
| API B2B | 5,382$ | 1,794$ | 500-1,000$ | 2-3 mois |

### Calcul Google Ads CAC

```
CPC moyen Quebec : 1.50$
Taux de conversion landing page : 7%
CAC Google Ads = 1.50$ / 0.07 = 21.43$

→ Rentable pour Abonnement (CAC cible 50-80$) ✓
→ Rentable pour Pro (CAC cible 150-300$) ✓
→ PAS rentable pour pay-per-use (CAC cible 5-7$) ✗
→ Solution pay-per-use : acquerir via SEO (gratuit) ou retargeting (CPC < 0.50$)
```

### Math du retour client

30% des clients pay-per-use reviennent dans les 90 jours :

```
100 clients pay-per-use acquis
→ 70 achetent 1 rapport (70 x 18$ = 1,260$)
→ 30 achetent un 2e rapport (30 x 18$ = 540$)
→ 5 convertissent en abo (5 x 320$ LTV = 1,600$)
→ 1 convertit en Pro (1 x 1,386$ LTV = 1,386$)
→ Revenue total = 4,786$ sur 100 clients = 47.86$/client effectif
```

---

## Prevention du churn

### Dunning emails (paiement echoue)

| Timing | Email | Contenu |
|---|---|---|
| J+1 | Alerte douce | "Votre paiement n'a pas passe. Mettez a jour votre carte pour garder vos alertes actives." |
| J+3 | Rappel | "Votre abonnement sera suspendu dans 4 jours. Mettre a jour → [lien]" |
| J+7 | Urgence | "Dernier rappel : votre abonnement sera annule demain. Vous perdrez vos alertes configurees." |
| J+14 | Annulation | "Votre abonnement a ete annule. Vos donnees sont conservees 30 jours. Reactivez → [lien]" |

Implementation : Stripe Billing gere le dunning automatiquement. Configurer les retries (J1, J3, J7) dans le Dashboard Stripe > Settings > Billing > Subscriptions.

### Engagement triggers (inactif)

| Trigger | Action |
|---|---|
| Inactif 14 jours | Email : "Nouvelles donnees disponibles pour [sa region]" avec 1-2 insights personnalises |
| Inactif 30 jours | Email : "On a genere votre rapport mensuel gratuit" avec preview des nouvelles alertes |
| Usage faible (< 2 rapports/mois pour Pro) | Email : "Saviez-vous que votre abo inclut [outil non utilise]?" |

### Usage reports mensuels

Chaque 1er du mois, envoyer un email automatique aux abonnes :

```
Votre activite ce mois :
- 12 rapports generes (valeur 216$)
- 3 alertes recues
- Top outil : ContractorCheck (8 rapports)
→ Votre abonnement vous a fait economiser 117$ ce mois
```

Objectif : rappeler la valeur recue pour reduire le churn passif.

### Cancellation flow

Quand un client clique "Annuler" :

1. **Raison** : "Pourquoi annulez-vous?" (trop cher, pas assez utilise, pas utile, autre)
2. **Offre de retention** :
   - Si "trop cher" → **50% off pour 1 mois** (Stripe Coupon)
   - Si "pas assez utilise" → **Pause 1 mois gratuit** (resume automatique)
   - Si "pas utile" → Laisser annuler (pas la bonne cible)
3. **Confirmation** : "Etes-vous sur? Vous perdrez [X alertes configurees]"

Cible : sauver 20-30% des cancellations avec cette flow.

### Win-back (post-cancel)

| Timing | Email | Offre |
|---|---|---|
| J+30 post-cancel | "Vous nous manquez" | 30% off pour 3 mois |
| J+60 post-cancel | "Nouvelles fonctionnalites" | 50% off pour 1 mois |
| J+90 post-cancel | Dernier essai | 1 mois gratuit |

Cible : recuperer 10-15% des clients annules via la sequence win-back.

---

## Strategie de rabais

### Types de rabais autorises

| Type | Rabais | Implementation |
|---|---|---|
| Annuel (paiement unique) | 17% off (= 2 mois gratuits) | Stripe Price annuel a cote du mensuel |
| Saisonnier (Black Friday, Rentrée) | 20-25% off, 1 semaine max | Stripe Coupon avec date d'expiration |
| Volume B2B (5+ licences) | 15-30% selon volume | Stripe Coupon par client, negociation manuelle |
| Premier rapport | 50% off | Stripe Coupon first-time-buyer, 1 usage max |
| Referral | 20% premiere achat pour le refere | Stripe Coupon lie au referral code |

### Regles strictes

- **Jamais Pro sous 79$/mois** (meme avec rabais max)
- **Jamais de rabais sur l'API B2B** (prix = signal de qualite enterprise)
- **Pas de rabais permanents** — toujours une date d'expiration
- **Maximum 1 coupon par client** (Stripe le gere nativement)

### Implementation Stripe Coupons API

```typescript
// Creer un coupon annuel 17% off
const coupon = await stripe.coupons.create({
  percent_off: 17,
  duration: 'forever',
  name: 'Annuel - 2 mois gratuits',
});

// Creer un coupon premier rapport 50% off
const coupon = await stripe.coupons.create({
  percent_off: 50,
  duration: 'once',
  max_redemptions: 1,
  name: 'Premier rapport -50%',
});

// Appliquer a une session Checkout
const session = await stripe.checkout.sessions.create({
  discounts: [{ coupon: coupon.id }],
  // ...
});
```

---

## Essai gratuit vs pas d'essai

### Philosophie : le free preview EST l'essai

Chaque outil offre un resultat gratuit (apercu, score basique). C'est plus puissant qu'un trial 14 jours parce que :

1. **Zero friction** : pas de carte de credit, pas de compte, pas de formulaire
2. **Valeur immediate** : le visiteur voit un resultat reel en 10 secondes
3. **Upsell naturel** : "Vous avez vu le basique. Le rapport complet a X$."
4. **Pas de clock ticking** : le client achete quand il est pret, pas dans 14 jours

### Regles par segment

| Segment | Essai gratuit? | Alternative |
|---|---|---|
| Pay-per-use | Non | Le resultat basique gratuit suffit |
| Abonnement individuel | Non | 1 alerte gratuite (ex: AlertePermis = 1 zone gratuite) |
| Pro (99$/mois) | **Oui, 7 jours** | Seulement pour B2B API prospects qualifies (appel de vente requis) |
| API B2B | **Oui, 7 jours** | Sandbox avec 100 calls gratuits |

### AlertePermis : 1 alerte gratuite

L'utilisateur peut configurer 1 alerte gratuite (1 zone geographique). Pour ajouter plus de zones → abonnement. Ca demontre la valeur sans trial a duree limitee.

---

## Revenue d'expansion

L'expansion revenue = augmenter le MRR sans acquerir de nouveaux clients. Cible : **20% du MRR = expansion** a mois 12.

### Cross-sell au checkout

Quand un client achete un rapport, proposer un bundle :

| Achat principal | Cross-sell | Rabais bundle |
|---|---|---|
| FloodCheck | TerraCheck | -30% sur le 2e rapport |
| ContractorCheck | RenoPrix | -25% sur le 2e rapport |
| PropTech Report | FloodCheck + TerraCheck + InsureScore | -40% sur le bundle complet |
| ZonageExpress | BatiScan | -30% sur le 2e rapport |

Implementation : Stripe Checkout `line_items` avec 2+ produits et un coupon bundle.

### Upsell paths

```
Pay-per-use x3 achats → Email : "Avec un abo a 40$/mois, ces 3 rapports auraient coute 0$"
Abonnement x2 outils → Email : "Avec Pro a 99$/mois, tous les outils sont inclus"
Pro usage eleve → Email : "Besoin d'API? Parlez a notre equipe B2B"
```

### Prompts in-app post-achat

Apres l'affichage du rapport paye, montrer :

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Rapport FloodCheck genere

Autres outils pertinents pour cette adresse :
→ TerraCheck : terrain contamine? (14.99$ ou inclus avec Pro)
→ ZonageExpress : quels usages permis? (9.99$ ou inclus avec Pro)
→ InsureScore : score de risque assurance (inclus avec Pro)

Avec Pro a 99$/mois, tous les rapports sont inclus.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Email cross-sell J+7

7 jours apres un achat, envoyer un email avec :
- "Vous avez verifie [adresse/entrepreneur]. Voici 2 autres verifications utiles."
- Lien direct vers 2 outils complementaires
- Coupon 20% off sur le prochain rapport (expire dans 7 jours)

### Metriques expansion

| Metrique | Cible mois 6 | Cible mois 12 |
|---|---|---|
| Cross-sell rate (checkout) | 8% | 15% |
| Upsell pay→abo | 3% | 5% |
| Upsell abo→Pro | 5% | 10% |
| Expansion MRR / total MRR | 10% | 20% |
