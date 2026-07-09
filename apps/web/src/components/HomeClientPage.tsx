'use client';

import Link from 'next/link';
import { Avatar } from '@/components/Avatar';
import { TerminalShell } from '@/components/TerminalShell';
import type { PersonalInfo, BlogPost, ResumeData } from '@/lib/data';

interface HomeClientPageProps {
  personalInfo: PersonalInfo;
  blogPosts: BlogPost[];
  resume: ResumeData;
}

export function HomeClientPage({ personalInfo, blogPosts, resume }: HomeClientPageProps) {
  return (
    <div className="max-w-6xl mx-auto flex flex-col items-center mt-4 px-4">
      {/* Bio Terminal Console Card */}
      <div className="w-full terminal-card p-8 md:p-12 rounded-xl shadow-xl flex flex-col items-center text-center mb-8 relative overflow-hidden pt-14">
        {/* Terminal Title Bar */}
        <div className="absolute top-0 left-0 right-0 bg-primary/5 border-b border-primary/20 px-4 py-2.5 flex items-center gap-1.5 select-none">
          <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
          <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
          <span className="text-xs font-mono text-primary/60 ml-2">bash - portfolio.sh</span>
        </div>

        <div className="mb-6 md:mb-8 mt-2 w-[140px] h-[140px] md:w-[200px] md:h-[200px] [&_img]:!w-full [&_img]:!h-full [&_div]:!w-full [&_div]:!h-full">
          <Avatar 
            size={200} 
            altText={personalInfo.name} 
            photoUrlLight={personalInfo.photoUrlLight}
            photoUrlDark={personalInfo.photoUrlDark}
          />
        </div>
        <h1 id="page-title" className="text-4xl md:text-5xl font-bold font-mono text-primary flex items-center justify-center gap-2 mb-2">
          {personalInfo.name}
        </h1>
        <h2 className="text-sm md:text-base font-mono text-primary/80 mb-6 bg-primary/5 px-3 py-1 rounded border border-primary/20 inline-block">
          {personalInfo.title}
        </h2>
        <p className="max-w-2xl text-base md:text-lg opacity-90 leading-relaxed font-mono">
          <span className="text-primary/40 select-none">"</span>
          {personalInfo.intro}
          <span className="text-primary/40 select-none">"</span>
        </p>
      </div>

      {/* Two Column Layout: Console Shell + Latest Posts */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        
        {/* Left Column (2/3 width on desktop): Interactive Shell */}
        <div className="lg:col-span-2">
          <TerminalShell blogPosts={blogPosts} resume={resume} />
        </div>

        {/* Right Column (1/3 width on desktop): Latest Posts */}
        <div className="lg:col-span-1">
          {blogPosts && blogPosts.length > 0 && (
            <div className="w-full flex flex-col h-full justify-between">
              <div>
                <h3 className="text-xl font-bold font-mono text-primary flex items-center justify-start gap-2 mb-6">
                  latest_posts.sh
                </h3>
                <div className="space-y-4">
                  {blogPosts.slice(0, 3).map((post: BlogPost) => (
                    <Link 
                      key={post.slug} 
                      href={`/blog/${post.slug}`} 
                      className="block p-4 terminal-card rounded-md hover:border-primary/45 transition-all duration-300 hover:-translate-y-0.5 group shadow-md"
                    >
                      <h4 className="text-base font-bold font-mono mb-2 text-primary group-hover:text-primary/95 transition-colors">
                        {post.title}
                      </h4>
                      <p className="opacity-80 text-xs leading-relaxed line-clamp-2">{post.summary}</p>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="flex justify-start mt-6">
                <Link
                  href="/blog"
                  className="px-3 py-1.5 border border-primary/20 hover:border-primary/40 rounded bg-primary/5 hover:bg-primary/10 text-primary font-bold font-mono text-xs transition-all duration-200"
                >
                  view_all_posts.sh
                </Link>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}