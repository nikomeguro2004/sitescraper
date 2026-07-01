import type { AnalyzeStreamEvent } from "@/lib/types/audit";

export async function runAnalysis(
  url: string,
  handlers: {
    onStage: (stage: AnalyzeStreamEvent["stage"] & number) => void;
    onDone: (report: NonNullable<AnalyzeStreamEvent["report"]>) => void;
    onError: (message: string) => void;
  },
  signal?: AbortSignal,
) {
  let res: Response;
  try {
    res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
      signal,
    });
  } catch {
    handlers.onError("Couldn't reach the server. Check your connection and try again.");
    return;
  }

  if (!res.ok || !res.body) {
    handlers.onError("Couldn't start the analysis. Please try again.");
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() ?? "";

    for (const chunk of chunks) {
      const line = chunk.split("\n").find((l) => l.startsWith("data: "));
      if (!line) continue;
      const payload = line.slice("data: ".length);
      let event: AnalyzeStreamEvent;
      try {
        event = JSON.parse(payload);
      } catch {
        continue;
      }

      if (event.type === "stage" && typeof event.stage === "number") handlers.onStage(event.stage);
      else if (event.type === "done" && event.report) handlers.onDone(event.report);
      else if (event.type === "error") handlers.onError(event.message || "Something went wrong.");
    }
  }
}
