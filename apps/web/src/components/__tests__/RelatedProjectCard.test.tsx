import React from 'react';
import { render, screen } from '@testing-library/react';
import RelatedProjectCard from '../RelatedProjectCard';

describe('RelatedProjectCard', () => {
  it('renders project details, links and releases', () => {
    render(
      <RelatedProjectCard
        project={{
          id: 'p1',
          title: 'Alpha Project',
          slug: 'alpha-project',
          summary: 'Alpha summary',
          visible: true,
          projectLinks: [{ type: 'github', url: 'https://github.com/example/alpha', label: 'GitHub' }],
          releases: [{ tagName: 'v1.0.0', name: 'v1.0.0', url: 'https://example.com/v1', publishedAt: '2026-01-01T00:00:00Z', isPrerelease: false }],
        }}
      />
    );

    expect(screen.getByText('Alpha Project')).toBeInTheDocument();
    expect(screen.getByText('Alpha summary')).toBeInTheDocument();
    expect(screen.getByText('GitHub')).toBeInTheDocument();
    expect(screen.getByText('v1.0.0')).toBeInTheDocument();
  });

  it('handles missing summary, missing links and link without id/label', () => {
    render(
      <RelatedProjectCard
        project={{
          id: 'p2',
          title: 'Beta Project',
          slug: 'beta-project',
          summary: '',
          visible: true,
          projectLinks: undefined,
          releases: [],
        } as any}
      />
    );
    expect(screen.getByText('Beta Project')).toBeInTheDocument();
    expect(screen.queryByText('Alpha summary')).not.toBeInTheDocument();

    render(
      <RelatedProjectCard
        project={{
          id: 'p3',
          title: 'Gamma Project',
          slug: 'gamma-project',
          summary: 'S',
          visible: true,
          projectLinks: [{ type: 'docs', url: 'https://docs.example.com' } as any],
          releases: [],
        }}
      />
    );
    expect(screen.getByText('docs')).toBeInTheDocument();
  });
});
