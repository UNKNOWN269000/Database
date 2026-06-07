import { useState, useEffect, useMemo, useCallback } from "react";
import DateFilter from "./DateFilter";
import RowDetailModal from "./RowDetailModal";
import ExportButton from "./ExportButton";
import { useDateFilteredRows } from "../hooks/useDateFilteredRows";

const API_URL =
  "https://script.google.com/macros/s/AKfycbxahN3PXcPFgt8YY3IU3B07a8s_cSKTU1Q7nzawsiFDh39a3PGQNIlUy-mmhBuuPWzB/exec?category=profile";

// Raw API row
interface ApiRow {
  entrydatetime?: string;
  extrusiondate?: string;
  profile?: string;
  unitweightkg?: string | number;
  ulr?: string | boolean;
  prm?: string | boolean;
  ulrprm?: string | boolean;
  dieno?: number;
  billetlength?: number;
  billetqty?: number;
  input?: number;
  output?: number;
  length365?: string | number;
  length61?: string | number;
  length65?: string | number;
  otherslength?: string | number;
  qty?: string | number;
  offcut?: number;
  yeild?: number;
  diestatus?: string;
}

// Your exact 20-column spec
export interface ProfileRow {
  extrusionDate: string;
  profile: string;
  unitWeight: number;
  ulr: boolean;
  prm: boolean;
  ulrPrm: boolean;
  dieNo: number;
  billetLength: number;
  billetQty: number;
  input: number;
  output: number;
  length365: number;
  length61: number;
  length65: number;
  othersLength: number;
  qty: number;
  offCut: number;
  yeild: number;
  dieStatus: string;
  category: "profile";
}

const toProfileRow = (r: ApiRow): ProfileRow => {
  // Use extrusiondate if present, otherwise fall back to entry date
  const rawDate = r.extrusiondate && r.extrusiondate !== "" ? r.extrusiondate : r.entrydatetime || "";
  const date = rawDate ? String(rawDate).substring(0, 10) : "";
  const toBool = (v: unknown) => v !== "" && v !== false && v !== null && v !== undefined;
  const toNum = (v: unknown) => {
    if (v === "" || v === null || v === undefined) return 0;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };
  return {
    extrusionDate: date,
    profile: String(r.profile || "").trim(),
    unitWeight: toNum(r.unitweightkg),
    ulr: toBool(r.ulr),
    prm: toBool(r.prm),
    ulrPrm: toBool(r.ulrprm),
    dieNo: toNum(r.dieno),
    billetLength: toNum(r.billetlength),
    billetQty: toNum(r.billetqty),
    input: toNum(r.input),
    output: toNum(r.output),
    length365: toNum(r.length365),
    length61: toNum(r.length61),
    length65: toNum(r.length65),
    othersLength: toNum(r.otherslength),
    qty: toNum(r.qty),
    offCut: toNum(r.offcut),
    // yeild comes as a decimal (e.g. 0.7677 = 76.77%) — convert to percentage for display
    yeild: r.yeild != null ? Number(r.yeild) * (Number(r.yeild) <= 1 ? 100 : 1) : 0,
    dieStatus: String(r.diestatus || ""),
    category: "profile",
  };
};

// Type badges for ULR / PRM / ULR PRM
const TypeBadge = ({ value, label, color }: { value: boolean; label: string; color: string }) =>
  value ? (
    <span
      className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded text-[10px] font-bold border"
      style={{
        background: `${color}26`,
        color: color,
        borderColor: `${color}55`,
      }}
    >
      {label}
    </span>
  ) : (
    <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded text-[10px] font-bold bg-slate-200/60 dark:bg-slate-700/40 text-slate-400 dark:text-slate-500 border border-slate-300/50 dark:border-slate-600/30">
      —
    </span>
  );

const DieStatus = ({ status }: { status: string }) => {
  const s = (status || "").trim() || "—";
  const map: Record<string, string> = {
    Active: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    Maintenance: "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30",
    Inactive: "bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/30",
  };
  const cls = map[s] || "bg-slate-500/20 text-slate-700 dark:text-slate-300 border-slate-500/30";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border whitespace-nowrap ${cls}`}>
      {s}
    </span>
  );
};

const SkeletonRow = () => (
  <tr>
    {Array.from({ length: 20 }).map((_, i) => (
      <td key={i} className="px-2 py-2">
        <div className="h-3 rounded bg-slate-200/70 dark:bg-slate-700/50 animate-pulse"></div>
      </td>
    ))}
  </tr>
);

export default function ProfileIncomeTable({ color = "#00ffff" }: { color?: string }) {
  const [rows, setRows] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [detailRow, setDetailRow] = useState<ProfileRow | null>(null);

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
      const mapped = (data as ApiRow[]).map(toProfileRow).filter((r) => r.profile);
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

  const getDate = useCallback((r: ProfileRow) => r.extrusionDate, []);
  const { filteredRows: dateFiltered, startDate, endDate, setDateRange } = useDateFilteredRows(rows, getDate);

  const filtered = useMemo(() => {
    if (!search.trim()) return dateFiltered;
    const q = search.toLowerCase();
    return dateFiltered.filter(
      (r) =>
        r.profile.toLowerCase().includes(q) ||
        r.dieStatus.toLowerCase().includes(q) ||
        r.extrusionDate.includes(q)
    );
  }, [dateFiltered, search]);

  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, r) => ({
        billetQty: acc.billetQty + r.billetQty,
        input: acc.input + r.input,
        output: acc.output + r.output,
        length365: acc.length365 + r.length365,
        length61: acc.length61 + r.length61,
        length65: acc.length65 + r.length65,
        othersLength: acc.othersLength + r.othersLength,
        qty: acc.qty + r.qty,
        offCut: acc.offCut + r.offCut,
        yeildSum: acc.yeildSum + r.yeild,
      }),
      {
        billetQty: 0, input: 0, output: 0,
        length365: 0, length61: 0, length65: 0, othersLength: 0,
        qty: 0, offCut: 0, yeildSum: 0,
      }
    );
  }, [filtered]);

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Header bar — stays fixed at the top while the table area scrolls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 flex-shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
            Profile Income Records
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
              placeholder="Search profile, date, status..."
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
            filename="profile_income"
            color={color}
            disabled={loading || filtered.length === 0}
            getData={() => filtered.map((r) => ({
              ExtrusionDate: r.extrusionDate,
              Profile: r.profile,
              UnitWeight: r.unitWeight,
              ULR: r.ulr ? "Yes" : "No",
              PRM: r.prm ? "Yes" : "No",
              ULR_PRM: r.ulrPrm ? "Yes" : "No",
              DieNo: r.dieNo,
              BilletLength: r.billetLength,
              BilletQty: r.billetQty,
              Input: r.input,
              Output: r.output,
              Length365: r.length365,
              Length61: r.length61,
              Length65: r.length65,
              OthersLength: r.othersLength,
              Qty: r.qty,
              OffCut: r.offCut,
              Yeild: r.yeild,
              DieStatus: r.dieStatus,
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

      {/* Table — 20 columns grouped under 4 sections. This is the only region that scrolls. */}
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
              <th colSpan={2} className="px-2 py-1.5 text-center border-b border-slate-200/50 dark:border-slate-700/50">ID</th>
              <th colSpan={3} className="px-2 py-1.5 text-center border-b border-l border-slate-200/50 dark:border-slate-700/50">Type</th>
              <th colSpan={4} className="px-2 py-1.5 text-center border-b border-l border-slate-200/50 dark:border-slate-700/50">Billet</th>
              <th colSpan={2} className="px-2 py-1.5 text-center border-b border-l border-slate-200/50 dark:border-slate-700/50">Weight</th>
              <th colSpan={4} className="px-2 py-1.5 text-center border-b border-l border-slate-200/50 dark:border-slate-700/50">Lengths (qty)</th>
              <th colSpan={3} className="px-2 py-1.5 text-center border-b border-l border-slate-200/50 dark:border-slate-700/50">Output</th>
              <th colSpan={2} className="px-2 py-1.5 text-center border-b border-l border-slate-200/50 dark:border-slate-700/50">Results</th>
            </tr>
            <tr
              className="text-left text-[9px] uppercase tracking-wider font-semibold"
              style={{ color: color }}
            >
              <th className="px-1.5 py-1.5">Extrusion<br />Date</th>
              <th className="px-1.5 py-1.5">Profile</th>

              <th className="px-1.5 py-1.5 text-center border-l border-slate-200/50 dark:border-slate-700/50">ULR</th>
              <th className="px-1.5 py-1.5 text-center">PRM</th>
              <th className="px-1.5 py-1.5 text-center">ULR<br />PRM</th>

              <th className="px-1.5 py-1.5 text-right border-l border-slate-200/50 dark:border-slate-700/50">Die<br />No</th>
              <th className="px-1.5 py-1.5 text-right">Billet<br />Length</th>
              <th className="px-1.5 py-1.5 text-right">Billet<br />Qty</th>
              <th className="px-1.5 py-1.5 text-right">Unit<br />Wt</th>

              <th className="px-1.5 py-1.5 text-right border-l border-slate-200/50 dark:border-slate-700/50">Input</th>
              <th className="px-1.5 py-1.5 text-right">Output</th>

              <th className="px-1.5 py-1.5 text-right border-l border-slate-200/50 dark:border-slate-700/50">3.65 m</th>
              <th className="px-1.5 py-1.5 text-right">6.1 m</th>
              <th className="px-1.5 py-1.5 text-right">6.5 m</th>
              <th className="px-1.5 py-1.5 text-right">Others</th>

              <th className="px-1.5 py-1.5 text-right border-l border-slate-200/50 dark:border-slate-700/50">Qty</th>
              <th className="px-1.5 py-1.5 text-right">Off<br />Cut</th>
              <th className="px-1.5 py-1.5 text-right">Yeild<br />%</th>

              <th className="px-1.5 py-1.5 text-center border-l border-slate-200/50 dark:border-slate-700/50">Die<br />Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/60 dark:divide-slate-700/60">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={20} className="px-3 py-6 text-center text-slate-500 dark:text-slate-400">
                  No records found.
                </td>
              </tr>
            ) : (
              filtered.map((r, i) => (
                <tr
                  key={`${r.extrusionDate}-${r.profile}-${i}`}
                  onClick={() => setDetailRow(r)}
                  className="cursor-pointer hover:bg-slate-50/60 dark:hover:bg-slate-700/30 transition-colors"
                >
                  <td className="px-1.5 py-1.5 whitespace-nowrap text-slate-700 dark:text-slate-300 font-medium">
                    {r.extrusionDate}
                  </td>
                  <td className="px-1.5 py-1.5 whitespace-nowrap">
                    <span
                      className="px-1.5 py-0.5 rounded font-mono text-[10px] font-semibold"
                      style={{ background: `${color}1a`, color }}
                    >
                      {r.profile}
                    </span>
                  </td>

                  <td className="px-1.5 py-1.5 text-center border-l border-slate-200/40 dark:border-slate-700/40">
                    <TypeBadge value={r.ulr} label="ULR" color={color} />
                  </td>
                  <td className="px-1.5 py-1.5 text-center">
                    <TypeBadge value={r.prm} label="PRM" color={color} />
                  </td>
                  <td className="px-1.5 py-1.5 text-center">
                    <TypeBadge value={r.ulrPrm} label="ULR PRM" color={color} />
                  </td>

                  <td className="px-1.5 py-1.5 text-right tabular-nums text-slate-700 dark:text-slate-300 border-l border-slate-200/40 dark:border-slate-700/40">
                    {r.dieNo || "—"}
                  </td>
                  <td className="px-1.5 py-1.5 text-right tabular-nums text-slate-700 dark:text-slate-300">
                    {r.billetLength || "—"}
                  </td>
                  <td className="px-1.5 py-1.5 text-right tabular-nums text-slate-700 dark:text-slate-300 font-medium">
                    {r.billetQty || "—"}
                  </td>
                  <td className="px-1.5 py-1.5 text-right tabular-nums text-slate-700 dark:text-slate-300">
                    {r.unitWeight ? r.unitWeight.toFixed(3) : "—"}
                  </td>

                  <td className="px-1.5 py-1.5 text-right tabular-nums font-semibold text-slate-900 dark:text-white border-l border-slate-200/40 dark:border-slate-700/40">
                    {r.input.toFixed(2)}
                  </td>
                  <td className="px-1.5 py-1.5 text-right tabular-nums font-semibold text-slate-900 dark:text-white">
                    {r.output.toFixed(2)}
                  </td>

                  <td className="px-1.5 py-1.5 text-right tabular-nums text-slate-600 dark:text-slate-400 border-l border-slate-200/40 dark:border-slate-700/40">
                    {r.length365 || "—"}
                  </td>
                  <td className="px-1.5 py-1.5 text-right tabular-nums text-slate-600 dark:text-slate-400">
                    {r.length61 || "—"}
                  </td>
                  <td className="px-1.5 py-1.5 text-right tabular-nums text-slate-600 dark:text-slate-400">
                    {r.length65 || "—"}
                  </td>
                  <td className="px-1.5 py-1.5 text-right tabular-nums text-slate-600 dark:text-slate-400">
                    {r.othersLength || "—"}
                  </td>

                  <td className="px-1.5 py-1.5 text-right tabular-nums text-slate-700 dark:text-slate-300 border-l border-slate-200/40 dark:border-slate-700/40">
                    {r.qty || "—"}
                  </td>
                  <td className="px-1.5 py-1.5 text-right tabular-nums text-rose-600 dark:text-rose-400">
                    {r.offCut ? r.offCut.toFixed(0) : "—"}
                  </td>
                  <td className="px-1.5 py-1.5 text-right">
                    <span
                      className={`tabular-nums font-bold ${
                        r.yeild >= 95
                          ? "text-emerald-600 dark:text-emerald-400"
                          : r.yeild >= 85
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {r.yeild ? r.yeild.toFixed(1) : "—"}
                    </span>
                  </td>

                  <td className="px-1.5 py-1.5 text-center border-l border-slate-200/40 dark:border-slate-700/40">
                    <DieStatus status={r.dieStatus} />
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
                <td className="px-1.5 py-2 text-right tabular-nums" style={{ color }}>{totals.billetQty || "—"}</td>
                <td colSpan={1}></td>
                <td className="px-1.5 py-2 text-right tabular-nums" style={{ color }}>{totals.input.toFixed(2)}</td>
                <td className="px-1.5 py-2 text-right tabular-nums" style={{ color }}>{totals.output.toFixed(2)}</td>
                <td className="px-1.5 py-2 text-right tabular-nums" style={{ color }}>{totals.length365 || "—"}</td>
                <td className="px-1.5 py-2 text-right tabular-nums" style={{ color }}>{totals.length61 || "—"}</td>
                <td className="px-1.5 py-2 text-right tabular-nums" style={{ color }}>{totals.length65 || "—"}</td>
                <td className="px-1.5 py-2 text-right tabular-nums" style={{ color }}>{totals.othersLength || "—"}</td>
                <td className="px-1.5 py-2 text-right tabular-nums" style={{ color }}>{totals.qty || "—"}</td>
                <td className="px-1.5 py-2 text-right tabular-nums" style={{ color }}>{totals.offCut.toFixed(0)}</td>
                <td className="px-1.5 py-2 text-right tabular-nums" style={{ color }}>{(totals.yeildSum / filtered.length).toFixed(1)}</td>
                <td colSpan={1}></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
        Showing <span className="font-semibold">{filtered.length}</span> of{" "}
        <span className="font-semibold">{rows.length}</span> records · Category:{" "}
        <span className="font-mono font-semibold" style={{ color }}>profile</span> · Source: Google Apps Script API · Click any row to view details
      </p>

      <RowDetailModal
        open={detailRow !== null}
        onClose={() => setDetailRow(null)}
        title={detailRow?.profile || "Record Details"}
        subtitle={`Profile Income · ${detailRow?.extrusionDate || ""}`}
        color={color}
        data={detailRow ? [
          { label: "Extrusion Date", value: detailRow.extrusionDate, highlight: true },
          { label: "Profile", value: detailRow.profile, highlight: true },
          { label: "Unit Weight (kg)", value: detailRow.unitWeight ? detailRow.unitWeight.toFixed(3) : "—" },
          { label: "ULR", value: <TypeBadge value={detailRow.ulr} label="ULR" color={color} /> },
          { label: "PRM", value: <TypeBadge value={detailRow.prm} label="PRM" color={color} /> },
          { label: "ULR PRM", value: <TypeBadge value={detailRow.ulrPrm} label="ULR PRM" color={color} /> },
          { label: "Die No", value: detailRow.dieNo || "—" },
          { label: "Billet Length", value: detailRow.billetLength || "—" },
          { label: "Billet Qty", value: detailRow.billetQty || "—" },
          { label: "Input", value: detailRow.input.toFixed(2), highlight: true },
          { label: "Output", value: detailRow.output.toFixed(2), highlight: true },
          { label: "Length 3.65 m", value: detailRow.length365 || "—" },
          { label: "Length 6.1 m", value: detailRow.length61 || "—" },
          { label: "Length 6.5 m", value: detailRow.length65 || "—" },
          { label: "Others Length", value: detailRow.othersLength || "—" },
          { label: "Qty", value: detailRow.qty || "—" },
          { label: "Off Cut", value: detailRow.offCut ? detailRow.offCut.toFixed(0) : "—" },
          { label: "Yeild %", value: detailRow.yeild ? `${detailRow.yeild.toFixed(1)}%` : "—", highlight: true },
          { label: "Die Status", value: <DieStatus status={detailRow.dieStatus} /> },
          { label: "Category", value: <span className="font-mono font-semibold" style={{ color }}>{detailRow.category}</span>, fullWidth: true },
        ] : []}
      />
    </div>
  );
}
