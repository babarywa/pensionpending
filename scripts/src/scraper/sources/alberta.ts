import * as cheerio from "cheerio";
import { makeClient, fetchWithRetry, sleep } from "../http.js";
import type { ScrapedJob } from "../types.js";
import { parseSalary } from "../detect.js";

const BASE = "https://jobs.alberta.ca";

export async function scrapeAlberta(): Promise<ScrapedJob[]> {
  const client = makeClient({ baseURL: BASE });
  const jobs: ScrapedJob[] = [];

  const endpoints = [
    "/search#q=&t=Jobs",
    "/search",
    "/",
  ];

  let html = "";
  for (const ep of endpoints) {
    try {
      html = await fetchWithRetry<string>(client, ep, {
        params: { q: "", sort: "latest" },
      });
      if (html && html.includes("job") && html.length > 1000) break;
    } catch {
      // try next
    }
    await sleep(500);
  }

  if (!html) return [];

  const $ = cheerio.load(html);
  const items = $(".job-result, .searchResults tbody tr, .job-posting, article.job");

  items.each((_i, el) => {
    const $el = $(el);
    const titleEl = $el.find("a.job-title, h2 a, h3 a, a").first();
    const title = titleEl.text().trim();
    if (!title) return;

    const href = titleEl.attr("href") ?? "";
    const applyUrl = href.startsWith("http") ? href : `${BASE}${href}`;

    const locText = $el.find(".job-location, .location, .city").text().trim() || "Edmonton, AB";
    const city = locText.split(",")[0].trim();

    const deptText = $el.find(".employer, .department, .organization").text().trim() || "Government of Alberta";
    const salText = $el.find(".salary").text().trim();
    const closingText = $el.find(".closing-date, .close-date").text().trim();

    let closingDate: Date | undefined;
    if (closingText) {
      const d = new Date(closingText);
      if (!isNaN(d.getTime())) closingDate = d;
    }

    const salary = parseSalary(salText);
    const isProvincial = deptText.toLowerCase().includes("alberta") ||
      deptText.toLowerCase().includes("government") ||
      deptText.toLowerCase().includes("ministry") ||
      deptText.toLowerCase().includes("department");

    jobs.push({
      title,
      employer: deptText,
      location: city,
      province: "AB",
      description: `${title} with ${deptText}. Eligible for defined benefit pension plan.`,
      applyUrl,
      closingDate,
      pensionPlan: isProvincial
        ? "Public Service Pension Plan (Alberta)"
        : "Local Authorities Pension Plan (LAPP)",
      ...salary,
    });
  });

  return jobs;
}
