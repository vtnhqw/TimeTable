import { handleExtraction } from "@/lib/extraction/server";
export const runtime = "nodejs";
export const maxDuration = 120;
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  return handleExtraction(request);
}
