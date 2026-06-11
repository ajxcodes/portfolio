"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseBrowser";
import { 
  UserSquare, 
  Plus, 
  CheckCircle2, 
  AlertCircle
} from "lucide-react";
import { AdminSkeleton } from "@/components/admin/AdminSkeleton";

interface Profile {
  id: string;
  name: string;
  title: string;
  intro: string;
  isActive: boolean;
  updatedAt: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5808";

export default function ResumeProfilesPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchAuthHeaders = async () => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (process.env.NEXT_PUBLIC_LOCAL_DEV_BYPASS_AUTH !== "true") {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }
    }
    return headers;
  };

  const loadProfiles = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const headers = await fetchAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/api/resume`, { headers });
      if (!res.ok) {
        throw new Error(`Failed to load profiles (${res.status})`);
      }
      const data = await res.json();
      setProfiles(data);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load profiles from the API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleActivate = async (id: string) => {
    setActionLoading(id);
    setErrorMsg("");
    try {
      const headers = await fetchAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/api/resume/${id}/activate`, {
        method: "POST",
        headers,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `Failed to activate profile (${res.status})`);
      }

      await loadProfiles();
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to activate resume profile.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-primary/10 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary font-mono">resume_profiles</h1>
          <p className="text-xs text-muted-foreground/85 mt-1">Manage multiple versions of your resume and toggle the active profile.</p>
        </div>
        <Link
          href="/admin/resume/form"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-bold rounded-md hover:opacity-90 transition-all text-xs"
        >
          <Plus className="w-4 h-4" />
          New Profile
        </Link>
      </div>

      {errorMsg && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-md flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Profiles Grid */}
      {loading ? (
        <AdminSkeleton />
      ) : profiles.length === 0 ? (
        <div className="terminal-card rounded-xl p-12 text-center border-dashed">
          <UserSquare className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-base font-bold text-foreground mb-1">No Profiles Configured</h3>
          <p className="text-muted-foreground/80 text-xs max-w-sm mx-auto mb-6">
            You do not have any resume profiles in the database. Create a new one to display on the resume page.
          </p>
          <Link
            href="/admin/resume/form"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-bold rounded-md text-xs"
          >
            Create First Profile
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {profiles.map((profile) => (
            <div
              key={profile.id}
              className={`terminal-card p-6 rounded-xl flex flex-col justify-between transition-all duration-300 ${
                profile.isActive
                  ? "border-primary ring-1 ring-primary/30"
                  : "border-primary/10 hover:border-primary/20"
              }`}
            >
              <div>
                <div className="flex justify-between items-start gap-4 mb-3">
                  <h3 className="font-bold text-lg text-foreground/90 leading-snug">
                    {profile.name}
                  </h3>
                  {profile.isActive ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Active Live
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold bg-primary/5 text-muted-foreground/80 border border-primary/10 px-2 py-0.5 rounded">
                      Draft
                    </span>
                  )}
                </div>
                <p className="text-xs font-bold text-primary/80 mb-2">{profile.title}</p>
                <p className="text-xs text-muted-foreground/90 line-clamp-2 leading-relaxed">
                  {profile.intro}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-primary/5 flex items-center justify-between gap-4">
                <span className="text-[10px] text-muted-foreground/75 font-medium">
                  Updated: {new Date(profile.updatedAt).toLocaleDateString()}
                </span>
                
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/resume/form?id=${profile.id}`}
                    className="px-3 py-1 border border-primary/20 hover:bg-primary/5 text-[10px] font-bold rounded transition-all"
                  >
                    Edit
                  </Link>

                  {!profile.isActive && (
                    <button
                      onClick={() => handleActivate(profile.id)}
                      disabled={actionLoading !== null}
                      className="px-3 py-1 bg-primary text-primary-foreground text-[10px] font-bold rounded transition-all disabled:opacity-50"
                    >
                      {actionLoading === profile.id ? "Activating..." : "Activate"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
