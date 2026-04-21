import { scrapeTaleoSource } from "./taleo.js";
import type { ScrapedJob } from "../types.js";

export async function scrapeToronto(): Promise<ScrapedJob[]> {
  return scrapeTaleoSource({
    name: "City of Toronto",
    baseUrl: "https://jobs.toronto.ca",
    employer: "City of Toronto",
    province: "ON",
    city: "Toronto",
    careersectionSlug: "ex",
  });
}
