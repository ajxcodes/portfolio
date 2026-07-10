"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, AlertCircle, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabaseBrowser";
import dynamic from 'next/dynamic';
import { AdminSkeleton } from "@/components/admin/AdminSkeleton";

const WysiwygEditor = dynamic(() => import('@/components/admin/WysiwygEditor'), {
  ssr: false,
  loading: () => <div className="min-h-[400px] w-full border border-primary/20 rounded-md bg-muted/20 animate-pulse flex items-center justify-center text-primary/40 text-sm">Loading Editor...</div>
});

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5808";

export default function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [visible, setVisible] = useState(true);
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [generatingMetadata, setGeneratingMetadata] = useState(false);

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const fetchAuthHeaders = async () => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    }
    return headers;
  };

  useEffect(() => {
    const loadPost = async () => {
      try {
        const headers = await fetchAuthHeaders();
        const res = await fetch(`${API_BASE_URL}/api/blog/posts/${id}`, { 
          headers,
          cache: "no-store"
        });
        if (!res.ok) throw new Error("Failed to load post data");
        
        const data = await res.json();
        setTitle(data.title || "");
        setSlug(data.slug || "");
        setSummary(data.summary || "");
        setContent(data.content || "");
        setVisible(data.visible ?? true);
        setCanonicalUrl(data.canonicalUrl || "");
        setTags(data.tags || []);
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to load post.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadPost();
    }
  }, [id]);

  const handleAutoFill = async () => {
    if (!title && !content) {
      setErrorMsg("Please enter at least a title or some content to generate metadata.");
      return;
    }

    setGeneratingMetadata(true);
    setErrorMsg("");
    try {
      const headers = await fetchAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/api/blog/posts/generate-metadata`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          title,
          content,
          slug: slug || null,
          summary: summary || null
        })
      });

      if (!res.ok) {
        throw new Error("Failed to generate metadata.");
      }

      const data = await res.json();
      if (data.slug) setSlug(data.slug);
      if (data.summary) setSummary(data.summary);
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred generating metadata.");
    } finally {
      setGeneratingMetadata(false);
    }
  };

  const handleSave = async () => {
    if (!title || !slug || !content) {
      setErrorMsg("Title, Slug, and Content are required.");
      return;
    }

    setSaveLoading(true);
    setErrorMsg("");
    try {
      const headers = await fetchAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/api/blog/posts/${id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          title,
          slug,
          summary,
          content,
          visible,
          canonicalUrl: canonicalUrl || null,
          tags
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Failed to update post.");
      }

      router.push("/admin/blog");
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred saving the post.");
      setSaveLoading(false);
    }
  };

  if (loading) {
    return <div className="max-w-5xl mx-auto"><AdminSkeleton /></div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 border-b border-primary/10 pb-4">
        <Link
          href="/admin/blog"
          className="p-2 border border-primary/20 hover:bg-primary/5 rounded-md transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-primary" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-primary font-mono">edit_post</h1>
          <p className="text-xs text-muted-foreground/80 mt-0.5">Editing: {title}</p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-md flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-primary/80 uppercase tracking-wider">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-background border border-primary/20 p-3 rounded text-sm focus:outline-none focus:border-primary/50 transition-colors"
              placeholder="Post Title..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-primary/80 uppercase tracking-wider">Content</label>
            <WysiwygEditor markdown={content} onChange={setContent} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="terminal-card p-5 rounded-xl border border-primary/10 space-y-5">
            <button
              type="button"
              onClick={handleAutoFill}
              disabled={generatingMetadata || (!!slug && !!summary)}
              className="w-full flex items-center justify-center gap-2 py-2 border border-primary/30 text-primary font-bold rounded hover:bg-primary/10 transition-all text-xs disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {generatingMetadata ? "Generating..." : "Auto-Fill Empty Fields"}
            </button>
            <div className="space-y-2">
              <label className="text-xs font-bold text-primary/80 uppercase tracking-wider">Slug</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                className="w-full bg-background border border-primary/20 p-2 rounded text-xs focus:outline-none focus:border-primary/50 transition-colors font-mono"
                placeholder="url-friendly-slug"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-primary/80 uppercase tracking-wider">Summary</label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="w-full bg-background border border-primary/20 p-2 rounded text-xs focus:outline-none focus:border-primary/50 transition-colors min-h-[100px] resize-y"
                placeholder="Brief summary of the post..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-primary/80 uppercase tracking-wider">Tags</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag) => (
                  <span key={tag} className="text-[10px] px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                    {tag}
                    <button type="button" onClick={() => handleRemoveTag(tag)} className="text-primary hover:text-destructive">
                      &times;
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                className="w-full bg-background border border-primary/20 p-2 rounded text-xs focus:outline-none focus:border-primary/50 transition-colors"
                placeholder="Add a tag and press Enter"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-primary/80 uppercase tracking-wider">Canonical URL</label>
              <input
                type="text"
                value={canonicalUrl}
                onChange={(e) => setCanonicalUrl(e.target.value)}
                className="w-full bg-background border border-primary/20 p-2 rounded text-xs focus:outline-none focus:border-primary/50 transition-colors"
                placeholder="https://example.com/original-post"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="visible"
                checked={visible}
                onChange={(e) => setVisible(e.target.checked)}
                className="w-4 h-4 accent-primary"
              />
              <label htmlFor="visible" className="text-sm text-foreground/90 font-medium">Published (Visible)</label>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saveLoading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground font-bold rounded hover:opacity-90 transition-all text-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saveLoading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
