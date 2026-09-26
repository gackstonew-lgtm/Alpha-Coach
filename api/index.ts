import { app } from '../backend/src/app';

export default function handler(req: any, res: any) {
  try {
    return app(req, res);
  } catch (err: any) {
    console.error('[API Serverless Fatal Error]:', err);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVERLESS_HANDLER_ERROR',
          message: err.message || 'Internal Server Error'
        },
        timestamp: new Date().toISOString()
      });
    }
  }
}
