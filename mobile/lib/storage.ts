import AsyncStorage from "@react-native-async-storage/async-storage";

const RECENT_URL_KEY = "doorway.recentUrl";

export async function getRecentUrl(): Promise<string | null> {
  return AsyncStorage.getItem(RECENT_URL_KEY);
}

export async function saveRecentUrl(url: string): Promise<void> {
  await AsyncStorage.setItem(RECENT_URL_KEY, url);
}

export function normalizeUrl(input: string): string {
  let url = input.trim();
  if (!url) return "";
  if (!/^https?:\/\//i.test(url)) {
    url = `http://${url}`;
  }
  return url.replace(/\/+$/, "");
}
