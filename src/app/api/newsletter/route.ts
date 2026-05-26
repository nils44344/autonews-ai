import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const schema = z.object({
  email: z.string().email(),
  topics: z.array(z.string()).optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  await prisma.newsletterSubscriber.upsert({
    where: { email: parsed.data.email },
    update: { topics: parsed.data.topics ?? [] },
    create: { email: parsed.data.email, topics: parsed.data.topics ?? [] },
  });

  // A real deployment sends a double-opt-in confirmation email here.
  return NextResponse.json({ ok: true });
}
