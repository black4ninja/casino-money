import { SCHEMA_VERSION } from "./keys";

type Envelope<T> = { v: number; data: T };

export function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Envelope<T>;
    if (typeof parsed !== "object" || parsed === null) return fallback;
    if (parsed.v !== SCHEMA_VERSION) return fallback; // future: run migrations
    return parsed.data;
  } catch {
    return fallback;
  }
}

export function saveJSON<T>(key: string, data: T): void {
  const envelope: Envelope<T> = { v: SCHEMA_VERSION, data };
  localStorage.setItem(key, JSON.stringify(envelope));
}

export function removeKey(key: string): void {
  localStorage.removeItem(key);
}
