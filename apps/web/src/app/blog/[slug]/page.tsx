import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getBlogPostBySlug } from '@/lib/data';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) return { title: 'Blog' };
  return { title: `${post.title} | Blog`, description: post.summary };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) return notFound();

  return (
    <article className="max-w-3xl mx-auto terminal-card p-8 md:p-12 rounded-xl shadow-xl relative overflow-hidden pt-14">
      {/* Terminal Title Bar */}
      <div className="absolute top-0 left-0 right-0 bg-primary/5 border-b border-primary/20 px-4 py-2.5 flex items-center gap-1.5 select-none">
        <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
        <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
        <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
        <span className="text-xs font-mono text-primary/60 ml-2">bash - blog_reader.sh</span>
      </div>

      <header>
        <h1 className="text-3xl font-bold font-mono text-primary flex items-center gap-2">
          <span className="text-primary/60 font-light select-none">&gt;_</span>
          {post.title}
        </h1>
        <p className="text-xs font-mono text-primary/80 mt-4 bg-primary/5 px-3 py-1.5 rounded border border-primary/20 inline-block">{post.summary}</p>
      </header>

      <section className="mt-8 prose prose-sm sm:prose-base dark:prose-invert max-w-none prose-a:text-primary">
        <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
          {post.content ?? post.summary ?? ''}
        </ReactMarkdown>
      </section>
    </article>
  );
}