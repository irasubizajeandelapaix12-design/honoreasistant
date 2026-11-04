import fs from 'fs';
import path from 'path';

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

export interface AutomationWorkflow {
  id: string;
  name: string;
  description: string;
  trigger: 'manual' | 'daily' | 'on_document_upload';
  steps: Array<{
    id: string;
    action: string;
    description: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    output?: string;
  }>;
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

export interface AppDatabase {
  settings: UserSettings;
  conversations: Conversation[];
  messages: Message[];
  memories: MemoryItem[];
  tasks: TaskItem[];
  automations: AutomationWorkflow[];
  documents: DocumentItem[];
  sqlTables: Record<string, { columns: string[]; rows: Record<string, any>[] }>;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'app_database.json');

const DEFAULT_SETTINGS: UserSettings = {
  defaultModel: 'gemini-3.1-flash-lite',
  temperature: 0.7,
  responseStyle: 'balanced',
  defaultLanguage: 'English',
  voiceGender: 'female',
  voiceSpeed: 1.0,
  theme: 'dark',
  enableMemory: true,
  enableGrounding: true,
  codeExecutionApproval: false,
  customSystemPrompt: 'You are Honore Assistant, an advanced, highly capable personal AI assistant, programming partner, research analyst, and productivity agent.',
  brainMode: 'auto',
  ollamaBaseUrl: 'http://127.0.0.1:11434',
  ollamaModel: 'llama3.2',
  autoOfflineFallback: true,
};

const INITIAL_MEMORIES: MemoryItem[] = [
  {
    id: 'mem-1',
    category: 'preference',
    key: 'Developer Persona',
    content: 'User prefers clean TypeScript, Tailwind CSS, modular architecture, and modern best practices.',
    confidence: 0.98,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mem-2',
    category: 'instruction',
    key: 'Code Style',
    content: 'Always provide complete, executable code blocks with explanatory comments rather than pseudo-code snippets.',
    confidence: 0.95,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mem-3',
    category: 'project',
    key: 'Aether Assistant Core',
    content: 'Currently working on the All-in-One Personal AI Assistant with real web search, memory vault, code sandbox, and automation engine.',
    confidence: 0.99,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const INITIAL_TASKS: TaskItem[] = [
  {
    id: 'task-1',
    title: 'Review System Architecture and Multi-Tool Pipeline',
    description: 'Ensure web search grounding, code runner, and memory injection are fully coordinated.',
    status: 'in_progress',
    priority: 'high',
    category: 'Engineering',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-2',
    title: 'Build Executive Research Brief on Next-Gen Autonomous Agents',
    description: 'Gather recent benchmarks, tools comparison, and synthesize into a downloadable study report.',
    status: 'todo',
    priority: 'medium',
    category: 'Research',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-3',
    title: 'Configure Daily Task Summary Workflow',
    description: 'Automate morning briefing generation with top priorities and open project milestones.',
    status: 'done',
    priority: 'low',
    category: 'Productivity',
    createdAt: new Date().toISOString(),
  },
];

const INITIAL_AUTOMATIONS: AutomationWorkflow[] = [
  {
    id: 'auto-1',
    name: 'Deep Research & Executive Briefing',
    description: 'Automated 4-step pipeline: search web sources, analyze findings, structure comparison matrix, and create downloadable report.',
    trigger: 'manual',
    status: 'idle',
    steps: [
      { id: 's1', action: 'web_search', description: 'Query trusted search sources for domain updates', status: 'pending' },
      { id: 's2', action: 'analyze_data', description: 'Filter, rank, and extract high-confidence claims', status: 'pending' },
      { id: 's3', action: 'synthesize', description: 'Synthesize findings with structured takeaways', status: 'pending' },
      { id: 's4', action: 'export_document', description: 'Generate formatted research report file', status: 'pending' },
    ],
  },
  {
    id: 'auto-2',
    name: 'Code Review & Security Audit',
    description: 'Analyzes provided code repository or snippet, identifies anti-patterns, checks edge cases, and suggests optimized refactors.',
    trigger: 'manual',
    status: 'idle',
    steps: [
      { id: 'c1', action: 'parse_ast', description: 'Inspect code syntax and structure', status: 'pending' },
      { id: 'c2', action: 'security_check', description: 'Scan for injection, leaks, and unhandled exceptions', status: 'pending' },
      { id: 'c3', action: 'test_generation', description: 'Generate unit test cases', status: 'pending' },
    ],
  },
  {
    id: 'auto-3',
    name: 'Daily Productivity Briefing',
    description: 'Reads active task board, prioritizes urgent items, creates daily focus agenda, and updates memory ledger.',
    trigger: 'daily',
    status: 'idle',
    steps: [
      { id: 'd1', action: 'scan_tasks', description: 'Audit pending tasks and deadlines', status: 'pending' },
      { id: 'd2', action: 'rank_priorities', description: 'Generate optimal time-blocked schedule', status: 'pending' },
      { id: 'd3', action: 'commit_agenda', description: 'Save schedule to active memory notes', status: 'pending' },
    ],
  },
];

const INITIAL_DOCUMENTS: DocumentItem[] = [
  {
    id: 'doc-1',
    name: 'Aether_Architecture_Overview.md',
    type: 'markdown',
    size: 2450,
    content: `# Aether AI: Architecture & Capabilities
Aether is an advanced personal AI assistant engineered for high autonomy and versatility.

## Core Subsystems
1. Multi-Provider Cognitive Engine (Google Gemini 3.8 Flash, local Ollama, Claude, OpenAI)
2. Grounded Web Intelligence with Google Search
3. Client/Server Code Execution Sandbox
4. Persistent Memory Vault with Semantic Context Injection
5. Document Creator (Markdown, CSV, JSON, HTML, PDF reports)
6. Interactive Relational SQL Query Runner
7. Automation Workflow Pipeline`,
    summary: 'Architectural overview of Aether AI subsystems, including cognitive engine, memory vault, and tools.',
    createdAt: new Date().toISOString(),
  },
];

const INITIAL_SQL_TABLES = {
  projects: {
    columns: ['id', 'name', 'status', 'budget', 'lead_dev', 'deadline'],
    rows: [
      { id: 1, name: 'Aether AI Assistant', status: 'Active', budget: 15000, lead_dev: 'Alex Rivera', deadline: '2026-12-01' },
      { id: 2, name: 'Autonomous Drone Navigator', status: 'Planning', budget: 32000, lead_dev: 'Elena Rostova', deadline: '2027-03-15' },
      { id: 3, name: 'Quantum Cryptography Suite', status: 'Active', budget: 50000, lead_dev: 'Marcus Vance', deadline: '2027-01-30' },
      { id: 4, name: 'Biometric Health Hub', status: 'Completed', budget: 18500, lead_dev: 'Sophia Chen', deadline: '2026-10-15' },
    ],
  },
  team_members: {
    columns: ['id', 'name', 'role', 'specialty', 'experience_yrs', 'assigned_project_id'],
    rows: [
      { id: 1, name: 'Alex Rivera', role: 'Staff Engineer', specialty: 'Full-Stack & GenAI', experience_yrs: 8, assigned_project_id: 1 },
      { id: 2, name: 'Elena Rostova', role: 'Robotics Lead', specialty: 'Computer Vision', experience_yrs: 6, assigned_project_id: 2 },
      { id: 3, name: 'Marcus Vance', role: 'Security Architect', specialty: 'Post-Quantum Crypto', experience_yrs: 11, assigned_project_id: 3 },
      { id: 4, name: 'Sophia Chen', role: 'Data Scientist', specialty: 'Predictive Biometrics', experience_yrs: 5, assigned_project_id: 4 },
      { id: 5, name: 'David Kim', role: 'Systems Engineer', specialty: 'Distributed Cloud', experience_yrs: 7, assigned_project_id: 1 },
    ],
  },
};

let dbCache: AppDatabase | null = null;

export function getDb(): AppDatabase {
  if (dbCache) return dbCache;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      dbCache = JSON.parse(raw);
      if (dbCache) {
        dbCache.settings = { ...DEFAULT_SETTINGS, ...dbCache.settings };
      }
      return dbCache!;
    } catch (err) {
      console.error('Error loading db file, re-initializing defaults:', err);
    }
  }

  const initialDb: AppDatabase = {
    settings: DEFAULT_SETTINGS,
    conversations: [
      {
        id: 'conv-welcome',
        title: 'Welcome to Honore Assistant',
        model: 'gemini-3.8-flash',
        category: 'general',
        pinned: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    messages: [
      {
        id: 'msg-welcome-1',
        conversationId: 'conv-welcome',
        role: 'assistant',
        content: `Hello! I am **Honore Assistant**, your personal assistant and engineering partner.

Ask me anything — whether you need to review and optimize code, break down complex topics clearly, conduct live research, query databases, or draft documents. How can I help you today?`,
        createdAt: new Date().toISOString(),
      },
    ],
    memories: INITIAL_MEMORIES,
    tasks: INITIAL_TASKS,
    automations: INITIAL_AUTOMATIONS,
    documents: INITIAL_DOCUMENTS,
    sqlTables: INITIAL_SQL_TABLES,
  };

  dbCache = initialDb;
  saveDb(initialDb);
  return dbCache;
}

export function saveDb(db: AppDatabase): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
    dbCache = db;
  } catch (err) {
    console.error('Failed to persist database:', err);
  }
}
