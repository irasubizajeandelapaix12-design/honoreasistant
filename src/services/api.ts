import {
  Conversation,
  Message,
  MemoryItem,
  DocumentItem,
  TaskItem,
  AutomationWorkflow,
  UserSettings,
  SystemStats,
  SqlResult,
  OllamaModel,
  OllamaStatus,
  SystemResourceTelemetry,
} from '../types/index.js';

export async function fetchConversations(query: string = ''): Promise<Conversation[]> {
  const url = query ? `/api/conversations?q=${encodeURIComponent(query)}` : '/api/conversations';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch conversations');
  const data = await res.json();
  return data.conversations || [];
}

export async function fetchConversationMessages(id: string): Promise<{ conversation: Conversation; messages: Message[] }> {
  const res = await fetch(`/api/conversations/${id}/messages`);
  if (!res.ok) throw new Error('Failed to fetch messages');
  return res.json();
}

export async function createConversation(title?: string, model?: string, category?: string): Promise<Conversation> {
  const res = await fetch('/api/conversations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, model, category }),
  });
  if (!res.ok) throw new Error('Failed to create conversation');
  const data = await res.json();
  return data.conversation;
}

export async function updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation> {
  const res = await fetch(`/api/conversations/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update conversation');
  const data = await res.json();
  return data.conversation;
}

export async function deleteConversation(id: string): Promise<boolean> {
  const res = await fetch(`/api/conversations/${id}`, { method: 'DELETE' });
  return res.ok;
}

export async function fetchMemories(query?: string, category?: string): Promise<MemoryItem[]> {
  const params = new URLSearchParams();
  if (query) params.append('q', query);
  if (category) params.append('category', category);
  const res = await fetch(`/api/memories?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch memories');
  const data = await res.json();
  return data.memories || [];
}

export async function createMemory(item: { key: string; content: string; category: string }): Promise<MemoryItem> {
  const res = await fetch('/api/memories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error('Failed to create memory');
  const data = await res.json();
  return data.memory;
}

export async function updateMemory(id: string, updates: Partial<MemoryItem>): Promise<MemoryItem> {
  const res = await fetch(`/api/memories/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update memory');
  const data = await res.json();
  return data.memory;
}

export async function deleteMemory(id: string): Promise<boolean> {
  const res = await fetch(`/api/memories/${id}`, { method: 'DELETE' });
  return res.ok;
}

export async function fetchDocuments(): Promise<DocumentItem[]> {
  const res = await fetch('/api/documents');
  if (!res.ok) throw new Error('Failed to fetch documents');
  const data = await res.json();
  return data.documents || [];
}

export async function createDocument(name: string, content: string, type: string = 'markdown', summary?: string): Promise<DocumentItem> {
  const res = await fetch('/api/documents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, content, type, summary }),
  });
  if (!res.ok) throw new Error('Failed to create document');
  const data = await res.json();
  return data.document;
}

export async function deleteDocument(id: string): Promise<boolean> {
  const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
  return res.ok;
}

export async function fetchTasks(): Promise<TaskItem[]> {
  const res = await fetch('/api/tasks');
  if (!res.ok) throw new Error('Failed to fetch tasks');
  const data = await res.json();
  return data.tasks || [];
}

export async function createTask(task: Partial<TaskItem>): Promise<TaskItem> {
  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  });
  if (!res.ok) throw new Error('Failed to create task');
  const data = await res.json();
  return data.task;
}

export async function updateTask(id: string, updates: Partial<TaskItem>): Promise<TaskItem> {
  const res = await fetch(`/api/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update task');
  const data = await res.json();
  return data.task;
}

export async function deleteTask(id: string): Promise<boolean> {
  const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
  return res.ok;
}

export async function fetchAutomations(): Promise<AutomationWorkflow[]> {
  const res = await fetch('/api/automations');
  if (!res.ok) throw new Error('Failed to fetch automations');
  const data = await res.json();
  return data.automations || [];
}

export async function runAutomation(id: string): Promise<{ message: string; workflow: AutomationWorkflow }> {
  const res = await fetch(`/api/automations/${id}/run`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to run automation');
  return res.json();
}

export async function fetchSqlTables(): Promise<Record<string, { columns: string[]; rows: any[] }>> {
  const res = await fetch('/api/sql/tables');
  if (!res.ok) throw new Error('Failed to fetch SQL tables');
  const data = await res.json();
  return data.tables || {};
}

export async function executeSql(query: string): Promise<SqlResult> {
  const res = await fetch('/api/tools/execute-sql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  return res.json();
}

export async function executeCode(code: string, language: string = 'javascript'): Promise<{ stdout: string[]; result: any; executionTimeMs: number; error?: string }> {
  const res = await fetch('/api/tools/execute-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, language }),
  });
  return res.json();
}

export async function fetchSettings(): Promise<UserSettings> {
  const res = await fetch('/api/settings');
  if (!res.ok) throw new Error('Failed to fetch settings');
  const data = await res.json();
  return data.settings;
}

export async function updateSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
  const res = await fetch('/api/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error('Failed to update settings');
  const data = await res.json();
  return data.settings;
}

export async function fetchStats(): Promise<SystemStats> {
  const res = await fetch('/api/stats');
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

export async function fetchOllamaStatus(url?: string): Promise<OllamaStatus> {
  const endpoint = url ? `/api/ollama/status?url=${encodeURIComponent(url)}` : '/api/ollama/status';
  const res = await fetch(endpoint);
  if (!res.ok) throw new Error('Failed to check Ollama status');
  return res.json();
}

export async function fetchOllamaModels(url?: string): Promise<OllamaModel[]> {
  const endpoint = url ? `/api/ollama/models?url=${encodeURIComponent(url)}` : '/api/ollama/models';
  const res = await fetch(endpoint);
  if (!res.ok) throw new Error('Failed to fetch Ollama models');
  const data = await res.json();
  return data.models || [];
}

export async function pullOllamaModel(
  model: string,
  onProgress: (data: { status: string; completed?: number; total?: number; digest?: string }) => void,
  url?: string
): Promise<void> {
  const res = await fetch('/api/ollama/pull-stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, url }),
  });

  if (!res.ok) throw new Error(`Pull failed: ${res.statusText}`);

  const reader = res.body?.getReader();
  if (!reader) return;

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
        const parsed = JSON.parse(jsonStr);
        onProgress(parsed);
      } catch {
        // ignore parse error
      }
    }
  }
}

export async function updateOllamaConfig(config: {
  baseUrl?: string;
  model?: string;
  brainMode?: 'cloud' | 'local' | 'auto';
  autoOfflineFallback?: boolean;
}): Promise<UserSettings> {
  const res = await fetch('/api/ollama/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  if (!res.ok) throw new Error('Failed to update Ollama config');
  const data = await res.json();
  return data.settings;
}

export async function fetchSystemResources(baseUrl?: string): Promise<SystemResourceTelemetry> {
  const url = baseUrl ? `/api/ollama/system-resources?url=${encodeURIComponent(baseUrl)}` : '/api/ollama/system-resources';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch system resources');
  return res.json();
}

// Media Studio API
export async function generateMusic(params: {
  prompt: string;
  model?: 'lyria-3-clip-preview' | 'lyria-3-pro-preview';
  imageBase64?: string;
  imageMimeType?: string;
}): Promise<{ audioBase64: string; mimeType: string; lyrics?: string }> {
  const res = await fetch('/api/media/music', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Music generation failed' }));
    throw new Error(err.error || 'Music generation failed');
  }
  return res.json();
}

export async function generateImage(params: {
  prompt: string;
  model?: string;
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
  baseImageBase64?: string;
  baseImageMimeType?: string;
}): Promise<{ imageUrl: string; mimeType: string }> {
  const res = await fetch('/api/media/image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Image generation failed' }));
    throw new Error(err.error || 'Image generation failed');
  }
  return res.json();
}

export async function generateVideo(params: {
  prompt: string;
  aspectRatio?: '16:9' | '9:16';
  duration?: '5s' | '10s';
  resolution?: '720p' | '360p' | '1080p';
  startingFrameBase64?: string;
  startingFrameMimeType?: string;
}): Promise<{ videoUrl: string; mimeType: string }> {
  const res = await fetch('/api/media/video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Video generation failed' }));
    throw new Error(err.error || 'Video generation failed');
  }
  return res.json();
}

export async function transcribeAudio(params: {
  audioBase64: string;
  mimeType?: string;
  prompt?: string;
}): Promise<{ text: string }> {
  const res = await fetch('/api/media/transcribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Transcription failed' }));
    throw new Error(err.error || 'Transcription failed');
  }
  return res.json();
}

// Bioscience Lab API
export async function fetchProteinInfo(query: string) {
  const res = await fetch(`/api/science/protein?q=${encodeURIComponent(query)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Protein lookup failed' }));
    throw new Error(err.error || 'Protein lookup failed');
  }
  return res.json();
}

export async function fetchChemicalInfo(name: string) {
  const res = await fetch(`/api/science/chemical?name=${encodeURIComponent(name)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Chemical lookup failed' }));
    throw new Error(err.error || 'Chemical lookup failed');
  }
  return res.json();
}

export async function searchLiterature(query: string) {
  const res = await fetch(`/api/science/literature?q=${encodeURIComponent(query)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Literature query failed' }));
    throw new Error(err.error || 'Literature query failed');
  }
  return res.json();
}

