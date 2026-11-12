import { RelatedProject } from '@/lib/data';
import ProjectReleaseList from './ProjectReleaseList';

interface RelatedProjectCardProps {
  project: RelatedProject;
}

/**
 * Renders a single project attached to a blog post: name, summary, links and releases.
 */
export default function RelatedProjectCard({ project }: RelatedProjectCardProps) {
  const links = project.projectLinks ?? [];

  return (
    <div className="border border-primary/20 rounded-lg p-4 bg-primary/5" data-testid="related-project-card">
      <h3 className="text-sm font-bold font-mono text-primary">{project.title}</h3>

      {project.summary && (
        <p className="mt-1 text-xs text-muted-foreground/90">{project.summary}</p>
      )}

      {links.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-3">
          {links.map((link, index) => (
            <li key={link.id || `${link.type}-${index}`}>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                {link.label || link.type}
              </a>
            </li>
          ))}
        </ul>
      )}

      <ProjectReleaseList releases={project.releases} />
    </div>
  );
}
