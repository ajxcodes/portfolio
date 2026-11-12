"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseBrowser";
import {
  FileText,
  Plus,
  AlertCircle,
  EyeOff,
  Eye,
  Trash2,
  Edit
} from "lucide-react";
import { AdminSkeleton } from "@/components/admin/AdminSkeleton";

interface Project {
  id: string;
  slug: string;
  title: string;
  summary: string;
  visible: boolean;
  datePosted: string;
  tags?: string[];
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5808";

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

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
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/projects`, { cache: "no-store" });
        if (!res.ok) {
          throw new Error(`Failed to load projects (${res.status})`);
        }
        const data = await res.json();
        if (!cancelled) {
          setProjects(data);
          setErrorMsg("");
        }
      } catch (err: any) {
        if (!cancelled) setErrorMsg(err.message || "Failed to load projects from the API.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleDelete = async (id: string) => {
    setDeleteLoading(id);
    setErrorMsg("");

    const previous = [...projects];
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setProjectToDelete(null);

    try {
      const headers = await fetchAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
        method: "DELETE",
        headers,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `Failed to delete project (${res.status})`);
      }
    } catch (err: any) {
      setProjects(previous);
      setErrorMsg(err.message || "Failed to delete project.");
    } finally {
      setDeleteLoading(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-primary/10 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary font-mono">projects</h1>
          <p className="text-xs text-muted-foreground/85 mt-1">Manage your project showcase entries.</p>
        </div>
        <Link
          href="/admin/projects/create"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-bold rounded-md hover:opacity-90 transition-all text-xs"
        >
          <Plus className="w-4 h-4" />
          New Project
        </Link>
      </div>

      {errorMsg && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-md flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <AdminSkeleton />
      ) : projects.length === 0 ? (
        <div className="terminal-card rounded-xl p-12 text-center border-dashed">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-base font-bold text-foreground mb-1">No Projects Found</h3>
          <p className="text-muted-foreground/80 text-xs max-w-sm mx-auto mb-6">
            You do not have any projects yet. Create one to display on the projects page.
          </p>
          <Link
            href="/admin/projects/create"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-bold rounded-md text-xs"
          >
            Create First Project
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="terminal-card p-5 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-primary/10 hover:border-primary/30 transition-all duration-300"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1.5">
                  <h3 className="font-bold text-base text-foreground/90 leading-snug">
                    {project.title}
                  </h3>
                  {project.visible ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded">
                      <Eye className="w-3 h-3" />
                      Published
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-bold bg-primary/5 text-muted-foreground/80 border border-primary/10 px-2 py-0.5 rounded">
                      <EyeOff className="w-3 h-3" />
                      Draft
                    </span>
                  )}
                </div>
                <p className="text-xs font-mono text-primary/60 mb-2">/{project.slug}</p>
                <p className="text-xs text-muted-foreground/90 line-clamp-1 leading-relaxed">
                  {project.summary}
                </p>
                {project.tags && project.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {project.tags.map((tag) => (
                      <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t border-primary/10 sm:border-none justify-between sm:justify-end">
                <span className="text-[10px] text-muted-foreground/75 font-medium sm:hidden">
                  {new Date(project.datePosted).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/projects/${project.id}/edit`}
                    className="flex items-center gap-1 px-3 py-1.5 border border-primary/20 hover:bg-primary/5 text-xs font-bold rounded transition-all"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    Edit
                  </Link>
                  <button
                    type="button"
                    onClick={() => setProjectToDelete(project)}
                    disabled={deleteLoading === project.id}
                    className="flex items-center gap-1 px-3 py-1.5 border border-destructive/20 text-destructive hover:bg-destructive/10 text-xs font-bold rounded transition-all disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {deleteLoading === project.id ? "..." : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {projectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="terminal-card border border-destructive/20 bg-card w-full max-w-md p-6 rounded-xl shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-destructive" />
              <h2 className="text-lg font-bold text-foreground font-mono">delete_project</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Are you sure you want to delete <span className="text-foreground font-bold">"{projectToDelete.title}"</span>? This action is permanent and cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setProjectToDelete(null)}
                disabled={deleteLoading === projectToDelete.id}
                className="px-4 py-2 border border-primary/20 text-foreground/80 hover:bg-primary/10 hover:text-foreground text-sm font-bold rounded transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(projectToDelete.id)}
                disabled={deleteLoading === projectToDelete.id}
                className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-bold rounded transition-all disabled:opacity-50"
              >
                {deleteLoading === projectToDelete.id ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
