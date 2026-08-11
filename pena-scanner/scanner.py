"""
DUCKMAN Score engine -- a pandas port of RS Duck Man.afl's "Duckman RS Scan".

The AFL script only implements the buy-side scan. The `sell` block below is
my own symmetric/bearish mirror of the same 10 criteria (documented per-field
below) so the "Diem BAN" tab has something principled to show -- it is NOT
from the original file, and the UI labels it as a derived/mirrored view.

Only the latest bar's daily/weekly/monthly state is needed (one scanner row
per ticker, "as of today"), so we compute full rolling series with pandas
(vectorized, cheap) and read off the last value of each -- equivalent to what
AmiBroker's TimeFrameExpand does when you only care about the most recent bar.
"""
from __future__ import annotations

import pandas as pd

MIN_DAILY_BARS = 60
MIN_WEEKLY_BARS = 6
MIN_MONTHLY_BARS = 7
ATH_LOOKBACK = 2500  # ~10 years of daily bars, matches the AFL's HHV(H,2500)

# Column order mirrors AddColumn() order in RS Duck Man.afl / the buy-side score.
BUY_CRITERIA = [
    ("is_ath", "All-Time High"),
    ("rs_new_high", "RS 52W High"),
    ("daily_ma_order", "Dly: MA 5>8>10>21"),
    ("weekly_outperform_drop", "Wkly: Drop < Market"),
    ("weekly_rs_divergence", "Wkly: Higher High vs Mkt Low"),
    ("weekly_5green", "Wkly: 5+ Green"),
    ("weekly_tight", "Wkly: 4w Tight"),
    ("monthly_bigmove", "Mthly: >50% Move"),
    ("monthly_ma_order", "Mthly: Short MA > Long MA"),
]
# Symmetric bearish mirror -- my extension, not in the source AFL.
SELL_CRITERIA = [
    ("is_atl", "All-Time Low"),
    ("rs_new_low", "RS 52W Low"),
    ("daily_ma_order_down", "Dly: MA 5<8<10<21"),
    ("weekly_underperform_drop", "Wkly: Drop > Market"),
    ("weekly_rs_divergence_down", "Wkly: Lower Low vs Mkt High"),
    ("weekly_5red", "Wkly: 5+ Red"),
    ("weekly_tight", "Wkly: 4w Tight"),
    ("monthly_bigdrop", "Mthly: >33% Drop"),
    ("monthly_ma_order_down", "Mthly: Short MA < Long MA"),
]


def _b(x) -> bool:
    return bool(x) if pd.notna(x) else False


def _last(series: pd.Series):
    try:
        return series.iloc[-1]
    except Exception:
        return None


def analyze_symbol(symbol: str, df: pd.DataFrame | None, index_df: pd.DataFrame | None) -> dict | None:
    """Return the latest DUCKMAN Score breakdown for one ticker, or None if
    there isn't enough overlapping price history to compute it yet."""
    if df is None or index_df is None or len(df) < MIN_DAILY_BARS or len(index_df) < MIN_DAILY_BARS:
        return None

    idx = index_df.rename(
        columns={"open": "open_idx", "high": "high_idx", "low": "low_idx", "close": "close_idx"}
    )[["time", "open_idx", "high_idx", "low_idx", "close_idx"]]
    m = pd.merge(df, idx, on="time", how="inner")
    if len(m) < MIN_DAILY_BARS:
        return None

    close, high, low, openp, vol = m["close"], m["high"], m["low"], m["open"], m["volume"]
    idx_c, idx_h, idx_l = m["close_idx"], m["high_idx"], m["low_idx"]

    # ---------------- daily ----------------
    rs_line = close / idx_c
    rs_new_high = rs_line >= rs_line.rolling(252, min_periods=1).max()
    rs_new_low = rs_line <= rs_line.rolling(252, min_periods=1).min()

    ath_window = min(len(m), ATH_LOOKBACK)
    is_ath = high >= high.rolling(ath_window, min_periods=1).max()
    is_atl = low <= low.rolling(ath_window, min_periods=1).min()

    ema5 = close.ewm(span=5, adjust=False).mean()
    ema8 = close.ewm(span=8, adjust=False).mean()
    sma10 = close.rolling(10).mean()
    ema21 = close.ewm(span=21, adjust=False).mean()
    mas_up = (ema5 > ema8) & (ema8 > sma10) & (sma10 > ema21)
    mas_down = (ema5 < ema8) & (ema8 < sma10) & (sma10 < ema21)

    upper_half = (close - low) / (high - low + 0.0001) > 0.5
    lower_half = (high - close) / (high - low + 0.0001) > 0.5
    no_gap_down = openp >= low.shift(1)
    no_gap_up = openp <= high.shift(1)
    support_candle = upper_half & no_gap_down
    resist_candle = lower_half & no_gap_up
    vol_ok = vol >= 50000

    # ---------------- weekly ----------------
    w = (
        m.set_index("time")
        .resample("W-FRI")
        .agg(
            open=("open", "first"), high=("high", "max"), low=("low", "min"), close=("close", "last"),
            open_idx=("open_idx", "first"), high_idx=("high_idx", "max"),
            low_idx=("low_idx", "min"), close_idx=("close_idx", "last"),
        )
        .dropna()
    )
    if len(w) < MIN_WEEKLY_BARS:
        return None

    w_C, w_H, w_L, w_O = w["close"], w["high"], w["low"], w["open"]
    w_IdxC, w_IdxH, w_IdxL = w["close_idx"], w["high_idx"], w["low_idx"]

    w_52h = w_H.rolling(52, min_periods=1).max()
    w_new52high = w_H >= w_52h
    w_52l = w_L.rolling(52, min_periods=1).min()
    w_new52low = w_L <= w_52l

    w_pct_off_high = (w_52h - w_C) / w_52h
    w_idx52h = w_IdxH.rolling(52, min_periods=1).max()
    w_idx_pct_off_high = (w_idx52h - w_IdxC) / w_idx52h
    w_outperform_drop = w_pct_off_high < w_idx_pct_off_high
    w_underperform_drop = w_pct_off_high > w_idx_pct_off_high

    w_green, w_red = w_C > w_O, w_C < w_O
    w_5green = w_green.rolling(5).sum() >= 5
    w_5red = w_red.rolling(5).sum() >= 5

    w_c4max, w_c4min = w_C.rolling(4).max(), w_C.rolling(4).min()
    w_tight = (w_c4max - w_c4min) / w_c4min < 0.05

    w_higher_high, w_lower_low = w_H > w_H.shift(1), w_L < w_L.shift(1)
    w_idx_lower_low, w_idx_higher_high = w_IdxL < w_IdxL.shift(1), w_IdxH > w_IdxH.shift(1)
    w_rs_div_up = w_higher_high & w_idx_lower_low
    w_rs_div_down = w_lower_low & w_idx_higher_high

    idx_ret = (w_IdxC - w_IdxC.shift(1)) / w_IdxC.shift(1)
    w_green_mkt_red = w_green & (idx_ret < -0.02)
    w_red_mkt_green = w_red & (idx_ret > 0.02)

    # ---------------- monthly ----------------
    mo = m.set_index("time").resample("ME").agg(close=("close", "last")).dropna()
    if len(mo) < MIN_MONTHLY_BARS:
        return None
    m_C = mo["close"]

    def _up(n):
        return (m_C / m_C.shift(n)) > 1.5

    def _down(n):
        return (m_C / m_C.shift(n)) < (1 / 1.5)  # symmetric mirror of the >50% gain rule

    m_bigmove = _up(1) | _up(2) | _up(3) | _up(6)
    m_bigdrop = _down(1) | _down(2) | _down(3) | _down(6)
    m_sma10, m_sma50 = m_C.rolling(10).mean(), m_C.rolling(50).mean()
    m_order_up, m_order_down = m_sma10 > m_sma50, m_sma10 < m_sma50

    buy = {
        "is_ath": _b(_last(is_ath)),
        "rs_new_high": _b(_last(rs_new_high)),
        "daily_ma_order": _b(_last(mas_up)),
        "weekly_outperform_drop": _b(_last(w_outperform_drop)),
        "weekly_rs_divergence": _b(_last(w_rs_div_up)),
        "weekly_5green": _b(_last(w_5green)),
        "weekly_tight": _b(_last(w_tight)),
        "monthly_bigmove": _b(_last(m_bigmove)),
        "monthly_ma_order": _b(_last(m_order_up)),
    }
    buy_score = sum(buy.values())
    new52high = _b(_last(w_new52high))
    support = _b(_last(support_candle))
    vol_ok_last = _b(_last(vol_ok))
    buy_filter = vol_ok_last and ((support and buy["daily_ma_order"]) or buy["is_ath"] or new52high)

    sell = {
        "is_atl": _b(_last(is_atl)),
        "rs_new_low": _b(_last(rs_new_low)),
        "daily_ma_order_down": _b(_last(mas_down)),
        "weekly_underperform_drop": _b(_last(w_underperform_drop)),
        "weekly_rs_divergence_down": _b(_last(w_rs_div_down)),
        "weekly_5red": _b(_last(w_5red)),
        "weekly_tight": _b(_last(w_tight)),
        "monthly_bigdrop": _b(_last(m_bigdrop)),
        "monthly_ma_order_down": _b(_last(m_order_down)),
    }
    sell_score = sum(sell.values())
    new52low = _b(_last(w_new52low))
    resist = _b(_last(resist_candle))
    sell_filter = vol_ok_last and ((resist and sell["daily_ma_order_down"]) or sell["is_atl"] or new52low)

    last_time = _last(m["time"])
    return {
        "symbol": symbol,
        "close": float(_last(close)),
        "volume": int(_last(vol)) if pd.notna(_last(vol)) else 0,
        "date": last_time.strftime("%Y-%m-%d") if last_time is not None else None,
        # AFL's Filter = Vol AND (...) bundles the liquidity floor into the
        # same gate as the buy conditions -- there's no version of this scan
        # that ranks illiquid tickers. "Suc manh CP" drops the buy/sell-
        # specific conditions but keeps this liquidity floor.
        "liquid": vol_ok_last,
        "buy": buy,
        "buy_score": buy_score,
        "buy_filter": bool(buy_filter),
        "sell": sell,
        "sell_score": sell_score,
        "sell_filter": bool(sell_filter),
    }
