"use client";

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { SCORE_CATEGORIES, SCORE_CATEGORY_LABELS, type ScoreCategory } from "@/lib/types/audit";

const SHORT_LABELS: Record<ScoreCategory, string> = {
  trustCredibility: "Trust",
  salesConversionReadiness: "Conversion",
  enterpriseReadiness: "Enterprise",
  visualBranding: "Branding",
  visualStorytelling: "Storytelling",
  brandDifferentiation: "Differentiation",
  businessValueCommunication: "Value Comm.",
};

export function ScoreRadar({ scores }: { scores: Record<ScoreCategory, number> }) {
  const data = SCORE_CATEGORIES.map((key) => ({
    category: SHORT_LABELS[key],
    fullLabel: SCORE_CATEGORY_LABELS[key],
    score: scores[key],
  }));

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis
            dataKey="category"
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            className="select-none"
          />
          <PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} tickCount={5} />
          <Radar
            dataKey="score"
            stroke="var(--foreground)"
            fill="var(--foreground)"
            fillOpacity={0.18}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
