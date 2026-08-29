import { ipcMain } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

interface DBRecord {
  [key: string]: unknown;
}

interface DatabaseStore {
  notes: DBRecord[];
  tasks: DBRecord[];
  calendar_events: DBRecord[];
  applications: DBRecord[];
  settings: DBRecord[];
  notifications: DBRecord[];
  ai_conversations: DBRecord[];
  ai_messages: DBRecord[];
}

let store: DatabaseStore = {
  notes: [],
  tasks: [],
  calendar_events: [],
  applications: [],
  settings: [],
  notifications: [],
  ai_conversations: [],
  ai_messages: [],
};

function getDbPath(): string {
  const dataDir = path.join(os.homedir(), '.ai-os');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  return path.join(dataDir, 'ai-os.json');
}

function loadStore(): DatabaseStore {
  try {
    const dbPath = getDbPath();
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to load database:', error);
  }
  return {
    notes: [],
    tasks: [],
    calendar_events: [],
    applications: [],
    settings: [],
    notifications: [],
    ai_conversations: [],
    ai_messages: [],
  };
}

function saveStore(): void {
  try {
    const dbPath = getDbPath();
    fs.writeFileSync(dbPath, JSON.stringify(store, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to save database:', error);
  }
}

function parseSQL(sql: string): { table: string; operation: string; conditions: string[]; values: unknown[] } {
  const trimmed = sql.trim().toUpperCase();
  let table = '';
  let operation = '';
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (trimmed.startsWith('SELECT')) {
    operation = 'SELECT';
    const fromMatch = sql.match(/FROM\s+(\w+)/i);
    if (fromMatch) table = fromMatch[1];
    const whereMatch = sql.match(/WHERE\s+(.+?)(?:ORDER|LIMIT|$)/i);
    if (whereMatch) conditions.push(whereMatch[1]);
  } else if (trimmed.startsWith('INSERT')) {
    operation = 'INSERT';
    const intoMatch = sql.match(/INTO\s+(\w+)/i);
    if (intoMatch) table = intoMatch[1];
  } else if (trimmed.startsWith('UPDATE')) {
    operation = 'UPDATE';
    const updateMatch = sql.match(/UPDATE\s+(\w+)/i);
    if (updateMatch) table = updateMatch[1];
    const whereMatch = sql.match(/WHERE\s+(.+?)$/i);
    if (whereMatch) conditions.push(whereMatch[1]);
  } else if (trimmed.startsWith('DELETE')) {
    operation = 'DELETE';
    const fromMatch = sql.match(/FROM\s+(\w+)/i);
    if (fromMatch) table = fromMatch[1];
    const whereMatch = sql.match(/WHERE\s+(.+?)$/i);
    if (whereMatch) conditions.push(whereMatch[1]);
  } else if (trimmed.startsWith('CREATE')) {
    operation = 'CREATE';
    const tableMatch = sql.match(/TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/i);
    if (tableMatch) table = tableMatch[1];
  }

  return { table, operation, conditions, values };
}

function matchRecord(record: DBRecord, conditions: string[]): boolean {
  if (conditions.length === 0) return true;

  return conditions.every((condition) => {
    const parts = condition.split('=');
    if (parts.length === 2) {
      const key = parts[0].trim();
      const value = parts[1].trim().replace(/['"]/g, '');
      return String(record[key]) === value;
    }
    return true;
  });
}

export function setupDatabaseHandlers() {
  store = loadStore();

  ipcMain.handle('db:query', async (_, sql: string, params?: unknown[]) => {
    try {
      const { table, operation, conditions } = parseSQL(sql);

      if (operation === 'SELECT' && table) {
        const records = store[table as keyof DatabaseStore] || [];
        const filtered = records.filter((r) => matchRecord(r, conditions));
        return { success: true, rows: filtered };
      }

      return { success: true, rows: [] };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('db:execute', async (_, sql: string, params?: unknown[]) => {
    try {
      const { table, operation, conditions } = parseSQL(sql);

      if (operation === 'INSERT' && table) {
        const records = store[table as keyof DatabaseStore] || [];
        const newRecord: DBRecord = { id: Date.now().toString(), created_at: Date.now(), updated_at: Date.now() };
        records.push(newRecord);
        (store as any)[table] = records;
        saveStore();
        return { success: true, changes: 1, lastInsertRowid: newRecord.id };
      }

      if (operation === 'UPDATE' && table) {
        const records = store[table as keyof DatabaseStore] || [];
        let changes = 0;
        records.forEach((r) => {
          if (matchRecord(r, conditions)) {
            Object.assign(r, { updated_at: Date.now() });
            changes++;
          }
        });
        saveStore();
        return { success: true, changes };
      }

      if (operation === 'DELETE' && table) {
        const records = store[table as keyof DatabaseStore] || [];
        const before = records.length;
        const filtered = records.filter((r) => !matchRecord(r, conditions));
        (store as any)[table] = filtered;
        saveStore();
        return { success: true, changes: before - filtered.length };
      }

      if (operation === 'CREATE' && table) {
        if (!(store as any)[table]) {
          (store as any)[table] = [];
          saveStore();
        }
        return { success: true, changes: 0 };
      }

      return { success: true, changes: 0 };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('db:migrate', async () => {
    try {
      store = loadStore();
      saveStore();
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('db:seed', async () => {
    try {
      store = loadStore();

      if (store.notes.length === 0) {
        store.notes = [
          { id: '1', title: 'Welcome to AI OS', content: '# Welcome\n\nThis is your AI Operating System.\n\n## Features\n\n- File Manager\n- Terminal\n- Notes\n- Calculator\n- Calendar\n- Task Manager\n- AI Assistant\n\nEnjoy!', is_pinned: 1, is_favorite: 1, tags: '["welcome"]', created_at: Date.now() - 86400000 * 7, updated_at: Date.now() },
          { id: '2', title: 'Shopping List', content: '- Milk\n- Eggs\n- Bread\n- Cheese\n- Apples', is_pinned: 0, is_favorite: 0, tags: '["shopping"]', created_at: Date.now() - 86400000 * 3, updated_at: Date.now() - 86400000 },
        ];
      }

      if (store.tasks.length === 0) {
        store.tasks = [
          { id: '1', title: 'Review pull requests', description: 'Check pending PRs', completed: 0, priority: 'high', due_date: Date.now() + 86400000, category: 'Work', created_at: Date.now() - 86400000 * 3, updated_at: Date.now() - 86400000 },
          { id: '2', title: 'Buy groceries', description: 'Milk, eggs, bread', completed: 1, priority: 'low', category: 'Personal', created_at: Date.now() - 86400000 * 4, updated_at: Date.now() },
        ];
      }

      saveStore();
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });
}