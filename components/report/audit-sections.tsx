"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, TrendingUp, XCircle } from "lucide-react";
import type { AuditReport, ParameterSection } from "@/lib/types/audit";
import { cn } from "@/lib/utils";
import { deriveBusinessStatus } from "@/lib/utils/grade";

function StatusBadge({ status }: { status: ParameterSection["businessStatus"] }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-6 px-2.5 text-xs font-bold uppercase tracking-wider",
        status === "Excellent" && "border-emerald-500/40 text-emerald-400 bg-emerald-500/10",
        status === "Good" && "border-blue-500/40 text-blue-400 bg-blue-500/10",
        status === "Needs Work" && "border-amber-500/40 text-amber-400 bg-amber-500/10",
        status === "Critical" && "border-red-500/40 text-red-400 bg-red-500/10"
      )}
    >
      {status}
    </Badge>
  );
}

function SectionCard({ title, section, delay }: { title: string; section: ParameterSection; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className="flex flex-col gap-4 rounded-2xl border border-border/40 bg-card/40 p-6 shadow-sm backdrop-blur-sm"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
        <div className="flex items-center gap-3">
          <StatusBadge status={deriveBusinessStatus(section.score)} />
          <span className="text-xl font-black tabular-nums tracking-tighter text-foreground">{section.score}<span className="text-muted-foreground text-sm font-medium">/10</span></span>
        </div>
      </div>
      
      <div className="flex flex-col gap-4">
        <ul className="flex flex-col gap-3">
          {section.points.map((p, i) => (
            <li key={i} className="flex gap-3 text-sm/relaxed">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary/40 shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
              <span className="text-foreground/90">{p}</span>
            </li>
          ))}
        </ul>
        <div className="rounded-xl bg-background/50 border border-border/50 p-4 mt-2">
          <p className="text-sm/relaxed text-muted-foreground"><span className="font-semibold text-foreground">Conclusion:</span> {section.conclusion}</p>
        </div>
      </div>
    </motion.div>
  );
}

export function AuditSections({ report }: { report: AuditReport }) {
  const parameters = [
    { key: "trust", label: "Trust & Credibility", data: report.trustCredibility },
    { key: "conversion", label: "Sales Conversion Readiness", data: report.salesConversionReadiness },
    { key: "enterprise", label: "Enterprise Readiness", data: report.enterpriseReadiness },
    { key: "branding", label: "Visual Branding & Premium Feel", data: report.visualBranding },
    { key: "storytelling", label: "Visual Storytelling & Design", data: report.visualStorytelling },
    { key: "differentiation", label: "Brand Differentiation", data: report.brandDifferentiation },
    { key: "value-comm", label: "Business Value Communication", data: report.businessValueCommunication },
  ];

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Parameters Summary Table */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="rounded-2xl border border-border/40 bg-card/40 p-6 shadow-sm backdrop-blur-sm overflow-hidden"
      >
        <h3 className="text-lg font-semibold tracking-tight mb-4">7 Core Business Parameters</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-background/50 border-b border-border/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium rounded-tl-lg">Parameter</th>
                <th className="px-4 py-3 font-medium text-center">Best Score</th>
                <th className="px-4 py-3 font-medium text-center">Your Score</th>
                <th className="px-4 py-3 font-medium rounded-tr-lg">Business Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {parameters.map((p) => (
                <tr key={p.key} className="hover:bg-foreground/[0.02] transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{p.label}</td>
                  <td className="px-4 py-3 text-center text-muted-foreground">10.0</td>
                  <td className="px-4 py-3 text-center font-bold tabular-nums">{p.data.score.toFixed(1)}</td>
                  <td className="px-4 py-3"><StatusBadge status={deriveBusinessStatus(p.data.score)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      <div className="flex flex-col gap-6">
        {parameters.map((section, index) => (
          <SectionCard key={section.key} title={section.label} delay={0.2 + (index * 0.1)} section={section.data} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }} className="flex flex-col overflow-hidden rounded-2xl border border-destructive/20 bg-destructive/5 shadow-sm">
          <div className="bg-destructive/10 px-6 py-4 border-b border-destructive/10 flex items-center gap-3">
            <XCircle className="size-5 text-destructive" />
            <h3 className="text-lg font-bold tracking-tight text-destructive">What Is Broken (Problems)</h3>
          </div>
          <ul className="flex flex-col gap-4 p-6">
            {report.whatWeDo.problems.map((p, i) => (
              <li key={i} className="flex gap-3 text-sm/relaxed">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-destructive/60" />
                <span className="text-foreground/90 font-medium">{p}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }} className="flex flex-col overflow-hidden rounded-2xl border border-primary/20 bg-primary/5 shadow-sm relative">
          <div className="absolute top-0 right-0 p-32 bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
          <div className="bg-primary/10 px-6 py-4 border-b border-primary/10 flex items-center gap-3 relative z-10">
            <CheckCircle2 className="size-5 text-primary" />
            <h3 className="text-lg font-bold tracking-tight text-primary">What We Do (Solutions)</h3>
          </div>
          <ul className="flex flex-col gap-4 p-6 relative z-10">
            {report.whatWeDo.solutions.map((p, i) => (
              <li key={i} className="flex gap-3 text-sm/relaxed">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary/60" />
                <span className="text-foreground/90 font-medium">{p}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }} className="flex flex-col gap-8 rounded-3xl border border-border/60 bg-card p-6 sm:p-10 shadow-lg mt-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-border/50 pb-8 relative z-10">
          <div>
            <h3 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">Final Verdict</h3>
            <p className="text-muted-foreground mt-2 font-medium">Based on investor-grade analysis</p>
          </div>
          <div className="flex items-center gap-8 md:gap-12">
            <div className="flex flex-col items-center">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2 font-semibold">Current Score</p>
              <div className="flex items-center gap-3">
                <span className="text-4xl sm:text-5xl font-black tabular-nums">{report.overallScore}</span>
                <Badge variant="outline" className="bg-background text-xs px-2 py-1">{report.scoreRating}</Badge>
              </div>
            </div>
            <div className="w-px h-16 bg-border/50 hidden sm:block" />
            <div className="flex flex-col items-center">
              <p className="text-xs uppercase tracking-widest text-primary mb-2 font-semibold flex items-center gap-1.5">
                <TrendingUp className="size-3.5" />
                Projected Potential
              </p>
              <span className="text-4xl sm:text-5xl font-black tabular-nums text-primary">{report.projectedImprovedScore}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
          <div className="flex flex-col gap-5">
            <h4 className="text-lg font-bold">Business Conclusion</h4>
            <ul className="flex flex-col gap-4 bg-muted/30 p-5 rounded-2xl border border-border/40">
              {report.businessConclusion.points.map((p, i) => (
                <li key={i} className="flex gap-3 text-sm/relaxed">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary/50" />
                  <span className="text-foreground/90 font-medium">{p}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-5 justify-center">
            <div className="rounded-2xl bg-background/50 border border-border/50 p-6 shadow-sm">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3 font-bold flex items-center gap-2">
                <AlertTriangle className="size-4 text-amber-500" />
                Currently behaves like
              </p>
              <p className="text-base font-medium italic text-foreground/80 leading-relaxed">"{report.businessConclusion.currentPositioning}"</p>
            </div>
            <div className="rounded-2xl bg-primary/10 border border-primary/20 p-6 shadow-md relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent" />
              <p className="text-xs uppercase tracking-widest text-primary mb-3 font-bold relative z-10 flex items-center gap-2">
                <CheckCircle2 className="size-4" />
                Future Positioning
              </p>
              <p className="text-base sm:text-lg font-semibold italic text-foreground relative z-10 leading-relaxed">"{report.businessConclusion.premiumFuturePositioning}"</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
