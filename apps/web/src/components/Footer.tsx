"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseBrowser";

export function Footer() {
  const [mounted, setMounted] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);

    if (process.env.NEXT_PUBLIC_LOCAL_DEV_BYPASS_AUTH === "true") {
      setUserEmail("local-admin@portfolio.local");
      return;
    }

    async function checkUser() {
      try {
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          setUserEmail(data.user.email || null);
        } else {
          setUserEmail(null);
        }
      } catch {
        // ignore
      }
    }
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      if (session?.user) {
        setUserEmail(session.user.email || null);
      } else {
        setUserEmail(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    if (process.env.NEXT_PUBLIC_LOCAL_DEV_BYPASS_AUTH === "true") {
      setUserEmail(null);
      router.push("/");
      return;
    }

    await supabase.auth.signOut();
    setUserEmail(null);
    router.push("/admin/login");
  };

  if (!mounted) {
    return null;
  }

  const isAdminPath = pathname?.startsWith("/admin");
  const isLoginPage = pathname === "/admin/login" || pathname === "/admin/auth/callback";

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 w-full bg-background/80 backdrop-blur-md border-t border-primary/20 py-2.5 text-[11px] text-muted-foreground/85 font-mono transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-3">
        {/* Left side: Status indicators & Copyright */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-primary/5 border border-primary/20 rounded text-[9px] font-bold">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            <span>github: operational</span>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-primary/5 border border-primary/20 rounded text-[9px] font-bold">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            <span>render: operational</span>
          </div>

          <span>&copy; {new Date().getFullYear()} ajxcodes</span>
        </div>

        {/* Right side: Admin details or Subtle lock link */}
        <div className="flex items-center gap-4">
          {isAdminPath && !isLoginPage && userEmail ? (
            <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-end">
              <div className="flex items-center gap-1.5 border-r border-primary/20 pr-3">
                <span className="w-4 h-4 rounded border border-primary/20 bg-primary/10 text-primary flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                </span>
                <span className="text-[10px] font-bold text-foreground/80 truncate max-w-[120px] sm:max-w-[180px]">
                  {userEmail}
                </span>
              </div>

              <Link
                href="/"
                className="text-[10px] font-bold text-muted-foreground hover:text-primary transition-all flex items-center gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                Live Site
              </Link>

              <button
                onClick={handleSignOut}
                className="text-[10px] font-bold text-destructive hover:text-destructive/80 transition-all flex items-center gap-1 cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                Sign Out
              </button>
            </div>
          ) : (
            !isAdminPath && (
              <Link
                href="/admin"
                aria-label="Admin Dashboard"
                className="p-1 text-primary/40 hover:text-primary hover:bg-primary/5 rounded border border-transparent hover:border-primary/20 transition-all duration-300"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-3.5 h-3.5"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </Link>
            )
          )}
        </div>
      </div>
    </footer>
  );
}
