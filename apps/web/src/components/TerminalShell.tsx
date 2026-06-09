'use client';

import { BlogPost, ResumeData } from '@/lib/data';
import { useTerminalShell } from '@/hooks/useTerminalShell';

interface TerminalShellProps {
  blogPosts: BlogPost[];
  resume: ResumeData;
}

export function TerminalShell({ blogPosts, resume }: TerminalShellProps) {
  const {
    input,
    setInput,
    history,
    terminalEndRef,
    handleCommandSubmit
  } = useTerminalShell(blogPosts, resume);

  return (
    <div className="w-full h-full terminal-card rounded-xl shadow-xl border border-primary/20 bg-card/45 flex flex-col relative overflow-hidden pt-12">
      {/* Title Bar */}
      <div className="absolute top-0 left-0 right-0 bg-primary/5 border-b border-primary/20 px-4 py-2.5 flex items-center gap-1.5 select-none">
        <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
        <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
        <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
        <span className="text-xs font-mono text-primary/60 ml-2">bash - interactive_shell.sh</span>
      </div>

      {/* Console Logs */}
      <div className="p-6 font-mono text-xs md:text-sm text-left h-[260px] overflow-y-auto space-y-2 select-text">
        {history.map((item, idx) => (
          <div key={idx} className="whitespace-pre-wrap leading-relaxed text-foreground/80">
            {item.type === 'input' ? (
              <div className="flex">
                <span className="text-primary mr-2 select-none">guest@ajx-terminal:~$</span>
                <span className="text-foreground">{item.text}</span>
              </div>
            ) : (
              <div>{item.text}</div>
            )}
          </div>
        ))}
        <div ref={terminalEndRef} />
      </div>

      {/* Input line */}
      <div className="border-t border-primary/25 p-4 bg-primary/5/10">
        <form onSubmit={handleCommandSubmit} className="flex items-center font-mono text-xs md:text-sm">
          <span className="text-primary mr-2 select-none">guest@ajx-terminal:~$</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none focus:ring-0 p-0 text-foreground font-mono"
            placeholder='Type "help" to start...'
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
