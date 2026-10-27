# Method and sources

The user-provided project brief names the Central Pollution Control Board (CPCB) National Air Quality Index, October 2014. The official Press Information Bureau (PIB) release announcing the National AQI reproduces the pollutant concentration breakpoint table, its six category bands, the short-term averaging periods, and the linear sub-index method. The CPCB National AQI portal provides the official dashboard and AQI data repository.

The app uses the published breakpoint table as a teaching reference. It reports a CPCB-style estimate from the maximum available pollutant sub-index in a daily aggregate. The release lists AQI category bands of Good (0–50), Satisfactory (51–100), Moderately polluted (101–200), Poor (201–300), Very poor (301–400), and Severe (401–500). It lists PM10, PM2.5, NO2, SO2, NH3 and Pb as 24-hour measures and O3 and CO as 8-hour measures; CO breakpoints are in mg/m³ and the other listed pollutant concentrations are in µg/m³.

**Open-ended Severe band convention:** the government table lists only a lower concentration boundary for each Severe pollutant band. It does not give a finite upper concentration breakpoint to interpolate through that band. The finite upper edge of the preceding Very poor band remains AQI 400; the app therefore marks concentrations strictly above that edge as `401+` (a lower-bound category estimate) and does not invent a concentration endpoint or claim an exact AQI there. Verify the precise CPCB station-level implementation before using this client-side calculator for official reporting.

**Daily aggregation:** for subdaily uploaded rows, the app uses a simple arithmetic average by calendar day for pollutant concentrations and ordinary weather fields. Wind direction is averaged circularly so bearings near 0°/360° are not treated as far apart. For Pearson correlation, wind direction is represented by its sine and cosine components rather than raw degrees. These exploratory calculations do not substitute for verifying required 24-hour/8-hour averaging windows, regulatory completeness rules, station aggregation, or data validation. The accessible chart table exposes the plotted daily values or seasonality-group summaries. The next-day display is a seven-day trailing-mean baseline, not a trained forecasting model. Its ±1 standard deviation band describes variation in recent AQI estimates; it is not a calibrated prediction interval.

**Quality checks:** duplicate checks match exact parsed timestamps. They cannot reliably identify same-day duplicates from different timestamp strings or repeated station records without station identity. Wind direction is excluded from the linear 1.5×IQR outlier count.

**Demo data:** the built-in time series is deterministic synthetic data generated in the browser. It does not describe a real city, station, period, or measured outcome.

## References

1. Press Information Bureau, Government of India, Ministry of Environment, Forest and Climate Change, “National Air Quality Index (AQI) launched by the Environment Minister,” 17 October 2014. https://www.pib.gov.in/newsite/printrelease.aspx?relid=110654
2. Central Pollution Control Board, “National Air Quality Index.” https://cpcb.nic.in/National-Air-Quality-Index/
3. Central Pollution Control Board, National AQI portal. https://airquality.cpcb.gov.in/AQI_India/
