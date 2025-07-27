import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { promises as fs } from 'fs';
import path from 'path';
import type { Metadata } from 'next';

// Define types for our data for better type safety and autocompletion
interface SkillGroup {
  category: string;
  items: string[];
}

interface Experience {
  company: string;
  role: string;
  period: string;
  results: string[]; // The interface is correct, we just need to render it.
}

interface PreviousExperience {
  role: string;
  company: string;
  location: string;
  period: string;
}

// SVG Icon Components
const MailIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
);

const LinkedInIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect width="4" height="12" x="2" y="9" /><circle cx="4" cy="4" r="2" /></svg>
);

const GitHubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" /><path d="M9 18c-4.51 2-5-2-7-2" /></svg>
);

const DownloadIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
);

// Single, efficient data fetching function
async function getPortfolioData() {
  const file = await fs.readFile(path.join(process.cwd(), 'data/portfolio-data.json'), 'utf8');
  return JSON.parse(file);
}

// Generate dynamic metadata for the page
export async function generateMetadata(): Promise<Metadata> {
  const { personalInfo } = await getPortfolioData();
  return {
    title: `Resume | ${personalInfo.name}`,
    description: `The professional resume of ${personalInfo.name}, ${personalInfo.title}.`,
  };
}

export default async function ResumePage() {
  const { resume, personalInfo } = await getPortfolioData();

  return (
    <div className="max-w-4xl mx-auto bg-card p-8 rounded-lg shadow-lg">
      {/* Header Section */}
        <div className="flex flex-col items-center text-center">
            <div className="mb-10">
              <Avatar size={240} altText={personalInfo.name} />
            </div>
        </div>
      <div className="text-center border-b border-primary/20 pb-6 mb-6">
        <div className="flex justify-center items-center gap-4 mb-4">
          <h1 id="page-title" className="text-4xl font-bold text-primary">{personalInfo.name}</h1>
          <Link
            href="/ajxcodes-AlvinJorrelPascual-Resume.pdf"
            download="AlvinJorrelPascual-Resume.pdf"
            className="p-2 rounded-full hover:bg-primary/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Download Resume"
            title="Download Resume"
          >
            <DownloadIcon className="h-6 w-6 text-primary" />
          </Link>
        </div>
        <div className="flex justify-center items-center gap-x-6 gap-y-2 flex-wrap text-lg">
          <a href={`mailto:${resume.contact.email}`} className="flex items-center gap-2 hover:text-primary transition-colors">
            <MailIcon className="h-5 w-5" />
            <span>{resume.contact.email}</span>
          </a>
          <a href={`https://${resume.contact.linkedin}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-primary transition-colors">
            <LinkedInIcon className="h-5 w-5" />
            <span>{resume.contact.linkedin.replace('linkedin.com/in/', '')}</span>
          </a>
          <a href={`https://${resume.contact.github}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-primary transition-colors">
            <GitHubIcon className="h-5 w-5" />
            <span>{resume.contact.github.replace('github.com/', '')}</span>
          </a>
        </div>
      </div>

      {/* Summary Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-primary border-b-2 border-primary/50 pb-2 mb-4">Summary</h2>
        <p className="text-lg text-balance whitespace-pre-wrap">{resume.summary}</p>
      </section>

      {/* Grouped Skills Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-primary border-b-2 border-primary/50 pb-2 mb-4">Skills</h2>
        <div className="space-y-4">
          {resume.skills.map((skillGroup: SkillGroup) => (
            <div key={skillGroup.category}>
              <h3 className="text-lg font-semibold text-primary/90 mb-2">{skillGroup.category}</h3>
              <div className="flex flex-wrap gap-2">
                {skillGroup.items.map((skill: string) => (
                  <span key={skill} className="bg-primary/10 text-primary text-sm font-medium px-3 py-1 rounded-full">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Experience Section (Timeline Style) */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-primary border-b-2 border-primary/50 pb-2 mb-4">Professional Experience</h2>
        <div className="relative border-l-2 border-primary/20 pl-8 space-y-10">
          {resume.experience.map((exp: Experience) => (
            <div key={`${exp.company}-${exp.role}`} className="relative">
              <div className="absolute -left-[41px] top-1.5 w-4 h-4 bg-primary rounded-full border-4 border-card"></div>
              <div>
                <h3 className="text-xl font-bold">{exp.role}</h3>
                <p className="font-semibold text-primary/80">{exp.company}</p>
                <p className="text-sm text-foreground/70 mb-2">{exp.period}</p>
                <ul className="mt-2 list-disc list-inside space-y-2">
                  {exp.results.map((result, index) => (
                    <li key={index} className="text-balance">
                      {result}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Previous Experience Section */}
      {resume.previousExperience && resume.previousExperience.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-primary border-b-2 border-primary/50 pb-2 mb-4">Previous Experience</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {resume.previousExperience.map((exp: PreviousExperience) => (
              <div key={`${exp.company}-${exp.role}`}>
                <h3 className="font-bold">{exp.role}</h3>
                <p className="text-sm text-foreground/80">{exp.company} - {exp.location}</p>
                <p className="text-xs text-foreground/60">{exp.period}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
