import * as cheerio from "cheerio";
import { makeClient, fetchWithRetry, sleep } from "../http.js";
import type { ScrapedJob } from "../types.js";

interface TaleoJob {
  contestNo?: string;
  referenceNumber?: string;
  jobId?: string;
  title?: string;
  orgName?: string;
  jobField?: string;
  primaryLocationName?: string;
  locationName?: string;
  startDate?: string;
  unpostDate?: string;
  detailUrl?: string;
  jobDetailUrl?: string;
  jobSummary?: string;
  salaryRange?: string;
}

interface TaleoResponse {
  req?: TaleoJob[];
  jobs?: TaleoJob[];
  reqTotalCount?: number;
  totalCount?: number;
}

export interface TaleoSourceConfig {
  name: string;
  baseUrl: string;
  employer: string;
  province: string;
  city: string;
  careersectionSlug?: string;
}

function resolveId(j: TaleoJob): string {
  return j.contestNo ?? j.referenceNumber ?? j.jobId ?? Math.random().toString(36).slice(2);
}

function resolveTitle(j: TaleoJob): string | undefined {
  return j.title;
}

function resolveLocation(j: TaleoJob, fallback: string): string {
  const raw = j.primaryLocationName ?? j.locationName ?? fallback;
  return raw.split(",")[0].trim();
}

function resolvePostedAt(j: TaleoJob): Date | undefined {
  const s = j.startDate;
  if (!s) return undefined;
  const d = new Date(s);
  return isNaN(d.getTime()) ? undefined : d;
}

function resolveClosingDate(j: TaleoJob): Date | undefined {
  const s = j.unpostDate;
  if (!s) return undefined;
  const d = new Date(s);
  return isNaN(d.getTime()) ? undefined : d;
}

export async function scrapeTaleoSource(cfg: TaleoSourceConfig): Promise<ScrapedJob[]> {
  const client = makeClient({ baseURL: cfg.baseUrl });
  const jobs: ScrapedJob[] = [];

  const restEndpoints = [
    `/careersection/rest/jobboard/posting?lang=en&multipleLocations=0`,
    `/careersection/rest/jobboard/posting?lang=en`,
    `/careersection/rest/jobboard/posting`,
  ];

  let rawJobs: TaleoJob[] | null = null;

  for (const endpoint of restEndpoints) {
    try {
      const data = await fetchWithRetry<TaleoResponse>(
        client,
        endpoint,
        { responseType: "json", params: { _: Date.now() } }
      );
      const arr = data.req ?? data.jobs;
      if (Array.isArray(arr) && arr.length > 0) {
        rawJobs = arr;
        break;
      }
    } catch {
      // try next
    }
    await sleep(300);
  }

  if (!rawJobs) {
    const htmlSections = [
      cfg.careersectionSlug ?? "ex",
      "external",
      "public",
    ];
    for (const section of htmlSections) {
      try {
        const html = await fetchWithRetry<string>(
          client,
          `/careersection/${section}/jobsearch.ftl`,
          { params: { lang: "en" } }
        );
        const $ = cheerio.load(html);
        const htmlJobs: TaleoJob[] = [];
        $("table.listingTable tbody tr, .psr-result-item, .listingRow").each((_i, el) => {
          const $el = $(el);
          const titleEl = $el.find("a").first();
          const title = titleEl.text().trim();
          const href = titleEl.attr("href") ?? "";
          if (!title) return;
          const refMatch = href.match(/job=([A-Z0-9-]+)/i);
          htmlJobs.push({
            title,
            contestNo: refMatch?.[1] ?? href,
            primaryLocationName: cfg.city,
            detailUrl: href.startsWith("http") ? href : `${cfg.baseUrl}${href}`,
          });
        });
        if (htmlJobs.length > 0) {
          rawJobs = htmlJobs;
          break;
        }
      } catch {
        // try next
      }
      await sleep(300);
    }
  }

  if (!rawJobs || rawJobs.length === 0) return [];

  for (const j of rawJobs) {
    const title = resolveTitle(j);
    if (!title) continue;
    const id = resolveId(j);
    let applyUrl = j.detailUrl ?? j.jobDetailUrl ?? "";
    if (!applyUrl) {
      const section = cfg.careersectionSlug ?? "ex";
      applyUrl = `${cfg.baseUrl}/careersection/${section}/jobdetail.ftl?job=${id}&lang=en`;
    } else if (!applyUrl.startsWith("http")) {
      applyUrl = `${cfg.baseUrl}${applyUrl}`;
    }

    jobs.push({
      title,
      employer: j.orgName ?? cfg.employer,
      location: resolveLocation(j, cfg.city),
      province: cfg.province,
      description: j.jobSummary ?? `${title} at ${cfg.employer}. See original posting for full details.`,
      applyUrl,
      salaryText: j.salaryRange,
      postedAt: resolvePostedAt(j),
      closingDate: resolveClosingDate(j),
    });
    await sleep(50);
  }

  return jobs;
}
