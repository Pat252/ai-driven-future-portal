/**
 * CSV Path Validation Script
 * 
 * Run this BEFORE implementing CSV loader to verify file location.
 * 
 * Usage: node scripts/validate-csv-path.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 CSV Path Validation\n');

// Expected CSV path (same pattern as will be used in lib/csv-loader.ts)
const CSV_PATH = path.join(process.cwd(), 'image-master-table.csv');

console.log(`Project Root: ${process.cwd()}`);
console.log(`CSV Path:     ${CSV_PATH}\n`);

// Check if file exists
if (!fs.existsSync(CSV_PATH)) {
  console.error('❌ CRITICAL: CSV file not found at expected location!');
  console.error(`   Expected: ${CSV_PATH}`);
  console.error(`   Please verify file location before implementing CSV loader.`);
  process.exit(1);
}

console.log('✅ CSV file found at correct location');

// Read and validate CSV structure
try {
  const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
  const lines = csvContent.trim().split('\n');
  
  console.log(`✅ CSV readable (${lines.length} total lines)`);
  
  // Check header
  const header = lines[0];
  const expectedColumns = [
    'id',
    'filename',
    'extension',
    'source',
    'license',
    'paid_account',
    'logo_visible',
    'trademark_present',
    'primary_category',
    'context_type',
    'brand_name',
    'allowed_generic_articles',
    'allowed_brand_articles',
    'fallback_tier',
    'notes'
  ];
  
  const headerColumns = header.split(',');
  const missingColumns = expectedColumns.filter(col => !headerColumns.includes(col));
  
  if (missingColumns.length > 0) {
    console.warn(`⚠️  Missing expected columns: ${missingColumns.join(', ')}`);
  } else {
    console.log('✅ CSV header contains all expected columns');
  }
  
  // Count data rows
  const dataRows = lines.length - 1; // Exclude header
  console.log(`✅ CSV contains ${dataRows} data rows`);
  
  // Sample first data row
  if (lines.length > 1) {
    const firstRow = lines[1];
    const fields = firstRow.split(',');
    console.log(`\n📋 Sample Row (ID ${fields[0]}):`);
    console.log(`   Filename: ${fields[1]}`);
    console.log(`   Logo Visible: ${fields[6] || '(empty)'}`);
    console.log(`   Trademark: ${fields[7] || '(empty)'}`);
    console.log(`   Category: ${fields[8] || '(empty)'}`);
  }
  
  console.log('\n✅ CSV path validation PASSED');
  console.log('   Ready to implement lib/csv-loader.ts');
  
} catch (error) {
  console.error('❌ Error reading CSV:', error.message);
  process.exit(1);
}

