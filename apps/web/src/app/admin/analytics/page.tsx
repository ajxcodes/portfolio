"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseBrowser";
import { 
  ArrowLeft, 
  BarChart3, 
  Eye, 
  MousePointerClick, 
  TrendingUp, 
  Globe, 
  AlertCircle 
} from "lucide-react";

interface AnalyticsSummary {
  totalPageViews: number;
  uniquePageViews: number;
  recentPageViews: Array<{
    id: string;
    viewedAt: string;
    referrerSource: string;
    userAgent: string | null;
    country: string | null;
    city: string | null;
  }>;
  recentLinkClicks: Array<{
    id: string;
    clickedAt: string;
    referrerSource: string | null;
    link: {
      url: string;
      linkType: {
        name: string;
      };
    };
    country: string | null;
    city: string | null;
  }>;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || "http://localhost:5808";

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");



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

  const loadAnalytics = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const headers = await fetchAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/api/analytics/summary?limit=30`, { headers });
      if (!res.ok) {
        throw new Error(`Failed to load analytics (${res.status})`);
      }
      const data = await res.json();
      setSummary(data);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load telemetry summary.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return <div className="text-center py-12 animate-pulse text-muted-foreground">Loading site analytics...</div>;
  }

  return (
    <div className="space-y-8 font-mono">
      <div className="flex items-center gap-4 border-b border-primary/10 pb-6">
        <Link 
          href="/admin/dashboard" 
          className="p-2 border border-primary/20 hover:bg-primary/5 rounded transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            traffic_telemetry
          </h1>
          <p className="text-xs text-muted-foreground/85 mt-0.5">
            Monitor real-time visitors, referral UTMs, and outbound click metrics.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {summary && (
        <div className="space-y-8">
          {/* Metrics Overview grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="terminal-card p-6 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-primary/15 rounded text-primary">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground font-bold uppercase">Total Views</span>
                <p className="text-2xl font-bold text-foreground mt-0.5">{summary.totalPageViews}</p>
              </div>
            </div>

            <div className="terminal-card p-6 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-emerald-500/15 rounded text-emerald-500">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground font-bold uppercase">Unique Visitors</span>
                <p className="text-2xl font-bold text-foreground mt-0.5">{summary.uniquePageViews}</p>
              </div>
            </div>

            <div className="terminal-card p-6 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-indigo-500/15 rounded text-indigo-500">
                <MousePointerClick className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground font-bold uppercase">Outbound Clicks</span>
                <p className="text-2xl font-bold text-foreground mt-0.5">{summary.recentLinkClicks.length}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Page Views */}
            <div className="terminal-card p-6 rounded-xl space-y-4">
              <h3 className="font-bold text-sm text-foreground/90 flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary" />
                Recent Inbound Traffic
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-primary/10 text-muted-foreground text-[10px] uppercase font-bold">
                      <th className="py-2.5">Time</th>
                      <th className="py-2.5">Referrer</th>
                      <th className="py-2.5">Location</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary/5">
                    {summary.recentPageViews.map((view) => (
                      <tr key={view.id} className="hover:bg-primary/5 transition-colors">
                        <td className="py-3 text-muted-foreground font-medium">
                          {new Date(view.viewedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &middot; {new Date(view.viewedAt).toLocaleDateString()}
                        </td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 bg-primary/10 border border-primary/20 text-[10px] font-bold rounded">
                            {view.referrerSource}
                          </span>
                        </td>
                        <td className="py-3 text-foreground/80 font-medium">
                          {view.city && view.country ? `${view.city}, ${view.country}` : "Unknown"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Outbound Link Clicks */}
            <div className="terminal-card p-6 rounded-xl space-y-4">
              <h3 className="font-bold text-sm text-foreground/90 flex items-center gap-2">
                <MousePointerClick className="w-4 h-4 text-primary" />
                Outbound Action Logs
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-primary/10 text-muted-foreground text-[10px] uppercase font-bold">
                      <th className="py-2.5">Time</th>
                      <th className="py-2.5">Target Link</th>
                      <th className="py-2.5">Referrer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary/5">
                    {summary.recentLinkClicks.map((click) => (
                      <tr key={click.id} className="hover:bg-primary/5 transition-colors">
                        <td className="py-3 text-muted-foreground font-medium">
                          {new Date(click.clickedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &middot; {new Date(click.clickedAt).toLocaleDateString()}
                        </td>
                        <td className="py-3">
                          <div className="flex flex-col">
                            <span className="font-bold text-[11px] text-foreground/80 leading-none">
                              {click.link.linkType.name}
                            </span>
                            <span className="text-[9px] text-muted-foreground truncate max-w-[180px] mt-1">
                              {click.link.url}
                            </span>
                          </div>
                        </td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 bg-primary/10 border border-primary/20 text-[10px] font-bold rounded">
                            {click.referrerSource || "Direct"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
