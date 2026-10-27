"""Build narrative finding cards for export and refresh outputs/findings.md."""

from __future__ import annotations

import json
from datetime import date

import pandas as pd

from utils import FY_END, FY_PREV_END, FY_START, OUTPUTS, ensure_dirs

ensure_dirs()
OUT = __import__("utils").OUT

growth = pd.read_csv(OUT / "growth_fy23_26.csv")
quadrant = pd.read_csv(OUT / "efficiency_quadrant.csv")
target = pd.read_csv(OUT / "target_hypotheses.csv")
trends = pd.read_csv(OUT / "indicator_trends_fy23_26.csv")

WINDOW = f"FY{FY_START} to FY{FY_END}"
PREV_WINDOW = f"FY{FY_START} to FY{FY_PREV_END}"


def fmt_m(v: float) -> str:
    return f"${v:,.1f}M"


def fmt_pct(v: float) -> str:
    return f"{v:+.1f}%"


def row(agency: str) -> pd.Series:
    return growth.loc[growth["agency"] == agency].iloc[0]


findings = []

nypd = row("NYPD")
findings.append(
    {
        "pane": "A",
        "agency": "NYPD",
        "title": "NYPD overtime peaked in FY2025 and came down in FY2026, but still outpaces the budget",
        "body": (
            f"Overtime went from {fmt_m(nypd['ot_2023'])} in FY2023 to a peak of "
            f"{fmt_m(nypd['ot_2025'])} in FY2025, then fell {abs(nypd['ot_change_latest_pct']):.1f}% "
            f"to {fmt_m(nypd['ot_2026'])} in FY2026. Over the full window it is still up "
            f"{nypd['ot_growth_pct']:.1f}%, against {nypd['exp_growth_pct']:.1f}% growth in total "
            f"spending, and it remains {nypd['ot_share_2026_pct']:.1f}% of the department budget. "
            f"The FY2026 drop is the first sign of a turn. One year does not yet make a structural change, "
            f"which is the bar Executive Order 12 sets."
        ),
        "caveat": (
            "Values are as reported in each year's MMR. Later reports can restate a prior year, "
            "so year-over-year changes may differ slightly from the latest MMR tables."
        ),
        "sort_order": 1,
    }
)

doc = row("DOC")
findings.append(
    {
        "pane": "A",
        "agency": "DOC",
        "title": "DOC overtime kept climbing and is now over a quarter of the budget",
        "body": (
            f"Overtime rose {doc['ot_growth_pct']:.1f}% from FY2023 to FY2026 "
            f"({fmt_m(doc['ot_2023'])} to {fmt_m(doc['ot_2026'])}), while total spending grew only "
            f"{doc['exp_growth_pct']:.1f}%. FY2026 added another {doc['ot_change_latest_pct']:.1f}% on top "
            f"of FY2025. Overtime's share of the budget went from {doc['ot_share_2023_pct']:.1f}% to "
            f"{doc['ot_share_2026_pct']:.1f}%. Unlike NYPD, there is no turn yet. This is the clearest "
            f"recurring cost pressure in the scan."
        ),
        "caveat": "Staffing levels, absence rates and court-ordered requirements need internal data to explain.",
        "sort_order": 2,
    }
)

dof = row("DOF")
findings.append(
    {
        "pane": "A",
        "agency": "DOF",
        "title": "DOF's FY2025 overtime spike reversed in FY2026",
        "body": (
            f"Through FY2025, DOF overtime had grown {dof['ot_growth_prev_pct']:.1f}% "
            f"({fmt_m(dof['ot_2023'])} to {fmt_m(dof['ot_2025'])}). In FY2026 it fell back to "
            f"{fmt_m(dof['ot_2026'])}, {abs(dof['ot_growth_pct']):.1f}% below FY2023. The spike looks "
            f"like a one-year event rather than a trend. That is a useful result in itself: a "
            f"second year of data can clear an outlier as well as confirm one."
        ),
        "caveat": "DOF reports overtime in thousands of dollars. Values here are converted to millions for comparison.",
        "sort_order": 3,
    }
)

dsny = row("DSNY")
findings.append(
    {
        "pane": "A",
        "agency": "DSNY",
        "title": "DSNY overtime jumped 60% in FY2026 alone",
        "body": (
            f"Sanitation overtime was roughly flat through FY2025 ({fmt_m(dsny['ot_2023'])} to "
            f"{fmt_m(dsny['ot_2025'])}), then rose {dsny['ot_change_latest_pct']:.1f}% to "
            f"{fmt_m(dsny['ot_2026'])} in FY2026, the largest one-year jump among big-budget agencies. "
            f"Over four years overtime grew {dsny['ot_growth_pct']:.1f}% against {dsny['exp_growth_pct']:.1f}% "
            f"for total spending, and its share of the budget went from {dsny['ot_share_2023_pct']:.1f}% "
            f"to {dsny['ot_share_2026_pct']:.1f}%. The budget itself also grew fast in FY2026, which "
            f"points to expanded service rather than a pure overtime problem. Whether it is a "
            f"one-year surge or a new baseline is the question FY2027 will answer."
        ),
        "caveat": (
            "Sanitation overtime swings with snow season and service expansions. "
            "One year of growth is a question, not a trend."
        ),
        "sort_order": 4,
    }
)

for i, (_, t) in enumerate(target.head(5).iterrows(), start=1):
    findings.append(
        {
            "pane": "B",
            "agency": t["agency"],
            "title": f"{t['agency']}: spending up, outcomes flat or down",
            "body": (
                f"Spending rose {t['exp_growth_pct']:.1f}% from FY2023 to FY2026, while the "
                f"median performance trend was {t['outcome_delta_pct']:.1f}% "
                f"({int(t['indicators_improving'])}/{int(t['indicator_count'])} indicators improving). "
                f"Worth a closer look with the agency. Not a conclusion on its own."
            ),
            "caveat": f"Outcome score is the median of MMR indicators that have values in both FY{FY_START} and FY{FY_END}.",
            "sort_order": 10 + i,
        }
    )


def worst_indicators(agency: str, n: int = 2) -> str:
    d = trends[trends["agency"] == agency].nsmallest(n, "normalized_change_pct")
    parts = [
        f"{r['indicator'].split(' (')[0].replace(' – ', ', ').lower()} ({r[str(FY_START)]:g} to {r[str(FY_END)]:g})"
        for _, r in d.iterrows()
    ]
    return " and ".join(parts)


moved = quadrant[quadrant["zone_change"].isin(["entered_zone", "left_zone"])].sort_values(
    ["zone_change", "exp_growth_pct"], ascending=[True, False]
)
for i, (_, m) in enumerate(moved.iterrows(), start=1):
    entered = m["zone_change"] == "entered_zone"
    if entered:
        title = f"{m['agency']} entered the zone once FY2026 was added"
        body = (
            f"Through FY2025, spending was {fmt_pct(m['exp_growth_prev_pct'])} and the median "
            f"outcome trend {fmt_pct(m['outcome_delta_prev_pct'])}. Through FY2026, spending is "
            f"{fmt_pct(m['exp_growth_pct'])} and outcomes {fmt_pct(m['outcome_delta_pct'])}. "
            f"The largest moves in the wrong direction: {worst_indicators(m['agency'])}."
        )
    else:
        title = f"{m['agency']} left the zone once FY2026 was added"
        body = (
            f"Through FY2025, spending was {fmt_pct(m['exp_growth_prev_pct'])} with a median outcome "
            f"trend of {fmt_pct(m['outcome_delta_prev_pct'])}. Through FY2026, outcomes moved to "
            f"{fmt_pct(m['outcome_delta_pct'])} with spending at {fmt_pct(m['exp_growth_pct'])}. "
            f"The added cost now comes with measurable improvement."
        )
    findings.append(
        {
            "pane": "B",
            "agency": m["agency"],
            "title": title,
            "body": body,
            "caveat": f"Both windows are scored with the same method and the same data download ({PREV_WINDOW} vs {WINDOW}).",
            "sort_order": 20 + i,
        }
    )

findings_df = pd.DataFrame(findings)
findings_df.to_csv(OUT / "findings.csv", index=False)

zone_counts = quadrant["zone_change"].value_counts()
meta = {
    "data_vintage": str(date.today()),
    "methodology": (
        "Built from NYC Open Data Mayor's Management Report agency resources and "
        f"performance indicators for {WINDOW}, including the Fiscal 2026 MMR released in "
        f"September 2026. The earlier {PREV_WINDOW} window is scored with the same method so "
        "the effect of the newest year is visible. Pane A compares overtime growth "
        "to total spending. Pane B joins spending growth to a median performance trend. "
        "The target zone is where cost rose and outcomes stayed flat or moved the wrong way."
    ),
    "eo12_framing": (
        "Executive Order 12 (January 2026) asks each agency to find recurring, structural "
        "savings, not one-time cuts. Public data can only point to places worth asking about."
    ),
    "disclaimer": (
        "This is an independent analysis of public data. "
        "It is not an audit and not an official finding."
    ),
    "window": WINDOW,
    "prev_window": PREV_WINDOW,
    "zone_count": str(len(target)),
    "zone_count_prev": str(int((quadrant["quadrant_prev"] == "target_hypothesis").sum())),
    "zone_entered": str(int(zone_counts.get("entered_zone", 0))),
    "zone_left": str(int(zone_counts.get("left_zone", 0))),
}
with open(OUT / "meta.json", "w", encoding="utf-8") as f:
    json.dump(meta, f, indent=2)

lines = [
    f"# Findings: NYC Efficiency Scan ({WINDOW})",
    "",
    meta["disclaimer"],
    "",
    "## Pane A: overtime deep dives",
    "",
    "Overtime here means payments for hours worked beyond the normal schedule "
    "(the MMR line \"Overtime paid\").",
    "",
]
for card in findings:
    if card["pane"] != "A":
        continue
    lines.extend([f"### {card['title']}", "", card["body"], "", f"*{card['caveat']}*", ""])

lines.extend(
    [
        "## Pane B: citywide scan (cost up, outcomes flat or down)",
        "",
        f"{meta['zone_count']} agencies are in the target zone for {WINDOW} "
        f"({meta['zone_count_prev']} for {PREV_WINDOW}). Places to ask about, not conclusions.",
        "",
        "| Agency | Exp growth | Outcome trend | Indicators improving | vs FY2025 window |",
        "|---|---:|---:|---:|---|",
    ]
)
for _, t in target.iterrows():
    lines.append(
        f"| {t['agency']} | {t['exp_growth_pct']:.1f}% | "
        f"{t['outcome_delta_pct']:.1f}% | "
        f"{int(t['indicators_improving'])}/{int(t['indicator_count'])} | "
        f"{t['zone_change'].replace('_', ' ')} |"
    )

lines.extend(["", "### What adding FY2026 changed", ""])
for card in findings:
    if card["pane"] == "B" and card["sort_order"] > 20:
        lines.extend([f"**{card['title']}.** {card['body']}", ""])

lines.extend(
    [
        "## Limitations",
        "",
        f"- Performance join uses indicators with accepted values in both FY{FY_START} and FY{FY_END}; indicators with a zero FY{FY_START} baseline are dropped.",
        "- Resource values are as reported in each year's MMR, not restated.",
        "- Agency name casing differs across MMR tables. Joins use agency codes.",
        "- Excluded from the citywide ranking for unit noise: OTI, CCRB, DOP.",
        "- Checkbook NYC vendor drill-down is not in this version.",
        "",
        f"*Generated {meta['data_vintage']}*",
    ]
)

(OUTPUTS / "findings.md").write_text("\n".join(lines), encoding="utf-8")
print(f"Wrote {len(findings_df)} finding cards and refreshed outputs/findings.md")
for card in findings:
    print(f"\n[{card['pane']}] {card['title']}\n  {card['body']}")
