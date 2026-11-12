import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getProjects } from '@/lib/data';
import ProjectReleaseList from '@/components/ProjectReleaseList';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { ExternalLink, Github, Store, Globe } from 'lucide-react';

function linkIcon(type: string) {
  const t = type.toLowerCase();
  if (t.includes('github')) return <Github className="w-4 h-4" />;
  if (t.includes('store')) return <Store className="w-4 h-4" />;
  if (t.includes('home')) return <Globe className="w-4 h-4" />;
  return <ExternalLink className="w-4 h-4" />;
}

async function getProjectById(id: string) {
  const projects = await getProjects();
  return projects.find((p) => p.id === id);
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const project = await getProjectById(id);
  if (!project) return { title: 'Project' };
  return { title: `${project.title} | Projects`, description: project.summary };
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProjectById(id);
  if (!project) return notFound();

  return (
    <article className="max-w-4xl mx-auto terminal-card p-8 md:p-12 rounded-xl shadow-xl relative overflow-hidden pt-14">
      <div className="absolute top-0 left-0 right-0 bg-primary/5 border-b border-primary/20 px-4 py-2.5 flex items-center gap-1.5 select-none">
        <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
        <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
        <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
        <span className="text-xs font-mono text-primary/60 ml-2">bash - project_readme.md</span>
      </div>

      <header className="mb-8 border-b border-primary/10 pb-6">
        <h1 className="text-3xl font-bold font-mono text-primary mb-2">{project.title}</h1>
        {project.summary && (
          <p className="text-sm text-muted-foreground/90 mb-4">{project.summary}</p>
        )}
        {project.tags && project.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {project.tags.map((tag) => (
              <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                {tag}
              </span>
            ))}
          </div>
        )}
        {project.projectLinks && project.projectLinks.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {project.projectLinks.map((link, idx) => (
              <a
                key={link.id || `${link.type}-${idx}`}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                {linkIcon(link.type)}
                <span>{link.label || link.type}</span>
                <span className="text-muted-foreground/60">{link.url}</span>
              </a>
            ))}
          </div>
        )}

        <ProjectReleaseList releases={project.releases} />
      </header>

      <section className="prose prose-sm sm:prose-base dark:prose-invert max-w-none prose-a:text-primary">
        <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
          {project.content || ''}
        </ReactMarkdown>
      </section>
    </article>
  );
}
