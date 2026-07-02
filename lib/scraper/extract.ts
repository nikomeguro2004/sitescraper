import * as cheerio from "cheerio";
import type { ScrapedPageData } from "@/lib/types/audit";

const PRICING_KEYWORDS = ["pricing", "plan", "/mo", "/month", "/year", "per month", "per user", "$", "free trial"];
const TESTIMONIAL_KEYWORDS = ["testimonial", "review", "customer", "case study", "said", "loved by", "trusted by"];

export function extractPageData(html: string, url: string, finalUrl: string, screenshot: string): ScrapedPageData {
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

  const techClues: string[] = [];
  $('meta[name="generator"]').each((_, el) => { techClues.push($(el).attr('content') || "") });
  $('script[src]').each((_, el) => { techClues.push($(el).attr('src') || "") });
  $('link[rel="stylesheet"]').each((_, el) => { techClues.push($(el).attr('href') || "") });
  $('script:not([src])').each((_, el) => {
    const html = $(el).html() || "";
    if (html.includes('__NEXT_DATA__')) techClues.push("Next.js");
    if (html.includes('__NUXT__')) techClues.push("Nuxt.js");
    if (html.includes('wp-')) techClues.push("WordPress");
    if (html.includes('gatsby')) techClues.push("Gatsby");
  });

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
    testimonialText: [],
    heroText,
    wordCount,
    techClues: [...new Set(techClues.filter(Boolean))].slice(0, 30),
    content: mainText,
  };
}
