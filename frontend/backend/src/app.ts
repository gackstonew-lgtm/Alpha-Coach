import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

// Route Imports
import authRoutes from './routes/auth.routes';
import accountsRoutes from './routes/accounts.routes';
import mt5Routes from './routes/mt5.routes';
import tradesRoutes from './routes/trades.routes';
import analyticsRoutes from './routes/analytics.routes';
import strategiesRoutes from './routes/strategies.routes';
import sessionsRoutes from './routes/sessions.routes';
import symbolsRoutes from './routes/symbols.routes';
import riskRoutes from './routes/risk.routes';
import reviewsRoutes from './routes/reviews.routes';
import voiceRoutes from './routes/voice.routes';
import gamificationRoutes from './routes/gamification.routes';
import aiRoutes from './routes/ai.routes';
import reportsRoutes from './routes/reports.routes';
import adminRoutes from './routes/admin.routes';
import notificationsRoutes from './routes/notifications.routes';
import economicRoutes from './routes/economic.routes';

const app = express();

// Security & Parsing Middlewares
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// Dynamic CORS configuration for production and local development
const allowedOrigins = [
  'https://alpha-coach-pi.vercel.app',
  'https://alpha-coach.vercel.app',
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173'
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, MT5 Bridge desktop app)
    if (!origin) return callback(null, true);
    if (
      process.env.NODE_ENV !== 'production' ||
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app')
    ) {
      return callback(null, true);
    }
    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-bridge-token', 'x-device-name']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.use(morgan('dev'));
}

import { getDatabaseAsync, initDatabase } from './db/db';

// Vercel path restoration middleware
app.use((req, res, next) => {
  const matchedPath = req.headers['x-matched-path'] || req.headers['x-vercel-matched-path'];
  if (matchedPath && typeof matchedPath === 'string' && matchedPath.startsWith('/api')) {
    req.url = matchedPath;
  }
  next();
});

// Lazy DB Init middleware
let dbInitialized = false;
let dbInitPromise: Promise<any> | null = null;
app.use(async (req, res, next) => {
  if (!dbInitialized) {
    if (!dbInitPromise) {
      dbInitPromise = initDatabase().catch(err => {
        console.error('[DB Init Middleware Error]:', err);
      });
    }
    try {
      await dbInitPromise;
      dbInitialized = true;
    } catch {
      // Allow request to proceed so health checks can report DEGRADED and routes report error
    }
  }
  next();
});

// Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000,
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api', apiLimiter);

// API Health (Phase 6 Production Health Contract)
app.get(['/api/health', '/health'], async (req, res) => {
  let dbStatus = 'UNAVAILABLE';
  try {
    const db = await getDatabaseAsync();
    if (db) {
      await db.query('SELECT 1');
      dbStatus = 'CONNECTED';
    } else {
      dbStatus = 'DEGRADED';
    }
  } catch (err) {
    dbStatus = 'DEGRADED';
  }

  res.status(200).json({
    success: true,
    status: dbStatus === 'CONNECTED' ? 'ONLINE' : 'DEGRADED',
    service: 'Alpha Coach API',
    version: '1.0.4',
    environment: process.env.NODE_ENV || 'production',
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// API v1 Endpoints (Dual-mounted for /api/v1 and /v1 to guarantee serverless route compatibility)
const routePairs = [
  ['/auth', authRoutes],
  ['/accounts', accountsRoutes],
  ['/mt5', mt5Routes],
  ['/trades', tradesRoutes],
  ['/analytics', analyticsRoutes],
  ['/strategies', strategiesRoutes],
  ['/sessions', sessionsRoutes],
  ['/symbols', symbolsRoutes],
  ['/risk', riskRoutes],
  ['/reviews', reviewsRoutes],
  ['/voice', voiceRoutes],
  ['/gamification', gamificationRoutes],
  ['/ai', aiRoutes],
  ['/reports', reportsRoutes],
  ['/admin', adminRoutes],
  ['/notifications', notificationsRoutes],
  ['/economic', economicRoutes]
] as const;

routePairs.forEach(([prefix, router]) => {
  app.use(`/api/v1${prefix}`, router);
  app.use(`/v1${prefix}`, router);
});

// 404 Catch-All (Always return JSON, NEVER HTML)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `API route not found: ${req.method} ${req.originalUrl || req.url}`
    },
    timestamp: new Date().toISOString()
  });
});

// Global Error Handler (Standardized Phase 16 JSON)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Alpha Coach API Error]:', err);
  res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'Internal Server Error'
    },
    timestamp: new Date().toISOString()
  });
});

export { app };
export default app;
