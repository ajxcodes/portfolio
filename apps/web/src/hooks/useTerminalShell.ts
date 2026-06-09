import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BlogPost, ResumeData } from '@/lib/data';
import { CommandRegistry, TerminalHistoryItem } from './commandStrategies';

export function useTerminalShell(blogPosts: BlogPost[], resume: ResumeData) {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<TerminalHistoryItem[]>([
    { type: 'output', text: 'ajxcodes Interactive Shell [Version 1.0.0]' },
    { type: 'output', text: 'Status: Connected to live API' },
    { type: 'output', text: 'Type "help" to list available commands.' },
    { type: 'output', text: '' },
  ]);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const executeCommand = (commandString: string) => {
    const trimmed = commandString.trim();
    if (!trimmed) {
      setHistory((prev) => [...prev, { type: 'input', text: '' }]);
      return;
    }

    const echo: TerminalHistoryItem = { type: 'input', text: trimmed };
    const parts = trimmed.split(' ').filter(Boolean);
    const baseCmd = parts[0].toLowerCase();
    const arg = parts[1];

    if (baseCmd === 'clear') {
      setHistory([]);
      return;
    }

    const handler = CommandRegistry[baseCmd];
    let outputItems: TerminalHistoryItem[] = [];

    if (handler) {
      outputItems = handler.execute(arg, {
        blogPosts,
        resume,
        routerPush: (path) => router.push(path),
        clearHistory: () => setHistory([])
      });
    } else {
      outputItems = [{
        type: 'output',
        text: `bash: command not found: ${baseCmd}. Type "help" to view commands.`
      }];
    }

    setHistory((prev) => [...prev, echo, ...outputItems]);
  };

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeCommand(input);
    setInput('');
  };

  return {
    input,
    setInput,
    history,
    terminalEndRef,
    executeCommand,
    handleCommandSubmit
  };
}
