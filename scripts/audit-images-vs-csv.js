/**
 * Image Audit Script - Folder vs CSV
 * 
 * Compares actual files in /public/assets/images/all with image-master-table.csv
 * to identify mismatches, missing files, and potential brand leakage issues.
 * 
 * Usage: node scripts/audit-images-vs-csv.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Image Audit: Folder vs CSV\n');
console.log('='.repeat(60) + '\n');

// Paths
const IMAGES_DIR = path.join(process.cwd(), 'public', 'assets', 'images', 'all');
const CSV_PATH = path.join(process.cwd(), 'image-master-table.csv');
const REPORT_DIR = path.join(process.cwd(), 'scripts', '_reports');
const REPORT_PATH = path.join(REPORT_DIR, 'image-audit-report.json');

// Ensure report directory exists
if (!fs.existsSync(REPORT_DIR)) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

// Helper: Parse CSV line (handle quotes and commas)
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

// Helper: Check if filename indicates a brand image
function isBrandByFilename(filename) {
  return filename.toLowerCase().startsWith('brand-');
}

// Step 1: Read files from folder
let filesInFolder = [];
if (fs.existsSync(IMAGES_DIR)) {
  filesInFolder = fs.readdirSync(IMAGES_DIR).filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif'].includes(ext);
  });
  console.log(`📁 Files in folder: ${filesInFolder.length}`);
} else {
  console.error(`❌ Images folder not found: ${IMAGES_DIR}`);
  process.exit(1);
}

// Step 2: Read CSV
let csvRows = [];
if (fs.existsSync(CSV_PATH)) {
  const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
  const lines = csvContent.trim().split('\n');
  const dataLines = lines.slice(1); // Skip header
  
  csvRows = dataLines.map(line => {
    const fields = parseCSVLine(line);
    return {
      id: fields[0],
      filename: fields[1],
      extension: fields[2],
      logo_visible: fields[6],
      trademark_present: fields[7],
      primary_category: fields[8],
      brand_name: fields[10],
    };
  });
  
  console.log(`📋 CSV rows: ${csvRows.length}`);
} else {
  console.error(`❌ CSV not found: ${CSV_PATH}`);
  process.exit(1);
}

console.log('\n' + '-'.repeat(60) + '\n');

// Step 3: Count brand files by filename
const brandFilesByFilename = filesInFolder.filter(isBrandByFilename);
console.log(`🏢 Files starting with "brand-": ${brandFilesByFilename.length}`);

// Step 4: Count brand images by CSV metadata
const brandRowsByMetadata = csvRows.filter(row =>
  row.primary_category === "Brand" ||
  row.logo_visible === "Yes" ||
  row.trademark_present === "Yes" ||
  (row.brand_name && row.brand_name.trim().length > 0)
);
console.log(`🏢 CSV rows marked as Brand: ${brandRowsByMetadata.length}`);

console.log('\n' + '-'.repeat(60) + '\n');

// Step 5: Find files missing from CSV
const csvFilenames = new Set(csvRows.map(row => row.filename));
const filesMissingFromCSV = filesInFolder.filter(file => !csvFilenames.has(file));

console.log(`⚠️  Files in folder but missing from CSV: ${filesMissingFromCSV.length}`);
if (filesMissingFromCSV.length > 0) {
  console.log('   Files:');
  filesMissingFromCSV.slice(0, 10).forEach(file => {
    console.log(`     - ${file}`);
  });
  if (filesMissingFromCSV.length > 10) {
    console.log(`     ... and ${filesMissingFromCSV.length - 10} more`);
  }
}

console.log('');

// Step 6: Find CSV rows with missing files
const filesSet = new Set(filesInFolder);
const csvRowsMissingFiles = csvRows.filter(row => !filesSet.has(row.filename));

console.log(`⚠️  CSV rows with missing files: ${csvRowsMissingFiles.length}`);
if (csvRowsMissingFiles.length > 0) {
  console.log('   CSV rows:');
  csvRowsMissingFiles.slice(0, 10).forEach(row => {
    console.log(`     - ${row.filename} (ID: ${row.id})`);
  });
  if (csvRowsMissingFiles.length > 10) {
    console.log(`     ... and ${csvRowsMissingFiles.length - 10} more`);
  }
}

console.log('\n' + '-'.repeat(60) + '\n');

// Step 7: Find mismatches (brand- prefix vs CSV metadata)
const mismatches = [];

csvRows.forEach(row => {
  const fileExists = filesSet.has(row.filename);
  if (!fileExists) return; // Skip missing files
  
  const isBrandFile = isBrandByFilename(row.filename);
  const isBrandMetadata = 
    row.primary_category === "Brand" ||
    row.logo_visible === "Yes" ||
    row.trademark_present === "Yes";
  
  // Case 1: Filename says brand, CSV says generic
  if (isBrandFile && !isBrandMetadata) {
    mismatches.push({
      filename: row.filename,
      type: 'CRITICAL',
      issue: `Filename starts with "brand-" but CSV marks as Generic/safe`,
      details: {
        primary_category: row.primary_category,
        logo_visible: row.logo_visible,
        trademark_present: row.trademark_present,
      }
    });
  }
  
  // Case 2: Filename doesn't say brand, but CSV says it has logos/trademarks
  if (!isBrandFile && isBrandMetadata && row.primary_category === "Brand") {
    mismatches.push({
      filename: row.filename,
      type: 'WARNING',
      issue: `Filename doesn't start with "brand-" but CSV marks as Brand`,
      details: {
        primary_category: row.primary_category,
        logo_visible: row.logo_visible,
        trademark_present: row.trademark_present,
      }
    });
  }
});

console.log(`🔍 Mismatches found: ${mismatches.length}`);

if (mismatches.length > 0) {
  const criticalMismatches = mismatches.filter(m => m.type === 'CRITICAL');
  const warningMismatches = mismatches.filter(m => m.type === 'WARNING');
  
  if (criticalMismatches.length > 0) {
    console.log(`\n❌ CRITICAL (${criticalMismatches.length}): brand-* files marked safe in CSV:`);
    criticalMismatches.forEach(m => {
      console.log(`   - ${m.filename}`);
      console.log(`     Category: ${m.details.primary_category || '(empty)'}`);
      console.log(`     Logo: ${m.details.logo_visible || '(empty)'}, Trademark: ${m.details.trademark_present || '(empty)'}`);
    });
  }
  
  if (warningMismatches.length > 0) {
    console.log(`\n⚠️  WARNING (${warningMismatches.length}): Non-brand filenames marked as Brand:`);
    warningMismatches.slice(0, 5).forEach(m => {
      console.log(`   - ${m.filename}`);
      console.log(`     Category: ${m.details.primary_category}`);
    });
    if (warningMismatches.length > 5) {
      console.log(`   ... and ${warningMismatches.length - 5} more`);
    }
  }
} else {
  console.log('   ✅ No mismatches detected');
}

console.log('\n' + '-'.repeat(60) + '\n');

// Step 8: Generate report
const report = {
  timestamp: new Date().toISOString(),
  summary: {
    files_in_folder: filesInFolder.length,
    csv_rows: csvRows.length,
    brand_files_by_filename: brandFilesByFilename.length,
    brand_rows_by_metadata: brandRowsByMetadata.length,
    files_missing_from_csv: filesMissingFromCSV.length,
    csv_rows_missing_files: csvRowsMissingFiles.length,
    mismatches: mismatches.length,
    critical_mismatches: mismatches.filter(m => m.type === 'CRITICAL').length,
  },
  details: {
    files_missing_from_csv: filesMissingFromCSV,
    csv_rows_missing_files: csvRowsMissingFiles.map(row => ({
      id: row.id,
      filename: row.filename,
    })),
    mismatches: mismatches,
  },
  health_status: 
    mismatches.filter(m => m.type === 'CRITICAL').length > 0 ? 'CRITICAL' :
    mismatches.length > 0 ? 'WARNING' :
    filesMissingFromCSV.length > 0 || csvRowsMissingFiles.length > 0 ? 'INFO' :
    'HEALTHY'
};

fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), 'utf-8');
console.log(`📊 Report saved to: ${REPORT_PATH}`);

console.log('\n' + '='.repeat(60) + '\n');

// Step 9: Final verdict
if (report.health_status === 'CRITICAL') {
  console.log('❌ CRITICAL ISSUES FOUND');
  console.log('   brand-* files are marked safe in CSV - BRAND LEAKAGE RISK');
  console.log('   Action required: Update CSV or implement defense-in-depth');
  process.exit(1);
} else if (report.health_status === 'WARNING') {
  console.log('⚠️  WARNINGS FOUND');
  console.log('   Minor inconsistencies detected - review recommended');
  process.exit(0);
} else if (report.health_status === 'INFO') {
  console.log('ℹ️  INFO');
  console.log('   Some files/CSV rows are missing - may need cleanup');
  process.exit(0);
} else {
  console.log('✅ AUDIT PASSED');
  console.log('   Folder and CSV are in sync');
  console.log('   No brand leakage risks detected');
  process.exit(0);
}

