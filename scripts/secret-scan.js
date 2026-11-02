#!/usr/bin/env node
/**
 * Repository Secret Scanner
 * Scans git tracked and staged files for accidental credential and secret leaks.
 * Run before every commit.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

// High-confidence secret patterns
const SECRET_PATTERNS = [
  { name: 'Stripe Live Secret Key', regex: /sk_live_[0-9a-zA-Z]{24,}/ },
  { name: 'Stripe Restricted Key', regex: /rk_live_[0-9a-zA-Z]{24,}/ },
  { name: 'Stripe Webhook Secret', regex: /whsec_[0-9a-zA-Z]{24,}/ },
  { name: 'AWS Access Key ID', regex: /AKIA[0-9A-Z]{16}/ },
  { name: 'Private Key Block', regex: /-----BEGIN (?:RSA |EC |OPENSSH |PGP |DSA )?PRIVATE KEY-----/ },
  { name: 'GitHub Personal Access Token', regex: /gh[pous]_[0-9a-zA-Z]{36}/ },
  { name: 'Slack Bot Token', regex: /xoxb-[0-9]{11,13}-[0-9]{11,13}-[a-zA-Z0-9]{24}/ },
  { name: 'Generic High-Entropy Secret in assignments', regex: /(?:api[_-]?key|secret|password|auth_token)\s*[:=]\s*['"][a-zA-Z0-9_\-]{32,}['"]/i }
];

// Ignored files and extensions
const IGNORE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.svg', '.webp', '.ico', '.mp4', '.sqlite', '.wasm', '.lock', '.exe', '.dll', '.zip', '.tar', '.gz'];
const IGNORED_PATHS = [
  '.env.example',
  'node_modules',
  '.git',
  'dist',
  'build',
  'api/app.bundle.js',
  'frontend/api/app.bundle.js',
  'backend/src/db/wasm.ts',
  'scripts/secret-scan.js'
];

function getTrackedAndStagedFiles() {
  try {
    const tracked = execSync('git ls-files', { cwd: ROOT_DIR, encoding: 'utf-8' })
      .split('\n')
      .map(f => f.trim())
      .filter(Boolean);
    const staged = execSync('git diff --name-only --cached', { cwd: ROOT_DIR, encoding: 'utf-8' })
      .split('\n')
      .map(f => f.trim())
      .filter(Boolean);
    const untracked = execSync('git ls-files --others --exclude-standard', { cwd: ROOT_DIR, encoding: 'utf-8' })
      .split('\n')
      .map(f => f.trim())
      .filter(Boolean);
    return Array.from(new Set([...tracked, ...staged, ...untracked]));
  } catch (err) {
    console.error('Failed to query git files:', err.message);
    return [];
  }
}

function scanFile(relPath) {
  const fullPath = path.join(ROOT_DIR, relPath);
  if (!fs.existsSync(fullPath)) return [];

  // Check ignore paths
  for (const ign of IGNORED_PATHS) {
    if (relPath === ign || relPath.startsWith(ign + '/') || relPath.startsWith(ign + '\\')) {
      return [];
    }
  }

  // Check extension
  const ext = path.extname(relPath).toLowerCase();
  if (IGNORE_EXTENSIONS.includes(ext)) {
    return [];
  }

  try {
    const stat = fs.statSync(fullPath);
    if (stat.size > 2 * 1024 * 1024) return []; // Skip files larger than 2MB

    const content = fs.readFileSync(fullPath, 'utf-8');
    const findings = [];

    // Check each pattern
    for (const { name, regex } of SECRET_PATTERNS) {
      const match = content.match(regex);
      if (match) {
        // Skip placeholders / templates
        const matchedStr = match[0];
        if (
          matchedStr.includes('your-') ||
          matchedStr.includes('your_') ||
          matchedStr.includes('placeholder') ||
          matchedStr.includes('example') ||
          matchedStr.includes('min-32-chars')
        ) {
          continue;
        }
        findings.push({ file: relPath, pattern: name, snippet: matchedStr.substring(0, 10) + '...' });
      }
    }

    return findings;
  } catch {
    return [];
  }
}

function runScan() {
  console.log('[SecretScan] Scanning repository files for potential secret leaks...');
  const files = getTrackedAndStagedFiles();
  let totalFindings = [];

  for (const file of files) {
    const findings = scanFile(file);
    if (findings.length > 0) {
      totalFindings.push(...findings);
    }
  }

  if (totalFindings.length > 0) {
    console.error(`[SecretScan] FAILED: Found ${totalFindings.length} potential secrets!`);
    totalFindings.forEach(f => {
      console.error(`  - ${f.file}: ${f.pattern} (${f.snippet})`);
    });
    process.exit(1);
  }

  console.log(`[SecretScan] PASSED: Scanned ${files.length} files. No secrets detected.`);
}

runScan();
