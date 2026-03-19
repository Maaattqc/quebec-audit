# Analytics et KPIs — Plateforme donnees Quebec

## North Star Metrics

Les 3 metriques qui comptent le plus. Si elles montent, le business va bien.

| Metrique | Definition | Cible mois 6 | Cible mois 12 |
|---|---|---|---|
| **MRR** (Monthly Recurring Revenue) | Somme des abonnements + Pro + API actifs | 1,000-3,000$ | 5,000-15,000$ |
| **Weekly Active Tool Users** | Utilisateurs uniques qui utilisent un outil par semaine | 500-1,500 | 3,000-8,000 |
| **Paid Conversion Rate** | % visiteurs outil → achat (rapport ou abo) | 3-5% | 5-8% |

---

## Funnel par etape (AARRR)

### Acquisition — comment les gens arrivent

| Metrique | Source | Cible mois 6 | Cible mois 12 |
|---|---|---|---|
| Trafic total/mois | Toutes sources | 5,000-15,000 | 20,000-50,000 |
| Trafic organique | SEO (Search Console) | 2,000-5,000 | 10,000-30,000 |
| Trafic paid | Google Ads | 1,000-3,000 | 3,000-8,000 |
| Trafic direct | Retour visiteurs, bookmarks | 500-2,000 | 3,000-8,000 |
| Trafic referral | Partenariats, backlinks | 200-500 | 1,000-3,000 |
| Trafic social | LinkedIn, Facebook, Reddit | 100-500 | 500-2,000 |
| Trafic email | Newsletter, sequences | 200-1,000 | 1,000-3,000 |

### Activation — est-ce qu'ils utilisent un outil?

| Metrique | Definition | Cible |
|---|---|---|
| Tool usage rate | % visiteurs qui utilisent au moins 1 outil | **40%** |
| Time to first tool use | Temps entre arrivee et premiere utilisation | < 30 secondes |
| Bounce rate pages outils | % qui quittent sans interagir | < 40% |

**40% tool usage rate** = 40% des visiteurs entrent une recherche dans un outil. C'est le signal d'activation.

### Revenue — est-ce qu'ils paient?

| Metrique | Definition | Cible |
|---|---|---|
| Free → paid conversion | % utilisateurs outil gratuit → achat rapport | 5-8% |
| Rapport → abo conversion | % acheteurs rapport → abonnement (30 jours) | 3-5% |
| Abo → Pro upgrade | % abonnes → upgrade Pro (90 jours) | 5-10% |
| ARPU (average revenue per user) | Revenue / utilisateurs actifs | 2-5$/mois |
| AOV (average order value) | Revenue pay-per-use / nombre de transactions | 15-20$ |

### Retention — est-ce qu'ils reviennent?

| Metrique | Definition | Cible |
|---|---|---|
| D7 retention | % utilisateurs qui reviennent dans 7 jours | 15-25% |
| D30 retention | % utilisateurs qui reviennent dans 30 jours | 8-15% |
| D90 retention | % utilisateurs qui reviennent dans 90 jours | 5-10% |
| Churn mensuel abo | % abonnes qui annulent par mois | < 10% |
| Churn mensuel Pro | % Pro qui annulent par mois | < 7% |
| Repeat purchase rate | % acheteurs pay-per-use qui rachetent (90 jours) | 25-35% |

### Referral — est-ce qu'ils en parlent?

| Metrique | Definition | Cible |
|---|---|---|
| Referral rate | % utilisateurs qui partagent un resultat | 3-5% |
| Referral conversion | % referes qui utilisent un outil | 30-50% |
| Viral coefficient | Nouveaux utilisateurs generes par utilisateur | 0.1-0.3 |
| NPS (Net Promoter Score) | Sondage trimestriel | > 40 |

---

## Unit economics

### CAC par canal

| Canal | Cout/acquisition | Volume | Qualite (retention) |
|---|---|---|---|
| SEO | 0$ (temps seulement) | Eleve | Elevee (intent fort) |
| Google Ads | 15-25$ | Moyen | Moyenne |
| Email (lead nurture) | 2-5$ | Faible-moyen | Tres elevee |
| Social organique | 0$ (temps) | Faible | Moyenne |
| Referral | 3-5$ (coupon) | Faible | Tres elevee |
| PR | 0$ | Variable (spikes) | Moyenne |

### Blended CAC

```
Blended CAC = total marketing spend / total nouveaux clients payants

Cible :
  Mois 3 : 20-30$ (beaucoup d'Ads, peu d'organique)
  Mois 6 : 12-18$ (SEO commence a livrer)
  Mois 12 : 8-12$ (SEO dominant)
```

### LTV par segment

| Segment | LTV | CAC cible (LTV/3) | LTV/CAC ratio |
|---|---|---|---|
| Pay-per-use | 27$ | 9$ | > 3x |
| Abonnement | 320$ | 107$ | > 3x |
| Pro | 1,386$ | 462$ | > 3x |
| API B2B | 5,382$ | 1,794$ | > 3x |

### Contribution margin par outil

```
Revenue par rapport : 19.99$
- Stripe fees (2.9% + 0.30$) : 0.88$
- Cout serveur par rapport : ~0.01$
- Cout data/API : ~0.05$
= Contribution margin : 19.05$ (95.3%)

Revenue abo 40$/mois :
- Stripe fees : 1.46$
- Cout serveur : ~0.50$
= Contribution margin : 38.04$/mois (95.1%)

Revenue Pro 99$/mois :
- Stripe fees : 3.17$
- Cout serveur : ~2.00$
= Contribution margin : 93.83$/mois (94.8%)
```

Les marges sont excellentes car le cout marginal par utilisateur est quasi-nul (donnees ouvertes + scraping).

---

## Attribution

### Last-touch + UTM convention

Chaque lien marketing utilise des UTMs standardises :

```
Convention UTM :
  utm_source   = {plateforme}     → google, facebook, linkedin, newsletter, referral
  utm_medium   = {type}           → cpc, organic, social, email, referral
  utm_campaign = {campagne}       → contractor-check-launch, spring-immo, newsletter-mars
  utm_content  = {variante}       → headline-a, cta-blue, image-v2
  utm_term     = {keyword}        → verifier-entrepreneur-quebec (Ads seulement)
```

### Exemples

```
Google Ads :
  ?utm_source=google&utm_medium=cpc&utm_campaign=contractor-check&utm_term=verifier+entrepreneur+quebec

Newsletter :
  ?utm_source=newsletter&utm_medium=email&utm_campaign=newsletter-2026-03-15&utm_content=cta-floodcheck

LinkedIn post :
  ?utm_source=linkedin&utm_medium=social&utm_campaign=data-insight-mars

Referral courtier :
  ?utm_source=referral&utm_medium=referral&utm_campaign=courtier-jean-tremblay
```

### Stocker UTM dans le user record

```typescript
// Au premier visit, capturer les UTMs
const utmParams = {
  source: url.searchParams.get('utm_source'),
  medium: url.searchParams.get('utm_medium'),
  campaign: url.searchParams.get('utm_campaign'),
  content: url.searchParams.get('utm_content'),
  term: url.searchParams.get('utm_term'),
  landing_page: window.location.pathname,
  timestamp: new Date().toISOString(),
};

// Stocker dans localStorage (visiteur anonyme)
localStorage.setItem('first_touch_utm', JSON.stringify(utmParams));

// Envoyer au serveur quand le visiteur s'identifie (achat, email capture)
```

### Multi-touch (mois 6+)

Quand le volume de donnees le permet, passer a l'attribution multi-touch :

1. **First-touch** : quel canal a amene le visiteur la premiere fois?
2. **Last-touch** : quel canal a declenche l'achat?
3. **Linear** : credit egal a chaque touchpoint
4. **Data-driven** : Google Analytics 4 le calcule automatiquement avec assez de data

Au debut, **last-touch suffit**. Ne pas over-engineerer l'attribution avant d'avoir 100+ conversions/mois.

---

## Cohortes

### Cohortes mensuelles

Suivre chaque cohorte mensuelle (tous les utilisateurs acquis en mois X) et mesurer :

| Metrique | M0 | M1 | M2 | M3 | M6 | M12 |
|---|---|---|---|---|---|---|
| Utilisateurs actifs | 100% | 25% | 18% | 14% | 8% | 5% |
| Revenue cumule | X$ | — | — | — | — | — |
| Conversion payante | — | 5% | 7% | 8% | 8% | 8% |

### Cohortes par canal

Comparer la qualite des utilisateurs selon le canal d'acquisition :

| Canal | D30 retention | Conversion payante | LTV |
|---|---|---|---|
| SEO | 15% | 7% | 35$ |
| Google Ads | 10% | 5% | 22$ |
| Email nurture | 20% | 12% | 48$ |
| Referral | 18% | 10% | 42$ |
| Social | 8% | 3% | 15$ |

### Cohortes par premier outil utilise

Identifier quel outil est le meilleur "point d'entree" :

| Premier outil | D30 retention | Conversion | Revenue/user |
|---|---|---|---|
| ContractorCheck | 12% | 8% | 4.50$ |
| FloodCheck | 15% | 7% | 3.80$ |
| GarderieFind | 8% | 4% | 1.20$ |
| SalaireLab | 5% | 2% | 0.60$ |
| PropTech Report | 18% | 12% | 8.00$ |

→ Les outils immobiliers ont la meilleure retention et conversion. Prioriser l'acquisition sur ces outils.

---

## Framework A/B testing

### Outil : PostHog Feature Flags

PostHog permet de deployer des feature flags et mesurer l'impact sur les conversions :

```typescript
// Exemple : tester 2 prix pour ContractorCheck
const variant = posthog.getFeatureFlag('contractor-check-price');

const price = variant === 'higher' ? 24.99 : 19.99;
```

### Tests prioritaires

| Priorite | Test | Hypothese | Metrique |
|---|---|---|---|
| 1 | Prix rapport (19.99$ vs 24.99$) | Le prix plus eleve ne reduit pas les conversions de > 20% | Revenue/visitor |
| 2 | CTA ("Rapport complet" vs "Voir les details") | Un CTA plus specifique convertit mieux | CTR bouton |
| 3 | Longueur free preview (3 infos vs 5 infos) | Moins de gratuit = plus de conversions | Conversion rate |
| 4 | Layout outil (input en haut vs milieu) | L'input visible immediatement convertit mieux | Tool usage rate |
| 5 | Email capture (avant vs apres resultat) | Apres le resultat = plus de confiance | Email capture rate |

### Regles

- **Maximum 2 tests simultanes** (sinon les resultats se contaminent)
- **Minimum 2 semaines** par test (capturer les variations jour/semaine)
- **Minimum 100 conversions** par variante avant de declarer un gagnant
- **Significance 95%** : utiliser un calculateur de significance statistique
- **Documenter chaque test** : hypothese, variantes, resultats, decision

### Log des tests A/B

| # | Date | Test | Variantes | Gagnant | Impact | Decision |
|---|---|---|---|---|---|---|
| 1 | — | — | — | — | — | — |

(Remplir au fur et a mesure des tests)

---

## Outils analytics

### Stack principale

| Outil | Role | Cout | Priorite |
|---|---|---|---|
| **PostHog** | Analytics principal, feature flags, session replay | Gratuit < 1M events | Mois 1 |
| **GA4** | Analytics secondaire + liaison Google Ads | Gratuit | Mois 1 |
| **Search Console** | Performance SEO, indexation, erreurs | Gratuit | Mois 1 |
| **Stripe Dashboard** | Revenue, MRR, churn, LTV | Gratuit (inclus avec Stripe) | Mois 1 |
| **Ahrefs / SEMrush** | Recherche keywords, backlinks, concurrence | ~100$/mois | Mois 6+ |

### Pourquoi PostHog + GA4?

- **PostHog** : meilleur pour le product analytics (funnels, cohortes, feature flags, session replay)
- **GA4** : necessaire pour la liaison avec Google Ads (import conversions, audiences)
- Les deux se completent sans se chevaucher trop

### Custom dashboard (mois 6+)

Quand le volume de donnees le justifie, creer un dashboard interne :

```
Dashboard interne (page admin) :
┌──────────────┬──────────────┬──────────────┐
│ MRR          │ WAU          │ Conversion   │
│ 4,500$       │ 2,300        │ 6.2%         │
│ +12% vs M-1  │ +8% vs M-1   │ +0.3pp       │
├──────────────┴──────────────┴──────────────┤
│ Revenue par outil (top 5)                  │
│ ContractorCheck : 1,200$ ██████████████    │
│ FloodCheck      :   980$ ███████████       │
│ PropTech        :   850$ ██████████        │
│ AlertePermis    :   620$ ████████          │
│ GarderieFind    :   450$ ██████            │
├────────────────────────────────────────────┤
│ Trafic sources (7 derniers jours)          │
│ SEO     : 3,200 ████████████████████       │
│ Ads     : 1,100 ███████                    │
│ Direct  :   800 █████                      │
│ Email   :   400 ███                        │
│ Social  :   200 ██                         │
└────────────────────────────────────────────┘
```

Source : queries PostgreSQL directes + Stripe API + PostHog API.

---

## Cadence de reporting

### Quotidien (5 min, automatise)

Verifier chaque matin :

| Check | Source | Alerte si |
|---|---|---|
| Revenue hier | Stripe Dashboard | 0$ un jour de semaine |
| Erreurs serveur | Logs / monitoring | > 5 erreurs 500 |
| Uptime | Health endpoint | Downtime > 5 min |

Automatiser avec un email/Slack matinal qui resume les 3 chiffres.

### Hebdomadaire (lundi, 30 min)

| Metrique | Source | Action |
|---|---|---|
| Trafic par source | PostHog / GA4 | Identifier les baisses |
| Conversions par outil | Stripe + PostHog | Couper les pubs non rentables |
| Google Ads performance | Google Ads | Ajuster bids, ajouter negatifs |
| Search Console | Google | Nouvelles pages indexees, erreurs |
| Email metrics | Resend | Open rate, click rate, bounces |

### Mensuel (1er du mois, 1h)

| Metrique | Source | Comparaison |
|---|---|---|
| MRR et croissance | Stripe | vs mois precedent |
| Cohortes mensuelles | PostHog | Retention par cohorte |
| CAC blended | Calcul | vs LTV par segment |
| Top 5 et bottom 5 outils | Stripe + PostHog | Revenue + usage |
| Churn et raisons | Stripe + surveys | Tendances |
| Email list size | DB | Croissance |

Livrable : un document d'1 page avec les 10 metriques cles et les decisions pour le mois suivant.

### Trimestriel (2h, review strategique)

| Theme | Questions |
|---|---|
| Portfolio outils | Quels outils garder/ameliorer/couper? |
| Budget allocation | Reallouer le budget marketing selon les performances |
| Pricing | Les prix sont-ils optimaux? Resultats des A/B tests prix |
| Roadmap | Quels nouveaux outils builder en priorite? |
| Concurrence | Nouveaux concurrents? Evolution du marche? |
| Objectifs Q+1 | Definir les cibles MRR, WAU, conversion pour le prochain trimestre |

Livrable : un document de 2-3 pages avec diagnostic + plan d'action Q+1.
