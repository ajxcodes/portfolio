import React from 'react';
import { render, screen } from '@testing-library/react';
import { ProjectsListClient } from '../ProjectsListClient';

jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>;
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
    tags: ['ts'],
    projectLinks: [
      { id: 'l1', type: 'github', url: 'https://github.com/example/alpha', label: 'GitHub', displayOrder: 0 }
    ],
  },
];

describe('Projects pages', () => {
  it('renders project list', () => {
    render(<ProjectsListClient initialProjects={mockProjects as any} />);
    expect(screen.getByText('Alpha Project')).toBeInTheDocument();
    expect(screen.getByText('https://github.com/example/alpha')).toBeInTheDocument();
  });

  it('renders project detail readme', async () => {
    jest.resetModules();
    jest.doMock('@/lib/data', () => ({
      getProjects: jest.fn().mockResolvedValue(mockProjects),
    }));
    jest.doMock('react-markdown', () => ({ __esModule: true, default: ({ children }: any) => <div>{children}</div> }));
    jest.doMock('rehype-sanitize', () => ({ __esModule: true, default: () => null }));
    jest.doMock('next/navigation', () => ({ notFound: jest.fn() }));

    const Page = (await import('../[id]/page')).default;
    const ui = await Page({ params: Promise.resolve({ id: 'p1' }) } as any);
    render(ui);

    expect(screen.getByText('Alpha Project')).toBeInTheDocument();
    expect(screen.getByText(/This is the alpha readme/)).toBeInTheDocument();
    expect(screen.getByText('https://github.com/example/alpha')).toBeInTheDocument();
  });
});
