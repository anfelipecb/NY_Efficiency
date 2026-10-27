# Knowledge card: Mayor's Management Report (MMR)

**In one line:** the City Charter's performance report card for city agencies, published twice a year, and the main public dataset behind this project.

## What it is

- Required by **Section 12 of the New York City Charter**. The Mayor reports to the public and the City Council twice a year on how agencies deliver services.
- Published by the **Mayor's Office of Operations** since **1977**.
- Two editions:
  - **MMR** (every September): the full fiscal year, July through June.
  - **PMMR** (Preliminary MMR, early in the calendar year): the first four months of the fiscal year, July through October.
- Covers **45 agencies and organizations** and **more than 2,000 performance indicators** (FY2026 edition).

## What is inside each agency chapter

| Section | What you get | Why it matters for efficiency work |
|---|---|---|
| Services and goals | What the agency is trying to do | Frames what "outcome" means for that agency |
| Performance indicators | Five fiscal years of data, a target, and a desired direction (up or down). Critical indicators are starred | Lets you score whether outcomes improved |
| Agency resources | Expenditures, revenues, personnel, **overtime paid**, capital commitments | The cost side of the cost and outcome join |
| Spending and budget | Spending by unit of appropriation, mapped to goals where possible | Connects dollars to specific goals |
| 311 customer service | Timeliness on email, letters, service requests | A rough service-experience signal |
| Noteworthy changes | Corrections and revisions to earlier numbers | Tells you when a prior figure was restated |

## Where the data lives

- Printable reports and archive back to FY1997: [nyc.gov/mmr](https://www.nyc.gov/site/operations/reports/mmr.page)
- **Dynamic MMR** (monthly updates, full history, some indicators by community district or precinct): [dmmr.nyc.gov](https://dmmr.nyc.gov/)
- NYC Open Data, the two datasets this project uses:
  - [MMR Agency Resources](https://data.cityofnewyork.us/City-Government/Mayor-s-Management-Report-Agency-Resources/4qmi-txnk) (`4qmi-txnk`)
  - [MMR Performance Indicators](https://data.cityofnewyork.us/City-Government/Mayor-s-Management-Report-Agency-Performance-Indic/rbed-zzin) (`rbed-zzin`)

## Latest edition: Fiscal 2026 MMR (released September 2026)

- Covers July 1, 2025 to June 30, 2026: the last six months of the Adams administration and the first six of the Mamdani administration. Commentators (Politico, Sept 18) treated it as Mamdani's "first report card", with that caveat.
- Headline claims in the Mayor's letter: affordable housing completions up 20% to 26,971; child care voucher enrollment up 20% to nearly 110,000; potholes repaired up 27%; trees planted up 61%; more than double the bus lanes of the prior year; major felony crime down 2%, murders down 20%.
- FY2026 rows are **already on NYC Open Data** (199 resource rows, about 65,000 indicator rows). See [05_whats_new_oct_2026.md](05_whats_new_oct_2026.md) for how they change this project's story.

## Things to know before you analyze it

- **Numbers get revised.** The FY2026 MMR restated NYPD FY2025 overtime as $1,105.1M, versus $1,135.6M in the FY2025 report this project used. Always pull the latest vintage and note which edition a number came from.
- **Units vary by agency.** Overtime is reported in millions for some agencies and thousands for others (`Overtime paid ($000,000)` vs `Overtime paid ($000)`).
- **Agency names differ across tables.** Join on agency codes, not names.
- **Desired direction matters.** "Up" is good for some indicators and bad for others. Scoring outcomes without it gives nonsense.

## How it connects to this project and the role

- Panes A and B of the dashboard are built entirely on the MMR. It is the shared language between the First Deputy Mayor's office, OMB, and agencies when talking about performance.
- The EO 12 Chief Savings Officer assessments ask agencies to look at their most costly programs and the programs delivering the strongest results. The MMR is the natural public baseline for both.

## Interview angles

- "The MMR is the closest thing the city has to a shared scoreboard. My first pass always starts there, then I go to internal data to explain what the MMR only shows."
- "I would treat restatements in the 'Noteworthy changes' section as a data quality signal, not a footnote."

## Sources

- [Fiscal 2026 MMR (PDF)](https://www.nyc.gov/assets/operations/downloads/pdf/mmr2026/2026_mmr.pdf)
- [MMR page, Mayor's Office of Operations](https://www.nyc.gov/site/operations/reports/mmr.page)
- [Politico New York Playbook, Sept 18, 2026](https://www.politico.com/newsletters/new-york-playbook/2026/09/18/mamdanis-first-report-card-early-child-care-and-housing-struggles-lots-of-new-bus-lanes-01083501)
