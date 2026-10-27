export const AQI_CATEGORIES = [
  { min: 0, max: 50, label: "Good", color: "#2e8b6f", health: "Minimal impact." },
  { min: 51, max: 100, label: "Satisfactory", color: "#86a72f", health: "May cause minor breathing discomfort to sensitive people." },
  { min: 101, max: 200, label: "Moderately polluted", color: "#d79c28", health: "May cause breathing discomfort to people with lung disease, and discomfort to people with heart disease, children, and older adults." },
  { min: 201, max: 300, label: "Poor", color: "#d9793d", health: "May cause breathing discomfort on prolonged exposure." },
  { min: 301, max: 400, label: "Very poor", color: "#b94e53", health: "May cause respiratory illness on prolonged exposure, especially for people with lung or heart disease." },
  { min: 401, max: 500, label: "Severe", color: "#75558c", health: "May affect healthy people and cause serious health impacts for people with lung or heart disease." }
];

export const POLLUTANTS = [
  { key: "pm25", label: "PM2.5", name: "Fine particulate matter", unit: "µg/m³", short: "Fine particles", source: "Combustion, traffic, crop burning" },
  { key: "pm10", label: "PM10", name: "Particulate matter", unit: "µg/m³", short: "Coarse particles", source: "Road dust, construction" },
  { key: "no2", label: "NO₂", name: "Nitrogen dioxide", unit: "µg/m³", short: "Nitrogen dioxide", source: "Vehicle exhaust, power plants" },
  { key: "so2", label: "SO₂", name: "Sulphur dioxide", unit: "µg/m³", short: "Sulphur dioxide", source: "Coal burning, industry" },
  { key: "co", label: "CO", name: "Carbon monoxide", unit: "mg/m³", short: "Carbon monoxide", source: "Incomplete fuel combustion" },
  { key: "o3", label: "O₃", name: "Ground-level ozone", unit: "µg/m³", short: "Ground-level ozone", source: "Sunlight reacting with other gases" },
  { key: "nh3", label: "NH₃", name: "Ammonia", unit: "µg/m³", short: "Ammonia", source: "Agriculture, fertilisers" },
  { key: "pb", label: "Pb", name: "Lead", unit: "µg/m³", short: "Lead", source: "Batteries, metal processing" }
];

export const WEATHER = [
  { key: "temperature", label: "Temperature", unit: "°C", short: "Temp" },
  { key: "humidity", label: "Humidity", unit: "%", short: "Hum" },
  { key: "windSpeed", label: "Wind speed", unit: "m/s", short: "Wind" },
  { key: "windDirection", label: "Wind direction", unit: "°", short: "Dir" },
  { key: "rainfall", label: "Rainfall", unit: "mm", short: "Rain" }
];

export const ALL_FEATURES = [
  { key: "aqi", label: "AQI", unit: "index" },
  ...POLLUTANTS,
  ...WEATHER
];

export const CORRELATION_FEATURES = [
  ...ALL_FEATURES.filter((feature) => feature.key !== "windDirection"),
  { key: "windDirSin", label: "Wind direction · sine", unit: "ratio", short: "Dir sin" },
  { key: "windDirCos", label: "Wind direction · cosine", unit: "ratio", short: "Dir cos" }
];

const makeRanges = (values) => values.map(([lo, hi, indexLo, indexHi]) => ({ lo, hi, indexLo, indexHi }));

// Concentration ranges and health bands follow the table published by India's Press Information Bureau for the National AQI launch (2014). Units are µg/m³ except CO, which is mg/m³.
export const CPCB_BREAKPOINTS = {
  pm25: { ranges: makeRanges([[0, 30, 0, 50], [30, 60, 51, 100], [60, 90, 101, 200], [90, 120, 201, 300], [120, 250, 301, 400]]), severeFrom: 250 },
  pm10: { ranges: makeRanges([[0, 50, 0, 50], [50, 100, 51, 100], [100, 250, 101, 200], [250, 350, 201, 300], [350, 430, 301, 400]]), severeFrom: 430 },
  no2: { ranges: makeRanges([[0, 40, 0, 50], [40, 80, 51, 100], [80, 180, 101, 200], [180, 280, 201, 300], [280, 400, 301, 400]]), severeFrom: 400 },
  o3: { ranges: makeRanges([[0, 50, 0, 50], [50, 100, 51, 100], [100, 168, 101, 200], [168, 208, 201, 300], [208, 748, 301, 400]]), severeFrom: 748 },
  co: { ranges: makeRanges([[0, 1, 0, 50], [1, 2, 51, 100], [2, 10, 101, 200], [10, 17, 201, 300], [17, 34, 301, 400]]), severeFrom: 34 },
  so2: { ranges: makeRanges([[0, 40, 0, 50], [40, 80, 51, 100], [80, 380, 101, 200], [380, 800, 201, 300], [800, 1600, 301, 400]]), severeFrom: 1600 },
  nh3: { ranges: makeRanges([[0, 200, 0, 50], [200, 400, 51, 100], [400, 800, 101, 200], [800, 1200, 201, 300], [1200, 1800, 301, 400]]), severeFrom: 1800 },
  pb: { ranges: makeRanges([[0, 0.5, 0, 50], [0.5, 1, 51, 100], [1, 2, 101, 200], [2, 3, 201, 300], [3, 3.5, 301, 400]]), severeFrom: 3.5 }
};

export const COLUMN_FIELDS = [
  { key: "date", label: "Date / timestamp", required: true, aliases: ["date", "datetime", "timestamp", "time", "samplingdate", "sampledate", "dateandtime"] },
  { key: "pm25", label: "PM2.5 concentration (µg/m³)", aliases: ["pm25", "pm2.5", "pm2_5", "pm2 5", "pm25ugm3", "pm2.5ugm3", "pm25gm", "pm2.5gm", "pm25gm3", "pm2.5gm3"] },
  { key: "pm10", label: "PM10 concentration (µg/m³)", aliases: ["pm10", "pm10ugm3", "pm10gm", "pm10gm3"] },
  { key: "no2", label: "NO₂ concentration (µg/m³)", aliases: ["no2", "no2gm", "no2gm3", "nitrogendioxide"] },
  { key: "so2", label: "SO₂ concentration (µg/m³)", aliases: ["so2", "so2gm", "so2gm3", "sulfurdioxide", "sulphurdioxide"] },
  { key: "co", label: "CO concentration (mg/m³)", aliases: ["co", "comgm", "comgm3", "carbonmonoxide"] },
  { key: "o3", label: "O₃ concentration (µg/m³)", aliases: ["o3", "o3gm", "o3gm3", "ozone"] },
  { key: "nh3", label: "NH₃ concentration (µg/m³)", aliases: ["nh3", "nh3gm", "nh3gm3", "ammonia"] },
  { key: "pb", label: "Pb concentration (µg/m³)", aliases: ["pb", "pbgm", "pbgm3", "lead"] },
  { key: "temperature", label: "Temperature", aliases: ["temperature", "temp", "temp_c"] },
  { key: "humidity", label: "Humidity", aliases: ["humidity", "relativehumidity", "rh"] },
  { key: "windSpeed", label: "Wind speed", aliases: ["windspeed", "wind_speed", "ws"] },
  { key: "windDirection", label: "Wind direction", aliases: ["winddirection", "wind_direction", "wd"] },
  { key: "rainfall", label: "Rainfall", aliases: ["rainfall", "precipitation", "rain"] }
];

export function categoryForAQI(value) {
  if (!Number.isFinite(value)) return null;
  return AQI_CATEGORIES.find((category) => value <= category.max) || AQI_CATEGORIES[AQI_CATEGORIES.length - 1];
}

export function subIndexForConcentration(key, concentration) {
  const definition = CPCB_BREAKPOINTS[key];
  if (!definition || !Number.isFinite(concentration) || concentration < 0) return null;
  if (concentration > definition.severeFrom) {
    return { value: 401, openEnded: true, category: categoryForAQI(401) };
  }
  const range = definition.ranges.find((item) => concentration <= item.hi && concentration >= item.lo);
  if (!range) return { value: 0, openEnded: false, category: categoryForAQI(0) };
  const index = ((range.indexHi - range.indexLo) / (range.hi - range.lo || 1)) * (concentration - range.lo) + range.indexLo;
  const value = Math.max(range.indexLo, Math.min(range.indexHi, Math.round(index)));
  return { value, openEnded: false, category: categoryForAQI(value) };
}

export function calculateAQI(record) {
  const subIndices = POLLUTANTS.flatMap((pollutant) => {
    const concentration = record?.[pollutant.key];
    if (!Number.isFinite(concentration) || concentration < 0) return [];
    return [{ pollutant, concentration, ...subIndexForConcentration(pollutant.key, concentration) }];
  }).sort((a, b) => b.value - a.value);
  if (!subIndices.length) return { value: null, category: null, subIndices, openEnded: false };
  const value = subIndices[0].value;
  return { value, category: categoryForAQI(value), subIndices, openEnded: subIndices[0].openEnded };
}

export function circularMeanDegrees(values) {
  const valid = values.filter((value) => Number.isFinite(value)).map((value) => value * Math.PI / 180);
  if (!valid.length) return null;
  const sinMean = valid.reduce((sum, angle) => sum + Math.sin(angle), 0) / valid.length;
  const cosMean = valid.reduce((sum, angle) => sum + Math.cos(angle), 0) / valid.length;
  if (Math.hypot(sinMean, cosMean) < 1e-10) return null;
  const direction = (Math.atan2(sinMean, cosMean) * 180 / Math.PI + 360) % 360;
  return direction > 360 - 1e-8 ? 0 : direction;
}

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export function demoRecords(count = 90) {
  const random = seededRandom(731942);
  const today = new Date();
  const end = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  return Array.from({ length: count }, (_, index) => {
    const day = count - index - 1;
    const date = new Date(end.getTime() - day * 86400000);
    const seasonal = Math.sin((index / 30) * Math.PI * 2);
    const weekly = Math.cos((index / 7) * Math.PI * 2);
    const noise = () => (random() - 0.5) * 12;
    return {
      date: date.toISOString(),
      _day: date.toISOString().slice(0, 10),
      pm25: Math.max(8, 40 + seasonal * 9 + weekly * 5 + noise()),
      pm10: Math.max(18, 116 + seasonal * 17 + weekly * 8 + noise() * 1.4),
      no2: Math.max(5, 35 + seasonal * 8 + weekly * 5 + noise() * 0.6),
      so2: Math.max(2, 18 + seasonal * 4 + noise() * 0.35),
      co: Math.max(0.1, 0.72 + seasonal * 0.12 + (random() - 0.5) * 0.18),
      o3: Math.max(5, 56 - seasonal * 9 + (random() - 0.5) * 16),
      nh3: Math.max(12, 92 + seasonal * 16 + noise() * 1.3),
      pb: Math.max(0.05, 0.22 + (random() - 0.5) * 0.08),
      temperature: 26 + Math.sin((index / count) * Math.PI * 2) * 4 + (random() - 0.5) * 2,
      humidity: 55 + Math.sin((index / 18) * Math.PI * 2) * 14 + (random() - 0.5) * 8,
      windSpeed: 2.1 + Math.sin((index / 12) * Math.PI * 2) * 0.7 + (random() - 0.5) * 0.7,
      windDirection: (index * 17 + Math.round(random() * 40)) % 360,
      rainfall: random() > 0.82 ? random() * 8 : 0,
      _source: "demo"
    };
  });
}

export function parseCSVText(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  const input = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    if (quoted && char === '"' && input[i + 1] === '"') { cell += '"'; i += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { row.push(cell.trim()); cell = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && input[i + 1] === "\n") i += 1;
      row.push(cell.trim());
      if (row.some((value) => value !== "")) rows.push(row);
      row = []; cell = "";
    } else cell += char;
  }
  if (cell.length || row.length) { row.push(cell.trim()); if (row.some((value) => value !== "")) rows.push(row); }
  if (rows.length < 2) throw new Error("The CSV needs a header row and at least one data row.");
  const headers = rows[0].map((header, i) => header || `Column ${i + 1}`);
  return { headers, rows: rows.slice(1).map((values) => Object.fromEntries(headers.map((header, i) => [header, values[i] ?? ""]))) };
}

function normalizedHeader(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9.]/g, "");
}

export function inferMapping(headers) {
  const mapping = {};
  for (const field of COLUMN_FIELDS) {
    const wanted = field.aliases.map(normalizedHeader);
    mapping[field.key] = headers.find((header) => wanted.includes(normalizedHeader(header))) || "";
  }
  return mapping;
}

export function normalizeRows(sourceRows, mapping) {
  const records = [];
  let invalidCount = 0;
  const mappedFields = COLUMN_FIELDS.filter((field) => field.key !== "date" && mapping[field.key]).map((field) => field.key);
  for (const source of sourceRows) {
    const rawDate = mapping.date ? source[mapping.date] : "";
    const dateText = String(rawDate || "").trim();
    const parsedDate = dateText ? new Date(dateText) : null;
    if (!parsedDate || Number.isNaN(parsedDate.getTime())) { invalidCount += 1; continue; }
    const writtenDate = dateText.match(/^(\d{4}-\d{2}-\d{2})/);
    const hasExplicitZone = /[T ]\d{2}:\d{2}.*(?:Z|[+-]\d{2}:?\d{2})$/i.test(dateText);
    const calendarDay = writtenDate && !hasExplicitZone ? writtenDate[1] : parsedDate.toISOString().slice(0, 10);
    const record = { date: parsedDate.toISOString(), _day: calendarDay, _mappedFields: mappedFields, _source: "upload" };
    for (const field of COLUMN_FIELDS.filter((item) => item.key !== "date")) {
      const column = mapping[field.key];
      if (!column) { record[field.key] = null; continue; }
      const raw = String(source[column] ?? "").trim().replace(/,/g, "");
      if (!raw) { record[field.key] = null; continue; }
      const value = Number(raw);
      const outOfRange = (field.key === "windDirection" && value > 360) || (field.key === "humidity" && value > 100);
      if (!Number.isFinite(value) || value < 0 || outOfRange) { record[field.key] = null; invalidCount += 1; }
      else record[field.key] = field.key === "windDirection" && value === 360 ? 0 : value;
    }
    records.push(record);
  }
  return { records: records.sort((a, b) => new Date(a.date) - new Date(b.date)), invalidCount };
}

export function dailyRecords(records) {
  const groups = new Map();
  for (const record of records) {
    const date = new Date(record.date);
    if (Number.isNaN(date.getTime())) continue;
    const day = record._day || date.toISOString().slice(0, 10);
    if (!groups.has(day)) groups.set(day, { date: `${day}T00:00:00.000Z`, _source: record._source || "upload", _rows: 0, _values: {} });
    const group = groups.get(day);
    group._rows += 1;
    for (const feature of [...POLLUTANTS, ...WEATHER]) {
      const value = record[feature.key];
      if (Number.isFinite(value)) group._values[feature.key] = [...(group._values[feature.key] || []), value];
    }
  }
  return [...groups.values()].sort((a, b) => a.date.localeCompare(b.date)).map((group) => {
    const record = { date: group.date, _source: group._source, _sampleCount: group._rows };
    for (const feature of [...POLLUTANTS, ...WEATHER]) {
      const values = group._values[feature.key] || [];
      record[feature.key] = feature.key === "windDirection" ? circularMeanDegrees(values) : values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
    }
    const direction = record.windDirection;
    record.windDirSin = Number.isFinite(direction) ? Math.sin(direction * Math.PI / 180) : null;
    record.windDirCos = Number.isFinite(direction) ? Math.cos(direction * Math.PI / 180) : null;
    const aqi = calculateAQI(record);
    record.aqi = aqi.value;
    record._aqiOpenEnded = aqi.openEnded;
    return record;
  });
}

export function analyzeDataset(records, invalidCount = 0) {
  const mappedFields = new Set(records.flatMap((record) => record._mappedFields || []));
  const fields = [...POLLUTANTS, ...WEATHER].filter((feature) => mappedFields.size ? mappedFields.has(feature.key) : records.some((record) => Number.isFinite(record[feature.key])));
  const cells = records.length * fields.length;
  const filled = records.reduce((sum, record) => sum + fields.filter((feature) => Number.isFinite(record[feature.key])).length, 0);
  const validDates = records.map((record) => new Date(record.date)).filter((date) => !Number.isNaN(date.getTime())).sort((a, b) => a - b);
  const seen = new Set();
  let duplicates = 0;
  for (const date of validDates) { const key = date.toISOString(); if (seen.has(key)) duplicates += 1; seen.add(key); }
  const uniqueDates = [...new Set(validDates.map((date) => date.getTime()))].sort((a, b) => a - b);
  const gaps = uniqueDates.slice(1).map((value, i) => (value - uniqueDates[i]) / 86400000);
  const positiveGaps = gaps.filter((gap) => gap > 0).sort((a, b) => a - b);
  const medianGap = positiveGaps.length ? positiveGaps[Math.floor(positiveGaps.length / 2)] : null;
  const gapCount = medianGap ? gaps.filter((gap) => gap > medianGap * 1.5).length : 0;
  const outliers = fields.filter((feature) => feature.key !== "windDirection").map((feature) => {
    const values = records.map((record) => record[feature.key]).filter(Number.isFinite).sort((a, b) => a - b);
    if (values.length < 4) return { key: feature.key, count: 0 };
    const q1 = values[Math.floor((values.length - 1) * 0.25)];
    const q3 = values[Math.floor((values.length - 1) * 0.75)];
    const spread = q3 - q1;
    return { key: feature.key, count: values.filter((value) => value < q1 - 1.5 * spread || value > q3 + 1.5 * spread).length };
  });
  return {
    records: records.length,
    fields,
    completeness: cells ? (filled / cells) * 100 : 0,
    missing: cells - filled,
    duplicates,
    gapCount,
    medianGapDays: medianGap,
    invalidCount,
    outliers,
    start: validDates[0] || null,
    end: validDates.at(-1) || null
  };
}

export function forecastNextDay(records) {
  const daily = dailyRecords(records);
  if (daily.length < 7) return { available: false, reasons: [`At least 7 daily observations are required; ${daily.length} day${daily.length === 1 ? "" : "s"} found.`] };
  const recent = daily.slice(-7);
  const reasons = [];
  if (recent.some((record) => !Number.isFinite(record.aqi))) reasons.push("Each of the latest 7 calendar days needs at least one valid pollutant reading to calculate AQI.");
  const dayMillis = 86400000;
  const dates = recent.map((record) => Date.parse(record.date));
  if (dates.slice(1).some((time, i) => Math.round((time - dates[i]) / dayMillis) !== 1)) reasons.push("The latest 7 observations must cover 7 consecutive calendar days; a sampling gap was found.");
  if (reasons.length) return { available: false, reasons };
  const values = recent.map((record) => record.aqi);
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  const sd = Math.sqrt(variance);
  const value = Math.round(mean);
  const targetDate = new Date(Date.parse(recent.at(-1).date) + dayMillis).toISOString();
  return {
    available: true,
    value,
    lower: Math.max(0, Math.round(mean - sd)),
    upper: Math.min(500, Math.round(mean + sd)),
    category: categoryForAQI(value),
    targetDate,
    sd,
    method: "Seven-day trailing mean; range is ±1 standard deviation of those seven daily AQI estimates."
  };
}

export function average(values) {
  const valid = values.filter(Number.isFinite);
  return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : null;
}

export function pearson(records, xKey, yKey) {
  const pairs = records.map((record) => [record[xKey], record[yKey]]).filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
  if (pairs.length < 3) return null;
  const meanX = average(pairs.map(([x]) => x));
  const meanY = average(pairs.map(([, y]) => y));
  const numerator = pairs.reduce((sum, [x, y]) => sum + (x - meanX) * (y - meanY), 0);
  const denomX = Math.sqrt(pairs.reduce((sum, [x]) => sum + (x - meanX) ** 2, 0));
  const denomY = Math.sqrt(pairs.reduce((sum, [, y]) => sum + (y - meanY) ** 2, 0));
  return denomX && denomY ? numerator / (denomX * denomY) : null;
}
