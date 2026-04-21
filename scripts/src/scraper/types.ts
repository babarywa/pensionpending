export interface ScrapedJob {
  title: string;
  employer: string;
  location: string;
  province: string;
  description: string;
  applyUrl: string;
  salaryText?: string;
  salaryMin?: number;
  salaryMax?: number;
  postedAt?: Date;
  closingDate?: Date;
  pensionPlan?: string;
  category?: string;
}

export interface SourceResult {
  sourceName: string;
  jobs: ScrapedJob[];
  error?: string;
}

export interface Source {
  name: string;
  scrape(): Promise<ScrapedJob[]>;
}
