@echo off
title Trader's Edge - Automated MT5 Trading Journal & Performance OS
echo =========================================================================
echo    TRADER'S EDGE - AUTOMATED MT5 TRADING JOURNAL ^& PERFORMANCE OS
echo =========================================================================
echo.
echo [1/2] Starting Trader's Edge Backend API on http://localhost:4000...
start "Trader's Edge Backend" cmd /c "cd backend && npm start"

echo [2/2] Starting Trader's Edge Web Dashboard on http://localhost:5173...
start "Trader's Edge Frontend" cmd /c "cd frontend && npm run dev"

echo.
echo All Trader's Edge services initialized!
echo Open your browser at http://localhost:5173
echo.
pause
