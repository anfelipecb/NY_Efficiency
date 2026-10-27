# NY_Efficiency

A public-data scan of NYC agency spending, performance, and service reach, mirroring the structure of [Executive Order 12](https://www.nyc.gov/mayors-office/news/2026/01/executive-order-12) (Jan 2026), which requires every city agency's Chief Savings Officer to identify **recurring, structural savings**, not one-time fixes.

The project uses two different lenses on efficiency:

1. **Fiscal efficiency** (Panes A and B): does spending growth buy a better result? Compares overtime growth to budget growth, then joins spending growth to outcome trends citywide.
2. **Reach efficiency** (Pane R): of the New Yorkers who qualify for a service, how many actually get it? An agency can hold its budget flat and still fail most of the people it exists to serve, a different failure mode that spending analysis alone will not catch.

## Methodology

| Step | Question | Source |
|---|---|---|
| 1. Size the spending | Which agencies/cost lines are large and growing? Overtime = classic structural flag | MMR Agency Resources (NYC Open Data) |
| 2. Join cost to performance | Where did spending grow while outcomes stayed flat? | MMR Agency Performance Indicators (NYC Open Data) |
| 3. Drill into cost drivers | Is growth in staffing, overtime, or vendor contracts? | Checkbook NYC |
| 4. Frame hypotheses | Map findings to EO 12's four categories: efficiency, consolidation, insourcing, sunsetting | n/a |
| 5. Check reach | Of the people who qualify for a benefit, how many actually receive it? | HRA SNAPShot, PCAC and CSS Fair Fares research (curated, cited) |

High cost alone is not inefficiency. The target quadrant is **cost up and outcomes flat or down**. Flat spending is not reach either: SNAP and Fair Fares show the same city can serve most of one eligible population and less than half of another. Public data yields questions for follow-up, not conclusions. Confirming them requires internal data and conversations with the people who run the programs.

## Data sources

- [MMR Agency Resources](https://data.cityofnewyork.us/City-Government/Mayor-s-Management-Report-Agency-Resources/4qmi-txnk) (`4qmi-txnk`): expenditures, personnel, overtime by agency and FY
- [MMR Agency Performance Indicators](https://data.cityofnewyork.us/City-Government/Mayor-s-Management-Report-Agency-Performance-Indic/rbed-zzin) (`rbed-zzin`): outcome measures by agency goal, with desired direction per indicator
- [PMMR Spending and Budget](https://data.cityofnewyork.us/City-Government/Preliminary-Mayor-s-Management-Report-Spending-and/w4ne-9ea9) (`w4ne-9ea9`): PS vs. OTPS spending by unit of appropriation, mapped to MMR goals
- [Dynamic MMR](https://dmmr.nyc.gov/): 1,000+ indicators updated monthly
- [Checkbook NYC](https://www.checkbooknyc.com/data-feeds): spending, contracts, vendors (API available)

Reach pane (curated, not from the Socrata API, since NYC does not publish eligible-population estimates as an open dataset):

- [NYC HRA, SNAPShot (March 2026)](https://www.nyc.gov/assets/hra/downloads/pdf/facts/snap/SNAPParticipationNYC.pdf): SNAP participation rate and Program Access Index
- [PCAC, Fair Fares expansion report (2026)](https://pcac.org/report/fairfares/): Fair Fares eligible population and enrollment after the 2026 eligibility expansion
- [Community Service Society of NY (2026)](https://www.cssny.org/news/entry/fair-fares-nyc-expansion-who-qualifies-whats-changing-and-why-it-matters-new-yorkers): survey of Fair Fares take-up among people already verified eligible for other benefits

## Structure

```
data/raw/         # downloaded datasets (not committed)
data/processed/   # cleaned/joined tables
src/              # download + analysis scripts
outputs/          # figures, findings
web/              # Vite + TypeScript + D3 dashboard
supabase/         # schema migration for ny_* tables
knowledge/        # background cards: MMR, COGE, Executive Orders 12 and 13, what is new
```

## Quickstart

### Analysis pipeline

```bash
pip install -r requirements.txt
python3 src/01_download.py          # pull MMR datasets from NYC Open Data
python3 src/02_analyze.py           # Pane A: overtime vs expenditure growth, FY2023-FY2026 plus the FY2023-FY2025 comparison
python3 src/03_analyze_performance.py # Pane B: cost × outcome quadrant, both windows, with zone changes
python3 src/05_build_findings.py    # narrative cards + findings.md
python3 src/07_build_reach.py       # Pane R: SNAP vs Fair Fares take-up (curated, cited)
python3 src/06_generate_seed_sql.py # regenerate supabase/seed.sql from all of the above
```

### Dashboard (local)

```bash
cd web
cp .env.example .env
npm install
npm run dev
```

### Supabase

Tables are prefixed `ny_*` on project `ny-efficiency` (`ysdhkbinzdfmxbdfmvxo`). Public read is enabled via RLS. Free-tier projects pause after a period of inactivity; if the dashboard shows "Unable to load dashboard", restore the project from the Supabase dashboard.

Re-seed after re-running analysis:

```bash
supabase link --project-ref ysdhkbinzdfmxbdfmvxo
python3 src/05_build_findings.py
# then run generated SQL via supabase db query --linked -f ...
```

Or use `python3 src/04_export_supabase.py` with `SUPABASE_SERVICE_ROLE_KEY` set.

### Deploy (Vercel)

```bash
cd web
vercel --prod
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the Vercel project settings.

## Author

Andrés Camacho · [afcamachob@uchicago.edu](mailto:afcamachob@uchicago.edu)
