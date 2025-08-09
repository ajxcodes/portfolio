import { Project } from "@/lib/data";
import { LinkIcon } from "./icons";

interface ProjectCardProps {
  project: Project;
}

export const ProjectCard = ({ project }: ProjectCardProps) => {
  return (
    <div className="bg-card/50 p-6 rounded-lg border border-border/10 transition-all hover:shadow-lg hover:border-border/30 flex flex-col h-full">
      <div className="flex-grow">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-bold text-primary/90">{project.name}</h3>
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
        <p className="mt-2 text-sm text-foreground/80 text-balance">{project.description}</p>
      </div>
      <div className="mt-4 pt-4 border-t border-border/10">
        <div className="flex flex-wrap gap-2">
          {project.tags.map(tag => (
            <span
              key={tag}
              className="inline-block px-2.5 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary/80"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};