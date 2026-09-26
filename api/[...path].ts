export default async function handler(req: any, res: any) {
  try {
    const mod = await import('../backend/src/app');
    const app = mod.default || mod.app;
    return new Promise<void>((resolve, reject) => {
      res.on('finish', resolve);
      res.on('close', resolve);
      res.on('error', reject);
      app(req, res, (err: any) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
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
