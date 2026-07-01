import { NextRequest } from "next/server";
import { z } from "zod";
import { scrapeWebsite, ScrapeError } from "@/lib/scraper/scrape";
import { generateAudit, OpenRouterError } from "@/lib/ai/openrouter";
import { type AnalyzeStreamEvent, type AuditReport, type StageIndex } from "@/lib/types/audit";

export const runtime = "nodejs";
export const maxDuration = 60;

const requestSchema = z.object({
  url: z.string().url(),
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
  const { url } = parsed.data;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      const emit = (event: AnalyzeStreamEvent) => controller.enqueue(encoder.encode(sseLine(event)));
      const stage = (i: StageIndex) => emit({ type: "stage", stage: i });

      try {
        stage(0);
        stage(1);
        const scraped = await scrapeWebsite(url);

        stage(2);

        const aiPromise = generateAudit(scraped);
        await raceStagesWithWork([3, 4, 5, 6], 1400, stage, aiPromise);
        const aiResult = await aiPromise;

        stage(7);

        const report: AuditReport = {
          id: crypto.randomUUID(),
          url: scraped.finalUrl,
          websiteName: aiResult.websiteName,
          screenshot: scraped.screenshot,
          createdAt: new Date().toISOString(),
          overallScore: Math.round(aiResult.overallScore),
          scoreRating: aiResult.scoreRating,
          projectedImprovedScore: Math.round(aiResult.projectedImprovedScore),
          businessGrade: aiResult.businessGrade,
          categoryScores: aiResult.categoryScores,
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

function errorMessage(err: unknown): string {
  if (err instanceof ScrapeError) return err.message;
  if (err instanceof OpenRouterError) {
    if (err.code === "missing_key") return "The AI provider isn't configured yet. Add GROQ_API_KEY.";
    if (err.code === "rate_limited") return "The AI provider is rate limited right now. Try again in a moment.";
    return "The AI couldn't generate a report for this site. Try again.";
  }
  return "Something went wrong while analyzing this site.";
}
