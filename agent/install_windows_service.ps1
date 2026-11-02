# PowerShell installer for Arcade Fx MT5 Bot Agent Windows Service / Scheduled Task
param (
    [string]$Action = "install" # install, uninstall, status
)

$TaskName = "ArcadeFx_MT5_Bot_Agent"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$PythonExe = (Get-Command python.exe -ErrorAction SilentlyContinue).Source

if (-not $PythonExe) {
    Write-Error "Python 3 was not found in PATH. Please install Python and check 'Add Python to PATH'."
    exit 1
}

$AgentScript = Join-Path $ScriptDir "mt5_bot_agent.py"

if ($Action -eq "install") {
    Write-Host "Registering $TaskName as a background service on logon..." -ForegroundColor Cyan

    $Trigger = New-ScheduledTaskTrigger -AtLogOn
    $ActionCmd = New-ScheduledTaskAction -Execute $PythonExe -Argument "`"$AgentScript`"" -WorkingDirectory $ScriptDir
    $Principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Highest
    $Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)

    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
    Register-ScheduledTask -TaskName $TaskName -Trigger $Trigger -Action $ActionCmd -Principal $Principal -Settings $Settings | Out-Null
    Start-ScheduledTask -TaskName $TaskName

    Write-Host "Successfully installed and started $TaskName." -ForegroundColor Green
    Write-Host "The agent runs strictly outbound to arcadefx.live with ZERO inbound listening ports." -ForegroundColor Green
}
elseif ($Action -eq "uninstall") {
    Write-Host "Stopping and removing $TaskName..." -ForegroundColor Yellow
    Stop-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
    Write-Host "$TaskName successfully removed." -ForegroundColor Green
}
elseif ($Action -eq "status") {
    Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue | Format-List
}
