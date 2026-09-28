@echo off
title Meta Coach - Automated MT5 Trading Journal & Performance OS
echo =========================================================================
echo    META COACH - AUTOMATED MT5 TRADING JOURNAL ^& PERFORMANCE OS
echo =========================================================================
echo.
echo [1/2] Starting Meta Coach Backend API on http://localhost:4000...
start "Meta Coach Backend" cmd /c "cd backend && npm start"

echo [2/2] Starting Meta Coach Web Dashboard on http://localhost:5173...
start "Meta Coach Frontend" cmd /c "cd frontend && npm run dev"

echo.
echo All Meta Coach services initialized!
echo Open your browser at http://localhost:5173
echo.
pause
