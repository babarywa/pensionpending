import { db, jobsTable } from "@workspace/db";
import { eq, inArray } from "drizzle-orm";
import type { ScrapedJob } from "./types.js";
import { detectPensionPlan, detectCategory } from "./detect.js";

export async function getExistingUrls(): Promise<Set<string>> {
  const rows = await db
    .select({ applyUrl: jobsTable.applyUrl })
    .from(jobsTable);
  return new Set(rows.map((r) => r.applyUrl));
}

export async function insertJobs(
  jobs: ScrapedJob[],
  dryRun = false
): Promise<number> {
  if (jobs.length === 0) return 0;

  const rows = jobs.map((j) => ({
    title: j.title.slice(0, 250),
    employer: j.employer.slice(0, 250),
    pensionPlan:
      j.pensionPlan ??
      detectPensionPlan(j.employer, j.province, j.title),
    location: j.location.slice(0, 150),
    province: j.province.slice(0, 10),
    category: j.category ?? detectCategory(j.title),
    salaryMin: j.salaryMin ? String(j.salaryMin) : null,
    salaryMax: j.salaryMax ? String(j.salaryMax) : null,
    salaryText: j.salaryText ?? null,
    description: (j.description || `${j.title} at ${j.employer} in ${j.location}, ${j.province}. See original posting for full details.`).slice(0, 5000),
    applyUrl: j.applyUrl,
    postedAt: j.postedAt ?? new Date(),
    closingDate: j.closingDate ?? null,
    isActive: true,
    scrapedAt: new Date(),
  }));

  if (dryRun) {
    console.log(`  [dry-run] would insert ${rows.length} jobs`);
    rows.slice(0, 3).forEach((r) =>
      console.log(`    → ${r.title} @ ${r.employer} (${r.province}) [${r.pensionPlan}]`)
    );
    return rows.length;
  }

  const CHUNK = 50;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    await db.insert(jobsTable).values(chunk);
    inserted += chunk.length;
  }
  return inserted;
}
