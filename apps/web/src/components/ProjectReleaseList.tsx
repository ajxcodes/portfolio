import { RepoRelease } from '@/lib/data';

interface ProjectReleaseListProps {
  releases?: RepoRelease[];
}

function formatPublishedAt(publishedAt?: string | null): string | null {
  if (!publishedAt) return null;

  const parsed = new Date(publishedAt);
  if (Number.isNaN(parsed.getTime())) return null;

  return parsed.toISOString().slice(0, 10);
}

/**
 * Renders the release list of a project. The list is shared by the blog post's
 * "Related Projects" section and the public project detail page, so the two surfaces
 * always stay in sync.
 */
export default function ProjectReleaseList({ releases }: ProjectReleaseListProps) {
  if (!releases || releases.length === 0) return null;

  return (
    <div className="mt-4" data-testid="project-release-list">
      <h3 className="text-xs font-bold uppercase tracking-wider text-primary/80">Releases</h3>
      <ul className="mt-2 space-y-1">
        {releases.map((release, index) => {
          const publishedAt = formatPublishedAt(release.publishedAt);

          return (
            <li
              key={`${release.tagName}-${release.url || index}`}
              className="flex flex-wrap items-center gap-2 text-xs"
            >
              {release.url ? (
                <a
                  href={release.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-primary hover:underline"
                >
                  {release.tagName}
                </a>
              ) : (
                <span className="font-mono text-primary">{release.tagName}</span>
              )}
              {release.name && release.name !== release.tagName && (
                <span className="text-muted-foreground/80">{release.name}</span>
              )}
              {release.isPrerelease && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary border border-primary/20">
                  prerelease
                </span>
              )}
              {publishedAt && (
                <span className="text-muted-foreground/60">{publishedAt}</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
