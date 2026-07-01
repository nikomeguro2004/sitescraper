"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UrlForm } from "@/components/analyze/url-form";
import { LoadingScreen } from "@/components/analyze/loading-screen";
import { ErrorView } from "@/components/analyze/error-view";
import { ReportView } from "@/components/report/report-view";
import { useAnalysisStore } from "@/lib/store/analysis-store";
import { useReportsStore } from "@/lib/store/reports-store";
import { runAnalysis } from "@/lib/utils/analyze-client";
import { type AuditReport } from "@/lib/types/audit";

export default function Home() {
  const { view, stage, url, report, error, start, setStage, finish, fail, reset } = useAnalysisStore();
  const addReport = useReportsStore((s) => s.addReport);
  const abortRef = React.useRef<AbortController | null>(null);

  const handleAnalyze = React.useCallback(
    (targetUrl: string) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      start(targetUrl);

      runAnalysis(
        targetUrl,
        {
          onStage: (s) => setStage(s as never),
          onDone: (r) => {
            finish(r);
            addReport(r);
          },
          onError: (message) => fail(message),
        },
        controller.signal,
      );
    },
    [start, setStage, finish, fail, addReport],
  );

  return (
    <div className="flex min-h-svh flex-col">
      <main className="flex flex-1 flex-col items-center px-4 py-10 sm:px-6">
        <AnimatePresence mode="wait">
          {view === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex w-full flex-1 flex-col items-center justify-center gap-12 py-12 relative z-10"
            >
              <div className="absolute inset-0 -z-10 flex items-center justify-center pointer-events-none opacity-30 dark:opacity-20 blur-[100px]">
                <motion.div 
                  animate={{ scale: [1, 1.1, 1], rotate: [0, 90, 0] }} 
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="w-[600px] h-[600px] bg-primary/40 rounded-full" 
                />
              </div>
              <div className="flex flex-col items-center gap-6 text-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                  className="px-3 py-1 text-xs font-medium tracking-widest uppercase rounded-full bg-primary/10 text-primary border border-primary/20"
                >
                  AI-Powered Website Audit
                </motion.div>
                <motion.h1 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  className="max-w-3xl text-5xl font-bold tracking-tight sm:text-6xl/tight bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/70"
                >
                  Stop guessing why your visitors aren&apos;t converting.
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  className="max-w-xl text-balance text-muted-foreground sm:text-xl"
                >
                  Get an investor-level review of your website&apos;s design, branding, trust signals, and conversion flow in seconds.
                </motion.p>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                className="w-full max-w-2xl"
              >
                <UrlForm onSubmit={(url) => handleAnalyze(url)} isSubmitting={false} />
              </motion.div>
            </motion.div>
          )}

          {view === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
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
    </div>
  );
}
