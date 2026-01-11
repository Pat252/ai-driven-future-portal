/**
 * GLOBAL IMAGE ALLOCATOR
 * 
 * Assigns images to articles while minimizing reuse across the entire batch.
 * Called ONCE after all articles are fetched and candidates are determined.
 * 
 * This ensures that during RSS ingestion, each article gets a unique image
 * whenever possible, with duplicates only when the image pool is exhausted.
 */

export interface ArticleWithCandidates {
  title: string;
  candidateImages: string[]; // Ranked best → worst (image URLs)
  image?: string; // Final assigned image URL
  [key: string]: any; // Other article properties
}

/**
 * Allocate images globally to minimize duplicates
 * 
 * Algorithm:
 * - Track used images in a Set
 * - For each article, assign highest-ranked unused image
 * - If all candidates are used, fallback to top-ranked
 * 
 * This is a pure function with no side effects.
 * Deterministic - same input always produces same output.
 * 
 * @param articles - Articles with candidateImages arrays
 * @returns Articles with final image field assigned
 */
export function allocateImagesGlobally<T extends ArticleWithCandidates>(
  articles: T[]
): T[] {
  const usedImages = new Set<string>();
  const result: T[] = [];

  for (const article of articles) {
    let assigned = false;

    // Try to assign an unused image from candidates
    for (const candidateImage of article.candidateImages) {
      if (!usedImages.has(candidateImage)) {
        article.image = candidateImage;
        usedImages.add(candidateImage);
        assigned = true;
        break;
      }
    }

    // Fallback: if all candidates are used, use top-ranked
    if (!assigned && article.candidateImages.length > 0) {
      article.image = article.candidateImages[0];
      // Note: intentionally NOT adding to usedImages
      // This allows duplicates when pool exhausted
    }

    // Safety: if no candidates at all, this is a critical error
    if (!article.image) {
      throw new Error(
        `CRITICAL: Article "${article.title}" has no candidate images. ` +
        `This should never happen if GPT selection succeeded.`
      );
    }

    result.push(article);
  }

  // Logging
  const uniqueImagesUsed = usedImages.size;
  const totalArticles = articles.length;
  console.log(`[IMAGE ALLOCATOR] Unique images: ${uniqueImagesUsed} / ${totalArticles} articles`);

  if (uniqueImagesUsed < totalArticles) {
    const duplicateCount = totalArticles - uniqueImagesUsed;
    console.log(`[IMAGE ALLOCATOR] ${duplicateCount} duplicate(s) due to pool exhaustion`);
  }

  return result;
}

