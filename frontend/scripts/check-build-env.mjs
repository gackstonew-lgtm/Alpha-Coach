#!/usr/bin/env node
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const requiredPackages = [
  'typescript',
  'vite',
  '@vitejs/plugin-react'
];

const missing = [];

for (const pkg of requiredPackages) {
  try {
    require.resolve(pkg);
  } catch (err) {
    missing.push(pkg);
  }
}

// Also verify binary existence in node_modules/.bin
const projectRoot = path.resolve(__dirname, '..');
const binDir = path.join(projectRoot, 'node_modules', '.bin');
const tscBinName = process.platform === 'win32' ? 'tsc.cmd' : 'tsc';
const tscBinPath = path.join(binDir, tscBinName);
const tscUnixPath = path.join(binDir, 'tsc');

const hasTscBin = fs.existsSync(tscBinPath) || fs.existsSync(tscUnixPath);

if (missing.length > 0 || !hasTscBin) {
  console.error('\n' + '='.repeat(70));
  console.error('❌ BUILD ENVIRONMENT PREFLIGHT ERROR');
  console.error('='.repeat(70));
  if (missing.length > 0) {
    console.error(`Missing required build-time packages: ${missing.join(', ')}`);
  }
  if (!hasTscBin) {
    console.error(`Missing tsc executable in: ${binDir}`);
  }
  console.error('\nEnvironment Diagnostics:');
  console.error(`- NODE_ENV: ${process.env.NODE_ENV || '(unset)'}`);
  console.error(`- npm_config_omit: ${process.env.npm_config_omit || process.env.NPM_CONFIG_OMIT || '(unset)'}`);
  console.error(`- NPM_CONFIG_PRODUCTION: ${process.env.NPM_CONFIG_PRODUCTION || '(unset)'}`);
  console.error(`- Node version: ${process.version}`);
  console.error(`- Current directory: ${process.cwd()}`);
  console.error('\nRoot Cause:');
  console.error('In production environments (e.g., Vercel Production), npm ci defaults to');
  console.error('omitting devDependencies if NODE_ENV=production is set. Because build tools');
  console.error('like TypeScript and Vite reside in devDependencies, the build fails.');
  console.error('\nRemediation:');
  console.error('1. Ensure the install command is configured as: npm ci --include=dev');
  console.error('2. In Vercel Project Settings > General, ensure Install Command is:');
  console.error('   npm ci --include=dev (or uses vercel.json)');
  console.error('='.repeat(70) + '\n');
  process.exit(1);
}

console.log('✓ Build environment preflight check passed: all required devDependencies and binaries are present.');
process.exit(0);
