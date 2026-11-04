import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Square,
  Paperclip,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Search,
  Plus,
  Trash2,
  Pin,
  Download,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Terminal,
  FileText,
  X,
  Globe,
  Cpu,
  WifiOff,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { Conversation, Message, MessageAttachment } from '../types/index.js';
import { MarkdownRenderer } from './MarkdownRenderer.js';

interface ChatViewProps {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  onSelectConversation: (id: string) => void;
  onCreateConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onUpdateConversation: (id: string, updates: Partial<Conversation>) => void;
  onSendMessage: (text: string, attachments: MessageAttachment[], enableSearch: boolean, enableMaps?: boolean) => void;
  onStopGenerating?: () => void;
  onRunCodeInStudio: (code: string, language: string) => void;
  isOffline?: boolean;
  brainMode?: 'cloud' | 'local' | 'auto';
  activeOllamaModel?: string;
  onOpenOllamaStudio?: () => void;
  activeModel?: string;
  onSelectModel?: (model: string) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  conversations,
  activeConversation,
  messages,
  isLoading,
  onSelectConversation,
  onCreateConversation,
  onDeleteConversation,
  onUpdateConversation,
  onSendMessage,
  onStopGenerating,
  onRunCodeInStudio,
  isOffline = false,
  brainMode = 'auto',
  activeOllamaModel = 'llama3.2',
  onOpenOllamaStudio,
  activeModel = 'gemini-3.8-flash',
  onSelectModel,
}) => {
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [enableSearch, setEnableSearch] = useState(true);
  const [enableMaps, setEnableMaps] = useState(false);
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [expandedToolMsgId, setExpandedToolMsgId] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Speech Recognition setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInputText(prev => prev + (prev.endsWith(' ') || !prev ? '' : ' ') + transcript);
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error('Speech error:', err);
      }
    }
  };

  const handleSpeak = (msgId: string, text: string) => {
    if (!('speechSynthesis' in window)) return;

    if (speakingMessageId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/```[\s\S]*?```/g, 'Code block omitted.').replace(/[#*_`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => setSpeakingMessageId(null);
    window.speechSynthesis.speak(utterance);
    setSpeakingMessageId(msgId);
  };

  const handleSend = () => {
    if ((!inputText.trim() && attachments.length === 0) || isLoading) return;
    onSendMessage(inputText.trim(), attachments, enableSearch, enableMaps);
    setInputText('');
    setAttachments([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isImg = file.type.startsWith('image/');

      const reader = new FileReader();
      if (isImg) {
        reader.onload = () => {
          setAttachments(prev => [
            ...prev,
            {
              name: file.name,
              type: file.type,
              size: file.size,
              dataUrl: reader.result as string,
            },
          ]);
        };
        reader.readAsDataURL(file);
      } else {
        reader.onload = () => {
          const content = reader.result as string;
          setAttachments(prev => [
            ...prev,
            {
              name: file.name,
              type: file.type || 'text/plain',
              size: file.size,
              textSnippet: content.slice(0, 10000),
            },
          ]);
        };
        reader.readAsText(file);
      }
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExportConversation = () => {
    if (!activeConversation || messages.length === 0) return;
    const content = messages
      .map(m => `### ${m.role === 'user' ? 'User' : 'Aether AI'} (${new Date(m.createdAt).toLocaleTimeString()}):\n${m.content}\n\n`)
      .join('---\n\n');

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeConversation.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredConversations = conversations.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-57px)] w-full overflow-hidden bg-white dark:bg-slate-950">
      {/* LEFT SIDEBAR: Conversations */}
      <aside className="w-72 shrink-0 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-900/50">
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-2">
          <button
            onClick={onCreateConversation}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-lg hover:opacity-90 transition-opacity shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>New Conversation</span>
          </button>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md focus:outline-hidden focus:ring-1 focus:ring-slate-400 dark:focus:ring-slate-600 text-slate-800 dark:text-slate-200 placeholder-slate-400"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400">No conversations found</div>
          ) : (
            filteredConversations.map(conv => {
              const isActive = activeConversation?.id === conv.id;
              return (
                <div
                  key={conv.id}
                  onClick={() => onSelectConversation(conv.id)}
                  className={`group flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium shadow-xs border border-slate-200/80 dark:border-slate-700/80'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    {conv.pinned && <Pin className="w-3 h-3 text-indigo-500 shrink-0" />}
                    <span className="truncate">{conv.title}</span>
                  </div>
                  <div className="hidden group-hover:flex items-center gap-1 shrink-0">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onUpdateConversation(conv.id, { pinned: !conv.pinned });
                      }}
                      className="p-1 hover:text-indigo-500 rounded"
                      title={conv.pinned ? 'Unpin' : 'Pin to top'}
                    >
                      <Pin className="w-3 h-3" />
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onDeleteConversation(conv.id);
                      }}
                      className="p-1 hover:text-red-500 rounded"
                      title="Delete conversation"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>{conversations.length} chats</span>
          <button
            onClick={handleExportConversation}
            disabled={!activeConversation}
            className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200 disabled:opacity-40 transition-colors"
            title="Export chat as Markdown"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        </div>
      </aside>

      {/* MAIN CHAT AREA */}
      <main className="flex-1 flex flex-col h-full bg-white dark:bg-slate-950 overflow-hidden">
        {/* Chat Header */}
        <div className="flex items-center justify-between px-6 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xs">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
              {activeConversation ? activeConversation.title : 'New Session'}
            </h2>
            <div className="flex items-center gap-2 text-xs">
              <select
                value={activeModel}
                onChange={e => onSelectModel?.(e.target.value)}
                disabled={isOffline || brainMode === 'local'}
                className="px-2 py-1 text-xs font-mono rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value="gemini-3.8-flash">gemini-3.8-flash (General Intelligence)</option>
                <option value="gemini-4-argon">gemini-4-argon (Complex STEM & Reasoning)</option>
                <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Ultra-Fast)</option>
              </select>
              <span aria-hidden="true" className="text-slate-400">·</span>
              <span className="text-slate-500 dark:text-slate-400">Memory Synchronized</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200">
              <input
                type="checkbox"
                checked={enableSearch}
                onChange={e => setEnableSearch(e.target.checked)}
                disabled={isOffline || brainMode === 'local'}
                className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-0 disabled:opacity-40"
              />
              <Globe className="w-3.5 h-3.5 text-indigo-500" />
              <span>Google Search</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200">
              <input
                type="checkbox"
                checked={enableMaps}
                onChange={e => setEnableMaps(e.target.checked)}
                disabled={isOffline || brainMode === 'local'}
                className="rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-0 disabled:opacity-40"
              />
              <MapPin className="w-3.5 h-3.5 text-emerald-500" />
              <span>Google Maps</span>
            </label>
          </div>
        </div>

        {/* Offline or Local Brain Alert Banner */}
        {isOffline ? (
          <div className="px-6 py-2.5 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/60 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>
                <strong>Offline Mode Active:</strong> Honore Assistant is running on Local Brain (Ollama: <code className="font-mono font-semibold">{activeOllamaModel}</code>). Zero internet required.
              </span>
            </div>
            {onOpenOllamaStudio && (
              <button
                onClick={onOpenOllamaStudio}
                className="underline font-semibold hover:text-amber-700 dark:hover:text-amber-100 text-[11px] whitespace-nowrap"
              >
                Ollama Settings
              </button>
            )}
          </div>
        ) : brainMode === 'local' ? (
          <div className="px-6 py-2 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-900/60 flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-200">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                <strong>Local Brain Active:</strong> Responses generated locally by Ollama (<code className="font-mono font-semibold">{activeOllamaModel}</code>) with private offline inference.
              </span>
            </div>
            {onOpenOllamaStudio && (
              <button
                onClick={onOpenOllamaStudio}
                className="underline font-semibold hover:text-emerald-700 dark:hover:text-emerald-100 text-[11px] whitespace-nowrap"
              >
                Switch Model
              </button>
            )}
          </div>
        ) : null}

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center max-w-md mx-auto text-center space-y-4">
              <img
                src="/src/assets/images/aether_ai_avatar_1793733456853.jpg"
                alt="Aether"
                className="w-16 h-16 rounded-2xl ring-1 ring-slate-200 dark:ring-slate-800 shadow-md"
              />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  How can Honore Assistant help you right now?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Ask complex programming questions, initiate live web research, synthesize documents, or run code tests.
                </p>
              </div>

              {/* Starter Prompt Cards */}
              <div className="grid grid-cols-2 gap-2.5 w-full pt-2 text-left">
                {[
                  { title: 'Code Review & Optimization', prompt: 'Please review and optimize my code for performance, security, and clean architecture.' },
                  { title: 'Explain a Difficult Concept', prompt: 'Explain how modern distributed systems handle consensus and fault tolerance in simple, clear language.' },
                  { title: 'Full-Stack Architecture', prompt: 'Help me design the architecture, database schema, and API endpoints for a scalable web application.' },
                  { title: 'Deep Research Brief', prompt: 'Conduct thorough research on recent breakthroughs in autonomous agents and provide verified citations.' },
                ].map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSendMessage(s.prompt, [], false)}
                    className="p-3 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-slate-400 dark:hover:border-slate-600 transition-colors bg-slate-50/50 dark:bg-slate-900/50 text-xs group text-left"
                  >
                    <div className="font-semibold text-slate-900 dark:text-slate-200 group-hover:text-indigo-500 transition-colors">
                      {s.title}
                    </div>
                    <div className="text-slate-500 dark:text-slate-400 text-[11px] truncate mt-0.5">
                      {s.prompt}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map(msg => {
              const isAssistant = msg.role === 'assistant';
              const isRawError = Boolean(
                msg.content &&
                (msg.content.includes('[Error:') ||
                 msg.content.includes('"code": 503') ||
                 msg.content.includes('"code": 429') ||
                 msg.content.includes('RESOURCE_EXHAUSTED') ||
                 msg.content.includes('UNAVAILABLE'))
              );
              const displayContent = isRawError
                ? 'The model is experiencing temporary network traffic. Please click **Retry** below to regenerate the answer.'
                : msg.content;

              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-3xl ${isAssistant ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
                >
                  {isAssistant && (
                    <img
                      src="/src/assets/images/aether_ai_avatar_1793733456853.jpg"
                      alt="Aether"
                      className="w-7 h-7 rounded-lg ring-1 ring-slate-200 dark:ring-slate-700 shrink-0 mt-1"
                    />
                  )}

                  <div className={`space-y-2 max-w-[85%] ${!isAssistant ? 'text-right' : ''}`}>
                    {/* Unboxed Metadata */}
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 px-1">
                      <span className="font-medium text-slate-600 dark:text-slate-400">
                        {isAssistant ? 'Honore Assistant' : 'You'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    {/* Attachments preview */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {msg.attachments.map((att, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                          >
                            {att.dataUrl ? (
                              <img src={att.dataUrl} alt={att.name} className="w-8 h-8 rounded object-cover" />
                            ) : (
                              <FileText className="w-4 h-4 text-indigo-500" />
                            )}
                            <div className="text-left">
                              <div className="font-medium text-slate-800 dark:text-slate-200 max-w-[140px] truncate text-[11px]">
                                {att.name}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                {(att.size / 1024).toFixed(1)} KB
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Message Bubble */}
                    <div
                      className={`p-4 rounded-xl text-left shadow-xs ${
                        isAssistant
                          ? 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100'
                          : 'bg-indigo-600 text-white'
                      }`}
                    >
                      {isAssistant ? (
                        <>
                          <MarkdownRenderer
                            content={displayContent}
                            onRunCode={(code, lang) => onRunCodeInStudio(code, lang)}
                          />
                          {isRawError && (
                            <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                              <button
                                onClick={() => {
                                  // Find preceding user message
                                  const msgIdx = messages.findIndex(m => m.id === msg.id);
                                  const prevUserMsg = messages.slice(0, msgIdx).reverse().find(m => m.role === 'user');
                                  if (prevUserMsg) {
                                    onSendMessage(prevUserMsg.content, prevUserMsg.attachments || [], false);
                                  }
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
                              >
                                <span>Retry This Answer</span>
                              </button>
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                      )}

                      {/* Tool Calls Accordion */}
                      {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                          <button
                            onClick={() =>
                              setExpandedToolMsgId(prev => ({ ...prev, [msg.id]: !prev[msg.id] }))
                            }
                            className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                          >
                            {expandedToolMsgId[msg.id] ? (
                              <ChevronDown className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5" />
                            )}
                            <Terminal className="w-3.5 h-3.5 text-indigo-500" />
                            <span>
                              {msg.toolsUsed.length} tool {msg.toolsUsed.length === 1 ? 'operation' : 'operations'} executed
                            </span>
                          </button>

                          {expandedToolMsgId[msg.id] && (
                            <div className="space-y-2 pl-4 text-xs font-mono">
                              {msg.toolsUsed.map((tool, tIdx) => (
                                <div
                                  key={tIdx}
                                  className="p-2.5 rounded bg-slate-950 text-slate-300 border border-slate-800 space-y-1"
                                >
                                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                                    <span className="text-emerald-400 font-semibold">{tool.tool}</span>
                                    {tool.executionTimeMs && <span>{tool.executionTimeMs}ms</span>}
                                  </div>
                                  <div className="text-[11px] text-slate-400">
                                    Input: {JSON.stringify(tool.input)}
                                  </div>
                                  {tool.output && (
                                    <pre className="text-[11px] text-slate-300 overflow-x-auto p-1 bg-black/40 rounded">
                                      {JSON.stringify(tool.output, null, 2)}
                                    </pre>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Citations Box */}
                      {msg.citations && msg.citations.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-2">
                            <Globe className="w-3.5 h-3.5 text-indigo-500" />
                            <span>Verified Web Sources ({msg.citations.length})</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {msg.citations.map((cite, cIdx) => (
                              <a
                                key={cIdx}
                                href={cite.url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-start gap-2 p-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors group"
                              >
                                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 shrink-0 mt-0.5" />
                                <div className="truncate text-left">
                                  <div className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                                    {cite.title}
                                  </div>
                                  <div className="text-[10px] text-slate-400 truncate">{cite.url}</div>
                                </div>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Bar under assistant message */}
                    {isAssistant && (
                      <div className="flex items-center gap-3 px-1 text-slate-400 text-xs">
                        <button
                          onClick={() => handleSpeak(msg.id, msg.content)}
                          className="hover:text-slate-600 dark:hover:text-slate-200 transition-colors flex items-center gap-1"
                          title="Read aloud"
                        >
                          {speakingMessageId === msg.id ? (
                            <>
                              <VolumeX className="w-3.5 h-3.5 text-indigo-500" />
                              <span className="text-indigo-500">Stop Voice</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5" />
                              <span>Listen</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(msg.content);
                            setCopiedMsgId(msg.id);
                            setTimeout(() => setCopiedMsgId(null), 2000);
                          }}
                          className="hover:text-slate-600 dark:hover:text-slate-200 transition-colors flex items-center gap-1"
                          title="Copy response"
                        >
                          {copiedMsgId === msg.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="text-emerald-500">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {isLoading && (
            <div className="flex gap-3 max-w-2xl mr-auto items-center text-xs text-slate-500 dark:text-slate-400">
              <img
                src="/src/assets/images/aether_ai_avatar_1793733456853.jpg"
                alt="Aether Thinking"
                className="w-7 h-7 rounded-lg ring-1 ring-slate-200 dark:ring-slate-700 animate-spin"
                style={{ animationDuration: '3s' }}
              />
              <span className="font-mono">Honore Assistant thinking...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* INPUT BOX */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
          {/* Pending attachments preview */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {attachments.map((att, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs border border-slate-200 dark:border-slate-700"
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="max-w-[120px] truncate">{att.name}</span>
                  <button
                    onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                    className="hover:text-red-500"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Brain mode indicator pill */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1 mb-2">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Brain Engine:</span>
              {isOffline || brainMode === 'local' ? (
                <span className="flex items-center gap-1 font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                  <Cpu className="w-3 h-3" />
                  <span>Local Ollama ({activeOllamaModel})</span>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-sans font-normal ml-1">• Offline Ready</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 font-mono text-indigo-600 dark:text-indigo-400 font-medium bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
                  <Globe className="w-3 h-3" />
                  <span>Gemini Cloud (Auto Offline Fallback)</span>
                </span>
              )}
            </div>

            {onOpenOllamaStudio && (
              <button
                onClick={onOpenOllamaStudio}
                className="flex items-center gap-1 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors"
                title="Manage offline Ollama models and connection"
              >
                <Cpu className="w-3 h-3" />
                <span>Ollama Studio</span>
              </button>
            )}
          </div>

          <div className="flex items-end gap-2 p-2 border border-slate-300 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 focus-within:ring-1 focus-within:ring-slate-400 dark:focus-within:ring-slate-600 focus-within:border-transparent transition-all">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              multiple
              className="hidden"
              accept="image/*,.txt,.md,.json,.csv,.pdf"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title="Attach document or image"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <button
              onClick={toggleRecording}
              className={`p-2 rounded-lg transition-colors ${
                isRecording
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800'
              }`}
              title={isRecording ? 'Listening... click to stop' : 'Voice input (Speech to Text)'}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <textarea
              rows={1}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Honore Assistant anything, run code, or initiate research..."
              className="flex-1 max-h-32 min-h-[40px] resize-none bg-transparent py-2 px-1 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden"
            />

            {isLoading ? (
              <button
                onClick={onStopGenerating}
                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                title="Stop generation"
              >
                <Square className="w-4 h-4 fill-current" />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!inputText.trim() && attachments.length === 0}
                className="p-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 rounded-lg disabled:opacity-30 transition-opacity shadow-xs"
                title="Send message (Enter)"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
