import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Wifi,
  WifiOff,
  RefreshCw,
  Download,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  Terminal,
  Zap,
  Layers,
  ArrowRight,
  ShieldCheck,
  Play,
  Copy,
  Check,
  Sparkles,
  Activity,
} from 'lucide-react';
import { OllamaModel, OllamaStatus, UserSettings } from '../types/index.js';
import {
  fetchOllamaStatus,
  fetchOllamaModels,
  pullOllamaModel,
  updateOllamaConfig,
} from '../services/api.js';
import { SystemResources } from './SystemResources.js';

interface OllamaStudioProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
  onSelectLocalModel: (modelName: string) => void;
  onStartChatWithModel: (modelName: string) => void;
}

const PRESET_MODELS = [
  { name: 'llama3.2', desc: 'Meta 3B: Ultra-fast, general conversation & reasoning', size: '2.0 GB', category: 'General' },
  { name: 'deepseek-r1:1.5b', desc: 'DeepSeek: Local reasoning & math chain-of-thought', size: '1.1 GB', category: 'Reasoning' },
  { name: 'qwen2.5-coder:1.5b', desc: 'Alibaba Qwen: Dedicated offline coding & debugging', size: '1.2 GB', category: 'Coding' },
  { name: 'mistral', desc: 'Mistral 7B: High-quality reasoning, writing & knowledge', size: '4.1 GB', category: 'General' },
  { name: 'phi3:mini', desc: 'Microsoft 3.8B: Highly efficient and lightweight', size: '2.3 GB', category: 'Lightweight' },
  { name: 'codellama', desc: 'Meta Code Llama: Specialized software development', size: '3.8 GB', category: 'Coding' },
];

export const OllamaStudio: React.FC<OllamaStudioProps> = ({
  settings,
  onUpdateSettings,
  onSelectLocalModel,
  onStartChatWithModel,
}) => {
  const [status, setStatus] = useState<OllamaStatus | null>(null);
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [customUrl, setCustomUrl] = useState(settings.ollamaBaseUrl || 'http://127.0.0.1:11434');
  const [activeLocalModel, setActiveLocalModel] = useState(settings.ollamaModel || 'llama3.2');
  const [brainMode, setBrainMode] = useState<'cloud' | 'local' | 'auto'>(settings.brainMode || 'auto');
  const [autoFallback, setAutoFallback] = useState(settings.autoOfflineFallback !== false);
  const [subTab, setSubTab] = useState<'overview' | 'resources' | 'pull' | 'terminal'>('overview');

  // Pull model state
  const [pullInput, setPullInput] = useState('');
  const [isPulling, setIsPulling] = useState(false);
  const [pullStatusText, setPullStatusText] = useState('');
  const [pullProgress, setPullProgress] = useState<{ completed: number; total: number } | null>(null);
  const [pullError, setPullError] = useState<string | null>(null);

  // Quick test state
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  // Check connection on load
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async (urlToCheck?: string) => {
    setIsChecking(true);
    setTestResult(null);
    try {
      const url = urlToCheck || customUrl;
      const res = await fetchOllamaStatus(url);
      setStatus(res);
      if (res.online) {
        const list = await fetchOllamaModels(url);
        setModels(list);
        if (list.length > 0 && !list.some(m => m.name === activeLocalModel)) {
          setActiveLocalModel(list[0].name);
        }
      }
    } catch (err: any) {
      setStatus({
        online: false,
        baseUrl: urlToCheck || customUrl,
        error: err.message || 'Connection failed',
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleSaveEndpoint = async () => {
    try {
      const updated = await updateOllamaConfig({
        baseUrl: customUrl,
        model: activeLocalModel,
        brainMode,
        autoOfflineFallback: autoFallback,
      });
      onUpdateSettings(updated);
      await checkConnection(customUrl);
    } catch (err) {
      console.error('Failed to save config:', err);
    }
  };

  const handleSelectModel = async (modelName: string) => {
    setActiveLocalModel(modelName);
    onSelectLocalModel(modelName);
    try {
      const updated = await updateOllamaConfig({
        baseUrl: customUrl,
        model: modelName,
        brainMode,
        autoOfflineFallback: autoFallback,
      });
      onUpdateSettings(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const handleBrainModeChange = async (mode: 'cloud' | 'local' | 'auto') => {
    setBrainMode(mode);
    try {
      const updated = await updateOllamaConfig({
        baseUrl: customUrl,
        model: activeLocalModel,
        brainMode: mode,
        autoOfflineFallback: autoFallback,
      });
      onUpdateSettings(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleAutoFallback = async (enabled: boolean) => {
    setAutoFallback(enabled);
    try {
      const updated = await updateOllamaConfig({
        baseUrl: customUrl,
        model: activeLocalModel,
        brainMode,
        autoOfflineFallback: enabled,
      });
      onUpdateSettings(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePullModel = async (modelToPull: string) => {
    const target = modelToPull.trim();
    if (!target) return;
    setIsPulling(true);
    setPullError(null);
    setPullStatusText(`Starting download for ${target}...`);
    setPullProgress(null);

    try {
      await pullOllamaModel(
        target,
        (progress) => {
          if (progress.status) {
            setPullStatusText(progress.status);
          }
          if (progress.completed && progress.total) {
            setPullProgress({ completed: progress.completed, total: progress.total });
          }
        },
        customUrl
      );
      setPullStatusText(`Successfully pulled ${target}!`);
      setPullProgress(null);
      setPullInput('');
      // Refresh models
      await checkConnection();
      handleSelectModel(target);
    } catch (err: any) {
      setPullError(err.message || 'Failed to pull model');
    } finally {
      setIsPulling(false);
    }
  };

  const handleQuickTest = async (modelName: string) => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Respond in 1 sentence: Explain why running local offline AI models provides total privacy.',
          brainMode: 'local',
          ollamaModel: modelName,
          model: modelName,
        }),
      });

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No stream');
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        const lines = text.split('\n\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(line.replace('data: ', ''));
              if (parsed.type === 'chunk') {
                accumulated += parsed.text;
                setTestResult(accumulated);
              } else if (parsed.type === 'error') {
                setTestResult(`Error: ${parsed.error}`);
              }
            } catch {
              // ignore
            }
          }
        }
      }
    } catch (err: any) {
      setTestResult(`Test failed: ${err.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const copyCommand = (cmd: string, id: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) return `${gb.toFixed(2)} GB`;
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const pullPercentage =
    pullProgress && pullProgress.total > 0
      ? Math.round((pullProgress.completed / pullProgress.total) * 100)
      : null;

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-8 max-w-6xl mx-auto">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Local Brain & Offline Studio
                <span className="text-xs px-2 py-0.5 font-medium rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                  Ollama Powered
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Run powerful AI models 100% locally on your machine with zero internet, total data privacy, and instant fallback.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => checkConnection()}
            disabled={isChecking}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
            <span>{isChecking ? 'Testing Connection...' : 'Check Connection'}</span>
          </button>
        </div>
      </div>

      {/* Studio Sub-Navigation */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setSubTab('overview')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
            subTab === 'overview'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Architecture & Models</span>
        </button>

        <button
          onClick={() => setSubTab('resources')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
            subTab === 'resources'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-cyan-500" />
          <span>System Resources (CPU · GPU · RAM)</span>
        </button>

        <button
          onClick={() => setSubTab('pull')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
            subTab === 'pull'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download & Pull</span>
        </button>

        <button
          onClick={() => setSubTab('terminal')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
            subTab === 'terminal'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Terminal Host Setup</span>
        </button>
      </div>

      {subTab === 'resources' && (
        <SystemResources ollamaBaseUrl={customUrl} isOllamaMode={brainMode === 'local'} />
      )}

      {subTab !== 'resources' && (
        <>
      {/* Brain Mode Selector Cards */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs">
          Active Brain Architecture
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Option 1: Auto Hybrid */}
          <div
            onClick={() => handleBrainModeChange('auto')}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
              brainMode === 'auto'
                ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 shadow-sm'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 rounded-lg">
                <RefreshCw className="w-4 h-4" />
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                Recommended
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Auto Hybrid (Seamless)</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Uses Gemini Cloud Brain online; automatically switches to Local Ollama Brain when offline or during high demand.
            </p>
          </div>

          {/* Option 2: Local Brain (Ollama) */}
          <div
            onClick={() => handleBrainModeChange('local')}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
              brainMode === 'local'
                ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 shadow-sm'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 rounded-lg">
                <Cpu className="w-4 h-4" />
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                100% Offline
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Local Brain (Ollama Only)</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Never makes cloud calls. Operates entirely inside your local machine for air-gapped security and private reasoning.
            </p>
          </div>

          {/* Option 3: Cloud Brain (Gemini) */}
          <div
            onClick={() => handleBrainModeChange('cloud')}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
              brainMode === 'cloud'
                ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 shadow-sm'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg">
                <Wifi className="w-4 h-4" />
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Cloud Brain (Gemini)</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Google Gemini 3.8 / 3.1 Flash with real-time web search citations and multi-modal attachment analysis.
            </p>
          </div>
        </div>
      </div>

      {/* Ollama Connection & Endpoint Status */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-3.5 h-3.5 rounded-full ${
                status?.online ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {status?.online ? (
                  <>
                    <span>Ollama Local Daemon Connected</span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      v{status.version} • {status.latencyMs}ms latency
                    </span>
                  </>
                ) : (
                  <>
                    <span>Ollama Not Detected on Localhost</span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                      Offline
                    </span>
                  </>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {status?.online
                  ? `Ready to serve offline inference across ${models.length} installed local model(s).`
                  : 'Start Ollama on your device using `ollama serve` to enable offline local brain.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="http://127.0.0.1:11434"
              className="px-3 py-1.5 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              onClick={handleSaveEndpoint}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors whitespace-nowrap"
            >
              Save & Test
            </button>
          </div>
        </div>

        {/* Setup banner if Ollama is not detected */}
        {!status?.online && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 dark:text-amber-300 space-y-1">
                <p className="font-semibold">How to launch Ollama on your local machine for offline mode:</p>
                <ol className="list-decimal pl-4 space-y-1 text-amber-900/80 dark:text-amber-200/80">
                  <li>
                    Install Ollama: visit{' '}
                    <a href="https://ollama.com" target="_blank" rel="noreferrer" className="underline font-bold">
                      ollama.com
                    </a>{' '}
                    or run the install command below.
                  </li>
                  <li>
                    Start Ollama server with CORS enabled: run <code className="bg-amber-200/60 dark:bg-amber-900/80 px-1 py-0.5 rounded font-mono">OLLAMA_ORIGINS=* ollama serve</code>
                  </li>
                  <li>
                    Pull your first lightweight model: <code className="bg-amber-200/60 dark:bg-amber-900/80 px-1 py-0.5 rounded font-mono">ollama run llama3.2</code>
                  </li>
                  <li>Click &quot;Check Connection&quot; above to begin offline chatting immediately!</li>
                </ol>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={() => copyCommand('OLLAMA_ORIGINS=* ollama serve', 'serve')}
                className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 rounded-md text-slate-800 dark:text-slate-200 hover:bg-amber-100 dark:hover:bg-amber-900/50"
              >
                {copiedCmd === 'serve' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>OLLAMA_ORIGINS=* ollama serve</span>
              </button>
              <button
                onClick={() => copyCommand('ollama run llama3.2', 'pull-l3')}
                className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 rounded-md text-slate-800 dark:text-slate-200 hover:bg-amber-100 dark:hover:bg-amber-900/50"
              >
                {copiedCmd === 'pull-l3' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>ollama run llama3.2</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Installed Local Models & Active Brain Selection */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-indigo-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Installed Local Models ({models.length})
            </h2>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Active Offline Brain: <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{activeLocalModel}</span>
          </span>
        </div>

        {models.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
            <Cpu className="w-8 h-8 mx-auto text-slate-400" />
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
              No local models found in your Ollama library yet.
            </p>
            <p className="text-[11px] text-slate-500">
              Pick a recommended model below or type a model tag to pull it directly onto your computer.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {models.map((m) => {
              const isActive = activeLocalModel === m.name;
              return (
                <div
                  key={m.digest || m.name}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isActive
                      ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/40 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs font-mono text-slate-900 dark:text-white">
                          {m.name}
                        </span>
                        {isActive && (
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.5 rounded">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Active Brain</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                        <span>Size: {formatBytes(m.size)}</span>
                        {m.details?.parameter_size && <span>Params: {m.details.parameter_size}</span>}
                        {m.details?.quantization_level && <span>Quant: {m.details.quantization_level}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {!isActive && (
                        <button
                          onClick={() => handleSelectModel(m.name)}
                          className="px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-md transition-colors"
                        >
                          Use Model
                        </button>
                      )}
                      <button
                        onClick={() => handleQuickTest(m.name)}
                        disabled={isTesting}
                        className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        title="Run quick test prompt"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onStartChatWithModel(`ollama:${m.name}`)}
                        className="px-2.5 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
                      >
                        Start Chat
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Quick test output if triggered */}
        {testResult && (
          <div className="p-3 bg-slate-950 text-emerald-400 rounded-xl font-mono text-xs border border-slate-800 space-y-1">
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>Local Brain Test Output:</span>
              <button onClick={() => setTestResult(null)} className="text-slate-500 hover:text-white">✕</button>
            </div>
            <p className="whitespace-pre-wrap">{testResult}</p>
          </div>
        )}
      </div>

      {/* Pull / Download New Model section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-indigo-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Pull Offline Models to Local Machine
            </h2>
          </div>
          <span className="text-xs text-slate-500">Fast streaming pull with live verification</span>
        </div>

        {/* Preset quick buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PRESET_MODELS.map((preset) => {
            const isInstalled = models.some(m => m.name.startsWith(preset.name) || m.name === preset.name);
            return (
              <div
                key={preset.name}
                className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-2"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs font-mono text-slate-900 dark:text-white">
                      {preset.name}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">{preset.size}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    {preset.desc}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    {preset.category}
                  </span>

                  {isInstalled ? (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      <Check className="w-3.5 h-3.5" />
                      <span>Ready</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handlePullModel(preset.name)}
                      disabled={isPulling}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      <span>Pull</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Custom pull input */}
        <div className="pt-2 flex items-center gap-2">
          <input
            type="text"
            value={pullInput}
            onChange={(e) => setPullInput(e.target.value)}
            placeholder="Or type custom model name (e.g. llama3.2:1b, deepseek-r1:7b, codellama:7b)..."
            className="flex-1 px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            onClick={() => handlePullModel(pullInput)}
            disabled={isPulling || !pullInput.trim()}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isPulling ? 'Pulling...' : 'Pull Model'}</span>
          </button>
        </div>

        {/* Pull Progress indicator */}
        {isPulling && (
          <div className="p-4 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-indigo-900 dark:text-indigo-200">
              <span>{pullStatusText}</span>
              {pullPercentage !== null && <span>{pullPercentage}%</span>}
            </div>

            {pullPercentage !== null && (
              <div className="w-full bg-indigo-200 dark:bg-indigo-900 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${pullPercentage}%` }}
                />
              </div>
            )}
          </div>
        )}

        {pullError && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300">
            {pullError}
          </div>
        )}
      </div>

      {/* 100% Offline Autonomy Matrix */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xs">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            100% Offline Capability Matrix
          </h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Honore Assistant is architected to operate with complete independence from cloud services:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Offline Reasoning Brain</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Ollama runs local LLMs directly on GPU or CPU without sending a single byte outside.
            </p>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Native Python & Bash Studio</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Executes Python 3.10 and Bash scripts locally on host with sub-second turnaround.
            </p>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Relational SQL Engine</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              In-memory and file-persisted SQLite database tables for querying and reporting.
            </p>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Persistent Memory Vault</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              User preferences, project architecture, and facts stored in local database files.
            </p>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Document & File Studio</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Create, read, edit, and export Markdown, CSV, TXT, and JSON files completely offline.
            </p>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Task & Workflow Engine</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Track multi-step pipelines and productivity kanban boards locally.
            </p>
          </div>
        </div>
      </div>
      </>
      )}
    </div>
  );
};
