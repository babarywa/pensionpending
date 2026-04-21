import * as cheerio from "cheerio";
import { makeClient, fetchWithRetry, sleep } from "../http.js";
import type { ScrapedJob } from "../types.js";
import { parseSalary } from "../detect.js";

const BASE = "https://bcpublicservice.hua.hrsmart.com";

export async function scrapeBCPublicService(): Promise<ScrapedJob[]> {
  const client = makeClient({ baseURL: BASE });
  const jobs: ScrapedJob[] = [];

  const endpoints = [
    "/hr/ats/JobSearch/viewAll",
    "/hr/ats/JobSearch/search",
  ];

  let html = "";
  for (const ep of endpoints) {
    try {
      html = await fetchWithRetry<string>(client, ep, {
        params: { lang: "en" },
      });
      if (html && html.length > 500) break;
    } catch {
      // try next
    }
    await sleep(500);
  }

  if (!html) return [];

  const $ = cheerio.load(html);
  const items = $(".job-search-result, .jobItem, .search-results tbody tr, table.jobTable tbody tr");

  items.each((_i, el) => {
    const $el = $(el);
    const titleEl = $el.find("a").first();
    const title = titleEl.text().trim();
    if (!title) return;

    const href = titleEl.attr("href") ?? "";
    const applyUrl = href.startsWith("http") ? href : `${BASE}${href}`;

    const locText = $el.find(".location, td:nth-child(2)").text().trim() || "Victoria, BC";
    const city = locText.split(",")[0].trim();

    const deptText = $el.find(".ministry, .department, td:nth-child(3)").text().trim() || "BC Public Service";
    const salText = $el.find(".salary, td:nth-child(4)").text().trim();
    const closingText = $el.find(".close-date, td:nth-child(5)").text().trim();

    let closingDate: Date | undefined;
    if (closingText) {
      const d = new Date(closingText);
      if (!isNaN(d.getTime())) closingDate = d;
    }

    const salary = parseSalary(salText);
    jobs.push({
      title,
      employer: deptText || "BC Public Service",
      location: city,
      province: "BC",
      description: `${title} with the BC Public Service. Eligible for the BC Public Service Pension Plan.`,
      applyUrl,
      closingDate,
      pensionPlan: "BC Public Service Pension Plan",
      ...salary,
    });
  });

  return jobs;
}
