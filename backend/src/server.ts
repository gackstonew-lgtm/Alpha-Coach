import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { initDatabase } from './db/db';

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
const server = http.createServer(app);

const PORT = process.env.PORT || 4000;

// Security & Parsing Middlewares
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-bridge-token']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));

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

async function bootstrap() {
  try {
    await initDatabase();
    console.log('[Alpha Coach] Relational Database Initialized & Seeded.');

    server.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`🚀 Alpha Coach Backend API running on port ${PORT}`);
      console.log(`📡 MT5 Synchronization Bridge Endpoint: http://localhost:${PORT}/api/v1/mt5/sync`);
      console.log(`=======================================================`);
    });
  } catch (err) {
    console.error('[Alpha Coach Bootstrap Failed]:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  bootstrap();
}

export { app, server, bootstrap };
