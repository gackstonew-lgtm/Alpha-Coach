module.exports = (req, res) => {
  try {
    const { app } = require('./app.bundle.js');
    return app(req, res);
  } catch (err) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: true,
      status: 'DEGRADED',
      source: 'alpha-coach-serverless-fallback',
      error: err.message || String(err),
      stack: err.stack,
      timestamp: new Date().toISOString()
    }));
  }
};
