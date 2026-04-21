import { getExistingUrls, insertJobs } from "./db.js";
import type { Source, ScrapedJob, SourceResult } from "./types.js";
import { sleep } from "./http.js";

import { scrapeGcJobs } from "./sources/gc-jobs.js";
import { scrapeOntarioOPS } from "./sources/ontario-ops.js";
import { scrapeToronto } from "./sources/toronto.js";
import { scrapeOttawa } from "./sources/ottawa.js";
import { scrapePeel } from "./sources/peel.js";
import { scrapeYork } from "./sources/york.js";
import { scrapeHamilton } from "./sources/hamilton.js";
import { scrapeMississauga } from "./sources/mississauga.js";
import { scrapeTorontoPolice } from "./sources/toronto-police.js";
import { scrapeBCPublicService } from "./sources/bc-public.js";
import { scrapeVancouver } from "./sources/vancouver.js";
import { scrapeAlberta } from "./sources/alberta.js";
import { scrapeCalgary } from "./sources/calgary.js";
import { scrapeEdmonton } from "./sources/edmonton.js";
import { scrapeWinnipeg } from "./sources/winnipeg.js";
import { scrapeJobBank } from "./sources/jobbank.js";

const SOURCES: Source[] = [
  { name: "Job Bank Canada (national)", scrape: scrapeJobBank },
  { name: "Government of Canada (PSC)", scrape: scrapeGcJobs },
  { name: "Ontario Public Service", scrape: scrapeOntarioOPS },
  { name: "City of Toronto (Taleo)", scrape: scrapeToronto },
  { name: "City of Ottawa (Taleo)", scrape: scrapeOttawa },
  { name: "Region of Peel (Taleo)", scrape: scrapePeel },
  { name: "York Region (Taleo)", scrape: scrapeYork },
  { name: "City of Hamilton (Taleo)", scrape: scrapeHamilton },
  { name: "City of Mississauga (Taleo)", scrape: scrapeMississauga },
  { name: "Toronto Police Service", scrape: scrapeTorontoPolice },
  { name: "BC Public Service", scrape: scrapeBCPublicService },
  { name: "City of Vancouver", scrape: scrapeVancouver },
  { name: "Government of Alberta", scrape: scrapeAlberta },
  { name: "City of Calgary (Taleo)", scrape: scrapeCalgary },
  { name: "City of Edmonton (Taleo)", scrape: scrapeEdmonton },
  { name: "City of Winnipeg (Taleo)", scrape: scrapeWinnipeg },
];

const isDryRun = process.argv.includes("--dry-run");
const sourceFilter = process.argv.find((a) => a.startsWith("--source="))?.split("=")[1];

async function runAndInsertSource(
  source: Source,
  existingUrls: Set<string>
): Promise<{ scraped: number; inserted: number; error?: string }> {
  console.log(`\n▶ [${source.name}]`);
  let jobs: ScrapedJob[];
  try {
    jobs = await source.scrape();
    console.log(`  ✓ scraped ${jobs.length} jobs`);
  } catch (e: any) {
    const msg = e?.message ?? String(e);
    console.error(`  ✗ failed: ${msg}`);
    return { scraped: 0, inserted: 0, error: msg };
  }

  const newJobs = jobs.filter(
    (j) =>
      j.applyUrl &&
      j.applyUrl.startsWith("http") &&
      j.title.trim().length > 2 &&
      !existingUrls.has(j.applyUrl)
  );

  if (newJobs.length === 0) {
    console.log(`  → 0 new jobs (all already in DB)`);
    return { scraped: jobs.length, inserted: 0 };
  }

  console.log(`  → ${newJobs.length} new jobs, inserting...`);
  try {
    const inserted = await insertJobs(newJobs, isDryRun);
    newJobs.forEach((j) => existingUrls.add(j.applyUrl));
    console.log(`  ✓ inserted ${isDryRun ? "(dry run)" : inserted}`);

    if (isDryRun) {
      newJobs.slice(0, 3).forEach((j) =>
        console.log(`    → ${j.title} @ ${j.employer} (${j.province}) [${j.pensionPlan ?? "unknown"}]`)
      );
    }
    return { scraped: jobs.length, inserted: isDryRun ? 0 : inserted };
  } catch (e: any) {
    console.error(`  ✗ Insert failed: ${e.message}`);
    return { scraped: jobs.length, inserted: 0, error: e.message };
  }
}

async function main() {
  const start = Date.now();
  console.log("═══════════════════════════════════════════════════════");
  console.log("  PensionPending ETL Scraper");
  console.log(`  Mode: ${isDryRun ? "DRY RUN" : "LIVE"}`);
  if (sourceFilter) console.log(`  Filter: ${sourceFilter}`);
  console.log("═══════════════════════════════════════════════════════");

  const sources = sourceFilter
    ? SOURCES.filter((s) => s.name.toLowerCase().includes(sourceFilter.toLowerCase()))
    : SOURCES;

  if (sources.length === 0) {
    console.error(`No sources match filter: "${sourceFilter}"`);
    process.exit(1);
  }

  console.log(`\nLoading existing job URLs from database...`);
  let existingUrls: Set<string>;
  try {
    existingUrls = await getExistingUrls();
    console.log(`  Found ${existingUrls.size} existing jobs in DB`);
  } catch (e: any) {
    console.error(`  ✗ DB connection failed: ${e.message}`);
    console.error("  Make sure DATABASE_URL is set.");
    process.exit(1);
  }

  let totalScraped = 0;
  let totalInserted = 0;
  let totalErrors = 0;

  for (const source of sources) {
    const r = await runAndInsertSource(source, existingUrls);
    totalScraped += r.scraped;
    totalInserted += r.inserted;
    if (r.error) totalErrors++;
    await sleep(600);
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log("\n═══════════════════════════════════════════════════════");
  console.log("  SUMMARY");
  console.log("═══════════════════════════════════════════════════════");
  console.log(`  Sources run:     ${sources.length}`);
  console.log(`  Errors:          ${totalErrors}`);
  console.log(`  Total scraped:   ${totalScraped}`);
  console.log(`  Inserted:        ${isDryRun ? "0 (dry run)" : String(totalInserted)}`);
  console.log(`  Time:            ${elapsed}s`);
  console.log("═══════════════════════════════════════════════════════\n");

  if (!isDryRun && totalInserted > 0) {
    console.log(`  ✓ Added ${totalInserted} new jobs to the database.`);
  }

  process.exit(0);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
