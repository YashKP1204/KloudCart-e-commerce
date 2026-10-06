import React from 'react';
import { ShoppingBag, Server, Activity, ShieldCheck, User as UserIcon, RefreshCw } from 'lucide-react';
import { User } from '../types.ts';

interface NavbarProps {
  activeTab: 'products' | 'orders' | 'devops';
  setActiveTab: (tab: 'products' | 'orders' | 'devops') => void;
  cartCount: number;
  openCart: () => void;
  user: User | null;
  openAuth: () => void;
  systemReady: boolean;
  orderCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  cartCount,
  openCart,
  user,
  openAuth,
  systemReady,
  orderCount
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Tag */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('products')}>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Server className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  CloudCart
                </span>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/80">
                  DevOps Workload
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Microservices • MongoDB • Redis • Worker</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => setActiveTab('products')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'products'
                  ? 'bg-slate-800 text-cyan-400 border border-slate-700'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              Catalog
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                activeTab === 'orders'
                  ? 'bg-slate-800 text-cyan-400 border border-slate-700'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <span>Orders</span>
              {orderCount > 0 && (
                <span className="bg-slate-700 text-slate-200 text-xs px-1.5 py-0.2 rounded-full">
                  {orderCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('devops')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                activeTab === 'devops'
                  ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-700/80 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>SRE Telemetry</span>
            </button>
          </nav>

          {/* Actions: Health Indicator, Cart, Auth */}
          <div className="flex items-center space-x-3">
            {/* Live Health Badge */}
            <div
              onClick={() => setActiveTab('devops')}
              title={`Readiness Probe: ${systemReady ? 'READY (200 OK)' : 'DEGRADED / NOT_READY (503)'}`}
              className={`hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-mono border cursor-pointer transition-colors ${
                systemReady
                  ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-400 hover:bg-emerald-900/50'
                  : 'bg-rose-950/80 border-rose-800 text-rose-300 animate-pulse'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${systemReady ? 'bg-emerald-400' : 'bg-rose-500'}`} />
              <span>{systemReady ? 'READY' : 'DEGRADED'}</span>
            </div>

            {/* Shopping Cart Button */}
            <button
              onClick={openCart}
              className="relative p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-colors flex items-center justify-center"
              aria-label="View shopping cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-cyan-500 text-slate-950 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shadow">
                  {cartCount}
                </span>
              )}
            </button>

            {/* User / Auth */}
            {user ? (
              <button
                onClick={openAuth}
                className="flex items-center space-x-2 text-xs bg-slate-800/80 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-200"
              >
                <div className="w-5 h-5 rounded-full bg-cyan-900 text-cyan-300 flex items-center justify-center font-bold text-[10px]">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="max-w-[90px] truncate hidden sm:inline">{user.name}</span>
              </button>
            ) : (
              <button
                onClick={openAuth}
                className="text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1 shadow-sm"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
