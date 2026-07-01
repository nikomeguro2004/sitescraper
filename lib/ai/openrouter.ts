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

async function callModel(model: string, system: string, user: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new OpenRouterError("GROQ_API_KEY is not configured.", "missing_key");

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system + "\n\nCRITICAL: You must output JSON matching this EXACT schema:\n" + JSON.stringify(AI_JSON_SCHEMA) },
        { role: "user", content: user },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    }),
    signal: AbortSignal.timeout(45000),
  }).catch((err) => {
    if (err instanceof Error && (err.name === 'TimeoutError' || err.message.includes('timeout'))) {
      throw new OpenRouterError("The operation was aborted due to timeout", "upstream");
    }
    throw new OpenRouterError("Could not reach Groq.", "upstream");
  });

  if (!res.ok) {
    if (res.status === 429) throw new OpenRouterError("Rate limited by the AI provider.", "rate_limited");
    const body = await res.text().catch(() => "");
    throw new OpenRouterError(`Groq request failed (${res.status}): ${body.slice(0, 300)}`, "upstream");
  }

  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new OpenRouterError("Empty response from AI model.", "upstream");
  }
  return content;
}

export async function generateAudit(data: ScrapedPageData): Promise<AiAuditOutput> {
  const system = buildSystemPrompt();
  const user = buildUserPrompt(data);
  const models = candidateModels();

  let lastError: unknown;

  for (const model of models) {
    try {
      const raw = await callModel(model, system, user);
      console.log(`[groq] Raw output from ${model}:\n`, raw);
      const parsed = extractJson(raw);
      const result = aiAuditSchema.safeParse(parsed);
      if (result.success) return result.data;
      console.warn(`[groq] ${model} validation error:`, result.error);
      throw new OpenRouterError(`Model ${model} returned data that failed validation.`, "parse_failed");
    } catch (err) {
      lastError = err;
      console.warn(`[groq] ${model} failed:`, err instanceof Error ? err.message : err);
      if (err instanceof OpenRouterError && err.code === "missing_key") throw err;
    }
  }
  if (lastError instanceof Error) throw lastError;
  throw new OpenRouterError("All AI models failed to produce a valid audit.", "upstream");
}
