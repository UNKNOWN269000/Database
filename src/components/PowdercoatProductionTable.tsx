import { useState, useEffect, useMemo, useCallback } from "react";
import DateFilter from "./DateFilter";
import RowDetailModal from "./RowDetailModal";
import ExportButton from "./ExportButton";
import { useDateFilteredRows } from "../hooks/useDateFilteredRows";

const API_URL =
  "https://script.google.com/macros/s/AKfycbxahN3PXcPFgt8YY3IU3B07a8s_cSKTU1Q7nzawsiFDh39a3PGQNIlUy-mmhBuuPWzB/exec?category=powdercoat_prod";

// Raw API row — fields guessed from the existing API structure
interface ApiRow {
  entrydatetime?: string;
  extrusiondate?: string;
  pcproductiondate?: string;
  powdercoatproductiondate?: string;
  productiondate?: string;
  colour?: string;
  color?: string;
  bucketno?: number;
  billetbatchno?: number;
  dieno?: number;
  profile?: string;
  type?: string;
  length?: number;
  productionqty?: number;
  qty?: number;
  damageqty?: number;
  totalqty?: number;
}

// Your exact column spec:
// Extrusion Date | Powder Coat Production Date | Colour | Bucket No |
// Billet Batch No | Die No | Profile | Type | Length | Production Qty | Damage Qty | Total Qty
export interface PowdercoatRow {
  extrusionDate: string;
  productionDate: string;
  colour: string;
  bucketNo: number;
  billetBatchNo: number;
  dieNo: number;
  profile: string;
  type: string;
  length: number;
  productionQty: number;
  damageQty: number;
  totalQty: number;
}

const toPowdercoatRow = (r: ApiRow): PowdercoatRow => {
  const trimDate = (v?: string) => (v ? String(v).substring(0, 10) : "");
  const toNum = (v: unknown) => {
    if (v === "" || v === null || v === undefined) return 0;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };
  // bucketno comes as either a number ("22") or a prefixed string ("B-06 ").
  // Strip the prefix and any whitespace so we get a clean numeric.
  const parseBucketNo = (v: unknown) => {
    if (v === "" || v === null || v === undefined) return 0;
    const s = String(v).replace(/^b-/i, "").trim();
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  };

  return {
    extrusionDate: trimDate(r.extrusiondate),
    productionDate: trimDate(
      r.pcproductiondate || r.powdercoatproductiondate || r.productiondate
    ),
    colour: String(r.colour || r.color || "").trim(),
    bucketNo: parseBucketNo(r.bucketno),
    billetBatchNo: toNum(r.billetbatchno),
    dieNo: toNum(r.dieno),
    profile: String(r.profile || "").trim(),
    type: String(r.type || "").trim(),
    length: toNum(r.length),
    productionQty: toNum(r.productionqty ?? r.qty),
    damageQty: toNum(r.damageqty),
    totalQty: toNum(r.totalqty),
  };
};

// Map a color name (or hex) to a swatch background + readable text
const COLOUR_SWATCHES: Record<string, string> = {
  black: "#0f172a",
  white: "#f8fafc",
  grey: "#64748b",
  gray: "#64748b",
  silver: "#cbd5e1",
  bronze: "#92400e",
  brown: "#78350f",
  red: "#dc2626",
  green: "#16a34a",
  blue: "#2563eb",
  navy: "#1e3a8a",
  yellow: "#eab308",
  ivory: "#fef3c7",
  champagne: "#fbbf24",
  walnut: "#5b3a29",
  oak: "#a16207",
  pine: "#65a30d",
  teak: "#9a3412",
  mahogany: "#7c2d12",
  beige: "#d6c6a8",
  cream: "#fef9e7",
  anthracite: "#1f2937",
};

const ColourSwatch = ({ colour }: { colour: string }) => {
  const c = (colour || "").toLowerCase().trim();
  if (!c) return <span className="text-slate-400">—</span>;
  const hex = COLOUR_SWATCHES[c] || c;
  return (
    <span className="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
      <span
        className="inline-block h-3.5 w-3.5 rounded-sm border border-slate-300 dark:border-slate-600 shadow-inner"
        style={{ backgroundColor: hex }}
      />
      <span className="text-[10px] sm:text-xs font-medium text-slate-700 dark:text-slate-200 capitalize">
        {c}
      </span>
    </span>
  );
};

const SkeletonRow = () => (
  <tr>
    {Array.from({ length: 12 }).map((_, i) => (
      <td key={i} className="px-2 py-2">
        <div className="h-3 rounded bg-slate-200/70 dark:bg-slate-700/50 animate-pulse"></div>
      </td>
    ))}
  </tr>
);

export default function PowdercoatProductionTable({ color = "#ff00ff" }: { color?: string }) {
  const [rows, setRows] = useState<PowdercoatRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [detailRow, setDetailRow] = useState<PowdercoatRow | null>(null);

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
      const mapped = (data as ApiRow[]).map(toPowdercoatRow);
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

  // Date filter operates on Production Date (the primary date for this module)
  const getDate = useCallback((r: PowdercoatRow) => r.productionDate, []);
  const { filteredRows: dateFiltered, startDate, endDate, setDateRange } = useDateFilteredRows(rows, getDate);

  const filtered = useMemo(() => {
    if (!search.trim()) return dateFiltered;
    const q = search.toLowerCase();
    return dateFiltered.filter(
      (r) =>
        r.profile.toLowerCase().includes(q) ||
        r.colour.toLowerCase().includes(q) ||
        String(r.bucketNo).includes(q) ||
        String(r.billetBatchNo).includes(q) ||
        r.type.toLowerCase().includes(q) ||
        r.extrusionDate.includes(q) ||
        r.productionDate.includes(q)
    );
  }, [dateFiltered, search]);

  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, r) => ({
        productionQty: acc.productionQty + r.productionQty,
        damageQty: acc.damageQty + r.damageQty,
        totalQty: acc.totalQty + r.totalQty,
      }),
      { productionQty: 0, damageQty: 0, totalQty: 0 }
    );
  }, [filtered]);

  return (
    <div className="space-y-3">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
            Powdercoat Production Records
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
              placeholder="Search profile, colour, bucket..."
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
            filename="powdercoat_production"
            color={color}
            disabled={loading || filtered.length === 0}
            getData={() => filtered.map((r) => ({
              ExtrusionDate: r.extrusionDate,
              ProductionDate: r.productionDate,
              Colour: r.colour,
              BucketNo: r.bucketNo,
              BilletBatch: r.billetBatchNo,
              DieNo: r.dieNo,
              Profile: r.profile,
              Type: r.type,
              Length: r.length,
              ProductionQty: r.productionQty,
              DamageQty: r.damageQty,
              TotalQty: r.totalQty,
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
              <th className="px-2 py-2">Extrusion<br />Date</th>
              <th className="px-2 py-2">PC Prod.<br />Date</th>
              <th className="px-2 py-2">Colour</th>
              <th className="px-2 py-2 text-right">Bucket<br />No</th>
              <th className="px-2 py-2 text-right">Billet<br />Batch</th>
              <th className="px-2 py-2 text-right">Die<br />No</th>
              <th className="px-2 py-2">Profile</th>
              <th className="px-2 py-2 text-center">Type</th>
              <th className="px-2 py-2 text-right">Length<br />(m)</th>
              <th className="px-2 py-2 text-right">Prod.<br />Qty</th>
              <th className="px-2 py-2 text-right">Damage<br />Qty</th>
              <th className="px-2 py-2 text-right">Total<br />Qty</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/60 dark:divide-slate-700/60">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={12} className="px-3 py-6 text-center text-slate-500 dark:text-slate-400">
                  {error ? "No data — see error above." : "No records found."}
                </td>
              </tr>
            ) : (
              filtered.map((r, i) => (
                <tr
                  key={`${r.bucketNo}-${r.billetBatchNo}-${i}`}
                  onClick={() => setDetailRow(r)}
                  className="cursor-pointer hover:bg-slate-50/60 dark:hover:bg-slate-700/30 transition-colors"
                >
                  <td className="px-2 py-1.5 whitespace-nowrap text-slate-700 dark:text-slate-300 font-medium">
                    {r.extrusionDate}
                  </td>
                  <td className="px-2 py-1.5 whitespace-nowrap text-slate-700 dark:text-slate-300 font-medium">
                    {r.productionDate}
                  </td>
                  <td className="px-2 py-1.5"><ColourSwatch colour={r.colour} /></td>
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
                  <td className="px-2 py-1.5 text-right tabular-nums text-slate-700 dark:text-slate-300 font-medium">
                    {r.billetBatchNo || "—"}
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums text-slate-700 dark:text-slate-300">
                    {r.dieNo || "—"}
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
                  <td className="px-2 py-1.5 text-center">
                    <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400">
                      {r.type || "—"}
                    </span>
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums text-slate-700 dark:text-slate-300">
                    {r.length ? r.length.toFixed(2) : "—"}
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums font-semibold text-slate-900 dark:text-white">
                    {r.productionQty}
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
                  <td className="px-2 py-1.5 text-right tabular-nums font-bold" style={{ color }}>
                    {r.totalQty}
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
                <td colSpan={9} className="px-2 py-2 text-right uppercase tracking-wider" style={{ color }}>
                  Totals
                </td>
                <td className="px-2 py-2 text-right tabular-nums" style={{ color }}>
                  {totals.productionQty}
                </td>
                <td className="px-2 py-2 text-right tabular-nums" style={{ color }}>
                  {totals.damageQty}
                </td>
                <td className="px-2 py-2 text-right tabular-nums" style={{ color }}>
                  {totals.totalQty}
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
        <span className="font-mono font-semibold" style={{ color }}>powdercoat_prod</span> · Source: Google Apps Script API · Click any row to view details
      </p>

      <RowDetailModal
        open={detailRow !== null}
        onClose={() => setDetailRow(null)}
        title={detailRow?.profile || "Record Details"}
        subtitle={`Powdercoat Production · ${detailRow?.productionDate || ""}`}
        color={color}
        data={detailRow ? [
          { label: "Extrusion Date", value: detailRow.extrusionDate },
          { label: "Production Date", value: detailRow.productionDate, highlight: true },
          { label: "Profile", value: detailRow.profile, highlight: true },
          { label: "Colour", value: <ColourSwatch colour={detailRow.colour} />, highlight: true },
          { label: "Bucket No", value: `#${detailRow.bucketNo}` },
          { label: "Billet Batch", value: detailRow.billetBatchNo || "—" },
          { label: "Die No", value: detailRow.dieNo || "—" },
          { label: "Type", value: detailRow.type || "—" },
          { label: "Length (m)", value: detailRow.length ? detailRow.length.toFixed(2) : "—" },
          { label: "Production Qty", value: detailRow.productionQty, highlight: true },
          { label: "Damage Qty", value: detailRow.damageQty > 0 ? detailRow.damageQty : "0" },
          { label: "Total Qty", value: detailRow.totalQty, highlight: true },
        ] : []}
      />
    </div>
  );
}
