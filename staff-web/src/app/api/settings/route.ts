import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getApiIdentity } from "@/lib/api-identity";
import { logAudit, getClientIp } from "@/lib/audit";

const EDITABLE_SETTINGS = [
  "site_name", "site_tagline", "contact_email", "contact_phone",
  "address", "kiosk_rotation_interval",
] as const;
const editable = new Set<string>(EDITABLE_SETTINGS);

function validate(key: string, value: unknown): string | null {
  if (!editable.has(key) || typeof value !== "string") return null;
  const trimmed = value.trim();
  if (key === "site_name" && (!trimmed || trimmed.length > 120)) return null;
  if (key === "site_tagline" && trimmed.length > 250) return null;
  if (key === "contact_email" && trimmed &&
      (trimmed.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed))) return null;
  if (key === "contact_phone" && trimmed.length > 80) return null;
  if (key === "address" && trimmed.length > 400) return null;
  if (key === "kiosk_rotation_interval" && (!/^\d+$/.test(trimmed) ||
      Number(trimmed) < 5 || Number(trimmed) > 60)) return null;
  return trimmed;
}

export async function GET(req: NextRequest) {
  const actor = await getApiIdentity(req);
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (actor.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const settings = await prisma.siteSetting.findMany({
    where: { key: { in: [...EDITABLE_SETTINGS] } },
    orderBy: { key: "asc" },
  });
  return NextResponse.json({
    settings: Object.fromEntries(settings.map(s => [s.key, s.value])),
  }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(req: NextRequest) {
  const actor = await getApiIdentity(req);
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (actor.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body: unknown = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body))
    return NextResponse.json({ error: "Invalid settings" }, { status: 400 });
  const entries = Object.entries(body);
  if (!entries.length || entries.length > EDITABLE_SETTINGS.length)
    return NextResponse.json({ error: "No editable settings provided" }, { status: 400 });
  const changes: { key: string; value: string }[] = [];
  for (const [key, raw] of entries) {
    const value = validate(key, raw);
    if (value === null)
      return NextResponse.json({ error: `Invalid or unsupported setting: ${key}` }, { status: 400 });
    changes.push({ key, value });
  }
  await prisma.$transaction(changes.map(({ key, value }) =>
    prisma.siteSetting.upsert({
      where: { key }, update: { value }, create: { key, value },
    })
  ));
  await logAudit({ action: "update_site_settings", userId: String(actor.id),
    details: `Updated settings: ${changes.map(c => c.key).join(", ")}`,
    ipAddress: getClientIp(req) });
  return NextResponse.json({ success: true, count: changes.length }, {
    headers: { "Cache-Control": "no-store" },
  });
}
