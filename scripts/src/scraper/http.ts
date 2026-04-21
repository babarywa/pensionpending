import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";

const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

export function makeClient(baseConfig?: AxiosRequestConfig): AxiosInstance {
  return axios.create({
    timeout: 20_000,
    headers: {
      "User-Agent": UA,
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,application/json,*/*;q=0.8",
      "Accept-Language": "en-CA,en;q=0.9",
      "Cache-Control": "no-cache",
    },
    ...baseConfig,
  });
}

export async function fetchWithRetry<T = string>(
  client: AxiosInstance,
  url: string,
  config?: AxiosRequestConfig,
  retries = 2,
  backoffMs = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await client.get<T>(url, config);
      return res.data;
    } catch (err: any) {
      const isDnsFail = err.code === "ENOTFOUND" || err.code === "EAI_AGAIN";
      if (attempt === retries || isDnsFail) throw err;
      const wait = backoffMs * attempt;
      console.warn(`  ↻ retry ${attempt}/${retries - 1} for ${url} after ${wait}ms (${err.message})`);
      await sleep(wait);
    }
  }
  throw new Error("unreachable");
}

export function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}
