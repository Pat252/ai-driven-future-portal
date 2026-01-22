# Migration from Static Manifest to Runtime R2 Listing

## What Changed

### Before: Static Manifest System
```typescript
// lib/image-manifest.ts (DELETED)
export const R2_IMAGE_MANIFEST: string[] = [
  "generic/placeholder.jpg", // ❌ Hardcoded, might not exist
  "companies/openai/brand-openai-logo.jpg", // ❌ Assumed filename
  ...
];
```

**Problems:**
- Manual maintenance required
- Could contain non-existent files
- No validation until 404 in browser
- Gets outdated as R2 content changes

### After: Runtime R2 Listing
```typescript
// lib/r2-client.ts (NEW)
const allKeys = await listAllR2Objects('aidrivenfuture-images');
// ✅ Lists REAL R2 objects at startup
// ✅ Auto-syncs with R2 bucket
// ✅ Validates before deployment
```

**Benefits:**
- Zero manual maintenance
- Only real R2 object keys
- Fails fast at startup
- Always current with R2 bucket

## Files Changed

### ❌ Deleted
- `lib/image-manifest.ts` - No longer needed

### ✅ Created
- `lib/r2-client.ts` - R2 listing logic using AWS SDK v3

### 🔄 Modified
- `lib/image-utils.server.ts` - Uses runtime listing instead of manifest
- `lib/image-resolver.ts` - Simplified (no placeholder logic)
- `lib/image-constants.ts` - Updated fallback folder constants
- `lib/rss.ts` - Made async to await image library loading

## New Dependencies

```json
{
  "@aws-sdk/client-s3": "^3.x.x"
}
```

Installed automatically during migration.

## Required Environment Variables

### New (Required)
```bash
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=aidrivenfuture-images
```

### Existing (No Change)
```bash
NEXT_PUBLIC_IMAGE_BASE_URL=https://images.aidrivenfuture.ca
NEXT_PUBLIC_IMAGE_SOURCE=r2
```

## Migration Steps

### 1. Set R2 Credentials

Add to `.env.local` (development) or production environment:

```bash
R2_ACCOUNT_ID=<from Cloudflare dashboard>
R2_ACCESS_KEY_ID=<from R2 API tokens>
R2_SECRET_ACCESS_KEY=<from R2 API tokens>
R2_BUCKET_NAME=aidrivenfuture-images
```

### 2. Verify R2 Bucket Contents

Ensure your R2 bucket has:
- ✅ Images in correct folders (ai/, companies/, generic/, etc.)
- ✅ At least 1 image in `generic/` or `ai/` folder
- ✅ No empty required folders

### 3. Install Dependencies

```bash
npm install @aws-sdk/client-s3
```

### 4. Test Locally

```bash
npm run dev
```

Look for startup logs:
```
🔍 Listing objects from R2 bucket: aidrivenfuture-images...
✅ Loaded 1,247 valid images from R2
   📁 Folders: ai/, companies/, generic/, llm/, ...
   🔄 Fallback pool (generic/ + ai/): 87 images
```

### 5. Verify Image Selection

Browse to localhost:3000 and check:
- [ ] Images load without 404s
- [ ] Network tab shows 200 OK for all images
- [ ] Console shows selection strategy (brand/llm/category/fallback)

### 6. Deploy to Production

Set environment variables in production:
- Vercel: Project Settings → Environment Variables
- Other platforms: Platform-specific configuration

## Startup Behavior Changes

### Before
```
✅ Loaded 14 images from R2 manifest
   (No validation, might have 404s later)
```

### After
```
🔍 Listing objects from R2 bucket: aidrivenfuture-images...
✅ Loaded 1,247 valid images from R2
   📁 Folders: ai/, chips/, companies/, datacenters/, economy/, generic/, infrastructure/, llm/, markets/, people/, robotics/, technology/
   🔄 Fallback pool (generic/ + ai/): 87 images
   📂 ai/: 132 images
   📂 companies/: 487 images
   📂 llm/: 52 images
   ...
```

## Error Handling Changes

### Before
Silent failures:
- Manifest contains non-existent file → 404 in browser
- No validation until production
- Errors only visible to end users

### After
Fail-fast at startup:
```
CRITICAL: R2 credentials missing.
Required environment variables:
  - R2_ACCOUNT_ID
  - R2_ACCESS_KEY_ID
  - R2_SECRET_ACCESS_KEY

(Server won't start until fixed)
```

```
CRITICAL: No fallback images in generic/ or ai/ folders.
At least one image must exist in these folders for guaranteed image selection.

(Server won't start until fixed)
```

## Image Selection Changes

### Before: Score-Based Only
All images scored, highest score wins. Could select any image regardless of relevance.

### After: Smart Folder-Based Selection

1. **Brand matching** (`companies/openai/`)
2. **LLM matching** (`llm/gpt/`)
3. **Category matching** (category → relevant folders)
4. **Generic fallback** (`generic/`, `ai/`)

Better matches, more relevant images.

## No More Placeholder Logic

### Before
```typescript
// Multiple hardcoded placeholders
const fallbackFilename = 'ai-robot-future-technology.jpg';
const placeholder = 'placeholder.jpg';
const defaultImage = 'brand-openai-logo.jpg';
```

### After
```typescript
// No hardcoded filenames
// All images from R2 listing
// Fallback is real images from generic/ or ai/ folders
```

## Backward Compatibility

### Local Mode Still Works
If `NEXT_PUBLIC_IMAGE_SOURCE=local`:
- Uses filesystem scanning (unchanged)
- No R2 credentials required
- Legacy behavior preserved

### R2 Mode Requirements
If `NEXT_PUBLIC_IMAGE_SOURCE=r2`:
- **Must** set R2 credentials
- **Must** have R2 bucket with images
- **Must** have fallback images in generic/ or ai/

## Performance Impact

### Startup Time
- **Added:** ~1-2 seconds for R2 listing (once at startup)
- **Cached:** Results cached in memory for server lifetime
- **No per-request impact:** Selection is instant (in-memory)

### Memory Usage
- **Added:** ~100-500 KB for image library cache (1,000-5,000 images)
- **Negligible:** In-memory Map for folder indexing

### API Calls
- **Startup:** 1-10 ListObjectsV2 calls (depends on bucket size)
- **Runtime:** 0 calls (all cached)
- **Cost:** Minimal (Class A operations are cheap)

## Rollback Plan

If issues occur, rollback steps:

1. **Revert to previous commit:**
   ```bash
   git revert HEAD
   ```

2. **Or temporarily disable R2 mode:**
   ```bash
   NEXT_PUBLIC_IMAGE_SOURCE=local
   ```

3. **Or restore old manifest file:**
   - Copy `lib/image-manifest.ts` from git history
   - Revert changes to `lib/image-utils.server.ts`

## Testing Checklist

- [ ] R2 credentials set correctly
- [ ] Startup logs show successful R2 listing
- [ ] Images load without 404s
- [ ] Multiple article refreshes show same image (determinism)
- [ ] Brand mentions select correct company logos
- [ ] LLM mentions select correct model images
- [ ] Generic articles get fallback images
- [ ] Network tab shows all images from R2 CDN

## Common Issues & Solutions

### "R2 credentials missing"
**Solution:** Set all 4 R2 env vars (ACCOUNT_ID, ACCESS_KEY_ID, SECRET_ACCESS_KEY, BUCKET_NAME)

### "No valid images found"
**Solution:** 
- Check R2 bucket has image files
- Verify files are in allowed folders
- Check file extensions match IMAGE_EXTENSIONS

### "No fallback images"
**Solution:** Add at least 1 image to `generic/` or `ai/` folder in R2

### Images return 404
**Solution:**
- Check `NEXT_PUBLIC_IMAGE_BASE_URL` is correct
- Verify R2 bucket is publicly readable
- Test CDN URL directly in browser

### All images are generic
**Solution:**
- Check company folders exist: `companies/openai/`, etc.
- Verify article titles contain brand keywords
- Review `BRAND_NAMES` array matches your folders

## Support

For issues:
1. Check startup logs for error messages
2. Verify R2 bucket structure matches requirements
3. Test R2 access with AWS CLI
4. Review docs/R2_RUNTIME_LISTING_SYSTEM.md

## Next Steps

After successful migration:
1. Monitor production logs for R2 listing success
2. Verify image load performance
3. Check for any 404s in monitoring
4. Consider adding more images to R2 bucket for variety





