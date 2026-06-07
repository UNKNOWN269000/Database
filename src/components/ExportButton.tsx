import { useState, useEffect, useRef } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface ExportButtonProps {
  filename: string;
  color?: string;
  disabled?: boolean;
  /** Title shown at the top of the PDF (defaults to `filename`) */
  pdfTitle?: string;
  /** Optional async getter that returns the rows to export. */
  getData?: () => Record<string, unknown>[];
  /** Static rows data */
  data?: Record<string, unknown>[];
}

/**
 * Hex color → [r, g, b] array for jsPDF (which needs RGB tuples).
 * Accepts "#rrggbb" or "#rgb". Falls back to slate grey.
 */
const hexToRgb = (hex: string): [number, number, number] => {
  let s = (hex || "#64748b").replace("#", "");
  if (s.length === 3) s = s.split("").map((c) => c + c).join("");
  const n = parseInt(s, 16);
  if (isNaN(n)) return [100, 116, 139];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

/**
 * Reusable Export button with both CSV and PDF options.
 * Uses a small dropdown that appears on click.
 */
export default function ExportButton({
  filename,
  color = "#fbbf24",
  disabled = false,
  pdfTitle,
  getData,
  data,
}: ExportButtonProps) {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [open]);

  const resolveRows = (): Record<string, unknown>[] => {
    return data ?? (getData ? getData() : []);
  };

  const handleCSV = () => {
    const rows = resolveRows();
    if (!rows || rows.length === 0) return;

    const headers = Object.keys(rows[0]);

    // RFC 4180-compliant CSV escaping
    const escape = (val: unknown): string => {
      if (val === null || val === undefined) return "";
      let s = String(val);
      if (/[",\n\r]/.test(s)) {
        s = `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const csvLines = [
      headers.join(","),
      ...rows.map((row) => headers.map((h) => escape(row[h])).join(",")),
    ];
    const csv = "\uFEFF" + csvLines.join("\r\n"); // UTF-8 BOM for Excel

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setOpen(false);
  };

  const handlePDF = () => {
    const rows = resolveRows();
    if (!rows || rows.length === 0) return;

    const headers = Object.keys(rows[0]);
    const body = rows.map((row) => headers.map((h) => {
      const v = row[h];
      if (v === null || v === undefined) return "";
      return String(v);
    }));

    // Landscape A4 for wide tables; portrait otherwise
    const isWide = headers.length > 8;
    const doc = new jsPDF({
      orientation: isWide ? "landscape" : "portrait",
      unit: "pt",
      format: "a4",
    });

    const [r, g, b] = hexToRgb(color);
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    const title = pdfTitle || filename.replace(/_/g, " ").toUpperCase();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(r, g, b);
    doc.text(title, 40, 40);

    // Subtitle with row count + timestamp
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    const now = new Date();
    const ts = now.toLocaleString("en-GB", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
    doc.text(
      `Ultra Aluminum Pvt Ltd · ${rows.length} record${rows.length === 1 ? "" : "s"} · Exported ${ts}`,
      40,
      56
    );

    // Table
    autoTable(doc, {
      startY: 75,
      head: [headers],
      body,
      theme: "grid",
      styles: {
        font: "helvetica",
        fontSize: isWide ? 7 : 8,
        cellPadding: isWide ? 2 : 3,
        overflow: "linebreak",
        cellWidth: "auto",
      },
      headStyles: {
        fillColor: [r, g, b],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        halign: "left",
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: { left: 40, right: 40 },
      didDrawPage: (data) => {
        // Footer with page number
        const pageCount = doc.getNumberOfPages();
        const page = data.pageNumber;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Page ${page} of ${pageCount}`,
          pageWidth - 40,
          doc.internal.pageSize.getHeight() - 20,
          { align: "right" }
        );
        // Brand strip at the bottom-left
        doc.setTextColor(r, g, b);
        doc.text("Ultra Aluminum Pvt Ltd", 40, doc.internal.pageSize.getHeight() - 20);
      },
    });

    doc.save(`${filename}.pdf`);
    setOpen(false);
  };

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setOpen(!open)}
        disabled={disabled}
        title="Export to CSV or PDF"
        className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: `linear-gradient(135deg, ${color}, ${color}dd)`,
          boxShadow: disabled ? undefined : `0 4px 12px ${color}40`,
        }}
      >
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span className="hidden sm:inline">Export</span>
        <svg
          className={`h-3 w-3 opacity-80 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-0 top-full mt-2 z-50 w-44 max-w-[calc(100vw-1.5rem)] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl shadow-slate-900/20 dark:shadow-black/60 p-1.5 animate-in fade-in slide-in-from-top-2"
        >
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-2 py-1.5">
            Download as
          </div>
          <button
            onClick={handleCSV}
            disabled={disabled}
            className="w-full flex items-center gap-2.5 px-2 py-2 rounded-md text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </span>
            <div className="flex flex-col items-start">
              <span>CSV</span>
              <span className="text-[9px] text-slate-500 dark:text-slate-400 font-normal">Excel-friendly</span>
            </div>
          </button>
          <button
            onClick={handlePDF}
            disabled={disabled}
            className="w-full flex items-center gap-2.5 px-2 py-2 rounded-md text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <span
              className="flex h-7 w-7 items-center justify-center rounded-md"
              style={{ background: `${color}26`, color }}
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </span>
            <div className="flex flex-col items-start">
              <span>PDF</span>
              <span className="text-[9px] text-slate-500 dark:text-slate-400 font-normal">Branded report</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
