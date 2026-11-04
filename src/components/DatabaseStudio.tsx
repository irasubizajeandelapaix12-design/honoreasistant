import React, { useState, useEffect } from 'react';
import { Database, Play, Table, Sparkles, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { fetchSqlTables, executeSql } from '../services/api.js';
import { SqlResult } from '../types/index.js';

interface DatabaseStudioProps {
  onAskAiSql: (prompt: string) => void;
}

export const DatabaseStudio: React.FC<DatabaseStudioProps> = ({ onAskAiSql }) => {
  const [tables, setTables] = useState<Record<string, { columns: string[]; rows: any[] }>>({});
  const [activeTable, setActiveTable] = useState<string>('projects');
  const [query, setQuery] = useState('SELECT * FROM projects WHERE budget >= 15000 ORDER BY budget DESC;');
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<SqlResult | null>(null);

  const loadTables = async () => {
    try {
      const data = await fetchSqlTables();
      setTables(data);
      const tableKeys = Object.keys(data);
      if (tableKeys.length > 0 && !data[activeTable]) {
        setActiveTable(tableKeys[0]);
      }
    } catch (err) {
      console.error('Error fetching tables:', err);
    }
  };

  useEffect(() => {
    loadTables();
    handleRunQuery(query);
  }, []);

  const handleRunQuery = async (sqlToRun: string) => {
    setIsRunning(true);
    try {
      const res = await executeSql(sqlToRun);
      setResult(res);
      // Reload tables in case a table was created or row inserted
      await loadTables();
    } catch (err: any) {
      setResult({ columns: [], rows: [], error: err.message });
    } finally {
      setIsRunning(false);
    }
  };

  const sampleQueries = [
    { title: 'High Budget Projects', sql: 'SELECT * FROM projects WHERE budget > 20000 ORDER BY budget DESC;' },
    { title: 'Team Specialties', sql: 'SELECT name, role, specialty, experience_yrs FROM team_members;' },
    { title: 'Show Internal Tables', sql: 'SHOW TABLES;' },
    { title: 'Describe Projects Schema', sql: 'DESCRIBE projects;' },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-57px)] w-full bg-slate-900 text-slate-100 overflow-hidden">
      {/* Studio Toolbar */}
      <div className="flex items-center justify-between px-6 py-2.5 bg-slate-950 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-semibold text-slate-200">
            <Database className="w-4 h-4 text-indigo-400" />
            <span>Relational Database Assistant</span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded-md border border-slate-800 text-[11px] text-slate-400">
            <span>Engine: SQLite Compliant SQL Engine</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onAskAiSql(`Help me design an optimized relational database schema or query for: ${query}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors font-medium"
            title="Ask AI to write or optimize SQL queries"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>AI Query Architect</span>
          </button>

          <button
            onClick={() => handleRunQuery(query)}
            disabled={isRunning || !query.trim()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg shadow-xs transition-colors disabled:opacity-50"
          >
            {isRunning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>Execute SQL</span>
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 overflow-hidden">
        {/* Left: Schema Explorer & Quick Queries */}
        <div className="border-r border-slate-800 bg-slate-950 p-4 space-y-5 overflow-y-auto">
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Database Tables ({Object.keys(tables).length})
            </div>
            <div className="space-y-1">
              {Object.keys(tables).map(tName => (
                <div
                  key={tName}
                  onClick={() => {
                    setActiveTable(tName);
                    const newSql = `SELECT * FROM ${tName};`;
                    setQuery(newSql);
                    handleRunQuery(newSql);
                  }}
                  className={`p-2 rounded-lg cursor-pointer text-xs flex items-center justify-between transition-colors ${
                    activeTable === tName
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40'
                      : 'text-slate-300 hover:bg-slate-900 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Table className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold">{tName}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono tabular-nums">
                    {tables[tName].rows.length} rows
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Quick Templates
            </div>
            <div className="space-y-1.5">
              {sampleQueries.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuery(item.sql);
                    handleRunQuery(item.sql);
                  }}
                  className="w-full text-left p-2 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[11px] text-slate-300 hover:text-white transition-colors"
                >
                  <div className="font-medium text-slate-200">{item.title}</div>
                  <div className="text-slate-500 font-mono truncate text-[10px] mt-0.5">{item.sql}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center / Right: Query Editor & Data Grid */}
        <div className="lg:col-span-3 flex flex-col h-full bg-slate-900 overflow-hidden">
          {/* SQL Editor Area */}
          <div className="h-44 flex flex-col border-b border-slate-800 bg-slate-950">
            <div className="flex items-center justify-between px-4 py-1.5 bg-slate-900/60 border-b border-slate-800 text-[11px] text-slate-400 font-mono">
              <span>SQL Query Console</span>
              <span>Supports SELECT, INSERT, CREATE TABLE, DESCRIBE</span>
            </div>
            <textarea
              value={query}
              onChange={e => setQuery(e.target.value)}
              spellCheck={false}
              className="flex-1 p-4 bg-transparent font-mono text-xs text-indigo-300 placeholder-slate-500 resize-none focus:outline-hidden leading-relaxed"
            />
          </div>

          {/* Results Data Grid */}
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-900">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-950/70 border-b border-slate-800 text-xs">
              <span className="font-semibold text-slate-300">Execution Result</span>
              {result?.message && (
                <span className="text-[11px] text-emerald-400 font-mono tabular-nums">
                  {result.message}
                </span>
              )}
            </div>

            <div className="flex-1 overflow-auto p-4">
              {result?.error ? (
                <div className="p-3 bg-red-950/50 border border-red-800 text-red-300 rounded-lg text-xs font-mono flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold">Query Failed</div>
                    <div>{result.error}</div>
                  </div>
                </div>
              ) : !result || result.rows.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2 text-xs">
                  <Table className="w-8 h-8 opacity-40" />
                  <p>Execute a SQL query to view rows and schemas</p>
                </div>
              ) : (
                <div className="rounded-lg border border-slate-800 overflow-hidden">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-950 text-slate-300 border-b border-slate-800">
                      <tr>
                        {result.columns.map((col, idx) => (
                          <th key={idx} className="px-3.5 py-2.5 font-semibold text-slate-200 uppercase tracking-wider text-[11px]">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                      {result.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-800/40 transition-colors">
                          {result.columns.map((col, cIdx) => (
                            <td key={cIdx} className="px-3.5 py-2 text-slate-300 tabular-nums">
                              {row[col] !== null && row[col] !== undefined
                                ? typeof row[col] === 'number'
                                  ? row[col].toLocaleString()
                                  : String(row[col])
                                : <span className="text-slate-600">NULL</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
