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
  Crosshair,
  Dna,
  Sparkles,
} from 'lucide-react';
import { WorkspaceTab } from '../types/index.js';

interface TopBarProps {
  currentTab: WorkspaceTab;
  onSelectTab: (tab: WorkspaceTab) => void;
  onOpenVoice: () => void;
  onOpenSettings: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  selectedModel: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentTab,
  onSelectTab,
  onOpenVoice,
  onOpenSettings,
  isDark,
  onToggleTheme,
  selectedModel,
}) => {
  const navItems: Array<{ id: WorkspaceTab; label: string; icon: React.ElementType }> = [
    { id: 'chat', label: 'Chat', icon: MessageSquare },
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
      {/* Zone 1: Wordmark */}
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
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums leading-none">
              {selectedModel}
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

