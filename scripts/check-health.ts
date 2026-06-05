import { prisma } from "../src/lib/db";
(async () => {
  const h = await prisma.jobLog.findMany({
    where: { job: "health" }, orderBy: { createdAt: "desc" }, take: 6,
    select: { status: true, message: true, createdAt: true }
  });
  for (const r of h) console.log(r.createdAt.toISOString(), r.status, "|", (r.message || "").slice(0, 120));
  await prisma.$disconnect();
})();
