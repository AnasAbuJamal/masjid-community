"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { ScrollText, Shield, User, Clock, RefreshCw } from "lucide-react";

interface AuditLog {
  id: string; action: string; email?: string; details?: string;
  ipAddress?: string; success: boolean; createdAt: string;
  userId?: string;
  user?: { firstName: string; lastName: string; email: string };
}

const actionColors: Record<string, string> = {
  login: "bg-green-100 text-green-700", login_failed: "bg-red-100 text-red-700",
  create: "bg-blue-100 text-blue-700", update: "bg-yellow-100 text-yellow-700",
  delete: "bg-red-100 text-red-700",
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("all");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/audit-logs");
      const data = await res.json();
      setLogs(data.logs || []);
    } catch { /* empty */ } finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const filtered = actionFilter === "all" ? logs : logs.filter((l) => l.action === actionFilter);
  const successCount = logs.filter((l) => l.success).length;
  const failCount = logs.filter((l) => !l.success).length;

  const actions = ["all", ...Array.from(new Set(logs.map((l) => l.action)))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1><p className="text-gray-500 mt-1">Monitor system activity and security events</p></div>
        <Button variant="outline" onClick={fetchData} disabled={loading}><RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />Refresh</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Total Events</p><p className="text-3xl font-bold">{logs.length}</p></div><div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center"><ScrollText className="h-6 w-6 text-blue-600" /></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Successful</p><p className="text-3xl font-bold text-green-600">{successCount}</p></div><div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center"><Shield className="h-6 w-6 text-green-600" /></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Failed</p><p className="text-3xl font-bold text-red-600">{failCount}</p></div><div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center"><Shield className="h-6 w-6 text-red-600" /></div></div></CardContent></Card>
      </div>

      <div className="flex gap-2 flex-wrap">
        {actions.map((a) => (
          <Button key={a} variant={actionFilter === a ? "default" : "outline"} size="sm" onClick={() => setActionFilter(a)} className={actionFilter === a ? "bg-emerald-600" : ""}>
            {a === "all" ? "All" : a.replace("_", " ")}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8"><div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Action</TableHead><TableHead>User</TableHead><TableHead>Details</TableHead><TableHead>IP Address</TableHead><TableHead>Status</TableHead><TableHead>Time</TableHead></TableRow></TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">No audit logs found.</TableCell></TableRow>
                ) : (
                  filtered.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell><Badge className={actionColors[log.action] || "bg-gray-100 text-gray-700"}>{log.action}</Badge></TableCell>
                      <TableCell>
                        {log.user ? (
                          <div className="flex items-center gap-2"><User className="h-4 w-4 text-gray-400" />{log.user.firstName} {log.user.lastName}</div>
                        ) : (
                          <span className="text-gray-500">{log.email || "System"}</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-sm text-gray-500">{log.details || "—"}</TableCell>
                      <TableCell className="text-sm font-mono text-gray-500">{log.ipAddress || "—"}</TableCell>
                      <TableCell><Badge variant={log.success ? "default" : "secondary"}>{log.success ? "Success" : "Failed"}</Badge></TableCell>
                      <TableCell className="text-sm text-gray-500"><div className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(log.createdAt).toLocaleString()}</div></TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
