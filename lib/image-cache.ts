/**
 * IMAGE CACHE - DISABLED
 * 
 * This file has been disabled as part of the simplified image pipeline refactor.
 * We now use ONLY per-request in-memory context tracking.
 * 
 * No persistent caching across requests.
 * No .cache/image-cache.json file.
 * 
 * Last Updated: 2026-01-06
 */

// All exports are now no-ops to maintain compatibility with any existing imports

export async function getCachedImage(): Promise<null> {
  return null;
}

export async function setCachedImage(): Promise<void> {
  // No-op
}

export async function hasCachedImage(): Promise<boolean> {
  return false;
}

export async function clearCache(): Promise<void> {
  // No-op
}

export async function getCacheStats(): Promise<{
  size: number;
  sampleEntries: any[];
  policyVersion: number;
  brandImageCount: number;
  genericImageCount: number;
}> {
  return {
    size: 0,
    sampleEntries: [],
    policyVersion: 2,
    brandImageCount: 0,
    genericImageCount: 0,
  };
}

export function normalizeCacheKey(title: string): string {
  return title.toLowerCase().trim();
}
