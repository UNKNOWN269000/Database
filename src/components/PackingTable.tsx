import { useState, useEffect, useMemo, useCallback } from "react";
import DateFilter from "./DateFilter";
import RowDetailModal from "./RowDetailModal";
import ExportButton from "./ExportButton";
import { useDateFilteredRows } from "../hooks/useDateFilteredRows";

const BASE_API =
  "https://script.google.com/macros/s/AKfycbxahN3PXcPFgt8YY3IU3B07a8s_cSKTU1Q7nzawsiFDh39a3PGQNIlUy-mmhBuuPWzB/exec";

export type PackingCategory = "powdercoat_pack" | "woodfinish_pack" | "anodizing_pack";

// Raw API row (after header normalization)
interface ApiRow {
  entrydatetime?: string;
  productiondate?: string;
  packingdate?: string;
  bucketnumber?: number | string;
  productiontype?: string;
  type?: string;
  color?: string;
  surface?: string;
  profilename?: string;
  length?: number;
  // Premium (Full Pack)
  premiumpacknumberfullpack?: string | number;
  premiumonebundleqtyfullpack?: number;
  premiumtotalbundlefullpack?: number;
  premiumtotalqtyfullpack?: number;
  premiumaverageweightfullpack?: number;
  // Premium (Pcs)
  premiumpacknumberpcs?: string | number;
  premiumbundleqtypcs?: number;
  premiumtotalqtypcs?: number;
  premiumaverageweightpcs?: number;
  // Non-Brand (Full Pack)
  nonbrandpacknumberfullpack?: string | number;
  nonbrandonebundleqtyfullpack?: number;
  nonbrandtotalbundlefullpack?: number;
  nonbrandtotalqtyfullpack?: number;
  nonbrandaverageweightfullpack?: number;
  // Non-Brand (Pcs)
  nonbrandpacknumberpcs?: string | number;
  nonbrandbundleqtypcs?: number;
  nonbrandtotalqtypcs?: number;
  nonbrandaverageweightpcs?: number;
  // Weight Bar
  weightbarpacknumber?: string | number;
  weightbartotalqty?: number;
  weightbaraverageweight?: number;
  // Other
  repowderbarqty?: number;
  premiumtotalpacking?: number;
  nonbrandtotalpacking?: number;
  weightbartotalpacking?: number;
  totalpremiumweight?: number;
  totalnonbrandweight?: number;
  weightbarweight?: number;
}

export interface PackingRow {
  productionDate: string;
  packingDate: string;
  bucketNumber: number;
  productionType: string;
  color: string;
  profileName: string;
  length: number;
  // Premium Full
  ppNumFull: string;
  ppOneBundleFull: number;
  ppTotalBundleFull: number;
  ppTotalQtyFull: number;
  ppAvgWtFull: number;
  // Premium Pcs
  ppNumPcs: string;
  ppBundleQtyPcs: number;
  ppTotalQtyPcs: number;
  ppAvgWtPcs: number;
  // Non-Brand Full
  nbNumFull: string;
  nbOneBundleFull: number;
  nbTotalBundleFull: number;
  nbTotalQtyFull: number;
  nbAvgWtFull: number;
  // Non-Brand Pcs
  nbNumPcs: string;
  nbBundleQtyPcs: number;
  nbTotalQtyPcs: number;
  nbAvgWtPcs: number;
  // Weight Bar
  wbNum: string;
  wbTotalQty: number;
  wbAvgWt: number;
  // Totals
  rePowderBarQty: number;
  premiumTotalPacking: number;
  nonBrandTotalPacking: number;
  weightBarTotalPacking: number;
  totalPremiumWeight: number;
  totalNonBrandWeight: number;
  weightBarWeight: number;
}

const trimDate = (v?: string) => (v ? String(v).substring(0, 10) : "");
const toNum = (v: unknown) => {
  if (v === "" || v === null || v === undefined) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const toStr = (v: unknown) => (v === null || v === undefined ? "" : String(v).trim());

const toPackingRow = (r: ApiRow): PackingRow => {
  // bucketnumber is sometimes prefixed like "B-12 " - strip it
  const parseBucket = (v: unknown) => {
    if (v === "" || v === null || v === undefined) return 0;
    const s = String(v).replace(/^b-/i, "").trim();
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  };
  return {
    productionDate: trimDate(r.productiondate),
    packingDate: trimDate(r.packingdate),
    bucketNumber: parseBucket(r.bucketnumber),
    productionType: toStr(r.productiontype || r.type),
    color: toStr(r.color || r.surface),
    profileName: toStr(r.profilename),
    length: toNum(r.length),
    ppNumFull: toStr(r.premiumpacknumberfullpack),
    ppOneBundleFull: toNum(r.premiumonebundleqtyfullpack),
    ppTotalBundleFull: toNum(r.premiumtotalbundlefullpack),
    ppTotalQtyFull: toNum(r.premiumtotalqtyfullpack),
    ppAvgWtFull: toNum(r.premiumaverageweightfullpack),
    ppNumPcs: toStr(r.premiumpacknumberpcs),
    ppBundleQtyPcs: toNum(r.premiumbundleqtypcs),
    ppTotalQtyPcs: toNum(r.premiumtotalqtypcs),
    ppAvgWtPcs: toNum(r.premiumaverageweightpcs),
    nbNumFull: toStr(r.nonbrandpacknumberfullpack),
    nbOneBundleFull: toNum(r.nonbrandonebundleqtyfullpack),
    nbTotalBundleFull: toNum(r.nonbrandtotalbundlefullpack),
    nbTotalQtyFull: toNum(r.nonbrandtotalqtyfullpack),
    nbAvgWtFull: toNum(r.nonbrandaverageweightfullpack),
    nbNumPcs: toStr(r.nonbrandpacknumberpcs),
    nbBundleQtyPcs: toNum(r.nonbrandbundleqtypcs),
    nbTotalQtyPcs: toNum(r.nonbrandtotalqtypcs),
    nbAvgWtPcs: toNum(r.nonbrandaverageweightpcs),
    wbNum: toStr(r.weightbarpacknumber),
    wbTotalQty: toNum(r.weightbartotalqty),
    wbAvgWt: toNum(r.weightbaraverageweight),
    rePowderBarQty: toNum(r.repowderbarqty),
    premiumTotalPacking: toNum(r.premiumtotalpacking),
    nonBrandTotalPacking: toNum(r.nonbrandtotalpacking),
    weightBarTotalPacking: toNum(r.weightbartotalpacking),
    totalPremiumWeight: toNum(r.totalpremiumweight),
    totalNonBrandWeight: toNum(r.totalnonbrandweight),
    weightBarWeight: toNum(r.weightbarweight),
  };
};

// Powder-coat & wood colour swatches (default palette)
const COLOUR_SWATCHES_DEFAULT: Record<string, string> = {
  black: "#0f172a", white: "#f8fafc", grey: "#64748b", gray: "#64748b",
  silver: "#cbd5e1", bronze: "#92400e", brown: "#78350f", red: "#dc2626",
  green: "#16a34a", blue: "#2563eb", navy: "#1e3a8a", yellow: "#eab308",
  ivory: "#fef3c7", champagne: "#fbbf24", walnut: "#5b3a29", oak: "#a16207",
  pine: "#65a30d", teak: "#9a3412", mahogany: "#7c2d12",
  beige: "#d6c6a8", cream: "#fef9e7", anthracite: "#1f2937",
};

// Anodizing surface swatches — in your system, "Bronze" = BLACK finish
// (not brownish). All non-natural colours render as dark.
const ANODIZING_SWATCHES: Record<string, string> = {
  natural: "#f5f5f4",     // light/transparent anodizing
  bronze: "#0f172a",      // = BLACK in your system
  black: "#0f172a",
  champagne: "#0f172a",
  gold: "#0f172a",
  silver: "#0f172a",
  grey: "#0f172a",
  gray: "#0f172a",
};

// Resolve the swatch colour for a given surface name + category
const resolveSwatchHex = (category: PackingCategory, name: string): string => {
  const c = (name || "").toLowerCase().trim();
  if (!c) return "#000000";
  if (category === "anodizing_pack") {
    return ANODIZING_SWATCHES[c] || ANODIZING_SWATCHES.bronze; // unknown → default to black
  }
  return COLOUR_SWATCHES_DEFAULT[c] || c;
};

const ColourSwatch = ({ colour, category }: { colour: string; category?: PackingCategory }) => {
  const c = (colour || "").toLowerCase().trim();
  if (!c) return <span className="text-slate-400">—</span>;
  const hex = category ? resolveSwatchHex(category, c) : COLOUR_SWATCHES_DEFAULT[c] || c;
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

// Render a numeric cell with optional decimal places; "—" if 0/empty
const Num = ({ value, decimals = 0, color, bold = false }: { value: number; decimals?: number; color?: string; bold?: boolean }) => {
  if (!value) return <span className="text-slate-400">—</span>;
  return (
    <span
      className={`tabular-nums ${bold ? "font-bold" : "font-semibold"}`}
      style={color ? { color } : undefined}
    >
      {value.toFixed(decimals)}
    </span>
  );
};

const SkeletonRow = ({ cols }: { cols: number }) => (
  <tr>
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-2 py-2">
        <div className="h-3 rounded bg-slate-200/70 dark:bg-slate-700/50 animate-pulse"></div>
      </td>
    ))}
  </tr>
);

interface PackingTableProps {
  category: PackingCategory;
  color: string;
  title: string;
  /** Whether to show the Bucket column. Defaults to true. Anodizing Packing sets this to false. */
  showBucket?: boolean;
}

export default function PackingTable({ category, color, title, showBucket = true }: PackingTableProps) {
  const [rows, setRows] = useState<PackingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [detailRow, setDetailRow] = useState<PackingRow | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_API}?category=${category}`, { method: "GET" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ApiRow[] | { status: string; message: string } = await res.json();
      if (!Array.isArray(data)) {
        const errObj = data as { status: string; message: string };
        throw Error(errObj.message || "Unexpected response from API");
      }
      const mapped = (data as ApiRow[]).map(toPackingRow);
      setRows(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  // Date filter operates on Packing Date (the most recent operation per row)
  const getDate = useCallback((r: PackingRow) => r.packingDate, []);
  const { filteredRows: dateFiltered, startDate, endDate, setDateRange } = useDateFilteredRows(rows, getDate);

  const filtered = useMemo(() => {
    if (!search.trim()) return dateFiltered;
    const q = search.toLowerCase();
    return dateFiltered.filter(
      (r) =>
        r.profileName.toLowerCase().includes(q) ||
        r.color.toLowerCase().includes(q) ||
        r.productionType.toLowerCase().includes(q) ||
        (showBucket && String(r.bucketNumber).includes(q)) ||
        r.productionDate.includes(q) ||
        r.packingDate.includes(q)
    );
  }, [dateFiltered, search, showBucket]);

  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, r) => ({
        ppTotalQtyFull: acc.ppTotalQtyFull + r.ppTotalQtyFull,
        ppTotalQtyPcs: acc.ppTotalQtyPcs + r.ppTotalQtyPcs,
        nbTotalQtyFull: acc.nbTotalQtyFull + r.nbTotalQtyFull,
        nbTotalQtyPcs: acc.nbTotalQtyPcs + r.nbTotalQtyPcs,
        wbTotalQty: acc.wbTotalQty + r.wbTotalQty,
        premiumTotalPacking: acc.premiumTotalPacking + r.premiumTotalPacking,
        nonBrandTotalPacking: acc.nonBrandTotalPacking + r.nonBrandTotalPacking,
        weightBarTotalPacking: acc.weightBarTotalPacking + r.weightBarTotalPacking,
        totalPremiumWeight: acc.totalPremiumWeight + r.totalPremiumWeight,
        totalNonBrandWeight: acc.totalNonBrandWeight + r.totalNonBrandWeight,
        weightBarWeight: acc.weightBarWeight + r.weightBarWeight,
      }),
      {
        ppTotalQtyFull: 0, ppTotalQtyPcs: 0, nbTotalQtyFull: 0,
        nbTotalQtyPcs: 0, wbTotalQty: 0,
        premiumTotalPacking: 0, nonBrandTotalPacking: 0, weightBarTotalPacking: 0,
        totalPremiumWeight: 0, totalNonBrandWeight: 0, weightBarWeight: 0,
      }
    );
  }, [filtered]);

  const numCols = showBucket ? 36 : 35;

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Header bar — stays fixed at the top while the table area scrolls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 flex-shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
            {title} Records
          </h3>
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap"
            style={{ background: `${color}1a`, borderColor: `${color}55`, color }}
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
              placeholder={`Search profile, color${showBucket ? ", bucket" : ""}...`}
              className="w-full sm:w-64 pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:border-transparent transition"
              style={{ outlineColor: color }}
            />
          </div>
          <DateFilter
            startDate={startDate}
            endDate={endDate}
            onChange={setDateRange}
            color={color}
            dataDates={rows.map((r) => r.packingDate).filter(Boolean)}
          />
          <ExportButton
            filename={category === "anodizing_pack" ? "anodizing_packing" : "powdercoat_packing"}
            color={color}
            disabled={loading || filtered.length === 0}
            getData={() => filtered.map((r) => {
              const data: Record<string, unknown> = {
                ProductionDate: r.productionDate,
                PackingDate: r.packingDate,
                ProductionType: r.productionType,
                Surface: r.color,
                ProfileName: r.profileName,
                Length: r.length,
              };
              if (showBucket) data.BucketNo = r.bucketNumber;
              return {
                ...data,
                PremiumPackNumberFullPack: r.ppNumFull,
                PremiumOneBundleQtyFullPack: r.ppOneBundleFull,
                PremiumTotalBundleFullPack: r.ppTotalBundleFull,
                PremiumTotalQtyFullPack: r.ppTotalQtyFull,
                PremiumAverageWeightFullPack: r.ppAvgWtFull,
                PremiumPackNumberPcs: r.ppNumPcs,
                PremiumBundleQtyPcs: r.ppBundleQtyPcs,
                PremiumTotalQtyPcs: r.ppTotalQtyPcs,
                PremiumAverageWeightPcs: r.ppAvgWtPcs,
                NonBrandPackNumberFullPack: r.nbNumFull,
                NonBrandOneBundleQtyFullPack: r.nbOneBundleFull,
                NonBrandTotalBundleFullPack: r.nbTotalBundleFull,
                NonBrandTotalQtyFullPack: r.nbTotalQtyFull,
                NonBrandAverageWeightFullPack: r.nbAvgWtFull,
                NonBrandPackNumberPcs: r.nbNumPcs,
                NonBrandBundleQtyPcs: r.nbBundleQtyPcs,
                NonBrandTotalQtyPcs: r.nbTotalQtyPcs,
                NonBrandAverageWeightPcs: r.nbAvgWtPcs,
                WeightBarPackNumber: r.wbNum,
                WeightBarTotalQty: r.wbTotalQty,
                WeightBarAverageWeight: r.wbAvgWt,
                RePowderBarQty: r.rePowderBarQty,
                PremiumTotalPacking: r.premiumTotalPacking,
                NonBrandTotalPacking: r.nonBrandTotalPacking,
                WeightBarTotalPacking: r.weightBarTotalPacking,
                TotalPremiumWeight: r.totalPremiumWeight,
                TotalNonBrandWeight: r.totalNonBrandWeight,
                WeightBarWeight: r.weightBarWeight,
              };
            })}
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

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-2 text-[10px]">
        <span className="px-1.5 py-0.5 rounded font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">PP</span>
        <span className="text-slate-500 dark:text-slate-400">= Premium Pack</span>
        <span className="px-1.5 py-0.5 rounded font-bold bg-slate-500/20 text-slate-700 dark:text-slate-300 border border-slate-500/30">NB</span>
        <span className="text-slate-500 dark:text-slate-400">= Non-Brand</span>
        <span className="px-1.5 py-0.5 rounded font-bold bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30">WB</span>
        <span className="text-slate-500 dark:text-slate-400">= Weight Bar</span>
      </div>

      {/* Table — grouped by section for readability. Only region that scrolls. */}
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
              <th colSpan={showBucket ? 7 : 6} className="px-2 py-1.5 text-center border-b border-slate-200/50 dark:border-slate-700/50">Identification</th>
              <th colSpan={5} className="px-2 py-1.5 text-center border-b border-l border-slate-200/50 dark:border-slate-700/50">Premium (Full Pack)</th>
              <th colSpan={4} className="px-2 py-1.5 text-center border-b border-l border-slate-200/50 dark:border-slate-700/50">Premium (Pcs)</th>
              <th colSpan={5} className="px-2 py-1.5 text-center border-b border-l border-slate-200/50 dark:border-slate-700/50">Non-Brand (Full)</th>
              <th colSpan={4} className="px-2 py-1.5 text-center border-b border-l border-slate-200/50 dark:border-slate-700/50">Non-Brand (Pcs)</th>
              <th colSpan={3} className="px-2 py-1.5 text-center border-b border-l border-slate-200/50 dark:border-slate-700/50">Weight Bar</th>
              <th colSpan={8} className="px-2 py-1.5 text-center border-b border-l border-slate-200/50 dark:border-slate-700/50">Totals</th>
            </tr>
            <tr
              className="text-left text-[9px] uppercase tracking-wider font-semibold"
              style={{ color: color }}
            >
              <th className="px-1.5 py-1.5">Prod.<br />Date</th>
              <th className="px-1.5 py-1.5">Pack<br />Date</th>
              {showBucket && <th className="px-1.5 py-1.5 text-right">Bucket</th>}
              <th className="px-1.5 py-1.5">Type</th>
              <th className="px-1.5 py-1.5">Color</th>
              <th className="px-1.5 py-1.5">Profile</th>
              <th className="px-1.5 py-1.5 text-right">Length</th>

              <th className="px-1.5 py-1.5 text-center border-l border-slate-200/50 dark:border-slate-700/50">PP<br />#</th>
              <th className="px-1.5 py-1.5 text-right">1B<br />Qty</th>
              <th className="px-1.5 py-1.5 text-right">Total<br />Bndl</th>
              <th className="px-1.5 py-1.5 text-right">Total<br />Qty</th>
              <th className="px-1.5 py-1.5 text-right">Avg<br />Wt</th>

              <th className="px-1.5 py-1.5 text-center border-l border-slate-200/50 dark:border-slate-700/50">PP<br />#</th>
              <th className="px-1.5 py-1.5 text-right">Bndl<br />Qty</th>
              <th className="px-1.5 py-1.5 text-right">Total<br />Qty</th>
              <th className="px-1.5 py-1.5 text-right">Avg<br />Wt</th>

              <th className="px-1.5 py-1.5 text-center border-l border-slate-200/50 dark:border-slate-700/50">NB<br />#</th>
              <th className="px-1.5 py-1.5 text-right">1B<br />Qty</th>
              <th className="px-1.5 py-1.5 text-right">Total<br />Bndl</th>
              <th className="px-1.5 py-1.5 text-right">Total<br />Qty</th>
              <th className="px-1.5 py-1.5 text-right">Avg<br />Wt</th>

              <th className="px-1.5 py-1.5 text-center border-l border-slate-200/50 dark:border-slate-700/50">NB<br />#</th>
              <th className="px-1.5 py-1.5 text-right">Bndl<br />Qty</th>
              <th className="px-1.5 py-1.5 text-right">Total<br />Qty</th>
              <th className="px-1.5 py-1.5 text-right">Avg<br />Wt</th>

              <th className="px-1.5 py-1.5 text-center border-l border-slate-200/50 dark:border-slate-700/50">WB<br />#</th>
              <th className="px-1.5 py-1.5 text-right">Total<br />Qty</th>
              <th className="px-1.5 py-1.5 text-right">Avg<br />Wt</th>

              <th className="px-1.5 py-1.5 text-right border-l border-slate-200/50 dark:border-slate-700/50">Re<br />Pwd</th>
              <th className="px-1.5 py-1.5 text-right">PP<br />Total</th>
              <th className="px-1.5 py-1.5 text-right">NB<br />Total</th>
              <th className="px-1.5 py-1.5 text-right">WB<br />Total</th>
              <th className="px-1.5 py-1.5 text-right">Total<br />PP Wt</th>
              <th className="px-1.5 py-1.5 text-right">Total<br />NB Wt</th>
              <th className="px-1.5 py-1.5 text-right">WB<br />Wt</th>
              <th className="px-1.5 py-1.5 text-right">Sum<br />All</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/60 dark:divide-slate-700/60">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} cols={numCols} />)
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={numCols} className="px-3 py-6 text-center text-slate-500 dark:text-slate-400">
                  {error ? "No data — see error above." : "No records found."}
                </td>
              </tr>
            ) : (
              filtered.map((r, i) => {
                const sumAll = r.totalPremiumWeight + r.totalNonBrandWeight + r.weightBarWeight;
                return (
                  <tr
                    key={`${r.productionDate}-${r.bucketNumber}-${i}`}
                    onClick={() => setDetailRow(r)}
                    className="cursor-pointer hover:bg-slate-50/60 dark:hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="px-1.5 py-1.5 whitespace-nowrap text-slate-700 dark:text-slate-300 font-medium">{r.productionDate}</td>
                    <td className="px-1.5 py-1.5 whitespace-nowrap text-slate-700 dark:text-slate-300 font-medium">{r.packingDate}</td>
                    {showBucket && (
                      <td className="px-1.5 py-1.5 text-right tabular-nums">
                        <span className="px-1 py-0.5 rounded font-mono text-[9px] font-bold" style={{ background: `${color}1a`, color }}>
                          #{r.bucketNumber}
                        </span>
                      </td>
                    )}
                    <td className="px-1.5 py-1.5 text-center">
                      <span className="text-[9px] font-mono text-slate-600 dark:text-slate-400">{r.productionType || "—"}</span>
                    </td>
                    <td className="px-1.5 py-1.5"><ColourSwatch colour={r.color} category={category} /></td>
                    <td className="px-1.5 py-1.5 whitespace-nowrap">
                      <span className="px-1 py-0.5 rounded font-mono text-[9px] font-semibold" style={{ background: `${color}1a`, color }}>
                        {r.profileName}
                      </span>
                    </td>
                    <td className="px-1.5 py-1.5 text-right tabular-nums text-slate-700 dark:text-slate-300">{r.length ? r.length.toFixed(2) : "—"}</td>

                    <td className="px-1.5 py-1.5 text-center tabular-nums text-slate-600 dark:text-slate-400 border-l border-slate-200/40 dark:border-slate-700/40">{r.ppNumFull || "—"}</td>
                    <td className="px-1.5 py-1.5 text-right"><Num value={r.ppOneBundleFull} /></td>
                    <td className="px-1.5 py-1.5 text-right"><Num value={r.ppTotalBundleFull} /></td>
                    <td className="px-1.5 py-1.5 text-right"><Num value={r.ppTotalQtyFull} bold /></td>
                    <td className="px-1.5 py-1.5 text-right"><Num value={r.ppAvgWtFull} decimals={2} /></td>

                    <td className="px-1.5 py-1.5 text-center tabular-nums text-slate-600 dark:text-slate-400 border-l border-slate-200/40 dark:border-slate-700/40">{r.ppNumPcs || "—"}</td>
                    <td className="px-1.5 py-1.5 text-right"><Num value={r.ppBundleQtyPcs} /></td>
                    <td className="px-1.5 py-1.5 text-right"><Num value={r.ppTotalQtyPcs} bold /></td>
                    <td className="px-1.5 py-1.5 text-right"><Num value={r.ppAvgWtPcs} decimals={2} /></td>

                    <td className="px-1.5 py-1.5 text-center tabular-nums text-slate-600 dark:text-slate-400 border-l border-slate-200/40 dark:border-slate-700/40">{r.nbNumFull || "—"}</td>
                    <td className="px-1.5 py-1.5 text-right"><Num value={r.nbOneBundleFull} /></td>
                    <td className="px-1.5 py-1.5 text-right"><Num value={r.nbTotalBundleFull} /></td>
                    <td className="px-1.5 py-1.5 text-right"><Num value={r.nbTotalQtyFull} bold /></td>
                    <td className="px-1.5 py-1.5 text-right"><Num value={r.nbAvgWtFull} decimals={2} /></td>

                    <td className="px-1.5 py-1.5 text-center tabular-nums text-slate-600 dark:text-slate-400 border-l border-slate-200/40 dark:border-slate-700/40">{r.nbNumPcs || "—"}</td>
                    <td className="px-1.5 py-1.5 text-right"><Num value={r.nbBundleQtyPcs} /></td>
                    <td className="px-1.5 py-1.5 text-right"><Num value={r.nbTotalQtyPcs} bold /></td>
                    <td className="px-1.5 py-1.5 text-right"><Num value={r.nbAvgWtPcs} decimals={2} /></td>

                    <td className="px-1.5 py-1.5 text-center tabular-nums text-slate-600 dark:text-slate-400 border-l border-slate-200/40 dark:border-slate-700/40">{r.wbNum || "—"}</td>
                    <td className="px-1.5 py-1.5 text-right"><Num value={r.wbTotalQty} bold /></td>
                    <td className="px-1.5 py-1.5 text-right"><Num value={r.wbAvgWt} decimals={2} /></td>

                    <td className="px-1.5 py-1.5 text-right tabular-nums text-rose-600 dark:text-rose-400 border-l border-slate-200/40 dark:border-slate-700/40 font-semibold">{r.rePowderBarQty || "—"}</td>
                    <td className="px-1.5 py-1.5 text-right"><Num value={r.premiumTotalPacking} bold /></td>
                    <td className="px-1.5 py-1.5 text-right"><Num value={r.nonBrandTotalPacking} bold /></td>
                    <td className="px-1.5 py-1.5 text-right"><Num value={r.weightBarTotalPacking} bold /></td>
                    <td className="px-1.5 py-1.5 text-right"><Num value={r.totalPremiumWeight} decimals={2} bold color={color} /></td>
                    <td className="px-1.5 py-1.5 text-right"><Num value={r.totalNonBrandWeight} decimals={2} bold color={color} /></td>
                    <td className="px-1.5 py-1.5 text-right"><Num value={r.weightBarWeight} decimals={2} bold color={color} /></td>
                    <td className="px-1.5 py-1.5 text-right tabular-nums font-bold" style={{ color }}>
                      {sumAll ? sumAll.toFixed(2) : "—"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          {!loading && filtered.length > 0 && (
            <tfoot>
              <tr
                className="font-bold text-[10px] sm:text-xs border-t-2"
                style={{ background: `${color}0d`, borderColor: `${color}55` }}
              >
                <td colSpan={showBucket ? 10 : 9} className="px-2 py-2 text-right uppercase tracking-wider" style={{ color }}>Totals</td>
                <td className="px-1.5 py-2 text-right tabular-nums" style={{ color }}>{totals.ppTotalQtyFull || "—"}</td>
                <td colSpan={3}></td>
                <td className="px-1.5 py-2 text-right tabular-nums" style={{ color }}>{totals.ppTotalQtyPcs || "—"}</td>
                <td colSpan={4}></td>
                <td className="px-1.5 py-2 text-right tabular-nums" style={{ color }}>{totals.nbTotalQtyFull || "—"}</td>
                <td colSpan={3}></td>
                <td className="px-1.5 py-2 text-right tabular-nums" style={{ color }}>{totals.nbTotalQtyPcs || "—"}</td>
                <td colSpan={2}></td>
                <td className="px-1.5 py-2 text-right tabular-nums" style={{ color }}>{totals.wbTotalQty || "—"}</td>
                <td className="px-1.5 py-2" style={{ color }}></td>
                <td className="px-1.5 py-2 text-right tabular-nums" style={{ color }}>{totals.premiumTotalPacking || "—"}</td>
                <td className="px-1.5 py-2 text-right tabular-nums" style={{ color }}>{totals.nonBrandTotalPacking || "—"}</td>
                <td className="px-1.5 py-2 text-right tabular-nums" style={{ color }}>{totals.weightBarTotalPacking || "—"}</td>
                <td className="px-1.5 py-2 text-right tabular-nums" style={{ color }}>{totals.totalPremiumWeight.toFixed(2)}</td>
                <td className="px-1.5 py-2 text-right tabular-nums" style={{ color }}>{totals.totalNonBrandWeight.toFixed(2)}</td>
                <td className="px-1.5 py-2 text-right tabular-nums" style={{ color }}>{totals.weightBarWeight.toFixed(2)}</td>
                <td className="px-1.5 py-2 text-right tabular-nums" style={{ color }}>
                  {(totals.totalPremiumWeight + totals.totalNonBrandWeight + totals.weightBarWeight).toFixed(2)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
        Showing <span className="font-semibold">{filtered.length}</span> of{" "}
        <span className="font-semibold">{rows.length}</span> records · Category:{" "}
        <span className="font-mono font-semibold" style={{ color }}>{category}</span> · Source: Google Apps Script API · Click any row to view details
      </p>

      <RowDetailModal
        open={detailRow !== null}
        onClose={() => setDetailRow(null)}
        title={detailRow?.profileName || "Record Details"}
        subtitle={`${title} · ${detailRow?.packingDate || ""}`}
        color={color}
        data={detailRow ? [
          { label: "Production Date", value: detailRow.productionDate },
          { label: "Packing Date", value: detailRow.packingDate, highlight: true },
          ...(showBucket ? [{ label: "Bucket No", value: `#${detailRow.bucketNumber || "—"}` }] : []),
          { label: "Production Type", value: detailRow.productionType || "—" },
          { label: "Color / Surface", value: <ColourSwatch colour={detailRow.color} category={category} />, highlight: true },
          { label: "Profile Name", value: detailRow.profileName, highlight: true },
          { label: "Length (m)", value: detailRow.length ? detailRow.length.toFixed(2) : "—" },
          { label: "PP # (Full)", value: detailRow.ppNumFull || "—" },
          { label: "PP 1B Qty (Full)", value: detailRow.ppOneBundleFull || "—" },
          { label: "PP Total Bundle (Full)", value: detailRow.ppTotalBundleFull || "—" },
          { label: "PP Total Qty (Full)", value: detailRow.ppTotalQtyFull || "—", highlight: true },
          { label: "PP Avg Wt (Full)", value: detailRow.ppAvgWtFull ? detailRow.ppAvgWtFull.toFixed(2) : "—" },
          { label: "PP # (Pcs)", value: detailRow.ppNumPcs || "—" },
          { label: "PP Bundle Qty (Pcs)", value: detailRow.ppBundleQtyPcs || "—" },
          { label: "PP Total Qty (Pcs)", value: detailRow.ppTotalQtyPcs || "—", highlight: true },
          { label: "PP Avg Wt (Pcs)", value: detailRow.ppAvgWtPcs ? detailRow.ppAvgWtPcs.toFixed(2) : "—" },
          { label: "NB # (Full)", value: detailRow.nbNumFull || "—" },
          { label: "NB 1B Qty (Full)", value: detailRow.nbOneBundleFull || "—" },
          { label: "NB Total Bundle (Full)", value: detailRow.nbTotalBundleFull || "—" },
          { label: "NB Total Qty (Full)", value: detailRow.nbTotalQtyFull || "—", highlight: true },
          { label: "NB Avg Wt (Full)", value: detailRow.nbAvgWtFull ? detailRow.nbAvgWtFull.toFixed(2) : "—" },
          { label: "NB # (Pcs)", value: detailRow.nbNumPcs || "—" },
          { label: "NB Bundle Qty (Pcs)", value: detailRow.nbBundleQtyPcs || "—" },
          { label: "NB Total Qty (Pcs)", value: detailRow.nbTotalQtyPcs || "—", highlight: true },
          { label: "NB Avg Wt (Pcs)", value: detailRow.nbAvgWtPcs ? detailRow.nbAvgWtPcs.toFixed(2) : "—" },
          { label: "WB #", value: detailRow.wbNum || "—" },
          { label: "WB Total Qty", value: detailRow.wbTotalQty || "—", highlight: true },
          { label: "WB Avg Wt", value: detailRow.wbAvgWt ? detailRow.wbAvgWt.toFixed(2) : "—" },
          { label: "Re-powder Bar Qty", value: detailRow.rePowderBarQty || "—" },
          { label: "PP Total Packing", value: detailRow.premiumTotalPacking || "—", highlight: true },
          { label: "NB Total Packing", value: detailRow.nonBrandTotalPacking || "—", highlight: true },
          { label: "WB Total Packing", value: detailRow.weightBarTotalPacking || "—", highlight: true },
          { label: "Total PP Wt", value: detailRow.totalPremiumWeight ? detailRow.totalPremiumWeight.toFixed(2) : "—", highlight: true },
          { label: "Total NB Wt", value: detailRow.totalNonBrandWeight ? detailRow.totalNonBrandWeight.toFixed(2) : "—", highlight: true },
          { label: "WB Wt", value: detailRow.weightBarWeight ? detailRow.weightBarWeight.toFixed(2) : "—", highlight: true },
        ] : []}
      />
    </div>
  );
}
