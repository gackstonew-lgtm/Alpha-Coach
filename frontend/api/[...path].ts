export default async function handler(req: any, res: any) {
  try {
    const { app } = await import('../backend/src/app');
    return app(req, res);
  } catch (err: any) {
    console.error('[Vercel Serverless Error]:', err);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'API_HANDLER_CRASH',
          message: err?.message || String(err),
          stack: err?.stack
        },
        timestamp: new Date().toISOString()
      });
    }
  }
}
