import { useEffect, type ReactNode } from "react";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  color: string;
  section: string;
  children?: ReactNode;
}

export default function Modal({ open, onClose, title, color, section, children }: ModalProps) {
  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  // Lock body scroll (ref-counted so it composes with nested modals)
  useBodyScrollLock(open);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm animate-[fadeIn_200ms_ease-out]"
        onClick={onClose}
      ></div>

      {/* Modal Card — sized to content; the body is the scroll region */}
      <div
        className="relative w-full max-w-5xl max-h-[90vh] flex flex-col rounded-2xl border border-white/40 dark:border-slate-700/40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl backdrop-saturate-150 shadow-2xl shadow-slate-900/30 dark:shadow-black/60 animate-[modalIn_300ms_cubic-bezier(0.34,1.56,0.64,1)]"
      >
        {/* Inner highlight ring */}
        <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/30 dark:ring-slate-700/30 pointer-events-none"></div>

        {/* Top color accent bar */}
        <div
          className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
          style={{ background: `linear-gradient(90deg, ${color}, ${color}88, ${color})` }}
        ></div>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-5 sm:p-6 pb-3">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className="flex h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-xl shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                boxShadow: `0 8px 20px ${color}55`,
              }}
            >
              <svg className="h-5 w-5 sm:h-6 sm:w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                {section}
              </div>
              <h2
                id="modal-title"
                className="mt-0.5 text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-white truncate"
              >
                {title}
              </h2>
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

        {/* Body — scrollable region. Header above is sticky, this scrolls. */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 sm:px-6 pb-5 sm:pb-6">
          {children ?? (
            <div className="space-y-4">
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                You opened the <span className="font-semibold" style={{ color }}>{title}</span> module
                under <span className="font-semibold">{section}</span>. This is where the detailed
                form, data table, or action panel for this module will appear.
              </p>

              {/* Sample info cards */}
              <div className="grid sm:grid-cols-3 gap-3">
                {[
                  { label: "Status", value: "Active" },
                  { label: "Records", value: "1,284" },
                  { label: "Updated", value: "Today" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 p-3 text-center"
                  >
                    <div className="text-xs sm:text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                      {stat.label}
                    </div>
                    <div className="mt-1 text-base sm:text-lg font-bold text-slate-900 dark:text-white">{stat.value}</div>
                  </div>
                ))}
              </div>

              {/* Action row */}
              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-base font-semibold text-white shadow-md transition-all hover:scale-[1.02] active:scale-95"
                  style={{
                    background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                    boxShadow: `0 4px 12px ${color}55`,
                  }}
                >
                  Open Full View
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 px-4 py-2.5 text-base font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
