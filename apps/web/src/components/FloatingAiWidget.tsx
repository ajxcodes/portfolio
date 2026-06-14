'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { BotIcon, MessageCircleIcon, TerminalIcon } from './icons';
import { useAiChat } from '@/hooks/useAiChat';
import { BlogPost, ResumeData } from '@/lib/data';
import { TerminalShell } from './TerminalShell';

interface FloatingAiWidgetProps {
  blogPosts?: BlogPost[];
  resume?: ResumeData;
}

export function FloatingAiWidget({ blogPosts = [], resume }: FloatingAiWidgetProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isHighlighting, setIsHighlighting] = useState(false);
  const [activeTab, setActiveTab] = useState<'gui' | 'terminal'>('gui');
  const [inputValue, setInputValue] = useState('');
  
  const { messages, isTyping, isWarmingUp, sendMessage, stopStreaming, clearChat } = useAiChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // If we're on the homepage, the shell is already visible, so we don't need the terminal tab
  const isHomePage = pathname === '/';

  useEffect(() => {
    if (isHomePage && activeTab === 'terminal') {
      setActiveTab('gui');
    }
  }, [isHomePage, activeTab]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  // Expose global open method for CTA buttons
  useEffect(() => {
    const handleOpenWidget = () => {
      if (isOpen) {
        setIsHighlighting(true);
        setTimeout(() => setIsHighlighting(false), 800);
      } else {
        setIsOpen(true);
      }
      setActiveTab('gui');
      setTimeout(() => {
        const textarea = document.querySelector('textarea');
        if (textarea) textarea.focus();
      }, 100);
    };

    const handleGlobalKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
      if ((e.key === 'k' || e.key === '/') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };

    window.addEventListener('openAiWidget', handleOpenWidget);
    window.addEventListener('keydown', handleGlobalKeydown);
    return () => {
      window.removeEventListener('openAiWidget', handleOpenWidget);
      window.removeEventListener('keydown', handleGlobalKeydown);
    };
  }, [isOpen]);

  // Close widget on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isTyping) return;
    sendMessage(inputValue);
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`fixed bottom-20 right-6 z-50 w-full max-w-[380px] sm:w-[380px] h-[550px] max-h-[80vh] flex flex-col bg-card border border-primary/20 rounded-2xl overflow-hidden transition-all duration-300 ${
              isHighlighting ? 'ring-[6px] ring-primary/40 shadow-[0_0_60px_hsl(var(--primary)/0.8)] scale-[1.02]' : 'shadow-2xl scale-100'
            }`}
          >
            {/* Header */}
            <div className="flex flex-col bg-primary/5 border-b border-primary/20 p-4">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 ml-1 mr-2 group/win">
                    <button 
                      onClick={() => setIsOpen(false)}
                      className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors"
                      aria-label="Close widget"
                    >
                      <svg className="w-2 h-2 opacity-0 group-hover/win:opacity-100 text-black/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                  </div>
                  <h3 className="font-bold text-primary">AI Assistant</h3>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('gui')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    activeTab === 'gui'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-primary/10 text-primary hover:bg-primary/20'
                  }`}
                >
                  GUI Chat
                </button>
                {!isHomePage && (
                  <button
                    onClick={() => setActiveTab('terminal')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold font-mono rounded-md transition-colors ${
                      activeTab === 'terminal'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-primary/10 text-primary hover:bg-primary/20'
                    }`}
                  >
                    <TerminalIcon className="w-3.5 h-3.5" />
                    Shell
                  </button>
                )}
              </div>
            </div>

            {/* Chat Area */}
            {activeTab === 'terminal' && resume ? (
              <div className="flex-1 overflow-hidden p-0 relative h-full">
                <TerminalShell blogPosts={blogPosts} resume={resume} hideTitleBar={true} heightClass="flex-1" />
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                  {messages.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50 px-4">
                      <BotIcon className="w-12 h-12 mb-4" />
                      <p className="text-sm">
                        Ask me anything about the resume, experience, or projects!
                      </p>
                    </div>
                  )}

                  {messages.map((msg, i) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col max-w-[90%] ${
                        msg.role === 'user' ? 'self-end items-end' : 'self-start items-start'
                      }`}
                    >
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-sm ${
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground rounded-tr-sm'
                            : 'bg-primary/10 text-foreground rounded-tl-sm'
                        } ${msg.error ? 'text-red-500' : ''}`}
                      >
                        {msg.content === '' && msg.isStreaming ? (
                          <div className="flex items-center gap-2 text-foreground/60 text-xs font-mono py-1 px-1">
                            <BotIcon className="w-4 h-4 text-primary animate-bounce" />
                            <span className="font-semibold uppercase tracking-wider text-[10px]">{isWarmingUp ? "Waking up backend server (up to 50s)..." : "Thinking..."}</span>
                          </div>
                        ) : (
                          <>
                            <div className="prose prose-sm dark:prose-invert max-w-none break-words">
                              <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
                                {msg.content}
                              </ReactMarkdown>
                            </div>
                            {msg.isStreaming && (
                              <span className="inline-block w-1.5 h-4 ml-1 bg-primary animate-pulse align-middle" />
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-background border-t border-primary/10">
                  <form onSubmit={handleSubmit} className="flex gap-2">
                    <div className="relative flex-1">
                      <textarea
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        className="w-full bg-primary/5 border border-primary/20 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary resize-none custom-scrollbar px-4 py-2.5 text-sm"
                        rows={1}
                        style={{ minHeight: '44px', maxHeight: '120px' }}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        type="submit"
                        disabled={!inputValue.trim() || isTyping}
                        className="bg-primary text-primary-foreground p-2.5 rounded-xl disabled:opacity-50 transition-opacity"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                      </button>
                      {isTyping && (
                        <button
                          type="button"
                          onClick={stopStreaming}
                          className="bg-red-500/20 text-red-500 hover:bg-red-500/30 p-2.5 rounded-xl transition-colors"
                          title="Stop generation"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/></svg>
                        </button>
                      )}
                    </div>
                  </form>
                  <div className="mt-2 flex justify-between items-center text-[10px] text-foreground/40">
                    <span>AI can make mistakes.</span>
                    {messages.length > 0 && !isTyping && (
                      <button onClick={clearChat} className="hover:text-primary transition-colors">Clear Chat</button>
                    )}
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 bg-primary text-primary-foreground p-4 rounded-full shadow-xl shadow-primary/20 flex items-center justify-center border border-primary-foreground/10 group"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open AI Chat"
      >
        <MessageCircleIcon className={`w-6 h-6 transition-transform duration-300 ${isOpen ? 'scale-0' : 'scale-100'}`} />
        <BotIcon className={`w-6 h-6 absolute transition-transform duration-300 ${isOpen ? 'scale-100' : 'scale-0'}`} />
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-white/90"></span>
        </span>
      </motion.button>
    </>
  );
}
