import React from 'react';
import { render, screen } from '@testing-library/react';

describe('Blog post page', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('renders the related projects section with releases', async () => {
    jest.resetModules();
    jest.doMock('@/lib/data', () => ({
      getBlogPostBySlug: jest.fn().mockResolvedValue({
        id: 'b1',
        slug: 'my-post',
        title: 'My Post',
        summary: 'Summary',
        content: 'Body',
        datePosted: '2026-01-01T00:00:00Z',
        visible: true,
        resumeProfileId: 'r1',
        authorName: 'A',
        relatedProjects: [
          {
            id: 'p1',
            title: 'Alpha Project',
            slug: 'alpha',
            summary: 'Alpha summary',
            visible: true,
            projectLinks: [],
            releases: [{ tagName: 'v1.0.0', name: 'v1.0.0', url: 'https://example.com/v1', publishedAt: '2026-01-01T00:00:00Z', isPrerelease: false }],
          },
        ],
      }),
    }));
    jest.doMock('react-markdown', () => ({ __esModule: true, default: ({ children }: any) => <div>{children}</div> }));
    jest.doMock('rehype-sanitize', () => ({ __esModule: true, default: () => null }));
    jest.doMock('next/navigation', () => ({ notFound: jest.fn(() => { throw new Error('NOT_FOUND'); }) }));

    const Page = (await import('../page')).default;
    const ui = await Page({ params: Promise.resolve({ slug: 'my-post' }) } as any);
    render(ui);

    expect(screen.getByText('Related Projects')).toBeInTheDocument();
    expect(screen.getByText('Alpha Project')).toBeInTheDocument();
    expect(screen.getByText('v1.0.0')).toBeInTheDocument();
  });

  it('omits the related projects section when the post has no attached projects', async () => {
    jest.resetModules();
    jest.doMock('@/lib/data', () => ({
      getBlogPostBySlug: jest.fn().mockResolvedValue({
        id: 'b1',
        slug: 'my-post',
        title: 'My Post',
        summary: 'Summary',
        content: 'Body',
        datePosted: '2026-01-01T00:00:00Z',
        visible: true,
        resumeProfileId: 'r1',
        authorName: 'A',
        relatedProjects: [],
      }),
    }));
    jest.doMock('react-markdown', () => ({ __esModule: true, default: ({ children }: any) => <div>{children}</div> }));
    jest.doMock('rehype-sanitize', () => ({ __esModule: true, default: () => null }));
    jest.doMock('next/navigation', () => ({ notFound: jest.fn(() => { throw new Error('NOT_FOUND'); }) }));

    const Page = (await import('../page')).default;
    const ui = await Page({ params: Promise.resolve({ slug: 'my-post' }) } as any);
    render(ui);

    expect(screen.queryByText('Related Projects')).not.toBeInTheDocument();
  });

  it('filters invisible related projects and calls notFound when missing', async () => {
    jest.resetModules();
    const notFound = jest.fn(() => { throw new Error('NOT_FOUND'); });
    jest.doMock('@/lib/data', () => ({
      getBlogPostBySlug: jest.fn().mockResolvedValue({
        id: 'b1', slug: 'my-post', title: 'My Post', summary: 'Summary', content: 'Body',
        datePosted: '2026-01-01T00:00:00Z', visible: true, resumeProfileId: 'r1', authorName: 'A',
        relatedProjects: [{ id: 'p1', title: 'Hidden', slug: 'h', summary: '', visible: false, projectLinks: [], releases: [] }]
      }),
    }));
    jest.doMock('react-markdown', () => ({ __esModule: true, default: ({ children }: any) => <div>{children}</div> }));
    jest.doMock('rehype-sanitize', () => ({ __esModule: true, default: () => null }));
    jest.doMock('next/navigation', () => ({ notFound }));

    const Page = (await import('../page')).default;
    const ui = await Page({ params: Promise.resolve({ slug: 'my-post' }) } as any);
    render(ui);
    expect(screen.queryByText('Related Projects')).not.toBeInTheDocument();

    jest.resetModules();
    const notFound2 = jest.fn(() => { throw new Error('NOT_FOUND'); });
    jest.doMock('@/lib/data', () => ({ getBlogPostBySlug: jest.fn().mockResolvedValue(undefined) }));
    jest.doMock('react-markdown', () => ({ __esModule: true, default: ({ children }: any) => <div>{children}</div> }));
    jest.doMock('rehype-sanitize', () => ({ __esModule: true, default: () => null }));
    jest.doMock('next/navigation', () => ({ notFound: notFound2 }));
    const Page2 = (await import('../page')).default;
    await expect(Page2({ params: Promise.resolve({ slug: 'missing' }) } as any)).rejects.toThrow('NOT_FOUND');
    expect(notFound2).toHaveBeenCalled();
  });

  it('generates metadata from the post', async () => {
    jest.resetModules();
    jest.doMock('@/lib/data', () => ({
      getBlogPostBySlug: jest.fn()
        .mockResolvedValueOnce({ title: 'My Post', summary: 'Sum' })
        .mockResolvedValueOnce(undefined),
    }));
    const { generateMetadata } = await import('../page');
    const meta = await generateMetadata({ params: Promise.resolve({ slug: 'a' }) } as any);
    expect(meta.title).toContain('My Post');
    const meta2 = await generateMetadata({ params: Promise.resolve({ slug: 'b' }) } as any);
    expect(meta2.title).toBe('Blog');
  });

  it('falls back content to summary when content is null and handles undefined relatedProjects', async () => {
    jest.resetModules();
    jest.doMock('@/lib/data', () => ({
      getBlogPostBySlug: jest.fn().mockResolvedValue({
        id: 'b1', slug: 'my-post', title: 'My Post', summary: 'SummaryOnly', content: null,
        datePosted: '2026-01-01T00:00:00Z', visible: true, resumeProfileId: 'r1', authorName: 'A',
        relatedProjects: undefined,
      }),
    }));
    jest.doMock('react-markdown', () => ({ __esModule: true, default: ({ children }: any) => <div data-testid="md">{children}</div> }));
    jest.doMock('rehype-sanitize', () => ({ __esModule: true, default: () => null }));
    jest.doMock('next/navigation', () => ({ notFound: jest.fn(() => { throw new Error('NOT_FOUND'); }) }));

    const Page = (await import('../page')).default;
    const ui = await Page({ params: Promise.resolve({ slug: 'my-post' }) } as any);
    render(ui);
    expect(screen.getByTestId('md')).toHaveTextContent('SummaryOnly');
    expect(screen.queryByText('Related Projects')).not.toBeInTheDocument();
  });

  it('falls back to empty content when content and summary are missing', async () => {
    jest.resetModules();
    jest.doMock('@/lib/data', () => ({
      getBlogPostBySlug: jest.fn().mockResolvedValue({
        id: 'b1', slug: 'my-post', title: 'My Post', summary: null, content: null,
        datePosted: '2026-01-01T00:00:00Z', visible: true, resumeProfileId: 'r1', authorName: 'A',
        relatedProjects: [],
      }),
    }));
    jest.doMock('react-markdown', () => ({ __esModule: true, default: ({ children }: any) => <div data-testid="md">{String(children)}</div> }));
    jest.doMock('rehype-sanitize', () => ({ __esModule: true, default: () => null }));
    jest.doMock('next/navigation', () => ({ notFound: jest.fn(() => { throw new Error('NOT_FOUND'); }) }));

    const Page = (await import('../page')).default;
    const ui = await Page({ params: Promise.resolve({ slug: 'my-post' }) } as any);
    render(ui);
    expect(screen.getByTestId('md')).toHaveTextContent('');
  });
});
