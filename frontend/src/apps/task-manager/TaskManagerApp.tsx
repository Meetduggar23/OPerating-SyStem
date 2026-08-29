import { useState, useCallback } from 'react';
import { Plus, Search, Check, Trash2, Edit3, X, Clock, AlertTriangle, CheckSquare, Filter, Calendar } from 'lucide-react';
import { cn, formatRelativeTime } from '@shared/utils';
import { generateId } from '@shared/constants';
import type { Task, TaskPriority } from '@shared/types';

interface TaskManagerAppProps {
  windowId: string;
}

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  urgent: { label: 'Urgent', color: 'text-danger', icon: AlertTriangle },
  high: { label: 'High', color: 'text-warning', icon: AlertTriangle },
  medium: { label: 'Medium', color: 'text-primary', icon: Clock },
  low: { label: 'Low', color: 'text-text-muted', icon: Clock },
};

const DEFAULT_TASKS: Task[] = [
  { id: '1', title: 'Review pull requests', description: 'Check and approve pending PRs', completed: false, priority: 'high', dueDate: Date.now() + 86400000, category: 'Work', createdAt: Date.now() - 86400000 * 3, updatedAt: Date.now() - 86400000 },
  { id: '2', title: 'Update documentation', description: 'Write API docs for new endpoints', completed: false, priority: 'medium', dueDate: Date.now() + 86400000 * 5, category: 'Work', createdAt: Date.now() - 86400000 * 2, updatedAt: Date.now() - 86400000 },
  { id: '3', title: 'Buy groceries', description: 'Milk, eggs, bread, vegetables', completed: true, priority: 'low', dueDate: Date.now() - 86400000, category: 'Personal', createdAt: Date.now() - 86400000 * 4, updatedAt: Date.now(), completedAt: Date.now() },
  { id: '4', title: 'Fix login bug', description: 'Users unable to login with SSO', completed: false, priority: 'urgent', dueDate: Date.now(), category: 'Work', createdAt: Date.now() - 86400000, updatedAt: Date.now() },
  { id: '5', title: 'Read chapter 5', description: 'Continue reading design patterns book', completed: false, priority: 'low', dueDate: Date.now() + 86400000 * 14, category: 'Personal', createdAt: Date.now() - 86400000 * 7, updatedAt: Date.now() - 86400000 * 2 },
];

export function TaskManagerApp({ windowId }: TaskManagerAppProps) {
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const stored = localStorage.getItem('ai-os-tasks');
      return stored ? JSON.parse(stored) : DEFAULT_TASKS;
    } catch { return DEFAULT_TASKS; }
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');
  const [filterPriority, setFilterPriority] = useState<TaskPriority | 'all'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPriority, setFormPriority] = useState<TaskPriority>('medium');
  const [formDueDate, setFormDueDate] = useState('');
  const [formCategory, setFormCategory] = useState('');

  const saveTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    localStorage.setItem('ai-os-tasks', JSON.stringify(newTasks));
  };

  const filteredTasks = tasks.filter((t) => {
    if (filterStatus === 'pending' && t.completed) return false;
    if (filterStatus === 'completed' && !t.completed) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
    }
    return true;
  }).sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const priorityOrder: Record<TaskPriority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  const stats = {
    total: tasks.length,
    completed: tasks.filter((t) => t.completed).length,
    pending: tasks.filter((t) => !t.completed).length,
    overdue: tasks.filter((t) => !t.completed && t.dueDate && t.dueDate < Date.now()).length,
  };

  const openCreateForm = () => {
    setFormTitle(''); setFormDescription(''); setFormPriority('medium');
    setFormDueDate(''); setFormCategory(''); setEditingTask(null);
    setShowForm(true);
  };

  const openEditForm = (task: Task) => {
    setFormTitle(task.title); setFormDescription(task.description);
    setFormPriority(task.priority);
    setFormDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
    setFormCategory(task.category || '');
    setEditingTask(task);
    setShowForm(true);
  };

  const saveTask = () => {
    if (!formTitle.trim()) return;
    if (editingTask) {
      saveTasks(tasks.map((t) => t.id === editingTask.id ? { ...t, title: formTitle, description: formDescription, priority: formPriority, dueDate: formDueDate ? new Date(formDueDate).getTime() : undefined, category: formCategory || undefined, updatedAt: Date.now() } : t));
    } else {
      const newTask: Task = { id: generateId(), title: formTitle, description: formDescription, completed: false, priority: formPriority, dueDate: formDueDate ? new Date(formDueDate).getTime() : undefined, category: formCategory || undefined, createdAt: Date.now(), updatedAt: Date.now() };
      saveTasks([newTask, ...tasks]);
    }
    setShowForm(false);
  };

  const toggleComplete = (id: string) => {
    saveTasks(tasks.map((t) => t.id === id ? { ...t, completed: !t.completed, completedAt: !t.completed ? Date.now() : undefined, updatedAt: Date.now() } : t));
  };

  const deleteTask = (id: string) => {
    saveTasks(tasks.filter((t) => t.id !== id));
  };

  return (
    <div className="flex h-full bg-surface">
      <div className="w-64 border-r border-border bg-surface-hover p-4 flex flex-col gap-4">
        <button className="btn-primary w-full" onClick={openCreateForm}><Plus className="w-4 h-4" /> New Task</button>
        <div className="space-y-2">
          <div className="p-3 bg-surface border border-border rounded-lg">
            <p className="text-xs text-text-muted">Total</p><p className="text-2xl font-bold text-text">{stats.total}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 bg-surface border border-border rounded-lg"><p className="text-[10px] text-text-muted">Pending</p><p className="text-lg font-semibold text-text">{stats.pending}</p></div>
            <div className="p-2 bg-surface border border-border rounded-lg"><p className="text-[10px] text-text-muted">Done</p><p className="text-lg font-semibold text-success">{stats.completed}</p></div>
          </div>
          {stats.overdue > 0 && (
            <div className="p-2 bg-danger/5 border border-danger/20 rounded-lg"><p className="text-[10px] text-danger">Overdue</p><p className="text-lg font-semibold text-danger">{stats.overdue}</p></div>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-text-muted uppercase">Filter</p>
          {(['all','pending','completed'] as const).map((s) => (
            <button key={s} className={cn('w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors', filterStatus === s ? 'bg-primary/15 text-primary' : 'text-text-secondary hover:bg-surface-hover')} onClick={() => setFilterStatus(s)}>
              {s === 'all' ? 'All Tasks' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-text-muted uppercase">Priority</p>
          {(['all','urgent','high','medium','low'] as const).map((p) => (
            <button key={p} className={cn('w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors', filterPriority === p ? 'bg-primary/15 text-primary' : 'text-text-secondary hover:bg-surface-hover')} onClick={() => setFilterPriority(p)}>
              {p === 'all' ? 'All Priorities' : PRIORITY_CONFIG[p].label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input type="text" placeholder="Search tasks..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="input pl-9" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-text-muted">
              <CheckSquare className="w-16 h-16 opacity-20 mb-4" />
              <p className="text-lg font-medium text-text">No tasks</p>
              <p className="text-sm">Create a new task to get started</p>
            </div>
          ) : (
            filteredTasks.map((task) => {
              const P = PRIORITY_CONFIG[task.priority];
              const isOverdue = !task.completed && task.dueDate && task.dueDate < Date.now();
              return (
                <div key={task.id} className={cn('flex items-start gap-3 p-4 rounded-xl border transition-all', task.completed ? 'bg-surface-hover/50 opacity-60' : 'bg-surface hover:shadow-md', isOverdue && 'border-danger/30')}>
                  <button className={cn('w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors', task.completed ? 'bg-success border-success' : 'border-border hover:border-primary')} onClick={() => toggleComplete(task.id)}>
                    {task.completed && <Check className="w-3 h-3 text-text-inverse" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-medium', task.completed ? 'line-through text-text-muted' : 'text-text')}>{task.title}</p>
                    {task.description && <p className="text-xs text-text-muted mt-0.5">{task.description}</p>}
                    <div className="flex items-center gap-2 mt-2">
                      <span className={cn('text-[10px] font-medium flex items-center gap-1', P.color)}><P.icon className="w-3 h-3" />{P.label}</span>
                      {task.dueDate && <span className={cn('text-[10px] flex items-center gap-1', isOverdue ? 'text-danger' : 'text-text-muted')}><Calendar className="w-3 h-3" />{new Date(task.dueDate).toLocaleDateString()}</span>}
                      {task.category && <span className="text-[10px] px-1.5 py-0.5 bg-surface-active border border-border rounded-full text-text-muted">{task.category}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="p-1.5 rounded hover:bg-surface-hover transition-colors text-text-muted" onClick={() => openEditForm(task)}><Edit3 className="w-3.5 h-3.5" /></button>
                    <button className="p-1.5 rounded hover:bg-danger/10 transition-colors text-danger" onClick={() => deleteTask(task.id)}><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/40" onClick={() => setShowForm(false)}>
          <div className="bg-surface border border-border rounded-xl shadow-window w-96 p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text">{editingTask ? 'Edit Task' : 'New Task'}</h3>
              <button className="p-1 rounded hover:bg-surface-hover" onClick={() => setShowForm(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div><label className="label">Title</label><input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} className="input" placeholder="Task title" autoFocus /></div>
              <div><label className="label">Description</label><textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} className="input min-h-[60px]" placeholder="Description" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Priority</label><select value={formPriority} onChange={(e) => setFormPriority(e.target.value as TaskPriority)} className="input">{Object.entries(PRIORITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></div>
                <div><label className="label">Due Date</label><input type="date" value={formDueDate} onChange={(e) => setFormDueDate(e.target.value)} className="input" /></div>
              </div>
              <div><label className="label">Category</label><input type="text" value={formCategory} onChange={(e) => setFormCategory(e.target.value)} className="input" placeholder="e.g., Work, Personal" /></div>
              <div className="flex justify-end gap-2 pt-2">
                <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button className="btn-primary" onClick={saveTask}>{editingTask ? 'Save' : 'Create'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}