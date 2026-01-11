/**
 * IMAGE CONSTANTS
 * 
 * Single source of truth for R2 folder structure validation.
 * 
 * ⚠️  CRITICAL: These must match the ACTUAL folder structure in your R2 bucket.
 * 
 * To verify your R2 structure:
 * 1. List all objects: aws s3 ls s3://your-bucket --recursive
 * 2. Extract unique folder prefixes
 * 3. Update R2_ALLOWED_ROOTS to match reality
 * 4. Add any empty/problematic folders to R2_FORBIDDEN_ROOTS
 */

/**
 * Allowed root folders in Cloudflare R2
 * All image paths MUST start with one of these prefixes
 * 
 * Based on requirement specification - verify these exist in your R2 bucket
 */
export const R2_ALLOWED_ROOTS = [
  'ai/',
  'chips/',
  'companies/',
  'datacenters/',
  'economy/',
  'generic/',
  'infrastructure/',
  'llm/',
  'markets/',
  'people/',
  'robotics/',
  'security/',
  'technology/',
];

/**
 * Forbidden root folders (known to be empty or invalid)
 * Paths starting with these will be filtered out
 */
export const R2_FORBIDDEN_ROOTS = [
  'charts/',
  'fallback/',
  'finance/',
  'office/',
];

/**
 * Fallback folders (priority order)
 * At least one of these folders MUST contain images for guaranteed fallback
 */
export const R2_FALLBACK_FOLDERS = ['generic/', 'ai/'];
