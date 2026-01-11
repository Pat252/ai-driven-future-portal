/**
 * INGESTION LIFECYCLE STATE
 * 
 * Tracks the current state of RSS ingestion using filesystem persistence.
 * This ensures state is shared across API routes and Server Components.
 * 
 * States:
 * - "idle": No ingestion running, no data yet
 * - "running": Ingestion currently in progress
 * - "complete": Ingestion finished successfully
 * - "error": Last ingestion failed
 */

import fs from 'fs';
import path from 'path';

const STATUS_FILE = path.join(process.cwd(), '.cache', 'ingestion-status.json');

export type IngestionStatus = 'idle' | 'running' | 'complete' | 'error';

interface IngestionState {
  status: IngestionStatus;
  timestamp: string;
  message?: string;
}

/**
 * Ensure cache directory exists
 */
function ensureCacheDir(): void {
  const cacheDir = path.dirname(STATUS_FILE);
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
}

/**
 * Get current ingestion status
 * Returns "idle" if status file doesn't exist
 */
export function getIngestionStatus(): IngestionStatus {
  try {
    if (!fs.existsSync(STATUS_FILE)) {
      return 'idle';
    }
    
    const data = fs.readFileSync(STATUS_FILE, 'utf-8');
    const state: IngestionState = JSON.parse(data);
    
    return state.status || 'idle';
  } catch (error) {
    console.error('❌ Failed to read ingestion status:', error);
    return 'idle';
  }
}

/**
 * Set ingestion status
 * Persists to filesystem for cross-context sharing
 */
export function setIngestionStatus(
  status: IngestionStatus,
  message?: string
): void {
  try {
    ensureCacheDir();
    
    const state: IngestionState = {
      status,
      timestamp: new Date().toISOString(),
      message,
    };
    
    fs.writeFileSync(STATUS_FILE, JSON.stringify(state, null, 2), 'utf-8');
    console.log(`[INGESTION] Status set to: ${status}`);
    
    if (message) {
      console.log(`[INGESTION] Message: ${message}`);
    }
  } catch (error) {
    console.error('❌ Failed to write ingestion status:', error);
    throw error;
  }
}

/**
 * Get full ingestion state (for debugging)
 */
export function getIngestionState(): IngestionState | null {
  try {
    if (!fs.existsSync(STATUS_FILE)) {
      return null;
    }
    
    const data = fs.readFileSync(STATUS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Failed to read ingestion state:', error);
    return null;
  }
}

