"""Generate SQL seed file from processed CSVs for Supabase CLI import."""

from __future__ import annotations

import json
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "processed"
SEED = ROOT / "supabase" / "seed.sql"

INT_COLS = {"indicator_count", "indicators_improving", "sort_order", "fiscal_year", "ot_peak_year"}


def esc(value) -> str:
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return "NULL"
    if isinstance(value, bool):
        return "TRUE" if value else "FALSE"
    if isinstance(value, (int, float)):
        return str(value)
    return "'" + str(value).replace("'", "''") + "'"


def insert(table: str, df: pd.DataFrame, cols: list[str]) -> list[str]:
    rows = []
    for _, row in df.iterrows():
        values = ", ".join(
            esc(int(row[col])) if col in INT_COLS and pd.notna(row[col]) else esc(row[col]) for col in cols
        )
        rows.append(f"INSERT INTO {table} ({', '.join(cols)}) VALUES ({values});")
    return rows


def main() -> None:
    growth = pd.read_csv(OUT / "growth_fy23_26.csv")
    series = pd.read_csv(OUT / "ot_series.csv")
    quadrant = pd.read_csv(OUT / "efficiency_quadrant.csv")
    findings = pd.read_csv(OUT / "findings.csv")
    meta = json.loads((OUT / "meta.json").read_text(encoding="utf-8"))
    reach = pd.read_csv(OUT / "reach_programs.csv")
    reach_series = pd.read_csv(OUT / "reach_series.csv")

    parts = [
        "DELETE FROM ny_findings;",
        "DELETE FROM ny_efficiency_quadrant;",
        "DELETE FROM ny_ot_series;",
        "DELETE FROM ny_ot_growth;",
        "DELETE FROM ny_agencies;",
        "DELETE FROM ny_meta;",
        "DELETE FROM ny_reach_programs;",
        "DELETE FROM ny_reach_series;",
    ]

    parts += insert("ny_agencies", growth[["agency", "agency_name"]].drop_duplicates(), ["agency", "agency_name"])

    ot_cols = [
        "agency",
        "exp_2023", "exp_2024", "exp_2025", "exp_2026",
        "ot_2023", "ot_2024", "ot_2025", "ot_2026",
        "exp_growth_pct", "ot_growth_pct",
        "exp_growth_prev_pct", "ot_growth_prev_pct",
        "exp_change_latest_pct", "ot_change_latest_pct",
        "ot_share_2023_pct", "ot_share_2025_pct", "ot_share_2026_pct",
        "ot_peak_year", "ot_outpacing_exp", "pane_a_focus", "unit_note",
    ]
    parts += insert("ny_ot_growth", growth, ot_cols)

    series = series[series["agency"].isin(growth["agency"])]
    parts += insert("ny_ot_series", series, ["agency", "fiscal_year", "expenditures", "overtime", "ot_share_pct"])

    quad_cols = [
        "agency", "exp_growth_pct", "outcome_delta_pct", "indicator_count",
        "indicators_improving", "cost_up", "outcome_flat_or_down", "quadrant", "quadrant_label",
        "exp_growth_prev_pct", "outcome_delta_prev_pct", "quadrant_prev", "zone_change",
    ]
    parts += insert("ny_efficiency_quadrant", quadrant[quadrant["agency"].isin(growth["agency"])], quad_cols)

    parts += insert("ny_findings", findings, ["pane", "agency", "title", "body", "caveat", "sort_order"])

    parts += insert(
        "ny_meta", pd.DataFrame([{"key": k, "value": str(v)} for k, v in meta.items()]), ["key", "value"]
    )

    reach_cols = [
        "program", "program_label", "eligible_population", "enrolled_population",
        "takeup_rate_pct", "population_year", "headline", "note", "source_label",
        "source_url", "sort_order",
    ]
    parts += insert("ny_reach_programs", reach, reach_cols)
    parts += insert("ny_reach_series", reach_series, ["program", "series_label", "fiscal_year", "value"])

    SEED.write_text("BEGIN;\n" + "\n".join(parts) + "\nCOMMIT;\n", encoding="utf-8")
    print(f"Wrote {SEED} ({len(parts)} statements)")


if __name__ == "__main__":
    main()
