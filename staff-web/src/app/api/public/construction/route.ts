import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const projects = await prisma.constructionProject.findMany({
      orderBy: [{ isUrgent: "desc" }, { progressPercent: "desc" }],
      select: {
        id: true,
        title: true,
        description: true,
        progressPercent: true,
        isUrgent: true,
      },
    });

    return NextResponse.json({ projects });
  } catch (error) {
    console.error("Error fetching construction projects:", error);
    return NextResponse.json({ projects: [] });
  }
}
