import { HomeClientPage } from '@/components/HomeClientPage';
import { getPortfolioData } from '@/lib/data';

export default async function Home() {
  // getPortfolioData now fetches both static and dynamic data.
  const { personalInfo, blogPosts, resume } = await getPortfolioData();
  
  return (
    <HomeClientPage 
      personalInfo={personalInfo} 
      blogPosts={blogPosts} 
      resume={resume} 
    />
  );
}