import { Router, Request, Response } from 'express';
import { dbManager } from '../db.ts';
import { queueManager } from '../queue.ts';
import { Order, QueueJob } from '@cloudcart/shared/types';

export const ordersRouter = Router();

// GET /api/orders - list all orders
ordersRouter.get('/', async (req: Request, res: Response) => {
  try {
    const orders = await dbManager.getOrders();
    res.json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to fetch orders'
    });
  }
});

// GET /api/orders/:id - get single order status & timeline
ordersRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const order = await dbManager.getOrderById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: `Order '${id}' not found`
      });
    }

    res.json({
      success: true,
      order
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to fetch order'
    });
  }
});

// POST /api/orders - place a new order and enqueue background worker job
ordersRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { items, customer } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Order must include at least one item'
      });
    }

    if (!customer || !customer.email || !customer.name) {
      return res.status(400).json({
        success: false,
        error: 'Customer name and valid email are required'
      });
    }

    const totalAmount = items.reduce(
      (sum: number, item: any) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
      0
    );

    const now = new Date().toISOString();
    const orderId = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const newOrder: Order = {
      id: orderId,
      items: items.map(item => ({
        productId: item.productId || item.id,
        name: item.name,
        price: Number(item.price),
        quantity: Number(item.quantity) || 1,
        imageUrl: item.imageUrl || ''
      })),
      totalAmount: Math.round(totalAmount * 100) / 100,
      customer: {
        name: customer.name,
        email: customer.email,
        address: customer.address || '742 Evergreen Terrace',
        city: customer.city || 'Springfield',
        postalCode: customer.postalCode || '97477',
        country: customer.country || 'United States'
      },
      status: 'QUEUED',
      timeline: [
        {
          status: 'QUEUED',
          message: 'Order received and submitted to Redis background job queue',
          timestamp: now
        }
      ],
      createdAt: now,
      updatedAt: now
    };

    // Save order into database (MongoDB / in-memory)
    await dbManager.createOrder(newOrder);

    // Push job into Redis queue for background worker
    const job: QueueJob = {
      id: `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type: 'PROCESS_ORDER',
      payload: {
        orderId: newOrder.id,
        priority: 'normal'
      },
      enqueuedAt: now,
      attempts: 0
    };

    const queueLength = await queueManager.enqueue(job);

    res.status(201).json({
      success: true,
      message: 'Order created and enqueued successfully',
      order: newOrder,
      queue: {
        jobId: job.id,
        queuePosition: queueLength
      }
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to place order'
    });
  }
});

// POST /api/orders/batch - DevOps load generation tool (generates 3 sample orders)
ordersRouter.post('/batch', async (req: Request, res: Response) => {
  try {
    const products = await dbManager.getProducts();
    if (products.length === 0) {
      return res.status(400).json({ error: 'No products available to generate orders' });
    }

    const count = Math.min(Number(req.body.count) || 3, 10);
    const createdOrders: Order[] = [];

    for (let i = 0; i < count; i++) {
      const p = products[Math.floor(Math.random() * products.length)];
      const now = new Date().toISOString();
      const orderId = `ORD-LOAD-${Date.now().toString().slice(-5)}-${i + 1}`;

      const order: Order = {
        id: orderId,
        items: [{
          productId: p.id,
          name: p.name,
          price: p.price,
          quantity: 1,
          imageUrl: p.imageUrl
        }],
        totalAmount: p.price,
        customer: {
          name: `DevOps Load Test User #${i + 1}`,
          email: `loadtest${i + 1}@k8s-simulation.local`,
          address: 'Pod Replica Node',
          city: 'Cluster-East-1',
          postalCode: '10001',
          country: 'Cloud VPC'
        },
        status: 'QUEUED',
        timeline: [
          {
            status: 'QUEUED',
            message: 'Synthetic load test order enqueued to Redis',
            timestamp: now
          }
        ],
        createdAt: now,
        updatedAt: now
      };

      await dbManager.createOrder(order);
      await queueManager.enqueue({
        id: `job_load_${Date.now()}_${i}`,
        type: 'PROCESS_ORDER',
        payload: { orderId },
        enqueuedAt: now,
        attempts: 0
      });
      createdOrders.push(order);
    }

    const currentQueueLength = await queueManager.getQueueLength();

    res.json({
      success: true,
      message: `Generated and enqueued ${count} synthetic orders`,
      orders: createdOrders,
      currentQueueLength
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to generate batch orders'
    });
  }
});
