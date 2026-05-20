import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

const MONTH_MAP: Record<string, number> = {
    Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
    Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
    January: 1, February: 2, March: 3, April: 4, June: 6,
    July: 7, August: 8, September: 9, October: 10, November: 11, December: 12
};

function getMonthIndex(monthStr: string): number {
    if (!monthStr) return -1;
    const clean = monthStr.trim();
    if (MONTH_MAP[clean] !== undefined) {
        return MONTH_MAP[clean] - 1;
    }
    const parsed = parseInt(clean);
    if (!isNaN(parsed)) {
        return parsed - 1;
    }
    for (const [key, value] of Object.entries(MONTH_MAP)) {
        if (clean.toLowerCase().startsWith(key.toLowerCase())) {
            return value - 1;
        }
    }
    return -1;
}

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = req.nextUrl;
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
    const type = searchParams.get("type") || "all";

    try {
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31, 23, 59, 59);

        const [financialRecords, donations, summary] = await Promise.all([
            prisma.financialRecord.findMany({
                where: {
                    year,
                },
                orderBy: [{ year: "asc" }, { month: "asc" }],
            }),
            prisma.donation.findMany({
                where: {
                    createdAt: {
                        gte: startDate,
                        lte: endDate,
                    },
                    status: "completed",
                },
            }),
            prisma.financialSummary.findFirst({
                orderBy: { lastUpdated: "desc" },
            }),
        ]);

        const monthlyData: Record<string, { month: string; donations: number; expenses: number; net: number }> = {};
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        
        months.forEach((month, index) => {
            monthlyData[month] = {
                month,
                donations: 0,
                expenses: 0,
                net: 0,
            };
        });

        financialRecords.forEach((record) => {
            const monthIndex = getMonthIndex(record.month);
            const monthName = months[monthIndex];
            if (monthName) {
                monthlyData[monthName].expenses = record.expenses;
                monthlyData[monthName].net = record.donations - record.expenses;
            }
        });

        donations.forEach((donation) => {
            const month = new Date(donation.createdAt).getMonth();
            const monthName = months[month];
            if (monthName) {
                monthlyData[monthName].donations += donation.amount;
                monthlyData[monthName].net += donation.amount;
            }
        });

        const totalDonations = donations.reduce((sum, d) => sum + d.amount, 0);
        const totalExpenses = financialRecords.reduce((sum, r) => sum + r.expenses, 0);
        const totalNet = totalDonations - totalExpenses;

        const byCategory = await getDonationsByCampaign(donations);
        const donationTrends = getMonthlyTrends(monthlyData);

        const report = {
            year,
            summary: {
                totalDonations,
                totalExpenses,
                totalNet,
                totalTransactions: donations.length + financialRecords.length,
                averageDonation: donations.length > 0 ? totalDonations / donations.length : 0,
            },
            currentBalance: summary?.bankBalance || 0,
            goalProgress: summary?.totalGoal ? {
                goal: summary.totalGoal,
                raised: summary.totalRaised,
                percentage: Math.round((summary.totalRaised / summary.totalGoal) * 100),
            } : null,
            monthlyBreakdown: Object.values(monthlyData),
            byCategory,
            trends: donationTrends,
            generatedAt: new Date().toISOString(),
        };

        return NextResponse.json(report);
    } catch (error) {
        console.error("Financial report error:", error);
        return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
    }
}

interface DonationData {
    campaign?: string | null;
    amount: number;
    createdAt: Date;
}

async function getDonationsByCampaign(donations: DonationData[]) {
    const campaignTotals: Record<string, number> = {};
    
    donations.forEach((donation) => {
        const campaign = donation.campaign || "General";
        campaignTotals[campaign] = (campaignTotals[campaign] || 0) + donation.amount;
    });

    return Object.entries(campaignTotals)
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount);
}

function getMonthlyTrends(monthlyData: Record<string, { month: string; donations: number; expenses: number; net: number }>) {
    const data = Object.values(monthlyData);
    const donations = data.map((d) => d.donations);
    const expenses = data.map((d) => d.expenses);
    
    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
    const max = (arr: number[]) => Math.max(...arr);
    const min = (arr: number[]) => Math.min(...arr);

    return {
        averageDonations: avg(donations),
        averageExpenses: avg(expenses),
        maxDonationMonth: data.find((d) => d.donations === max(donations))?.month || "",
        maxExpenseMonth: data.find((d) => d.expenses === max(expenses))?.month || "",
        minDonationMonth: data.find((d) => d.donations === min(donations.filter((d) => d > 0)))?.month || "",
    };
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { format } = await req.json();

    const year = new Date().getFullYear();
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    const [financialRecords, donations] = await Promise.all([
        prisma.financialRecord.findMany({
            where: { year },
        }),
        prisma.donation.findMany({
            where: {
                createdAt: { gte: startDate, lte: endDate },
                status: "completed",
            },
        }),
    ]);

    const csvRows: string[] = [];
    csvRows.push("Month,Donations,Expenses,Net");

    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthlyData: Record<string, { donations: number; expenses: number }> = {};

    months.forEach((month, index) => {
        monthlyData[month] = { donations: 0, expenses: 0 };
    });

    financialRecords.forEach((record) => {
        const monthIndex = getMonthIndex(record.month);
        const monthName = months[monthIndex];
        if (monthName) {
            monthlyData[monthName].expenses = record.expenses;
        }
    });

    donations.forEach((donation) => {
        const month = new Date(donation.createdAt).getMonth();
        const monthName = months[month];
        if (monthName) {
            monthlyData[monthName].donations += donation.amount;
        }
    });

    let totalDonations = 0;
    let totalExpenses = 0;

    months.forEach((month) => {
        const data = monthlyData[month];
        const net = data.donations - data.expenses;
        totalDonations += data.donations;
        totalExpenses += data.expenses;
        csvRows.push(`${month},${data.donations.toFixed(2)},${data.expenses.toFixed(2)},${net.toFixed(2)}`);
    });

    csvRows.push("");
    csvRows.push(`Total,${totalDonations.toFixed(2)},${totalExpenses.toFixed(2)},${(totalDonations - totalExpenses).toFixed(2)}`);

    const csvContent = csvRows.join("\n");

    return new NextResponse(csvContent, {
        headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="financial-report-${year}.csv"`,
        },
    });
}
