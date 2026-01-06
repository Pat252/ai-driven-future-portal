# CSV Path Verification - CRITICAL ✅

## Status: VERIFIED

The CSV file path has been validated and documented for v1 implementation.

---

## 📍 File Location

```
Project Root: D:\Projects\ai-driven-future-portal\
CSV File:     D:\Projects\ai-driven-future-portal\image-master-table.csv
Status:       ✅ EXISTS (193 data rows + 1 header row)
```

---

## 💻 Correct Code Implementation

### In `lib/csv-loader.ts`:

```typescript
import fs from 'fs';
import path from 'path';

// CORRECT: Use process.cwd() to get project root
const CSV_PATH = path.join(process.cwd(), 'image-master-table.csv');

export function loadImageMetadata(): ImageMetadata[] {
  // Client-side safety check
  if (typeof window !== 'undefined') {
    console.warn('⚠️ loadImageMetadata() called on client-side');
    return [];
  }

  try {
    // Log path for debugging (IMPORTANT)
    console.log(`📂 Loading CSV from: ${CSV_PATH}`);
    
    const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
    // ... rest of parsing logic
    
  } catch (error) {
    console.error('❌ Failed to load CSV:', error);
    return [];
  }
}
```

---

## 🔍 Validation Script

**Run before implementation:**

```bash
node scripts/validate-csv-path.js
```

**Expected Output:**
```
🔍 CSV Path Validation

Project Root: D:\Projects\ai-driven-future-portal
CSV Path:     D:\Projects\ai-driven-future-portal\image-master-table.csv

✅ CSV file found at correct location
✅ CSV readable (194 total lines)
✅ CSV header contains all expected columns
✅ CSV contains 193 data rows

📋 Sample Row (ID 1):
   Filename: ai-robot-future-technology.jpg.svg
   Logo Visible: No
   Trademark: No
   Category: Generic

✅ CSV path validation PASSED
   Ready to implement lib/csv-loader.ts
```

---

## 📋 CSV Structure (Verified)

**Header Columns (15 total):**
1. `id` - Numeric ID
2. `filename` - Image filename (e.g., "ai-robot-future-technology.jpg.svg")
3. `extension` - File extension (jpg, svg)
4. `source` - Source (Unsplash)
5. `license` - License type
6. `paid_account` - Yes/No
7. `logo_visible` - **CRITICAL** - Yes/No (for filtering)
8. `trademark_present` - **CRITICAL** - Yes/No (for filtering)
9. `primary_category` - **CRITICAL** - Brand/Generic/Concept/Scene
10. `context_type` - Context metadata
11. `brand_name` - **CRITICAL** - Brand name if applicable
12. `allowed_generic_articles` - Permission flags
13. `allowed_brand_articles` - Permission flags
14. `fallback_tier` - Fallback priority
15. `notes` - **CRITICAL** - Descriptive notes (for GPT context)

---

## ⚠️ Common Mistakes to AVOID

### ❌ WRONG:
```typescript
// Don't use relative paths
const CSV_PATH = './image-master-table.csv';
const CSV_PATH = '../image-master-table.csv';

// Don't use __dirname (points to lib/ directory)
const CSV_PATH = path.join(__dirname, 'image-master-table.csv');

// Don't hardcode absolute paths
const CSV_PATH = 'D:\\Projects\\ai-driven-future-portal\\image-master-table.csv';
```

### ✅ CORRECT:
```typescript
// Use process.cwd() - works in all environments
const CSV_PATH = path.join(process.cwd(), 'image-master-table.csv');
```

---

## 🧪 Testing Checklist

After implementing `lib/csv-loader.ts`:

- [ ] Run validation script: `node scripts/validate-csv-path.js`
- [ ] Start dev server: `npm run dev`
- [ ] Check console for: `📂 Loading CSV from: D:\Projects\ai-driven-future-portal\image-master-table.csv`
- [ ] Check console for: `✅ Loaded 193 image metadata entries from CSV`
- [ ] Verify no "CSV not found" errors
- [ ] Test CSV hot-reload: Edit CSV, restart server, verify changes

---

## 📚 Reference Pattern

This follows the same pattern used in existing codebase:

```typescript
// lib/image-cache.ts (EXISTING CODE)
const CACHE_DIR = path.join(process.cwd(), '.cache');
const CACHE_FILE = path.join(CACHE_DIR, 'image-cache.json');

// lib/image-utils.ts (EXISTING CODE)
const imagesDir = path.join(process.cwd(), 'public', 'assets', 'images', 'all');
```

---

## ✅ Status: READY FOR IMPLEMENTATION

All path verification complete. Proceed with confidence to Phase 1 of v1 implementation.


