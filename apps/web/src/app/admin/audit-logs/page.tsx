"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseBrowser";
import { 
  ArrowLeft, 
  FileClock, 
  User, 
  Calendar,
  Layers,
  Search,
  AlertCircle
} from "lucide-react";

interface AuditLog {
  id: string;
  tableName: string;
  action: string;
  keyValues: string;
  oldValues: string | null;
  newValues: string | null;
  actorEmail: string;
  timestamp: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5808";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);



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

  const loadAuditLogs = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const headers = await fetchAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/api/audit?limit=50`, { headers });
      if (!res.ok) {
        throw new Error(`Failed to load audit logs (${res.status})`);
      }
      const data = await res.json();
      setLogs(data);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load database change audits.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatAction = (action: string) => {
    switch (action.toUpperCase()) {
      case "INSERT":
        return <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold">Created</span>;
      case "UPDATE":
        return <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded text-[10px] font-bold">Updated</span>;
      case "DELETE":
        return <span className="bg-destructive/10 text-destructive border border-destructive/20 px-2 py-0.5 rounded text-[10px] font-bold">Deleted</span>;
      default:
        return <span className="bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded text-[10px] font-bold">{action}</span>;
    }
  };

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
            <FileClock className="w-6 h-6" />
            audit_trails
          </h1>
          <p className="text-xs text-muted-foreground/85 mt-0.5">
            Examine database modifications, original/updated values, and corresponding author emails.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 animate-pulse text-muted-foreground text-xs">Loading database audit logs...</div>
      ) : logs.length === 0 ? (
        <div className="terminal-card rounded-xl p-12 text-center text-muted-foreground text-xs">
          No modification audit entries have been logged in the database yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Logs list panel */}
          <div className="lg:col-span-2 terminal-card rounded-xl overflow-hidden h-[60vh] flex flex-col">
            <div className="overflow-y-auto flex-1">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="sticky top-0 bg-card border-b border-primary/10 z-10">
                  <tr className="text-muted-foreground text-[10px] uppercase font-bold">
                    <th className="p-4">Timestamp</th>
                    <th className="p-4">Resource</th>
                    <th className="p-4">Action</th>
                    <th className="p-4">User</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/5">
                  {logs.map((log) => (
                    <tr 
                      key={log.id} 
                      onClick={() => setSelectedLog(log)}
                      className={`cursor-pointer transition-colors ${
                        selectedLog?.id === log.id 
                          ? "bg-primary/10 font-bold" 
                          : "hover:bg-primary/5"
                      }`}
                    >
                      <td className="p-4 text-muted-foreground">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &middot; {new Date(log.timestamp).toLocaleDateString()}
                      </td>
                      <td className="p-4 font-bold text-foreground/80">{log.tableName}</td>
                      <td className="p-4">{formatAction(log.action)}</td>
                      <td className="p-4 text-foreground/70 truncate max-w-[120px]">{log.actorEmail || "System"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Details side panel */}
          <div className="terminal-card rounded-xl p-6 flex flex-col justify-between h-[60vh]">
            {selectedLog ? (
              <div className="space-y-6 overflow-y-auto flex-1 pr-2">
                <div className="flex justify-between items-start gap-4">
                  <h3 className="font-bold text-sm text-primary leading-tight">
                    Change Details
                  </h3>
                  {formatAction(selectedLog.action)}
                </div>

                <div className="space-y-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2.5">
                    <Layers className="w-4 h-4 text-primary/70 flex-shrink-0" />
                    <span className="font-bold text-foreground/80">Table: {selectedLog.tableName}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <User className="w-4 h-4 text-primary/70 flex-shrink-0" />
                    <span className="font-bold text-foreground/80 truncate">Actor: {selectedLog.actorEmail || "System"}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Calendar className="w-4 h-4 text-primary/70 flex-shrink-0" />
                    <span className="font-bold text-foreground/80">
                      Time: {new Date(selectedLog.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>

                {selectedLog.oldValues && selectedLog.oldValues !== "{}" && (
                  <div className="space-y-2">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">Original Values</span>
                    <pre className="p-4 bg-primary/5 border border-primary/10 rounded text-xs font-mono overflow-x-auto text-foreground/80 leading-relaxed max-h-[160px] whitespace-pre-wrap">
                      {JSON.stringify(JSON.parse(selectedLog.oldValues), null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.newValues && selectedLog.newValues !== "{}" && (
                  <div className="space-y-2">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">Modified Values</span>
                    <pre className="p-4 bg-primary/5 border border-primary/10 rounded text-xs font-mono overflow-x-auto text-foreground/80 leading-relaxed max-h-[160px] whitespace-pre-wrap">
                      {JSON.stringify(JSON.parse(selectedLog.newValues), null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center h-full text-muted-foreground/70">
                <Search className="w-8 h-8 mb-3 text-muted-foreground/40" />
                <p className="text-xs font-bold">Select an audit entry on the left to examine detailed modification changes.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
