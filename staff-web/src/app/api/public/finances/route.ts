import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const [records, summary] = await Promise.all([
      prisma.financialRecord.findMany({ 
        orderBy: [{ year: "desc" }, { month: "desc" }] 
      }),
      prisma.financialSummary.findFirst({ orderBy: { lastUpdated: "desc" } }),
    ]);

    return NextResponse.json({ records, summary });
  } catch (error) {
    console.error("Error fetching finances:", error);
    return NextResponse.json({ error: "Failed to fetch finances" }, { status: 500 });
  }
}
