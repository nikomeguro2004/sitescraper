import type { ScrapedPageData } from "@/lib/types/audit";

export function buildSystemPrompt(): string {
  return `You are a Senior Website Growth Consultant, UI/UX Strategist, CRO Expert, SaaS Branding Expert and Business Conversion Auditor. Your task is to perform an encouraging, highly constructive, premium-level WEBSITE BUSINESS AUDIT for the provided website data. 

The audit must NOT be generic. It must feel like a real high-ticket agency report prepared for a client who is looking to elevate their brand and grow.

IMPORTANT:
- Be highly constructive and encouraging.
- Frame problems as exciting opportunities for growth.
- Highlight the website's existing strengths and potential.
- Compare against modern premium websites in the same industry to inspire them.
- Analyze from BUSINESS, SALES, BRANDING, TRUST, and CONVERSION perspective.
- Think like:
  • UI/UX Expert
  • SaaS Growth Consultant
  • Enterprise Branding Consultant
  • CRO Specialist
  • Investor evaluating the company
  • Customer visiting for the first time

SCORING RULES:
Individual Parameter Scores (inside trustCredibility, etc.) are 0-10:
9.0 - 10: World-class premium execution
8.0 - 8.9: Highly business ready with minor improvements
7.0 - 7.9: Strong foundation but needs refinement
6.0 - 6.9: Average modern business quality
5.0 - 5.9: Weak execution with noticeable issues
Below 5: Poor business positioning/design/conversion

CRITICAL SCORING INSTRUCTION:
- ALL scores across the entire JSON MUST BE OUT OF 10 (e.g., 8.5, 9.2, 7.4). This includes overallScore, projectedImprovedScore, and all values inside categoryScores.
- The individual score field inside each of the 7 parameter objects (e.g., trustCredibility.score) MUST ALSO BE OUT OF 10.
- Most normal business websites should realistically have an overallScore between 4.5 and 7.5.
- Only truly exceptional websites should cross 8.5.
- Do NOT overrate average websites.
- Be stricter on: UI quality, spacing, typography, storytelling, mobile responsiveness, premium feel, conversion psychology.
- If the website visually feels old or low-quality: reduce scores aggressively.

DATA STRUCTURE REQUIREMENTS (Strict JSON):
- categoryScores: Map EXACTLY the 7 parameter names directly to their numeric score (0-10). Example: { "trustCredibility": 8.5, "salesConversionReadiness": 7.2, ... }. Do NOT nest objects here.
- Each of the 7 parameters (trustCredibility, salesConversionReadiness, etc.) MUST be objects with:
  - score (0-10)
  - businessStatus ("Excellent", "Good", "Needs Work", "Critical")
  - points: EXACTLY 4 concise audit points. For visualBranding, make sure to explicitly identify the design theme (e.g., Brutalist, Swiss, Clean SaaS, Corporate, etc.).
  - conclusion: 1 business conclusion paragraph.
- whatWeDo: 
  - problems: EXACTLY 5 concise bullet points of what is wrong.
  - solutions: EXACTLY 5 concise bullet points of premium agency recommendations.
- businessConclusion:
  - points: 5 concise conclusion points.
  - currentPositioning: Quote describing current behavior (e.g., "A generic template listing services").
  - premiumFuturePositioning: Quote describing future potential (e.g., "A premium enterprise authority that commands trust").
- projectedImprovedScore: Calculate what the score could be after strategic improvements.
- scoreRating: "LOW", "MEDIUM", "GOOD", or "EXCELLENT".

IMPORTANT AUDIT RULES:
1. Always maintain a positive, supportive tone.
2. If design is weak, frame it as a great opportunity for a modern refresh.
3. If conversion flow is weak, provide gentle, actionable recommendations.
4. If branding looks template-based, encourage them to develop a unique brand voice.
5. Audit from an empathetic BUSINESS perspective.
6. Be concise but highly premium and inspiring.
7. Make it sound like a real consultancy report.
8. Avoid fluff.
9. Do NOT use emojis.
10. Be highly observant and analytical.
11. Use industry comparison mentally while scoring.
12. You receive the homepage PLUS several crawled internal pages (pricing, about, product, customers, etc.). Ground your claims in this multi-page evidence — e.g. judge pricing transparency from the actual pricing page, social proof from the customers page — and reference specific pages (by path) in your points when relevant.
13. The FACTUAL SITE SIGNALS block is deterministically extracted ground truth. Never contradict it — do not claim contact info, legal pages, or compliance badges are missing when the signals say they exist, and never invent ones the signals do not show. Cite these facts in your points.
14. Base all visual/design claims (color, typography, layout, hierarchy, imagery) on the VISUAL ANALYSIS block, which comes from a vision model that saw the actual rendered page. If that block is unavailable, do not make specific claims about colors or typography you cannot infer from the text content.

Output ONLY valid JSON matching the schema. No markdown, no code fences, no commentary outside the JSON object.`;
}

function renderSubPage(page: ScrapedPageData["subPages"][number], index: number): string {
  return `--- PAGE ${index + 2}: ${page.path} (${page.title || "untitled"}) ---
Headings: ${page.headings.map((h) => `H${h.level}: ${h.text}`).join(" | ") || "(none)"}
Buttons / CTAs: ${page.buttons.join(", ") || "(none)"}
Forms: ${page.formsCount}
Pricing present: ${page.hasPricingSection ? "yes" : "no"}${page.pricingText.length ? ` — excerpts: ${page.pricingText.join(" | ")}` : ""}
Testimonials present: ${page.hasTestimonials ? "yes" : "no"}${page.testimonialText.length ? ` — excerpts: ${page.testimonialText.join(" | ")}` : ""}
Content: ${page.content || "(empty)"}`;
}

function renderSignals(s: ScrapedPageData["signals"]): string {
  return `Contact emails found: ${s.emails.length ? s.emails.join(", ") : "NONE"}
Phone numbers found: ${s.phones.length ? s.phones.join(", ") : "NONE"}
Social profiles linked: ${s.socialLinks.length ? s.socialLinks.join(", ") : "NONE"}
Privacy policy linked: ${s.hasPrivacyPolicy ? "yes" : "NO"} · Terms of service linked: ${s.hasTermsOfService ? "yes" : "NO"}
Compliance/security mentions: ${s.complianceMentions.length ? s.complianceMentions.join(", ") : "none found"}
Copyright year shown: ${s.copyrightYear ?? "none found"}
SEO/meta: title ${s.titleLength} chars · meta description ${s.metaDescriptionLength ? `${s.metaDescriptionLength} chars` : "MISSING"} · canonical ${s.hasCanonical ? "yes" : "no"} · og:image ${s.hasOgImage ? "yes" : "no"} · favicon ${s.hasFavicon ? "yes" : "no"} · responsive viewport meta ${s.hasViewportMeta ? "yes" : "NO (site likely not mobile-optimized)"}
Structure: ${s.h1Count} H1 tag(s) · ${s.imgCount} images (${s.imgMissingAlt} missing alt text)`;
}

export function buildUserPrompt(data: ScrapedPageData, visualAnalysis?: string | null): string {
  const visualBlock = visualAnalysis
    ? `\n=== VISUAL ANALYSIS OF RENDERED HOMEPAGE (from a vision model that saw the actual screenshot) ===
${visualAnalysis}
=========================\n`
    : `\n(Visual analysis unavailable for this run — avoid specific claims about colors/typography/imagery you cannot infer from the text.)\n`;

  const subPagesBlock =
    data.subPages.length > 0
      ? `\n=== ADDITIONAL CRAWLED PAGES (${data.subPages.length}) ===
The crawler also visited these key internal pages. Use them to ground claims about pricing transparency, social proof, enterprise readiness, and conversion paths — do not judge those solely from the homepage.

${data.subPages.map(renderSubPage).join("\n\n")}
=========================\n`
      : `\n(No additional internal pages could be crawled — base the audit on the homepage only, and note in the audit when a claim would need pricing/about/customer pages to verify.)\n`;

  return `Analyze this website using the scraped data below and return the structured JSON audit.

URL: ${data.finalUrl}
Page title: ${data.title}
og:site_name meta tag: ${data.siteName || "(not present)"}
Meta description: ${data.metaDescription || "(none found)"}
Word count: ${data.wordCount}

=== FACTUAL SITE SIGNALS (deterministically extracted — ground truth, cite these) ===
${renderSignals(data.signals)}
=========================
${visualBlock}
=== PAGE 1: HOMEPAGE CONTENT ===
${data.content}
=========================
${subPagesBlock}

=== DETECTED TECH STACK ===
${data.techStack.join(", ") || "(no recognizable platform/tooling signatures found — likely a custom-built site)"}
==================

For "websiteName" in your JSON output, use the actual brand/company name (e.g. from og:site_name, or inferred from the page title/hero — strip suffixes like taglines or "| Home"). Never output the raw URL or domain as the websiteName.

Hero content: ${data.heroText || "(not detected)"}

Headings (in DOM order):
${data.headings.map((h) => `H${h.level}: ${h.text}`).join("\n") || "(none found)"}

Navigation links: ${data.navLinks.join(", ") || "(none found)"}

Buttons / CTAs: ${data.buttons.join(", ") || "(none found)"}

Forms detected: ${data.formsCount} (fields: ${data.formFields.join(", ") || "none"})

Pricing section present: ${data.hasPricingSection ? "yes" : "no"}
Pricing excerpts: ${data.pricingText.join(" | ") || "(none)"}

Testimonials/social proof present: ${data.hasTestimonials ? "yes" : "no"}
Testimonial excerpts: ${data.testimonialText.join(" | ") || "(none)"}

Return the JSON object now.`;
}
