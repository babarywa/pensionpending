import { Router } from "express";
import { db, jobsTable } from "@workspace/db";
import { and, eq, ne, sql, desc, gte } from "drizzle-orm";

const router = Router();

router.get("/summary", async (_req, res) => {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const [totalJobs, totalEmployers, newThisWeek, pensionPlans] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(jobsTable).where(eq(jobsTable.isActive, true)),
    db.select({ count: sql<number>`count(distinct employer)::int` }).from(jobsTable).where(eq(jobsTable.isActive, true)),
    db.select({ count: sql<number>`count(*)::int` }).from(jobsTable).where(
      sql`${jobsTable.postedAt} >= ${oneWeekAgo} and ${jobsTable.isActive} = true`
    ),
    db.select({ count: sql<number>`count(distinct pension_plan)::int` }).from(jobsTable).where(eq(jobsTable.isActive, true)),
  ]);

  return res.json({
    totalJobs: totalJobs[0]?.count ?? 0,
    totalEmployers: totalEmployers[0]?.count ?? 0,
    newThisWeek: newThisWeek[0]?.count ?? 0,
    pensionPlans: pensionPlans[0]?.count ?? 0,
  });
});

router.get("/by-pension", async (_req, res) => {
  const results = await db
    .select({
      pensionPlan: jobsTable.pensionPlan,
      count: sql<number>`count(*)::int`,
    })
    .from(jobsTable)
    .where(and(eq(jobsTable.isActive, true), ne(jobsTable.pensionPlan, "")))
    .groupBy(jobsTable.pensionPlan)
    .orderBy(desc(sql<number>`count(*)`));

  return res.json(results);
});

router.get("/by-category", async (_req, res) => {
  const results = await db
    .select({
      category: jobsTable.category,
      count: sql<number>`count(*)::int`,
    })
    .from(jobsTable)
    .where(and(eq(jobsTable.isActive, true), ne(jobsTable.category, "")))
    .groupBy(jobsTable.category)
    .orderBy(desc(sql<number>`count(*)`));

  return res.json(results);
});

router.get("/recent-jobs", async (_req, res) => {
  const jobs = await db
    .select()
    .from(jobsTable)
    .where(eq(jobsTable.isActive, true))
    .orderBy(desc(jobsTable.postedAt))
    .limit(5);

  return res.json(jobs.map(j => ({
    ...j,
    salaryMin: j.salaryMin ? Number(j.salaryMin) : null,
    salaryMax: j.salaryMax ? Number(j.salaryMax) : null,
  })));
});

export default router;
