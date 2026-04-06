import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createBackup } from "@/lib/backup";

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const backup = await createBackup();

        return NextResponse.json({
            success: true,
            backup: {
                id: backup.id,
                filename: backup.filename,
                size: backup.size,
                collections: backup.collections,
                createdAt: backup.createdAt,
            },
        });
    } catch (error) {
        console.error("Backup error:", error);
        return NextResponse.json({ error: "Failed to create backup" }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const stats = await getBackupStats();

        return NextResponse.json(stats);
    } catch (error) {
        console.error("Backup stats error:", error);
        return NextResponse.json({ error: "Failed to get backup stats" }, { status: 500 });
    }
}

async function getBackupStats() {
    const models = [
        "user",
        "prayerTime",
        "blogPost",
        "class",
        "student",
        "assignment",
        "constructionProject",
        "volunteerOpportunity",
        "volunteerApplication",
        "projectProposal",
        "proposalComment",
        "donation",
        "siteSetting",
        "kioskAnnouncement",
        "financialRecord",
        "financialSummary",
        "jobPosting",
        "jobApplication",
        "workerProfile",
        "auditLog",
        "attendance",
        "notification",
        "event",
        "eventRSVP",
        "passwordResetToken",
        "mediaFile",
    ];

    const counts: Record<string, number> = {};

    const modelMap: Record<string, keyof PrismaClient> = {
        user: "user",
        prayerTime: "prayerTime",
        blogPost: "blogPost",
        class: "class",
        student: "student",
        assignment: "assignment",
        constructionProject: "constructionProject",
        volunteerOpportunity: "volunteerOpportunity",
        volunteerApplication: "volunteerApplication",
        projectProposal: "projectProposal",
        proposalComment: "proposalComment",
        donation: "donation",
        siteSetting: "siteSetting",
        kioskAnnouncement: "kioskAnnouncement",
        financialRecord: "financialRecord",
        financialSummary: "financialSummary",
        jobPosting: "jobPosting",
        jobApplication: "jobApplication",
        workerProfile: "workerProfile",
        auditLog: "auditLog",
        attendance: "attendance",
        notification: "notification",
        event: "event",
        eventRSVP: "eventRSVP",
        passwordResetToken: "passwordResetToken",
        mediaFile: "mediaFile",
    };

    for (const model of models) {
        try {
            const prismaModel = modelMap[model];
            const dbModel = prisma[prismaModel] as { count?: () => Promise<number> } | undefined;
            if (prismaModel && dbModel && typeof dbModel.count === "function") {
                const count = await dbModel.count();
                counts[model] = count;
            } else {
                counts[model] = 0;
            }
        } catch {
            counts[model] = 0;
        }
    }

    return {
        totalRecords: Object.values(counts).reduce((a, b) => a + b, 0),
        byCollection: counts,
    };
}
