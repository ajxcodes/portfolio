import React from 'react';
import { render, screen } from '@testing-library/react';
import ProjectReleaseList from '../ProjectReleaseList';

describe('ProjectReleaseList', () => {
  it('renders one row per release', () => {
    render(
      <ProjectReleaseList
        releases={[
          { tagName: 'v1.0.0', name: 'v1.0.0', url: 'https://example.com/v1', publishedAt: '2026-01-01T00:00:00Z', isPrerelease: false },
          { tagName: 'v2.0.0-rc.1', name: 'v2.0.0-rc.1', url: 'https://example.com/v2', publishedAt: '2026-02-01T00:00:00Z', isPrerelease: true },
        ]}
      />
    );

    expect(screen.getByText('v1.0.0')).toBeInTheDocument();
    expect(screen.getByText('v2.0.0-rc.1')).toBeInTheDocument();
  });

  it('renders nothing when there are no releases', () => {
    render(<ProjectReleaseList releases={[]} />);

    expect(screen.queryByText('Releases')).not.toBeInTheDocument();
  });

  it('renders name, prerelease badge, formatted date and handles missing url/invalid date', () => {
    render(
      <ProjectReleaseList
        releases={[
          { tagName: 'v1.0.0', name: 'Release One', url: 'https://example.com/v1', publishedAt: '2026-03-04T12:00:00Z', isPrerelease: true },
          { tagName: 'v0.9.0', name: null, url: '', publishedAt: 'not-a-date', isPrerelease: false },
          { tagName: 'v0.8.0', name: 'v0.8.0', url: 'https://example.com/v0', publishedAt: null, isPrerelease: false },
        ]}
      />
    );

    expect(screen.getByText('Release One')).toBeInTheDocument();
    expect(screen.getByText('prerelease')).toBeInTheDocument();
    expect(screen.getByText('2026-03-04')).toBeInTheDocument();
    // no url -> span not link
    expect(screen.getByText('v0.9.0').closest('a')).toBeNull();
    // no publishedAt shown for null
    expect(screen.queryByText('null')).not.toBeInTheDocument();
  });

  it('renders nothing when releases is undefined', () => {
    const { container } = render(<ProjectReleaseList />);
    expect(container).toBeEmptyDOMElement();
  });
});
