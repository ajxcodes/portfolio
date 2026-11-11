import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AdminProjectsPage from '../page';

jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>;
});

jest.mock('@/lib/supabaseBrowser', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: { access_token: 'test-token' } } })
    }
  }
}));

jest.mock('lucide-react', () => ({
  FileText: () => <div />,
  Plus: () => <div />,
  AlertCircle: () => <div />,
  EyeOff: () => <div />,
  Eye: () => <div />,
  Trash2: () => <div />,
  Edit: () => <div />,
}));

const mockProjects = [
  {
    id: 'p1',
    slug: 'alpha',
    title: 'Alpha Project',
    summary: 'Summary',
    visible: true,
    datePosted: '2026-01-01T00:00:00Z',
    tags: ['ts']
  },
  {
    id: 'p2',
    slug: 'beta',
    title: 'Beta Draft',
    summary: 'Draft summary',
    visible: false,
    datePosted: '2026-01-02T00:00:00Z',
    tags: []
  }
];

describe('AdminProjectsPage', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders admin project list', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockProjects),
    }) as any;

    render(<AdminProjectsPage />);

    await waitFor(() => {
      expect(screen.getByText('Alpha Project')).toBeInTheDocument();
    });

    expect(screen.getByText('New Project')).toBeInTheDocument();
    expect(screen.getByText('Published')).toBeInTheDocument();
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('renders empty state when no projects', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    }) as any;

    render(<AdminProjectsPage />);

    await waitFor(() => {
      expect(screen.getByText('No Projects Found')).toBeInTheDocument();
    });
    expect(screen.getByText('Create First Project')).toBeInTheDocument();
  });

  it('shows error when loading fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve([]),
      text: () => Promise.resolve('error'),
    }) as any;

    render(<AdminProjectsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load projects/)).toBeInTheDocument();
    });
  });

  it('deletes a project after confirmation', async () => {
    const fetchMock = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockProjects) })
      .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('') });
    global.fetch = fetchMock as any;

    render(<AdminProjectsPage />);

    await waitFor(() => {
      expect(screen.getByText('Alpha Project')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });
    fireEvent.click(deleteButtons[0]);

    expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByText(/Are you sure you want to delete/)).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: 'Delete' })[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Delete' }));

    await waitFor(() => {
      expect(screen.queryByText('Alpha Project')).not.toBeInTheDocument();
    });
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/projects/p1'), expect.objectContaining({ method: 'DELETE' }));
  });

  it('restores list and shows error when delete fails', async () => {
    const fetchMock = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockProjects) })
      .mockResolvedValueOnce({ ok: false, status: 500, text: () => Promise.resolve('boom') });
    global.fetch = fetchMock as any;

    render(<AdminProjectsPage />);

    await waitFor(() => {
      expect(screen.getByText('Alpha Project')).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole('button', { name: 'Delete' })[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Delete' }));

    await waitFor(() => {
      expect(screen.getByText('boom')).toBeInTheDocument();
    });
    expect(screen.getByText('Alpha Project')).toBeInTheDocument();
  });
});
