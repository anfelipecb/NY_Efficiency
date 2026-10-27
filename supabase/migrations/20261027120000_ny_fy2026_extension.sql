-- Extend the analysis window to FY2023-FY2026 while keeping the FY2023-FY2025 comparison

ALTER TABLE ny_ot_growth
  ADD COLUMN IF NOT EXISTS exp_2024 NUMERIC,
  ADD COLUMN IF NOT EXISTS exp_2026 NUMERIC,
  ADD COLUMN IF NOT EXISTS ot_2024 NUMERIC,
  ADD COLUMN IF NOT EXISTS ot_2026 NUMERIC,
  ADD COLUMN IF NOT EXISTS ot_share_2026_pct NUMERIC,
  ADD COLUMN IF NOT EXISTS exp_growth_prev_pct NUMERIC,
  ADD COLUMN IF NOT EXISTS ot_growth_prev_pct NUMERIC,
  ADD COLUMN IF NOT EXISTS exp_change_latest_pct NUMERIC,
  ADD COLUMN IF NOT EXISTS ot_change_latest_pct NUMERIC,
  ADD COLUMN IF NOT EXISTS ot_peak_year INTEGER;

ALTER TABLE ny_efficiency_quadrant
  ADD COLUMN IF NOT EXISTS exp_growth_prev_pct NUMERIC,
  ADD COLUMN IF NOT EXISTS outcome_delta_prev_pct NUMERIC,
  ADD COLUMN IF NOT EXISTS quadrant_prev TEXT,
  ADD COLUMN IF NOT EXISTS zone_change TEXT;

CREATE TABLE IF NOT EXISTS ny_ot_series (
  agency TEXT NOT NULL REFERENCES ny_agencies(agency),
  fiscal_year INTEGER NOT NULL,
  expenditures NUMERIC,
  overtime NUMERIC,
  ot_share_pct NUMERIC,
  PRIMARY KEY (agency, fiscal_year)
);

CREATE TABLE IF NOT EXISTS ny_reach_series (
  program TEXT NOT NULL,
  series_label TEXT NOT NULL,
  fiscal_year INTEGER NOT NULL,
  value NUMERIC,
  PRIMARY KEY (program, fiscal_year)
);

ALTER TABLE ny_ot_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE ny_reach_series ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read ny_ot_series" ON ny_ot_series;
CREATE POLICY "Public read ny_ot_series" ON ny_ot_series FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read ny_reach_series" ON ny_reach_series;
CREATE POLICY "Public read ny_reach_series" ON ny_reach_series FOR SELECT USING (true);
