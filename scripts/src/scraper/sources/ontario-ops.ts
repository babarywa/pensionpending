import * as cheerio from "cheerio";
import { makeClient, fetchWithRetry, sleep } from "../http.js";
import type { ScrapedJob } from "../types.js";
import { parseSalary } from "../detect.js";

const EMPLOYER = "Ontario Public Service";

const URLS = [
  { base: "https://www.gojobs.gov.on.ca", path: "/Jobs.aspx" },
  { base: "https://www.gojobs.gov.on.ca", path: "/jobs.aspx" },
];

export async function scrapeOntarioOPS(): Promise<ScrapedJob[]> {
  const jobs: ScrapedJob[] = [];

  for (const { base, path } of URLS) {
    const client = makeClient({ baseURL: base });
    let html = "";

    try {
      html = await fetchWithRetry<string>(client, path, {
        params: { Page: "1", RecordsPerPage: "100", ExpiryDate: "N", Status: "Open" },
      });
    } catch (e: any) {
      console.warn(`  [ontario-ops] ${base}${path} failed: ${e.message}`);
      continue;
    }

    if (!html || html.length < 500) continue;

    const $ = cheerio.load(html);

    const selectors = [
      ".jobPostingItem, .job-posting-item",
      "#gvJobs tbody tr:not(.header)",
      "table[id*='Jobs'] tbody tr",
      "table[id*='grid'] tbody tr",
      ".JobTitle, a.JobTitle",
      "a[href*='JobDetail'], a[href*='jobDetail'], a[href*='job-detail']",
    ];

    for (const sel of selectors) {
      const els = $(sel);
      if (els.length === 0) continue;

      if (sel.startsWith("a[") || sel.startsWith(".JobTitle")) {
        els.each((_i, el) => {
          const $el = $(el);
          const title = $el.text().trim();
          const href = $el.attr("href") ?? "";
          if (!title || title.length < 3) return;
          const applyUrl = href.startsWith("http") ? href : `${base}/${href.replace(/^\//, "")}`;
          const parent = $el.closest("tr, div");
          const locText = parent.find("td:nth-child(3), .city, .location").text().trim() || "Toronto";
          const city = locText.split(",")[0].trim();
          const deptText = parent.find("td:nth-child(2), .organization").text().trim() || EMPLOYER;
          const salText = parent.find("td:nth-child(4), .salary").text().trim();
          const salary = parseSalary(salText);
          jobs.push({
            title,
            employer: deptText || EMPLOYER,
            location: city || "Toronto",
            province: "ON",
            description: `${title} with the Ontario Public Service. OPSPP defined benefit pension.`,
            applyUrl,
            pensionPlan: "Ontario Public Service Pension Plan (OPSPP)",
            ...salary,
          });
        });
      } else {
        els.each((_i, el) => {
          const $el = $(el);
          const titleEl = $el.find("a.title, a.JobTitle, a[href*='Job'], a").first();
          const title = titleEl.text().trim();
          const href = titleEl.attr("href") ?? "";
          if (!title || title.length < 3) return;
          const applyUrl = href.startsWith("http") ? href : `${base}/${href.replace(/^\//, "")}`;
          const tds = $el.find("td");
          const locText = tds.eq(2).text().trim() || "Toronto";
          const city = locText.split(",")[0].trim();
          const deptText = tds.eq(1).text().trim() || EMPLOYER;
          const salText = tds.eq(3).text().trim();
          const closingText = tds.eq(4).text().trim();
          let closingDate: Date | undefined;
          if (closingText) {
            const d = new Date(closingText);
            if (!isNaN(d.getTime())) closingDate = d;
          }
          const salary = parseSalary(salText);
          jobs.push({
            title,
            employer: deptText || EMPLOYER,
            location: city || "Toronto",
            province: "ON",
            description: `${title} — ${deptText || EMPLOYER}. Ontario Public Service Pension Plan.`,
            applyUrl,
            closingDate,
            pensionPlan: "Ontario Public Service Pension Plan (OPSPP)",
            ...salary,
          });
        });
      }

      if (jobs.length > 0) break;
    }

    if (jobs.length > 0) break;
    await sleep(600);
  }

  return jobs;
}
