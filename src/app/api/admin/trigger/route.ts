import { NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/auth";
import { enqueue } from "@/lib/queue/queues";

// Manually kick off a trend cycle from the dashboard ("Generate now").
export async function POST(req: Request) {
  if (!authorizeRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const job = await enqueue.trend({ reason: "manual" });
  return NextResponse.json({ ok: true, jobId: job.id });
}
