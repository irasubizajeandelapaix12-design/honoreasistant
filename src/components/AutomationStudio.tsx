import React, { useState, useEffect } from 'react';
import { Zap, Play, CheckCircle2, Clock, AlertTriangle, RefreshCw, FileText } from 'lucide-react';
import { AutomationWorkflow } from '../types/index.js';
import { fetchAutomations, runAutomation } from '../services/api.js';

export const AutomationStudio: React.FC = () => {
  const [automations, setAutomations] = useState<AutomationWorkflow[]>([]);
  const [runningId, setRunningId] = useState<string | null>(null);

  const loadAutomations = async () => {
    try {
      const data = await fetchAutomations();
      setAutomations(data);
    } catch (err) {
      console.error('Failed to load automations:', err);
    }
  };

  useEffect(() => {
    loadAutomations();
  }, []);

  const handleRun = async (id: string) => {
    setRunningId(id);
    try {
      await runAutomation(id);
      // Poll a few times to show step updates
      for (let i = 0; i < 6; i++) {
        await new Promise(r => setTimeout(r, 600));
        await loadAutomations();
      }
    } catch (err) {
      console.error('Error running automation:', err);
    } finally {
      setRunningId(null);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-57px)] w-full overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6 sm:p-8">
      <div className="max-w-5xl mx-auto w-full space-y-8">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <Zap className="w-4 h-4" />
            <span>Autonomous Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
            Automated Workflows & Multi-Step Agents
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed mt-1">
            Configure, trigger, and observe approved autonomous agent pipelines that coordinate search, data analysis, document creation, and task management.
          </p>
        </div>

        <div className="space-y-6">
          {automations.map(workflow => {
            const isRunning = runningId === workflow.id || workflow.status === 'running';
            return (
              <div
                key={workflow.id}
                className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {workflow.name}
                      </h3>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                        <span>Trigger: {workflow.trigger}</span>
                        <span>·</span>
                        <span className="capitalize">{workflow.status}</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
                      {workflow.description}
                    </p>
                  </div>

                  <button
                    onClick={() => handleRun(workflow.id)}
                    disabled={isRunning}
                    className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors disabled:opacity-50 shrink-0"
                  >
                    {isRunning ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Executing Pipeline...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Trigger Workflow</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Steps Progression */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Pipeline Execution Steps ({workflow.steps.length})
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {workflow.steps.map((step, sIdx) => {
                      const isStepRunning = step.status === 'running';
                      const isStepCompleted = step.status === 'completed';

                      return (
                        <div
                          key={step.id}
                          className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-800 text-xs"
                        >
                          <div className="mt-0.5 shrink-0">
                            {isStepCompleted ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            ) : isStepRunning ? (
                              <RefreshCw className="w-4 h-4 text-indigo-500 animate-spin" />
                            ) : (
                              <Clock className="w-4 h-4 text-slate-400" />
                            )}
                          </div>

                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                0{sIdx + 1}. {step.description}
                              </span>
                              <span className="text-[10px] font-mono uppercase text-slate-400">
                                {step.status}
                              </span>
                            </div>
                            {step.output && (
                              <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-lg border border-emerald-200 dark:border-emerald-800/40">
                                {step.output}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {workflow.lastRun && (
                  <div className="text-[11px] text-slate-400 font-mono">
                    Last execution: {new Date(workflow.lastRun).toLocaleString()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
