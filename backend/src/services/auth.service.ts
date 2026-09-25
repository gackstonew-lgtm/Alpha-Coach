import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../db/db';
import { User, TraderProgression } from '../models/types';

const JWT_SECRET = process.env.JWT_SECRET || 'alpha-coach-super-secure-production-secret-key-2026';

export class AuthService {
  public static async register(params: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    timezone?: string;
    currency?: string;
  }): Promise<{ user: Omit<User, 'password_hash'>; token: string }> {
    const db = getDatabase();
    const existing = await db.get<User>('SELECT id FROM users WHERE email = ?', [params.email.toLowerCase().trim()]);
    if (existing) {
      throw new Error('User with this email already exists.');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(params.password, salt);
    const userId = uuidv4();
    const timezone = params.timezone || 'UTC';
    const currency = params.currency || 'USD';

    await db.run(
      `INSERT INTO users (id, email, password_hash, first_name, last_name, timezone, currency, subscription_tier, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'PRO', 1)`,
      [userId, params.email.toLowerCase().trim(), passwordHash, params.firstName, params.lastName, timezone, currency]
    );

    // Create user profile
    await db.run(
      `INSERT INTO user_profiles (id, user_id, bio, favorite_pairs, preferred_sessions, max_daily_risk_pct)
       VALUES (?, ?, 'Disciplined Price Action Trader', 'XAUUSD,EURUSD,BTCUSD,NAS100', 'London,New York', 2.0)`,
      [uuidv4(), userId]
    );

    // Create default progression
    await db.run(
      `INSERT INTO trader_progression (id, user_id, current_xp, current_level, current_streak_days, longest_streak_days, total_trades_reviewed, rule_compliance_rate)
       VALUES (?, ?, 100, 1, 1, 1, 0, 100.0)`,
      [uuidv4(), userId]
    );

    // Create default strategies for user
    const defaultStrategies = [
      { name: 'Liquidity Sweep + MSS + FVG', desc: 'ICT/SMC confluence: Sweep of Asian/Session high-low, Market Structure Shift, entry at Fair Value Gap', color: '#3b82f6' },
      { name: 'Order Block Retest', desc: 'Entry at unmitigated institutional order block in line with higher timeframe trend', color: '#10b981' },
      { name: 'Break & Retest', desc: 'Key support/resistance breakout with confirmed retest and rejection wick', color: '#f59e0b' },
      { name: 'London Open Breakout', desc: 'Expansion from Asian consolidation during early Frankfurt/London open', color: '#8b5cf6' }
    ];

    for (const strat of defaultStrategies) {
      await db.run(
        `INSERT INTO strategies (id, user_id, name, description, color_tag) VALUES (?, ?, ?, ?, ?)`,
        [uuidv4(), userId, strat.name, strat.desc, strat.color]
      );
    }

    const createdUser = (await db.get<User>('SELECT * FROM users WHERE id = ?', [userId]))!;
    const token = this.generateToken(createdUser);

    const { password_hash, ...safeUser } = createdUser;
    return { user: safeUser, token };
  }

  public static async login(email: string, password: string): Promise<{ user: Omit<User, 'password_hash'>; token: string }> {
    const db = getDatabase();
    const user = await db.get<User>('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (!user) {
      throw new Error('Invalid email or password.');
    }

    if (!user.is_active) {
      throw new Error('Account is inactive. Please contact support.');
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new Error('Invalid email or password.');
    }

    const token = this.generateToken(user);
    const { password_hash, ...safeUser } = user;
    return { user: safeUser, token };
  }

  public static generateToken(user: User): string {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        tier: user.subscription_tier
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );
  }

  public static verifyToken(token: string): any {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch {
      return null;
    }
  }

  public static async getUserById(userId: string): Promise<Omit<User, 'password_hash'> | null> {
    const db = getDatabase();
    const user = await db.get<User>('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) return null;
    const { password_hash, ...safeUser } = user;
    return safeUser;
  }
}
