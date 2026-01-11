/**
 * RSS INGESTION API ENDPOINT
 * 
 * This is the ONLY entry point for RSS ingestion.
 * 
 * Usage:
 *   POST /api/ingest
 * 
 * Triggers:
 *   - Manual (curl/fetch)
 *   - Scheduled (cron job)
 *   - Deploy hook
 * 
 * ⚠️  NEVER called during rendering or navigation
 */

import { NextResponse } from 'next/server';
import { ingestRSSFeeds } from '@/lib/rss-ingestion';
import { setCachedNewsData } from '@/lib/cache';
import { setIngestionStatus } from '@/lib/ingestion-status';

export async function POST(request: Request) {
  try {
    // SECURITY: Verify INGEST_SECRET for production protection
    const authHeader = request.headers.get('authorization');
    const expectedSecret = process.env.INGEST_SECRET;
    
    if (expectedSecret) {
      if (!authHeader || authHeader !== `Bearer ${expectedSecret}`) {
        console.warn('⚠️  Unauthorized ingestion attempt blocked');
        return NextResponse.json({
          status: 'error',
          error: 'Unauthorized - Invalid or missing INGEST_SECRET',
        }, { status: 401 });
      }
    }
    
    console.log('🚀 RSS ingestion triggered via API');
    
    const result = await ingestRSSFeeds();
    
    // ⚠️ CRITICAL VALIDATION: Ensure 100% image coverage
    const hasFullCoverage = result.totalArticles > 0 && result.imagesAssigned === result.totalArticles;
    
    if (!hasFullCoverage && result.totalArticles > 0) {
      console.error(`❌ INGESTION ERROR: Only ${result.imagesAssigned}/${result.totalArticles} articles have images`);
      
      // SET STATUS: Error (incomplete image coverage)
      setIngestionStatus('error', `Incomplete image coverage: ${result.imagesAssigned}/${result.totalArticles}`);
      
      return NextResponse.json({
        status: 'incomplete',
        error: `Image coverage incomplete: ${result.imagesAssigned}/${result.totalArticles} (${(result.imagesAssigned/result.totalArticles*100).toFixed(1)}%)`,
        timestamp: new Date().toISOString(),
        articlesLoaded: result.totalArticles,
        imagesAssigned: result.imagesAssigned,
        missingImages: result.totalArticles - result.imagesAssigned,
      }, { status: 500 });
    }
    
    // PERSIST TO VERCEL KV: Store articles (survives serverless restarts)
    try {
      await setCachedNewsData(result.articles);
      console.log(`✅ Persisted ${result.totalArticles} articles to Vercel KV`);
    } catch (storageError) {
      console.error('❌ Failed to store articles in KV:', storageError);
      throw new Error(`Failed to persist articles: ${storageError instanceof Error ? storageError.message : 'Unknown error'}`);
    }
    
    // SET STATUS: Complete (after KV storage succeeded)
    setIngestionStatus('complete');
    
    return NextResponse.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      articlesLoaded: result.totalArticles,
      imagesAssigned: result.imagesAssigned,
      imageCoverage: '100%',
      storage: 'vercel-kv',
    });
  } catch (error) {
    console.error('❌ RSS ingestion failed:', error);
    
    // SET STATUS: Error (catch block)
    setIngestionStatus('error', error instanceof Error ? error.message : 'Unknown error');
    
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

// Also allow GET for easier testing
export async function GET() {
  return NextResponse.json({
    message: 'RSS Ingestion API',
    usage: 'Send POST request to trigger ingestion',
    endpoint: '/api/ingest',
  });
}

