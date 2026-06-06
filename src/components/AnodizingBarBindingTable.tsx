import { useState, useEffect, useMemo, useCallback } from "react";
import DateFilter from "./DateFilter";
import RowDetailModal from "./RowDetailModal";
import ExportButton from "./ExportButton";
import { useDateFilteredRows } from "../hooks/useDateFilteredRows";

const API_URL =
  "https://script.google.com/macros/s/AKfycbxahN3PXcPFgt8YY3IU3B07a8s_cSKTU1Q7nzawsiFDh39a3PGQNIlUy-mmhBuuPWzB/exec?category=anodizing_bind";

// Raw API row
interface ApiRow {
  entrydatetime?: string;
  barbindingdate?: string;
  extrusiondate?: string;
  billetbatch?: number;
  dieno?: number;
  profilename?: string;
  bucketno?: number | string;
  type?: string;
  surface?: string;
  totalbindingqty?: number;
  racknofullrack?: string | number;
  racknopcsrack?: string | number;
  qtyonefullrack?: number;
  qtypcsrackqty?: number;
  bindingteam?: string;
  averagebindingtime?: string;
  rejectedbarqty?: number | string;
}

// Your exact 17-column spec
export interface BarBindingRow {
  bindingDate: string;
  extrusionDate: string;
  billetBatch: number;
  dieNo: number;
  profileName: string;
  bucketNo: number;
  type: string;
  surface: string;
  totalBindingQty: number;
  rackNoFullRack: string;
  rackNoPcsRack: string;
  qtyOneFullRack: number;
  qtyPcsRackQty: number;
  totalBindingQtyDup: number; // API returns this twice (column 1 and column 14)
  bindingTeam: string;
  averageBindingTime: string;
  averageBindingMinutes: number; // parsed numeric for sorting/analysis
  rejectedBarQty: number;
}

const trimDate = (v?: string) => (v ? String(v).substring(0, 10) : "");
const toNum = (v: unknown) => {
  if (v === "" || v === null || v === undefined) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const toStr = (v: unknown) => (v === null || v === undefined ? "" : String(v).trim());

// Parse the inconsistent time string formats:
// "55mim" → 55
// "1h55mim" → 115
// "1h55mim " → 115
// "30min" → 30
// "1h" → 60
// "2h15mim" → 135
const parseBindingTime = (raw: string): { display: string; minutes: number } => {
  const s = (raw || "").toLowerCase().trim();
  if (!s) return { display: "—", minutes: 0 };
  let minutes = 0;
  const hMatch = s.match(/(\d+)\s*h/);
  const mMatch = s.match(/(\d+)\s*m/);
  if (hMatch) minutes += parseInt(hMatch[1], 10) * 60;
  if (mMatch) minutes += parseInt(mMatch[1], 10);
  // If we matched nothing, return the raw string
  if (!hMatch && !mMatch) return { display: raw.trim(), minutes: 0 };
  const display = minutes >= 60 ? `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}m` : `${minutes}m`;
  return { display, minutes };
};

const toBarBindingRow = (r: ApiRow): BarBindingRow => {
  // bucketno can be a prefixed string like "B-06 " or a number
  const parseBucket = (v: unknown) => {
    if (v === "" || v === null || v === undefined) return 0;
    const s = String(v).replace(/^b-/i, "").trim();
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  };
  const time = parseBindingTime(String(r.averagebindingtime || ""));
  return {
    bindingDate: trimDate(r.barbindingdate),
    extrusionDate: trimDate(r.extrusiondate),
    billetBatch: toNum(r.billetbatch),
    dieNo: toNum(r.dieno),
    profileName: toStr(r.profilename),
    bucketNo: parseBucket(r.bucketno),
    type: toStr(r.type),
    surface: toStr(r.surface),
    totalBindingQty: toNum(r.totalbindingqty),
    rackNoFullRack: toStr(r.racknofullrack),
    rackNoPcsRack: toStr(r.racknopcsrack),
    qtyOneFullRack: toNum(r.qtyonefullrack),
    qtyPcsRackQty: toNum(r.qtypcsrackqty),
    totalBindingQtyDup: toNum(r.totalbindingqty), // duplicated in API
    bindingTeam: toStr(r.bindingteam),
    averageBindingTime: time.display,
    averageBindingMinutes: time.minutes,
    rejectedBarQty: toNum(r.rejectedbarqty),
  };
};

// Anodizing surface swatches
// NOTE: In your Anodizing color system, "Bronze" = BLACK finish (not brownish).
//       "Natural" is the only light/transparent finish — everything else is dark.
const SURFACE_SWATCHES: Record<string, string> = {
  natural: "#f5f5f4",     // light/transparent anodizing
  bronze: "#0f172a",      // = BLACK in your system
  black: "#0f172a",
  champagne: "#0f172a",   // also dark in your system
  gold: "#0f172a",        // also dark in your system
  silver: "#0f172a",      // also dark in your system
  grey: "#0f172a",        // also dark in your system
  gray: "#0f172a",
  // Keep any other future colors open for individual definitions
};

const SurfaceSwatch = ({ surface }: { surface: string }) => {
  const s = (surface || "").toLowerCase().trim();
  if (!s) return <span className="text-slate-400">—</span>;
  const hex = SURFACE_SWATCHES[s] || s;
  // Only "natural" is light/transparent in your Anodizing system; all others are dark.
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

const TeamBadge = ({ team }: { team: string }) => {
  if (!team) return <span className="text-slate-400">—</span>;
  // Color hash to give each team a consistent color
  const colors = [
    "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30",
    "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30",
    "bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/30",
    "bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30",
    "bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border-cyan-500/30",
  ];
  const hash = team.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const cls = colors[hash % colors.length];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${cls}`}>
      {team}
    </span>
  );
};

const Num = ({ value, color, bold = false }: { value: number; color?: string; bold?: boolean }) => {
  if (!value && value !== 0) return <span className="text-slate-400">—</span>;
  return (
    <span
      className={`tabular-nums ${bold ? "font-bold" : "font-semibold"}`}
      style={color ? { color } : undefined}
    >
      {value}
    </span>
  );
};

const SkeletonRow = () => (
  <tr>
    {Array.from({ length: 17 }).map((_, i) => (
      <td key={i} className="px-2 py-2">
        <div className="h-3 rounded bg-slate-200/70 dark:bg-slate-700/50 animate-pulse"></div>
      </td>
    ))}
  </tr>
);

export default function AnodizingBarBindingTable({ color = "#00ccff" }: { color?: string }) {
  const [rows, setRows] = useState<BarBindingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [detailRow, setDetailRow] = useState<BarBindingRow | null>(null);

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
      const mapped = (data as ApiRow[]).map(toBarBindingRow);
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

  const getDate = useCallback((r: BarBindingRow) => r.bindingDate, []);
  const { filteredRows: dateFiltered, startDate, endDate, setDateRange } = useDateFilteredRows(rows, getDate);

  const filtered = useMemo(() => {
    if (!search.trim()) return dateFiltered;
    const q = search.toLowerCase();
    return dateFiltered.filter(
      (r) =>
        r.profileName.toLowerCase().includes(q) ||
        r.surface.toLowerCase().includes(q) ||
        r.bindingTeam.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q) ||
        String(r.billetBatch).includes(q) ||
        String(r.bucketNo).includes(q) ||
        r.rackNoFullRack.toLowerCase().includes(q) ||
        r.rackNoPcsRack.toLowerCase().includes(q) ||
        r.bindingDate.includes(q) ||
        r.extrusionDate.includes(q)
    );
  }, [dateFiltered, search]);

  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, r) => ({
        totalBindingQty: acc.totalBindingQty + r.totalBindingQty,
        qtyOneFullRack: acc.qtyOneFullRack + r.qtyOneFullRack,
        qtyPcsRackQty: acc.qtyPcsRackQty + r.qtyPcsRackQty,
        rejectedBarQty: acc.rejectedBarQty + r.rejectedBarQty,
        totalMinutes: acc.totalMinutes + r.averageBindingMinutes,
      }),
      { totalBindingQty: 0, qtyOneFullRack: 0, qtyPcsRackQty: 0, rejectedBarQty: 0, totalMinutes: 0 }
    );
  }, [filtered]);

  const avgBindingTime = totals.totalMinutes > 0 && filtered.length > 0
    ? Math.round(totals.totalMinutes / filtered.length)
    : 0;
  const avgTimeDisplay = avgBindingTime >= 60
    ? `${Math.floor(avgBindingTime / 60)}h ${String(avgBindingTime % 60).padStart(2, "0")}m`
    : `${avgBindingTime}m`;

  return (
    <div className="space-y-3">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
            Anodizing Bar Binding Records
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
              placeholder="Search profile, team, surface, rack..."
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
            filename="anodizing_bar_binding"
            color={color}
            disabled={loading || filtered.length === 0}
            getData={() => filtered.map((r) => ({
              BindingDate: r.bindingDate,
              ExtrusionDate: r.extrusionDate,
              BilletBatch: r.billetBatch,
              DieNo: r.dieNo,
              ProfileName: r.profileName,
              BucketNo: r.bucketNo,
              Type: r.type,
              Surface: r.surface,
              TotalBindingQty: r.totalBindingQty,
              RackNoFullRack: r.rackNoFullRack,
              QtyOneFullRack: r.qtyOneFullRack,
              RackNoPcsRack: r.rackNoPcsRack,
              QtyPcsRackQty: r.qtyPcsRackQty,
              BindingTeam: r.bindingTeam,
              AverageBindingTime: r.averageBindingTime,
              RejectedBarQty: r.rejectedBarQty,
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
          <span className="text-slate-600 dark:text-slate-300">Bronze, Black, Champagne, Gold, Silver, Grey = dark finish</span>
        </span>
      </div>

      {/* Table — 17 columns grouped under 4 sections */}
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
              <th colSpan={8} className="px-2 py-1.5 text-center border-b border-slate-200/50 dark:border-slate-700/50">Identification</th>
              <th colSpan={4} className="px-2 py-1.5 text-center border-b border-l border-slate-200/50 dark:border-slate-700/50">Full Rack</th>
              <th colSpan={2} className="px-2 py-1.5 text-center border-b border-l border-slate-200/50 dark:border-slate-700/50">Pcs Rack</th>
              <th colSpan={3} className="px-2 py-1.5 text-center border-b border-l border-slate-200/50 dark:border-slate-700/50">Totals & Team</th>
            </tr>
            <tr
              className="text-left text-[9px] uppercase tracking-wider font-semibold"
              style={{ color: color }}
            >
              <th className="px-1.5 py-1.5">Binding<br />Date</th>
              <th className="px-1.5 py-1.5">Extrusion<br />Date</th>
              <th className="px-1.5 py-1.5 text-right">Billet<br />Batch</th>
              <th className="px-1.5 py-1.5 text-right">Die<br />No</th>
              <th className="px-1.5 py-1.5">Profile</th>
              <th className="px-1.5 py-1.5 text-right">Bucket</th>
              <th className="px-1.5 py-1.5 text-center">Type</th>
              <th className="px-1.5 py-1.5">Surface</th>

              <th className="px-1.5 py-1.5 text-center border-l border-slate-200/50 dark:border-slate-700/50">Rack #<br />(Full)</th>
              <th className="px-1.5 py-1.5 text-right">Qty/<br />Rack</th>
              <th className="px-1.5 py-1.5 text-right">Total<br />Qty</th>
              <th className="px-1.5 py-1.5 text-right">Total<br />Bind</th>

              <th className="px-1.5 py-1.5 text-center border-l border-slate-200/50 dark:border-slate-700/50">Rack #<br />(Pcs)</th>
              <th className="px-1.5 py-1.5 text-right">Qty/<br />Rack</th>

              <th className="px-1.5 py-1.5 text-center border-l border-slate-200/50 dark:border-slate-700/50">Team</th>
              <th className="px-1.5 py-1.5 text-center">Avg<br />Time</th>
              <th className="px-1.5 py-1.5 text-right">Rejected<br />Qty</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/60 dark:divide-slate-700/60">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={17} className="px-3 py-6 text-center text-slate-500 dark:text-slate-400">
                  {error ? "No data — see error above." : "No records found."}
                </td>
              </tr>
            ) : (
              filtered.map((r, i) => {
                const rejectPct = r.totalBindingQty > 0 ? (r.rejectedBarQty / r.totalBindingQty) * 100 : 0;
                return (
                  <tr
                    key={`${r.bindingDate}-${r.billetBatch}-${r.dieNo}-${r.bindingTeam}-${i}`}
                    onClick={() => setDetailRow(r)}
                    className="cursor-pointer hover:bg-slate-50/60 dark:hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="px-1.5 py-1.5 whitespace-nowrap text-slate-700 dark:text-slate-300 font-medium">
                      {r.bindingDate}
                    </td>
                    <td className="px-1.5 py-1.5 whitespace-nowrap text-slate-700 dark:text-slate-300 font-medium">
                      {r.extrusionDate}
                    </td>
                    <td className="px-1.5 py-1.5 text-right tabular-nums text-slate-700 dark:text-slate-300 font-medium">
                      {r.billetBatch || "—"}
                    </td>
                    <td className="px-1.5 py-1.5 text-right tabular-nums text-slate-700 dark:text-slate-300">
                      {r.dieNo || "—"}
                    </td>
                    <td className="px-1.5 py-1.5 whitespace-nowrap">
                      <span
                        className="px-1 py-0.5 rounded font-mono text-[9px] font-semibold"
                        style={{ background: `${color}1a`, color }}
                      >
                        {r.profileName}
                      </span>
                    </td>
                    <td className="px-1.5 py-1.5 text-right tabular-nums">
                      <span
                        className="px-1 py-0.5 rounded font-mono text-[9px] font-bold"
                        style={{ background: `${color}1a`, color }}
                      >
                        #{r.bucketNo}
                      </span>
                    </td>
                    <td className="px-1.5 py-1.5 text-center">
                      <span className="text-[9px] font-mono text-slate-600 dark:text-slate-400">{r.type || "—"}</span>
                    </td>
                    <td className="px-1.5 py-1.5"><SurfaceSwatch surface={r.surface} /></td>

                    <td className="px-1.5 py-1.5 text-center tabular-nums text-slate-600 dark:text-slate-400 border-l border-slate-200/40 dark:border-slate-700/40">
                      {r.rackNoFullRack || "—"}
                    </td>
                    <td className="px-1.5 py-1.5 text-right"><Num value={r.qtyOneFullRack} /></td>
                    <td className="px-1.5 py-1.5 text-right"><Num value={r.qtyOneFullRack} /></td>
                    <td className="px-1.5 py-1.5 text-right"><Num value={r.totalBindingQty} bold color={color} /></td>

                    <td className="px-1.5 py-1.5 text-center tabular-nums text-slate-600 dark:text-slate-400 border-l border-slate-200/40 dark:border-slate-700/40">
                      {r.rackNoPcsRack || "—"}
                    </td>
                    <td className="px-1.5 py-1.5 text-right"><Num value={r.qtyPcsRackQty} /></td>

                    <td className="px-1.5 py-1.5 text-center border-l border-slate-200/40 dark:border-slate-700/40">
                      <TeamBadge team={r.bindingTeam} />
                    </td>
                    <td className="px-1.5 py-1.5 text-center tabular-nums font-semibold text-slate-700 dark:text-slate-200">
                      {r.averageBindingTime}
                    </td>
                    <td className="px-1.5 py-1.5 text-right">
                      {r.rejectedBarQty > 0 ? (
                        <span className="text-rose-600 dark:text-rose-400 font-semibold">
                          {r.rejectedBarQty}
                          {rejectPct >= 5 && (
                            <span className="ml-1 text-[9px] text-rose-500">({rejectPct.toFixed(0)}%)</span>
                          )}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
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
                <td colSpan={8} className="px-2 py-2 text-right uppercase tracking-wider" style={{ color }}>Totals</td>
                <td colSpan={3} className="px-1.5 py-2 text-right tabular-nums" style={{ color }}>
                  {totals.qtyOneFullRack || "—"}
                </td>
                <td className="px-1.5 py-2 text-right tabular-nums" style={{ color }}>
                  {totals.totalBindingQty || "—"}
                </td>
                <td colSpan={1}></td>
                <td className="px-1.5 py-2 text-right tabular-nums" style={{ color }}>
                  {totals.qtyPcsRackQty || "—"}
                </td>
                <td colSpan={2} className="px-1.5 py-2 text-center" style={{ color }}>{avgTimeDisplay}</td>
                <td className="px-1.5 py-2 text-right tabular-nums" style={{ color }}>
                  {totals.rejectedBarQty || "—"}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
        Showing <span className="font-semibold">{filtered.length}</span> of{" "}
        <span className="font-semibold">{rows.length}</span> records · Category:{" "}
        <span className="font-mono font-semibold" style={{ color }}>anodizing_bind</span> · Source: Google Apps Script API · Click any row to view details
      </p>

      <RowDetailModal
        open={detailRow !== null}
        onClose={() => setDetailRow(null)}
        title={detailRow?.profileName || "Record Details"}
        subtitle={`Anodizing Bar Binding · ${detailRow?.bindingDate || ""}`}
        color={color}
        data={detailRow ? [
          { label: "Binding Date", value: detailRow.bindingDate, highlight: true },
          { label: "Extrusion Date", value: detailRow.extrusionDate },
          { label: "Billet Batch", value: detailRow.billetBatch || "—" },
          { label: "Die No", value: detailRow.dieNo || "—" },
          { label: "Profile Name", value: detailRow.profileName, highlight: true },
          { label: "Bucket No", value: `#${detailRow.bucketNo}` },
          { label: "Type", value: detailRow.type || "—" },
          { label: "Surface", value: <SurfaceSwatch surface={detailRow.surface} /> },
          { label: "Rack No (Full)", value: detailRow.rackNoFullRack || "—" },
          { label: "Qty/Full Rack", value: detailRow.qtyOneFullRack || "—" },
          { label: "Total Binding Qty", value: detailRow.totalBindingQty || "—", highlight: true },
          { label: "Rack No (Pcs)", value: detailRow.rackNoPcsRack || "—" },
          { label: "Qty/Pcs Rack", value: detailRow.qtyPcsRackQty || "—" },
          { label: "Binding Team", value: <TeamBadge team={detailRow.bindingTeam} />, highlight: true },
          { label: "Average Binding Time", value: detailRow.averageBindingTime, highlight: true },
          { label: "Rejected Bar Qty", value: detailRow.rejectedBarQty > 0 ? `${detailRow.rejectedBarQty} (${detailRow.totalBindingQty > 0 ? ((detailRow.rejectedBarQty / detailRow.totalBindingQty) * 100).toFixed(0) : 0}%)` : "—", fullWidth: true },
        ] : []}
      />
    </div>
  );
}
