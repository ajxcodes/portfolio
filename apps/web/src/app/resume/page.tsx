import { promises as fs } from 'fs';
import path from 'path';
import type { Metadata } from 'next';
import { DownloadIcon } from '@/components/icons';
import { ContactLinks } from '@/components/ContactLinks';
import { SkillsSection } from '@/components/SkillsSection';
import { ResumeClientPage } from '@/components/ResumeClientPage';

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
  
  return <ResumeClientPage resume={resume} personalInfo={personalInfo} />;
}
