import prisma from "@/lib/prisma";
import { Prisma, PrismaClient } from "@prisma/client";
import fs from "fs/promises";
import path from "path";
import { logAudit } from "./audit";

export interface BackupResult {
    id: string;
    filename: string;
    size: number;
    collections: number;
    createdAt: Date;
    data: Record<string, unknown>;
}

export async function createBackup(): Promise<BackupResult> {
    const backupDir = path.join(process.cwd(), "backups");
    await fs.mkdir(backupDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `backup-${timestamp}.json`;
    const filepath = path.join(backupDir, filename);

    const collections = [
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

    const backupData: Record<string, unknown[]> = {};
    let totalRecords = 0;

    for (const collection of collections) {
        try {
            const modelName = collection.charAt(0).toUpperCase() + collection.slice(1);
            const prismaModelName = modelName as keyof PrismaClient;
            const model = prisma[prismaModelName] as { findMany?: (args: { omit?: Record<string, boolean> }) => Promise<unknown[]> } | undefined;
            if (model && typeof model.findMany === "function") {
                const records = await model.findMany({
                    omit: collection === "user" ? { passwordHash: true } : undefined,
                }) as Record<string, unknown>[];
                backupData[collection] = records;
                totalRecords += records.length;
            }
        } catch (error) {
            console.error(`Error backing up ${collection}:`, error);
            backupData[collection] = [];
        }
    }

    const backupContent = {
        version: "1.0",
        createdAt: new Date().toISOString(),
        database: "MongoDB",
        collections: totalRecords,
        data: backupData,
    };

    await fs.writeFile(filepath, JSON.stringify(backupContent, null, 2));

    const stats = await fs.stat(filepath);

    await logAudit({
        action: "backup_created",
        details: `Database backup created: ${filename} (${totalRecords} records)`,
        success: true,
    });

    return {
        id: timestamp,
        filename,
        size: stats.size,
        collections: totalRecords,
        createdAt: new Date(),
        data: backupData,
    };
}

export async function listBackups(): Promise<{ filename: string; size: number; createdAt: Date }[]> {
    const backupDir = path.join(process.cwd(), "backups");
    
    try {
        await fs.mkdir(backupDir, { recursive: true });
        const files = await fs.readdir(backupDir);
        
        const backups = await Promise.all(
            files
                .filter((f) => f.endsWith(".json"))
                .map(async (filename) => {
                    const filepath = path.join(backupDir, filename);
                    const stats = await fs.stat(filepath);
                    return {
                        filename,
                        size: stats.size,
                        createdAt: stats.birthtime,
                    };
                })
        );

        return backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch {
        return [];
    }
}

export async function restoreBackup(filename: string): Promise<void> {
    const backupDir = path.join(process.cwd(), "backups");
    const filepath = path.join(backupDir, filename);

    const content = await fs.readFile(filepath, "utf-8");
    const backup = JSON.parse(content);

    if (!backup.data || !backup.version) {
        throw new Error("Invalid backup file format");
    }

    for (const [collection, records] of Object.entries(backup.data)) {
        try {
            const modelName = collection.charAt(0).toUpperCase() + collection.slice(1);
            const prismaModelName = modelName as keyof PrismaClient;
            const model = prisma[prismaModelName] as { deleteMany?: (args: unknown) => Promise<unknown>; create?: (args: { data: Record<string, unknown> }) => Promise<unknown> } | undefined;
            
            if (model && typeof model.deleteMany === "function" && Array.isArray(records)) {
                await model.deleteMany({});
                
                if (records.length > 0) {
                    for (const record of records) {
                        const { id, ...data } = record;
                        if (typeof model.create === "function") {
                            await model.create({ data });
                        }
                    }
                }
            }
        } catch (error) {
            console.error(`Error restoring ${collection}:`, error);
        }
    }

    await logAudit({
        action: "backup_restored",
        details: `Database restored from backup: ${filename}`,
        success: true,
    });
}
