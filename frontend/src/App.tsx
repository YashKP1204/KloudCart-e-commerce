/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { ProductCard } from './components/ProductCard.tsx';
import { ProductDetailModal } from './components/ProductDetailModal.tsx';
import { CartDrawer } from './components/CartDrawer.tsx';
import { OrdersList } from './components/OrdersList.tsx';
import { DevOpsDashboard } from './components/DevOpsDashboard.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { Product, CartItem, Order, User, DevOpsStatus } from './types.ts';
import { Search, Filter, Server, PackageCheck, AlertCircle, Sparkles } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'devops'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isProductsLoading, setIsProductsLoading] = useState(false);

  // Cart & Modals
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [recentAddedId, setRecentAddedId] = useState<string | null>(null);

  // Orders
  const [orders, setOrders] = useState<Order[]>([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);

  // DevOps & Observability
  const [devopsStatus, setDevopsStatus] = useState<DevOpsStatus | null>(null);
  const [systemReady, setSystemReady] = useState(true);
  const [isDevopsLoading, setIsDevopsLoading] = useState(false);

  // User Auth
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Notification Banner
  const [banner, setBanner] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showBanner = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setBanner({ message, type });
    setTimeout(() => setBanner(null), 4000);
  };

  // --- FETCH PRODUCTS ---
  const fetchProducts = useCallback(async () => {
    setIsProductsLoading(true);
    try {
      const url = new URL('/api/products', window.location.origin);
      if (selectedCategory !== 'All') url.searchParams.set('category', selectedCategory);
      if (searchQuery.trim()) url.searchParams.set('search', searchQuery.trim());

      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.success && Array.isArray(data.products)) {
        setProducts(data.products);

        // Derive unique categories
        const cats = Array.from(new Set(data.products.map((p: Product) => p.category))) as string[];
        setCategories(['All', ...cats]);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setIsProductsLoading(false);
    }
  }, [selectedCategory, searchQuery]);

  // --- FETCH ORDERS ---
  const fetchOrders = useCallback(async () => {
    setIsOrdersLoading(true);
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setIsOrdersLoading(false);
    }
  }, []);

  // --- FETCH DEVOPS STATUS ---
  const fetchDevopsStatus = useCallback(async () => {
    setIsDevopsLoading(true);
    try {
      const [statusRes, readyRes] = await Promise.all([
        fetch('/api/devops/status'),
        fetch('/api/ready')
      ]);

      setSystemReady(readyRes.status === 200);

      if (statusRes.ok) {
        const data = await statusRes.json();
        setDevopsStatus(data);
      }
    } catch (err) {
      setSystemReady(false);
      console.error('Failed to fetch DevOps status:', err);
    } finally {
      setIsDevopsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchProducts();
    fetchOrders();
    fetchDevopsStatus();

    // Check saved user session
    const savedUser = localStorage.getItem('cloudcart_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('cloudcart_user');
      }
    }
  }, []);

  // Poll orders and worker progress if any order is not yet DELIVERED or FAILED
  useEffect(() => {
    const hasActiveOrders = orders.some(o => 
      o.status === 'QUEUED' || o.status === 'PROCESSING' || o.status === 'PACKED' || o.status === 'SHIPPED'
    );

    if (hasActiveOrders || activeTab === 'devops' || activeTab === 'orders') {
      const interval = setInterval(() => {
        fetchOrders();
        fetchDevopsStatus();
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [orders, activeTab, fetchOrders, fetchDevopsStatus]);

  // Handle Cart
  const handleAddToCart = (product: Product, quantity = 1) => {
    setCart((prevCart) => {
      const existing = prevCart.find((i) => i.product.id === product.id);
      if (existing) {
        return prevCart.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prevCart, { product, quantity }];
    });

    setRecentAddedId(product.id);
    setTimeout(() => setRecentAddedId(null), 1500);
    showBanner(`Added "${product.name}" to cart!`, 'success');
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const handleOrderSuccess = (orderId: string) => {
    setIsCartOpen(false);
    fetchOrders();
    fetchDevopsStatus();
    setActiveTab('orders');
    showBanner(`Order ${orderId} placed & submitted to Redis queue!`, 'success');
  };

  const handleLoginSuccess = (user: User, token: string) => {
    setCurrentUser(user);
    localStorage.setItem('cloudcart_user', JSON.stringify(user));
    localStorage.setItem('cloudcart_token', token);
    showBanner(`Welcome back, ${user.name}!`, 'info');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('cloudcart_user');
    localStorage.removeItem('cloudcart_token');
    showBanner('Signed out of CloudCart', 'info');
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cartCount={totalCartCount}
        openCart={() => setIsCartOpen(true)}
        user={currentUser}
        openAuth={() => setIsAuthOpen(true)}
        systemReady={systemReady}
        orderCount={orders.length}
      />

      {/* Floating Status Notification Toast */}
      {banner && (
        <div className="fixed top-20 right-4 z-50 animate-bounce duration-300">
          <div className={`px-4 py-2.5 rounded-xl shadow-xl border text-xs font-mono flex items-center space-x-2 ${
            banner.type === 'success' 
              ? 'bg-emerald-950 border-emerald-700 text-emerald-300' 
              : banner.type === 'error'
              ? 'bg-rose-950 border-rose-700 text-rose-300'
              : 'bg-cyan-950 border-cyan-700 text-cyan-300'
          }`}>
            <Sparkles className="w-3.5 h-3.5" />
            <span>{banner.message}</span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* TAB 1: PRODUCT CATALOG */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            {/* Catalog Hero Banner */}
            <div className="relative rounded-2xl bg-gradient-to-r from-blue-900/60 via-slate-900 to-cyan-900/40 p-6 sm:p-8 border border-slate-800 shadow-xl overflow-hidden">
              <div className="max-w-2xl relative z-10 space-y-2">
                <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest bg-cyan-950/80 border border-cyan-850 px-2.5 py-1 rounded-full inline-block">
                  Target Workload Architecture
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  High-Performance DevOps &amp; SRE Equipment
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Real e-commerce workload designed for containerization, Kubernetes pod scaling, 
                  Redis queue backpressure testing, and Prometheus metric scraping.
                </p>
              </div>
              <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-10 translate-y-10">
                <Server className="w-64 h-64 text-cyan-400" />
              </div>
            </div>

            {/* Filters & Search Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800/80">
              {/* Category Pills */}
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                      selectedCategory === cat
                        ? 'bg-cyan-600 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Search input */}
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search hardware, specs, SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-500 font-mono"
                />
              </div>
            </div>

            {/* Products Grid */}
            {isProductsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-72 bg-slate-900 rounded-xl animate-pulse border border-slate-800" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/40 rounded-xl border border-slate-800 space-y-2">
                <AlertCircle className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="text-sm font-semibold text-slate-300">No products match your criteria</h3>
                <p className="text-xs text-slate-500">Try changing the search query or selecting "All" categories.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={handleAddToCart}
                    onViewDetails={(p) => setSelectedProduct(p)}
                    isAdded={recentAddedId === product.id}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ORDERS & ASYNC WORKER LIFECYCLE */}
        {activeTab === 'orders' && (
          <OrdersList
            orders={orders}
            isLoading={isOrdersLoading}
            onRefresh={fetchOrders}
          />
        )}

        {/* TAB 3: DEVOPS & SRE OBSERVABILITY */}
        {activeTab === 'devops' && (
          <DevOpsDashboard
            status={devopsStatus}
            onRefresh={fetchDevopsStatus}
            isLoading={isDevopsLoading}
          />
        )}
      </main>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={() => setCart([])}
        onOrderSuccess={handleOrderSuccess}
      />

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-6 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-400 font-mono">CloudCart</span>
            <span>•</span>
            <span>Target Workload for Kubernetes, Helm, ArgoCD &amp; Prometheus</span>
          </div>
          <div className="flex items-center space-x-4 font-mono text-[11px]">
            <a href="/api/health" target="_blank" rel="noreferrer" className="hover:text-cyan-400">
              Liveness (/api/health)
            </a>
            <a href="/api/ready" target="_blank" rel="noreferrer" className="hover:text-cyan-400">
              Readiness (/api/ready)
            </a>
            <a href="/metrics" target="_blank" rel="noreferrer" className="hover:text-cyan-400">
              Metrics (/metrics)
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
