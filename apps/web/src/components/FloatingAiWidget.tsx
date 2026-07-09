'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { BotIcon, MessageCircleIcon, TerminalIcon } from './icons';
import { useAiChat } from '@/hooks/useAiChat';
import { BlogPost, ResumeData, ProfileLink } from '@/lib/data';
import { TerminalShell } from './TerminalShell';
import { JobFitAnalyzer } from './JobFitAnalyzer';

export const resolveActionLink = (action: string, links?: ProfileLink[]): string | null => {
  const text = action.toLowerCase();
  const findUrl = (type: string) => links?.find(l => l.type === type)?.url;
  const formatUrl = (url?: string): string | null => {
    if (!url) return null;
    if (url.includes('@') && !url.startsWith('mailto:')) return `mailto:${url}`;
    if (url.startsWith('http') || url.startsWith('mailto:')) return url;
    return `https://${url}`;
  };

  if (text.includes("email")) {
    const url = findUrl('email');
    return formatUrl(url) || 'mailto:me@ajx.codes';
  }
  if (text.includes("interview") || text.includes("schedule") || text.includes("availability")) {
    const url = findUrl('calendar') || findUrl('email');
    return formatUrl(url) || 'mailto:me@ajx.codes'; 
  }
  if (text.includes("github") || text.includes("repository") || text.includes("code")) {
    const url = findUrl('github');
    return formatUrl(url); 
  }
  if (text.includes("linkedin") || text.includes("profile")) {
    const url = findUrl('linkedin');
    return formatUrl(url); 
  }

  return null;
};

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
  
  const [isJobFitOpen, setIsJobFitOpen] = useState(false);
  const [showIdleJobFitBtn, setShowIdleJobFitBtn] = useState(false);
  const [hasDismissedJobFitBtn, setHasDismissedJobFitBtn] = useState(false);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const jobFitRef = useRef<HTMLDivElement>(null);
  
  const { messages, isTyping, isWarmingUp, sendMessage, appendAssistantMessage, stopStreaming, clearChat } = useAiChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [isMainCtaVisible, setIsMainCtaVisible] = useState(false);

  const handleCtaVisibility = useCallback((e: Event) => {
    const customEvent = e as CustomEvent<{ isVisible: boolean }>;
    setIsMainCtaVisible(customEvent.detail.isVisible);
  }, []);

  useEffect(() => {
    window.addEventListener('ctaVisibilityChange', handleCtaVisibility);
    return () => window.removeEventListener('ctaVisibilityChange', handleCtaVisibility);
  }, [handleCtaVisibility]);

  // If we're on the homepage, the shell is already visible, so we don't need the terminal tab
  const isHomePage = pathname === '/';

  // Smart idle functionality for Job Fit button
  useEffect(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

    if (hasDismissedJobFitBtn || isJobFitOpen || isTyping) {
      setShowIdleJobFitBtn(false);
      return;
    }

    if (messages.length === 0) {
      setShowIdleJobFitBtn(true);
      return;
    }

    // If it's already showing, don't hide it
    if (showIdleJobFitBtn) return;

    idleTimerRef.current = setTimeout(() => {
      setShowIdleJobFitBtn(true);
    }, 10000); // 10 seconds is better

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [messages, isTyping, isJobFitOpen, hasDismissedJobFitBtn, showIdleJobFitBtn]);

  useEffect(() => {
    if (isHomePage && activeTab === 'terminal') {
      setActiveTab('gui');
    }
  }, [isHomePage, activeTab]);

  useEffect(() => {
    if (messagesEndRef.current && messagesEndRef.current.parentElement) {
      const parent = messagesEndRef.current.parentElement;
      parent.scrollTo({ top: parent.scrollHeight, behavior: 'smooth' });
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
        if (window.innerWidth > 640) {
          const textarea = document.querySelector('textarea');
          if (textarea) textarea.focus();
        }
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
            animate={{ opacity: 1, y: 0, scale: isHighlighting ? 1.02 : 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`fixed inset-0 sm:inset-auto sm:bottom-20 sm:right-6 z-[100] w-full sm:w-[380px] h-[100dvh] sm:h-[550px] sm:max-h-[80vh] flex flex-col bg-card sm:border sm:border-primary/20 rounded-none sm:rounded-2xl overflow-hidden transition-shadow duration-300 ${
              isHighlighting ? 'ring-[6px] ring-primary/40 shadow-[0_0_60px_hsl(var(--primary)/0.8)]' : 'shadow-2xl'
            }`}
          >
            {/* Header */}
            <div className="flex flex-col bg-primary/5 border-b border-primary/20 p-4">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex items-center gap-1.5 ml-1 mr-2 group/win">
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
                
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-primary/60 hover:text-primary hover:bg-primary/10 rounded-md transition-all sm:hidden"
                  aria-label="Close widget"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
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
                <div className="flex-1 overflow-y-auto p-4 pb-16 flex flex-col gap-4">
                  {isJobFitOpen ? (
                    <div className="flex-1" ref={jobFitRef}>
                      <JobFitAnalyzer 
                        links={resume?.contact?.links}
                        onCancel={() => setIsJobFitOpen(false)}
                        onAnalysisComplete={(result) => {
                          setIsJobFitOpen(false);
                          
                          appendAssistantMessage("Here is the analysis for this role:", result.actionChips, {
                            matchScore: result.matchScore,
                            company: result.company,
                            role: result.role,
                            growthOpportunities: result.growthOpportunities
                          });
                        }}
                      />
                    </div>
                  ) : (
                    <>
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
                          
                          {msg.jobFitData && (
                            <div className="mt-3 bg-card border border-primary/20 rounded-xl p-5 shadow-sm text-sm">
                              <h4 className="font-bold text-base mb-1 text-primary flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                {msg.jobFitData.company}
                              </h4>
                              <div className="text-foreground/70 font-medium mb-4">{msg.jobFitData.role}</div>
                              
                              <div className="flex items-center gap-4 mb-5">
                                <div className="relative w-16 h-16 flex-shrink-0">
                                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="40" className="stroke-current text-foreground/10" strokeWidth="10" fill="none" />
                                    <motion.circle 
                                      cx="50" cy="50" r="40" 
                                      className={`stroke-current ${msg.jobFitData.matchScore >= 80 ? 'text-green-500' : msg.jobFitData.matchScore >= 50 ? 'text-yellow-500' : 'text-red-500'}`} 
                                      strokeWidth="10" fill="none" 
                                      strokeLinecap="round"
                                      initial={{ strokeDashoffset: 251.2 }}
                                      animate={{ strokeDashoffset: 251.2 - (msg.jobFitData.matchScore / 100) * 251.2 }}
                                      transition={{ duration: 1.5, ease: "easeOut" }}
                                      style={{ strokeDasharray: 251.2 }}
                                    />
                                  </svg>
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-base font-bold">{msg.jobFitData.matchScore}%</span>
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs uppercase tracking-wider text-foreground/60 mb-0.5">Match Score</div>
                                  <div className={`font-semibold ${msg.jobFitData.matchScore >= 80 ? 'text-green-500' : msg.jobFitData.matchScore >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                                    {msg.jobFitData.matchScore >= 80 ? 'Strong Fit' : msg.jobFitData.matchScore >= 50 ? 'Potential Fit' : 'Low Fit'}
                                  </div>
                                </div>
                              </div>
                              
                              {msg.jobFitData.growthOpportunities && msg.jobFitData.growthOpportunities.length > 0 && (
                                <div className="w-full">
                                  <h5 className="font-semibold text-primary mb-2 text-xs flex items-center gap-1.5">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                    Key Strengths & Growth
                                  </h5>
                                  <ul className="space-y-1">
                                    {msg.jobFitData.growthOpportunities.map((opp, idx) => (
                                      <li key={idx} className="text-foreground/80 flex items-start gap-1.5 text-xs">
                                        <span className="text-primary mt-0.5">•</span>
                                        <span className="leading-snug">{opp}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}

                          {msg.actionChips && msg.actionChips.length > 0 && (
                            <div className="flex flex-col gap-2 mt-2 w-full min-w-[200px]">
                              {msg.actionChips.map((chip, chipIdx) => {
                                const resolvedUrl = resolveActionLink(chip, resume?.contact?.links);
                                if (!resolvedUrl) {
                                  return (
                                    <button
                                      key={chipIdx}
                                      type="button"
                                      onClick={() => sendMessage(chip)}
                                      className="w-full py-1.5 px-3 text-[12px] bg-primary/10 hover:bg-primary/20 text-primary font-medium rounded-lg transition-colors block text-center"
                                    >
                                      {chip}
                                    </button>
                                  );
                                }
                                
                                const isExternal = resolvedUrl.startsWith('http') || resolvedUrl.startsWith('mailto:');
                                return (
                                  <a
                                    key={chipIdx}
                                    href={resolvedUrl}
                                    target={isExternal ? "_blank" : undefined}
                                    rel={isExternal ? "noopener noreferrer" : undefined}
                                    className="w-full py-1.5 px-3 text-[12px] bg-primary text-primary-foreground font-medium rounded-lg transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md block text-center"
                                  >
                                    {chip}
                                  </a>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                      
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                {/* Input Area */}
                {!isJobFitOpen && (
                  <div className="p-4 bg-background border-t border-primary/10 relative">
                  <AnimatePresence>
                    {showIdleJobFitBtn && !isJobFitOpen && activeTab === 'gui' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute -top-12 left-0 right-0 flex justify-center z-10"
                      >
                        <div className="relative group">
                          <button
                            onClick={() => {
                              setIsJobFitOpen(true);
                              setTimeout(() => {
                                if (jobFitRef.current && jobFitRef.current.parentElement) {
                                  const parent = jobFitRef.current.parentElement;
                                  parent.scrollTo({ top: parent.scrollHeight, behavior: 'smooth' });
                                }
                              }, 100);
                            }}
                            className="bg-primary/90 hover:bg-primary text-primary-foreground text-xs font-semibold py-1.5 px-6 rounded-full shadow-lg border border-primary-foreground/20 flex items-center gap-2 transition-all hover:scale-105 pr-8"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            Analyze Job Fit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setHasDismissedJobFitBtn(true);
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/20 transition-colors"
                            aria-label="Dismiss"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

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
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`fixed bottom-6 right-6 z-50 bg-primary text-primary-foreground p-4 rounded-full shadow-xl shadow-primary/20 flex items-center justify-center border border-primary-foreground/10 group transition-all duration-300 ${
          isMainCtaVisible && !isOpen ? 'translate-y-24 opacity-0 pointer-events-none sm:translate-y-0 sm:opacity-100 sm:pointer-events-auto' : 'translate-y-0 opacity-100 pointer-events-auto'
        }`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open AI Chat"
      >
        <BotIcon className={`w-6 h-6 transition-transform duration-300 ${isOpen ? 'scale-0' : 'scale-100'}`} />
        <svg className={`w-6 h-6 absolute transition-transform duration-300 ${isOpen ? 'scale-100' : 'scale-0'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-white/90"></span>
        </span>
      </motion.button>
    </>
  );
}
