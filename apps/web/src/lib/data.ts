import { promises as fs } from 'fs';
import path from 'path';

// It's good practice to have these types in a central place if they are used across the app.
export interface PersonalInfo {
  name: string;
  title: string;
  intro: string;
}

export interface ContactInfo {
  email: string;
  phone: string;
  website: string;
  linkedin: string;
  calendar: string;
  github: string;
}

export interface SkillGroup {
  category: string;
  items: string[];
}

export interface Experience {
  company: string;
  role: string;
  period: string;
  results: string[];
  skills?: string[];
}

export interface PreviousExperience {
  role: string;
  company: string;
  location: string;
  period: string;
}

export interface Education {
  institution: string;
  degree: string;
  period: string;
}

export interface Project {
  name: string;
  description: string;
  tags: string[];
  url?: string;
}

export interface Summary {
  lead: string;
  highlights: string[];
}

export interface ResumeData {
  contact: ContactInfo;
  summary: Summary;
  skills: SkillGroup[];
  experience: Experience[];
  previousExperience: PreviousExperience[];
  projects?: Project[];
  education: Education[];
  downloadUrl: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  summary: string;
}

export interface PortfolioData {
  personalInfo: PersonalInfo;
  resume: ResumeData;
  blogPosts: BlogPost[];
}

// Single, efficient data fetching function
export async function getPortfolioData(): Promise<PortfolioData> {
  const file = await fs.readFile(path.join(process.cwd(), 'data/portfolio-data.json'), 'utf8');
  return JSON.parse(file);
}
