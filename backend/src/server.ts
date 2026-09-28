import http from 'http';
import { app } from './app';
import { initDatabase } from './db/db';

const server = http.createServer(app);
const PORT = process.env.PORT || 4000;

async function bootstrap() {
  try {
    await initDatabase();
    console.log('[Meta Coach] Relational Database Initialized & Seeded.');

    server.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`🚀 Meta Coach Backend API running on port ${PORT}`);
      console.log(`📡 MT5 Synchronization Bridge Endpoint: http://localhost:${PORT}/api/v1/mt5/sync`);
      console.log(`=======================================================`);
    });
  } catch (err) {
    console.error('[Meta Coach Bootstrap Failed]:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  bootstrap();
}

export { app, server, bootstrap };
export default app;
