import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import EditBlogPage from '../page';
import { useRouter } from 'next/navigation';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}));

// Mock next/dynamic
jest.mock('next/dynamic', () => () => {
  const DynamicComponent = (props: any) => {
    // If it's the WysiwygEditor, render our textarea
    if (props.onChange) {
      return (
        <textarea 
          data-testid="markdown-editor" 
          value={props.markdown} 
          onChange={(e) => props.onChange(e.target.value)} 
        />
      );
    }
    return <div data-testid="dynamic-component" />;
  };
  return DynamicComponent;
});



// Mock lucide icons
jest.mock('lucide-react', () => ({
  ArrowLeft: () => <div data-testid="arrow-left-icon" />,
  Save: () => <div data-testid="save-icon" />,
  Sparkles: () => <div data-testid="sparkles-icon" />,
  Wand2: () => <div data-testid="wand2-icon" />,
  Loader2: () => <div data-testid="loader2-icon" />,
  AlertCircle: () => <div data-testid="alert-circle-icon" />,
  Eye: () => <div data-testid="eye-icon" />,
  EyeOff: () => <div data-testid="eye-off-icon" />
}));



jest.mock('@/lib/supabaseBrowser', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } })
    }
  }
}));

const mockPost = {
  id: 'post-1',
  title: 'Existing Post',
  slug: 'existing-post',
  summary: 'Existing summary',
  content: 'Existing content',
  visible: true,
  canonicalUrl: null,
  tags: ['existing-tag']
};

describe('EditBlogPage', () => {
  let mockFetch: jest.Mock;
  let mockPush: jest.Mock;
  const mockParams = Promise.resolve({ id: 'post-1' });

  beforeEach(() => {
    jest.spyOn(React, 'use').mockImplementation((promise: any) => {
      // Return the mock value immediately to bypass Suspense in tests
      return { id: 'post-1' };
    });

    mockFetch = jest.fn();
    global.fetch = mockFetch;
    
    // Mock the GET request for the post
    mockFetch.mockImplementation((url, options) => {
      if (url.includes('/api/blog/posts/post-1') && (!options || options.method === 'GET' || options.method === undefined)) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockPost)
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('loads post data on mount', async () => {
    render(<EditBlogPage params={mockParams} />);
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Post Title/i)).toHaveValue('Existing Post');
      expect(screen.getByPlaceholderText(/url-friendly-slug/i)).toHaveValue('existing-post');
      expect(screen.getByPlaceholderText(/Brief summary/i)).toHaveValue('Existing summary');
      expect(screen.getByTestId('markdown-editor')).toHaveValue('Existing content');
      expect(screen.getByText('existing-tag')).toBeInTheDocument();
    });
  });

  it('submits updated post successfully', async () => {
    // Setup PUT mock
    mockFetch.mockImplementation((url, options) => {
      if (url.includes('/api/blog/posts/post-1')) {
        if (!options || options.method === 'GET' || options.method === undefined) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockPost)
          });
        }
        if (options && options.method === 'PUT') {
          return Promise.resolve({ ok: true });
        }
      }
      return Promise.resolve({ ok: true });
    });

    render(<EditBlogPage params={mockParams} />);
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Post Title/i)).toHaveValue('Existing Post');
    });

    // Update title
    fireEvent.change(screen.getByPlaceholderText(/Post Title/i), { target: { value: 'Updated Title' } });

    // Remove existing tag
    fireEvent.click(screen.getByText('existing-tag').querySelector('button') || screen.getAllByRole('button').find(b => b.textContent === '×')!);

    // Add new tag
    const tagInput = screen.getByPlaceholderText(/Add a tag/i);
    fireEvent.change(tagInput, { target: { value: 'new-tag' } });
    fireEvent.keyDown(tagInput, { key: 'Enter', code: 'Enter', charCode: 13 });

    // Try adding duplicate tag
    fireEvent.change(tagInput, { target: { value: 'new-tag' } });
    fireEvent.keyDown(tagInput, { key: 'Enter', code: 'Enter', charCode: 13 });

    // Try adding empty tag
    fireEvent.change(tagInput, { target: { value: '   ' } });
    fireEvent.keyDown(tagInput, { key: 'Enter', code: 'Enter', charCode: 13 });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/blog/posts/post-1'),
        expect.objectContaining({ 
          method: 'PUT',
          body: expect.stringContaining('"tags":["new-tag"]')
        })
      );
      expect(mockPush).toHaveBeenCalledWith('/admin/blog');
    });
  });

  it('calls generate-metadata endpoint for AI auto-fill', async () => {
    // Mock both GET and AI POST
    mockFetch.mockImplementation((url, options) => {
      if (url.includes('/api/blog/posts/post-1') && (!options || options.method === 'GET' || options.method === undefined)) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ ...mockPost, summary: '', slug: '' })
        });
      }
      if (url.includes('/api/blog/posts/generate-metadata')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            slug: 'ai-generated-slug',
            summary: 'AI generated summary'
          })
        });
      }
      return Promise.resolve({ ok: true });
    });

    render(<EditBlogPage params={mockParams} />);
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Post Title/i)).toHaveValue('Existing Post');
    });

    // Click Auto-Fill
    fireEvent.click(screen.getByRole('button', { name: /Auto-Fill Empty Fields/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/blog/posts/generate-metadata'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    // Check that fields were updated
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/url-friendly-slug/i)).toHaveValue('ai-generated-slug');
      expect(screen.getByPlaceholderText(/Brief summary/i)).toHaveValue('AI generated summary');
    });
  });

  it('shows error when loading fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      text: jest.fn().mockResolvedValue('Failed to load post'),
    });

    render(<EditBlogPage params={mockParams} />);
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to load post data/i)).toBeInTheDocument();
    });
  });

  it('shows error when save fails', async () => {
    // First load succeeds
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue(mockPost),
    });
    // Save fails
    mockFetch.mockResolvedValueOnce({
      ok: false,
      text: jest.fn().mockResolvedValue('Failed to update post.'),
    });

    render(<EditBlogPage params={mockParams} />);
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Post Title/i)).toHaveValue('Existing Post');
    });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));

    await waitFor(() => {
      expect(screen.getByText(/Failed to update post/i)).toBeInTheDocument();
    });
  });

  it('shows error when generate metadata fails', async () => {
    // First load succeeds
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue(mockPost),
    });
    // Generate fails
    mockFetch.mockResolvedValueOnce({
      ok: false,
      text: jest.fn().mockResolvedValue('Generation failed'),
    });

    render(<EditBlogPage params={mockParams} />);
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Post Title/i)).toHaveValue('Existing Post');
    });

    // Clear slug to enable the button
    fireEvent.change(screen.getByPlaceholderText(/url-friendly-slug/i), { target: { value: '' } });

    // Click Auto-Fill
    fireEvent.click(screen.getByRole('button', { name: /Auto-Fill Empty Fields/i }));

    await waitFor(() => {
      expect(screen.getByText(/Failed to generate metadata/i)).toBeInTheDocument();
    });
  });
});
