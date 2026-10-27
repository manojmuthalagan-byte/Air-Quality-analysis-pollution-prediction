# Air-Quality-analysis-pollution-prediction

**Published demo:** [Open Airscope on Manus](https://airwatch-xdwgmpeb.manus.space/)

## Project overview

Air Quality Analysis & Pollution Prediction is a machine-learning-based project that analyzes air pollution levels and explores future air quality using historical environmental data. The system aims to promote environmental awareness and support better decision-making for pollution control.

**Airscope** is the project's interactive educational dashboard. It calculates CPCB-style AQI estimates and explores pollutant and weather patterns. It is a learning aid, not an official monitoring service.

## Dashboard features

- AQI estimates and sub-indices for PM2.5, PM10, NO₂, SO₂, CO, O₃, NH₃, and Pb.
- Client-side CSV upload with column mapping and data-quality summaries.
- Daily trends, weekday/month seasonality, correlation analysis, and accessible chart data tables.
- A next-day seven-day-mean baseline and a model-comparison section for MAE, RMSE, and R².
- Method assumptions, sources, and limitations in [`docs/methodology-sources.md`](docs/methodology-sources.md).

## Run locally

Requires Node.js and npm. From the project directory:

```sh
npm start
```

Then open `http://localhost:3000`. The app has no external runtime dependencies.

## Data and result caveats

The built-in dataset is synthetic and illustrative; it is not attributed to a real city or station. Uploaded CSV files are processed in the browser session and are not sent to an application server. The AQI calculation is an educational CPCB-style estimate and does not replace official averaging-window, completeness, or station-level procedures. The forecast is a simple seven-day mean baseline, not a trained forecasting model; its recent-variability range is not a calibrated confidence interval. No dataset-specific model scores, best model, or findings were supplied, so those remain unclaimed.

## Sources

- [CPCB National Air Quality Index portal](https://airquality.cpcb.gov.in/AQI_India/)
- [Government of India PIB release on the National AQI](https://www.pib.gov.in/newsite/printrelease.aspx?relid=110654)
