import { z } from "zod";
import { SCORE_CATEGORIES } from "@/lib/types/audit";

const parameterSectionSchema = z.object({
  score: z.number().min(0).max(10),
  businessStatus: z.enum(["Excellent", "Good", "Needs Work", "Critical"]),
  points: z.array(z.string()).min(3).max(6),
  conclusion: z.string().min(1),
});

const whatWeDoSchema = z.object({
  problems: z.array(z.string()).min(3).max(6),
  solutions: z.array(z.string()).min(3).max(6),
});

const businessConclusionSchema = z.object({
  points: z.array(z.string()).min(3).max(6),
  currentPositioning: z.string().min(1),
  premiumFuturePositioning: z.string().min(1),
});

const categoryScoresSchema = z.object(
  Object.fromEntries(SCORE_CATEGORIES.map((key) => [key, z.number().min(0).max(10)])) as Record<
    (typeof SCORE_CATEGORIES)[number],
    z.ZodNumber
  >,
);

export const aiAuditSchema = z.object({
  websiteName: z.string().min(1),
  overallScore: z.number().min(0).max(10),
  scoreRating: z.enum(["LOW", "MEDIUM", "GOOD", "EXCELLENT"]),
  projectedImprovedScore: z.number().min(0).max(10),
  businessGrade: z.enum(["A+", "A", "B+", "B", "C+", "C", "D", "F"]),
  categoryScores: categoryScoresSchema,
  trustCredibility: parameterSectionSchema,
  salesConversionReadiness: parameterSectionSchema,
  enterpriseReadiness: parameterSectionSchema,
  visualBranding: parameterSectionSchema,
  visualStorytelling: parameterSectionSchema,
  brandDifferentiation: parameterSectionSchema,
  businessValueCommunication: parameterSectionSchema,
  whatWeDo: whatWeDoSchema,
  businessConclusion: businessConclusionSchema,
});

export type AiAuditOutput = z.infer<typeof aiAuditSchema>;

export const AI_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    websiteName: { type: "string" },
    overallScore: { type: "number" },
    scoreRating: { type: "string", enum: ["LOW", "MEDIUM", "GOOD", "EXCELLENT"] },
    projectedImprovedScore: { type: "number" },
    businessGrade: { type: "string", enum: ["A+", "A", "B+", "B", "C+", "C", "D", "F"] },
    categoryScores: {
      type: "object",
      additionalProperties: false,
      properties: Object.fromEntries(SCORE_CATEGORIES.map((key) => [key, { type: "number" }])),
      required: [...SCORE_CATEGORIES],
    },
    trustCredibility: { $ref: "#/$defs/parameterSection" },
    salesConversionReadiness: { $ref: "#/$defs/parameterSection" },
    enterpriseReadiness: { $ref: "#/$defs/parameterSection" },
    visualBranding: { $ref: "#/$defs/parameterSection" },
    visualStorytelling: { $ref: "#/$defs/parameterSection" },
    brandDifferentiation: { $ref: "#/$defs/parameterSection" },
    businessValueCommunication: { $ref: "#/$defs/parameterSection" },
    whatWeDo: {
      type: "object",
      properties: {
        problems: { type: "array", items: { type: "string" } },
        solutions: { type: "array", items: { type: "string" } },
      },
      required: ["problems", "solutions"],
    },
    businessConclusion: {
      type: "object",
      properties: {
        points: { type: "array", items: { type: "string" } },
        currentPositioning: { type: "string" },
        premiumFuturePositioning: { type: "string" },
      },
      required: ["points", "currentPositioning", "premiumFuturePositioning"],
    },
  },
  $defs: {
    parameterSection: {
      type: "object",
      properties: {
        score: { type: "number" },
        businessStatus: { type: "string", enum: ["Excellent", "Good", "Needs Work", "Critical"] },
        points: { type: "array", items: { type: "string" } },
        conclusion: { type: "string" },
      },
      required: ["score", "businessStatus", "points", "conclusion"],
    },
  },
  required: [
    "websiteName",
    "overallScore",
    "scoreRating",
    "projectedImprovedScore",
    "businessGrade",
    "categoryScores",
    "trustCredibility",
    "salesConversionReadiness",
    "enterpriseReadiness",
    "visualBranding",
    "visualStorytelling",
    "brandDifferentiation",
    "businessValueCommunication",
    "whatWeDo",
    "businessConclusion",
  ],
} as const;
