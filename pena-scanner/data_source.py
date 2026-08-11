"""
Data access layer for the DUCKMAN Score scanner.

Price history comes directly from 24HMoney's public TradingView-compatible
chart endpoint (`https://api.24hmoney.vn/tradingview/history`) -- found by
digging through 24hmoney.vn's own Nuxt.js bundles (their stock-detail chart
component calls it as `getStockChartData`). It's undocumented (no official
API/ToS page), free, and -- unlike vnstock's anonymous tier (hard-capped at
20 req/min) -- comfortably sustained ~8-9 req/s with 10-way concurrency in
testing with zero failures. Still, be a reasonable citizen of an endpoint
that isn't meant for bulk scanning: see the throttle below.

The stock/exchange/sector *listing* still comes from `vnstock` (VCI) --
that's a single one-time call, not per-ticker, so vnstock's rate limit
doesn't matter there.

This is NOT a licensed commercial data feed. Fine for personal analysis;
swap in a proper paid API (SSI FastConnect, Fiintrade, etc.) before any
commercial use.

Everything here is read-only and disk-cached under data/, so repeated scans
don't re-hit the network for data that hasn't gone stale.
"""
from __future__ import annotations

import contextlib
import io
import threading
import time
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FutureTimeoutError
from datetime import date, datetime, timedelta
from pathlib import Path

import pandas as pd
import requests

BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"
CACHE_DIR = DATA_DIR / "cache"
UNIVERSE_FILE = DATA_DIR / "universe.pkl"

CACHE_DIR.mkdir(parents=True, exist_ok=True)

HISTORY_YEARS = 8
INDEX_SYMBOL = "VNINDEX"
CHART_URL = "https://api.24hmoney.vn/tradingview/history"
HEADERS = {"User-Agent": "Mozilla/5.0"}

# vnstock prints a promo/notice banner to stdout on import & first calls;
# it's cosmetic, so we swallow it rather than let it spam the scan log.
_silence = lambda: contextlib.redirect_stdout(io.StringIO())

# A fresh `requests.get()` per call pays a full TCP+TLS handshake every
# time -- that handshake, not the endpoint itself, was the real bottleneck
# (~9 req/s measured even at 15-way concurrency). A shared, connection-
# pooled Session reusing keep-alive connections measured 50-170 req/s clean
# at 15-25 concurrency with zero failures. We throttle to well under that
# measured ceiling -- fast enough to matter, nowhere near what tested safe,
# since this is still an undocumented endpoint with no published limit.
_session = requests.Session()
_session.mount("https://", requests.adapters.HTTPAdapter(pool_connections=32, pool_maxsize=32))

_MIN_REQUEST_INTERVAL = 0.035  # ~28/s ceiling on dispatch, well under the 50-170/s measured
_rate_lock = threading.Lock()
_last_request_at = 0.0


def _throttle():
    global _last_request_at
    with _rate_lock:
        wait = _last_request_at + _MIN_REQUEST_INTERVAL - time.monotonic()
        if wait > 0:
            time.sleep(wait)
        _last_request_at = time.monotonic()


REQUEST_TIMEOUT = 12  # seconds -- generous vs. the well-under-1s a pooled call takes


def _fetch_raw(symbol: str, start_ts: int, end_ts: int) -> pd.DataFrame | None:
    resp = _session.get(
        CHART_URL,
        params={"symbol": symbol, "resolution": "D", "from": start_ts, "to": end_ts},
        headers=HEADERS,
        timeout=REQUEST_TIMEOUT,
    )
    resp.raise_for_status()
    data = resp.json()
    if data.get("s") != "ok" or not data.get("t"):
        return None  # e.g. "no_data" for a symbol with no trading history
    df = pd.DataFrame({
        "time": pd.to_datetime(data["t"], unit="s"),
        "open": data["o"], "high": data["h"], "low": data["l"], "close": data["c"], "volume": data["v"],
    })
    return df


def _fetch_with_timeout(symbol: str, start_ts: int, end_ts: int, timeout: float):
    # Each attempt gets its own disposable 1-worker executor: if requests'
    # own connect/read timeout ever fails to fire for some reason, we still
    # walk away after `timeout` instead of the caller blocking indefinitely.
    executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix=f"fetch-{symbol}")
    try:
        fut = executor.submit(_fetch_raw, symbol, start_ts, end_ts)
        return fut.result(timeout=timeout)
    finally:
        executor.shutdown(wait=False)


def _history_window() -> tuple[int, int]:
    end = datetime.now()
    start = end - timedelta(days=365 * HISTORY_YEARS + 30)
    return int(start.timestamp()), int(end.timestamp())


def load_universe(force_refresh: bool = False) -> pd.DataFrame:
    """Full stock universe: symbol, organ_name, exchange, sector.

    Cached to disk; the listing barely changes day to day, so we only
    refetch when the cache is missing/older than 24h or force_refresh=True.
    Still sourced from vnstock (VCI) -- a single call, not per-ticker, so
    its rate limit is irrelevant here.
    """
    if not force_refresh and UNIVERSE_FILE.exists():
        age = time.time() - UNIVERSE_FILE.stat().st_mtime
        if age < 24 * 3600:
            return pd.read_pickle(UNIVERSE_FILE)

    with _silence():
        from vnstock import Listing

        listing = Listing()
        exch = listing.symbols_by_exchange()
        industries = listing.symbols_by_industries()

    exch = exch[exch["type"] == "stock"][["symbol", "organ_name", "exchange"]].copy()
    industries = industries[["symbol", "industry_name"]].drop_duplicates("symbol")

    universe = exch.merge(industries, on="symbol", how="left")
    universe["industry_name"] = universe["industry_name"].fillna("Chưa phân loại")
    universe = universe.drop_duplicates("symbol").sort_values("symbol").reset_index(drop=True)

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    universe.to_pickle(UNIVERSE_FILE)
    return universe


def _cache_path(symbol: str) -> Path:
    return CACHE_DIR / f"{symbol}.pkl"


def _is_fresh(path: Path) -> bool:
    """A cached ticker is fresh if its most recent bar is today or the last
    trading day (i.e. cached less than ~20h ago is good enough for a
    same-day rescan; older triggers a refetch)."""
    if not path.exists():
        return False
    age = time.time() - path.stat().st_mtime
    return age < 20 * 3600


def get_history(symbol: str, use_cache: bool = True, retries: int = 1) -> pd.DataFrame | None:
    """Daily OHLCV for `symbol` (a stock ticker or 'VNINDEX'), oldest first."""
    path = _cache_path(symbol)
    if use_cache and _is_fresh(path):
        try:
            return pd.read_pickle(path)
        except Exception:
            pass  # fall through and refetch a corrupt cache file

    start_ts, end_ts = _history_window()
    last_err = None
    for attempt in range(retries + 1):
        try:
            _throttle()
            df = _fetch_with_timeout(symbol, start_ts, end_ts, REQUEST_TIMEOUT)
            if df is None or df.empty:
                return None
            df = df.sort_values("time").reset_index(drop=True)
            df.to_pickle(path)
            return df
        except FutureTimeoutError:
            last_err = f"timed out after {REQUEST_TIMEOUT}s"
            time.sleep(0.5 * (attempt + 1))
        except Exception as exc:  # network hiccup / bad symbol / HTTP error
            last_err = exc
            time.sleep(0.5 * (attempt + 1))
    if path.exists():
        # stale cache is still better than nothing if the refetch failed
        try:
            return pd.read_pickle(path)
        except Exception:
            pass
    print(f"[data_source] failed to fetch {symbol}: {last_err}")
    return None


def get_index_history(use_cache: bool = True) -> pd.DataFrame | None:
    return get_history(INDEX_SYMBOL, use_cache=use_cache)
