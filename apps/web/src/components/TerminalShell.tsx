'use client';

import { BlogPost, ResumeData } from '@/lib/data';
import { useTerminalShell } from '@/hooks/useTerminalShell';
import ReactMarkdown from 'react-markdown';

interface TerminalShellProps {
  blogPosts: BlogPost[];
  resume: ResumeData;
  hideTitleBar?: boolean;
  heightClass?: string;
}

export function TerminalShell({ blogPosts, resume, hideTitleBar = false, heightClass = "h-[260px]" }: TerminalShellProps) {
  const {
    input,
    setInput,
    history,
    terminalEndRef,
    handleCommandSubmit,
    handleKeyDown,
    isAiMode,
    isAiTyping,
    isWarmingUp
  } = useTerminalShell(blogPosts, resume);

  return (
    <div 
      className={`w-full h-full terminal-card rounded-xl shadow-xl border border-primary/20 bg-card/45 flex flex-col relative overflow-hidden ${hideTitleBar ? '' : 'pt-12'}`}
      onClick={() => document.getElementById('terminal-input')?.focus()}
    >
      {/* Title Bar */}
      {!hideTitleBar && (
        <div className="absolute top-0 left-0 right-0 bg-primary/5 border-b border-primary/20 px-4 py-2.5 flex items-center gap-1.5 select-none">
          <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
          <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
          <span className="text-xs font-mono text-primary/60 ml-2">bash - interactive_shell.sh</span>
          {isAiMode && <span className="ml-auto text-xs font-mono text-primary animate-pulse">AI Connected</span>}
        </div>
      )}

      {/* Console Logs */}
      <div 
        className={`p-6 font-mono text-xs md:text-sm text-left ${heightClass} overflow-y-auto space-y-2 select-text cursor-default`}
        onClick={(e) => e.stopPropagation()}
      >
        {history.map((item, idx) => (
          <div key={idx} className="whitespace-pre-wrap leading-relaxed text-foreground/80">
            {item.type === 'input' ? (
              <div className="flex">
                <span className="text-primary mr-2 select-none">{item.prompt || 'guest@ajx-terminal:~$'}</span>
                <span className="text-foreground">{item.text}</span>
              </div>
            ) : item.isMarkdown ? (
              <div className="prose prose-sm prose-invert max-w-none ai-markdown">
                <ReactMarkdown>{item.text}</ReactMarkdown>
              </div>
            ) : (
              <div>{item.text}</div>
            )}
          </div>
        ))}
        {isAiTyping && (
          <div className="flex flex-col text-primary mt-2">
            <div className="flex items-center">
              <span className="mr-2">ai@portfolio:~$</span>
              <span className="animate-pulse">_</span>
            </div>
            {isWarmingUp && <span className="text-[10px] text-muted-foreground italic mt-1">Waking up backend server (can take up to 50s)...</span>}
          </div>
        )}
        <div ref={terminalEndRef} />
      </div>

      {/* Input line */}
      <div className="border-t border-primary/25 p-4 bg-primary/5/10 cursor-text">
        <form onSubmit={handleCommandSubmit} className="flex items-center font-mono text-xs md:text-sm">
          <span className="text-primary mr-2 select-none">
            {isAiMode ? 'ai@portfolio:~$' : 'guest@ajx-terminal:~$' }
          </span>
          <input
            id="terminal-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent border-none outline-none focus:ring-0 p-0 text-foreground font-mono"
            placeholder={isAiMode ? 'Type your question to AI...' : 'Type "help" to start...'}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />
        </form>
      </div>
    </div>
  );
}
