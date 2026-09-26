import fs from 'fs';
import path from 'path';

export interface IDatabase {
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  get<T = any>(sql: string, params?: any[]): Promise<T | undefined>;
  run(sql: string, params?: any[]): Promise<{ changes: number; lastInsertRowid?: number | bigint }>;
  exec(sql: string): Promise<void>;
  close(): Promise<void>;
}

class SqlJsDatabaseWrapper implements IDatabase {
  private db: any;
  private filePath: string;
  private saveDebounceTimer: NodeJS.Timeout | null = null;

  constructor(db: any, filePath: string) {
    this.db = db;
    this.filePath = filePath;
  }

  private scheduleSave() {
    if (this.filePath === ':memory:') return;
    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
    }
    this.saveDebounceTimer = setTimeout(() => {
      try {
        const data = this.db.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(this.filePath, buffer);
      } catch (err) {
        console.error('[DB Save Error]:', err);
      }
    }, 100);
  }

  public flushSync() {
    if (this.filePath === ':memory:') return;
    try {
      const data = this.db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(this.filePath, buffer);
    } catch (err) {
      console.error('[DB Flush Error]:', err);
    }
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const stmt = this.db.prepare(sql);
    const rows: T[] = [];
    if (params.length > 0) {
      stmt.bind(params);
    }
    while (stmt.step()) {
      rows.push(stmt.getAsObject() as T);
    }
    stmt.free();
    return rows;
  }

  async get<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
    const rows = await this.query<T>(sql, params);
    return rows.length > 0 ? rows[0] : undefined;
  }

  async run(sql: string, params: any[] = []): Promise<{ changes: number; lastInsertRowid?: number | bigint }> {
    const stmt = this.db.prepare(sql);
    if (params.length > 0) {
      stmt.bind(params);
    }
    stmt.step();
    stmt.free();
    this.scheduleSave();
    const rowsModified = this.db.getRowsModified();
    return { changes: rowsModified };
  }

  async exec(sql: string): Promise<void> {
    this.db.exec(sql);
    this.scheduleSave();
  }

  async close(): Promise<void> {
    this.flushSync();
    this.db.close();
  }
}

class PgDatabaseWrapper implements IDatabase {
  private pool: any;

  constructor(pool: any) {
    this.pool = pool;
  }

  private transformSql(sql: string): string {
    let index = 1;
    let transformed = sql.replace(/\?/g, () => `$${index++}`);
    if (/INSERT\s+OR\s+IGNORE\s+INTO/i.test(transformed)) {
      transformed = transformed.replace(/INSERT\s+OR\s+IGNORE\s+INTO/gi, 'INSERT INTO');
      if (!/ON\s+CONFLICT/i.test(transformed)) {
        transformed += ' ON CONFLICT DO NOTHING';
      }
    }
    return transformed;
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const transformedSql = this.transformSql(sql);
    const res = await this.pool.query(transformedSql, params);
    return res.rows as T[];
  }

  async get<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
    const rows = await this.query<T>(sql, params);
    return rows.length > 0 ? rows[0] : undefined;
  }

  async run(sql: string, params: any[] = []): Promise<{ changes: number; lastInsertRowid?: number | bigint }> {
    const transformedSql = this.transformSql(sql);
    const res = await this.pool.query(transformedSql, params);
    return { changes: res.rowCount || 0 };
  }

  async exec(sql: string): Promise<void> {
    await this.pool.query(sql);
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

import { SQL_WASM_BASE64 } from './wasm';

let dbInstance: IDatabase | null = null;
let dbInstancePromise: Promise<IDatabase> | null = null;

export async function getDatabaseAsync(): Promise<IDatabase> {
  if (dbInstance) return dbInstance;
  if (dbInstancePromise) return dbInstancePromise;

  dbInstancePromise = (async () => {
    const isProd = process.env.NODE_ENV === 'production';
    const isTest = process.env.NODE_ENV === 'test';

    // In production or when DATABASE_URL is configured, connect to PostgreSQL / Supabase Postgres
    if (process.env.DATABASE_URL && !isTest) {
      try {
        const { Pool } = require('pg');
        const pool = new Pool({
          connectionString: process.env.DATABASE_URL,
          ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false }
        });
        // Test connection
        await pool.query('SELECT 1');
        dbInstance = new PgDatabaseWrapper(pool);
        console.log('[DB] Connected to persistent PostgreSQL database.');
        return dbInstance;
      } catch (err) {
        console.warn('[DB] PostgreSQL connection failed, falling back to SQLite engine:', err);
      }
    }

    // Fallback: Local/In-Memory SQLite engine via SQL.js with embedded WASM binary
    try {
      const initSqlJsModule = require('sql.js');
      const initSqlJs = typeof initSqlJsModule === 'function' ? initSqlJsModule : initSqlJsModule.default;
      const wasmBinary = Buffer.from(SQL_WASM_BASE64, 'base64');
      const SQL = await initSqlJs({ wasmBinary });
      
      let dbInstanceLocal: SqlJsDatabaseWrapper;
      if (isProd || process.env.VERCEL === '1') {
        const db = new SQL.Database();
        dbInstanceLocal = new SqlJsDatabaseWrapper(db, ':memory:');
        console.log('[DB] In-memory SQLite engine initialized successfully with embedded wasm.');
      } else {
        const dataDir = process.env.DATA_DIR || path.join(__dirname, '../../../data');
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
        }
        const dbPath = process.env.DB_PATH || path.join(dataDir, 'alphacoach.sqlite');
        let db: any;
        if (fs.existsSync(dbPath)) {
          const fileBuffer = fs.readFileSync(dbPath);
          db = new SQL.Database(fileBuffer);
        } else {
          db = new SQL.Database();
        }
        dbInstanceLocal = new SqlJsDatabaseWrapper(db, dbPath);
        console.log('[DB] Local SQLite engine initialized for non-production environment.');
      }

      dbInstance = dbInstanceLocal;
      return dbInstance;
    } catch (sqliteErr) {
      console.error('[DB FATAL] SQLite fallback unavailable:', sqliteErr);
      throw sqliteErr;
    }
  })();

  return dbInstancePromise;
}

export function getDatabase(): IDatabase {
  if (!dbInstance) {
    throw new Error('Database is unavailable. Please ensure database initialization has completed.');
  }
  return dbInstance;
}

import { SCHEMA_SQL } from './schema';

export async function initDatabase(): Promise<IDatabase | null> {
  try {
    const db = await getDatabaseAsync();
    if (!db) return null;
    await db.exec(SCHEMA_SQL);
    const safeMigrations = [
      'ALTER TABLE raw_orders ADD COLUMN external_id TEXT',
      'ALTER TABLE reconstructed_positions ADD COLUMN current_price REAL',
      'ALTER TABLE reconstructed_positions ADD COLUMN floating_profit REAL DEFAULT 0.0',
      'ALTER TABLE reconstructed_positions ADD COLUMN magic INTEGER DEFAULT 0',
      'ALTER TABLE reconstructed_positions ADD COLUMN comment TEXT',
      'ALTER TABLE reconstructed_positions ADD COLUMN external_id TEXT',
      'ALTER TABLE reconstructed_positions ADD COLUMN fee_total REAL DEFAULT 0.0',
      'ALTER TABLE reconstructed_positions ADD COLUMN is_hedged INTEGER DEFAULT 0'
    ];
    for (const sql of safeMigrations) {
      try {
        await db.exec(sql);
      } catch {
        // ignore if already exists
      }
    }
    await seedInitialData(db);
    return db;
  } catch (err) {
    console.warn('[DB Init Error]:', err);
    return null;
  }
}

async function seedInitialData(db: IDatabase) {
  const achievementCount = await db.get<{ count: number }>('SELECT COUNT(*) as count FROM achievements');
  if (!achievementCount || Number(achievementCount.count) === 0) {
    const initialAchievements = [
      { id: 'ach-1', code: 'FIRST_SYNC', title: 'Connected & Synced', description: 'Successfully synchronized your first MT5 trading account.', category: 'CONSISTENCY', xp: 50, icon: 'Zap' },
      { id: 'ach-2', code: 'JOURNAL_STREAK_7', title: '7-Day Discipline', description: 'Maintained a 7-day continuous trade journaling streak.', category: 'DISCIPLINE', xp: 150, icon: 'Flame' },
      { id: 'ach-3', code: 'REVIEW_25_LOSSES', title: 'Loss Master', description: 'Reviewed 25 losing trades to extract key lessons without revenge trading.', category: 'ANALYSIS', xp: 200, icon: 'ShieldCheck' },
      { id: 'ach-4', code: 'RULE_COMPLIANT_50', title: 'Risk Guardian', description: 'Completed 50 trades strictly within configured risk limits.', category: 'RISK_MANAGEMENT', xp: 250, icon: 'Award' },
      { id: 'ach-5', code: 'TRADES_100', title: 'Century Club', description: 'Analyzed over 100 reconstructed positions on Alpha Coach.', category: 'CONSISTENCY', xp: 300, icon: 'Trophy' }
    ];

    for (const ach of initialAchievements) {
      await db.run(
        `INSERT OR IGNORE INTO achievements (id, code, title, description, category, xp_reward, icon)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [ach.id, ach.code, ach.title, ach.description, ach.category, ach.xp, ach.icon]
      );
    }
  }

  const mistakeCount = await db.get<{ count: number }>('SELECT COUNT(*) as count FROM mistake_tags');
  if (!mistakeCount || Number(mistakeCount.count) === 0) {
    const initialMistakes = [
      { id: 'mst-1', name: 'FOMO Entry', category: 'PSYCHOLOGY', severity: 'HIGH', description: 'Entered out of fear of missing a sudden impulse candle without valid setup.' },
      { id: 'mst-2', name: 'Revenge Trading', category: 'PSYCHOLOGY', severity: 'HIGH', description: 'Took immediate subsequent trade to recover a prior loss.' },
      { id: 'mst-3', name: 'Moved Stop Loss', category: 'RISK', severity: 'HIGH', description: 'Widened or removed initial stop loss when trade moved against bias.' },
      { id: 'mst-4', name: 'Oversized Position', category: 'RISK', severity: 'HIGH', description: 'Violated maximum account risk limit for this execution.' },
      { id: 'mst-5', name: 'Early Exit / Cut Winner', category: 'EXECUTION', severity: 'MEDIUM', description: 'Closed profitable position prematurely due to fear before target.' },
      { id: 'mst-6', name: 'Impatience / Early Entry', category: 'EXECUTION', severity: 'MEDIUM', description: 'Jumped in before full confluence confirmation formed.' },
      { id: 'mst-7', name: 'High-Impact News Gambling', category: 'STRATEGY', severity: 'HIGH', description: 'Held or entered directly through high-volatility red-folder news release.' },
      { id: 'mst-8', name: 'Correct Setup - Valid Loss', category: 'STRATEGY', severity: 'LOW', description: 'Followed system rules completely; market delivered standard statistical loss.' }
    ];

    for (const mst of initialMistakes) {
      await db.run(
        `INSERT OR IGNORE INTO mistake_tags (id, user_id, name, category, severity, description)
         VALUES (?, 'SYSTEM', ?, ?, ?, ?)`,
        [mst.id, mst.name, mst.category, mst.severity, mst.description]
      );
    }
  }
}
