import * as cheerio from "cheerio";
import { makeClient, fetchWithRetry, sleep } from "../http.js";
import type { ScrapedJob } from "../types.js";
import { parseSalary } from "../detect.js";

const BASE = "https://emploisfp-psjobs.cfp-psc.gc.ca";
const EMPLOYER = "Government of Canada";

const PROV_MAP: Record<string, string> = {
  "Ontario": "ON", "Ont.": "ON",
  "British Columbia": "BC", "B.C.": "BC",
  "Alberta": "AB",
  "Quebec": "QC", "Québec": "QC", "Que.": "QC",
  "Manitoba": "MB", "Man.": "MB",
  "Saskatchewan": "SK", "Sask.": "SK",
  "Nova Scotia": "NS", "N.S.": "NS",
  "New Brunswick": "NB", "N.B.": "NB",
  "Prince Edward Island": "PE", "P.E.I.": "PE",
  "Newfoundland": "NL", "N.L.": "NL",
  "Northwest Territories": "NT", "N.W.T.": "NT",
  "Nunavut": "NU",
  "Yukon": "YT",
  "National Capital Region": "ON",
  "Ottawa": "ON",
  "Gatineau": "QC",
};

function parseProvince(text: string): string {
  for (const [key, prov] of Object.entries(PROV_MAP)) {
    if (text.includes(key)) return prov;
  }
  return "ON";
}

function parseCity(text: string): string {
  return text.split(",")[0].replace(/\([^)]*\)/g, "").trim() || text;
}

export async function scrapeGcJobs(): Promise<ScrapedJob[]> {
  const client = makeClient({ baseURL: BASE });
  const jobs: ScrapedJob[] = [];

  const urlVariants = [
    `/psrs-srfp/applicant/page1710?lateral=false&pgam=1&noOfJobs=100&sortField=postedDate&sortOrder=DESC`,
    `/psrs-srfp/applicant/page1710?lateral=false&pgam=1&noOfJobs=100`,
  ];

  let html = "";
  for (const url of urlVariants) {
    try {
      html = await fetchWithRetry<string>(client, url);
      if (html.length > 1000) break;
    } catch (e: any) {
      console.warn(`  [gc-jobs] fetch failed: ${e.message}`);
    }
    await sleep(600);
  }

  if (!html || html.length < 500) return [];

  const $ = cheerio.load(html);

  const selectors = [
    "tr.resultRow, tr[id*='result'], tr[class*='result']",
    ".resultContainer, .result-item, .psr-result",
    "table.resultTable tbody tr:not(.header-row)",
    "#resultsSection a[href*='page2120'], #resultsSection a[href*='jobdetail']",
    "a[href*='page2120'], a[href*='poster=']",
  ];

  for (const sel of selectors) {
    const els = $(sel);
    if (els.length === 0) continue;

    if (sel.startsWith("a[")) {
      els.each((_i, el) => {
        const $el = $(el);
        const title = $el.text().trim();
        const href = $el.attr("href") ?? "";
        if (!title || title.length < 3) return;
        const applyUrl = href.startsWith("http") ? href : `${BASE}${href}`;
        const parent = $el.parent().parent();
        const locText = parent.find("td").eq(2).text().trim() || "Ottawa";
        jobs.push({
          title,
          employer: parent.find("td").eq(1).text().trim() || EMPLOYER,
          location: parseCity(locText),
          province: parseProvince(locText),
          description: `${title}. Federal public sector position — Public Service Pension Plan (Federal).`,
          applyUrl,
          pensionPlan: "Public Service Pension Plan (Federal)",
        });
      });
    } else {
      els.each((_i, el) => {
        const $el = $(el);
        const titleEl = $el.find("a").first();
        const title = titleEl.text().trim();
        const href = titleEl.attr("href") ?? "";
        if (!title || title.length < 3) return;
        const applyUrl = href.startsWith("http") ? href : `${BASE}${href}`;
        const tds = $el.find("td");
        const locText = tds.eq(2).text().trim() || tds.last().text().trim() || "Ottawa";
        const deptText = tds.eq(1).text().trim() || EMPLOYER;
        const salText = $el.find(".salary, .psr-salary").text().trim();
        const closingText = $el.find(".closeDate, .psr-close-date, td:last-child").text().trim();
        let closingDate: Date | undefined;
        if (closingText) {
          const d = new Date(closingText);
          if (!isNaN(d.getTime())) closingDate = d;
        }
        const salary = parseSalary(salText);
        jobs.push({
          title,
          employer: deptText,
          location: parseCity(locText),
          province: parseProvince(locText),
          description: `${title} — ${deptText}. Public Service Pension Plan (Federal).`,
          applyUrl,
          closingDate,
          pensionPlan: "Public Service Pension Plan (Federal)",
          ...salary,
        });
      });
    }

    if (jobs.length > 0) break;
  }

  if (jobs.length === 0) {
    $("a[href]").each((_i, el) => {
      const $el = $(el);
      const href = $el.attr("href") ?? "";
      if (!href.includes("page2120") && !href.includes("jobdetail") && !href.includes("poster=")) return;
      const title = $el.text().trim();
      if (!title || title.length < 3 || title.length > 200) return;
      const applyUrl = href.startsWith("http") ? href : `${BASE}${href}`;
      const parent = $el.closest("tr, li, div");
      const locText = parent.find("td:nth-child(3), .location").text().trim() || "Ottawa";
      jobs.push({
        title,
        employer: parent.find("td:nth-child(2), .org").text().trim() || EMPLOYER,
        location: parseCity(locText),
        province: parseProvince(locText),
        description: `${title}. Federal public sector role with defined benefit pension (PSPP).`,
        applyUrl,
        pensionPlan: "Public Service Pension Plan (Federal)",
      });
    });
  }

  return jobs;
}
