import React, { useState, useEffect, useRef } from 'react';
import {
  Cpu,
  HardDrive,
  Zap,
  Activity,
  RefreshCw,
  Server,
  Layers,
  Clock,
  ShieldCheck,
  Check,
  Flame,
  Info,
} from 'lucide-react';
import { SystemResourceTelemetry } from '../types/index.js';
import { fetchSystemResources } from '../services/api.js';

interface SystemResourcesProps {
  ollamaBaseUrl?: string;
  isOllamaMode?: boolean;
}

export function SystemResources({ ollamaBaseUrl, isOllamaMode = true }: SystemResourcesProps) {
  const [telemetry, setTelemetry] = useState<SystemResourceTelemetry | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(2000); // 2s
  const [history, setHistory] = useState<Array<{ time: string; cpu: number; mem: number; gpu: number }>>([]);
  const [error, setError] = useState<string | null>(null);

  const maxHistoryPoints = 30;

  const loadTelemetry = async () => {
    try {
      const data = await fetchSystemResources(ollamaBaseUrl);
      setTelemetry(data);
      setError(null);

      // Append to rolling history
      setHistory(prev => {
        const timeStr = new Date(data.timestamp).toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' });
        const newPoint = {
          time: timeStr,
          cpu: data.cpu.usagePercent,
          mem: data.memory.usagePercent,
          gpu: data.gpu.vramPercent,
        };
        const next = [...prev, newPoint];
        if (next.length > maxHistoryPoints) {
          return next.slice(next.length - maxHistoryPoints);
        }
        return next;
      });
    } catch (err: any) {
      setError(err.message || 'Unable to query local system telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTelemetry();
  }, [ollamaBaseUrl]);

  // Polling loop
  useEffect(() => {
    if (autoRefreshInterval <= 0) return;
    const interval = setInterval(() => {
      loadTelemetry();
    }, autoRefreshInterval);
    return () => clearInterval(interval);
  }, [autoRefreshInterval, ollamaBaseUrl]);

  // Helper formatting bytes to GB
  const formatGb = (bytes: number) => {
    return (bytes / (1024 * 1024 * 1024)).toFixed(1);
  };

  // Sparkline SVG renderer
  const renderSparkline = (dataKey: 'cpu' | 'mem' | 'gpu', strokeColor: string, fillColor: string) => {
    if (history.length < 2) {
      return <div className="h-20 flex items-center justify-center text-xs text-slate-500 font-mono">Gathering telemetry...</div>;
    }

    const width = 360;
    const height = 70;
    const padding = 6;

    const points = history.map((pt, idx) => {
      const x = padding + (idx / (maxHistoryPoints - 1)) * (width - padding * 2);
      const val = pt[dataKey];
      const y = height - padding - (val / 100) * (height - padding * 2);
      return `${x},${y}`;
    });

    const pathD = `M ${points.join(' L ')}`;
    const areaD = `M ${padding},${height - padding} L ${points.join(' L ')} L ${width - padding},${height - padding} Z`;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-20 overflow-visible">
        <defs>
          <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fillColor} stopOpacity="0.35" />
            <stop offset="100%" stopColor={fillColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        {/* Horizontal grid guide lines */}
        <line x1={padding} y1={height * 0.25} x2={width - padding} y2={height * 0.25} stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeDasharray="3 3" />
        <line x1={padding} y1={height * 0.5} x2={width - padding} y2={height * 0.5} stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeDasharray="3 3" />
        <line x1={padding} y1={height * 0.75} x2={width - padding} y2={height * 0.75} stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeDasharray="3 3" />
        {/* Gradient Area Fill */}
        <path d={areaD} fill={`url(#grad-${dataKey})`} />
        {/* Main Line */}
        <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  };

  return (
    <div className="space-y-6">
      {/* Component Header with Telemetry Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              System Resources & Hardware Telemetry
            </h2>
            {telemetry?.ollama.online && (
              <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                Ollama {telemetry.ollama.version} Connected
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time CPU, GPU/VRAM, and memory load during local model inference.
          </p>
        </div>

        {/* Polling Interval and Refresh Controls */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 font-mono text-slate-600 dark:text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            <span>Polling:</span>
            <select
              value={autoRefreshInterval}
              onChange={e => setAutoRefreshInterval(Number(e.target.value))}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md px-2 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value={1000}>1 second</option>
              <option value={2000}>2 seconds (Default)</option>
              <option value={5000}>5 seconds</option>
              <option value={0}>Paused</option>
            </select>
          </div>

          <button
            onClick={() => {
              setLoading(true);
              loadTelemetry();
            }}
            disabled={loading}
            className="p-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors disabled:opacity-50"
            title="Refresh telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-300 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => loadTelemetry()} className="underline font-semibold ml-2">Retry</button>
        </div>
      )}

      {/* Primary Telemetry Grid: CPU, Memory, GPU */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* CARD 1: CPU UTILIZATION */}
        <div className="bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-4 shadow-xs">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                <Cpu className="w-4 h-4" />
                <span>CPU Load</span>
              </div>
              <div className="text-3xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
                {telemetry ? `${telemetry.cpu.usagePercent.toFixed(1)}%` : '—'}
              </div>
            </div>
            <div className="text-right text-[11px] font-mono text-slate-500 dark:text-slate-400">
              <div>{telemetry?.cpu.cores || 8} Logical Cores</div>
              <div>{telemetry?.cpu.speedMhz ? `${(telemetry.cpu.speedMhz / 1000).toFixed(1)} GHz` : 'Base Clock'}</div>
            </div>
          </div>

          {/* Sparkline Trend */}
          <div className="bg-slate-50 dark:bg-slate-950/60 rounded-xl p-2.5 border border-slate-100 dark:border-slate-800/80">
            {renderSparkline('cpu', '#06b6d4', '#06b6d4')}
          </div>

          {/* Multi-core Load Distribution Bar */}
          {telemetry?.cpu.coreLoads && telemetry.cpu.coreLoads.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                <span>Core Breakdown</span>
                <span>Load Avg: {telemetry.cpu.loadAverage.join(' · ')}</span>
              </div>
              <div className="grid grid-cols-8 gap-1">
                {telemetry.cpu.coreLoads.slice(0, 16).map((load, i) => (
                  <div key={i} className="h-6 bg-slate-100 dark:bg-slate-800 rounded overflow-hidden flex flex-col justify-end" title={`Core ${i + 1}: ${load}%`}>
                    <div
                      className={`w-full transition-all duration-300 ${
                        load > 80 ? 'bg-rose-500' : load > 50 ? 'bg-amber-400' : 'bg-cyan-500'
                      }`}
                      style={{ height: `${load}%` }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CARD 2: RAM & SYSTEM MEMORY */}
        <div className="bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-4 shadow-xs">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                <HardDrive className="w-4 h-4" />
                <span>Memory (RAM)</span>
              </div>
              <div className="text-3xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
                {telemetry ? `${telemetry.memory.usagePercent.toFixed(1)}%` : '—'}
              </div>
            </div>
            <div className="text-right text-[11px] font-mono text-slate-500 dark:text-slate-400">
              <div>
                {telemetry ? `${formatGb(telemetry.memory.usedBytes)} / ${formatGb(telemetry.memory.totalBytes)} GB` : '—'}
              </div>
              <div className="text-emerald-600 dark:text-emerald-400">
                {telemetry ? `${formatGb(telemetry.memory.freeBytes)} GB Free` : '—'}
              </div>
            </div>
          </div>

          {/* Sparkline Trend */}
          <div className="bg-slate-50 dark:bg-slate-950/60 rounded-xl p-2.5 border border-slate-100 dark:border-slate-800/80">
            {renderSparkline('mem', '#10b981', '#10b981')}
          </div>

          {/* Allocation Breakdown Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden flex">
              <div
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{ width: `${telemetry?.memory.usagePercent || 0}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
              <span>App Process RSS: {telemetry ? `${(telemetry.memory.processRssBytes / (1024 * 1024)).toFixed(0)} MB` : '—'}</span>
              <span>Available: {telemetry ? `${(100 - telemetry.memory.usagePercent).toFixed(1)}%` : '—'}</span>
            </div>
          </div>
        </div>

        {/* CARD 3: GPU & VRAM COMPUTE ACCELERATION */}
        <div className="bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-4 shadow-xs">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                <Zap className="w-4 h-4" />
                <span>GPU / VRAM</span>
              </div>
              <div className="text-3xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
                {telemetry ? `${telemetry.gpu.vramPercent.toFixed(1)}%` : '—'}
              </div>
            </div>
            <div className="text-right text-[11px] font-mono text-slate-500 dark:text-slate-400">
              <div>
                {telemetry ? `${formatGb(telemetry.gpu.vramUsedBytes)} / ${formatGb(telemetry.gpu.vramTotalBytes)} GB` : '—'}
              </div>
              <div className="text-indigo-600 dark:text-indigo-400">
                {telemetry?.gpu.detected ? 'Hardware Accelerated' : 'CPU Unified Memory'}
              </div>
            </div>
          </div>

          {/* Sparkline Trend */}
          <div className="bg-slate-50 dark:bg-slate-950/60 rounded-xl p-2.5 border border-slate-100 dark:border-slate-800/80">
            {renderSparkline('gpu', '#6366f1', '#6366f1')}
          </div>

          {/* GPU Hardware Details */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
              <span className="truncate pr-2">{telemetry?.gpu.type || 'Metal / CUDA Acceleration'}</span>
              <span>Compute: {telemetry?.gpu.gpuLoadPercent || 0}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden flex">
              <div
                className="bg-indigo-500 h-full transition-all duration-300"
                style={{ width: `${telemetry?.gpu.vramPercent || 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: ACTIVE MODELS IN OLLAMA MEMORY */}
      <div className="bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Models Loaded in Memory (RAM / VRAM)
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
            {telemetry?.ollama.loadedModels.length || 0} active model{telemetry?.ollama.loadedModels.length === 1 ? '' : 's'}
          </span>
        </div>

        {telemetry?.ollama.loadedModels && telemetry.ollama.loadedModels.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                  <th className="pb-2.5">Model Name</th>
                  <th className="pb-2.5">Memory Footprint</th>
                  <th className="pb-2.5">VRAM Offload</th>
                  <th className="pb-2.5">Quantization</th>
                  <th className="pb-2.5">Architecture</th>
                  <th className="pb-2.5 text-right">Cache Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {telemetry.ollama.loadedModels.map((m, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>{m.name}</span>
                    </td>
                    <td className="py-2.5 text-slate-700 dark:text-slate-300">
                      {formatGb(m.sizeBytes)} GB
                    </td>
                    <td className="py-2.5 text-indigo-600 dark:text-indigo-400 font-semibold">
                      {m.sizeVramBytes > 0 ? `${formatGb(m.sizeVramBytes)} GB (GPU)` : 'CPU Memory'}
                    </td>
                    <td className="py-2.5 text-slate-500 dark:text-slate-400">
                      {m.quantization}
                    </td>
                    <td className="py-2.5 text-slate-500 dark:text-slate-400 uppercase">
                      {m.family}
                    </td>
                    <td className="py-2.5 text-right text-emerald-600 dark:text-emerald-400 font-medium">
                      Hot in Memory
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 px-4 text-center rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800/80 space-y-2">
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              No local models currently held in resident memory.
            </p>
            <p className="text-[11px] text-slate-500 max-w-md mx-auto">
              When you prompt Honore Assistant in Ollama mode, Ollama loads your selected model (e.g. <code className="font-mono text-purple-500">llama3.2</code>) into RAM/VRAM and retains it for quick follow-up turns.
            </p>
          </div>
        )}
      </div>

      {/* SECTION 3: HARDWARE OPTIMIZATION & RECOMMENDATIONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-2">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
            <Info className="w-4 h-4 text-blue-500" />
            <span>Optimal Local Model Sizing for Your Hardware</span>
          </div>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            Your host has <strong>{telemetry ? `${formatGb(telemetry.memory.totalBytes)} GB RAM` : 'ample memory'}</strong> and {telemetry?.cpu.cores || 8} CPU cores.
          </p>
          <ul className="space-y-1.5 text-slate-600 dark:text-slate-400 font-mono text-[11px] pt-1">
            <li className="flex items-center gap-1.5">
              <span className="text-emerald-500 font-bold">3B Models (llama3.2, deepseek-r1:1.5b):</span> Requires ~2 GB RAM · Lightning fast.
            </li>
            <li className="flex items-center gap-1.5">
              <span className="text-cyan-500 font-bold">7B-8B Models (mistral, qwen2.5-coder):</span> Requires ~4.5–5.5 GB RAM · Balanced.
            </li>
            <li className="flex items-center gap-1.5">
              <span className="text-indigo-500 font-bold">14B+ Models:</span> Recommended for workstations with 16 GB+ RAM or 8 GB+ VRAM.
            </li>
          </ul>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-2">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
            <Server className="w-4 h-4 text-emerald-500" />
            <span>Local Engine Configuration</span>
          </div>
          <div className="space-y-1 text-slate-600 dark:text-slate-400 text-[11px] font-mono">
            <div className="flex justify-between">
              <span>Engine Status:</span>
              <span className={telemetry?.ollama.online ? 'text-emerald-500 font-bold' : 'text-amber-500 font-bold'}>
                {telemetry?.ollama.online ? 'Running & Healthy' : 'Offline / Awaiting Connection'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Endpoint:</span>
              <span className="text-slate-800 dark:text-slate-200">{telemetry?.ollama.baseUrl || ollamaBaseUrl || 'http://127.0.0.1:11434'}</span>
            </div>
            <div className="flex justify-between">
              <span>Context Memory Headroom:</span>
              <span className="text-emerald-500 font-bold">Available (~8,192 tokens)</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 pt-1">
            To free model memory immediately, run <code className="bg-white dark:bg-slate-800 px-1 py-0.5 rounded text-slate-700 dark:text-slate-300">ollama stop &lt;model-name&gt;</code> in your terminal.
          </p>
        </div>
      </div>
    </div>
  );
}
