/**
 * INGESTION LIFECYCLE STATE (IN-MEMORY, SERVERLESS-SAFE)
 * 
 * Tracks the current state of RSS ingestion using in-memory storage.
 * - Status persists for the lifetime of the serverless function instance
 * - Status is lost on cold starts (expected and acceptable)
 * 
 * States:
 * - "idle": No ingestion running, no data yet
 * - "running": Ingestion currently in progress
 * - "complete": Ingestion finished successfully
 * - "error": Last ingestion failed
 */

export type IngestionStatus = 'idle' | 'running' | 'complete' | 'error';

interface IngestionState {
  status: IngestionStatus;
  timestamp: string;
  message?: string;
}

// Module-level in-memory state
let currentState: IngestionState = {
  status: 'idle',
  timestamp: new Date().toISOString(),
};

/**
 * Get current ingestion status
 * Returns "idle" if no status has been set
 */
export function getIngestionStatus(): IngestionStatus {
  return currentState.status;
}

/**
 * Set ingestion status
 * Stores in memory for current function instance
 */
export function setIngestionStatus(
  status: IngestionStatus,
  message?: string
): void {
  currentState = {
    status,
    timestamp: new Date().toISOString(),
    message,
  };
  
  console.log(`[INGESTION] Status set to: ${status}`);
  
  if (message) {
    console.log(`[INGESTION] Message: ${message}`);
  }
}

/**
 * Get full ingestion state (for debugging)
 */
export function getIngestionState(): IngestionState | null {
  return currentState;
}

