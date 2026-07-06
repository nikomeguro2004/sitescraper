import * as cheerio from "cheerio";
import type { ScrapedPageData, SiteSignals, SubPageData } from "@/lib/types/audit";

const PRICING_KEYWORDS = [
  "pricing",
  "/mo",
  "/month",
  "/year",
  "per month",
  "per user",
  "per seat",
  "free trial",
  "start free",
  "get a quote",
  "request a demo",
];
const TESTIMONIAL_KEYWORDS = ["testimonial", "review", "customer story", "case study", "loved by", "trusted by"];

// Sized so homepage + 3 sub-pages + signals + vision analysis stays under
// ~9k tokens — within llama-3.3-70b's 12k TPM free-tier limit on Groq.
const MAX_CONTENT_CHARS = 12_000;
const MAX_SUBPAGE_CONTENT_CHARS = 5_000;

// Higher score = more valuable page for a business/conversion audit.
// One page per category is preferred — a pricing page plus a customers page
// tells the audit far more than two customer stories.
const PAGE_PRIORITIES: { pattern: RegExp; score: number; category: string }[] = [
  { pattern: /pricing|plans/i, score: 100, category: "pricing" },
  { pattern: /product|features|platform|solutions/i, score: 80, category: "product" },
  { pattern: /about|company|team|story/i, score: 70, category: "about" },
  { pattern: /customers|case-stud|testimonials|reviews|success/i, score: 65, category: "customers" },
  { pattern: /enterprise|security|trust/i, score: 60, category: "enterprise" },
  { pattern: /contact|demo|get-started|signup|sign-up|trial/i, score: 55, category: "contact" },
  { pattern: /services|work|portfolio/i, score: 50, category: "services" },
  {
    pattern:
      /blog|docs|help|support|careers|legal|privacy|terms|login|signin|changelog|status|press|events|news|community|download|integrations\//i,
    score: -100,
    category: "excluded",
  },
];

const COMPLIANCE_PATTERNS: { pattern: RegExp; label: string }[] = [
  { pattern: /SOC\s*2/i, label: "SOC 2" },
  { pattern: /ISO\s*27001/i, label: "ISO 27001" },
  { pattern: /GDPR/i, label: "GDPR" },
  { pattern: /HIPAA/i, label: "HIPAA" },
  { pattern: /PCI[\s-]?DSS/i, label: "PCI DSS" },
  { pattern: /\bSSO\b|SAML/i, label: "SSO/SAML" },
  { pattern: /CCPA/i, label: "CCPA" },
];

const SOCIAL_HOSTS: { pattern: RegExp; label: string }[] = [
  { pattern: /twitter\.com|x\.com/i, label: "twitter/x" },
  { pattern: /linkedin\.com/i, label: "linkedin" },
  { pattern: /github\.com/i, label: "github" },
  { pattern: /youtube\.com/i, label: "youtube" },
  { pattern: /instagram\.com/i, label: "instagram" },
  { pattern: /facebook\.com/i, label: "facebook" },
];

const TECH_FINGERPRINTS: { pattern: RegExp; label: string }[] = [
  { pattern: /cdn\.shopify\.com|shopify\.com\/s\//i, label: "Shopify" },
  { pattern: /assets-global\.website-files\.com|webflow\.(io|com)/i, label: "Webflow" },
  { pattern: /static\.wixstatic\.com|wix\.com\/.*static/i, label: "Wix" },
  { pattern: /squarespace\.com|sqsp\.net/i, label: "Squarespace" },
  { pattern: /framerusercontent\.com|framer\.(app|com)/i, label: "Framer" },
  { pattern: /js\.hs-scripts\.com|hsforms\.(net|com)|hubspot/i, label: "HubSpot" },
  { pattern: /cdn\.jsdelivr\.net\/npm\/bootstrap/i, label: "Bootstrap" },
  { pattern: /wp-content|wp-includes/i, label: "WordPress" },
  { pattern: /_next\/static/i, label: "Next.js" },
  { pattern: /__nuxt|_nuxt\//i, label: "Nuxt.js" },
  { pattern: /cdn\.segment\.com/i, label: "Segment" },
  { pattern: /googletagmanager\.com/i, label: "Google Tag Manager" },
  { pattern: /intercom(cdn)?\.com/i, label: "Intercom" },
  { pattern: /js\.stripe\.com/i, label: "Stripe" },
];

export function extractPageData(html: string, url: string, finalUrl: string, screenshot: string): ScrapedPageData {
  const techStack = [...new Set(TECH_FINGERPRINTS.filter((f) => f.pattern.test(html)).map((f) => f.label))];

  const $ = cheerio.load(html);

  $("script, style, noscript, svg path").remove();

  const title = $("title").first().text().trim() || $("h1").first().text().trim() || "Untitled";
  const metaDescription =
    $('meta[name="description"]').attr("content")?.trim() ||
    $('meta[property="og:description"]').attr("content")?.trim() ||
    "";
  const siteName =
    $('meta[property="og:site_name"]').attr("content")?.trim() ||
    $('meta[property="application-name"]').attr("content")?.trim() ||
    "";
  const themeColor = $('meta[name="theme-color"]').attr("content") || null;

  const headings: { level: number; text: string }[] = [];
  $("h1, h2, h3").each((_, el) => {
    const text = $(el).text().trim().replace(/\s+/g, " ");
    if (text) headings.push({ level: Number(el.tagName.slice(1)), text: text.slice(0, 200) });
  });

  const navLinks: string[] = [];
  $("nav a, header a").each((_, el) => {
    const text = $(el).text().trim();
    if (text && text.length < 60) navLinks.push(text);
  });

  const buttons: string[] = [];
  $('button, a[class*="btn"], a[class*="button"], [role="button"]').each((_, el) => {
    const text = $(el).text().trim();
    if (text && text.length < 60) buttons.push(text);
  });

  const forms = $("form");
  const formFields: string[] = [];
  $("form input, form textarea, form select").each((_, el) => {
    const placeholder = $(el).attr("placeholder") || $(el).attr("name") || $(el).attr("type") || "";
    if (placeholder) formFields.push(placeholder);
  });

  const bodyText = $("body").text().toLowerCase();
  const mainText = $("body").text().trim();
  const hasPricingSection = PRICING_KEYWORDS.some((kw) => bodyText.includes(kw));
  const pricingText: string[] = [];
  $('[class*="pric"], [id*="pric"]').each((_, el) => {
    const text = $(el).text().trim().replace(/\s+/g, " ");
    if (text && text.length < 500) pricingText.push(text.slice(0, 300));
  });

  const hasTestimonials = TESTIMONIAL_KEYWORDS.some((kw) => bodyText.includes(kw));
  const testimonialText: string[] = [];
  $('[class*="testimonial"], [class*="review"], blockquote').each((_, el) => {
    const text = $(el).text().trim().replace(/\s+/g, " ");
    if (text && text.length < 500) testimonialText.push(text.slice(0, 300));
  });

  const heroCandidate = $("header, section, div").first();
  const heroH1 = $("h1").first().text().trim();
  const heroP = $("h1").first().nextAll("p").first().text().trim() || $("p").first().text().trim();
  const heroText = [heroH1, heroP].filter(Boolean).join(" — ").slice(0, 500) || heroCandidate.text().trim().slice(0, 300);

  const wordCount = $("body").text().trim().split(/\s+/).filter(Boolean).length;

  const generator = $('meta[name="generator"]').attr("content")?.trim();
  if (generator) techStack.push(generator);

  const signals = extractSiteSignals($, title, metaDescription);

  return {
    url,
    finalUrl,
    title: title.slice(0, 200),
    metaDescription: metaDescription.slice(0, 300),
    siteName: siteName.slice(0, 120),
    screenshot,
    themeColor,
    headings: headings.slice(0, 40),
    navLinks: [...new Set(navLinks)].slice(0, 20),
    buttons: [...new Set(buttons)].slice(0, 20),
    formsCount: forms.length,
    formFields: [...new Set(formFields)].slice(0, 20),
    hasPricingSection,
    pricingText: pricingText.slice(0, 10),
    hasTestimonials,
    testimonialText: testimonialText.slice(0, 10),
    heroText,
    wordCount,
    techStack: [...new Set(techStack.filter(Boolean))].slice(0, 15),
    content: mainText.replace(/\s+/g, " ").slice(0, MAX_CONTENT_CHARS),
    subPages: [],
    signals,
    viewportScreenshot: "",
  };
}

function extractSiteSignals($: cheerio.CheerioAPI, title: string, metaDescription: string): SiteSignals {
  const bodyText = $("body").text();

  const emails = new Set<string>();
  const phones = new Set<string>();
  const socialLinks = new Set<string>();
  let hasPrivacyPolicy = false;
  let hasTermsOfService = false;

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    const text = $(el).text().trim().toLowerCase();
    if (href.startsWith("mailto:")) emails.add(href.slice(7).split("?")[0].trim().toLowerCase());
    if (href.startsWith("tel:")) phones.add(href.slice(4).trim());
    for (const { pattern, label } of SOCIAL_HOSTS) {
      if (pattern.test(href)) socialLinks.add(label);
    }
    if (/privacy/i.test(href) || /privacy policy/.test(text)) hasPrivacyPolicy = true;
    if (/terms/i.test(href) || /terms of (service|use)/.test(text)) hasTermsOfService = true;
  });

  // Emails also appear as plain text; strict boundaries avoid gluing adjacent
  // text runs together, and demo/placeholder addresses are skipped.
  for (const match of bodyText.matchAll(/(?<![\w.+-])[a-z0-9][\w.+-]*@[a-z0-9-]+(?:\.[a-z]{2,8})+(?![\w.])/gi)) {
    const email = match[0].toLowerCase();
    if (/example\.(com|org|net)|@(test|demo|acme)\./.test(email)) continue;
    emails.add(email);
  }

  const copyrightMatch = bodyText.match(/(?:©|\(c\)|copyright)\s*(\d{4})/i);

  const complianceMentions = COMPLIANCE_PATTERNS.filter(({ pattern }) => pattern.test(bodyText)).map(
    ({ label }) => label,
  );

  const imgs = $("img");
  let imgMissingAlt = 0;
  imgs.each((_, el) => {
    if (!$(el).attr("alt")?.trim()) imgMissingAlt++;
  });

  return {
    emails: [...emails].slice(0, 5),
    phones: [...phones].slice(0, 3),
    socialLinks: [...socialLinks],
    hasPrivacyPolicy,
    hasTermsOfService,
    copyrightYear: copyrightMatch?.[1] ?? null,
    hasFavicon: $('link[rel*="icon"]').length > 0,
    hasOgImage: Boolean($('meta[property="og:image"]').attr("content")),
    hasCanonical: Boolean($('link[rel="canonical"]').attr("href")),
    hasViewportMeta: Boolean($('meta[name="viewport"]').attr("content")),
    titleLength: title.length,
    metaDescriptionLength: metaDescription.length,
    h1Count: $("h1").length,
    imgCount: imgs.length,
    imgMissingAlt,
    complianceMentions,
  };
}

/** Pick the most audit-relevant internal links from the homepage HTML. */
export function discoverInternalLinks(html: string, baseUrl: string, maxPages: number): string[] {
  const $ = cheerio.load(html);
  const base = new URL(baseUrl);
  const scored = new Map<string, { score: number; category: string }>();

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    let resolved: URL;
    try {
      resolved = new URL(href, base);
    } catch {
      return;
    }
    if (resolved.hostname !== base.hostname) return;
    if (!/^https?:$/.test(resolved.protocol)) return;

    resolved.hash = "";
    resolved.search = "";
    const path = resolved.pathname.replace(/\/+$/, "");
    if (!path || path === base.pathname.replace(/\/+$/, "")) return;
    if (/\.(pdf|zip|png|jpe?g|svg|webp|mp4|xml|ico)$/i.test(path)) return;
    if (path.split("/").filter(Boolean).length > 2) return; // deep pages rarely matter for the audit

    let score = 5; // small base score so plain nav pages still qualify
    let category = "other";
    const anchorText = $(el).text().trim().toLowerCase();
    for (const { pattern, score: s, category: c } of PAGE_PRIORITIES) {
      if (pattern.test(path) || pattern.test(anchorText)) {
        if (s < 0) return; // excluded page type (blog, docs, legal, auth)
        if (s > score || category === "other") category = c;
        score = Math.max(score, s);
      }
    }

    const key = resolved.toString();
    const existing = scored.get(key);
    if (!existing || score > existing.score) scored.set(key, { score, category });
  });

  const ranked = [...scored.entries()].sort((a, b) => b[1].score - a[1].score);

  // Prefer one page per category (pricing + customers + product beats three
  // customer stories), then fill any remaining slots by raw score.
  const picked: string[] = [];
  const usedCategories = new Set<string>();
  for (const [url, { category }] of ranked) {
    if (picked.length >= maxPages) break;
    if (usedCategories.has(category)) continue;
    usedCategories.add(category);
    picked.push(url);
  }
  for (const [url] of ranked) {
    if (picked.length >= maxPages) break;
    if (!picked.includes(url)) picked.push(url);
  }
  return picked;
}

/** Lightweight extraction for crawled sub-pages (no screenshot, smaller content budget). */
export function extractSubPageData(html: string, url: string): SubPageData {
  const $ = cheerio.load(html);
  $("script, style, noscript, svg path").remove();

  const title = $("title").first().text().trim() || $("h1").first().text().trim() || "";

  const headings: { level: number; text: string }[] = [];
  $("h1, h2, h3").each((_, el) => {
    const text = $(el).text().trim().replace(/\s+/g, " ");
    if (text) headings.push({ level: Number(el.tagName.slice(1)), text: text.slice(0, 200) });
  });

  const buttons: string[] = [];
  $('button, a[class*="btn"], a[class*="button"], [role="button"]').each((_, el) => {
    const text = $(el).text().trim();
    if (text && text.length < 60) buttons.push(text);
  });

  const bodyText = $("body").text().toLowerCase();
  const hasPricingSection = PRICING_KEYWORDS.some((kw) => bodyText.includes(kw));
  const pricingText: string[] = [];
  $('[class*="pric"], [id*="pric"]').each((_, el) => {
    const text = $(el).text().trim().replace(/\s+/g, " ");
    if (text && text.length < 500) pricingText.push(text.slice(0, 300));
  });

  const hasTestimonials = TESTIMONIAL_KEYWORDS.some((kw) => bodyText.includes(kw));
  const testimonialText: string[] = [];
  $('[class*="testimonial"], [class*="review"], blockquote').each((_, el) => {
    const text = $(el).text().trim().replace(/\s+/g, " ");
    if (text && text.length < 500) testimonialText.push(text.slice(0, 300));
  });

  const mainText = $("body").text().trim();

  return {
    url,
    path: new URL(url).pathname,
    title: title.slice(0, 200),
    headings: headings.slice(0, 25),
    buttons: [...new Set(buttons)].slice(0, 15),
    formsCount: $("form").length,
    hasPricingSection,
    pricingText: pricingText.slice(0, 8),
    hasTestimonials,
    testimonialText: testimonialText.slice(0, 8),
    content: mainText.replace(/\s+/g, " ").slice(0, MAX_SUBPAGE_CONTENT_CHARS),
    wordCount: mainText.split(/\s+/).filter(Boolean).length,
  };
}
