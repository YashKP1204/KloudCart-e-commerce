import { queueManager } from './queue.ts';
import { dbManager } from './db.ts';
import { QueueJob, WorkerLog } from '@cloudcart/shared/types';

class BackgroundWorker {
  private isRunning = false;
  private pollInterval: NodeJS.Timeout | null = null;
  public processedJobsTotal = 0;
  public failedJobsTotal = 0;
  public currentJob: QueueJob | null = null;
  public lastProcessedAt: string | null = null;
  public workerId: string = `worker-${Math.random().toString(36).substring(2, 8)}`;

  start(intervalMs = 1000) {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log(`[Worker ${this.workerId}] Background worker started (polling interval: ${intervalMs}ms)`);

    this.pollInterval = setInterval(async () => {
      if (!this.isRunning || this.currentJob) return;
      await this.pollNextJob();
    }, intervalMs);
  }

  stop() {
    this.isRunning = false;
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    console.log(`[Worker ${this.workerId}] Background worker stopped`);
  }

  getStatus() {
    return {
      workerId: this.workerId,
      isRunning: this.isRunning,
      isBusy: !!this.currentJob,
      processedJobsTotal: this.processedJobsTotal,
      failedJobsTotal: this.failedJobsTotal,
      lastProcessedAt: this.lastProcessedAt,
      currentJobId: this.currentJob?.id || null,
      currentOrderId: this.currentJob?.payload.orderId || null,
    };
  }

  private async log(orderId: string, jobId: string, status: string, message: string) {
    const entry: WorkerLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      orderId,
      jobId,
      status,
      message
    };
    await queueManager.addLog(entry);
    console.log(`[Worker ${this.workerId}] [${status}] Order ${orderId}: ${message}`);
  }

  private async pollNextJob() {
    try {
      const job = await queueManager.dequeue();
      if (!job) return;

      this.currentJob = job;
      const orderId = job.payload.orderId;

      await this.log(orderId, job.id, 'PROCESSING', 'Payment authorized, reserving inventory allocation in warehouse');
      await dbManager.updateOrderStatus(orderId, 'PROCESSING', 'Payment authorized; inventory reserved');

      // Step 2: Warehouse Packing
      await this.sleep(2500);
      await this.log(orderId, job.id, 'PACKED', 'Hardware QC passed; packed into anti-static shipping box');
      await dbManager.updateOrderStatus(orderId, 'PACKED', 'Warehouse team packaged and tagged parcel');

      // Step 3: Courier Dispatch
      await this.sleep(2500);
      const trackingNumber = `CC-TRK-${Math.floor(100000 + Math.random() * 900000)}`;
      await this.log(orderId, job.id, 'SHIPPED', `Dispatched with Carrier Express. Tracking: ${trackingNumber}`);
      await dbManager.updateOrderStatus(orderId, 'SHIPPED', `Dispatched with Carrier Express (Tracking #${trackingNumber})`);

      // Step 4: Final Delivery
      await this.sleep(3000);
      await this.log(orderId, job.id, 'DELIVERED', 'Delivered at customer delivery address. Signature verified.');
      await dbManager.updateOrderStatus(orderId, 'DELIVERED', 'Delivered to destination safely');

      this.processedJobsTotal++;
      this.lastProcessedAt = new Date().toISOString();
      this.currentJob = null;
    } catch (err: any) {
      console.error(`[Worker ${this.workerId}] Error processing job:`, err);
      this.failedJobsTotal++;
      if (this.currentJob) {
        const orderId = this.currentJob.payload.orderId;
        await this.log(orderId, this.currentJob.id, 'FAILED', `Worker pipeline failed: ${err.message}`);
        await dbManager.updateOrderStatus(orderId, 'FAILED', `Processing error: ${err.message}`);
      }
      this.currentJob = null;
    }
  }

  private sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const backgroundWorker = new BackgroundWorker();
