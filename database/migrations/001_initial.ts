import Database from 'better-sqlite3';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { SCHEMA } from '../schema';

function getDbPath(): string {
  const dataDir = path.join(os.homedir(), '.ai-os');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  return path.join(dataDir, 'ai-os.db');
}

function migrate() {
  const dbPath = getDbPath();
  console.log(`Migrating database at: ${dbPath}`);

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  try {
    db.exec(SCHEMA);
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

function seed() {
  const dbPath = getDbPath();
  console.log(`Seeding database at: ${dbPath}`);

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  try {
    db.exec(SCHEMA);

    const noteCount = (db.prepare('SELECT COUNT(*) as count FROM notes').get() as any).count;
    if (noteCount === 0) {
      console.log('Seeding notes...');
      const insertNote = db.prepare('INSERT INTO notes (id, title, content, is_pinned, is_favorite, tags, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
      insertNote.run('1', 'Welcome to AI OS', '# Welcome\n\nThis is your AI Operating System.\n\n## Features\n\n- File Manager\n- Terminal\n- Notes\n- Calculator\n- Calendar\n- Task Manager\n- AI Assistant\n\nEnjoy!', 1, 1, '["welcome","getting-started"]', Date.now() - 86400000 * 7, Date.now());
      insertNote.run('2', 'Shopping List', '- Milk\n- Eggs\n- Bread\n- Cheese\n- Apples', 0, 0, '["shopping","personal"]', Date.now() - 86400000 * 3, Date.now() - 86400000);
      insertNote.run('3', 'Project Ideas', '## AI Operating System\n\nBuild a browser-based OS with:\n- Window manager\n- File system\n- Terminal\n- AI assistant', 0, 1, '["ideas","projects"]', Date.now() - 86400000 * 14, Date.now() - 86400000 * 5);
    }

    const taskCount = (db.prepare('SELECT COUNT(*) as count FROM tasks').get() as any).count;
    if (taskCount === 0) {
      console.log('Seeding tasks...');
      const insertTask = db.prepare('INSERT INTO tasks (id, title, description, completed, priority, due_date, category, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
      insertTask.run('1', 'Review pull requests', 'Check and approve pending PRs', 0, 'high', Date.now() + 86400000, 'Work', Date.now() - 86400000 * 3, Date.now() - 86400000);
      insertTask.run('2', 'Update documentation', 'Write API docs for new endpoints', 0, 'medium', Date.now() + 86400000 * 5, 'Work', Date.now() - 86400000 * 2, Date.now() - 86400000);
      insertTask.run('3', 'Buy groceries', 'Milk, eggs, bread, vegetables', 1, 'low', Date.now() - 86400000, 'Personal', Date.now() - 86400000 * 4, Date.now());
    }

    console.log('Seed completed successfully');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

const command = process.argv[2];
if (command === 'migrate') migrate();
else if (command === 'seed') { migrate(); seed(); }
else console.log('Usage: ts-node migrate.ts [migrate|seed]');