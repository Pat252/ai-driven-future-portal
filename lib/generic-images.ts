/**
 * GENERIC IMAGES REGISTRY - DISABLED
 * 
 * This file has been disabled as part of the simplified image pipeline refactor.
 * We no longer use hardcoded fallback registries.
 * All images come from /public/assets/images/all/ via dynamic scoring.
 * 
 * Last Updated: 2026-01-06
 */

// Exports maintained for backward compatibility, but all return empty/null

export const GENERIC_IMAGES: Record<string, string[]> = {
  global: [],
};

export function getGenericImages(category: string): string[] {
  return [];
}

export function getGenericImageForArticle(
  title: string,
  category: string,
  hashFn: (str: string) => number
): string {
  throw new Error('getGenericImageForArticle() is disabled - should not be called');
}
