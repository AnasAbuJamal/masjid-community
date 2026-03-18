import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendEmail, shouldNotify, getNotificationEmails } from "@/lib/email";

export async function GET() {
  const workers = await prisma.workerProfile.findMany({
    where: { 
      status: "approved",
      isPublic: true,
    },
    select: {
      id: true,
      fullName: true,
      headline: true,
      bio: true,
      skills: true,
      location: true,
      availability: true,
      portfolioUrl: true,
      photoUrl: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ workers });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      fullName,
      email,
      phone,
      headline,
      bio,
      skills,
      experience,
      education,
      certifications,
      location,
      availability,
      portfolioUrl,
      photoUrl,
    } = body;

    if (!fullName || !email || !headline || !bio || !location) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existingProfile = await prisma.workerProfile.findUnique({
      where: { email },
    });

    if (existingProfile) {
      return NextResponse.json({ error: "A profile with this email already exists" }, { status: 400 });
    }

    const profile = await prisma.workerProfile.create({
      data: {
        fullName,
        email,
        phone,
        headline,
        bio,
        skills: skills || [],
        experience: experience || [],
        education: education || [],
        certifications: certifications || [],
        location,
        availability: availability || "available",
        portfolioUrl,
        photoUrl,
        isPublic: false,
        status: "pending_review",
      },
    });

    if (await shouldNotify("notify_new_worker")) {
      const notifyEmails = await getNotificationEmails();
      if (notifyEmails.length > 0) {
        await sendEmail({
          to: notifyEmails,
          subject: "New Worker Profile Submitted - Al-Momineen",
          html: `
            <h2>Assalamu Alaikum,</h2>
            <p>A new worker profile has been submitted and is awaiting review.</p>
            <h3>Profile Details:</h3>
            <ul>
              <li><strong>Name:</strong> ${fullName}</li>
              <li><strong>Email:</strong> ${email}</li>
              <li><strong>Headline:</strong> ${headline}</li>
              <li><strong>Location:</strong> ${location}</li>
            </ul>
            <p>Please review in the staff portal.</p>
          `,
        });
      }
    }

    return NextResponse.json({ 
      message: "Profile submitted successfully. It will be reviewed shortly.",
      profileId: profile.id 
    }, { status: 201 });
  } catch (error) {
    console.error("Worker profile submission error:", error);
    return NextResponse.json({ error: "Failed to submit profile" }, { status: 500 });
  }
}
