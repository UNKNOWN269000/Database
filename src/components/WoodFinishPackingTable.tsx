import { useState, useEffect, useMemo, useCallback } from "react";
import DateFilter from "./DateFilter";
import RowDetailModal from "./RowDetailModal";
import ExportButton from "./ExportButton";
import { useDateFilteredRows } from "../hooks/useDateFilteredRows";

const API_URL =
  "https://script.google.com/macros/s/AKfycbxahN3PXcPFgt8YY3IU3B07a8s_cSKTU1Q7nzawsiFDh39a3PGQNIlUy-mmhBuuPWzB/exec?category=woodfinish_pack";

// Raw API row (from the "Wood Finish Packing" sheet, after header normalization)
interface ApiRow {
  entrydatetime?: string;
  woodfinishproductiondate?: string;
  packingdate?: string;
  type?: string;
  profilename?: string;
  length?: number;
  // Full Pack
  packnumberfullpack?: string | number;
  onebundleqtyfullpack?: number;
  totalbundlefullpack?: number;
  totalqtyfullpack?: number;
  averageweighfullpack?: number;
  // Pcs
  packnumberpcs?: string | number;
  onebundleqtypcs?: number | string;
  totalqtypcs?: number;
  averageweightpcs?: number;
  // Total (pre-computed server-side)
  total?: number;
}

// Your exact 15-column spec (no Premium/Non-Brand split — just Full Pack + Pcs)
export interface WoodFinishPackingRow {
  productionDate: string;
  packingDate: string;
  type: string;
  profileName: string;
  length: number;
  // Full Pack
  packNumberFull: string;
  oneBundleQtyFull: number;
  totalBundleFull: number;
  totalQtyFull: number;
  averageWeightFull: number;
  // Pcs
  packNumberPcs: string;
  oneBundleQtyPcs: number;
  totalQtyPcs: number;
  averageWeightPcs: number;
  // Server-computed total
  total: number;
}

const trimDate = (v?: string) => (v ? String(v).substring(0, 10) : "");
const toNum = (v: unknown) => {
  if (v === "" || v === null || v === undefined) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const toStr = (v: unknown) => (v === null || v === undefined ? "" : String(v).trim());

const toRow = (r: ApiRow): WoodFinishPackingRow => ({
  productionDate: trimDate(r.woodfinishproductiondate),
  packingDate: trimDate(r.packingdate),
  type: toStr(r.type),
  profileName: toStr(r.profilename),
  length: toNum(r.length),
  packNumberFull: toStr(r.packnumberfullpack),
  oneBundleQtyFull: toNum(r.onebundleqtyfullpack),
  totalBundleFull: toNum(r.totalbundlefullpack),
  totalQtyFull: toNum(r.totalqtyfullpack),
  averageWeightFull: toNum(r.averageweighfullpack),
  packNumberPcs: toStr(r.packnumberpcs),
  oneBundleQtyPcs: toNum(r.onebundleqtypcs),
  totalQtyPcs: toNum(r.totalqtypcs),
  averageWeightPcs: toNum(r.averageweightpcs),
  total: toNum(r.total),
});

// Wood-finish swatches
const WOOD_SWATCHES: Record<string, string> = {
  teek: "#9a3412", teak: "#9a3412",
  walnut: "#5b3a29", wallnut: "#5b3a29",
  oak: "#a16207", pine: "#65a30d", mahogany: "#7c2d12",
  cherry: "#9f1239", maple: "#d97706", ash: "#94a3b8",
  birch: "#fef3c7", beech: "#d6c6a8", rosewood: "#7e22ce",
  ebony: "#1c1917", bamboo: "#84cc16", jatoba: "#92400e",
  // Non-wood finishes sometimes used
  black: "#0f172a", white: "#f8fafc", grey: "#64748b", gray: "#64748b",
  silver: "#cbd5e1", bronze: "#92400e", brown: "#78350f", red: "#dc2626",
  green: "#16a34a", blue: "#2563eb", navy: "#1e3a8a", yellow: "#eab308",
  ivory: "#fef9e7", champagne: "#fbbf24", beige: "#d6c6a8", cream: "#fef9e7",
  anthracite: "#1f2937",
};

const TypeSwatch = ({ type }: { type: string }) => {
  const t = (type || "").toLowerCase().trim();
  if (!t) return <span className="text-slate-400">—</span>;
  const hex = WOOD_SWATCHES[t] || t;
  return (
    <span className="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
      <span
        className="inline-block h-3.5 w-3.5 rounded-sm border border-slate-300 dark:border-slate-600 shadow-inner"
        style={{ backgroundColor: hex }}
      />
      <span className="text-[10px] sm:text-xs font-medium text-slate-700 dark:text-slate-200 capitalize">
        {t}
      </span>
    </span>
  );
};

const Num = ({ value, decimals = 0, color, bold = false }: { value: number; decimals?: number; color?: string; bold?: boolean }) => {
  if (!value && value !== 0) return <span className="text-slate-400">—</span>;
  return (
    <span
      className={`tabular-nums ${bold ? "font-bold" : "font-semibold"}`}
      style={color ? { color } : undefined}
    >
      {value.toFixed(decimals)}
    </span>
  );
};

const SkeletonRow = () => (
  <tr>
    {Array.from({ length: 15 }).map((_, i) => (
      <td key={i} className="px-2 py-2">
        <div className="h-3 rounded bg-slate-200/70 dark:bg-slate-700/50 animate-pulse"></div>
      </td>
    ))}
  </tr>
);

export default function WoodFinishPackingTable({ color = "#ff6600" }: { color?: string }) {
  const [rows, setRows] = useState<WoodFinishPackingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [detailRow, setDetailRow] = useState<WoodFinishPackingRow | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_URL, { method: "GET" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ApiRow[] | { status: string; message: string } = await res.json();
      if (!Array.isArray(data)) {
        const errObj = data as { status: string; message: string };
        throw Error(errObj.message || "Unexpected response from API");
      }
      const mapped = (data as ApiRow[]).map(toRow);
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

  const getDate = useCallback((r: WoodFinishPackingRow) => r.packingDate, []);
  const { filteredRows: dateFiltered, startDate, endDate, setDateRange } = useDateFilteredRows(rows, getDate);

  const filtered = useMemo(() => {
    if (!search.trim()) return dateFiltered;
    const q = search.toLowerCase();
    return dateFiltered.filter(
      (r) =>
        r.profileName.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q) ||
        r.packNumberFull.toLowerCase().includes(q) ||
        r.packNumberPcs.toLowerCase().includes(q) ||
        r.productionDate.includes(q) ||
        r.packingDate.includes(q)
    );
  }, [dateFiltered, search]);

  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, r) => ({
        oneBundleQtyFull: acc.oneBundleQtyFull + r.oneBundleQtyFull,
        totalBundleFull: acc.totalBundleFull + r.totalBundleFull,
        totalQtyFull: acc.totalQtyFull + r.totalQtyFull,
        totalQtyPcs: acc.totalQtyPcs + r.totalQtyPcs,
        total: acc.total + r.total,
      }),
      { oneBundleQtyFull: 0, totalBundleFull: 0, totalQtyFull: 0, totalQtyPcs: 0, total: 0 }
    );
  }, [filtered]);

  return (
    <div className="space-y-3">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
            Wood Finish Packing Records
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
              placeholder="Search profile, type, pack#..."
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
            filename="woodfinish_packing"
            color={color}
            disabled={loading || filtered.length === 0}
            getData={() => filtered.map((r) => ({
              ProductionDate: r.productionDate,
              PackingDate: r.packingDate,
              Type: r.type,
              ProfileName: r.profileName,
              Length: r.length,
              PackNumberFull: r.packNumberFull,
              OneBundleQtyFull: r.oneBundleQtyFull,
              TotalBundleFull: r.totalBundleFull,
              TotalQtyFull: r.totalQtyFull,
              AverageWeightFull: r.averageWeightFull,
              PackNumberPcs: r.packNumberPcs,
              OneBundleQtyPcs: r.oneBundleQtyPcs,
              TotalQtyPcs: r.totalQtyPcs,
              AverageWeightPcs: r.averageWeightPcs,
              Total: r.total,
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
          <span>⚠️ {error}.</span>
          <button
            onClick={fetchData}
            className="px-2 py-1 rounded text-[10px] font-semibold bg-rose-500/20 hover:bg-rose-500/30 whitespace-nowrap"
          >
            Retry
          </button>
        </div>
      )}

      {/* Table — two-row header grouping */}
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
              <th colSpan={5} className="px-2 py-1.5 text-center border-b border-slate-200/50 dark:border-slate-700/50">Identification</th>
              <th colSpan={5} className="px-2 py-1.5 text-center border-b border-l border-slate-200/50 dark:border-slate-700/50">Full Pack</th>
              <th colSpan={4} className="px-2 py-1.5 text-center border-b border-l border-slate-200/50 dark:border-slate-700/50">Pcs</th>
              <th rowSpan={2} className="px-2 py-1.5 text-center border-b border-l border-slate-200/50 dark:border-slate-700/50">Total</th>
            </tr>
            <tr
              className="text-left text-[9px] uppercase tracking-wider font-semibold"
              style={{ color: color }}
            >
              <th className="px-1.5 py-1.5">WF Prod.<br />Date</th>
              <th className="px-1.5 py-1.5">Packing<br />Date</th>
              <th className="px-1.5 py-1.5">Type</th>
              <th className="px-1.5 py-1.5">Profile</th>
              <th className="px-1.5 py-1.5 text-right">Length</th>

              <th className="px-1.5 py-1.5 text-center border-l border-slate-200/50 dark:border-slate-700/50">Pack #</th>
              <th className="px-1.5 py-1.5 text-right">1B Qty</th>
              <th className="px-1.5 py-1.5 text-right">Total<br />Bndl</th>
              <th className="px-1.5 py-1.5 text-right">Total<br />Qty</th>
              <th className="px-1.5 py-1.5 text-right">Avg Wt</th>

              <th className="px-1.5 py-1.5 text-center border-l border-slate-200/50 dark:border-slate-700/50">Pack #</th>
              <th className="px-1.5 py-1.5 text-right">1B Qty</th>
              <th className="px-1.5 py-1.5 text-right">Total<br />Qty</th>
              <th className="px-1.5 py-1.5 text-right">Avg Wt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/60 dark:divide-slate-700/60">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={15} className="px-3 py-6 text-center text-slate-500 dark:text-slate-400">
                  {error ? "No data — see error above." : "No records found."}
                </td>
              </tr>
            ) : (
              filtered.map((r, i) => (
                <tr
                  key={`${r.productionDate}-${r.packingDate}-${r.packNumberFull}-${r.packNumberPcs}-${i}`}
                  onClick={() => setDetailRow(r)}
                  className="cursor-pointer hover:bg-slate-50/60 dark:hover:bg-slate-700/30 transition-colors"
                >
                  <td className="px-1.5 py-1.5 whitespace-nowrap text-slate-700 dark:text-slate-300 font-medium">
                    {r.productionDate}
                  </td>
                  <td className="px-1.5 py-1.5 whitespace-nowrap text-slate-700 dark:text-slate-300 font-medium">
                    {r.packingDate}
                  </td>
                  <td className="px-1.5 py-1.5"><TypeSwatch type={r.type} /></td>
                  <td className="px-1.5 py-1.5 whitespace-nowrap">
                    <span
                      className="px-1 py-0.5 rounded font-mono text-[9px] font-semibold"
                      style={{ background: `${color}1a`, color }}
                    >
                      {r.profileName}
                    </span>
                  </td>
                  <td className="px-1.5 py-1.5 text-right tabular-nums text-slate-700 dark:text-slate-300">
                    {r.length ? r.length.toFixed(2) : "—"}
                  </td>

                  <td className="px-1.5 py-1.5 text-center tabular-nums text-slate-600 dark:text-slate-400 border-l border-slate-200/40 dark:border-slate-700/40">
                    {r.packNumberFull || "—"}
                  </td>
                  <td className="px-1.5 py-1.5 text-right"><Num value={r.oneBundleQtyFull} /></td>
                  <td className="px-1.5 py-1.5 text-right"><Num value={r.totalBundleFull} /></td>
                  <td className="px-1.5 py-1.5 text-right"><Num value={r.totalQtyFull} bold /></td>
                  <td className="px-1.5 py-1.5 text-right"><Num value={r.averageWeightFull} decimals={2} /></td>

                  <td className="px-1.5 py-1.5 text-center tabular-nums text-slate-600 dark:text-slate-400 border-l border-slate-200/40 dark:border-slate-700/40">
                    {r.packNumberPcs || "—"}
                  </td>
                  <td className="px-1.5 py-1.5 text-right">
                    {typeof r.oneBundleQtyPcs === "number" && r.oneBundleQtyPcs > 0 ? (
                      <span className="tabular-nums font-semibold">{r.oneBundleQtyPcs}</span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-1.5 py-1.5 text-right"><Num value={r.totalQtyPcs} bold /></td>
                  <td className="px-1.5 py-1.5 text-right"><Num value={r.averageWeightPcs} decimals={2} /></td>

                  <td className="px-1.5 py-1.5 text-right tabular-nums font-bold border-l border-slate-200/40 dark:border-slate-700/40" style={{ color }}>
                    {r.total || "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {!loading && filtered.length > 0 && (
            <tfoot>
              <tr
                className="font-bold text-[10px] sm:text-xs border-t-2"
                style={{ background: `${color}0d`, borderColor: `${color}55` }}
              >
                <td colSpan={6} className="px-2 py-2 text-right uppercase tracking-wider" style={{ color }}>Totals</td>
                <td className="px-1.5 py-2 text-right tabular-nums" style={{ color }}>{totals.oneBundleQtyFull || "—"}</td>
                <td className="px-1.5 py-2 text-right tabular-nums" style={{ color }}>{totals.totalBundleFull || "—"}</td>
                <td className="px-1.5 py-2 text-right tabular-nums" style={{ color }}>{totals.totalQtyFull || "—"}</td>
                <td colSpan={3}></td>
                <td className="px-1.5 py-2 text-right tabular-nums" style={{ color }}>{totals.totalQtyPcs || "—"}</td>
                <td colSpan={2}></td>
                <td className="px-1.5 py-2 text-right tabular-nums" style={{ color }}>{totals.total || "—"}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
        Showing <span className="font-semibold">{filtered.length}</span> of{" "}
        <span className="font-semibold">{rows.length}</span> records · Category:{" "}
        <span className="font-mono font-semibold" style={{ color }}>woodfinish_pack</span> · Source: Google Apps Script API · Click any row to view details
      </p>

      <RowDetailModal
        open={detailRow !== null}
        onClose={() => setDetailRow(null)}
        title={detailRow?.profileName || "Record Details"}
        subtitle={`Wood Finish Packing · ${detailRow?.packingDate || ""}`}
        color={color}
        data={detailRow ? [
          { label: "WF Prod. Date", value: detailRow.productionDate },
          { label: "Packing Date", value: detailRow.packingDate, highlight: true },
          { label: "Type", value: <TypeSwatch type={detailRow.type} /> },
          { label: "Profile Name", value: detailRow.profileName, highlight: true },
          { label: "Length (m)", value: detailRow.length ? detailRow.length.toFixed(2) : "—" },
          { label: "Pack # (Full)", value: detailRow.packNumberFull || "—" },
          { label: "1B Qty (Full)", value: detailRow.oneBundleQtyFull || "—" },
          { label: "Total Bundle (Full)", value: detailRow.totalBundleFull || "—" },
          { label: "Total Qty (Full)", value: detailRow.totalQtyFull || "—", highlight: true },
          { label: "Avg Wt (Full)", value: detailRow.averageWeightFull ? detailRow.averageWeightFull.toFixed(2) : "—" },
          { label: "Pack # (Pcs)", value: detailRow.packNumberPcs || "—" },
          { label: "1B Qty (Pcs)", value: detailRow.oneBundleQtyPcs || "—" },
          { label: "Total Qty (Pcs)", value: detailRow.totalQtyPcs || "—", highlight: true },
          { label: "Avg Wt (Pcs)", value: detailRow.averageWeightPcs ? detailRow.averageWeightPcs.toFixed(2) : "—" },
          { label: "Total", value: detailRow.total || "—", highlight: true, fullWidth: true },
        ] : []}
      />
    </div>
  );
}
