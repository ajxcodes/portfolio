import { renderHook, act } from '@testing-library/react';
import { useTerminalShell } from './useTerminalShell';
import { BlogPost, ResumeData } from '@/lib/data';
import { CommandRegistry } from './commandStrategies';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: mockPush,
    };
  },
}));

jest.mock('@microsoft/fetch-event-source', () => ({
  fetchEventSource: jest.fn()
}));
import { fetchEventSource } from '@microsoft/fetch-event-source';
const mockFetchEventSource = fetchEventSource as jest.Mock;

describe('useTerminalShell Hook and Strategies', () => {
  const mockBlogPosts: BlogPost[] = [
    { slug: 'setting-up-pi-hole', title: 'Pi-hole Setup', summary: 'A guide to block ads.' },
    { slug: 'dotnet-10-news', title: '.NET 10 Updates', summary: 'Exciting C# features.' }
  ];

  const mockResume: ResumeData = {
    summary: {
      lead: 'Intro',
      highlights: []
    },
    downloadUrl: '',
    experience: [
      {
        company: 'Provision Analytics',
        role: 'Senior Software Developer',
        period: 'March 2023 - Present',
        results: ['Led backend refactors', 'Migrated databases']
      }
    ],
    previousExperience: [
      {
        company: 'Symend',
        role: 'Software Developer',
        location: 'Calgary',
        period: '2021 - 2023'
      }
    ],
    contact: {
      links: [
        { type: 'email', url: 'me@ajx.codes' },
        { type: 'github', url: 'github.com/ajxcodes' },
        { type: 'linkedin', url: 'linkedin.com/in/alvinjorrel' },
        { type: 'calendar', url: 'cal.com/ajx' }
      ]
    },
    skills: [],
    projects: [],
    education: []
  };

  beforeEach(() => {
    mockPush.mockClear();
    mockFetchEventSource.mockClear();
    localStorage.clear();
  });

  it('should initialize with welcome history lines', () => {
    const { result } = renderHook(() => useTerminalShell(mockBlogPosts, mockResume));
    expect(result.current.history[0].text).toContain('ajxcodes Interactive Shell');
    expect(result.current.history[2].text).toContain('Type "help"');
  });

  it('should add empty line on empty input', () => {
    const { result } = renderHook(() => useTerminalShell(mockBlogPosts, mockResume));
    act(() => {
      result.current.executeCommand('');
    });
    expect(result.current.history[result.current.history.length - 1]).toEqual({
      type: 'input',
      text: '',
      prompt: 'guest@ajx-terminal:~$'
    });
  });

  it('should handle clear command by wiping history', () => {
    const { result } = renderHook(() => useTerminalShell(mockBlogPosts, mockResume));
    act(() => {
      result.current.executeCommand('clear');
    });
    expect(result.current.history).toEqual([]);
  });

  it('should return help output on help command', () => {
    const { result } = renderHook(() => useTerminalShell(mockBlogPosts, mockResume));
    act(() => {
      result.current.executeCommand('help');
    });
    const lastOutput = result.current.history[result.current.history.length - 1];
    expect(lastOutput.text).toContain('Show this help manual');
  });

  describe('ls strategy', () => {
    it('should list main directories with no args', () => {
      const { result } = renderHook(() => useTerminalShell(mockBlogPosts, mockResume));
      act(() => {
        result.current.executeCommand('ls');
      });
      const lastOutput = result.current.history[result.current.history.length - 1];
      expect(lastOutput.text).toBe('blog/  experience/  contact');
    });

    it('should list blog slugs', () => {
      const { result } = renderHook(() => useTerminalShell(mockBlogPosts, mockResume));
      act(() => {
        result.current.executeCommand('ls blog');
      });
      const lastOutput = result.current.history[result.current.history.length - 1];
      expect(lastOutput.text).toBe('setting-up-pi-hole  dotnet-10-news');
    });

    it('should handle empty blog posts lists', () => {
      const { result } = renderHook(() => useTerminalShell([], mockResume));
      act(() => {
        result.current.executeCommand('ls blog');
      });
      const lastOutput = result.current.history[result.current.history.length - 1];
      expect(lastOutput.text).toBe('No articles found in blog/');
    });

    it('should list experience companies as slugs', () => {
      const { result } = renderHook(() => useTerminalShell(mockBlogPosts, mockResume));
      act(() => {
        result.current.executeCommand('ls experience');
      });
      const lastOutput = result.current.history[result.current.history.length - 1];
      expect(lastOutput.text).toBe('provision-analytics  symend');
    });

    it('should handle empty experience lists', () => {
      const emptyResume = { ...mockResume, experience: [], previousExperience: [] };
      const { result } = renderHook(() => useTerminalShell(mockBlogPosts, emptyResume));
      act(() => {
        result.current.executeCommand('ls experience');
      });
      const lastOutput = result.current.history[result.current.history.length - 1];
      expect(lastOutput.text).toBe('No experience records found.');
    });

    it('should return warning message if listing a file', () => {
      const { result } = renderHook(() => useTerminalShell(mockBlogPosts, mockResume));
      act(() => {
        result.current.executeCommand('ls contact');
      });
      const lastOutput = result.current.history[result.current.history.length - 1];
      expect(lastOutput.text).toContain('contact is a file. Type "cat contact"');
    });

    it('should return error for invalid directory', () => {
      const { result } = renderHook(() => useTerminalShell(mockBlogPosts, mockResume));
      act(() => {
        result.current.executeCommand('ls invalid_dir');
      });
      const lastOutput = result.current.history[result.current.history.length - 1];
      expect(lastOutput.text).toBe('ls: no such directory: invalid_dir');
    });
  });

  describe('cat strategy', () => {
    it('should require path argument', () => {
      const { result } = renderHook(() => useTerminalShell(mockBlogPosts, mockResume));
      act(() => {
        result.current.executeCommand('cat');
      });
      const lastOutput = result.current.history[result.current.history.length - 1];
      expect(lastOutput.text).toContain('cat: missing path');
    });

    it('should print contact information', () => {
      const { result } = renderHook(() => useTerminalShell(mockBlogPosts, mockResume));
      act(() => {
        result.current.executeCommand('cat contact');
      });
      const historyLength = result.current.history.length;
      expect(result.current.history[historyLength - 4].text).toBe('email    : me@ajx.codes');
      expect(result.current.history[historyLength - 3].text).toBe('github   : github.com/ajxcodes');
    });

    it('should handle missing contact fields gracefully', () => {
      const emptyResume = { ...mockResume, contact: { links: [] } };
      const { result } = renderHook(() => useTerminalShell(mockBlogPosts, emptyResume));
      act(() => {
        result.current.executeCommand('cat contact');
      });
      const historyLength = result.current.history.length;
      expect(result.current.history[historyLength - 1].text).toBe('No contact information available.');
    });

    it('should show blog details if found', () => {
      const { result } = renderHook(() => useTerminalShell(mockBlogPosts, mockResume));
      act(() => {
        result.current.executeCommand('cat blog/setting-up-pi-hole');
      });
      const historyLength = result.current.history.length;
      expect(result.current.history[historyLength - 3].text).toBe('title   : Pi-hole Setup');
      expect(result.current.history[historyLength - 2].text).toBe('summary : A guide to block ads.');
    });

    it('should show error if blog not found', () => {
      const { result } = renderHook(() => useTerminalShell(mockBlogPosts, mockResume));
      act(() => {
        result.current.executeCommand('cat blog/not-found');
      });
      const lastOutput = result.current.history[result.current.history.length - 1];
      expect(lastOutput.text).toBe('cat: blog post not found: not-found');
    });

    it('should display experience highlights', () => {
      const { result } = renderHook(() => useTerminalShell(mockBlogPosts, mockResume));
      act(() => {
        result.current.executeCommand('cat experience/provision-analytics');
      });
      const historyLength = result.current.history.length;
      expect(result.current.history[historyLength - 6].text).toBe('company : Provision Analytics');
      expect(result.current.history[historyLength - 5].text).toBe('role    : Senior Software Developer');
      expect(result.current.history[historyLength - 2].text).toBe('  - Led backend refactors');
    });

    it('should handle experience without highlights', () => {
      const { result } = renderHook(() => useTerminalShell(mockBlogPosts, mockResume));
      act(() => {
        result.current.executeCommand('cat experience/symend');
      });
      const lastOutput = result.current.history[result.current.history.length - 1];
      expect(lastOutput.text).toBe('period  : 2021 - 2023');
    });

    it('should show error if experience not found', () => {
      const { result } = renderHook(() => useTerminalShell(mockBlogPosts, mockResume));
      act(() => {
        result.current.executeCommand('cat experience/unknown-company');
      });
      const lastOutput = result.current.history[result.current.history.length - 1];
      expect(lastOutput.text).toBe('cat: experience record not found: unknown-company');
    });

    it('should show error for invalid path type', () => {
      const { result } = renderHook(() => useTerminalShell(mockBlogPosts, mockResume));
      act(() => {
        result.current.executeCommand('cat invalid-path');
      });
      const lastOutput = result.current.history[result.current.history.length - 1];
      expect(lastOutput.text).toBe('cat: no such file or directory: invalid-path');
    });
  });

  describe('open strategy', () => {
    it('should validate target path', () => {
      const { result } = renderHook(() => useTerminalShell(mockBlogPosts, mockResume));
      act(() => {
        result.current.executeCommand('open');
      });
      const lastOutput = result.current.history[result.current.history.length - 1];
      expect(lastOutput.text).toContain('open: invalid target');
    });

    it('should route user to blog post if found', () => {
      const { result } = renderHook(() => useTerminalShell(mockBlogPosts, mockResume));
      act(() => {
        result.current.executeCommand('open blog/setting-up-pi-hole');
      });
      const lastOutput = result.current.history[result.current.history.length - 1];
      expect(lastOutput.text).toBe('Navigating to: /blog/setting-up-pi-hole...');
      expect(mockPush).toHaveBeenCalledWith('/blog/setting-up-pi-hole');
    });

    it('should return error if open target not found', () => {
      const { result } = renderHook(() => useTerminalShell(mockBlogPosts, mockResume));
      act(() => {
        result.current.executeCommand('open blog/not-found');
      });
      const lastOutput = result.current.history[result.current.history.length - 1];
      expect(lastOutput.text).toBe('open: blog post not found: not-found');
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  it('should print error for unknown commands', () => {
    const { result } = renderHook(() => useTerminalShell(mockBlogPosts, mockResume));
    act(() => {
      result.current.executeCommand('nonexistent');
    });
    const lastOutput = result.current.history[result.current.history.length - 1];
    expect(lastOutput.text).toBe('bash: command not found: nonexistent. Type "help" to view commands.');
  });

  it('should handle handleCommandSubmit correctly', () => {
    const { result } = renderHook(() => useTerminalShell(mockBlogPosts, mockResume));
    act(() => {
      result.current.setInput('clear');
    });
    act(() => {
      const mockEvent = { preventDefault: jest.fn() } as unknown as React.FormEvent;
      result.current.handleCommandSubmit(mockEvent);
    });
    expect(result.current.input).toBe('');
    expect(result.current.history).toEqual([]);
  });

  it('should support clearing history via context callback', () => {
    const { result } = renderHook(() => useTerminalShell(mockBlogPosts, mockResume));
    
    
    CommandRegistry['testclear'] = {
      execute(arg: any, context: any) {
        context.clearHistory();
        return [];
      }
    };
    
    act(() => {
      result.current.executeCommand('testclear');
    });
    
    expect(result.current.history).toEqual([{ type: 'input', text: 'testclear', prompt: 'guest@ajx-terminal:~$' }]);
    delete CommandRegistry['testclear'];
  });

  it('should handle undefined experience and previousExperience gracefully in ls and cat strategies', () => {
    const minimalResume: ResumeData = {
      summary: mockResume.summary,
      downloadUrl: mockResume.downloadUrl,
      contact: mockResume.contact,
      skills: [],
      projects: [],
      education: [],
      experience: undefined as any,
      previousExperience: undefined as any
    };
    
    const { result } = renderHook(() => useTerminalShell(mockBlogPosts, minimalResume));
    
    act(() => {
      result.current.executeCommand('ls experience');
    });
    expect(result.current.history[result.current.history.length - 1].text).toBe('No experience records found.');

    act(() => {
      result.current.executeCommand('cat experience/some-company');
    });
    expect(result.current.history[result.current.history.length - 1].text).toBe('cat: experience record not found: some-company');
  });

  describe('ask strategy', () => {
    it('should set AI mode and return transition message when no args provided', () => {
      const { result } = renderHook(() => useTerminalShell(mockBlogPosts, mockResume));
      act(() => {
        result.current.executeCommand('ask');
      });
      const lastOutput = result.current.history[result.current.history.length - 1];
      expect(lastOutput.text).toContain('Entered AI mode. Type your questions, or type "exit" to leave.');
      expect(result.current.isAiMode).toBe(true);
    });

    it('should output waiting text when given args in non-AI mode', () => {
      const { result } = renderHook(() => useTerminalShell(mockBlogPosts, mockResume));
      act(() => {
        result.current.executeCommand('ask Who are you?');
      });
      const historyLength = result.current.history.length;
      expect(result.current.history[historyLength - 2].text).toBe('Who are you?');
    });
  });

  describe('theme strategy', () => {
    it('should show usage when no arg provided', () => {
      const { result } = renderHook(() => useTerminalShell(mockBlogPosts, mockResume));
      act(() => {
        result.current.executeCommand('theme');
      });
      const lastOutput = result.current.history[result.current.history.length - 1];
      expect(lastOutput.text).toContain('Usage: theme <name>');
    });

    it('should set data-theme attribute and confirm when arg provided', () => {
      const { result } = renderHook(() => useTerminalShell(mockBlogPosts, mockResume));
      act(() => {
        result.current.executeCommand('theme cyberpunk');
      });
      expect(document.documentElement.getAttribute('data-theme')).toBe('cyberpunk');
      const lastOutput = result.current.history[result.current.history.length - 1];
      expect(lastOutput.text).toBe('Theme set to: cyberpunk');
    });
  });

  describe('handleKeyDown', () => {
    it('should handle Ctrl+C to abort AI typing', async () => {
      const { result } = renderHook(() => useTerminalShell(mockBlogPosts, mockResume));
      
      mockFetchEventSource.mockImplementationOnce(() => new Promise(() => {}));

      await act(async () => {
        await result.current.executeCommand('ask hello');
      });

      // Simulate Ctrl+C
      act(() => {
        const preventDefault = jest.fn();
        result.current.handleKeyDown({
          key: 'c',
          ctrlKey: true,
          preventDefault
        } as unknown as React.KeyboardEvent<HTMLInputElement>);
      });

      const lastOutput = result.current.history[result.current.history.length - 1];
      expect(lastOutput.text).toBe('^C (Aborted)');
      expect(result.current.isAiTyping).toBe(false);
    });

    it('should handle Ctrl+C when not typing', () => {
      const { result } = renderHook(() => useTerminalShell(mockBlogPosts, mockResume));
      act(() => result.current.setInput('ls b'));
      
      act(() => {
        const preventDefault = jest.fn();
        result.current.handleKeyDown({
          key: 'c',
          ctrlKey: true,
          preventDefault
        } as unknown as React.KeyboardEvent<HTMLInputElement>);
      });

      const lastOutput = result.current.history[result.current.history.length - 1];
      expect(lastOutput.text).toBe('ls b^C');
      expect(result.current.input).toBe('');
    });

    it('should navigate history with ArrowUp and ArrowDown', () => {
      const { result } = renderHook(() => useTerminalShell(mockBlogPosts, mockResume));
      act(() => {
        result.current.executeCommand('clear');
      });
      act(() => {
        result.current.executeCommand('ls');
      });

      // ArrowUp
      act(() => {
        result.current.handleKeyDown({ key: 'ArrowUp', preventDefault: jest.fn() } as any);
      });
      expect(result.current.input).toBe('ls');

      act(() => {
        result.current.handleKeyDown({ key: 'ArrowUp', preventDefault: jest.fn() } as any);
      });
      expect(result.current.input).toBe('clear');

      // ArrowDown
      act(() => {
        result.current.handleKeyDown({ key: 'ArrowDown', preventDefault: jest.fn() } as any);
      });
      expect(result.current.input).toBe('ls');

      // ArrowDown to empty
      act(() => {
        result.current.handleKeyDown({ key: 'ArrowDown', preventDefault: jest.fn() } as any);
      });
      expect(result.current.input).toBe('');
    });

    it('should handle Tab completion', () => {
      const { result } = renderHook(() => useTerminalShell(mockBlogPosts, mockResume));
      act(() => result.current.setInput('cl'));
      
      act(() => {
        result.current.handleKeyDown({ key: 'Tab', preventDefault: jest.fn() } as any);
      });
      expect(result.current.input).toBe('clear ');
    });
  });
});
