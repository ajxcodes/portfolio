import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TerminalShell } from '../TerminalShell';
import { useTerminalShell } from '@/hooks/useTerminalShell';
import { BlogPost, ResumeData } from '@/lib/data';

jest.mock('@/hooks/useTerminalShell', () => ({
  useTerminalShell: jest.fn(),
}));

jest.mock('react-markdown', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="markdown">{children}</div>,
}));

window.HTMLElement.prototype.scrollIntoView = jest.fn();

const mockUseTerminalShell = useTerminalShell as jest.Mock;

describe('TerminalShell Component', () => {
  const mockBlogPosts: BlogPost[] = [
    { slug: 'pi-hole', title: 'Pi-hole', summary: 'Ad blocker' } as BlogPost,
  ];

  const mockResume: ResumeData = {
    summary: { lead: 'test', highlights: [] },
    downloadUrl: '',
    experience: [],
    previousExperience: [],
    contact: { links: [{ type: 'email', url: 'test@test.com' }] },
    skills: [],
    projects: [],
    education: [],
  };

  const baseState = {
    input: '',
    setInput: jest.fn(),
    history: [
      { type: 'input', text: 'help', prompt: 'guest@ajx-terminal:~$' },
      { type: 'output', text: 'available commands', isMarkdown: false },
      { type: 'output', text: '**markdown**', isMarkdown: true },
    ],
    terminalEndRef: { current: null },
    handleCommandSubmit: jest.fn((e) => e.preventDefault()),
    handleKeyDown: jest.fn(),
    isAiMode: false,
    isAiTyping: false,
    isWarmingUp: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTerminalShell.mockReturnValue(baseState);
  });

  it('renders terminal layout and history', () => {
    render(<TerminalShell blogPosts={mockBlogPosts} resume={mockResume} />);

    expect(screen.getByText('bash - interactive_shell.sh')).toBeInTheDocument();
    expect(screen.getByText('help')).toBeInTheDocument();
    expect(screen.getByText('available commands')).toBeInTheDocument();
    expect(screen.getByTestId('markdown')).toHaveTextContent('**markdown**');

    const inputEl = screen.getByPlaceholderText('Type "help" to start...');
    fireEvent.change(inputEl, { target: { value: 'ls' } });
    expect(baseState.setInput).toHaveBeenCalledWith('ls');
    fireEvent.submit(inputEl.closest('form')!);
    expect(baseState.handleCommandSubmit).toHaveBeenCalled();
  });

  it('renders AI mode, typing and warmup states and can hide title bar', () => {
    mockUseTerminalShell.mockReturnValue({
      ...baseState,
      history: [],
      isAiMode: true,
      isAiTyping: true,
      isWarmingUp: true,
    });

    const { container } = render(
      <TerminalShell blogPosts={mockBlogPosts} resume={mockResume} hideTitleBar heightClass="h-[100px]" />
    );

    expect(screen.queryByText('bash - interactive_shell.sh')).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText('Type your question to AI...')).toBeInTheDocument();
    expect(screen.getByText('waking up backend server...')).toBeInTheDocument();
    expect(container.querySelector('.h-\\[100px\\]')).toBeInTheDocument();

    fireEvent.click(container.firstChild as HTMLElement);
  });
});
