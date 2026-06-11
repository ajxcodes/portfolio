"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
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
import { AdminSkeleton } from "@/components/admin/AdminSkeleton";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

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
    ipAddress: string | null;
  }>;
  recentLinkClicks: Array<{
    id: string;
    clickedAt: string;
    referrerSource: string | null;
    linkTypeName?: string;
    link: {
      url: string;
      linkType: {
        name: string;
      };
    } | null;
    country: string | null;
    city: string | null;
  }>;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5808";

const TOOLTIP_CONTENT_STYLE = { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--primary)/0.2)', borderRadius: '8px' };
const TOOLTIP_ITEM_STYLE = { color: 'hsl(var(--primary))' };
const PIE_COLORS = ['hsl(var(--primary))', 'hsl(var(--primary)/0.8)', 'hsl(var(--primary)/0.6)', 'hsl(var(--primary)/0.4)', 'hsl(var(--primary)/0.2)'];

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [showTotalViews, setShowTotalViews] = useState(false);

  const toggleViews = useCallback(() => setShowTotalViews(prev => !prev), []);

  const viewsByDate = useMemo(() => {
    if (!summary) return [];
    
    if (showTotalViews) {
      const counts: Record<string, number> = {};
      [...summary.recentPageViews].reverse().forEach(view => {
        const date = new Date(view.viewedAt).toLocaleDateString([], { month: 'short', day: 'numeric' });
        counts[date] = (counts[date] || 0) + 1;
      });
      return Object.entries(counts).map(([date, count]) => ({ date, count }));
    } else {
      const counts: Record<string, Set<string>> = {};
      [...summary.recentPageViews].reverse().forEach(view => {
        const date = new Date(view.viewedAt).toLocaleDateString([], { month: 'short', day: 'numeric' });
        if (!counts[date]) counts[date] = new Set<string>();
        // Fallback to ID if no IP is present to still count it as unique (though it shouldn't happen)
        counts[date].add(view.ipAddress || view.id);
      });
      return Object.entries(counts).map(([date, set]) => ({ date, count: set.size }));
    }
  }, [summary, showTotalViews]);

  const clicksByLink = useMemo(() => {
    if (!summary) return [];
    const counts: Record<string, number> = {};
    summary.recentLinkClicks.forEach(click => {
      const name = click.link?.linkType?.name || click.linkTypeName || "Unknown Link";
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [summary]);

  const viewsByLocation = useMemo(() => {
    if (!summary) return [];
    const counts: Record<string, number> = {};
    summary.recentPageViews.forEach(view => {
      const loc = (view.country && view.country !== 'Unknown') ? view.country : 'Unknown';
      counts[loc] = (counts[loc] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [summary]);

  const viewsByReferrer = useMemo(() => {
    if (!summary) return [];
    const counts: Record<string, number> = {};
    summary.recentPageViews.forEach(view => {
      const ref = view.referrerSource || 'Direct';
      counts[ref] = (counts[ref] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [summary]);

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
    return <AdminSkeleton />;
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Page Views Chart */}
            <div className="terminal-card p-6 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-foreground/90 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Views Over Time
                </h3>
                <button
                  type="button"
                  onClick={toggleViews}
                  className="px-2.5 py-1 text-[10px] font-bold rounded-md bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary transition-colors uppercase tracking-wider flex items-center gap-1.5"
                >
                  <Eye className="w-3 h-3" />
                  {showTotalViews ? "Showing: Total Views" : "Showing: Unique Visitors"}
                </button>
              </div>
              {!showTotalViews && (
                <p className="text-[10px] text-muted-foreground italic flex items-center gap-1 mt-2">
                  <AlertCircle className="w-3 h-3" />
                  Fallback IDs are used if IP address is missing.
                </p>
              )}
              <div className="h-64 w-full mt-4">
                {viewsByDate.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={viewsByDate}>
                      <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                      <Tooltip 
                        contentStyle={TOOLTIP_CONTENT_STYLE} 
                        itemStyle={TOOLTIP_ITEM_STYLE}
                      />
                      <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4, fill: 'hsl(var(--primary))' }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-xs italic">Not enough data to display chart</div>
                )}
              </div>
            </div>

            {/* Link Clicks Chart */}
            <div className="terminal-card p-6 rounded-xl space-y-4">
              <h3 className="font-bold text-sm text-foreground/90 flex items-center gap-2">
                <MousePointerClick className="w-4 h-4 text-primary" />
                Clicks by Link
              </h3>
              <div className="h-64 w-full mt-4">
                {clicksByLink.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={clicksByLink}>
                      <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip 
                        cursor={{ fill: 'hsl(var(--primary)/0.1)' }}
                        contentStyle={TOOLTIP_CONTENT_STYLE} 
                        itemStyle={TOOLTIP_ITEM_STYLE}
                      />
                      <Bar dataKey="count" fill="hsl(var(--primary)/0.8)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-xs italic">Not enough data to display chart</div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Traffic by Referrer Chart */}
            <div className="terminal-card p-6 rounded-xl space-y-4">
              <h3 className="font-bold text-sm text-foreground/90 flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary" />
                Traffic by Referrer
              </h3>
              <div className="h-64 w-full mt-4">
                {viewsByReferrer.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={viewsByReferrer}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="count"
                      >
                        {viewsByReferrer.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={TOOLTIP_CONTENT_STYLE} 
                        itemStyle={TOOLTIP_ITEM_STYLE}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-xs italic">Not enough data to display chart</div>
                )}
              </div>
            </div>

            {/* Traffic by Location Chart */}
            <div className="terminal-card p-6 rounded-xl space-y-4">
              <h3 className="font-bold text-sm text-foreground/90 flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary" />
                Traffic by Location (Country)
              </h3>
              <div className="h-64 w-full mt-4">
                {viewsByLocation.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={viewsByLocation} layout="vertical" margin={{ left: 20 }}>
                      <XAxis type="number" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                      <YAxis dataKey="name" type="category" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} width={80} />
                      <Tooltip 
                        cursor={{ fill: 'hsl(var(--primary)/0.1)' }}
                        contentStyle={TOOLTIP_CONTENT_STYLE} 
                        itemStyle={TOOLTIP_ITEM_STYLE}
                      />
                      <Bar dataKey="count" fill="hsl(var(--primary)/0.6)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-xs italic">Not enough data to display chart</div>
                )}
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
                              {click.link?.linkType?.name || click.linkTypeName || "Unknown Link"}
                            </span>
                            <span className="text-[9px] text-muted-foreground truncate max-w-[180px] mt-1">
                              {click.link?.url || "URL Unavailable"}
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
