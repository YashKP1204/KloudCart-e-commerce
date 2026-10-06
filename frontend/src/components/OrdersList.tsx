import React, { useState } from 'react';
import { 
  Package, 
  Clock, 
  CheckCircle2, 
  Truck, 
  Cpu, 
  AlertCircle, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { Order, OrderStatus } from '../types.ts';

interface OrdersListProps {
  orders: Order[];
  isLoading: boolean;
  onRefresh: () => void;
  onSelectOrder?: (orderId: string) => void;
}

export const OrdersList: React.FC<OrdersListProps> = ({
  orders,
  isLoading,
  onRefresh
}) => {
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(
    orders.length > 0 ? orders[0].id : null
  );

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'QUEUED':
      case 'PENDING':
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-amber-950/80 border border-amber-800 text-amber-300">
            <Clock className="w-3 h-3 animate-spin" />
            <span>QUEUED IN REDIS</span>
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-blue-950/80 border border-blue-700 text-blue-300">
            <Cpu className="w-3 h-3 animate-pulse text-cyan-400" />
            <span>WORKER PROCESSING</span>
          </span>
        );
      case 'PACKED':
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-purple-950/80 border border-purple-800 text-purple-300">
            <Package className="w-3 h-3" />
            <span>PACKED &amp; QC PASSED</span>
          </span>
        );
      case 'SHIPPED':
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-indigo-950/80 border border-indigo-700 text-indigo-300">
            <Truck className="w-3 h-3" />
            <span>IN TRANSIT</span>
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-emerald-950/80 border border-emerald-800 text-emerald-300">
            <CheckCircle2 className="w-3 h-3" />
            <span>DELIVERED</span>
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-rose-950/80 border border-rose-800 text-rose-300">
            <AlertCircle className="w-3 h-3" />
            <span>FAILED</span>
          </span>
        );
      default:
        return <span className="text-xs font-mono text-slate-400">{status}</span>;
    }
  };

  const getStepActiveIndex = (status: OrderStatus) => {
    switch (status) {
      case 'QUEUED':
      case 'PENDING':
        return 0;
      case 'PROCESSING':
        return 1;
      case 'PACKED':
        return 2;
      case 'SHIPPED':
        return 3;
      case 'DELIVERED':
        return 4;
      default:
        return 0;
    }
  };

  const steps = [
    { label: 'Queued', desc: 'In Redis Queue' },
    { label: 'Processing', desc: 'Worker Allocated' },
    { label: 'Packed', desc: 'Warehouse Box' },
    { label: 'Dispatched', desc: 'Carrier Transit' },
    { label: 'Delivered', desc: 'Verified Complete' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <span>Customer Orders &amp; Lifecycle State</span>
            <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
              {orders.length}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Orders are written to MongoDB and dispatched through the Redis queue to the background worker.
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono border border-slate-700 transition-colors w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          <span>Refresh State</span>
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-3">
          <Package className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-slate-300">No orders placed yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Place an order from the Catalog or use the SRE Telemetry tab to generate synthetic load test orders!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const isExpanded = expandedOrderId === order.id;
            const currentStepIdx = getStepActiveIndex(order.status);

            return (
              <div
                key={order.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl overflow-hidden shadow-sm transition-all"
              >
                {/* Order Summary Bar */}
                <div
                  onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                  className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer bg-slate-900/80 hover:bg-slate-850"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-slate-800 text-cyan-400">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-sm font-bold text-white">{order.id}</span>
                        <span className="text-xs text-slate-500">•</span>
                        <span className="text-xs text-slate-400">
                          {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">
                        {order.customer.name} ({order.customer.email})
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 self-end md:self-auto">
                    {getStatusBadge(order.status)}
                    <span className="font-mono font-bold text-sm text-cyan-400">
                      ${order.totalAmount.toFixed(2)}
                    </span>
                    <button className="text-slate-400 hover:text-white">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-4 sm:p-6 border-t border-slate-800 bg-slate-950/70 space-y-6">
                    {/* Visual Lifecycle Stepper */}
                    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
                      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 font-mono">
                        Asynchronous Worker Pipeline
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        {steps.map((st, idx) => {
                          const isCompleted = idx <= currentStepIdx && order.status !== 'FAILED';
                          const isCurrent = idx === currentStepIdx && order.status !== 'FAILED';

                          return (
                            <div
                              key={st.label}
                              className={`p-2.5 rounded-lg border text-left transition-all ${
                                isCurrent
                                  ? 'bg-cyan-950/60 border-cyan-500/80 text-cyan-300'
                                  : isCompleted
                                  ? 'bg-slate-850 border-slate-700/80 text-emerald-400'
                                  : 'bg-slate-900/50 border-slate-800/60 text-slate-500'
                              }`}
                            >
                              <div className="flex items-center space-x-1.5 text-xs font-bold mb-1">
                                {isCompleted ? (
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                ) : (
                                  <span className="w-3.5 h-3.5 rounded-full border border-current flex items-center justify-center text-[9px] font-mono">
                                    {idx + 1}
                                  </span>
                                )}
                                <span>{st.label}</span>
                              </div>
                              <p className="text-[11px] text-slate-400 line-clamp-1">{st.desc}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Timeline Events & Items Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Timeline Events Log */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
                          Event Audit Trail ({order.timeline.length} updates)
                        </h4>
                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                          {order.timeline.map((evt, idx) => (
                            <div
                              key={idx}
                              className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 text-xs flex items-start space-x-2.5"
                            >
                              <div className="w-2 h-2 rounded-full bg-cyan-400 mt-1 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <span className="font-mono font-bold text-slate-200">
                                    {evt.status}
                                  </span>
                                  <span className="font-mono text-[10px] text-slate-400">
                                    {new Date(evt.timestamp).toLocaleTimeString()}
                                  </span>
                                </div>
                                <p className="text-slate-300 text-xs mt-0.5">{evt.message}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Items & Shipping summary */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
                          Purchased Items &amp; Destination
                        </h4>
                        <div className="space-y-2">
                          {order.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs"
                            >
                              <div className="flex items-center space-x-2 min-w-0">
                                {item.imageUrl && (
                                  <img
                                    src={item.imageUrl}
                                    alt={item.name}
                                    className="w-8 h-8 rounded object-cover"
                                  />
                                )}
                                <span className="text-slate-200 truncate max-w-[200px]">{item.name}</span>
                              </div>
                              <span className="font-mono text-slate-300">
                                {item.quantity} × ${item.price.toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
                          <span className="font-semibold text-slate-300 block mb-0.5">Shipping to:</span>
                          <p>{order.customer.address}, {order.customer.city} {order.customer.postalCode}, {order.customer.country}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
