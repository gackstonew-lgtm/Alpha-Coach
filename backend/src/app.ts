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

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000,
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api', apiLimiter);

// API Health
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    app: 'Alpha Coach Trading Performance OS Backend',
    version: '1.0.0',
    time: new Date().toISOString()
  });
});

// API v1 Endpoints
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/accounts', accountsRoutes);
app.use('/api/v1/mt5', mt5Routes);
app.use('/api/v1/trades', tradesRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/strategies', strategiesRoutes);
app.use('/api/v1/sessions', sessionsRoutes);
app.use('/api/v1/symbols', symbolsRoutes);
app.use('/api/v1/risk', riskRoutes);
app.use('/api/v1/reviews', reviewsRoutes);
app.use('/api/v1/voice', voiceRoutes);
app.use('/api/v1/gamification', gamificationRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/reports', reportsRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/notifications', notificationsRoutes);
app.use('/api/v1/economic', economicRoutes);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Alpha Coach API Error]:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    timestamp: new Date().toISOString()
  });
});

export { app };
export default app;
