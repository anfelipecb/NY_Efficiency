export interface Agency {
  agency: string;
  agency_name: string;
}

export interface OtGrowth {
  agency: string;
  exp_2023: number | null;
  exp_2024: number | null;
  exp_2025: number | null;
  exp_2026: number | null;
  ot_2023: number | null;
  ot_2024: number | null;
  ot_2025: number | null;
  ot_2026: number | null;
  exp_growth_pct: number | null;
  ot_growth_pct: number | null;
  exp_growth_prev_pct: number | null;
  ot_growth_prev_pct: number | null;
  exp_change_latest_pct: number | null;
  ot_change_latest_pct: number | null;
  ot_share_2023_pct: number | null;
  ot_share_2025_pct: number | null;
  ot_share_2026_pct: number | null;
  ot_peak_year: number | null;
  ot_outpacing_exp: boolean | null;
  pane_a_focus: boolean | null;
  unit_note: string | null;
  ny_agencies?: Agency;
}

export interface EfficiencyQuadrant {
  agency: string;
  exp_growth_pct: number | null;
  outcome_delta_pct: number | null;
  indicator_count: number | null;
  indicators_improving: number | null;
  cost_up: boolean | null;
  outcome_flat_or_down: boolean | null;
  quadrant: string | null;
  quadrant_label: string | null;
  exp_growth_prev_pct: number | null;
  outcome_delta_prev_pct: number | null;
  quadrant_prev: string | null;
  zone_change: "entered_zone" | "left_zone" | "stayed_in_zone" | "stayed_out" | "new_in_zone" | "not_scored_before" | null;
  ny_agencies?: Agency;
}

export interface OtSeriesPoint {
  agency: string;
  fiscal_year: number;
  expenditures: number | null;
  overtime: number | null;
  ot_share_pct: number | null;
}

export interface ReachSeriesPoint {
  program: string;
  series_label: string;
  fiscal_year: number;
  value: number | null;
}

export interface Finding {
  id: number;
  pane: "A" | "B";
  agency: string | null;
  title: string;
  body: string;
  caveat: string | null;
  sort_order: number | null;
}

export interface MetaRow {
  key: string;
  value: string;
}

export interface ReachProgram {
  program: string;
  program_label: string;
  eligible_population: number | null;
  enrolled_population: number | null;
  takeup_rate_pct: number | null;
  population_year: string | null;
  headline: string | null;
  note: string | null;
  source_label: string | null;
  source_url: string | null;
  sort_order: number | null;
}

export interface DashboardData {
  otGrowth: OtGrowth[];
  otSeries: OtSeriesPoint[];
  quadrant: EfficiencyQuadrant[];
  findings: Finding[];
  meta: Record<string, string>;
  reach: ReachProgram[];
  reachSeries: ReachSeriesPoint[];
}
