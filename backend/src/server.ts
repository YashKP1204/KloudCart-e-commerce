import 'dotenv/config';
import express from 'express';
import { healthRouter } from './routes/health.ts';
import { productsRouter } from './routes/products.ts';
import { ordersRouter } from './routes/orders.ts';
import { authRouter } from './routes/auth.ts';
import { metricsRouter, recordHttpMetric } from './routes/metrics.ts';
import { dbManager } from './db.ts';
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

async function startServer() {
  const app = express();

  // Connect to Database
  await dbManager.connect();

  // Worker runs as a separate process/container. Keep API stateless.

  app.use(express.json());

  // Observability middleware for latency and Prometheus request counting
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      recordHttpMetric(req.method, req.path, res.statusCode, duration);
    });
    next();
  });

  // Mount backend API routes
  app.use('/api', healthRouter);
  app.use('/api/products', productsRouter);
  app.use('/api/orders', ordersRouter);
  app.use('/api/auth', authRouter);
  app.use('/metrics', metricsRouter);


  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[CloudCart] Server listening on http://0.0.0.0:${PORT}`);
    console.log(`[CloudCart] Health Check: http://localhost:${PORT}/api/health`);
    console.log(`[CloudCart] Readiness Check: http://localhost:${PORT}/api/ready`);
    console.log(`[CloudCart] Prometheus Metrics: http://localhost:${PORT}/metrics`);
  });
}

startServer().catch(err => {
  console.error('[CloudCart] Fatal boot error:', err);
  process.exit(1);
});
