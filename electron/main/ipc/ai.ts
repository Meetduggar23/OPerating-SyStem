import { ipcMain } from 'electron';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

async function checkOllamaConnection(host: string): Promise<{ available: boolean; models: string[] }> {
  try {
    const response = await fetch(`${host}/api/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    if (response.ok) {
      const data = await response.json();
      return {
        available: true,
        models: data.models?.map((m: any) => m.name) || [],
      };
    }
    return { available: false, models: [] };
  } catch {
    return { available: false, models: [] };
  }
}

async function chatWithOllama(messages: ChatMessage[], model: string, host: string): Promise<string> {
  const response = await fetch(`${host}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      stream: false,
    }),
    signal: AbortSignal.timeout(120000),
  });

  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.status}`);
  }

  const data = await response.json();
  return data.message?.content || 'No response from Ollama';
}

function getLocalResponse(messages: ChatMessage[]): string {
  const lastMessage = messages[messages.length - 1]?.content.toLowerCase() || '';

  if (lastMessage.includes('hello') || lastMessage.includes('hi')) {
    return 'Hello! I\'m your AI assistant running locally. How can I help you today?';
  }
  if (lastMessage.includes('what can you do')) {
    return 'I can help you with:\n\n• Answering questions about various topics\n• Writing and explaining code\n• Creating notes and tasks\n• Searching files and applications\n• Managing your calendar\n• System monitoring\n\nNote: For more advanced responses, please install and start Ollama.';
  }
  if (lastMessage.includes('time')) {
    return `The current time is ${new Date().toLocaleTimeString()}.`;
  }
  if (lastMessage.includes('date')) {
    return `Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.`;
  }

  return `I received your message: "${messages[messages.length - 1]?.content}"\n\nI'm running in local mode without Ollama. For more advanced AI capabilities, please install Ollama from https://ollama.ai and start it on your system.\n\nIn the meantime, I can still help with basic OS operations like creating notes, managing tasks, and navigating files.`;
}

export function setupAIHandlers() {
  ipcMain.handle('ai:check-ollama', async () => {
    try {
      const settings = getSettings();
      const host = settings?.ai?.ollamaHost || 'http://localhost:11434';
      const result = await checkOllamaConnection(host);
      return { success: true, ...result };
    } catch (error) {
      return { success: false, available: false, models: [], error: (error as Error).message };
    }
  });

  ipcMain.handle('ai:chat', async (_, messages: ChatMessage[], model: string) => {
    try {
      const settings = getSettings();
      const host = settings?.ai?.ollamaHost || 'http://localhost:11434';
      const ollamaEnabled = settings?.ai?.ollamaEnabled !== false;

      if (ollamaEnabled) {
        const check = await checkOllamaConnection(host);
        if (check.available) {
          const response = await chatWithOllama(messages, model, host);
          return { success: true, response };
        }
      }

      const response = getLocalResponse(messages);
      return { success: true, response };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });
}

function getSettings(): any {
  try {
    const settingsPath = require('path').join(require('os').homedir(), '.ai-os', 'settings.json');
    if (require('fs').existsSync(settingsPath)) {
      return JSON.parse(require('fs').readFileSync(settingsPath, 'utf-8'));
    }
  } catch {}
  return { ai: { ollamaEnabled: true, ollamaHost: 'http://localhost:11434', defaultModel: 'llama3' } };
}