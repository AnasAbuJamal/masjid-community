import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

interface SearchResult {
    type: string;
    id: string;
    title: string;
    subtitle: string;
    link: string;
    highlight?: string;
}

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = req.nextUrl;
    const query = searchParams.get("q");
    const types = searchParams.get("types")?.split(",") || ["all"];
    const limit = parseInt(searchParams.get("limit") || "20");

    if (!query || query.length < 2) {
        return NextResponse.json({ error: "Query must be at least 2 characters" }, { status: 400 });
    }

    const searchTerm = query.toLowerCase();
    const results: SearchResult[] = [];

    const shouldSearch = (type: string) => types.includes("all") || types.includes(type);

    try {
        if (shouldSearch("users")) {
            const users = await prisma.user.findMany({
                where: {
                    OR: [
                        { email: { contains: searchTerm } },
                        { firstName: { contains: searchTerm } },
                        { lastName: { contains: searchTerm } },
                    ],
                },
                select: { id: true, email: true, firstName: true, lastName: true, role: true },
                take: limit,
            });
            users.forEach((user) => {
                results.push({
                    type: "user",
                    id: user.id,
                    title: `${user.firstName} ${user.lastName}`,
                    subtitle: `${user.email} • ${user.role}`,
                    link: `/dashboard/users?highlight=${user.id}`,
                });
            });
        }

        if (shouldSearch("students")) {
            const students = await prisma.student.findMany({
                where: {
                    OR: [
                        { firstName: { contains: searchTerm } },
                        { lastName: { contains: searchTerm } },
                        { studentId: { contains: searchTerm } },
                        { parentName: { contains: searchTerm } },
                    ],
                },
                select: { id: true, firstName: true, lastName: true, studentId: true, class: { select: { name: true } } },
                take: limit,
            });
            students.forEach((student) => {
                results.push({
                    type: "student",
                    id: student.id,
                    title: `${student.firstName} ${student.lastName}`,
                    subtitle: `ID: ${student.studentId} • ${student.class?.name || "No class"}`,
                    link: `/dashboard/classroom?highlight=${student.id}`,
                });
            });
        }

        if (shouldSearch("blog")) {
            const posts = await prisma.blogPost.findMany({
                where: {
                    OR: [
                        { title: { contains: searchTerm } },
                        { body: { contains: searchTerm } },
                    ],
                },
                select: { id: true, title: true, slug: true, status: true },
                take: limit,
            });
            posts.forEach((post) => {
                results.push({
                    type: "blog",
                    id: post.id,
                    title: post.title,
                    subtitle: `Status: ${post.status}`,
                    link: `/dashboard/blog?highlight=${post.id}`,
                });
            });
        }

        if (shouldSearch("jobs")) {
            const jobs = await prisma.jobPosting.findMany({
                where: {
                    OR: [
                        { title: { contains: searchTerm } },
                        { company: { contains: searchTerm } },
                        { description: { contains: searchTerm } },
                    ],
                },
                select: { id: true, title: true, company: true, status: true },
                take: limit,
            });
            jobs.forEach((job) => {
                results.push({
                    type: "job",
                    id: job.id,
                    title: job.title,
                    subtitle: `${job.company} • ${job.status}`,
                    link: `/dashboard/jobs?highlight=${job.id}`,
                });
            });
        }

        if (shouldSearch("workers")) {
            const workers = await prisma.workerProfile.findMany({
                where: {
                    OR: [
                        { fullName: { contains: searchTerm } },
                        { email: { contains: searchTerm } },
                        { headline: { contains: searchTerm } },
                    ],
                },
                select: { id: true, fullName: true, email: true, status: true },
                take: limit,
            });
            workers.forEach((worker) => {
                results.push({
                    type: "worker",
                    id: worker.id,
                    title: worker.fullName,
                    subtitle: `${worker.email} • ${worker.status}`,
                    link: `/dashboard/workers?highlight=${worker.id}`,
                });
            });
        }

        if (shouldSearch("proposals")) {
            const proposals = await prisma.projectProposal.findMany({
                where: {
                    OR: [
                        { title: { contains: searchTerm } },
                        { summary: { contains: searchTerm } },
                        { submitterName: { contains: searchTerm } },
                    ],
                },
                select: { id: true, title: true, submitterName: true, status: true },
                take: limit,
            });
            proposals.forEach((proposal) => {
                results.push({
                    type: "proposal",
                    id: proposal.id,
                    title: proposal.title,
                    subtitle: `By ${proposal.submitterName} • ${proposal.status}`,
                    link: `/dashboard/proposals?highlight=${proposal.id}`,
                });
            });
        }

        if (shouldSearch("volunteers")) {
            const volunteers = await prisma.volunteerOpportunity.findMany({
                where: {
                    OR: [
                        { title: { contains: searchTerm } },
                        { description: { contains: searchTerm } },
                    ],
                },
                select: { id: true, title: true, status: true, eventDate: true },
                take: limit,
            });
            volunteers.forEach((vol) => {
                results.push({
                    type: "volunteer",
                    id: vol.id,
                    title: vol.title,
                    subtitle: `${vol.status} • ${new Date(vol.eventDate).toLocaleDateString()}`,
                    link: `/dashboard/volunteers?highlight=${vol.id}`,
                });
            });
        }

        if (shouldSearch("construction")) {
            const projects = await prisma.constructionProject.findMany({
                where: {
                    OR: [
                        { title: { contains: searchTerm } },
                        { description: { contains: searchTerm } },
                    ],
                },
                select: { id: true, title: true, progressPercent: true, isUrgent: true },
                take: limit,
            });
            projects.forEach((project) => {
                results.push({
                    type: "construction",
                    id: project.id,
                    title: project.title,
                    subtitle: `${project.progressPercent}% complete${project.isUrgent ? " • URGENT" : ""}`,
                    link: `/dashboard/construction?highlight=${project.id}`,
                });
            });
        }

        if (shouldSearch("classes")) {
            const classes = await prisma.class.findMany({
                where: {
                    OR: [
                        { name: { contains: searchTerm } },
                        { teacherName: { contains: searchTerm } },
                    ],
                },
                select: { id: true, name: true, teacherName: true, schedule: true },
                take: limit,
            });
            classes.forEach((cls) => {
                results.push({
                    type: "class",
                    id: cls.id,
                    title: cls.name,
                    subtitle: `${cls.teacherName} • ${cls.schedule}`,
                    link: `/dashboard/classroom?highlight=${cls.id}`,
                });
            });
        }

        return NextResponse.json({
            query,
            results,
            total: results.length,
            types: {
                all: results.length,
                users: results.filter((r) => r.type === "user").length,
                students: results.filter((r) => r.type === "student").length,
                blog: results.filter((r) => r.type === "blog").length,
                jobs: results.filter((r) => r.type === "job").length,
                workers: results.filter((r) => r.type === "worker").length,
                proposals: results.filter((r) => r.type === "proposal").length,
                volunteers: results.filter((r) => r.type === "volunteer").length,
                construction: results.filter((r) => r.type === "construction").length,
                classes: results.filter((r) => r.type === "class").length,
            },
        });
    } catch (error) {
        console.error("Search error:", error);
        return NextResponse.json({ error: "Search failed" }, { status: 500 });
    }
}
