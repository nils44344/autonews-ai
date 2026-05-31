import { prisma } from "../src/lib/db";
(async () => {
  const logs = await prisma.jobLog.findMany({ where: { job: "x-post" }, orderBy: { createdAt: "desc" }, take: 5 });
  console.log("x-post logs:", JSON.stringify(logs, null, 2));
  const recent = await prisma.article.findMany({
    where: { type: "NEWS", status: "PUBLISHED", publishedAt: { gte: new Date(Date.now() - 6*3600*1000) } },
    select: { title: true, publishedAt: true },
    orderBy: { publishedAt: "desc" }
  });
  console.log("news published last 6h:", recent.length);
  for (const r of recent) console.log(" -", r.publishedAt?.toISOString(), r.title);
  await prisma.$disconnect();
})();
