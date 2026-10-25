/**
 * scripts/import_forex_history.ts
 *
 * Safe offline utility for importing and validating free historical forex CSV data
 * (such as HistData or MetaTrader exported bars).
 *
 * Supported CSV Formats:
 *  1. HistData format: `YYYY.MM.DD HH:MM:SS;Open;High;Low;Close;Volume`
 *  2. Generic standard CSV: `timestamp,open,high,low,close,volume` (comma or semicolon)
 *  3. MT5 Export CSV: `<DATE>\t<TIME>\t<OPEN>\t<HIGH>\t<LOW>\t<CLOSE>\t<TICKVOL>`
 *
 * Usage:
 *  npx ts-node scripts/import_forex_history.ts --file=./data/EURUSD_M15.csv --symbol=EURUSD --timeframe=M15
 */

import * as fs from 'fs';
import * as path from 'path';

export interface ParsedCandle {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export function parseForexCsv(csvContent: string): ParsedCandle[] {
  const lines = csvContent.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) return [];

  const candles: ParsedCandle[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    // Skip potential header rows
    if (i === 0 && (rawLine.toLowerCase().includes('open') || rawLine.toLowerCase().includes('date'))) {
      continue;
    }

    // Determine separator: semicolon, comma, or tab
    let parts: string[];
    if (rawLine.includes(';')) {
      parts = rawLine.split(';').map(p => p.trim());
    } else if (rawLine.includes('\t')) {
      parts = rawLine.split('\t').map(p => p.trim());
    } else {
      parts = rawLine.split(',').map(p => p.trim());
    }

    if (parts.length < 5) continue;

    let timestamp: string;
    let openStr: string;
    let highStr: string;
    let lowStr: string;
    let closeStr: string;
    let volStr = '0';

    if (parts.length >= 6) {
      // Could be [Date, Time, Open, High, Low, Close, Volume] or [DateTime, Open, High, Low, Close, Volume]
      if (parts[0].includes(' ') || parts[0].includes('T')) {
        timestamp = normalizeDate(parts[0]);
        openStr = parts[1];
        highStr = parts[2];
        lowStr = parts[3];
        closeStr = parts[4];
        volStr = parts[5];
      } else if (parts[1].includes(':')) {
        timestamp = normalizeDate(`${parts[0]} ${parts[1]}`);
        openStr = parts[2];
        highStr = parts[3];
        lowStr = parts[4];
        closeStr = parts[5];
        volStr = parts[6] || '0';
      } else {
        timestamp = normalizeDate(parts[0]);
        openStr = parts[1];
        highStr = parts[2];
        lowStr = parts[3];
        closeStr = parts[4];
        volStr = parts[5];
      }
    } else {
      timestamp = normalizeDate(parts[0]);
      openStr = parts[1];
      highStr = parts[2];
      lowStr = parts[3];
      closeStr = parts[4];
    }

    const open = parseFloat(openStr);
    const high = parseFloat(highStr);
    const low = parseFloat(lowStr);
    const close = parseFloat(closeStr);
    const volume = parseFloat(volStr) || 0;

    if (!isNaN(open) && !isNaN(high) && !isNaN(low) && !isNaN(close) && !isNaN(new Date(timestamp).getTime())) {
      candles.push({
        timestamp,
        open,
        high: Math.max(open, high, low, close),
        low: Math.min(open, high, low, close),
        close,
        volume
      });
    }
  }

  // Deduplicate and sort chronologically ascending
  const uniqueMap = new Map<string, ParsedCandle>();
  for (const c of candles) {
    uniqueMap.set(c.timestamp, c);
  }

  const sorted = Array.from(uniqueMap.values()).sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return sorted;
}

function normalizeDate(raw: string): string {
  // Format: "YYYY.MM.DD HH:MM:SS" -> "YYYY-MM-DDTHH:MM:SS.000Z"
  const cleaned = raw.replace(/\./g, '-').replace(' ', 'T');
  const d = new Date(cleaned.endsWith('Z') ? cleaned : cleaned + 'Z');
  if (isNaN(d.getTime())) {
    return new Date(raw).toISOString();
  }
  return d.toISOString();
}

async function main() {
  const args = process.argv.slice(2);
  const fileArg = args.find(a => a.startsWith('--file='));
  const symbolArg = args.find(a => a.startsWith('--symbol='));
  const tfArg = args.find(a => a.startsWith('--timeframe='));

  if (!fileArg) {
    console.log('Alpha Coach Forex History Importer');
    console.log('Usage: npx ts-node scripts/import_forex_history.ts --file=<path.csv> [--symbol=EURUSD] [--timeframe=M15]');
    return;
  }

  const filePath = path.resolve(fileArg.split('=')[1]);
  const symbol = symbolArg ? symbolArg.split('=')[1].toUpperCase() : 'EURUSD';
  const timeframe = tfArg ? tfArg.split('=')[1].toUpperCase() : 'M15';

  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found at ${filePath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const parsed = parseForexCsv(content);

  console.log(`Successfully parsed ${parsed.length} candles for ${symbol} (${timeframe}).`);
  if (parsed.length > 0) {
    console.log(`Range: from ${parsed[0].timestamp} to ${parsed[parsed.length - 1].timestamp}`);
    console.log(`Sample first candle:`, parsed[0]);
    console.log(`Sample last candle:`, parsed[parsed.length - 1]);
  }
}

if (require.main === module) {
  main().catch(console.error);
}
