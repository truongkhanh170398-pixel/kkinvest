# DUCKMAN Score Scanner

A local web app that reimplements `RS Duck Man.afl` (the Relative-Strength
scanner one folder up) as a live scanner against real Vietnamese market data,
as **DUCKMAN Score**. Same 10-criteria idea as the AFL script, run against
every listed ticker instead of one AmiBroker database.

## Run it

```bash
cd pena-scanner
pip install -r requirements.txt
uvicorn app:app --reload
```

Open `http://localhost:8000`, then click **Quét lại** to start the first scan.

## What's implemented

Only the **Điểm mua** (buy-score scanner) surface from the reference
screenshot is real — Tổng quan, Phân tích cơ bản, Phân tích kỹ thuật, and
Danh mục KH weren't derivable from the files in this folder, so there's no
nav for them in this build.

Within it there are 3 views:
- **Điểm MUA** — the AFL's buy-side `Filter`, ranked by DUCKMAN Score.
- **Sức mạnh CP** — same DUCKMAN Score, no filter, every ticker ranked (this is
  what the reference screenshot shows).
- **Điểm BÁN** — a bearish mirror of the same 10 criteria (RS Line making new
  lows, MAs in descending order, red weekly streaks, etc.). **This is my own
  extension** — the source AFL only scans for buys — flagged as such in the
  page footnote too.

## Data source

Price history comes directly from **24HMoney's** chart endpoint
(`api.24hmoney.vn/tradingview/history`) — the same one their own stock-detail
page charts call. It's undocumented (found by digging through their Nuxt.js
bundles, not from published docs). The real lesson from tuning this: a fresh
`requests.get()` per ticker pays a full TCP+TLS handshake every time, which
capped throughput at ~9 req/s even with 15-way concurrency. Switching to a
single pooled `requests.Session` (keep-alive, reused connections) measured
50-170 req/s clean at 15-25 concurrency with zero failures.
`data_source.py`/`scan_job.py` run well under that measured ceiling (16
workers, ~28 req/s dispatch cap) — a full cold ~1,500-ticker scan takes
**under a minute** (measured: ~59s from an empty cache). Every ticker's
history is cached to `data/cache/*.pkl` and reused for 20h, so rescans after
that only refetch what's gone stale.

The stock/exchange/sector *listing* (which tickers exist, what exchange and
industry each is on) still comes from `vnstock` (VCI) — that's one call, not
per-ticker, so its 20 req/min anonymous-use limit doesn't matter there.

This is **not** a licensed commercial data feed, from either source. Fine
for personal analysis; swap in a proper paid API (SSI FastConnect,
Fiintrade, etc.) before any commercial use. Because the 24hmoney endpoint is
unofficial, it could change or disappear without notice — if it starts
failing, that's the first thing to check.

## Files

- `data_source.py` — fetches price history from 24hmoney's chart endpoint and the stock/sector listing from vnstock (VCI), with disk caching and request throttling.
- `scanner.py` — pandas port of the AFL's daily/weekly/monthly conditions → DUCKMAN Score + Filter, plus the bearish mirror.
- `scan_job.py` — background thread pool that walks the universe, writes results to `data/pena.db` (SQLite), tracks scan progress.
- `app.py` — FastAPI app: serves `static/` and the `/api/*` endpoints.
- `static/` — the single-page frontend (vanilla HTML/CSS/JS, no build step).
