"""Join expenditure growth to performance trends and score efficiency quadrants (Pane B).

Scores two windows with the same method: the current one (FY23->FY26) and the
earlier one (FY23->FY25), then records which agencies moved into or out of the
"cost up, outcomes flat or down" zone once FY2026 was added.
"""

from __future__ import annotations

import pandas as pd

from utils import FY_END, FY_PREV_END, FY_START, ensure_dirs, load_performance_indicators

ensure_dirs()
OUT = __import__("utils").OUT

COST_UP_THRESHOLD = 2.0
OUTCOME_FLAT_THRESHOLD = 2.0

# Agencies with unreliable cross-unit comparisons in headline rankings
EXCLUDED_AGENCIES = {"CCRB", "DOP", "OTI"}

QUADRANT_LABELS = {
    "target_hypothesis": "Cost up, outcomes flat/down",
    "cost_up_outcomes_up": "Cost up, outcomes improving",
    "cost_down_outcomes_up": "Cost down, outcomes improving",
    "cost_down_outcomes_flat": "Cost down, outcomes flat/down",
}

growth = pd.read_csv(OUT / "growth_fy23_26.csv")
perf_all = load_performance_indicators()
perf_all = perf_all[
    perf_all["fiscalyear"].between(FY_START, FY_END)
    & perf_all["acceptedvalue"].notna()
    & perf_all["desireddirection"].isin(["Up", "Down"])
].copy()

# One value per agency-indicator-year (latest valuedate wins)
perf_all = perf_all.sort_values("valuedate").drop_duplicates(
    subset=["agency", "indicator", "fiscalyear"], keep="last"
)

wide_all = perf_all.pivot_table(
    index=["agency", "agency_name", "indicator", "desireddirection"],
    columns="fiscalyear",
    values="acceptedvalue",
    aggfunc="last",
)


def indicator_trends(start: int, end: int) -> pd.DataFrame:
    if start not in wide_all.columns or end not in wide_all.columns:
        raise ValueError(f"Performance data missing FY{start} or FY{end}")
    wide = wide_all.dropna(subset=[start, end], how="any").reset_index()
    # A zero baseline makes percent change undefined or infinite
    wide = wide[wide[start] != 0].copy()
    wide["raw_change_pct"] = (wide[end] / wide[start] - 1) * 100
    # Positive normalized_change = outcomes moving in desired direction
    wide["normalized_change_pct"] = wide.apply(
        lambda row: row["raw_change_pct"] if row["desireddirection"] == "Up" else -row["raw_change_pct"],
        axis=1,
    )
    return wide


def score(start: int, end: int, exp_growth_col: str) -> pd.DataFrame:
    wide = indicator_trends(start, end)
    outcomes = (
        wide.groupby("agency", as_index=False)
        .agg(
            outcome_delta_pct=("normalized_change_pct", "median"),
            indicator_count=("indicator", "count"),
            indicators_improving=("normalized_change_pct", lambda s: int((s > 0).sum())),
        )
        .round(2)
    )
    scored = growth[["agency", "agency_name", exp_growth_col]].rename(
        columns={exp_growth_col: "exp_growth_pct"}
    ).merge(outcomes, on="agency", how="inner")
    scored = scored[~scored["agency"].isin(EXCLUDED_AGENCIES)].copy()
    scored["cost_up"] = scored["exp_growth_pct"] > COST_UP_THRESHOLD
    scored["outcome_flat_or_down"] = scored["outcome_delta_pct"] <= OUTCOME_FLAT_THRESHOLD
    scored["quadrant"] = scored.apply(
        lambda row: (
            "target_hypothesis"
            if row["cost_up"] and row["outcome_flat_or_down"]
            else "cost_up_outcomes_up"
            if row["cost_up"]
            else "cost_down_outcomes_up"
            if not row["outcome_flat_or_down"]
            else "cost_down_outcomes_flat"
        ),
        axis=1,
    )
    scored["quadrant_label"] = scored["quadrant"].map(QUADRANT_LABELS)
    return scored


current_trends = indicator_trends(FY_START, FY_END)
current_trends[
    ["agency", "agency_name", "indicator", "desireddirection", FY_START, FY_END, "raw_change_pct", "normalized_change_pct"]
].round(2).to_csv(OUT / "indicator_trends_fy23_26.csv", index=False)

current = score(FY_START, FY_END, "exp_growth_pct")
previous = score(FY_START, FY_PREV_END, "exp_growth_prev_pct")[
    ["agency", "exp_growth_pct", "outcome_delta_pct", "quadrant"]
].rename(
    columns={
        "exp_growth_pct": "exp_growth_prev_pct",
        "outcome_delta_pct": "outcome_delta_prev_pct",
        "quadrant": "quadrant_prev",
    }
)

quadrant = current.merge(previous, on="agency", how="left")


def zone_change(row: pd.Series) -> str:
    now_in = row["quadrant"] == "target_hypothesis"
    if pd.isna(row["quadrant_prev"]):
        return "new_in_zone" if now_in else "not_scored_before"
    was_in = row["quadrant_prev"] == "target_hypothesis"
    if now_in and was_in:
        return "stayed_in_zone"
    if now_in:
        return "entered_zone"
    if was_in:
        return "left_zone"
    return "stayed_out"


quadrant["zone_change"] = quadrant.apply(zone_change, axis=1)
quadrant = quadrant.sort_values(["quadrant", "exp_growth_pct"], ascending=[True, False])
quadrant.to_csv(OUT / "efficiency_quadrant.csv", index=False)

target = quadrant[quadrant["quadrant"] == "target_hypothesis"]
target.to_csv(OUT / "target_hypotheses.csv", index=False)

print(f"=== Pane B: target quadrant FY{FY_START}->FY{FY_END} (cost up, outcomes flat/down) ===")
print(
    target[["agency", "exp_growth_pct", "outcome_delta_pct", "indicator_count", "indicators_improving", "zone_change"]]
    .head(20)
    .to_string(index=False)
)
print("\n=== Zone changes vs the FY23->FY25 window ===")
print(quadrant["zone_change"].value_counts().to_string())
moved = quadrant[quadrant["zone_change"].isin(["entered_zone", "left_zone", "new_in_zone"])]
print(moved[["agency", "zone_change", "exp_growth_prev_pct", "exp_growth_pct", "outcome_delta_prev_pct", "outcome_delta_pct"]].to_string(index=False))

print(f"\nWrote {len(quadrant)} agencies to efficiency_quadrant.csv")
print(f"Target hypotheses: {len(target)} agencies")
