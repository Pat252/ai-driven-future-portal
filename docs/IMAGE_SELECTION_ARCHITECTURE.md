# Image Selection Architecture

## Critical Design Principle

**Image selection happens ONCE during RSS ingestion, NEVER during rendering.**

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    RSS INGESTION PHASE                       │
│                  (AI Selection Enabled)                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. enableIngestionPhase()                                  │
│  2. Fetch RSS feeds                                         │
│  3. For each article:                                       │
│     a. Generate unique ID (guid/link)                       │
│     b. Check cache (articleId → imageKey + imageUrl)       │
│     c. If not cached:                                       │
│        - Call GPT with article + R2 images                  │
│        - Select best image                                  │
│        - Cache result (7 day TTL)                           │
│     d. Store imageUrl with article                          │
│  4. disableIngestionPhase()                                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    RENDERING PHASE                           │
│                 (AI Selection Blocked)                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Page requests articles                                  │
│  2. Articles already have imageUrl                          │
│  3. Components render imageUrl directly                     │
│  4. No GPT calls                                            │
│  5. No R2 listing                                           │
│  6. No image computation                                    │
│                                                              │
│  ⚡ INSTANT PAGE LOADS                                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Phase Control

### Ingestion Phase (Enabled)
```typescript
enableIngestionPhase();  // Allow AI calls

// RSS ingestion runs here
// - GPT selection allowed
// - R2 listing allowed
// - Image scoring allowed

disableIngestionPhase(); // Block AI calls
```

### Rendering Phase (Disabled - Default)
```typescript
// isIngestionPhase = false (default)

// If getArticleImage() is called:
throw new Error(
  'AI image selection cannot run during rendering'
);
```

## Caching Strategy

### Cache Key
```typescript
articleId = item.guid || item.link || `${title}-${pubDate}`
```

### Cache Entry
```typescript
{
  imageKey: "companies/openai/logo.jpg",
  imageUrl: "https://images.aidrivenfuture.ca/companies/openai/logo.jpg",
  timestamp: 1704067200000
}
```

### Cache TTL
- **Duration:** 7 days
- **Rationale:** Articles older than 7 days rarely change
- **Behavior:** After expiry, image will be recomputed on next ingestion

### Cache Benefits
1. **No recomputation** - Same article always uses cached image
2. **Fast ingestion** - Skip GPT for known articles
3. **Cost reduction** - Minimal GPT API calls
4. **Consistency** - Same article always shows same image

## Runtime Guards

### Guard 1: Ingestion Phase Check
```typescript
if (!isIngestionPhase) {
  throw new Error(
    'AI image selection cannot run during rendering'
  );
}
```

**Triggers:**
- Any call to `getArticleImage()` outside ingestion
- Prevents accidental AI calls during page render

### Guard 2: Cache Validation
```typescript
if (Date.now() - cached.timestamp < CACHE_TTL) {
  return cached; // Use cached image
}
```

**Ensures:**
- Expired cache entries are recomputed
- Fresh images for new articles

## Data Flow

### RSS Ingestion
```typescript
// lib/rss.ts

export async function getNewsData() {
  enableIngestionPhase(); // ← ENABLE AI
  
  try {
    const imageLibrary = await getImageLibrary();
    
    for (const item of feedItems) {
      const articleGuid = item.guid || item.link;
      
      // AI selection (cached)
      const imageUrl = await extractImage(
        title,
        description,
        category,
        imageLibrary,
        context,
        articleGuid // ← Cache key
      );
      
      // Store with article
      article.image = imageUrl;
    }
    
    return articles;
  } finally {
    disableIngestionPhase(); // ← DISABLE AI (always)
  }
}
```

### Component Rendering
```typescript
// components/NewsCard.tsx

export default function NewsCard({ news }) {
  // Image already precomputed - just render
  const imageUrl = news.image || getDefaultPlaceholder();
  
  return (
    <Image src={imageUrl} ... />
  );
}
```

## Performance Guarantees

### Ingestion Phase
- **First run:** ~500ms per article (GPT call)
- **Cached run:** <1ms per article (cache hit)
- **Total:** ~10-30s for 50 articles (first run)
- **Total:** <1s for 50 articles (cached)

### Rendering Phase
- **Page load:** 0ms image computation
- **Navigation:** 0ms image computation
- **No GPT calls:** Ever
- **No R2 listing:** Ever

### Cost Impact
- **Before:** GPT call on every page render
- **After:** GPT call once per article (7 day cache)
- **Savings:** ~99% reduction in GPT costs

## Logging

### Ingestion Logs
```
🔄 Starting RSS feed fetch...
✅ Loaded 1,247 images for selection

[AI Ingestion] "OpenAI releases GPT-5..." → companies/openai/logo.jpg
               Reason: Article discusses OpenAI announcement

[Cache Hit] "Previous article..." → companies/google/logo.jpg

✅ RSS ingestion complete: 50 articles
```

### Rendering Logs
```
(No logs - images already precomputed)
```

### Error Logs
```
⚠️  Image failed to load: https://images.aidrivenfuture.ca/broken.jpg
(Falls back to default placeholder)
```

## Emergency Fallback

### When Used
- Article has no precomputed image (should never happen)
- Image URL is null/undefined
- Image fails to load

### Behavior
```typescript
const imageUrl = news.image || getDefaultPlaceholder();
```

### Warning
```
⚠️  EMERGENCY FALLBACK: Article "..." has no precomputed image.
   This should not happen - check RSS ingestion pipeline.
```

## Cache Management

### Automatic Cleanup
- Expired entries removed on next access
- No manual cleanup required

### Manual Cleanup (if needed)
```typescript
// Clear all cached images
imageSelectionCache.clear();
```

### Cache Size
- **Max entries:** Unlimited (Map)
- **Memory usage:** ~100 bytes per entry
- **Expected size:** ~1,000 entries (7 days of articles)
- **Total memory:** ~100 KB (negligible)

## Error Handling

### GPT Failure During Ingestion
```typescript
try {
  const aiSelection = await selectBestImageForArticle(...);
  // Use AI selection
} catch (error) {
  // Fallback to deterministic selection
  // Still caches the fallback result
}
```

### Rendering Phase Violation
```typescript
// If AI is called during rendering:
throw new Error(
  'AI image selection cannot run during rendering.\n' +
  'Use enableIngestionPhase() before ingestion.'
);
```

### Missing Image URL
```typescript
// Component level
const imageUrl = news.image || getDefaultPlaceholder();
// Always has a valid URL
```

## Testing

### Test Ingestion Phase
```bash
npm run dev

# Watch logs:
🔄 Starting RSS feed fetch...
[AI Ingestion] "Article..." → image.jpg
✅ RSS ingestion complete
```

### Test Rendering Phase
```bash
# Navigate between pages
# Should see NO image selection logs
# Pages should load instantly
```

### Test Cache
```bash
# First load: AI selection logs
# Refresh: Cache hit logs
# Wait 7 days: AI selection again
```

### Test Guard
```typescript
// Try calling getArticleImage() outside ingestion
// Should throw: "AI image selection cannot run during rendering"
```

## Migration Notes

### Before
- Image selection on every render
- GPT calls during page navigation
- Slow page loads
- High GPT costs
- Log spam

### After
- Image selection during ingestion only
- No GPT calls during navigation
- Instant page loads
- 99% cost reduction
- Clean logs

### Breaking Changes
- `getArticleImage()` now requires `articleId` parameter
- `getArticleImage()` throws if called outside ingestion phase
- Components must use precomputed `article.image`

### Backward Compatibility
- Emergency fallback for missing images
- Graceful degradation if cache fails
- No changes to image URLs or rendering

## Monitoring

### Key Metrics
- Cache hit rate (should be >90%)
- Ingestion duration (should be <30s)
- Page load time (should be <100ms)
- GPT API calls (should be ~50 per ingestion)

### Red Flags
- ⚠️ "AI selection cannot run during rendering" errors
- ⚠️ High cache miss rate (>20%)
- ⚠️ Slow page loads (>500ms)
- ⚠️ Many emergency fallback warnings

## Future Optimizations

### Potential Improvements
1. **Persistent cache** - Store in database/Redis
2. **Precompute on upload** - Select images when uploading to R2
3. **Batch GPT calls** - Process multiple articles in one API call
4. **Image embeddings** - Pre-compute image vectors for faster matching
5. **CDN caching** - Cache image URLs at CDN level

### Cost Optimization
- Current: ~$0.0001 per article (GPT-4o-mini)
- With persistent cache: ~$0.00001 per article (90% cache hit)
- With batch calls: ~$0.00005 per article (5x cheaper)

