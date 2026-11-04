import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Download,
  Trash2,
  Search,
  Sparkles,
  Printer,
  Copy,
  Check,
  Upload,
} from 'lucide-react';
import { DocumentItem } from '../types/index.js';
import { fetchDocuments, createDocument, deleteDocument } from '../services/api.js';
import { MarkdownRenderer } from './MarkdownRenderer.js';

interface DocumentStudioProps {
  onAnalyzeDocumentInChat: (doc: DocumentItem) => void;
}

export const DocumentStudio: React.FC<DocumentStudioProps> = ({ onAnalyzeDocumentInChat }) => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // New doc form
  const [newDocName, setNewDocName] = useState('');
  const [newDocType, setNewDocType] = useState('markdown');
  const [newDocContent, setNewDocContent] = useState('');
  const [newDocSummary, setNewDocSummary] = useState('');

  const loadDocs = async () => {
    try {
      const docs = await fetchDocuments();
      setDocuments(docs);
      if (docs.length > 0 && !selectedDoc) {
        setSelectedDoc(docs[0]);
      }
    } catch (err) {
      console.error('Failed to load documents:', err);
    }
  };

  useEffect(() => {
    loadDocs();
  }, []);

  const handleCreate = async () => {
    if (!newDocName.trim() || !newDocContent.trim()) return;
    try {
      const doc = await createDocument(newDocName.trim(), newDocContent, newDocType, newDocSummary);
      setDocuments(prev => [doc, ...prev]);
      setSelectedDoc(doc);
      setShowCreateModal(false);
      setNewDocName('');
      setNewDocContent('');
      setNewDocSummary('');
    } catch (err) {
      console.error('Error creating document:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    await deleteDocument(id);
    const updated = documents.filter(d => d.id !== id);
    setDocuments(updated);
    if (selectedDoc?.id === id) {
      setSelectedDoc(updated[0] || null);
    }
  };

  const handleDownload = (doc: DocumentItem) => {
    const mimeTypes: Record<string, string> = {
      markdown: 'text/markdown',
      csv: 'text/csv',
      json: 'application/json',
      html: 'text/html',
      text: 'text/plain',
    };
    const blob = new Blob([doc.content], { type: mimeTypes[doc.type] || 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintPdf = () => {
    window.print();
  };

  const filteredDocs = documents.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    (d.summary || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-57px)] w-full overflow-hidden bg-white dark:bg-slate-950">
      {/* Sidebar: Document List */}
      <aside className="w-80 shrink-0 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/60 dark:bg-slate-900/60">
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Document Library
            </span>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Doc</span>
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search documents..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredDocs.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">No documents found</div>
          ) : (
            filteredDocs.map(doc => {
              const isSelected = selectedDoc?.id === doc.id;
              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className={`group p-2.5 rounded-lg text-xs cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 shadow-xs'
                      : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span className="font-semibold text-slate-900 dark:text-white truncate">
                        {doc.name}
                      </span>
                    </div>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleDelete(doc.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 p-0.5 rounded transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  {doc.summary && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-1">
                      {doc.summary}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-1">
                    <span>{doc.type.toUpperCase()}</span>
                    <span>·</span>
                    <span>{(doc.size / 1024).toFixed(1)} KB</span>
                    <span>·</span>
                    <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* Main Document Viewer */}
      <main className="flex-1 flex flex-col h-full bg-white dark:bg-slate-950 overflow-hidden">
        {selectedDoc ? (
          <>
            <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/70">
              <div className="space-y-0.5">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-500" />
                  <span>{selectedDoc.name}</span>
                </h2>
                <div className="text-[11px] text-slate-500 font-mono">
                  Format: {selectedDoc.type} · Size: {(selectedDoc.size / 1024).toFixed(2)} KB
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={() => onAnalyzeDocumentInChat(selectedDoc)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-medium rounded-lg transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Analyze with AI</span>
                </button>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedDoc.content);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  title="Copy content"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>

                <button
                  onClick={handlePrintPdf}
                  className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  title="Print / Save as PDF"
                >
                  <Printer className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDownload(selectedDoc)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-medium rounded-lg shadow-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>

            {/* Content Display */}
            <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full">
              {selectedDoc.type === 'markdown' ? (
                <MarkdownRenderer content={selectedDoc.content} />
              ) : (
                <pre className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {selectedDoc.content}
                </pre>
              )}
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
            <FileText className="w-8 h-8 opacity-40" />
            <p className="text-xs">Select or create a document to view</p>
          </div>
        )}
      </main>

      {/* CREATE DOCUMENT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Create New Document</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  File Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., Executive_Brief_2026.md"
                  value={newDocName}
                  onChange={e => setNewDocName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Format
                  </label>
                  <select
                    value={newDocType}
                    onChange={e => setNewDocType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="markdown">Markdown (.md)</option>
                    <option value="csv">CSV (.csv)</option>
                    <option value="json">JSON (.json)</option>
                    <option value="html">HTML (.html)</option>
                    <option value="text">Plain Text (.txt)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Summary / Description
                  </label>
                  <input
                    type="text"
                    placeholder="Short 1-sentence synopsis"
                    value={newDocSummary}
                    onChange={e => setNewDocSummary(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Content
                </label>
                <textarea
                  rows={8}
                  placeholder="Write or paste document contents..."
                  value={newDocContent}
                  onChange={e => setNewDocContent(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-xs text-slate-900 dark:text-white resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newDocName.trim() || !newDocContent.trim()}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-40"
              >
                Save Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
