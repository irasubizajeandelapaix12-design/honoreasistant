import {
  MessageSquare,
  Code2,
  Globe,
  FileText,
  Database,
  CheckSquare,
  Zap,
  Brain,
  LayoutDashboard,
  Mic,
  Moon,
  Sun,
  Settings as SettingsIcon,
  Cpu,
  Wifi,
  WifiOff,
  Crosshair,
  Dna,
  Sparkles,
  Activity,
} from 'lucide-react';
import { WorkspaceTab, OllamaStatus } from '../types/index.js';

interface TopBarProps {
  currentTab: WorkspaceTab;
  onSelectTab: (tab: WorkspaceTab) => void;
  onOpenVoice: () => void;
  onOpenSettings: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  selectedModel: string;
  isOffline?: boolean;
  brainMode?: 'cloud' | 'local' | 'auto';
  ollamaStatus?: OllamaStatus | null;
  activeOllamaModel?: string;
  onToggleBrainMode?: (mode: 'cloud' | 'local' | 'auto') => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentTab,
  onSelectTab,
  onOpenVoice,
  onOpenSettings,
  isDark,
  onToggleTheme,
  selectedModel,
  isOffline = false,
  brainMode = 'auto',
  ollamaStatus,
  activeOllamaModel = 'llama3.2',
  onToggleBrainMode,
}) => {
  const navItems: Array<{ id: WorkspaceTab; label: string; icon: React.ElementType }> = [
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'ollama', label: 'Local Brain (Ollama)', icon: Cpu },
    { id: 'resources', label: 'System Resources', icon: Activity },
    { id: 'game', label: '3D Game', icon: Crosshair },
    { id: 'media', label: 'Media Studio', icon: Sparkles },
    { id: 'science', label: 'Bioscience', icon: Dna },
    { id: 'code', label: 'Code Studio', icon: Code2 },
    { id: 'research', label: 'Research', icon: Globe },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'database', label: 'Database', icon: Database },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'automations', label: 'Automations', icon: Zap },
    { id: 'memory', label: 'Memory Vault', icon: Brain },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ];

  return (
    <header className="flex items-center justify-between gap-6 px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md sticky top-0 z-40 transition-colors">
      {/* Zone 1: Single text element wordmark with offline/brain badge */}
      <div className="flex items-center gap-3 shrink-0">
        <img
          src="/src/assets/images/aether_ai_avatar_1793733456853.jpg"
          alt="Honore Assistant Insignia"
          referrerPolicy="no-referrer"
          className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-200 dark:ring-slate-700 shadow-sm"
        />
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
              Honore Assistant
            </span>

            {/* Offline or Local Brain Badge */}
            {isOffline ? (
              <button
                onClick={() => onSelectTab('ollama')}
                className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800 animate-pulse"
                title="Internet is offline. Operating fully on Local Brain (Ollama)!"
              >
                <WifiOff className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                <span>Offline • Ollama</span>
              </button>
            ) : brainMode === 'local' ? (
              <button
                onClick={() => onSelectTab('ollama')}
                className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                title="Using Local Brain (Ollama) for 100% private offline inference"
              >
                <Cpu className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>Local: {activeOllamaModel}</span>
              </button>
            ) : ollamaStatus?.online ? (
              <button
                onClick={() => onSelectTab('ollama')}
                className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                title="Ollama local daemon detected & ready for offline fallback"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Ollama Ready</span>
              </button>
            ) : null}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums leading-none">
              {brainMode === 'local' ? `ollama:${activeOllamaModel}` : selectedModel}
            </span>
          </div>
        </div>
      </div>

      {/* Zone 2: Single-line navigation links */}
      <nav className="hidden lg:flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Zone 3: Primary action & controls */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Quick Brain Mode Switcher */}
        {onToggleBrainMode && (
          <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[11px] font-semibold border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => onToggleBrainMode('auto')}
              className={`px-2 py-1 rounded-md transition-colors ${
                brainMode === 'auto'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Auto: Cloud online, automatically falls back to local Ollama offline"
            >
              Auto
            </button>
            <button
              onClick={() => onToggleBrainMode('local')}
              className={`px-2 py-1 rounded-md transition-colors flex items-center gap-1 ${
                brainMode === 'local'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Local: 100% offline via local Ollama brain"
            >
              <Cpu className="w-3 h-3" />
              <span>Ollama</span>
            </button>
            <button
              onClick={() => onToggleBrainMode('cloud')}
              className={`px-2 py-1 rounded-md transition-colors ${
                brainMode === 'cloud'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Cloud: Gemini models"
            >
              Cloud
            </button>
          </div>
        )}

        <button
          onClick={onOpenVoice}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-lg shadow-xs transition-colors whitespace-nowrap"
          title="Open hands-free voice companion"
        >
          <Mic className="w-3.5 h-3.5" />
          <span>Voice Companion</span>
        </button>

        <button
          onClick={onToggleTheme}
          className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle theme"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <button
          onClick={onOpenSettings}
          className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title="Settings & System Configuration"
          aria-label="Open settings"
        >
          <SettingsIcon className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

