import { MongoClient, Db, Collection } from 'mongodb';
import { Product, Order, User } from './types.ts';

const DB_NAME = 'cloudcart';

// Initial seed products with DevOps/SRE theme
const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-k8s-node',
    sku: 'CC-HW-K8S-01',
    name: 'Kubernetes Cluster Edge Node v2',
    description: 'Quad-core ARM64 edge computation node with 16GB ECC memory and dual 2.5GbE NICs. Optimized for high-throughput containerized workloads and cluster control planes.',
    price: 349.99,
    category: 'Hardware & Nodes',
    imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=60',
    stock: 24,
    rating: 4.9,
    specs: {
      'CPU': '4-Core ARM Cortex-A76 @ 2.4GHz',
      'RAM': '16GB LPDDR4x ECC',
      'Storage': '64GB eMMC 5.1 + M.2 NVMe slot',
      'Network': 'Dual 2.5 Gbps Ethernet'
    }
  },
  {
    id: 'prod-sre-keyboard',
    sku: 'CC-ACC-KBD-02',
    name: 'SRE On-Call Mechanical Keyboard',
    description: 'Hot-swappable tactile switches with custom laser-etched Kubernetes, Docker, and Vim keycaps. Silent red switches designed for quiet emergency on-call debugging sessions.',
    price: 129.50,
    category: 'Peripherals',
    imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=60',
    stock: 58,
    rating: 4.8,
    specs: {
      'Switches': 'Gateron Silent Red Pro',
      'Layout': '75% Compact ANSI',
      'Connectivity': 'USB-C / 2.4Ghz / Bluetooth 5.2',
      'Backlight': 'RGB North-Facing'
    }
  },
  {
    id: 'prod-monitor-ultra',
    sku: 'CC-DISP-34-03',
    name: '34" Curved SRE Telemetry Monitor',
    description: 'Ultra-wide 3440x1440p HDR curved panel with 165Hz refresh rate. Purpose-built for multi-tile Grafana dashboards, log streams, and terminal matrices.',
    price: 549.00,
    category: 'Peripherals',
    imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=60',
    stock: 12,
    rating: 4.95,
    specs: {
      'Resolution': '3440 x 1440 (UWQHD)',
      'Curvature': '1500R Curved',
      'Panel': 'Fast IPS 1ms GtG',
      'Color Gamut': '98% DCI-P3'
    }
  },
  {
    id: 'prod-runner-gateway',
    sku: 'CC-NET-RUN-04',
    name: 'GitOps CI/CD Build Accelerator',
    description: 'Dedicated hardware caching appliance for Docker layer caching, NPM/Go package proxies, and Jenkins/GitHub Actions runners.',
    price: 279.00,
    category: 'Hardware & Nodes',
    imageUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&auto=format&fit=crop&q=60',
    stock: 31,
    rating: 4.7,
    specs: {
      'Throughput': 'Line-rate 10Gbps SFP+',
      'Cache SSD': '1TB NVMe PCIe 4.0',
      'Protocols': 'Docker Registry v2, OCI, PyPI, Apt',
      'Power': 'Low 15W TDP'
    }
  },
  {
    id: 'prod-auth-dongle',
    sku: 'CC-SEC-KEY-05',
    name: 'Zero-Trust FIDO2 SRE Security Key',
    description: 'IP68 waterproof biometric hardware security key with FIDO2/WebAuthn, PIV smartcard, and OpenPGP hardware acceleration for secure cluster SSH access.',
    price: 64.99,
    category: 'Security & DevOps',
    imageUrl: 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=800&auto=format&fit=crop&q=60',
    stock: 85,
    rating: 4.85,
    specs: {
      'Auth Standards': 'FIDO2, WebAuthn, U2F, TOTP',
      'Interface': 'USB-C + NFC',
      'Enclosure': 'Anodized Aircraft Aluminum',
      'Crypto': 'EAL6+ Secure Element'
    }
  },
  {
    id: 'prod-sre-hoodie',
    sku: 'CC-APP-SWAG-06',
    name: 'Production Hero Heavyweight Hoodie',
    description: 'Heavyweight organic cotton hoodie featuring minimalist "git commit -m \'fix production\'" embroidery. Built for cold server rooms and 3 AM P1 incidents.',
    price: 74.00,
    category: 'Swag & Apparel',
    imageUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=60',
    stock: 60,
    rating: 4.9,
    specs: {
      'Material': '100% Ring-Spun Organic Cotton (420 GSM)',
      'Fit': 'Oversized Relaxed Fit',
      'Features': 'Fleece-lined hood, hidden pouch phone pocket'
    }
  },
  {
    id: 'prod-docker-mascot',
    sku: 'CC-TOY-PLUSH-07',
    name: 'Container Desk Whale Mascot',
    description: 'Soft plush container companion for rubber-duck debugging during complex network policy and ingress troubleshooting.',
    price: 24.50,
    category: 'Swag & Apparel',
    imageUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=60',
    stock: 120,
    rating: 4.92,
    specs: {
      'Size': '8 inches (20 cm)',
      'Material': 'Recycled Microfiber Plush',
      'Use Case': 'Rubber Duck Debugging & Emotional Support'
    }
  },
  {
    id: 'prod-gitops-mug',
    sku: 'CC-HOME-MUG-08',
    name: 'ArgoCD Sync Temperature Smart Mug',
    description: 'Self-heating ceramic smart mug with a small LED bar that syncs color based on your build status (Green = Synced, Red = Degraded).',
    price: 89.00,
    category: 'Peripherals',
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=60',
    stock: 40,
    rating: 4.75,
    specs: {
      'Battery': '3 hours active heating / All-day on charging coaster',
      'Temp Range': '120°F - 145°F (50°C - 62.5°C)',
      'Connection': 'BLE 5.0 with REST webhook support'
    }
  }
];

class DatabaseManager {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  public isConnected = false;
  public mode: 'mongodb' | 'in-memory' = 'in-memory';
  public lastPing = Date.now();
  public simulatedLatencyMs = 0;
  public simulatedDown = false;

  // In-memory fallback stores
  private memoryProducts: Map<string, Product> = new Map();
  private memoryOrders: Map<string, Order> = new Map();
  private memoryUsers: Map<string, User> = new Map();

  constructor() {
    this.seedMemory();
  }

  private seedMemory() {
    INITIAL_PRODUCTS.forEach(p => this.memoryProducts.set(p.id, { ...p }));
    
    // Seed default admin/demo user
    const demoUser: User = {
      id: 'usr_demo_sre',
      name: 'DevOps Engineer',
      email: 'sre@cloudcart.dev',
      role: 'sre',
      createdAt: new Date().toISOString()
    };
    this.memoryUsers.set(demoUser.id, demoUser);
  }

  async connect(): Promise<void> {
    const mongoUri = process.env.MONGO_URI ;
    try {
      // Try connecting to real MongoDB with 1500ms timeout
      const client = new MongoClient(mongoUri, {
        serverSelectionTimeoutMS: 1500,
        connectTimeoutMS: 1500,
      });

      await client.connect();
      await client.db(DB_NAME).command({ ping: 1 });

      this.client = client;
      this.db = client.db(DB_NAME);
      this.isConnected = true;
      this.mode = 'mongodb';
      this.lastPing = Date.now();
      console.log(`[DB] Connected to MongoDB at ${mongoUri}`);

      // Seed MongoDB if empty
      await this.seedMongoIfEmpty();
    } catch (err) {
      this.isConnected = true; // In-memory fallback is fully functional and ready
      this.mode = 'in-memory';
      console.log(`[DB] MongoDB not detected at ${mongoUri} (using in-memory data store for dev/testing; real MongoDB supported in Docker/K8s)`);
    }
  }

  private async seedMongoIfEmpty() {
    if (!this.db) return;
    try {
      const productsCol = this.db.collection<Product>('products');
      const count = await productsCol.countDocuments();
      if (count === 0) {
        await productsCol.insertMany(INITIAL_PRODUCTS);
        console.log(`[DB] Seeded ${INITIAL_PRODUCTS.length} initial products into MongoDB`);
      }
    } catch (err) {
      console.error('[DB] Failed to seed MongoDB:', err);
    }
  }

  private async checkChaos() {
    if (this.simulatedDown) {
      throw new Error('Simulated Database Connection Failure (Chaos Engineering Triggered)');
    }
    if (this.simulatedLatencyMs > 0) {
      await new Promise(r => setTimeout(r, this.simulatedLatencyMs));
    }
  }

  // --- PRODUCTS ---
  async getProducts(category?: string, search?: string): Promise<Product[]> {
    await this.checkChaos();

    if (this.mode === 'mongodb' && this.db) {
      const query: Record<string, any> = {};
      if (category && category !== 'All') {
        query.category = category;
      }
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }
      const products = await this.db.collection<Product>('products').find(query).toArray();
      return products.map(p => ({ ...p, id: p.id || (p as any)._id?.toString() }));
    }

    // In-memory
    let list = Array.from(this.memoryProducts.values());
    if (category && category !== 'All') {
      list = list.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }
    return list;
  }

  async getProductById(id: string): Promise<Product | null> {
    await this.checkChaos();

    if (this.mode === 'mongodb' && this.db) {
      const p = await this.db.collection<Product>('products').findOne({ id });
      if (!p) return null;
      return { ...p, id: p.id || (p as any)._id?.toString() };
    }

    return this.memoryProducts.get(id) || null;
  }

  // --- ORDERS ---
  async createOrder(order: Order): Promise<Order> {
    await this.checkChaos();

    if (this.mode === 'mongodb' && this.db) {
      await this.db.collection<Order>('orders').insertOne(order as any);
      return order;
    }

    this.memoryOrders.set(order.id, { ...order });
    return order;
  }

  async getOrders(): Promise<Order[]> {
    await this.checkChaos();

    if (this.mode === 'mongodb' && this.db) {
      const list = await this.db.collection<Order>('orders').find().sort({ createdAt: -1 }).toArray();
      return list.map(o => ({ ...o, id: o.id || (o as any)._id?.toString() }));
    }

    return Array.from(this.memoryOrders.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getOrderById(id: string): Promise<Order | null> {
    await this.checkChaos();

    if (this.mode === 'mongodb' && this.db) {
      const o = await this.db.collection<Order>('orders').findOne({ id });
      if (!o) return null;
      return { ...o, id: o.id || (o as any)._id?.toString() };
    }

    return this.memoryOrders.get(id) || null;
  }

  async updateOrderStatus(id: string, status: Order['status'], message: string): Promise<Order | null> {
    await this.checkChaos();

    const timelineEvent = {
      status,
      message,
      timestamp: new Date().toISOString()
    };

    if (this.mode === 'mongodb' && this.db) {
      const result = await this.db.collection<Order>('orders').findOneAndUpdate(
        { id },
        {
          $set: { status, updatedAt: new Date().toISOString() },
          $push: { timeline: timelineEvent as any }
        },
        { returnDocument: 'after' }
      );
      if (!result) return null;
      return { ...(result as any), id: (result as any).id || (result as any)._id?.toString() };
    }

    const order = this.memoryOrders.get(id);
    if (!order) return null;

    order.status = status;
    order.updatedAt = new Date().toISOString();
    order.timeline.push(timelineEvent);
    this.memoryOrders.set(id, { ...order });
    return order;
  }

  // --- USERS ---
  async getUserByEmail(email: string): Promise<User | null> {
    await this.checkChaos();

    if (this.mode === 'mongodb' && this.db) {
      const user = await this.db.collection<User>('users').findOne({ email });
      if (!user) return null;
      return { ...user, id: user.id || (user as any)._id?.toString() };
    }

    for (const u of this.memoryUsers.values()) {
      if (u.email.toLowerCase() === email.toLowerCase()) return u;
    }
    return null;
  }

  async createUser(user: User): Promise<User> {
    await this.checkChaos();

    if (this.mode === 'mongodb' && this.db) {
      await this.db.collection<User>('users').insertOne(user as any);
      return user;
    }

    this.memoryUsers.set(user.id, { ...user });
    return user;
  }

  // Health probe checker
  async checkHealth(): Promise<{ ok: boolean; mode: string; latencyMs: number; error?: string }> {
    const start = Date.now();
    try {
      if (this.simulatedDown) {
        throw new Error('Simulated Database Down');
      }
      if (this.mode === 'mongodb' && this.db) {
        await this.db.command({ ping: 1 });
      }
      return {
        ok: true,
        mode: this.mode,
        latencyMs: Date.now() - start + this.simulatedLatencyMs
      };
    } catch (err: any) {
      return {
        ok: false,
        mode: this.mode,
        latencyMs: Date.now() - start,
        error: err.message
      };
    }
  }
}

export const dbManager = new DatabaseManager();
