import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { promises as fs } from 'fs';
import path from 'path';
import type { Metadata } from 'next';
import {
  DownloadIcon,
} from '@/components/icons';
import { ContactLinks } from '@/components/ContactLinks';

// Define types for our data for better type safety and autocompletion
interface SkillGroup {
  category: string;
  items: string[];
}

interface Experience {
  company: string;
  role: string;
  period: string;
  results: string[];
}

interface PreviousExperience {
  role: string;
  company: string;
  location: string;
  period: string;
}

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
        <div id="contact-links-section">
          <ContactLinks contact={resume.contact} />
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
