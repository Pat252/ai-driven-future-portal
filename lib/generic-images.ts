/**
 * Generic Image Registry - Brand-Neutral Fallback Images
 * 
 * This registry provides category-specific, brand-neutral images for use
 * as final fallbacks when AI curation and keyword matching fail.
 * 
 * All images are from /public/assets/images/all/ and are:
 * - Brand-neutral (no logos, no company names)
 * - Generic AI/technology visuals
 * - Category-appropriate
 * - Suitable for any article in their category
 * 
 * Last Updated: 2026-01-04
 */

/**
 * Category-to-slug mapping for consistent lookup
 */
const CATEGORY_TO_SLUG: Record<string, string> = {
  'Breaking AI': 'breaking-ai',
  'Gen AI': 'gen-ai',
  'AI Economy': 'ai-economy',
  'Creative Tech': 'creative-tech',
  'Toolbox': 'toolbox',
  'Future Life': 'future-life',
};

/**
 * Generic image registry by category
 * 
 * Images are selected to be:
 * - Brand-neutral (no company logos or names)
 * - Generic technology/AI visuals
 * - Category-appropriate
 * - Professional and visually appealing
 */
export const GENERIC_IMAGES: Record<string, string[]> = {
  // Breaking AI: Cutting-edge AI technology, research, breakthroughs
  'breaking-ai': [
    'ai-robot-future-technology.jpg.svg',
    'neural-network-brain-ai.jpg.svg',
    'motherboard-with-ai-cpu.jpg',
    'motherboard-with-ai-feel.jpg',
    'blue-brain.jpg',
    'purple-brain.jpg',
    'robot-hand-touching-human-hand.jpg',
    'ai-icon-head-1.jpg',
    'ai-icon-head-2.jpg',
    'cute-robot-looking-up.jpg',
  ],

  // Gen AI: Generative AI, models, tools, infrastructure
  'gen-ai': [
    'ai-robot-on-laptop.jpg',
    'laptop-with-gen-ai-feature-onscreen.jpg',
    'laptop-with-gen-ai-features.jpg',
    'robot-sitting-bench-park-on-laptop.jpg',
    'cpu-on-motherboard.jpg',
    'interconnected-bubble.jpg',
    'interconnect-bulb.jpg',
    'matrix-looking-laptop-dark.jpg',
    'code-programming-developer.jpg.svg',
    'keyboard-under-wrapper.jpg',
  ],

  // AI Economy: Business, finance, markets, economic impact
  'ai-economy': [
    'economy-stock-market-chart.jpg',
    'economy-business-chart-growth.jpg.svg',
    'economy-stocks-candles.jpg',
    'economy-calculator-on-table-2-screens.jpg',
    'economy-hand-calculating-with-money-on-table.jpg',
    'economy-hand-placing-coins-in-towers-on-table.jpg',
    'economy-multiple-devices-from-world.jpg',
    'cargo-ships-with-containers.jpg',
    'man-hands-holding-business-newspaper.jpg',
    'world-globe-on-desk.jpg',
  ],

  // Creative Tech: Design, media, creative tools, consumer tech
  'creative-tech': [
    'creative-design-art-digital.jpg.svg',
    'creative-tech-fuji-film-camera.jpg',
    'creative-woman-looking-cube.jpg',
    'laptop-coding-on-ide.jpg',
    'red-backlig-keyboard-laptop.jpg',
    'someone-typing-on-laptop.jpg',
    'human-hand-holding-cell-image-of-apps.jpg',
    'cyberpunk-city.jpg',
    'aerial-night-downtown-city.jpg',
    'downtown-night-city.jpg',
  ],

  // Toolbox: Development tools, coding, technical resources
  'toolbox': [
    'laptop-coding-on-ide.jpg',
    'code-programming-developer.jpg.svg',
    'keyboard-under-wrapper.jpg',
    'someone-typing-on-laptop.jpg',
    'matrix-looking-laptop-dark.jpg',
    'laptop-dark-mid-closed-lid.jpg',
    'calculator-pen-paper.jpg',
    'awesome-binary-world-map.jpg',
    'hands-above-brain-cartoon.jpg',
    'robot-hand-chessboard.jpg',
  ],

  // Global fallback: Used when category is unknown or missing
  global: [
    'ai-robot-future-technology.jpg.svg',
    'neural-network-brain-ai.jpg.svg',
    'laptop-with-gen-ai-feature-onscreen.jpg',
    'economy-stock-market-chart.jpg',
    'creative-design-art-digital.jpg.svg',
    'code-programming-developer.jpg.svg',
    'motherboard-with-ai-cpu.jpg',
    'robot-hand-touching-human-hand.jpg',
    'world-globe-on-desk.jpg',
    'interconnected-bubble.jpg',
  ],
};

/**
 * Get generic images for a category
 * 
 * @param category - Article category (e.g., "Breaking AI", "Gen AI")
 * @returns Array of generic image filenames for the category, or global fallback
 */
export function getGenericImages(category: string): string[] {
  const slug = CATEGORY_TO_SLUG[category] || category.toLowerCase().replace(/\s+/g, '-');
  
  // Try exact match first
  if (GENERIC_IMAGES[slug]) {
    return GENERIC_IMAGES[slug];
  }
  
  // Try lowercase variant
  const lowerSlug = slug.toLowerCase();
  if (GENERIC_IMAGES[lowerSlug]) {
    return GENERIC_IMAGES[lowerSlug];
  }
  
  // Fallback to global generic images
  return GENERIC_IMAGES.global;
}

/**
 * Get a deterministic generic image for a title and category
 * 
 * Uses hash-based selection to ensure the same article always
 * gets the same generic image.
 * 
 * @param title - Article title (used for hashing)
 * @param category - Article category
 * @param hashFn - Hash function (simpleHash from image-utils)
 * @returns Generic image filename
 */
export function getGenericImageForArticle(
  title: string,
  category: string,
  hashFn: (str: string) => number
): string {
  const genericImages = getGenericImages(category);
  
  if (genericImages.length === 0) {
    // Safety fallback (should never happen)
    return GENERIC_IMAGES.global[0] || 'ai-robot-future-technology.jpg.svg';
  }
  
  const titleHash = hashFn(title);
  const index = Math.floor(titleHash * genericImages.length);
  
  return genericImages[index];
}

