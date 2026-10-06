import 'dotenv/config';
import { dbManager } from './db.ts';
import { backgroundWorker } from './worker.ts';

async function main() {
  console.log('==============================================');
  console.log('🚀 Starting CloudCart Standalone Background Worker');
  console.log(`Node Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Redis URL: ${process.env.REDIS_URL || 'redis://localhost:6379'}`);
  console.log(`MongoDB URI: ${process.env.MONGO_URI || 'mongodb://localhost:27017/cloudcart'}`);
  console.log('==============================================');

  // Connect to DB and start polling Redis queue
  await dbManager.connect();
  backgroundWorker.start(1000);

  // Graceful shutdown handling (SIGTERM, SIGINT) for Kubernetes pod termination
  const shutdown = async (signal: string) => {
    console.log(`[Worker] Received ${signal}. Draining queue and shutting down gracefully...`);
    backgroundWorker.stop();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch(err => {
  console.error('[Worker] Fatal startup error:', err);
  process.exit(1);
});
