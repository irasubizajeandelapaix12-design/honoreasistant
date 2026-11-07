import React, { useState, useEffect } from 'react';
import {
  WorkspaceTab,
  Conversation,
  Message,
  MessageAttachment,
  DocumentItem,
  TaskItem,
  UserSettings,
} from './types/index.js';
import {
  fetchConversations,
  fetchConversationMessages,
  createConversation,
  updateConversation,
  deleteConversation,
  fetchSettings,
} from './services/api.js';

import { TopBar } from './components/TopBar.js';
import { DashboardView } from './components/DashboardView.js';
import { ChatView } from './components/ChatView.js';
import { CodeStudio } from './components/CodeStudio.js';
import { ResearchStudio } from './components/ResearchStudio.js';
import { DocumentStudio } from './components/DocumentStudio.js';
import { DatabaseStudio } from './components/DatabaseStudio.js';
import { TaskBoard } from './components/TaskBoard.js';
import { AutomationStudio } from './components/AutomationStudio.js';
import { MemoryVault } from './components/MemoryVault.js';
import { VoiceModal } from './components/VoiceModal.js';
import { SettingsModal } from './components/SettingsModal.js';
import { Game3D } from './components/game/Game3D.js';
import { BioscienceLab } from './components/BioscienceLab.js';
import { MediaStudio } from './components/MediaStudio.js';
import { MapsStudio } from './components/MapsStudio.js';
import { CommandPalette } from './components/CommandPalette.js';

export default function App() {
  const [currentTab, setCurrentTab] = useState<WorkspaceTab>('chat');
  const [isDark, setIsDark] = useState<boolean>(true);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Chat & Conversation state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeModel, setActiveModel] = useState('gemini-3.8-flash');

  // Code Studio initial state for cross-module jumping
  const [codeStudioSnippet, setCodeStudioSnippet] = useState<{ code?: string; language?: string }>({});

  const abortControllerRef = React.useRef<AbortController | null>(null);

  // Global Keyboard Shortcuts
  // 1. Command/Ctrl + 1-9: Navigate between workspace tabs
  // 2. Command/Ctrl + K: Open Command Palette & Search
  useEffect(() => {
    const tabOrder: WorkspaceTab[] = [
      'chat',      // 1
      'maps',      // 2
      'game',      // 3
      'media',     // 4
      'science',   // 5
      'code',      // 6
      'research',  // 7
      'documents', // 8
      'database',  // 9
    ];

    const handleKeyDown = (e: KeyboardEvent) => {
      // Support Command on macOS and Control on Windows/Linux
      const isModifier = e.metaKey || e.ctrlKey;

      // Command/Ctrl + K: Toggle Command Palette
      if (isModifier && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
        return;
      }

      // Command/Ctrl + 1-9: Switch Workspace Tabs
      if (isModifier && e.key >= '1' && e.key <= '9') {
        const index = parseInt(e.key, 10) - 1;
        if (index >= 0 && index < tabOrder.length) {
          e.preventDefault();
          setCurrentTab(tabOrder[index]);
          setIsCommandPaletteOpen(false);
        }
        return;
      }

      // Escape key to dismiss Command Palette
      if (e.key === 'Escape' && isCommandPaletteOpen) {
        setIsCommandPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen]);

  // Initialize Dark Theme
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  // Load Initial Settings & Conversations
  useEffect(() => {
    fetchSettings()
      .then(settings => {
        if (settings.theme === 'light') setIsDark(false);
        setActiveModel(settings.defaultModel || 'gemini-3.8-flash');
      })
      .catch(console.error);

    loadConversationsList();
  }, []);

  const loadConversationsList = async () => {
    try {
      const list = await fetchConversations();
      setConversations(list);
      if (list.length > 0 && !activeConversation) {
        selectConversation(list[0].id);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  };

  const selectConversation = async (id: string) => {
    try {
      const res = await fetchConversationMessages(id);
      setActiveConversation(res.conversation);
      setMessages(res.messages || []);
    } catch (err) {
      console.error('Error selecting conversation:', err);
    }
  };

  const handleCreateNewConversation = async () => {
    try {
      const conv = await createConversation('New Conversation', activeModel, 'general');
      setConversations(prev => [conv, ...prev]);
      setActiveConversation(conv);
      setMessages([]);
      setCurrentTab('chat');
    } catch (err) {
      console.error('Error creating conversation:', err);
    }
  };

  const handleDeleteConversation = async (id: string) => {
    await deleteConversation(id);
    const updated = conversations.filter(c => c.id !== id);
    setConversations(updated);
    if (activeConversation?.id === id) {
      if (updated.length > 0) {
        selectConversation(updated[0].id);
      } else {
        setActiveConversation(null);
        setMessages([]);
      }
    }
  };

  const handleUpdateConversation = async (id: string, updates: Partial<Conversation>) => {
    try {
      const updated = await updateConversation(id, updates);
      setConversations(prev => prev.map(c => (c.id === id ? updated : c)));
      if (activeConversation?.id === id) {
        setActiveConversation(updated);
      }
    } catch (err) {
      console.error('Error updating conversation:', err);
    }
  };

  // Real-time SSE Chat Streaming
  const handleSendMessage = async (
    text: string,
    attachments: MessageAttachment[] = [],
    enableSearch: boolean = true,
    enableMaps: boolean = false
  ) => {
    if (isStreaming) return;
    setIsStreaming(true);

    // Optimistically add user message
    const tempUserMsg: Message = {
      id: `temp-u-${Date.now()}`,
      conversationId: activeConversation?.id || 'temp',
      role: 'user',
      content: text,
      attachments,
      createdAt: new Date().toISOString(),
    };

    // Placeholder assistant message
    const tempAssistantMsgId = `temp-a-${Date.now()}`;
    const tempAssistantMsg: Message = {
      id: tempAssistantMsgId,
      conversationId: activeConversation?.id || 'temp',
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
    };

    setMessages(prev => [...prev, tempUserMsg, tempAssistantMsg]);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: activeConversation?.id,
          message: text,
          attachments,
          model: activeModel,
          enableSearch,
          enableMaps,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No readable stream available');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.replace('data: ', '').trim();
          if (!jsonStr) continue;

          try {
            const event = JSON.parse(jsonStr);

            if (event.type === 'start') {
              if (event.conversationId && (!activeConversation || activeConversation.id !== event.conversationId)) {
                await loadConversationsList();
                const matched = conversations.find(c => c.id === event.conversationId);
                if (matched) setActiveConversation(matched);
              }
            } else if (event.type === 'chunk') {
              setMessages(prev =>
                prev.map(m =>
                  m.id === tempAssistantMsgId
                    ? { ...m, content: m.content + event.text }
                    : m
                )
              );
            } else if (event.type === 'citations') {
              setMessages(prev =>
                prev.map(m =>
                  m.id === tempAssistantMsgId
                    ? { ...m, citations: event.citations }
                    : m
                )
              );
            } else if (event.type === 'tool_call') {
              setMessages(prev =>
                prev.map(m =>
                  m.id === tempAssistantMsgId
                    ? { ...m, toolsUsed: [...(m.toolsUsed || []), event.toolLog] }
                    : m
                )
              );
            } else if (event.type === 'done') {
              setMessages(prev =>
                prev.map(m => (m.id === tempAssistantMsgId ? event.message : m))
              );
            } else if (event.type === 'error') {
              const friendly = typeof event.error === 'string' && event.error.length > 0 && !event.error.startsWith('{')
                ? event.error
                : 'Service is temporarily busy. Please try asking again.';
              setMessages(prev =>
                prev.map(m =>
                  m.id === tempAssistantMsgId
                    ? { ...m, content: m.content || friendly }
                    : m
                )
              );
            }
          } catch (parseErr) {
            console.error('Failed to parse SSE event:', parseErr);
          }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Stream error:', err);
        setMessages(prev =>
          prev.map(m =>
            m.id === tempAssistantMsgId
              ? { ...m, content: m.content || 'The model is temporarily busy. Please try asking again in a moment.' }
              : m
          )
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
      loadConversationsList();
    }
  };

  const handleStopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  };

  // Cross-Module Handlers
  const handleRunCodeInStudio = (code: string, language: string) => {
    setCodeStudioSnippet({ code, language });
    setCurrentTab('code');
  };

  const handleStartSearchChat = (searchPrompt: string) => {
    setCurrentTab('chat');
    handleSendMessage(searchPrompt, [], true);
  };

  const handleAnalyzeDocumentInChat = (doc: DocumentItem) => {
    setCurrentTab('chat');
    handleSendMessage(
      `Please analyze the following document and provide an executive summary, key findings, and action items:\n\nDocument Name: ${doc.name}\n\n${doc.content.slice(0, 8000)}`,
      [],
      false
    );
  };

  const handlePlanDayInChat = (tasks: TaskItem[]) => {
    setCurrentTab('chat');
    const taskList = tasks.map(t => `- [${t.priority.toUpperCase()}] ${t.title} (${t.category})`).join('\n');
    handleSendMessage(
      `Here are my current open tasks:\n${taskList}\n\nPlease create a realistic, time-blocked daily productivity schedule prioritizing high-impact items and factoring in focus blocks.`,
      [],
      false
    );
  };

  // Voice Companion query handler
  const handleVoiceQuery = async (userTranscript: string): Promise<string> => {
    const res = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId: activeConversation?.id,
        message: userTranscript,
        model: activeModel,
        enableSearch: true,
      }),
    });

    const reader = res.body?.getReader();
    if (!reader) return 'I could not generate an answer.';

    const decoder = new TextDecoder();
    let accumulated = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const evt = JSON.parse(line.replace('data: ', '').trim());
          if (evt.type === 'chunk') accumulated += evt.text;
        } catch (e) {}
      }
    }

    return accumulated || 'Operation completed.';
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors">
      {/* Universal Top Bar */}
      <TopBar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenVoice={() => setIsVoiceOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        selectedModel={activeModel}
      />

      {/* Main Workspace Viewports */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {currentTab === 'dashboard' && (
          <DashboardView
            onSelectTab={setCurrentTab}
            onStartChat={prompt => {
              setCurrentTab('chat');
              if (prompt) handleSendMessage(prompt, [], true);
            }}
          />
        )}

        {currentTab === 'chat' && (
          <ChatView
            conversations={conversations}
            activeConversation={activeConversation}
            messages={messages}
            isLoading={isStreaming}
            onSelectConversation={selectConversation}
            onCreateConversation={handleCreateNewConversation}
            onDeleteConversation={handleDeleteConversation}
            onUpdateConversation={handleUpdateConversation}
            onSendMessage={handleSendMessage}
            onStopGenerating={handleStopGenerating}
            onRunCodeInStudio={handleRunCodeInStudio}
            activeModel={activeModel}
            onSelectModel={setActiveModel}
          />
        )}

        {currentTab === 'maps' && (
          <MapsStudio
            onAskAi={prompt => {
              setCurrentTab('chat');
              handleSendMessage(prompt, [], false);
            }}
          />
        )}

        {currentTab === 'code' && (
          <CodeStudio
            initialCode={codeStudioSnippet.code}
            initialLanguage={codeStudioSnippet.language || 'javascript'}
            onAskAi={prompt => {
              setCurrentTab('chat');
              handleSendMessage(prompt, [], false);
            }}
          />
        )}

        {currentTab === 'research' && (
          <ResearchStudio onStartSearchChat={handleStartSearchChat} />
        )}

        {currentTab === 'documents' && (
          <DocumentStudio onAnalyzeDocumentInChat={handleAnalyzeDocumentInChat} />
        )}

        {currentTab === 'database' && (
          <DatabaseStudio
            onAskAiSql={prompt => {
              setCurrentTab('chat');
              handleSendMessage(prompt, [], false);
            }}
          />
        )}

        {currentTab === 'tasks' && (
          <TaskBoard onPlanDayInChat={handlePlanDayInChat} />
        )}

        {currentTab === 'automations' && <AutomationStudio />}

        {currentTab === 'memory' && <MemoryVault />}

        {currentTab === 'game' && <Game3D />}

        {currentTab === 'science' && <BioscienceLab />}

        {currentTab === 'media' && (
          <MediaStudio
            onSendToChat={text => {
              setCurrentTab('chat');
              handleSendMessage(text, [], false);
            }}
          />
        )}
      </div>

      {/* Voice Companion Full-Screen Overlay */}
      <VoiceModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onSendVoiceQuery={handleVoiceQuery}
      />

      {/* Settings & Admin Configuration Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSaved={newSettings => {
          setActiveModel(newSettings.defaultModel);
          if (newSettings.theme === 'dark') setIsDark(true);
          if (newSettings.theme === 'light') setIsDark(false);
        }}
      />

      {/* Global Command & Search Palette (Command/Ctrl + K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectTab={tab => {
          setCurrentTab(tab);
          setIsCommandPaletteOpen(false);
        }}
        onNewChat={handleCreateNewConversation}
        onOpenVoice={() => setIsVoiceOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onToggleTheme={() => setIsDark(prev => !prev)}
        isDark={isDark}
        conversations={conversations}
        onSelectConversation={selectConversation}
        onAskAi={prompt => {
          setCurrentTab('chat');
          handleSendMessage(prompt, [], false);
        }}
      />
    </div>
  );
}
