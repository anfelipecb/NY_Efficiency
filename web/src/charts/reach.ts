import * as d3 from "d3";
import type { ReachProgram, ReachSeriesPoint } from "../types";

function peopleLabel(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)} million`;
  if (value >= 1_000) return `${Math.round(value / 1000).toLocaleString()},000`;
  return value.toLocaleString();
}

function axisPeople(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1000)}K`;
  return `${value}`;
}

function ensureTooltip(container: HTMLElement): d3.Selection<HTMLDivElement, unknown, null, undefined> {
  const existing = container.querySelector(".chart-tooltip");
  if (existing) existing.remove();
  return d3.select(container).append("div").attr("class", "chart-tooltip").style("opacity", "0");
}

/** Eligible pool vs. people actually enrolled, one bullet bar per program. */
export function renderReachChart(container: HTMLElement, rows: ReachProgram[]): void {
  const data = rows.filter((row) => row.eligible_population != null && row.enrolled_population != null);

  const width = container.clientWidth || 760;
  const rowHeight = 74;
  const margin = { top: 16, right: 70, bottom: 46, left: 16 };
  const height = margin.top + margin.bottom + rowHeight * data.length;

  container.innerHTML = "";
  const tooltip = ensureTooltip(container);
  const svg = d3
    .select(container)
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("role", "img")
    .attr("aria-label", "Eligible population versus people actually enrolled, SNAP and Fair Fares");

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const x = d3
    .scaleLinear()
    .domain([0, (d3.max(data, (d) => d.eligible_population ?? 0) ?? 0) * 1.08])
    .range([0, innerWidth]);
  const y = d3
    .scaleBand()
    .domain(data.map((d) => d.program))
    .range([0, innerHeight])
    .paddingOuter(0.1)
    .paddingInner(0.55);
  const barHeight = Math.min(30, y.bandwidth());

  g.append("g")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x).ticks(5).tickFormat((d) => axisPeople(d as number)))
    .selectAll("text")
    .style("font-size", "11px");

  const rowsG = g
    .selectAll("g.reach-row")
    .data(data)
    .join("g")
    .attr("class", "reach-row")
    .attr("transform", (d) => `translate(0,${y(d.program)})`);

  rowsG
    .append("text")
    .attr("x", 0)
    .attr("y", -10)
    .attr("text-anchor", "start")
    .style("font-size", "13px")
    .style("font-weight", "600")
    .style("fill", "var(--navy)")
    .text((d) => `${d.program_label} · ${d.population_year ?? ""}`);

  // background bar: eligible population
  rowsG
    .append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", 0)
    .attr("height", barHeight)
    .attr("rx", 6)
    .attr("fill", "#e2e8f0")
    .style("cursor", "pointer")
    .on("mouseover", (_event, d) => {
      tooltip
        .style("opacity", "1")
        .html(
          `<strong>${d.program_label}</strong><br/>Estimated eligible: <strong>${peopleLabel(d.eligible_population ?? 0)}</strong> (${d.population_year})<br/><span style="opacity:.85">${d.source_label ?? ""}</span>`,
        );
    })
    .on("mousemove", (event) => {
      tooltip.style("left", `${event.offsetX + 12}px`).style("top", `${event.offsetY - 10}px`);
    })
    .on("mouseout", () => tooltip.style("opacity", "0"))
    .transition()
    .duration(750)
    .attr("width", (d) => x(d.eligible_population ?? 0));

  // foreground bar: enrolled population
  rowsG
    .append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", 0)
    .attr("height", barHeight)
    .attr("rx", 6)
    .attr("fill", "#0e7490")
    .style("cursor", "pointer")
    .on("mouseover", (_event, d) => {
      tooltip
        .style("opacity", "1")
        .html(
          `<strong>${d.program_label}</strong><br/>Actually enrolled: <strong>${peopleLabel(d.enrolled_population ?? 0)}</strong><br/>Take-up rate: <strong>${d.takeup_rate_pct?.toFixed(1)}%</strong><br/><span style="opacity:.85">${d.source_label ?? ""}</span>`,
        );
    })
    .on("mousemove", (event) => {
      tooltip.style("left", `${event.offsetX + 12}px`).style("top", `${event.offsetY - 10}px`);
    })
    .on("mouseout", () => tooltip.style("opacity", "0"))
    .transition()
    .duration(900)
    .delay(150)
    .attr("width", (d) => x(d.enrolled_population ?? 0));

  rowsG
    .append("text")
    .attr("x", (d) => x(d.eligible_population ?? 0) + 10)
    .attr("y", barHeight / 2)
    .attr("dominant-baseline", "middle")
    .style("font-size", "16px")
    .style("font-weight", "700")
    .style("fill", "var(--navy)")
    .text((d) => `${d.takeup_rate_pct?.toFixed(0)}%`)
    .style("opacity", 0)
    .transition()
    .delay(700)
    .duration(400)
    .style("opacity", 1);

  const legend = svg.append("g").attr("transform", `translate(${margin.left}, ${height - 10})`);
  const items = [
    { label: "Estimated eligible", color: "#e2e8f0" },
    { label: "Actually enrolled", color: "#0e7490" },
  ];
  items.forEach((item, i) => {
    const node = legend.append("g").attr("transform", `translate(${i * 180}, 0)`);
    node.append("rect").attr("width", 12).attr("height", 12).attr("rx", 2).attr("fill", item.color);
    node
      .append("text")
      .attr("x", 18)
      .attr("y", 10)
      .text(item.label)
      .style("font-size", "12px")
      .style("fill", "var(--ink-muted)");
  });
}

/** Enrollment trend from MMR indicators, one panel per program so each keeps its own scale. */
export function renderReachTrend(container: HTMLElement, rows: ReachSeriesPoint[]): void {
  const programs = Array.from(new Set(rows.map((r) => r.program)));
  const order = ["SNAP", "FAIR_FARES"];
  programs.sort((a, b) => order.indexOf(a) - order.indexOf(b));
  const years = Array.from(new Set(rows.map((r) => r.fiscal_year))).sort((a, b) => a - b);

  const width = container.clientWidth || 760;
  const narrow = width < 640;
  const cols = narrow ? 1 : programs.length;
  const margin = { top: 34, right: 24, bottom: 30, left: 52 };
  const gap = 36;
  const panelHeight = 220;
  const rowsCount = Math.ceil(programs.length / cols);
  const height = margin.top + rowsCount * panelHeight + (rowsCount - 1) * 50 + margin.bottom;
  const panelWidth = (width - margin.left - margin.right - (cols - 1) * (gap + margin.left)) / cols;
  const innerHeight = panelHeight - 30;

  container.innerHTML = "";
  const tooltip = ensureTooltip(container);
  const svg = d3
    .select(container)
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("role", "img")
    .attr("aria-label", "SNAP recipients and Fair Fares enrollment by fiscal year");

  const x = d3.scalePoint<number>().domain(years).range([0, panelWidth]).padding(0.2);

  programs.forEach((program, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const ox = margin.left + col * (panelWidth + gap + margin.left);
    const oy = margin.top + row * (panelHeight + 50);
    const g = svg.append("g").attr("transform", `translate(${ox},${oy})`);
    const data = rows
      .filter((r) => r.program === program && r.value != null)
      .sort((a, b) => a.fiscal_year - b.fiscal_year);
    if (!data.length) return;
    const [lo, hi] = d3.extent(data, (d) => d.value ?? 0) as [number, number];
    const pad = (hi - lo) * 0.25 || hi * 0.1;
    const y = d3
      .scaleLinear()
      .domain([Math.max(0, lo - pad), hi + pad])
      .nice()
      .range([innerHeight, 0]);

    g.append("text")
      .attr("x", 0)
      .attr("y", -14)
      .text(data[0].series_label)
      .style("font-size", "14px")
      .style("font-weight", "700")
      .style("fill", "var(--navy)");

    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).tickFormat((d) => `FY${String(d).slice(2)}`))
      .selectAll("text")
      .style("font-size", "11px");
    g.append("g")
      .call(d3.axisLeft(y).ticks(5).tickFormat((d) => axisPeople(d as number)))
      .selectAll("text")
      .style("font-size", "11px");

    const latest = data[data.length - 1];
    const prior = data[data.length - 2];
    const latestChange = prior?.value ? ((latest.value ?? 0) / prior.value - 1) * 100 : null;
    const stroke = latestChange != null && latestChange < 0 ? "#b45309" : "#0e7490";

    const path = g
      .append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#0e7490")
      .attr("stroke-width", 3)
      .attr(
        "d",
        d3
          .line<ReachSeriesPoint>()
          .x((d) => x(d.fiscal_year) ?? 0)
          .y((d) => y(d.value ?? 0)),
      );
    const len = (path.node() as SVGPathElement).getTotalLength();
    path
      .attr("stroke-dasharray", `${len} ${len}`)
      .attr("stroke-dashoffset", len)
      .transition()
      .duration(900)
      .attr("stroke-dashoffset", 0);

    g.selectAll("circle")
      .data(data)
      .join("circle")
      .attr("cx", (d) => x(d.fiscal_year) ?? 0)
      .attr("cy", (d) => y(d.value ?? 0))
      .attr("r", (d) => (d === latest ? 6 : 4))
      .attr("fill", (d) => (d === latest ? stroke : "#0e7490"))
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .style("cursor", "pointer")
      .on("mouseover", (_event, d) => {
        const idx = data.indexOf(d);
        const prev = idx > 0 ? data[idx - 1] : null;
        const change = prev?.value ? ((d.value ?? 0) / prev.value - 1) * 100 : null;
        tooltip
          .style("opacity", "1")
          .html(
            `<strong>${d.series_label} · FY${d.fiscal_year}</strong><br/><strong>${peopleLabel(d.value ?? 0)}</strong>${
              change != null ? `<br/>${change >= 0 ? "+" : ""}${change.toFixed(1)}% vs FY${prev!.fiscal_year}` : ""
            }<br/><span style="opacity:.85">Source: MMR indicators, NYC Open Data</span>`,
          );
      })
      .on("mousemove", (event) => {
        tooltip.style("left", `${event.offsetX + 12}px`).style("top", `${event.offsetY - 10}px`);
      })
      .on("mouseout", () => tooltip.style("opacity", "0"));

    if (latestChange != null) {
      g.append("text")
        .attr("x", (x(latest.fiscal_year) ?? 0) - 10)
        .attr("y", y(latest.value ?? 0) + (latestChange < 0 ? 22 : -14))
        .attr("text-anchor", "end")
        .text(`${latestChange >= 0 ? "+" : ""}${latestChange.toFixed(1)}% in FY${String(latest.fiscal_year).slice(2)}`)
        .style("font-size", "12px")
        .style("font-weight", "700")
        .style("fill", stroke);
    }
  });
}
