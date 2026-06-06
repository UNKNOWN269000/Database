import { useState, useEffect, useMemo, useCallback } from "react";
import DateFilter from "./DateFilter";
import RowDetailModal from "./RowDetailModal";
import ExportButton from "./ExportButton";
import { useDateFilteredRows } from "../hooks/useDateFilteredRows";

const API_URL =
  "https://script.google.com/macros/s/AKfycbxahN3PXcPFgt8YY3IU3B07a8s_cSKTU1Q7nzawsiFDh39a3PGQNIlUy-mmhBuuPWzB/exec?category=aging";

// Raw API row
interface ApiRow {
  entrydatetime?: string;
  agingdate?: string;
  bucketno?: number;
  intime?: string;
  outtime?: string;
  bucketweight?: number;
}

// Your exact column spec:
// date (row[0]) | bucketNo (row[2]) | inTime (row[3]) | outTime (row[4]) | weight (row[5]) | category: "aging"
export interface AgingRow {
  date: string;
  bucketNo: number;
  inTime: string;
  outTime: string;
  weight: number;
  category: "aging";
}

// Format a Sheets-style "1899-12-29T22:30:28.000Z" time as HH:MM
const formatTime = (iso: string): string => {
  if (!iso || iso === "") return "—";
  try {
    // The intime/outtime fields are stored as Google Sheets serial times
    // encoded as 1899-12-29 + the time-of-day portion in the time field.
    // We just want the time-of-day part, so we extract HH:MM.
    const match = iso.match(/T(\d{2}):(\d{2})/);
    if (match) return `${match[1]}:${match[2]}`;
    // Fallback: try Date parsing
    const d = new Date(iso);
    if (!isNaN(d.getTime())) {
      const hh = String(d.getUTCHours()).padStart(2, "0");
      const mm = String(d.getUTCMinutes()).padStart(2, "0");
      return `${hh}:${mm}`;
    }
  } catch {
    /* ignore */
  }
  return iso;
};

const toAgingRow = (r: ApiRow): AgingRow => {
  // Use agingdate if present, otherwise fall back to entry date (YYYY-MM-DD)
  const rawDate = r.agingdate && r.agingdate !== "" ? r.agingdate : r.entrydatetime || "";
  const date = rawDate ? String(rawDate).substring(0, 10) : "";
  const toNum = (v: unknown) => {
    if (v === "" || v === null || v === undefined) return 0;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };
  return {
    date,
    bucketNo: toNum(r.bucketno),
    inTime: formatTime(r.intime || ""),
    outTime: formatTime(r.outtime || ""),
    weight: toNum(r.bucketweight),
    category: "aging",
  };
};

const Duration = ({ inTime, outTime }: { inTime: string; outTime: string }) => {
  if (inTime === "—" || outTime === "—") return <span className="text-slate-400">—</span>;
  // Compute HH:MM - HH:MM duration in hours
  const parse = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  let diffMin = parse(outTime) - parse(inTime);
  if (diffMin < 0) diffMin += 24 * 60; // wraps midnight
  const hours = Math.floor(diffMin / 60);
  const mins = diffMin % 60;
  // Aging usually 6-8 hours target — color code accordingly
  const isStandard = diffMin >= 360 && diffMin <= 540; // 6h to 9h
  const isShort = diffMin < 360;
  const color = isShort
    ? "text-amber-600 dark:text-amber-400"
    : isStandard
    ? "text-emerald-600 dark:text-emerald-400"
    : "text-slate-600 dark:text-slate-400";
  return (
    <span className={`tabular-nums font-semibold ${color}`}>
      {hours}h {String(mins).padStart(2, "0")}m
    </span>
  );
};

const SkeletonRow = () => (
  <tr>
    {Array.from({ length: 6 }).map((_, i) => (
      <td key={i} className="px-2 py-2">
        <div className="h-3 rounded bg-slate-200/70 dark:bg-slate-700/50 animate-pulse"></div>
      </td>
    ))}
  </tr>
);

export default function AgingRecordTable({ color = "#ffcc00" }: { color?: string }) {
  const [rows, setRows] = useState<AgingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [detailRow, setDetailRow] = useState<AgingRow | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_URL, { method: "GET" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ApiRow[] | { status: string; message: string } = await res.json();
      if (!Array.isArray(data)) {
        throw Error(("message" in data && data.message) || "Unexpected response from API");
      }
      const mapped = (data as ApiRow[]).map(toAgingRow).filter((r) => r.bucketNo);
      setRows(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getDate = useCallback((r: AgingRow) => r.date, []);
  const { filteredRows: dateFiltered, startDate, endDate, setDateRange } = useDateFilteredRows(rows, getDate);

  const filtered = useMemo(() => {
    if (!search.trim()) return dateFiltered;
    const q = search.toLowerCase();
    return dateFiltered.filter(
      (r) =>
        String(r.bucketNo).includes(q) ||
        r.date.includes(q) ||
        r.inTime.toLowerCase().includes(q) ||
        r.outTime.toLowerCase().includes(q)
    );
  }, [dateFiltered, search]);

  const totals = useMemo(() => {
    return filtered.reduce((acc, r) => acc + r.weight, 0);
  }, [filtered]);

  return (
    <div className="space-y-3">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
            Aging Records
          </h3>
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap"
            style={{
              background: `${color}1a`,
              borderColor: `${color}55`,
              color: color,
            }}
          >
            {loading ? "Loading…" : `${filtered.length} rows`}
          </span>
          {error && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30">
              API error
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <svg
              className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search bucket, date, time..."
              className="w-full sm:w-64 pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:border-transparent transition"
              style={{ outlineColor: color }}
            />
          </div>
          <DateFilter
            startDate={startDate}
            endDate={endDate}
            onChange={setDateRange}
            color={color}
          />
          <ExportButton
            filename="aging_record"
            color={color}
            disabled={loading || filtered.length === 0}
            getData={() => filtered.map((r) => ({
              Date: r.date,
              BucketNo: r.bucketNo,
              InTime: r.inTime,
              OutTime: r.outTime,
              Duration: r.outTime && r.inTime ? (() => {
                const parse = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
                let d = parse(r.outTime) - parse(r.inTime);
                if (d < 0) d += 24 * 60;
                const h = Math.floor(d / 60);
                const m = d % 60;
                return `${h}h ${String(m).padStart(2, "0")}m`;
              })() : "",
              Weight: r.weight,
              Category: r.category,
            }))}
          />
          <button
            onClick={fetchData}
            disabled={loading}
            title="Refresh"
            className="flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition disabled:opacity-50"
          >
            <svg
              className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-lg border border-rose-300/60 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between gap-2">
          <span>⚠️ {error}. Make sure the API URL is reachable.</span>
          <button
            onClick={fetchData}
            className="px-2 py-1 rounded text-[10px] font-semibold bg-rose-500/20 hover:bg-rose-500/30"
          >
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/40 backdrop-blur-sm">
        <table className="min-w-full text-[10px] sm:text-xs">
          <thead>
            <tr
              className="text-left text-[10px] uppercase tracking-wider font-bold"
              style={{
                background: `linear-gradient(180deg, ${color}1a, ${color}0a)`,
                color: color,
              }}
            >
              <th className="px-2 py-2">Aging<br />Date</th>
              <th className="px-2 py-2 text-right">Bucket<br />No</th>
              <th className="px-2 py-2 text-center">In<br />Time</th>
              <th className="px-2 py-2 text-center">Out<br />Time</th>
              <th className="px-2 py-2 text-center">Duration</th>
              <th className="px-2 py-2 text-right">Weight<br />(kg)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/60 dark:divide-slate-700/60">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-slate-500 dark:text-slate-400">
                  No records found.
                </td>
              </tr>
            ) : (
              filtered.map((r, i) => (
                <tr
                  key={`${r.bucketNo}-${r.date}-${r.inTime}-${i}`}
                  onClick={() => setDetailRow(r)}
                  className="cursor-pointer hover:bg-slate-50/60 dark:hover:bg-slate-700/30 transition-colors"
                >
                  <td className="px-2 py-1.5 whitespace-nowrap text-slate-700 dark:text-slate-300 font-medium">
                    {r.date}
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums">
                    <span
                      className="px-1.5 py-0.5 rounded font-mono text-[10px] font-bold"
                      style={{
                        background: `${color}1a`,
                        color: color,
                      }}
                    >
                      #{r.bucketNo}
                    </span>
                  </td>
                  <td className="px-2 py-1.5 text-center tabular-nums">
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-200 font-semibold">
                      {r.inTime}
                    </span>
                  </td>
                  <td className="px-2 py-1.5 text-center tabular-nums">
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-200 font-semibold">
                      {r.outTime}
                    </span>
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    <Duration inTime={r.inTime} outTime={r.outTime} />
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums font-semibold text-slate-900 dark:text-white">
                    {r.weight ? r.weight.toFixed(2) : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {!loading && filtered.length > 0 && (
            <tfoot>
              <tr
                className="font-bold text-[10px] sm:text-xs border-t-2"
                style={{
                  background: `${color}0d`,
                  borderColor: `${color}55`,
                }}
              >
                <td colSpan={5} className="px-2 py-2 text-right uppercase tracking-wider" style={{ color }}>
                  Total Weight
                </td>
                <td className="px-2 py-2 text-right tabular-nums" style={{ color }}>
                  {totals.toFixed(2)} kg
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Footer note */}
      <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
        Showing <span className="font-semibold">{filtered.length}</span> of{" "}
        <span className="font-semibold">{rows.length}</span> records · Category:{" "}
        <span className="font-mono font-semibold" style={{ color }}>aging</span> · Source: Google Apps Script API · Click any row to view details
      </p>

      <RowDetailModal
        open={detailRow !== null}
        onClose={() => setDetailRow(null)}
        title={`Bucket #${detailRow?.bucketNo || ""}`}
        subtitle={`Aging Record · ${detailRow?.date || ""}`}
        color={color}
        data={detailRow ? [
          { label: "Aging Date", value: detailRow.date, highlight: true },
          { label: "Bucket No", value: `#${detailRow.bucketNo}`, highlight: true },
          { label: "In Time", value: detailRow.inTime, highlight: true },
          { label: "Out Time", value: detailRow.outTime, highlight: true },
          { label: "Duration", value: <Duration inTime={detailRow.inTime} outTime={detailRow.outTime} />, highlight: true },
          { label: "Weight (kg)", value: detailRow.weight ? detailRow.weight.toFixed(2) : "—", highlight: true },
          { label: "Category", value: <span className="font-mono font-semibold" style={{ color }}>{detailRow.category}</span>, fullWidth: true },
        ] : []}
      />
    </div>
  );
}
