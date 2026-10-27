import { supabase } from "./supabase";
import type {
  Agency,
  DashboardData,
  EfficiencyQuadrant,
  Finding,
  MetaRow,
  OtGrowth,
  OtSeriesPoint,
  ReachProgram,
  ReachSeriesPoint,
} from "./types";

const SERIES_AGENCIES = ["NYPD", "DOC", "DOF", "DSNY"];

export async function loadDashboardData(): Promise<DashboardData> {
  const [otRes, quadRes, findingsRes, metaRes, reachRes, seriesRes, reachSeriesRes] = await Promise.all([
    supabase
      .from("ny_ot_growth")
      .select("*, ny_agencies(agency, agency_name)")
      .order("ot_growth_pct", { ascending: false }),
    supabase
      .from("ny_efficiency_quadrant")
      .select("*, ny_agencies(agency, agency_name)")
      .order("exp_growth_pct", { ascending: false }),
    supabase.from("ny_findings").select("*").order("sort_order"),
    supabase.from("ny_meta").select("*"),
    supabase.from("ny_reach_programs").select("*").order("sort_order"),
    supabase.from("ny_ot_series").select("*").in("agency", SERIES_AGENCIES).order("fiscal_year"),
    supabase.from("ny_reach_series").select("*").order("fiscal_year"),
  ]);

  if (seriesRes.error) throw seriesRes.error;
  if (reachSeriesRes.error) throw reachSeriesRes.error;
  if (otRes.error) throw otRes.error;
  if (quadRes.error) throw quadRes.error;
  if (findingsRes.error) throw findingsRes.error;
  if (metaRes.error) throw metaRes.error;
  if (reachRes.error) throw reachRes.error;

  const metaRows = (metaRes.data ?? []) as MetaRow[];
  const meta = Object.fromEntries(metaRows.map((row) => [row.key, row.value]));

  return {
    otGrowth: (otRes.data ?? []) as OtGrowth[],
    otSeries: (seriesRes.data ?? []) as OtSeriesPoint[],
    quadrant: (quadRes.data ?? []) as EfficiencyQuadrant[],
    findings: (findingsRes.data ?? []) as Finding[],
    meta,
    reach: (reachRes.data ?? []) as ReachProgram[],
    reachSeries: (reachSeriesRes.data ?? []) as ReachSeriesPoint[],
  };
}

export function agencyLabel(row: { agency: string; ny_agencies?: Agency | Agency[] | null }): string {
  const agencies = row.ny_agencies;
  const name = Array.isArray(agencies) ? agencies[0]?.agency_name : agencies?.agency_name;
  return name ? `${row.agency}: ${titleCase(name)}` : row.agency;
}

function titleCase(text: string): string {
  return text
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bNyc\b/g, "NYC")
    .replace(/\bNy\b/g, "NY");
}
