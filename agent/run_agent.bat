@echo off
setlocal
title Arcade Fx - MT5 Bot Agent Runner
cd /d "%~dp0"

echo ========================================================
echo   ARCADE FX - MT5 BOT AGENT (OUTBOUND-ONLY ENGINE)
echo ========================================================
echo   Zero-password architecture. Runs next to local MT5.
echo   Cloud commands are strictly bounded by local_limits.json.
echo ========================================================
echo.

python mt5_bot_agent.py %*

if %ERRORLEVEL% neq 0 (
    echo.
    echo Agent stopped with error code %ERRORLEVEL%.
    pause
)
