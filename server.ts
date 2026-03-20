import express from "express";
import path from "path";
import crypto from "crypto";
import { spawn } from "child_process";
import pg from "pg";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import * as cheerio from "cheerio";
import { Resend } from "resend";
import { gradeWebsite, rowToBusiness, MAX_SCORES, type Category } from "./lib";

async function scanBatch(urls: string[], sector: string, batchSize = 5, delayMs = 500): Promise<any[]> {
  const results: any[] = [];
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(
      batch.map(async (url) => {
        const ctrl = new AbortController();
        const timeout = setTimeout(() => ctrl.abort(), 8000);
        try {
          const pageRes = await fetch(url, {
            signal: ctrl.signal,
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
          });
          clearTimeout(timeout);
          const html = await pageRes.text();
          const page$ = cheerio.load(html);

          const title = page$("title").first().text().trim() || new URL(url).hostname;
          if (title === "Just a moment..." || title === "Attention Required!") return null;

          const emails = [...new Set(
            (html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [])
              .filter((e: string) => !e.includes("sentry") && !e.includes("wixpress") && !e.includes("example"))
          )];
          const phones = [...new Set(
            (html.match(/\(?[2-9]\d{2}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g) || [])
              .filter((p: string) => p.replace(/\D/g, "").length === 10)
          )];
          const { score, grade, issues, categoryScores, categoryIssues } = await gradeWebsite(page$, html, url);

          return {
            name: title.slice(0, 80),
            url,
            grade,
            score,
            phone: phones[0] || "",
            email: emails[0] || "",
            issues,
            sector,
            categoryScores,
            categoryIssues,
          };
        } catch {
          clearTimeout(timeout);
          return null;
        }
      })
    );
    for (const r of batchResults) {
      if (r.status === "fulfilled" && r.value) results.push(r.value);
    }
    // Delay between batches to avoid being blocked
    if (i + batchSize < urls.length) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// ~50-criteria grading — imported from ./lib.ts
// ---------------------------------------------------------------------------

// gradeWebsite() — see ./lib.ts

function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/–/g, "-");
}

const PORT = 3849;
const STATIC_DIR = path.join(__dirname, "client", "dist");
const AUTH_SECRET = process.env.AUTH_SECRET || "68684ca23e6f252771be99c5e206c2527621bd109cdeb8e3ba49f3ce2b86d2bc";
const HUB_URL = "https://mathieu-fournier.net";
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const EMAIL_FROM = "Mathieu Fournier <demo@mathieu-fournier.net>";
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

function parseCookies(header: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!header) return cookies;
  for (const pair of header.split(";")) {
    const idx = pair.indexOf("=");
    if (idx < 0) continue;
    cookies[pair.substring(0, idx).trim()] = pair.substring(idx + 1).trim();
  }
  return cookies;
}

function verifyAuthToken(token: string): boolean {
  try {
    const dot = token.indexOf(".");
    if (dot < 0) return false;
    const expiry = token.substring(0, dot);
    const sig = token.substring(dot + 1);
    const expected = crypto.createHmac("sha256", AUTH_SECRET).update(expiry).digest("hex");
    if (!crypto.timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"))) return false;
    const expiryMs = parseInt(expiry, 16);
    if (isNaN(expiryMs) || Date.now() > expiryMs) return false;
    return true;
  } catch { return false; }
}

// ---------------------------------------------------------------------------
// Database (PostgreSQL)
// ---------------------------------------------------------------------------

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS businesses (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      url TEXT DEFAULT '',
      sector TEXT DEFAULT '',
      grade TEXT DEFAULT 'C',
      phone TEXT DEFAULT '',
      email TEXT DEFAULT '',
      contacts JSONB DEFAULT '[]',
      status TEXT DEFAULT 'prospect',
      notes TEXT DEFAULT '',
      issues JSONB DEFAULT '[]',
      improvements JSONB DEFAULT '[]',
      estimated_value TEXT DEFAULT '',
      has_demo BOOLEAN DEFAULT false,
      demo_notes TEXT DEFAULT '',
      score INTEGER DEFAULT NULL,
      category_scores JSONB DEFAULT '{}',
      category_issues JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS history (
      id SERIAL PRIMARY KEY,
      business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
      ts TEXT NOT NULL,
      action TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_history_business ON history(business_id);

    CREATE TABLE IF NOT EXISTS checklist (
      business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
      item_key TEXT NOT NULL,
      checked BOOLEAN DEFAULT false,
      PRIMARY KEY (business_id, item_key)
    );

    CREATE TABLE IF NOT EXISTS scan_history (
      id SERIAL PRIMARY KEY,
      sector TEXT NOT NULL,
      region TEXT NOT NULL,
      mode TEXT NOT NULL DEFAULT 'with-site',
      urls_found INTEGER DEFAULT 0,
      sites_scanned INTEGER DEFAULT 0,
      sites_success INTEGER DEFAULT 0,
      duration_ms INTEGER DEFAULT 0,
      grades JSONB DEFAULT '{}',
      env TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    ALTER TABLE scan_history ADD COLUMN IF NOT EXISTS env TEXT;

    CREATE TABLE IF NOT EXISTS emails (
      id SERIAL PRIMARY KEY,
      resend_id TEXT DEFAULT '',
      business_id TEXT DEFAULT NULL,
      direction TEXT NOT NULL DEFAULT 'sent',
      from_addr TEXT NOT NULL,
      to_addr TEXT NOT NULL,
      subject TEXT NOT NULL DEFAULT '',
      body_html TEXT DEFAULT '',
      body_text TEXT DEFAULT '',
      status TEXT DEFAULT 'sent',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_emails_business ON emails(business_id);
    CREATE INDEX IF NOT EXISTS idx_emails_direction ON emails(direction);

    CREATE TABLE IF NOT EXISTS reminders (
      id SERIAL PRIMARY KEY,
      business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
      due_date DATE NOT NULL,
      note TEXT DEFAULT '',
      done BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_reminders_business ON reminders(business_id);
    CREATE INDEX IF NOT EXISTS idx_reminders_due ON reminders(due_date);

    CREATE TABLE IF NOT EXISTS email_templates (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      subject TEXT DEFAULT '',
      body TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS attachments (
      id SERIAL PRIMARY KEY,
      business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
      filename TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      data BYTEA NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_attachments_business ON attachments(business_id);

    CREATE TABLE IF NOT EXISTS logs (
      id SERIAL PRIMARY KEY,
      action TEXT NOT NULL,
      detail TEXT DEFAULT '',
      business_id TEXT DEFAULT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Seed if empty
  const { rows } = await pool.query("SELECT COUNT(*) AS c FROM businesses");
  if (parseInt(rows[0].c) === 0) {
    const seed = [
      ["lapointe", "Excavations Lapointe & Fils", "https://www.excavationslapointe.com/", "Excavation", "E", "(418) 774-6457", "info@excavationslapointe.com",
        JSON.stringify([{ name: "Maxime Lapointe", role: "Contact", phone: "(418) 221-2822" }, { name: "Mathieu Lapointe", role: "Contact", phone: "(418) 226-6735" }]),
        "prospect", "", JSON.stringify(["Template générique Optilog/Construction411", "Vidéo hero = stock du template", "1 seule image", "Texte générique copié-collé", "Liens réseaux sociaux inactifs", "Aucun témoignage client"]),
        JSON.stringify(["Galerie de réalisations avant/après", "Section témoignages clients", "SEO local Saint-Georges", "Formulaire de soumission", "FAQ avec accordion"]),
        "2 500$ - 4 000$", true, "Redesign complet light mode"],
      ["renovation-chaudiere", "Rénovation de la Chaudière", "https://www.renovationdelachaudiere.com/", "Entrepreneur général", "D", "(418) 230-6435", "info@renovationdelachaudiere.com",
        JSON.stringify([{ name: "Propriétaire", role: "Contact", phone: "(418) 957-4402" }]),
        "prospect", "", JSON.stringify(["Design HTML statique vieillot", "Pas de témoignages", "Galerie réalisations limitée", "Pas de blog", "CTA peu visibles"]),
        JSON.stringify(["Refonte moderne", "Galerie avant/après", "Google Reviews", "Blog SEO", "Badges confiance RBQ"]),
        "2 000$ - 3 500$", false, ""],
      ["gl-electrique", "GL Électrique", "https://www.glelectrique.com/", "Maître Électricien", "C", "(418) 228-3665", "frederic.t@glelectrique.com",
        JSON.stringify([{ name: "Frédéric Talbot", role: "Propriétaire", phone: "(418) 228-3665" }]),
        "prospect", "", JSON.stringify(["Site Duda limité", "Pas de témoignages", "Pas de FAQ", "Blog absent", "CTA peu visibles"]),
        JSON.stringify(["FAQ interactive", "Témoignages clients", "Blog SEO bornes EV", "Calculateur coût borne EV"]),
        "1 500$ - 2 500$", false, ""],
      ["bourque-electrique", "Bourque Électrique", "https://www.bourqueelectrique.com/", "Électricien", "B", "(418) 228-5020", "annie@bourqueelectrique.com",
        JSON.stringify([{ name: "Annie", role: "Admin", phone: "(418) 228-5020" }, { name: "Steeve Bourque", role: "Propriétaire", phone: "(418) 230-8777" }]),
        "prospect", "", JSON.stringify(["Pas de témoignages/avis", "Blog absent", "Page carrière peu engageante", "Manque de contenu vidéo"]),
        JSON.stringify(["Témoignages Google Reviews", "FAQ interactive", "Blog SEO", "Vidéo corporative"]),
        "1 000$ - 2 000$", false, ""],
    ];
    for (const s of seed) {
      await pool.query(`
        INSERT INTO businesses (id, name, url, sector, grade, phone, email, contacts, status, notes, issues, improvements, estimated_value, has_demo, demo_notes)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
      `, s);
    }
    console.log("Seeded 4 businesses");
  }
}

// Helpers — rowToBusiness() imported from ./lib.ts

async function getBusinessWithHistory(id: string) {
  const { rows } = await pool.query("SELECT * FROM businesses WHERE id = $1", [id]);
  if (!rows[0]) return null;
  const biz = rowToBusiness(rows[0]);
  const hist = await pool.query("SELECT ts, action FROM history WHERE business_id = $1 ORDER BY id DESC", [id]);
  biz.history = hist.rows;
  return biz;
}

function logAction(action: string, detail = "", businessId: string | null = null) {
  pool.query("INSERT INTO logs (action, detail, business_id) VALUES ($1, $2, $3)", [action, detail, businessId || null])
    .catch((err) => console.error("[LOG ERROR]", err.message));
}

// ---------------------------------------------------------------------------
// Express
// ---------------------------------------------------------------------------

const app = express();
app.set("trust proxy", 1);
app.use(express.json({ limit: "10mb" }));

// Rate limiting — 100 requests/minute per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
app.use("/api", (req, res, next) => {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  let entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + 60_000 };
    rateLimitMap.set(ip, entry);
  }
  entry.count++;
  res.setHeader("X-RateLimit-Limit", "100");
  res.setHeader("X-RateLimit-Remaining", String(Math.max(0, 100 - entry.count)));
  res.setHeader("X-RateLimit-Reset", String(Math.ceil(entry.resetAt / 1000)));
  if (entry.count > 100) {
    return res.status(429).json({ error: "Too many requests. Try again later." });
  }
  next();
});
// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(ip);
  }
}, 300_000);

// CORS — allow localhost dev and production
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && (origin.includes("localhost") || origin.includes("127.0.0.1") || origin.includes("mathieu-fournier.net"))) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// Auth middleware for API (skip in dev mode, always allow health endpoints)
const isDev = process.env.NODE_ENV === "development" || process.argv.includes("--no-auth") || !process.env.NODE_ENV;
app.use("/api", (req, res, next) => {
  if (isDev) return next();
  // Health endpoints are public (used by monitor cross-origin)
  if (req.path === "/health" || req.path.startsWith("/health/")) return next();
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies["mf_auth"];
  if (token && verifyAuthToken(token)) return next();
  res.status(401).json({ error: "Not authenticated" });
});

// GET /api/businesses
app.get("/api/businesses", async (_req, res) => {
  const { rows } = await pool.query("SELECT * FROM businesses ORDER BY created_at");
  const businesses = [];
  for (const row of rows) {
    const biz = rowToBusiness(row);
    const hist = await pool.query("SELECT ts, action FROM history WHERE business_id = $1 ORDER BY id DESC", [row.id]);
    biz.history = hist.rows;
    businesses.push(biz);
  }
  res.json(businesses);
});

// POST /api/businesses
app.post("/api/businesses", async (req, res) => {
  const b = req.body;

  // Duplicate detection by name or URL domain
  let domain = "";
  try { domain = b.url ? new URL(b.url).hostname.replace(/^www\./, "") : ""; } catch {}
  const dupeParams: any[] = [b.name.toLowerCase()];
  let dupeQuery = "SELECT id, name, url FROM businesses WHERE LOWER(name) = $1";
  if (domain) { dupeQuery += ` OR LOWER(url) LIKE $2`; dupeParams.push(`%${domain}%`); }
  const { rows: dupes } = await pool.query(dupeQuery, dupeParams);
  if (dupes.length > 0) {
    return res.status(409).json({ error: "duplicate", existing: { id: dupes[0].id, name: dupes[0].name, url: dupes[0].url } });
  }

  await pool.query(`
    INSERT INTO businesses (id, name, url, sector, grade, phone, email, contacts, status, notes, issues, improvements, estimated_value, has_demo, demo_notes, score, category_scores, category_issues)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
  `, [b.id, b.name, b.url || "", b.sector || "", b.grade || "C", b.phone || "", b.email || "",
    JSON.stringify(b.contacts || []), b.status || "prospect", b.notes || "",
    JSON.stringify(b.issues || []), JSON.stringify(b.improvements || []),
    b.estimatedValue || "", !!b.hasDemo, b.demoNotes || "",
    b.score ?? null, JSON.stringify(b.categoryScores || {}), JSON.stringify(b.categoryIssues || {})]);

  await pool.query("INSERT INTO history (business_id, ts, action) VALUES ($1, $2, $3)",
    [b.id, new Date().toLocaleString("fr-CA"), "Entreprise ajoutée"]);
  logAction("Entreprise créée", b.name, b.id);

  res.json(await getBusinessWithHistory(b.id));
});

// PUT /api/businesses/bulk
app.put("/api/businesses/bulk", async (req, res) => {
  const { ids, updates } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: "ids required" });

  const map: Record<string, [string, (v: any) => any]> = {
    name: ["name", v => v], url: ["url", v => v], sector: ["sector", v => v],
    grade: ["grade", v => v], phone: ["phone", v => v], email: ["email", v => v],
    contacts: ["contacts", v => JSON.stringify(v)], status: ["status", v => v],
    notes: ["notes", v => v], issues: ["issues", v => JSON.stringify(v)],
    improvements: ["improvements", v => JSON.stringify(v)],
    estimatedValue: ["estimated_value", v => v], hasDemo: ["has_demo", v => !!v],
    demoNotes: ["demo_notes", v => v], score: ["score", v => v],
    categoryScores: ["category_scores", v => JSON.stringify(v)],
    categoryIssues: ["category_issues", v => JSON.stringify(v)],
  };

  const sets: string[] = [];
  const values: any[] = [];
  let idx = 1;
  for (const [key, [col, transform]] of Object.entries(map)) {
    if (key in updates) { sets.push(`${col} = $${idx++}`); values.push(transform(updates[key])); }
  }

  if (sets.length > 0) {
    values.push(ids);
    await pool.query(`UPDATE businesses SET ${sets.join(", ")} WHERE id = ANY($${idx})`, values);
    const fields = Object.keys(updates).filter((k: string) => k in map).join(", ");
    logAction("Bulk update", `${ids.length} entreprises — ${fields}`);
  }

  res.json({ ok: true });
});

// DELETE /api/businesses/bulk
app.delete("/api/businesses/bulk", async (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: "ids required" });
  await pool.query("DELETE FROM businesses WHERE id = ANY($1)", [ids]);
  logAction("Bulk suppression", `${ids.length} entreprises`);
  res.json({ ok: true });
});

// PUT /api/businesses/:id
app.put("/api/businesses/:id", async (req, res) => {
  const { id } = req.params;
  const { rows: existing } = await pool.query("SELECT id FROM businesses WHERE id = $1", [id]);
  if (!existing[0]) return res.status(404).json({ error: "Not found" });

  const b = req.body;
  const sets: string[] = [];
  const values: any[] = [];
  let idx = 1;

  const map: Record<string, [string, (v: any) => any]> = {
    name: ["name", v => v], url: ["url", v => v], sector: ["sector", v => v],
    grade: ["grade", v => v], phone: ["phone", v => v], email: ["email", v => v],
    contacts: ["contacts", v => JSON.stringify(v)], status: ["status", v => v],
    notes: ["notes", v => v], issues: ["issues", v => JSON.stringify(v)],
    improvements: ["improvements", v => JSON.stringify(v)],
    estimatedValue: ["estimated_value", v => v], hasDemo: ["has_demo", v => !!v],
    demoNotes: ["demo_notes", v => v], score: ["score", v => v],
    categoryScores: ["category_scores", v => JSON.stringify(v)],
    categoryIssues: ["category_issues", v => JSON.stringify(v)],
  };

  for (const [key, [col, transform]] of Object.entries(map)) {
    if (key in b) { sets.push(`${col} = $${idx++}`); values.push(transform(b[key])); }
  }

  if (sets.length > 0) {
    values.push(id);
    await pool.query(`UPDATE businesses SET ${sets.join(", ")} WHERE id = $${idx}`, values);
    const fields = Object.keys(b).filter(k => k in map).join(", ");
    logAction("Entreprise modifiée", fields, id);
  }

  res.json(await getBusinessWithHistory(id));
});

// DELETE /api/businesses/:id
app.delete("/api/businesses/:id", async (req, res) => {
  const { rows } = await pool.query("SELECT name FROM businesses WHERE id = $1", [req.params.id]);
  await pool.query("DELETE FROM businesses WHERE id = $1", [req.params.id]);
  logAction("Entreprise supprimée", rows[0]?.name || req.params.id);
  res.json({ ok: true });
});

// POST /api/businesses/:id/history
app.post("/api/businesses/:id/history", async (req, res) => {
  const { id } = req.params;
  const { action } = req.body;
  const ts = new Date().toLocaleString("fr-CA");
  await pool.query("INSERT INTO history (business_id, ts, action) VALUES ($1, $2, $3)", [id, ts, action]);
  res.json({ ts, action });
});

// GET /api/businesses/:id/checklist
app.get("/api/businesses/:id/checklist", async (req, res) => {
  const { id } = req.params;
  const { rows } = await pool.query("SELECT item_key, checked FROM checklist WHERE business_id = $1", [id]);
  const result: Record<string, boolean> = {};
  for (const row of rows) { result[row.item_key] = !!row.checked; }
  res.json(result);
});

// PUT /api/businesses/:id/checklist
app.put("/api/businesses/:id/checklist", async (req, res) => {
  const { id } = req.params;
  const { key, checked } = req.body;
  await pool.query(`
    INSERT INTO checklist (business_id, item_key, checked) VALUES ($1, $2, $3)
    ON CONFLICT(business_id, item_key) DO UPDATE SET checked = EXCLUDED.checked
  `, [id, key, !!checked]);
  res.json({ ok: true });
});

// POST /api/businesses/:id/rescan
app.post("/api/businesses/:id/rescan", async (req, res) => {
  const { id } = req.params;
  const { rows } = await pool.query("SELECT * FROM businesses WHERE id = $1", [id]);
  if (!rows[0]) return res.status(404).json({ error: "Not found" });
  const biz = rowToBusiness(rows[0]);
  if (!biz.url) return res.status(400).json({ error: "No URL to scan" });
  try {
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 10000);
    const pageRes = await fetch(biz.url, {
      signal: ctrl.signal,
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" },
    });
    clearTimeout(timeout);
    const html = await pageRes.text();
    const page$ = cheerio.load(html);
    const { score, grade, issues, categoryScores, categoryIssues } = await gradeWebsite(page$, html, biz.url, pageRes.headers);
    await pool.query(
      `UPDATE businesses SET grade = $1, score = $2, issues = $3, category_scores = $4, category_issues = $5 WHERE id = $6`,
      [grade, score, JSON.stringify(issues), JSON.stringify(categoryScores), JSON.stringify(categoryIssues), id]
    );
    await pool.query("INSERT INTO history (business_id, ts, action) VALUES ($1, $2, $3)",
      [id, new Date().toLocaleString("fr-CA"), `Site re-audité: ${grade} (${score}/100)`]);
    logAction("Rescan", `${biz.name} → ${grade} (${score}/100)`, id);
    res.json(await getBusinessWithHistory(id));
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Rescan failed" });
  }
});

// GET /api/businesses/:id/attachments
app.get("/api/businesses/:id/attachments", async (req, res) => {
  const { rows } = await pool.query(
    "SELECT id, business_id, filename, mime_type, size_bytes, created_at FROM attachments WHERE business_id = $1 ORDER BY id DESC",
    [req.params.id]
  );
  res.json(rows.map((r: any) => ({ id: r.id, businessId: r.business_id, filename: r.filename, mimeType: r.mime_type, sizeBytes: r.size_bytes, createdAt: r.created_at })));
});

// POST /api/businesses/:id/attachments
app.post("/api/businesses/:id/attachments", async (req, res) => {
  const { id } = req.params;
  const { filename, mimeType, data } = req.body;
  if (!filename || !data) return res.status(400).json({ error: "filename and data required" });
  const buffer = Buffer.from(data, "base64");
  if (buffer.length > 5 * 1024 * 1024) return res.status(400).json({ error: "File too large (max 5MB)" });
  const { rows } = await pool.query(
    "INSERT INTO attachments (business_id, filename, mime_type, size_bytes, data) VALUES ($1, $2, $3, $4, $5) RETURNING id, created_at",
    [id, filename, mimeType || "application/octet-stream", buffer.length, buffer]
  );
  logAction("Fichier uploadé", filename, id);
  res.json({ id: rows[0].id, businessId: id, filename, mimeType, sizeBytes: buffer.length, createdAt: rows[0].created_at });
});

// GET /api/attachments/:id/download
app.get("/api/attachments/:id/download", async (req, res) => {
  const { rows } = await pool.query("SELECT filename, mime_type, data FROM attachments WHERE id = $1", [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: "Not found" });
  res.setHeader("Content-Type", rows[0].mime_type);
  res.setHeader("Content-Disposition", `attachment; filename="${rows[0].filename}"`);
  res.send(rows[0].data);
});

// DELETE /api/attachments/:id
app.delete("/api/attachments/:id", async (req, res) => {
  await pool.query("DELETE FROM attachments WHERE id = $1", [req.params.id]);
  logAction("Fichier supprimé", `Attachment #${req.params.id}`);
  res.json({ ok: true });
});

// Reminders
app.get("/api/reminders", async (req, res) => {
  const { business_id } = req.query;
  let sql = "SELECT * FROM reminders";
  const params: any[] = [];
  if (business_id) { sql += " WHERE business_id = $1"; params.push(business_id); }
  else { sql += " WHERE done = false"; }
  sql += " ORDER BY due_date ASC";
  const { rows } = await pool.query(sql, params);
  res.json(rows.map((r: any) => ({ id: r.id, businessId: r.business_id, dueDate: r.due_date, note: r.note, done: r.done, createdAt: r.created_at })));
});

app.post("/api/reminders", async (req, res) => {
  const { businessId, dueDate, note } = req.body;
  if (!businessId || !dueDate) return res.status(400).json({ error: "businessId and dueDate required" });
  const { rows } = await pool.query("INSERT INTO reminders (business_id, due_date, note) VALUES ($1, $2, $3) RETURNING *", [businessId, dueDate, note || ""]);
  const r = rows[0];
  logAction("Rappel créé", `${dueDate}${note ? " — " + note : ""}`, businessId);
  res.json({ id: r.id, businessId: r.business_id, dueDate: r.due_date, note: r.note, done: r.done, createdAt: r.created_at });
});

app.put("/api/reminders/:id", async (req, res) => {
  const { id } = req.params;
  const { done, note, dueDate } = req.body;
  const sets: string[] = []; const values: any[] = []; let idx = 1;
  if (done !== undefined) { sets.push(`done = $${idx++}`); values.push(!!done); }
  if (note !== undefined) { sets.push(`note = $${idx++}`); values.push(note); }
  if (dueDate !== undefined) { sets.push(`due_date = $${idx++}`); values.push(dueDate); }
  if (sets.length === 0) return res.status(400).json({ error: "No updates" });
  values.push(id);
  await pool.query(`UPDATE reminders SET ${sets.join(", ")} WHERE id = $${idx}`, values);
  const { rows } = await pool.query("SELECT * FROM reminders WHERE id = $1", [id]);
  if (!rows[0]) return res.status(404).json({ error: "Not found" });
  const r = rows[0];
  logAction(done ? "Rappel complété" : "Rappel modifié", `#${id}`, r.business_id);
  res.json({ id: r.id, businessId: r.business_id, dueDate: r.due_date, note: r.note, done: r.done, createdAt: r.created_at });
});

app.delete("/api/reminders/:id", async (req, res) => {
  await pool.query("DELETE FROM reminders WHERE id = $1", [req.params.id]);
  logAction("Rappel supprimé", `#${req.params.id}`);
  res.json({ ok: true });
});

// Email Templates
app.get("/api/email-templates", async (_req, res) => {
  const { rows } = await pool.query("SELECT * FROM email_templates ORDER BY id DESC");
  res.json(rows.map((r: any) => ({ id: r.id, name: r.name, subject: r.subject, body: r.body, createdAt: r.created_at })));
});

app.post("/api/email-templates", async (req, res) => {
  const { name, subject, body } = req.body;
  if (!name || !body) return res.status(400).json({ error: "name and body required" });
  const { rows } = await pool.query("INSERT INTO email_templates (name, subject, body) VALUES ($1, $2, $3) RETURNING *", [name, subject || "", body]);
  const r = rows[0];
  logAction("Template créé", name);
  res.json({ id: r.id, name: r.name, subject: r.subject, body: r.body, createdAt: r.created_at });
});

app.put("/api/email-templates/:id", async (req, res) => {
  const { id } = req.params;
  const { name, subject, body } = req.body;
  const sets: string[] = []; const values: any[] = []; let idx = 1;
  if (name !== undefined) { sets.push(`name = $${idx++}`); values.push(name); }
  if (subject !== undefined) { sets.push(`subject = $${idx++}`); values.push(subject); }
  if (body !== undefined) { sets.push(`body = $${idx++}`); values.push(body); }
  if (sets.length === 0) return res.status(400).json({ error: "No updates" });
  values.push(id);
  await pool.query(`UPDATE email_templates SET ${sets.join(", ")} WHERE id = $${idx}`, values);
  const { rows } = await pool.query("SELECT * FROM email_templates WHERE id = $1", [id]);
  if (!rows[0]) return res.status(404).json({ error: "Not found" });
  const r = rows[0];
  logAction("Template modifié", r.name);
  res.json({ id: r.id, name: r.name, subject: r.subject, body: r.body, createdAt: r.created_at });
});

app.delete("/api/email-templates/:id", async (req, res) => {
  await pool.query("DELETE FROM email_templates WHERE id = $1", [req.params.id]);
  logAction("Template supprimé", `#${req.params.id}`);
  res.json({ ok: true });
});

// GET /api/scan/stream — SSE endpoint, streams results one by one
app.get("/api/scan/stream", async (req, res) => {
  req.setTimeout(300000);
  res.setTimeout(300000);
  const sector = req.query.sector as string;
  const region = req.query.region as string;
  const maxResults = Math.min(Math.max(parseInt(req.query.max as string) || 50, 10), 1000);

  if (!sector || !region) { res.status(400).json({ error: "sector and region required" }); return; }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  const send = (event: string, data: any) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  const startTime = Date.now();
  let sitesSuccess = 0;
  const grades: Record<string, number> = {};

  try {
    // Build queries — DDG returns max ~20 per query, so we generate many variants
    const plainRegion = stripAccents(region);
    const queries = [
      `${sector} ${region} QC`,
      `${sector} ${region} Québec`,
      `entreprise ${sector} ${region}`,
      `${sector} près de ${region}`,
      `meilleur ${sector} ${region}`,
      `${sector} commercial ${region} QC`,
      `${sector} résidentiel ${region}`,
    ];
    if (plainRegion !== region) {
      queries.push(`${sector} ${plainRegion} QC`);
      queries.push(`${sector} ${plainRegion} Quebec`);
      queries.push(`entreprise ${sector} ${plainRegion}`);
    }

    // Pipeline: Python streams URLs line by line, we scan immediately
    const CONCURRENCY = 25;
    let totalUrls = 0;
    let scanned = 0;
    let running = 0;
    let searchDone = false;
    let resolveAll: () => void;

    const scanOne = async (url: string) => {
      const t0 = Date.now();
      const ctrl = new AbortController();
      const tm = setTimeout(() => ctrl.abort(), 4000);
      try {
        const pageRes = await fetch(url, {
          signal: ctrl.signal,
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36", "Accept": "text/html,application/xhtml+xml", "Accept-Language": "fr-CA,fr;q=0.9,en;q=0.8" },
        });
        clearTimeout(tm);
        if (pageRes.status === 403 || pageRes.status === 503 || pageRes.status === 429) {
          return { failed: true, failReason: `HTTP ${pageRes.status}`, url, durationMs: Date.now() - t0, name: new URL(url).hostname, grade: "", phone: "", email: "", issues: [], sector };
        }
        const html = await pageRes.text();
        const page$ = cheerio.load(html);
        const title = page$("title").first().text().trim() || new URL(url).hostname;
        const blocked = title === "Just a moment..." || title === "Attention Required!" || title.includes("403") || title.includes("Access Denied") || title.includes("Forbidden");
        if (blocked) return { failed: true, failReason: "Bloqué (Cloudflare/WAF)", url, durationMs: Date.now() - t0, name: new URL(url).hostname, grade: "", phone: "", email: "", issues: [], sector };
        if (html.length < 500) return { failed: true, failReason: "Page trop courte", url, durationMs: Date.now() - t0, name: new URL(url).hostname, grade: "", phone: "", email: "", issues: [], sector };

        const { score, grade, issues, categoryScores, categoryIssues } = await gradeWebsite(page$, html, url, pageRes.headers);

        const emails = [...new Set(
          (html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [])
            .filter((e: string) => !e.includes("sentry") && !e.includes("wixpress") && !e.includes("example"))
        )];
        const phones = [...new Set(
          (html.match(/\(?[2-9]\d{2}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g) || [])
            .filter((p: string) => p.replace(/\D/g, "").length === 10)
        )];

        return { name: title.slice(0, 80), url, grade, score, phone: phones[0] || "", email: emails[0] || "", issues, sector, durationMs: Date.now() - t0, categoryScores, categoryIssues };
      } catch {
        clearTimeout(tm);
        return { failed: true, failReason: "Timeout / Erreur réseau", url, durationMs: Date.now() - t0, name: new URL(url).hostname, grade: "", phone: "", email: "", issues: [], sector };
      }
    };

    const urlQueue: string[] = [];
    const pump = () => {
      while (running < CONCURRENCY && urlQueue.length > 0) {
        const url = urlQueue.shift()!;
        running++;
        scanOne(url).then((result) => {
          running--;
          scanned++;
          if (result && !result.failed) {
            sitesSuccess++;
            grades[result.grade] = (grades[result.grade] || 0) + 1;
          }
          send("result", result);
          send("progress", { scanned, total: totalUrls, success: sitesSuccess });
          if (searchDone && scanned === totalUrls) resolveAll();
          else pump();
        });
      }
    };

    await new Promise<void>((resolve) => {
      resolveAll = resolve;

      // Spawn Python with streaming output
      const scriptPath = path.join(__dirname, "search.py");
      const pythonCmd = process.platform === "win32" ? "python" : "python3";
      const joined = queries.join(" ||| ");
      const proc = spawn(pythonCmd, [scriptPath, String(Math.round(maxResults * 1.5)), joined], { timeout: 30000 });

      let buffer = "";
      proc.stdout.on("data", (chunk: Buffer) => {
        buffer += chunk.toString("utf-8");
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          if (trimmed === "DONE") {
            searchDone = true;
            send("urls", { count: totalUrls });
            if (totalUrls === 0 || scanned === totalUrls) resolve();
            continue;
          }
          if (totalUrls >= maxResults) continue;
          if (trimmed.startsWith("http")) {
            urlQueue.push(trimmed);
            totalUrls++;
            send("urls", { count: totalUrls });
            pump();
          }
        }
      });

      proc.on("close", () => {
        if (!searchDone) {
          searchDone = true;
          send("urls", { count: totalUrls });
          if (totalUrls === 0 || scanned === totalUrls) resolve();
        }
      });

      proc.on("error", () => {
        searchDone = true;
        if (totalUrls === 0) resolve();
      });
    });

    const durationMs = Date.now() - startTime;

    // Save to history
    const scanEnv = process.platform === "win32" ? "local" : "prod";
    await pool.query(`
      INSERT INTO scan_history (sector, region, mode, urls_found, sites_scanned, sites_success, duration_ms, grades, env)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [sector, region, "with-site", totalUrls, totalUrls, sitesSuccess, durationMs, JSON.stringify(grades), scanEnv]);

    logAction("Scan terminé", `${sector} ${region} — ${sitesSuccess}/${totalUrls} sites, ${Math.round(durationMs/1000)}s`);
    send("done", { urlsFound: totalUrls, sitesScanned: totalUrls, sitesSuccess, durationMs, grades });
  } catch (err: any) {
    logAction("Scan échoué", `${sector} ${region} — ${err.message}`);
    send("error", { message: err.message || "Scan failed" });
  }

  res.end();
});

// POST /api/scan-no-site
app.post("/api/scan-no-site", async (req, res) => {
  const { sector, region, showAll } = req.body;
  if (!sector || !region) return res.status(400).json({ error: "sector and region required" });

  type MapResult = { name: string; address: string; phone: string; email: string; source: string; hasWebsite: boolean; url: string; rating?: number; reviewCount?: number; verified?: boolean };

  const scanStart = Date.now();
  try {
    const results: MapResult[] = [];
    const seen = new Set<string>();

    const addResult = (r: MapResult) => {
      const key = r.name.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (!key || seen.has(key)) return;
      seen.add(key);
      results.push(r);
    };

    const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

    // ===== Step 1: Scrape Google Maps =====
    const queries = [
      `${sector} ${region} QC`,
      `${sector} près de ${region} Québec`,
    ];

    for (const q of queries) {
      try {
        const gmUrl = `https://www.google.com/maps/search/${encodeURIComponent(q)}`;
        const ctrl = new AbortController();
        const tm = setTimeout(() => ctrl.abort(), 12000);
        const gmRes = await fetch(gmUrl, {
          signal: ctrl.signal,
          headers: { "User-Agent": UA, "Accept-Language": "fr-CA,fr;q=0.9,en;q=0.8" },
        });
        clearTimeout(tm);
        const gmHtml = await gmRes.text();

        // Extract from AF_initDataCallback blocks
        const dataBlocks = gmHtml.match(/AF_initDataCallback\(\{[^}]*\},([\s\S]*?)\);\s*<\/script>/g) || [];
        for (const block of dataBlocks) {
          try {
            const jsonStr = block.replace(/AF_initDataCallback\(\{[^}]*\},/, "").replace(/\);\s*$/, "");

            // Pattern: ["Business Name","some id",[null,null,lat,lng]]
            const namePattern = /\["([^"]{2,80})","[^"]*",\[null,null,(-?\d+\.\d+),(-?\d+\.\d+)\]/g;
            let m;
            while ((m = namePattern.exec(jsonStr))) {
              const name = m[1];
              if (name.length < 3 || /^[0-9]/.test(name) || /Google|©|Terms|Privacy|Conditions/i.test(name)) continue;

              const start = Math.max(0, m.index - 500);
              const end = Math.min(jsonStr.length, m.index + 2500);
              const ctx = jsonStr.slice(start, end);

              const phoneMatch = ctx.match(/\(?[2-9]\d{2}\)?[\s.-]?\d{3}[\s.-]?\d{4}/);
              const addrMatch = ctx.match(/"(\d{1,5}[^"]{5,80}(?:rue|av|boul|ch|rte|rang|route|boulevard|avenue|chemin|st|rd)[^"]{0,40})"/i)
                || ctx.match(/"(\d{1,5}[^"]{10,80},\s*[A-Z][a-zÀ-ÿ]+[^"]{0,40})"/);
              const webMatch = ctx.match(/"(https?:\/\/(?!www\.google|maps\.google|play\.google|accounts\.google|support\.google)[^"]{5,200})"/);
              const ratingMatch = ctx.match(/,(\d\.\d),/);
              const reviewMatch = ctx.match(/,(\d+),?"(?:avis|review|comment)/i);

              addResult({
                name,
                address: addrMatch ? addrMatch[1] : "",
                phone: phoneMatch ? phoneMatch[0] : "",
                email: "", source: "Google Maps",
                hasWebsite: !!webMatch,
                url: webMatch ? webMatch[1] : "",
                rating: ratingMatch ? parseFloat(ratingMatch[1]) : undefined,
                reviewCount: reviewMatch ? parseInt(reviewMatch[1]) : undefined,
              });
            }
          } catch { /* parse error */ }
        }

        // Fallback: simpler pattern
        const simplePattern = /\["([A-ZÀ-Ÿ][^"]{2,60})"[^\]]*\],[^\[]*\[[^\]]*\],[^\[]*\[null,null,(-?\d+\.\d+),(-?\d+\.\d+)\]/g;
        let sm;
        while ((sm = simplePattern.exec(gmHtml))) {
          const name = sm[1];
          if (name.length < 3 || /Google|Maps|©|Conditions|Confidential/i.test(name)) continue;
          const nearby = gmHtml.slice(Math.max(0, sm.index - 300), sm.index + 1500);
          const phoneMatch = nearby.match(/\(?[2-9]\d{2}\)?[\s.-]?\d{3}[\s.-]?\d{4}/);
          const webMatch = nearby.match(/"(https?:\/\/(?!www\.google|maps\.google|play\.google)[^"]{5,200})"/);

          addResult({
            name, address: "",
            phone: phoneMatch ? phoneMatch[0] : "",
            email: "", source: "Google Maps",
            hasWebsite: !!webMatch,
            url: webMatch ? webMatch[1] : "",
          });
        }
      } catch { /* Google Maps query failed */ }
    }

    // ===== Step 2: For businesses without website on Maps, verify via Google Search =====
    const toVerify = results.filter(r => !r.hasWebsite);
    const VERIFY_BATCH = 5;
    for (let i = 0; i < toVerify.length; i += VERIFY_BATCH) {
      const batch = toVerify.slice(i, i + VERIFY_BATCH);
      await Promise.allSettled(batch.map(async (biz) => {
        try {
          const searchQuery = `"${biz.name}" ${region}`;
          const ctrl = new AbortController();
          const tm = setTimeout(() => ctrl.abort(), 6000);
          const searchRes = await fetch(
            `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}&num=5`,
            { signal: ctrl.signal, headers: { "User-Agent": UA, "Accept-Language": "fr-CA,fr;q=0.9" } }
          );
          clearTimeout(tm);
          const html = await searchRes.text();
          const s$ = cheerio.load(html);

          // Check if any organic result links to a website matching the business name
          const bizWords = biz.name.toLowerCase().replace(/[^a-zà-ÿ0-9\s]/g, "").split(/\s+/).filter(w => w.length > 2);
          let foundSite = "";

          s$("a[href]").each((_, el) => {
            if (foundSite) return;
            const href = s$(el).attr("href") || "";
            // Extract actual URL from Google redirect
            const urlMatch = href.match(/\/url\?q=(https?:\/\/[^&]+)/) || (href.startsWith("http") && !href.includes("google.com") ? [null, href] : null);
            if (!urlMatch) return;
            const url = decodeURIComponent(urlMatch[1]);
            // Skip Google, social media, directories
            if (/google\.com|facebook\.com|instagram\.com|linkedin\.com|twitter\.com|x\.com|yelp\.com|pagesjaunes|yellowpages|411/i.test(url)) return;

            // Check if the domain or page title relates to the business name
            try {
              const domain = new URL(url).hostname.toLowerCase().replace("www.", "");
              const domainWords = domain.replace(/\.[^.]+$/, "").replace(/[^a-z0-9]/g, " ").split(/\s+/);
              const matchCount = bizWords.filter(w => domainWords.some(dw => dw.includes(w) || w.includes(dw))).length;
              if (matchCount >= 1 || bizWords.some(w => domain.includes(w))) {
                foundSite = url;
              }
            } catch { /* invalid URL */ }
          });

          if (foundSite) {
            biz.hasWebsite = true;
            biz.url = foundSite;
            biz.source = "Google Maps + vérifié Google";
          } else {
            biz.verified = true; // Confirmed no website
            biz.source = "Google Maps (vérifié)";
          }
        } catch {
          // Verification failed — keep original status
        }
      }));
      // Small delay between batches to avoid rate limiting
      if (i + VERIFY_BATCH < toVerify.length) await new Promise(r => setTimeout(r, 500));
    }

    const output = showAll ? results : results.filter(r => !r.hasWebsite);

    // Save to scan history + log
    const noSiteCount = results.filter(r => !r.hasWebsite).length;
    const withSiteCount = results.filter(r => r.hasWebsite).length;
    logAction("Scan Maps terminé", `${sector} ${region} — ${results.length} résultats (${noSiteCount} sans site)`);
    const scanEnv = process.platform === "win32" ? "local" : "prod";
    await pool.query(`
      INSERT INTO scan_history (sector, region, mode, urls_found, sites_scanned, sites_success, duration_ms, grades, env)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [sector, region, showAll ? "maps" : "pages-jaunes", results.length, results.length, noSiteCount,
        Date.now() - scanStart, JSON.stringify({ "Avec site": withSiteCount, "Sans site": noSiteCount }), scanEnv]);

    res.json(output);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Scan failed" });
  }
});

// POST /api/scan/add
app.post("/api/scan/add", async (req, res) => {
  const sr = req.body;
  const id = sr.name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 30);

  const { rows: existing } = await pool.query("SELECT id, name, url FROM businesses WHERE id = $1", [id]);
  if (existing[0]) return res.status(409).json({ error: "duplicate", existing: { id: existing[0].id, name: existing[0].name, url: existing[0].url } });

  // Also check by URL domain
  let domain = "";
  try { domain = sr.url ? new URL(sr.url).hostname.replace(/^www\./, "") : ""; } catch {}
  if (domain) {
    const { rows: domainDupes } = await pool.query("SELECT id, name, url FROM businesses WHERE LOWER(url) LIKE $1", [`%${domain}%`]);
    if (domainDupes.length > 0) return res.status(409).json({ error: "duplicate", existing: { id: domainDupes[0].id, name: domainDupes[0].name, url: domainDupes[0].url } });
  }

  await pool.query(`
    INSERT INTO businesses (id, name, url, sector, grade, phone, email, contacts, status, notes, issues, improvements, estimated_value, has_demo, demo_notes, score, category_scores, category_issues)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
  `, [id, sr.name, sr.url || "", sr.sector || "", sr.grade || "C", sr.phone || "", sr.email || "",
    "[]", "prospect", "",
    JSON.stringify(sr.issues || []), "[]",
    "À estimer", false, "",
    sr.score ?? null, JSON.stringify(sr.categoryScores || {}), JSON.stringify(sr.categoryIssues || {})]);

  await pool.query("INSERT INTO history (business_id, ts, action) VALUES ($1, $2, $3)",
    [id, new Date().toLocaleString("fr-CA"), "Ajouté via scanner"]);
  logAction("Ajouté via scanner", sr.name, id);

  res.json(await getBusinessWithHistory(id));
});

// GET /api/scan-history
app.get("/api/scan-history", async (_req, res) => {
  const { rows } = await pool.query("SELECT * FROM scan_history ORDER BY id DESC LIMIT 50");
  res.json(rows.map((r: any) => ({
    id: r.id,
    sector: r.sector,
    region: r.region,
    mode: r.mode,
    urlsFound: r.urls_found,
    sitesScanned: r.sites_scanned,
    sitesSuccess: r.sites_success,
    durationMs: r.duration_ms,
    grades: typeof r.grades === "string" ? JSON.parse(r.grades) : (r.grades || {}),
    env: r.env || null,
    createdAt: r.created_at,
  })));
});

// ---------------------------------------------------------------------------
// Emails (Resend)
// ---------------------------------------------------------------------------

// GET /api/emails — list emails, optional ?business_id= or ?direction=
app.get("/api/emails", async (req, res) => {
  const { business_id, direction } = req.query;
  let sql = "SELECT * FROM emails";
  const conditions: string[] = [];
  const params: any[] = [];
  let idx = 1;

  if (business_id) { conditions.push(`business_id = $${idx++}`); params.push(business_id); }
  if (direction) { conditions.push(`direction = $${idx++}`); params.push(direction); }
  if (conditions.length) sql += " WHERE " + conditions.join(" AND ");
  sql += " ORDER BY id DESC LIMIT 200";

  const { rows } = await pool.query(sql, params);
  res.json(rows.map(r => ({
    id: r.id,
    resendId: r.resend_id,
    businessId: r.business_id,
    direction: r.direction,
    from: r.from_addr,
    to: r.to_addr,
    subject: r.subject,
    bodyHtml: r.body_html,
    bodyText: r.body_text,
    status: r.status,
    createdAt: r.created_at,
  })));
});

// GET /api/emails/:id
app.get("/api/emails/:id", async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM emails WHERE id = $1", [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: "Not found" });
  const row = rows[0];
  res.json({
    id: row.id,
    resendId: row.resend_id,
    businessId: row.business_id,
    direction: row.direction,
    from: row.from_addr,
    to: row.to_addr,
    subject: row.subject,
    bodyHtml: row.body_html,
    bodyText: row.body_text,
    status: row.status,
    createdAt: row.created_at,
  });
});

// POST /api/emails/send — send via Resend
app.post("/api/emails/send", async (req, res) => {
  const { to, subject, html, text, businessId } = req.body;
  if (!to || !subject) return res.status(400).json({ error: "to and subject required" });

  try {
    const wrappedHtml = html
      ? `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${html}</body></html>`
      : undefined;

    if (!resend) return res.status(503).json({ error: "Email non configuré (RESEND_API_KEY manquante)" });
    const result = await resend.emails.send({
      from: EMAIL_FROM,
      to: [to],
      subject,
      html: wrappedHtml,
      text: text || undefined,
    });

    const resendId = (result.data as any)?.id || "";

    // Try to auto-link to a business by email address
    let linkedBiz = businessId || null;
    if (!linkedBiz) {
      const { rows } = await pool.query("SELECT id FROM businesses WHERE email = $1", [to]);
      if (rows[0]) linkedBiz = rows[0].id;
    }

    const ins = await pool.query(`
      INSERT INTO emails (resend_id, business_id, direction, from_addr, to_addr, subject, body_html, body_text, status)
      VALUES ($1, $2, 'sent', $3, $4, $5, $6, $7, 'sent') RETURNING id
    `, [resendId, linkedBiz, EMAIL_FROM.replace(/.*<|>/g, ""), to, subject, html || "", text || ""]);

    if (linkedBiz) {
      await pool.query("INSERT INTO history (business_id, ts, action) VALUES ($1, $2, $3)",
        [linkedBiz, new Date().toLocaleString("fr-CA"), `Email envoyé: ${subject}`]);
    }

    logAction("Email envoyé", `${to} — ${subject}`, linkedBiz);
    res.json({ id: ins.rows[0].id, resendId, status: "sent" });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to send email" });
  }
});

// POST /api/emails/webhook — Resend inbound webhook (receives replies)
app.post("/api/emails/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  try {
    const payload = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { type, data } = payload;

    if (type === "email.received") {
      const from = data.from || data.envelope?.from || "";
      const to = data.to?.[0] || data.envelope?.to?.[0] || "";
      const subject = data.subject || "(sans objet)";
      const htmlBody = data.html || "";
      const textBody = data.text || "";

      const { rows } = await pool.query("SELECT id FROM businesses WHERE email = $1", [from]);
      const bizId = rows[0]?.id || null;

      await pool.query(`
        INSERT INTO emails (resend_id, business_id, direction, from_addr, to_addr, subject, body_html, body_text, status)
        VALUES ($1, $2, 'received', $3, $4, $5, $6, $7, 'received')
      `, [data.id || "", bizId, from, to, subject, htmlBody, textBody]);

      if (bizId) {
        await pool.query("INSERT INTO history (business_id, ts, action) VALUES ($1, $2, $3)",
          [bizId, new Date().toLocaleString("fr-CA"), `Email reçu de ${from}: ${subject}`]);
      }
      logAction("Email reçu", `${from} — ${subject}`, bizId);
    }

    res.json({ ok: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

app.get("/api/analytics", async (req, res) => {
  try {
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;
    const dateFilter = (table: string, col = "created_at") => {
      const conds: string[] = [];
      const vals: any[] = [];
      let i = 1;
      if (from) { conds.push(`${table}.${col} >= $${i++}`); vals.push(from); }
      if (to) { conds.push(`${table}.${col} <= ($${i++})::date + 1`); vals.push(to); }
      return { where: conds.length ? " WHERE " + conds.join(" AND ") : "", and: conds.length ? " AND " + conds.join(" AND ") : "", vals };
    };

    const bFilter = dateFilter("businesses");
    const bizWhere = bFilter.where ? bFilter.where.replace(/businesses\./g, "") : "";
    const bizVals = bFilter.vals;

    // Pipeline stats
    const { rows: statusRows } = await pool.query(`
      SELECT status, COUNT(*)::int AS count,
        SUM(CASE WHEN estimated_value ~ '\\d' THEN
          REGEXP_REPLACE((REGEXP_MATCH(estimated_value, '([\\d\\s]+)'))[1], '\\s', '', 'g')::bigint
        ELSE 0 END)::bigint AS value
      FROM businesses${bizWhere} GROUP BY status
    `, bizVals);
    const pipeline: Record<string, { count: number; value: number }> = {};
    let totalBusinesses = 0;
    let totalValue = 0;
    for (const r of statusRows) {
      pipeline[r.status] = { count: parseInt(r.count), value: parseInt(r.value) || 0 };
      totalBusinesses += parseInt(r.count);
      totalValue += parseInt(r.value) || 0;
    }

    const wonValue = pipeline.closed_won?.value || 0;
    const mrr = Math.round(wonValue / 12);

    const { rows: gradeRows } = await pool.query(`SELECT grade, COUNT(*)::int AS count FROM businesses${bizWhere} GROUP BY grade ORDER BY grade`, bizVals);
    const grades: Record<string, number> = {};
    for (const r of gradeRows) grades[r.grade] = parseInt(r.count);

    const eFilter = dateFilter("emails");
    const { rows: emailRows } = await pool.query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE direction='sent')::int AS sent,
        COUNT(*) FILTER (WHERE direction='received')::int AS received,
        COUNT(DISTINCT business_id) FILTER (WHERE business_id IS NOT NULL)::int AS linked_businesses
      FROM emails${eFilter.where}
    `, eFilter.vals);
    const emails = emailRows[0];

    const sFilter = dateFilter("scan_history");
    const { rows: scanRows } = await pool.query(`
      SELECT
        COUNT(*)::int AS total_scans,
        COALESCE(SUM(urls_found), 0)::int AS total_urls,
        COALESCE(SUM(sites_success), 0)::int AS total_success,
        COALESCE(SUM(duration_ms), 0)::bigint AS total_duration
      FROM scan_history${sFilter.where}
    `, sFilter.vals);
    const scans = scanRows[0];

    const won = pipeline.closed_won?.count || 0;
    const lost = pipeline.closed_lost?.count || 0;
    const contacted = (pipeline.contacted?.count || 0) + (pipeline.demo_sent?.count || 0) + (pipeline.negotiating?.count || 0) + won + lost;
    const conversionRate = totalBusinesses > 0 ? Math.round((won / totalBusinesses) * 100) : 0;
    const closeRate = (won + lost) > 0 ? Math.round((won / (won + lost)) * 100) : 0;

    const { rows: recentActivity } = await pool.query(`
      SELECT h.ts, h.action, b.name AS business_name
      FROM history h JOIN businesses b ON h.business_id = b.id
      ORDER BY h.id DESC LIMIT 10
    `);

    const { rows: timelineRows } = await pool.query(`
      SELECT TO_CHAR(created_at, 'YYYY-MM') AS month, COUNT(*)::int AS count
      FROM businesses WHERE created_at IS NOT NULL${bFilter.and.replace(/businesses\./g, "")}
      GROUP BY month ORDER BY month
    `, bizVals);

    const { rows: sectorRows } = await pool.query(`
      SELECT sector, COUNT(*)::int AS count FROM businesses
      WHERE sector != ''${bFilter.and.replace(/businesses\./g, "")} GROUP BY sector ORDER BY count DESC LIMIT 10
    `, bizVals);

    res.json({
      pipeline,
      totalBusinesses,
      totalValue,
      mrr,
      grades,
      emails: { total: parseInt(emails.total), sent: parseInt(emails.sent), received: parseInt(emails.received), linkedBusinesses: parseInt(emails.linked_businesses) },
      scans: { totalScans: parseInt(scans.total_scans), totalUrls: parseInt(scans.total_urls), totalSuccess: parseInt(scans.total_success), totalDurationMs: parseInt(scans.total_duration) },
      conversion: { contacted, won, lost, conversionRate, closeRate },
      recentActivity,
      timeline: timelineRows,
      topSectors: sectorRows,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// Logs
// ---------------------------------------------------------------------------

app.get("/api/logs", async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 200, 500);
  const { rows } = await pool.query("SELECT * FROM logs ORDER BY id DESC LIMIT $1", [limit]);
  res.json(rows.map(r => ({
    id: r.id,
    action: r.action,
    detail: r.detail,
    businessId: r.business_id,
    createdAt: r.created_at,
  })));
});

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------

app.get("/api/health", async (_req, res) => {
  const checks: Record<string, { ok: boolean; detail?: string }> = {};

  // 1. Database
  try {
    const { rows } = await pool.query("SELECT COUNT(*) AS c FROM businesses");
    checks.database = { ok: true, detail: `${rows[0].c} entreprises` };
  } catch (err: any) {
    checks.database = { ok: false, detail: err.message };
  }

  // 2. Resend API key configured
  checks.resendKey = RESEND_API_KEY
    ? { ok: true, detail: `Clé configurée (${RESEND_API_KEY.slice(0, 8)}...)` }
    : { ok: false, detail: "RESEND_API_KEY manquante" };

  // 3. Resend API reachable — try listing domains
  if (RESEND_API_KEY) {
    try {
      await resend!.domains.list();
      checks.resendApi = { ok: true, detail: "API Resend accessible" };
    } catch (err: any) {
      checks.resendApi = { ok: false, detail: err.message };
    }
  } else {
    checks.resendApi = { ok: false, detail: "Pas de clé API" };
  }

  // 4. Webhook endpoint exists (always true if server is running)
  checks.webhookEndpoint = { ok: true, detail: "POST /api/emails/webhook" };

  // 5. Recent emails (to verify email flow works)
  try {
    const { rows } = await pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE direction='sent') AS sent, COUNT(*) FILTER (WHERE direction='received') AS received FROM emails");
    const r = rows[0];
    checks.emailFlow = { ok: true, detail: `${r.total} emails (${r.sent} envoyés, ${r.received} reçus)` };
  } catch (err: any) {
    checks.emailFlow = { ok: false, detail: err.message };
  }

  // 6. Server uptime
  checks.uptime = { ok: true, detail: `${Math.floor(process.uptime() / 60)} min` };

  res.json(checks);
});

// GET /api/health/remote?url=... — proxy health check to another environment (avoids CORS)
app.get("/api/health/remote", async (req, res) => {
  const targetUrl = req.query.url as string;
  if (!targetUrl) return res.status(400).json({ error: "url required" });

  const result: Record<string, { ok: boolean; detail?: string }> = {};

  // Check frontend
  try {
    const ctrl = new AbortController();
    const tm = setTimeout(() => ctrl.abort(), 8000);
    const r = await fetch(targetUrl, { signal: ctrl.signal });
    clearTimeout(tm);
    result.frontend = { ok: r.status >= 200 && r.status < 400, detail: `HTTP ${r.status}` };
  } catch (err: any) {
    result.frontend = { ok: false, detail: err.name === "AbortError" ? "Timeout (8s)" : (err.message || "Inaccessible") };
  }

  // Check backend /api/health
  try {
    const ctrl = new AbortController();
    const tm = setTimeout(() => ctrl.abort(), 8000);
    const r = await fetch(`${targetUrl}/api/health`, { signal: ctrl.signal });
    clearTimeout(tm);
    if (r.ok) {
      const data = await r.json();
      Object.assign(result, data);
    } else {
      result.backend = { ok: false, detail: `HTTP ${r.status}` };
    }
  } catch (err: any) {
    result.backend = { ok: false, detail: err.name === "AbortError" ? "Timeout (8s)" : (err.message || "Inaccessible") };
  }

  res.json(result);
});

// ---------------------------------------------------------------------------
// Static files (SPA)
// ---------------------------------------------------------------------------

app.use(express.static(STATIC_DIR, {
  setHeaders(res, filePath) {
    if (filePath.endsWith(".html")) {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    }
  },
}));

// ---------------------------------------------------------------------------
// Login page (hardcoded password)
// ---------------------------------------------------------------------------

const SITE_PASSWORD = process.env.SITE_PASSWORD || "";
const AUTH_MAX_AGE = 24 * 60 * 60 * 1000;

function signToken(): string {
  const expiry = (Date.now() + AUTH_MAX_AGE).toString(16);
  const hmac = crypto.createHmac("sha256", AUTH_SECRET).update(expiry).digest("hex");
  return expiry + "." + hmac;
}

const LOGIN_HTML = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Québec Web Audit — Connexion</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0d1117; color: #c9d1d9; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .card { background: #161b22; border: 1px solid #30363d; border-radius: 12px; padding: 2rem; width: 100%; max-width: 380px; }
    h1 { font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem; }
    p { font-size: 0.875rem; color: #8b949e; margin-bottom: 1.5rem; }
    input { width: 100%; background: #0d1117; border: 1px solid #30363d; border-radius: 8px; padding: 0.625rem 0.875rem; color: #c9d1d9; font-size: 0.9rem; margin-bottom: 1rem; outline: none; }
    input:focus { border-color: #58a6ff; }
    button { width: 100%; background: #1f6feb; border: none; border-radius: 8px; padding: 0.625rem; color: white; font-size: 0.9rem; font-weight: 500; cursor: pointer; }
    button:hover { background: #388bfd; }
    .error { color: #f85149; font-size: 0.8rem; margin-bottom: 0.75rem; }
  </style>
</head>
<body>
  <div class="card">
    <h1>🔒 Québec Web Audit</h1>
    <p>Entrez le mot de passe pour accéder au dashboard.</p>
    ERREUR_PLACEHOLDER
    <form method="POST" action="/login">
      <input type="password" name="password" placeholder="Mot de passe" autofocus required />
      <button type="submit">Accéder →</button>
    </form>
  </div>
</body>
</html>`;

app.get("/login", (req, res) => {
  const cookies = parseCookies(req.headers.cookie);
  if (cookies["mf_auth"] && verifyAuthToken(cookies["mf_auth"])) {
    return res.redirect("/");
  }
  res.setHeader("Content-Type", "text/html");
  res.end(LOGIN_HTML.replace("ERREUR_PLACEHOLDER", ""));
});

app.post("/login", express.urlencoded({ extended: false }), (req, res) => {
  const { password } = req.body;
  if (password !== SITE_PASSWORD) {
    res.setHeader("Content-Type", "text/html");
    return res.end(LOGIN_HTML.replace("ERREUR_PLACEHOLDER", '<div class="error">Mot de passe incorrect.</div>'));
  }
  const token = signToken();
  res.setHeader("Set-Cookie", `mf_auth=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${AUTH_MAX_AGE / 1000}`);
  res.redirect("/");
});

// Auth check for SPA — redirect to login if not authenticated
app.get("/*splat",   (req, res) => {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies["mf_auth"];
  if (token && verifyAuthToken(token)) {
    return res.sendFile(path.join(STATIC_DIR, "index.html"));
  }
  res.redirect("/login");
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

initDB().then(() => {
  const server = app.listen(PORT, "127.0.0.1", () => {
    server.setTimeout(300000);
    console.log(`Québec Audit listening on http://127.0.0.1:${PORT}`);
  });
}).catch(err => {
  console.error("Failed to initialize database:", err);
  process.exit(1);
});
