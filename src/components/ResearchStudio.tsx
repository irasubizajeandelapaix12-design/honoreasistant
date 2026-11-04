import React, { useState } from 'react';
import { Globe, Search, ExternalLink, Download, Sparkles, BookOpen, Clock } from 'lucide-react';
import { createDocument } from '../services/api.js';

interface ResearchStudioProps {
  onStartSearchChat: (query: string) => void;
}

export const ResearchStudio: React.FC<ResearchStudioProps> = ({ onStartSearchChat }) => {
  const [query, setQuery] = useState('');
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const presets = [
    {
      title: 'Autonomous Multi-Agent Systems in 2026',
      desc: 'Investigate recent architectures, tool-use coordination, and enterprise deployments.',
    },
    {
      title: 'Post-Quantum Cryptography NIST Standards',
      desc: 'Examine ML-KEM, ML-DSA algorithms and enterprise migration blueprints.',
    },
    {
      title: 'Solid-State Battery Breakthroughs & Grid Storage',
      desc: 'Benchmark energy density, charging cycles, and production scale metrics.',
    },
    {
      title: 'Next-Gen WebAssembly & Edge AI Runtimes',
      desc: 'Analyze WASI 0.2 capabilities, sub-millisecond cold starts, and SIMD performance.',
    },
  ];

  const handleRunSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    onStartSearchChat(`Conduct thorough internet research with verified citations on: ${searchQuery}`);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-57px)] w-full overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6 sm:p-8">
      <div className="max-w-4xl mx-auto w-full space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <Globe className="w-4 h-4" />
            <span>Internet Research Studio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Grounded Intelligence & Deep Verification
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
            Query live internet sources using Google Search grounding. Aether synthesizes multiple authoritative sources, validates claims, and provides direct web citations.
          </p>
        </div>

        {/* Search Bar */}
        <div className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleRunSearch(query)}
            placeholder="Enter research query, documentation topic, or recent event..."
            className="flex-1 bg-transparent py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden"
          />
          <button
            onClick={() => handleRunSearch(query)}
            disabled={!query.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg disabled:opacity-40 transition-colors shrink-0 shadow-xs"
          >
            <Sparkles className="w-4 h-4" />
            <span>Initiate Research</span>
          </button>
        </div>

        {/* Presets Grid */}
        <div className="space-y-3">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Suggested Deep Research Topics
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {presets.map((preset, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setQuery(preset.title);
                  handleRunSearch(preset.title);
                }}
                className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-indigo-500 dark:hover:border-indigo-500 cursor-pointer transition-all shadow-xs group"
              >
                <div className="flex items-start justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {preset.title}
                  </h3>
                  <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 shrink-0 ml-2" />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                  {preset.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Feature Capabilities Adjacency */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">Multi-Source Verification</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Synthesizes academic journals, live technical documentation, and credible news feeds into an unbiased executive summary.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <ExternalLink className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">Direct Grounding Citations</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Every critical quantitative claim and quotation is attributed to verified URLs with direct clickable links.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Download className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">1-Click Document Export</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Automatically packages research findings into structured Markdown briefs or formatted documents in the Document Library.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
