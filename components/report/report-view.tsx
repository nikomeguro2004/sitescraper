"use client";

import { motion } from "framer-motion";
import { ReportHeader } from "@/components/report/report-header";
import { ScoreRadar } from "@/components/report/score-radar";
import { AuditSections } from "@/components/report/audit-sections";
import { ArrowRight, Sparkles } from "lucide-react";
import type { AuditReport } from "@/lib/types/audit";
import { hexToHSL } from "@/lib/utils/color";

export function ReportView({ report, onNewAnalysis }: { report: AuditReport; onNewAnalysis: () => void }) {
  const customPrimaryHsl = report.themeColor ? hexToHSL(report.themeColor) : null;

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.15 } }
      }}
      className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-24"
      style={customPrimaryHsl ? { "--primary": customPrimaryHsl } as React.CSSProperties : undefined}
    >
      <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring", damping: 25, stiffness: 120 } } }}>
        <ReportHeader report={report} onNewAnalysis={onNewAnalysis} />
      </motion.div>

      <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring", damping: 25, stiffness: 120 } } }}>
        <div className="flex flex-col items-center gap-5 rounded-3xl border border-border/40 bg-card/80 backdrop-blur-md shadow-sm p-8">
          <h2 className="text-xl font-bold tracking-tight text-foreground/90">Performance Radar</h2>
          <div className="w-full max-w-2xl">
            <ScoreRadar scores={report.categoryScores} />
          </div>
        </div>
      </motion.div>

      <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring", damping: 25, stiffness: 120 } } }}>
        <h2 className="mb-3 px-1 text-sm font-semibold text-muted-foreground">Full Audit</h2>
        <AuditSections report={report} />
      </motion.div>

      <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring", damping: 25, stiffness: 120, delay: 0.2 } } }}>
        <div className="mt-8 flex flex-col items-center text-center gap-6 rounded-3xl border border-primary/20 bg-primary/5 p-12 relative overflow-hidden backdrop-blur-md shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-60" />
          <div className="relative z-10 flex flex-col items-center gap-4 max-w-2xl">
            <div className="inline-flex items-center justify-center rounded-full bg-primary/20 p-3 mb-2">
              <Sparkles className="size-6 text-primary" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Ready to make this a 10/10?
            </h2>
            <p className="text-lg text-muted-foreground mb-4">
              Stop leaving money on the table. We can help you fix these exact issues and transform your site into a premium, high-converting asset.
            </p>
            <button
              onClick={() => window.open("#", "_blank")}
              className="mt-4 inline-flex h-12 cursor-pointer items-center justify-center rounded-full bg-foreground px-8 text-sm font-bold text-background shadow-xl transition-all hover:scale-105 hover:bg-foreground/90 gap-2"
            >
              Let&apos;s talk about your site
              <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
