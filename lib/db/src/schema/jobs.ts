import { pgTable, serial, text, timestamp, boolean, numeric, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const jobsTable = pgTable("jobs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  employer: text("employer").notNull(),
  pensionPlan: text("pension_plan").notNull(),
  location: text("location").notNull(),
  province: text("province").notNull(),
  category: text("category").notNull(),
  salaryMin: numeric("salary_min"),
  salaryMax: numeric("salary_max"),
  salaryText: text("salary_text"),
  description: text("description").notNull(),
  applyUrl: text("apply_url").notNull(),
  postedAt: timestamp("posted_at").notNull().defaultNow(),
  closingDate: timestamp("closing_date"),
  isActive: boolean("is_active").notNull().default(true),
  scrapedAt: timestamp("scraped_at").notNull().defaultNow(),
}, (table) => [
  index("jobs_pension_plan_idx").on(table.pensionPlan),
  index("jobs_category_idx").on(table.category),
  index("jobs_province_idx").on(table.province),
  index("jobs_posted_at_idx").on(table.postedAt),
  index("jobs_is_active_idx").on(table.isActive),
]);

export const insertJobSchema = createInsertSchema(jobsTable).omit({ id: true, scrapedAt: true });
export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobsTable.$inferSelect;
