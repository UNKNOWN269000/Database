import { useState, useMemo } from "react";

/**
 * Generic date-range filter for any data array.
 *
 * Usage:
 *   const { filteredRows, dateRange, setDateRange } = useDateFilteredRows(
 *     rows,
 *     (r) => r.extrusionDate   // extractor returns YYYY-MM-DD or ""
 *   );
 */
export function useDateFilteredRows<T>(
  rows: T[],
  getDate: (row: T) => string
) {
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: "",
    end: "",
  });

  const filteredRows = useMemo(() => {
    if (!dateRange.start && !dateRange.end) return rows;
    return rows.filter((r) => {
      const d = getDate(r);
      if (!d) return false; // exclude rows with no date when filtering
      if (dateRange.start && d < dateRange.start) return false;
      if (dateRange.end && d > dateRange.end) return false;
      return true;
    });
  }, [rows, dateRange, getDate]);

  return {
    filteredRows,
    startDate: dateRange.start,
    endDate: dateRange.end,
    setDateRange: (start: string, end: string) => setDateRange({ start, end }),
  };
}
