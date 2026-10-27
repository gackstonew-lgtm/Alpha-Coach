/**
 * Single source of truth for ArcadeFX MT5 Bridge desktop application releases and downloads.
 */
export const BRIDGE_DOWNLOAD_CONFIG = {
  appName: 'ArcadeFX MT5 Bridge',
  version: '1.0.6',
  platform: 'Windows 10 / 11 (64-bit)',
  installerFilename: 'ArcadeFX-MT5-Bridge-Setup.exe',
  portableFilename: 'ArcadeFX-MT5-Bridge.exe',
  // Canonical GitHub latest release direct download URL
  primaryDownloadUrl: 'https://github.com/gackstonew-lgtm/Alpha-Coach/releases/latest/download/ArcadeFX-MT5-Bridge-Setup.exe',
  // Specific tag fallback URL
  tagFallbackUrl: 'https://github.com/gackstonew-lgtm/Alpha-Coach/releases/download/v1.0.6/ArcadeFX-MT5-Bridge-Setup.exe',
  // Legacy alias fallback URL for backward compatibility
  legacyDownloadUrl: 'https://github.com/gackstonew-lgtm/Alpha-Coach/releases/latest/download/AlphaCoach-MT5-Companion-Setup.exe',
  // Repository releases page
  releasesPageUrl: 'https://github.com/gackstonew-lgtm/Alpha-Coach/releases',
};
