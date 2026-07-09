import { renderHook, act } from '@testing-library/react';
import { useAiChat } from '../useAiChat';
import { fetchEventSource } from '@microsoft/fetch-event-source';

jest.mock('@microsoft/fetch-event-source', () => ({
  fetchEventSource: jest.fn()
}));

const mockFetchEventSource = fetchEventSource as jest.Mock;


describe('useAiChat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
    jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
    jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useAiChat());
    
    expect(result.current.messages).toEqual([]);
    expect(result.current.isTyping).toBe(false);
  });

  it('can send a message and handle successful streaming', async () => {
    const { result } = renderHook(() => useAiChat());

    mockFetchEventSource.mockImplementation(async (url, options) => {
      // simulate stream events synchronously to avoid leaking across tests
      if (options.onopen) await options.onopen({ ok: true, status: 200, headers: new Headers({'content-type': 'text/event-stream'}) } as any);
      if (options.onmessage) options.onmessage({ data: JSON.stringify({ text: 'Hello' }) } as any);
      if (options.onmessage) options.onmessage({ data: JSON.stringify({ text: ' world' }) } as any);
      if (options.onmessage) options.onmessage({ event: 'done', data: '[DONE]' } as any);
      if (options.onclose) options.onclose();
    });

    await act(async () => {
      await result.current.sendMessage('Hi');
    });

    console.log('MESSAGES:', JSON.stringify(result.current.messages, null, 2));
    if (result.current.messages.length !== 2) { console.log('DEBUG MESSAGES:', result.current.messages); }
    expect(result.current.messages.length).toBe(2);
    expect(result.current.messages[1].content).toBe('Hello world');
    expect(result.current.messages[1].isStreaming).toBe(false);
  });

  it('handles server errors gracefully', async () => {
    const { result } = renderHook(() => useAiChat());

    mockFetchEventSource.mockImplementation(async (url, options) => {
      try {
        if (options.onopen) await options.onopen({ ok: false, status: 500 } as any);
      } catch (err) {
        if (options.onerror) {
          try { options.onerror(err); } catch(e) {}
        }
      }
    });

    await act(async () => {
      await result.current.sendMessage('Fail me');
    });

    expect(result.current.isTyping).toBe(false);
    expect(result.current.messages.length).toBe(2);
    expect(result.current.messages[1].content).toContain('Connection Error');
  });

  it('can clear chat history', () => {
    const { result } = renderHook(() => useAiChat());
    const removeItemSpy = jest.spyOn(Storage.prototype, 'removeItem');

    act(() => {
      result.current.clearChat();
    });

    expect(result.current.messages).toEqual([]);
    expect(removeItemSpy).toHaveBeenCalledWith('ai_chat_history');
  });

  it('can abort an ongoing request', async () => {
    const { result } = renderHook(() => useAiChat());
    let abortListener: any = null;

    mockFetchEventSource.mockImplementation(async (url, options) => {
      if (options.signal) {
        options.signal.addEventListener('abort', () => {
          if (abortListener) abortListener();
        });
      }
    });

    await act(async () => {
      // Don't await the full promise, just let it pend
      result.current.sendMessage('Pending...');
    });

    expect(result.current.isTyping).toBe(true);
    expect(result.current.messages[1].isStreaming).toBe(true);

    act(() => {
      result.current.stopStreaming();
    });

    expect(result.current.isTyping).toBe(false);
    expect(result.current.messages[1].isStreaming).toBe(false);
    expect(result.current.messages[1].content).toContain('[Stopped by user]');
  });

  it('aborts old controller on consecutive sendMessage calls', async () => {
    const { result } = renderHook(() => useAiChat());
    
    mockFetchEventSource.mockImplementationOnce(async (url, options) => {
       if (options.onopen) await options.onopen({ ok: true, headers: new Headers({'content-type': 'text/event-stream'}), status: 200 } as any);
       if (options.onmessage) options.onmessage({ event: 'done', data: '[DONE]' } as any);
    });

    await act(async () => {
      await result.current.sendMessage('First');
    });

    expect(result.current.isTyping).toBe(false);

    const abortSpy = jest.spyOn(AbortController.prototype, 'abort');
    
    mockFetchEventSource.mockImplementationOnce(async () => {});

    await act(async () => {
      await result.current.sendMessage('Second');
    });

    expect(abortSpy).toHaveBeenCalled();
    abortSpy.mockRestore();
  });

  it('throws client side error on 4xx responses', async () => {
    const { result } = renderHook(() => useAiChat());
    
    mockFetchEventSource.mockImplementation(async (url, options) => {
      try {
        if (options.onopen) await options.onopen({ ok: false, status: 400, headers: new Headers() } as any);
      } catch (err) {
        if (options.onerror) {
          try { options.onerror(err); } catch(e) {}
        }
      }
    });

    await act(async () => {
      await result.current.sendMessage('Fail me 400');
    });

    expect(result.current.messages[1].content).toContain('Connection Error');
  });

  it('replaces \\n with actual newlines in chunk data', async () => {
    const { result } = renderHook(() => useAiChat());
    mockFetchEventSource.mockImplementation(async (url, options) => {
       if (options.onopen) await options.onopen({ ok: true, status: 200, headers: new Headers({'content-type': 'text/event-stream'}) } as any);
       if (options.onmessage) options.onmessage({ data: JSON.stringify({ text: 'Line 1\nLine 2' }) } as any);
       if (options.onmessage) options.onmessage({ event: 'done', data: '[DONE]' } as any);
    });

    await act(async () => {
      await result.current.sendMessage('test');
    });

    expect(result.current.messages[1].content).toContain('Line 1\nLine 2');
  });

  it('throws when onmessage receives an error event', async () => {
    const { result } = renderHook(() => useAiChat());
    mockFetchEventSource.mockImplementation(async (url, options) => {
       try {
         if (options.onmessage) options.onmessage({ event: 'error', data: 'Stream error' } as any);
       } catch(err) {
         if (options.onerror) {
           try { options.onerror(err); } catch(e) {}
         }
       }
    });

    await act(async () => {
      await result.current.sendMessage('test error');
    });

    expect(result.current.messages[1].content).toContain('Connection Error');
  });
  it('can append assistant message directly', () => {
    const { result } = renderHook(() => useAiChat());
    
    act(() => {
      result.current.appendAssistantMessage('Test Message', ['chip1']);
    });

    expect(result.current.messages.length).toBe(1);
    expect(result.current.messages[0].content).toBe('Test Message');
    expect(result.current.messages[0].actionChips).toEqual(['chip1']);
  });

  it('handles corrupted local storage data', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(Storage.prototype, 'getItem').mockReturnValue('invalid-json');
    
    const { result } = renderHook(() => useAiChat());
    
    expect(result.current.messages).toEqual([]);
    expect(consoleSpy).toHaveBeenCalledWith('Failed to parse saved chat history', expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('handles SSE chunk parse error', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() => useAiChat());

    mockFetchEventSource.mockImplementation(async (url, options) => {
      if (options.onopen) await options.onopen({ ok: true, status: 200, headers: new Headers({'content-type': 'text/event-stream'}) } as any);
      if (options.onmessage) {
        try {
          options.onmessage({ data: 'invalid-json' } as any);
        } catch (e) {
          if (options.onerror) {
            try { options.onerror(e); } catch(err) {}
          }
        }
      }
    });

    await act(async () => {
      await result.current.sendMessage('Hi');
    });

    expect(consoleSpy).toHaveBeenCalledWith('Failed to parse SSE JSON chunk:', expect.any(Error));
    consoleSpy.mockRestore();
  });
});
