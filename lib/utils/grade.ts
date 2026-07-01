import type { BusinessGrade, BusinessStatus } from "@/lib/types/audit";

export function gradeColor(grade: BusinessGrade): string {
  if (grade === "A+" || grade === "A") return "text-emerald-400";
  if (grade === "B+" || grade === "B") return "text-lime-400";
  if (grade === "C+" || grade === "C") return "text-amber-400";
  if (grade === "D") return "text-orange-400";
  return "text-red-400";
}

export function scoreColor(score: number): string {
  if (score >= 8.5) return "text-emerald-400";
  if (score >= 7.0) return "text-lime-400";
  if (score >= 5.0) return "text-amber-400";
  if (score >= 3.0) return "text-orange-400";
  return "text-red-400";
}

export function scoreBarColor(score: number): string {
  if (score >= 8.5) return "bg-emerald-500";
  if (score >= 7.0) return "bg-lime-500";
  if (score >= 5.0) return "bg-amber-500";
  if (score >= 3.0) return "bg-orange-500";
  return "bg-red-500";
}

export function severityColor(severity: "low" | "medium" | "high" | "critical"): string {
  switch (severity) {
    case "critical":
      return "border-red-500/30 bg-red-500/10 text-red-400";
    case "high":
      return "border-orange-500/30 bg-orange-500/10 text-orange-400";
    case "medium":
      return "border-amber-500/30 bg-amber-500/10 text-amber-400";
    default:
      return "border-blue-500/30 bg-blue-500/10 text-blue-400";
  }
}

export function deriveBusinessStatus(score: number): BusinessStatus {
  if (score >= 8.5) return "Excellent";
  if (score >= 6.5) return "Good";
  if (score >= 4.0) return "Needs Work";
  return "Critical";
}
