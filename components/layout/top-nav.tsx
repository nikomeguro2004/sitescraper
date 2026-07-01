"use client";
import { useAnalysisStore } from "@/lib/store/analysis-store";

export function TopNav() {
  const reset = useAnalysisStore((s) => s.reset);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <button onClick={reset} className="flex items-center gap-2">
          <span className="text-sm font-semibold tracking-tight">SiteElevate</span>
        </button>
      </div>
    </header>
  );
}
