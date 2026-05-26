import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authorizeRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { approveAndPublish } from "@/lib/publish";

const schema = z.object({
  id: z.string(),
  action: z.enum(["approve", "reject"]),
});

// Editor approval workflow used in manual publishing mode.
export async function POST(req: Request) {
  if (!authorizeRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const { id, action } = parsed.data;

  if (action === "reject") {
    await prisma.article.update({ where: { id }, data: { status: "REJECTED" } });
    return NextResponse.json({ ok: true, status: "REJECTED" });
  }

  const result = await approveAndPublish(id);
  revalidatePath("/");
  if (result.published) {
    const path = result.article.type === "BLOG" ? "/blog" : "/article";
    revalidatePath(`${path}/${result.article.slug}`);
  }
  return NextResponse.json({ ok: true, ...result });
}
