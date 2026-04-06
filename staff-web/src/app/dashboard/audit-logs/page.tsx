"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { ScrollText, Shield, User, Clock, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";

interface AuditLog {
  id: string; action: string; email?: string; details?: string;
  ipAddress?: string; success: boolean; createdAt: string;
  userId?: string;
  user?: { firstName: string; lastName: string; email: string };
}

interface ApiResponse {
  logs: AuditLog[];
  total: number;
  page: number;
  totalPages: number;
  filters: { actions: string[] };
}

const actionColors: Record<string, string> = {
  login: "bg-green-100 text-green-700", login_failed: "bg-red-100 text-red-700",
  create: "bg-blue-100 text-blue-700", update: "bg-yellow-100 text-yellow-700",
  delete: "bg-red-100 text-red-700",
};

function SkeletonRow() {
  return (
    <TableRow>
      <TableCell><div className="h-6 w-20 bg-gray-200 rounded animate-pulse" /></TableCell>
      <TableCell><div className="h-6 w-24 bg-gray-200 rounded animate-pulse" /></TableCell>
      <TableCell><div className="h-4 w-32 bg-gray-200 rounded animate-pulse" /></TableCell>
      <TableCell><div className="h-4 w-20 bg-gray-200 rounded animate-pulse" /></TableCell>
      <TableCell><div className="h-6 w-16 bg-gray-200 rounded animate-pulse" /></TableCell>
      <TableCell><div className="h-4 w-24 bg-gray-200 rounded animate-pulse" /></TableCell>
    </TableRow>
  );
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [actions, setActions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [pending, startTransition] = useTransition();
  const [prevLogs, setPrevLogs] = useState<AuditLog[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async (pageNum: number = 1, filter: string = actionFilter) => {
    setIsRefreshing(true);
    try {
      const params = new URLSearchParams({ page: pageNum.toString(), limit: "15" });
      if (filter !== "all") params.append("action", filter);
      
      const res = await fetch(`/api/audit-logs?${params}`);
      const data: ApiResponse = await res.json();
      
      startTransition(() => {
        setLogs(data.logs || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
        setPage(data.page || 1);
        setActions(data.filters?.actions || []);
      });
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [actionFilter]);

  useEffect(() => { 
    setLoading(true); 
    fetchData(1, actionFilter); 
  }, [actionFilter, fetchData]);

  const handleFilterChange = (filter: string) => {
    setLoading(true);
    setLogs([]);
    setActionFilter(filter);
    setPage(1);
    fetchData(1, filter);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setLoading(true);
    setPrevLogs(logs);
    fetchData(newPage, actionFilter);
  };

  const handleRefresh = () => {
    fetchData(page, actionFilter);
  };

  const successCount = logs.filter((l) => l.success).length;
  const failCount = logs.filter((l) => !l.success).length;
  const displayLogs = loading && prevLogs.length > 0 ? prevLogs : logs;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1><p className="text-gray-500 mt-1">Monitor system activity and security events</p></div>
        <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Total Events</p><p className="text-3xl font-bold">{total}</p></div><div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center"><ScrollText className="h-6 w-6 text-blue-600" /></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Successful</p><p className="text-3xl font-bold text-green-600">{successCount}</p></div><div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center"><Shield className="h-6 w-6 text-green-600" /></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Failed</p><p className="text-3xl font-bold text-red-600">{failCount}</p></div><div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center"><Shield className="h-6 w-6 text-red-600" /></div></div></CardContent></Card>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button 
          variant={actionFilter === "all" ? "default" : "outline"} 
          size="sm" 
          onClick={() => handleFilterChange("all")}
          className={actionFilter === "all" ? "mocha-gradient" : ""}
        >
          All
        </Button>
        {actions.map((a) => (
          <Button 
            key={a} 
            variant={actionFilter === a ? "default" : "outline"} 
            size="sm" 
            onClick={() => handleFilterChange(a)}
            className={actionFilter === a ? "mocha-gradient" : ""}
          >
            {a.replace("_", " ")}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Activity</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handlePageChange(page - 1)} disabled={page <= 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => handlePageChange(page + 1)} disabled={page >= totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
              </TableBody>
            </Table>
          ) : displayLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No audit logs found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayLogs.map((log) => (
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
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}