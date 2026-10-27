"""Shared paths and parsing helpers for NYC MMR analysis."""

from __future__ import annotations

import pathlib
import re

import pandas as pd

ROOT = pathlib.Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw"
OUT = ROOT / "data" / "processed"
OUTPUTS = ROOT / "outputs"

FY_START = 2023
FY_END = 2026
# End of the earlier analysis window, kept so each run can show what the newest year changed
FY_PREV_END = 2025
YEARS = list(range(FY_START, FY_END + 1))

MILLIONS_AGENCIES = {
    "NYPD", "FDNY", "DOC", "DSNY", "NYCHA", "H + H", "NYCHH",
    "HRA", "DHS", "DOE", "ACS",
}

DEEP_DIVE_AGENCIES = {"NYPD", "DOC", "DOF", "DSNY"}

EXPENDITURE_LABEL = "Expenditures ($000,000)"
OT_MILLIONS_LABEL = "Overtime paid ($000,000)"
OT_THOUSANDS_LABEL = "Overtime paid ($000)"


def ensure_dirs() -> None:
    RAW.mkdir(parents=True, exist_ok=True)
    OUT.mkdir(parents=True, exist_ok=True)
    OUTPUTS.mkdir(parents=True, exist_ok=True)


def parse_currency(value: str | float | int | None) -> float | None:
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return None
    if isinstance(value, (int, float)):
        return float(value)
    text = str(value).strip()
    if not text or text in {"*", "NA", "N/A", "-"}:
        return None
    cleaned = re.sub(r"[$,%]", "", text).replace(",", "")
    try:
        return float(cleaned)
    except ValueError:
        return None


def overtime_to_millions(value: float | None, label: str) -> float | None:
    if value is None:
        return None
    if OT_MILLIONS_LABEL in label:
        return value
    if OT_THOUSANDS_LABEL in label:
        return value / 1000.0
    return value


def load_agency_resources() -> pd.DataFrame:
    path = RAW / "mmr_agency_resources.csv"
    if not path.exists():
        raise FileNotFoundError(
            f"Missing {path}. Run `python3 src/01_download.py` first."
        )
    df = pd.read_csv(path, dtype=str)
    df["reporting_fiscal_year"] = df["reporting_fiscal_year"].astype(int)
    df["value"] = df["current_fy_projected_actual"].map(parse_currency)
    return df


def extract_expenditures(resources: pd.DataFrame) -> pd.DataFrame:
    exp = resources[
        (resources["resource_indicators"] == EXPENDITURE_LABEL)
        & resources["reporting_fiscal_year"].between(FY_START, FY_END)
    ].copy()
    return exp[["reporting_fiscal_year", "agency", "agency_name", "value"]].rename(
        columns={"value": "expenditures"}
    )


def extract_overtime(resources: pd.DataFrame) -> pd.DataFrame:
    ot = resources[
        resources["resource_indicators"].isin([OT_MILLIONS_LABEL, OT_THOUSANDS_LABEL])
        & resources["reporting_fiscal_year"].between(FY_START, FY_END)
    ].copy()
    ot["overtime_m"] = ot.apply(
        lambda row: overtime_to_millions(row["value"], row["resource_indicators"]),
        axis=1,
    )
    return ot[
        ["reporting_fiscal_year", "agency", "agency_name", "overtime_m", "resource_indicators"]
    ].rename(columns={"overtime_m": "overtime"})


def load_performance_indicators() -> pd.DataFrame:
    path = RAW / "mmr_performance_indicators.csv"
    if not path.exists():
        raise FileNotFoundError(
            f"Missing {path}. Run `python3 src/01_download.py` first."
        )
    df = pd.read_csv(path, low_memory=False)
    df["fiscalyear"] = pd.to_numeric(df["fiscalyear"], errors="coerce")
    df["acceptedvalue"] = pd.to_numeric(df["acceptedvalue"], errors="coerce")
    return df
