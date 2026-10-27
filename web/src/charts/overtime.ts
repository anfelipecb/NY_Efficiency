import * as d3 from "d3";
import type { OtGrowth, OtSeriesPoint } from "../types";

const STORY_ORDER = ["NYPD", "DOC", "DOF", "DSNY"];
const YEARS = [2023, 2024, 2025, 2026];
const YEAR_COLORS = ["#cbd5e1", "#94a3b8", "#475569", "#0b1f33"];

function focusAgencies(rows: OtGrowth[]): OtGrowth[] {
  return STORY_ORDER.map((agency) => rows.find((row) => row.agency === agency)).filter(
    (row): row is OtGrowth => Boolean(row),
  );
}

function focusSeries(series: OtSeriesPoint[]): OtSeriesPoint[] {
  return series.filter((p) => STORY_ORDER.includes(p.agency) && YEARS.includes(p.fiscal_year));
}

function moneyLabel(millions: number): string {
  if (millions >= 1000) {
    return `$${(millions / 1000).toFixed(2)} billion`;
  }
  if (millions >= 1) {
    return `$${millions.toFixed(1)} million`;
  }
  return `$${(millions * 1000).toFixed(0)} thousand`;
}

function axisMoney(millions: number): string {
  if (millions >= 1000) return `$${(millions / 1000).toFixed(2)}B`;
  if (millions >= 1) return `$${d3.format(",.0f")(millions)}M`;
  return `$${d3.format(",.1f")(millions)}M`;
}

function ensureTooltip(container: HTMLElement): d3.Selection<HTMLDivElement, unknown, null, undefined> {
  const existing = container.querySelector(".chart-tooltip");
  if (existing) existing.remove();
  return d3
    .select(container)
    .append("div")
    .attr("class", "chart-tooltip")
    .style("opacity", "0");
}

function addLegend(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  x: number,
  y: number,
  items: Array<{ label: string; color: string; dashed?: boolean }>,
): void {
  const legend = svg.append("g").attr("transform", `translate(${x}, ${y})`);
  let offset = 0;
  items.forEach((item) => {
    const node = legend.append("g").attr("transform", `translate(${offset}, 0)`);
    if (item.dashed !== undefined) {
      node
        .append("line")
        .attr("x1", 0)
        .attr("x2", 18)
        .attr("y1", 6)
        .attr("y2", 6)
        .attr("stroke", item.color)
        .attr("stroke-width", 2.5)
        .attr("stroke-dasharray", item.dashed ? "4 3" : null);
    } else {
      node.append("rect").attr("width", 12).attr("height", 12).attr("rx", 2).attr("fill", item.color);
    }
    const text = node
      .append("text")
      .attr("x", item.dashed !== undefined ? 24 : 18)
      .attr("y", 11)
      .text(item.label)
      .style("font-size", "12px")
      .style("fill", "var(--ink-muted)");
    offset += (text.node()?.getComputedTextLength() ?? item.label.length * 6.5) + 44;
  });
}

/** Chart 1: budget growth vs overtime growth, with the earlier window kept for comparison. */
export function renderOvertimeChart(
  container: HTMLElement,
  rows: OtGrowth[],
  onSelect: (agency: string) => void,
): void {
  const focus = focusAgencies(rows);
  const series = [
    { key: "budget", label: "Budget growth, FY2023 to FY2026", color: "#94a3b8" },
    { key: "ot_prev", label: "Overtime growth, FY2023 to FY2025", color: "#a5d8e3" },
    { key: "ot", label: "Overtime growth, FY2023 to FY2026", color: "#0e7490" },
  ];
  const data = focus.flatMap((row) => [
    {
      agency: row.agency,
      series: "budget",
      value: row.exp_growth_pct ?? 0,
      detail: `${moneyLabel(row.exp_2023 ?? 0)} to ${moneyLabel(row.exp_2026 ?? 0)}`,
    },
    {
      agency: row.agency,
      series: "ot_prev",
      value: row.ot_growth_prev_pct ?? 0,
      detail: `${moneyLabel(row.ot_2023 ?? 0)} to ${moneyLabel(row.ot_2025 ?? 0)}`,
    },
    {
      agency: row.agency,
      series: "ot",
      value: row.ot_growth_pct ?? 0,
      detail: `${moneyLabel(row.ot_2023 ?? 0)} to ${moneyLabel(row.ot_2026 ?? 0)}`,
    },
  ]);
  const seriesLabel = (key: string) => series.find((s) => s.key === key)?.label ?? key;

  const width = container.clientWidth || 760;
  const height = 360;
  const margin = { top: 28, right: 20, bottom: 56, left: 56 };

  container.innerHTML = "";
  const tooltip = ensureTooltip(container);
  const svg = d3
    .select(container)
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("role", "img")
    .attr(
      "aria-label",
      "Budget growth versus overtime growth for NYPD, DOC, DOF, and DSNY, through FY2025 and through FY2026",
    );

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const agencies = focus.map((row) => row.agency);
  const x0 = d3.scaleBand().domain(agencies).range([0, innerWidth]).padding(0.24);
  const x1 = d3
    .scaleBand()
    .domain(series.map((s) => s.key))
    .range([0, x0.bandwidth()])
    .padding(0.14);
  const yMax = d3.max(data, (d) => d.value) ?? 50;
  const yMin = Math.min(0, d3.min(data, (d) => d.value) ?? 0);
  const y = d3.scaleLinear().domain([yMin, yMax]).nice().range([innerHeight, 0]);
  const color = (key: string) => series.find((s) => s.key === key)?.color ?? "#475569";

  g.append("line")
    .attr("x1", 0)
    .attr("x2", innerWidth)
    .attr("y1", y(0))
    .attr("y2", y(0))
    .attr("stroke", "#cbd5e1");

  g.append("g")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x0))
    .selectAll("text")
    .style("font-size", "13px")
    .style("font-weight", "600");

  g.append("g")
    .call(d3.axisLeft(y).ticks(6).tickFormat((d) => `${d}%`))
    .selectAll("text")
    .style("font-size", "11px");

  const groups = g
    .selectAll("g.agency")
    .data(agencies)
    .join("g")
    .attr("class", "agency")
    .attr("transform", (agency) => `translate(${x0(agency)},0)`);

  groups
    .selectAll("rect")
    .data((agency) => data.filter((d) => d.agency === agency))
    .join("rect")
    .attr("x", (d) => x1(d.series) ?? 0)
    .attr("width", x1.bandwidth())
    .attr("y", y(0))
    .attr("height", 0)
    .attr("fill", (d) => color(d.series))
    .attr("rx", 4)
    .style("cursor", "pointer")
    .on("mouseover", (event, d) => {
      tooltip
        .style("opacity", "1")
        .html(
          `<strong>${d.agency}</strong><br/>${seriesLabel(d.series)}: <strong>${d.value.toFixed(1)}%</strong><br/><span style="opacity:.85">${d.detail}</span>`,
        );
      d3.select(event.currentTarget as SVGRectElement).attr("opacity", 0.85);
    })
    .on("mousemove", (event) => {
      tooltip
        .style("left", `${event.offsetX + 12}px`)
        .style("top", `${event.offsetY - 10}px`);
    })
    .on("mouseout", (event) => {
      tooltip.style("opacity", "0");
      d3.select(event.currentTarget as SVGRectElement).attr("opacity", 1);
    })
    .on("click", (_, d) => onSelect(d.agency))
    .transition()
    .duration(700)
    .delay((_, i) => i * 80)
    .attr("y", (d) => (d.value >= 0 ? y(d.value) : y(0)))
    .attr("height", (d) => Math.abs(y(d.value) - y(0)));

  groups
    .selectAll("text.bar-label")
    .data((agency) => data.filter((d) => d.agency === agency))
    .join("text")
    .attr("class", "bar-label")
    .attr("x", (d) => (x1(d.series) ?? 0) + x1.bandwidth() / 2)
    .attr("y", (d) => (d.value >= 0 ? y(d.value) - 6 : y(d.value) + 14))
    .attr("text-anchor", "middle")
    .style("font-size", "11px")
    .style("font-weight", "600")
    .style("fill", "#0b1f33")
    .text((d) => `${d.value.toFixed(1)}%`);

  addLegend(
    svg,
    margin.left,
    height - 20,
    series.map((s) => ({ label: s.label, color: s.color })),
  );
}

/** Chart 2: overtime vs budget indexed to FY2023 = 100, one small panel per agency. */
export function renderOvertimeTrajectory(
  container: HTMLElement,
  seriesRows: OtSeriesPoint[],
  onSelect: (agency: string) => void,
): void {
  const points = focusSeries(seriesRows);
  const agencies = STORY_ORDER.filter((a) => points.some((p) => p.agency === a));

  type IndexPoint = { agency: string; year: number; kind: "overtime" | "budget"; index: number; raw: number };
  const indexed: IndexPoint[] = agencies.flatMap((agency) => {
    const rows = points.filter((p) => p.agency === agency).sort((a, b) => a.fiscal_year - b.fiscal_year);
    const base = rows.find((r) => r.fiscal_year === YEARS[0]);
    if (!base?.overtime || !base?.expenditures) return [];
    return rows.flatMap((r) => [
      { agency, year: r.fiscal_year, kind: "overtime" as const, index: ((r.overtime ?? 0) / base.overtime!) * 100, raw: r.overtime ?? 0 },
      { agency, year: r.fiscal_year, kind: "budget" as const, index: ((r.expenditures ?? 0) / base.expenditures!) * 100, raw: r.expenditures ?? 0 },
    ]);
  });

  const width = container.clientWidth || 760;
  const narrow = width < 640;
  const cols = narrow ? 1 : agencies.length > 3 ? 2 : agencies.length;
  const panelGap = 28;
  const panelHeight = 220;
  const margin = { top: 30, right: 30, bottom: 44, left: 44 };
  const rowsCount = Math.ceil(agencies.length / cols);
  const height = margin.top + rowsCount * panelHeight + (rowsCount - 1) * 40 + margin.bottom;
  const panelWidth = (width - margin.left - margin.right - (cols - 1) * (panelGap + margin.left)) / cols;
  const innerHeight = panelHeight - 30;

  container.innerHTML = "";
  const tooltip = ensureTooltip(container);
  const svg = d3
    .select(container)
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("role", "img")
    .attr("aria-label", "Overtime and total budget indexed to FY2023 equals 100, FY2023 to FY2026");

  const x = d3.scalePoint<number>().domain(YEARS).range([0, panelWidth]).padding(0.3);
  const lineColor = { overtime: "#0e7490", budget: "#94a3b8" };

  agencies.forEach((agency, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const ox = margin.left + col * (panelWidth + panelGap + margin.left);
    const oy = margin.top + row * (panelHeight + 40);
    const g = svg.append("g").attr("transform", `translate(${ox},${oy})`);
    const data = indexed.filter((p) => p.agency === agency);
    const [lo, hi] = d3.extent(data, (d) => d.index) as [number, number];
    const y = d3
      .scaleLinear()
      .domain([Math.min(90, lo - 5), Math.max(110, hi + 8)])
      .nice()
      .range([innerHeight, 0]);

    g.append("text")
      .attr("x", 0)
      .attr("y", -12)
      .text(agency)
      .style("font-size", "14px")
      .style("font-weight", "700")
      .style("fill", "var(--navy)")
      .style("cursor", "pointer")
      .on("click", () => onSelect(agency));

    g.append("line")
      .attr("x1", 0)
      .attr("x2", panelWidth)
      .attr("y1", y(100))
      .attr("y2", y(100))
      .attr("stroke", "#e2e8f0")
      .attr("stroke-dasharray", "3 3");

    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).tickFormat((d) => `FY${String(d).slice(2)}`))
      .selectAll("text")
      .style("font-size", "11px");
    g.append("g")
      .call(d3.axisLeft(y).ticks(5))
      .selectAll("text")
      .style("font-size", "11px");

    (["budget", "overtime"] as const).forEach((kind) => {
      const lineData = data.filter((d) => d.kind === kind);
      const path = g
        .append("path")
        .datum(lineData)
        .attr("fill", "none")
        .attr("stroke", lineColor[kind])
        .attr("stroke-width", kind === "overtime" ? 3 : 2)
        .attr("stroke-dasharray", kind === "budget" ? "5 4" : null)
        .attr(
          "d",
          d3
            .line<IndexPoint>()
            .x((d) => x(d.year) ?? 0)
            .y((d) => y(d.index)),
        );
      if (kind === "overtime") {
        const len = (path.node() as SVGPathElement).getTotalLength();
        path
          .attr("stroke-dasharray", `${len} ${len}`)
          .attr("stroke-dashoffset", len)
          .transition()
          .duration(900)
          .attr("stroke-dashoffset", 0);
      }

      g.selectAll(`circle.${kind}`)
        .data(lineData)
        .join("circle")
        .attr("class", kind)
        .attr("cx", (d) => x(d.year) ?? 0)
        .attr("cy", (d) => y(d.index))
        .attr("r", kind === "overtime" ? 4.5 : 3)
        .attr("fill", lineColor[kind])
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .style("cursor", "pointer")
        .on("mouseover", (_event, d) => {
          tooltip
            .style("opacity", "1")
            .html(
              `<strong>${d.agency} · FY${d.year}</strong><br/>${d.kind === "overtime" ? "Overtime paid" : "Total spending"}: <strong>${moneyLabel(d.raw)}</strong><br/>Index (FY2023 = 100): <strong>${d.index.toFixed(0)}</strong>`,
            );
        })
        .on("mousemove", (event) => {
          tooltip
            .style("left", `${event.offsetX + 12}px`)
            .style("top", `${event.offsetY - 10}px`);
        })
        .on("mouseout", () => tooltip.style("opacity", "0"));
    });

    const last = data.find((d) => d.kind === "overtime" && d.year === YEARS[YEARS.length - 1]);
    if (last) {
      g.append("text")
        .attr("x", (x(last.year) ?? 0) + 9)
        .attr("y", y(last.index) + 4)
        .attr("text-anchor", "start")
        .text(last.index.toFixed(0))
        .style("font-size", "12px")
        .style("font-weight", "700")
        .style("fill", lineColor.overtime);
    }
  });

  addLegend(svg, margin.left, height - 20, [
    { label: "Overtime paid", color: lineColor.overtime, dashed: false },
    { label: "Total agency spending", color: lineColor.budget, dashed: true },
  ]);
}

/** Chart 3: overtime dollars by year. */
export function renderOvertimeDollars(
  container: HTMLElement,
  seriesRows: OtSeriesPoint[],
  onSelect: (agency: string) => void,
): void {
  const points = focusSeries(seriesRows);
  const agencies = STORY_ORDER.filter((a) => points.some((p) => p.agency === a));
  const data = points.map((p) => ({ agency: p.agency, year: p.fiscal_year, value: p.overtime ?? 0 }));

  const width = container.clientWidth || 760;
  const height = 320;
  const margin = { top: 28, right: 20, bottom: 48, left: 64 };

  container.innerHTML = "";
  const tooltip = ensureTooltip(container);
  const svg = d3
    .select(container)
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("role", "img")
    .attr("aria-label", "Overtime paid in dollars for NYPD, DOC, DOF, and DSNY, FY2023 to FY2026");

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const x0 = d3.scaleBand().domain(agencies).range([0, innerWidth]).padding(0.24);
  const x1 = d3.scaleBand<number>().domain(YEARS).range([0, x0.bandwidth()]).padding(0.14);
  const y = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.value) ?? 0])
    .nice()
    .range([innerHeight, 0]);
  const color = d3.scaleOrdinal<number, string>().domain(YEARS).range(YEAR_COLORS);

  g.append("g")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x0))
    .selectAll("text")
    .style("font-size", "13px")
    .style("font-weight", "600");

  g.append("g")
    .call(d3.axisLeft(y).ticks(5).tickFormat((d) => axisMoney(d as number)))
    .selectAll("text")
    .style("font-size", "11px");

  const groups = g
    .selectAll("g.agency")
    .data(agencies)
    .join("g")
    .attr("transform", (agency) => `translate(${x0(agency)},0)`);

  groups
    .selectAll("rect")
    .data((agency) => data.filter((d) => d.agency === agency))
    .join("rect")
    .attr("x", (d) => x1(d.year) ?? 0)
    .attr("width", x1.bandwidth())
    .attr("y", innerHeight)
    .attr("height", 0)
    .attr("fill", (d) => color(d.year))
    .attr("rx", 3)
    .style("cursor", "pointer")
    .on("mouseover", (event, d) => {
      tooltip
        .style("opacity", "1")
        .html(`<strong>${d.agency}</strong><br/>FY${d.year} overtime paid<br/><strong>${moneyLabel(d.value)}</strong>`);
      d3.select(event.currentTarget as SVGRectElement).attr("opacity", 0.85);
    })
    .on("mousemove", (event) => {
      tooltip
        .style("left", `${event.offsetX + 12}px`)
        .style("top", `${event.offsetY - 10}px`);
    })
    .on("mouseout", (event) => {
      tooltip.style("opacity", "0");
      d3.select(event.currentTarget as SVGRectElement).attr("opacity", 1);
    })
    .on("click", (_, d) => onSelect(d.agency))
    .transition()
    .duration(700)
    .delay((_, i) => i * 60)
    .attr("y", (d) => y(d.value))
    .attr("height", (d) => innerHeight - y(d.value));

  const peakOrLatest = (agency: string) => {
    const rows = data.filter((d) => d.agency === agency);
    const peak = rows.reduce((a, b) => (b.value > a.value ? b : a), rows[0]);
    const latest = rows.find((d) => d.year === YEARS[YEARS.length - 1]);
    return [peak, latest].filter((d, i, arr): d is (typeof rows)[number] => Boolean(d) && arr.indexOf(d) === i);
  };

  groups
    .selectAll("text.dollar-label")
    .data((agency) => peakOrLatest(agency))
    .join("text")
    .attr("class", "dollar-label")
    .attr("x", (d) => (x1(d.year) ?? 0) + x1.bandwidth() / 2)
    .attr("y", (d) => y(d.value) - 6)
    .attr("text-anchor", "middle")
    .style("font-size", "11px")
    .style("font-weight", "600")
    .style("fill", "#0b1f33")
    .text((d) => axisMoney(d.value));

  addLegend(
    svg,
    margin.left,
    height - 18,
    YEARS.map((year, i) => ({ label: `FY${year}`, color: YEAR_COLORS[i] })),
  );
}

/** Chart 4: overtime share of agency budget by year, with the FY2023 to FY2026 point change. */
export function renderShareSlope(container: HTMLElement, seriesRows: OtSeriesPoint[]): void {
  const points = focusSeries(seriesRows);
  const agencies = STORY_ORDER.filter((a) => points.some((p) => p.agency === a));
  const shareOf = (agency: string, year: number) =>
    points.find((p) => p.agency === agency && p.fiscal_year === year)?.ot_share_pct ?? 0;
  const first = YEARS[0];
  const last = YEARS[YEARS.length - 1];
  const data = points.map((p) => ({
    agency: p.agency,
    year: p.fiscal_year,
    value: p.ot_share_pct ?? 0,
    delta: shareOf(p.agency, last) - shareOf(p.agency, first),
  }));

  const width = container.clientWidth || 760;
  const height = 320;
  const margin = { top: 40, right: 24, bottom: 48, left: 52 };

  container.innerHTML = "";
  const tooltip = ensureTooltip(container);
  const svg = d3
    .select(container)
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("role", "img")
    .attr("aria-label", "Overtime share of agency budget, FY2023 to FY2026");

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const x0 = d3.scaleBand().domain(agencies).range([0, innerWidth]).padding(0.24);
  const x1 = d3.scaleBand<number>().domain(YEARS).range([0, x0.bandwidth()]).padding(0.14);
  const y = d3
    .scaleLinear()
    .domain([0, Math.max(30, d3.max(data, (d) => d.value) ?? 30)])
    .nice()
    .range([innerHeight, 0]);
  const shareColors = ["#fde7c7", "#f6c27a", "#e08a2c", "#b45309"];
  const color = d3.scaleOrdinal<number, string>().domain(YEARS).range(shareColors);

  g.append("g")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x0))
    .selectAll("text")
    .style("font-size", "13px")
    .style("font-weight", "600");

  g.append("g")
    .call(d3.axisLeft(y).ticks(6).tickFormat((d) => `${d}%`))
    .selectAll("text")
    .style("font-size", "11px");

  const groups = g
    .selectAll("g.agency")
    .data(agencies)
    .join("g")
    .attr("transform", (agency) => `translate(${x0(agency)},0)`);

  groups
    .selectAll("rect")
    .data((agency) => data.filter((d) => d.agency === agency))
    .join("rect")
    .attr("x", (d) => x1(d.year) ?? 0)
    .attr("width", x1.bandwidth())
    .attr("y", innerHeight)
    .attr("height", 0)
    .attr("fill", (d) => color(d.year))
    .attr("rx", 3)
    .style("cursor", "pointer")
    .on("mouseover", (_event, d) => {
      const sign = d.delta >= 0 ? "+" : "";
      tooltip
        .style("opacity", "1")
        .html(
          `<strong>${d.agency}</strong><br/>FY${d.year}: overtime was <strong>${d.value.toFixed(1)}%</strong> of the budget<br/>Change FY${first} to FY${last}: <strong>${sign}${d.delta.toFixed(1)} points</strong>`,
        );
    })
    .on("mousemove", (event) => {
      tooltip
        .style("left", `${event.offsetX + 12}px`)
        .style("top", `${event.offsetY - 10}px`);
    })
    .on("mouseout", () => tooltip.style("opacity", "0"))
    .transition()
    .duration(700)
    .delay((_, i) => i * 60)
    .attr("y", (d) => y(d.value))
    .attr("height", (d) => innerHeight - y(d.value));

  const maxShare = (agency: string) => d3.max(data.filter((d) => d.agency === agency), (d) => d.value) ?? 0;

  groups
    .selectAll("text.share-label")
    .data((agency) => data.filter((d) => d.agency === agency && d.year === last))
    .join("text")
    .attr("class", "share-label")
    .attr("x", () => x0.bandwidth() / 2)
    .attr("y", (d) => y(maxShare(d.agency)) - 22)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .style("font-weight", "700")
    .style("fill", "#b45309")
    .text((d) => `${d.delta >= 0 ? "+" : ""}${d.delta.toFixed(1)} pts since FY${String(first).slice(2)}`);

  groups
    .selectAll("text.share-end")
    .data((agency) => data.filter((d) => d.agency === agency && d.year === last))
    .join("text")
    .attr("class", "share-end")
    .attr("x", (d) => (x1(d.year) ?? 0) + x1.bandwidth() / 2)
    .attr("y", (d) => y(d.value) - 5)
    .attr("text-anchor", "middle")
    .style("font-size", "11px")
    .style("fill", "#0b1f33")
    .text((d) => `${d.value.toFixed(1)}%`);

  addLegend(
    svg,
    margin.left,
    height - 18,
    YEARS.map((year, i) => ({ label: `FY${year}`, color: shareColors[i] })),
  );
}
