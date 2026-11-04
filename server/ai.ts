import { GoogleGenAI } from '@google/genai';
import { getDb, MemoryItem, MessageAttachment } from './db.js';
import { executeCodeSandbox, executeSqlQuery, createDocument, saveMemoryItem } from './tools.js';

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export interface StreamCallbacks {
  onChunk: (text: string) => void;
  onCitations?: (citations: Array<{ title: string; url: string; snippet?: string }>) => void;
  onToolCall?: (toolLog: any) => void;
  onError: (err: any) => void;
  onComplete: (fullText: string, metadata?: any) => void;
}

// Model fallback candidates when a model experiences 503 high demand or 429 quota limits
const CANDIDATE_MODELS = [
  'gemini-3.8-flash',
  'gemini-4-argon',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
];

export async function streamChatCompletion(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string; attachments?: MessageAttachment[] }>,
  modelName: string = 'gemini-3.8-flash',
  enableSearchGrounding: boolean = false,
  callbacks: StreamCallbacks,
  enableMapsGrounding: boolean = false
): Promise<void> {
  const db = getDb();
  const settings = db.settings;

  // Active memory context
  const activeMemories = settings.enableMemory
    ? db.memories
        .filter(m => m.active)
        .slice(0, 5)
        .map(m => `• ${m.key}: ${m.content}`)
        .join('\n')
    : '';

  const systemInstruction = `You are Honore Assistant — an elite, exceptionally capable personal digital assistant and senior software engineer.

CORE PRINCIPLES FOR HIGH CLARITY AND QUALITY:
1. DIRECT ANSWER: Deliver the answer or solution directly in the very first sentence. Never start with conversational filler or robotic boilerplate ("Sure!", "Certainly!", "I'd be happy to...", "As an AI...").
2. CRYSTAL-CLEAR STRUCTURE:
   - Use clean, well-spaced Markdown.
   - Use bold terms for key concepts.
   - Use concise bullet points for scannability.
   - Use clear section headings (##, ###) where appropriate.
3. FOR CODE REVIEW & PROGRAMMING:
   - Point out specific strengths, bugs, performance bottlenecks, and security issues.
   - Provide the complete, production-ready, beautifully formatted code block.
   - Highlight the concrete improvements made (e.g. accessibility, semantic HTML, mobile responsiveness, error handling).
4. MULTI-LINGUAL: Understand and respond naturally in whatever language the user uses (English, Kinyarwanda, French, Swahili, Spanish, etc.).
${activeMemories ? `\nUSER CONTEXT & PREFERENCES:\n${activeMemories}\n` : ''}
`;

  // Detect tool intent from user query (e.g. code execution, SQL query)
  const lastUserMessage = messages[messages.length - 1];
  const queryText = lastUserMessage?.content || '';

  // Check if user specifically requested running code in sandbox
  const runCodeMatch = queryText.match(/(?:run|execute|test)\s+(?:this\s+)?(?:code|js|javascript):\s*```(?:javascript|js)?\s*([\s\S]+?)```/i);
  if (runCodeMatch) {
    const codeToRun = runCodeMatch[1];
    const execResult = await executeCodeSandbox(codeToRun);
    if (callbacks.onToolCall) {
      callbacks.onToolCall({
        tool: 'run_javascript_code',
        input: { code: codeToRun },
        output: execResult,
        status: execResult.error ? 'error' : 'success',
        timestamp: new Date().toISOString(),
        executionTimeMs: execResult.executionTimeMs,
      });
    }
  }

  // Format contents for Gemini SDK
  const contents = messages.map(msg => {
    const parts: any[] = [];

    // Multimodal attachments (images, documents)
    if (msg.attachments && msg.attachments.length > 0) {
      for (const att of msg.attachments) {
        if (att.dataUrl && att.dataUrl.startsWith('data:image/')) {
          const mimeType = att.dataUrl.split(';')[0].replace('data:', '');
          const base64Data = att.dataUrl.split(',')[1];
          if (base64Data) {
            parts.push({
              inlineData: {
                mimeType,
                data: base64Data,
              },
            });
          }
        } else if (att.textSnippet) {
          parts.push({
            text: `[Attached Document: ${att.name}]\n${att.textSnippet}\n`,
          });
        }
      }
    }

    parts.push({ text: msg.content });
    return {
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts,
    };
  });

  // Tools configuration (Search and Maps)
  const tools: any[] = [];
  if (enableSearchGrounding && settings.enableGrounding) {
    tools.push({ googleSearch: {} });
  }
  if (enableMapsGrounding) {
    tools.push({ googleMaps: {} });
  }

  // Build model priority queue starting with user's selected model
  const modelsToTry = [
    modelName || 'gemini-3.8-flash',
    ...CANDIDATE_MODELS.filter(m => m !== (modelName || 'gemini-3.8-flash')),
  ];

  let lastError: any = null;

  for (const modelToAttempt of modelsToTry) {
    // Attempt with tools if enabled, then fallback without tools if error occurs
    const configsToAttempt = tools.length > 0
      ? [
          { systemInstruction, tools },
          { systemInstruction }, // fallback without tools
        ]
      : [{ systemInstruction }];

    for (const config of configsToAttempt) {
      try {
        const ai = getAiClient();
        const stream = await ai.models.generateContentStream({
          model: modelToAttempt,
          contents,
          config,
        });

        let fullText = '';
        const citationsMap = new Map<string, { title: string; url: string; snippet?: string }>();

        for await (const chunk of stream) {
          const text = chunk.text;
          if (text) {
            fullText += text;
            callbacks.onChunk(text);
          }

          // Extract search citations if present
          const candidates = (chunk as any).candidates;
          if (candidates && candidates[0]?.groundingMetadata) {
            const gm = candidates[0].groundingMetadata;
            if (gm.groundingChunks) {
              for (const gc of gm.groundingChunks) {
                if (gc.web?.uri) {
                  citationsMap.set(gc.web.uri, {
                    title: gc.web.title || new URL(gc.web.uri).hostname,
                    url: gc.web.uri,
                    snippet: gc.web.snippet || '',
                  });
                }
              }
            }
          }
        }

        if (fullText.trim().length > 0) {
          const citations = Array.from(citationsMap.values());
          if (citations.length > 0 && callbacks.onCitations) {
            callbacks.onCitations(citations);
          }

          // Update active model in db if fallback succeeded
          if (modelToAttempt !== db.settings.defaultModel) {
            db.settings.defaultModel = modelToAttempt;
          }

          callbacks.onComplete(fullText, { citations, modelUsed: modelToAttempt });
          return;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[Aether AI] Attempt with model '${modelToAttempt}' failed (${err.message || err.status || err.code}). Trying next fallback...`);
        // If 503 or 429, continue to next fallback model immediately
        continue;
      }
    }
  }

  // If all live models failed, format a clear, polite error
  console.error('[Aether AI] All model attempts failed:', lastError);
  const friendlyErrorMessage = extractCleanErrorMessage(lastError);
  callbacks.onError(new Error(friendlyErrorMessage));
}

function extractCleanErrorMessage(err: any): string {
  if (!err) return 'Service temporarily busy. Please try again in a few moments.';
  const msg = err.message || String(err);
  if (msg.includes('503') || msg.includes('high demand') || msg.includes('UNAVAILABLE')) {
    return 'The AI service is experiencing temporary high demand worldwide. Please click Retry in a few seconds.';
  }
  if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
    return 'The request reached current rate limits. Please wait a moment and click Retry.';
  }
  if (msg.includes('403') || msg.includes('PERMISSION_DENIED')) {
    return 'Access error: please verify API key status in Settings.';
  }
  return 'Unable to complete response. Please check your connection and click Retry.';
}
