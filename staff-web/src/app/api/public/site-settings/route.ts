import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const values = await prisma.siteSetting.findMany({
    where: { key: { in: [
      "site_name", "site_tagline", "contact_email", "contact_phone", "address",
      "kiosk_rotation_interval",
    ] } },
    select: { key: true, value: true },
  });
  const settings = Object.fromEntries(values.map(row => [row.key, row.value]));
  return NextResponse.json({
    siteName: settings.site_name || "Masjid Al-Momineen",
    siteTagline: settings.site_tagline || "",
    email: settings.contact_email || "",
    phone: settings.contact_phone || "",
    address: settings.address || "",
    kioskRotationSeconds: Math.max(5, Math.min(60,
      Number(settings.kiosk_rotation_interval) || 8)),
  }, { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=120" } });
}
