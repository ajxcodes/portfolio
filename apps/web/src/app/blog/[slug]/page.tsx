import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getBlogPostBySlug } from '@/lib/data';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getBlogPostBySlug(params.slug);
  if (!post) return { title: 'Blog' };
  return { title: `${post.title} | Blog`, description: post.summary };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getBlogPostBySlug(params.slug);
  if (!post) return notFound();

  return (
    <article className="max-w-3xl mx-auto bg-card p-8 rounded-lg">
      <header>
        <h1 className="text-3xl font-bold">{post.title}</h1>
        <p className="text-sm text-foreground/70 mt-2">{post.summary}</p>
      </header>

      <section className="mt-6 text-lg whitespace-pre-wrap">
        {post.content ?? post.summary}
      </section>
    </article>
  );
}