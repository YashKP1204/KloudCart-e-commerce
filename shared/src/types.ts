export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  stock: number;
  rating: number;
  sku: string;
  specs: Record<string, string>;
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

export interface CustomerInfo {
  name: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface OrderTimelineEvent {
  status: OrderStatus;
  message: string;
  timestamp: string;
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

export interface QueueJob {
  id: string;
  type: 'PROCESS_ORDER';
  payload: {
    orderId: string;
    priority?: 'normal' | 'high';
  };
  enqueuedAt: string;
  attempts: number;
}

export interface WorkerLog {
  id: string;
  timestamp: string;
  jobId: string;
  orderId: string;
  status: string;
  message: string;
}
