import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface RowDetailModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  color: string;
  data: { label: string; value: ReactNode; highlight?: boolean; fullWidth?: boolean }[];
}

/**
 * A compact modal that pops up when a table row is clicked.
 * Shows the row's data in a clean 2-column label/value grid.
 */
export default function RowDetailModal({
  open,
  onClose,
  title,
  subtitle,
  color,
  data,
}: RowDetailModalProps) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  // Render via portal to escape any parent stacking context / overflow
  // constraints. This ensures the modal can correctly cover the full viewport
  // even when launched from inside another modal.
  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm animate-[fadeIn_200ms_ease-out]"
        onClick={onClose}
      ></div>

      {/* Modal card */}
      <div
        className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-white/40 dark:border-slate-700/40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl backdrop-saturate-150 shadow-2xl shadow-slate-900/40 dark:shadow-black/70 animate-[modalIn_300ms_cubic-bezier(0.34,1.56,0.64,1)]"
      >
        {/* Inner highlight ring */}
        <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/30 dark:ring-slate-700/30 pointer-events-none"></div>

        {/* Top color accent bar */}
        <div
          className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
          style={{ background: `linear-gradient(90deg, ${color}, ${color}88, ${color})` }}
        ></div>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-5 sm:p-6 pb-4">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div
              className="flex h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-xl shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                boxShadow: `0 8px 20px ${color}55`,
              }}
            >
              <svg className="h-5 w-5 sm:h-6 sm:w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                Record Details
              </div>
              <h2 className="mt-0.5 text-base sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white truncate">
                {title}
              </h2>
              {subtitle && (
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Data grid */}
        <div className="px-5 sm:px-6 pb-5 sm:pb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {data.map((item, idx) => (
              <div
                key={idx}
                className={`rounded-lg border p-3 ${
                  item.highlight
                    ? "border-slate-300/70 dark:border-slate-600/70 bg-slate-50 dark:bg-slate-800/60"
                    : "border-slate-200/70 dark:border-slate-700/50 bg-white/40 dark:bg-slate-800/30"
                } ${item.fullWidth ? "sm:col-span-2" : ""}`}
                style={
                  item.highlight
                    ? { boxShadow: `inset 0 0 0 1px ${color}22` }
                    : undefined
                }
              >
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {item.label}
                </div>
                <div
                  className={`mt-1 text-sm break-words ${
                    item.highlight
                      ? "font-bold text-slate-900 dark:text-white"
                      : "text-slate-700 dark:text-slate-200 font-medium"
                  }`}
                  style={item.highlight ? { color } : undefined}
                >
                  {item.value === "" || item.value === null || item.value === undefined ? (
                    <span className="text-slate-400 dark:text-slate-500 font-normal">—</span>
                  ) : (
                    item.value
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Footer action */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
