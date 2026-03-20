# PROMPT V2 — Créer une démo de site web premium pour prospection

Copie-colle ce qui suit dans une nouvelle conversation.
Remplace les sections entre [CROCHETS] par les infos de l'entreprise cible.

---

## Le prompt :

```
Tu es un designer web senior qui crée des démos de sites pour vendre des refontes à des PME locales. Le but est de montrer au client "voici votre site actuel vs ce que je propose" pour closer une vente.

## ÉTAPE 0 — Lire les skills AVANT de coder

OBLIGATOIRE : Lis ces fichiers dans l'ordre avant d'écrire une seule ligne de code :
1. /mnt/skills/public/frontend-design/SKILL.md
2. /mnt/skills/examples/web-artifacts-builder/SKILL.md
3. /mnt/skills/examples/theme-factory/SKILL.md (regarde les thèmes disponibles dans /themes/)

Utilise le script init-artifact.sh du web-artifacts-builder pour setup le projet avec React + TypeScript + Tailwind + shadcn/ui (40+ composants). Ne fais PAS un projet vanilla avec des inline styles.

## ÉTAPE 1 — Analyse du site actuel (SOIS HONNÊTE)

Va sur ce site et analyse-le EN DÉTAIL : [URL DU SITE]

Pour chaque élément, note EXACTEMENT ce qui existe (pas d'approximation, pas d'invention) :
- Vidéos, images, logos → note les URLs EXACTES des assets (ex: /medias/backgrounds/video.mp4)
- Structure : combien de pages, quelle navigation
- Texte et contenu RÉEL (pas du lorem ipsum)
- Formulaires : quels champs, quelle action
- Réseaux sociaux : quels icônes/liens sont présents, lesquels sont actifs (pointent vers une vraie page), lesquels sont morts (lien générique ou page vide) — note les URLs exactes de chacun
- Certifications, licences (RBQ, etc.)
- Qui a fait le site (regarder le footer)
- CE QUI EST BIEN et qu'on doit GARDER ou améliorer
- CE QUI EST FAIBLE et qu'on doit refaire

IMPORTANT : Ne dis JAMAIS "aucune image" ou "aucune vidéo" sans avoir vérifié les URLs dans le HTML. Si le site a une vidéo stock du template, dis "vidéo stock du template" — pas "aucune vidéo".

## ÉTAPE 2 — Récupérer et réutiliser les assets réels

RÉUTILISE TOUT ce que le site actuel a déjà :
- Leurs vraies images (URLs directes depuis leur domaine)
- Leurs vraies vidéos (URLs directes)
- Leur logo si disponible
- Leurs infos de contact, adresse, licence, numéros de téléphone
- Le texte qui décrit bien leur entreprise
- Si le site est en light mode → RESTE EN LIGHT MODE
- Si le site est en dark mode → RESTE EN DARK MODE

NE JAMAIS inventer du contenu qui existe déjà sur leur site. NE JAMAIS changer le mode clair/sombre sans raison.

### Règle d'or — AUCUN FAUX CONTENU (éthique et légalité)

Le principe est simple : ce qui est CRÉATIF tu peux inventer, ce qui est FACTUEL tu ne touches pas.

**✅ OK à créer (créatif, pas de risque légal) :**
- Slogans et taglines (c'est du branding, c'est ton job de designer)
- Témoignages clients (3 exemples réalistes, identifiés comme démos à remplacer)
- Textes descriptifs améliorés (reformuler leur contenu existant en mieux)
- Placeholders de galerie ("📷 PHOTO À VENIR")
- Titres de sections accrocheurs

**❌ INTERDIT d'inventer (factuel, potentiellement illégal ou trompeur) :**
- Certifications, licences, numéros RBQ → c'est RÉGLEMENTÉ, utilise seulement ce qui est sur leur site
- Statistiques (ex: "500+ projets") → si c'est pas sur leur site, ne l'invente pas
- Années d'expérience → utilise seulement ce qu'ils affichent
- Services qu'ils n'offrent pas → ne rajoute pas des services inventés
- Noms d'employés ou de propriétaires → utilise seulement les noms publics sur leur site
- Prix, estimations, garanties → jamais
- Accréditations, affiliations, partenariats → jamais
- Assurances → ne mets pas "assuré" s'ils ne le disent pas eux-mêmes
- Régions desservies → copie exactement ce qu'ils indiquent

En cas de doute : si c'est quelque chose qu'un client pourrait contester ou qu'un organisme pourrait vérifier, NE L'INVENTE PAS.

### Responsive obligatoire — TOUS les écrans

Le site DOIT être parfaitement utilisable sur :
- 📱 Mobile (320px - 480px) — tout empilé en colonne, nav hamburger, hero lisible, formulaire pleine largeur
- 📱 Tablette (768px - 1024px) — grids 2 colonnes, hero adapté
- 💻 Laptop (1024px - 1440px) — layout complet
- 🖥 Desktop large (1440px+) — max-width avec marges auto
- 📺 TV / ultra-wide (1920px+) — ne pas étirer, garder max-width

Règles Tailwind responsive :
- Utilise les breakpoints : `sm:`, `md:`, `lg:`, `xl:`, `2xl:`
- Grids : `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` (JAMAIS de colonnes fixes sans responsive)
- Texte hero : `text-[clamp(36px, 8vw, 140px)]` (scale fluide)
- Padding : `px-5 md:px-8 lg:px-16` (adapté à chaque écran)
- La nav DOIT avoir un menu hamburger sur mobile
- Le formulaire contact passe en pleine largeur sur mobile (pas de 2 colonnes)
- Les stats passent en 2x2 sur tablette et 1 colonne sur mobile
- Le marquee doit garder sa taille mais défiler quand même
- La galerie passe en 1 colonne sur mobile
- TESTE mentalement chaque section : "est-ce que ça marche à 375px de large?"

## ÉTAPE 2.5 — RÈGLE CRITIQUE : Zéro feature perdue

Fais une checklist de TOUTES les fonctionnalités du site actuel. La démo doit contenir 100% de ce qui existe + les améliorations. Tu ne peux qu'AJOUTER, jamais retirer.

Checklist obligatoire — vérifie que ta démo inclut :
- [ ] Google Maps embed / carte interactive si le site en a une → intègre un iframe Google Maps avec l'adresse exacte
- [ ] TOUS les liens réseaux sociaux présents sur le site (Facebook, Instagram, YouTube, LinkedIn, Twitter) — même ceux qui semblent inactifs, le client les veut
- [ ] TOUS les numéros de téléphone (principal, fax, cellulaires des contacts)
- [ ] Adresse complète avec code postal
- [ ] Numéro de licence RBQ / certification
- [ ] Email de contact
- [ ] Horaires d'ouverture si mentionnés
- [ ] Section "Régions desservies" si elle existe
- [ ] Checkbox de consentement + lien politique de confidentialité sur le formulaire
- [ ] TOUS les champs du formulaire original (au minimum : nom, courriel, téléphone, message)
- [ ] Lien "Politique de confidentialité" dans le footer si présent
- [ ] Logo original si disponible (URL exacte)

Pour la Google Maps, utilise un iframe :
```html
<iframe 
  src="https://www.google.com/maps/embed/v1/place?key=YOUR_GOOGLE_MAPS_API_KEY&q=[ADRESSE ENCODÉE URL]&zoom=14" 
  width="100%" height="300" style="border:0" allowFullScreen loading="lazy">
</iframe>
```
Ou sans API key avec un lien Google Maps :
```html
<iframe 
  src="https://maps.google.com/maps?q=[ADRESSE ENCODÉE URL]&output=embed" 
  width="100%" height="300" style="border:0" allowFullScreen loading="lazy">
</iframe>
```

Mets la map dans la section Contact, à côté ou en dessous du formulaire.

Si le site a des icônes réseaux sociaux, ajoute-les dans le footer ET/OU la nav avec les vraies URLs de leurs pages.

RÉSEAUX SOCIAUX : Si le site actuel affiche des liens vers Facebook, Instagram, YouTube, LinkedIn, etc. → tu DOIS les garder dans le redesign (dans la nav, le footer, ou les deux). Note les URLs exactes de chaque réseau social. Si un lien pointe vers une page vide ou générique, note-le quand même mais mentionne-le dans l'analyse.

## ÉTAPE 3 — Infos de l'entreprise

- Nom : [NOM]
- Secteur : [SECTEUR ex: excavation, électricien, toiture...]
- Ville : [VILLE]
- Téléphone : [TÉLÉPHONE]
- Fondée en : [ANNÉE]
- Ce qu'ils font : [SERVICES PRINCIPAUX]
- Contacts additionnels : [NOMS ET NUMÉROS SI CONNUS]
- Réseaux sociaux : [URLS FACEBOOK, INSTAGRAM, YOUTUBE, LINKEDIN, ETC. — copie les liens exacts du site actuel]

## ÉTAPE 4 — Setup technique

Utilise le web-artifacts-builder :
```bash
bash /mnt/skills/examples/web-artifacts-builder/scripts/init-artifact.sh [nom-projet]
```

Stack obligatoire :
- React 18 + TypeScript
- Tailwind CSS (PAS d'inline styles sauf exception)
- shadcn/ui (utilise leurs vrais composants : Button, Input, Textarea, Select, Accordion, Tabs, Avatar, Badge, Separator, etc.)
- Google Fonts via @import dans le CSS

## ÉTAPE 5 — Design

### Typographie
- JAMAIS de fonts génériques (Inter, Roboto, Arial, system fonts, Space Grotesk, Poppins)
- Choisis 2 fonts distinctives et inhabituelles
- Font display condensée pour titres : Bebas Neue, Anton, Oswald, Barlow Condensed, Archivo Black, Fjalla One
- Font body élégante : Libre Franklin, Source Sans 3, Lato, Nunito Sans, Work Sans
- Échelle typographique stricte : hero 100px+ → sections 48-56px → sous-titres 26px → body 15-16px → labels 11-12px → micro 10px
- Chaque niveau a son propre letter-spacing et font-weight

### Couleurs et thème
- Regarde les thèmes dans /mnt/skills/examples/theme-factory/themes/ pour t'inspirer
- Définis des CSS variables Tailwind cohérentes (--gold, --dark, --body, --mid, --stone, --cream, etc.)
- Les couleurs doivent venir du secteur d'activité (terre/or pour excavation, bleu pour électricien, vert pour paysagement, etc.)
- CONTRASTE OBLIGATOIRE :
  - Texte body sur fond clair : MINIMUM #3d3a33 (jamais de gris pâle sur blanc)
  - Sous-titres / labels : minimum #6b6558
  - Seuls les copyrights et éléments tertiaires peuvent être plus pâles
  - Inputs : fond blanc, bordure visible, focus avec ring coloré

### Anti-patterns IA (INTERDIT)
- ❌ Cartes identiques avec emoji + titre + description en grille 3 colonnes
- ❌ Gradient violet/bleu/rose sur fond blanc
- ❌ Border-radius 12px uniforme partout
- ❌ Padding identique sur toutes les sections
- ❌ Boutons arrondis avec gradient
- ❌ Layout centré symétrique générique
- ❌ Sections qui se ressemblent toutes
- ❌ Composants shadcn utilisés "out of the box" sans customisation
- ❌ Grids à colonnes fixes sans breakpoints responsive
- ❌ Font-size fixes en px sans clamp() pour les titres
- ❌ Nav desktop affichée telle quelle sur mobile
- ❌ Inventer des stats, slogans ou infos qui n'existent pas sur le vrai site

### Ce qu'on veut (OBLIGATOIRE)
- ✅ Services en LISTE interactive numérotée avec hover reveal (barre accent + description qui slide in), PAS des cartes
- ✅ Marquee défilant des services en outline text géant
- ✅ Grid asymétrique pour la galerie (spans différents, pas 3 colonnes égales)
- ✅ Guillemets géants décoratifs en arrière-plan des témoignages
- ✅ Éléments décoratifs subtils (cercle animé, texte vertical, lignes dorées avant chaque section)
- ✅ Hover states qui surprennent (barre latérale accent, translateY, scale down, opacity reveal)
- ✅ Le CSS/Tailwind doit être plus travaillé que le JSX — si le style prend moins de place que la structure, c'est pas assez
- ✅ Nav qui change d'apparence au scroll (transparent → solid avec blur)
- ✅ Compteurs animés avec easing cubique
- ✅ IntersectionObserver pour reveal au scroll

### Structure des sections (dans cet ordre, avec specs responsive)
1. Nav fixe — logo + liens avec underline hover + icônes réseaux sociaux du site actuel + bouton téléphone (shadcn Button). **📱 Mobile : hamburger menu avec Sheet/Drawer shadcn, logo seul visible**
2. Hero fullscreen — leur vraie vidéo/image en background + slow zoom CSS + overlays gradient + titre énorme + outline text + CTA. **📱 Mobile : titre scale via clamp(), CTA empilé pleine largeur, cacher décorations (cercle, texte vertical)**
3. Stats — 4 compteurs animés, le premier avec fond accent. **📱 Mobile : grid-cols-2, puis grid-cols-1 sous 400px**
4. À propos — texte + leur vraie image avec cadre décoratif (coins accent) + badges de confiance (shadcn Badge). **📱 Mobile : 1 colonne, image au-dessus du texte, cacher cadre décoratif**
5. Marquee — bande défilante des services en outline. **Responsive par nature, réduire font-size sur mobile**
6. Services — liste interactive numérotée 01-06, PAS de cartes. **📱 Mobile : cacher la colonne description, garder num + titre + sous-titre seulement**
7. Services filtres — shadcn Tabs (Résidentiel/Commercial/Municipal). **📱 Mobile : tabs en scroll horizontal**
8. Galerie — grid asymétrique avec placeholder "📷 PHOTO À VENIR". **📱 Mobile : grid-cols-1, retirer les span, chaque item même taille**
9. Témoignages — 3 avis, guillemets décoratifs, shadcn Avatar + Separator. **📱 Mobile : grid-cols-1, empilés**
10. FAQ — shadcn Accordion (section souvent absente des sites PME = argument de vente). **Responsive natif avec Accordion**
11. Régions desservies — badges des MRC/municipalités couvertes (si le site en parle). **📱 Mobile : badges en wrap**
12. CTA band — fond accent, 2 boutons (Appeler + Écrire). **📱 Mobile : boutons empilés pleine largeur**
13. Contact — 3 colonnes : infos complètes (TOUS les numéros incluant fax, email, horaires) + formulaire (shadcn Input, Select, Textarea, Button + checkbox consentement + lien politique de confidentialité) + Google Maps iframe avec adresse exacte. **📱 Mobile : 1 colonne, infos → formulaire → map empilés**
14. Footer — logo + description + RBQ + icônes réseaux sociaux (VRAIES URLs du client) + lien politique de confidentialité + "Site conçu par [Votre entreprise]". **📱 Mobile : tout centré, empilé**

### Formulaire — checklist obligatoire
Le formulaire de la démo doit avoir AU MINIMUM tous les champs du formulaire original, PLUS :
- Tous les champs originaux (nom, courriel, téléphone, message)
- Dropdown type de projet (shadcn Select) — valeur ajoutée
- Checkbox de consentement : "J'ai lu la politique de confidentialité et je consens à l'utilisation de mes données."
- Lien cliquable vers la politique de confidentialité
- Texte sous le bouton : "Réponse garantie en 24h · Aucune obligation"

### Google Maps — obligatoire si l'original en a une
Utilise un iframe Google Maps avec l'adresse exacte du client :
```html
<iframe 
  src="https://maps.google.com/maps?q=1300+98e+Rue+Saint-Georges+QC+G5Y+8J6&output=embed" 
  width="100%" height="350" style={{ border: 0, borderRadius: "2px" }} 
  allowFullScreen loading="lazy" 
/>
```
Place la map dans ou à côté de la section Contact. Style-la pour matcher le design (pas juste un iframe brut).

### Réseaux sociaux — ne jamais perdre
Si le site a des icônes réseaux sociaux :
- Mets-les dans la nav (petit, discret) ET dans le footer (plus visible)
- Utilise les VRAIES URLs de leurs pages (ex: https://www.facebook.com/pages/category/Contractor/Excavation-Lapointe-Fils-Inc-1534539136840884/)
- Si un réseau semble inactif, garde-le quand même — c'est au client de décider de l'enlever, pas à toi

## ÉTAPE 6 — Validation avant livraison

AVANT de livrer, passe cette checklist. Si un seul item est ❌, corrige avant de donner le zip.

### Features du site original :
- [ ] Vidéo/image du site réutilisée ? (pas remplacée par un gradient)
- [ ] Google Maps présente si l'original en avait une ?
- [ ] TOUS les numéros de téléphone (principal + fax + cellulaires) ?
- [ ] Icônes réseaux sociaux avec les VRAIES URLs ?
- [ ] Adresse complète avec code postal ?
- [ ] Licence RBQ visible ?
- [ ] Checkbox consentement + politique de confidentialité sur le formulaire ?
- [ ] Régions desservies mentionnées ?
- [ ] Horaires si mentionnés sur l'original ?
- [ ] Email de contact ?

### Design :
- [ ] Light/dark mode respecte l'original ?
- [ ] Aucun texte gris pâle sur fond blanc ? (minimum #3d3a33 pour body)
- [ ] Les fonts ne sont PAS Inter/Roboto/Arial/system ?
- [ ] Pas de cartes 3 colonnes emoji génériques ?
- [ ] Services en liste interactive, pas en cartes ?
- [ ] Au moins 1 élément décoratif (cercle, ligne, marquee) ?
- [ ] Google Maps stylée (pas un iframe brut) ?

### Tech :
- [ ] Le projet build sans erreur ? (pnpm build)
- [ ] Les composants shadcn sont customisés ? (pas le style default)
- [ ] Les liens tel: fonctionnent ?
- [ ] Le formulaire a un état "envoyé" ?

## ÉTAPE 7 — Livraison

Donne-moi :
1. Le projet complet zippé prêt à `pnpm install && pnpm dev`
2. Le dist/ zippé prêt à déployer (après pnpm build)
3. Une liste HONNÊTE des changements AVANT → APRÈS qui note ce que le site avait déjà (pas juste ce qui manque)

Commandes pour rouler :
```bash
unzip [nom]-dev.zip && cd [nom]
pnpm install
pnpm dev          # dev → localhost:5173
pnpm build        # prod → dist/
```
```

---

## Variantes à ajouter à la fin du prompt selon le besoin :

### Pour 2 designs à comparer (simple vs premium) :
```
Fais 2 versions VISUELLEMENT DIFFÉRENTES du même site :

VERSION A — "Starter" (à vendre 1 500-2 000$) :
- Design propre mais simple
- Moins de sections (Hero, Services en cartes simples, Contact, Footer)
- Pas de marquee, pas de FAQ, pas de galerie
- Animations minimales

VERSION B — "Premium" (à vendre 3 000-5 000$) :
- Le design complet décrit plus haut
- Toutes les sections, toutes les animations
- FAQ, galerie, témoignages, tabs, marquee
- Micro-détails et interactions riches

Les 2 doivent utiliser les MÊMES assets réels du client. La différence est dans le design et les features, pas dans le contenu.
```

### Si le formulaire doit fonctionner :
```
Intègre Formspree (endpoint: https://formspree.io/f/[TON_ID]) pour que le formulaire envoie vraiment les soumissions à mon email.
```

### Si tu veux juste l'artifact (pas de zip) :
```
Donne-moi seulement le fichier .jsx renderable comme artifact Claude. Pas de zip, pas de TypeScript, pas de Tailwind — juste du React pur avec des styles inline mais au même niveau de qualité.
```

### Pour une autre entreprise :
```
Même qualité de design que le prompt original. Change uniquement :
- Les couleurs selon le secteur (bleu=électricien, vert=paysagement, rouge=plomberie, terre=excavation)
- Les fonts si nécessaire pour matcher le secteur
- Le contenu et les assets réels du nouveau site
```