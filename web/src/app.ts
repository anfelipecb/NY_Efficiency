import { renderQuadrantChart } from "./charts/quadrant";
import {
  renderOvertimeChart,
  renderOvertimeDollars,
  renderOvertimeTrajectory,
  renderShareSlope,
} from "./charts/overtime";
import { renderReachChart, renderReachTrend } from "./charts/reach";
import { agencyLabel, loadDashboardData } from "./data";
import type { DashboardData, Finding, OtGrowth } from "./types";

type Pane = "A" | "B" | "R" | "C";

export async function mountApp(root: HTMLElement): Promise<void> {
  root.innerHTML = `<div class="loading">Loading NYC efficiency scan…</div>`;

  try {
    const data = await loadDashboardData();
    root.innerHTML = buildShell(data);
    bindInteractions(root, data);
    renderPane(root, "A", data);
  } catch (error) {
    root.innerHTML = `
      <section class="error-panel">
        <h1>Unable to load dashboard</h1>
        <p>${error instanceof Error ? error.message : "Unknown error"}</p>
        <p class="muted">Check Supabase env vars and public read policies.</p>
      </section>`;
  }
}

function buildShell(data: DashboardData): string {
  const targetCount = data.quadrant.filter((row) => row.quadrant === "target_hypothesis").length;

  return `
    <header class="hero">
      <div class="hero-copy">
        <p class="eyebrow">First Deputy Mayor · Efficiency scan · ${data.meta.window ?? "FY2023 to FY2026"}</p>
        <h1>NY Efficiency</h1>
        <p class="lede">
          Efficiency has two different failure modes: spending more without a better result,
          and spending fine while people who qualify never get the help. This walks through
          both, framed the way Executive Order 12 asks agencies to look for recurring
          cost pressure, and then a second lens on whether services actually reach people.
        </p>
        <div class="hero-actions">
          <button class="btn btn-primary" data-pane="A">Start with overtime</button>
          <button class="btn btn-secondary" data-pane="B">Citywide scan (${targetCount} flags)</button>
          <button class="btn btn-secondary" data-pane="R">Does it reach people?</button>
          <button class="btn btn-secondary" data-pane="C">How this was built</button>
        </div>
      </div>
    </header>

    <nav class="pane-nav" aria-label="Story panes">
      <button class="pane-tab active" data-pane="A">Overtime</button>
      <button class="pane-tab" data-pane="B">Cost and outcomes</button>
      <button class="pane-tab" data-pane="R">Reach</button>
      <button class="pane-tab" data-pane="C">Data annex</button>
    </nav>

    <main id="pane-root"></main>

    <footer class="site-footer">
      <p>${data.meta.disclaimer ?? "Public-data scan. Not an audit."}</p>
      <p class="muted">${data.meta.methodology ?? ""}</p>
      <p class="byline">Andrés Camacho · Independent analysis of NYC public data</p>
    </footer>
  `;
}

function bindInteractions(root: HTMLElement, data: DashboardData): void {
  const setPane = (pane: Pane) => {
    root.querySelectorAll(".pane-tab").forEach((tab) => {
      tab.classList.toggle("active", tab.getAttribute("data-pane") === pane);
    });
    renderPane(root, pane, data);
    document.getElementById("pane-root")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  root.querySelectorAll("[data-pane]").forEach((el) => {
    el.addEventListener("click", () => setPane(el.getAttribute("data-pane") as Pane));
  });
}

function renderPane(root: HTMLElement, pane: Pane, data: DashboardData): void {
  const paneRoot = root.querySelector("#pane-root");
  if (!paneRoot) return;

  if (pane === "A") {
    paneRoot.innerHTML = renderPaneA(data);
    const select = (agency: string) => highlightFinding(paneRoot, agency);
    const growthChart = paneRoot.querySelector<HTMLElement>("#ot-chart");
    const trajectoryChart = paneRoot.querySelector<HTMLElement>("#ot-trajectory-chart");
    const dollarsChart = paneRoot.querySelector<HTMLElement>("#ot-dollars-chart");
    const shareChart = paneRoot.querySelector<HTMLElement>("#share-chart");
    if (growthChart) renderOvertimeChart(growthChart, data.otGrowth, select);
    if (trajectoryChart) renderOvertimeTrajectory(trajectoryChart, data.otSeries, select);
    if (dollarsChart) renderOvertimeDollars(dollarsChart, data.otSeries, select);
    if (shareChart) renderShareSlope(shareChart, data.otSeries);
    return;
  }

  if (pane === "B") {
    paneRoot.innerHTML = renderPaneB(data, root.getAttribute("data-selected") ?? null);
    const quadrantChart = paneRoot.querySelector<HTMLElement>("#quadrant-chart");
    if (quadrantChart) {
      renderQuadrantChart(quadrantChart, data.quadrant, (agency) => {
        root.setAttribute("data-selected", agency);
        renderPane(root, "B", data);
      });
    }
    return;
  }

  if (pane === "R") {
    paneRoot.innerHTML = renderPaneR(data);
    const reachChart = paneRoot.querySelector<HTMLElement>("#reach-chart");
    if (reachChart) {
      renderReachChart(reachChart, data.reach);
    }
    const trendChart = paneRoot.querySelector<HTMLElement>("#reach-trend-chart");
    if (trendChart) {
      renderReachTrend(trendChart, data.reachSeries);
    }
    return;
  }

  paneRoot.innerHTML = renderPaneC(data);
  bindAnnexInteractions(paneRoot);
}

function renderPaneA(data: DashboardData): string {
  const storyOrder = ["NYPD", "DOC", "DOF", "DSNY"];
  const cards = storyOrder
    .map((agency) => data.findings.find((f) => f.pane === "A" && f.agency === agency))
    .filter((f): f is Finding => Boolean(f))
    .map((f) => findingCard(f))
    .join("");

  const stats = storyOrder
    .map((agency) => data.otGrowth.find((row) => row.agency === agency))
    .filter((row): row is OtGrowth => Boolean(row))
    .map((row) => statStrip(row))
    .join("");

  return `
    <section class="pane-intro">
      <h2>Where overtime is growing faster than the budget</h2>
      <p>
        <strong>Overtime</strong> means pay for hours worked beyond the normal schedule
        (the Mayor's Management Report line "Overtime paid"). A big overtime bill is not
        proof of waste by itself. The useful question is whether overtime is rising faster
        than the rest of the agency budget. If it is, that cost is recurring. That is the
        kind of pressure Executive Order 12 asks agencies to examine.
      </p>
      <p class="muted">
        The window now runs from FY2023 through FY2026, using the Fiscal 2026 Mayor's
        Management Report published in September 2026. The earlier FY2023 to FY2025 view
        is kept alongside it, so you can see what one more year of data changed.
      </p>
    </section>

    <section class="stat-grid">${stats}</section>

    <section class="reach-callout">
      <p class="eyebrow">What FY2026 changed</p>
      <h3>One agency turned, one kept climbing, one spike went away, one appeared</h3>
      <ul class="change-list">
        ${changeLine(data, "NYPD", "after peaking at $1.14 billion in FY2025 (as first reported). Over four years it still grew faster than the budget.")}
        ${changeLine(data, "DOC", "a second straight increase with no sign of a turn. Overtime is now over a quarter of the budget.")}
        ${changeLine(data, "DOF", "back below its FY2023 level. The FY2025 jump was a one-year event.")}
        ${changeLine(data, "DSNY", "after three roughly flat years. The largest one-year jump among big-budget agencies.")}
      </ul>
    </section>

    <section class="viz-block">
      <div class="viz-head">
        <h3>The comparison that matters: growth rates</h3>
        <p class="muted">
          Gray is total budget growth. Light teal is overtime growth through FY2025, the earlier
          view. Dark teal is overtime growth through FY2026. Hover a bar for the dollar path
          behind the percentage.
        </p>
      </div>
      <div id="ot-chart" class="chart-host"></div>
    </section>

    <section class="viz-block">
      <div class="viz-head">
        <h3>Year by year: overtime against the rest of the budget</h3>
        <p class="muted">
          Both lines start at 100 in FY2023. When the solid line pulls above the dashed one,
          overtime is growing faster than the agency as a whole. Each panel has its own scale.
        </p>
      </div>
      <div id="ot-trajectory-chart" class="chart-host"></div>
    </section>

    <section class="viz-block">
      <div class="viz-head">
        <h3>Overtime paid in dollars</h3>
        <p class="muted">
          Same four agencies, absolute dollars, FY2023 through FY2026. Labels mark each
          agency's peak year and the latest year. Hover for exact amounts.
        </p>
      </div>
      <div id="ot-dollars-chart" class="chart-host"></div>
    </section>

    <section class="viz-block">
      <div class="viz-head">
        <h3>Overtime as a share of the agency budget</h3>
        <p class="muted">
          How large a slice of total spending overtime takes each year. Labels show the point
          change from FY2023 to FY2026.
        </p>
      </div>
      <div id="share-chart" class="chart-host"></div>
    </section>

    <section class="findings-grid">${cards}</section>
  `;
}

function renderPaneB(data: DashboardData, selectedAgency: string | null): string {
  const cards = data.findings
    .filter((f) => f.pane === "B")
    .map((f) => findingCard(f, selectedAgency))
    .join("");

  const selected = selectedAgency
    ? data.quadrant.find((row) => row.agency === selectedAgency)
    : null;

  const detail = selected
    ? `<aside class="detail-panel">
        <p class="eyebrow">Selected agency</p>
        <h3>${agencyLabel(selected)}</h3>
        <dl>
          <div><dt>Exp growth</dt><dd>${fmtPct(selected.exp_growth_pct)}</dd></div>
          <div><dt>Outcome trend</dt><dd>${fmtPct(selected.outcome_delta_pct)}</dd></div>
          <div><dt>Indicators improving</dt><dd>${selected.indicators_improving ?? 0} / ${selected.indicator_count ?? 0}</dd></div>
          <div><dt>Quadrant</dt><dd>${selected.quadrant_label ?? "n/a"}</dd></div>
          <div><dt>Through FY2025</dt><dd>Cost ${fmtPct(selected.exp_growth_prev_pct)} · outcomes ${fmtPct(selected.outcome_delta_prev_pct)}</dd></div>
          <div><dt>Since adding FY2026</dt><dd>${zoneChangeLabel(selected.zone_change)}</dd></div>
        </dl>
      </aside>`
    : `<aside class="detail-panel detail-panel--empty">
        <p>Click a point to see what sits behind that agency's score.</p>
      </aside>`;

  return `
    <section class="pane-intro">
      <h2>Where spending rose and outcomes did not</h2>
      <p>
        High cost alone is not the story. Look for agencies where spending went up while the
        median performance trend stayed flat or moved the wrong way. Those are places to ask
        better questions. They are not audit findings.
      </p>
      <p class="muted">
        Scored over FY2023 to FY2026, ${data.meta.zone_count ?? "n/a"} agencies sit in the zone,
        compared with ${data.meta.zone_count_prev ?? "n/a"} when the same method stops at FY2025.
        ${data.meta.zone_entered ?? "0"} entered once FY2026 was added and
        ${data.meta.zone_left ?? "0"} left. The biggest move is the Department of Buildings,
        where plan review and inspection wait times rose sharply in FY2026.
      </p>
    </section>

    <section class="viz-layout">
      <div class="viz-block viz-block--wide">
        <div class="viz-head">
          <h3>Cost and outcome quadrant</h3>
          <p class="muted">
            Shaded zone: spending up, outcomes flat or down. For agencies that changed zone,
            the hollow circle marks where they sat through FY2025.
          </p>
        </div>
        <div id="quadrant-chart" class="chart-host chart-host--tall"></div>
      </div>
      ${detail}
    </section>

    <section class="findings-grid">${cards}</section>
  `;
}

function renderPaneR(data: DashboardData): string {
  const snap = data.reach.find((row) => row.program === "SNAP");
  const fairFares = data.reach.find((row) => row.program === "FAIR_FARES");
  const overlap = data.reach.find((row) => row.program === "FAIR_FARES_VERIFIED_OVERLAP");

  const stats = [snap, fairFares]
    .filter((row): row is (typeof data.reach)[number] => Boolean(row))
    .map(
      (row) => `
      <div class="stat-card">
        <p class="stat-label">${row.program_label}</p>
        <p class="stat-value">${row.takeup_rate_pct?.toFixed(0) ?? "n/a"}%</p>
        <p class="stat-caption">Take-up rate, ${row.population_year}</p>
        <p class="stat-caption">${row.enrolled_population ? peopleFmt(row.enrolled_population) : "n/a"} enrolled of ~${row.eligible_population ? peopleFmt(row.eligible_population) : "n/a"} eligible</p>
      </div>`,
    )
    .join("");

  const sources = [snap, fairFares, overlap]
    .filter((row): row is (typeof data.reach)[number] => Boolean(row))
    .map(
      (row) => `
      <a class="source-card" href="${row.source_url ?? "#"}" target="_blank" rel="noopener noreferrer">
        <p class="eyebrow">${row.population_year}</p>
        <h4>${row.program_label}</h4>
        <p>${row.note ?? ""}</p>
        <span class="source-link">${row.source_label ?? "Source"}</span>
      </a>`,
    )
    .join("");

  return `
    <section class="pane-intro">
      <h2>A second kind of efficiency: does it reach people?</h2>
      <p>
        Everything so far asks whether spending buys results. This pane asks a different
        question: of the New Yorkers who qualify for a service, how many actually get it?
        An agency can hold its budget flat and still fail most of the people it exists to
        serve. That gap, not the budget line, is often the bigger problem.
      </p>
      <p class="muted">
        SNAP and Fair Fares sit at opposite ends of the same idea. SNAP reaches most
        of the people who qualify. Fair Fares does not, even though it has expanded who
        can apply. The numbers below are curated from published city and research reports,
        not the NYC Open Data API used elsewhere in this project. See sources below for exact citations.
      </p>
    </section>

    <section class="stat-grid">${stats}</section>

    <section class="viz-block">
      <div class="viz-head">
        <h3>Enrollment over time, FY2020 to FY2026</h3>
        <p class="muted">
          Straight from the Mayor's Management Report indicators on NYC Open Data. SNAP had
          its largest drop in the series in FY2026, which HRA attributes mainly to federal
          eligibility changes under H.R.1. Fair Fares kept growing, but at its slowest pace in
          the series. The take-up rates below are from 2024 (SNAP) and 2026 (Fair Fares), so read
          them alongside this trend.
        </p>
      </div>
      <div id="reach-trend-chart" class="chart-host"></div>
    </section>

    <section class="viz-block">
      <div class="viz-head">
        <h3>Eligible pool vs. people actually enrolled</h3>
        <p class="muted">
          Gray is the estimated eligible population. Teal is who is actually enrolled.
          Hover a bar for the source and exact count.
        </p>
      </div>
      <div id="reach-chart" class="chart-host"></div>
    </section>

    ${
      overlap
        ? `<section class="reach-callout">
        <p class="eyebrow">The clearest sign this is a process gap, not an eligibility gap</p>
        <h3>${overlap.headline}</h3>
        <p>${overlap.note}</p>
      </section>`
        : ""
    }

    <section class="annex-section">
      <div class="viz-head">
        <h3>Key takeaways</h3>
      </div>
      <div class="talk-grid">
        <article class="talk-card">
          <p class="talk-num">01</p>
          <h4>Cost efficiency and reach efficiency are different axes</h4>
          <p>Flat spending can still mean most eligible people are not served. Both lenses matter, and they call for different fixes.</p>
        </article>
        <article class="talk-card">
          <p class="talk-num">02</p>
          <h4>The fix is often structural, not more outreach spend</h4>
          <p>The city already verifies income for SNAP and Cash Assistance. Auto-enrolling those same people into Fair Fares would close most of the gap without a new campaign.</p>
        </article>
        <article class="talk-card">
          <p class="talk-num">03</p>
          <h4>This scorecard is meant to generalize</h4>
          <p>Eligible population, people served, take-up rate: the same three numbers work for any benefit program. Point this same scan at a new program and you get a comparable diagnosis in an afternoon.</p>
        </article>
      </div>
    </section>

    <section class="annex-section">
      <div class="viz-head">
        <h3>Sources for this pane</h3>
      </div>
      <div class="source-grid">${sources}</div>
    </section>
  `;
}

function peopleFmt(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  return `${Math.round(value / 1000)}K`;
}

function renderPaneC(data: DashboardData): string {
  const target = data.quadrant.filter((row) => row.quadrant === "target_hypothesis");
  const focus = data.otGrowth.filter((row) => row.pane_a_focus);
  const agencyCount = data.otGrowth.length;
  const vintage = data.meta.data_vintage ?? "2026-07-24";

  const pipelineSteps = [
    {
      id: "1",
      title: "Pull open data",
      script: "01_download.py",
      body: "Download the Mayor's Management Report agency resources, performance indicators, and PMMR spending tables from NYC Open Data.",
      detail:
        "Datasets: 4qmi-txnk (resources), rbed-zzin (performance), w4ne-9ea9 (PMMR). Keep citywide performance rows and drop retired indicators.",
    },
    {
      id: "2",
      title: "Measure overtime pressure",
      script: "02_analyze.py",
      body: "Put overtime on a common scale (thousands converted to millions), then compare spending growth, overtime growth, and overtime as a share of the budget for FY2023 through FY2026, with the FY2023 to FY2025 window kept for comparison.",
      detail: `Writes growth_fy23_26.csv for ${agencyCount} agencies plus a year-by-year series. The deep dive focuses on NYPD, DOC, DOF, and DSNY.`,
    },
    {
      id: "3",
      title: "Join cost to outcomes",
      script: "03_analyze_performance.py",
      body: "For each agency, score the median performance trend using the indicator's desired direction (up or down), then place agencies on the cost and outcome chart.",
      detail: `The zone to watch is spending up more than 2% with outcomes flat or down (median change at or below 2%). ${target.length} agencies land there through FY2026. Both windows are scored with the same method, so agencies that entered or left the zone are flagged.`,
    },
    {
      id: "4",
      title: "Write the findings",
      script: "05_build_findings.py",
      body: "Turn the numbers into short cards with caveats, ready for someone reading this as a blog or a briefing.",
      detail: `${data.findings.length} cards go into Supabase (ny_findings), along with methodology notes in ny_meta.`,
    },
    {
      id: "5",
      title: "Add a second lens: reach",
      script: "07_build_reach.py",
      body: "Curate published take-up figures (eligible population vs. people actually served) for SNAP and Fair Fares, since NYC Open Data does not publish eligible-population estimates directly. Enrollment trends come straight from MMR indicators.",
      detail: "Every row carries a source and a URL. This lens answers a different question than Panes A and B: not what things cost, but who they actually reach.",
    },
    {
      id: "6",
      title: "Publish the product",
      script: "Supabase to Vercel",
      body: "Load the processed tables into Postgres with public read access. The Vite and D3 dashboard reads them with the anon key.",
      detail:
        "Python and pandas for the analysis, Supabase for the tables, TypeScript and D3 for the story.",
    },
  ];

  const sources = [
    {
      name: "MMR Agency Resources",
      id: "4qmi-txnk",
      use: "Expenditures, overtime paid, and personnel by agency and fiscal year",
      href: "https://data.cityofnewyork.us/City-Government/Mayor-s-Management-Report-Agency-Resources/4qmi-txnk",
    },
    {
      name: "MMR Performance Indicators",
      id: "rbed-zzin",
      use: "Outcome measures with a desired direction (up or down)",
      href: "https://data.cityofnewyork.us/City-Government/Mayor-s-Management-Report-Agency-Performance-Indic/rbed-zzin",
    },
    {
      name: "PMMR Spending and Budget",
      id: "w4ne-9ea9",
      use: "Personal service vs other-than-personal-service spending (downloaded, not used in the first join)",
      href: "https://data.cityofnewyork.us/City-Government/Preliminary-Mayor-s-Management-Report-Spending-and/w4ne-9ea9",
    },
  ];

  const talkingPoints = [
    {
      title: "High cost is not the same as inefficiency",
      body: "Look for where spending rose and outcomes stayed flat or got worse. Money alone never proves waste.",
    },
    {
      title: "Public data identifies questions, not answers",
      body: "These flags are starting points for conversations with the people who run the programs. Confirming them requires internal data.",
    },
    {
      title: "Overtime growing faster than the budget is a structural flag",
      body: "DOC overtime rose 24.5% from FY2023 to FY2026 while its budget grew 1.6%, and it climbed again in FY2026. NYPD overtime passed $1.1 billion in FY2025 and came down 15% in FY2026, but is still growing faster than the department budget over four years.",
    },
    {
      title: "More years make the scan more honest",
      body: "Adding FY2026 confirmed DOC, softened NYPD, cleared DOF's FY2025 spike, and surfaced a new one at DSNY. In the citywide scan, three agencies left the zone and two entered. A flag that survives another year deserves more weight than one that does not.",
    },
    {
      title: "A repeatable pipeline, not a one-off analysis",
      body: "The scan runs from raw open data to processed tables, a live database, and this dashboard, so it can be refreshed each time a new Mayor's Management Report is published.",
    },
  ];

  const findingsA = focus
    .map((row) => {
      const card = data.findings.find((f) => f.pane === "A" && f.agency === row.agency);
      return `
        <article class="annex-finding">
          <p class="eyebrow">${row.agency}</p>
          <h4>${card?.title ?? `${row.agency} overtime`}</h4>
          <p>FY2023 to FY2026: overtime ${fmtPct(row.ot_growth_pct)} vs budget ${fmtPct(row.exp_growth_pct)}. Through FY2025, overtime was ${fmtPct(row.ot_growth_prev_pct)}. Share of budget in FY2026: ${fmtPct(row.ot_share_2026_pct)}.</p>
        </article>`;
    })
    .join("");

  const findingsB = target
    .slice(0, 6)
    .map(
      (row) => `
      <tr>
        <td>${row.agency}</td>
        <td>${fmtPct(row.exp_growth_pct)}</td>
        <td>${fmtPct(row.outcome_delta_pct)}</td>
        <td>${row.indicators_improving ?? 0}/${row.indicator_count ?? 0}</td>
        <td>${zoneChangeLabel(row.zone_change)}</td>
      </tr>`,
    )
    .join("");

  return `
    <section class="pane-intro">
      <h2>How this was built</h2>
      <p>
        Methodology in plain language: where the data comes from, how the pipeline runs,
        what the analysis found, and where its limits are.
      </p>
    </section>

    <section class="annex-section">
      <div class="viz-head">
        <h3>What is overtime here?</h3>
      </div>
      <div class="viz-block">
        <p>
          In this project, <strong>overtime</strong> is the Mayor's Management Report field
          "Overtime paid": dollars agencies report for hours worked beyond the regular schedule.
          Some agencies report it in millions, others in thousands. The analysis converts
          everything to millions so you can compare agencies on one chart.
        </p>
      </div>
    </section>

    <section class="annex-section">
      <div class="viz-head">
        <h3>Pipeline</h3>
        <p class="muted">Click a step to see what runs and what it produces. Data vintage: ${vintage}.</p>
      </div>
      <div class="pipeline">
        ${pipelineSteps
          .map(
            (step, i) => `
          <button
            class="pipeline-step${i === 0 ? " is-active" : ""}"
            type="button"
            data-pipeline-step="${step.id}"
            aria-pressed="${i === 0 ? "true" : "false"}"
          >
            <span class="pipeline-num">${step.id}</span>
            <span class="pipeline-title">${step.title}</span>
            <span class="pipeline-script">${step.script}</span>
          </button>`,
          )
          .join("")}
      </div>
      <div class="pipeline-detail viz-block" id="pipeline-detail" aria-live="polite">
        <p class="eyebrow">Step ${pipelineSteps[0].id} · ${pipelineSteps[0].script}</p>
        <h3>${pipelineSteps[0].title}</h3>
        <p>${pipelineSteps[0].body}</p>
        <p class="muted">${pipelineSteps[0].detail}</p>
      </div>
      <script type="application/json" id="pipeline-data">${JSON.stringify(pipelineSteps).replace(/</g, "\\u003c")}</script>
    </section>

    <section class="annex-section">
      <div class="viz-head">
        <h3>Data sources</h3>
        <p class="muted">NYC Open Data, Mayor's Management Report family</p>
      </div>
      <div class="source-grid">
        ${sources
          .map(
            (source) => `
          <a class="source-card" href="${source.href}" target="_blank" rel="noopener noreferrer">
            <p class="eyebrow">${source.id}</p>
            <h4>${source.name}</h4>
            <p>${source.use}</p>
            <span class="source-link">Open on NYC Open Data</span>
          </a>`,
          )
          .join("")}
      </div>
      <p class="muted annex-note">
        ${data.meta.eo12_framing ?? ""}
        Window: FY2023 to FY2026, with FY2023 to FY2025 kept for comparison. Left out of the citywide ranking for unit noise: OTI, CCRB, DOP.
      </p>
    </section>

    <section class="annex-section">
      <div class="viz-head">
        <h3>What turned up</h3>
        <p class="muted">Places to ask about. Not conclusions.</p>
      </div>
      <div class="annex-findings-layout">
        <div>
          <h4 class="annex-subhead">Overtime flags</h4>
          <div class="annex-finding-grid">${findingsA}</div>
        </div>
        <div>
          <h4 class="annex-subhead">Cost up, outcomes flat or down (top 6)</h4>
          <div class="viz-block annex-table-wrap">
            <table class="annex-table">
              <thead>
                <tr>
                  <th>Agency</th>
                  <th>Spend growth</th>
                  <th>Outcome</th>
                  <th>Improving</th>
                  <th>vs FY2025 view</th>
                </tr>
              </thead>
              <tbody>${findingsB}</tbody>
            </table>
            <p class="muted">${target.length} agencies sit in that zone overall.</p>
          </div>
        </div>
      </div>
    </section>

    <section class="annex-section">
      <div class="viz-head">
        <h3>Key takeaways</h3>
        <p class="muted">The main conclusions from the analysis</p>
      </div>
      <div class="talk-grid">
        ${talkingPoints
          .map(
            (point, i) => `
          <article class="talk-card">
            <p class="talk-num">${String(i + 1).padStart(2, "0")}</p>
            <h4>${point.title}</h4>
            <p>${point.body}</p>
          </article>`,
          )
          .join("")}
      </div>
    </section>

    <section class="annex-section annex-limits">
      <h3>Limitations</h3>
      <ul>
        <li>Four fiscal years. Enough to separate a one-year spike from a trend, still short of a full cycle.</li>
        <li>Spending and overtime are as reported in each year's MMR. Later reports sometimes restate a prior year, so small differences from the latest tables are expected.</li>
        <li>The outcome score is the median of indicators that have values in both FY2023 and FY2026. Indicators with a zero FY2023 value are dropped because percent change is undefined.</li>
        <li>No Checkbook NYC vendor drill-down yet. Cost drivers stop at overtime vs total spend.</li>
        <li>Agency labels differ across MMR tables. Joins use agency codes.</li>
      </ul>
    </section>
  `;
}

function bindAnnexInteractions(paneRoot: Element): void {
  const detail = paneRoot.querySelector("#pipeline-detail");
  const raw = paneRoot.querySelector("#pipeline-data")?.textContent;
  if (!detail || !raw) return;

  const steps = JSON.parse(raw) as Array<{
    id: string;
    title: string;
    script: string;
    body: string;
    detail: string;
  }>;

  const showStep = (id: string) => {
    const step = steps.find((s) => s.id === id) ?? steps[0];
    detail.innerHTML = `
      <p class="eyebrow">Step ${step.id} · ${step.script}</p>
      <h3>${step.title}</h3>
      <p>${step.body}</p>
      <p class="muted">${step.detail}</p>`;
    paneRoot.querySelectorAll(".pipeline-step").forEach((btn) => {
      const active = btn.getAttribute("data-pipeline-step") === id;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });
  };

  paneRoot.querySelectorAll(".pipeline-step").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-pipeline-step");
      if (id) showStep(id);
    });
  });
}

function findingCard(finding: Finding, selectedAgency: string | null = null): string {
  const active = selectedAgency && finding.agency === selectedAgency ? " finding-card--active" : "";
  return `
    <article class="finding-card${active}" data-agency="${finding.agency ?? ""}">
      <p class="eyebrow">${findingEyebrow(finding)} · ${finding.agency ?? ""}</p>
      <h3>${finding.title}</h3>
      <p>${finding.body}</p>
      <p class="caveat">${finding.caveat ?? ""}</p>
    </article>`;
}

function findingEyebrow(finding: Finding): string {
  if (finding.pane === "A") return "Overtime";
  if ((finding.sort_order ?? 0) > 20) return "What FY2026 changed";
  return "Worth asking";
}

function signedPct(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "n/a";
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function changeLine(data: DashboardData, agency: string, text: string): string {
  const row = data.otGrowth.find((r) => r.agency === agency);
  if (!row) return "";
  return `<li><strong>${agency}</strong> overtime ${signedPct(row.ot_change_latest_pct)} in FY2026, ${text}</li>`;
}

function zoneChangeLabel(change: string | null | undefined): string {
  switch (change) {
    case "entered_zone":
      return "Entered the zone";
    case "left_zone":
      return "Left the zone";
    case "stayed_in_zone":
      return "In the zone both times";
    case "stayed_out":
      return "Outside the zone both times";
    case "new_in_zone":
      return "New, not scored before";
    default:
      return "n/a";
  }
}

function statStrip(row: OtGrowth): string {
  const shareDelta =
    row.ot_share_2026_pct != null && row.ot_share_2023_pct != null
      ? row.ot_share_2026_pct - row.ot_share_2023_pct
      : null;
  const shareNote =
    shareDelta == null
      ? ""
      : `<p class="stat-caption">Share of budget in FY2026: ${row.ot_share_2026_pct?.toFixed(1)}% (${shareDelta >= 0 ? "+" : ""}${shareDelta.toFixed(1)} pts)</p>`;

  return `
    <div class="stat-card">
      <p class="stat-label">${row.agency}</p>
      <p class="stat-value">${signedPct(row.ot_growth_pct)}</p>
      <p class="stat-caption">Overtime growth, FY2023 to FY2026</p>
      <p class="stat-caption">Budget growth ${signedPct(row.exp_growth_pct)} · Through FY2025, overtime was ${signedPct(row.ot_growth_prev_pct)}</p>
      <p class="stat-caption">FY2026 alone: ${signedPct(row.ot_change_latest_pct)} (peak year FY${row.ot_peak_year ?? "n/a"})</p>
      ${shareNote}
    </div>`;
}

function highlightFinding(container: ParentNode, agency: string): void {
  container.querySelectorAll(".finding-card").forEach((card) => {
    card.classList.toggle("finding-card--active", card.getAttribute("data-agency") === agency);
  });
}

function fmtPct(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "n/a";
  return `${value.toFixed(1)}%`;
}
