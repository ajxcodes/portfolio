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
  AlertCircle,
  Bot
} from "lucide-react";
import { AdminSkeleton } from "@/components/admin/AdminSkeleton";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface TimelineEvent {
  id: string;
  type: 'page_view' | 'link_click' | 'ai_query';
  timestamp: string;
  dateStr: string;
  timeStr: string;
  details: {
    referrer?: string;
    location?: string;
    linkName?: string;
    url?: string;
    queryText?: string;
  }
}

interface VisitorJourney {
  sessionId: string;
  location: string;
  referrer: string;
  isBot: boolean;
  events: TimelineEvent[];
  lastActiveAt: string;
}

const isLikelyBot = (userAgent?: string | null) => {
  if (!userAgent) return false;
  const lowerUA = userAgent.toLowerCase();
  const botKeywords = ['bot', 'crawler', 'spider', 'headless', 'lighthouse', 'curl', 'python', 'http'];
  return botKeywords.some(kw => lowerUA.includes(kw));
};

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
    pagePath?: string | null;
    visitorSessionId?: string | null;
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
    visitorSessionId?: string | null;
  }>;
  totalAiQueries: number;
  uniqueAiQueries: number;
  recentAiQueries: Array<{
    id: string;
    queriedAt: string;
    queryText: string;
    visitorSessionId?: string | null;
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
  const [showAdminViews, setShowAdminViews] = useState(false);
  const [activeTab, setActiveTab] = useState<'trends' | 'demographics' | 'journeys' | 'ai-queries'>('trends');

  const toggleViews = useCallback(() => setShowTotalViews(prev => !prev), []);
  const toggleAdminViews = useCallback(() => setShowAdminViews(prev => !prev), []);

  const filteredPageViews = useMemo(() => {
    if (!summary?.recentPageViews) return [];
    return summary.recentPageViews.filter(view => showAdminViews || !view.pagePath?.startsWith('/admin'));
  }, [summary?.recentPageViews, showAdminViews]);

  const viewsByDate = useMemo(() => {
    if (!filteredPageViews.length) return [];
    
    if (showTotalViews) {
      const counts: Record<string, number> = {};
      [...filteredPageViews].reverse().forEach(view => {
        const date = new Date(view.viewedAt).toLocaleDateString([], { month: 'short', day: 'numeric' });
        counts[date] = (counts[date] || 0) + 1;
      });
      return Object.entries(counts).map(([date, count]) => ({ date, count }));
    } else {
      const counts: Record<string, Set<string>> = {};
      [...filteredPageViews].reverse().forEach(view => {
        const date = new Date(view.viewedAt).toLocaleDateString([], { month: 'short', day: 'numeric' });
        if (!counts[date]) counts[date] = new Set<string>();
        counts[date].add(view.ipAddress || view.id);
      });
      return Object.entries(counts).map(([date, set]) => ({ date, count: set.size }));
    }
  }, [filteredPageViews, showTotalViews]);

  const clicksByLink = useMemo(() => {
    if (!summary) return [];
    const counts: Record<string, number> = {};
    summary.recentLinkClicks.forEach(click => {
      const name = click.link?.linkType?.name || click.linkTypeName || "Unknown Link";
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [summary?.recentLinkClicks]);

  const viewsByLocation = useMemo(() => {
    if (!filteredPageViews.length) return [];
    const counts: Record<string, number> = {};
    filteredPageViews.forEach(view => {
      const loc = (view.country && view.country !== 'Unknown') ? view.country : 'Unknown';
      counts[loc] = (counts[loc] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [filteredPageViews]);

  const viewsByReferrer = useMemo(() => {
    if (!filteredPageViews.length) return [];
    const counts: Record<string, number> = {};
    filteredPageViews.forEach(view => {
      const ref = view.referrerSource || 'Direct';
      counts[ref] = (counts[ref] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [filteredPageViews]);

  const queriesByDate = useMemo(() => {
    if (!summary || !summary.recentAiQueries) return [];
    const counts: Record<string, number> = {};
    [...summary.recentAiQueries].reverse().forEach(query => {
      const date = new Date(query.queriedAt).toLocaleDateString([], { month: 'short', day: 'numeric' });
      counts[date] = (counts[date] || 0) + 1;
    });
    return Object.entries(counts).map(([date, count]) => ({ date, count }));
  }, [summary?.recentAiQueries]);

  const visitorJourneys = useMemo(() => {
    if (!summary) return [];
    
    const journeys = new Map<string, VisitorJourney>();
    
    const getOrCreateJourney = (sessionId: string, fallbackId: string) => {
      const id = sessionId || `anonymous-${fallbackId}`;
      if (!journeys.has(id)) {
        journeys.set(id, {
          sessionId: id,
          location: 'Unknown',
          referrer: 'Direct',
          isBot: false,
          events: [],
          lastActiveAt: ''
        });
      }
      return journeys.get(id)!;
    };

    filteredPageViews.forEach(view => {
      const journey = getOrCreateJourney(view.visitorSessionId || '', view.id);
      if (journey.location === 'Unknown' && view.country) {
         journey.location = view.city ? `${view.city}, ${view.country}` : view.country;
      }
      if (journey.referrer === 'Direct' && view.referrerSource) {
         journey.referrer = view.referrerSource;
      }
      if (!journey.isBot && isLikelyBot(view.userAgent)) {
         journey.isBot = true;
      }
      journey.events.push({
        id: view.id,
        type: 'page_view',
        timestamp: view.viewedAt,
        dateStr: new Date(view.viewedAt).toLocaleDateString(),
        timeStr: new Date(view.viewedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        details: { 
          referrer: view.referrerSource, 
          location: view.city && view.country ? `${view.city}, ${view.country}` : view.country || "Unknown",
          url: view.pagePath || undefined
        }
      });
    });

    summary.recentLinkClicks?.forEach(click => {
      const journey = getOrCreateJourney(click.visitorSessionId || '', click.id);
      journey.events.push({
        id: click.id,
        type: 'link_click',
        timestamp: click.clickedAt,
        dateStr: new Date(click.clickedAt).toLocaleDateString(),
        timeStr: new Date(click.clickedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        details: { 
          linkName: click.link?.linkType?.name || click.linkTypeName || "Unknown Link",
          url: click.link?.url
        }
      });
    });

    if (summary.recentAiQueries) {
      summary.recentAiQueries.forEach(query => {
        const journey = getOrCreateJourney(query.visitorSessionId || '', query.id);
        journey.events.push({
          id: query.id,
          type: 'ai_query',
          timestamp: query.queriedAt,
          dateStr: new Date(query.queriedAt).toLocaleDateString(),
          timeStr: new Date(query.queriedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          details: { queryText: query.queryText }
        });
      });
    }

    return Array.from(journeys.values()).map(journey => {
      journey.events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      journey.lastActiveAt = journey.events[0]?.timestamp || '';
      return journey;
    }).sort((a, b) => new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime());
  }, [filteredPageViews, summary?.recentLinkClicks, summary?.recentAiQueries]);

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
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 mb-8">
            <div className="terminal-card p-6 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-primary/15 rounded text-primary">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground font-bold uppercase">Total Views</span>
                <p className="text-2xl font-bold text-foreground mt-0.5">{summary.totalPageViews} <span className="text-xs text-muted-foreground font-normal">({filteredPageViews.length} filtered)</span></p>
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

            <div className="terminal-card p-6 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-blue-500/15 rounded text-blue-500">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground font-bold uppercase">AI Queries</span>
                <p className="text-2xl font-bold text-foreground mt-0.5">{summary.totalAiQueries || 0}</p>
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-primary/20 pb-4">
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => setActiveTab('trends')} 
                className={`px-4 py-2 text-sm font-bold font-mono rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'trends' ? 'bg-primary text-primary-foreground' : 'bg-primary/5 text-primary hover:bg-primary/10'}`}
              >
                <TrendingUp className="w-4 h-4" /> Traffic Trends
              </button>
              <button 
                onClick={() => setActiveTab('demographics')} 
                className={`px-4 py-2 text-sm font-bold font-mono rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'demographics' ? 'bg-primary text-primary-foreground' : 'bg-primary/5 text-primary hover:bg-primary/10'}`}
              >
                <Globe className="w-4 h-4" /> Demographics
              </button>
              <button 
                onClick={() => setActiveTab('journeys')} 
                className={`px-4 py-2 text-sm font-bold font-mono rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'journeys' ? 'bg-primary text-primary-foreground' : 'bg-primary/5 text-primary hover:bg-primary/10'}`}
              >
                <Eye className="w-4 h-4" /> Visitor Journeys
              </button>
              <button 
                onClick={() => setActiveTab('ai-queries')} 
                className={`px-4 py-2 text-sm font-bold font-mono rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'ai-queries' ? 'bg-primary text-primary-foreground' : 'bg-primary/5 text-primary hover:bg-primary/10'}`}
              >
                <Bot className="w-4 h-4" /> AI Queries
              </button>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <label className="flex items-center gap-2 text-xs text-muted-foreground font-medium cursor-pointer hover:text-foreground transition-colors select-none">
                <input 
                  type="checkbox" 
                  checked={showAdminViews} 
                  onChange={toggleAdminViews}
                  className="rounded border-primary/30 bg-primary/5 text-primary focus:ring-primary/20"
                />
                Show /admin views
              </label>
            </div>
          </div>

          <div className="mt-6">
            {activeTab === 'trends' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
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

                  {/* AI Queries Chart */}
                  <div className="terminal-card p-6 rounded-xl space-y-4 lg:col-span-2">
                    <h3 className="font-bold text-sm text-foreground/90 flex items-center gap-2">
                      <Bot className="w-4 h-4 text-primary" />
                      AI Queries Over Time
                    </h3>
                    <div className="h-64 w-full mt-4">
                      {queriesByDate.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={queriesByDate}>
                            <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
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
                </div>
              </div>
            )}
            
            {activeTab === 'demographics' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
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
              </div>
            )}
            
            {activeTab === 'journeys' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="space-y-6">
                  {visitorJourneys.length > 0 ? visitorJourneys.map(journey => (
                    <div key={journey.sessionId} className="terminal-card rounded-xl p-6">
                      <div className="flex flex-wrap gap-4 items-center justify-between mb-6 pb-4 border-b border-primary/10">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                            <Globe className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-sm text-foreground/90 flex items-center gap-2">
                              Session: {journey.sessionId.split('-')[0]}...
                              {journey.isBot && (
                                <span className="px-1.5 py-0.5 rounded-sm bg-destructive/10 border border-destructive/20 text-[10px] text-destructive uppercase tracking-wider font-bold flex items-center gap-1">
                                  <Bot className="w-3 h-3" /> BOT
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-muted-foreground flex gap-2">
                              <span>{journey.location}</span>
                              <span>&middot;</span>
                              <span>Referrer: {journey.referrer}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-[10px] font-bold px-2 py-1 bg-primary/5 rounded border border-primary/10">
                          {journey.events.length} Events
                        </div>
                      </div>

                      <div className="relative pl-4 space-y-6 before:absolute before:inset-y-0 before:left-[7px] before:w-px before:bg-primary/20">
                        {journey.events.map((evt) => (
                          <div key={evt.id} className="relative flex gap-4">
                            <div className="absolute -left-5 mt-1.5 w-2.5 h-2.5 rounded-full bg-card border-2 border-primary" />
                            <div className="w-20 pt-0.5 flex-shrink-0 text-[10px] text-muted-foreground font-medium">
                              <div>{evt.timeStr}</div>
                              <div className="opacity-70">{evt.dateStr}</div>
                            </div>
                            <div className="flex-1 bg-primary/5 border border-primary/10 rounded p-3">
                              <div className="flex items-center gap-2 mb-1">
                                {evt.type === 'page_view' && <Eye className="w-3 h-3 text-emerald-500" />}
                                {evt.type === 'link_click' && <MousePointerClick className="w-3 h-3 text-indigo-500" />}
                                {evt.type === 'ai_query' && <Bot className="w-3 h-3 text-blue-500" />}
                                <span className="text-[11px] font-bold uppercase tracking-wider text-foreground/80">
                                  {evt.type.replace('_', ' ')}
                               </span>
                              </div>
                              {evt.type === 'page_view' && (
                                <div className="text-xs text-muted-foreground">
                                  Viewed page <span className="font-bold text-foreground/80">{evt.details.url || 'Unknown'}</span> from <span className="font-bold text-foreground/80">{evt.details.referrer || 'Direct'}</span>
                                </div>
                              )}
                              {evt.type === 'link_click' && (
                                <div className="text-xs text-muted-foreground">
                                  Clicked <span className="font-bold text-foreground/80">{evt.details.linkName}</span>
                                  {evt.details.url && <div className="text-[10px] opacity-70 mt-0.5 truncate max-w-[300px]">{evt.details.url}</div>}
                                </div>
                              )}
                              {evt.type === 'ai_query' && (
                                <div className="text-xs text-foreground/90 font-medium italic">
                                  "{evt.details.queryText}"
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )) : (
                    <div className="terminal-card rounded-xl p-8 text-center text-muted-foreground text-sm italic">
                      No visitor journeys recorded yet.
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'ai-queries' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="space-y-4">
                  {summary.recentAiQueries && summary.recentAiQueries.length > 0 ? summary.recentAiQueries.map(query => (
                    <div key={query.id} className="terminal-card rounded-xl p-5 flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 flex-shrink-0">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[11px] font-bold text-muted-foreground">
                            {new Date(query.queriedAt).toLocaleDateString()} {new Date(query.queriedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {query.visitorSessionId && (
                            <span className="text-[10px] bg-primary/10 border border-primary/20 text-primary px-1.5 py-0.5 rounded">
                              Session: {query.visitorSessionId.split('-')[0]}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-foreground/90 font-medium">
                          {query.queryText}
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="terminal-card rounded-xl p-8 text-center text-muted-foreground text-sm italic">
                      No AI queries recorded yet.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
