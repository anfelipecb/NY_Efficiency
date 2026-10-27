"""Download MMR datasets from NYC Open Data (Socrata) into data/raw/.

Datasets:
  - 4qmi-txnk  MMR Agency Resources (expenditures, personnel, overtime by agency & FY)
  - rbed-zzin  MMR Agency Performance Indicators (citywide rows only, non-retired)
  - w4ne-9ea9  PMMR Spending and Budget (PS/OTPS by unit of appropriation)
"""

import io
import pathlib

import pandas as pd
import requests

RAW = pathlib.Path(__file__).resolve().parents[1] / "data" / "raw"
RAW.mkdir(parents=True, exist_ok=True)

BASE = "https://data.cityofnewyork.us/resource"
LIMIT = 500_000


def fetch(dataset_id: str, name: str, params: dict | None = None) -> pd.DataFrame:
    url = f"{BASE}/{dataset_id}.csv"
    p = {"$limit": LIMIT}
    if params:
        p.update(params)
    print(f"Downloading {name} ({dataset_id}) ...")
    r = requests.get(url, params=p, timeout=120)
    r.raise_for_status()
    df = pd.read_csv(io.StringIO(r.text), low_memory=False)
    out = RAW / f"{name}.csv"
    df.to_csv(out, index=False)
    print(f"  -> {out}  ({len(df):,} rows, {df.shape[1]} cols)")
    return df


if __name__ == "__main__":
    fetch("4qmi-txnk", "mmr_agency_resources")

    # Performance indicators: citywide only (geo mapping rows excluded), keep active indicators
    fetch(
        "rbed-zzin",
        "mmr_performance_indicators",
        params={
            "$select": (
                "agency,agency_name,fiscalyear,indicator,id,parentid,"
                "acceptedvalue,acceptedvalueytd,valuedate,desireddirection,"
                "critical,additive,measurement_type,frequency,goal,service,retired,geo"
            ),
            "$where": "(geo IS NULL OR geo = 'No') AND (retired IS NULL OR retired != 'Yes')",
        },
    )

    fetch("w4ne-9ea9", "pmmr_spending_budget")

    print("Done.")
