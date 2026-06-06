import { useState, useEffect, useRef } from "react";

interface DateFilterProps {
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
  color?: string;
}

const PRESETS = [
  { label: "Today", days: 0 },
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
  { label: "This month", days: -1 }, // special: current month
  { label: "All time", days: -2 }, // special: clear filter
];

const isoDate = (d: Date) => d.toISOString().substring(0, 10);

const computeStart = (days: number): string => {
  if (days === -2) return ""; // All time → no filter
  const d = new Date();
  if (days === -1) {
    // First day of current month
    return isoDate(new Date(d.getFullYear(), d.getMonth(), 1));
  }
  d.setDate(d.getDate() - days);
  return isoDate(d);
};

const computeEnd = (days: number): string => {
  if (days === -2) return ""; // All time → no filter
  return isoDate(new Date());
};

export default function DateFilter({ startDate, endDate, onChange, color = "#fbbf24" }: DateFilterProps) {
  const [open, setOpen] = useState(false);
  const [tempStart, setTempStart] = useState(startDate);
  const [tempEnd, setTempEnd] = useState(endDate);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Sync local temp state when external state changes
  useEffect(() => {
    setTempStart(startDate);
    setTempEnd(endDate);
  }, [startDate, endDate]);

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

  const isActive = startDate !== "" || endDate !== "";

  const applyPreset = (days: number) => {
    const s = computeStart(days);
    const e = computeEnd(days);
    setTempStart(s);
    setTempEnd(e);
    onChange(s, e);
    setOpen(false);
  };

  const applyCustom = () => {
    onChange(tempStart, tempEnd);
    setOpen(false);
  };

  const clearFilter = () => {
    setTempStart("");
    setTempEnd("");
    onChange("", "");
    setOpen(false);
  };

  const displayLabel = isActive
    ? startDate && endDate
      ? startDate === endDate
        ? startDate
        : `${startDate} → ${endDate}`
      : startDate
      ? `From ${startDate}`
      : `Until ${endDate}`
    : "All dates";

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
          isActive
            ? "border-transparent text-white shadow-md"
            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600"
        }`}
        style={isActive ? { background: `linear-gradient(135deg, ${color}, ${color}cc)`, boxShadow: `0 4px 12px ${color}55` } : undefined}
        title="Filter by date"
      >
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="max-w-[140px] truncate">{displayLabel}</span>
        {isActive && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              clearFilter();
            }}
            className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 cursor-pointer"
            role="button"
            aria-label="Clear date filter"
          >
            <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 z-50 w-72 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl shadow-slate-900/20 dark:shadow-black/60 p-3 animate-in fade-in slide-in-from-top-2"
        >
          {/* Presets */}
          <div className="mb-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 px-1">
              Quick ranges
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => applyPreset(preset.days)}
                  className="text-left text-xs px-2.5 py-1.5 rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-700 pt-3 space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 px-1">
              Custom range
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1 px-1">From</label>
                <input
                  type="date"
                  value={tempStart}
                  onChange={(e) => setTempStart(e.target.value)}
                  className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:border-transparent transition"
                  style={{ outlineColor: color }}
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1 px-1">To</label>
                <input
                  type="date"
                  value={tempEnd}
                  onChange={(e) => setTempEnd(e.target.value)}
                  className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:border-transparent transition"
                  style={{ outlineColor: color }}
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={clearFilter}
                className="flex-1 px-2 py-1.5 rounded-md text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Clear
              </button>
              <button
                onClick={applyCustom}
                className="flex-1 px-2 py-1.5 rounded-md text-xs font-semibold text-white shadow-sm transition-all"
                style={{ background: color }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
