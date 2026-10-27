/**
 * Single source of truth for ArcadeFX MT5 Bridge desktop application releases and downloads.
 */
export const BRIDGE_DOWNLOAD_CONFIG = {
  appName: 'ArcadeFX MT5 Bridge',
  version: '1.0.6',
  platform: 'Windows 10 / 11 (64-bit)',
  installerFilename: 'ArcadeFX-MT5-Bridge-Setup.exe',
  portableFilename: 'ArcadeFX-MT5-Bridge.exe',
  publisher: 'ArcadeFX',
  fileSize: '35.6 MB',
  sha256: 'e056e77fb9911fd7c67cc49b3e32590cd8ec1eadec6e5f24933df17f7cfce403',
  // Canonical GitHub latest release direct download URL
  primaryDownloadUrl: 'https://github.com/gackstonew-lgtm/Alpha-Coach/releases/latest/download/ArcadeFX-MT5-Bridge-Setup.exe',
  // Specific tag fallback URL
  tagFallbackUrl: 'https://github.com/gackstonew-lgtm/Alpha-Coach/releases/download/v1.0.6/ArcadeFX-MT5-Bridge-Setup.exe',
  // Legacy alias fallback URL for backward compatibility
  legacyDownloadUrl: 'https://github.com/gackstonew-lgtm/Alpha-Coach/releases/latest/download/AlphaCoach-MT5-Companion-Setup.exe',
  // Direct backend redirect URL
  backendDownloadUrl: '/api/v1/bridge/download',
  // Repository releases page
  releasesPageUrl: 'https://github.com/gackstonew-lgtm/Alpha-Coach/releases',
};
