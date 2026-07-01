import { Document, Page, Text, View, Image as PdfImage, StyleSheet, Font } from "@react-pdf/renderer";
import type { AuditReport } from "@/lib/types/audit";
import { SCORE_CATEGORIES, SCORE_CATEGORY_LABELS } from "@/lib/types/audit";
import { deriveBusinessStatus } from "@/lib/utils/grade";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#111111" },
  coverPage: { padding: 0, fontFamily: "Helvetica" },
  coverInner: { flex: 1, backgroundColor: "#0a0a0a", color: "#ffffff", padding: 48, justifyContent: "space-between" },
  coverEyebrow: { fontSize: 10, color: "#9ca3af", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 },
  coverTitle: { fontSize: 30, fontWeight: 700, marginBottom: 8 },
  coverUrl: { fontSize: 12, color: "#9ca3af", marginBottom: 40 },
  coverScoreRow: { flexDirection: "row", alignItems: "flex-end", gap: 16, marginTop: "auto" },
  coverScoreBig: { fontSize: 64, fontWeight: 700 },
  coverGrade: { fontSize: 20, color: "#9ca3af" },
  h1: { fontSize: 16, fontWeight: 700, marginBottom: 10, marginTop: 18 },
  h2: { fontSize: 12, fontWeight: 700, marginBottom: 6, marginTop: 14 },
  h3: { fontSize: 10, fontWeight: 700, marginBottom: 4, marginTop: 10 },
  paragraph: { fontSize: 10, lineHeight: 1.5, color: "#374151", marginBottom: 6 },
  bullet: { flexDirection: "row", marginBottom: 4, gap: 4 },
  bulletDot: { fontSize: 10, color: "#374151" },
  bulletText: { fontSize: 10, lineHeight: 1.4, color: "#374151", flex: 1 },
  scoreRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6, borderBottomWidth: 1, borderBottomColor: "#e5e7eb", paddingBottom: 6 },
  scoreLabel: { fontSize: 10, color: "#111111" },
  scoreValue: { fontSize: 10, fontWeight: 700 },
  card: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 4, padding: 10, marginBottom: 6 },
  cardTitle: { fontSize: 10, fontWeight: 700, marginBottom: 2 },
  cardDetail: { fontSize: 9, color: "#4b5563", lineHeight: 1.4 },
  conclusionBox: { backgroundColor: "#f3f4f6", padding: 12, borderRadius: 4, marginTop: 8, marginBottom: 12 },
  footer: { position: "absolute", bottom: 24, left: 40, right: 40, fontSize: 8, color: "#9ca3af", flexDirection: "row", justifyContent: "space-between" },
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
            <Text style={styles.coverScoreBig}>{report.overallScore}</Text>
            <Text style={styles.coverGrade}>/ 100 · Grade {report.businessGrade}</Text>
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
              <Text style={styles.scoreValue}>{section.score} / 10 · {deriveBusinessStatus(section.score)}</Text>
            </View>
          );
        })}

        <Text style={styles.h1}>Final Verdict</Text>
        <Text style={styles.paragraph}>Current Rating: {report.scoreRating}</Text>
        <Text style={styles.paragraph}>Projected Score After Improvements: {report.projectedImprovedScore} / 100</Text>

        <Text style={styles.h1}>Screenshot</Text>
        <PdfImage src={report.screenshot} style={{ width: "100%", borderRadius: 4 }} />

        <View style={styles.footer} fixed>
          <Text>{report.websiteName} — SiteElevate Audit</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
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
        <Text style={styles.h1}>What We Do</Text>
        <Text style={styles.h2}>Problems (What is broken)</Text>
        {report.whatWeDo.problems.map((p, i) => (
          <View style={styles.bullet} key={i}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>{p}</Text>
          </View>
        ))}

        <Text style={styles.h2}>Solutions (What we recommend)</Text>
        {report.whatWeDo.solutions.map((p, i) => (
          <View style={styles.bullet} key={i}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>{p}</Text>
          </View>
        ))}

        <Text style={styles.h1}>Business Conclusion</Text>
        {report.businessConclusion.points.map((p, i) => (
          <View style={styles.bullet} key={i}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>{p}</Text>
          </View>
        ))}
        <View style={styles.conclusionBox}>
          <Text style={styles.h3}>Currently Behaves Like</Text>
          <Text style={styles.paragraph}>"{report.businessConclusion.currentPositioning}"</Text>
          <Text style={styles.h3}>Future Positioning</Text>
          <Text style={styles.paragraph}>"{report.businessConclusion.premiumFuturePositioning}"</Text>
        </View>

        <View style={styles.footer} fixed>
          <Text>{report.websiteName} — SiteElevate Audit</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
