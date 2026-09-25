@echo off
title Alpha Coach - Automated MT5 Trading Journal & Performance OS
echo =========================================================================
echo    ALPHA COACH - AUTOMATED MT5 TRADING JOURNAL ^& PERFORMANCE OS
echo =========================================================================
echo.
echo [1/2] Starting Alpha Coach Backend API on http://localhost:4000...
start "Alpha Coach Backend" cmd /c "cd backend && npm start"

echo [2/2] Starting Alpha Coach Web Dashboard on http://localhost:5173...
start "Alpha Coach Frontend" cmd /c "cd frontend && npm run dev"

echo.
echo All Alpha Coach services initialized!
echo Open your browser at http://localhost:5173
echo.
pause
