import { app } from '../backend/src/app';
import { initDatabase } from '../backend/src/db/db';

let isInitialized = false;

export default async function handler(req: any, res: any) {
  if (!isInitialized) {
    try {
      await initDatabase();
      isInitialized = true;
    } catch (err: any) {
      console.error('[Vercel Serverless Init Error]:', err);
      if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
        return res.status(500).json({
          success: false,
          error: {
            code: 'DATABASE_INITIALIZATION_ERROR',
            message: 'Production database initialization failed: DATABASE_URL not configured.'
          },
          timestamp: new Date().toISOString()
        });
      }
    }
  }
  return app(req, res);
}
