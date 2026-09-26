const { app } = require('./app.bundle.js');

module.exports = (req, res) => {
  return new Promise((resolve, reject) => {
    res.on('finish', resolve);
    res.on('close', resolve);
    res.on('error', reject);
    app(req, res);
  });
};
