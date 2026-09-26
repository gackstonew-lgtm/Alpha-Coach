const { app } = require('./app.bundle.js');

module.exports = (req, res) => {
  try {
    app(req, res);
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVERLESS_HANDLER_EXCEPTION',
          message: err.message || String(err),
          stack: err.stack
        },
        timestamp: new Date().toISOString()
      });
    }
  }
};
