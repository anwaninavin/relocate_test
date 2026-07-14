import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export interface ExportColumn {
  key: string;
  label: string;
}

function downloadBlob(filename: string, content: BlobPart, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function csvEscape(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export function exportToCsv(filename: string, columns: ExportColumn[], rows: object[]) {
  const header = columns.map((c) => csvEscape(c.label)).join(",");
  const body = rows.map((row) => columns.map((c) => csvEscape((row as Record<string, unknown>)[c.key])).join(",")).join("\n");
  downloadBlob(`${filename}.csv`, `${header}\n${body}`, "text/csv;charset=utf-8;");
}

/** Excel export without pulling in a parsing library (the maintained npm `xlsx` package
 * ships known prototype-pollution/ReDoS CVEs with no fix available) — Excel natively opens
 * an HTML table saved with an .xls extension, which is all a dashboard export needs. */
export function exportToExcel(filename: string, columns: ExportColumn[], rows: object[]) {
  const escapeHtml = (value: unknown) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const header = columns.map((c) => `<th>${escapeHtml(c.label)}</th>`).join("");
  const body = rows
    .map((row) => `<tr>${columns.map((c) => `<td>${escapeHtml((row as Record<string, unknown>)[c.key])}</td>`).join("")}</tr>`)
    .join("");

  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"></head>
<body><table><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table></body></html>`;

  downloadBlob(`${filename}.xls`, html, "application/vnd.ms-excel");
}

export function exportToPdf(filename: string, title: string, columns: ExportColumn[], rows: object[]) {
  const doc = new jsPDF({ unit: "pt" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(title, 40, 40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(`Generated ${new Date().toLocaleString()}`, 40, 58);

  autoTable(doc, {
    startY: 74,
    margin: { left: 40, right: 40 },
    head: [columns.map((c) => c.label)],
    body: rows.map((row) => columns.map((c) => String((row as Record<string, unknown>)[c.key] ?? ""))),
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [201, 107, 154], textColor: 255 },
    alternateRowStyles: { fillColor: [253, 246, 238] },
    theme: "grid",
  });

  doc.save(`${filename}.pdf`);
}
