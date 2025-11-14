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
  content?: string; // Add content field for the full blog post
}

export interface PortfolioData {
  personalInfo: PersonalInfo;
  resume: ResumeData;
  blogPosts: BlogPost[];
}

// Single, efficient data fetching function
export async function getPortfolioData(): Promise<PortfolioData> {
  // 1. Read the base portfolio data from the local JSON file.
  const file = await fs.readFile(path.join(process.cwd(), 'public', 'data', 'portfolio-data.json'), 'utf8');
  const portfolioData: PortfolioData = JSON.parse(file);

  // 2. Fetch the latest blog posts dynamically from the API.
  try {
    const apiUrl = process.env.API_BASE_URL || 'http://localhost:5808';
    const res = await fetch(`${apiUrl}/api/blog/posts`, {
      // 'no-store' ensures the data is fetched on every request.
      cache: 'no-store',
    });

    if (res.ok) {
      const dynamicBlogPosts: BlogPost[] = await res.json();
      // 3. Replace the static blog posts with the dynamic ones.
      portfolioData.blogPosts = dynamicBlogPosts;
    }
  } catch (error) {
    console.error("Failed to fetch dynamic blog posts, falling back to static data:", error);
    // If the API call fails, it will gracefully fall back to using the static blog posts from the JSON file.
  }

  // 4. Return the combined data.
  return portfolioData;
}

// New function to get a single blog post by its slug
export async function getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
  try {
    // Fetch the specific blog post directly from the API.
    // This assumes your API supports an endpoint like /api/blog/posts/{slug}
    const apiUrl = process.env.API_BASE_URL || 'http://localhost:5808';
    const res = await fetch(`${apiUrl}/api/blog/posts/${slug}`, { cache: 'no-store' });

    if (!res.ok) return undefined;
    return res.json();
  } catch (error) {
    console.error(`Failed to fetch blog post with slug "${slug}":`, error);
    return undefined;
  }
}
