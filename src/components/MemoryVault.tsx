import React, { useState, useEffect } from 'react';
import { Brain, Plus, Trash2, Edit2, Search, Check, X, Shield, Sparkles } from 'lucide-react';
import { MemoryItem } from '../types/index.js';
import { fetchMemories, createMemory, updateMemory, deleteMemory } from '../services/api.js';

export const MemoryVault: React.FC = () => {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [category, setCategory] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMemory, setEditingMemory] = useState<MemoryItem | null>(null);

  // Add form state
  const [newKey, setNewKey] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<'preference' | 'project' | 'fact' | 'instruction'>('fact');

  const loadMemories = async () => {
    try {
      const data = await fetchMemories(query, category);
      setMemories(data);
    } catch (err) {
      console.error('Failed to load memories:', err);
    }
  };

  useEffect(() => {
    loadMemories();
  }, [category, query]);

  const handleToggleActive = async (mem: MemoryItem) => {
    try {
      const updated = await updateMemory(mem.id, { active: !mem.active });
      setMemories(prev => prev.map(m => (m.id === mem.id ? updated : m)));
    } catch (err) {
      console.error('Error toggling memory:', err);
    }
  };

  const handleCreate = async () => {
    if (!newKey.trim() || !newContent.trim()) return;
    try {
      const created = await createMemory({
        key: newKey.trim(),
        content: newContent.trim(),
        category: newCategory,
      });
      setMemories(prev => [created, ...prev]);
      setShowAddModal(false);
      setNewKey('');
      setNewContent('');
    } catch (err) {
      console.error('Error creating memory:', err);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingMemory) return;
    try {
      const updated = await updateMemory(editingMemory.id, {
        key: editingMemory.key,
        content: editingMemory.content,
        category: editingMemory.category,
      });
      setMemories(prev => prev.map(m => (m.id === updated.id ? updated : m)));
      setEditingMemory(null);
    } catch (err) {
      console.error('Error updating memory:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this memory record?')) return;
    await deleteMemory(id);
    setMemories(prev => prev.filter(m => m.id !== id));
  };

  const categories = [
    { id: 'all', label: 'All Memories' },
    { id: 'preference', label: 'Preferences' },
    { id: 'project', label: 'Projects' },
    { id: 'instruction', label: 'Instructions' },
    { id: 'fact', label: 'Facts' },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-57px)] w-full overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6 sm:p-8">
      <div className="max-w-5xl mx-auto w-full space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-semibold uppercase tracking-wider">
              <Brain className="w-4 h-4" />
              <span>Personal Knowledge & Context</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
              Persistent Memory Vault
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
              Aether retains project states, preferred coding styles, and instructions across conversations. Active memories are injected directly into context.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Store New Memory</span>
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  category === cat.id
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search memories..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Memories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {memories.length === 0 ? (
            <div className="col-span-2 p-12 text-center text-xs text-slate-400 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl">
              No memories found matching current criteria
            </div>
          ) : (
            memories.map(mem => (
              <div
                key={mem.id}
                className={`p-5 rounded-xl border transition-all ${
                  mem.active
                    ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs'
                    : 'bg-slate-100/60 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-850 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {mem.key}
                      </h3>
                      <span className="text-[10px] text-slate-500 font-mono uppercase">
                        · {mem.category}
                      </span>
                    </div>
                  </div>

                  {/* Toggle Active Switch */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(mem)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                        mem.active ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                      title={mem.active ? 'Active in AI context' : 'Inactive'}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          mem.active ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>

                    <button
                      onClick={() => setEditingMemory(mem)}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
                      title="Edit memory"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(mem.id)}
                      className="p-1 text-slate-400 hover:text-red-500 rounded"
                      title="Delete memory"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                  {mem.content}
                </p>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 font-mono tabular-nums">
                  <span>Confidence: {(mem.confidence * 100).toFixed(0)}%</span>
                  <span>Updated: {new Date(mem.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Memory Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Store New Memory</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Identifier / Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Preferred Python Framework"
                  value={newKey}
                  onChange={e => setNewKey(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                >
                  <option value="preference">User Preference</option>
                  <option value="project">Ongoing Project</option>
                  <option value="instruction">System Instruction</option>
                  <option value="fact">General Fact</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Knowledge / Content to Remember
                </label>
                <textarea
                  rows={4}
                  placeholder="Describe the detail you want Aether to always keep in mind..."
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newKey.trim() || !newContent.trim()}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-40"
              >
                Commit to Memory
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Memory Modal */}
      {editingMemory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Edit Memory Record</h3>
              <button onClick={() => setEditingMemory(null)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Title / Key
                </label>
                <input
                  type="text"
                  value={editingMemory.key}
                  onChange={e => setEditingMemory({ ...editingMemory, key: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Content
                </label>
                <textarea
                  rows={4}
                  value={editingMemory.content}
                  onChange={e => setEditingMemory({ ...editingMemory, content: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingMemory(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
