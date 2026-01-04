/**
 * 100% MANUAL LOCAL-ONLY IMAGE SYSTEM WITH RANDOM SELECTION
 * 
 * NO EXTERNAL FETCHING - NO UNSPLASH - NO RSS SCRAPING
 * 
 * This utility provides random selection from multiple local images
 * per category, ensuring visual variety across your site.
 * 
 * Philosophy:
 * - Complete control over every image
 * - Zero external dependencies
 * - Random variety for visual interest
 * - Easy to manage and update
 */

// ============================================================================
// CATEGORY SLUG MAPPING
// ============================================================================

/**
 * Convert category display names to folder slugs
 * 
 * Example: "Breaking AI" → "breaking-ai"
 */
function getCategorySlug(category: string): string {
  const slugMap: Record<string, string> = {
    'Breaking AI': 'breaking-ai',
    'Gen AI': 'gen-ai',
    'AI Economy': 'ai-economy',
    'Creative Tech': 'creative-tech',
    'Toolbox': 'toolbox',
    'Future Life': 'future-life',
  };

  return slugMap[category] || 'defaults';
}

// ============================================================================
// IMAGE INVENTORY (Update this when you add/remove images)
// ============================================================================

/**
 * Track how many main-X.jpg files exist in each category folder
 * 
 * Format: { 'category-slug': number_of_images }
 * 
 * Example:
 * - 'breaking-ai': 4 means you have main-1.jpg through main-4.jpg
 * - 'gen-ai': 1 means you only have main-1.jpg
 * - 'toolbox': 0 means you only have SVG placeholder
 * 
 * UPDATE THIS when you add new images to folders!
 * 
 * IMPORTANT: This must match the actual number of main-X.jpg files
 * in each category folder. If you have main-1.jpg through main-4.jpg,
 * set the value to 4 (not 2)!
 */
const IMAGE_INVENTORY: Record<string, number> = {
  'breaking-ai': 1,      // Has: main-1.jpg
  'ai-economy': 4,       // Has: main-1.jpg, main-2.jpg, main-3.jpg, main-4.jpg
  'gen-ai': 0,           // Still using SVG placeholder
  'creative-tech': 0,    // Still using SVG placeholder
  'toolbox': 0,          // Still using SVG placeholder
  'future-life': 0,      // Still using SVG placeholder
};

/**
 * Get a random integer between 1 and max (inclusive)
 * 
 * @param max - Maximum number (number of images available)
 * @returns Random integer from 1 to max
 */
function getRandomImageNumber(max: number): number {
  return Math.floor(Math.random() * max) + 1;
}

// ============================================================================
// MAIN IMAGE RESOLVER
// ============================================================================

/**
 * Get a random local image path for an article based on its category
 * 
 * RANDOM SELECTION STRATEGY:
 * - Each category can have multiple images (main-1.jpg, main-2.jpg, etc.)
 * - Function randomly selects from available images
 * - Provides visual variety even when articles share same category
 * 
 * STRICT RULES:
 * 1. NEVER fetch from external sources (Unsplash, RSS feeds, etc.)
 * 2. ALWAYS return a path to a local file in /public/assets/images/
 * 3. Randomly select from available JPG images in category folder
 * 4. Fall back to SVG placeholder if no JPG images exist
 * 5. Fall back to default placeholder if category unknown
 * 
 * Folder Structure:
 * /public/assets/images/categories/
 *   ├── breaking-ai/
 *   │   └── main-1.jpg                  ← Real JPG (1 image)
 *   ├── ai-economy/
 *   │   ├── main-1.jpg                  ← Real JPG
 *   │   └── main-2.jpg                  ← Real JPG (2 images - RANDOM!)
 *   ├── gen-ai/main.jpg.svg             ← SVG placeholder (temporary)
 *   ├── creative-tech/main.jpg.svg      ← SVG placeholder (temporary)
 *   ├── toolbox/main.jpg.svg            ← SVG placeholder (temporary)
 *   ├── future-life/main.jpg.svg        ← SVG placeholder (temporary)
 *   └── defaults/placeholder.jpg.svg    ← Default fallback
 * 
 * @param category - Article category (e.g., "Breaking AI", "Gen AI")
 * @returns Local image path with random selection (e.g., "/assets/images/categories/ai-economy/main-2.jpg")
 */
export function getArticleImage(category: string): string {
  const slug = getCategorySlug(category);
  
  // Check if this category has real JPG images
  const imageCount = IMAGE_INVENTORY[slug] || 0;
  
  // ============================================================================
  // REAL IMAGES (actual JPG files with random selection)
  // ============================================================================
  
  if (imageCount > 0) {
    // Randomly select from available images (main-1.jpg, main-2.jpg, etc.)
    const randomNumber = getRandomImageNumber(imageCount);
    const imagePath = `/assets/images/categories/${slug}/main-${randomNumber}.jpg`;
    
    // ALWAYS log image selection for verification
    console.log(`[Image Selection] Category: ${category} -> Assigned: ${imagePath} (randomly selected from ${imageCount} available images)`);
    
    return imagePath;
  }
  
  // ============================================================================
  // SVG PLACEHOLDERS (temporary - replace when you add more images)
  // ============================================================================
  
  // Category has no JPG images yet, use SVG placeholder
  const svgPath = `/assets/images/categories/${slug}/main.jpg.svg`;
  console.log(`[Image Selection] Category: ${category} -> Using SVG placeholder: ${svgPath}`);
  return svgPath;
}

// ============================================================================
// FALLBACK IMAGE
// ============================================================================

/**
 * Get the default placeholder image
 * 
 * Used when:
 * - Category is unknown
 * - Category folder doesn't have images yet
 * - As a last-resort fallback
 * 
 * @returns Path to default placeholder
 */
export function getDefaultPlaceholder(): string {
  return '/assets/images/defaults/placeholder.jpg.svg';
}

/**
 * Get category image inventory (for debugging/admin purposes)
 * 
 * @returns Object showing how many images each category has
 */
export function getCategoryImageCounts(): Record<string, number> {
  return { ...IMAGE_INVENTORY };
}

// ============================================================================
// HELPER: Check if image is local
// ============================================================================

/**
 * Check if an image path is local (not external)
 * 
 * @param imagePath - Image path to check
 * @returns true if local, false if external
 */
export function isLocalImage(imagePath: string): boolean {
  return imagePath.startsWith('/assets/') || imagePath.startsWith('/public/');
}

// ============================================================================
// USAGE INSTRUCTIONS
// ============================================================================

/*
HOW TO ADD YOUR OWN IMAGES:

1. Take/download a high-quality image (1200x630px recommended)
2. Save it as main.jpg in the category folder:
   /public/assets/images/categories/breaking-ai/main.jpg

3. The system will automatically use it for all articles in that category

4. For variety, you can add multiple images:
   - main.jpg (default)
   - variant-1.jpg
   - variant-2.jpg
   
   Then update this file to randomly select from the variants

IMPORTANT:
- All images must be in /public/assets/images/
- Never link to external URLs
- Recommended size: 1200x630px (optimal for cards and social sharing)
- Supported formats: .jpg, .png, .webp, .svg

ADVANTAGES OF THIS APPROACH:
✅ 100% control over every image
✅ No copyright concerns (you own/license everything)
✅ No external API failures or rate limits
✅ Fast, predictable loading
✅ Works offline
✅ Easy to update (just swap files)
✅ No code changes needed to update images
*/

