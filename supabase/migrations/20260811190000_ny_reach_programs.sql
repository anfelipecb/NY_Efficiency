-- Reach pane: does the benefit actually get to the eligible person (take-up rate),
-- as distinct from the fiscal-efficiency panes (A: overtime, B: cost x outcome).

CREATE TABLE IF NOT EXISTS ny_reach_programs (
  program TEXT PRIMARY KEY,
  program_label TEXT NOT NULL,
  eligible_population NUMERIC,
  enrolled_population NUMERIC,
  takeup_rate_pct NUMERIC,
  population_year TEXT,
  headline TEXT,
  note TEXT,
  source_label TEXT,
  source_url TEXT,
  sort_order INTEGER DEFAULT 0
);

ALTER TABLE ny_reach_programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read ny_reach_programs" ON ny_reach_programs FOR SELECT USING (true);
