import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    let content = await prisma.kioskContent.findFirst();
    if (!content) {
      content = await prisma.kioskContent.create({
        data: {
          masjidName: "Masjid Al-Momineen",
          donationEnabled: true,
        },
      });
    }
    return NextResponse.json({ content });
  } catch (error) {
    console.error("Error fetching kiosk content:", error);
    return NextResponse.json({ error: "Failed to fetch kiosk content" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { bannerImage, masjidName, welcomeMessage, donationEnabled, donationUrl, footerText } = body;

    let content = await prisma.kioskContent.findFirst();
    if (content) {
      content = await prisma.kioskContent.update({
        where: { id: content.id },
        data: {
          ...(bannerImage !== undefined && { bannerImage }),
          ...(masjidName !== undefined && { masjidName }),
          ...(welcomeMessage !== undefined && { welcomeMessage }),
          ...(donationEnabled !== undefined && { donationEnabled }),
          ...(donationUrl !== undefined && { donationUrl }),
          ...(footerText !== undefined && { footerText }),
        },
      });
    } else {
      content = await prisma.kioskContent.create({
        data: {
          bannerImage: bannerImage || null,
          masjidName: masjidName || "Masjid Al-Momineen",
          welcomeMessage: welcomeMessage || null,
          donationEnabled: donationEnabled !== undefined ? donationEnabled : true,
          donationUrl: donationUrl || null,
          footerText: footerText || null,
        },
      });
    }

    return NextResponse.json({ content, message: "TV content updated successfully" });
  } catch (error) {
    console.error("Error updating kiosk content:", error);
    return NextResponse.json({ error: "Failed to update kiosk content" }, { status: 500 });
  }
}
