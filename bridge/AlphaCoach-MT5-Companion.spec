# -*- mode: python ; coding: utf-8 -*-
import os
from PyInstaller.utils.hooks import collect_all

SPECPATH = os.path.dirname(os.path.abspath(SPEC))

datas = [
    (os.path.join(SPECPATH, 'mock_mt5_adapter.py'), '.'),
    (os.path.join(SPECPATH, 'alpha_coach_bridge.py'), '.'),
    (os.path.join(SPECPATH, 'companion_controller.py'), '.'),
    (os.path.join(SPECPATH, 'companion_logger.py'), '.')
]

icon_path = os.path.join(SPECPATH, 'app_icon.ico')
if os.path.exists(icon_path):
    datas.append((icon_path, '.'))

binaries = []
hiddenimports = [
    'requests',
    'pystray',
    'PIL',
    'MetaTrader5',
    'colorama',
    'tkinter',
    'tkinter.ttk',
    'tkinter.messagebox',
    'tkinter.filedialog'
]

for mod in ['MetaTrader5', 'pystray', 'PIL', 'colorama']:
    tmp_ret = collect_all(mod)
    datas += tmp_ret[0]
    binaries += tmp_ret[1]
    hiddenimports += tmp_ret[2]

a = Analysis(
    [os.path.join(SPECPATH, 'alpha_coach_tray.py')],
    pathex=[SPECPATH],
    binaries=binaries,
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

version_path = os.path.join(SPECPATH, 'file_version_info.txt') if os.path.exists(os.path.join(SPECPATH, 'file_version_info.txt')) else None

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
    upx=False,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=icon_path if os.path.exists(icon_path) else None,
    version=version_path,
)
