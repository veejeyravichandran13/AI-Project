# Market Journal App

A lightweight web app to track your daily mutual fund and stock market analysis.

## Features

- Add daily entries for stocks and mutual funds
- Track bias, confidence score, risk, thesis, and action plan
- Filter by date, asset type, and bias
- View quick stats (total entries, average confidence, bullish ratio)
- Export and import your journal data as JSON
- Data stored locally in browser `localStorage`

## Run

1. Open `app/index.html` in your browser.
2. Start adding entries.

Optional local server:

```bash
cd app
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Notes

- Data is local to the browser profile and device.
- Use **Export JSON** for backups.
