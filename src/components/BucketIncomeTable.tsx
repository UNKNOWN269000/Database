import { useState, useEffect, useMemo, useCallback } from "react";
import DateFilter from "./DateFilter";
import RowDetailModal from "./RowDetailModal";
import ExportButton from "./ExportButton";
import { useDateFilteredRows } from "../hooks/useDateFilteredRows";

const API_URL =
  "https://script.google.com/macros/s/AKfycbxahN3PXcPFgt8YY3IU3B07a8s_cSKTU1Q7nzawsiFDh39a3PGQNIlUy-mmhBuuPWzB/exec?category=bucket";

// Raw API row — uses the field names from the spreadsheet
interface ApiRow {
  entrydate?: string;
  bucketno?: number;
  extrusiondate?: string;
  shift?: string;
  billetbatchno?: number;
  type?: string;
  profile?: string;
  dieno?: number;
  length?: number;
  qty?: number;
  damageqty?: number;
  unitweightkg?: number;
  bucketweightkg?: number;
  surface?: string;
}

// Your exact column spec:
// Bucket No | Extrusion date | Shift | Billet Batch No | Type | Profile | Die No | Length | Qty | Damage Qty | Unit Weight (kg) | Bucket Weight (kg) | Surface
export interface BucketRow {
  bucketNo: number;
  extrusionDate: string;
  shift: string;
  billetBatchNo: number;
  type: string;
  profile: string;
  dieNo: number;
  length: number;
  qty: number;
  damageQty: number;
  unitWeight: number;
  bucketWeight: number;
  surface: string;
}

const toBucketRow = (r: ApiRow): BucketRow => {
  const rawDate = r.extrusiondate && r.extrusiondate !== "" ? r.extrusiondate : r.entrydate || "";
  const date = rawDate ? String(rawDate).substring(0, 10) : "";
  const toNum = (v: unknown) => {
    if (v === "" || v === null || v === undefined) return 0;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };
  return {
    bucketNo: toNum(r.bucketno),
    extrusionDate: date,
    shift: String(r.shift || ""),
    billetBatchNo: toNum(r.billetbatchno),
    type: String(r.type || ""),
    profile: String(r.profile || "").trim(),
    dieNo: toNum(r.dieno),
    length: toNum(r.length),
    qty: toNum(r.qty),
    damageQty: toNum(r.damageqty),
    unitWeight: toNum(r.unitweightkg),
    bucketWeight: toNum(r.bucketweightkg),
    surface: String(r.surface || ""),
  };
};

const ShiftBadge = ({ shift }: { shift: string }) => {
  const map: Record<string, string> = {
    Day: "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30",
    Night: "bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-500/30",
    Morning: "bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-500/30",
    Evening: "bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30",
  };
  const cls = map[shift] || "bg-slate-500/20 text-slate-700 dark:text-slate-300 border-slate-500/30";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border whitespace-nowrap ${cls}`}>
      {shift || "—"}
    </span>
  );
};

const SurfaceBadge = ({ surface, color }: { surface: string; color: string }) => {
  const s = (surface || "").toUpperCase();
  if (!s) return <span className="text-slate-400">—</span>;
  // Color-code common surface types
  const map: Record<string, string> = {
    AN: "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30",
    PC: "bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/30",
    MF: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    WOOD: "bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/30",
  };
  const cls = map[s] || "";
  if (cls) {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${cls}`}>
        {s}
      </span>
    );
  }
  return (
    <span
      className="px-1.5 py-0.5 rounded font-mono text-[10px] font-semibold"
      style={{ background: `${color}1a`, color }}
    >
      {s}
    </span>
  );
};

const SkeletonRow = () => (
  <tr>
    {Array.from({ length: 13 }).map((_, i) => (
      <td key={i} className="px-2 py-2">
        <div className="h-3 rounded bg-slate-200/70 dark:bg-slate-700/50 animate-pulse"></div>
      </td>
    ))}
  </tr>
);

export default function BucketIncomeTable({ color = "#00ff00" }: { color?: string }) {
  const [rows, setRows] = useState<BucketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [detailRow, setDetailRow] = useState<BucketRow | null>(null);

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
      const mapped = (data as ApiRow[]).map(toBucketRow).filter((r) => r.bucketNo);
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

  const getDate = useCallback((r: BucketRow) => r.extrusionDate, []);
  const { filteredRows: dateFiltered, startDate, endDate, setDateRange } = useDateFilteredRows(rows, getDate);

  const filtered = useMemo(() => {
    if (!search.trim()) return dateFiltered;
    const q = search.toLowerCase();
    return dateFiltered.filter(
      (r) =>
        r.profile.toLowerCase().includes(q) ||
        String(r.bucketNo).includes(q) ||
        String(r.billetBatchNo).includes(q) ||
        r.shift.toLowerCase().includes(q) ||
        r.surface.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q) ||
        r.extrusionDate.includes(q)
    );
  }, [dateFiltered, search]);

  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, r) => ({
        qty: acc.qty + r.qty,
        damageQty: acc.damageQty + r.damageQty,
        bucketWeight: acc.bucketWeight + r.bucketWeight,
      }),
      { qty: 0, damageQty: 0, bucketWeight: 0 }
    );
  }, [filtered]);

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Header bar — stays fixed at the top while the table area scrolls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 flex-shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
            Bucket Income Records
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
              placeholder="Search bucket, profile, shift, surface..."
              className="w-full sm:w-64 pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:border-transparent transition"
              style={{ outlineColor: color }}
            />
          </div>
          <DateFilter
            startDate={startDate}
            endDate={endDate}
            onChange={setDateRange}
            color={color}
            dataDates={rows.map((r) => r.extrusionDate).filter(Boolean)}
          />
          <ExportButton
            filename="bucket_income"
            color={color}
            disabled={loading || filtered.length === 0}
            getData={() => filtered.map((r) => ({
              ExtrusionDate: r.extrusionDate,
              BucketNo: r.bucketNo,
              Shift: r.shift,
              BilletBatch: r.billetBatchNo,
              Type: r.type,
              Profile: r.profile,
              DieNo: r.dieNo,
              Length: r.length,
              Qty: r.qty,
              DamageQty: r.damageQty,
              UnitWeight: r.unitWeight,
              BucketWeight: r.bucketWeight,
              Surface: r.surface,
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

      {/* Table — only region that scrolls */}
      <div className="table-scroll-area rounded-lg border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/40 backdrop-blur-sm flex-shrink-0">
        <table className="min-w-full text-[10px] sm:text-xs">
          <thead>
            <tr
              className="text-left text-[10px] uppercase tracking-wider font-bold"
              style={{
                background: `linear-gradient(180deg, ${color}1a, ${color}0a)`,
                color: color,
              }}
            >
              <th className="px-2 py-2 text-right">Bucket<br />No</th>
              <th className="px-2 py-2">Extrusion<br />Date</th>
              <th className="px-2 py-2 text-center">Shift</th>
              <th className="px-2 py-2 text-right">Billet<br />Batch</th>
              <th className="px-2 py-2 text-center">Type</th>
              <th className="px-2 py-2">Profile</th>
              <th className="px-2 py-2 text-right">Die<br />No</th>
              <th className="px-2 py-2 text-right">Length<br />(m)</th>
              <th className="px-2 py-2 text-right">Qty</th>
              <th className="px-2 py-2 text-right">Damage<br />Qty</th>
              <th className="px-2 py-2 text-right">Unit Wt<br />(kg)</th>
              <th className="px-2 py-2 text-right">Bucket Wt<br />(kg)</th>
              <th className="px-2 py-2 text-center">Surface</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/60 dark:divide-slate-700/60">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={13} className="px-3 py-6 text-center text-slate-500 dark:text-slate-400">
                  No records found.
                </td>
              </tr>
            ) : (
              filtered.map((r, i) => (
                <tr
                  key={`${r.bucketNo}-${r.billetBatchNo}-${i}`}
                  onClick={() => setDetailRow(r)}
                  className="cursor-pointer hover:bg-slate-50/60 dark:hover:bg-slate-700/30 transition-colors"
                >
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
                  <td className="px-2 py-1.5 whitespace-nowrap text-slate-700 dark:text-slate-300 font-medium">
                    {r.extrusionDate}
                  </td>
                  <td className="px-2 py-1.5 text-center"><ShiftBadge shift={r.shift} /></td>
                  <td className="px-2 py-1.5 text-right tabular-nums text-slate-700 dark:text-slate-300 font-medium">
                    {r.billetBatchNo || "—"}
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400">
                      {r.type || "—"}
                    </span>
                  </td>
                  <td className="px-2 py-1.5 whitespace-nowrap">
                    <span
                      className="px-1.5 py-0.5 rounded font-mono text-[10px] font-semibold"
                      style={{
                        background: `${color}1a`,
                        color: color,
                      }}
                    >
                      {r.profile}
                    </span>
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums text-slate-700 dark:text-slate-300">
                    {r.dieNo || "—"}
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums text-slate-700 dark:text-slate-300">
                    {r.length ? r.length.toFixed(2) : "—"}
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums font-semibold text-slate-900 dark:text-white">
                    {r.qty}
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums">
                    {r.damageQty > 0 ? (
                      <span className="text-rose-600 dark:text-rose-400 font-semibold">
                        {r.damageQty}
                      </span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums text-slate-700 dark:text-slate-300">
                    {r.unitWeight ? r.unitWeight.toFixed(3) : "—"}
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums font-semibold text-slate-900 dark:text-white">
                    {r.bucketWeight ? r.bucketWeight.toFixed(2) : "—"}
                  </td>
                  <td className="px-2 py-1.5 text-center"><SurfaceBadge surface={r.surface} color={color} /></td>
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
                <td colSpan={8} className="px-2 py-2 text-right uppercase tracking-wider" style={{ color }}>
                  Totals
                </td>
                <td className="px-2 py-2 text-right tabular-nums" style={{ color }}>
                  {totals.qty}
                </td>
                <td className="px-2 py-2 text-right tabular-nums" style={{ color }}>
                  {totals.damageQty}
                </td>
                <td className="px-2 py-2 text-right" style={{ color }}>—</td>
                <td className="px-2 py-2 text-right tabular-nums" style={{ color }}>
                  {totals.bucketWeight.toFixed(2)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Footer note */}
      <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
        Showing <span className="font-semibold">{filtered.length}</span> of{" "}
        <span className="font-semibold">{rows.length}</span> records · Category:{" "}
        <span className="font-mono font-semibold" style={{ color }}>bucket</span> · Source: Google Apps Script API · Click any row to view details
      </p>

      <RowDetailModal
        open={detailRow !== null}
        onClose={() => setDetailRow(null)}
        title={`Bucket #${detailRow?.bucketNo || ""}`}
        subtitle={`Bucket Income · ${detailRow?.profile || ""}`}
        color={color}
        data={detailRow ? [
          { label: "Extrusion Date", value: detailRow.extrusionDate, highlight: true },
          { label: "Bucket No", value: `#${detailRow.bucketNo}`, highlight: true },
          { label: "Shift", value: <ShiftBadge shift={detailRow.shift} /> },
          { label: "Billet Batch", value: detailRow.billetBatchNo || "—" },
          { label: "Type", value: detailRow.type || "—" },
          { label: "Profile", value: detailRow.profile, highlight: true },
          { label: "Die No", value: detailRow.dieNo || "—" },
          { label: "Length (m)", value: detailRow.length ? detailRow.length.toFixed(2) : "—" },
          { label: "Qty", value: detailRow.qty, highlight: true },
          { label: "Damage Qty", value: detailRow.damageQty > 0 ? detailRow.damageQty : "0" },
          { label: "Unit Weight (kg)", value: detailRow.unitWeight ? detailRow.unitWeight.toFixed(3) : "—" },
          { label: "Bucket Weight (kg)", value: detailRow.bucketWeight ? detailRow.bucketWeight.toFixed(2) : "—", highlight: true },
          { label: "Surface", value: <SurfaceBadge surface={detailRow.surface} color={color} />, fullWidth: true },
        ] : []}
      />
    </div>
  );
}
