import { Router, Request, Response } from 'express';
import { dbManager } from '../db.ts';
import { queueManager } from '../queue.ts';

export const healthRouter = Router();

// Simulated readiness failure switch for SRE / DevOps testing
let simulatedReadinessFailure = false;

// Liveness Probe (/api/health)
// Kubernetes checks this to know if container process is running. If fails, Kubelet restarts pod.
healthRouter.get('/health', (req: Request, res: Response) => {
  const mem = process.memoryUsage();
  res.status(200).json({
    status: 'UP',
    service: 'cloudcart-api',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    pid: process.pid,
    nodeVersion: process.version,
    memory: {
      rssMb: Math.round(mem.rss / 1024 / 1024 * 100) / 100,
      heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024 * 100) / 100,
      heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024 * 100) / 100,
    }
  });
});

// Readiness Probe (/api/ready)
// Kubernetes checks this before routing Service traffic to this Pod.
// If downstream DB or Redis is down, Pod stops receiving ingress traffic until healthy.
healthRouter.get('/ready', async (req: Request, res: Response) => {
  if (simulatedReadinessFailure) {
    return res.status(503).json({
      status: 'NOT_READY',
      reason: 'Simulated readiness failure triggered via SRE Chaos Switch',
      timestamp: new Date().toISOString()
    });
  }

  const [dbHealth, redisHealth] = await Promise.all([
    dbManager.checkHealth(),
    queueManager.checkHealth()
  ]);

  const isReady = dbHealth.ok && redisHealth.ok;

  const responsePayload = {
    status: isReady ? 'READY' : 'NOT_READY',
    timestamp: new Date().toISOString(),
    components: {
      database: dbHealth,
      redisQueue: redisHealth,
      worker: await queueManager.checkHealth()
    }
  };

  if (isReady) {
    return res.status(200).json(responsePayload);
  } else {
    return res.status(503).json(responsePayload);
  }
});

// SRE / DevOps Telemetry & Chaos Engineering Controls
healthRouter.get('/devops/status', async (req: Request, res: Response) => {
  const [dbHealth, redisHealth, queueLength, logs] = await Promise.all([
    dbManager.checkHealth(),
    queueManager.checkHealth(),
    queueManager.getQueueLength(),
    queueManager.getLogs(20)
  ]);

  res.json({
    chaos: {
      simulatedReadinessFailure,
      simulatedDbDown: dbManager.simulatedDown,
      simulatedRedisDown: queueManager.simulatedDown,
      simulatedDbLatencyMs: dbManager.simulatedLatencyMs,
      workerPaused: queueManager.isPaused
    },
    system: {
      nodeEnv: process.env.NODE_ENV || 'development',
      port: process.env.PORT || 3000,
      uptime: Math.floor(process.uptime()),
      pid: process.pid
    },
    database: {
      mode: dbManager.mode,
      ok: dbHealth.ok,
      latencyMs: dbHealth.latencyMs,
      uri: process.env.MONGO_URI ? 'Connected (env set)' : 'In-Memory Mock (dev mode)'
    },
    redis: {
      mode: queueManager.mode,
      ok: redisHealth.ok,
      latencyMs: redisHealth.latencyMs,
      queueLength,
      url: process.env.REDIS_URL ? 'Connected (env set)' : 'In-Memory Mock (dev mode)'
    },
    worker: await queueManager.checkHealth(),
    recentWorkerLogs: logs
  });
});

healthRouter.post('/devops/simulate', (req: Request, res: Response) => {
  const { action, value } = req.body;

  switch (action) {
    case 'toggle_readiness':
      simulatedReadinessFailure = typeof value === 'boolean' ? value : !simulatedReadinessFailure;
      break;
    case 'toggle_db_down':
      dbManager.simulatedDown = typeof value === 'boolean' ? value : !dbManager.simulatedDown;
      break;
    case 'toggle_redis_down':
      queueManager.simulatedDown = typeof value === 'boolean' ? value : !queueManager.simulatedDown;
      break;
    case 'set_db_latency':
      dbManager.simulatedLatencyMs = Number(value) || 0;
      break;
    case 'set_redis_latency':
      queueManager.simulatedLatencyMs = Number(value) || 0;
      break;
    case 'toggle_worker_pause':
      queueManager.isPaused = typeof value === 'boolean' ? value : !queueManager.isPaused;
      break;
    case 'clear_queue':
      queueManager.clearQueue();
      break;
    default:
      return res.status(400).json({ error: 'Unknown simulation action' });
  }

  res.json({
    success: true,
    action,
    currentState: {
      simulatedReadinessFailure,
      simulatedDbDown: dbManager.simulatedDown,
      simulatedRedisDown: queueManager.simulatedDown,
      simulatedDbLatencyMs: dbManager.simulatedLatencyMs,
      workerPaused: queueManager.isPaused
    }
  });
});
