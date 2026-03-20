import type { Business } from "./types";

const TEMPLATE = `Tu es un designer web senior qui cree des demos de sites pour vendre des refontes a des PME locales. Le but est de montrer au client "voici votre site actuel vs ce que je propose" pour closer une vente.

## ETAPE 0 — Lire les skills AVANT de coder

OBLIGATOIRE : Lis ces fichiers dans l'ordre avant d'ecrire une seule ligne de code :
1. /mnt/skills/public/frontend-design/SKILL.md
2. /mnt/skills/examples/web-artifacts-builder/SKILL.md
3. /mnt/skills/examples/theme-factory/SKILL.md (regarde les themes disponibles dans /themes/)

Utilise le script init-artifact.sh du web-artifacts-builder pour setup le projet avec React + TypeScript + Tailwind + shadcn/ui (40+ composants). Ne fais PAS un projet vanilla avec des inline styles.

## ETAPE 1 — Analyse du site actuel (SOIS HONNETE)

Va sur ce site et analyse-le EN DETAIL : [URL DU SITE]

Pour chaque element, note EXACTEMENT ce qui existe (pas d'approximation, pas d'invention) :
- Videos, images, logos → note les URLs EXACTES des assets
- Structure : combien de pages, quelle navigation
- Texte et contenu REEL (pas du lorem ipsum)
- Formulaires : quels champs, quelle action
- Reseaux sociaux : quels icones/liens sont presents, lesquels sont actifs
- Certifications, licences (RBQ, etc.)
- Qui a fait le site (regarder le footer)
- CE QUI EST BIEN et qu'on doit GARDER ou ameliorer
- CE QUI EST FAIBLE et qu'on doit refaire

## ETAPE 2 — Recuperer et reutiliser les assets reels

REUTILISE TOUT ce que le site actuel a deja :
- Leurs vraies images (URLs directes depuis leur domaine)
- Leurs vraies videos (URLs directes)
- Leur logo si disponible
- Leurs infos de contact, adresse, licence, numeros de telephone
- Le texte qui decrit bien leur entreprise

NE JAMAIS inventer du contenu qui existe deja sur leur site.

## ETAPE 3 — Infos de l'entreprise

- Nom : [NOM]
- Secteur : [SECTEUR]
- Ville : [VILLE]
- Telephone : [TELEPHONE]
- Fondee en : [ANNEE]
- Ce qu'ils font : [SERVICES PRINCIPAUX]
- Contacts additionnels : [NOMS ET NUMEROS SI CONNUS]
- Reseaux sociaux : [URLS FACEBOOK, INSTAGRAM, YOUTUBE, LINKEDIN, ETC.]

## ETAPE 4 — Setup technique

Utilise le web-artifacts-builder :
bash /mnt/skills/examples/web-artifacts-builder/scripts/init-artifact.sh [nom-projet]

Stack obligatoire :
- React 18 + TypeScript
- Tailwind CSS
- shadcn/ui
- Google Fonts via @import dans le CSS

## ETAPE 5 — Design

### Typographie
- JAMAIS de fonts generiques (Inter, Roboto, Arial, system fonts)
- Font display condensee pour titres : Bebas Neue, Anton, Oswald, Barlow Condensed
- Font body elegante : Libre Franklin, Source Sans 3, Lato, Nunito Sans

### Anti-patterns IA (INTERDIT)
- Cartes identiques avec emoji + titre + description en grille 3 colonnes
- Gradient violet/bleu/rose sur fond blanc
- Border-radius 12px uniforme partout
- Boutons arrondis avec gradient

### Ce qu'on veut (OBLIGATOIRE)
- Services en LISTE interactive numerotee avec hover reveal
- Marquee defilant des services en outline text geant
- Grid asymetrique pour la galerie
- Guillemets geants decoratifs en arriere-plan des temoignages
- Nav qui change d'apparence au scroll (transparent → solid avec blur)
- Compteurs animes avec easing cubique
- IntersectionObserver pour reveal au scroll
- Responsive obligatoire sur tous les ecrans

## ETAPE 6 — Validation avant livraison

Passe la checklist de validation avant de livrer.

## ETAPE 7 — Livraison

Donne-moi :
1. Le projet complet zippe pret a pnpm install && pnpm dev
2. Le dist/ zippe pret a deployer
3. Une liste HONNETE des changements AVANT → APRES`;

export function generatePrompt(business: Business): string {
  const contactsStr = business.contacts
    .map((c) => `${c.name} (${c.role}) — ${c.phone}`)
    .join(", ");

  return TEMPLATE
    .replace("[URL DU SITE]", business.url || "")
    .replace("[NOM]", business.name || "")
    .replace("[SECTEUR]", business.sector || "")
    .replace("[VILLE]", "Beauce")
    .replace("[TELEPHONE]", business.phone || "")
    .replace("[ANNEE]", "")
    .replace("[SERVICES PRINCIPAUX]", business.sector || "")
    .replace("[NOMS ET NUMEROS SI CONNUS]", contactsStr || "")
    .replace("[URLS FACEBOOK, INSTAGRAM, YOUTUBE, LINKEDIN, ETC.]", "");
}
