module.exports = (req, res) => {
  try {
    const { app } = require('./app.bundle.js');
    return app(req, res);
  } catch (err) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      source: 'alpha-coach-serverless-diagnostic',
      error: err.message || String(err),
      stack: err.stack,
      nodeVersion: process.version,
      cwd: process.cwd(),
      env: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL,
        HAS_DB_URL: !!process.env.DATABASE_URL
      }
    }));
  }
};
