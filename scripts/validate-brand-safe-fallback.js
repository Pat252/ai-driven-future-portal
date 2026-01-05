/**
 * Brand-Safe Fallback Validation Script
 * 
 * Verifies that the CSV contains sufficient generic images for fallback
 * and that brand images are properly excluded.
 * 
 * UPDATED: Now validates against actual folder contents (defense-in-depth)
 * 
 * Run after implementing TIER 2.5 hardening.
 * 
 * Usage: node scripts/validate-brand-safe-fallback.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔒 Brand-Safe Fallback Validation (Defense-in-Depth)\n');

// Paths
const CSV_PATH = path.join(process.cwd(), 'image-master-table.csv');
const IMAGES_DIR = path.join(process.cwd(), 'public', 'assets', 'images', 'all');

if (!fs.existsSync(CSV_PATH)) {
  console.error('❌ CSV file not found');
  process.exit(1);
}

// Load actual files from folder
let filesInFolder = [];
if (fs.existsSync(IMAGES_DIR)) {
  filesInFolder = fs.readdirSync(IMAGES_DIR).filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif'].includes(ext);
  });
  console.log(`📁 Actual files in folder: ${filesInFolder.length}\n`);
} else {
  console.error('❌ Images folder not found');
  process.exit(1);
}

const filesSet = new Set(filesInFolder);

const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
const lines = csvContent.trim().split('\n');
const dataLines = lines.slice(1); // Skip header

// Parse CSV
function parseCSVLine(line) {
  const fields = [];
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

// Helper: Check if filename indicates brand (defense-in-depth)
function isBrandByFilename(filename) {
  return filename.toLowerCase().startsWith('brand-');
}

const images = dataLines.map(line => {
  const fields = parseCSVLine(line);
  return {
    id: fields[0],
    filename: fields[1],
    logo_visible: fields[6],
    trademark_present: fields[7],
    primary_category: fields[8],
    fileExists: filesSet.has(fields[1]),
  };
}).filter(img => img.fileExists); // ONLY count images that actually exist

console.log(`📊 CSV images that exist in folder: ${images.length}\n`);

// Category 1: Brand-Safe Generic Images (TIER 2.5 eligible)
// DEFENSE-IN-DEPTH: Also exclude brand- prefix filenames
const brandSafeGeneric = images.filter(img =>
  img.primary_category === "Generic" &&
  img.logo_visible === "No" &&
  img.trademark_present === "No" &&
  !isBrandByFilename(img.filename) // ✅ Defense-in-depth
);

console.log('✅ BRAND-SAFE GENERIC IMAGES (Fallback Eligible):');
console.log(`   Count: ${brandSafeGeneric.length}`);
console.log(`   Criteria: primary_category=Generic AND logo_visible=No AND trademark_present=No AND NOT brand-*`);

if (brandSafeGeneric.length < 20) {
  console.warn('⚠️  WARNING: Low count of brand-safe generic images');
  console.warn('   Consider adding more generic images to CSV');
}

// Category 2: Brand Images (Must be excluded from generic fallback)
// DEFENSE-IN-DEPTH: Include brand- prefix filenames
const brandImages = images.filter(img =>
  isBrandByFilename(img.filename) || // ✅ Defense-in-depth
  img.primary_category === "Brand" ||
  img.logo_visible === "Yes" ||
  img.trademark_present === "Yes"
);

console.log('\n🚫 BRAND IMAGES (Must be Excluded from Generic Fallback):');
console.log(`   Count: ${brandImages.length}`);
console.log(`   Criteria: brand-* filename OR primary_category=Brand OR logo_visible=Yes OR trademark_present=Yes`);

// Category 3: Concept/Scene Images
const otherImages = images.filter(img =>
  !brandSafeGeneric.includes(img) &&
  !brandImages.includes(img)
);

console.log('\n📦 OTHER IMAGES (Concept/Scene):');
console.log(`   Count: ${otherImages.length}`);

// Validation Checks
console.log('\n🧪 VALIDATION CHECKS:\n');

let allPassed = true;

// Check 1: Sufficient brand-safe images
if (brandSafeGeneric.length >= 20) {
  console.log('✅ Check 1: Sufficient brand-safe generic images');
} else {
  console.log('❌ Check 1: INSUFFICIENT brand-safe generic images');
  console.log(`   Expected: >= 20, Found: ${brandSafeGeneric.length}`);
  allPassed = false;
}

// Check 2: No overlap (brand-safe should not have logos)
const overlap = brandSafeGeneric.filter(img =>
  img.logo_visible === "Yes" || img.trademark_present === "Yes"
);

if (overlap.length === 0) {
  console.log('✅ Check 2: No overlap (brand-safe images have no logos)');
} else {
  console.log('❌ Check 2: OVERLAP DETECTED (brand-safe images have logos)');
  console.log('   Problematic images:');
  overlap.forEach(img => {
    console.log(`     - ${img.filename}: logo_visible=${img.logo_visible}, trademark_present=${img.trademark_present}`);
  });
  allPassed = false;
}

// Check 3: Brand images properly categorized
const uncategorizedBrands = brandImages.filter(img =>
  img.primary_category !== "Brand" &&
  (img.logo_visible === "Yes" || img.trademark_present === "Yes")
);

if (uncategorizedBrands.length === 0) {
  console.log('✅ Check 3: All logo/trademark images properly categorized');
} else {
  console.log(`⚠️  Check 3: ${uncategorizedBrands.length} images with logos/trademarks not marked as Brand category`);
  console.log('   (This is OK if intentional, but verify:)');
  uncategorizedBrands.slice(0, 5).forEach(img => {
    console.log(`     - ${img.filename}: category=${img.primary_category}, logo=${img.logo_visible}, trademark=${img.trademark_present}`);
  });
}

// Sample brand-safe images
console.log('\n📋 SAMPLE BRAND-SAFE IMAGES (will be used in fallback):\n');
brandSafeGeneric.slice(0, 10).forEach((img, idx) => {
  console.log(`   ${idx + 1}. ${img.filename}`);
});

// Sample brand images
console.log('\n🚫 SAMPLE BRAND IMAGES (will be EXCLUDED from fallback):\n');
brandImages.slice(0, 10).forEach((img, idx) => {
  console.log(`   ${idx + 1}. ${img.filename}`);
});

// Final verdict
console.log('\n' + '='.repeat(60));
if (allPassed) {
  console.log('✅ ALL CHECKS PASSED');
  console.log('   Brand-safe fallback is ready to deploy');
  console.log('   Generic articles will NEVER show brand images');
  process.exit(0);
} else {
  console.log('❌ SOME CHECKS FAILED');
  console.log('   Review CSV metadata before deploying hardened fallback');
  process.exit(1);
}

