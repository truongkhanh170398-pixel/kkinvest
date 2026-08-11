"""
DUCKMAN Score scanner -- FastAPI app.

Run with:  uvicorn app:app --reload
Then open: http://localhost:8000
"""
from __future__ import annotations

from pathlib import Path
from typing import Optional

from fastapi import FastAPI, Query
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.types import Scope

import scan_job

BASE_DIR = Path(__file__).parent
STATIC_DIR = BASE_DIR / "static"


class NoCacheStaticFiles(StaticFiles):
    """This app is under active iteration and single-user local -- the
    browser aggressively caching app.js/style.css between edits (so a
    feature looks "missing" until a hard-refresh) has bitten us more than
    once. There's no CDN/scale reason to allow caching here, so just don't."""

    async def get_response(self, path: str, scope: Scope):
        response = await super().get_response(path, scope)
        response.headers["Cache-Control"] = "no-store"
        return response


app = FastAPI(title="DUCKMAN Score Scanner")
app.mount("/static", NoCacheStaticFiles(directory=STATIC_DIR), name="static")


@app.get("/")
def index():
    return FileResponse(STATIC_DIR / "index.html", headers={"Cache-Control": "no-store"})


@app.get("/api/sectors")
def sectors():
    return {"sectors": scan_job.get_sectors()}


@app.get("/api/scan")
def scan(
    view: str = Query("buy", pattern="^(buy|sell|strength)$"),
    sector: Optional[str] = Query("all"),
):
    rows = scan_job.get_results(view, sector)
    return {"view": view, "sector": sector, "count": len(rows), "rows": rows}


@app.get("/api/scan/progress")
def progress():
    return scan_job.get_progress()


@app.get("/api/rank-changes")
def rank_changes():
    return scan_job.get_rank_changes()


@app.post("/api/rescan")
def rescan(limit: Optional[int] = Query(None, description="Cap the scan to the first N tickers (for quick tests)")):
    started = scan_job.start_scan(limit=limit)
    if not started:
        return JSONResponse({"ok": False, "message": "Đang quét dở, vui lòng đợi."}, status_code=409)
    return {"ok": True}
