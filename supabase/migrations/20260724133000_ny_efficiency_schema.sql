-- NYC Efficiency portfolio tables (hosted on Supabase project ADE-nexo due to free-tier project limit)

CREATE TABLE IF NOT EXISTS ny_agencies (
  agency TEXT PRIMARY KEY,
  agency_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ny_ot_growth (
  agency TEXT PRIMARY KEY REFERENCES ny_agencies(agency),
  exp_2023 NUMERIC,
  exp_2025 NUMERIC,
  ot_2023 NUMERIC,
  ot_2025 NUMERIC,
  exp_growth_pct NUMERIC,
  ot_growth_pct NUMERIC,
  ot_share_2023_pct NUMERIC,
  ot_share_2025_pct NUMERIC,
  ot_outpacing_exp BOOLEAN,
  pane_a_focus BOOLEAN DEFAULT FALSE,
  unit_note TEXT
);

CREATE TABLE IF NOT EXISTS ny_efficiency_quadrant (
  agency TEXT PRIMARY KEY REFERENCES ny_agencies(agency),
  exp_growth_pct NUMERIC,
  outcome_delta_pct NUMERIC,
  indicator_count INTEGER,
  indicators_improving INTEGER,
  cost_up BOOLEAN,
  outcome_flat_or_down BOOLEAN,
  quadrant TEXT,
  quadrant_label TEXT
);

CREATE TABLE IF NOT EXISTS ny_findings (
  id SERIAL PRIMARY KEY,
  pane TEXT NOT NULL CHECK (pane IN ('A', 'B')),
  agency TEXT REFERENCES ny_agencies(agency),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  caveat TEXT,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS ny_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

ALTER TABLE ny_agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE ny_ot_growth ENABLE ROW LEVEL SECURITY;
ALTER TABLE ny_efficiency_quadrant ENABLE ROW LEVEL SECURITY;
ALTER TABLE ny_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ny_meta ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read ny_agencies" ON ny_agencies FOR SELECT USING (true);
CREATE POLICY "Public read ny_ot_growth" ON ny_ot_growth FOR SELECT USING (true);
CREATE POLICY "Public read ny_efficiency_quadrant" ON ny_efficiency_quadrant FOR SELECT USING (true);
CREATE POLICY "Public read ny_findings" ON ny_findings FOR SELECT USING (true);
CREATE POLICY "Public read ny_meta" ON ny_meta FOR SELECT USING (true);
