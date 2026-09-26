; =============================================================================
; Alpha Coach MT5 Bridge - Inno Setup Script
; Generates standard Windows installer with Desktop & Startup shortcuts
; =============================================================================

#define MyAppName "Alpha Coach MT5 Bridge"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "Alpha Coach OS"
#define MyAppURL "https://alpha-coach-pi.vercel.app"
#define MyAppExeName "AlphaCoachMT5Bridge.exe"

[Setup]
AppId={{D38F8B88-3D79-4B56-A839-813CFD9183AA}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\Alpha Coach\MT5 Bridge
DisableProgramGroupPage=yes
OutputDir=..\dist\installer
OutputBaseFilename=AlphaCoachMT5Bridge-Setup
Compression=lzma
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=lowest

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"
Name: "startmenu"; Description: "Create Start Menu shortcut"; GroupDescription: "{cm:AdditionalIcons}"
Name: "autostart"; Description: "Start Alpha Coach Bridge automatically when Windows starts"; GroupDescription: "Automation:"

[Files]
Source: "..\dist\{#MyAppExeName}"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{autoprograms}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: startmenu
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon
Name: "{userstartup}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: autostart

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent
