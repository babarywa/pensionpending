import * as cheerio from "cheerio";
import { makeClient, fetchWithRetry, sleep } from "../http.js";
import type { ScrapedJob } from "../types.js";
import { parseSalary, detectPensionPlan, detectCategory } from "../detect.js";

const BASE = "https://www.jobbank.gc.ca";

interface SearchQuery {
  searchstring: string;
  fprov?: string;
  sort?: string;
}

const SEARCH_QUERIES: SearchQuery[] = [
  { searchstring: "city of", sort: "D" },
  { searchstring: "municipal", sort: "D" },
  { searchstring: "police service", sort: "D" },
  { searchstring: "police officer", sort: "D" },
  { searchstring: "public service", sort: "D" },
  { searchstring: "government", sort: "D" },
  { searchstring: "fire department", sort: "D" },
  { searchstring: "library", sort: "D" },
];

function parseLocation(locText: string): { city: string; province: string } {
  const clean = locText.replace(/\s+/g, " ").trim();
  const m = clean.match(/([^(,]+?)\s*\(([A-Z]{2})\)/);
  if (m) {
    return { city: m[1].trim(), province: m[2] };
  }
  const m2 = clean.match(/([^,]+),\s*([A-Z]{2})\s*$/);
  if (m2) {
    return { city: m2[1].trim(), province: m2[2] };
  }
  return { city: clean || "Canada", province: "ON" };
}

function cleanJobBankUrl(href: string): string {
  const noSession = href.replace(/;jsessionid=[^?]*/i, "");
  const url = new URL(noSession.startsWith("http") ? noSession : `${BASE}${noSession}`);
  url.search = "";
  return url.toString();
}

async function scrapeJobBankPage(
  client: ReturnType<typeof makeClient>,
  query: SearchQuery,
  seenUrls: Set<string>
): Promise<ScrapedJob[]> {
  const jobs: ScrapedJob[] = [];
  let page = 1;

  while (page <= 2) {
    let html: string;
    try {
      html = await fetchWithRetry<string>(client, "/jobsearch/jobsearch", {
        params: {
          searchstring: query.searchstring,
          fprov: query.fprov ?? "",
          sort: query.sort ?? "D",
          noc: "",
          mcity: "",
          pg: String(page),
        },
      });
    } catch (e: any) {
      console.warn(`    [jobbank] query "${query.searchstring}" page ${page} failed: ${e.message}`);
      break;
    }

    const $ = cheerio.load(html);
    let found = 0;

    $(".resultJobItem").each((_i, el) => {
      const $el = $(el);

      const title = $el.find(".noctitle").text().trim();
      if (!title || title.length < 3 || title.length > 200) return;

      const employer = $el.find("li.business").text().trim();
      if (!employer) return;

      const locRaw = $el.find("li.location").text().trim();
      const { city, province } = parseLocation(locRaw);

      const dateText = $el.find("li.date").text().trim();
      let postedAt: Date | undefined;
      if (dateText) {
        const d = new Date(dateText);
        if (!isNaN(d.getTime())) postedAt = d;
      }

      const salText = $el.find("li.salary").text().replace(/salary/i, "").trim();
      const salary = parseSalary(salText);

      const rawHref = $el.attr("href") ?? "";
      if (!rawHref) return;
      const applyUrl = cleanJobBankUrl(rawHref);

      if (seenUrls.has(applyUrl)) return;
      seenUrls.add(applyUrl);

      const description = `${title} at ${employer}. ${city}, ${province}. Apply via Job Bank Canada.`;

      jobs.push({
        title,
        employer,
        location: city || "Canada",
        province: province || "ON",
        description,
        applyUrl,
        postedAt,
        ...salary,
      });
      found++;
    });

    console.log(`    query="${query.searchstring}" page=${page}: ${found} jobs`);
    if (found === 0) break;
    page++;
    await sleep(500);
  }

  return jobs;
}

export async function scrapeJobBank(): Promise<ScrapedJob[]> {
  const client = makeClient({ baseURL: BASE });
  const allJobs: ScrapedJob[] = [];
  const seenUrls = new Set<string>();

  for (const query of SEARCH_QUERIES) {
    const jobs = await scrapeJobBankPage(client, query, seenUrls);
    allJobs.push(...jobs);
    await sleep(400);
  }

  return allJobs;
}
