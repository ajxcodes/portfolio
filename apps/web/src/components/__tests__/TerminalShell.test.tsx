import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TerminalShell } from '../TerminalShell';
import { BlogPost, ResumeData } from '@/lib/data';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
    };
  },
}));

// Mock scrollIntoView which is not implemented by jsdom
window.HTMLElement.prototype.scrollIntoView = jest.fn();

describe('TerminalShell Component', () => {
  const mockBlogPosts: BlogPost[] = [
    { slug: 'pi-hole', title: 'Pi-hole', summary: 'Ad blocker' }
  ];

  const mockResume: ResumeData = {
    summary: { lead: 'test', highlights: [] },
    downloadUrl: '',
    experience: [],
    previousExperience: [],
    contact: { links: [{ type: 'email', url: 'test@test.com' }] },
    skills: [],
    projects: [],
    education: []
  };

  it('renders terminal layout and initial history', () => {
    render(<TerminalShell blogPosts={mockBlogPosts} resume={mockResume} />);
    
    expect(screen.getByText('bash - interactive_shell.sh')).toBeInTheDocument();
    expect(screen.getByText('ajxcodes Interactive Shell')).toBeInTheDocument();
  });

  it('allows user to type and execute commands', () => {
    render(<TerminalShell blogPosts={mockBlogPosts} resume={mockResume} />);
    
    const inputEl = screen.getByPlaceholderText('Type "help" to start...');
    expect(inputEl).toBeInTheDocument();

    fireEvent.change(inputEl, { target: { value: 'help' } });
    fireEvent.submit(inputEl);

    // Verify command was echoed in history
    expect(screen.getByText('help')).toBeInTheDocument();
    // Verify command output is displayed
    expect(screen.getByText(/cat \[file\/path\]/)).toBeInTheDocument();
  });
});
