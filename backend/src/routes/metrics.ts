import { Router, Request, Response } from 'express';
import { dbManager } from '../db.ts';
import { queueManager } from '../queue.ts';

export const metricsRouter = Router();

// In-memory request counters for Prometheus exposition
export const metricsData = {
  requestsTotal: {} as Record<string, number>,
  latencySumMs: {} as Record<string, number>,
  latencyCount: {} as Record<string, number>
};

export function recordHttpMetric(method: string, path: string, status: number, durationMs: number) {
  // Normalize path to avoid high cardinality (e.g. /api/products/123 -> /api/products/:id)
  const normalizedPath = path
    .replace(/\/api\/products\/[a-zA-Z0-9_-]+/, '/api/products/:id')
    .replace(/\/api\/orders\/[a-zA-Z0-9_-]+/, '/api/orders/:id');

  const key = `${method}_${normalizedPath}_${status}`;
  metricsData.requestsTotal[key] = (metricsData.requestsTotal[key] || 0) + 1;

  const latKey = `${method}_${normalizedPath}`;
  metricsData.latencySumMs[latKey] = (metricsData.latencySumMs[latKey] || 0) + durationMs;
  metricsData.latencyCount[latKey] = (metricsData.latencyCount[latKey] || 0) + 1;
}

// GET /metrics - Prometheus exposition format (text/plain)
metricsRouter.get('/', async (req: Request, res: Response) => {
  const [dbHealth, redisHealth, queueLength, orders] = await Promise.all([
    dbManager.checkHealth(),
    queueManager.checkHealth(),
    queueManager.getQueueLength(),
    dbManager.getOrders()
  ]);

  const mem = process.memoryUsage();
  const uptime = process.uptime();
  const workerStatus = await queueManager.checkHealth();

  const lines: string[] = [
    '# HELP cloudcart_uptime_seconds Total seconds the CloudCart application has been running.',
    '# TYPE cloudcart_uptime_seconds gauge',
    `cloudcart_uptime_seconds ${uptime.toFixed(1)}`,
    '',
    '# HELP cloudcart_memory_heap_bytes Node.js heap memory usage in bytes.',
    '# TYPE cloudcart_memory_heap_bytes gauge',
    `cloudcart_memory_heap_bytes ${mem.heapUsed}`,
    `cloudcart_memory_rss_bytes ${mem.rss}`,
    '',
    '# HELP cloudcart_database_status 1 if database is healthy, 0 otherwise.',
    '# TYPE cloudcart_database_status gauge',
    `cloudcart_database_status{mode="${dbHealth.mode}"} ${dbHealth.ok ? 1 : 0}`,
    `cloudcart_database_latency_milliseconds ${dbHealth.latencyMs}`,
    '',
    '# HELP cloudcart_redis_status 1 if redis queue is healthy, 0 otherwise.',
    '# TYPE cloudcart_redis_status gauge',
    `cloudcart_redis_status{mode="${redisHealth.mode}"} ${redisHealth.ok ? 1 : 0}`,
    `cloudcart_redis_latency_milliseconds ${redisHealth.latencyMs}`,
    '',
    '# HELP cloudcart_order_queue_depth Current number of waiting jobs in the Redis order queue.',
    '# TYPE cloudcart_order_queue_depth gauge',
    `cloudcart_order_queue_depth ${queueLength}`,
    '',
    '# HELP cloudcart_worker_jobs_processed_total Total jobs processed by the background worker.',
    '# TYPE cloudcart_worker_jobs_processed_total counter',
    `cloudcart_worker_jobs_processed_total ${workerStatus.processedJobsTotal}`,
    `cloudcart_worker_jobs_failed_total ${workerStatus.failedJobsTotal}`,
    `cloudcart_worker_busy ${workerStatus.isBusy ? 1 : 0}`,
    '',
    '# HELP cloudcart_orders_by_status Total orders partitioned by status.',
    '# TYPE cloudcart_orders_by_status gauge'
  ];

  const statusCounts: Record<string, number> = {
    QUEUED: 0,
    PROCESSING: 0,
    PACKED: 0,
    SHIPPED: 0,
    DELIVERED: 0,
    FAILED: 0
  };
  orders.forEach(o => {
    statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
  });

  Object.entries(statusCounts).forEach(([st, cnt]) => {
    lines.push(`cloudcart_orders_by_status{status="${st}"} ${cnt}`);
  });

  lines.push('');
  lines.push('# HELP http_requests_total Total number of HTTP requests handled.');
  lines.push('# TYPE http_requests_total counter');

  if (Object.keys(metricsData.requestsTotal).length === 0) {
    lines.push('http_requests_total{method="GET",path="/metrics",status="200"} 1');
  } else {
    Object.entries(metricsData.requestsTotal).forEach(([key, count]) => {
      const parts = key.split('_');
      const method = parts[0];
      const status = parts[parts.length - 1];
      const path = parts.slice(1, parts.length - 1).join('_');
      lines.push(`http_requests_total{method="${method}",path="${path}",status="${status}"} ${count}`);
    });
  }

  res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
  res.send(lines.join('\n') + '\n');
});
