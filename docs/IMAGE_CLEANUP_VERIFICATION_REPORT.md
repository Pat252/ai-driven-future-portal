# 🩺 IMAGE CLEANUP VERIFICATION REPORT

**Date:** 2026-01-11  
**Status:** ⚠️ VERIFICATION BLOCKED - MISSING ENVIRONMENT CONFIGURATION

---

## Executive Summary

**DELETION IS BLOCKED** - Cannot safely delete `/public/assets/images/all/` without confirming runtime environment configuration.

---

## Step 1: Runtime Image Usage - ✅ VERIFIED SAFE

### Finding: No Runtime References to `/assets/images/all/` in HTTP Mode

**Evidence:**

1. **`components/NewsCard.tsx` (Line 26):**
```typescript
if (!news.image || !news.image.startsWith('http')) {
  throw new Error(`Missing or invalid imageUrl for article`);
}
```
**Analysis:** Component REJECTS any image that doesn't start with `http`. Local paths (`/assets/images/all/`) would fail this check.

2. **`components/Hero.tsx` (Line 15):**
```typescript
if (!item.image || !item.image.startsWith('http')) {
  throw new Error(`Missing or invalid imageUrl for trending`);
}
```
**Analysis:** Same requirement - ONLY HTTP URLs accepted.

3. **No Hardcoded Local Paths:**
   - No JSX/TSX components reference `/assets/images/all/` directly
   - No CSS/Tailwind classes reference local images
   - No build-time imports of local images

**Conclusion:** If the system is in R2 mode, `/public/assets/images/all/` is NEVER accessed at runtime.

---

## Step 2: Image Source of Truth - ⚠️ CONFIGURATION UNCLEAR

### Architecture Analysis

**Image Resolution Flow:**

```typescript
// lib/image-utils.server.ts (Line 192-198)
const source = (process.env.NEXT_PUBLIC_IMAGE_SOURCE as 'local' | 'r2') || 'local';

if (source === 'r2') {
  imageLibraryCache = await listR2Images();  // Uses Cloudflare R2
  return imageLibraryCache;
}

// LOCAL MODE: Scans filesystem
const imagesDir = path.join(process.cwd(), 'public', 'assets', 'images', 'all');
```

**Key Decision Point:** `process.env.NEXT_PUBLIC_IMAGE_SOURCE`

| Mode | Image Source | Local Files Used? |
|------|--------------|-------------------|
| `r2` | Cloudflare R2 bucket | ❌ NO (R2 only) |
| `local` or undefined | `/public/assets/images/all/` | ✅ YES (required) |

### Critical Finding: NO ENVIRONMENT FILE DETECTED

```bash
❌ .env not found
❌ .env.local not found
❌ .env.production not found
```

**Implication:** Without explicit configuration, the system defaults to `'local'` mode.

**DEFAULT BEHAVIOR (Line 192):**
```typescript
const source = (process.env.NEXT_PUBLIC_IMAGE_SOURCE as 'local' | 'r2') || 'local';
//                                                                            ^^^^^^
//                                                                          DEFAULTS TO LOCAL
```

---

## Step 3: Evidence from Previous Fixes

### All Recent Fixes Assume R2 Mode

1. **Image Lock Fix (2026-01-11):**
   - Extracts keys from R2 CDN URLs
   - Uses `process.env.NEXT_PUBLIC_R2_CDN_URL`
   
2. **Ingestion System:**
   - Calls `getImageLibrary()` → `getAllImages()` → `listR2Images()`
   - Expects R2 bucket name: `process.env.R2_BUCKET_NAME`

3. **Component Requirements:**
   - All components require HTTP URLs (CDN format)
   - No components accept `/assets/images/` paths

**Conclusion:** The system WAS DESIGNED for R2, but WITHOUT `.env` configuration, it CANNOT work.

---

## Step 4: Current State Assessment

### Files in `/public/assets/images/`

```
public/assets/images/
├── all/                              [134 JPG files] ⚠️ MAY BE REQUIRED
│   ├── (various .jpg files)
│
├── categories/                       [INVALID - Nested structure]
│   └── public/
│       └── assets/
│           └── images/
│               └── all/
│
└── defaults/                         [OLD SYSTEM - SVG Placeholders]
    ├── placeholder.jpg.svg
    ├── placeholder.webp.svg
    └── tech-generic.webp.svg
```

### Referenced but Missing Files

- `og-brand-banner.png.svg` - Referenced in `app/layout.tsx` line 30, 44
- Does NOT exist in `public/assets/images/`
- ⚠️ **Open Graph images are broken**

---

## Critical Questions (MUST ANSWER BEFORE DELETION)

### Question 1: What is the ACTUAL runtime value of `NEXT_PUBLIC_IMAGE_SOURCE`?

**How to Check:**
```bash
# In production/development environment:
node -e "console.log(process.env.NEXT_PUBLIC_IMAGE_SOURCE)"
```

**Expected Answer:**
- If `r2` → `/public/assets/images/all/` is SAFE TO DELETE
- If `undefined` or `local` → **DELETION WOULD BREAK THE SITE**

### Question 2: Does the production deployment have R2 credentials?

**Required Environment Variables for R2 Mode:**
```bash
NEXT_PUBLIC_IMAGE_SOURCE=r2
NEXT_PUBLIC_R2_CDN_URL=https://images.aidrivenfuture.ca
R2_BUCKET_NAME=your-bucket-name
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_ACCOUNT_ID=your-account-id
```

**How to Verify:**
```bash
# Check if R2 environment variables are set
env | grep R2_
```

### Question 3: Is the site currently functional?

**If the site is working:**
- Runtime images are loading correctly
- Then EITHER:
  - R2 mode is configured (safe to delete local images)
  - OR local mode is working (DO NOT delete)

**How to Verify:**
```bash
curl -X POST http://localhost:3000/api/ingest
# Check terminal output for:
# "🔍 Listing objects from R2 bucket: ..." → R2 mode
# "✅ Discovered X images in /public/assets/images/all/" → Local mode
```

---

## Recommendations

### Immediate Actions (BEFORE ANY DELETION)

#### 1. Create Environment Configuration File

**File:** `.env.local` (for development) or `.env.production` (for production)

**Required Content:**
```bash
# Image Source Configuration
NEXT_PUBLIC_IMAGE_SOURCE=r2
NEXT_PUBLIC_R2_CDN_URL=https://images.aidrivenfuture.ca

# R2 Credentials (Server-side only)
R2_ACCOUNT_ID=your-account-id-here
R2_ACCESS_KEY_ID=your-access-key-here
R2_SECRET_ACCESS_KEY=your-secret-key-here
R2_BUCKET_NAME=your-bucket-name-here

# OpenAI (for AI image selection)
OPENAI_API_KEY=your-openai-key-here
```

#### 2. Verify R2 Mode is Active

```bash
# Start development server
npm run dev

# Trigger ingestion
curl -X POST http://localhost:3000/api/ingest

# Expected output (R2 mode):
🔍 Listing objects from R2 bucket: your-bucket-name...
📚 Loaded 199 images from R2

# NOT this (local mode):
✅ Discovered 134 images in /public/assets/images/all/
```

#### 3. Test Homepage

```bash
# Visit homepage
open http://localhost:3000

# Check browser console for errors
# Should NOT see:
# ❌ Image failed to load: /assets/images/all/...
```

### Safe Deletion Steps (ONLY AFTER VERIFICATION)

**IF AND ONLY IF:**
1. ✅ `.env.local` exists with `NEXT_PUBLIC_IMAGE_SOURCE=r2`
2. ✅ R2 credentials are configured
3. ✅ Ingestion logs show: `"Listing objects from R2 bucket"`
4. ✅ Homepage images load correctly (HTTP URLs)
5. ✅ `npm run build` completes without errors

**THEN you can safely delete:**

```bash
# Safe deletions:
rm -rf public/assets/images/all/
rm -rf public/assets/images/categories/
rm -rf public/assets/images/defaults/
```

**DO NOT delete:**
```bash
# Keep these (if they exist):
public/favicon.ico
public/icons/
public/og/
```

---

## Current Status: 🔴 BLOCKED

### Why Deletion is Blocked

1. **No environment configuration file detected**
2. **Cannot verify runtime mode (R2 vs local)**
3. **Risk of breaking the site if local mode is active**

### What Happens if We Delete Now

| Scenario | Impact |
|----------|--------|
| **If R2 mode is configured** | ✅ Safe - Images load from CDN |
| **If local mode is active** | ❌ **SITE BREAKS** - All images 404 |
| **If no env vars set** | ❌ **SITE BREAKS** - Defaults to local mode |

---

## Next Steps

### Option 1: Confirm R2 Configuration (Recommended)

1. Create `.env.local` with R2 credentials
2. Verify ingestion uses R2: `curl -X POST http://localhost:3000/api/ingest`
3. Test homepage loads correctly
4. Run build: `npm run build`
5. THEN safely delete local images

### Option 2: Keep Local Images as Fallback (Conservative)

1. Keep `/public/assets/images/all/` for now
2. Add proper environment configuration
3. Verify R2 mode works in production
4. Delete local images in a future cleanup

### Option 3: Create Verification Script

```javascript
// scripts/verify-image-mode.js
const mode = process.env.NEXT_PUBLIC_IMAGE_SOURCE || 'local';
console.log(`Image Mode: ${mode}`);

if (mode === 'local') {
  console.log('⚠️  WARNING: Local mode active - do NOT delete /public/assets/images/all/');
} else {
  console.log('✅ R2 mode active - local images are unused');
}
```

---

## Summary

**Can we delete `/public/assets/images/all/`?**

Answer: **NOT YET** - Environment configuration must be verified first.

**What's blocking deletion?**

1. No `.env` file detected
2. Cannot confirm `NEXT_PUBLIC_IMAGE_SOURCE=r2`
3. System may be running in local mode (requires these files)

**What's the safe path forward?**

1. Add `.env.local` with R2 configuration
2. Verify R2 mode is working
3. Test build and runtime
4. THEN delete local images

**Risk Assessment:**

| Action | Risk Level | Impact if Wrong |
|--------|------------|-----------------|
| Delete now | 🔴 HIGH | Site completely breaks (all images 404) |
| Verify first, then delete | 🟢 LOW | Safe cleanup |
| Keep files indefinitely | 🟡 MEDIUM | Wasted disk space, confusing |

---

## Conclusion

**🛑 DO NOT DELETE YET**

The local images in `/public/assets/images/all/` MAY be required if the system is running in local mode (which is the default without environment configuration).

**Next action:** Create `.env.local` and verify R2 mode is active before proceeding with deletion.

