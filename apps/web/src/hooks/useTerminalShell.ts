import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { BlogPost, ResumeData } from '@/lib/data';
import { CommandRegistry, TerminalHistoryItem } from './commandStrategies';
import { fetchEventSource } from '@microsoft/fetch-event-source';

export function useTerminalShell(blogPosts: BlogPost[], resume: ResumeData) {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<TerminalHistoryItem[]>([]);
  const [isAiMode, setIsAiMode] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [isWarmingUp, setIsWarmingUp] = useState(false);
  
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const warmupTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Persistent history setup
  const HISTORY_KEY = 'terminal_history';
  const COMMANDS_KEY = 'terminal_command_history';
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [cmdIndex, setCmdIndex] = useState(-1);

  // Initialize history
  useEffect(() => {
    const savedCmds = localStorage.getItem(COMMANDS_KEY);
    if (savedCmds) {
      try { setCmdHistory(JSON.parse(savedCmds)); } catch (e) {}
    }
    const savedHistory = localStorage.getItem(HISTORY_KEY);
    if (savedHistory) {
      try { 
        setHistory(JSON.parse(savedHistory));
        return;
      } catch (e) {}
    }
    setHistory([
      { type: 'output', text: 'ajxcodes Interactive Shell' },
      { type: 'output', text: '(c) ajxcodes. All rights reserved.' },
      { type: 'output', text: 'Type "help" to list available commands.' },
      { type: 'output', text: '' },
    ]);
  }, []);

  // Save history
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    }
  }, [history]);

  useEffect(() => {
    if (terminalEndRef.current && terminalEndRef.current.parentElement) {
      const parent = terminalEndRef.current.parentElement;
      parent.scrollTo({ top: parent.scrollHeight, behavior: 'smooth' });
    }
  }, [history, isAiTyping, input]);

  const addToHistory = (items: TerminalHistoryItem[]) => {
    setHistory(prev => [...prev, ...items]);
  };

  const executeAiQuery = async (query: string, persistAiMode: boolean) => {
    const echo: TerminalHistoryItem = { 
      type: 'input', 
      text: query, 
      prompt: isAiMode ? 'ai@portfolio:~$' : 'guest@ajx-terminal:~$' 
    };
    addToHistory([echo]);

    const msgId = crypto.randomUUID();
    addToHistory([{ type: 'output', text: '', id: msgId, isMarkdown: true }]);
    setIsAiTyping(true);
    setIsWarmingUp(false);
    if (warmupTimerRef.current) clearTimeout(warmupTimerRef.current);
    warmupTimerRef.current = setTimeout(() => setIsWarmingUp(true), 3500);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const visitorSessionId = sessionStorage.getItem('visitor_session_id');

    try {
      await fetchEventSource('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
        body: JSON.stringify({ message: query, visitorSessionId: visitorSessionId || null }),
        signal: abortControllerRef.current.signal,
        async onopen(response) {
          if (!response.ok) throw new Error('Failed to connect to AI');
        },
        onmessage(msg) {
          if (msg.event === 'error') throw new Error(msg.data);
          
          if (warmupTimerRef.current) clearTimeout(warmupTimerRef.current);
          setIsWarmingUp(false);

          if (msg.event === 'done' || msg.data === '[DONE]') {
            setIsAiTyping(false);
            if (persistAiMode) setIsAiMode(true);
            return;
          }
          // Parse JSON chunk
          let chunk = '';
          try {
            chunk = JSON.parse(msg.data).text;
          } catch (e) {
            console.error('Failed to parse SSE JSON chunk:', e);
            throw new Error('Invalid JSON stream format from server');
          }
          setHistory(prev => prev.map(item => 
            item.id === msgId ? { ...item, text: item.text + chunk } : item
          ));
        },
        onerror(err) {
          if (warmupTimerRef.current) clearTimeout(warmupTimerRef.current);
          setIsWarmingUp(false);
          setIsAiTyping(false);
          setHistory(prev => prev.map(item => 
            item.id === msgId ? { ...item, text: item.text + '\n\n**[Connection Error]**' } : item
          ));
          throw err;
        }
      });
    } catch (e) {
      if (warmupTimerRef.current) clearTimeout(warmupTimerRef.current);
      setIsWarmingUp(false);
      setIsAiTyping(false);
    }
  };

  const executeCommand = (commandString: string) => {
    const trimmed = commandString.trim();
    if (!trimmed) {
      addToHistory([{ type: 'input', text: '', prompt: isAiMode ? 'ai@portfolio:~$' : 'guest@ajx-terminal:~$' }]);
      return;
    }

    // Save to command history
    const newCmds = [trimmed, ...cmdHistory].slice(0, 50);
    setCmdHistory(newCmds);
    setCmdIndex(-1);
    localStorage.setItem(COMMANDS_KEY, JSON.stringify(newCmds));

    if (isAiMode) {
      if (trimmed.toLowerCase() === 'exit') {
        addToHistory([{ type: 'input', text: 'exit', prompt: 'ai@portfolio:~$' }]);
        setIsAiMode(false);
        addToHistory([{ type: 'output', text: 'Exited AI mode.' }]);
        return;
      }
      executeAiQuery(trimmed, true);
      return;
    }

    const parts = trimmed.split(' ').filter(Boolean);
    const baseCmd = parts[0].toLowerCase();
    const arg = parts.slice(1).join(' ');

    if (baseCmd === 'ask') {
      if (!arg) {
        addToHistory([{ type: 'input', text: 'ask', prompt: 'guest@ajx-terminal:~$' }]);
        setIsAiMode(true);
        addToHistory([{ type: 'output', text: 'Entered AI mode. Type your questions, or type "exit" to leave.' }]);
      } else {
        executeAiQuery(arg, false);
      }
      return;
    }

    if (baseCmd === 'theme') {
      const echo: TerminalHistoryItem = { type: 'input', text: trimmed, prompt: 'guest@ajx-terminal:~$' };
      if (!arg) {
        addToHistory([echo, { type: 'output', text: 'Usage: theme <name> (e.g. matrix, cyberpunk, light, default)' }]);
      } else {
        document.documentElement.setAttribute('data-theme', arg);
        addToHistory([echo, { type: 'output', text: `Theme set to: ${arg}` }]);
      }
      return;
    }

    if (baseCmd === 'clear') {
      setHistory([]);
      localStorage.removeItem(HISTORY_KEY);
      return;
    }

    const echo: TerminalHistoryItem = { type: 'input', text: trimmed, prompt: 'guest@ajx-terminal:~$' };
    const handler = CommandRegistry[baseCmd];
    
    if (handler) {
      const outputItems = handler.execute(arg, {
        blogPosts,
        resume,
        routerPush: (path) => router.push(path),
        clearHistory: () => setHistory([])
      });
      addToHistory([echo, ...outputItems]);
    } else {
      addToHistory([echo, { type: 'output', text: `bash: command not found: ${baseCmd}. Type "help" to view commands.` }]);
    }
  };

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAiTyping) return;
    executeCommand(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'c' && e.ctrlKey) {
      e.preventDefault();
      if (isAiTyping && abortControllerRef.current) {
        if (warmupTimerRef.current) clearTimeout(warmupTimerRef.current);
        setIsWarmingUp(false);
        abortControllerRef.current.abort();
        setIsAiTyping(false);
        addToHistory([{ type: 'output', text: '^C (Aborted)' }]);
      } else {
        addToHistory([{ type: 'input', text: input + '^C', prompt: isAiMode ? 'ai@portfolio:~$' : 'guest@ajx-terminal:~$' }]);
        setInput('');
      }
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (cmdHistory.length > 0 && cmdIndex < cmdHistory.length - 1) {
        const nextIndex = cmdIndex + 1;
        setCmdIndex(nextIndex);
        setInput(cmdHistory[nextIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (cmdIndex > 0) {
        const prevIndex = cmdIndex - 1;
        setCmdIndex(prevIndex);
        setInput(cmdHistory[prevIndex]);
      } else if (cmdIndex === 0) {
        setCmdIndex(-1);
        setInput('');
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const commands = ['help', 'ls', 'cat', 'open', 'clear', 'ask', 'theme'];
      const matching = commands.filter(c => c.startsWith(input.toLowerCase()));
      if (matching.length === 1) {
        setInput(matching[0] + ' ');
      }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      setHistory([{ type: 'output', text: 'Terminal cleared.' }]);
      localStorage.removeItem(HISTORY_KEY);
      return;
    }
  };

  return {
    input,
    setInput,
    history,
    terminalEndRef,
    handleCommandSubmit,
    handleKeyDown,
    isAiMode,
    isAiTyping,
    isWarmingUp,
    executeCommand
  };
}
