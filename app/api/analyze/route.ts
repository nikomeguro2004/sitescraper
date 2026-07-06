import { NextRequest } from "next/server";
import { z } from "zod";
import { scrapeWebsite, ScrapeError } from "@/lib/scraper/scrape";
import { generateAudit, OpenRouterError } from "@/lib/ai/openrouter";
import { SCORE_CATEGORIES, type AnalyzeStreamEvent, type AuditReport, type StageIndex } from "@/lib/types/audit";

export const runtime = "nodejs";
export const maxDuration = 60;

const subPageSchema = z.object({
  url: z.string(),
  path: z.string(),
  title: z.string(),
  headings: z.array(z.object({ level: z.number(), text: z.string() })),
  buttons: z.array(z.string()),
  formsCount: z.number(),
  hasPricingSection: z.boolean(),
  pricingText: z.array(z.string()),
  hasTestimonials: z.boolean(),
  testimonialText: z.array(z.string()),
  content: z.string(),
  wordCount: z.number(),
});

const scrapedDataSchema = z.object({
  url: z.string(),
  finalUrl: z.string(),
  title: z.string(),
  metaDescription: z.string(),
  siteName: z.string(),
  screenshot: z.string(),
  themeColor: z.string().nullable(),
  headings: z.array(z.object({ level: z.number(), text: z.string() })),
  navLinks: z.array(z.string()),
  buttons: z.array(z.string()),
  formsCount: z.number(),
  content: z.string(),
  formFields: z.array(z.string()),
  hasPricingSection: z.boolean(),
  pricingText: z.array(z.string()),
  hasTestimonials: z.boolean(),
  testimonialText: z.array(z.string()),
  heroText: z.string(),
  wordCount: z.number(),
  techStack: z.array(z.string()),
  subPages: z.array(subPageSchema).default([]),
  signals: z.object({
    emails: z.array(z.string()),
    phones: z.array(z.string()),
    socialLinks: z.array(z.string()),
    hasPrivacyPolicy: z.boolean(),
    hasTermsOfService: z.boolean(),
    copyrightYear: z.string().nullable(),
    hasFavicon: z.boolean(),
    hasOgImage: z.boolean(),
    hasCanonical: z.boolean(),
    hasViewportMeta: z.boolean().default(true),
    titleLength: z.number(),
    metaDescriptionLength: z.number(),
    h1Count: z.number(),
    imgCount: z.number(),
    imgMissingAlt: z.number(),
    complianceMentions: z.array(z.string()),
  }),
  viewportScreenshot: z.string().default(""),
});

const requestSchema = z.object({
  url: z.string().url(),
  scrapedData: scrapedDataSchema.optional(),
});

function sseLine(event: AnalyzeStreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid request." }), { status: 400 });
  }
  const { url, scrapedData } = parsed.data;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      const emit = (event: AnalyzeStreamEvent) => controller.enqueue(encoder.encode(sseLine(event)));
      const stage = (i: StageIndex) => emit({ type: "stage", stage: i });

      try {
        let scraped = scrapedData;

        if (!scraped) {
          stage(0);
          stage(1);
          scraped = await scrapeWebsite(url);
          emit({ type: "scraped", data: scraped });
        } else {
          stage(0);
          stage(1);
          // Just a small delay so UI isn't instantaneous if we skip scraping
          await new Promise(r => setTimeout(r, 500)); 
        }

        stage(2);

        const aiPromise = generateAudit(scraped);
        await raceStagesWithWork([3, 4, 5, 6], 1400, stage, aiPromise);
        const aiResult = await aiPromise;

        stage(7);

        // Single source of truth: the per-section scores. categoryScores, the
        // overall score, grade, and rating are all derived from them so the
        // report can never contradict itself.
        const categoryScores = Object.fromEntries(
          SCORE_CATEGORIES.map((key) => [key, Math.round(aiResult[key].score * 10) / 10]),
        ) as Record<(typeof SCORE_CATEGORIES)[number], number>;
        const avgScore = SCORE_CATEGORIES.reduce((sum, key) => sum + categoryScores[key], 0) / SCORE_CATEGORIES.length;
        const overallScore = Math.round(avgScore * 10) / 10;
        const projectedImprovedScore =
          Math.round(Math.min(9.7, Math.max(aiResult.projectedImprovedScore, overallScore + 0.3)) * 10) / 10;

        const report: AuditReport = {
          id: crypto.randomUUID(),
          url: scraped.finalUrl,
          websiteName: aiResult.websiteName,
          screenshot: scraped.screenshot,
          themeColor: scraped.themeColor,
          createdAt: new Date().toISOString(),
          overallScore,
          scoreRating: deriveScoreRating(overallScore),
          projectedImprovedScore,
          businessGrade: deriveBusinessGrade(overallScore),
          categoryScores,
          trustCredibility: aiResult.trustCredibility,
          salesConversionReadiness: aiResult.salesConversionReadiness,
          enterpriseReadiness: aiResult.enterpriseReadiness,
          visualBranding: aiResult.visualBranding,
          visualStorytelling: aiResult.visualStorytelling,
          brandDifferentiation: aiResult.brandDifferentiation,
          businessValueCommunication: aiResult.businessValueCommunication,
          whatWeDo: aiResult.whatWeDo,
          businessConclusion: aiResult.businessConclusion,
        };

        emit({ type: "done", report });
      } catch (err) {
        console.error("[analyze]", err);
        emit({ type: "error", message: errorMessage(err) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

async function raceStagesWithWork(
  stages: StageIndex[],
  intervalMs: number,
  emitStage: (i: StageIndex) => void,
  work: Promise<unknown>,
) {
  let settled = false;
  work.then(
    () => (settled = true),
    () => (settled = true),
  );
  for (const s of stages) {
    if (settled) return;
    emitStage(s);
    await Promise.race([new Promise((r) => setTimeout(r, intervalMs)), work.catch(() => {})]);
    if (settled) return;
  }
}

function deriveBusinessGrade(score: number): AuditReport["businessGrade"] {
  if (score >= 9) return "A+";
  if (score >= 8.5) return "A";
  if (score >= 7.5) return "B+";
  if (score >= 6.5) return "B";
  if (score >= 5.5) return "C+";
  if (score >= 4.5) return "C";
  if (score >= 3.5) return "D";
  return "F";
}

function deriveScoreRating(score: number): AuditReport["scoreRating"] {
  if (score >= 8.5) return "EXCELLENT";
  if (score >= 7) return "GOOD";
  if (score >= 5) return "MEDIUM";
  return "LOW";
}

function errorMessage(err: unknown): string {
  if (err instanceof ScrapeError) return err.message;
  if (err instanceof OpenRouterError) {
    if (err.code === "missing_key") return "The AI provider isn't configured yet. Add GROQ_API_KEY.";
    if (err.code === "rate_limited") return "The AI provider is rate limited right now. Try again in a moment.";
    return "The AI couldn't generate a report for this site. Try again.";
  }
  return "Something went wrong while analyzing this site.";
}
