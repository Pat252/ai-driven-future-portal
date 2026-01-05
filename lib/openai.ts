/**
 * OpenAI Client Configuration for Smart Image Curation
 * 
 * Uses GPT-4o-mini to intelligently match articles to images based on
 * semantic understanding rather than just keyword matching.
 * 
 * Cost: ~$0.01 per 1,000 articles (extremely efficient)
 * Model: gpt-4o-mini (fast, cheap, accurate for this task)
 */

import OpenAI from 'openai';

// ============================================================================
// CLIENT INITIALIZATION
// ============================================================================

let openaiClient: OpenAI | null = null;

/**
 * Get or create OpenAI client instance (singleton pattern)
 * 
 * @returns OpenAI client or null if API key not configured
 */
export function getOpenAIClient(): OpenAI | null {
  // Return existing client if already initialized
  if (openaiClient) {
    return openaiClient;
  }

  // Check for API key in environment
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.warn('⚠️  OPENAI_API_KEY not found - AI curation disabled, falling back to keyword matching');
    return null;
  }

  try {
    openaiClient = new OpenAI({
      apiKey: apiKey,
    });
    console.log('✅ OpenAI client initialized for Smart Image Curation');
    return openaiClient;
  } catch (error) {
    console.error('❌ Failed to initialize OpenAI client:', error);
    return null;
  }
}

// ============================================================================
// SMART CURATION PROMPTS
// ============================================================================

/**
 * System prompt for the Smart Image Curator
 * 
 * This prompt transforms GPT-4o-mini into a professional news editor
 * who understands brand relationships and semantic connections.
 * 
 * Updated: 2026-01-04 (Enhanced brand/logo matching)
 */
export const CURATOR_SYSTEM_PROMPT = `You are a professional News Editor with expertise in visual storytelling and image curation.

Your task is to select the BEST matching image filename for a news article from a provided list.

PRIORITY MATCHING RULES (in order):

1. **BRAND/LOGO MATCHING (Highest Priority)**
   - If the article mentions a specific company/brand name, IMMEDIATELY select that logo
   - Examples:
     * "OpenAI announces..." → openai-logo-on-television.jpg
     * "Microsoft releases..." → microsoft-building-logo.jpg
     * "Google launches..." → google-office-logo.jpg
     * "Bitcoin reaches..." → bitcoins-money-dollars.jpg
     * "ChatGPT update..." → chatgpt-3d-logo.jpg
     * "Netflix shows..." → netflix-neon-red-logo.jpg
     * "Nvidia GPUs..." → nvidia-logo.jpg
     * "Apple unveils..." → apple-company-front-building.jpg
     * "Meta announces..." → meta-facebook-logo.jpg
     * "Claude AI..." → llm-claude-anthropic.jpg
   - Brand matching ALWAYS takes precedence over conceptual matching

2. **CONCEPTUAL RELEVANCE (Secondary)**
   - If NO brand is mentioned, match based on article topic:
     * "Agentic Metadata" / "Infrastructure" → motherboard-with-ai-cpu.jpg
     * "Economic Policy" → economy-benjamin-franklyn.jpg
     * "Stock Market" → economy-stock-market-chart.jpg
     * "Cryptocurrency" → bitcoins-money-dollars.jpg
     * "AI Research" → neural-network-brain-ai.jpg.svg
     * "Robotics" → robot-hand-touching-human-hand.jpg
     * "Coding/Development" → laptop-coding-on-ide.jpg

3. **CATEGORY MATCHING (Tertiary)**
   - Consider article category as a signal:
     * "Gen AI" → AI models, robots, neural networks
     * "AI Economy" → stocks, money, business, economy
     * "Creative Tech" → design, art, creative tools
     * "Toolbox" → coding, development, tools
     * "Breaking AI" → cutting-edge AI technology

4. **FALLBACK STRATEGY**
   - If NO good match exists, return "RANDOM" (triggers system fallback)
   - Only return "RANDOM" if truly no relevant images exist
   - This is rare with 97+ images

RESPONSE FORMAT:
- Return ONLY the exact filename (e.g., "bitcoins-money-dollars.jpg")
- No explanations, no markdown, no quotes, no extra text
- Just the filename from the provided list
- Or "RANDOM" if no match exists

EXAMPLES:
Article: "OpenAI Releases GPT-5 Model"
Response: openai-logo-on-television.jpg

Article: "The Rise of Agentic Metadata in AI Systems"
Response: motherboard-with-ai-cpu.jpg

Article: "Stock Markets Rally on Tech News"
Response: economy-stock-market-chart.jpg`;


/**
 * Build user prompt for a specific article
 * 
 * @param title - Article title
 * @param category - Article category
 * @param imageLibrary - Array of available image filenames
 * @returns Formatted prompt for GPT-4o-mini
 */
export function buildCuratorPrompt(
  title: string,
  category: string,
  imageLibrary: string[]
): string {
  return `Article Title: "${title}"
Article Category: "${category}"

Available Images:
${imageLibrary.map((img, idx) => `${idx + 1}. ${img}`).join('\n')}

Select the BEST matching filename:`;
}

// ============================================================================
// AI CURATION FUNCTION
// ============================================================================

/**
 * Use GPT-4o-mini to intelligently select the best image for an article
 * 
 * This function:
 * 1. Sends article title + category to GPT-4o-mini
 * 2. Provides full image library as options
 * 3. Gets back the most semantically relevant filename
 * 4. Validates the response is in our library
 * 5. Returns the selected image or null if failed
 * 
 * Cost: ~$0.00001 per article (1 cent per 1,000 articles)
 * Speed: ~200-500ms per request
 * 
 * @param title - Article title
 * @param category - Article category
 * @param imageLibrary - Array of available image filenames
 * @returns Selected image filename or null if AI fails
 */
export async function smartCurateImage(
  title: string,
  category: string,
  imageLibrary: string[]
): Promise<string | null> {
  const client = getOpenAIClient();
  
  // If no client (missing API key), return null to trigger fallback
  if (!client) {
    return null;
  }

  try {
    const userPrompt = buildCuratorPrompt(title, category, imageLibrary);

    const completion = await client.chat.completions.create(
      {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: CURATOR_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3, // Low temperature for consistent, focused responses
        max_tokens: 50, // We only need a filename back
      },
      {
        timeout: 5000, // 5 second timeout to prevent hanging
      }
    );

    const selectedFilename = completion.choices[0]?.message?.content?.trim();

    // Validate response
    if (!selectedFilename) {
      console.warn('⚠️  GPT-4o-mini returned empty response');
      return null;
    }

    // Check if returned filename exists in our library
    if (!imageLibrary.includes(selectedFilename)) {
      console.warn(`⚠️  GPT-4o-mini returned invalid filename: ${selectedFilename}`);
      return null;
    }

    // Success! Return the AI-selected filename
    return selectedFilename;

  } catch (error) {
    console.error('❌ Smart curation error:', error);
    return null;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if OpenAI API is available and configured
 * 
 * @returns true if API key is present and client can be initialized
 */
export function isAICurationAvailable(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

/**
 * Estimate cost for curating N articles
 * 
 * Based on GPT-4o-mini pricing: ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens
 * Typical request: ~200 input tokens, ~10 output tokens
 * 
 * @param articleCount - Number of articles to curate
 * @returns Estimated cost in USD
 */
export function estimateCurationCost(articleCount: number): number {
  const avgInputTokens = 200; // Prompt + image list
  const avgOutputTokens = 10; // Filename response
  
  const inputCost = (articleCount * avgInputTokens / 1_000_000) * 0.15;
  const outputCost = (articleCount * avgOutputTokens / 1_000_000) * 0.60;
  
  return inputCost + outputCost;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  getOpenAIClient,
  smartCurateImage,
  isAICurationAvailable,
  estimateCurationCost,
};

