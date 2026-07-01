"use client";

import { motion } from "framer-motion";
import { ReportHeader } from "@/components/report/report-header";
import { ScoreRadar } from "@/components/report/score-radar";
import { ScoreCards } from "@/components/report/score-cards";
import { AuditSections } from "@/components/report/audit-sections";
import type { AuditReport } from "@/lib/types/audit";

export function ReportView({ report, onNewAnalysis }: { report: AuditReport; onNewAnalysis: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto flex w-full max-w-4xl flex-col gap-6 pb-24"
    >
      <ReportHeader report={report} onNewAnalysis={onNewAnalysis} />

      <div className="grid grid-cols-1 gap-4 rounded-2xl border border-border/60 bg-card/40 p-5 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Score Breakdown</h2>
          <ScoreRadar scores={report.categoryScores} />
        </div>
        <div className="flex flex-col justify-center">
          <ScoreCards scores={report.categoryScores} />
        </div>
      </div>

      <div>
        <h2 className="mb-3 px-1 text-sm font-semibold text-muted-foreground">Full Audit</h2>
        <AuditSections report={report} />
      </div>
    </motion.div>
  );
}
