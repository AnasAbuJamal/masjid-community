import type { NextRequest } from "next/server";
import { POST as submitApplication } from "@/app/api/applications/jobs/[jobId]/route";

// Legacy mobile URL. All job routes share the same [id] dynamic segment.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return submitApplication(req, { params: Promise.resolve({ jobId: id }) });
}
