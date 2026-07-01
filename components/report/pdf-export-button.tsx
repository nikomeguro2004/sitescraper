"use client";

import * as React from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { AuditReport } from "@/lib/types/audit";

export function PdfExportButton({ report }: { report: AuditReport }) {
  const [loading, setLoading] = React.useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const [{ pdf }, { AuditPdfDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/components/report/pdf-document"),
      ]);

      const blob = await pdf(<AuditPdfDocument report={report} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${report.websiteName.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-analysis-audit.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Couldn't generate the PDF. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="secondary" size="sm" className="gap-2" onClick={handleExport} disabled={loading}>
      {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
      Export PDF
    </Button>
  );
}
