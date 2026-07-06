import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import type { AuditReport } from "@/lib/types/audit";
import { SCORE_CATEGORIES, SCORE_CATEGORY_LABELS } from "@/lib/types/audit";
import { deriveBusinessStatus } from "@/lib/utils/grade";

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 11, fontFamily: "Helvetica", color: "#111827", backgroundColor: "#ffffff" },
  coverPage: { padding: 0, fontFamily: "Helvetica", backgroundColor: "#0f172a", color: "#f8fafc" },
  coverInner: { flex: 1, padding: 64, justifyContent: "space-between" },
  coverEyebrow: { fontSize: 12, color: "#94a3b8", letterSpacing: 3, textTransform: "uppercase", marginBottom: 16 },
  coverTitle: { fontSize: 42, fontWeight: 700, marginBottom: 12, lineHeight: 1.1 },
  coverUrl: { fontSize: 14, color: "#64748b", marginBottom: 60 },
  coverScoreRow: { flexDirection: "row", alignItems: "baseline", gap: 8, marginTop: "auto" },
  coverScoreBig: { fontSize: 84, fontWeight: 700, color: "#ffffff" },
  coverGrade: { fontSize: 24, color: "#cbd5e1" },
  
  h1: { fontSize: 26, fontWeight: 700, marginBottom: 24, marginTop: 32, color: "#111827", borderBottomWidth: 1, borderBottomColor: "#e5e7eb", paddingBottom: 8 },
  h2: { fontSize: 16, fontWeight: 700, marginBottom: 12, marginTop: 24, color: "#1f2937" },
  h3: { fontSize: 11, fontWeight: 700, marginBottom: 6, marginTop: 12, color: "#4b5563", textTransform: "uppercase", letterSpacing: 1 },
  paragraph: { fontSize: 11, lineHeight: 1.6, color: "#4b5563", marginBottom: 12 },
  
  bullet: { flexDirection: "row", marginBottom: 8, gap: 8 },
  bulletDot: { fontSize: 11, color: "#0f172a", marginTop: 1 },
  bulletText: { fontSize: 11, lineHeight: 1.5, color: "#334155", flex: 1 },
  
  scoreRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12, borderBottomWidth: 1, borderBottomColor: "#f1f5f9", paddingBottom: 12 },
  scoreLabel: { fontSize: 12, color: "#1e293b", fontWeight: 700 },
  scoreValueBox: { backgroundColor: "#f1f5f9", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
  scoreValue: { fontSize: 11, fontWeight: 700, color: "#0f172a" },
  
  card: { borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 8, padding: 16, marginBottom: 16, backgroundColor: "#f8fafc" },
  conclusionBox: { backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0", padding: 16, borderRadius: 8, marginTop: 16, marginBottom: 24, borderLeftWidth: 4, borderLeftColor: "#0f172a" },
  
  footer: { position: "absolute", bottom: 30, left: 48, right: 48, fontSize: 9, color: "#94a3b8", flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#f1f5f9", paddingTop: 8 },
  
  problemBox: { backgroundColor: "#fef2f2", padding: 16, borderRadius: 8, marginBottom: 24, borderLeftWidth: 4, borderLeftColor: "#ef4444" },
  solutionBox: { backgroundColor: "#f0fdf4", padding: 16, borderRadius: 8, marginBottom: 24, borderLeftWidth: 4, borderLeftColor: "#22c55e" },
});

Font.registerHyphenationCallback((word) => [word]);

export function AuditPdfDocument({ report }: { report: AuditReport }) {
  return (
    <Document title={`${report.websiteName} — SiteElevate Audit`}>
      <Page size="A4" style={styles.coverPage}>
        <View style={styles.coverInner}>
          <View>
            <Text style={styles.coverEyebrow}>SiteElevate · Consulting Audit</Text>
            <Text style={styles.coverTitle}>{report.websiteName}</Text>
            <Text style={styles.coverUrl}>{report.url}</Text>
          </View>
          <View style={styles.coverScoreRow}>
            <Text style={styles.coverScoreBig}>{report.overallScore > 10 ? report.overallScore / 10 : report.overallScore}</Text>
            <Text style={styles.coverGrade}>/ 10 · {report.scoreRating}</Text>
          </View>
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>7 Core Business Parameters</Text>
        {SCORE_CATEGORIES.map((key) => {
          const section = report[key];
          return (
            <View key={key} style={styles.scoreRow}>
              <Text style={styles.scoreLabel}>{SCORE_CATEGORY_LABELS[key]}</Text>
              <View style={styles.scoreValueBox}>
                <Text style={styles.scoreValue}>{section.score} / 10 · {deriveBusinessStatus(section.score)}</Text>
              </View>
            </View>
          );
        })}

        <Text style={styles.h1}>Final Verdict</Text>
        <Text style={styles.paragraph}>Current Rating: {report.scoreRating}</Text>
        <Text style={styles.paragraph}>Projected Score After Improvements: {report.projectedImprovedScore > 10 ? report.projectedImprovedScore / 10 : report.projectedImprovedScore} / 10</Text>

      </Page>



      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Detailed Findings</Text>

        {(
          [
            ["Trust & Credibility", report.trustCredibility],
            ["Sales Conversion Readiness", report.salesConversionReadiness],
            ["Enterprise Readiness", report.enterpriseReadiness],
            ["Visual Branding & Premium Feel", report.visualBranding],
            ["Visual Storytelling & Design", report.visualStorytelling],
            ["Brand Differentiation", report.brandDifferentiation],
            ["Business Value Communication", report.businessValueCommunication],
          ] as const
        ).map(([label, section]) => (
          <View key={label} wrap={false} style={{ marginBottom: 16 }}>
            <Text style={styles.h2}>{label} · {section.score}/10 ({deriveBusinessStatus(section.score)})</Text>
            {section.points.map((p, i) => (
              <View style={styles.bullet} key={i}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>{p}</Text>
              </View>
            ))}
            <View style={styles.conclusionBox}>
              <Text style={styles.h3}>Conclusion</Text>
              <Text style={styles.paragraph}>{section.conclusion}</Text>
            </View>
          </View>
        ))}

        <View style={styles.footer} fixed>
          <Text>{report.websiteName} — SiteElevate Audit</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Action Plan</Text>
        
        <View style={styles.problemBox}>
          <Text style={[styles.h2, { marginTop: 0, color: "#b91c1c" }]}>Problems (What is broken)</Text>
          {report.whatWeDo.problems.map((p, i) => (
            <View style={styles.bullet} key={i}>
              <Text style={[styles.bulletDot, { color: "#ef4444" }]}>•</Text>
              <Text style={styles.bulletText}>{p}</Text>
            </View>
          ))}
        </View>

        <View style={styles.solutionBox}>
          <Text style={[styles.h2, { marginTop: 0, color: "#15803d" }]}>Solutions (What we recommend)</Text>
          {report.whatWeDo.solutions.map((p, i) => (
            <View style={styles.bullet} key={i}>
              <Text style={[styles.bulletDot, { color: "#22c55e" }]}>•</Text>
              <Text style={styles.bulletText}>{p}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.h1}>Business Conclusion</Text>
        {report.businessConclusion.points.map((p, i) => (
          <View style={styles.bullet} key={i}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>{p}</Text>
          </View>
        ))}
        <View style={styles.conclusionBox}>
          <Text style={styles.h3}>Currently Behaves Like</Text>
          <Text style={styles.paragraph}>&quot;{report.businessConclusion.currentPositioning}&quot;</Text>
          <Text style={styles.h3}>Future Positioning</Text>
          <Text style={styles.paragraph}>&quot;{report.businessConclusion.premiumFuturePositioning}&quot;</Text>
        </View>

        <View style={styles.footer} fixed>
          <Text>{report.websiteName} — SiteElevate Audit</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
