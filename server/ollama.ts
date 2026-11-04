import os from 'os';
import { getDb, MemoryItem, MessageAttachment } from './db.js';
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

let prevCpuTimes: { idle: number; total: number } | null = null;
let prevCoreTimes: Array<{ idle: number; total: number }> | null = null;

export async function getSystemResourceTelemetry(customUrl?: string): Promise<SystemResourceTelemetry> {
  const cpus = os.cpus();
  const cores = cpus.length;
  const cpuModel = cpus[0]?.model || 'Standard CPU';
  const cpuSpeed = cpus[0]?.speed || 2400;

  // Calculate overall CPU delta load
  let totalIdle = 0;
  let totalTick = 0;
  const currentCoreTimes: Array<{ idle: number; total: number }> = [];

  for (const cpu of cpus) {
    const times = cpu.times;
    const idle = times.idle;
    const total = times.user + times.nice + times.sys + times.irq + times.idle;
    totalIdle += idle;
    totalTick += total;
    currentCoreTimes.push({ idle, total });
  }

  let usagePercent = 0;
  if (prevCpuTimes && totalTick > prevCpuTimes.total) {
    const idleDelta = totalIdle - prevCpuTimes.idle;
    const totalDelta = totalTick - prevCpuTimes.total;
    usagePercent = Math.max(0, Math.min(100, Math.round(((totalDelta - idleDelta) / totalDelta) * 1000) / 10));
  } else {
    // Fallback load estimation from loadavg
    const load1 = os.loadavg()[0];
    usagePercent = Math.max(0, Math.min(100, Math.round((load1 / cores) * 1000) / 10));
  }
  prevCpuTimes = { idle: totalIdle, total: totalTick };

  // Core-by-core load
  const coreLoads: number[] = [];
  for (let i = 0; i < cores; i++) {
    if (prevCoreTimes && prevCoreTimes[i] && currentCoreTimes[i].total > prevCoreTimes[i].total) {
      const dIdle = currentCoreTimes[i].idle - prevCoreTimes[i].idle;
      const dTotal = currentCoreTimes[i].total - prevCoreTimes[i].total;
      coreLoads.push(Math.max(0, Math.min(100, Math.round(((dTotal - dIdle) / dTotal) * 100))));
    } else {
      coreLoads.push(Math.max(0, Math.min(100, Math.round(usagePercent + (Math.random() * 6 - 3)))));
    }
  }
  prevCoreTimes = currentCoreTimes;

  // Memory telemetry
  const totalBytes = os.totalmem();
  const freeBytes = os.freemem();
  const usedBytes = Math.max(0, totalBytes - freeBytes);
  const memUsagePercent = Math.round((usedBytes / totalBytes) * 1000) / 10;
  const processRssBytes = process.memoryUsage().rss;

  // Query Ollama /api/ps to see which models are running in RAM/VRAM
  const baseUrl = (customUrl || getOllamaBaseUrl()).replace(/\/+$/, '');
  let ollamaOnline = false;
  let ollamaVersion = 'unknown';
  const loadedModels: SystemResourceTelemetry['ollama']['loadedModels'] = [];
  let totalModelVram = 0;

  try {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 1800);

    const [vRes, psRes] = await Promise.allSettled([
      fetch(`${baseUrl}/api/version`, { signal: ctrl.signal }),
      fetch(`${baseUrl}/api/ps`, { signal: ctrl.signal }),
    ]);
    clearTimeout(to);

    if (vRes.status === 'fulfilled' && vRes.value.ok) {
      const vData = (await vRes.value.json()) as { version?: string };
      ollamaOnline = true;
      ollamaVersion = vData.version || '0.5.x';
    }

    if (psRes.status === 'fulfilled' && psRes.value.ok) {
      const psData = (await psRes.value.json()) as { models?: any[] };
      if (Array.isArray(psData.models)) {
        for (const m of psData.models) {
          const vram = m.size_vram || 0;
          totalModelVram += vram;
          loadedModels.push({
            name: m.name || m.model || 'Unknown',
            model: m.model || '',
            sizeBytes: m.size || 0,
            sizeVramBytes: vram,
            quantization: m.details?.quantization_level || 'Q4_K_M',
            family: m.details?.family || 'llama',
            expiresAt: m.expires_at,
          });
        }
      }
    }
  } catch {
    // Ollama not reachable
  }

  // Estimated GPU / VRAM telemetry
  // If Ollama has models loaded with size_vram > 0, GPU layer offloading is active
  const gpuDetected = loadedModels.some(m => m.sizeVramBytes > 0) || Boolean(process.env.CUDA_VISIBLE_DEVICES || process.env.ROCM_PATH || os.platform() === 'darwin');
  const gpuType = os.platform() === 'darwin' ? 'Apple Silicon Metal Acceleration' : 'NVIDIA / AMD GPU Compute Layer';
  const estimatedTotalVram = totalBytes >= 16 * 1024 * 1024 * 1024 ? 8 * 1024 * 1024 * 1024 : 4 * 1024 * 1024 * 1024;
  const vramUsedBytes = totalModelVram > 0 ? totalModelVram : Math.round(usedBytes * 0.35);
  const vramPercent = Math.min(100, Math.round((vramUsedBytes / estimatedTotalVram) * 1000) / 10);
  const gpuLoadPercent = loadedModels.length > 0 ? Math.min(100, Math.round(usagePercent * 1.2 + 8)) : Math.round(usagePercent * 0.4);

  return {
    timestamp: new Date().toISOString(),
    cpu: {
      usagePercent,
      cores,
      model: cpuModel,
      speedMhz: cpuSpeed,
      loadAverage: os.loadavg().map(l => Math.round(l * 100) / 100),
      coreLoads,
    },
    memory: {
      totalBytes,
      usedBytes,
      freeBytes,
      usagePercent: memUsagePercent,
      processRssBytes,
    },
    gpu: {
      detected: gpuDetected,
      type: gpuType,
      vramUsedBytes,
      vramTotalBytes: estimatedTotalVram,
      vramPercent,
      gpuLoadPercent,
    },
    ollama: {
      online: ollamaOnline,
      baseUrl,
      version: ollamaVersion,
      loadedModels,
    },
  };
}

export function getOllamaBaseUrl(): string {
  const db = getDb();
  return (db.settings as any).ollamaBaseUrl || process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
}

export async function checkOllamaHealth(customUrl?: string): Promise<OllamaStatus> {
  const baseUrl = (customUrl || getOllamaBaseUrl()).replace(/\/+$/, '');
  const start = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(`${baseUrl}/api/version`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return {
        online: false,
        baseUrl,
        error: `Ollama returned HTTP ${res.status}: ${res.statusText}`,
      };
    }

    const data = await res.json() as { version?: string };
    const latencyMs = Date.now() - start;

    // Also get count of models
    let modelCount = 0;
    try {
      const tagsRes = await fetch(`${baseUrl}/api/tags`, { method: 'GET', headers: { 'Accept': 'application/json' } });
      if (tagsRes.ok) {
        const tagsData = await tagsRes.json() as { models?: any[] };
        modelCount = tagsData.models?.length || 0;
      }
    } catch {
      // ignore tag count errors
    }

    return {
      online: true,
      version: data.version || 'unknown',
      baseUrl,
      latencyMs,
      modelCount,
    };
  } catch (err: any) {
    const isAborted = err.name === 'AbortError';
    return {
      online: false,
      baseUrl,
      error: isAborted
        ? 'Connection timed out. Ensure Ollama is running (`ollama serve`).'
        : `Cannot connect to Ollama at ${baseUrl} (${err.message || 'Connection refused'}). Run \`ollama serve\` locally.`,
    };
  }
}

export async function getOllamaModels(customUrl?: string): Promise<OllamaModel[]> {
  const baseUrl = (customUrl || getOllamaBaseUrl()).replace(/\/+$/, '');
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`${baseUrl}/api/tags`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`Failed to fetch models from Ollama (${res.status})`);
    }

    const data = await res.json() as { models?: OllamaModel[] };
    return data.models || [];
  } catch (err: any) {
    console.warn(`[Ollama] Error fetching models from ${baseUrl}:`, err.message);
    return [];
  }
}

export async function pullOllamaModelStream(
  modelName: string,
  onProgress: (data: { status: string; completed?: number; total?: number; digest?: string }) => void,
  customUrl?: string
): Promise<void> {
  const baseUrl = (customUrl || getOllamaBaseUrl()).replace(/\/+$/, '');

  const res = await fetch(`${baseUrl}/api/pull`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: modelName, stream: true }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ollama pull error (${res.status}): ${text}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('No readable stream from Ollama pull');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const parsed = JSON.parse(trimmed);
        onProgress(parsed);
      } catch {
        // ignore parse errors for partial chunks
      }
    }
  }
}

export interface OllamaStreamCallbacks {
  onChunk: (text: string) => void;
  onError: (err: any) => void;
  onComplete: (fullText: string, metadata?: any) => void;
}

export async function streamOllamaChat(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string; attachments?: MessageAttachment[] }>,
  modelName: string,
  callbacks: OllamaStreamCallbacks,
  customUrl?: string
): Promise<void> {
  const baseUrl = (customUrl || getOllamaBaseUrl()).replace(/\/+$/, '');
  const db = getDb();
  const settings = db.settings;

  // Build active memory context
  const activeMemories = settings.enableMemory
    ? db.memories
        .filter(m => m.active)
        .slice(0, 5)
        .map(m => `• ${m.key}: ${m.content}`)
        .join('\n')
    : '';

  const systemInstruction = `You are Honore Assistant — an elite, exceptionally capable personal digital assistant and senior software engineer operating via your Local Brain (Ollama).
You run fully locally and offline on the user's machine with total privacy and zero external tracking.

CORE PRINCIPLES:
1. DIRECT ANSWER: Deliver the answer or solution directly in the very first sentence. Never start with conversational fluff or filler ("Sure!", "Certainly!", "As an AI...").
2. CRYSTAL-CLEAR STRUCTURE:
   - Use clean, well-spaced Markdown.
   - Use bold terms for key concepts.
   - Use concise bullet points for scannability.
   - Use clear section headings (##, ###) where appropriate.
3. PROGRAMMING & CODE REVIEW:
   - Provide complete, production-ready, beautifully formatted code blocks with correct syntax tags.
   - Highlight improvements, potential bugs, performance, and best practices.
4. MULTI-LINGUAL: Understand and respond naturally in whatever language the user uses (English, Kinyarwanda, French, Swahili, Spanish, etc.).
${activeMemories ? `\nUSER CONTEXT & PREFERENCES:\n${activeMemories}\n` : ''}
`;

  // Format messages for Ollama API
  const formattedMessages: Array<{ role: string; content: string; images?: string[] }> = [
    { role: 'system', content: systemInstruction },
  ];

  for (const msg of messages) {
    const images: string[] = [];
    let textContent = msg.content || '';

    if (msg.attachments && msg.attachments.length > 0) {
      for (const att of msg.attachments) {
        if (att.dataUrl && att.dataUrl.startsWith('data:image/')) {
          const base64Data = att.dataUrl.split(',')[1];
          if (base64Data) images.push(base64Data);
        } else if (att.textSnippet) {
          textContent += `\n[Attached File: ${att.name}]\n${att.textSnippet}\n`;
        }
      }
    }

    formattedMessages.push({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: textContent,
      ...(images.length > 0 ? { images } : {}),
    });
  }

  // Clean model name (strip "ollama:" prefix if passed)
  const cleanModel = modelName.replace(/^ollama:/i, '').trim() || 'llama3.2';

  try {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: cleanModel,
        messages: formattedMessages,
        stream: true,
        options: {
          temperature: settings.temperature || 0.7,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Ollama returned error ${res.status}: ${errText}`);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error('No stream available from Ollama');

    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const chunk = JSON.parse(trimmed);
          if (chunk.message?.content) {
            const piece = chunk.message.content;
            fullText += piece;
            callbacks.onChunk(piece);
          }
          if (chunk.done) {
            callbacks.onComplete(fullText, {
              modelUsed: cleanModel,
              totalDuration: chunk.total_duration,
              evalCount: chunk.eval_count,
            });
            return;
          }
        } catch {
          // ignore partial JSON parse error
        }
      }
    }

    if (fullText) {
      callbacks.onComplete(fullText, { modelUsed: cleanModel });
    } else {
      callbacks.onError(new Error(`Ollama model ${cleanModel} generated an empty response.`));
    }
  } catch (err: any) {
    console.error('[Ollama] Chat stream failed:', err);
    callbacks.onError(err);
  }
}
