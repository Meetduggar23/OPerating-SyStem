import { ipcMain } from 'electron';
import * as child_process from 'child_process';
import * as os from 'os';

const MAX_OUTPUT_LENGTH = 10000;
const COMMAND_TIMEOUT = 30000;

const BLOCKED_COMMANDS = [
  'rm -rf /', 'rm -rf /*', 'mkfs', 'dd if=', ':(){', 'fork',
  'shutdown', 'reboot', 'halt', 'init 0', 'init 6',
  'format', 'fdisk', 'chmod 777 /',
];

function isCommandBlocked(command: string): boolean {
  const normalized = command.toLowerCase().trim();
  return BLOCKED_COMMANDS.some((blocked) => normalized.includes(blocked));
}

export function setupTerminalHandlers() {
  ipcMain.handle('terminal:exec', async (_, command: string, cwd: string) => {
    try {
      if (isCommandBlocked(command)) {
        return { success: false, error: 'Command blocked for security reasons', exitCode: 1 };
      }

      const expandedCwd = cwd.replace('~', os.homedir());
      const shell = os.platform() === 'win32' ? 'cmd.exe' : '/bin/sh';
      const shellFlag = os.platform() === 'win32' ? '/c' : '-c';

      return new Promise((resolve) => {
        const proc = child_process.spawn(shell, [shellFlag, command], {
          cwd: expandedCwd,
          timeout: COMMAND_TIMEOUT,
          env: { ...process.env, FORCE_COLOR: '0' },
        });

        let stdout = '';
        let stderr = '';

        proc.stdout.on('data', (data: Buffer) => {
          stdout += data.toString();
          if (stdout.length > MAX_OUTPUT_LENGTH) {
            stdout = stdout.slice(0, MAX_OUTPUT_LENGTH) + '\n... (output truncated)';
          }
        });

        proc.stderr.on('data', (data: Buffer) => {
          stderr += data.toString();
          if (stderr.length > MAX_OUTPUT_LENGTH) {
            stderr = stderr.slice(0, MAX_OUTPUT_LENGTH) + '\n... (output truncated)';
          }
        });

        proc.on('close', (code) => {
          resolve({ success: true, output: stdout || stderr || '(no output)', exitCode: code ?? 1 });
        });

        proc.on('error', (error) => {
          resolve({ success: false, error: error.message, exitCode: 1 });
        });
      });
    } catch (error) {
      return { success: false, error: (error as Error).message, exitCode: 1 };
    }
  });

  ipcMain.handle('terminal:shell', () => {
    return os.platform() === 'win32' ? 'cmd.exe' : '/bin/sh';
  });
}