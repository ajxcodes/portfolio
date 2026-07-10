import type { Metadata } from 'next';
import Link from 'next/link';
import { getBlogPosts } from '@/lib/data';
import { BlogListClient } from './BlogListClient';

export const metadata: Metadata = {
  title: 'Blog | AJX Portfolio',
  description: 'Technical articles, developer logs, and projects by Alex Jones.',
};

export default async function BlogPage() {
  const blogPosts = await getBlogPosts();

  return (
    <div className="max-w-4xl mx-auto mt-4 font-mono">
      {/* Blog Terminal Console Card */}
      <div className="w-full terminal-card p-8 md:p-12 rounded-xl shadow-xl relative overflow-hidden pt-14 mb-12">
        {/* Terminal Title Bar */}
        <div className="absolute top-0 left-0 right-0 bg-primary/5 border-b border-primary/20 px-4 py-2.5 flex items-center gap-1.5 select-none">
          <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
          <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
          <span className="text-xs font-mono text-primary/60 ml-2">bash - blog_list.sh</span>
        </div>

        <header className="mb-10 text-center sm:text-left">
          <h1 className="text-3xl font-bold text-primary mb-3">developer_log</h1>
          <p className="text-xs text-muted-foreground/80">
            A collection of writing on software engineering, web development, and systems.
          </p>
        </header>

        <BlogListClient initialPosts={blogPosts} />
      </div>
    </div>
  );
}
