import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session || !session.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let prefs = await prisma.notificationPreference.findUnique({
        where: { userId: session.user.id },
    });

    if (!prefs) {
        prefs = await prisma.notificationPreference.create({
            data: { userId: session.user.id },
        });
    }

    return NextResponse.json(prefs);
}

export async function PUT(req: NextRequest) {
    const session = await auth();
    if (!session || !session.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const prefs = await prisma.notificationPreference.upsert({
        where: { userId: session.user.id },
        create: { userId: session.user.id, ...body },
        update: body,
    });

    return NextResponse.json(prefs);
}

export async function PATCH(req: NextRequest) {
    const session = await auth();
    if (!session || !session.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { preference, enabled } = await req.json();

    const validPrefs = [
        "emailDonations", "emailVolunteers", "emailProposals", "emailJobs",
        "emailBlog", "emailEvents", "emailGeneral",
        "pushDonations", "pushVolunteers", "pushProposals", "pushJobs",
        "pushBlog", "pushEvents", "pushGeneral",
    ];

    if (!validPrefs.includes(preference)) {
        return NextResponse.json({ error: "Invalid preference" }, { status: 400 });
    }

    const prefs = await prisma.notificationPreference.upsert({
        where: { userId: session.user.id },
        create: { userId: session.user.id, [preference]: enabled },
        update: { [preference]: enabled },
    });

    return NextResponse.json(prefs);
}
