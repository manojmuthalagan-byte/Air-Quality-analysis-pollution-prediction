import { ALL_FEATURES, CORRELATION_FEATURES, COLUMN_FIELDS, POLLUTANTS, analyzeDataset, calculateAQI, dailyRecords, demoRecords, forecastNextDay, inferMapping, normalizeRows, parseCSVText, subIndexForConcentration } from "./data.js";
import { aggregateSeasonality, renderCorrelationMatrix, renderSeasonalityChart, renderTrendChart } from "./charts.js";

const $ = (selector) => document.querySelector(selector);
const number = new Intl.NumberFormat("en", { maximumFractionDigits: 1 });
const dateLong = (value) => value ? new Intl.DateTimeFormat("en", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(value)) : "—";
const dateShort = (value) => value ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(value)) : "—";

let records = demoRecords();
let sourceType = "demo";
let sourceName = "Synthetic example";
let invalidCount = 0;
let rangeDays = 30;
let chartMode = "daily";
let pendingImport = null;
let resetButton = null;
let toastTimeout;

const trendSelect = $("#trendVariable");
for (const feature of ALL_FEATURES) {
  const option = document.createElement("option");
  option.value = feature.key;
  option.textContent = feature.label;
  trendSelect.append(option);
}
trendSelect.value = "aqi";

function pretty(value, places = 1) {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en", { maximumFractionDigits: places }).format(value);
}

function showToast(message, isError = false) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.toggle("error", isError);
  toast.classList.add("visible");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("visible"), 3600);
}

function setSourceUI() {
  const isDemo = sourceType === "demo";
  $("#sourcePillText").textContent = isDemo ? "ILLUSTRATIVE DEMO" : "USER-UPLOADED DATA";
  $("#datasetBadge").textContent = isDemo ? "DEMO DATA · ILLUSTRATIVE ONLY" : "USER DATA · BROWSER SESSION ONLY";
  $("#datasetDescription").textContent = isDemo ? "Synthetic example · no city or station" : `Uploaded CSV · ${sourceName}`;
  $(".source-pill").classList.toggle("uploaded-source", !isDemo);
  if (!isDemo && !resetButton) {
    resetButton = document.createElement("button");
    resetButton.type = "button";
    resetButton.className = "button button-quiet reset-button";
    resetButton.textContent = "Restore demo";
    resetButton.addEventListener("click", () => {
      records = demoRecords(); sourceType = "demo"; sourceName = "Synthetic example"; invalidCount = 0;
      resetButton?.remove(); resetButton = null; setSourceUI(); render(); showToast("Illustrative demo data restored.");
    });
    $(".top-actions").insertBefore(resetButton, $("#uploadButton"));
  } else if (isDemo && resetButton) {
    resetButton.remove(); resetButton = null;
  }
}

function renderSnapshot(daily, quality) {
  $("#recordCount").textContent = number.format(records.length);
  $("#recordSub").textContent = sourceType === "demo" ? "synthetic daily samples" : `${quality.records} valid timestamped rows`;
  $("#completenessValue").textContent = `${Math.round(quality.completeness)}%`;
  $("#missingSub").textContent = `${number.format(quality.missing)} missing feature cells`;
  $("#variableCount").textContent = String(quality.fields.length);
  $("#gapCount").textContent = String(quality.gapCount);
  $("#projectRecordPlaceholder").textContent = sourceType === "demo" ? "Illustrative only" : number.format(records.length);
  $("#coverageText").textContent = quality.start && quality.end ? `${dateShort(quality.start)} — ${dateShort(quality.end)}` : "No valid dates";

  const last = daily.at(-1);
  const aqi = last ? calculateAQI(last) : { value: null, category: null, subIndices: [] };
  if (!Number.isFinite(aqi.value)) {
    $("#currentAqi").textContent = "—";
    $("#gaugeValue").textContent = "—";
    $("#currentCategory").textContent = "No pollutant data";
    $("#healthContext").textContent = "Map at least one pollutant column with valid concentrations to calculate an AQI estimate.";
    $("#latestDate").textContent = last ? dateLong(last.date) : "No dated observations";
    $("#aqiGauge").style.setProperty("--aqi-color", "#86938b");
    $("#aqiGauge").style.setProperty("--aqi-progress", "0deg");
    $("#signalTitle").textContent = "Start with a complete reading.";
    $("#signalCopy").textContent = "The dashboard will calculate an AQI estimate when valid pollutant concentrations are available.";
  } else {
    const label = aqi.openEnded ? `${aqi.value}+` : String(aqi.value);
    $("#currentAqi").textContent = label;
    $("#gaugeValue").textContent = label;
    $("#currentCategory").textContent = aqi.category.label;
    $("#healthContext").textContent = aqi.category.health;
    $("#latestDate").textContent = `Latest daily aggregate · ${dateLong(last.date)}`;
    $("#aqiGauge").style.setProperty("--aqi-color", aqi.category.color);
    $("#aqiGauge").style.setProperty("--aqi-progress", `${Math.min(360, aqi.value / 500 * 360)}deg`);
    $("#signalTitle").textContent = `${aqi.category.label} air-quality estimate.`;
    $("#signalCopy").textContent = aqi.openEnded ? "At least one available pollutant is in an open-ended Severe concentration band; 401 is shown as a lower bound, not an exact index." : `The maximum available pollutant sub-index is ${aqi.value}. The category context follows the published National AQI bands.`;
  }
  renderPollutants(last);
}

function renderPollutants(last) {
  $("#pollutantGrid").innerHTML = POLLUTANTS.map((pollutant, index) => {
    const concentration = last?.[pollutant.key];
    const subIndex = Number.isFinite(concentration) ? subIndexForConcentration(pollutant.key, concentration) : null;
    const category = subIndex?.category;
    return `<article class="pollutant-card" style="--pollutant-accent:${category?.color || "#cfd7d0"}">
      <div class="pollutant-card-head"><span>${pollutant.label}</span><span class="pollutant-code">0${index + 1}</span></div>
      <div class="pollutant-reading">${Number.isFinite(concentration) ? pretty(concentration, pollutant.key === "pb" || pollutant.key === "co" ? 2 : 1) : "—"}<small>${pollutant.unit}</small></div>
      <div class="pollutant-meta"><span>${subIndex ? `SUB-INDEX ${subIndex.openEnded ? "401+" : subIndex.value}` : "NO READING"}</span><span>${category?.label || "Unavailable"}</span></div>
      <div class="pollutant-source">${pollutant.source}</div>
    </article>`;
  }).join("");
}

function renderQuality(quality) {
  const completeness = Math.round(quality.completeness);
  $("#qualityPercent").textContent = `${completeness}%`;
  $("#qualityBar").style.width = `${completeness}%`;
  const outlierTotal = quality.outliers.reduce((sum, item) => sum + item.count, 0);
  const checks = [
    ["Valid timestamped rows", number.format(quality.records), "date / time"],
    ["Exact duplicate timestamps", number.format(quality.duplicates), "not removed"],
    ["Invalid / out-of-range values", number.format(quality.invalidCount), "excluded from analysis"],
    ["Potential outlier values", number.format(outlierTotal), "IQR rule · not removed"],
    ["Unusually long sampling gaps", number.format(quality.gapCount), quality.medianGapDays ? `median step ${pretty(quality.medianGapDays, 1)} d` : "not measurable"]
  ];
  $("#qualityList").innerHTML = checks.map(([label, value, note]) => `<div class="quality-row"><span>${label}</span><strong>${value}</strong><small>${note}</small></div>`).join("");
  $("#qualityDisclosure").textContent = quality.fields.length ? `Completeness covers ${quality.fields.length} mapped numeric fields. Potential outliers use a 1.5×IQR rule and are flagged, not removed; wind direction is excluded from this linear rule.` : "No mapped numeric fields are available yet; completeness cannot be calculated.";
}

function renderTrendDataTable(recordsToShow, feature, mode) {
  const rows = mode === "daily"
    ? recordsToShow.filter((record) => Number.isFinite(record[feature.key])).map((record) => ({ label: dateLong(record.date), value: record[feature.key], count: record._sampleCount || 1 }))
    : aggregateSeasonality(recordsToShow, feature, mode).map((group) => ({ label: group.label, value: group.value, count: group.values.length }));
  const periodHeader = mode === "daily" ? "Calendar day" : mode === "weekday" ? "Day of week" : "Calendar month";
  const valueLabel = mode === "daily" ? feature.label : `Mean ${feature.label}`;
  const rowsHtml = rows.map((row) => {
    const value = feature.key === "windDirection" ? `${pretty(row.value, 0)}°` : pretty(row.value, feature.key === "co" || feature.key === "pb" ? 2 : 1);
    return `<tr><th scope="row">${escapeHTML(row.label)}</th><td>${value}</td><td>${number.format(row.count)}</td></tr>`;
  }).join("");
  $("#trendDataTable").innerHTML = `<div class="chart-data-wrap"><table class="chart-data-table"><caption class="sr-only">${escapeHTML(valueLabel)} values corresponding to the selected chart.</caption><thead><tr><th scope="col">${periodHeader}</th><th scope="col">${escapeHTML(valueLabel)}${feature.unit ? ` (${escapeHTML(feature.unit)})` : ""}</th><th scope="col">Daily samples</th></tr></thead><tbody>${rowsHtml || `<tr><td colspan="3">No valid values for this selection.</td></tr>`}</tbody></table></div>`;
}

function renderTrend(daily) {
  const selected = ALL_FEATURES.find((feature) => feature.key === trendSelect.value) || ALL_FEATURES[0];
  const lastDate = daily.length ? new Date(daily.at(-1).date).getTime() : 0;
  const visible = rangeDays === "all" ? daily : daily.filter((record) => Date.parse(record.date) >= lastDate - Number(rangeDays) * 86400000);
  const actual = visible.length ? visible : daily;
  const modeLabels = { daily: "over time", weekday: "weekday pattern", month: "monthly pattern" };
  const subtitles = { daily: "Daily calendar-day aggregate", weekday: "Mean by day of week · daily samples", month: "Mean by calendar month · daily samples" };
  const notes = { daily: "DAILY AGGREGATE · NO SMOOTHING", weekday: "MEAN BY DAY OF WEEK", month: "MEAN BY CALENDAR MONTH" };
  if (selected.key === "windDirection") {
    subtitles.daily = "Daily circular mean · 0° = north";
    subtitles.weekday = "Circular mean by weekday · daily samples";
    subtitles.month = "Circular mean by month · daily samples";
    notes.daily = "CIRCULAR MEAN · BREAK AT NORTH";
    notes.weekday = "CIRCULAR MEAN BY WEEKDAY";
    notes.month = "CIRCULAR MEAN BY MONTH";
  }
  $("#trendTitle").textContent = `${selected.label} ${modeLabels[chartMode]}`;
  $("#trendSubtitle").textContent = `${sourceType === "demo" ? "Synthetic demo" : "Uploaded data"} · ${subtitles[chartMode]}`;
  $("#trendUnit").textContent = selected.unit || (selected.key === "aqi" ? "AQI index" : "index");
  $("#trendModeNote").textContent = notes[chartMode];
  if (chartMode === "daily") renderTrendChart($("#trendChart"), actual, selected);
  else renderSeasonalityChart($("#trendChart"), actual, selected, chartMode);
  renderTrendDataTable(actual, selected, chartMode);
  $("#trendMinDate").textContent = actual.length ? dateShort(actual[0].date) : "—";
  $("#trendMaxDate").textContent = actual.length ? dateShort(actual.at(-1).date) : "—";
}

function renderCorrelation(daily) {
  const features = CORRELATION_FEATURES.filter((feature) => daily.some((record) => Number.isFinite(record[feature.key])));
  renderCorrelationMatrix($("#correlationMatrix"), daily, features);
}

function renderForecast() {
  const result = forecastNextDay(records);
  const value = $("#forecastValue");
  const band = $("#forecastBand");
  const marker = $("#forecastMarker");
  if (!result.available) {
    value.textContent = "—";
    $("#forecastCategory").textContent = "Forecast unavailable";
    $("#forecastTargetDate").textContent = "";
    $("#forecastRange").textContent = "No baseline generated";
    $("#forecastStatus").textContent = "More complete daily history is needed.";
    $("#forecastExplanation").textContent = result.reasons.join(" ");
    band.style.left = "0%"; band.style.width = "0%"; marker.style.left = "0%";
    return;
  }
  value.textContent = String(result.value);
  $("#forecastCategory").textContent = result.category.label;
  $("#forecastCategory").style.color = result.category.color;
  $("#forecastTargetDate").textContent = `FOR ${dateLong(result.targetDate).toUpperCase()}`;
  $("#forecastRange").textContent = `Recent spread ${result.lower}–${result.upper} AQI`;
  $("#forecastStatus").textContent = "A seven-day baseline is available.";
  $("#forecastExplanation").textContent = `${result.method} This is a descriptive baseline for the selected dataset, not a validated forecast.`;
  band.style.left = `${result.lower / 5}%`;
  band.style.width = `${Math.max(1, (result.upper - result.lower) / 5)}%`;
  marker.style.left = `${result.value / 5}%`;
}

function render() {
  setSourceUI();
  const daily = dailyRecords(records);
  const quality = analyzeDataset(records, invalidCount);
  renderSnapshot(daily, quality);
  renderQuality(quality);
  renderTrend(daily);
  renderCorrelation(daily);
  renderForecast();
}

function renderModelTable() {
  const models = [
    ["Linear / Ridge regression", "Interpretable baseline"],
    ["Random forest", "Tree ensemble"],
    ["XGBoost", "Gradient boosting"],
    ["LSTM", "Sequence learning"],
    ["ARIMA / Prophet", "Time series"]
  ];
  $("#modelTableBody").innerHTML = models.map(([name, type]) => `<tr><td><strong>${name}</strong></td><td>${type}</td><td>—</td><td>—</td><td>—</td><td><span class="status-pending">Not evaluated</span></td></tr>`).join("");
}

function buildMappingForm(headers, mapping) {
  $("#mappingFields").innerHTML = COLUMN_FIELDS.map((field) => {
    const options = [`<option value="">Not mapped</option>`, ...headers.map((header) => `<option value="${escapeHTML(header)}" ${mapping[field.key] === header ? "selected" : ""}>${escapeHTML(header)}</option>`)].join("");
    return `<label class="mapping-field ${field.required ? "required-field" : ""}"><span>${field.label}${field.required ? " <b>Required</b>" : ""}</span><select data-field="${field.key}">${options}</select></label>`;
  }).join("");
  $("#mappingSummary").textContent = `${pendingImport.rows.length.toLocaleString()} data rows · ${headers.length} columns detected`;
  $("#mappingError").textContent = "";
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

function openMapping(csv, filename) {
  pendingImport = { ...csv, filename };
  buildMappingForm(csv.headers, inferMapping(csv.headers));
  $("#mappingDialog").showModal();
}

async function readCSV(file) {
  if (!file) return;
  if (!file.name.toLowerCase().endsWith(".csv") && file.type !== "text/csv") { showToast("Choose a CSV file to continue.", true); return; }
  if (file.size > 15 * 1024 * 1024) { showToast("This file is larger than 15 MB. Use a smaller CSV export.", true); return; }
  try {
    const csv = parseCSVText(await file.text());
    if (csv.rows.length > 50000) { showToast("This app supports up to 50,000 CSV data rows per import.", true); return; }
    openMapping(csv, file.name);
  } catch (error) {
    showToast(error.message || "Could not read this CSV file.", true);
  } finally {
    $("#csvFile").value = "";
  }
}

function applyImport() {
  if (!pendingImport) return;
  const mapping = Object.fromEntries([...$("#mappingFields").querySelectorAll("select")].map((select) => [select.dataset.field, select.value]));
  if (!mapping.date) { $("#mappingError").textContent = "Map a date or timestamp column to continue."; return; }
  const hasPollutantColumn = POLLUTANTS.some((pollutant) => mapping[pollutant.key]);
  if (!hasPollutantColumn) { $("#mappingError").textContent = "Map at least one pollutant column to calculate AQI."; return; }
  const result = normalizeRows(pendingImport.rows, mapping);
  if (!result.records.length) { $("#mappingError").textContent = "No valid dates were found. Check the mapped date column and its format."; return; }
  if (!result.records.some((record) => POLLUTANTS.some((pollutant) => Number.isFinite(record[pollutant.key])))) {
    $("#mappingError").textContent = "No valid pollutant values were found in the mapped columns."; return;
  }
  records = result.records;
  invalidCount = result.invalidCount;
  sourceType = "upload";
  sourceName = pendingImport.filename;
  $("#mappingDialog").close();
  pendingImport = null;
  rangeDays = "all";
  document.querySelectorAll(".range-tabs button").forEach((button) => button.classList.toggle("active", button.dataset.range === "all"));
  render();
  showToast(`Loaded ${records.length.toLocaleString()} timestamped rows from your CSV.`);
}

function downloadSummary() {
  const daily = dailyRecords(records);
  const quality = analyzeDataset(records, invalidCount);
  const current = daily.at(-1) ? calculateAQI(daily.at(-1)) : null;
  const forecast = forecastNextDay(records);
  const lines = [
    "AIRSCOPE · AIR QUALITY ANALYSIS SUMMARY",
    `Generated: ${new Date().toLocaleString()}`,
    `Data source: ${sourceType === "demo" ? "Illustrative synthetic demo data; not a real station or city" : `User upload (${sourceName}); processed locally in this browser)`}`,
    `Records: ${records.length}`,
    `Coverage: ${quality.start ? dateLong(quality.start) : "not available"} to ${quality.end ? dateLong(quality.end) : "not available"}`,
    `Mapped numeric fields: ${quality.fields.length}`,
    `Completeness: ${quality.completeness.toFixed(1)}%` ,
    `Missing cells: ${quality.missing}; duplicates: ${quality.duplicates}; invalid values: ${quality.invalidCount}; unusual sampling gaps: ${quality.gapCount}`,
    `Latest daily AQI estimate: ${current?.value === null || current?.value === undefined ? "not available" : `${current.value}${current.openEnded ? "+ (lower bound)" : ""} · ${current.category.label}`}`,
    `Next-day baseline: ${forecast.available ? `${forecast.value} · ${forecast.category.label} · recent spread ${forecast.lower}–${forecast.upper}; seven-day mean baseline, not a trained model` : `unavailable · ${forecast.reasons.join(" ")}`}`,
    "",
    "Disclosure: CPCB-style educational estimate. Verify official averaging windows, station aggregation and validated data before research or public-health use.",
    "Wind direction uses circular daily means and sine/cosine terms for Pearson correlation; it is excluded from linear IQR outlier flags.",
    "Duplicate checks match exact parsed timestamps only; same-day repeats or station duplicates may remain.",
    "Model comparison: MAE, RMSE, and R² have not been supplied or computed. No best model or project finding is established.",
    "AQI source: https://www.pib.gov.in/newsite/printrelease.aspx?relid=110654"
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
  const anchor = document.createElement("a");
  const downloadUrl = URL.createObjectURL(blob);
  anchor.href = downloadUrl;
  anchor.download = "airscope-analysis-summary.txt";
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
  showToast("Analysis summary exported as a text file.");
}

$("#uploadButton").addEventListener("click", () => $("#csvFile").click());
$("#uploadButtonBottom").addEventListener("click", () => $("#csvFile").click());
$("#csvFile").addEventListener("change", (event) => readCSV(event.target.files[0]));
$("#applyMapping").addEventListener("click", applyImport);
$("#cancelMapping").addEventListener("click", () => $("#mappingDialog").close());
$("#printButton").addEventListener("click", downloadSummary);
trendSelect.addEventListener("change", () => renderTrend(dailyRecords(records)));
$("#seasonalityMode").addEventListener("change", (event) => { chartMode = event.target.value; renderTrend(dailyRecords(records)); });
$("#correlationMatrix").addEventListener("click", (event) => {
  const cell = event.target.closest(".correlation-cell");
  if (!cell) return;
  const feature = CORRELATION_FEATURES.find((item) => item.key === cell.dataset.y);
  const paired = CORRELATION_FEATURES.find((item) => item.key === cell.dataset.x);
  if (!feature || !paired) return;
  trendSelect.value = feature.key === "windDirSin" || feature.key === "windDirCos" ? "windDirection" : feature.key;
  chartMode = "daily";
  $("#seasonalityMode").value = "daily";
  renderTrend(dailyRecords(records));
  const coefficient = cell.dataset.value ? `r = ${cell.dataset.value}` : "insufficient paired values";
  showToast(`${feature.label} × ${paired.label}: ${coefficient}`);
});
document.querySelectorAll(".range-tabs button").forEach((button) => button.addEventListener("click", () => {
  rangeDays = button.dataset.range === "all" ? "all" : Number(button.dataset.range);
  document.querySelectorAll(".range-tabs button").forEach((item) => item.classList.toggle("active", item === button));
  renderTrend(dailyRecords(records));
}));
$("#menuToggle").addEventListener("click", () => {
  const open = $("#sidebar").classList.toggle("mobile-open");
  $("#menuToggle").setAttribute("aria-expanded", String(open));
});
document.querySelectorAll(".nav-link").forEach((link) => link.addEventListener("click", () => {
  document.querySelectorAll(".nav-link").forEach((item) => item.classList.toggle("active", item === link));
  $("#sidebar").classList.remove("mobile-open");
  $("#menuToggle").setAttribute("aria-expanded", "false");
}));
const dropzone = $("#uploadDropzone");
for (const eventName of ["dragenter", "dragover"]) dropzone.addEventListener(eventName, (event) => { event.preventDefault(); dropzone.classList.add("drag-active"); });
for (const eventName of ["dragleave", "drop"]) dropzone.addEventListener(eventName, (event) => { event.preventDefault(); dropzone.classList.remove("drag-active"); });
dropzone.addEventListener("drop", (event) => readCSV(event.dataTransfer.files[0]));
$("#mappingDialog").addEventListener("click", (event) => { if (event.target === $("#mappingDialog")) $("#mappingDialog").close(); });

renderModelTable();
render();
