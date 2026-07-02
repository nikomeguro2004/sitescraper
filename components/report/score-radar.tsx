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
    <div className="h-[480px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="75%" margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
          <PolarGrid stroke="var(--border)" strokeOpacity={0.6} />
          <PolarAngleAxis
            dataKey="category"
            tick={{ fill: "var(--foreground)", fontSize: 13, fontWeight: 500 }}
            className="select-none"
          />
          <PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} tickCount={5} />
          <Radar
            dataKey="score"
            stroke="var(--primary)"
            fill="var(--primary)"
            fillOpacity={0.25}
            strokeWidth={3}
            dot={{ r: 4, fill: "var(--primary)", strokeWidth: 0 }}
            activeDot={{ r: 6, fill: "var(--primary)", strokeWidth: 0 }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
