"use client";

import * as React from "react";
import Image from "next/image";
import { History, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useReportsStore } from "@/lib/store/reports-store";
import { useAnalysisStore } from "@/lib/store/analysis-store";
import { gradeColor } from "@/lib/utils/grade";

export function HistoryPanel() {
  const [open, setOpen] = React.useState(false);
  const reports = useReportsStore((s) => s.reports);
  const removeReport = useReportsStore((s) => s.removeReport);
  const openReport = useAnalysisStore((s) => s.openReport);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground" />}
      >
        <History className="size-4" />
        <span className="hidden sm:inline">History</span>
        {reports.length > 0 && (
          <Badge variant="secondary" className="ml-0.5 h-5 px-1.5 text-[11px]">
            {reports.length}
          </Badge>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md p-0">
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle>Report History</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-64px)]">
          {reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 px-6 py-20 text-center text-sm text-muted-foreground">
              <History className="size-8 opacity-40" />
              No reports yet. Analyze a site to get started.
            </div>
          ) : (
            <div className="flex flex-col divide-y">
              {reports.map((r) => (
                <div key={r.id} className="group flex items-center gap-3 px-5 py-3 hover:bg-accent/50">
                  <div className="relative size-11 shrink-0 overflow-hidden rounded-md border bg-muted">
                    <Image src={r.screenshot} alt={r.websiteName} fill className="object-cover object-top" unoptimized />
                  </div>
                  <button
                    className="flex min-w-0 flex-1 flex-col items-start text-left"
                    onClick={() => {
                      openReport(r);
                      setOpen(false);
                    }}
                  >
                    <span className="w-full truncate text-sm font-medium">{r.websiteName}</span>
                    <span className="w-full truncate text-xs text-muted-foreground">{r.url}</span>
                  </button>
                  <span className={`text-sm font-semibold tabular-nums ${gradeColor(r.businessGrade)}`}>
                    {r.businessGrade}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0 opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeReport(r.id);
                    }}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 text-muted-foreground opacity-0 hover:text-foreground group-hover:opacity-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="size-3.5" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
