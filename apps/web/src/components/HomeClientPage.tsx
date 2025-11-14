'use client';

import Link from 'next/link';
import { Avatar } from '@/components/Avatar';
import type { PersonalInfo, BlogPost } from '@/lib/data';
 
interface HomeClientPageProps {
  personalInfo: PersonalInfo;
  blogPosts: BlogPost[];
}

export function HomeClientPage({ personalInfo, blogPosts }: HomeClientPageProps) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-8">
        <Avatar size={240} altText={personalInfo.name} />
      </div>
      <h1 id="page-title" className="text-4xl font-bold mb-2">{personalInfo.name}</h1>
      <h2 className="text-2xl text-primary mb-4">{personalInfo.title}</h2>
      <p className="max-w-2xl mb-12 text-lg text-balance">{personalInfo.intro}</p>

      {blogPosts && blogPosts.length > 0 && (
        <div className="w-full max-w-3xl">
          <h3 className="text-3xl font-bold mb-6">Latest Posts</h3>
          <div className="space-y-4 text-left">
            {blogPosts.map((post: BlogPost) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="block p-6 bg-card rounded-lg hover:bg-primary hover:text-card-foreground transition-all duration-300 shadow-lg">
                <h4 className="text-xl font-bold mb-2">{post.title}</h4>
                <p className="opacity-80">{post.summary}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}