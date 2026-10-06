import Redis from 'ioredis';
import { QueueJob, WorkerLog } from './types.ts';

const QUEUE_KEY = 'cloudcart:orders:queue';
const LOGS_KEY = 'cloudcart:worker:logs';

class QueueManager {
  private redisClient: Redis | null = null;
  public isConnected = false;
  public mode: 'redis' | 'in-memory' = 'in-memory';
  public simulatedLatencyMs = 0;
  public simulatedDown = false;
  public isPaused = false;

  // In-memory queue fallback
  private memoryQueue: QueueJob[] = [];
  private memoryLogs: WorkerLog[] = [];

  constructor() {
    this.init();
  }

  private async init() {
    try {
      const redisUrl = process.env.REDIS_URL;
      const client = new Redis(redisUrl, {
        connectTimeout: 1500,
        maxRetriesPerRequest: 1,
        retryStrategy: () => null, // Don't hang or spam retries if Redis is not running
        lazyConnect: true
      });

      await client.connect();
      await client.ping();

      this.redisClient = client;
      this.isConnected = true;
      this.mode = 'redis';
      console.log(`[Queue] Connected to Redis at ${redisUrl}`);
    } catch (err) {
      this.isConnected = true; // In-memory queue is fully functional
      this.mode = 'in-memory';
      console.log(`[Queue] Redis not detected at ${redisUrl} (using in-memory queue for dev/testing; real Redis supported in Docker/K8s)`);
    }
  }

  private async checkChaos() {
    if (this.simulatedDown) {
      throw new Error('Simulated Redis Connection Failure (Chaos Engineering Triggered)');
    }
    if (this.simulatedLatencyMs > 0) {
      await new Promise(r => setTimeout(r, this.simulatedLatencyMs));
    }
  }

  async enqueue(job: QueueJob): Promise<number> {
    await this.checkChaos();

    if (this.mode === 'redis' && this.redisClient) {
      const serialized = JSON.stringify(job);
      const len = await this.redisClient.rpush(QUEUE_KEY, serialized);
      return len;
    }

    this.memoryQueue.push(job);
    return this.memoryQueue.length;
  }

  async dequeue(): Promise<QueueJob | null> {
    await this.checkChaos();

    if (this.isPaused) {
      return null;
    }

    if (this.mode === 'redis' && this.redisClient) {
      const item = await this.redisClient.lpop(QUEUE_KEY);
      if (!item) return null;
      try {
        return JSON.parse(item) as QueueJob;
      } catch {
        return null;
      }
    }

    if (this.memoryQueue.length === 0) return null;
    return this.memoryQueue.shift() || null;
  }

  async getQueueLength(): Promise<number> {
    await this.checkChaos();

    if (this.mode === 'redis' && this.redisClient) {
      return await this.redisClient.llen(QUEUE_KEY);
    }

    return this.memoryQueue.length;
  }

  async addLog(log: WorkerLog): Promise<void> {
    if (this.mode === 'redis' && this.redisClient) {
      await this.redisClient.lpush(LOGS_KEY, JSON.stringify(log));
      await this.redisClient.ltrim(LOGS_KEY, 0, 99); // Keep latest 100 logs
      return;
    }

    this.memoryLogs.unshift(log);
    if (this.memoryLogs.length > 100) {
      this.memoryLogs.pop();
    }
  }

  async getLogs(limit = 30): Promise<WorkerLog[]> {
    if (this.mode === 'redis' && this.redisClient) {
      const items = await this.redisClient.lrange(LOGS_KEY, 0, limit - 1);
      return items.map(raw => {
        try {
          return JSON.parse(raw);
        } catch {
          return null;
        }
      }).filter(Boolean) as WorkerLog[];
    }

    return this.memoryLogs.slice(0, limit);
  }

  async clearQueue(): Promise<void> {
    if (this.mode === 'redis' && this.redisClient) {
      await this.redisClient.del(QUEUE_KEY);
      return;
    }
    this.memoryQueue = [];
  }

  async checkHealth(): Promise<{ ok: boolean; mode: string; latencyMs: number; length: number; error?: string }> {
    const start = Date.now();
    try {
      if (this.simulatedDown) {
        throw new Error('Simulated Redis Down');
      }
      let length = 0;
      if (this.mode === 'redis' && this.redisClient) {
        await this.redisClient.ping();
        length = await this.redisClient.llen(QUEUE_KEY);
      } else {
        length = this.memoryQueue.length;
      }

      return {
        ok: true,
        mode: this.mode,
        latencyMs: Date.now() - start + this.simulatedLatencyMs,
        length
      };
    } catch (err: any) {
      return {
        ok: false,
        mode: this.mode,
        latencyMs: Date.now() - start,
        length: 0,
        error: err.message
      };
    }
  }
}

export const queueManager = new QueueManager();
