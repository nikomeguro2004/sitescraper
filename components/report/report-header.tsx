"use client";

import Image from "next/image";
import { ExternalLink, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScoreRing } from "@/components/report/score-ring";
import { PdfExportButton } from "@/components/report/pdf-export-button";
import type { AuditReport } from "@/lib/types/audit";
import { gradeColor } from "@/lib/utils/grade";

export function ReportHeader({ report, onNewAnalysis }: { report: AuditReport; onNewAnalysis: () => void }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-border/40 bg-card/80 backdrop-blur-md shadow-sm">
      <div className="relative h-72 w-full border-b border-border/40 bg-muted/50 sm:h-96">
        <Image src={report.screenshot} alt={report.websiteName} fill className="object-cover object-top" unoptimized priority />
      </div>

      <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-5">
          <ScoreRing score={report.overallScore} />
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2">
              <h1 className="truncate text-xl font-semibold tracking-tight">{report.websiteName}</h1>
              <Badge variant="outline" className={`border-current/30 ${gradeColor(report.businessGrade)}`}>
                Grade {report.businessGrade}
              </Badge>
            </div>
            <a
              href={report.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 truncate text-sm text-muted-foreground hover:text-foreground"
            >
              {report.url}
              <ExternalLink className="size-3" />
            </a>
            <p className="mt-1 text-xs capitalize text-muted-foreground">
              Consulting Audit · {new Date(report.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={onNewAnalysis}>
            <RotateCcw className="size-3.5" />
            New Analysis
          </Button>
          <PdfExportButton report={report} />
        </div>
      </div>
    </div>
  );
}
