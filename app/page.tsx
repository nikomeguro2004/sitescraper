"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UrlForm, type LeadFormData } from "@/components/analyze/url-form";
import { LoadingScreen } from "@/components/analyze/loading-screen";
import { ErrorView } from "@/components/analyze/error-view";
import { ReportView } from "@/components/report/report-view";
import { useAnalysisStore } from "@/lib/store/analysis-store";
import { useReportsStore } from "@/lib/store/reports-store";
import { runAnalysis } from "@/lib/utils/analyze-client";
import { saveLeadAndReport } from "@/lib/supabase";
import Image from "next/image";

export default function Home() {
  const { view, stage, url, report, error, start, setStage, finish, fail, reset } = useAnalysisStore();
  const addReport = useReportsStore((s) => s.addReport);
  const abortRef = React.useRef<AbortController | null>(null);
  const leadRef = React.useRef<LeadFormData | null>(null);

  const handleAnalyze = React.useCallback(
    (data: LeadFormData) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      leadRef.current = data;
      start(data.url);

      runAnalysis(
        data.url,
        {
          onStage: (s) => setStage(s as never),
          onDone: (r) => {
            finish(r);
            addReport(r);
            // Save lead details and the analysis report to Supabase
            if (leadRef.current) {
              saveLeadAndReport({
                name: leadRef.current.name,
                phone: leadRef.current.phone,
                website: leadRef.current.url,
                reportData: r as unknown as Record<string, unknown>,
              });
            }
          },
          onError: (message) => fail(message),
        },
        controller.signal,
      );
    },
    [start, setStage, finish, fail, addReport],
  );

  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground selection:bg-primary selection:text-primary-foreground font-sans relative overflow-hidden">
      
      {/* Subtle Grid Background */}
      <div className="absolute inset-0 z-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(to right, #1111110a 1px, transparent 1px), linear-gradient(to bottom, #1111110a 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      <div className="absolute inset-0 z-0 pointer-events-none bg-gradient-to-b from-transparent to-background/90"></div>

      {/* Header matching Business Walk style */}
      <header className="relative z-10 flex items-center justify-between px-8 py-8 border-b border-border/60 bg-background/50 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Image src="/logowhite.png" alt="Business Walk Logo" width={40} height={40} className="dark:invert-0 invert" />
          <span className="text-2xl font-bold tracking-tighter uppercase">Business Walk</span>
        </div>
      </header>

      {/* Marquee */}
      <div className="relative z-10 w-full overflow-hidden border-b border-border/60 bg-primary text-primary-foreground py-2 flex items-center">
        <motion.div 
          initial={{ x: 0 }}
          animate={{ x: "-50%" }}
          transition={{ ease: "linear", duration: 15, repeat: Infinity }}
          className="flex whitespace-nowrap text-sm font-bold tracking-widest uppercase gap-8"
        >
          <span>WORLD CLASS PRODUCT DESIGN</span>
          <span>•</span>
          <span>ENGINEERING DIGITAL PROSPERITY</span>
          <span>•</span>
          <span>ACCELERATE YOUR GROWTH</span>
          <span>•</span>
          <span>WORLD CLASS PRODUCT DESIGN</span>
          <span>•</span>
          <span>ENGINEERING DIGITAL PROSPERITY</span>
          <span>•</span>
          <span>ACCELERATE YOUR GROWTH</span>
          <span>•</span>
        </motion.div>
      </div>

      <main className="relative z-10 flex flex-1 flex-col items-center px-4 py-16 sm:px-8">
        <AnimatePresence mode="wait">
          {view === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 w-full max-w-7xl flex-1 items-center justify-center py-12"
            >
              {/* Left Column: Text */}
              <div className="flex flex-col items-start gap-8 mt-6">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                  className="px-4 py-1.5 text-xs font-bold tracking-widest uppercase bg-primary text-primary-foreground border border-primary"
                >
                  World Class Audit
                </motion.div>
                <motion.h1 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  className="w-full text-6xl font-bold tracking-tighter sm:text-[90px] xl:text-[110px] uppercase leading-[0.85] text-balance"
                >
                  Accelerate <br/> your digital <br/> growth.
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  className="w-full max-w-lg text-balance text-muted-foreground sm:text-xl font-medium mt-4 uppercase tracking-wider leading-relaxed"
                >
                  Enter your details to receive an investor-level review of your website&apos;s design, trust signals, and conversion flow.
                </motion.p>
              </div>

              {/* Right Column: Form */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.5, ease: "easeOut" }}
                className="w-full flex justify-center lg:justify-end"
              >
                <div className="w-full max-w-md">
                  <UrlForm onSubmit={handleAnalyze} isSubmitting={false} />
                </div>
              </motion.div>
            </motion.div>
          )}

          {view === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex w-full flex-1 items-center justify-center"
            >
              <LoadingScreen stage={stage} url={url} />
            </motion.div>
          )}

          {view === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex w-full flex-1 items-center justify-center"
            >
              <ErrorView message={error ?? "Something went wrong."} onRetry={reset} />
            </motion.div>
          )}

          {view === "report" && report && (
            <motion.div key="report" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full">
              <ReportView report={report} onNewAnalysis={reset} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="relative z-10 py-12 border-t border-border/60 text-center text-sm font-bold tracking-widest uppercase text-muted-foreground bg-background">
        © 2026 Business Walk Studio. All rights reserved.
      </footer>
    </div>
  );
}
