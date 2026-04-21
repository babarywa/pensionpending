import { Router } from "express";
import { db, jobsTable } from "@workspace/db";
import { eq, and, ilike, sql, desc, gte, or } from "drizzle-orm";
import { ListJobsQueryParams } from "@workspace/api-zod";

const router = Router();

router.get("/", async (req, res) => {
  const parsed = ListJobsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid query params" });
  }

  const { page, limit, pension, location, category, employer, search, preview } = parsed.data;
  const offset = (page - 1) * limit;

  const conditions = [eq(jobsTable.isActive, true)];

  if (pension) conditions.push(eq(jobsTable.pensionPlan, pension));
  if (location) conditions.push(ilike(jobsTable.location, `%${location}%`));
  if (category) conditions.push(eq(jobsTable.category, category));
  if (employer) conditions.push(ilike(jobsTable.employer, `%${employer}%`));
  if (search) {
    conditions.push(
      or(
        ilike(jobsTable.title, `%${search}%`),
        ilike(jobsTable.employer, `%${search}%`),
        ilike(jobsTable.description, `%${search}%`)
      )!
    );
  }

  const where = and(...conditions);

  const [countResult, jobs] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(jobsTable).where(where),
    db
      .select()
      .from(jobsTable)
      .where(where)
      .orderBy(desc(jobsTable.postedAt))
      .limit(preview ? Math.min(limit, 6) : limit)
      .offset(preview ? 0 : offset),
  ]);

  const total = countResult[0]?.count ?? 0;

  return res.json({
    jobs: jobs.map(j => ({
      ...j,
      salaryMin: j.salaryMin ? Number(j.salaryMin) : null,
      salaryMax: j.salaryMax ? Number(j.salaryMax) : null,
    })),
    total,
    page,
    limit,
    hasMore: offset + jobs.length < total,
  });
});

router.get("/:jobId", async (req, res) => {
  const jobId = parseInt(req.params.jobId ?? "");
  if (isNaN(jobId)) return res.status(400).json({ error: "Invalid job ID" });

  const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, jobId));
  if (!job) return res.status(404).json({ error: "Not found" });

  return res.json({
    ...job,
    salaryMin: job.salaryMin ? Number(job.salaryMin) : null,
    salaryMax: job.salaryMax ? Number(job.salaryMax) : null,
  });
});

export default router;
