# R2 Runtime Listing System

## Overview

The image system now **lists Cloudflare R2 objects at runtime** instead of using a static manifest. This eliminates all hardcoded filenames, placeholder paths, and manual maintenance.

## How It Works

### 1. Runtime R2 Listing (`lib/r2-client.ts`)

On server startup, the system:

1. **Connects to Cloudflare R2** using AWS SDK v3 (S3-compatible)
2. **Lists all objects** in the bucket (handles pagination automatically)
3. **Filters for image files** (.jpg, .jpeg, .png, .webp, .gif)
4. **Validates folder structure** (allowed/forbidden folders)
5. **Builds in-memory cache** for fast image selection

```typescript
// Example: Listing 1,247 images from R2
const allKeys = await listAllR2Objects('aidrivenfuture-images');
// Returns: ["ai/ai-cell-robot.jpg", "companies/openai/logo.jpg", ...]
```

### 2. Folder-Based Indexing

Images are indexed by folder for smart selection:

```
Map {
  "ai/" => ["ai/ai-cell-robot.jpg", "ai/robot-future.jpg", ...],
  "companies/" => ["companies/openai/logo.jpg", "companies/nvidia/gpu.jpg", ...],
  "llm/" => ["llm/gpt-4-logo.jpg", "llm/claude-anthropic.jpg", ...],
  "generic/" => ["generic/tech-abstract.jpg", ...],
  ...
}
```

### 3. Smart Image Selection

The system uses a **4-tier selection strategy**:

#### Tier 1: Brand/Company Matching
```
Article title: "OpenAI releases GPT-5"
→ Searches: companies/openai/*
→ Selects: companies/openai/logo-2024.jpg
```

#### Tier 2: LLM Matching
```
Article mentions: "Claude 3.5"
→ Searches: llm/*
→ Selects: llm/claude-anthropic.jpg
```

#### Tier 3: Category Matching
```
Category: "AI Economy"
→ Searches: economy/, markets/
→ Selects: economy/bitcoin-chart.jpg
```

#### Tier 4: Generic Fallback
```
No match found
→ Searches: generic/, ai/
→ Selects: generic/tech-abstract.jpg
```

### 4. Deterministic Selection

Selection is **deterministic** (SSR-safe):
- Same article title → same image (always)
- Uses hash of title → index in pool
- No randomness across renders

```typescript
const titleHash = simpleHash(title); // 0.0 to 1.0
const index = Math.floor(titleHash * candidatePool.length);
const selected = candidatePool[index];
```

### 5. URL Construction

URLs are **direct concatenation** (no logic):

```typescript
// Input: "companies/openai/logo-2024.jpg"
// Output: "https://images.aidrivenfuture.ca/companies/openai/logo-2024.jpg"

const url = `${NEXT_PUBLIC_IMAGE_BASE_URL}/${r2Key}`;
```

## Required Environment Variables

```bash
# R2 Credentials (server-side only, not NEXT_PUBLIC_)
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=aidrivenfuture-images

# Public CDN URL (client-side safe)
NEXT_PUBLIC_IMAGE_BASE_URL=https://images.aidrivenfuture.ca
NEXT_PUBLIC_IMAGE_SOURCE=r2
```

## Folder Structure Requirements

### ✅ Allowed Folders
- `ai/` - General AI images
- `chips/` - Semiconductor/hardware
- `companies/` - Company logos and branded images
- `datacenters/` - Data center infrastructure
- `economy/` - Economic/financial AI topics
- `generic/` - **MANDATORY** - Generic fallback images
- `infrastructure/` - Tech infrastructure
- `llm/` - Large language model specific
- `markets/` - Market analysis
- `people/` - People/portraits
- `robotics/` - Robotics/automation
- `security/` - Security/privacy
- `technology/` - General technology

### ❌ Forbidden Folders
- `charts/` - Empty or invalid
- `finance/` - Deprecated
- `fallback/` - Old system
- `office/` - Empty

### 🔒 Mandatory Requirements

**At least 1 image must exist in:**
- `generic/` folder (primary fallback)
- OR `ai/` folder (secondary fallback)

If neither folder has images, the system will **throw a fatal error at startup**.

## Startup Behavior

### Success Case
```
🔍 Listing objects from R2 bucket: aidrivenfuture-images...
✅ Loaded 1,247 valid images from R2
   📁 Folders: ai/, chips/, companies/, datacenters/, economy/, generic/, llm/, markets/, people/, robotics/, technology/
   🔄 Fallback pool (generic/ + ai/): 87 images
   📂 ai/: 132 images
   📂 companies/: 487 images
   📂 llm/: 52 images
   📂 generic/: 45 images
   ...
```

### Failure Case (Missing Credentials)
```
CRITICAL: R2 credentials missing.
Required environment variables:
  - R2_ACCOUNT_ID
  - R2_ACCESS_KEY_ID
  - R2_SECRET_ACCESS_KEY
```

### Failure Case (No Images)
```
CRITICAL: No valid images found in R2 bucket "aidrivenfuture-images".
Total objects: 1,247
Image files: 0
After filtering: 0
Check your R2 bucket contents and folder structure.
```

### Failure Case (No Fallback)
```
CRITICAL: No fallback images in generic/ or ai/ folders.
At least one image must exist in these folders for guaranteed image selection.
Found folders: companies/, llm/, technology/
```

## Performance

### Caching
- R2 listing happens **once at startup**
- Results cached in memory for entire server lifetime
- No per-request R2 API calls
- Image selection is instant (in-memory lookup)

### Pagination
- Handles large buckets (10,000+ objects)
- Automatic pagination through all results
- No object limit

### Error Handling
- **Fails fast** at startup (not silently)
- Clear error messages with debugging info
- No silent fallbacks to placeholder images

## Benefits vs. Static Manifest

| Static Manifest | Runtime Listing |
|----------------|-----------------|
| ❌ Manual updates required | ✅ Auto-syncs with R2 |
| ❌ Can contain non-existent files | ✅ Only real R2 objects |
| ❌ Gets outdated | ✅ Always current |
| ❌ Deployment without validation | ✅ Validates at startup |
| ❌ Silent 404s in production | ✅ Fails loudly before deployment |

## No Placeholders

The system **never uses**:
- ❌ `placeholder.jpg`
- ❌ `ai-robot-future-technology.jpg`
- ❌ `brand-*-logo.jpg` (convention-based)
- ❌ Hardcoded fallback paths
- ❌ Invented filenames

Every image URL is:
- ✅ An exact R2 object key
- ✅ Verified to exist at startup
- ✅ Validated against folder rules

## Troubleshooting

### Images Not Loading

1. **Check R2 credentials:**
   ```bash
   echo $R2_ACCOUNT_ID
   echo $R2_ACCESS_KEY_ID
   # (don't echo secret key in logs)
   ```

2. **Verify bucket name:**
   ```bash
   echo $R2_BUCKET_NAME
   # Should match your R2 bucket exactly
   ```

3. **Test R2 access manually:**
   ```bash
   aws s3 ls s3://aidrivenfuture-images --endpoint-url https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
   ```

4. **Check startup logs:**
   - Should see "✅ Loaded X valid images from R2"
   - If not, R2 listing failed

### Server Won't Start

**Error: "R2 credentials missing"**
- Set all required env vars (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY)

**Error: "No valid images found"**
- Check R2 bucket has image files
- Verify files are in allowed folders
- Check file extensions (.jpg, .png, .webp, .gif)

**Error: "No fallback images"**
- Add at least 1 image to `generic/` or `ai/` folder
- This is mandatory for guaranteed image selection

### All Images Are Generic

- Brand names may not match folder names
- Check folder structure: `companies/openai/`, `companies/nvidia/`, etc.
- Verify article titles contain brand keywords
- Check `BRAND_NAMES` array in `lib/image-utils.server.ts`

## Development

### Running Locally

```bash
# Set env vars in .env.local
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=aidrivenfuture-images
NEXT_PUBLIC_IMAGE_BASE_URL=https://images.aidrivenfuture.ca
NEXT_PUBLIC_IMAGE_SOURCE=r2

# Start dev server
npm run dev

# Watch for startup logs
# Should see: ✅ Loaded X valid images from R2
```

### Testing Image Selection

Check dev console for selection strategy:

```
[brand:openai] "OpenAI releases GPT-5..." → companies/openai/logo-2024.jpg
[llm:claude] "Anthropic announces Claude 3.5..." → llm/claude-anthropic.jpg
[category:AI Economy] "Bitcoin AI trading surges..." → economy/crypto-chart.jpg
[fallback:generic] "Random tech news..." → generic/tech-abstract.jpg
```

### Clearing Cache

```typescript
import { clearImageCache } from '@/lib/image-utils.server';

// In dev mode, clear cache to re-list R2
clearImageCache();
const freshList = await getImageLibrary();
```

## Production Deployment

### Pre-Deployment Checklist

- [ ] R2 bucket contains images in correct folders
- [ ] At least 1 image in `generic/` or `ai/`
- [ ] All env vars set in production environment
- [ ] `NEXT_PUBLIC_IMAGE_SOURCE=r2`
- [ ] `NEXT_PUBLIC_IMAGE_BASE_URL` points to R2 CDN
- [ ] R2 credentials have read access to bucket

### Post-Deployment Verification

1. **Check build logs:**
   ```
   ✅ Loaded 1,247 valid images from R2
   ```

2. **Test image URLs in browser:**
   ```
   https://images.aidrivenfuture.ca/companies/openai/logo.jpg
   ```

3. **Check Network tab:**
   - All images should return 200 OK
   - No 404s

4. **Verify determinism:**
   - Refresh same article multiple times
   - Should always show same image

## Security

### Credentials
- R2 credentials are **server-side only**
- Never exposed to client
- Not prefixed with `NEXT_PUBLIC_`

### Access Control
- R2 bucket should have **read-only** credentials
- Use IAM policies to restrict write access
- Image listing uses read-only operations

### CDN
- Public CDN URL is safe to expose
- Images are public-readable via CDN
- R2 API credentials remain private

## Maintenance

### Adding New Images

1. Upload to R2 bucket in correct folder
2. No code changes needed
3. Restart server to pick up new images
4. System auto-discovers and validates

### Removing Images

1. Delete from R2 bucket
2. No code changes needed
3. Restart server to refresh list

### Changing Folder Structure

1. Update `R2_ALLOWED_ROOTS` in `lib/image-constants.ts`
2. Move files in R2 bucket
3. Deploy changes

No manual manifest updates required!





