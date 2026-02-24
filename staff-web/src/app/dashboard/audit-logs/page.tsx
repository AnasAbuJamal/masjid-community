import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { ScrollText, Shield, User, Clock } from "lucide-react";

async function getLogs() {
    try {
        const logs = await prisma.auditLog.findMany({
            include: { user: { select: { firstName: true, lastName: true, email: true } } },
            orderBy: { createdAt: "desc" },
            take: 100,
        });
        return logs;
    } catch {
        return [];
    }
}

const actionColors: Record<string, string> = {
    login: "bg-green-100 text-green-700",
    login_failed: "bg-red-100 text-red-700",
    create: "bg-blue-100 text-blue-700",
    update: "bg-yellow-100 text-yellow-700",
    delete: "bg-red-100 text-red-700",
};

export default async function AuditLogsPage() {
    const logs = await getLogs();
    const successCount = logs.filter((l) => l.success).length;
    const failCount = logs.filter((l) => !l.success).length;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
                <p className="text-gray-500 mt-1">Monitor system activity and security events</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Total Events</p>
                                <p className="text-3xl font-bold">{logs.length}</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                <ScrollText className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Successful</p>
                                <p className="text-3xl font-bold text-green-600">{successCount}</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                                <Shield className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Failed</p>
                                <p className="text-3xl font-bold text-red-600">{failCount}</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                                <Shield className="h-6 w-6 text-red-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Logs Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
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
                            {logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                        No audit logs found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                logs.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell>
                                            <Badge className={actionColors[log.action] || "bg-gray-100 text-gray-700"}>
                                                {log.action}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {log.user ? (
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4 text-gray-400" />
                                                    {log.user.firstName} {log.user.lastName}
                                                </div>
                                            ) : (
                                                <span className="text-gray-500">{log.email || "System"}</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="max-w-xs truncate text-sm text-gray-500">
                                            {log.details || "—"}
                                        </TableCell>
                                        <TableCell className="text-sm font-mono text-gray-500">
                                            {log.ipAddress || "—"}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={log.success ? "default" : "secondary"}>
                                                {log.success ? "Success" : "Failed"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-gray-500">
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {log.createdAt.toLocaleString()}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
