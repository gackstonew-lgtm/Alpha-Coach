; =============================================================================
; Alpha Coach MT5 Companion - Inno Setup Script
; Standard Windows Per-User Installer with Desktop & Start Menu Shortcuts,
; Add/Remove Programs integration, and Auto-Launch
; =============================================================================

#define MyAppName "Alpha Coach MT5 Companion"
#define MyAppVersion "1.0.5"
#define MyAppPublisher "Alpha Coach"
#define MyAppURL "https://alpha-coach-nine.vercel.app"
#define MyAppExeName "AlphaCoach-MT5-Companion.exe"

[Setup]
AppId={{D38F8B88-3D79-4B56-A839-813CFD9183AA}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppName} {#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\Alpha Coach\MT5 Companion
DisableProgramGroupPage=yes
OutputDir=..\dist
OutputBaseFilename=AlphaCoach-MT5-Companion-Setup
SetupIconFile=..\app_icon.ico
UninstallDisplayIcon={app}\{#MyAppExeName}
UninstallDisplayName={#MyAppName}
Compression=lzma2/max
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=commandline
VersionInfoVersion={#MyAppVersion}.0
VersionInfoCompany={#MyAppPublisher}
VersionInfoDescription={#MyAppName} Setup
VersionInfoCopyright=Copyright (C) 2026 Alpha Coach
VersionInfoProductName={#MyAppName}
VersionInfoProductVersion={#MyAppVersion}
CloseApplications=yes
CloseApplicationsFilter=*{#MyAppExeName}*

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"
Name: "startmenu"; Description: "Create Start Menu shortcut"; GroupDescription: "{cm:AdditionalIcons}"
Name: "autostart"; Description: "Start Alpha Coach MT5 Companion automatically on Windows logon"; GroupDescription: "Automation:"

[Files]
Source: "..\dist\{#MyAppExeName}"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\app_icon.ico"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{autoprograms}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\app_icon.ico"; Tasks: startmenu
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\app_icon.ico"; Tasks: desktopicon
Name: "{userstartup}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\app_icon.ico"; Tasks: autostart

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent

[UninstallDelete]
; Clean up app directory but do NOT delete user data in %APPDATA%\AlphaCoach or logs in %LOCALAPPDATA%\AlphaCoach
Type: files; Name: "{app}\app_icon.ico"
