# R2 Image Manifest Setup Guide

## ⚠️ CRITICAL: No Invented Filenames

The image system **ONLY** uses real Cloudflare R2 object keys. The system will **NEVER**:
- Invent filenames
- Guess paths by convention
- Use placeholder or fake paths

## How to Populate `lib/image-manifest.ts`

### Step 1: List All R2 Objects

```bash
# Using AWS CLI (works with R2)
aws s3 ls s3://your-bucket-name --recursive --endpoint-url https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com

# Or using Wrangler
wrangler r2 object list YOUR_BUCKET_NAME
```

### Step 2: Filter for Images

```bash
# Extract only image files
aws s3 ls s3://your-bucket-name --recursive | grep -E '\.(jpg|jpeg|png|webp|gif)$'
```

### Step 3: Extract Object Keys

Copy the **exact object keys** (full paths) from the output.

Example output:
```
2024-01-10 12:34:56  152341 companies/openai/logo-openai-2024.jpg
2024-01-10 12:35:12   98234 generic/ai-abstract-neural.jpg
2024-01-10 12:36:43  201928 technology/quantum-computing.jpg
```

From this, extract the keys:
- `companies/openai/logo-openai-2024.jpg`
- `generic/ai-abstract-neural.jpg`
- `technology/quantum-computing.jpg`

### Step 4: Update `lib/image-manifest.ts`

```typescript
export const R2_IMAGE_MANIFEST: string[] = [
  // Copy exact keys from R2 bucket here
  "companies/openai/logo-openai-2024.jpg",
  "generic/ai-abstract-neural.jpg",
  "technology/quantum-computing.jpg",
  // ... add all real keys
];
```

## Folder Structure Requirements

### ✅ Allowed Folders (from `lib/image-constants.ts`)

Only paths starting with these prefixes are valid:
- `ai/`
- `chips/`
- `companies/`
- `datacenters/`
- `economy/`
- `generic/` ⭐ **MANDATORY - must have at least 1 image**
- `infrastructure/`
- `llm/`
- `markets/`
- `people/`
- `robotics/`
- `security/`
- `technology/`

### ❌ Forbidden Folders

Paths starting with these will be rejected:
- `charts/`
- `fallback/`
- `finance/`
- `office/`

### ⭐ Mandatory Fallback Requirement

**At least 1 image must exist in:**
- `generic/` folder (primary fallback)
- OR `ai/` folder (secondary fallback)

This ensures every article can receive an image even if no brand/category match is found.

## Image Selection Logic

### 1. Brand/Company Matching (Priority 1)
```
Article mentions "OpenAI" → Looks for paths in companies/openai/
Article mentions "NVIDIA" → Looks for paths in companies/nvidia/
```

### 2. Category Matching (Priority 2)
```
Category: "Gen AI" → Looks for ai/, llm/, technology/
Category: "AI Economy" → Looks for economy/, markets/
```

### 3. Fallback (Priority 3)
```
No match found → Uses images from generic/ or ai/
```

### 4. Deterministic Selection
```
Same article title → Always same image
Uses hash(title) → index in pool
```

## Validation at Startup

The system validates:

1. ✅ Manifest is not empty
2. ✅ At least 1 image passes allowed/forbidden folder filters
3. ✅ At least 1 image exists in `generic/` or `ai/` folders
4. ❌ Throws error if any validation fails

## Example: Correct vs Incorrect

### ✅ CORRECT
```typescript
export const R2_IMAGE_MANIFEST: string[] = [
  "companies/openai/openai-logo-black.jpg",        // Real file in R2
  "generic/abstract-ai-blue-waves.jpg",            // Real file in R2
  "technology/neural-network-visualization.jpg",   // Real file in R2
];
```

### ❌ INCORRECT
```typescript
export const R2_IMAGE_MANIFEST: string[] = [
  "companies/openai/brand-openai-logo.jpg",  // ❌ Assumes naming convention
  "generic/ai-robot-future-technology.jpg",  // ❌ Might not exist
  "companies/google/logo.jpg",               // ❌ Generic name, may not exist
];
```

## Verifying Your Setup

### Dev Mode Checks

When starting the app in development mode:

```bash
npm run dev
```

Look for console output:
```
✅ Loaded 47 valid R2 images from manifest
   📁 Fallback pool (generic/ + ai/): 8 images
   📋 Sample paths: ["companies/openai/...", "generic/...", ...]
```

### If You See Errors

**Error: "R2_IMAGE_MANIFEST is empty"**
→ You need to populate `lib/image-manifest.ts` with real R2 keys

**Error: "No valid images after filtering"**
→ All paths were rejected. Check they start with allowed folders.

**Error: "No fallback images found"**
→ Add at least 1 image in `generic/` or `ai/` folder

## Automating Manifest Generation

### Option 1: Node.js Script

```javascript
// scripts/generate-manifest.js
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

async function listImages() {
  const command = new ListObjectsV2Command({
    Bucket: 'your-bucket-name',
  });
  
  const response = await client.send(command);
  const imageKeys = response.Contents
    .map(obj => obj.Key)
    .filter(key => /\.(jpg|jpeg|png|webp|gif)$/i.test(key));
  
  console.log('export const R2_IMAGE_MANIFEST: string[] = [');
  imageKeys.forEach(key => {
    console.log(`  "${key}",`);
  });
  console.log('];');
}

listImages();
```

### Option 2: Manual CSV Export

Export R2 bucket listing to CSV, then use spreadsheet to generate array.

## Production Checklist

Before deploying:

- [ ] `lib/image-manifest.ts` contains real R2 keys (not placeholders)
- [ ] At least 1 image in `generic/` or `ai/` folder
- [ ] All paths verified to exist in R2 bucket
- [ ] Dev mode startup shows no errors or warnings
- [ ] Test article rendering shows images (no 404s in Network tab)
- [ ] `next.config.ts` includes R2 domain in `remotePatterns`

## Troubleshooting

**Problem: Images return 404**
- Verify the exact key exists in R2: `aws s3 ls s3://bucket/path/to/image.jpg`
- Check R2 public access settings
- Verify CDN URL is correct in `.env.local`

**Problem: No images load at all**
- Check `NEXT_PUBLIC_IMAGE_SOURCE=r2` is set
- Check `NEXT_PUBLIC_R2_CDN_URL` is set correctly
- Verify manifest is not empty

**Problem: Always getting fallback images**
- Brand/company names may not match folder names
- Check article title/description contains company keywords
- Verify company folders exist and are in manifest

