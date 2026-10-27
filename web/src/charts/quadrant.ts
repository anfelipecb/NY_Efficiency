import * as d3 from "d3";
import type { EfficiencyQuadrant } from "../types";
import { agencyLabel } from "../data";

const quadrantColors: Record<string, string> = {
  target_hypothesis: "#b91c1c",
  cost_up_outcomes_up: "#0e7490",
  cost_down_outcomes_up: "#1d4ed8",
  cost_down_outcomes_flat: "#64748b",
};

export function renderQuadrantChart(
  container: HTMLElement,
  rows: EfficiencyQuadrant[],
  onSelect: (agency: string) => void,
): void {
  const filtered = rows.filter(
    (row) => row.exp_growth_pct != null && row.outcome_delta_pct != null,
  );
  const movers = filtered.filter(
    (row) =>
      (row.zone_change === "entered_zone" || row.zone_change === "left_zone") &&
      row.exp_growth_prev_pct != null &&
      row.outcome_delta_prev_pct != null,
  );

  const width = container.clientWidth || 860;
  const height = 540;
  const margin = { top: 28, right: 28, bottom: 80, left: 72 };

  container.innerHTML = "";
  const svg = d3
    .select(container)
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("role", "img")
    .attr("aria-label", "Citywide efficiency quadrant scatter plot");

  const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const xValues = [
    ...filtered.map((d) => d.exp_growth_pct ?? 0),
    ...movers.map((d) => d.exp_growth_prev_pct ?? 0),
  ];
  const yValues = [
    ...filtered.map((d) => d.outcome_delta_pct ?? 0),
    ...movers.map((d) => d.outcome_delta_prev_pct ?? 0),
  ];
  const x = d3
    .scaleLinear()
    .domain(d3.extent(xValues) as [number, number])
    .nice()
    .range([0, innerWidth]);
  // A few agencies with two to four volatile indicators would otherwise flatten everyone else
  const Y_CAP = 40;
  const [yLo, yHi] = d3.extent(yValues) as [number, number];
  const y = d3
    .scaleLinear()
    .domain([Math.max(yLo, -Y_CAP), Math.min(yHi, Y_CAP)])
    .nice()
    .range([innerHeight, 0]);
  const [yMinShown, yMaxShown] = y.domain();
  const isClipped = (v: number) => v > yMaxShown || v < yMinShown;
  const cy = (v: number | null) => y(Math.max(yMinShown, Math.min(yMaxShown, v ?? 0)));

  const xMid = 2;
  const yMid = 2;

  g.append("rect")
    .attr("x", x(xMid))
    .attr("y", y(yMid))
    .attr("width", innerWidth - x(xMid))
    .attr("height", innerHeight - y(yMid))
    .attr("fill", "#fef2f2")
    .attr("opacity", 0.95);

  g.append("line")
    .attr("x1", x(xMid))
    .attr("x2", x(xMid))
    .attr("y1", 0)
    .attr("y2", innerHeight)
    .attr("stroke", "#cbd5e1")
    .attr("stroke-dasharray", "4 4");
  g.append("line")
    .attr("x1", 0)
    .attr("x2", innerWidth)
    .attr("y1", y(yMid))
    .attr("y2", y(yMid))
    .attr("stroke", "#cbd5e1")
    .attr("stroke-dasharray", "4 4");

  g.append("text")
    .attr("x", innerWidth - 8)
    .attr("y", innerHeight - 10)
    .attr("text-anchor", "end")
    .text("Worth asking")
    .style("font-size", "11px")
    .style("fill", "#b91c1c")
    .style("font-weight", "600");

  g.append("g")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x).tickFormat((d) => `${d}%`));
  g.append("text")
    .attr("x", innerWidth / 2)
    .attr("y", innerHeight + 40)
    .attr("text-anchor", "middle")
    .text("Expenditure growth, FY2023 to FY2026")
    .style("font-size", "12px")
    .style("fill", "var(--ink-muted)");

  g.append("g").call(d3.axisLeft(y).tickFormat((d) => `${d}%`));
  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -innerHeight / 2)
    .attr("y", -52)
    .attr("text-anchor", "middle")
    .text("Median outcome trend (normalized)")
    .style("font-size", "12px")
    .style("fill", "var(--ink-muted)");

  const tooltip = d3
    .select(container)
    .append("div")
    .attr("class", "chart-tooltip")
    .style("opacity", 0);

  const moverG = g.append("g").attr("class", "movers");
  moverG
    .selectAll("line")
    .data(movers)
    .join("line")
    .attr("x1", (d) => x(d.exp_growth_prev_pct ?? 0))
    .attr("y1", (d) => cy(d.outcome_delta_prev_pct))
    .attr("x2", (d) => x(d.exp_growth_pct ?? 0))
    .attr("y2", (d) => cy(d.outcome_delta_pct))
    .attr("stroke", "#94a3b8")
    .attr("stroke-width", 1.25)
    .attr("stroke-dasharray", "3 3");
  moverG
    .selectAll("circle")
    .data(movers)
    .join("circle")
    .attr("cx", (d) => x(d.exp_growth_prev_pct ?? 0))
    .attr("cy", (d) => cy(d.outcome_delta_prev_pct))
    .attr("r", 4.5)
    .attr("fill", "#fff")
    .attr("stroke", "#94a3b8")
    .attr("stroke-width", 1.5);
  moverG
    .selectAll("text")
    .data(movers)
    .join("text")
    .attr("x", (d) => x(d.exp_growth_pct ?? 0) + 11)
    .attr("y", (d) => cy(d.outcome_delta_pct) + 4)
    .text((d) => `${d.agency} ${d.zone_change === "entered_zone" ? "entered" : "left"}`)
    .style("font-size", "11px")
    .style("font-weight", "600")
    .style("fill", (d) => (d.zone_change === "entered_zone" ? "#b91c1c" : "#0e7490"));

  const prevNote = (d: EfficiencyQuadrant) =>
    d.exp_growth_prev_pct != null && d.outcome_delta_prev_pct != null
      ? `<br/><span style="opacity:.85">Through FY2025: cost ${d.exp_growth_prev_pct.toFixed(1)}% · outcomes ${d.outcome_delta_prev_pct.toFixed(1)}%</span>`
      : "";

  g.selectAll("circle.agency-point")
    .data(filtered)
    .join("circle")
    .attr("class", "agency-point")
    .attr("cx", (d) => x(d.exp_growth_pct ?? 0))
    .attr("cy", (d) => cy(d.outcome_delta_pct))
    .attr("r", 0)
    .attr("fill", (d) => quadrantColors[d.quadrant ?? ""] ?? "#475569")
    .attr("opacity", 0.85)
    .attr("stroke", "#fff")
    .attr("stroke-width", 1.5)
    .style("cursor", "pointer")
    .on("mouseover", (_event, d) => {
      tooltip
        .style("opacity", 1)
        .html(
          `<strong>${agencyLabel(d)}</strong><br/>Through FY2026: cost ${d.exp_growth_pct?.toFixed(1)}% · outcomes ${d.outcome_delta_pct?.toFixed(1)}%<br/>${d.quadrant_label ?? ""}${prevNote(d)}`,
        );
    })
    .on("mousemove", (event) => {
      tooltip
        .style("left", `${event.offsetX + 12}px`)
        .style("top", `${event.offsetY - 8}px`);
    })
    .on("mouseout", () => tooltip.style("opacity", 0))
    .on("click", (_, d) => onSelect(d.agency))
    .transition()
    .duration(650)
    .delay((_, i) => i * 18)
    .attr("r", (d) => (d.quadrant === "target_hypothesis" ? 8 : 6));

  const clipped = filtered.filter((d) => isClipped(d.outcome_delta_pct ?? 0));
  if (clipped.length) {
    g.append("text")
      .attr("x", 8)
      .attr("y", 14)
      .text(
        `Pinned to the edge, off scale: ${clipped
          .map((d) => `${d.agency} ${(d.outcome_delta_pct ?? 0) > 0 ? "+" : ""}${d.outcome_delta_pct?.toFixed(0)}%`)
          .join(", ")} (few indicators)`,
      )
      .style("font-size", "11px")
      .style("fill", "var(--ink-muted)");
  }

  const legendLabels: Record<string, string> = {
    target_hypothesis: "Worth asking",
    cost_up_outcomes_up: "Cost up, outcomes improving",
    cost_down_outcomes_up: "Cost down, outcomes improving",
    cost_down_outcomes_flat: "Cost down, outcomes flat or down",
  };
  const legend = svg
    .append("g")
    .attr("transform", `translate(${margin.left}, ${height - 28})`);

  let offsetX = 0;
  let offsetY = 0;
  Object.entries(quadrantColors).forEach(([key, color]) => {
    const label = legendLabels[key] ?? key;
    const item = legend.append("g");
    item.append("circle").attr("r", 5).attr("fill", color);
    const text = item
      .append("text")
      .attr("x", 12)
      .attr("y", 4)
      .text(label)
      .style("font-size", "11px")
      .style("fill", "var(--ink-muted)");
    const itemWidth = (text.node()?.getComputedTextLength() ?? label.length * 6) + 36;
    if (offsetX > 0 && offsetX + itemWidth > innerWidth) {
      offsetX = 0;
      offsetY += 18;
    }
    item.attr("transform", `translate(${offsetX}, ${offsetY})`);
    offsetX += itemWidth;
  });
}
