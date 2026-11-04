import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Plus,
  Trash2,
  Clock,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Calendar,
} from 'lucide-react';
import { TaskItem } from '../types/index.js';
import { fetchTasks, createTask, updateTask, deleteTask } from '../services/api.js';

interface TaskBoardProps {
  onPlanDayInChat: (tasks: TaskItem[]) => void;
}

export const TaskBoard: React.FC<TaskBoardProps> = ({ onPlanDayInChat }) => {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newCategory, setNewCategory] = useState('Engineering');
  const [newDueDate, setNewDueDate] = useState('');

  const loadTasks = async () => {
    try {
      const data = await fetchTasks();
      setTasks(data);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    try {
      const created = await createTask({
        title: newTitle.trim(),
        description: newDesc.trim(),
        priority: newPriority,
        category: newCategory,
        dueDate: newDueDate || undefined,
      });
      setTasks(prev => [created, ...prev]);
      setShowAddModal(false);
      setNewTitle('');
      setNewDesc('');
    } catch (err) {
      console.error('Error creating task:', err);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: 'todo' | 'in_progress' | 'done') => {
    try {
      const updated = await updateTask(taskId, { status: newStatus });
      setTasks(prev => prev.map(t => (t.id === taskId ? updated : t)));
    } catch (err) {
      console.error('Error updating task status:', err);
    }
  };

  const handleDelete = async (taskId: string) => {
    await deleteTask(taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const columns: Array<{ id: 'todo' | 'in_progress' | 'done'; title: string; count: number }> = [
    { id: 'todo', title: 'To Do', count: tasks.filter(t => t.status === 'todo').length },
    { id: 'in_progress', title: 'In Progress', count: tasks.filter(t => t.status === 'in_progress').length },
    { id: 'done', title: 'Completed', count: tasks.filter(t => t.status === 'done').length },
  ];

  const priorityColor = (p: string) => {
    if (p === 'high') return 'text-red-600 dark:text-red-400 font-semibold';
    if (p === 'medium') return 'text-amber-600 dark:text-amber-400 font-medium';
    return 'text-slate-500 font-normal';
  };

  return (
    <div className="flex flex-col h-[calc(100vh-57px)] w-full overflow-hidden bg-slate-50 dark:bg-slate-950 p-6 sm:p-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-indigo-500" />
            <span>Productivity & Task Management</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Organize ongoing engineering initiatives, research milestones, and time-blocked agendas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onPlanDayInChat(tasks.filter(t => t.status !== 'done'))}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 rounded-lg transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Daily Schedule Planner</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg hover:opacity-90 transition-opacity shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Kanban Board Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 overflow-hidden">
        {columns.map(col => {
          const colTasks = tasks.filter(t => t.status === col.id);
          return (
            <div
              key={col.id}
              className="flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    {col.title}
                  </span>
                  <span className="text-xs text-slate-400 font-mono tabular-nums">
                    ({col.count})
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {colTasks.length === 0 ? (
                  <div className="h-32 flex items-center justify-center text-xs text-slate-400">
                    No tasks in {col.title.toLowerCase()}
                  </div>
                ) : (
                  colTasks.map(task => (
                    <div
                      key={task.id}
                      className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-lg space-y-2 hover:border-slate-300 dark:hover:border-slate-600 transition-colors shadow-2xs group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-semibold text-slate-900 dark:text-white leading-snug">
                          {task.title}
                        </h4>
                        <button
                          onClick={() => handleDelete(task.id)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 p-0.5 rounded transition-opacity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {task.description && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          {task.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700/60 text-[11px]">
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                          <span className={priorityColor(task.priority)}>
                            {task.priority.toUpperCase()}
                          </span>
                          <span>·</span>
                          <span>{task.category}</span>
                        </div>

                        {/* Move status buttons */}
                        <div className="flex items-center gap-1">
                          {col.id !== 'todo' && (
                            <button
                              onClick={() =>
                                handleStatusChange(
                                  task.id,
                                  col.id === 'done' ? 'in_progress' : 'todo'
                                )
                              }
                              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500"
                              title="Move back"
                            >
                              <ChevronLeft className="w-3 h-3" />
                            </button>
                          )}
                          {col.id !== 'done' && (
                            <button
                              onClick={() =>
                                handleStatusChange(
                                  task.id,
                                  col.id === 'todo' ? 'in_progress' : 'done'
                                )
                              }
                              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500"
                              title="Advance status"
                            >
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Create New Task</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Implement Web Search grounding verification"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Details, acceptance criteria, or links"
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={newPriority}
                    onChange={e => setNewPriority(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newTitle.trim()}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-40"
              >
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
