#!/usr/bin/env python3
"""
scripts/apply_rebrand.py
Safely updates all user-facing product names to 'Arcade Fx' / 'ARCADE FX'.
Strictly preserves:
- localStorage keys (e.g. alpha_coach_session, alpha-coach-install-dismissed)
- API endpoint routes (/api/v1/mt5/...)
- Database table/column names
- Package / repo identifiers
"""

import os, re

USER_FACING_FILES = [
    'frontend/index.html',
    'frontend/vite.config.ts',
    'frontend/public/offline.html',
    'frontend/src/components/common/MetaHead.tsx',
    'frontend/src/components/layout/Navbar.tsx',
    'frontend/src/components/layout/InstallPrompt.tsx',
    'frontend/src/components/pwa/PwaInstallPrompt.tsx',
    'frontend/src/components/public/PublicNavbar.tsx',
    'frontend/src/components/public/PublicFooter.tsx',
    'frontend/src/data/faqData.ts',
    'frontend/src/pages/LandingPage.tsx',
    'frontend/src/pages/LoginPage.tsx',
    'frontend/src/pages/RegisterPage.tsx',
    'frontend/src/pages/PairDevicePage.tsx',
    'frontend/src/pages/AICoachPage.tsx',
    'frontend/src/pages/FAQPage.tsx',
    'frontend/src/pages/MethodologyPage.tsx',
    'frontend/src/pages/SecurityPage.tsx',
    'frontend/src/pages/TermsPage.tsx',
    'frontend/src/pages/PrivacyPolicyPage.tsx',
    'frontend/src/pages/CookiePolicyPage.tsx',
    'frontend/src/pages/DisclaimerPage.tsx',
    'frontend/src/pages/ThankYouPage.tsx',
    'frontend/src/pages/NotFoundPage.tsx',
    'frontend/src/pages/SettingsPage.tsx',
    'frontend/src/pages/BridgeAccountsPage.tsx',
    'frontend/src/services/forexKnowledge.ts',
    'backend/src/services/aiCoach.service.ts',
    'backend/src/services/ai.service.ts',
    'bridge/alpha_coach_bridge.py',
    'bridge/companion_controller.py',
    'README.md',
    'ARCHITECTURE.md',
    'API.md'
]

REPLACEMENTS = [
    (r"TRADER\'S EDGE", "ARCADE FX"),
    (r"Trader\'s Edge", "Arcade Fx"),
    (r"Trader\&apos\;s Edge", "Arcade Fx"),
    (r"Trader's Edge", "Arcade Fx"),
    (r"tradersedge", "arcadefx"),
    (r"meta-coach-og\.png", "arcade-fx-og.png"),
]

for file_rel in USER_FACING_FILES:
    if not os.path.exists(file_rel):
        print(f"Skipping missing file: {file_rel}")
        continue

    with open(file_rel, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content
    for pattern, repl in REPLACEMENTS:
        content = re.sub(pattern, repl, content)

    # Specific cleanups for AI coach and headers
    if 'aiCoach.service.ts' in file_rel or 'AICoachPage.tsx' in file_rel:
        content = re.sub(r'Alpha Coach', 'Arcade Fx', content)

    if content != original:
        with open(file_rel, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated: {file_rel}")
    else:
        print(f"No changes needed: {file_rel}")

print("Rebrand string replacement complete!")
