# ✅ Cursor Prompt: Wire CSV into V1 Image Selection

## 🎯 OBJECTIVE

Integrate `image-master-table.csv` as the authoritative source for image selection metadata, replacing filename-based classification with CSV-driven filtering.

---

## ⚠️ CRITICAL PATH INFORMATION

**CSV File Location (VERIFIED):**
```
Project Root: D:\Projects\ai-driven-future-portal\
CSV File:     D:\Projects\ai-driven-future-portal\image-master-table.csv
```

**Correct Code Path:**
```typescript
// lib/csv-loader.ts
const CSV_PATH = path.join(process.cwd(), 'image-master-table.csv');
```

**Reference Pattern (from existing code):**
```typescript
// lib/image-cache.ts uses same pattern:
const CACHE_DIR = path.join(process.cwd(), '.cache');
const CACHE_FILE = path.join(CACHE_DIR, 'image-cache.json');
```

**Pre-Implementation Validation:**
```bash
# Run this FIRST to verify CSV path before coding:
node scripts/validate-csv-path.js

# Expected output:
# ✅ CSV file found at correct location
# ✅ CSV readable (194 total lines)
# ✅ CSV contains 193 data rows
# ✅ CSV path validation PASSED
```

---

## 📋 CONTEXT (FROM AUDIT)

### Current State (Filename-Based):
- Image discovery: File system scan (`lib/image-utils.ts` line 58-102)
- Classification: Filename patterns (`lib/image-classifier.ts`, `lib/brand-matcher.ts`)
- GPT input: Full image library with filenames only
- Problem: CSV exists but is unused

### Target State (CSV-Driven):
- Image metadata: Loaded from `image-master-table.csv`
- Classification: CSV fields (`primary_category`, `logo_visible`, `trademark_present`, `brand_name`)
- GPT input: Pre-filtered candidates with CSV `notes` field
- Benefit: Manual CSV edits immediately affect selection

---

## 🔧 IMPLEMENTATION PLAN

### Phase 1: CSV Loader Module ⭐ START HERE

**File:** Create `lib/csv-loader.ts`

**Requirements:**
1. Load `image-master-table.csv` from project root at runtime
2. Parse into structured TypeScript objects
3. Cache in-memory (similar to `imageLibraryCache` pattern)
4. Server-side only (check `typeof window !== 'undefined'`)
5. Handle file not found gracefully

**⚠️ CRITICAL: CSV File Path**
```typescript
// CORRECT PATH (project root):
const CSV_PATH = path.join(process.cwd(), 'image-master-table.csv');

// Verified location: D:\Projects\ai-driven-future-portal\image-master-table.csv
// Same pattern as image-cache.ts uses for .cache directory
```

**Interface:**
```typescript
interface ImageMetadata {
  id: number;
  filename: string;
  extension: string;
  source: string;
  license: string;
  paid_account: string;
  logo_visible: string;        // "Yes" | "No" | ""
  trademark_present: string;    // "Yes" | "No" | ""
  primary_category: string;     // "Brand" | "Generic" | "Concept" | "Scene" | ""
  context_type: string;
  brand_name: string;
  allowed_generic_articles: string;
  allowed_brand_articles: string;
  fallback_tier: string;
  notes: string;
}

function loadImageMetadata(): ImageMetadata[]
function getImageMetadata(filename: string): ImageMetadata | null
function clearMetadataCache(): void
```

**CSV Parsing:**
- Use Node.js `fs` module (already used in `image-utils.ts`)
- Parse CSV manually or use lightweight parser
- Normalize `Yes`/`No` values (handle case variations)
- Skip header row (line 1)
- Map to `ImageMetadata` objects

**Example Implementation:**
```typescript
import fs from 'fs';
import path from 'path';

const CSV_PATH = path.join(process.cwd(), 'image-master-table.csv');
let metadataCache: ImageMetadata[] | null = null;

export function loadImageMetadata(): ImageMetadata[] {
  // Return cached if available
  if (metadataCache !== null) {
    return metadataCache;
  }

  // Client-side safety
  if (typeof window !== 'undefined') {
    console.warn('⚠️ loadImageMetadata() called on client-side');
    return [];
  }

  try {
    const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
    const lines = csvContent.trim().split('\n');
    
    // Skip header row
    const dataLines = lines.slice(1);
    
    const metadata: ImageMetadata[] = dataLines.map(line => {
      const fields = parseCSVLine(line); // Handle quoted fields with commas
      
      return {
        id: parseInt(fields[0]),
        filename: fields[1],
        extension: fields[2],
        source: fields[3],
        license: fields[4],
        paid_account: fields[5],
        logo_visible: fields[6],
        trademark_present: fields[7],
        primary_category: fields[8],
        context_type: fields[9],
        brand_name: fields[10],
        allowed_generic_articles: fields[11],
        allowed_brand_articles: fields[12],
        fallback_tier: fields[13],
        notes: fields[14] || '',
      };
    });
    
    metadataCache = metadata;
    console.log(`✅ Loaded ${metadata.length} image metadata entries from CSV`);
    
    return metadata;
  } catch (error) {
    console.error('❌ Failed to load image-master-table.csv:', error);
    return [];
  }
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let currentField = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      fields.push(currentField);
      currentField = '';
    } else {
      currentField += char;
    }
  }
  fields.push(currentField);
  
  return fields;
}
```

**Error Handling:**
- If CSV not found: Log warning, return empty array
- If parse fails: Log error, return empty array
- If server restarts: Reload from disk

---

### Phase 2: Filtering Logic

**File:** Update `lib/image-classifier.ts`

**New Functions:**
```typescript
function isBrandImage(metadata: ImageMetadata): boolean {
  return metadata.primary_category === "Brand" ||
         metadata.logo_visible === "Yes" ||
         metadata.trademark_present === "Yes";
}

function isGenericImageByMetadata(metadata: ImageMetadata): boolean {
  return metadata.primary_category === "Generic" &&
         metadata.logo_visible === "No" &&
         metadata.trademark_present === "No";
}

function filterByArticleType(
  imageLibrary: ImageMetadata[],
  articleType: "generic" | "brand",
  brandName?: string
): ImageMetadata[] {
  if (articleType === "generic") {
    // Generic articles: Only images with logo_visible=No AND trademark_present=No
    return imageLibrary.filter(img => 
      !isBrandImage(img) && 
      img.logo_visible === "No" &&
      img.trademark_present === "No"
    );
  } else {
    // Brand articles: Only Brand images matching brandName
    return imageLibrary.filter(img => 
      isBrandImage(img) && 
      (brandName ? img.brand_name.toLowerCase().includes(brandName.toLowerCase()) : true)
    );
  }
}
```

**Preserve Existing:**
- Keep `isGenericImage()` (filename fallback) for backward compatibility
- Keep `hasCategoryPrefix()` 
- Add CSV-first, filename-fallback pattern

---

### Phase 3: Article Classification

**File:** Create `lib/article-classifier.ts`

**Purpose:** Detect if article is generic or brand-specific

**Logic:**
```typescript
interface ArticleClassification {
  type: "generic" | "brand";
  brandName?: string;
}

function classifyArticle(title: string): ArticleClassification {
  // Brand detection (reuse existing logic from brand-matcher.ts)
  const brandPatterns = [
    "openai", "microsoft", "google", "apple", "meta", "amazon", 
    "netflix", "nvidia", "chatgpt", "gemini", "claude", "anthropic",
    "deepseek", "grok", "spotify", "tiktok", "whatsapp", "instagram",
    "linkedin", "github", "gitlab", "aws", "azure"
  ];
  
  const lowerTitle = title.toLowerCase();
  
  for (const brand of brandPatterns) {
    if (lowerTitle.includes(brand)) {
      return { type: "brand", brandName: brand };
    }
  }
  
  return { type: "generic" };
}
```

**Integration:**
- Called BEFORE image selection
- Passed to filtering logic
- Logged for debugging

---

### Phase 4: Update Main Selection Logic

**File:** Update `lib/image-utils.ts`

**Function:** `getArticleImage()` (line 284)

**Changes:**

```typescript
export async function getArticleImage(
  title: string, 
  category: string, 
  usedImagesSet: Set<string> = new Set(),
  useAI: boolean = true
): Promise<string> {
  if (typeof window !== 'undefined') {
    return getDefaultPlaceholder();
  }
  
  // ============================================================================
  // NEW: Load CSV metadata and classify article
  // ============================================================================
  const allMetadata = loadImageMetadata(); // From csv-loader.ts
  
  if (allMetadata.length === 0) {
    console.warn('⚠️ No CSV metadata loaded, falling back to filename-based selection');
    // Fall through to existing logic
  }
  
  const articleClassification = classifyArticle(title); // From article-classifier.ts
  
  // ============================================================================
  // NEW: Pre-filter images based on article type and CSV metadata
  // ============================================================================
  let candidateMetadata = allMetadata;
  
  if (allMetadata.length > 0) {
    candidateMetadata = filterByArticleType(
      allMetadata,
      articleClassification.type,
      articleClassification.brandName
    );
    
    console.log(`[CSV Filter] ${articleClassification.type} article: ${candidateMetadata.length} candidates after filtering`);
  }
  
  // Extract filenames for GPT
  const candidateFilenames = candidateMetadata.map(m => m.filename);
  
  // ============================================================================
  // TIER 1: AI-POWERED CURATION (with CSV notes)
  // ============================================================================
  const aiCurationEnabled = process.env.ENABLE_AI_CURATION !== 'false';
  
  if (useAI && aiCurationEnabled && candidateFilenames.length > 0) {
    try {
      const { smartCurateImageWithMetadata } = await import('./openai');
      
      const aiSelectedFilename = await smartCurateImageWithMetadata(
        title, 
        category, 
        candidateMetadata // Pass metadata objects, not just filenames
      );
      
      if (aiSelectedFilename && aiSelectedFilename !== 'RANDOM') {
        console.log(`[AI Match + CSV] "${title.substring(0, 50)}..." -> ${aiSelectedFilename}`);
        usedImagesSet.add(aiSelectedFilename);
        return `/assets/images/all/${aiSelectedFilename}`;
      }
    } catch (error) {
      console.warn('⚠️ AI curation failed, falling back to keyword matching');
    }
  }
  
  // ============================================================================
  // TIER 2: KEYWORD MATCHING (with CSV filtering)
  // ============================================================================
  
  if (candidateFilenames.length > 0) {
    // Use existing keyword matching but on filtered candidates
    const titleKeywords = extractKeywords(title);
    
    const scoredImages = candidateFilenames.map(filename => ({
      filename,
      score: scoreImageMatch(titleKeywords, category, filename, usedImagesSet),
    }));
    
    scoredImages.sort((a, b) => b.score - a.score);
    const bestMatch = scoredImages[0];
    
    if (bestMatch.score > 0) {
      console.log(`[Keyword Match + CSV] "${title.substring(0, 50)}..." -> ${bestMatch.filename} (Score: ${bestMatch.score.toFixed(1)})`);
      usedImagesSet.add(bestMatch.filename);
      return `/assets/images/all/${bestMatch.filename}`;
    }
  }
  
  // ============================================================================
  // TIER 3: FALLBACK (existing logic)
  // ============================================================================
  
  // Rest of existing fallback logic...
}
```

---

### Phase 5: Update GPT Integration

**File:** Update `lib/openai.ts`

**New Function:**
```typescript
export async function smartCurateImageWithMetadata(
  title: string,
  category: string,
  candidateMetadata: ImageMetadata[]
): Promise<string | null> {
  const client = getOpenAIClient();
  
  if (!client) {
    return null;
  }

  try {
    // Build enhanced prompt with CSV notes
    const imageList = candidateMetadata.map((img, idx) => {
      const note = img.notes ? ` - ${img.notes}` : '';
      return `${idx + 1}. ${img.filename}${note}`;
    }).join('\n');
    
    const userPrompt = `Article Title: "${title}"
Article Category: "${category}"

Available Images:
${imageList}

Select the BEST matching filename:`;

    const completion = await client.chat.completions.create(
      {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: CURATOR_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 50,
      },
      { timeout: 5000 }
    );

    const selectedFilename = completion.choices[0]?.message?.content?.trim();

    if (!selectedFilename) {
      return null;
    }

    // Validate against candidate list
    const validFilenames = candidateMetadata.map(m => m.filename);
    if (!validFilenames.includes(selectedFilename)) {
      console.warn(`⚠️ GPT returned invalid filename: ${selectedFilename}`);
      return null;
    }

    return selectedFilename;

  } catch (error) {
    console.error('❌ Smart curation error:', error);
    return null;
  }
}
```

**Update System Prompt:**
```typescript
export const CURATOR_SYSTEM_PROMPT = `You are a professional News Editor with expertise in visual storytelling and image curation.

Your task is to select the BEST matching image filename for a news article from a provided list.

IMPORTANT: Images may include descriptive notes (e.g., "Image showing Microsoft logo on building"). Use these notes to make better selections.

PRIORITY MATCHING RULES (in order):

1. **BRAND/LOGO MATCHING (Highest Priority)**
   - If the article mentions a specific company/brand, select that brand's image
   - Use image notes to confirm logo visibility
   
2. **CONCEPTUAL RELEVANCE (Secondary)**
   - Match based on article topic and image descriptions
   
3. **FALLBACK STRATEGY**
   - If NO good match exists, return "RANDOM"

RESPONSE FORMAT:
- Return ONLY the exact filename (e.g., "bitcoins-money-dollars.jpg")
- No explanations, no markdown, no quotes
- Or "RANDOM" if no match exists`;
```

---

### Phase 6: Testing Strategy

**Manual Testing:**
```bash
# 1. Test generic article (should NOT get brand images)
Title: "The Future of AI Research"
Expected: Generic AI images only (no logos)

# 2. Test brand article (should get matching brand images)
Title: "Microsoft Announces New AI Features"
Expected: Microsoft brand images only

# 3. Test CSV edit (manual change should take effect)
Edit CSV: Change logo_visible from "Yes" to "No" for a brand image
Expected: That image no longer appears for brand articles

# 4. Test GPT with notes
Expected: Console logs show GPT received image notes
```

**Validation Checks:**
1. ✅ CSV loads successfully (check logs)
2. ✅ Article classification works (check logs)
3. ✅ Filtering reduces candidate pool (check console counts)
4. ✅ GPT receives filtered list + notes (check prompt)
5. ✅ Brand articles never get generic images
6. ✅ Generic articles never get brand images

---

## 🚨 SAFETY RULES (CRITICAL)

### DO NOT:
1. ❌ Delete existing functions (preserve backward compatibility)
2. ❌ Remove filename-based logic (use as fallback)
3. ❌ Break existing image selection (gradual migration)
4. ❌ Modify CSV structure (read-only operation)
5. ❌ Change image file locations

### DO:
1. ✅ Add CSV loading as new layer on top
2. ✅ Use CSV-first, filename-fallback pattern
3. ✅ Log all classification decisions (debugging)
4. ✅ Handle CSV parse errors gracefully
5. ✅ Test with both CSV present and missing

---

## 📦 DEPLOYMENT CHECKLIST

Before merging to production:

- [ ] **CSV Path Verification** (CRITICAL):
  ```bash
  # Verify CSV exists at project root
  Test-Path "image-master-table.csv"  # Should return True
  
  # Verify path in code matches
  # lib/csv-loader.ts should use: path.join(process.cwd(), 'image-master-table.csv')
  ```
- [ ] CSV loads successfully on server start
- [ ] All 193 images have metadata entries
- [ ] Brand articles filtered correctly (console logs)
- [ ] Generic articles filtered correctly (console logs)
- [ ] GPT receives pre-filtered candidates
- [ ] GPT receives image notes in prompt
- [ ] Fallback works if CSV missing
- [ ] No TypeScript errors
- [ ] No linter errors
- [ ] Manual test: Edit CSV, restart server, verify changes reflected

---

## 🎯 SUCCESS CRITERIA

After implementation:

1. ✅ `image-master-table.csv` is loaded at runtime
2. ✅ CSV metadata drives image classification (not filenames)
3. ✅ Generic articles ONLY receive images with `logo_visible=No` AND `trademark_present=No`
4. ✅ Brand articles ONLY receive images with matching `brand_name` or `primary_category=Brand`
5. ✅ GPT receives pre-filtered candidates based on article type
6. ✅ GPT prompt includes CSV `notes` field for context
7. ✅ Manual CSV edits take effect on next request (no code changes needed)
8. ✅ System gracefully falls back if CSV is missing or malformed

---

## 📝 IMPLEMENTATION ORDER

Execute in this sequence:

**Pre-Flight Check:**
```bash
# STEP 0: Validate CSV path (CRITICAL)
node scripts/validate-csv-path.js
# Must show: ✅ CSV path validation PASSED
```

**Implementation Steps:**
1. **Create** `lib/csv-loader.ts` (CSV parsing + caching)
2. **Create** `lib/article-classifier.ts` (article type detection)
3. **Update** `lib/image-classifier.ts` (add CSV-based filtering)
4. **Update** `lib/openai.ts` (add metadata-aware GPT function)
5. **Update** `lib/image-utils.ts` (integrate CSV filtering into main flow)
6. **Test** manually with console logs
7. **Validate** all checklist items
8. **Deploy** with confidence

---

## 🔍 DEBUGGING TIPS

**Console Log Statements to Add:**

```typescript
// In csv-loader.ts (FIRST LOG - verify path)
console.log(`📂 Loading CSV from: ${CSV_PATH}`);
console.log(`✅ Loaded ${metadata.length} image metadata entries from CSV`);

// In article-classifier.ts
console.log(`[Article Classification] "${title}" → ${result.type}${result.brandName ? ` (${result.brandName})` : ''}`);

// In image-utils.ts (after filtering)
console.log(`[CSV Filter] ${articleType} article: ${before} → ${after} candidates`);

// In openai.ts (GPT input)
console.log(`[GPT Input] ${candidateMetadata.length} pre-filtered candidates with notes`);
```

**Validation Queries:**

```bash
# Check if CSV is being loaded
grep "Loaded.*metadata entries" logs

# Check article classification
grep "Article Classification" logs

# Check filtering working
grep "CSV Filter" logs

# Verify GPT gets filtered list
grep "GPT Input.*pre-filtered" logs
```

---

## ✅ FINAL VALIDATION

Before declaring v1 complete, verify:

```bash
# Test 1: Generic article should NOT see brand images
Test: "Advances in Neural Network Research"
Check logs: Should show filtering removes all brand images

# Test 2: Brand article should ONLY see brand images
Test: "Microsoft Releases New AI Product"
Check logs: Should show filtering to Microsoft brand images only

# Test 3: CSV edit takes effect
Edit: Change google-chrome-page.jpg logo_visible from "Yes" to "No"
Restart: Server reload
Test: Generic article
Expected: google-chrome-page.jpg now available for generic articles

# Test 4: GPT receives notes
Check logs: GPT prompt should include "Image showing..." notes
```

---

## 🎉 COMPLETION

When all checklist items pass, the system is v1 compliant and safe to deploy.

The CSV is now the authoritative source.
Manual edits work immediately.
Brand/generic separation is enforced.
GPT makes smarter selections with context.

Deploy with confidence! 🚀

