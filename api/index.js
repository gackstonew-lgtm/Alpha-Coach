module.exports = (req, res) => {
  res.status(200).json({
    success: true,
    status: 'ONLINE',
    service: 'Alpha Coach API',
    version: '1.0.4',
    environment: process.env.NODE_ENV || 'production',
    database: process.env.DATABASE_URL ? 'CONNECTED' : 'DEGRADED',
    timestamp: new Date().toISOString()
  });
};
