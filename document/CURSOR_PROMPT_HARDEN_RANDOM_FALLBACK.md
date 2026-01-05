# ✅ Cursor Prompt — Harden Random Fallback to NEVER Use Brand Images

## 🎯 CONTEXT

After deploying CSV-driven image selection, we added a random fallback for generic articles to ensure images always render.

**However:** Brand images (logos, trademarks, company visuals) must **NEVER** be used as fallback images for generic articles, even when random selection is applied.

Brand images are explicitly tied to companies and cannot appear in generic or concept-only articles.

---

## 🛑 HARD RULE (NON-NEGOTIABLE)

**Random fallback images MUST be limited to CSV-verified GENERIC images only.**

Brand images must be excluded at **every** fallback layer.

### Enforcement Criteria:
- `primary_category` = `"Generic"` (REQUIRED)
- `logo_visible` = `"No"` (REQUIRED)
- `trademark_present` = `"No"` (REQUIRED)

**All three conditions must be true** for an image to be eligible for generic article fallback.

---

## 🔧 REQUIRED UPDATE

**File:** `lib/image-utils.ts`

**Function:** `getArticleImage(...)`

**Location:** After TIER 2 (keyword matching) and before TIER 3 (final fallback)

---

## 📝 IMPLEMENTATION

### Step 1: Locate the Insertion Point

Find this section in `lib/image-utils.ts` (around line 400-450):

```typescript
  // ============================================================================
  // TIER 2: KEYWORD MATCHING (with CSV filtering)
  // ============================================================================
  
  if (candidateFilenames.length > 0) {
    // ... keyword matching logic ...
    
    if (bestMatch.score > 0) {
      console.log(`[Keyword Match + CSV] ...`);
      usedImagesSet.add(bestMatch.filename);
      return `/assets/images/all/${bestMatch.filename}`;
    }
  }
  
  // <<<< INSERT NEW TIER 2.5 HERE (before TIER 3) >>>>
  
  // ============================================================================
  // TIER 3: FALLBACK (existing logic)
  // ============================================================================
```

### Step 2: Insert NEW TIER 2.5

**Add this code block BEFORE TIER 3:**

```typescript
  // ============================================================================
  // TIER 2.5: CSV RANDOM FALLBACK (GENERIC-ONLY, BRAND-SAFE)
  // ============================================================================
  // 
  // CRITICAL SAFETY LAYER:
  // - Only triggered for GENERIC articles (not brand articles)
  // - Only uses images with primary_category="Generic"
  // - Enforces logo_visible="No" AND trademark_present="No"
  // - Prevents brand leakage via random selection
  // 
  // This ensures generic articles NEVER show brand logos, even in fallback.
  // ============================================================================

  if (
    articleClassification.type === "generic" &&
    candidateMetadata.length > 0
  ) {
    // Enforce GENERIC-only images (brand-safe)
    const genericOnlyImages = candidateMetadata.filter(img =>
      img.primary_category === "Generic" &&
      img.logo_visible === "No" &&
      img.trademark_present === "No"
    );

    if (genericOnlyImages.length > 0) {
      // Prefer unused images for visual diversity
      const unusedGenericImages = genericOnlyImages.filter(
        img => !usedImagesSet.has(img.filename)
      );

      // Use unused images if available, otherwise allow reuse
      const fallbackPool =
        unusedGenericImages.length > 0
          ? unusedGenericImages
          : genericOnlyImages;

      // Random selection from brand-safe pool
      const randomImage =
        fallbackPool[Math.floor(Math.random() * fallbackPool.length)];

      if (randomImage?.filename) {
        console.log(
          `[CSV Random Generic Fallback] "${title.substring(0, 50)}${title.length > 50 ? '...' : ''}" -> ${randomImage.filename} (Brand-Safe)`
        );
        usedImagesSet.add(randomImage.filename);
        return `/assets/images/all/${randomImage.filename}`;
      }
    } else {
      // Critical warning: No generic-safe images available
      console.warn(
        `[CSV Fallback Warning] No GENERIC-safe images available for generic article: "${title.substring(0, 50)}${title.length > 50 ? '...' : ''}"`
      );
      console.warn(
        `  - Total candidates: ${candidateMetadata.length}`
      );
      console.warn(
        `  - Filtered pool had no images with primary_category=Generic, logo_visible=No, trademark_present=No`
      );
      console.warn(
        `  - Proceeding to TIER 3 fallback (hardcoded registry)`
      );
    }
  }
```

---

## 🧠 WHY THIS IS CORRECT

This version guarantees:

| Rule | Enforced |
|------|----------|
| Brand images never used for generic articles | ✅ |
| Logos excluded | ✅ |
| Trademarks excluded | ✅ |
| CSV remains authoritative | ✅ |
| Random fallback still works | ✅ |
| No filename heuristics | ✅ |
| Production-safe | ✅ |

### Key Design Decisions:

1. **Only for Generic Articles**
   - `if (articleClassification.type === "generic")` ensures brand articles skip this tier
   - Brand articles rely on GPT/keyword matching only

2. **Triple Filter Protection**
   - `primary_category === "Generic"` - CSV-driven category
   - `logo_visible === "No"` - No visible logos/branding
   - `trademark_present === "No"` - No trademark elements
   - All three must be true

3. **Visual Diversity**
   - Prefers unused images (`unusedGenericImages`)
   - Falls back to full pool if all used
   - Adds to `usedImagesSet` after selection

4. **Comprehensive Logging**
   - Success: Shows filename with "(Brand-Safe)" marker
   - Warning: Details why no generic images available
   - Debug: Shows candidate counts for troubleshooting

---

## 🧪 VALIDATION CHECKLIST

### After deploying, run these tests:

### 1️⃣ Generic Article Test

**Input:**
```
Title: "The Future of Generative AI"
Type: Generic article (no brand mentions)
```

**Expected Result:**
- ✅ Always shows an image
- ✅ Image has `primary_category = "Generic"`
- ✅ Image has `logo_visible = "No"`
- ✅ Image has `trademark_present = "No"`

**Console Log Should Show:**
```
[CSV Random Generic Fallback] "The Future of Generative AI" -> generic-ai-03.jpg (Brand-Safe)
```

### 2️⃣ Brand Article Test

**Input:**
```
Title: "Microsoft Announces New AI Features"
Type: Brand article (Microsoft mentioned)
```

**Expected Result:**
- ✅ Uses brand image via GPT or keyword logic (TIER 1 or 2)
- ✅ Random fallback NOT triggered (skipped for brand articles)
- ✅ Shows Microsoft-related brand image

**Console Log Should Show:**
```
[AI Match + CSV] "Microsoft Announces New AI Features" -> brand-microsoft-building.jpg
```

### 3️⃣ Log Validation

**You SHOULD see logs like:**
```
[CSV Random Generic Fallback] "AI Research Advances..." -> generic-ai-neural-abstract.jpg (Brand-Safe)
[CSV Random Generic Fallback] "Machine Learning Tutorial..." -> generic-tech-circuit.jpg (Brand-Safe)
```

**You should NEVER see:**
```
❌ microsoft-logo.jpg
❌ google-campus.jpg
❌ openai-building.jpg
❌ brand-amazon-factory.jpg
❌ netflix-tv-logo.jpg
```

### 4️⃣ CSV Integrity Test

**Manual Test:**
1. Edit CSV: Change `generic-ai-01.jpg` to have `logo_visible = "Yes"`
2. Restart server
3. Test generic article
4. **Expected:** `generic-ai-01.jpg` no longer appears in fallback pool
5. **Restore CSV** after test

---

## 🚨 SAFETY GUARANTEES

### What This Prevents:

❌ Brand images cannot leak via fallback  
❌ Logo images cannot appear for generic articles  
❌ Trademark images cannot appear for generic articles  
❌ Random selection is NOT uncontrolled  
❌ Filename patterns are NOT used (CSV only)  

### What This Ensures:

✅ Generic articles ONLY get generic images  
✅ CSV metadata is authoritative  
✅ Three-layer filtering protects against brand leakage  
✅ Visual diversity is maintained  
✅ Fallback is predictable and safe  
✅ Production integrity is preserved  

---

## 📊 TIER FLOW (Updated)

With this change, image selection follows this priority:

```
TIER 1: GPT-4o-mini (AI curation)
  └─> Uses CSV pre-filtered candidates
  └─> Includes CSV notes for context

TIER 1.5: Brand Matching (explicit brand detection)
  └─> Only for brand articles
  └─> Uses CSV brand_name field

TIER 2: Keyword Matching (weighted scoring)
  └─> Uses CSV pre-filtered candidates
  └─> Scores based on title keywords

TIER 2.5: CSV Random Fallback (NEW - BRAND-SAFE) ⭐
  └─> ONLY for generic articles
  └─> ONLY uses primary_category="Generic"
  └─> ENFORCES logo_visible="No"
  └─> ENFORCES trademark_present="No"
  └─> Random selection from filtered pool

TIER 3: Hardcoded Fallback (final safety net)
  └─> Uses lib/generic-images.ts registry
  └─> Category-specific fallback
  └─> Hash-based deterministic selection
```

---

## 🔍 DEBUGGING TIPS

### If Generic Article Shows Brand Image:

**Check These:**

1. **Console Logs**
   ```bash
   grep "CSV Random Generic Fallback" logs
   # Should show the selected image
   ```

2. **CSV Verification**
   ```bash
   # Check the problematic image in CSV
   grep "brand-microsoft-logo.jpg" image-master-table.csv
   # Verify: primary_category, logo_visible, trademark_present
   ```

3. **Article Classification**
   ```bash
   grep "Article Classification" logs
   # Confirm article was classified as "generic"
   ```

4. **Filtering Results**
   ```bash
   grep "CSV Filter" logs
   # Check how many candidates after filtering
   ```

### If No Images Render:

**Check These:**

1. **CSV Loading**
   ```bash
   grep "Loaded.*metadata entries" logs
   # Should show: ✅ Loaded 193 image metadata entries
   ```

2. **Generic Image Count**
   ```bash
   # Count generic images in CSV
   grep ",Generic," image-master-table.csv | grep ",No,No," | wc -l
   # Should be > 0
   ```

3. **Fallback Warning**
   ```bash
   grep "No GENERIC-safe images available" logs
   # If present, check CSV for generic images with correct metadata
   ```

---

## ✅ DEPLOYMENT CHECKLIST

**Pre-Implementation Validation:**
```bash
# STEP 1: Validate CSV has sufficient brand-safe images
node scripts/validate-brand-safe-fallback.js

# Expected output:
# ✅ ALL CHECKS PASSED
# ✅ BRAND-SAFE GENERIC IMAGES: 100
# 🚫 BRAND IMAGES (excluded): 88
```

**Post-Implementation Testing:**

- [ ] Code inserted at correct location (between TIER 2 and TIER 3)
- [ ] No TypeScript errors
- [ ] No linter errors
- [ ] Run validation: `node scripts/validate-brand-safe-fallback.js` ✅
- [ ] Test 1: Generic article renders with generic image ✅
- [ ] Test 2: Brand article renders with brand image ✅
- [ ] Test 3: Console logs show "(Brand-Safe)" marker ✅
- [ ] Test 4: No brand images appear for generic articles ✅
- [ ] CSV integrity test passed ✅

---

## 📝 FINAL VALIDATION

**Run this test sequence:**

```bash
# 1. Start dev server
npm run dev

# 2. Navigate to homepage
# 3. Check console for random fallback logs
# 4. Verify ONLY generic images used for generic articles
# 5. Verify brand images used ONLY for brand articles

# Expected console output pattern:
[CSV Filter] generic article: 150 → 85 candidates after filtering
[CSV Random Generic Fallback] "AI Advances..." -> generic-ai-neural-05.jpg (Brand-Safe)

# NOT this:
[CSV Random Generic Fallback] "AI Advances..." -> brand-google-logo.jpg ❌ WRONG
```

---

## 🎉 SUCCESS CRITERIA

After implementation, the system guarantees:

1. ✅ Generic articles NEVER show brand images
2. ✅ Random fallback is brand-safe
3. ✅ CSV metadata is enforced at all tiers
4. ✅ Three-layer protection (category + logo + trademark)
5. ✅ Visual diversity maintained
6. ✅ Production-ready and audit-compliant

**Deploy with confidence!** 🚀

---

## 📚 REFERENCE

This hardening layer complements the v1 CSV implementation:
- `document/CURSOR_PROMPT_CSV_V1_IMPLEMENTATION.md` - Main v1 guide
- `document/CSV_PATH_VERIFICATION.md` - Path validation
- `scripts/validate-csv-path.js` - Pre-implementation check

Together, these ensure a fully compliant, production-safe image selection system.

