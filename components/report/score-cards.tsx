"use client";

import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { SCORE_CATEGORIES, SCORE_CATEGORY_LABELS, type ScoreCategory } from "@/lib/types/audit";
import { scoreColor } from "@/lib/utils/grade";

export function ScoreCards({ scores }: { scores: Record<ScoreCategory, number> }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {SCORE_CATEGORIES.map((key, i) => (
        <motion.div
          key={key}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.04 }}
          className="rounded-xl border border-border/60 bg-card/40 p-4"
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium">{SCORE_CATEGORY_LABELS[key]}</span>
            <span className={`text-sm font-semibold tabular-nums ${scoreColor(scores[key])}`}>{scores[key]}</span>
          </div>
          <Progress value={scores[key] * 10} className="h-1.5" />
        </motion.div>
      ))}
    </div>
  );
}
