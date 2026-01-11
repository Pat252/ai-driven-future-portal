/**
 * AI-BASED IMAGE SELECTOR
 * 
 * Uses OpenAI GPT to select the best image for each article
 * based on semantic understanding, not keyword matching.
 */

import OpenAI from 'openai';

// Initialize OpenAI client
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error(
        'CRITICAL: OPENAI_API_KEY environment variable not set.\n' +
        'Required for AI-based image selection.'
      );
    }
    
    openaiClient = new OpenAI({ apiKey });
  }
  
  return openaiClient;
}

/**
 * Filter images to most relevant candidates (pre-filter for GPT)
 */
function filterRelevantImages(
  imageKeys: string[],
  title: string,
  description: string,
  maxCandidates: number = 50
): string[] {
  const articleText = `${title} ${description}`.toLowerCase();
  
  // Extract company/brand mentions
  const companyKeywords = [
    'openai', 'gpt', 'chatgpt',
    'google', 'gemini', 'deepmind',
    'meta', 'facebook', 'llama',
    'anthropic', 'claude',
    'nvidia', 'cuda',
    'microsoft', 'copilot', 'azure',
    'apple', 'siri',
    'amazon', 'aws', 'alexa',
    'tesla', 'spacex',
    'samsung', 'qualcomm', 'intel', 'amd',
    'mistral', 'cohere', 'huggingface',
  ];
  
  const mentionedCompanies = companyKeywords.filter(kw => articleText.includes(kw));
  
  // Prioritize company images if companies are mentioned
  if (mentionedCompanies.length > 0) {
    const companyImages = imageKeys.filter(key => 
      key.startsWith('companies/') && 
      mentionedCompanies.some(company => key.toLowerCase().includes(company))
    );
    
    if (companyImages.length > 0) {
      // Add some non-company images for diversity
      const otherImages = imageKeys
        .filter(key => !key.startsWith('companies/'))
        .slice(0, 20);
      
      return [...companyImages, ...otherImages].slice(0, maxCandidates);
    }
  }
  
  // For non-company articles, exclude company images
  const nonCompanyImages = imageKeys.filter(key => !key.startsWith('companies/'));
  
  // Return up to maxCandidates images
  return nonCompanyImages.slice(0, maxCandidates);
}

/**
 * Select best image using OpenAI GPT
 */
export async function selectBestImageForArticle(params: {
  title: string;
  description: string;
  category: string;
  imageKeys: string[];
}): Promise<{
  imageKey: string;
  reason: string;
}> {
  const { title, description, category, imageKeys } = params;
  
  // Pre-filter to most relevant candidates
  const candidates = filterRelevantImages(imageKeys, title, description, 50);
  
  if (candidates.length === 0) {
    // Fallback: use any non-company image
    const fallbackCandidates = imageKeys.filter(key => !key.startsWith('companies/'));
    if (fallbackCandidates.length === 0) {
      throw new Error('No images available for selection');
    }
    
    // Deterministic fallback selection
    const hash = simpleHash(title);
    const index = Math.floor(hash * fallbackCandidates.length);
    
    return {
      imageKey: fallbackCandidates[index],
      reason: 'Fallback: No relevant candidates, selected random non-company image',
    };
  }
  
  try {
    const client = getOpenAIClient();
    
    // Build GPT prompt
    const systemPrompt = `You are an expert image curator for a technology news website focused on AI and innovation.

Your task is to select the BEST image from a list of available images to illustrate a news article.

RULES:
1. If the article mentions a specific company (OpenAI, Google, Meta, etc.), prefer that company's logo or related image
2. If the article mentions a specific AI model (GPT, Claude, Gemini, etc.), prefer images related to that model or company
3. For generic AI topics, prefer abstract AI, technology, or infrastructure images
4. NEVER select a company logo for an article that doesn't mention that company
5. Avoid mismatches (e.g., Samsung logo for a Google article, chipset for a software story)
6. Return EXACTLY ONE image path from the provided list
7. NEVER invent or modify the image path

Return ONLY valid JSON:
{
  "imageKey": "exact/path/from/list.jpg",
  "reason": "brief explanation why this image fits best"
}`;

    const userPrompt = `Article Title: "${title}"
Description: "${description}"
Category: ${category}

Available images (Cloudflare R2 object keys):
${candidates.map((key, i) => `${i + 1}. ${key}`).join('\n')}

Select the BEST image for this article. Return JSON only.`;

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 200,
      response_format: { type: 'json_object' },
    });
    
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('GPT returned empty response');
    }
    
    const result = JSON.parse(content);
    
    // Validate that selected image exists in candidates
    if (!candidates.includes(result.imageKey)) {
      console.warn(`⚠️  GPT selected invalid image: ${result.imageKey}`);
      throw new Error('GPT selected image not in candidate list');
    }
    
    return {
      imageKey: result.imageKey,
      reason: result.reason || 'AI selected',
    };
  } catch (error) {
    console.error('❌ GPT image selection failed:', error);
    
    // Fallback: deterministic selection from candidates
    const hash = simpleHash(title);
    const index = Math.floor(hash * candidates.length);
    
    return {
      imageKey: candidates[index],
      reason: `Fallback: GPT failed (${error instanceof Error ? error.message : 'unknown error'})`,
    };
  }
}

/**
 * Select TOP 3-5 candidate images using OpenAI GPT
 * Returns multiple ranked candidates for global allocation
 */
export async function selectTopImageCandidates(params: {
  title: string;
  description: string;
  category: string;
  imageKeys: string[];
  topN?: number;
}): Promise<string[]> {
  const { title, description, category, imageKeys, topN = 5 } = params;
  
  // Pre-filter to most relevant candidates
  const candidates = filterRelevantImages(imageKeys, title, description, 50);
  
  if (candidates.length === 0) {
    // Fallback: use any non-company images
    const fallbackCandidates = imageKeys.filter(key => !key.startsWith('companies/'));
    if (fallbackCandidates.length === 0) {
      throw new Error('No images available for selection');
    }
    
    // Return top N deterministically
    return fallbackCandidates.slice(0, topN);
  }
  
  try {
    const client = getOpenAIClient();
    
    // Build GPT prompt for multiple candidates
    const systemPrompt = `You are an expert image curator for a technology news website focused on AI and innovation.

Your task is to select the TOP ${topN} BEST images from a list to illustrate a news article, ranked by relevance.

RULES:
1. If the article mentions a specific company (OpenAI, Google, Meta, etc.), prefer that company's logo or related image
2. If the article mentions a specific AI model (GPT, Claude, Gemini, etc.), prefer images related to that model or company
3. For generic AI topics, prefer abstract AI, technology, or infrastructure images
4. NEVER select a company logo for an article that doesn't mention that company
5. Avoid mismatches (e.g., Samsung logo for a Google article, chipset for a software story)
6. Return EXACTLY ${topN} image paths from the provided list, ranked best to worst
7. NEVER invent or modify the image paths

Return ONLY valid JSON:
{
  "candidates": ["path/to/best.jpg", "path/to/second.jpg", "path/to/third.jpg"],
  "reason": "brief explanation of ranking"
}`;

    const userPrompt = `Article Title: "${title}"
Description: "${description}"
Category: ${category}

Available images (Cloudflare R2 object keys):
${candidates.map((key, i) => `${i + 1}. ${key}`).join('\n')}

Select the TOP ${topN} BEST images for this article, ranked by relevance. Return JSON only.`;

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 300,
      response_format: { type: 'json_object' },
    });
    
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('GPT returned empty response');
    }
    
    const result = JSON.parse(content);
    
    // Validate that all selected images exist in candidates
    if (!Array.isArray(result.candidates)) {
      throw new Error('GPT did not return candidates array');
    }
    
    const validCandidates = result.candidates.filter((key: string) => 
      candidates.includes(key)
    );
    
    if (validCandidates.length === 0) {
      throw new Error('None of GPT selected images are valid');
    }
    
    // Return validated candidates (may be fewer than topN if GPT returned invalid ones)
    return validCandidates.slice(0, topN);
  } catch (error) {
    console.error('❌ GPT multi-candidate selection failed:', error);
    
    // Fallback: deterministic selection from candidates
    // Use hash to offset, then take top N sequentially
    const hash = simpleHash(title);
    const offset = Math.floor(hash * candidates.length);
    
    const fallbackCandidates: string[] = [];
    for (let i = 0; i < topN && i < candidates.length; i++) {
      const index = (offset + i) % candidates.length;
      fallbackCandidates.push(candidates[index]);
    }
    
    return fallbackCandidates;
  }
}

/**
 * Simple hash function for deterministic fallback
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash) / 2147483647;
}

