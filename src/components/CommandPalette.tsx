import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  MessageSquare,
  MapPin,
  Crosshair,
  Sparkles,
  Dna,
  Code2,
  Globe,
  FileText,
  Database,
  CheckSquare,
  Zap,
  Brain,
  LayoutDashboard,
  Settings as SettingsIcon,
  Mic,
  Moon,
  Sun,
  ArrowRight,
  CornerDownLeft,
  X,
  History,
} from 'lucide-react';
import { WorkspaceTab, Conversation } from '../types/index.js';

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  category: 'Navigation' | 'Actions' | 'Conversations';
  icon: React.ElementType;
  shortcut?: string;
  onSelect: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: WorkspaceTab) => void;
  onNewChat: () => void;
  onOpenVoice: () => void;
  onOpenSettings: () => void;
  onToggleTheme: () => void;
  isDark: boolean;
  conversations: Conversation[];
  onSelectConversation: (id: string) => void;
  onAskAi: (query: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  onNewChat,
  onOpenVoice,
  onOpenSettings,
  onToggleTheme,
  isDark,
  conversations,
  onSelectConversation,
  onAskAi,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Reset query and focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const allItems: CommandItem[] = useMemo(() => {
    const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const mod = isMac ? '⌘' : 'Ctrl+';

    const navItems: CommandItem[] = [
      {
        id: 'tab-chat',
        title: 'Chat Assistant',
        subtitle: 'Multi-turn intelligent companion, code review & reasoning',
        category: 'Navigation',
        icon: MessageSquare,
        shortcut: `${mod}1`,
        onSelect: () => onSelectTab('chat'),
      },
      {
        id: 'tab-maps',
        title: 'Maps Studio & Location Intelligence',
        subtitle: 'Interactive Google Maps with AI research hubs & routes',
        category: 'Navigation',
        icon: MapPin,
        shortcut: `${mod}2`,
        onSelect: () => onSelectTab('maps'),
      },
      {
        id: 'tab-game',
        title: '3D Arcade Defense Game',
        subtitle: 'Interactive Three.js space shooter & model inspector',
        category: 'Navigation',
        icon: Crosshair,
        shortcut: `${mod}3`,
        onSelect: () => onSelectTab('game'),
      },
      {
        id: 'tab-media',
        title: 'Media Studio',
        subtitle: 'Music (Lyria), Images (Banana), Video (Omni), & Transcriptions',
        category: 'Navigation',
        icon: Sparkles,
        shortcut: `${mod}4`,
        onSelect: () => onSelectTab('media'),
      },
      {
        id: 'tab-science',
        title: 'Bioscience Lab',
        subtitle: 'AlphaFold 3D protein viewer, PubChem molecules & scientific literature',
        category: 'Navigation',
        icon: Dna,
        shortcut: `${mod}5`,
        onSelect: () => onSelectTab('science'),
      },
      {
        id: 'tab-code',
        title: 'Code Studio',
        subtitle: 'Multi-language sandbox with live execution & templates',
        category: 'Navigation',
        icon: Code2,
        shortcut: `${mod}6`,
        onSelect: () => onSelectTab('code'),
      },
      {
        id: 'tab-research',
        title: 'Research Studio',
        subtitle: 'Deep research reports & Google Search data grounding',
        category: 'Navigation',
        icon: Globe,
        shortcut: `${mod}7`,
        onSelect: () => onSelectTab('research'),
      },
      {
        id: 'tab-documents',
        title: 'Documents Studio',
        subtitle: 'Executive document generator and file analysis',
        category: 'Navigation',
        icon: FileText,
        shortcut: `${mod}8`,
        onSelect: () => onSelectTab('documents'),
      },
      {
        id: 'tab-database',
        title: 'Database Studio',
        subtitle: 'Interactive SQL studio, schema explorer & queries',
        category: 'Navigation',
        icon: Database,
        shortcut: `${mod}9`,
        onSelect: () => onSelectTab('database'),
      },
      {
        id: 'tab-tasks',
        title: 'Tasks Board',
        subtitle: 'Kanban board & daily productivity schedule builder',
        category: 'Navigation',
        icon: CheckSquare,
        onSelect: () => onSelectTab('tasks'),
      },
      {
        id: 'tab-automations',
        title: 'Automations Studio',
        subtitle: 'Scheduled recurring triggers & multi-step workflows',
        category: 'Navigation',
        icon: Zap,
        onSelect: () => onSelectTab('automations'),
      },
      {
        id: 'tab-memory',
        title: 'Memory Vault',
        subtitle: 'Long-term preference and personalized knowledge store',
        category: 'Navigation',
        icon: Brain,
        onSelect: () => onSelectTab('memory'),
      },
      {
        id: 'tab-dashboard',
        title: 'System Dashboard',
        subtitle: 'Workspace metrics, model statistics & quick access',
        category: 'Navigation',
        icon: LayoutDashboard,
        onSelect: () => onSelectTab('dashboard'),
      },
    ];

    const actionItems: CommandItem[] = [
      {
        id: 'action-new-chat',
        title: 'Start New Chat Session',
        subtitle: 'Clear active conversation thread and start fresh',
        category: 'Actions',
        icon: MessageSquare,
        onSelect: onNewChat,
      },
      {
        id: 'action-voice',
        title: 'Launch Voice Companion',
        subtitle: 'Real-time conversational voice assistant with audio spectrum',
        category: 'Actions',
        icon: Mic,
        onSelect: onOpenVoice,
      },
      {
        id: 'action-theme',
        title: isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme',
        subtitle: `Currently in ${isDark ? 'Dark' : 'Light'} appearance mode`,
        category: 'Actions',
        icon: isDark ? Sun : Moon,
        onSelect: onToggleTheme,
      },
      {
        id: 'action-settings',
        title: 'Preferences & System Settings',
        subtitle: 'Configure default model, temperature, voice & memory',
        category: 'Actions',
        icon: SettingsIcon,
        onSelect: onOpenSettings,
      },
    ];

    const convItems: CommandItem[] = (conversations || []).slice(0, 8).map(conv => ({
      id: `conv-${conv.id}`,
      title: conv.title,
      subtitle: `${conv.category.toUpperCase()} · ${new Date(conv.updatedAt).toLocaleDateString()}`,
      category: 'Conversations' as const,
      icon: History,
      onSelect: () => {
        onSelectTab('chat');
        onSelectConversation(conv.id);
      },
    }));

    return [...actionItems, ...navItems, ...convItems];
  }, [conversations, isDark, onSelectTab, onNewChat, onOpenVoice, onOpenSettings, onToggleTheme, onSelectConversation]);

  // Filter items by query
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allItems;
    return allItems.filter(
      item =>
        item.title.toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
        item.category.toLowerCase().includes(q)
    );
  }, [allItems, query]);

  // Adjust selectedIndex if it exceeds bounds
  useEffect(() => {
    if (selectedIndex >= filteredItems.length) {
      setSelectedIndex(Math.max(0, filteredItems.length - 1));
    }
  }, [filteredItems, selectedIndex]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector('[data-selected="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  // Keyboard navigation within the palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < filteredItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : filteredItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].onSelect();
        onClose();
      } else if (query.trim()) {
        // Fallback: Send raw query straight to AI
        onAskAi(query.trim());
        onClose();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] transition-all"
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command, search workspaces, or ask Honore AI..."
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
              ESC
            </span>
          )}
        </div>

        {/* Results List */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="py-8 px-4 text-center">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                No matching workspace or command found for &ldquo;{query}&rdquo;
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Press <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">Enter</span> to send this inquiry directly to Honore Assistant.
              </p>
              <button
                onClick={() => {
                  onAskAi(query);
                  onClose();
                }}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition"
              >
                <span>Ask AI</span>
                <CornerDownLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  data-selected={isSelected}
                  onClick={() => {
                    item.onSelect();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl cursor-pointer text-left transition-colors ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-slate-900 dark:text-white'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate flex items-center gap-2">
                        <span>{item.title}</span>
                        <span className="text-[10px] font-normal text-slate-400 dark:text-slate-500">
                          {item.category}
                        </span>
                      </div>
                      {item.subtitle && (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {item.subtitle}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.shortcut && (
                      <kbd className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs">
                        {item.shortcut}
                      </kbd>
                    )}
                    {isSelected && (
                      <ArrowRight className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Hint Bar */}
        <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">
                ↑
              </kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">
                ↓
              </kbd>
              <span>to navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">
                ↵
              </kbd>
              <span>to select</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span>Direct Jump:</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">
              ⌘1-9
            </kbd>
          </div>
        </div>
      </div>
    </div>
  );
};
