import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import AdminProjectsPage from '../page';

jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>;
});

jest.mock('@/lib/supabaseBrowser', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } })
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
  }
];

describe('AdminProjectsPage', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockProjects),
    }) as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders admin project list', async () => {
    render(<AdminProjectsPage />);

    await waitFor(() => {
      expect(screen.getByText('Alpha Project')).toBeInTheDocument();
    });

    expect(screen.getByText('New Project')).toBeInTheDocument();
  });
});
