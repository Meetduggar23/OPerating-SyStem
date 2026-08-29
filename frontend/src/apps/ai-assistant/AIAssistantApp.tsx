import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Plus, Trash2, Bot, User, Wifi, WifiOff, RefreshCw, Copy, Check } from 'lucide-react';
import { cn, formatRelativeTime } from '@/utils';
import { useSettingsStore } from '@/stores/settingsStore';
import { generateId } from '@/utils';
import type { AIMessage } from '@/types';

interface AIAssistantAppProps {
  windowId: string;
}

interface Conversation {
  id: string;
  title: string;
  messages: AIMessage[];
  model: string;
  createdAt: number;
  updatedAt: number;
}

const DEFAULT_CONVERSATIONS: Conversation[] = [
  {
    id: '1', title: 'Welcome', model: 'llama3', createdAt: Date.now() - 86400000, updatedAt: Date.now() - 86400000,
    messages: [
      { id: '1', role: 'user', content: 'Hello!', timestamp: Date.now() - 86400000 },
      { id: '2', role: 'assistant', content: 'Hello! I\'m your AI assistant. I can help you with tasks, answer questions, and interact with your operating system. How can I help you today?', timestamp: Date.now() - 86400000 },
    ],
  },
];

const QUICK_ACTIONS = [
  { label: 'What can you do?', prompt: 'What can you do? What features do you have?' },
  { label: 'Tell me a joke', prompt: 'Tell me a joke' },
  { label: 'Explain quantum computing', prompt: 'Explain quantum computing in simple terms' },
  { label: 'Help me write code', prompt: 'Help me write a simple function in JavaScript' },
];

export function AIAssistantApp({ windowId: _windowId }: AIAssistantAppProps) {
  const { settings } = useSettingsStore();
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const stored = localStorage.getItem('ai-os-conversations');
      return stored ? JSON.parse(stored) : DEFAULT_CONVERSATIONS;
    } catch { return DEFAULT_CONVERSATIONS; }
  });
  const [activeConvId, setActiveConvId] = useState<string>(conversations[0]?.id || '');
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState(settings.ai.defaultModel);
  const [showSidebar, setShowSidebar] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const activeConv = conversations.find((c) => c.id === activeConvId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConv?.messages]);

  useEffect(() => {
    const checkOllama = async () => {
      if (window.electronAPI?.ai) {
        try {
          const result = await window.electronAPI.ai.checkOllama();
          if (result.success && result.available) {
            setOllamaStatus('connected');
            setAvailableModels(result.models || []);
          } else {
            setOllamaStatus('disconnected');
          }
        } catch {
          setOllamaStatus('disconnected');
        }
      } else {
        setOllamaStatus('disconnected');
      }
    };
    checkOllama();
    const interval = setInterval(checkOllama, 30000);
    return () => clearInterval(interval);
  }, []);

  const createConversation = useCallback(() => {
    const newConv: Conversation = {
      id: generateId(), title: 'New Chat', model: selectedModel, messages: [], createdAt: Date.now(), updatedAt: Date.now(),
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveConvId(newConv.id);
  }, [selectedModel]);

  const deleteConversation = useCallback((id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConvId === id) {
      setActiveConvId(conversations.find((c) => c.id !== id)?.id || '');
    }
  }, [activeConvId, conversations]);

  const simulateAIResponse = (userMessage: string): string => {
    const lowerMsg = userMessage.toLowerCase();
    if (lowerMsg.includes('hello') || lowerMsg.includes('hi')) {
      return 'Hello! How can I assist you today?';
    }
    if (lowerMsg.includes('what can you do')) {
      return 'I can help you with:\n\n• **Answering questions** about various topics\n• **Writing and explaining code**\n• **Creating notes and tasks** in your OS\n• **Searching files** and applications\n• **Managing your calendar**\n• **System information** and monitoring\n\nJust ask me anything!';
    }
    if (lowerMsg.includes('joke')) {
      return 'Why do programmers prefer dark mode? Because light attracts bugs! 🐛';
    }
    if (lowerMsg.includes('quantum')) {
      return 'Quantum computing uses **qubits** instead of classical bits. While a classical bit is either 0 or 1, a qubit can be in a **superposition** of both states simultaneously. This allows quantum computers to process certain calculations exponentially faster than classical computers.';
    }
    if (lowerMsg.includes('code') || lowerMsg.includes('function')) {
      return 'Here\'s a simple JavaScript function:\n\n```javascript\nfunction greet(name) {\n  return `Hello, ${name}!`;\n}\n\nconsole.log(greet("World"));\n```\n\nThis function takes a name parameter and returns a greeting string.';
    }
    return `I understand your question about "${userMessage}". Here\'s my response:\n\nThis is a simulated response since Ollama is not currently connected. To enable real AI responses, please install and start Ollama on your system.\n\nYou can learn more at [ollama.ai](https://ollama.ai)`;
  };

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isGenerating || !activeConv) return;

    const userMessage: AIMessage = {
      id: generateId(), role: 'user', content: input.trim(), timestamp: Date.now(),
    };

    const updatedConv = { ...activeConv, messages: [...activeConv.messages, userMessage], updatedAt: Date.now() };
    if (updatedConv.messages.length === 1) {
      updatedConv.title = input.trim().slice(0, 50);
    }

    setConversations((prev) => prev.map((c) => c.id === activeConvId ? updatedConv : c));
    setInput('');
    setIsGenerating(true);

    try {
      let responseText: string;
      if (ollamaStatus === 'connected' && window.electronAPI?.ai) {
        const chatMessages: ChatMessage[] = updatedConv.messages.map((m) => ({ role: m.role, content: m.content }));
        const result = await window.electronAPI.ai.chat(chatMessages, selectedModel);
        responseText = result.success ? (result.response || 'No response received') : 'Failed to get response from AI';
      } else {
        await new Promise((r) => setTimeout(r, 1000 + Math.random() * 1500));
        responseText = simulateAIResponse(input.trim());
      }

      const aiMessage: AIMessage = {
        id: generateId(), role: 'assistant', content: responseText, timestamp: Date.now(),
      };

      setConversations((prev) => prev.map((c) =>
        c.id === activeConvId ? { ...c, messages: [...c.messages, aiMessage], updatedAt: Date.now() } : c
      ));
    } catch (err) {
      const errorMessage: AIMessage = {
        id: generateId(), role: 'assistant', content: `Error: ${err instanceof Error ? err.message : 'Unknown error occurred'}`, timestamp: Date.now(),
      };
      setConversations((prev) => prev.map((c) =>
        c.id === activeConvId ? { ...c, messages: [...c.messages, errorMessage], updatedAt: Date.now() } : c
      ));
    }
    setIsGenerating(false);
  }, [input, isGenerating, activeConv, activeConvId, ollamaStatus, selectedModel]);

  const copyMessage = useCallback((content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="flex h-full bg-surface">
      {showSidebar && (
        <div className="w-64 border-r border-border bg-surface-hover flex flex-col">
          <div className="p-3 border-b border-border">
            <button className="btn-primary w-full" onClick={createConversation}><Plus className="w-4 h-4" /> New Chat</button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {conversations.map((conv) => (
              <div key={conv.id} className={cn('group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors', activeConvId === conv.id ? 'bg-primary/15 text-primary' : 'text-text-secondary hover:bg-surface-hover')}>
                <span className="flex-1 text-sm truncate" onClick={() => setActiveConvId(conv.id)}>{conv.title}</span>
                <button className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-surface-hover transition-all" onClick={() => deleteConversation(conv.id)}><Trash2 className="w-3 h-3 text-danger" /></button>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-border space-y-2">
            <div className="flex items-center gap-2 text-xs">
              {ollamaStatus === 'connected' ? <Wifi className="w-3.5 h-3.5 text-success" /> : ollamaStatus === 'disconnected' ? <WifiOff className="w-3.5 h-3.5 text-danger" /> : <RefreshCw className="w-3.5 h-3.5 text-text-muted animate-spin" />}
              <span className={cn(ollamaStatus === 'connected' ? 'text-success' : ollamaStatus === 'disconnected' ? 'text-danger' : 'text-text-muted')}>
                {ollamaStatus === 'connected' ? 'Ollama Connected' : ollamaStatus === 'disconnected' ? 'Ollama Disconnected' : 'Checking...'}
              </span>
            </div>
            {availableModels.length > 0 && (
              <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} className="input text-xs py-1">
                {availableModels.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <button className="p-1.5 rounded hover:bg-surface-hover transition-colors text-text-muted" onClick={() => setShowSidebar(!showSidebar)}>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18" /></svg>
          </button>
          <Bot className="w-5 h-5 text-primary" />
          <span className="text-sm font-medium text-text">AI Assistant</span>
          <div className="flex-1" />
          <span className="text-xs text-text-muted">{selectedModel}</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeConv?.messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center mb-4"><Bot className="w-8 h-8 text-primary" /></div>
              <h2 className="text-xl font-semibold text-text mb-2">AI Assistant</h2>
              <p className="text-sm text-text-muted mb-6 text-center max-w-md">Ask me anything, or try one of these quick actions:</p>
              <div className="grid grid-cols-2 gap-2 max-w-md w-full">
                {QUICK_ACTIONS.map((action) => (
                  <button key={action.label} className="p-3 bg-surface border border-border rounded-xl text-left text-sm text-text-secondary hover:bg-surface-hover hover:border-primary/30 transition-all" onClick={() => { setInput(action.prompt); }}>
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeConv?.messages.map((message) => (
            <div key={message.id} className={cn('flex gap-3 max-w-3xl', message.role === 'user' ? 'ml-auto flex-row-reverse' : '')}>
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', message.role === 'user' ? 'bg-primary' : 'bg-surface-active border border-border')}>
                {message.role === 'user' ? <User className="w-4 h-4 text-text-inverse" /> : <Bot className="w-4 h-4 text-text" />}
              </div>
              <div className={cn('flex-1 rounded-xl p-3', message.role === 'user' ? 'bg-primary/15 text-text' : 'bg-surface border border-border')}>
                <div className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-text-muted">{formatRelativeTime(message.timestamp)}</span>
                  <button className="p-1 rounded hover:bg-black/5 transition-colors text-text-muted" onClick={() => copyMessage(message.content, message.id)}>
                    {copiedId === message.id ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {isGenerating && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-surface-active border border-border flex items-center justify-center"><Bot className="w-4 h-4 text-text" /></div>
              <div className="bg-surface border border-border rounded-xl p-3"><div className="flex gap-1"><div className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} /><div className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} /><div className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} /></div></div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-border">
          <div className="flex items-end gap-2 max-w-3xl mx-auto">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={ollamaStatus === 'connected' ? 'Ask me anything...' : 'Ollama not connected - using simulated responses...'}
              className="flex-1 resize-none bg-surface border border-border rounded-xl px-4 py-3 text-sm text-text placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none min-h-[44px] max-h-[120px]"
              rows={1}
            />
            <button className="p-3 rounded-xl bg-primary text-text-inverse hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed" onClick={sendMessage} disabled={!input.trim() || isGenerating}>
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] text-text-muted text-center mt-2">{ollamaStatus === 'connected' ? `Connected to Ollama - Model: ${selectedModel}` : 'Running in offline mode - install Ollama for real AI responses'}</p>
        </div>
      </div>
    </div>
  );
}