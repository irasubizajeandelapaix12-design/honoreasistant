import React, { useState } from 'react';
import { Copy, Check, Play, Terminal } from 'lucide-react';
import { marked } from 'marked';

interface MarkdownRendererProps {
  content: string;
  onRunCode?: (code: string, language: string) => void;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, onRunCode }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Extract code blocks with regex to render interactive code frames
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  const parts: Array<{ type: 'markdown' | 'code'; content: string; language?: string; index?: number }> = [];

  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let blockCounter = 0;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: 'markdown',
        content: content.substring(lastIndex, match.index),
      });
    }

    parts.push({
      type: 'code',
      language: match[1] || 'text',
      content: match[2].trimEnd(),
      index: blockCounter++,
    });

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({
      type: 'markdown',
      content: content.substring(lastIndex),
    });
  }

  return (
    <div className="space-y-3 leading-relaxed text-sm text-slate-800 dark:text-slate-200">
      {parts.map((part, i) => {
        if (part.type === 'code' && part.content) {
          const isRunnable = [
            'javascript', 'js', 'typescript', 'ts', 'html', 'sql', 'python', 'py',
            'bash', 'sh', 'shell', 'go', 'golang', 'rust', 'rs', 'java', 'c', 'cpp',
            'c++', 'csharp', 'cs', 'php', 'ruby', 'rb', 'json', 'yaml', 'yml', 'markdown', 'md'
          ].includes((part.language || '').toLowerCase());

          return (
            <div
              key={i}
              className="my-3 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-100 font-mono shadow-xs"
            >
              <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950/80 border-b border-slate-800 text-xs">
                <span className="text-slate-400 font-mono uppercase text-[11px] tracking-wider">
                  {part.language || 'code'}
                </span>
                <div className="flex items-center gap-2">
                  {isRunnable && onRunCode && (
                    <button
                      onClick={() => onRunCode(part.content, part.language || 'javascript')}
                      className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/50 rounded transition-colors"
                      title="Run code in Sandbox"
                    >
                      <Play className="w-3 h-3" />
                      <span>Run Sandbox</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleCopy(part.content, part.index || 0)}
                    className="flex items-center gap-1 px-2 py-0.5 text-[11px] text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
                    title="Copy code to clipboard"
                  >
                    {copiedIndex === part.index ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              <pre className="p-3.5 text-xs overflow-x-auto leading-normal font-mono scrollbar-thin">
                <code>{part.content}</code>
              </pre>
            </div>
          );
        }

        // Render standard markdown
        const rawHtml = marked.parse(part.content, { async: false, breaks: true }) as string;
        return (
          <div
            key={i}
            className="prose dark:prose-invert max-w-none prose-sm prose-p:leading-relaxed prose-headings:font-bold prose-headings:text-slate-900 dark:prose-headings:text-white prose-table:border-collapse prose-th:border prose-th:border-slate-300 dark:prose-th:border-slate-700 prose-td:border prose-td:border-slate-300 dark:prose-td:border-slate-700 prose-th:p-2 prose-td:p-2 prose-code:before:content-none prose-code:after:content-none prose-code:bg-slate-100 dark:prose-code:bg-slate-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono"
            dangerouslySetInnerHTML={{ __html: rawHtml }}
          />
        );
      })}
    </div>
  );
};
