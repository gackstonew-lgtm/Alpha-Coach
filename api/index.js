const { app } = require('./app.bundle.js');

function handler(req, res) {
  return new Promise((resolve) => {
    res.on('finish', resolve);
    res.on('close', resolve);
    res.on('error', resolve);
    try {
      app(req, res, (err) => {
        if (err && !res.headersSent) {
          res.status(500).json({ success: false, error: { message: err.message || 'Internal Server Error' } });
        } else if (!res.headersSent) {
          res.status(404).json({ success: false, error: { code: 'ROUTE_NOT_FOUND', message: `Route not found: ${req.url}` } });
        }
        resolve();
      });
    } catch (fatalErr) {
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: { message: fatalErr.message || 'Fatal Error' } });
      }
      resolve();
    }
  });
}

module.exports = handler;
module.exports.default = handler;
