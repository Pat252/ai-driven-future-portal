# Setup Guide - AI-Powered Smart Curator

## Quick Start (5 minutes)

### 1. Install Dependencies
```bash
npm install
```

The `openai` package is already installed! ✅

### 2. Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
# OpenAI API Configuration (GPT-4o-mini Smart Image Curator)
OPENAI_API_KEY=sk-proj-your-key-here

# Resend API Configuration (Newsletter)
RESEND_API_KEY=re_your-key-here
```

**Get your OpenAI API key:**
1. Go to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copy the key (starts with `sk-proj-...`)
4. Paste into `.env.local`

**Cost:** ~$0.01 per 1,000 articles (negligible!)

### 3. Run Development Server
```bash
npm run dev
```

Open http://localhost:3000

### 4. Verify AI Curation

Check the console output:

**✅ Success (AI enabled):**
```
✅ OpenAI client initialized for Smart Image Curation
Fetching feed from TechCrunch...
[AI Match] "Bitcoin Reaches New All-Time High..." -> bitcoins-money-dollars.jpg (GPT-4o-mini)
[AI Match] "OpenAI Releases GPT-5 Model..." -> openai-logo-on-television.jpg (GPT-4o-mini)
```

**⚠️ Fallback (No API key):**
```
⚠️  OPENAI_API_KEY not found - AI curation disabled, falling back to keyword matching
Fetching feed from TechCrunch...
[Keyword Match] "Bitcoin Reaches New All-Time High..." -> bitcoins-money-dollars.jpg (Score: 3.0)
```

Both work perfectly! AI just provides better semantic matching.

---

## Deployment (Vercel)

### 1. Push to GitHub
```bash
git add .
git commit -m "Add AI-powered image curation"
git push origin main
```

### 2. Deploy to Vercel
1. Go to https://vercel.com
2. Import your repository
3. Add environment variables:
   - `OPENAI_API_KEY` = `sk-proj-your-key-here`
   - `RESEND_API_KEY` = `re_your-key-here`
4. Click "Deploy"

### 3. Verify Production
- Check Vercel logs for `[AI Match]` entries
- Verify images are contextually relevant
- Monitor API costs in OpenAI dashboard

---

## Configuration Options

### Disable AI Curation
Simply remove `OPENAI_API_KEY` from `.env.local` or Vercel environment variables.

System will automatically fall back to keyword matching (no errors).

### Adjust AI Temperature
Edit `lib/openai.ts`:
```typescript
temperature: 0.3, // Lower = consistent, Higher = creative
```

**Recommended:**
- `0.1-0.3` → Production (consistent)
- `0.4-0.7` → Testing (balanced)
- `0.8-1.0` → Experimental (creative)

### Change Model
Edit `lib/openai.ts`:
```typescript
model: 'gpt-4o-mini', // Fast & cheap
// model: 'gpt-4o',    // More accurate but 10x cost
// model: 'gpt-4',     // Most accurate but 30x cost
```

**Cost comparison (per 1,000 articles):**
- `gpt-4o-mini`: ~$0.01 ✅ Recommended
- `gpt-4o`: ~$0.10
- `gpt-4`: ~$0.30

---

## Testing

### Test AI Curation
```bash
# 1. Add OPENAI_API_KEY to .env.local
# 2. Run dev server
npm run dev

# 3. Check console for [AI Match] logs
# 4. Verify images are contextually relevant
```

### Test Fallback (No AI)
```bash
# 1. Remove OPENAI_API_KEY from .env.local
# 2. Run dev server
npm run dev

# 3. Check console for [Keyword Match] logs
# 4. Verify images still work (keyword matching)
```

### Test Caching
```bash
# 1. Run dev server
npm run dev

# 2. Refresh page multiple times
# 3. Check console for [Cache Hit] logs
# 4. Verify no duplicate AI calls
```

---

## Monitoring

### Check API Usage
1. Go to https://platform.openai.com/usage
2. View daily/monthly costs
3. Expected: ~$0.01 per 1,000 articles

### Check Cache Efficiency
Look for console logs:
```
[AI Match] ... (First call - costs money)
[Cache Hit] ... (Cached - FREE!)
[Cache Hit] ... (Cached - FREE!)
```

**Goal:** 90%+ cache hit rate after initial fetch

---

## Troubleshooting

### Issue: "Cannot find module 'openai'"
**Solution:**
```bash
npm install openai
```

### Issue: No [AI Match] logs
**Checklist:**
1. ✅ Is `OPENAI_API_KEY` in `.env.local`?
2. ✅ Is the key valid? (starts with `sk-proj-`)
3. ✅ Did you restart dev server after adding key?
4. ✅ Check for error messages in console

### Issue: AI selecting wrong images
**Solutions:**
1. Improve image filenames (more descriptive)
2. Lower AI temperature (more consistent)
3. Update system prompt in `lib/openai.ts`

### Issue: High API costs
**Solutions:**
1. Verify caching is working ([Cache Hit] logs)
2. Reduce RSS fetch frequency (increase `revalidate`)
3. Limit articles per feed (currently 50)

---

## File Structure

```
ai-driven-future-portal/
├── lib/
│   ├── openai.ts           ← NEW: AI curation logic
│   ├── image-utils.ts      ← UPDATED: Async AI support
│   └── rss.ts              ← UPDATED: Caching + AI calls
├── public/
│   └── assets/
│       └── images/
│           └── all/        ← 97 local images
├── .env.local              ← ADD THIS: API keys
├── AI_CURATOR_IMPLEMENTATION.md  ← Full documentation
├── SETUP_GUIDE.md          ← This file
└── package.json            ← openai package added
```

---

## Next Steps

### Immediate
1. ✅ Add `OPENAI_API_KEY` to `.env.local`
2. ✅ Run `npm run dev`
3. ✅ Verify [AI Match] logs in console
4. ✅ Test on homepage and category pages

### Optional
1. Deploy to Vercel with environment variables
2. Monitor API costs in OpenAI dashboard
3. Add more descriptive image filenames
4. Customize system prompt for your needs

---

## Support

### Documentation
- **Full Implementation:** `AI_CURATOR_IMPLEMENTATION.md`
- **Image Matching Examples:** `IMAGE_MATCHING_EXAMPLES.md`
- **Original Implementation:** `SMART_CURATOR_IMPLEMENTATION.md`

### Key Files
- **AI Logic:** `lib/openai.ts`
- **Image Selection:** `lib/image-utils.ts`
- **RSS Fetching:** `lib/rss.ts`

### Resources
- OpenAI API Docs: https://platform.openai.com/docs
- GPT-4o-mini Pricing: https://openai.com/pricing
- Next.js Environment Variables: https://nextjs.org/docs/basic-features/environment-variables

---

**Status:** ✅ Ready to Use  
**Cost:** ~$0.01 per 1,000 articles  
**Setup Time:** 5 minutes  
**Difficulty:** Easy

🎉 **You're all set! Start the dev server and watch the AI magic happen!**

