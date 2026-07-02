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

const DEFAULT_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
];

function candidateModels(): string[] {
  const configured = process.env.GROQ_MODEL;
  if (!configured) return DEFAULT_MODELS;
  const list = configured
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
  return list.length ? list : DEFAULT_MODELS;
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

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callModel(model: string, system: string, user: string, provider: { type: "groq" | "openrouter"; key: string }): Promise<string> {
  const isOR = provider.type === "openrouter";
  const url = isOR ? "https://openrouter.ai/api/v1/chat/completions" : "https://api.groq.com/openai/v1/chat/completions";

  let actualModel = model;
  if (isOR) {
    if (model === "llama-3.3-70b-versatile") actualModel = "meta-llama/llama-3.3-70b-instruct";
    else if (model === "llama-3.1-8b-instant") actualModel = "meta-llama/llama-3.1-8b-instruct";
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${provider.key}`,
      "Content-Type": "application/json",
      ...(isOR ? { "HTTP-Referer": "https://sitescraper.vercel.app", "X-Title": "SiteElevate" } : {}),
    },
    body: JSON.stringify({
      model: actualModel,
      messages: [
        { role: "system", content: system + "\n\nCRITICAL: You must output JSON matching this EXACT schema:\n" + JSON.stringify(AI_JSON_SCHEMA) },
        { role: "user", content: user },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    }),
    signal: AbortSignal.timeout(60000),
  }).catch((err) => {
    if (err instanceof Error && (err.name === "TimeoutError" || err.message.includes("timeout"))) {
      throw new OpenRouterError("The operation was aborted due to timeout", "upstream");
    }
    throw new OpenRouterError(`Could not reach ${provider.type}.`, "upstream");
  });

  if (!res.ok) {
    if (res.status === 429) throw new OpenRouterError("Rate limited by the AI provider.", "rate_limited");
    const body = await res.text().catch(() => "");
    throw new OpenRouterError(`${provider.type} request failed (${res.status}): ${body.slice(0, 300)}`, "upstream");
  }

  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new OpenRouterError(`Empty response from ${provider.type} AI model.`, "upstream");
  }
  return content;
}

export async function generateAudit(data: ScrapedPageData): Promise<AiAuditOutput> {
  const system = buildSystemPrompt();
  const user = buildUserPrompt(data);
  const models = candidateModels();

  const rawKeys = [
    { type: "groq" as const, key: process.env.GROQ_API_KEY_2 },
    { type: "groq" as const, key: process.env.GROQ_API_KEY },
    { type: "openrouter" as const, key: process.env.OPENROUTER_API_KEY },
  ];
  const apiKeys = rawKeys.filter((k) => !!k.key) as { type: "groq" | "openrouter"; key: string }[];
  if (apiKeys.length === 0) throw new OpenRouterError("No AI API keys are configured.", "missing_key");

  let lastError: unknown;
  const maxRetries = 5;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    for (const model of models) {
      for (const provider of apiKeys) {
        try {
          const raw = await callModel(model, system, user, provider);
          console.log(`[ai] Raw output from ${provider.type} using ${model}:\n`, raw);
          const parsed = extractJson(raw);
          const result = aiAuditSchema.safeParse(parsed);
          if (result.success) return result.data;
          console.warn(`[ai] ${model} validation error:`, result.error);
          throw new OpenRouterError(`Model ${model} returned data that failed validation.`, "parse_failed");
        } catch (err) {
          lastError = err;
          console.warn(`[ai] ${provider.type} with ${model} failed:`, err instanceof Error ? err.message : err);
        }
      }
    }
    console.warn(`[ai] All keys and models failed on attempt ${attempt}. Sleeping for 5s before retry...`);
    if (attempt < maxRetries) await sleep(5000);
  }

  if (lastError instanceof Error) throw lastError;
  throw new OpenRouterError("All AI models and keys failed after maximum retries.", "upstream");
}
