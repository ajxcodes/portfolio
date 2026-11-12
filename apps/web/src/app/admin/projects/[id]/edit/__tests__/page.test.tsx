import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import EditProjectPage from '../page';

const mockPush = jest.fn();
const mockRefresh = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

jest.mock('next/link', () => {
  function LinkMock({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  }
  LinkMock.displayName = 'LinkMock';
  return LinkMock;
});

jest.mock('next/dynamic', () => () => {
  function DynamicComponent(props: any) {
    if (props && typeof props.onChange === 'function') {
      return <textarea data-testid="markdown-editor" value={props.markdown} onChange={(e) => props.onChange(e.target.value)} />;
    }
    return <div />;
  }
  DynamicComponent.displayName = 'DynamicComponent';
  return DynamicComponent;
});

jest.mock('@/lib/supabaseBrowser', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: { access_token: 'tok' } } })
    }
  }
}));

jest.mock('lucide-react', () => ({
  ArrowLeft: () => <div />,
  Save: () => <div />,
  AlertCircle: () => <div />,
  Plus: () => <div />,
  Trash2: () => <div />,
  Loader2: () => <div />,
}));

const mockProject = {
  id: 'p1',
  title: 'Alpha Project',
  slug: 'alpha-project',
  summary: 'Alpha summary',
  content: 'Alpha content',
  visible: true,
  resumeProfileId: 'r1',
  tags: ['oldtag'],
  projectLinks: [{ type: 'github', url: 'https://github.com/a/b', label: 'GH' }],
  startDate: '2025-05-10T00:00:00Z',
};

function setupFetch(overrides?: (url: string, options?: any) => any) {
  return jest.fn().mockImplementation((url: string, options?: any) => {
    if (overrides) {
      const r = overrides(url, options);
      if (r !== undefined) return r;
    }
    if (url.includes('/api/resume')) {
      return Promise.resolve({ ok: true, json: async () => [{ id: 'r1', name: 'P1', isActive: true }, { id: 'r2', name: 'P2', isActive: false }] });
    }
    if (url.includes('/api/projects/p1') && !url.includes('/start-date') && (!options || options.method === 'GET' || options.method === undefined)) {
      return Promise.resolve({ ok: true, json: async () => mockProject });
    }
    if (url.endsWith('/api/projects/p1') && options?.method === 'PUT') {
      return Promise.resolve({ ok: true, json: async () => ({}) });
    }
    if (url.includes('/api/projects/p1/start-date') && options?.method === 'PUT') {
      return Promise.resolve({ ok: true, json: async () => ({}) });
    }
    return Promise.resolve({ ok: true, json: async () => ({}) });
  });
}

describe('EditProjectPage', () => {
  let mockFetch: jest.Mock;

  beforeEach(() => {
    jest.spyOn(React, 'use').mockImplementation(() => ({ id: 'p1' }) as any);
    mockFetch = setupFetch();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('saves the project start date through the dedicated endpoint', async () => {
    render(<EditProjectPage params={Promise.resolve({ id: 'p1' })} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Alpha Project')).toBeInTheDocument();
    });

    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    expect(dateInput).toBeTruthy();
    fireEvent.change(dateInput, { target: { value: '2026-01-15' } });

    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/projects/p1/start-date'), expect.objectContaining({ method: 'PUT' }));
    });
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/projects/p1/start-date'), expect.objectContaining({ body: expect.stringContaining('"startDate":"2026-01-15') }));
  });

  it('shows error when loading project fails', async () => {
    global.fetch = jest.fn().mockImplementation((url: string, options?: any) => {
      if (url.includes('/api/resume')) {
        return Promise.resolve({ ok: true, json: async () => [{ id: 'r1', name: 'P1', isActive: true }] });
      }
      if (url.includes('/api/projects/p1') && !url.includes('/start-date') && options?.method !== 'PUT') {
        return Promise.resolve({ ok: false, text: async () => 'nope' });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });
    render(<EditProjectPage params={Promise.resolve({ id: 'p1' })} />);
    await waitFor(() => {
      expect(screen.getByText(/Failed to load project/i)).toBeInTheDocument();
    });
  });

  it('validates required fields before save', async () => {
    render(<EditProjectPage params={Promise.resolve({ id: 'p1' })} />);
    await waitFor(() => expect(screen.getByDisplayValue('Alpha Project')).toBeInTheDocument());

    fireEvent.change(screen.getByDisplayValue('Alpha Project'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));

    await waitFor(() => {
      expect(screen.getByText(/Title, Slug, Content, and Persona are required/i)).toBeInTheDocument();
    });
  });

  it('manages tags, links, slug normalization and visible toggle and saves filtered links', async () => {
    render(<EditProjectPage params={Promise.resolve({ id: 'p1' })} />);
    await waitFor(() => expect(screen.getByDisplayValue('Alpha Project')).toBeInTheDocument());

    // slug normalization
    fireEvent.change(screen.getByDisplayValue('alpha-project'), { target: { value: 'My Slug!!' } });
    expect(screen.getByDisplayValue('my-slug--')).toBeInTheDocument();

    // add tag
    const tagInput = screen.getByPlaceholderText(/Add a tag and press Enter/i);
    fireEvent.change(tagInput, { target: { value: 'newtag' } });
    fireEvent.keyDown(tagInput, { key: 'Enter' });
    expect(screen.getByText('newtag')).toBeInTheDocument();

    // remove existing tag
    const oldTag = screen.getByText('oldtag');
    const removeBtn = oldTag.querySelector('button')!;
    fireEvent.click(removeBtn);
    await waitFor(() => expect(screen.queryByText('oldtag')).not.toBeInTheDocument());

    // add, update and remove links
    fireEvent.click(screen.getByRole('button', { name: /Add/i }));
    const urlInputs = screen.getAllByPlaceholderText('https://...');
    // existing link + new empty one
    fireEvent.change(urlInputs[urlInputs.length - 1], { target: { value: 'https://example.com' } });
    const labelInputs = screen.getAllByPlaceholderText('Label (optional)');
    fireEvent.change(labelInputs[labelInputs.length - 1], { target: { value: 'Site' } });
    const selects = screen.getAllByDisplayValue('homepage');
    fireEvent.change(selects[0], { target: { value: 'docs' } });

    // remove first link (the pre-existing github one)
    const trashButtons = screen.getAllByRole('button').filter(b => b.querySelector('div') === null && b.className.includes('text-destructive'));
    // fallback: click first button that is in links area by finding all buttons with no text and destructive class not reliable; use getAllByRole won't work. use container
    const removeButtons = Array.from(document.querySelectorAll('button.text-destructive'));
    fireEvent.click(removeButtons[0] as HTMLElement);

    // toggle visible
    const visible = screen.getByLabelText(/Published \(Visible\)/i) as HTMLInputElement;
    fireEvent.click(visible);
    expect(visible.checked).toBe(false);

    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin/projects');
    });

    const putCall = mockFetch.mock.calls.find((c: any[]) => c[0].endsWith('/api/projects/p1') && c[1]?.method === 'PUT');
    expect(putCall).toBeTruthy();
    const body = JSON.parse(putCall[1].body);
    expect(body.visible).toBe(false);
    expect(body.tags).toContain('newtag');
    // empty-url link filtered out? we set url for new link but removed first; ensure only links with url included
    expect(body.projectLinks.every((l: any) => l.url && l.url.trim())).toBe(true);
  });

  it('shows error when project save fails', async () => {
    global.fetch = setupFetch((url, options) => {
      if (url.endsWith('/api/projects/p1') && options?.method === 'PUT') {
        return Promise.resolve({ ok: false, text: async () => 'save failed' });
      }
      return undefined;
    });
    render(<EditProjectPage params={Promise.resolve({ id: 'p1' })} />);
    await waitFor(() => expect(screen.getByDisplayValue('Alpha Project')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));
    await waitFor(() => expect(screen.getByText(/save failed/i)).toBeInTheDocument());
  });

  it('shows error when start date save fails', async () => {
    global.fetch = setupFetch((url, options) => {
      if (url.includes('/api/projects/p1/start-date') && options?.method === 'PUT') {
        return Promise.resolve({ ok: false, text: async () => 'date failed' });
      }
      return undefined;
    });
    render(<EditProjectPage params={Promise.resolve({ id: 'p1' })} />);
    await waitFor(() => expect(screen.getByDisplayValue('Alpha Project')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));
    await waitFor(() => expect(screen.getByText(/date failed/i)).toBeInTheDocument());
  });

  it('clears start date by sending null', async () => {
    render(<EditProjectPage params={Promise.resolve({ id: 'p1' })} />);
    await waitFor(() => expect(screen.getByDisplayValue('Alpha Project')).toBeInTheDocument());
    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/start-date'), expect.objectContaining({ body: JSON.stringify({ startDate: null }) }));
    });
  });

  it('handles resume profiles load failure gracefully', async () => {
    global.fetch = jest.fn().mockImplementation((url: string, options?: any) => {
      if (url.includes('/api/resume')) {
        return Promise.reject(new Error('profiles down'));
      }
      if (url.includes('/api/projects/p1') && !url.includes('/start-date') && options?.method !== 'PUT') {
        return Promise.resolve({ ok: true, json: async () => mockProject });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });
    render(<EditProjectPage params={Promise.resolve({ id: 'p1' })} />);
    await waitFor(() => expect(screen.getByDisplayValue('Alpha Project')).toBeInTheDocument());
    // page still renders and save button disabled because no resumeProfileId selected? resumeProfileId came from project
    expect(screen.getByRole('button', { name: /Save Changes/i })).toBeInTheDocument();
  });
});
