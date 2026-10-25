import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

export async function createNotification(
    userId: number,
    data: {
        type: "info" | "success" | "warning" | "error" | "donation" | "volunteer" | "proposal" | "job" | "assignment" | "attendance" | "system";
        title: string;
        message: string;
        link?: string;
        metadata?: Record<string, unknown> | null;
    }
) {
    return prisma.notification.create({
        data: {
            userId,
            type: data.type as "info" | "success" | "warning" | "error" | "donation" | "volunteer" | "proposal" | "job" | "assignment" | "attendance" | "system",
            title: data.title,
            message: data.message,
            link: data.link || undefined,
            metadata: data.metadata == null ? Prisma.DbNull : data.metadata as Prisma.InputJsonValue,
        },
    });
}
