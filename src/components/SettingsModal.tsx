import React, { useState, useEffect } from 'react';
import { Settings, X, Save, Download, Shield, Sparkles, Sliders, Check } from 'lucide-react';
import { UserSettings } from '../types/index.js';
import { fetchSettings, updateSettings } from '../services/api.js';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (settings: UserSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchSettings().then(setSettings);
    }
  }, [isOpen]);

  if (!isOpen || !settings) return null;

  const handleSave = async () => {
    try {
      const updated = await updateSettings(settings);
      setSettings(updated);
      onSaved(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (err) {
      console.error('Error saving settings:', err);
    }
  };

  const handleExportData = async () => {
    try {
      const res = await fetch('/api/stats');
      const stats = await res.json();
      const exportObj = {
        exportedAt: new Date().toISOString(),
        settings,
        stats,
      };

      const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Aether_System_Backup_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              System Settings & Administration
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5 text-xs">
          {/* AI Model */}
          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-800 dark:text-slate-200">
              Active Cognitive Model (Cloud)
            </label>
            <select
              value={settings.defaultModel}
              onChange={e => setSettings({ ...settings, defaultModel: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
            >
              <option value="gemini-3.8-flash">gemini-3.8-flash (Recommended, Real-time & Grounded)</option>
              <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Ultra Fast, Low-latency)</option>
            </select>
            <span className="text-[11px] text-slate-500">
              Used when Cloud Brain is active or during online queries.
            </span>
          </div>

          {/* Brain Architecture & Ollama Configuration */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900 dark:text-white">Brain Architecture Mode</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                Offline Ready
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSettings({ ...settings, brainMode: 'auto' })}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  (settings.brainMode || 'auto') === 'auto'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                Auto (Hybrid)
              </button>
              <button
                type="button"
                onClick={() => setSettings({ ...settings, brainMode: 'local' })}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  settings.brainMode === 'local'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                Local (Ollama)
              </button>
              <button
                type="button"
                onClick={() => setSettings({ ...settings, brainMode: 'cloud' })}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  settings.brainMode === 'cloud'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                Cloud (Gemini)
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                  Ollama Base URL
                </label>
                <input
                  type="text"
                  value={settings.ollamaBaseUrl || 'http://127.0.0.1:11434'}
                  onChange={e => setSettings({ ...settings, ollamaBaseUrl: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                  Default Local Model
                </label>
                <input
                  type="text"
                  value={settings.ollamaModel || 'llama3.2'}
                  onChange={e => setSettings({ ...settings, ollamaModel: e.target.value })}
                  placeholder="llama3.2"
                  className="w-full px-2.5 py-1.5 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={settings.autoOfflineFallback !== false}
                onChange={e => setSettings({ ...settings, autoOfflineFallback: e.target.checked })}
                className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-0"
              />
              <span className="text-[11px] text-slate-600 dark:text-slate-400">
                Automatically fallback to local Ollama when offline or network drops
              </span>
            </label>
          </div>


          {/* Response Style & Language */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-800 dark:text-slate-200">
                Response Style
              </label>
              <select
                value={settings.responseStyle}
                onChange={e => setSettings({ ...settings, responseStyle: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              >
                <option value="balanced">Balanced & Thorough</option>
                <option value="precise">Precise & Mathematical</option>
                <option value="concise">Concise & Executive</option>
                <option value="creative">Creative & Visionary</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-800 dark:text-slate-200">
                Default Language
              </label>
              <select
                value={settings.defaultLanguage}
                onChange={e => setSettings({ ...settings, defaultLanguage: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              >
                <option value="English">English</option>
                <option value="Kinyarwanda">Kinyarwanda</option>
                <option value="French">Français (French)</option>
                <option value="Swahili">Kiswahili</option>
                <option value="Spanish">Español</option>
              </select>
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl cursor-pointer">
              <div>
                <div className="font-semibold text-slate-900 dark:text-white">
                  Persistent Memory Context
                </div>
                <div className="text-[11px] text-slate-500">
                  Allow AI to recall user preferences and past project decisions
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.enableMemory}
                onChange={e => setSettings({ ...settings, enableMemory: e.target.checked })}
                className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl cursor-pointer">
              <div>
                <div className="font-semibold text-slate-900 dark:text-white">
                  Google Search Grounding
                </div>
                <div className="text-[11px] text-slate-500">
                  Verify answers against real-time web documents with citation links
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.enableGrounding}
                onChange={e => setSettings({ ...settings, enableGrounding: e.target.checked })}
                className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-0"
              />
            </label>
          </div>

          {/* Custom Persona Instruction */}
          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-800 dark:text-slate-200">
              Custom Persona & Directives
            </label>
            <textarea
              rows={3}
              value={settings.customSystemPrompt}
              onChange={e => setSettings({ ...settings, customSystemPrompt: e.target.value })}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono text-[11px] resize-none"
            />
          </div>

          {/* Backup */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-800 dark:text-slate-200">
                Data Sovereignty & Backup
              </div>
              <div className="text-[11px] text-slate-500">Export database snapshot as JSON</div>
            </div>
            <button
              onClick={handleExportData}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg transition-colors font-medium"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download JSON</span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
          <div>
            {savedSuccess && (
              <span className="flex items-center gap-1 text-emerald-500 text-xs font-medium">
                <Check className="w-3.5 h-3.5" />
                <span>Settings saved successfully</span>
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              Close
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Preferences</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
