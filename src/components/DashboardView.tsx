import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Code2,
  Globe,
  FileText,
  Database,
  Brain,
  Zap,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { WorkspaceTab, SystemStats } from '../types/index.js';
import { fetchStats } from '../services/api.js';

interface DashboardViewProps {
  onSelectTab: (tab: WorkspaceTab) => void;
  onStartChat: (prompt?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onSelectTab, onStartChat }) => {
  const [stats, setStats] = useState<SystemStats | null>(null);

  useEffect(() => {
    fetchStats()
      .then(setStats)
      .catch(err => console.error('Error fetching stats:', err));
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-57px)] w-full overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6 sm:p-8">
      <div className="max-w-6xl mx-auto w-full space-y-8">
        {/* Hero Section */}
        <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 text-white shadow-md">
          <div className="absolute inset-0">
            <img
              src="/src/assets/images/digital_workspace_hero_1793733456779.jpg"
              alt="Aether Command Center"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover opacity-35"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
          </div>

          <div className="relative p-8 sm:p-10 max-w-2xl space-y-4">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Autonomous Engineering & Knowledge Nexus</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Honore Assistant Intelligence Suite
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Equipped with Google Search grounding, client/server code sandboxing, relational SQL database execution, and persistent memory across sessions.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => onStartChat('Help me architect an autonomous multi-step application')}
                className="px-5 py-2.5 text-xs font-semibold text-slate-950 bg-white hover:bg-slate-100 rounded-lg shadow-sm transition-colors flex items-center gap-2"
              >
                <span>Initiate Assistant Chat</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onSelectTab('code')}
                className="px-5 py-2.5 text-xs font-semibold text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-lg transition-colors flex items-center gap-2"
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Launch Code Studio</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4-Column KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Total Conversations</span>
              <MessageSquare className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {stats?.totalConversations ?? 1}
            </div>
            <div className="text-[11px] text-slate-400">Multi-turn sessions recorded</div>
          </div>

          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Active Memory Units</span>
              <Brain className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {stats?.activeMemories ?? 3}
            </div>
            <div className="text-[11px] text-slate-400">Injected into conversation context</div>
          </div>

          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Managed Tasks</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {stats?.totalTasks ?? 3}
            </div>
            <div className="text-[11px] text-slate-400">
              {stats?.completedTasks ?? 1} completed
            </div>
          </div>

          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Selected Engine</span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-sm font-bold font-mono text-slate-900 dark:text-white truncate pt-1">
              {stats?.selectedModel || 'gemini-3.8-flash'}
            </div>
            <div className="text-[11px] text-slate-400">Google GenAI Grounded</div>
          </div>
        </div>

        {/* Action Hub */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Workspace Hub & Tool Modules
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                id: 'code' as WorkspaceTab,
                title: 'Code Studio & Sandbox',
                desc: 'Generate, test, analyze, and run JavaScript, TypeScript, and HTML code in real-time.',
                icon: Code2,
              },
              {
                id: 'research' as WorkspaceTab,
                title: 'Live Internet Research',
                desc: 'Deep multi-source research with Google Search citations and executive synthesis.',
                icon: Globe,
              },
              {
                id: 'documents' as WorkspaceTab,
                title: 'Document Creator',
                desc: 'Generate, format, download, and analyze Markdown, CSV, JSON, and PDF reports.',
                icon: FileText,
              },
              {
                id: 'database' as WorkspaceTab,
                title: 'Relational Database Studio',
                desc: 'Query, inspect, and optimize SQL schemas with real query execution.',
                icon: Database,
              },
              {
                id: 'automations' as WorkspaceTab,
                title: 'Autonomous Workflows',
                desc: 'Trigger multi-step pipelines for deep research, code review, and productivity.',
                icon: Zap,
              },
              {
                id: 'memory' as WorkspaceTab,
                title: 'Memory Vault',
                desc: 'Inspect and control permanent user facts, technical instructions, and preferences.',
                icon: Brain,
              },
            ].map(card => {
              const Icon = card.icon;
              return (
                <div
                  key={card.id}
                  onClick={() => onSelectTab(card.id)}
                  className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-indigo-500 dark:hover:border-indigo-500 cursor-pointer transition-all shadow-xs group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                      <Icon className="w-5 h-5" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {card.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
