import React from 'react';
import { render, screen } from '@testing-library/react';
import AboutPage, { generateMetadata } from '../page';
import { getBlogPostBySlug } from '@/lib/data';
import { notFound } from 'next/navigation';

jest.mock('@/lib/data', () => ({
  getBlogPostBySlug: jest.fn()
}));

jest.mock('next/navigation', () => ({
  notFound: jest.fn()
}));

jest.mock('react-markdown', () => {
  return function MockReactMarkdown({ children }: { children: React.ReactNode }) {
    return <div data-testid="markdown">{children}</div>;
  };
});

describe('AboutPage', () => {
  const mockPost = {
    id: 'post-1',
    title: 'About Me Test',
    summary: 'A test summary',
    content: 'Test content here',
    slug: 'about-me',
    tags: []
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Page Component', () => {
    it('renders the post content if found', async () => {
      (getBlogPostBySlug as jest.Mock).mockResolvedValue(mockPost);
      
      const Page = await AboutPage();
      render(Page);
      
      expect(screen.getByText('About Me Test')).toBeInTheDocument();
      expect(screen.getByText('A test summary')).toBeInTheDocument();
      expect(screen.getByTestId('markdown')).toHaveTextContent('Test content here');
      expect(getBlogPostBySlug).toHaveBeenCalledWith('about-me');
    });

    it('calls notFound if post does not exist', async () => {
      (getBlogPostBySlug as jest.Mock).mockResolvedValue(null);
      
      await AboutPage();
      
      expect(notFound).toHaveBeenCalled();
    });
  });

  describe('generateMetadata', () => {
    it('returns generic metadata if post not found', async () => {
      (getBlogPostBySlug as jest.Mock).mockResolvedValue(null);
      const metadata = await generateMetadata();
      expect(metadata).toEqual({ title: 'About' });
    });

    it('returns post specific metadata if found', async () => {
      (getBlogPostBySlug as jest.Mock).mockResolvedValue(mockPost);
      const metadata = await generateMetadata();
      expect(metadata).toEqual({
        title: 'About Me Test | About',
        description: 'A test summary'
      });
    });
  });
});
