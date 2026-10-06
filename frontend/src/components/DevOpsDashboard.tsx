import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Database, 
  Activity, 
  Cpu, 
  Terminal, 
  Play, 
  Pause, 
  AlertTriangle, 
  RefreshCw, 
  Zap, 
  FileCode, 
  Layers, 
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';
import { DevOpsStatus } from '../types.ts';

interface DevOpsDashboardProps {
  status: DevOpsStatus | null;
  onRefresh: () => void;
  isLoading: boolean;
}

export const DevOpsDashboard: React.FC<DevOpsDashboardProps> = ({
  status,
  onRefresh,
  isLoading
}) => {
  const [activeProbeTab, setActiveProbeTab] = useState<'health' | 'ready' | 'metrics'>('ready');
  const [probeResponse, setProbeResponse] = useState<string>('Loading probe data...');
  const [isProbeLoading, setIsProbeLoading] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  // Fetch probe data based on activeProbeTab
  const fetchProbe = async (tab: 'health' | 'ready' | 'metrics') => {
    setIsProbeLoading(true);
    try {
      const endpoint = tab === 'metrics' ? '/metrics' : `/api/${tab}`;
      const res = await fetch(endpoint);
      if (tab === 'metrics') {
        const text = await res.text();
        setProbeResponse(text);
      } else {
        const json = await res.json();
        setProbeResponse(JSON.stringify(json, null, 2));
      }
    } catch (err: any) {
      setProbeResponse(`Error calling probe endpoint: ${err.message}`);
    } finally {
      setIsProbeLoading(false);
    }
  };

  useEffect(() => {
    fetchProbe(activeProbeTab);
  }, [activeProbeTab]);

  const handleChaosAction = async (action: string, value?: any) => {
    setIsSimulating(true);
    try {
      await fetch('/api/devops/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, value })
      });
      await onRefresh();
      await fetchProbe(activeProbeTab);
    } catch (err) {
      console.error('Chaos simulation action failed:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleGenerateBatchOrders = async () => {
    setIsSimulating(true);
    try {
      await fetch('/api/orders/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 3 })
      });
      await onRefresh();
      await fetchProbe(activeProbeTab);
    } catch (err) {
      console.error('Batch load generation failed:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Architecture & SRE Portfolio Context */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-5 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <h2 className="text-lg font-bold text-white tracking-tight">
                DevOps &amp; SRE Observability Control Center
              </h2>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Real-time telemetry for Kubernetes liveness (<code className="text-cyan-300">/api/health</code>), 
              readiness (<code className="text-cyan-300">/api/ready</code>), Redis queue backpressure, 
              and Prometheus metrics scraping.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleGenerateBatchOrders}
              disabled={isSimulating}
              className="px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 text-white font-semibold text-xs flex items-center space-x-1.5 transition-all shadow-md shadow-cyan-600/20"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Simulate 3 Load Orders</span>
            </button>
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition-colors"
              title="Refresh telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Component Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Express API Liveness */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-slate-400">Node.js Express API</span>
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800">
              <CheckCircle2 className="w-2.5 h-2.5" />
              <span>PID {status?.system.pid || '—'}</span>
            </span>
          </div>
          <div className="text-xl font-mono font-bold text-white">
            {status?.system.uptime ? `${status.system.uptime}s uptime` : 'Active'}
          </div>
          <p className="text-[11px] text-slate-400 font-mono">
            Port {status?.system.port || 3000} • Env: {status?.system.nodeEnv || 'development'}
          </p>
        </div>

        {/* Database (MongoDB) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-slate-400">MongoDB Database</span>
            <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono ${
              status?.database.ok
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                : 'bg-rose-950 text-rose-400 border border-rose-800'
            }`}>
              {status?.database.ok ? 'HEALTHY' : 'DOWN'}
            </span>
          </div>
          <div className="text-xl font-mono font-bold text-white capitalize">
            {status?.database.mode || 'In-Memory'}
          </div>
          <p className="text-[11px] text-slate-400 font-mono">
            Latency: {status?.database.latencyMs}ms • {status?.database.uri}
          </p>
        </div>

        {/* Redis Queue */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-slate-400">Redis Order Queue</span>
            <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono ${
              status?.redis.ok
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                : 'bg-rose-950 text-rose-400 border border-rose-800'
            }`}>
              {status?.redis.ok ? 'READY' : 'DOWN'}
            </span>
          </div>
          <div className="text-xl font-mono font-bold text-cyan-400">
            {status?.redis.queueLength ?? 0} jobs queued
          </div>
          <p className="text-[11px] text-slate-400 font-mono">
            Latency: {status?.redis.latencyMs}ms • Mode: {status?.redis.mode}
          </p>
        </div>

        {/* Background Worker */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-slate-400">Background Worker</span>
            <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono ${
              status?.worker.isRunning && !status.chaos.workerPaused
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                : 'bg-amber-950 text-amber-400 border border-amber-800'
            }`}>
              {status?.chaos.workerPaused ? 'PAUSED' : status?.worker.isBusy ? 'BUSY' : 'IDLE'}
            </span>
          </div>
          <div className="text-xl font-mono font-bold text-white">
            {status?.worker.processedJobsTotal ?? 0} jobs processed
          </div>
          <p className="text-[11px] text-slate-400 font-mono">
            Worker ID: {status?.worker.workerId || 'active'}
          </p>
        </div>
      </div>

      {/* Main Grid: Chaos Testing & Probe Inspection */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Chaos Engineering / Failure Injection (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-800">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-sm text-white font-mono uppercase tracking-wider">
              SRE Chaos &amp; Resilience Switches
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Toggle simulated failures to observe Kubernetes probe reactions, traffic rerouting, and Redis queue backlog behavior.
          </p>

          <div className="space-y-3 pt-2">
            {/* Toggle Readiness Failure */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-200">Simulate Readiness Failure</h4>
                <p className="text-[11px] text-slate-400">
                  Forces <code className="text-cyan-300">/api/ready</code> to return HTTP 503 (K8s isolates pod).
                </p>
              </div>
              <button
                onClick={() => handleChaosAction('toggle_readiness')}
                disabled={isSimulating}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                  status?.chaos.simulatedReadinessFailure
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {status?.chaos.simulatedReadinessFailure ? 'INJECTED (503)' : 'NORMAL (200)'}
              </button>
            </div>

            {/* Pause / Resume Worker */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-200">Pause Background Worker</h4>
                <p className="text-[11px] text-slate-400">
                  Halts queue consumption to demonstrate queue backpressure.
                </p>
              </div>
              <button
                onClick={() => handleChaosAction('toggle_worker_pause')}
                disabled={isSimulating}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center space-x-1 ${
                  status?.chaos.workerPaused
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {status?.chaos.workerPaused ? (
                  <>
                    <Pause className="w-3 h-3" />
                    <span>PAUSED</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3" />
                    <span>RUNNING</span>
                  </>
                )}
              </button>
            </div>

            {/* Toggle Database Failure */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-200">Simulate Database Outage</h4>
                <p className="text-[11px] text-slate-400">
                  Drops MongoDB connection to trigger downstream probe alert.
                </p>
              </div>
              <button
                onClick={() => handleChaosAction('toggle_db_down')}
                disabled={isSimulating}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                  status?.chaos.simulatedDbDown
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {status?.chaos.simulatedDbDown ? 'DB DOWN' : 'DB HEALTHY'}
              </button>
            </div>

            {/* Clear Redis Queue */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-200">Drain Redis Queue</h4>
                <p className="text-[11px] text-slate-400">
                  Purges all pending jobs from <code className="text-cyan-300">cloudcart:orders:queue</code>.
                </p>
              </div>
              <button
                onClick={() => handleChaosAction('clear_queue')}
                disabled={isSimulating}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold"
              >
                Purge
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Probe & Metrics Inspector (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col">
          {/* Tabs for Probe */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <h3 className="font-bold text-sm text-white font-mono uppercase tracking-wider">
                Live HTTP Probe &amp; Metrics Output
              </h3>
            </div>

            <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setActiveProbeTab('ready')}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                  activeProbeTab === 'ready'
                    ? 'bg-cyan-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                /api/ready
              </button>
              <button
                onClick={() => setActiveProbeTab('health')}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                  activeProbeTab === 'health'
                    ? 'bg-cyan-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                /api/health
              </button>
              <button
                onClick={() => setActiveProbeTab('metrics')}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                  activeProbeTab === 'metrics'
                    ? 'bg-cyan-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                /metrics
              </button>
            </div>
          </div>

          {/* Terminal Display */}
          <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs overflow-x-auto relative min-h-[260px] max-h-[340px] text-cyan-300">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-850 text-slate-500 text-[11px]">
              <span>curl -s -i http://localhost:3000{activeProbeTab === 'metrics' ? '/metrics' : `/api/${activeProbeTab}`}</span>
              <button
                onClick={() => fetchProbe(activeProbeTab)}
                className="text-cyan-400 hover:text-cyan-300 text-xs flex items-center space-x-1"
              >
                <RefreshCw className={`w-3 h-3 ${isProbeLoading ? 'animate-spin' : ''}`} />
                <span>Re-probe</span>
              </button>
            </div>
            <pre className="whitespace-pre font-mono text-slate-200 text-xs">
              {probeResponse}
            </pre>
          </div>
        </div>
      </div>

      {/* Live Worker Log Stream */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-sm text-white font-mono uppercase tracking-wider">
              Worker Event Stream (FIFO Redis Dequeue Log)
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {status?.recentWorkerLogs.length || 0} events recorded
          </span>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 max-h-56 overflow-y-auto space-y-2 font-mono text-xs">
          {(!status?.recentWorkerLogs || status.recentWorkerLogs.length === 0) ? (
            <p className="text-slate-500 py-3 text-center">No worker events logged yet. Place an order or click "Simulate 3 Load Orders".</p>
          ) : (
            status.recentWorkerLogs.map((log) => (
              <div
                key={log.id}
                className="p-2 rounded bg-slate-900/80 border border-slate-850 flex items-start space-x-2 text-[11px]"
              >
                <span className="text-slate-500 text-[10px] whitespace-nowrap mt-0.5">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span className={`px-1.5 py-0.2 rounded font-bold text-[10px] ${
                  log.status === 'PROCESSING' ? 'bg-blue-950 text-blue-300 border border-blue-800' :
                  log.status === 'PACKED' ? 'bg-purple-950 text-purple-300 border border-purple-800' :
                  log.status === 'SHIPPED' ? 'bg-indigo-950 text-indigo-300 border border-indigo-800' :
                  log.status === 'DELIVERED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                  'bg-rose-950 text-rose-300 border border-rose-800'
                }`}>
                  {log.status}
                </span>
                <span className="text-cyan-400 font-bold">{log.orderId}:</span>
                <span className="text-slate-300 flex-1">{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
