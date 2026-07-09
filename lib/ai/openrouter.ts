import { aiAuditSchema, AI_JSON_SCHEMA, type AiAuditOutput } from "@/lib/ai/schema";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/ai/prompt";
import type { ScrapedPageData } from "@/lib/types/audit";

export class OpenRouterError extends Error {
  constructor(
    message: string,
    public code: "missing_key" | "rate_limited" | "upstream" | "parse_failed",
  ) {
    super(message);
    this.name = "OpenRouterError";
  }
}

type Provider = "groq" | "openrouter";

interface Attempt {
  provider: Provider;
  key: string;
  model: string;
}

// Free-tier Groq TPM limits: llama-3.3-70b 12k (fits our ~9k-token prompt),
// gpt-oss-120b 8k and llama-3.1-8b 6k (only fit small sites) — order matters.
const GROQ_MODELS = ["llama-3.3-70b-versatile", "openai/gpt-oss-120b", "llama-3.1-8b-instant"];
const GROQ_VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";
const OPENROUTER_MODELS = ["meta-llama/llama-3.3-70b-instruct:free", "openai/gpt-oss-120b:free"];

// Total wall-clock budget for the AI stage. Kept well under the route's
// maxDuration (60s) so a clean SSE error can still be emitted instead of the
// serverless function being killed mid-stream.
const AI_BUDGET_MS = 40_000;
const PER_CALL_TIMEOUT_MS = 18_000;

function buildAttempts(): Attempt[] {
  const groqModels = (process.env.GROQ_MODEL?.split(",").map((m) => m.trim()).filter(Boolean)) || GROQ_MODELS;
  const orModels =
    (process.env.OPENROUTER_MODEL?.split(",").map((m) => m.trim()).filter(Boolean)) || OPENROUTER_MODELS;

  const attempts: Attempt[] = [];
  const groqKeys = [process.env.GROQ_API_KEY_2, process.env.GROQ_API_KEY].filter((k): k is string => !!k);
  const orKey = process.env.OPENROUTER_API_KEY;

  // Groq first (faster + generous free tier), then OpenRouter as fallback.
  for (const key of groqKeys) {
    for (const model of groqModels) attempts.push({ provider: "groq", key, model });
  }
  if (orKey) {
    for (const model of orModels) attempts.push({ provider: "openrouter", key: orKey, model });
  }
  return attempts;
}

function extractJson(raw: string): unknown {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  const jsonSlice = start !== -1 && end !== -1 ? candidate.slice(start, end + 1) : candidate;
  return JSON.parse(jsonSlice);
}

async function callModel(attempt: Attempt, system: string, user: string, timeoutMs: number): Promise<string> {
  const isOR = attempt.provider === "openrouter";
  const url = isOR ? "https://openrouter.ai/api/v1/chat/completions" : "https://api.groq.com/openai/v1/chat/completions";

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${attempt.key}`,
      "Content-Type": "application/json",
      ...(isOR ? { "HTTP-Referer": "https://sitescraper.vercel.app", "X-Title": "SiteElevate" } : {}),
    },
    body: JSON.stringify({
      model: attempt.model,
      messages: [
        { role: "system", content: `${system}\n\nCRITICAL: You must output JSON matching this EXACT schema:\n${JSON.stringify(AI_JSON_SCHEMA)}` },
        { role: "user", content: user },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    }),
    signal: AbortSignal.timeout(timeoutMs),
  }).catch((err) => {
    if (err instanceof Error && (err.name === "TimeoutError" || err.message.includes("timeout"))) {
      throw new OpenRouterError("The AI provider took too long to respond.", "upstream");
    }
    throw new OpenRouterError(`Could not reach ${attempt.provider}.`, "upstream");
  });

  if (!res.ok) {
    if (res.status === 429) throw new OpenRouterError("Rate limited by the AI provider.", "rate_limited");
    const body = await res.text().catch(() => "");
    throw new OpenRouterError(`${attempt.provider} request failed (${res.status}): ${body.slice(0, 300)}`, "upstream");
  }

  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new OpenRouterError(`Empty response from ${attempt.provider}.`, "upstream");
  }
  return content;
}

const VISION_PROMPT = `You are a senior product designer reviewing a screenshot of a website's above-the-fold homepage. Describe concretely and critically what you SEE:
- Layout structure and visual hierarchy (what draws the eye first, is there a clear focal point)
- Typography (scale contrast, readability, font pairing quality)
- Color palette and how professional/premium it feels
- Whitespace and density (cramped vs breathing room)
- Imagery/illustration quality (stock-photo feel vs custom)
- CTA visibility and prominence
- Any specific visual flaws (misalignment, low contrast, dated patterns, clutter)
Return 8-12 short, specific bullet points. No preamble, no conclusion.`;

/** Ask a vision model to describe the rendered page. Best-effort: any failure returns null. */
async function describeScreenshot(dataUrl: string, timeoutMs: number): Promise<string | null> {
  const key = process.env.GROQ_API_KEY_2 || process.env.GROQ_API_KEY;
  if (!key || !dataUrl || timeoutMs < 2_000) return null;
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: GROQ_VISION_MODEL,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: VISION_PROMPT },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
        temperature: 0.4,
        max_tokens: 700,
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content;
    return typeof content === "string" && content.trim() ? content.trim() : null;
  } catch {
    return null;
  }
}

/**
 * @param deadlineAt Absolute Date.now()-style timestamp the whole request must
 * finish by (scrape + AI share this budget). Falls back to a fixed 40s
 * budget from now if not provided, e.g. when calling this standalone.
 */
export async function generateAudit(data: ScrapedPageData, deadlineAt?: number): Promise<AiAuditOutput> {
  const deadline = deadlineAt ? Math.min(deadlineAt, Date.now() + AI_BUDGET_MS) : Date.now() + AI_BUDGET_MS;

  const visionTimeout = Math.min(12_000, deadline - Date.now() - 2_000);
  const visualAnalysis = await describeScreenshot(data.viewportScreenshot, visionTimeout);
  if (!visualAnalysis) console.warn("[ai] vision pass unavailable — audit will be text-grounded only");

  const system = buildSystemPrompt();
  const user = buildUserPrompt(data, visualAnalysis);
  const attempts = buildAttempts();
  if (attempts.length === 0) throw new OpenRouterError("No AI API keys are configured.", "missing_key");

  let lastError: unknown;

  for (const attempt of attempts) {
    const remaining = deadline - Date.now();
    if (remaining < 4_000) break; // not enough time left to reasonably try another call

    const timeoutMs = Math.min(PER_CALL_TIMEOUT_MS, remaining);
    try {
      const raw = await callModel(attempt, system, user, timeoutMs);
      const parsed = extractJson(raw);
      const result = aiAuditSchema.safeParse(parsed);
      if (result.success) return result.data;
      if (process.env.DEBUG_AI) console.warn(`[ai] ${attempt.provider}/${attempt.model} validation error:`, result.error.message);
      lastError = new OpenRouterError(`Model ${attempt.model} returned data that failed validation.`, "parse_failed");
    } catch (err) {
      lastError = err;
      console.warn(`[ai] ${attempt.provider}/${attempt.model} failed:`, err instanceof Error ? err.message : err);
      if (err instanceof OpenRouterError && err.code === "rate_limited") continue;
    }
  }

  if (lastError instanceof Error) throw lastError;
  throw new OpenRouterError("All AI models failed to produce a valid audit within the time budget.", "upstream");
}
