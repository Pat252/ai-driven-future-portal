# Emergency Recovery Guide - "fs Module Not Found" Error

## 🚨 Problem
Your site crashes with error: `Module not found: Can't resolve 'fs'`

This happens when server-side code (using Node.js `fs` module) gets imported by client components.

---

## ✅ FIXED - What We Did

### 1. Made fs/path Imports Conditional
**Before (Broken):**
```typescript
import fs from 'fs';
import path from 'path';
```

**After (Fixed):**
```typescript
// Inside function, not at top level
const fs = require('fs');
const path = require('path');
```

This prevents the bundler from including `fs` in client-side code.

### 2. Added Client-Side Safety Checks
**All server-only functions now check:**
```typescript
if (typeof window !== 'undefined') {
  console.warn('⚠️  Server-only function called on client, returning fallback');
  return getDefaultPlaceholder();
}
```

### 3. Documented Server-Only Functions
Added clear warnings to all functions that use file system:
- `getArticleImage()` - ⚠️ SERVER-SIDE ONLY
- `getArticleImageSync()` - ⚠️ SERVER-SIDE ONLY
- `getAllLocalImages()` - ⚠️ SERVER-SIDE ONLY
- `getImageLibrary()` - ⚠️ SERVER-SIDE ONLY

---

## 📋 Architecture (Correct Way)

### Server-Side (✅ Correct)
```
lib/rss.ts (Server Component)
    ↓ calls
lib/image-utils.ts (Server-only functions)
    ↓ uses
fs.readdirSync() (Node.js file system)
    ↓ returns
"/assets/images/all/bitcoin.jpg" (string path)
    ↓ passed to
NewsItem.image property
    ↓ rendered by
NewsCard.tsx (Client Component)
```

**Result:** Client components only receive string paths, never call fs functions.

### Wrong Way (❌ Causes Errors)
```
NewsCard.tsx (Client Component)
    ↓ imports
lib/image-utils.ts
    ↓ tries to use
fs.readdirSync()
    ↓ ERROR!
Module not found: Can't resolve 'fs'
```

---

## 🔍 Verification Checklist

### ✅ Check 1: No Client Component Imports
```bash
# Search for imports in client components
grep -r "import.*image-utils" components/

# Should return: No results (or only server components)
```

### ✅ Check 2: Image Selection in RSS Only
```bash
# Verify image selection happens in lib/rss.ts
grep "getArticleImage\|extractImage" lib/rss.ts

# Should show: extractImage() calls in fetchFeed()
```

### ✅ Check 3: Client Components Receive Strings
```typescript
// In NewsCard.tsx, Hero.tsx - should only see:
interface NewsItem {
  image: string; // ← Just a string path!
}

// NOT:
import { getArticleImage } from '@/lib/image-utils'; // ← Wrong!
```

---

## 🧪 Testing

### Test 1: Development Server
```bash
npm run dev
```

**Expected:**
```
✅ Discovered 97 images in /public/assets/images/all/
[AI Match] "Bitcoin..." -> bitcoins-money-dollars.jpg
Ready on http://localhost:3000
```

**If Error:**
```
Module not found: Can't resolve 'fs'
Module not found: Can't resolve 'path'
```
→ See "Emergency Fix" below

### Test 2: Production Build
```bash
npm run build
```

**Expected:**
```
✓ Compiled successfully
✓ Collecting page data
✓ Generating static pages
```

**If Error:**
```
Error: Module not found
```
→ Client component is importing server-only code

---

## 🚑 Emergency Fix (If Still Broken)

### Step 1: Find the Problem
```bash
# Search for problematic imports
grep -r "from '@/lib/image-utils'" .

# Check these files:
- components/NewsCard.tsx
- components/Hero.tsx
- components/NewsGrid.tsx
- app/page.tsx
```

### Step 2: Remove Client-Side Imports
**If you find:**
```typescript
// In NewsCard.tsx
import { getArticleImage } from '@/lib/image-utils'; // ← DELETE THIS
```

**Replace with:**
```typescript
// NewsCard.tsx should ONLY receive the image path
interface NewsCardProps {
  news: NewsItem; // NewsItem.image is already a string!
}
```

### Step 3: Verify RSS Logic
**In `lib/rss.ts` - should look like this:**
```typescript
async function extractImage(
  item: any, 
  title: string, 
  category: string,
  usedImagesSet: Set<string>
): Promise<string> {
  // Check cache first
  const cachedImage = imageCache.get(getCacheKey(title));
  if (cachedImage) {
    return `/assets/images/all/${cachedImage}`;
  }
  
  // Get image using server-side function
  const localImagePath = await getArticleImage(title, category, usedImagesSet);
  
  // Cache and return
  const filename = localImagePath.split('/').pop() || '';
  if (filename) {
    imageCache.set(getCacheKey(title), filename);
  }
  
  return localImagePath; // Returns string like "/assets/images/all/bitcoin.jpg"
}
```

### Step 4: Restart Server
```bash
# Kill existing process
Ctrl+C

# Clear Next.js cache
rm -rf .next

# Restart
npm run dev
```

---

## 📚 How It Should Work

### Data Flow (Correct)
```
1. User visits homepage
2. Next.js runs getNewsData() on SERVER
3. lib/rss.ts calls extractImage() on SERVER
4. extractImage() calls getArticleImage() on SERVER
5. getArticleImage() uses fs.readdirSync() on SERVER
6. Returns string: "/assets/images/all/bitcoin.jpg"
7. String is passed to NewsCard component
8. NewsCard renders <img src="/assets/images/all/bitcoin.jpg" />
9. Browser loads image (no fs needed!)
```

### Key Points
- ✅ `fs` only runs on server (step 5)
- ✅ Client only receives string paths (step 7)
- ✅ No file system access in browser (step 9)

---

## 🎯 Prevention Tips

### Rule 1: Server-Only Code
**Mark with comments:**
```typescript
/**
 * ⚠️  SERVER-SIDE ONLY
 * ⚠️  DO NOT import in client components
 */
export async function getArticleImage() {
  // ...
}
```

### Rule 2: Use 'server-only' Package
```bash
npm install server-only
```

```typescript
// At top of lib/image-utils.ts
import 'server-only';
```

This will throw a build error if client code tries to import.

### Rule 3: Separate Server/Client Code
```
lib/
├── server/           ← Server-only functions (fs, path, etc.)
│   ├── image-discovery.ts
│   └── ai-curator.ts
└── client/           ← Client-safe utilities
    ├── image-helpers.ts
    └── formatting.ts
```

---

## 🔧 Advanced: Using 'use server' Directive

**Alternative approach (Next.js 13+):**
```typescript
'use server'; // At top of file

export async function getArticleImage() {
  // This function is guaranteed to run on server
  const fs = require('fs');
  // ...
}
```

---

## ✅ Current Status

### Fixed Issues
- ✅ `fs` and `path` imports are now conditional (inside functions)
- ✅ All server-only functions have client-side safety checks
- ✅ Clear documentation added to all functions
- ✅ Image selection happens only in `lib/rss.ts`
- ✅ Client components receive string paths, not function calls

### What Works Now
- ✅ Development server starts without errors
- ✅ Production build succeeds
- ✅ Automatic image discovery works on server
- ✅ Client components render images correctly
- ✅ No "Module not found: 'fs'" errors

---

## 📞 Quick Diagnosis

### Error: `Module not found: Can't resolve 'fs'`
**Cause:** Client component importing server-only code  
**Fix:** Remove import from client component

### Error: `Module not found: Can't resolve 'path'`
**Cause:** Client component importing server-only code  
**Fix:** Same as above

### Error: `getAllLocalImages is not a function`
**Cause:** Function called on client-side  
**Fix:** Only call from `lib/rss.ts`

### Error: `fs.readdirSync is not a function`
**Cause:** Function running in browser  
**Fix:** Add `typeof window !== 'undefined'` check

---

## 🎉 Verification

**Run these commands to verify everything works:**

```bash
# 1. Clear cache
rm -rf .next

# 2. Start dev server
npm run dev

# 3. Check console output
# Should see:
# ✅ Discovered 97 images
# [AI Match] ...
# Ready on http://localhost:3000

# 4. Open browser
# http://localhost:3000

# 5. Check for errors in browser console
# Should see: No errors

# 6. Build for production
npm run build

# 7. Should complete without errors
```

---

## 📝 Summary

**The Fix:**
1. Made `fs`/`path` imports conditional (inside functions with `require()`)
2. Added client-side safety checks (`typeof window !== 'undefined'`)
3. Documented all server-only functions with warnings
4. Ensured image selection only happens in `lib/rss.ts`
5. Client components only receive string paths, never call fs functions

**Result:** ✅ Site works perfectly, no fs errors!

---

**Status:** ✅ FIXED  
**Last Updated:** January 4, 2026  
**Test Status:** All tests passing


