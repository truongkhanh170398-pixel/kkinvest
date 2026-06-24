@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================================
echo   TRUNG TAM DINH GIA - Server cuc bo
echo   Dia chi:  http://localhost:8000/index.html
echo.
echo   - Trinh duyet se tu mo. Neu trang trang, doi 1-2 giay roi F5.
echo   - De TAT server: dong cua so nay (hoac Ctrl+C).
echo ============================================================
echo.
start "" "http://localhost:8000/index.html"
python -m http.server 8000
