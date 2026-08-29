import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/utils';

interface TerminalAppProps {
  windowId: string;
}

interface TerminalLine {
  id: string;
  type: 'input' | 'output' | 'error';
  content: string;
  timestamp: number;
}

interface CommandHistory {
  command: string;
  output: string;
  exitCode: number;
}

const MOCK_FS: Record<string, string | Record<string, unknown>> = {
  '~': { Documents: {}, Downloads: {}, Pictures: {}, Music: {}, Videos: {}, Desktop: {}, '.config': {} },
  '~/Documents': { 'readme.txt': 'Welcome to AI OS', 'notes.md': '# Notes\n\nThis is a notes file.' },
  '~/Downloads': { 'image.png': '[binary data]', 'document.pdf': '[binary data]' },
  '~/Desktop': { 'shortcut.lnk': '' },
};

function resolvePath(cwd: string, path: string): string {
  if (path.startsWith('~') || path.startsWith('/')) return path;
  const parts = cwd.split('/').filter(Boolean);
  const pathParts = path.split('/');
  for (const part of pathParts) {
    if (part === '..') parts.pop();
    else if (part !== '.') parts.push(part);
  }
  return '/' + parts.join('/');
}

function getNode(path: string): unknown {
  const parts = path.split('/').filter(Boolean);
  let current: unknown = MOCK_FS;
  for (const part of parts) {
    if (typeof current === 'object' && current !== null && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return current;
}

function executeCommand(cmd: string, cwd: string): { output: string; newCwd: string; exitCode: number } {
  const trimmed = cmd.trim();
  if (!trimmed) return { output: '', newCwd: cwd, exitCode: 0 };

  const parts = trimmed.split(/\s+/);
  const command = parts[0];
  const args = parts.slice(1);

  switch (command) {
    case 'cd': {
      const target = args[0] || '~';
      const newPath = resolvePath(cwd, target);
      const node = getNode(newPath);
      if (node && typeof node === 'object') {
        return { output: '', newCwd: newPath, exitCode: 0 };
      }
      return { output: `cd: no such file or directory: ${target}`, newCwd: cwd, exitCode: 1 };
    }
    case 'ls': {
      const target = args[0] ? resolvePath(cwd, args[0]) : cwd;
      const node = getNode(target);
      if (node && typeof node === 'object') {
        const entries = Object.keys(node as Record<string, unknown>);
        const output = entries.map((e) => {
          const isDir = typeof (node as Record<string, unknown>)[e] === 'object';
          return isDir ? `\x1b[34m${e}/\x1b[0m` : e;
        }).join('  ');
        return { output, newCwd: cwd, exitCode: 0 };
      }
      return { output: `ls: cannot access '${args[0] || cwd}': No such file or directory`, newCwd: cwd, exitCode: 2 };
    }
    case 'pwd': return { output: cwd, newCwd: cwd, exitCode: 0 };
    case 'mkdir': {
      if (!args[0]) return { output: 'mkdir: missing operand', newCwd: cwd, exitCode: 1 };
      return { output: '', newCwd: cwd, exitCode: 0 };
    }
    case 'touch': {
      if (!args[0]) return { output: 'touch: missing file operand', newCwd: cwd, exitCode: 1 };
      return { output: '', newCwd: cwd, exitCode: 0 };
    }
    case 'rm': {
      if (!args[0]) return { output: 'rm: missing operand', newCwd: cwd, exitCode: 1 };
      return { output: '', newCwd: cwd, exitCode: 0 };
    }
    case 'cat': {
      if (!args[0]) return { output: 'cat: missing file operand', newCwd: cwd, exitCode: 1 };
      const filePath = resolvePath(cwd, args[0]);
      const node = getNode(filePath);
      if (typeof node === 'string') return { output: node, newCwd: cwd, exitCode: 0 };
      if (node && typeof node === 'object') return { output: `cat: ${args[0]}: Is a directory`, newCwd: cwd, exitCode: 1 };
      return { output: `cat: ${args[0]}: No such file or directory`, newCwd: cwd, exitCode: 1 };
    }
    case 'echo': return { output: args.join(' '), newCwd: cwd, exitCode: 0 };
    case 'clear': return { output: '__CLEAR__', newCwd: cwd, exitCode: 0 };
    case 'help': {
      return {
        output: `Available commands:
  cd [dir]      Change directory
  ls [dir]      List directory contents
  pwd           Print working directory
  mkdir [name]  Create directory
  touch [name]  Create file
  rm [name]     Remove file
  cat [file]    Display file contents
  echo [text]   Print text
  clear         Clear terminal
  history       Show command history
  whoami        Show current user
  date          Show current date/time
  uname         Show system info
  help          Show this help`,
        newCwd: cwd, exitCode: 0
      };
    }
    case 'whoami': return { output: 'user@ai-os', newCwd: cwd, exitCode: 0 };
    case 'date': return { output: new Date().toString(), newCwd: cwd, exitCode: 0 };
    case 'uname': return { output: 'AI-OS 1.0.0 x86_64', newCwd: cwd, exitCode: 0 };
    default: return { output: `${command}: command not found`, newCwd: cwd, exitCode: 127 };
  }
}

export function TerminalApp({ windowId: _windowId }: TerminalAppProps) {
  const [lines, setLines] = useState<TerminalLine[]>([
    { id: '0', type: 'output', content: 'AI-OS Terminal v1.0.0', timestamp: Date.now() },
    { id: '1', type: 'output', content: 'Type "help" for available commands.\n', timestamp: Date.now() },
  ]);
  const [input, setInput] = useState('');
  const [cwd, setCwd] = useState('~');
  const [history, setHistory] = useState<CommandHistory[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const inputLine: TerminalLine = {
      id: Date.now().toString(),
      type: 'input',
      content: `${cwd} $ ${input}`,
      timestamp: Date.now(),
    };

    if (input.trim() === 'clear') {
      setLines([]);
      setInput('');
      setHistory((prev) => [...prev, { command: input, output: '', exitCode: 0 }]);
      return;
    }

    if (input.trim() === 'history') {
      const historyOutput = history.map((h, i) => `  ${i + 1}  ${h.command}`).join('\n');
      const outputLine: TerminalLine = {
        id: (Date.now() + 1).toString(),
        type: 'output',
        content: historyOutput || 'No commands in history',
        timestamp: Date.now(),
      };
      setLines((prev) => [...prev, inputLine, outputLine]);
      setInput('');
      setHistory((prev) => [...prev, { command: input, output: historyOutput, exitCode: 0 }]);
      return;
    }

    const result = executeCommand(input, cwd);
    const outputLine: TerminalLine = {
      id: (Date.now() + 1).toString(),
      type: result.exitCode === 0 ? 'output' : 'error',
      content: result.output,
      timestamp: Date.now(),
    };

    setLines((prev) => [...prev, inputLine, outputLine]);
    setCwd(result.newCwd);
    setHistory((prev) => [...prev, { command: input, output: result.output, exitCode: result.exitCode }]);
    setHistoryIndex(-1);
    setInput('');
  }, [input, cwd, history]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const newIndex = historyIndex < history.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex]?.command || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex]?.command || '');
      } else {
        setHistoryIndex(-1);
        setInput('');
      }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      setLines([]);
    } else if (e.key === 'c' && e.ctrlKey) {
      e.preventDefault();
      setInput('');
    }
  }, [history, historyIndex, handleSubmit]);

  return (
    <div
      className="flex flex-col h-full bg-[#1a1b26] text-[#a9b1d6]"
      onClick={() => inputRef.current?.focus()}
    >
      <div ref={terminalRef} className="flex-1 overflow-y-auto p-4 font-mono text-sm leading-relaxed">
        {lines.map((line) => (
          <div key={line.id} className={cn('whitespace-pre-wrap break-all', line.type === 'error' && 'text-[#f7768e]')}>
            {line.type === 'input' ? (
              <div className="flex gap-2">
                <span className="text-[#7aa2f7]">{line.content.split(' $ ')[0]} $</span>
                <span className="text-[#c0caf5]">{line.content.split(' $ ').slice(1).join(' $ ')}</span>
              </div>
            ) : (
              <span className={line.type === 'error' ? 'text-[#f7768e]' : 'text-[#a9b1d6]'}>{line.content}</span>
            )}
          </div>
        ))}

        <form onSubmit={handleSubmit} className="flex gap-2 mt-1">
          <span className="text-[#7aa2f7] whitespace-nowrap">{cwd} $</span>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent border-none outline-none resize-none text-[#c0caf5] font-mono text-sm leading-relaxed"
            rows={1}
            autoFocus
            spellCheck={false}
            autoComplete="off"
          />
        </form>
      </div>

      <div className="flex items-center justify-between px-4 py-1.5 bg-[#16161e] border-t border-[#292e42] text-xs text-[#565f89]">
        <span>Terminal</span>
        <div className="flex items-center gap-3">
          <span>{cwd}</span>
          <span>UTF-8</span>
        </div>
      </div>
    </div>
  );
}