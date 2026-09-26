const { app } = require('./app.bundle.js');

module.exports = (req, res) => {
  if (req.query && req.query.path) {
    const pathStr = Array.isArray(req.query.path) ? req.query.path.join('/') : req.query.path;
    req.url = `/api/${pathStr}`;
  }
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
};
