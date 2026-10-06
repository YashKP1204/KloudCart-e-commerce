export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  stock: number;
  rating: number;
  specs: Record<string, string>;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type OrderStatus =
  | 'PENDING'
  | 'QUEUED'
  | 'PROCESSING'
  | 'PACKED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'FAILED';

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

export interface OrderTimelineEvent {
  status: OrderStatus;
  message: string;
  timestamp: string;
}

export interface CustomerInfo {
  name: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface Order {
  id: string;
  items: OrderItem[];
  totalAmount: number;
  customer: CustomerInfo;
  status: OrderStatus;
  timeline: OrderTimelineEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'admin' | 'sre';
  createdAt: string;
}

export interface DevOpsStatus {
  chaos: {
    simulatedReadinessFailure: boolean;
    simulatedDbDown: boolean;
    simulatedRedisDown: boolean;
    simulatedDbLatencyMs: number;
    workerPaused: boolean;
  };
  system: {
    nodeEnv: string;
    port: number;
    uptime: number;
    pid: number;
  };
  database: {
    mode: 'mongodb' | 'in-memory';
    ok: boolean;
    latencyMs: number;
    uri: string;
  };
  redis: {
    mode: 'redis' | 'in-memory';
    ok: boolean;
    latencyMs: number;
    queueLength: number;
    url: string;
  };
  worker: {
    workerId: string;
    isRunning: boolean;
    isBusy: boolean;
    processedJobsTotal: number;
    failedJobsTotal: number;
    lastProcessedAt: string | null;
    currentJobId: string | null;
    currentOrderId: string | null;
  };
  recentWorkerLogs: Array<{
    id: string;
    timestamp: string;
    jobId: string;
    orderId: string;
    status: string;
    message: string;
  }>;
}
