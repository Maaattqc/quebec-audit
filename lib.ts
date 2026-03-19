import * as cheerio from "cheerio";

// ---------------------------------------------------------------------------
// ~50-criteria grading (score = 100 - deductions, 8 categories)
// ---------------------------------------------------------------------------

export type Category = 'seo' | 'technique' | 'performance' | 'contenu' | 'ux' | 'accessibilite' | 'contact' | 'confiance';
export const MAX_SCORES: Record<Category, number> = {
  seo: 15, technique: 15, performance: 10, contenu: 15,
  ux: 10, accessibilite: 10, contact: 15, confiance: 10,
};

export async function gradeWebsite(page$: cheerio.CheerioAPI, html: string, url: string, headers?: Headers) {
  const catDeductions: Record<Category, number> = { seo: 0, technique: 0, performance: 0, contenu: 0, ux: 0, accessibilite: 0, contact: 0, confiance: 0 };
  const categoryIssues: Record<Category, string[]> = { seo: [], technique: [], performance: [], contenu: [], ux: [], accessibilite: [], contact: [], confiance: [] };

  const deduct = (cat: Category, pts: number, issue: string) => {
    catDeductions[cat] += pts;
    categoryIssues[cat].push(issue);
  };

  const htmlLower = html.toLowerCase();
  const imgs = page$("img");

  // =========================================================================
  // SEO — on-page (15 pts)
  // =========================================================================
  const title = page$("title").first().text().trim();
  if (!title) deduct('seo', 3, "Titre absent");
  else if (title.length < 20) deduct('seo', 2, "Titre trop court (<20 car.)");
  else if (title.length > 70) deduct('seo', 1, "Titre trop long (>70 car.)");

  const metaDesc = page$('meta[name="description"]').attr("content") || "";
  if (!metaDesc) deduct('seo', 3, "Meta description absente");
  else if (metaDesc.length < 50) deduct('seo', 2, "Meta description trop courte");
  else if (metaDesc.length > 160) deduct('seo', 1, "Meta description trop longue (>160)");

  const h1Count = page$("h1").length;
  if (h1Count === 0) deduct('seo', 2, "Pas de H1");
  else if (h1Count > 1) deduct('seo', 1, "Plusieurs H1 (" + h1Count + ")");

  if (!page$('meta[property="og:title"]').length || !page$('meta[property="og:image"]').length) deduct('seo', 2, "Open Graph incomplet (og:title/og:image)");
  if (!page$('link[rel="canonical"]').length) deduct('seo', 2, "Pas de canonical");
  if (!page$('html').attr('lang')) deduct('seo', 1, "Attribut lang absent");

  // Heading hierarchy: check if h3 appears before any h2
  const headings = page$("h1, h2, h3, h4").toArray().map(el => parseInt(el.tagName.replace("h", "")));
  let hierarchyBroken = false;
  for (let i = 1; i < headings.length; i++) {
    if (headings[i] > headings[i - 1] + 1) { hierarchyBroken = true; break; }
  }
  if (hierarchyBroken) deduct('seo', 1, "Hiérarchie des titres brisée (ex: H1 > H3 sans H2)");

  const imgsWithoutAlt = imgs.filter((_, el) => !page$(el).attr("alt")?.trim()).length;
  if (imgs.length > 0 && imgsWithoutAlt / imgs.length > 0.5) deduct('seo', 2, `Images sans alt (${imgsWithoutAlt}/${imgs.length})`);
  else if (imgs.length > 0 && imgsWithoutAlt > 0) deduct('seo', 1, `Quelques images sans alt (${imgsWithoutAlt}/${imgs.length})`);

  // =========================================================================
  // Technique — technical SEO & security (15 pts)
  // =========================================================================
  if (!url.startsWith("https")) deduct('technique', 4, "Pas de HTTPS");

  // Mixed content: http:// resources on an https page
  if (url.startsWith("https")) {
    const mixedSrc = page$('[src^="http://"], [href^="http://"]').filter((_, el) => {
      const attr = page$(el).attr("src") || page$(el).attr("href") || "";
      return attr.startsWith("http://") && !attr.includes("localhost");
    });
    if (mixedSrc.length > 0) deduct('technique', 2, `Contenu mixte HTTP (${mixedSrc.length} ressources)`);
  }

  if (!html.includes('"@type"') && !html.includes("application/ld+json")) deduct('technique', 2, "Pas de données structurées (JSON-LD)");

  // Meta robots noindex
  const metaRobots = page$('meta[name="robots"]').attr("content") || "";
  if (metaRobots.includes("noindex")) deduct('technique', 3, "Meta robots noindex — page non indexée");

  // robots.txt & sitemap.xml — quick parallel fetches
  try {
    const origin = new URL(url).origin;
    const ctrl = new AbortController();
    const tm = setTimeout(() => ctrl.abort(), 2000);
    const [robotsRes, sitemapRes] = await Promise.allSettled([
      fetch(`${origin}/robots.txt`, { signal: ctrl.signal, headers: { "User-Agent": "Mozilla/5.0" } }),
      fetch(`${origin}/sitemap.xml`, { signal: ctrl.signal, headers: { "User-Agent": "Mozilla/5.0" } }),
    ]);
    clearTimeout(tm);

    const robotsOk = robotsRes.status === "fulfilled" && robotsRes.value.ok;
    const robotsText = robotsOk ? await robotsRes.value.text() : "";
    if (!robotsOk || robotsText.length < 10 || robotsText.includes("<html")) deduct('technique', 2, "Pas de robots.txt");

    const sitemapOk = sitemapRes.status === "fulfilled" && sitemapRes.value.ok;
    const sitemapText = sitemapOk ? (await sitemapRes.value.text()).slice(0, 500) : "";
    // Also check if sitemap is referenced in robots.txt
    const hasSitemap = (sitemapOk && sitemapText.includes("<url")) || (sitemapOk && sitemapText.includes("<sitemap")) || robotsText.toLowerCase().includes("sitemap:");
    if (!hasSitemap) deduct('technique', 2, "Pas de sitemap.xml");
  } catch {
    // Network error — skip robots/sitemap checks
  }

  // Security hints from response headers or meta tags
  const cspMeta = page$('meta[http-equiv="Content-Security-Policy"]').length;
  const xfoMeta = page$('meta[http-equiv="X-Frame-Options"]').length;
  const hasSecHeaders = cspMeta > 0 || xfoMeta > 0 ||
    (headers && (headers.has("content-security-policy") || headers.has("x-frame-options") || headers.has("strict-transport-security")));
  if (!hasSecHeaders) deduct('technique', 1, "Aucun en-tête de sécurité détecté (CSP, X-Frame, HSTS)");

  // =========================================================================
  // Performance (10 pts)
  // =========================================================================
  const scripts = page$("script");
  if (scripts.length > 15) deduct('performance', 2, `Trop de scripts (${scripts.length})`);
  else if (scripts.length > 8) deduct('performance', 1, `Beaucoup de scripts (${scripts.length})`);

  if (page$('link[rel="stylesheet"]').length > 5) deduct('performance', 1, "Trop de CSS externes (>5)");
  if (page$("[style]").length > 10) deduct('performance', 1, "Trop de styles inline (>10)");
  if (!page$('link[rel="icon"], link[rel="shortcut icon"]').length) deduct('performance', 1, "Pas de favicon");

  // Page weight
  if (html.length > 500000) deduct('performance', 1, `Page lourde (${Math.round(html.length / 1024)} KB)`);

  // Render-blocking scripts (no async/defer)
  const blockingScripts = scripts.filter((_, el) => {
    const s = page$(el);
    return s.attr("src") && !s.attr("async") && !s.attr("defer") && !s.attr("type")?.includes("module");
  });
  if (blockingScripts.length > 3) deduct('performance', 2, `Scripts bloquants sans async/defer (${blockingScripts.length})`);
  else if (blockingScripts.length > 0) deduct('performance', 1, `Scripts bloquants sans async/defer (${blockingScripts.length})`);

  // Lazy loading
  const lazyImgs = imgs.filter((_, el) => !!page$(el).attr("loading"));
  if (imgs.length > 5 && lazyImgs.length === 0) deduct('performance', 1, "Aucun lazy loading sur les images");

  // Modern image formats
  const hasSrcset = imgs.filter((_, el) => !!page$(el).attr("srcset")).length > 0;
  const hasWebP = html.includes(".webp") || html.includes(".avif");
  const hasPicture = page$("picture source").length > 0;
  if (imgs.length > 3 && !hasSrcset && !hasWebP && !hasPicture) deduct('performance', 1, "Pas d'images optimisées (WebP/srcset/picture)");

  // =========================================================================
  // Contenu (15 pts)
  // =========================================================================
  const textContent = page$("body").text().replace(/\s+/g, " ").trim();
  if (textContent.length < 300) deduct('contenu', 3, "Très peu de texte (<300 car.)");
  else if (textContent.length < 800) deduct('contenu', 1, "Peu de texte (<800 car.)");

  if (imgs.length === 0) deduct('contenu', 2, "Aucune image");
  else if (imgs.length < 3) deduct('contenu', 1, "Peu d'images (<3)");

  if (!/t[eé]moignage|avis|review|testimonial|google.*review/i.test(htmlLower)) deduct('contenu', 2, "Pas de témoignages/avis");
  if (!/blog|actualit[eé]|nouvelles|article/i.test(htmlLower)) deduct('contenu', 2, "Pas de blog/actualités");
  if (!page$("video, iframe[src*='youtube'], iframe[src*='vimeo'], iframe[src*='wistia']").length) deduct('contenu', 2, "Pas de vidéo");
  if (!/faq|foire aux questions|questions fr[eé]quentes/i.test(htmlLower)) deduct('contenu', 2, "Pas de FAQ");

  // Heading richness
  const h2Count = page$("h2").length;
  if (h2Count < 2) deduct('contenu', 1, "Peu de sous-titres H2 (<2)");

  // Internal link density
  const internalLinks = page$("a[href]").filter((_, el) => {
    const href = page$(el).attr("href") || "";
    return href.startsWith("/") || href.startsWith(url) || (!href.startsWith("http") && !href.startsWith("mailto") && !href.startsWith("tel"));
  });
  if (internalLinks.length < 3) deduct('contenu', 1, "Peu de liens internes (<3)");

  // =========================================================================
  // UX (10 pts)
  // =========================================================================
  if (!page$('meta[name="viewport"]').length) deduct('ux', 3, "Pas responsive (meta viewport absent)");
  if (!page$("nav").length) deduct('ux', 2, "Pas de navigation (<nav>)");

  const ctaPattern = /soumission|devis|contact|appel|estim|réserv|commenc|obtenir|demandez|consultation/i;
  const buttons = page$("a, button").filter((_, el) => ctaPattern.test(page$(el).text()));
  if (buttons.length === 0) deduct('ux', 2, "Pas de CTA (appel à l'action)");

  const footer = page$("footer");
  if (!footer.length || footer.text().trim().length < 50) deduct('ux', 1, "Footer absent ou incomplet");

  if (!page$('img[src*="logo"], img[alt*="logo"], .logo, #logo, [class*="logo"], svg[class*="logo"]').length) deduct('ux', 1, "Pas de logo détecté");

  // Breadcrumbs
  if (!page$('[class*="breadcrumb"], [aria-label="breadcrumb"], .fil-ariane, nav[aria-label*="Breadcrumb"]').length) deduct('ux', 1, "Pas de fil d'Ariane");

  // =========================================================================
  // Accessibilite (10 pts)
  // =========================================================================
  // Form labels
  const formInputs = page$("input:not([type='hidden']):not([type='submit']):not([type='button']), textarea, select");
  if (formInputs.length > 0) {
    const unlabeled = formInputs.filter((_, el) => {
      const id = page$(el).attr("id");
      const ariaLabel = page$(el).attr("aria-label") || page$(el).attr("aria-labelledby") || page$(el).attr("placeholder");
      const hasLabel = id ? page$(`label[for="${id}"]`).length > 0 : false;
      return !hasLabel && !ariaLabel;
    });
    if (unlabeled.length > formInputs.length / 2) deduct('accessibilite', 2, `Champs de formulaire sans label (${unlabeled.length}/${formInputs.length})`);
  }

  // ARIA landmarks
  const hasAriaLandmarks = page$('[role="main"], [role="banner"], [role="navigation"], [role="contentinfo"], main, header, nav, footer').length >= 2;
  if (!hasAriaLandmarks) deduct('accessibilite', 2, "Peu de landmarks ARIA/HTML5 (main, header, nav, footer)");

  // Skip navigation
  const hasSkipNav = page$('a[href="#main"], a[href="#content"], a[href="#contenu"], .skip-nav, .skip-link, [class*="skip"]').length > 0;
  if (!hasSkipNav) deduct('accessibilite', 1, "Pas de lien skip navigation");

  // Contrast hints: very small font sizes
  const tinyText = page$('[style*="font-size"]').filter((_, el) => {
    const style = page$(el).attr("style") || "";
    const match = style.match(/font-size:\s*(\d+)/);
    return match ? parseInt(match[1]) < 10 : false;
  });
  if (tinyText.length > 3) deduct('accessibilite', 1, "Texte très petit détecté (font-size < 10px)");

  // Tab index misuse
  const badTabIndex = page$('[tabindex]').filter((_, el) => {
    const val = parseInt(page$(el).attr("tabindex") || "0");
    return val > 0;
  });
  if (badTabIndex.length > 0) deduct('accessibilite', 1, `tabindex positif détecté (${badTabIndex.length}) — nuit à la navigation clavier`);

  // Link text quality: links with "cliquez ici" or empty text
  const badLinks = page$("a").filter((_, el) => {
    const text = page$(el).text().trim().toLowerCase();
    return text === "cliquez ici" || text === "click here" || text === "ici" || text === "lire la suite" ||
      (text.length === 0 && !page$(el).find("img").length && !page$(el).attr("aria-label"));
  });
  if (badLinks.length > 2) deduct('accessibilite', 1, `Liens non descriptifs ou vides (${badLinks.length})`);

  // Color-only information: buttons/links without text relying on icons only
  const iconOnlyBtns = page$("button, a[role='button']").filter((_, el) => {
    const text = page$(el).text().trim();
    return text.length === 0 && !page$(el).attr("aria-label") && !page$(el).attr("title");
  });
  if (iconOnlyBtns.length > 2) deduct('accessibilite', 2, `Boutons sans texte ni aria-label (${iconOnlyBtns.length})`);

  // =========================================================================
  // Contact (15 pts)
  // =========================================================================
  if (!page$("form").length) deduct('contact', 3, "Pas de formulaire de contact");

  const emails = (html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [])
    .filter((e: string) => !e.includes("sentry") && !e.includes("wixpress") && !e.includes("example") && !e.includes("@2x"));
  if (emails.length === 0) deduct('contact', 2, "Aucun email visible");

  const phones = (html.match(/\(?[2-9]\d{2}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g) || [])
    .filter((p: string) => p.replace(/\D/g, "").length === 10);
  if (phones.length === 0) deduct('contact', 2, "Aucun téléphone visible");

  if (!/\d{3,5}[\s,]+[a-zÀ-ÿ\s]+(?:rue|av|boul|ch|rte|rang|route|boulevard|avenue|chemin)/i.test(html) &&
      !/(?:rue|av|boul|ch|rte|rang|route|boulevard|avenue|chemin)[\s,]+[a-zÀ-ÿ\s]+[\s,]+/i.test(html))
    deduct('contact', 2, "Pas d'adresse physique");

  // Social media links
  const socialPatterns = ['facebook', 'linkedin', 'instagram', 'twitter', 'x.com', 'tiktok', 'youtube'];
  const socialFound = socialPatterns.filter(s => html.toLowerCase().includes(s));
  if (socialFound.length === 0) deduct('contact', 2, "Aucun lien vers les réseaux sociaux");
  else if (socialFound.length === 1) deduct('contact', 1, "Un seul réseau social lié");

  // Google Maps embed
  if (!page$('iframe[src*="google.com/maps"], iframe[src*="maps.google"], [class*="map"], #map, #google-map').length &&
      !html.includes("maps.googleapis.com"))
    deduct('contact', 2, "Pas de Google Maps / carte");

  // Hours of operation
  if (!/heure|horaire|ouvert|lundi|mardi|mercredi|hours|schedule|monday|open/i.test(htmlLower))
    deduct('contact', 2, "Pas d'heures d'ouverture");

  // =========================================================================
  // Confiance (10 pts)
  // =========================================================================
  if (!/confidentialit[eé]|privacy|politique.*confidentialit|vie\s*priv[eé]e/i.test(htmlLower)) deduct('confiance', 2, "Pas de politique de confidentialité");
  if (!/rbq|cmeq|ccq|apchq|licence|certification|accr[eé]ditation|permis|member|membre|certified|certifi[eé]/i.test(htmlLower)) deduct('confiance', 3, "Pas de licence/certification (RBQ, CMEQ, etc.)");

  // Copyright + year
  const copyrightMatch = html.match(/©\s*(\d{4})|copyright\s*(\d{4})/i);
  if (!copyrightMatch) {
    deduct('confiance', 1, "Pas de mention copyright ©");
  } else {
    const year = parseInt(copyrightMatch[1] || copyrightMatch[2]);
    if (year < new Date().getFullYear() - 2) deduct('confiance', 1, `Copyright obsolète (${year})`);
  }

  // Terms of service
  if (!/conditions.*utilisation|terms.*service|terms.*use|cgu|conditions\s*g[eé]n[eé]rales/i.test(htmlLower))
    deduct('confiance', 1, "Pas de conditions d'utilisation");

  // Trust seals / badges
  if (!/bbb|better business|trustpilot|google.*review|avis.*google|étoile|★|star-rating|rating/i.test(htmlLower) &&
      !page$('[class*="trust"], [class*="badge"], [class*="seal"]').length)
    deduct('confiance', 1, "Pas de badges de confiance / avis externes");

  // About page / team section
  if (!/à propos|about|notre [eé]quipe|notre histoire|qui sommes/i.test(htmlLower))
    deduct('confiance', 2, "Pas de section À propos / Notre équipe");

  // =========================================================================
  // Score computation — sum of capped category scores
  // =========================================================================
  const issues = Object.values(categoryIssues).flat();

  const categoryScores: Record<Category, number> = {} as any;
  let score = 0;
  for (const cat of Object.keys(MAX_SCORES) as Category[]) {
    categoryScores[cat] = Math.max(0, MAX_SCORES[cat] - catDeductions[cat]);
    score += categoryScores[cat];
  }

  let grade: string;
  if (score >= 90) grade = "A";
  else if (score >= 75) grade = "B";
  else if (score >= 60) grade = "C";
  else if (score >= 40) grade = "D";
  else if (score >= 20) grade = "E";
  else grade = "F";

  return { score, grade, issues, categoryScores, categoryIssues };
}

// ---------------------------------------------------------------------------
// Row → Business mapping
// ---------------------------------------------------------------------------

export function rowToBusiness(row: any) {
  return {
    id: row.id,
    name: row.name,
    url: row.url,
    sector: row.sector,
    grade: row.grade,
    phone: row.phone,
    email: row.email,
    contacts: typeof row.contacts === "string" ? JSON.parse(row.contacts) : row.contacts,
    status: row.status,
    notes: row.notes,
    issues: typeof row.issues === "string" ? JSON.parse(row.issues) : row.issues,
    improvements: typeof row.improvements === "string" ? JSON.parse(row.improvements) : row.improvements,
    estimatedValue: row.estimated_value,
    hasDemo: !!row.has_demo,
    demoNotes: row.demo_notes,
    score: row.score ?? null,
    categoryScores: typeof row.category_scores === "string" ? JSON.parse(row.category_scores) : (row.category_scores || {}),
    categoryIssues: typeof row.category_issues === "string" ? JSON.parse(row.category_issues) : (row.category_issues || {}),
    history: [] as { ts: string; action: string }[],
  };
}
