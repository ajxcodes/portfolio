"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, Github, Store, Globe } from "lucide-react";
import type { ProjectShowcase } from "@/lib/data";

function linkIcon(type: string) {
  const t = type.toLowerCase();
  if (t.includes("github")) return <Github className="w-3.5 h-3.5" />;
  if (t.includes("store")) return <Store className="w-3.5 h-3.5" />;
  if (t.includes("home")) return <Globe className="w-3.5 h-3.5" />;
  return <ExternalLink className="w-3.5 h-3.5" />;
}

export function ProjectsListClient({ initialProjects }: { initialProjects: ProjectShowcase[] }) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    initialProjects.forEach((p) => (p.tags || []).forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  }, [initialProjects]);

  const filteredProjects = useMemo(() => {
    if (!selectedTag) return initialProjects;
    return initialProjects.filter((p) => (p.tags || []).includes(selectedTag));
  }, [initialProjects, selectedTag]);

  if (initialProjects.length === 0) {
    return (
      <div className="terminal-card rounded-xl p-10 text-center border-dashed">
        <p className="text-sm text-muted-foreground">No projects published yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2" aria-label="Project tag filters">
          <button
            type="button"
            onClick={() => setSelectedTag(null)}
            className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${selectedTag === null ? "bg-primary text-primary-foreground border-primary" : "bg-primary/10 text-primary border-primary/20 hover:border-primary/40"}`}
          >
            all
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setSelectedTag(tag)}
              className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${selectedTag === tag ? "bg-primary text-primary-foreground border-primary" : "bg-primary/10 text-primary border-primary/20 hover:border-primary/40"}`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {filteredProjects.map((project) => (
        <article
          key={project.id}
          className="terminal-card p-5 rounded-xl border border-primary/10 hover:border-primary/30 transition-all duration-300"
        >
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-lg font-bold text-foreground/90 mb-1">
                <Link href={`/projects/${project.id}`} className="hover:text-primary transition-colors">
                  {project.title}
                </Link>
              </h2>
              {project.summary && (
                <p className="text-xs text-muted-foreground/90 leading-relaxed mb-3">
                  {project.summary}
                </p>
              )}
              {project.tags && project.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20"
                    >
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
                      className="inline-flex items-center gap-1.5 text-[11px] text-primary/80 hover:text-primary underline-offset-2 hover:underline"
                    >
                      {linkIcon(link.type)}
                      <span>{link.label || link.type}</span>
                      <span className="text-muted-foreground/60 truncate max-w-[220px]">{link.url}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
            <div className="text-[10px] text-muted-foreground/70 font-mono sm:text-right whitespace-nowrap">
              {new Date(project.datePosted).toLocaleDateString()}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
