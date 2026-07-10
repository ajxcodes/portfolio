import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import BlogAdminPage from '../page';

jest.mock('lucide-react', () => ({
  Plus: () => <div data-testid="plus-icon" />,
  Edit: () => <div data-testid="edit-icon" />,
  Trash2: () => <div data-testid="trash-icon" />,
  Eye: () => <div data-testid="eye-icon" />,
  EyeOff: () => <div data-testid="eye-off-icon" />,
  FileText: () => <div data-testid="file-text-icon" />,
  AlertCircle: () => <div data-testid="alert-circle-icon" />,
  Calendar: () => <div data-testid="calendar-icon" />,
  User: () => <div data-testid="user-icon" />
}));

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

jest.mock('@/lib/supabaseBrowser', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } })
    }
  }
}));

const mockPosts = [
  {
    id: 'post-1',
    title: 'Test Post 1',
    slug: 'test-post-1',
    summary: 'Summary 1',
    content: 'Content 1',
    visible: true,
    datePosted: '2024-01-01T12:00:00Z',
    postedBy: 'Admin'
  },
  {
    id: 'post-2',
    title: 'Test Post 2',
    slug: 'test-post-2',
    summary: 'Summary 2',
    content: 'Content 2',
    visible: false,
    datePosted: '2024-01-02T12:00:00Z',
    postedBy: 'Admin',
    tags: ['tag1', 'tag2'],
    views: 42
  }
];

describe('BlogAdminPage', () => {
  let mockFetch: jest.Mock;

  beforeEach(() => {
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    
    // Default GET mock
    mockFetch.mockImplementation((url, options) => {
      if (url.includes('/api/blog/posts') && (!options || options.method === 'GET' || options.method === undefined)) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockPosts)
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
    
    window.confirm = jest.fn().mockReturnValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the blog list and data', async () => {
    render(<BlogAdminPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/Test Post 1/i)).toBeInTheDocument();
      expect(screen.getByText(/Test Post 2/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Summary 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Summary 2/i)).toBeInTheDocument();
    
    // Create button
    expect(screen.getByText(/New Post/i)).toBeInTheDocument();
  });

  it('deletes a post when confirmed', async () => {
    // Setup DELETE mock
    mockFetch.mockImplementation((url, options) => {
      if (options && options.method === 'DELETE') {
        return Promise.resolve({ ok: true });
      }
      if (url.includes('/api/blog/posts')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockPosts)
        });
      }
      return Promise.resolve({ ok: true });
    });

    render(<BlogAdminPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/Test Post 1/i)).toBeInTheDocument();
    });

    // Find all delete buttons
    const deleteButtons = screen.getAllByRole('button', { name: /Delete/i });
    
    expect(deleteButtons.length).toBeGreaterThan(0);
    fireEvent.click(deleteButtons[0]);

    // Wait for the modal and click confirm
    const confirmButton = await screen.findByRole('button', { name: /Confirm Delete/i });
    fireEvent.click(confirmButton);
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/blog/posts/post-1'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  it('cancels deletion when cancel is clicked', async () => {
    render(<BlogAdminPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/Test Post 1/i)).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: /Delete/i });
    fireEvent.click(deleteButtons[0]);

    const cancelButton = await screen.findByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);
    
    // Dialog should close
    expect(screen.queryByText(/delete_post/i)).not.toBeInTheDocument();
  });

  it('displays error message when delete fails', async () => {
    mockFetch.mockImplementation((url, options) => {
      if (options && options.method === 'DELETE') {
        return Promise.resolve({ ok: false, text: () => Promise.resolve('Error deleting') });
      }
      if (url.includes('/api/blog/posts')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockPosts) });
      }
      return Promise.resolve({ ok: true });
    });

    render(<BlogAdminPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/Test Post 1/i)).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: /Delete/i });
    fireEvent.click(deleteButtons[0]);

    const confirmButton = await screen.findByRole('button', { name: /Confirm Delete/i });
    fireEvent.click(confirmButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Error deleting/i)).toBeInTheDocument();
    });
  });

  it('displays empty state when no posts', async () => {
    mockFetch.mockImplementation((url, options) => {
      if (url.includes('/api/blog/posts')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      return Promise.resolve({ ok: true });
    });

    render(<BlogAdminPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/No Posts Found/i)).toBeInTheDocument();
    });
  });

  it('displays error when loading posts fails', async () => {
    mockFetch.mockImplementation(() => {
      return Promise.resolve({ ok: false, status: 500 });
    });

    render(<BlogAdminPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to load posts/i)).toBeInTheDocument();
    });
  });
});
