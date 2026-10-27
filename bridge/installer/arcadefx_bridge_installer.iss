; =============================================================================
; ArcadeFX MT5 Bridge - Inno Setup Script
; Standard Windows Per-User Installer with Desktop & Start Menu Shortcuts,
; Add/Remove Programs integration, and Auto-Launch
; =============================================================================

#define MyAppName "ArcadeFX MT5 Bridge"
#define MyAppVersion "1.0.6"
#define MyAppPublisher "ArcadeFX"
#define MyAppURL "https://www.arcadefx.live"
#define MyAppExeName "ArcadeFX-MT5-Bridge.exe"

[Setup]
AppId={{E57D3C89-6F12-4C67-B912-924DDE8294BB}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppName} {#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\ArcadeFX\MT5 Bridge
DisableProgramGroupPage=yes
OutputDir=..\dist
OutputBaseFilename=ArcadeFX-MT5-Bridge-Setup
SetupIconFile=..\app_icon.ico
UninstallDisplayIcon={app}\{#MyAppExeName}
UninstallDisplayName={#MyAppName}
Compression=lzma2/max
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=commandline
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
MinVersion=10.0.17763
AppMutex=ArcadeFX_MT5_Bridge_Singleton_Mutex
#ifdef SignUninstaller
SignedUninstaller=yes
#else
SignedUninstaller=no
#endif
VersionInfoVersion={#MyAppVersion}.0
VersionInfoCompany={#MyAppPublisher}
VersionInfoDescription={#MyAppName} Setup
VersionInfoCopyright=Copyright (C) 2026 ArcadeFX
VersionInfoProductName={#MyAppName}
VersionInfoProductVersion={#MyAppVersion}
CloseApplications=yes
CloseApplicationsFilter=*{#MyAppExeName}*

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"
Name: "startmenu"; Description: "Create Start Menu shortcut"; GroupDescription: "{cm:AdditionalIcons}"
Name: "autostart"; Description: "Start ArcadeFX MT5 Bridge automatically on Windows logon"; GroupDescription: "Automation:"

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
; Clean up app directory but do NOT delete user data in %APPDATA%\ArcadeFX or logs in %LOCALAPPDATA%\ArcadeFX
Type: files; Name: "{app}\app_icon.ico"
