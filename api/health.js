module.exports = (req, res) => {
  const dbStatus = process.env.DATABASE_URL ? 'CONNECTED' : 'DEGRADED';
  res.status(200).json({
    success: true,
    status: dbStatus === 'CONNECTED' ? 'ONLINE' : 'DEGRADED',
    service: 'Alpha Coach API',
    version: '1.0.4',
    environment: process.env.NODE_ENV || 'production',
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
};
