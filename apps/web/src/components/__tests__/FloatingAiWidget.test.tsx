import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { FloatingAiWidget } from '../FloatingAiWidget';
import { useAiChat } from '@/hooks/useAiChat';
import { usePathname } from 'next/navigation';

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
  useRouter: jest.fn(() => ({
    push: jest.fn()
  }))
}));

jest.mock('@/hooks/useAiChat', () => ({
  useAiChat: jest.fn()
}));

// Mock icons to simplify testing
jest.mock('../icons', () => ({
  BotIcon: () => <svg data-testid="bot-icon" />,
  MessageCircleIcon: () => <svg data-testid="message-icon" />,
  XCircleIcon: () => <svg data-testid="x-icon" />,
  TerminalIcon: () => <svg data-testid="terminal-icon" />
}));

// Mock react-markdown because it is an ESM module
jest.mock('react-markdown', () => {
  return function MockReactMarkdown({ children }: any) {
    return <div data-testid="react-markdown">{children}</div>;
  };
});

describe('FloatingAiWidget', () => {
  const mockSendMessage = jest.fn();
  const mockStopStreaming = jest.fn();
  const mockClearChat = jest.fn();

  const mockResume = {
    contact: { email: 'test@example.com' },
    education: [],
    experience: [],
    projects: [],
    skills: {}
  } as any;

  beforeAll(() => {
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (usePathname as jest.Mock).mockReturnValue('/resume');
    
    (useAiChat as jest.Mock).mockReturnValue({
      messages: [],
      isTyping: false,
      sendMessage: mockSendMessage,
      stopStreaming: mockStopStreaming,
      clearChat: mockClearChat
    });
  });

  it('renders closed by default', () => {
    render(<FloatingAiWidget />);
    expect(screen.getByRole('button', { name: /Open AI Chat/i })).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Type a message\.\.\./i)).not.toBeInTheDocument();
  });

  it('opens when clicked', () => {
    render(<FloatingAiWidget />);
    
    const triggerBtn = screen.getByRole('button', { name: /Open AI Chat/i });
    fireEvent.click(triggerBtn);

    expect(screen.getByText('AI Assistant')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Type a message\.\.\./i)).toBeInTheDocument();
  });

  it('displays chat messages', () => {
    (useAiChat as jest.Mock).mockReturnValue({
      messages: [
        { id: '1', role: 'user', content: 'Hello' },
        { id: '2', role: 'assistant', content: 'Hi there' }
      ],
      isTyping: false,
      sendMessage: mockSendMessage,
      stopStreaming: mockStopStreaming,
      clearChat: mockClearChat
    });

    render(<FloatingAiWidget />);
    fireEvent.click(screen.getByRole('button', { name: /Open AI Chat/i }));

    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi there')).toBeInTheDocument();
  });

  it('sends message on form submit', () => {
    render(<FloatingAiWidget />);
    fireEvent.click(screen.getByRole('button', { name: /Open AI Chat/i }));

    const input = screen.getByPlaceholderText(/Type a message\.\.\./i);
    fireEvent.change(input, { target: { value: 'Test message' } });
    
    const form = input.closest('form');
    fireEvent.submit(form!);

    expect(mockSendMessage).toHaveBeenCalledWith('Test message');
  });

  it('shows stop button when typing', () => {
    (useAiChat as jest.Mock).mockReturnValue({
      messages: [],
      isTyping: true,
      sendMessage: mockSendMessage,
      stopStreaming: mockStopStreaming,
      clearChat: mockClearChat
    });

    render(<FloatingAiWidget />);
    fireEvent.click(screen.getByRole('button', { name: /Open AI Chat/i }));

    const stopBtn = screen.getByRole('button', { name: /Stop/i });
    expect(stopBtn).toBeInTheDocument();
    
    fireEvent.click(stopBtn);
    expect(mockStopStreaming).toHaveBeenCalled();
  });

  it('disables terminal tab on homepage', () => {
    (usePathname as jest.Mock).mockReturnValue('/');
    
    render(<FloatingAiWidget />);
    fireEvent.click(screen.getByRole('button', { name: /Open AI Chat/i }));

    const terminalTab = screen.queryByText('Shell');
    expect(terminalTab).not.toBeInTheDocument();
  });

  it('switches to terminal tab', () => {
    (usePathname as jest.Mock).mockReturnValue('/resume');
    render(<FloatingAiWidget resume={mockResume} />);
    
    fireEvent.click(screen.getByRole('button', { name: /Open AI Chat/i }));
    
    const terminalTab = screen.getByText('Shell');
    expect(terminalTab).toBeInTheDocument();
    
    fireEvent.click(terminalTab);
    expect(screen.getByText(/ajxcodes Interactive Shell/)).toBeInTheDocument();
  });

  it('listens for openAiWidget global event', () => {
    render(<FloatingAiWidget resume={mockResume} />);
    
    expect(screen.queryByPlaceholderText(/Type a message\.\.\./i)).not.toBeInTheDocument();
    
    act(() => {
      window.dispatchEvent(new CustomEvent('openAiWidget'));
    });

    expect(screen.getByPlaceholderText(/Type a message\.\.\./i)).toBeInTheDocument();
  });

  it('switches to gui tab if terminal tab is active and route changes to homepage', () => {
    (usePathname as jest.Mock).mockReturnValue('/resume');
    const { rerender } = render(<FloatingAiWidget resume={mockResume} />);
    fireEvent.click(screen.getByRole('button', { name: /Open AI Chat/i }));
    fireEvent.click(screen.getByText('Shell'));
    expect(screen.getByText(/ajxcodes Interactive Shell/)).toBeInTheDocument();
    
    (usePathname as jest.Mock).mockReturnValue('/');
    rerender(<FloatingAiWidget resume={mockResume} />);
    expect(screen.queryByText(/ajxcodes Interactive Shell/)).not.toBeInTheDocument();
    expect(screen.getByText('Ask me anything about the resume, experience, or projects!')).toBeInTheDocument();
  });

  it('scrolls to bottom on new message', () => {
    const scrollIntoViewSpy = jest.spyOn(window.HTMLElement.prototype, 'scrollIntoView');
    
    (useAiChat as jest.Mock).mockReturnValue({
      messages: [{ id: '1', role: 'user', content: 'Hello' }],
      isTyping: true,
      sendMessage: mockSendMessage,
      stopStreaming: mockStopStreaming,
      clearChat: mockClearChat
    });

    render(<FloatingAiWidget />);
    fireEvent.click(screen.getByRole('button', { name: /Open AI Chat/i }));
    expect(scrollIntoViewSpy).toHaveBeenCalledWith({ behavior: 'smooth' });
  });

  it('submits on Enter without shift key', () => {
    render(<FloatingAiWidget />);
    fireEvent.click(screen.getByRole('button', { name: /Open AI Chat/i }));

    const input = screen.getByPlaceholderText(/Type a message\.\.\./i);
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: false });

    expect(mockSendMessage).toHaveBeenCalledWith('Test message');
  });

  it('shows Thinking... with bouncing BotIcon when assistant message is empty and streaming', () => {
    (useAiChat as jest.Mock).mockReturnValue({
      messages: [
        { id: '1', role: 'user', content: 'Hello' },
        { id: '2', role: 'assistant', content: '', isStreaming: true }
      ],
      isTyping: true,
      sendMessage: mockSendMessage,
      stopStreaming: mockStopStreaming,
      clearChat: mockClearChat
    });

    render(<FloatingAiWidget />);
    fireEvent.click(screen.getByRole('button', { name: /Open AI Chat/i }));

    expect(screen.getByText('Thinking...')).toBeInTheDocument();
    const botIcon = screen.getAllByTestId('bot-icon')[1]; // The first one is probably in the title bar or somewhere else, the second is the avatar
    expect(botIcon).toBeInTheDocument();
  });

  it('calls clearChat when Clear Chat is clicked', () => {
    (useAiChat as jest.Mock).mockReturnValue({
      messages: [{ id: '1', role: 'user', content: 'Hello' }],
      isTyping: false,
      sendMessage: mockSendMessage,
      stopStreaming: mockStopStreaming,
      clearChat: mockClearChat
    });

    render(<FloatingAiWidget />);
    fireEvent.click(screen.getByRole('button', { name: /Open AI Chat/i }));

    const clearBtn = screen.getByText('Clear Chat');
    fireEvent.click(clearBtn);

    expect(mockClearChat).toHaveBeenCalled();
  });

  it('closes widget when the title bar red close button is clicked', async () => {
    render(<FloatingAiWidget />);
    
    // Open widget
    fireEvent.click(screen.getByRole('button', { name: /Open AI Chat/i }));
    expect(screen.getByPlaceholderText(/Type a message\.\.\./i)).toBeInTheDocument();

    const closeBtn = screen.getByLabelText('Close widget');
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByPlaceholderText(/Type a message\.\.\./i)).not.toBeInTheDocument();
    });
  });
});
