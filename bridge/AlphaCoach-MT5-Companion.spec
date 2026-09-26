# -*- mode: python ; coding: utf-8 -*-


a = Analysis(
    ['C:/Users/Gackstone_Baraka/Downloads/Alpha Coach/bridge/alpha_coach_tray.py'],
    pathex=[],
    binaries=[],
    datas=[('C:/Users/Gackstone_Baraka/Downloads/Alpha Coach/bridge/mock_mt5_adapter.py', '.'), ('C:/Users/Gackstone_Baraka/Downloads/Alpha Coach/bridge/alpha_coach_bridge.py', '.'), ('C:/Users/Gackstone_Baraka/Downloads/Alpha Coach/bridge/companion_controller.py', '.'), ('C:/Users/Gackstone_Baraka/Downloads/Alpha Coach/bridge/companion_logger.py', '.')],
    hiddenimports=['requests', 'pystray', 'PIL', 'MetaTrader5', 'colorama', 'tkinter', 'tkinter.ttk', 'tkinter.messagebox'],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='AlphaCoach-MT5-Companion',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
