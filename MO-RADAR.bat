@echo off
chcp 65001 >nul
cd /d "%~dp0"
title KKINVEST - Radar dong tien (co lich su ca phien)

rem Vi sao phai mo radar o 127.0.0.1 chu khong phai kkinvest.vercel.app:
rem Chrome 138+ chan trang https goi vao dia chi noi bo (Local Network Access),
rem nen trang tren vercel KHONG lay duoc lich su phien. Mo tu chinh may thi hai
rem ben cung mot nguon goc, khong co gi de chan.

echo.
echo   Dang khoi dong may chu radar...
echo   Lan dau quet ca phien mat khoang 1-2 phut, sau do chi lay phan moi.
echo.

start "" http://127.0.0.1:8787/
node lich-su-dnse.js
pause
