import { Project } from "@/lib/data";
import { LinkIcon } from "./icons";

interface ProjectCardProps {
  project: Project;
}

export const ProjectCard = ({ project }: ProjectCardProps) => {
  return (
    <div className="terminal-card p-6 rounded-xl flex flex-col h-full">
      <div className="flex-grow">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-bold font-mono text-primary">
            {project.name}
          </h3>
          {project.url && (
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground/60 hover:text-primary transition-colors"
              aria-label={`Link to project ${project.name}`}
            >
              <LinkIcon className="h-5 w-5" />
            </a>
          )}
        </div>
        <p className="mt-3 text-sm text-foreground/80 font-mono leading-relaxed">{project.description}</p>
      </div>
      <div className="mt-4 pt-4 border-t border-border/10">
        <div className="flex flex-wrap gap-2">
          {project.tags.map(tag => (
            <span
              key={tag}
              className="skill-btn select-none pointer-events-none text-[10px]"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};