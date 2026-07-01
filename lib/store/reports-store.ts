import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuditReport } from "@/lib/types/audit";

const MAX_REPORTS = 30;

interface ReportsState {
  reports: AuditReport[];
  addReport: (report: AuditReport) => void;
  removeReport: (id: string) => void;
  getReport: (id: string) => AuditReport | undefined;
  clearAll: () => void;
}

export const useReportsStore = create<ReportsState>()(
  persist(
    (set, get) => ({
      reports: [],
      addReport: (report) =>
        set((state) => ({
          reports: [report, ...state.reports.filter((r) => r.id !== report.id)].slice(0, MAX_REPORTS),
        })),
      removeReport: (id) => set((state) => ({ reports: state.reports.filter((r) => r.id !== id) })),
      getReport: (id) => get().reports.find((r) => r.id === id),
      clearAll: () => set({ reports: [] }),
    }),
    {
      name: "roastmysite-reports",
      partialize: (state) => ({
        ...state,
        reports: state.reports.map((r) => ({ ...r, screenshot: "" })),
      }),
    },
  ),
);
