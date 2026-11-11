import type { Metadata } from 'next';
import { getProjects } from '@/lib/data';
import { ProjectsListClient } from './ProjectsListClient';

export const metadata: Metadata = {
  title: 'Projects | AJX Portfolio',
  description: 'A showcase of projects, repositories, and shipped work.',
};

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <div className="max-w-4xl mx-auto mt-4 font-mono">
      <div className="w-full terminal-card p-8 md:p-12 rounded-xl shadow-xl relative overflow-hidden pt-14 mb-12">
        <div className="absolute top-0 left-0 right-0 bg-primary/5 border-b border-primary/20 px-4 py-2.5 flex items-center gap-1.5 select-none">
          <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
          <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
          <span className="text-xs font-mono text-primary/60 ml-2">bash - projects.sh</span>
        </div>

        <header className="mb-10 text-center sm:text-left">
          <h1 className="text-3xl font-bold text-primary mb-3">projects</h1>
          <p className="text-xs text-muted-foreground/80">
            A repo-style overview of things I have built, maintained, and shipped.
          </p>
        </header>

        <ProjectsListClient initialProjects={projects} />
      </div>
    </div>
  );
}
