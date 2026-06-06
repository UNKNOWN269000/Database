import { useState, useEffect, useMemo, useCallback } from "react";
import DateFilter from "./DateFilter";
import RowDetailModal from "./RowDetailModal";
import ExportButton from "./ExportButton";
import { useDateFilteredRows } from "../hooks/useDateFilteredRows";

const API_URL =
  "https://script.google.com/macros/s/AKfycbxahN3PXcPFgt8YY3IU3B07a8s_cSKTU1Q7nzawsiFDh39a3PGQNIlUy-mmhBuuPWzB/exec?category=anodizing_prod";

// Raw API row
interface ApiRow {
  entrydatetime?: string;
  anodizingdate?: string;
  anodizingbarbindingdate?: string;
  rackno?: number | string;
  type?: string;
  profilename?: string;
  length?: number;
  totalproductionqty?: number;
  rackwiseqty?: number | string;
  surface?: string;
  premiumpackingqty?: number | string;
  nonbrandpackingqty?: number | string;
  weightbarqty?: number | string;
  onemicron?: number | string;
}

// Your exact 13-column spec
export interface AnodizingProductionRow {
  anodizingDate: string;
  barBindingDate: string;
  rackNo: string;
  type: string;
  profileName: string;
  length: number;
  totalProductionQty: number;
  rackWiseQty: string;
  surface: string;
  premiumPackingQty: number;
  nonBrandPackingQty: number;
  weightBarQty: number;
  oneMicron: number;
}

const trimDate = (v?: string) => (v ? String(v).substring(0, 10) : "");
const toNum = (v: unknown) => {
  if (v === "" || v === null || v === undefined) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const toStr = (v: unknown) => (v === null || v === undefined ? "" : String(v).trim());

const toRow = (r: ApiRow): AnodizingProductionRow => ({
  anodizingDate: trimDate(r.anodizingdate),
  barBindingDate: trimDate(r.anodizingbarbindingdate),
  rackNo: toStr(r.rackno),
  type: toStr(r.type),
  profileName: toStr(r.profilename),
  length: toNum(r.length),
  totalProductionQty: toNum(r.totalproductionqty),
  rackWiseQty: toStr(r.rackwiseqty),
  surface: toStr(r.surface),
  premiumPackingQty: toNum(r.premiumpackingqty),
  nonBrandPackingQty: toNum(r.nonbrandpackingqty),
  weightBarQty: toNum(r.weightbarqty),
  oneMicron: toNum(r.onemicron),
});

// Anodizing surface swatches — "Bronze" = BLACK in your system
const SURFACE_SWATCHES: Record<string, string> = {
  natural: "#f5f5f4",
  bronze: "#0f172a",
  black: "#0f172a",
  champagne: "#0f172a",
  gold: "#0f172a",
  silver: "#0f172a",
  grey: "#0f172a",
  gray: "#0f172a",
};

const SurfaceSwatch = ({ surface }: { surface: string }) => {
  const s = (surface || "").toLowerCase().trim();
  if (!s) return <span className="text-slate-400">—</span>;
  const hex = SURFACE_SWATCHES[s] || s;
  const isLight = s === "natural";
  return (
    <span className="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
      <span
        className="inline-block h-3.5 w-3.5 rounded-sm border shadow-inner"
        style={{
          backgroundColor: hex,
          borderColor: isLight ? "#cbd5e1" : "rgba(0,0,0,0.2)",
        }}
      />
      <span className="text-[10px] sm:text-xs font-medium text-slate-700 dark:text-slate-200 capitalize">
        {s}
      </span>
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

export default function AnodizingProductionTable({ color = "#00ccff" }: { color?: string }) {
  const [rows, setRows] = useState<AnodizingProductionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [detailRow, setDetailRow] = useState<AnodizingProductionRow | null>(null);

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

  const getDate = useCallback((r: AnodizingProductionRow) => r.anodizingDate, []);
  const { filteredRows: dateFiltered, startDate, endDate, setDateRange } = useDateFilteredRows(rows, getDate);

  const filtered = useMemo(() => {
    if (!search.trim()) return dateFiltered;
    const q = search.toLowerCase();
    return dateFiltered.filter(
      (r) =>
        r.profileName.toLowerCase().includes(q) ||
        r.surface.toLowerCase().includes(q) ||
        r.rackNo.toLowerCase().includes(q) ||
        r.rackWiseQty.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q) ||
        r.anodizingDate.includes(q) ||
        r.barBindingDate.includes(q)
    );
  }, [dateFiltered, search]);

  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, r) => ({
        totalProductionQty: acc.totalProductionQty + r.totalProductionQty,
        premiumPackingQty: acc.premiumPackingQty + r.premiumPackingQty,
        nonBrandPackingQty: acc.nonBrandPackingQty + r.nonBrandPackingQty,
        weightBarQty: acc.weightBarQty + r.weightBarQty,
        oneMicron: acc.oneMicron + r.oneMicron,
      }),
      { totalProductionQty: 0, premiumPackingQty: 0, nonBrandPackingQty: 0, weightBarQty: 0, oneMicron: 0 }
    );
  }, [filtered]);

  return (
    <div className="space-y-3">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
            Anodizing Production Records
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
              placeholder="Search profile, surface, rack..."
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
            filename="anodizing_production"
            color={color}
            disabled={loading || filtered.length === 0}
            getData={() => filtered.map((r) => ({
              AnodizingDate: r.anodizingDate,
              BarBindingDate: r.barBindingDate,
              RackNo: r.rackNo,
              Type: r.type,
              ProfileName: r.profileName,
              Length: r.length,
              TotalProductionQty: r.totalProductionQty,
              RackWiseQty: r.rackWiseQty,
              Surface: r.surface,
              PremiumPackingQty: r.premiumPackingQty,
              NonBrandPackingQty: r.nonBrandPackingQty,
              WeightBarQty: r.weightBarQty,
              OneMicron: r.oneMicron,
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

      {/* Color legend */}
      <div className="flex flex-wrap items-center gap-2 text-[10px]">
        <span className="text-slate-500 dark:text-slate-400">Surface codes:</span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-sm border border-slate-300" style={{ backgroundColor: "#f5f5f4" }}></span>
          <span className="text-slate-600 dark:text-slate-300">Natural = light/transparent</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-sm border" style={{ backgroundColor: "#0f172a" }}></span>
          <span className="text-slate-600 dark:text-slate-300">Bronze/Black/etc. = dark finish</span>
        </span>
      </div>

      {/* Table — 13 columns grouped under 4 sections */}
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
              <th colSpan={6} className="px-2 py-1.5 text-center border-b border-slate-200/50 dark:border-slate-700/50">Identification</th>
              <th colSpan={3} className="px-2 py-1.5 text-center border-b border-l border-slate-200/50 dark:border-slate-700/50">Production</th>
              <th colSpan={4} className="px-2 py-1.5 text-center border-b border-l border-slate-200/50 dark:border-slate-700/50">Packing & Finishing</th>
            </tr>
            <tr
              className="text-left text-[9px] uppercase tracking-wider font-semibold"
              style={{ color: color }}
            >
              <th className="px-1.5 py-1.5">Anodizing<br />Date</th>
              <th className="px-1.5 py-1.5">Bar Binding<br />Date</th>
              <th className="px-1.5 py-1.5 text-center">Rack #</th>
              <th className="px-1.5 py-1.5 text-center">Type</th>
              <th className="px-1.5 py-1.5">Profile</th>
              <th className="px-1.5 py-1.5 text-right">Length</th>

              <th className="px-1.5 py-1.5 text-right border-l border-slate-200/50 dark:border-slate-700/50">Total<br />Prod Qty</th>
              <th className="px-1.5 py-1.5 text-center">Rack<br />Wise Qty</th>
              <th className="px-1.5 py-1.5">Surface</th>

              <th className="px-1.5 py-1.5 text-right border-l border-slate-200/50 dark:border-slate-700/50">Premium<br />Pack</th>
              <th className="px-1.5 py-1.5 text-right">Non-Brand<br />Pack</th>
              <th className="px-1.5 py-1.5 text-right">Weight<br />Bar</th>
              <th className="px-1.5 py-1.5 text-right">One<br />Micron</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/60 dark:divide-slate-700/60">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={13} className="px-3 py-6 text-center text-slate-500 dark:text-slate-400">
                  {error ? "No data — see error above." : "No records found."}
                </td>
              </tr>
            ) : (
              filtered.map((r, i) => (
                <tr
                  key={`${r.anodizingDate}-${r.rackNo}-${r.profileName}-${i}`}
                  onClick={() => setDetailRow(r)}
                  className="cursor-pointer hover:bg-slate-50/60 dark:hover:bg-slate-700/30 transition-colors"
                >
                  <td className="px-1.5 py-1.5 whitespace-nowrap text-slate-700 dark:text-slate-300 font-medium">
                    {r.anodizingDate}
                  </td>
                  <td className="px-1.5 py-1.5 whitespace-nowrap text-slate-700 dark:text-slate-300 font-medium">
                    {r.barBindingDate}
                  </td>
                  <td className="px-1.5 py-1.5 text-center tabular-nums">
                    <span
                      className="px-1.5 py-0.5 rounded font-mono text-[10px] font-bold"
                      style={{ background: `${color}1a`, color }}
                    >
                      {r.rackNo || "—"}
                    </span>
                  </td>
                  <td className="px-1.5 py-1.5 text-center">
                    <span className="text-[9px] font-mono text-slate-600 dark:text-slate-400">{r.type || "—"}</span>
                  </td>
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

                  <td className="px-1.5 py-1.5 text-right tabular-nums font-bold border-l border-slate-200/40 dark:border-slate-700/40" style={{ color }}>
                    {r.totalProductionQty || "—"}
                  </td>
                  <td className="px-1.5 py-1.5 text-center tabular-nums text-slate-600 dark:text-slate-400">
                    {r.rackWiseQty || "—"}
                  </td>
                  <td className="px-1.5 py-1.5"><SurfaceSwatch surface={r.surface} /></td>

                  <td className="px-1.5 py-1.5 text-right tabular-nums font-semibold text-slate-900 dark:text-white border-l border-slate-200/40 dark:border-slate-700/40">
                    {r.premiumPackingQty || "—"}
                  </td>
                  <td className="px-1.5 py-1.5 text-right tabular-nums font-semibold text-slate-900 dark:text-white">
                    {r.nonBrandPackingQty || "—"}
                  </td>
                  <td className="px-1.5 py-1.5 text-right tabular-nums text-slate-700 dark:text-slate-300">
                    {r.weightBarQty || "—"}
                  </td>
                  <td className="px-1.5 py-1.5 text-right tabular-nums text-slate-700 dark:text-slate-300">
                    {r.oneMicron || "—"}
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
                <td className="px-1.5 py-2 text-right tabular-nums border-l border-slate-200/40 dark:border-slate-700/40" style={{ color }}>
                  {totals.totalProductionQty || "—"}
                </td>
                <td colSpan={2}></td>
                <td className="px-1.5 py-2 text-right tabular-nums border-l border-slate-200/40 dark:border-slate-700/40" style={{ color }}>
                  {totals.premiumPackingQty || "—"}
                </td>
                <td className="px-1.5 py-2 text-right tabular-nums" style={{ color }}>
                  {totals.nonBrandPackingQty || "—"}
                </td>
                <td className="px-1.5 py-2 text-right tabular-nums" style={{ color }}>
                  {totals.weightBarQty || "—"}
                </td>
                <td className="px-1.5 py-2 text-right tabular-nums" style={{ color }}>
                  {totals.oneMicron || "—"}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
        Showing <span className="font-semibold">{filtered.length}</span> of{" "}
        <span className="font-semibold">{rows.length}</span> records · Category:{" "}
        <span className="font-mono font-semibold" style={{ color }}>anodizing_prod</span> · Source: Google Apps Script API · Click any row to view details
      </p>

      <RowDetailModal
        open={detailRow !== null}
        onClose={() => setDetailRow(null)}
        title={detailRow?.profileName || "Record Details"}
        subtitle={`Anodizing Production · ${detailRow?.anodizingDate || ""}`}
        color={color}
        data={detailRow ? [
          { label: "Anodizing Date", value: detailRow.anodizingDate, highlight: true },
          { label: "Bar Binding Date", value: detailRow.barBindingDate },
          { label: "Rack No", value: detailRow.rackNo || "—", highlight: true },
          { label: "Type", value: detailRow.type || "—" },
          { label: "Profile Name", value: detailRow.profileName, highlight: true },
          { label: "Length (m)", value: detailRow.length ? detailRow.length.toFixed(2) : "—" },
          { label: "Total Production Qty", value: detailRow.totalProductionQty || "—", highlight: true },
          { label: "Rack Wise Qty", value: detailRow.rackWiseQty || "—" },
          { label: "Surface", value: <SurfaceSwatch surface={detailRow.surface} /> },
          { label: "Premium Pack Qty", value: detailRow.premiumPackingQty || "—" },
          { label: "Non-Brand Pack Qty", value: detailRow.nonBrandPackingQty || "—" },
          { label: "Weight Bar Qty", value: detailRow.weightBarQty || "—" },
          { label: "One Micron", value: detailRow.oneMicron || "—" },
        ] : []}
      />
    </div>
  );
}
