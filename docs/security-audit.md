# Audit de securite — Plateforme donnees Quebec

Document de reference pour la securite de la plateforme. Chaque section couvre un vecteur d'attaque, l'etat actuel, les vulnerabilites connues, et les correctifs requis.

---

## 1. Vue d'ensemble

### Matrice de risques

| Composant | Etat | Niveau de risque |
|---|---|---|
| Authentification | Implemente | **CRITIQUE** (secret hardcode) |
| Injection SQL | Protege | FAIBLE |
| Validation des inputs | Minimale | **CRITIQUE** |
| Gestion des secrets | Partielle | **CRITIQUE** |
| Headers de securite | Absents | ELEVE |
| Upload de fichiers | Basique | **CRITIQUE** |
| Rate limiting | Implemente | MODERE |
| CORS | Partiel | MODERE |
| Protection CSRF | Absente | ELEVE |
| Protection XSS | Absente | ELEVE |
| Gestion d'erreurs | Generique | FAIBLE |
| Dependances | A jour | MODERE |

---

## 2. Authentification et autorisation

### Etat actuel

- Auth par cookie `mf_auth` signe avec HMAC-SHA256
- Verification via `verifyAuthToken()` dans `server/server.ts`
- Middleware auth sur tous les endpoints `/api/*`
- Endpoints exclus de l'auth : `/health`, `/health/remote`

### Vulnerabilites

| ID | Severite | Description | Fichier | Ligne |
|---|---|---|---|---|
| AUTH-01 | **CRITIQUE** | `AUTH_SECRET` hardcode dans le code source au lieu d'etre dans `.env` | `server/server.ts` | ~81 |
| AUTH-02 | ELEVE | Bypass auth en mode dev (`isDev` flag + `--no-auth`) | `server/server.ts` | ~366 |
| AUTH-03 | MODERE | Pas de protection CSRF — les requetes POST cross-origin sont possibles avec le cookie | `server/server.ts` | — |
| AUTH-04 | MODERE | Pas d'expiration de session — le token ne change jamais | `server/server.ts` | — |
| AUTH-05 | FAIBLE | Token rejouable — pas de nonce ou timestamp dans le token | `server/server.ts` | — |

### Correctifs requis

```typescript
// AUTH-01 : Deplacer le secret dans .env
// AVANT (DANGEREUX)
const AUTH_SECRET = "68684ca23e6f252771be99c5e206c2527621bd109cdeb8e3ba49f3ce2b86d2bc";

// APRES
const AUTH_SECRET = process.env.AUTH_SECRET;
if (!AUTH_SECRET) throw new Error("AUTH_SECRET manquant dans .env");
```

```typescript
// AUTH-03 : Ajouter une validation CSRF
// Option 1 : Double-submit cookie
// Option 2 : Verifier l'header Origin/Referer
function csrfCheck(req: Request, res: Response, next: NextFunction) {
  if (req.method === "GET" || req.method === "HEAD") return next();
  const origin = req.headers.origin;
  const allowed = ["https://audit.mathieu-fournier.net", "http://localhost:5173"];
  if (!origin || !allowed.includes(origin)) {
    return res.status(403).json({ error: "Origine non autorisee" });
  }
  next();
}
```

### Authentification pour la plateforme Next.js (futur)

- **Clerk** remplacera l'auth custom (ref: `tech-stack.md`)
- Clerk gere : sessions, tokens, refresh, CSRF, social login
- Webhooks Clerk signes pour syncer avec la DB
- **Regle** : ne jamais reimplementer l'auth maison — utiliser Clerk

---

## 3. Injection SQL

### Etat actuel : PROTEGE

Toutes les requetes utilisent des parametres (`$1`, `$2`, ...) avec `pool.query()`. Aucune concatenation de string dans les requetes SQL.

```typescript
// BON — parametre echappe automatiquement
await pool.query("SELECT * FROM businesses WHERE id = $1", [id]);

// BON — insertion avec parametres
await pool.query(
  `INSERT INTO businesses (name, url, sector) VALUES ($1, $2, $3)`,
  [name, url, sector]
);
```

### Regles permanentes

1. **JAMAIS** de concatenation de string dans les requetes SQL
2. **TOUJOURS** utiliser `$1, $2, ...` avec le tableau de parametres
3. Les colonnes JSONB sont escapees automatiquement par PostgreSQL
4. Avec Drizzle (futur) : les queries type-safe empechent l'injection par design

```typescript
// INTERDIT — injection SQL possible
await pool.query(`SELECT * FROM businesses WHERE name = '${name}'`);

// INTERDIT — template literals dans les requetes
await pool.query(`SELECT * FROM businesses WHERE sector = '${req.body.sector}'`);
```

---

## 4. Validation et sanitisation des inputs

### Etat actuel : MINIMAL

Seules des verifications basiques existent :
- Existence : `if (!to || !subject)`
- Type : `if (!Array.isArray(ids))`
- Taille : `if (buffer.length > 5 * 1024 * 1024)`

### Ce qui MANQUE

| Input | Validation actuelle | Validation requise |
|---|---|---|
| Email (to/from) | Aucune | Regex email + whitelist domaines |
| Nom d'entreprise | Aucune | Max 200 chars, pas de HTML |
| URL | Regex basique `https?://` | URL valide, pas de `javascript:`, pas de local IP |
| Telephone | Aucune | Regex format QC `(XXX) XXX-XXXX` |
| Secteur | Aucune | Max 100 chars, alphanum + accents |
| Notes | Aucune | Max 5000 chars, sanitisation HTML |
| HTML email | Aucune (injecte directement) | **DOMPurify** obligatoire |
| Nom de fichier | Aucune | Sanitise path traversal (`../`), whitelist extensions |
| JSON body | Aucune | Schema validation (zod) |

### Correctif : validation avec Zod

```typescript
import { z } from "zod";

// Schema de validation pour un business
const BusinessSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  url: z.string().url().refine(u => !u.includes("localhost") && !u.includes("127.0.0.1")),
  sector: z.string().min(1).max(100).trim(),
  phone: z.string().regex(/^\(\d{3}\) \d{3}-\d{4}$/).optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  notes: z.string().max(5000).optional().default(""),
  status: z.enum(["prospect", "contacted", "demo_sent", "negotiating", "closed_won", "closed_lost", "archived"]),
});

// Usage dans un endpoint
app.post("/api/businesses", async (req, res) => {
  const parsed = BusinessSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Donnees invalides", details: parsed.error.flatten() });
  }
  // parsed.data est type-safe et valide
});
```

### Sanitisation HTML (emails)

```typescript
import DOMPurify from "isomorphic-dompurify";

// AVANT (DANGEREUX) — injection HTML/JS possible
const wrappedHtml = `<html><body>${html}</body></html>`;

// APRES — sanitise le HTML
const cleanHtml = DOMPurify.sanitize(html, {
  ALLOWED_TAGS: ["p", "br", "b", "i", "strong", "em", "a", "ul", "ol", "li", "h1", "h2", "h3"],
  ALLOWED_ATTR: ["href", "target"],
});
const wrappedHtml = `<!DOCTYPE html><html><body>${cleanHtml}</body></html>`;
```

---

## 5. Gestion des secrets

### Etat actuel : PARTIELLEMENT COMPROMIS

| Secret | Emplacement actuel | Emplacement requis |
|---|---|---|
| `AUTH_SECRET` | Hardcode dans `server.ts` | `.env` |
| `DATABASE_URL` | `.env` | `.env` (correct) |
| `RESEND_API_KEY` | `.env` | `.env` (correct) |
| `RESEND_WEBHOOK_SECRET` | `.env` | `.env` (correct) |
| Mot de passe SSH | `.env` | Cle SSH (pas de mot de passe) |
| Mot de passe DB | Dans `DATABASE_URL` | `.env` ou secret manager |

### Regles de gestion des secrets

1. **Tous les secrets dans `.env`** — jamais dans le code source
2. **`.env` dans `.gitignore`** — verifier que c'est le cas
3. **Validation au demarrage** — le serveur doit crash si un secret manque :

```typescript
const REQUIRED_ENV = ["AUTH_SECRET", "DATABASE_URL", "RESEND_API_KEY"];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`FATAL: Variable d'environnement ${key} manquante`);
    process.exit(1);
  }
}
```

4. **Rotation des secrets** — si un secret est expose (commit accidentel) :
   - Revoquer immediatement l'ancien secret
   - Generer un nouveau secret
   - Mettre a jour le `.env` en production
   - Verifier les logs pour une utilisation non autorisee

5. **Production** — utiliser un secret manager (Vercel Environment Variables, Supabase Vault) au lieu de `.env` fichier

---

## 6. Headers de securite

### Etat actuel : AUCUN

Le serveur Express n'envoie aucun header de securite. C'est une faille majeure.

### Headers requis

```typescript
// Middleware securite — ajouter AVANT les routes
import helmet from "helmet";

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],  // Tailwind a besoin de unsafe-inline
      imgSrc: ["'self'", "data:", "https://*.tile.openstreetmap.org"],
      connectSrc: ["'self'", "https://api.resend.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,  // Pour les tiles OSM
}));

// OU — manuellement si helmet n'est pas installe
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "0");  // Desactive le filtre XSS des navigateurs (cause plus de problemes qu'il n'en resout)
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});
```

### Description des headers

| Header | Valeur | Protection |
|---|---|---|
| `X-Content-Type-Options` | `nosniff` | Empeche le navigateur de deviner le type MIME |
| `X-Frame-Options` | `DENY` | Empeche le site d'etre embed dans un iframe (clickjacking) |
| `Strict-Transport-Security` | `max-age=31536000` | Force HTTPS pendant 1 an |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limite les infos envoyees dans le Referer |
| `Permissions-Policy` | `camera=(), microphone=()` | Desactive les APIs sensibles du navigateur |
| `Content-Security-Policy` | (voir ci-dessus) | Empeche le chargement de scripts/styles non autorises |

---

## 7. Protection XSS (Cross-Site Scripting)

### Vecteurs d'attaque identifies

| Vecteur | Risque | Emplacement |
|---|---|---|
| HTML d'email inbound (webhook) | **CRITIQUE** | `server/server.ts` webhook Resend |
| Notes d'entreprise | ELEVE | Affichees dans le detail business |
| Nom d'entreprise | MODERE | Affiche dans la sidebar, pipeline, detail |
| Contenu email compose | ELEVE | HTML injecte sans sanitisation |
| Nom de fichier attache | MODERE | Affiche dans la liste des attachments |

### Correctifs

1. **React echappe par defaut** — les variables dans JSX sont echappees automatiquement (`{variable}` est safe)
2. **JAMAIS `dangerouslySetInnerHTML`** sans sanitisation :

```tsx
// INTERDIT
<div dangerouslySetInnerHTML={{ __html: email.bodyHtml }} />

// REQUIS — sanitiser d'abord
import DOMPurify from "dompurify";
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(email.bodyHtml) }} />
```

3. **Cote serveur** — sanitiser les inputs a l'entree, pas a la sortie :

```typescript
// Sanitiser le HTML entrant (webhook email)
import createDOMPurify from "isomorphic-dompurify";
const DOMPurify = createDOMPurify();

app.post("/api/emails/webhook", async (req, res) => {
  const html = req.body.html;
  const cleanHtml = DOMPurify.sanitize(html);
  // Stocker cleanHtml en DB, pas html
});
```

---

## 8. Protection CSRF (Cross-Site Request Forgery)

### Etat actuel : AUCUNE PROTECTION

Les endpoints POST/PUT/DELETE sont proteges par le cookie `mf_auth`, mais les cookies sont envoyes automatiquement par le navigateur — un site malveillant peut forger des requetes.

### Correctif

```typescript
// Option 1 : Verifier l'header Origin (simple et efficace)
function csrfProtection(req: Request, res: Response, next: NextFunction) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();

  const origin = req.headers.origin;
  const allowedOrigins = [
    "https://audit.mathieu-fournier.net",
    "http://localhost:5173",
    "http://localhost:3849",
  ];

  if (!origin || !allowedOrigins.includes(origin)) {
    return res.status(403).json({ error: "CSRF: origine non autorisee" });
  }
  next();
}

app.use("/api", csrfProtection);
```

```typescript
// Option 2 : Token CSRF (plus robuste, pour la plateforme Next.js)
// Utiliser le package csurf ou la protection built-in de Clerk
```

---

## 9. Upload de fichiers

### Etat actuel

- Taille max : 5MB
- Encodage : Base64
- Stockage : PostgreSQL (colonne bytea)
- Aucune validation de type, extension, ou nom de fichier

### Vulnerabilites

| ID | Severite | Description |
|---|---|---|
| FILE-01 | **CRITIQUE** | Pas de sanitisation du nom de fichier — path traversal possible (`../../../etc/passwd`) |
| FILE-02 | ELEVE | Pas de validation du type MIME — un fichier `.exe` peut etre uploade |
| FILE-03 | MODERE | Pas de scan antivirus |
| FILE-04 | MODERE | Stockage en DB (bytea) — un grand nombre de fichiers peut saturer la DB |

### Correctifs

```typescript
import path from "path";

// Whitelist des extensions acceptees
const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".png", ".jpg", ".jpeg", ".webp"];
const ALLOWED_MIMES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/png", "image/jpeg", "image/webp",
];

app.post("/api/attachments", async (req, res) => {
  const { filename, mimeType, data } = req.body;

  // 1. Sanitiser le nom de fichier
  const safeName = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, "_");

  // 2. Valider l'extension
  const ext = path.extname(safeName).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return res.status(400).json({ error: `Extension ${ext} non autorisee` });
  }

  // 3. Valider le type MIME
  if (!ALLOWED_MIMES.includes(mimeType)) {
    return res.status(400).json({ error: `Type MIME ${mimeType} non autorise` });
  }

  // 4. Verifier la taille
  const buffer = Buffer.from(data, "base64");
  if (buffer.length > 5 * 1024 * 1024) {
    return res.status(400).json({ error: "Fichier trop volumineux (max 5MB)" });
  }

  // 5. Stocker avec le nom sanitise
  await pool.query(
    `INSERT INTO attachments (business_id, filename, mime_type, size_bytes, data) VALUES ($1, $2, $3, $4, $5)`,
    [businessId, safeName, mimeType, buffer.length, buffer]
  );
});
```

---

## 10. Rate limiting

### Etat actuel

- Limite : 100 requetes/minute par IP
- Stockage : en memoire (Map JavaScript)
- Headers : `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

### Ameliorations requises

| ID | Priorite | Description |
|---|---|---|
| RATE-01 | ELEVE | Rate limits differents par endpoint (scan = 5/min, API = 100/min) |
| RATE-02 | MODERE | Stockage distribue (Redis/Upstash) pour multi-instance |
| RATE-03 | MODERE | Protection contre le spoofing IP (valider `X-Forwarded-For`) |
| RATE-04 | FAIBLE | Cleanup periodique du map au lieu de cleanup a la demande |

### Rate limits recommandes par endpoint

| Endpoint | Limite | Raison |
|---|---|---|
| `POST /api/scan` | 5/min | Operation couteuse (scraping) |
| `POST /api/emails/send` | 10/min | Prevenir le spam |
| `POST /api/businesses` | 20/min | Creation normale |
| `GET /api/*` | 100/min | Lecture standard |
| `POST /api/emails/webhook` | 50/min | Webhooks Resend |

```typescript
// Rate limiting par endpoint
function rateLimit(maxRequests: number, windowMs: number = 60000) {
  const map = new Map<string, { count: number; resetAt: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    const entry = map.get(ip);

    if (!entry || now > entry.resetAt) {
      map.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (entry.count >= maxRequests) {
      return res.status(429).json({ error: "Trop de requetes" });
    }

    entry.count++;
    next();
  };
}

// Usage
app.post("/api/scan", rateLimit(5), scanHandler);
app.post("/api/emails/send", rateLimit(10), sendEmailHandler);
app.use("/api", rateLimit(100));  // Default
```

---

## 11. CORS (Cross-Origin Resource Sharing)

### Etat actuel

```typescript
// Validation par string.includes() — DANGEREUX
if (origin.includes("localhost") || origin.includes("mathieu-fournier.net")) {
  res.setHeader("Access-Control-Allow-Origin", origin);
}
```

### Probleme

`origin.includes("mathieu-fournier.net")` accepterait aussi `evil-mathieu-fournier.net` ou `mathieu-fournier.net.evil.com`.

### Correctif

```typescript
const ALLOWED_ORIGINS = new Set([
  "http://localhost:5173",
  "http://localhost:3849",
  "https://audit.mathieu-fournier.net",
]);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});
```

---

## 12. Verification des webhooks

### Etat actuel : PAS DE VERIFICATION

Le webhook Resend (`POST /api/emails/webhook`) ne verifie pas la signature du payload. N'importe qui peut envoyer de faux emails entrants.

### Correctif

```typescript
import crypto from "crypto";

app.post("/api/emails/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const signature = req.headers["svix-signature"] as string;
  const timestamp = req.headers["svix-timestamp"] as string;
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

  if (!webhookSecret || !signature || !timestamp) {
    return res.status(401).json({ error: "Signature manquante" });
  }

  // Verifier que le timestamp n'est pas trop vieux (5 min)
  const ts = parseInt(timestamp);
  if (Math.abs(Date.now() / 1000 - ts) > 300) {
    return res.status(401).json({ error: "Timestamp expire" });
  }

  // Verifier la signature HMAC
  const toSign = `${timestamp}.${req.body.toString()}`;
  const expectedSig = crypto
    .createHmac("sha256", webhookSecret.replace("whsec_", ""))
    .update(toSign)
    .digest("base64");

  if (signature !== `v1,${expectedSig}`) {
    return res.status(401).json({ error: "Signature invalide" });
  }

  // Signature valide — traiter le webhook
  const payload = JSON.parse(req.body.toString());
  // ...
});
```

---

## 13. Gestion des erreurs

### Regles

1. **Jamais de stack trace en production** :

```typescript
// MAUVAIS — fuite d'information
res.status(500).json({ error: err.message, stack: err.stack });

// BON — message generique + log interne
console.error("Erreur interne:", err);
res.status(500).json({ error: "Erreur interne du serveur" });
```

2. **Pas d'information de DB dans les erreurs** :

```typescript
// MAUVAIS — revele la structure de la DB
res.status(500).json({ error: "column 'password_hash' does not exist" });

// BON
res.status(500).json({ error: "Erreur lors de la sauvegarde" });
```

3. **Logger les erreurs de securite separement** :

```typescript
// Tentative d'auth echouee → log de securite
if (!verifyAuthToken(token)) {
  console.warn(`[SECURITY] Auth failed from IP ${req.ip}, token: ${token.slice(0, 8)}...`);
  return res.status(401).json({ error: "Non autorise" });
}
```

---

## 14. Dependances et supply chain

### Audit des dependances

```bash
# Verifier les vulnerabilites connues
npm audit

# Mettre a jour les dependances
npm update

# Verifier les dependances outdated
npm outdated
```

### Regles

1. **`npm audit`** a chaque build — 0 vulnerabilites critiques ou elevees
2. **Pas de `npm audit fix --force`** — verifier manuellement chaque fix
3. **Lock file** (`package-lock.json`) toujours commite — garantit des builds reproductibles
4. **Dependances minimales** — chaque nouvelle dependance doit etre justifiee
5. **Pas de dependances abandonnees** — verifier la derniere mise a jour et le nombre de mainteneurs

### Dependances de securite recommandees

| Package | Role | Priorite |
|---|---|---|
| `helmet` | Headers de securite Express | P0 |
| `zod` | Validation de schemas | P0 |
| `isomorphic-dompurify` / `dompurify` | Sanitisation HTML | P0 |
| `express-rate-limit` | Rate limiting avance | P1 |
| `@upstash/ratelimit` | Rate limiting distribue (Redis) | P2 |
| `arcjet` | Protection complete (rate limit + bot detection) | P2 |

---

## 15. Securite de la base de donnees

### Etat actuel

- PostgreSQL sur VPS OVH (147.135.138.58:5432)
- Connection via `DATABASE_URL` dans `.env`
- Pas de SSL sur la connection DB (a verifier)

### Recommandations

| ID | Priorite | Description |
|---|---|---|
| DB-01 | ELEVE | Activer SSL sur la connection PostgreSQL (`?sslmode=require` dans l'URL) |
| DB-02 | ELEVE | Restreindre l'acces reseau au port 5432 (firewall iptables) |
| DB-03 | MODERE | Creer un user PostgreSQL read-only pour les requetes de lecture |
| DB-04 | MODERE | Backups automatiques quotidiens avec retention 30 jours |
| DB-05 | FAIBLE | Chiffrement au repos (pg_crypto pour les donnees sensibles) |
| DB-06 | FAIBLE | Audit log des requetes sensibles (DELETE, UPDATE sur users) |

### Connection SSL

```typescript
// Ajouter SSL a la connection
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Self-signed cert sur le VPS
  },
});
```

---

## 16. Deploiement securise

### Checklist de deploiement

- [ ] `.env` n'est PAS dans le repo git
- [ ] `AUTH_SECRET` est dans `.env` (pas hardcode)
- [ ] `npm audit` retourne 0 vulnerabilites critiques
- [ ] Headers de securite actifs (tester avec securityheaders.com)
- [ ] HTTPS actif et force (pas de HTTP)
- [ ] Rate limiting actif
- [ ] Firewall : seuls les ports 80, 443, 22 sont ouverts
- [ ] Port 5432 (PostgreSQL) accessible seulement depuis localhost ou IP specifiques
- [ ] Logs de securite actifs
- [ ] Backups DB configures

### Verification post-deploy

```bash
# Tester les headers de securite
curl -I https://audit.mathieu-fournier.net

# Verifier HTTPS
curl -v https://audit.mathieu-fournier.net 2>&1 | grep "SSL connection"

# Tester le rate limiting
for i in {1..110}; do curl -s -o /dev/null -w "%{http_code}\n" https://audit.mathieu-fournier.net/api/businesses; done
# Les derniers devraient retourner 429
```

---

## 17. Plan de remediation par priorite

### P0 — Immediat (bloque le deploy)

1. Deplacer `AUTH_SECRET` dans `.env`
2. Ajouter `zod` pour la validation de tous les endpoints POST/PUT
3. Ajouter les headers de securite (helmet ou manuel)
4. Sanitiser le HTML des emails avec DOMPurify
5. Sanitiser les noms de fichiers (path traversal)
6. Corriger la validation CORS (Set au lieu de `.includes()`)

### P1 — Haute priorite (semaine 1-2)

7. Ajouter la verification de signature webhook Resend
8. Ajouter la protection CSRF (verification Origin)
9. Valider les types MIME des uploads (whitelist)
10. Rate limits differencies par endpoint
11. SSL sur la connection PostgreSQL
12. Validation au demarrage de toutes les env vars requises

### P2 — Moyenne priorite (mois 1)

13. Rate limiting distribue (Redis/Upstash)
14. Firewall PostgreSQL (restreindre les IP)
15. User PostgreSQL read-only pour les lectures
16. Backups automatiques quotidiens
17. Audit log des operations sensibles
18. Monitoring des tentatives d'auth echouees

### P3 — Long terme (trimestre)

19. Migration vers Clerk pour l'auth (plateforme Next.js)
20. Arcjet pour la protection complete (rate limit + bots)
21. Chiffrement au repos des donnees sensibles
22. Pen test externe
23. Programme de bug bounty (quand la plateforme a du trafic)

---

## 18. Tests de securite

### Tests a ajouter

```typescript
// server/tests/security.test.ts

describe("Auth", () => {
  it("returns 401 without auth cookie", async () => { /* ... */ });
  it("returns 401 with invalid token", async () => { /* ... */ });
  it("returns 401 with expired token", async () => { /* ... */ });
});

describe("Input validation", () => {
  it("rejects SQL injection in business name", async () => { /* ... */ });
  it("rejects XSS in notes field", async () => { /* ... */ });
  it("rejects path traversal in filename", async () => { /* ... */ });
  it("rejects invalid email format", async () => { /* ... */ });
  it("rejects oversized request body", async () => { /* ... */ });
});

describe("Rate limiting", () => {
  it("returns 429 after exceeding limit", async () => { /* ... */ });
  it("resets after window expires", async () => { /* ... */ });
});

describe("CORS", () => {
  it("allows whitelisted origins", async () => { /* ... */ });
  it("blocks unknown origins", async () => { /* ... */ });
  it("blocks subdomain spoofing", async () => { /* ... */ });
});

describe("File uploads", () => {
  it("rejects files over 5MB", async () => { /* ... */ });
  it("rejects .exe files", async () => { /* ... */ });
  it("sanitizes filenames with path traversal", async () => { /* ... */ });
});
```

---

## References

| Document | Relation |
|---|---|
| `server/server.ts` | Serveur principal — toutes les vulnerabilites sont ici |
| `server/lib.ts` | Fonctions pures (pas de risque de securite direct) |
| `src/lib/api.ts` | Client API frontend (utilise `application/json` seulement) |
| `docs/tech-stack.md` | Stack futur (Clerk, Arcjet, Supabase) |
| `docs/testing-standards.md` | Standards de tests (inclure tests de securite) |
| `docs/coding-design-standards.md` | Standards de code |
| OWASP Top 10 | Reference externe pour les vulnerabilites web |
