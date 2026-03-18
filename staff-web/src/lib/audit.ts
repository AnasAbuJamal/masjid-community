import prisma from "@/lib/prisma";

interface AuditLogOptions {
    action: string;
    userId?: string;
    email?: string;
    details?: string;
    ipAddress?: string;
    success?: boolean;
}

/**
 * Log an audit event to the database.
 * Call this in API routes after create/update/delete operations.
 *
 * @example
 * await logAudit({
 *   action: "create",
 *   userId: session.user.id,
 *   details: `Created prayer time for ${date}`,
 * });
 */
export async function logAudit(options: AuditLogOptions) {
    try {
        await prisma.auditLog.create({
            data: {
                action: options.action,
                userId: options.userId || undefined,
                email: options.email || undefined,
                details: options.details || undefined,
                ipAddress: options.ipAddress || undefined,
                success: options.success ?? true,
            },
        });
    } catch (error) {
        // Don't let audit logging failures break the main flow
        console.error("[Audit] Failed to log:", error);
    }
}

/**
 * Extract the client IP from a Next.js request.
 */
export function getClientIp(req: Request): string {
    const forwarded = req.headers.get("x-forwarded-for");
    if (forwarded) return forwarded.split(",")[0].trim();
    const realIp = req.headers.get("x-real-ip");
    if (realIp) return realIp;
    return "unknown";
}
