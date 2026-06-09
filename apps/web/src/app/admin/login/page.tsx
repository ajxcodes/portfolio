"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseBrowser";

function LoginContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");



  useEffect(() => {
    // Check if error parameter exists in URL
    const errParam = searchParams.get("error");
    if (errParam === "Unauthorized") {
      setErrorMsg("Your email is not authorized to access this administration panel.");
    }
  }, [searchParams]);

  const handleOAuth = async (provider: "github" | "google") => {
    setLoading(true);
    setErrorMsg("");
    setInfoMsg("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/admin/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to initiate OAuth login.");
      setLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setErrorMsg("");
    setInfoMsg("");
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/admin/auth/callback`,
        },
      });
      if (error) throw error;
      setInfoMsg("A magic login link has been sent to your email address!");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to send magic link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center font-mono">
      <div className="w-full max-w-md terminal-card p-8 rounded-xl relative overflow-hidden pt-14">
        {/* Terminal Title Bar */}
        <div className="absolute top-0 left-0 right-0 bg-primary/5 border-b border-primary/20 px-4 py-2.5 flex items-center gap-1.5 select-none">
          <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
          <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
          <span className="text-xs font-mono text-primary/60 ml-2">bash - admin_login.sh</span>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary mb-2">admin_portal</h1>
          <p className="text-xs text-muted-foreground/80">Sign in to manage your portfolio</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-md">
            {errorMsg}
          </div>
        )}

        {infoMsg && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs rounded-md">
            {infoMsg}
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={() => handleOAuth("github")}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-foreground text-background hover:opacity-90 font-bold rounded-md transition-all duration-300 disabled:opacity-50 text-sm"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            Continue with GitHub
          </button>
        </div>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-primary/10"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-3 text-muted-foreground">Or passwordless mail</span>
          </div>
        </div>

        <form onSubmit={handleMagicLink} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-[10px] font-bold uppercase tracking-wider mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="w-full px-4 py-3 bg-primary/5 border border-primary/20 rounded-md focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all text-xs"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !email}
            className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-md transition-all duration-300 hover:opacity-90 disabled:opacity-50 text-sm"
          >
            {loading ? "Sending..." : "Send Magic Link"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center">Loading login parameters...</div>}>
      <LoginContent />
    </Suspense>
  );
}
