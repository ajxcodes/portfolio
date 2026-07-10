"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { BlogPost } from "@/lib/data";
import { Eye } from "lucide-react";

interface BlogListClientProps {
  initialPosts: BlogPost[];
}

export function BlogListClient({ initialPosts }: BlogListClientProps) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    initialPosts.forEach(post => {
      post.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [initialPosts]);

  const filteredPosts = useMemo(() => {
    if (!selectedTag) return initialPosts;
    return initialPosts.filter(post => post.tags?.includes(selectedTag));
  }, [initialPosts, selectedTag]);

  return (
    <>
      {allTags.length > 0 && (
        <div className="mb-8 pb-6 border-b border-primary/10">
          <p className="text-xs font-bold text-primary/60 uppercase tracking-wider mb-3">Filter by Topic</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedTag(null)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                selectedTag === null 
                  ? "bg-primary text-primary-foreground border-primary font-bold" 
                  : "bg-primary/5 text-primary/80 border-primary/20 hover:bg-primary/10"
              }`}
            >
              All
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                  selectedTag === tag 
                    ? "bg-primary text-primary-foreground border-primary font-bold" 
                    : "bg-primary/5 text-primary/80 border-primary/20 hover:bg-primary/10"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {filteredPosts && filteredPosts.length > 0 ? (
        <div className="space-y-6">
          {filteredPosts.map((post) => (
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
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex flex-wrap gap-2">
                  {post.tags?.map(tag => (
                    <button 
                      key={tag}
                      onClick={() => setSelectedTag(tag)}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  {post.views !== undefined && post.views >= 0 && (
                    <span className="text-[11px] font-mono text-muted-foreground/60 flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {post.views} views
                    </span>
                  )}
                  <Link
                    href={`/blog/${post.slug}`}
                    className="px-3 py-1.5 text-xs font-bold border border-primary/20 hover:border-primary/40 rounded bg-primary/5 hover:bg-primary/10 text-primary transition-all duration-200 ml-auto"
                  >
                    read_post.exe
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border border-dashed border-primary/10 rounded-md">
          <p className="text-sm text-muted-foreground">No blog posts found matching the selected tag.</p>
        </div>
      )}
    </>
  );
}
