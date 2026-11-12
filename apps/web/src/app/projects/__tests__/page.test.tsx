import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { ProjectsListClient } from '../ProjectsListClient';

jest.mock('next/link', () => {
  function LinkMock({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  }
  LinkMock.displayName = 'LinkMock';
  return LinkMock;
});

jest.mock('lucide-react', () => ({
  ExternalLink: () => <span data-testid="icon-external" />,
  Github: () => <span data-testid="icon-github" />,
  Store: () => <span data-testid="icon-store" />,
  Globe: () => <span data-testid="icon-globe" />,
}));

const mockProjects = [
  {
    id: 'p1',
    slug: 'alpha',
    title: 'Alpha Project',
    summary: 'Alpha summary',
    content: '# Alpha README\n\nThis is the alpha readme.',
    datePosted: '2026-01-01T00:00:00Z',
    visible: true,
    resumeProfileId: 'r1',
    authorName: 'Author',
    tags: ['ts', 'shared'],
    projectLinks: [
      { id: 'l1', type: 'github', url: 'https://github.com/example/alpha', label: 'GitHub', displayOrder: 0 },
      { id: 'l2', type: 'homepage', url: 'https://alpha.example.com', label: 'Homepage', displayOrder: 1 }
    ],
  },
  {
    id: 'p2',
    slug: 'beta',
    title: 'Beta Project',
    summary: 'Beta summary',
    content: '# Beta README',
    datePosted: '2026-02-01T00:00:00Z',
    visible: true,
    resumeProfileId: 'r1',
    authorName: 'Author',
    tags: ['go', 'shared'],
    projectLinks: [
      { id: 'l3', type: 'store', url: 'https://store.example.com/beta', label: 'Store', displayOrder: 0 }
    ],
  },
];

describe('Projects pages', () => {
  it('renders project list', () => {
    render(<ProjectsListClient initialProjects={mockProjects as any} />);
    expect(screen.getByText('Alpha Project')).toBeInTheDocument();
    expect(screen.getByText('https://github.com/example/alpha')).toBeInTheDocument();
    expect(screen.getByText('GitHub')).toBeInTheDocument();
  });

  it('filters projects by tag', () => {
    render(<ProjectsListClient initialProjects={mockProjects as any} />);
    expect(screen.getByText('Alpha Project')).toBeInTheDocument();
    expect(screen.getByText('Beta Project')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'go' }));

    expect(screen.queryByText('Alpha Project')).not.toBeInTheDocument();
    expect(screen.getByText('Beta Project')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'all' }));
    expect(screen.getByText('Alpha Project')).toBeInTheDocument();
    expect(screen.getByText('Beta Project')).toBeInTheDocument();
  });

  it('renders project detail readme', async () => {
    jest.resetModules();
    jest.doMock('@/lib/data', () => ({
      getProjects: jest.fn().mockResolvedValue(mockProjects),
    }));
    jest.doMock('react-markdown', () => ({ __esModule: true, default: ({ children }: any) => <div>{children}</div> }));
    jest.doMock('rehype-sanitize', () => ({ __esModule: true, default: () => null }));
    jest.doMock('next/navigation', () => ({ notFound: jest.fn(() => { throw new Error('NOT_FOUND'); }) }));

    const Page = (await import('../[id]/page')).default;
    const ui = await Page({ params: Promise.resolve({ id: 'p1' }) } as any);
    render(ui);

    expect(screen.getByText('Alpha Project')).toBeInTheDocument();
    expect(screen.getByText(/This is the alpha readme/)).toBeInTheDocument();
    expect(screen.getByText('https://github.com/example/alpha')).toBeInTheDocument();
    expect(screen.getByText('GitHub')).toBeInTheDocument();
    expect(screen.getByText('Homepage')).toBeInTheDocument();
  });

  it('calls notFound for unknown project id', async () => {
    jest.resetModules();
    const notFound = jest.fn(() => { throw new Error('NOT_FOUND'); });
    jest.doMock('@/lib/data', () => ({
      getProjects: jest.fn().mockResolvedValue(mockProjects),
    }));
    jest.doMock('react-markdown', () => ({ __esModule: true, default: ({ children }: any) => <div>{children}</div> }));
    jest.doMock('rehype-sanitize', () => ({ __esModule: true, default: () => null }));
    jest.doMock('next/navigation', () => ({ notFound }));

    const mod = await import('../[id]/page');
    const Page = mod.default;
    await expect(Page({ params: Promise.resolve({ id: 'missing' }) } as any)).rejects.toThrow('NOT_FOUND');
    expect(notFound).toHaveBeenCalled();

    const meta = await mod.generateMetadata({ params: Promise.resolve({ id: 'p1' }) } as any);
    expect(meta.title).toContain('Alpha Project');
    const missingMeta = await mod.generateMetadata({ params: Promise.resolve({ id: 'missing' }) } as any);
    expect(missingMeta.title).toBe('Project');
  });
});
