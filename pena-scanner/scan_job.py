"""
Background scan runner: walks the ticker universe, computes each symbol's
DUCKMAN Score via scanner.analyze_symbol, and writes results into SQLite so the
API can serve them instantly without re-touching the network per request.
"""
from __future__ import annotations

import json
import sqlite3
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from pathlib import Path

import data_source
import scanner

DB_PATH = data_source.DATA_DIR / "pena.db"
# With connection pooling (see data_source.py), 24hmoney's chart endpoint
# tested clean at 50-170 req/s across 15-25 concurrent workers. This stays
# well under that measured ceiling while still comfortably clearing a
# full ~1,500-ticker scan in under 90s.
WORKERS = 16

_state_lock = threading.Lock()
_state = {"status": "idle", "scanned": 0, "total": 0, "started_at": None, "updated_at": None, "error": None,
          "rate_per_min": None, "eta_seconds": None}

# Rolling window of (monotonic_time, scanned_count) samples so progress can
# report an honest current rate/ETA -- the raw average is misleading because
# already-cached tickers resolve instantly while new ones are hard-throttled
# to vnstock's ~20 req/min anonymous-use limit (see data_source.py), so the
# scan visibly speeds up and slows down as it moves through the universe.
_RATE_WINDOW_SECONDS = 45
_rate_samples: list[tuple[float, int]] = []


def _record_rate_sample(scanned: int):
    now = time.monotonic()
    _rate_samples.append((now, scanned))
    cutoff = now - _RATE_WINDOW_SECONDS
    while len(_rate_samples) > 1 and _rate_samples[0][0] < cutoff:
        _rate_samples.pop(0)


def _current_rate_and_eta(scanned: int, total: int) -> tuple[float | None, float | None]:
    if len(_rate_samples) < 2:
        return None, None
    t0, s0 = _rate_samples[0]
    t1, s1 = _rate_samples[-1]
    elapsed = t1 - t0
    if elapsed <= 0 or s1 <= s0:
        return None, None
    rate_per_sec = (s1 - s0) / elapsed
    remaining = max(total - scanned, 0)
    eta = remaining / rate_per_sec if rate_per_sec > 0 else None
    return rate_per_sec * 60, eta


def _db():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.execute(
        """CREATE TABLE IF NOT EXISTS results (
            symbol TEXT PRIMARY KEY,
            organ_name TEXT,
            exchange TEXT,
            sector TEXT,
            close REAL,
            volume INTEGER,
            date TEXT,
            liquid INTEGER,
            buy_score INTEGER,
            buy_filter INTEGER,
            buy_json TEXT,
            sell_score INTEGER,
            sell_filter INTEGER,
            sell_json TEXT,
            scanned_at TEXT
        )"""
    )
    # One row per (day, symbol) snapshot of that day's final "Suc manh CP"
    # ranking -- lets us compare today's rank against the most recent prior
    # day's rank ("Bien dong thu hang" panel) without needing to keep every
    # historical `results` row.
    conn.execute(
        """CREATE TABLE IF NOT EXISTS rank_snapshots (
            scan_date TEXT,
            symbol TEXT,
            rank INTEGER,
            buy_score INTEGER,
            PRIMARY KEY (scan_date, symbol)
        )"""
    )
    conn.commit()
    return conn


def get_progress() -> dict:
    with _state_lock:
        return dict(_state)


def get_sectors() -> list[str]:
    conn = _db()
    rows = conn.execute(
        "SELECT DISTINCT sector FROM results WHERE sector IS NOT NULL ORDER BY sector"
    ).fetchall()
    conn.close()
    return [r[0] for r in rows]


_VIEW_SCORE_COL = {"buy": "buy_score", "sell": "sell_score", "strength": "buy_score"}
# AFL's Filter = Vol AND (...) -- liquidity is never optional, it's baked
# into the same gate as the buy/sell conditions. "strength" drops the extra
# buy/sell-specific conditions but still requires the liquidity floor.
_VIEW_FILTER_COL = {"buy": "buy_filter", "sell": "sell_filter", "strength": "liquid"}


def get_results(view: str, sector: str | None) -> list[dict]:
    score_col = _VIEW_SCORE_COL.get(view, "buy_score")
    filter_col = _VIEW_FILTER_COL.get(view)

    sql = ("SELECT symbol, organ_name, exchange, sector, close, volume, date, "
           "buy_score, buy_filter, buy_json, sell_score, sell_filter, sell_json, scanned_at FROM results")
    clauses, params = [], []
    if filter_col:
        clauses.append(f"{filter_col} = 1")
    if sector and sector != "all":
        clauses.append("sector = ?")
        params.append(sector)
    if clauses:
        sql += " WHERE " + " AND ".join(clauses)
    sql += f" ORDER BY {score_col} DESC, volume DESC"

    conn = _db()
    rows = conn.execute(sql, params).fetchall()
    conn.close()

    out = []
    for r in rows:
        (symbol, organ_name, exchange, sector_, close, volume, date_,
         buy_score, buy_filter, buy_json, sell_score, sell_filter, sell_json, scanned_at) = r
        out.append({
            "symbol": symbol,
            "organ_name": organ_name,
            "exchange": exchange,
            "sector": sector_,
            "close": close,
            "volume": volume,
            "date": date_,
            "buy_score": buy_score,
            "buy_filter": bool(buy_filter),
            "buy": json.loads(buy_json) if buy_json else {},
            "sell_score": sell_score,
            "sell_filter": bool(sell_filter),
            "sell": json.loads(sell_json) if sell_json else {},
            "scanned_at": scanned_at,
        })
    return out


def get_rank_changes() -> dict:
    """Compare today's 'Suc manh CP' ranking against the most recent prior
    day's snapshot. Only symbols present in both days are ranked by movement
    (positive rank_change = moved up the leaderboard)."""
    conn = _db()
    dates = [r[0] for r in conn.execute(
        "SELECT DISTINCT scan_date FROM rank_snapshots ORDER BY scan_date DESC"
    ).fetchall()]
    if len(dates) < 2:
        conn.close()
        return {"available": False, "today_date": dates[0] if dates else None, "prior_date": None, "rows": []}

    today_date, prior_date = dates[0], dates[1]
    today_rows = {r[0]: (r[1], r[2]) for r in conn.execute(
        "SELECT symbol, rank, buy_score FROM rank_snapshots WHERE scan_date = ?", (today_date,)
    ).fetchall()}
    prior_rows = {r[0]: (r[1], r[2]) for r in conn.execute(
        "SELECT symbol, rank, buy_score FROM rank_snapshots WHERE scan_date = ?", (prior_date,)
    ).fetchall()}
    meta = {r[0]: (r[1], r[2]) for r in conn.execute("SELECT symbol, organ_name, sector FROM results").fetchall()}
    conn.close()

    out = []
    for symbol, (today_rank, today_score) in today_rows.items():
        if symbol not in prior_rows:
            continue
        prior_rank, prior_score = prior_rows[symbol]
        organ_name, sector = meta.get(symbol, (None, None))
        out.append({
            "symbol": symbol,
            "organ_name": organ_name,
            "sector": sector,
            "today_rank": today_rank,
            "prior_rank": prior_rank,
            "rank_change": prior_rank - today_rank,
            "today_score": today_score,
            "prior_score": prior_score,
        })
    out.sort(key=lambda r: r["rank_change"], reverse=True)
    return {"available": True, "today_date": today_date, "prior_date": prior_date, "rows": out}


def _snapshot_ranking(conn):
    today = datetime.now().strftime("%Y-%m-%d")
    rows = conn.execute(
        "SELECT symbol, buy_score FROM results WHERE liquid = 1 ORDER BY buy_score DESC, volume DESC"
    ).fetchall()
    conn.execute("DELETE FROM rank_snapshots WHERE scan_date = ?", (today,))
    conn.executemany(
        "INSERT INTO rank_snapshots (scan_date, symbol, rank, buy_score) VALUES (?,?,?,?)",
        [(today, symbol, i + 1, score) for i, (symbol, score) in enumerate(rows)],
    )
    conn.commit()


def _scan_one(row, conn_lock, conn):
    symbol = row["symbol"]
    df = data_source.get_history(symbol)
    index_df = data_source.get_index_history()
    result = scanner.analyze_symbol(symbol, df, index_df)
    if result is None:
        return
    with conn_lock:
        conn.execute(
            """INSERT INTO results
               (symbol, organ_name, exchange, sector, close, volume, date, liquid,
                buy_score, buy_filter, buy_json, sell_score, sell_filter, sell_json, scanned_at)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
               ON CONFLICT(symbol) DO UPDATE SET
                 organ_name=excluded.organ_name, exchange=excluded.exchange, sector=excluded.sector,
                 close=excluded.close, volume=excluded.volume, date=excluded.date, liquid=excluded.liquid,
                 buy_score=excluded.buy_score, buy_filter=excluded.buy_filter, buy_json=excluded.buy_json,
                 sell_score=excluded.sell_score, sell_filter=excluded.sell_filter, sell_json=excluded.sell_json,
                 scanned_at=excluded.scanned_at""",
            (
                symbol, row.get("organ_name"), row.get("exchange"), row.get("industry_name"),
                result["close"], result["volume"], result["date"], int(result["liquid"]),
                result["buy_score"], int(result["buy_filter"]), json.dumps(result["buy"]),
                result["sell_score"], int(result["sell_filter"]), json.dumps(result["sell"]),
                datetime.now().isoformat(timespec="seconds"),
            ),
        )
        conn.commit()


def _run(limit: int | None):
    try:
        # warm the index cache once up front so every worker reuses it
        data_source.get_index_history()

        universe = data_source.load_universe()
        rows = universe.to_dict("records")
        if limit:
            rows = rows[:limit]

        _rate_samples.clear()
        with _state_lock:
            _state.update(status="running", scanned=0, total=len(rows),
                           started_at=datetime.now().isoformat(timespec="seconds"),
                           updated_at=None, error=None, rate_per_min=None, eta_seconds=None)

        conn = _db()
        conn_lock = threading.Lock()

        with ThreadPoolExecutor(max_workers=WORKERS) as pool:
            futures = {pool.submit(_scan_one, row, conn_lock, conn): row["symbol"] for row in rows}
            for fut in as_completed(futures):
                try:
                    fut.result()
                except Exception as exc:
                    print(f"[scan_job] {futures[fut]} failed: {exc}")
                with _state_lock:
                    _state["scanned"] += 1
                    _state["updated_at"] = datetime.now().isoformat(timespec="seconds")
                    _record_rate_sample(_state["scanned"])
                    rate, eta = _current_rate_and_eta(_state["scanned"], _state["total"])
                    _state["rate_per_min"] = round(rate, 1) if rate else None
                    _state["eta_seconds"] = round(eta) if eta else None
        _snapshot_ranking(conn)
        conn.close()

        with _state_lock:
            _state["status"] = "idle"
            _state["rate_per_min"] = None
            _state["eta_seconds"] = None
    except Exception as exc:
        with _state_lock:
            _state["status"] = "error"
            _state["error"] = str(exc)


def start_scan(limit: int | None = None) -> bool:
    """Kick off a background scan. Returns False if one is already running."""
    with _state_lock:
        if _state["status"] == "running":
            return False
    thread = threading.Thread(target=_run, args=(limit,), daemon=True)
    thread.start()
    return True
