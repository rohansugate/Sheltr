/**
 * Optional Bright Data Web Unlocker — required for Zillow (blocks direct requests).
 * Set BRIGHT_DATA_API_TOKEN and BRIGHT_DATA_UNLOCKER_ZONE in .env.local
 */
export async function fetchWithUnlocker(url: string): Promise<string | null> {
  const token = process.env.BRIGHT_DATA_API_TOKEN;
  const zone = process.env.BRIGHT_DATA_UNLOCKER_ZONE ?? "web_unlocker1";
  if (!token) return null;

  try {
    const res = await fetch("https://api.brightdata.com/request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        zone,
        url,
        format: "raw",
        data_format: "html",
        country: "us",
      }),
      signal: AbortSignal.timeout(45_000),
    });

    if (!res.ok) {
      console.error("Bright Data unlock failed", res.status, await res.text());
      return null;
    }

    const payload = (await res.json()) as { body?: string };
    return payload.body ?? null;
  } catch (err) {
    console.error("Bright Data fetch error", err);
    return null;
  }
}

export async function fetchDirect(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(20_000),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return res.text();
  } catch {
    return null;
  }
}
