import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import CreateBlogPage from '../page';
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

describe('CreateBlogPage', () => {
  let mockFetch: jest.Mock;
  let mockPush: jest.Mock;

  beforeEach(() => {
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('submits a new post successfully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'new-post' })
    });

    render(<CreateBlogPage />);
    
    // Fill out form
    fireEvent.change(screen.getByPlaceholderText(/Post Title/i), { target: { value: 'New Test Post' } });
    fireEvent.change(screen.getByPlaceholderText(/url-friendly-slug/i), { target: { value: 'new-test-post' } });
    fireEvent.change(screen.getByPlaceholderText(/Brief summary/i), { target: { value: 'Test summary' } });
    fireEvent.change(screen.getByTestId('markdown-editor'), { target: { value: 'Test content' } });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /Save Post/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/blog/posts'),
        expect.objectContaining({ method: 'POST' })
      );
      expect(mockPush).toHaveBeenCalledWith('/admin/blog');
    });
  });

  it('calls generate-metadata endpoint for AI auto-fill', async () => {
    // We only need to mock the AI generation fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        slug: 'ai-generated-slug',
        summary: 'AI generated summary'
      })
    });

    render(<CreateBlogPage />);

    // Add required Title and Content for AI generation
    fireEvent.change(screen.getByPlaceholderText(/Post Title/i), { target: { value: 'AI Post' } });
    fireEvent.change(screen.getByTestId('markdown-editor'), { target: { value: 'Content for AI' } });

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

  it('shows error when submission fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      text: jest.fn().mockResolvedValue('Failed to create post'),
    });

    render(<CreateBlogPage />);
    
    // Fill out minimum required fields
    fireEvent.change(screen.getByPlaceholderText(/Post Title/i), { target: { value: 'New Test Post' } });
    fireEvent.change(screen.getByPlaceholderText(/url-friendly-slug/i), { target: { value: 'new-test-post' } });
    fireEvent.change(screen.getByPlaceholderText(/Brief summary/i), { target: { value: 'Test summary' } });
    fireEvent.change(screen.getByTestId('markdown-editor'), { target: { value: 'Test content' } });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /Save Post/i }));

    await waitFor(() => {
      expect(screen.getByText(/Failed to create post/i)).toBeInTheDocument();
    });
  });

  it('shows error when generate metadata fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      text: jest.fn().mockResolvedValue('Generation failed'),
    });

    render(<CreateBlogPage />);
    
    // Fill out title
    fireEvent.change(screen.getByPlaceholderText(/Post Title/i), { target: { value: 'New Test Post' } });

    // Click Auto-Fill
    fireEvent.click(screen.getByRole('button', { name: /Auto-Fill Empty Fields/i }));

    await waitFor(() => {
      expect(screen.getByText(/Failed to generate metadata/i)).toBeInTheDocument();
    });
  });

  it('allows adding and removing tags before submitting', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'new-post' })
    });

    render(<CreateBlogPage />);
    
    // Add a tag
    const tagInput = screen.getByPlaceholderText(/Add a tag/i);
    fireEvent.change(tagInput, { target: { value: 'tag1' } });
    fireEvent.keyDown(tagInput, { key: 'Enter', code: 'Enter', charCode: 13 });

    // Add another tag with comma
    fireEvent.change(tagInput, { target: { value: 'tag2' } });
    fireEvent.keyDown(tagInput, { key: ',', code: 'Comma', charCode: 44 });

    // Try adding duplicate tag
    fireEvent.change(tagInput, { target: { value: 'tag1' } });
    fireEvent.keyDown(tagInput, { key: 'Enter', code: 'Enter', charCode: 13 });

    // Try adding empty tag
    fireEvent.change(tagInput, { target: { value: '   ' } });
    fireEvent.keyDown(tagInput, { key: 'Enter', code: 'Enter', charCode: 13 });

    // Check tags are rendered only twice (tag1, tag2)
    const tag1Elements = screen.getAllByText('tag1');
    expect(tag1Elements).toHaveLength(1);
    expect(screen.getByText('tag2')).toBeInTheDocument();

    // Remove first tag
    const removeButtons = screen.getAllByRole('button', { name: /×/ }); // assuming &times; renders as × or can be found by text
    // Let's just use text node
    fireEvent.click(screen.getByText('tag1').querySelector('button') || screen.getAllByRole('button').find(b => b.textContent === '×')!);

    // Fill form
    fireEvent.change(screen.getByPlaceholderText(/Post Title/i), { target: { value: 'Tag Post' } });
    fireEvent.change(screen.getByPlaceholderText(/url-friendly-slug/i), { target: { value: 'tag-post' } });
    fireEvent.change(screen.getByTestId('markdown-editor'), { target: { value: 'Content' } });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /Save Post/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/blog/posts'),
        expect.objectContaining({ 
          method: 'POST',
          body: expect.stringContaining('"tags":["tag2"]')
        })
      );
    });
  });
});
