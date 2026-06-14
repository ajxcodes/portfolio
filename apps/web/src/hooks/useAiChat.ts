import { useState, useRef, useCallback, useEffect } from 'react';
import { fetchEventSource } from '@microsoft/fetch-event-source';

export interface AiMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
  error?: boolean;
}

export function useAiChat() {
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isWarmingUp, setIsWarmingUp] = useState(false);
  const warmupTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const STORAGE_KEY = 'ai_chat_history';

  // Initialize history
  useEffect(() => {
    const savedMessages = localStorage.getItem(STORAGE_KEY);
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch (e) {
        console.error("Failed to parse saved chat history", e);
      }
    }
  }, []);

  // Save history
  useEffect(() => {
    // Only save when not typing to avoid saving partial/streaming states if possible,
    // but saving everything is fine too. We'll save the whole array.
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isTyping) return;

    const userMessage: AiMessage = { id: crypto.randomUUID(), role: 'user', content: text };
    const assistantMessageId = crypto.randomUUID();
    
    setMessages((prev) => [
      ...prev,
      userMessage,
      { id: assistantMessageId, role: 'assistant', content: '', isStreaming: true }
    ]);
    
    setIsTyping(true);
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
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          message: text,
          visitorSessionId: visitorSessionId || null
        }),
        signal: abortControllerRef.current.signal,
        async onopen(response) {
          if (response.ok && response.headers.get('content-type')?.includes('text/event-stream')) {
            return; // everything is good
          } else if (response.status >= 400 && response.status < 500 && response.status !== 429) {
            throw new Error(`Client side error ${response.status}`);
          } else {
            throw new Error(`Server side error ${response.status}`);
          }
        },
        onmessage(msg) {
          if (msg.event === 'error') {
            throw new Error(msg.data);
          }
          if (warmupTimerRef.current) clearTimeout(warmupTimerRef.current);
          setIsWarmingUp(false);

          if (msg.event === 'done' || msg.data === '[DONE]') {
            setIsTyping(false);
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantMessageId ? { ...m, isStreaming: false } : m))
            );
            return;
          }

          // Parse JSON chunk
          let chunk = '';
          try {
            chunk = JSON.parse(msg.data).text;
          } catch (e) {
            console.error('Failed to parse SSE JSON chunk:', e);
            return;
          }
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessageId ? { ...m, content: m.content + chunk } : m
            )
          );
        },
        onclose() {
          if (warmupTimerRef.current) clearTimeout(warmupTimerRef.current);
          setIsWarmingUp(false);
          setIsTyping(false);
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantMessageId ? { ...m, isStreaming: false } : m))
          );
        },
        onerror(err) {
          if (warmupTimerRef.current) clearTimeout(warmupTimerRef.current);
          setIsWarmingUp(false);
          console.error('SSE Error:', err);
          setIsTyping(false);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessageId
                ? { ...m, isStreaming: false, error: true, content: m.content + '\n\n**[Connection Error: Incomplete response]**' }
                : m
            )
          );
          throw err; // rethrow to prevent automatic reconnection
        }
      });
    } catch (err) {
      // Caught handled errors
    }
  }, [isTyping]);

  const stopStreaming = useCallback(() => {
    if (warmupTimerRef.current) clearTimeout(warmupTimerRef.current);
    setIsWarmingUp(false);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsTyping(false);
    setMessages((prev) =>
      prev.map((m) => (m.isStreaming ? { ...m, isStreaming: false, content: m.content + '\n\n*[Stopped by user]*' } : m))
    );
  }, []);

  const clearChat = useCallback(() => {
    stopStreaming();
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  }, [stopStreaming]);

  return {
    messages,
    isTyping,
    isWarmingUp,
    sendMessage,
    stopStreaming,
    clearChat
  };
}
