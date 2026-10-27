import type { EducationalResource } from "@prisma/client";

export const RESOURCE_TYPES = ["video", "document", "link", "audio", "image"] as const;
export type ResourceType = typeof RESOURCE_TYPES[number];

export const externalHttpsUrl = (value: unknown): value is string => {
  if (typeof value !== "string" || value.length > 2000) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && Boolean(url.hostname) &&
      url.username === "" && url.password === "";
  } catch { return false; }
};

export function serializeResource(resource: EducationalResource) {
  return {
    id: String(resource.id),
    title: resource.title,
    description: resource.description,
    type: resource.type,
    category: resource.category,
    url: resource.url,
    thumbnailUrl: resource.thumbnailUrl || undefined,
    duration: resource.duration || undefined,
    fileSize: resource.fileSize || undefined,
    tags: resource.tags,
    gradeLevels: resource.gradeLevels,
    createdAt: resource.createdAt.toISOString(),
    createdBy: resource.createdBy || "Masjid Education",
    viewCount: resource.viewCount,
    isFeatured: resource.isFeatured,
  };
}

type Input = Record<string, unknown>;
export function parseResourceInput(raw: unknown):
    { ok: true; data: { title: string; description: string; type: string; category: string;
      url: string; tags: string[]; gradeLevels: string[]; thumbnailUrl: string | null;
      duration: number | null; fileSize: number | null; createdBy: string | null;
      isFeatured: boolean; isPublished: boolean } }
      | { ok: false; error: string } {
  if (!raw || typeof raw !== "object" || Array.isArray(raw))
    return { ok: false, error: "Invalid resource data" };
  const input = raw as Input;
  const title = typeof input.title === "string" ? input.title.trim() : "";
  const description = typeof input.description === "string" ? input.description.trim() : "";
  const category = typeof input.category === "string" ? input.category.trim() : "";
  const createdBy = typeof input.createdBy === "string" ? input.createdBy.trim() : "";
  const url = input.url;
  if (!title || title.length > 180 || description.length > 3000 ||
      !category || category.length > 90 ||
      !RESOURCE_TYPES.includes(input.type as ResourceType) ||
      !externalHttpsUrl(url)) return { ok: false, error: "Valid title, type, category and HTTPS resource URL are required" };
  if (input.thumbnailUrl && !externalHttpsUrl(input.thumbnailUrl))
    return { ok: false, error: "Thumbnail must use an HTTPS URL" };
  if (createdBy.length > 120 || typeof input.isFeatured !== "boolean" ||
      typeof input.isPublished !== "boolean")
    return { ok: false, error: "Invalid resource options" };
  const validateTags = (v: unknown) => Array.isArray(v) && v.length <= 15 &&
    v.every(x => typeof x === "string" && x.trim().length > 0 && x.trim().length <= 80);
  if (!validateTags(input.tags ?? []) || !validateTags(input.gradeLevels ?? []))
    return { ok: false, error: "Invalid resource tags or levels" };
  const duration = input.duration === null || input.duration === undefined ? null : Number(input.duration);
  const fileSize = input.fileSize === null || input.fileSize === undefined ? null : Number(input.fileSize);
  if ((duration !== null && (!Number.isSafeInteger(duration) || duration < 0 || duration > 864000)) ||
      (fileSize !== null && (!Number.isSafeInteger(fileSize) || fileSize < 0 || fileSize > 10000000000)))
    return { ok: false, error: "Invalid resource duration or size" };
  return { ok: true, data: {
    title, description, category, type: input.type as string, url: url as string,
    tags: (input.tags as string[] || []).map(x => x.trim()),
    gradeLevels: (input.gradeLevels as string[] || []).map(x => x.trim()),
    thumbnailUrl: (input.thumbnailUrl as string) || null, duration, fileSize,
    createdBy: createdBy || null, isFeatured: input.isFeatured as boolean,
    isPublished: input.isPublished as boolean,
  } };
}
