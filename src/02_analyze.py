"""Compute expenditure and overtime growth FY23->FY26 by agency (Pane A inputs).

Also keeps the earlier FY23->FY25 window and the latest-year change (FY25->FY26),
so the dashboard can show what the newest Mayor's Management Report changed.
"""

from __future__ import annotations

import pandas as pd

from utils import (
    DEEP_DIVE_AGENCIES,
    FY_END,
    FY_PREV_END,
    FY_START,
    MILLIONS_AGENCIES,
    YEARS,
    ensure_dirs,
    extract_expenditures,
    extract_overtime,
    load_agency_resources,
)

ensure_dirs()
OUT = __import__("utils").OUT

resources = load_agency_resources()
exp = extract_expenditures(resources)
ot = extract_overtime(resources)

merged = pd.merge(exp, ot, on=["reporting_fiscal_year", "agency", "agency_name"], how="inner")
merged = merged.sort_values("agency_name").drop_duplicates(
    subset=["reporting_fiscal_year", "agency"], keep="first"
)
merged.to_csv(OUT / "expenditures_overtime_merged.csv", index=False)

piv_exp = merged.pivot(index="agency", columns="reporting_fiscal_year", values="expenditures")
piv_ot = merged.pivot(index="agency", columns="reporting_fiscal_year", values="overtime")
names = merged.drop_duplicates("agency").set_index("agency")["agency_name"]


def pct_change(new: pd.Series, old: pd.Series) -> pd.Series:
    return (new / old - 1) * 100


growth = pd.DataFrame({"agency_name": names})
for year in YEARS:
    growth[f"exp_{year}"] = piv_exp[year]
    growth[f"ot_{year}"] = piv_ot[year]

growth["exp_growth_pct"] = pct_change(growth[f"exp_{FY_END}"], growth[f"exp_{FY_START}"])
growth["ot_growth_pct"] = pct_change(growth[f"ot_{FY_END}"], growth[f"ot_{FY_START}"])
growth["exp_growth_prev_pct"] = pct_change(growth[f"exp_{FY_PREV_END}"], growth[f"exp_{FY_START}"])
growth["ot_growth_prev_pct"] = pct_change(growth[f"ot_{FY_PREV_END}"], growth[f"ot_{FY_START}"])
growth["exp_change_latest_pct"] = pct_change(growth[f"exp_{FY_END}"], growth[f"exp_{FY_PREV_END}"])
growth["ot_change_latest_pct"] = pct_change(growth[f"ot_{FY_END}"], growth[f"ot_{FY_PREV_END}"])
for year in (FY_START, FY_PREV_END, FY_END):
    growth[f"ot_share_{year}_pct"] = growth[f"ot_{year}"] / growth[f"exp_{year}"] * 100
growth["ot_peak_year"] = growth[[f"ot_{y}" for y in YEARS]].idxmax(axis=1).str[-4:]
growth["ot_outpacing_exp"] = growth["ot_growth_pct"] > growth["exp_growth_pct"]
growth["unit_note"] = growth.index.map(
    lambda a: "millions_confirmed" if a in MILLIONS_AGENCIES else "mixed_units"
)
growth["pane_a_focus"] = growth.index.isin(DEEP_DIVE_AGENCIES)

growth = growth.reset_index()
round_cols = [c for c in growth.columns if c.startswith(("exp_", "ot_")) and c != "ot_peak_year" and c != "ot_outpacing_exp"]
growth[round_cols] = growth[round_cols].round(1)
growth = growth.sort_values("ot_growth_pct", ascending=False)
growth.to_csv(OUT / "growth_fy23_26.csv", index=False)

series = merged[merged["reporting_fiscal_year"].isin(YEARS)][
    ["agency", "reporting_fiscal_year", "expenditures", "overtime"]
].rename(columns={"reporting_fiscal_year": "fiscal_year"})
series["ot_share_pct"] = (series["overtime"] / series["expenditures"] * 100).round(1)
series = series.sort_values(["agency", "fiscal_year"])
series.to_csv(OUT / "ot_series.csv", index=False)

deep_dive = growth[growth["pane_a_focus"]].copy()
deep_dive.to_csv(OUT / "ot_deep_dive.csv", index=False)

print(f"=== Overtime growth FY{FY_START}->FY{FY_END}, ranked ===")
print(
    growth[["agency", "exp_growth_pct", "ot_growth_pct", "ot_change_latest_pct", "ot_outpacing_exp"]]
    .head(15)
    .to_string(index=False)
)

print("\n=== Pane A deep dives (NYPD, DOC, DOF) ===")
print(
    deep_dive[
        [
            "agency",
            *[f"ot_{y}" for y in YEARS],
            "ot_growth_pct",
            "ot_growth_prev_pct",
            "ot_change_latest_pct",
            "exp_growth_pct",
            f"ot_share_{FY_END}_pct",
            "ot_peak_year",
        ]
    ].to_string(index=False)
)
