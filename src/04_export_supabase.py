"""Export processed analysis tables to Supabase (ny_* tables)."""

from __future__ import annotations

import json
import os
import sys

import pandas as pd
from dotenv import load_dotenv

from utils import OUT, ensure_dirs

load_dotenv(ROOT := __import__("utils").ROOT / ".env")
load_dotenv()

ensure_dirs()

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print(
        "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env "
        "(service role required for upserts)."
    )
    sys.exit(1)

from supabase import create_client  # noqa: E402

client = create_client(SUPABASE_URL, SUPABASE_KEY)

growth = pd.read_csv(OUT / "growth_fy23_26.csv")
series = pd.read_csv(OUT / "ot_series.csv")
reach_series = pd.read_csv(OUT / "reach_series.csv")
quadrant = pd.read_csv(OUT / "efficiency_quadrant.csv")
findings = pd.read_csv(OUT / "findings.csv")
with open(OUT / "meta.json", encoding="utf-8") as f:
    meta = json.load(f)


def records(df: pd.DataFrame) -> list[dict]:
    return df.where(pd.notnull(df), None).to_dict(orient="records")


agencies = growth[["agency", "agency_name"]].drop_duplicates()
client.table("ny_agencies").upsert(records(agencies), on_conflict="agency").execute()

ot_rows = growth[
    [
        "agency",
        "exp_2023", "exp_2024", "exp_2025", "exp_2026",
        "ot_2023", "ot_2024", "ot_2025", "ot_2026",
        "exp_growth_pct", "ot_growth_pct",
        "exp_growth_prev_pct", "ot_growth_prev_pct",
        "exp_change_latest_pct", "ot_change_latest_pct",
        "ot_share_2023_pct", "ot_share_2025_pct", "ot_share_2026_pct",
        "ot_peak_year", "ot_outpacing_exp", "pane_a_focus", "unit_note",
    ]
]
client.table("ny_ot_growth").upsert(records(ot_rows), on_conflict="agency").execute()

quad_rows = quadrant[
    [
        "agency",
        "exp_growth_pct",
        "outcome_delta_pct",
        "indicator_count",
        "indicators_improving",
        "cost_up",
        "outcome_flat_or_down",
        "quadrant",
        "quadrant_label",
        "exp_growth_prev_pct",
        "outcome_delta_prev_pct",
        "quadrant_prev",
        "zone_change",
    ]
]
client.table("ny_efficiency_quadrant").upsert(records(quad_rows), on_conflict="agency").execute()

series_rows = series[series["agency"].isin(growth["agency"])]
client.table("ny_ot_series").upsert(records(series_rows), on_conflict="agency,fiscal_year").execute()
client.table("ny_reach_series").upsert(records(reach_series), on_conflict="program,fiscal_year").execute()

client.table("ny_findings").delete().neq("id", 0).execute()
client.table("ny_findings").insert(records(findings)).execute()

meta_rows = [{"key": k, "value": str(v)} for k, v in meta.items()]
client.table("ny_meta").upsert(meta_rows, on_conflict="key").execute()

print("Supabase export complete.")
print(f"  agencies: {len(agencies)}")
print(f"  ot_growth: {len(ot_rows)}")
print(f"  efficiency_quadrant: {len(quad_rows)}")
print(f"  findings: {len(findings)}")
