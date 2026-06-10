import type { Metadata } from 'next';
import Link from 'next/link';
import { getBlogPosts } from '@/lib/data';

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

        {blogPosts && blogPosts.length > 0 ? (
          <div className="space-y-6">
            {blogPosts.map((post) => (
              <article key={post.slug} className="border border-primary/10 hover:border-primary/30 bg-primary/5/10 p-6 rounded-md transition-all duration-300">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-3">
                  <h2 className="text-lg font-bold text-primary hover:underline">
                    <Link href={`/blog/${post.slug}`} className="flex items-center gap-1.5">
                      <span className="text-primary/60 text-sm select-none">&gt;_</span>
                      {post.title}
                    </Link>
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed mb-4">
                  {post.summary}
                </p>
                <div className="flex justify-end">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="px-3 py-1.5 text-xs font-bold border border-primary/20 hover:border-primary/40 rounded bg-primary/5 hover:bg-primary/10 text-primary transition-all duration-200"
                  >
                    read_post.exe
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed border-primary/10 rounded-md">
            <p className="text-sm text-muted-foreground">No blog posts found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
