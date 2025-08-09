import type { Metadata } from 'next';
import { ResumeClientPage } from '@/components/ResumeClientPage';
import { getPortfolioData } from '@/lib/data';

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
