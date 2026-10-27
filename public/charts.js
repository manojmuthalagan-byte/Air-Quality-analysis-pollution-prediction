import { average, circularMeanDegrees, pearson } from "./data.js";

const esc = (value) => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const compactDate = (value) => new Intl.DateTimeFormat("en", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(value));

export function renderTrendChart(container, records, feature) {
  const points = records.filter((record) => Number.isFinite(record[feature.key]));
  if (points.length < 2) {
    container.innerHTML = `<div class="empty-chart"><span>⌁</span><strong>Not enough readings to draw a trend.</strong><small>At least two dated values are needed for ${esc(feature.label)}.</small></div>`;
    return;
  }
  const width = 900;
  const height = 268;
  const left = 56;
  const right = 18;
  const top = 18;
  const bottom = 34;
  const values = points.map((item) => item[feature.key]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pad = span * 0.18;
  const low = Math.max(0, min - pad);
  const high = max + pad;
  const x = (index) => left + (index / Math.max(points.length - 1, 1)) * (width - left - right);
  const y = (value) => top + ((high - value) / (high - low || 1)) * (height - top - bottom);
  const ticks = 4;
  const grid = Array.from({ length: ticks + 1 }, (_, index) => {
    const val = high - ((high - low) / ticks) * index;
    return `<line class="chart-gridline" x1="${left}" y1="${y(val)}" x2="${width - right}" y2="${y(val)}"/><text class="chart-y-label" x="${left - 10}" y="${y(val) + 4}" text-anchor="end">${val >= 100 ? Math.round(val) : val.toFixed(1).replace(/\.0$/, "")}</text>`;
  }).join("");
  let d = "";
  points.forEach((point, index) => {
    const crossesNorth = feature.key === "windDirection" && index > 0 && Math.abs(point.windDirection - points[index - 1].windDirection) > 180;
    d += `${index === 0 || crossesNorth ? "M" : "L"}${x(index).toFixed(1)},${y(point[feature.key]).toFixed(1)} `;
  });
  const area = feature.key === "windDirection" ? "" : `${d}L${x(points.length - 1)},${height - bottom} L${x(0)},${height - bottom} Z`;
  const highlightIndices = new Set([0, Math.floor((points.length - 1) / 2), points.length - 1]);
  const circles = points.map((point, index) => {
    const visible = highlightIndices.has(index) || (points.length < 36 && index % 4 === 0);
    if (!visible) return "";
    return `<circle class="chart-point" cx="${x(index)}" cy="${y(point[feature.key])}" r="4"><title>${esc(compactDate(point.date))}: ${point[feature.key].toFixed(1)} ${esc(feature.unit || "")}</title></circle>`;
  }).join("");
  const xLabels = [0, Math.floor((points.length - 1) / 2), points.length - 1].map((index) => `<text class="chart-x-label" x="${x(index)}" y="${height - 8}" text-anchor="${index === 0 ? "start" : index === points.length - 1 ? "end" : "middle"}">${esc(compactDate(points[index].date))}</text>`).join("");
  const directionDescription = feature.key === "windDirection" ? " Wind direction uses a circular daily mean; line segments break at the 0°/360° north boundary." : "";
  container.innerHTML = `<svg class="trend-svg" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="trendSvgTitle trendSvgDesc"><title id="trendSvgTitle">${esc(feature.label)} time series</title><desc id="trendSvgDesc">${points.length} daily observations from ${esc(compactDate(points[0].date))} to ${esc(compactDate(points.at(-1).date))}. Values range from ${min.toFixed(1)} to ${max.toFixed(1)} ${esc(feature.unit || "")}.${directionDescription}</desc><defs><linearGradient id="trendFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#4c9b82" stop-opacity=".20"/><stop offset="100%" stop-color="#4c9b82" stop-opacity="0"/></linearGradient></defs>${grid}${area ? `<path class="chart-area" d="${area}"/>` : ""}<path class="chart-line" d="${d.trim()}"/>${circles}${xLabels}</svg>`;
}

export function aggregateSeasonality(records, feature, mode) {
  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const buckets = new Map();
  for (const record of records) {
    if (!Number.isFinite(record[feature.key])) continue;
    const date = new Date(record.date);
    const dayIndex = (date.getUTCDay() + 6) % 7;
    const key = mode === "weekday" ? String(dayIndex) : date.toISOString().slice(0, 7);
    const label = mode === "weekday" ? weekdays[dayIndex] : new Intl.DateTimeFormat("en", { month: "short", year: "2-digit", timeZone: "UTC" }).format(date);
    if (!buckets.has(key)) buckets.set(key, { label, values: [] });
    buckets.get(key).values.push(record[feature.key]);
  }
  let groups = [...buckets].map(([key, group]) => ({
    key,
    label: group.label,
    values: group.values,
    value: feature.key === "windDirection" ? circularMeanDegrees(group.values) : average(group.values)
  })).filter((group) => Number.isFinite(group.value));
  if (mode === "weekday") groups.sort((a, b) => Number(a.key) - Number(b.key));
  else groups.sort((a, b) => a.key.localeCompare(b.key));
  return groups;
}

export function renderSeasonalityChart(container, records, feature, mode) {
  const groups = aggregateSeasonality(records, feature, mode);
  const modeLabel = mode === "weekday" ? "weekday" : "calendar-month";
  if (groups.length < 2) {
    container.innerHTML = `<div class="empty-chart"><span>⌁</span><strong>Not enough periods to compare.</strong><small>At least two ${modeLabel} groups with valid ${esc(feature.label)} readings are needed.</small></div>`;
    return;
  }
  if (feature.key === "windDirection") {
    container.innerHTML = `<div class="wind-season-grid">${groups.map((group) => `<div class="wind-season-item"><span class="wind-season-label">${esc(group.label)}</span><span class="wind-season-arrow" style="--direction:${group.value}deg" aria-hidden="true">↑</span><strong>${Math.round(group.value)}°</strong><small>${group.values.length} daily observations</small></div>`).join("")}</div>`;
    return;
  }
  const width = 900;
  const height = 268;
  const left = 56;
  const right = 18;
  const top = 20;
  const bottom = 38;
  const max = Math.max(...groups.map((group) => group.value));
  const high = max > 0 ? max * 1.2 : 1;
  const y = (value) => top + ((high - value) / high) * (height - top - bottom);
  const plotWidth = width - left - right;
  const step = plotWidth / groups.length;
  const barWidth = Math.min(58, step * 0.58);
  const ticks = 4;
  const grid = Array.from({ length: ticks + 1 }, (_, index) => {
    const val = high - (high / ticks) * index;
    return `<line class="chart-gridline" x1="${left}" y1="${y(val)}" x2="${width - right}" y2="${y(val)}"/><text class="chart-y-label" x="${left - 10}" y="${y(val) + 4}" text-anchor="end">${val >= 100 ? Math.round(val) : val.toFixed(1).replace(/\.0$/, "")}</text>`;
  }).join("");
  const bars = groups.map((group, index) => {
    const x = left + step * index + (step - barWidth) / 2;
    const barY = y(group.value);
    const barHeight = height - bottom - barY;
    return `<g><rect class="season-bar" x="${x}" y="${barY}" width="${barWidth}" height="${barHeight}" rx="4"><title>${esc(group.label)} mean: ${group.value.toFixed(1)} ${esc(feature.unit || "")}; ${group.values.length} daily observations</title></rect><text class="chart-x-label" x="${x + barWidth / 2}" y="${height - 10}" text-anchor="middle">${esc(group.label)}</text><text class="season-value" x="${x + barWidth / 2}" y="${Math.max(top + 9, barY - 7)}" text-anchor="middle">${group.value >= 100 ? Math.round(group.value) : group.value.toFixed(1)}</text></g>`;
  }).join("");
  const label = mode === "weekday" ? "weekday" : "calendar month";
  container.innerHTML = `<svg class="trend-svg" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="seasonSvgTitle seasonSvgDesc"><title id="seasonSvgTitle">${esc(feature.label)} average by ${label}</title><desc id="seasonSvgDesc">Mean ${esc(feature.label)} across ${groups.length} ${label} groups; bars include the number of daily observations in each group.</desc>${grid}${bars}</svg>`;
}

function colorForCorrelation(value) {
  if (value === null) return "#eef1ed";
  const strength = Math.min(1, Math.abs(value));
  if (value < 0) return `rgba(192, 108, 89, ${0.10 + strength * 0.75})`;
  return `rgba(48, 132, 105, ${0.09 + strength * 0.72})`;
}

export function renderCorrelationMatrix(container, records, features) {
  if (features.length < 2) {
    container.innerHTML = `<div class="empty-matrix">Upload at least two variables with valid paired values to view correlations.</div>`;
    return;
  }
  const columns = features;
  const html = [`<table class="correlation-table"><caption class="sr-only">Pearson correlation coefficients for daily aggregate values. Wind direction uses sine and cosine transforms. Correlation does not imply causation.</caption><thead><tr><th scope="col"><span class="sr-only">Variable</span></th>${columns.map((feature) => `<th scope="col" title="${esc(feature.label)}">${esc(feature.short || feature.label)}</th>`).join("")}</tr></thead><tbody>`];
  for (const row of columns) {
    html.push(`<tr><th scope="row" title="${esc(row.label)}">${esc(row.short || row.label)}</th>`);
    for (const column of columns) {
      const value = pearson(records, row.key, column.key);
      const title = value === null ? `${row.label} and ${column.label}: insufficient paired values` : `${row.label} and ${column.label}: r = ${value.toFixed(2)}`;
      html.push(`<td style="--cell-color:${colorForCorrelation(value)}"><button class="correlation-cell" type="button" data-x="${column.key}" data-y="${row.key}" data-value="${value === null ? "" : value.toFixed(2)}" aria-label="Select ${esc(row.label)} trend; ${esc(title)}" title="${esc(title)}">${value === null ? "·" : value.toFixed(1)}</button></td>`);
    }
    html.push("</tr>");
  }
  html.push("</tbody></table>");
  container.innerHTML = html.join("");
}
