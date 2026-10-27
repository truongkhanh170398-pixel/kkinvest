@echo off
chcp 65001 >nul
cd /d "%~dp0"
title KKINVEST - Nap lich su lenh khop DNSE
node lich-su-dnse.js
pause
