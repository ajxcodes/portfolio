// It's good practice to have these types in a central place if they are used across the app.
export interface PersonalInfo {
  name: string;
  title: string;
  intro: string;
  photoUrlLight?: string;
  photoUrlDark?: string;
}

export interface ProfileLink {
  linkId?: string;
  type: string;
  url: string;
}

export interface ContactInfo {
  links: ProfileLink[];
}

export interface SkillGroup {
  category: string;
  iconName?: string;
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
  photoUrlLight?: string;
  photoUrlDark?: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  summary: string;
  content?: string;
}

export interface PortfolioData {
  personalInfo: PersonalInfo;
  resume: ResumeData;
  blogPosts: BlogPost[];
}

import { cache } from 'react';

// In-memory local default data used as a fallback if the API database is offline
const defaultData: PortfolioData = {
  personalInfo: {
    name: "Alvin Jorrel Pascual",
    title: ".NET Developer & DevOps Specialist",
    intro: "A .NET developer with over a decade's worth of experience and with strong DevOps skills as well. Passionate about building scalable applications and streamlining development pipelines.",
  },
  resume: {
    contact: {
      links: [
        { type: "email", url: "me@ajx.codes" },
        { type: "linkedin", url: "linkedin.com/in/alvinjorrel" },
        { type: "calendar", url: "https://calendar.app.google/waCKdLPyQZeYYUEx8" },
        { type: "github", url: "github.com/ajxcodes" }
      ]
    },
    summary: {
      lead: "A senior software engineer and technical leader with over a decade of experience in the .NET ecosystem.",
      highlights: [
        "Architected and led major backend modernizations, including microservice consolidation and identity provider migrations to enhance performance and reduce maintenance.",
        "Pioneered the integration of AI-powered tools (GitHub Copilot), cutting feature development cycles from weeks to days and elevating code quality.",
        "Championed a culture of quality by implementing comprehensive testing strategies and assuming formal code ownership of core APIs."
      ],
    },
    skills: [
      {
        category: "Languages & Frameworks",
        items: ["Test Skill"]
      }
    ],
    experience: [
      {
        company: "Fallback Company",
        role: "Software Engineer",
        period: "2020 - Present",
        results: ["Built fallback data"],
        skills: ["Test Skill"]
      }
    ],
    previousExperience: [],
    projects: [],
    education: [],
    downloadUrl: "",
  },
  blogPosts: [],
};

// Single, efficient data fetching function querying the API
// Fetch only active resume profile and skill categories (no blog posts)
export const getResumeData = cache(async (): Promise<{ personalInfo: PersonalInfo; resume: ResumeData }> => {
  const portfolioData: PortfolioData = JSON.parse(JSON.stringify(defaultData));
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5808';

  const [activeRes, skillsRes] = await Promise.all([
    fetch(`${apiUrl}/api/resume/active`, { cache: 'no-store' }).catch(() => null),
    fetch(`${apiUrl}/api/resume/skills`, { cache: 'no-store' }).catch(() => null)
  ]);

  // 1. Process active resume profile
  if (activeRes && activeRes.ok) {
    try {
      const active = await activeRes.json();
      
      portfolioData.personalInfo = {
        name: active.name || portfolioData.personalInfo.name,
        title: active.title || portfolioData.personalInfo.title,
        intro: active.intro || portfolioData.personalInfo.intro,
        photoUrlLight: active.photoUrlLight,
        photoUrlDark: active.photoUrlDark,
      };

      portfolioData.resume.photoUrlLight = active.photoUrlLight;
      portfolioData.resume.photoUrlDark = active.photoUrlDark;

      if (active.links && active.links.length > 0) {
        const contactLinks: ProfileLink[] = [];
        active.links.forEach((l: any) => {
          const key = l.linkType?.keyIdentifier || l.linkType?.name?.toLowerCase();
          if (key) {
            contactLinks.push({
              linkId: l.id,
              type: key,
              url: l.url
            });
          }
        });
        portfolioData.resume.contact = { links: contactLinks };
      } else {
        portfolioData.resume.contact = { links: [] };
      }

      portfolioData.resume.downloadUrl = `${apiUrl}/api/resume/active/download`;

      const workExperiences = active.workExperiences || [];
      const sortedExps = [...workExperiences].sort((a: any, b: any) => a.displayOrder - b.displayOrder);

      portfolioData.resume.experience = sortedExps
        .filter((we: any) => !we.isPrevious)
        .map((we: any) => ({
          company: we.company,
          role: we.role,
          period: we.period,
          results: we.highlights 
            ? [...we.highlights].sort((a: any, b: any) => a.displayOrder - b.displayOrder).map((h: any) => h.resultText)
            : [],
          skills: we.workExperienceSkills 
            ? we.workExperienceSkills.map((wes: any) => wes.skill?.skillName).filter(Boolean)
            : [],
        }));

      portfolioData.resume.previousExperience = sortedExps
        .filter((we: any) => we.isPrevious)
        .map((we: any) => ({
          role: we.role,
          company: we.company,
          location: we.location || "",
          period: we.period,
        }));
    } catch (e) {
      console.error("Failed to parse active resume response:", e);
    }
  }

  // 2. Process skill categories
  if (skillsRes && skillsRes.ok) {
    try {
      const dbCategories = await skillsRes.json();
      portfolioData.resume.skills = dbCategories ? dbCategories.map((c: any) => ({
        category: c.categoryName,
        iconName: c.iconName,
        items: c.skills 
          ? [...c.skills].sort((a: any, b: any) => a.displayOrder - b.displayOrder).map((s: any) => s.skillName)
          : [],
      })) : [];
    } catch (e) {
      console.error("Failed to parse skills response:", e);
    }
  }

  return {
    personalInfo: portfolioData.personalInfo,
    resume: portfolioData.resume
  };
});

// Fetch only blog posts
export const getBlogPosts = cache(async (): Promise<BlogPost[]> => {
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5808';
  try {
    const postsRes = await fetch(`${apiUrl}/api/blog/posts`, {
      cache: 'no-store',
    });

    if (postsRes.ok) {
      const dbPosts = await postsRes.json();
      return dbPosts ? dbPosts.map((p: any) => ({
        slug: p.slug,
        title: p.title,
        summary: p.summary || '',
        content: p.content,
      })) : [];
    }
  } catch (e) {
    console.error("Failed to fetch/parse blog posts response:", e);
  }
  return [];
});

// Aggregated call for pages needing both (e.g. Home page)
export async function getPortfolioData(): Promise<PortfolioData> {
  const [resumeData, blogPosts] = await Promise.all([
    getResumeData(),
    getBlogPosts()
  ]);

  return {
    personalInfo: resumeData.personalInfo,
    resume: resumeData.resume,
    blogPosts
  };
}

// Function to get a single blog post by its slug from the API
export async function getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5808';
    const res = await fetch(`${apiUrl}/api/blog/posts`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const posts = await res.json();
      const post = posts.find((p: any) => p.slug === slug);
      if (post) {
        return {
          slug: post.slug,
          title: post.title,
          summary: post.summary || '',
          content: post.content,
        };
      }
    }
    return undefined;
  } catch (err) {
    console.error('Failed to fetch blog post by slug from API', err);
    return undefined;
  }
}