"""Build the "reach" dataset: does the benefit actually get to the eligible person.

Unlike the other panes, these figures are not pulled from NYC Open Data's Socrata API.
Eligible-population estimates for public benefits are not published as a clean city
dataset; the city and outside research groups estimate them from Census ACS microdata
and program administrative counts. So this script curates published, cited figures into
the same tabular shape the rest of the pipeline uses, and is explicit about where each
number comes from.

Sources:
- NYC HRA, "SNAPShot" (March 2026): https://www.nyc.gov/assets/hra/downloads/pdf/facts/snap/SNAPParticipationNYC.pdf
- Permanent Citizens Advisory Committee (PCAC), Fair Fares expansion report (2026): https://pcac.org/report/fairfares/
- Community Service Society of NY, "Making Transit Work for Low-Income New Yorkers" (2026): https://www.cssny.org/news/entry/fair-fares-nyc-expansion-who-qualifies-whats-changing-and-why-it-matters-new-yorkers
"""

from __future__ import annotations

import pandas as pd

from utils import OUT, ensure_dirs, load_performance_indicators

ensure_dirs()

SERIES_YEARS = range(2020, 2027)
SERIES_INDICATORS = {
    "Supplemental Nutrition Assistance Program (SNAP) — Persons receiving benefits (000)": (
        "SNAP",
        "People receiving SNAP",
        1000,
    ),
    "Fair Fares NYC — Total enrollment": ("FAIR_FARES", "Fair Fares enrollment", 1),
}

rows = [
    {
        "program": "SNAP",
        "program_label": "SNAP (food assistance)",
        "eligible_population": 2_280_000,
        "enrolled_population": 1_790_000,
        "takeup_rate_pct": 78.6,
        "population_year": "2024",
        "headline": "About 4 in 5 eligible New Yorkers receive SNAP",
        "note": (
            "HRA estimates 1.79 million New Yorkers received SNAP in 2024, a participation "
            "rate of 78.6% among people the Census ACS suggests are eligible. By a second, "
            "broader federal measure, the Program Access Index, NYC reached 95.7%, its "
            "highest on record. The two measures use different eligibility definitions; "
            "both point the same direction: SNAP outreach and renewal in NYC works well. "
            "The Fiscal 2026 MMR reports SNAP recipients fell 7% to 1.68 million, which HRA "
            "attributes mainly to federal eligibility changes under H.R.1 (July 2025), so the "
            "2024 rate should not be read as current."
        ),
        "source_label": "NYC HRA, SNAPShot (March 2026)",
        "source_url": "https://www.nyc.gov/assets/hra/downloads/pdf/facts/snap/SNAPParticipationNYC.pdf",
        "sort_order": 1,
    },
    {
        "program": "FAIR_FARES",
        "program_label": "Fair Fares (half-price transit)",
        "eligible_population": 950_000,
        "enrolled_population": 370_000,
        "takeup_rate_pct": 38.9,
        "population_year": "2026",
        "headline": "Fewer than 2 in 5 eligible New Yorkers use Fair Fares",
        "note": (
            "The city expanded Fair Fares eligibility to 200% of the federal poverty line "
            "in mid-2026, growing the eligible pool to roughly 950,000 people. Enrollment "
            "has not caught up: about 370,000 people were enrolled as of July 2026, a "
            "take-up rate near 39%. Widening who qualifies did not by itself close the gap; "
            "the application step still is."
        ),
        "source_label": "PCAC, Fair Fares expansion report (2026)",
        "source_url": "https://pcac.org/report/fairfares/",
        "sort_order": 2,
    },
    {
        "program": "FAIR_FARES_VERIFIED_OVERLAP",
        "program_label": "Fair Fares, among people already verified eligible for other benefits",
        "eligible_population": None,
        "enrolled_population": None,
        "takeup_rate_pct": 66.0,
        "population_year": "2026",
        "headline": "Even pre-verified New Yorkers fall through the cracks",
        "note": (
            "In a 2026 survey of 1,616 New Yorkers already receiving SNAP, Cash Assistance, "
            "or CityFHEPS, the same agency (HRA) that already verified their income for "
            "those programs, about two-thirds were enrolled in Fair Fares. More than one in "
            "three were not, despite the city already holding the income data needed to "
            "auto-enroll them. That is a process gap, not an eligibility gap."
        ),
        "source_label": "Community Service Society of NY (2026)",
        "source_url": "https://www.cssny.org/news/entry/fair-fares-nyc-expansion-who-qualifies-whats-changing-and-why-it-matters-new-yorkers",
        "sort_order": 3,
    },
]

df = pd.DataFrame(rows)
df.to_csv(OUT / "reach_programs.csv", index=False)
print(f"Wrote {OUT / 'reach_programs.csv'} ({len(df)} rows)")

# Enrollment trend straight from MMR performance indicators (NYC Open Data rbed-zzin)
perf = load_performance_indicators()
perf = perf[perf["indicator"].isin(SERIES_INDICATORS) & perf["fiscalyear"].isin(SERIES_YEARS)]
perf = perf.sort_values("valuedate").drop_duplicates(["indicator", "fiscalyear"], keep="last")
series = pd.DataFrame(
    {
        "program": perf["indicator"].map(lambda i: SERIES_INDICATORS[i][0]),
        "series_label": perf["indicator"].map(lambda i: SERIES_INDICATORS[i][1]),
        "fiscal_year": perf["fiscalyear"].astype(int),
        "value": perf["acceptedvalue"] * perf["indicator"].map(lambda i: SERIES_INDICATORS[i][2]),
    }
).sort_values(["program", "fiscal_year"])
series["value"] = series["value"].round(0)
series.to_csv(OUT / "reach_series.csv", index=False)
print(f"Wrote {OUT / 'reach_series.csv'} ({len(series)} rows)")
print(series.pivot(index="fiscal_year", columns="program", values="value").to_string())
