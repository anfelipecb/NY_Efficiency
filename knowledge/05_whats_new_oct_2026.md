# What is new since the dashboard was built (as of October 27, 2026)

The dashboard was first built on FY2023 to FY2025 data and reach figures from mid-2026. Five things changed publicly after that. As of October 27, 2026, the dashboard runs on FY2023 to FY2026 and keeps the FY2025 window for comparison (see "Status" at the end).

## 1. FY2026 MMR data is out, and the overtime story partly flips

The Fiscal 2026 MMR was released in September 2026, and the FY2026 rows are already on NYC Open Data.

| Agency | Overtime FY2025 | Overtime FY2026 | Change | Budget change | Overtime share of budget, FY2026 |
|---|---|---|---|---|---|
| NYPD | $1,105.1M (restated) | $965.7M | **down 12.6%** | down 1.3% ($6.91B) | 14.0% (was 16.2%) |
| DOC | $341.1M | $369.1M | **up 8.2%** | up 2.8% ($1.38B) | 26.7% (was 25.4%) |
| DOF | about $5.1M | about $2.0M | **down about 60%** | up 4.2% ($375M) | under 1% |

What this means:

- **NYPD:** "overtime crossed $1 billion" is now a FY2025 fact, not the current one. NYPD overtime fell back under $1B in FY2026. Still about $966M, and the five-year trend is still flagged "Up", but the direction reversed.
- **DOC:** the strongest of the three findings got stronger. Overtime grew three times faster than the budget again and is now more than a quarter of DOC spending. DOC's authorized overtime budget for the next year is only $149.5M, against $369.1M actually spent. That gap is a planning risk worth asking about.
- **DOF:** the small-dollar spike reversed. Good example of why one year is a question, not a conclusion.
- **Restatement:** the FY2026 report restated NYPD FY2025 overtime from $1,135.6M to $1,105.1M. Our pipeline should always pull the newest edition.

## 2. SNAP reach dropped for federal reasons

From the FY2026 MMR (DSS/HRA chapter):

- SNAP recipients fell **7% to 1.68 million** in FY2026. Non-cash-assistance SNAP recipients fell 9%.
- HRA attributes this to **H.R.1** (federal reconciliation law, July 2025): work requirements extended to adults up to age 64, a narrower dependent-child exemption, and tighter eligibility for some immigrant groups. SNAP participation fell an estimated 11% nationally.
- **SNAP application timeliness was 84.7%**, down 3 points from FY2025 but far above the 39.7% of FY2023.
- **Fair Fares enrollment reached 384,914** in FY2026 (MMR), consistent with the roughly 370,000 the Reach pane cites.

For the Reach pane: the 78.6% SNAP take-up rate is a 2024 figure. Some of the FY2026 drop comes from people losing eligibility, not from people failing to enroll. A take-up rate needs an updated eligible-population denominator before anyone calls it a reach failure.

## 3. EO 12 has a second round

- Round one: **$1.77B** over FY2026 and FY2027 (Executive Budget).
- Round two (announced July 2026): another **2.5% in FY2027 and FY2028**, starting with a Workforce Savings and Efficiency Survey. It feeds the **November Financial Plan**, due next month.
- The Citizens Budget Commission projects a **$6.4B gap for FY2027**.

## 4. COGE's five questions are on the ballot next week

Election day is **November 3, 2026**. If they pass, implementation starts right away: a permitting hub spanning 18 offices, new procurement rules, a 12% reserve target. After the election, COGE becomes a permanent advisory board. See [02_coge.md](02_coge.md).

## 5. EO 13's audit made the First Deputy Mayor's office the cross-agency coordinator on immigration enforcement

The audit (published May 22, 2026) found gaps in agency reporting. The First Deputy Mayor is issuing updated citywide guidance. See [04_eo13_immigration_enforcement.md](04_eo13_immigration_enforcement.md).

## Suggested updates to the dashboard

1. Extend the window to **FY2023 to FY2026** (or FY2024 to FY2026), rerun the pipeline, and rewrite the NYPD card around "peaked in FY2025, fell in FY2026".
2. Add a DOC note on the gap between actual and authorized overtime.
3. Add the FY2026 SNAP decline and H.R.1 context to the Reach pane, so the take-up comparison is not read as an enrollment failure alone.

## Status (October 27, 2026)

- Item 1 is done. The pipeline uses FY2023 to FY2026 values as reported in each year's MMR, so NYPD FY2025 shows $1,135.6M, not the restated $1,105.1M. The FY2026 drop is therefore 15.0% in the dashboard against 12.6% on the restated figures.
- Item 3 is done. The Reach pane now shows SNAP and Fair Fares enrollment from FY2020 to FY2026, straight from MMR indicators. SNAP fell 6.6% in FY2026, its largest drop in the series. Fair Fares grew only 1.7%, its slowest growth in the series.
- Item 2 is still open.

Other things that changed once FY2026 was added:

- **Citywide scan:** 15 agencies in the zone (16 with the same method stopping at FY2025). DOB and CCHR entered. HPD, DYCD, and DOF left.
- **DOB:** plan review and inspection wait times rose sharply. First plan review for minor renovations went from 3.5 to 15.8 days, and the wait for an electrical inspection from 4.2 to 15.9 days. Construction injuries fell. This lines up with COGE's permitting ballot question.
- **DSNY:** overtime rose 60.5% in FY2026 alone ($201.0M to $322.7M), the largest jump among big-budget agencies. It is not one of the three deep dives yet.
- **Method fix:** indicators with a zero FY2023 value are now dropped, because their percent change is undefined.

## Sources

- [Fiscal 2026 MMR (PDF)](https://www.nyc.gov/assets/operations/downloads/pdf/mmr2026/2026_mmr.pdf)
- NYC Open Data [`4qmi-txnk`](https://data.cityofnewyork.us/City-Government/Mayor-s-Management-Report-Agency-Resources/4qmi-txnk), queried October 27, 2026
- [City & State, July 2026](https://www.cityandstateny.com/politics/2026/07/mamdani-orders-agencies-find-25-savings-again/415068/)
- [COGE press release, July 23, 2026](https://www.nyc.gov/mayors-office/news/2026/07/coge-releases-5-ballot-proposals-and-final-report-to-make-govern)
