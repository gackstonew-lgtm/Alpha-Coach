@echo off
title Alpha Coach MT5 Terminal Bridge
echo =========================================================================
echo    ALPHA COACH - LOCAL MT5 DESKTOP TERMINAL SYNCHRONIZATION BRIDGE
echo =========================================================================
echo.
echo Launching Interactive MT5 Bridge CLI...
where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    python bridge\bridge_cli.py
) else (
    py bridge\bridge_cli.py
)
pause
