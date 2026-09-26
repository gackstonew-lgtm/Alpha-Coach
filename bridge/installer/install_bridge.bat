@echo off
title Alpha Coach MT5 Bridge - Setup
echo =============================================================================
echo             Alpha Coach - MT5 Local Bridge Windows Setup
echo =============================================================================
echo.

set TARGET_DIR=%LOCALAPPDATA%\AlphaCoach\Bridge
mkdir "%TARGET_DIR%" 2>nul

echo [1/3] Copying application files to %TARGET_DIR%...
copy /Y "%~dp0..\alpha_coach_bridge.py" "%TARGET_DIR%\" >nul
copy /Y "%~dp0..\alpha_coach_tray.py" "%TARGET_DIR%\" >nul
copy /Y "%~dp0..\mock_mt5_adapter.py" "%TARGET_DIR%\" >nul

echo [2/3] Installing Python dependencies if required...
python -m pip install requests MetaTrader5 pystray pillow colorama --quiet 2>nul

echo [3/3] Creating Desktop and Startup Shortcuts...
set SCRIPT="%TEMP%\create_shortcut.vbs"
echo Set oWS = WScript.CreateObject("WScript.Shell") > %SCRIPT%
echo sLinkFile = oWS.ExpandEnvironmentStrings("%%USERPROFILE%%\Desktop\Alpha Coach MT5 Bridge.lnk") >> %SCRIPT%
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> %SCRIPT%
echo oLink.TargetPath = "pythonw.exe" >> %SCRIPT%
echo oLink.Arguments = """" ^& oWS.ExpandEnvironmentStrings("%%LOCALAPPDATA%%\AlphaCoach\Bridge\alpha_coach_tray.py") ^& """" >> %SCRIPT%
echo oLink.WorkingDirectory = oWS.ExpandEnvironmentStrings("%%LOCALAPPDATA%%\AlphaCoach\Bridge") >> %SCRIPT%
echo oLink.Description = "Alpha Coach MT5 Background Bridge" >> %SCRIPT%
echo oLink.Save >> %SCRIPT%
cscript /nologo %SCRIPT%
del %SCRIPT%

echo.
echo =============================================================================
echo  Setup Complete! Launching Alpha Coach MT5 Bridge...
echo =============================================================================
start pythonw "%TARGET_DIR%\alpha_coach_tray.py"
exit /b 0
