import { useState, useEffect, useRef, useMemo } from "react";

interface DateFilterProps {
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
  color?: string;
  /**
   * Optional array of all dates that exist in the loaded data
   * (as YYYY-MM-DD strings). When provided, the preset ranges
   * ("Last 7 days", "This month", etc.) are anchored to the
   * LATEST date in the data — not to today's calendar date.
   * This way, "Last 7 days" always shows the 7 most recent
   * records even if the data is weeks old.
   */
  dataDates?: string[];
}

const isoDate = (d: Date) => d.toISOString().substring(0, 10);

const addDays = (isoDateStr: string, days: number): string => {
  const d = new Date(isoDateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().substring(0, 10);
};

const daysBetween = (a: string, b: string): number => {
  const ms = new Date(b + "T00:00:00Z").getTime() - new Date(a + "T00:00:00Z").getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
};

export default function DateFilter({
  startDate,
  endDate,
  onChange,
  color = "#fbbf24",
  dataDates = [],
}: DateFilterProps) {
  const [open, setOpen] = useState(false);
  const [tempStart, setTempStart] = useState(startDate);
  const [tempEnd, setTempEnd] = useState(endDate);
  const popoverRef = useRef<HTMLDivElement>(null);

  // The "anchor" date used by all presets. This is the most recent
  // date in the data, or today if no data is loaded yet.
  const anchorDate = useMemo(() => {
    if (dataDates.length > 0) {
      return dataDates.reduce((latest, d) => (d > latest ? d : latest), dataDates[0]);
    }
    return isoDate(new Date());
  }, [dataDates]);

  // Min and max data dates — used as `min`/`max` hints on the date inputs
  const minDataDate = useMemo(() => {
    if (dataDates.length === 0) return undefined;
    return dataDates.reduce((min, d) => (d < min ? d : min), dataDates[0]);
  }, [dataDates]);

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

  /**
   * Build a date range relative to the anchorDate (most recent data
   * date, or today if no data). "daysAgo: 0" means anchorDate only,
   * "daysAgo: 7" means [anchorDate-7, anchorDate], etc.
   */
  const buildRange = (daysAgo: number): { start: string; end: string } => {
    if (daysAgo < 0) {
      // Special: "all time" = no filter
      return { start: "", end: "" };
    }
    return {
      start: addDays(anchorDate, -daysAgo),
      end: anchorDate,
    };
  };

  /**
   * Returns how many calendar days are between the latest and earliest
   * data points — used to render preset labels like "Last 7 records".
   */
  const dataRangeDays = useMemo(() => {
    if (dataDates.length < 2) return 0;
    const sorted = [...dataDates].sort();
    return daysBetween(sorted[0], sorted[sorted.length - 1]);
  }, [dataDates]);

  const PRESETS = useMemo(() => {
    const presets: { label: string; days: number }[] = [
      { label: "All time", days: -1 },
    ];
    // Offer "Last N days" presets based on the data range available
    if (dataRangeDays > 0) {
      presets.push(
        { label: `Last ${Math.min(7, dataRangeDays)} days`, days: Math.min(7, dataRangeDays) },
        { label: `Last ${Math.min(14, dataRangeDays)} days`, days: Math.min(14, dataRangeDays) },
        { label: `Last ${Math.min(30, dataRangeDays)} days`, days: Math.min(30, dataRangeDays) }
      );
    } else {
      // Fallback to calendar-based presets when no data is loaded yet
      presets.push(
        { label: "Today", days: 0 },
        { label: "Last 7 days", days: 7 },
        { label: "Last 30 days", days: 30 }
      );
    }
    return presets;
  }, [dataRangeDays]);

  const applyPreset = (days: number) => {
    const { start, end } = buildRange(days);
    setTempStart(start);
    setTempEnd(end);
    onChange(start, end);
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

  // When opening, set a sensible default range based on actual data
  const handleOpen = () => {
    if (!isActive && dataDates.length > 0) {
      // Default to "all dates" — show full available data
      setTempStart(minDataDate || "");
      setTempEnd(anchorDate);
    } else {
      setTempStart(startDate);
      setTempEnd(endDate);
    }
    setOpen(true);
  };

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => (open ? setOpen(false) : handleOpen())}
        className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
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
          className="absolute left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-0 top-full mt-2 z-50 w-[calc(100vw-1.5rem)] sm:w-80 max-w-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl shadow-slate-900/20 dark:shadow-black/60 p-3 animate-in fade-in slide-in-from-top-2"
        >
          {/* Data range hint */}
          {dataDates.length > 0 && (
            <div className="mb-3 rounded-md bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 text-[10px] sm:text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                Data spans <span className="font-semibold">{minDataDate}</span> to{" "}
                <span className="font-semibold">{anchorDate}</span>
                <span className="text-slate-400"> · {dataDates.length} record{dataDates.length === 1 ? "" : "s"}</span>
              </span>
            </div>
          )}

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
                  min={minDataDate}
                  max={anchorDate}
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
                  min={minDataDate}
                  max={anchorDate}
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
