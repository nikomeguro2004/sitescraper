"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ErrorView({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-4 py-20 text-center">
      <div className="flex size-12 items-center justify-center rounded-full border border-destructive/30 bg-destructive/10 text-destructive">
        <AlertTriangle className="size-5" />
      </div>
      <div>
        <p className="text-base font-medium">Analysis failed</p>
        <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      </div>
      <Button variant="outline" size="sm" className="gap-2" onClick={onRetry}>
        <RotateCcw className="size-3.5" />
        Try again
      </Button>
    </div>
  );
}
