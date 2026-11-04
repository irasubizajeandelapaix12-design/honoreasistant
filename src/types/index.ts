export interface UserSettings {
  defaultModel: string;
  temperature: number;
  responseStyle: 'balanced' | 'precise' | 'creative' | 'concise';
  defaultLanguage: string;
  voiceGender: 'neutral' | 'female' | 'male';
  voiceSpeed: number;
  theme: 'dark' | 'light' | 'system';
  enableMemory: boolean;
  enableGrounding: boolean;
  codeExecutionApproval: boolean;
  customSystemPrompt: string;
  brainMode?: 'cloud' | 'local' | 'auto';
  ollamaBaseUrl?: string;
  ollamaModel?: string;
  autoOfflineFallback?: boolean;
}

export interface OllamaModel {
  name: string;
  model: string;
  size: number;
  digest: string;
  details?: {
    parent_model?: string;
    format?: string;
    family?: string;
    families?: string[];
    parameter_size?: string;
    quantization_level?: string;
  };
  modified_at: string;
}

export interface OllamaStatus {
  online: boolean;
  version?: string;
  baseUrl: string;
  latencyMs?: number;
  modelCount?: number;
  error?: string;
}

export interface MemoryItem {
  id: string;
  category: 'preference' | 'project' | 'fact' | 'instruction';
  key: string;
  content: string;
  confidence: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MessageAttachment {
  name: string;
  type: string;
  size: number;
  dataUrl?: string;
  textSnippet?: string;
}

export interface ToolCallLog {
  tool: string;
  input: Record<string, any>;
  output?: any;
  status: 'pending' | 'success' | 'error';
  timestamp: string;
  executionTimeMs?: number;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  thoughts?: string;
  toolsUsed?: ToolCallLog[];
  citations?: Array<{ title: string; url: string; snippet?: string }>;
  attachments?: MessageAttachment[];
  createdAt: string;
}

export interface Conversation {
  id: string;
  title: string;
  model: string;
  category: 'general' | 'coding' | 'research' | 'writing' | 'database';
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  category: string;
  dueDate?: string;
  createdAt: string;
}

export interface AutomationStep {
  id: string;
  action: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  output?: string;
}

export interface AutomationWorkflow {
  id: string;
  name: string;
  description: string;
  trigger: 'manual' | 'daily' | 'on_document_upload';
  steps: AutomationStep[];
  status: 'idle' | 'running' | 'completed' | 'failed';
  lastRun?: string;
}

export interface DocumentItem {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string;
  summary?: string;
  createdAt: string;
}

export interface SqlResult {
  columns: string[];
  rows: any[];
  message?: string;
  affectedRows?: number;
  error?: string;
}

export interface SystemStats {
  totalConversations: number;
  totalMessages: number;
  totalMemories: number;
  activeMemories: number;
  totalTasks: number;
  completedTasks: number;
  totalDocuments: number;
  totalAutomations: number;
  selectedModel: string;
  serverUptime: number;
}

export type WorkspaceTab =
  | 'chat'
  | 'code'
  | 'research'
  | 'documents'
  | 'database'
  | 'tasks'
  | 'automations'
  | 'memory'
  | 'dashboard'
  | 'ollama'
  | 'resources'
  | 'game'
  | 'science'
  | 'media'
  | 'settings';

export interface SystemResourceTelemetry {
  timestamp: string;
  cpu: {
    usagePercent: number;
    cores: number;
    model: string;
    speedMhz: number;
    loadAverage: number[];
    coreLoads: number[];
  };
  memory: {
    totalBytes: number;
    usedBytes: number;
    freeBytes: number;
    usagePercent: number;
    processRssBytes: number;
  };
  gpu: {
    detected: boolean;
    type: string;
    vramUsedBytes: number;
    vramTotalBytes: number;
    vramPercent: number;
    gpuLoadPercent: number;
  };
  ollama: {
    online: boolean;
    baseUrl: string;
    version?: string;
    loadedModels: Array<{
      name: string;
      model: string;
      sizeBytes: number;
      sizeVramBytes: number;
      quantization: string;
      family: string;
      expiresAt?: string;
    }>;
  };
}
