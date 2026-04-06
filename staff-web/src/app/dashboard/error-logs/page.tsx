"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle, CheckCircle, XCircle, Info, RefreshCw, Eye, ChevronLeft, ChevronRight,
} from "lucide-react";

interface ErrorLog {
  id: string;
  message: string;
  stack?: string;
  type: string;
  path?: string;
  method?: string;
  statusCode?: number;
  metadata?: Record<string, unknown>;
  resolved: boolean;
  createdAt: string;
}

interface ErrorStats {
  byType: Record<string, number>;
  unresolved: number;
}

export default function ErrorLogsPage() {
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [stats, setStats] = useState<ErrorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [resolvedFilter, setResolvedFilter] = useState<string>("all");
  const [selectedError, setSelectedError] = useState<ErrorLog | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const fetchErrors = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(typeFilter !== "all" && { type: typeFilter }),
        ...(resolvedFilter !== "all" && { resolved: resolvedFilter === "resolved" ? "true" : "false" }),
      });

      const res = await fetch(`/api/logs/errors?${params}`);
      if (res.ok) {
        const data = await res.json();
        setErrors(data.errors);
        setTotalPages(data.totalPages);
        setTotal(data.total);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch errors:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;
    async function loadErrors() {
      if (cancelled) return;
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: "20",
        });
        if (typeFilter !== "all") params.append("type", typeFilter);
        if (resolvedFilter !== "all") params.append("resolved", resolvedFilter === "resolved" ? "true" : "false");

        const res = await fetch(`/api/logs/errors?${params}`);
        if (res.ok && !cancelled) {
          const data = await res.json();
          setErrors(data.errors);
          setTotalPages(data.totalPages);
          setTotal(data.total);
          setStats(data.stats);
        }
      } catch (error) {
        console.error("Failed to fetch errors:", error);
      }
      if (!cancelled) setLoading(false);
    }
    loadErrors();
    return () => { cancelled = true; };
  }, [page, typeFilter, resolvedFilter]);

  const handleResolve = async (id: string, resolved: boolean) => {
    try {
      const res = await fetch("/api/logs/errors", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, resolved }),
      });
      if (res.ok) fetchErrors();
    } catch (error) {
      console.error("Failed to update error:", error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "error": return <XCircle className="h-4 w-4 text-red-500" />;
      case "warning": return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "info": return <Info className="h-4 w-4 text-blue-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, string> = {
      error: "bg-red-100 text-red-800",
      warning: "bg-yellow-100 text-yellow-800",
      info: "bg-blue-100 text-blue-800",
      server: "bg-gray-100 text-gray-800",
    };
    return variants[type] || "bg-gray-100 text-gray-800";
  };

  const openDetails = (error: ErrorLog) => {
    setSelectedError(error);
    setDetailsOpen(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Error Logs</h1>
          <p className="text-muted-foreground">Monitor and track application errors</p>
        </div>
        <Button onClick={fetchErrors} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Errors</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Unresolved</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.unresolved}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Errors</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.byType.error || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Warnings</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.byType.warning || 0}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Error History</CardTitle>
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="server">Server</SelectItem>
                </SelectContent>
              </Select>
              <Select value={resolvedFilter} onValueChange={(v) => { setResolvedFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="unresolved">Unresolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : errors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No errors found
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Type</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead className="w-[120px]">Path</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead className="w-[180px]">Date</TableHead>
                    <TableHead className="w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {errors.map((error) => (
                    <TableRow key={error.id} className={error.resolved ? "opacity-60" : ""}>
                      <TableCell>
                        <Badge className={getTypeBadge(error.type)}>
                          <span className="flex items-center gap-1">
                            {getTypeIcon(error.type)}
                            {error.type}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-md truncate">{error.message}</TableCell>
                      <TableCell className="text-xs">
                        {error.path ? (
                          <code className="text-xs bg-muted px-1 py-0.5 rounded">
                            {error.method} {error.path.slice(0, 20)}
                          </code>
                        ) : "-"}
                      </TableCell>
                      <TableCell>
                        {error.resolved ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Resolved
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            <XCircle className="h-3 w-3 mr-1" />
                            Open
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(error.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openDetails(error)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {!error.resolved && (
                            <Button variant="ghost" size="sm" onClick={() => handleResolve(error.id, true)}>
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          {error.resolved && (
                            <Button variant="ghost" size="sm" onClick={() => handleResolve(error.id, false)}>
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {page} of {totalPages} ({total} total)
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedError && getTypeIcon(selectedError.type)}
              Error Details
            </DialogTitle>
          </DialogHeader>
          {selectedError && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-1">Message</h4>
                <p className="text-sm bg-muted p-3 rounded-md">{selectedError.message}</p>
              </div>
              {selectedError.stack && (
                <div>
                  <h4 className="font-semibold mb-1">Stack Trace</h4>
                  <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto whitespace-pre-wrap">
                    {selectedError.stack}
                  </pre>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-1">Type</h4>
                  <Badge className={getTypeBadge(selectedError.type)}>{selectedError.type}</Badge>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Status</h4>
                  {selectedError.resolved ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700">Resolved</Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-50 text-red-700">Unresolved</Badge>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold mb-1">HTTP Method</h4>
                  <p className="text-sm">{selectedError.method || "-"}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Status Code</h4>
                  <p className="text-sm">{selectedError.statusCode || "-"}</p>
                </div>
                <div className="col-span-2">
                  <h4 className="font-semibold mb-1">Path</h4>
                  <code className="text-xs bg-muted px-2 py-1 rounded">{selectedError.path || "-"}</code>
                </div>
                <div className="col-span-2">
                  <h4 className="font-semibold mb-1">Timestamp</h4>
                  <p className="text-sm">{new Date(selectedError.createdAt).toLocaleString()}</p>
                </div>
                {selectedError.metadata && (
                  <div className="col-span-2">
                    <h4 className="font-semibold mb-1">Metadata</h4>
                    <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
                      {JSON.stringify(selectedError.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
