import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { exportToCsv, exportToExcel, exportToPdf, type ExportColumn } from "@/lib/analytics/export";

export function ExportButtons({
  filename,
  title,
  columns,
  rows,
}: {
  filename: string;
  title: string;
  columns: ExportColumn[];
  rows: object[];
}) {
  const disabled = rows.length === 0;

  return (
    <div className="flex items-center gap-1.5">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() => exportToCsv(filename, columns, rows)}
      >
        <Download /> CSV
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() => exportToExcel(filename, columns, rows)}
      >
        <Download /> Excel
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() => exportToPdf(filename, title, columns, rows)}
      >
        <Download /> PDF
      </Button>
    </div>
  );
}
