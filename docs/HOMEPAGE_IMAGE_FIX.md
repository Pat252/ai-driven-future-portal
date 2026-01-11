# Homepage Image Fix - Complete

**Date:** 2026-01-10  
**Issue:** Homepage images showing 404 for `/assets/images/fallback.jpg`  
**Status:** ✅ FIXED

## Problem

Homepage was attempting to load images from local `/assets/images/fallback.jpg` path, which doesn't exist. This caused:
- 404 errors in console
- Broken image placeholders
- Poor user experience

**Root Cause:** The `resolveFallbackImage()` function in `lib/image-resolver.ts` was returning a local file path instead of an R2 CDN URL.

## Solution

Created a new `safeImage()` helper that:
1. ✅ Accepts optional image URL
2. ✅ Returns the URL if it's valid (starts with `http`)
3. ✅ Falls back to R2 CDN generic image if missing
4. ✅ Never returns null or undefined
5. ✅ Logs warning in development when fallback is used

### New Helper Function

```typescript
// lib/safe-image.ts

export function safeImage(url?: string | null): string {
  // If URL exists and is absolute (starts with http), use it
  if (url && url.startsWith('http')) {
    return url;
  }
  
  // Fallback to generic R2 image
  const cdnUrl = process.env.NEXT_PUBLIC_R2_CDN_URL || 'https://images.aidrivenfuture.ca';
  const genericImage = 'generic/generic-01.jpg';
  
  // Log warning in development if we're using fallback
  if (!url && process.env.NODE_ENV !== 'production') {
    console.warn(
      '⚠️  Using generic fallback image. Article has no precomputed image.\n' +
      '   This may indicate an RSS ingestion issue.'
    );
  }
  
  return `${cdnUrl}/${genericImage}`;
}
```

## Files Modified

### 1. Created `lib/safe-image.ts`
- New helper function for safe image URL resolution
- Always returns valid absolute URL
- Never returns local file paths

### 2. Updated `components/Hero.tsx`
**Before:**
```typescript
import { getDefaultPlaceholder } from '@/lib/image-utils.client';

const imageUrl = item.image || getDefaultPlaceholder();
```

**After:**
```typescript
import { safeImage } from '@/lib/safe-image';

const imageUrl = safeImage(item.image);
```

### 3. Updated `components/NewsCard.tsx`
**Before:**
```typescript
import { getDefaultPlaceholder } from '@/lib/image-utils.client';

const imageUrl = news.image || getDefaultPlaceholder();
```

**After:**
```typescript
import { safeImage } from '@/lib/safe-image';

const imageUrl = safeImage(news.image);
```

### 4. Updated `components/NewsGrid.tsx`
**Before:**
```typescript
import { getDefaultPlaceholder } from '@/lib/image-utils.client';

const DEFAULT_FALLBACK_IMAGE = getDefaultPlaceholder();
```

**After:**
```typescript
import { safeImage } from '@/lib/safe-image';

const DEFAULT_FALLBACK_IMAGE = safeImage();
```

### 5. Updated `lib/image-resolver.ts`
**Before:**
```typescript
export function resolveFallbackImage(
  config: ImageResolverConfig = DEFAULT_CONFIG
): string {
  return `/assets/images/fallback.jpg`; // ❌ Local file
}
```

**After:**
```typescript
export function resolveFallbackImage(
  config: ImageResolverConfig = DEFAULT_CONFIG
): string {
  // Always return R2 CDN generic image
  const cdnUrl = process.env.NEXT_PUBLIC_R2_CDN_URL || 'https://images.aidrivenfuture.ca';
  return `${cdnUrl}/generic/generic-01.jpg`; // ✅ R2 CDN
}
```

### 6. Updated `lib/image-emergency-fallback.ts`
- Marked as deprecated
- Updated to return R2 CDN URL instead of local path
- Recommends using `safeImage()` instead

## Guarantees

### ✅ No More Local File References
- All fallback images now point to R2 CDN
- No `/assets/images/` paths in production code
- No 404 errors for missing local files

### ✅ Always Valid Image URLs
- `safeImage()` never returns null or undefined
- Always returns absolute HTTP(S) URL
- Next.js Image component always receives valid src

### ✅ No AI Calls During Rendering
- `safeImage()` is a pure function
- No OpenAI API calls
- No R2 listing operations
- No RSS fetching

### ✅ Development Warnings
- Logs warning when fallback is used
- Helps identify RSS ingestion issues
- Only logs in development mode

## Testing

### Manual Testing
1. Start dev server: `npm run dev`
2. Visit homepage: http://localhost:3000
3. Check console for:
   - ✅ No 404 errors
   - ✅ No `/assets/images/fallback.jpg` requests
   - ✅ Images loading from R2 CDN

### Expected Behavior

**With Precomputed Images:**
```
Homepage loads → Articles have imageUrl → safeImage(imageUrl) returns imageUrl → Images display
```

**Without Precomputed Images (fallback):**
```
Homepage loads → Articles missing imageUrl → safeImage() returns generic R2 image → Warning logged → Generic image displays
```

## Environment Variables Required

```bash
# Required for fallback images
NEXT_PUBLIC_R2_CDN_URL=https://images.aidrivenfuture.ca

# Or use default if not set
# Default: https://images.aidrivenfuture.ca
```

## Acceptance Criteria

- [x] Homepage cards show images
- [x] No requests to `/assets/images/fallback.jpg`
- [x] No OpenAI calls on navigation
- [x] No ingestion logs on page load
- [x] No console errors
- [x] All images load from R2 CDN
- [x] Fallback uses generic R2 image
- [x] Development warnings for missing images

## Migration Path

### Old Code (Deprecated)
```typescript
import { getDefaultPlaceholder } from '@/lib/image-utils.client';
const imageUrl = article.image || getDefaultPlaceholder();
```

### New Code (Recommended)
```typescript
import { safeImage } from '@/lib/safe-image';
const imageUrl = safeImage(article.image);
```

## Benefits

1. **No 404 Errors** - All images load from R2 CDN
2. **Type Safety** - Always returns string, never null
3. **Simple API** - Single function for all image safety
4. **Development Friendly** - Warnings help debug issues
5. **Production Ready** - No console spam in production
6. **CDN-Only** - All images served from Cloudflare R2
7. **No Breaking Changes** - Backward compatible with existing code

## Related Files

- `lib/safe-image.ts` - New safe image helper
- `components/Hero.tsx` - Homepage hero component
- `components/NewsCard.tsx` - News card component
- `components/NewsGrid.tsx` - News grid with fallback data
- `lib/image-resolver.ts` - Image resolver (updated fallback)
- `lib/image-emergency-fallback.ts` - Emergency fallback (deprecated)
- `lib/image-utils.client.ts` - Client utilities (deprecated placeholder)

## Next Steps

1. ✅ Test homepage in development
2. ✅ Verify no 404 errors
3. ✅ Confirm images load from R2
4. ⏳ Deploy to production
5. ⏳ Monitor for any image loading issues
6. ⏳ Update documentation to recommend `safeImage()`

## Notes

- This fix does NOT touch RSS ingestion logic
- This fix does NOT modify AI image selection
- This fix does NOT change caching behavior
- This fix ONLY updates rendering fallback logic
- All images still precomputed during ingestion
- Fallback only used if ingestion fails or is incomplete

## Summary

**Before:** Homepage tried to load `/assets/images/fallback.jpg` (404)  
**After:** Homepage loads `https://images.aidrivenfuture.ca/generic/generic-01.jpg` (✅)

**Impact:** Homepage now displays images correctly with no console errors.

