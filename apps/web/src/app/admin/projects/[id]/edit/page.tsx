"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, AlertCircle, Plus, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseBrowser";
import dynamic from "next/dynamic";
import { AdminSkeleton } from "@/components/admin/AdminSkeleton";

const WysiwygEditor = dynamic(() => import("@/components/admin/WysiwygEditor"), {
  ssr: false,
  loading: () => <div className="min-h-[400px] w-full border border-primary/20 rounded-md bg-muted/20 animate-pulse flex items-center justify-center text-primary/40 text-sm">Loading Editor...</div>
});

interface ResumeProfileInfo { id: string; name: string; isActive: boolean; }
interface ProjectLinkInput { type: string; url: string; label: string; }

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5808";

export default function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
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
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [links, setLinks] = useState<ProjectLinkInput[]>([]);
  const [resumeProfiles, setResumeProfiles] = useState<ResumeProfileInfo[]>([]);
  const [resumeProfileId, setResumeProfileId] = useState("");
  const [profilesLoading, setProfilesLoading] = useState(true);

  const fetchAuthHeaders = async () => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;
    return headers;
  };

  useEffect(() => {
    async function loadProfiles() {
      try {
        const headers = await fetchAuthHeaders();
        const res = await fetch(`${API_BASE_URL}/api/resume`, { headers });
        if (res.ok) setResumeProfiles(await res.json());
      } catch (e) {
        console.error("Failed to load resume profiles", e);
      } finally {
        setProfilesLoading(false);
      }
    }
    loadProfiles();
  }, []);

  useEffect(() => {
    const loadProject = async () => {
      try {
        const headers = await fetchAuthHeaders();
        const res = await fetch(`${API_BASE_URL}/api/projects/${id}`, { headers, cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load project data");
        const data = await res.json();
        setTitle(data.title || "");
        setSlug(data.slug || "");
        setSummary(data.summary || "");
        setContent(data.content || "");
        setVisible(data.visible ?? true);
        setResumeProfileId(data.resumeProfileId || "");
        setTags(data.tags || []);
        setLinks((data.projectLinks || []).map((l: any) => ({ type: l.type || "homepage", url: l.url || "", label: l.label || "" })));
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to load project.");
      } finally {
        setLoading(false);
      }
    };
    if (id) loadProject();
  }, [id]);

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (newTag && !tags.includes(newTag)) setTags([...tags, newTag]);
      setTagInput("");
    }
  };

  const addLink = () => setLinks([...links, { type: "homepage", url: "", label: "" }]);
  const updateLink = (i: number, patch: Partial<ProjectLinkInput>) => {
    setLinks(links.map((l, idx) => idx === i ? { ...l, ...patch } : l));
  };
  const removeLink = (i: number) => setLinks(links.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    if (!title || !slug || !content || !resumeProfileId) {
      setErrorMsg("Title, Slug, Content, and Persona are required.");
      return;
    }
    setSaveLoading(true);
    setErrorMsg("");
    try {
      const headers = await fetchAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          title,
          slug,
          summary,
          content,
          visible,
          canonicalUrl: null,
          resumeProfileId,
          tags,
          projectLinks: links.filter(l => l.url.trim()).map(l => ({ type: l.type, url: l.url, label: l.label || null }))
        }),
      });
      if (!res.ok) throw new Error(await res.text() || "Failed to update project.");
      router.push("/admin/projects");
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred saving the project.");
      setSaveLoading(false);
    }
  };

  if (loading) {
    return <div className="max-w-5xl mx-auto"><AdminSkeleton /></div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 border-b border-primary/10 pb-4">
        <Link href="/admin/projects" className="p-2 border border-primary/20 hover:bg-primary/5 rounded-md transition-colors">
          <ArrowLeft className="w-4 h-4 text-primary" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-primary font-mono">edit_project</h1>
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
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Project Title..." className="w-full bg-background border border-primary/20 p-3 rounded text-sm focus:outline-none focus:border-primary/50 transition-colors" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-primary/80 uppercase tracking-wider">README / Content</label>
            <WysiwygEditor markdown={content} onChange={setContent} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="terminal-card p-5 rounded-xl border border-primary/10 space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-primary/80 uppercase tracking-wider">Author Persona</label>
              {profilesLoading ? (
                <div className="w-full bg-muted/20 animate-pulse border border-primary/10 p-2 rounded h-9"></div>
              ) : (
                <select value={resumeProfileId} onChange={(e) => setResumeProfileId(e.target.value)} className="w-full bg-background border border-primary/20 p-2 rounded text-xs focus:outline-none focus:border-primary/50 transition-colors">
                  {resumeProfiles.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} {p.isActive ? "(Active)" : ""}</option>
                  ))}
                </select>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-primary/80 uppercase tracking-wider">Slug</label>
              <input type="text" value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} className="w-full bg-background border border-primary/20 p-2 rounded text-xs focus:outline-none focus:border-primary/50 transition-colors font-mono" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-primary/80 uppercase tracking-wider">Summary</label>
              <textarea value={summary} onChange={(e) => setSummary(e.target.value)} className="w-full bg-background border border-primary/20 p-2 rounded text-xs focus:outline-none focus:border-primary/50 transition-colors min-h-[80px] resize-y" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-primary/80 uppercase tracking-wider">Tags</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag) => (
                  <span key={tag} className="text-[10px] px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                    {tag}
                    <button type="button" onClick={() => setTags(tags.filter(t => t !== tag))} className="text-primary hover:text-destructive">&times;</button>
                  </span>
                ))}
              </div>
              <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleAddTag} className="w-full bg-background border border-primary/20 p-2 rounded text-xs focus:outline-none focus:border-primary/50 transition-colors" placeholder="Add a tag and press Enter" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-primary/80 uppercase tracking-wider">Project Links</label>
                <button type="button" onClick={addLink} className="text-[10px] flex items-center gap-1 text-primary hover:underline"><Plus className="w-3 h-3" />Add</button>
              </div>
              <div className="space-y-2">
                {links.map((link, i) => (
                  <div key={i} className="border border-primary/10 rounded p-2 space-y-1.5">
                    <div className="flex gap-2">
                      <select value={link.type} onChange={(e) => updateLink(i, { type: e.target.value })} className="bg-background border border-primary/20 p-1.5 rounded text-xs">
                        <option value="homepage">homepage</option>
                        <option value="github">github</option>
                        <option value="store">store</option>
                        <option value="docs">docs</option>
                        <option value="other">other</option>
                      </select>
                      <input type="text" value={link.label} onChange={(e) => updateLink(i, { label: e.target.value })} className="flex-1 bg-background border border-primary/20 p-1.5 rounded text-xs" placeholder="Label (optional)" />
                      <button type="button" onClick={() => removeLink(i)} className="text-destructive p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                    <input type="text" value={link.url} onChange={(e) => updateLink(i, { url: e.target.value })} className="w-full bg-background border border-primary/20 p-1.5 rounded text-xs" placeholder="https://..." />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input type="checkbox" id="visible" checked={visible} onChange={(e) => setVisible(e.target.checked)} className="w-4 h-4 accent-primary" />
              <label htmlFor="visible" className="text-sm text-foreground/90 font-medium">Published (Visible)</label>
            </div>
          </div>

          <button onClick={handleSave} disabled={saveLoading || !resumeProfileId} className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground font-bold rounded hover:opacity-90 transition-all text-sm disabled:opacity-50">
            {saveLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saveLoading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
