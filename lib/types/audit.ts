export const SCORE_CATEGORIES = [
  "trustCredibility",
  "salesConversionReadiness",
  "enterpriseReadiness",
  "visualBranding",
  "visualStorytelling",
  "brandDifferentiation",
  "businessValueCommunication",
] as const;

export type ScoreCategory = (typeof SCORE_CATEGORIES)[number];

export type ScoreRating = "LOW" | "MEDIUM" | "GOOD" | "EXCELLENT";
export type BusinessStatus = "Excellent" | "Good" | "Needs Work" | "Critical";
export type BusinessGrade = "A+" | "A" | "B+" | "B" | "C+" | "C" | "D" | "F";

export const SCORE_CATEGORY_LABELS: Record<ScoreCategory, string> = {
  trustCredibility: "Trust & Credibility",
  salesConversionReadiness: "Sales Conversion Readiness",
  enterpriseReadiness: "Enterprise Readiness",
  visualBranding: "Visual Branding & Premium Feel",
  visualStorytelling: "Visual Storytelling & Design",
  brandDifferentiation: "Brand Differentiation",
  businessValueCommunication: "Business Value Communication",
};



export interface Finding {
  title: string;
  detail: string;
  severity: "low" | "medium" | "high" | "critical";
}

export interface Recommendation {
  title: string;
  detail: string;
  impact: "low" | "medium" | "high";
  effort: "low" | "medium" | "high";
}

export interface ParameterSection {
  score: number;
  businessStatus: BusinessStatus;
  points: string[];
  conclusion: string;
}

export interface WhatWeDo {
  problems: string[];
  solutions: string[];
}

export interface BusinessConclusion {
  points: string[];
  currentPositioning: string;
  premiumFuturePositioning: string;
}

export interface AuditReport {
  id: string;
  websiteName: string;
  url: string;
  screenshot: string;
  themeColor: string | null;
  overallScore: number;
  scoreRating: ScoreRating;
  projectedImprovedScore: number;
  businessGrade: BusinessGrade;
  categoryScores: Record<ScoreCategory, number>;
  trustCredibility: ParameterSection;
  salesConversionReadiness: ParameterSection;
  enterpriseReadiness: ParameterSection;
  visualBranding: ParameterSection;
  visualStorytelling: ParameterSection;
  brandDifferentiation: ParameterSection;
  businessValueCommunication: ParameterSection;
  whatWeDo: WhatWeDo;
  businessConclusion: BusinessConclusion;
  createdAt: string;
}

/** Deterministically extracted facts — ground truth the AI must not contradict. */
export interface SiteSignals {
  emails: string[];
  phones: string[];
  socialLinks: string[];
  hasPrivacyPolicy: boolean;
  hasTermsOfService: boolean;
  copyrightYear: string | null;
  hasFavicon: boolean;
  hasOgImage: boolean;
  hasCanonical: boolean;
  hasViewportMeta: boolean;
  titleLength: number;
  metaDescriptionLength: number;
  h1Count: number;
  imgCount: number;
  imgMissingAlt: number;
  complianceMentions: string[];
}

export interface SubPageData {
  url: string;
  path: string;
  title: string;
  headings: { level: number; text: string }[];
  buttons: string[];
  formsCount: number;
  hasPricingSection: boolean;
  pricingText: string[];
  hasTestimonials: boolean;
  testimonialText: string[];
  content: string;
  wordCount: number;
}

export interface ScrapedPageData {
  url: string;
  finalUrl: string;
  title: string;
  metaDescription: string;
  siteName: string;
  screenshot: string;
  themeColor: string | null;
  headings: { level: number; text: string }[];
  navLinks: string[];
  buttons: string[];
  formsCount: number;
  content: string;
  formFields: string[];
  hasPricingSection: boolean;
  pricingText: string[];
  hasTestimonials: boolean;
  testimonialText: string[];
  heroText: string;
  wordCount: number;
  techStack: string[];
  subPages: SubPageData[];
  signals: SiteSignals;
  /** Above-the-fold screenshot for the vision pass (smaller than the full-page shot). */
  viewportScreenshot: string;
}

export const STAGE_LABELS = [
  "Connecting to website",
  "Capturing screenshots",
  "Extracting content",
  "Evaluating branding",
  "Evaluating trust",
  "Evaluating UX",
  "Evaluating conversion flow",
  "Generating report",
] as const;

export type StageIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface AnalyzeStreamEvent {
  type: "stage" | "scraped" | "done" | "error";
  stage?: StageIndex;
  data?: ScrapedPageData;
  message?: string;
  report?: AuditReport;
}
