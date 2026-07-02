import type { AnalyzeStreamEvent, ScrapedPageData } from "@/lib/types/audit";

export async function runAnalysis(
  url: string,
  handlers: {
    onStage: (stage: AnalyzeStreamEvent["stage"] & number) => void;
    onDone: (report: NonNullable<AnalyzeStreamEvent["report"]>) => void;
    onError: (message: string) => void;
  },
  signal?: AbortSignal,
) {
  let attempt = 0;
  const maxRetries = 3;
  let cachedScrapedData: ScrapedPageData | undefined;

  while (attempt <= maxRetries) {
    attempt++;
    if (signal?.aborted) return;

    let res: Response;
    try {
      res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, scrapedData: cachedScrapedData }),
        signal,
      });
    } catch {
      if (attempt > maxRetries) {
        handlers.onError("Couldn't reach the server. Check your connection and try again.");
      }
      await new Promise(r => setTimeout(r, 2000));
      continue;
    }

    if (!res.ok || !res.body) {
      if (attempt > maxRetries) {
        handlers.onError("Couldn't start the analysis. Please try again.");
      }
      await new Promise(r => setTimeout(r, 2000));
      continue;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let streamFailed = false;
    let streamEnded = false;

    while (true) {
      let readResult;
      try {
        readResult = await reader.read();
      } catch {
        streamFailed = true;
        break;
      }
      
      const { value, done } = readResult;
      if (done) {
        streamEnded = true;
        break;
      }
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

        if (event.type === "scraped" && event.data) {
          cachedScrapedData = event.data;
        } else if (event.type === "stage" && typeof event.stage === "number") {
          handlers.onStage(event.stage);
        } else if (event.type === "done" && event.report) {
          handlers.onDone(event.report);
          return; // Fully successful!
        } else if (event.type === "error") {
          streamFailed = true;
          break;
        }
      }
      if (streamFailed) break;
    }

    if (streamFailed || (!streamEnded && !signal?.aborted)) {
      if (attempt > maxRetries) {
        handlers.onError("Analysis failed or connection dropped after multiple attempts.");
        return;
      }
      // If we failed but have retries left, loop continues and retries
      await new Promise(r => setTimeout(r, 2000));
    } else {
      // If stream ended normally but without 'done', it's an anomaly. Retry if possible.
      if (attempt > maxRetries) return;
    }
  }
}
