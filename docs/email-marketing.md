# Email Marketing — Plateforme donnees Quebec

## Construction de la liste email

### Capture sur outil gratuit

Le point de capture principal : apres le resultat gratuit, proposer d'envoyer le resultat par email.

```
┌─────────────────────────────────────────────┐
│ ✓ Resultat FloodCheck : Hors zone inondable │
│                                             │
│ Recevez le resultat complet par email :     │
│ ┌─────────────────────┐ ┌──────────────┐   │
│ │ votre@email.com     │ │ Envoyer →    │   │
│ └─────────────────────┘ └──────────────┘   │
│                                             │
│ + Rapport complet avec carte et historique  │
│   pour 14.99$                               │
└─────────────────────────────────────────────┘
```

Taux de capture attendu : 15-25% des utilisateurs d'outils gratuits.

### Lead magnets par categorie

| Categorie | Lead magnet | Format | Outil lie |
|---|---|---|---|
| Immobilier | "Guide : 7 verifications avant d'acheter une maison au Quebec" | PDF 5 pages | FloodCheck, TerraCheck, ZonageExpress |
| Entrepreneurs | "Checklist : comment choisir un entrepreneur fiable" | PDF 3 pages | ContractorCheck, RenoPrix |
| Familles | "Guide : trouver une place en garderie — toutes les options" | PDF 4 pages | GarderieFind |
| Emploi | "Salaires Quebec 2026 : les metiers qui paient le plus" | PDF 2 pages | SalaireLab |
| Municipal | "Guide : comprendre votre evaluation fonciere" | PDF 3 pages | ImmoTax, MuniDash |

### Content upgrades sur blog

Chaque article de blog a un content upgrade specifique (version PDF enrichie) :

- Article "Comment verifier un entrepreneur" → PDF avec checklist imprimable
- Article "Zones inondables au Quebec" → PDF avec carte des zones a risque par region
- Article "Cout renovation 2026" → PDF avec tableau de prix detaille par type de reno

### Segmentation des la capture

A la capture, stocker :

| Champ | Source | Usage |
|---|---|---|
| `tool_used` | Quel outil a declenche la capture | Sequences personnalisees |
| `category` | B2C ou B2B (detecte par email domain) | Newsletter differente |
| `region` | IP geolocation ou ville dans la recherche | Contenu regional |
| `utm_source` | UTM de la page | Attribution canal |

---

## 5 sequences automatisees

### Sequence 1 — Post-rapport-gratuit

Declencheur : l'utilisateur entre son email pour recevoir un resultat gratuit.

| Jour | Email | Objectif |
|---|---|---|
| J0 | "Voici votre resultat [outil]" + resultat + CTA rapport complet | Delivrer la valeur + upsell |
| J+2 | "3 choses que le resultat basique ne montre pas" + apercu rapport complet | Creer le FOMO |
| J+5 | "D'autres utilisateurs ont aussi verifie [outil 2]" + lien outil complementaire | Cross-sell |
| J+14 | "Vos donnees ont ete mises a jour — verifiez" + lien retour outil | Re-engagement |

Cible : 8-12% conversion vers rapport payant sur cette sequence.

### Sequence 2 — Post-achat

Declencheur : achat d'un rapport pay-per-use via Stripe.

| Jour | Email | Objectif |
|---|---|---|
| J0 | "Votre rapport [outil] est pret" + lien rapport + PDF en PJ | Delivrer le produit |
| J+3 | "Comment lire votre rapport : les 3 points cles" + tips | Education → satisfaction |
| J+7 | "Vous pourriez aussi verifier [outil 2]" + coupon -20% | Cross-sell |
| J+30 | "Vos donnees ont change — nouveau rapport disponible" | Re-achat |

### Sequence 3 — Post-abonnement

Declencheur : debut d'un abonnement (AlertePermis, GarderieFind Alertes, etc.).

| Jour | Email | Objectif |
|---|---|---|
| J0 | "Bienvenue! Voici comment configurer vos alertes" + guide | Onboarding |
| J+7 | "Votre premiere semaine : [X] alertes envoyees" + stats | Montrer la valeur |
| J+14 | "Astuce : ajoutez une 2e zone pour ne rien manquer" | Engagement + expansion |
| Mensuel | "Votre rapport mensuel : [X] alertes, [Y] nouveaux dans votre zone" | Retention |

### Sequence 4 — Re-engagement inactif 30j

Declencheur : aucune visite/utilisation depuis 30 jours.

| Jour | Email | Objectif |
|---|---|---|
| J+30 inactif | "Nouvelles donnees disponibles dans votre region" + 1-2 stats | Re-engagement |
| J+45 inactif | "Votre rapport gratuit est pret" + rapport auto-genere | Valeur gratuite |
| J+60 inactif | "On peut vous aider?" + sondage 1 question | Feedback |

### Sequence 5 — Win-back post-cancel

Declencheur : annulation d'un abonnement.

| Jour | Email | Objectif |
|---|---|---|
| J+30 post-cancel | "Vous nous manquez — 30% off pour 3 mois" | Offre attractive |
| J+60 post-cancel | "Nouvelles fonctionnalites depuis votre depart" + liste | Montrer l'evolution |
| J+90 post-cancel | "1 mois gratuit, sans engagement" | Derniere tentative |

Cible : recuperer 10-15% des annulations via cette sequence.

---

## Newsletter bi-mensuelle

### Format standard

Chaque newsletter suit le meme template :

```
Subject: [Stat surprenante] + [Ville/Region]

1. 📊 Stat Quebec de la semaine
   Ex: "Le prix median des maisons a Sherbrooke a augmente de 12% en 6 mois"

2. 🔧 Nouvel outil / Mise a jour
   Ex: "Nouveau : ClimatRisk — verifiez le risque climatique de votre adresse"

3. 📝 Article de la semaine
   Ex: "5 choses a verifier avant d'acheter un terrain au Quebec"

4. 💰 Offre de la semaine
   Ex: "PropTech Report — 25% off cette semaine seulement"
```

### Versions B2C vs B2B

| Element | B2C | B2B |
|---|---|---|
| Stat | Orientee consommateur (prix maison, garderies) | Orientee business (permis, contrats publics) |
| Outil | Outils grand public | Outils Pro, API, suites |
| Article | "Comment faire" guides | Case studies, ROI |
| Offre | Rabais rapport individuel | Rabais Pro/Suite |

### Metriques cibles

| Metrique | Cible | Action si en dessous |
|---|---|---|
| Open rate | > 35% | Tester subject lines, envoyer a un autre moment |
| Click rate | > 5% | Ameliorer le contenu, CTA plus clairs |
| Unsubscribe rate | < 0.5% | Reduire la frequence ou segmenter mieux |
| Bounce rate | < 2% | Nettoyer la liste (hard bounces auto-remove) |

### Cadence

- **Bi-mensuelle** : 1er et 15 du mois (mardi 9h AM EST)
- Pas d'envoi en juillet et decembre (vacances)
- Possibilite de passer a hebdomadaire quand la liste depasse 5,000 abonnes

---

## Emails transactionnels

### Liste des emails transactionnels

| Email | Trigger | Priorite |
|---|---|---|
| Confirmation d'achat | Stripe `checkout.session.completed` | Mois 1 |
| Rapport pret (PDF) | Generation rapport terminee | Mois 1 |
| Nouvelle alerte | Nouvelle donnee dans la zone surveillee | Mois 1 |
| Renouvellement dans 7j | Stripe `invoice.upcoming` | Mois 1 |
| Paiement echoue (dunning) | Stripe `invoice.payment_failed` | Mois 1 |
| Changement de plan | Stripe `customer.subscription.updated` | Mois 2 |
| Bienvenue abonnement | Stripe `customer.subscription.created` | Mois 2 |
| Annulation confirmee | Stripe `customer.subscription.deleted` | Mois 2 |

### Bonnes pratiques

- **From** : `info@donneesquebec.ca` (transactionnel) ou `newsletter@donneesquebec.ca` (marketing)
- **Reply-to** : `support@donneesquebec.ca` (un humain lit les reponses)
- **Design** : simple, texte-forward, pas de gros visuels (meilleur delivrability)
- **Footer** : adresse physique + lien unsubscribe (LCAP obligatoire)

---

## Implementation technique

### Stack : Resend + React Email

Le projet utilise deja Resend pour les emails. Etendre avec React Email pour les templates :

```typescript
// Template React Email pour confirmation d'achat
import { Html, Head, Body, Container, Text, Button } from '@react-email/components';

export function PurchaseConfirmation({ toolName, price, reportUrl }) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'Arial, sans-serif' }}>
        <Container>
          <Text>Merci pour votre achat!</Text>
          <Text>Votre rapport {toolName} est pret.</Text>
          <Text>Montant : {price} $ CAD (TPS + TVQ incluses)</Text>
          <Button href={reportUrl}>
            Voir mon rapport
          </Button>
        </Container>
      </Body>
    </Html>
  );
}
```

### Resend API pour les sequences

```typescript
// Envoyer un email de sequence avec Resend
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'DonneesQuebec <info@donneesquebec.ca>',
  to: subscriber.email,
  subject: 'Votre resultat FloodCheck',
  react: PostReportEmail({ toolName: 'FloodCheck', result: reportData }),
  tags: [
    { name: 'sequence', value: 'post-rapport-gratuit' },
    { name: 'step', value: 'j0' },
    { name: 'tool', value: 'floodcheck' },
  ],
});
```

### LCAP compliance (Loi canadienne anti-pourriel)

| Exigence | Implementation |
|---|---|
| Consentement explicite | Checkbox non-cochee par defaut : "J'accepte de recevoir des emails" |
| Identification expediteur | Nom, adresse physique et coordonnees dans chaque email |
| Mecanisme de desabonnement | Lien "Se desabonner" dans le footer, traite en max 10 jours ouvrables |
| Conservation du consentement | Stocker date + source du consentement dans la DB |
| Consentement tacite (clients) | Valide 2 ans apres le dernier achat — renouveler avant expiration |

### Gestion de la liste

```
PostgreSQL table: email_subscribers
  - id
  - email
  - consent_date
  - consent_source (tool_capture, lead_magnet, checkout, manual)
  - segments (JSONB: {category, region, tools_used, type})
  - status (active, unsubscribed, bounced, complained)
  - last_email_sent
  - last_email_opened
  - created_at
```

---

## Timeline d'implementation

| Mois | Quoi | Effort |
|---|---|---|
| 1 | Emails transactionnels (confirmation achat, alerte, dunning) | 2-3 jours |
| 2 | Sequences post-rapport-gratuit et post-achat | 2-3 jours |
| 2 | Capture email sur outils gratuits | 1 jour |
| 3 | Newsletter bi-mensuelle (premier envoi) | 1 jour setup + 2h/envoi |
| 3 | Sequence post-abonnement et re-engagement | 2 jours |
| 4 | Lead magnets (PDF guides) | 2-3 jours |
| 4 | Sequence win-back post-cancel | 1 jour |
| 5+ | Segmentation avancee, A/B testing subject lines | Continu |
| 6+ | Content upgrades sur blog | 1 jour/article |

### Metriques a mois 6

| Metrique | Cible |
|---|---|
| Taille de la liste | 1,000-2,500 abonnes |
| Open rate newsletter | > 35% |
| Click rate newsletter | > 5% |
| Revenue attribue a email | 10-15% du total |
| Conversion sequence post-rapport | 8-12% |
