import { create } from "zustand";
import type { AuditReport, StageIndex } from "@/lib/types/audit";

export type AnalysisView = "idle" | "loading" | "report" | "error";

interface AnalysisState {
  view: AnalysisView;
  stage: StageIndex;
  url: string;
  report: AuditReport | null;
  error: string | null;
  start: (url: string) => void;
  setStage: (stage: StageIndex) => void;
  finish: (report: AuditReport) => void;
  fail: (message: string) => void;
  reset: () => void;
  openReport: (report: AuditReport) => void;
}

export const useAnalysisStore = create<AnalysisState>()((set) => ({
  view: "idle",
  stage: 0,
  url: "",
  report: null,
  error: null,
  start: (url) => set({ view: "loading", stage: 0, url, report: null, error: null }),
  setStage: (stage) => set({ stage }),
  finish: (report) => set({ view: "report", report }),
  fail: (message) => set({ view: "error", error: message }),
  reset: () => set({ view: "idle", stage: 0, report: null, error: null }),
  openReport: (report) => set({ view: "report", report, error: null }),
}));
