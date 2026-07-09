"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  UserSquare, 
  BarChart3, 
  FileClock,
  Tags
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { href: "/admin/dashboard", label: "dashboard", Icon: LayoutDashboard },
    { href: "/admin/resume", label: "resume-profile", Icon: UserSquare },
    { href: "/admin/resume/skills", label: "skills-library", Icon: Tags },
    { href: "/admin/analytics", label: "telemetry", Icon: BarChart3 },
    { href: "/admin/audit-logs", label: "audit-logs", Icon: FileClock },
  ];

  const isLoginPage = pathname === "/admin/login" || pathname === "/admin/auth/callback";

  if (isLoginPage) {
    return <div className="min-h-screen bg-background text-foreground py-12 font-mono">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row font-mono">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-card/60 border-b md:border-b-0 md:border-r border-primary/10 flex flex-col justify-between p-6">
        <div>
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="w-8 h-8 rounded border border-primary/25 bg-primary/10 flex items-center justify-center text-primary font-mono font-bold text-sm">
              AC
            </div>
            <div>
              <h2 className="font-bold text-base font-mono leading-tight text-primary">admin_control</h2>
              <span className="text-[10px] font-mono text-muted-foreground/60">CMS</span>
            </div>
          </div>

          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded text-xs font-bold font-mono transition-all duration-200 ${
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/20 shadow-sm"
                      : "text-muted-foreground/85 hover:bg-primary/5 hover:text-primary border border-transparent"
                  }`}
                >
                  <item.Icon className="w-4 h-4 flex-shrink-0 opacity-80" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
