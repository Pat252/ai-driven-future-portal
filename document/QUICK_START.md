# Quick Start - Automatic Image Discovery System

## 🚀 How to Add New Images (3 Steps)

### Step 1: Add Image to Folder
```bash
# Just drop the file in the folder
cp ~/Downloads/tesla-logo.jpg public/assets/images/all/
```

**Important:** No spaces in filenames!
- ✅ Good: `tesla-logo.jpg`
- ❌ Bad: `Tesla Logo.jpg`

### Step 2: Restart Server
```bash
npm run dev
```

The system automatically discovers all images!

### Step 3: Verify
Check console output:
```
✅ Discovered 98 images in /public/assets/images/all/
```

**That's it!** The AI will automatically use your new image.

---

## 📋 Image Naming Rules

### ✅ Good Examples
```
microsoft-logo.jpg
openai-3d-icon.jpg
bitcoin-crypto-currency.jpg
ai-robot-future-tech.jpg
economy-stock-market-chart.jpg
```

### ❌ Bad Examples
```
Microsoft Logo.jpg        ← Spaces (ERROR!)
IMG_1234.jpg             ← No keywords
photo.jpg                ← Too generic
my image file.jpg        ← Spaces + generic
```

### Best Practices
1. **Lowercase** - consistent with URLs
2. **Dashes** - instead of spaces/underscores
3. **Keywords** - brand, topic, type
4. **Descriptive** - helps AI matching

---

## 🎯 How AI Matching Works

### Priority 1: Brand/Logo (Highest)
```
Article: "OpenAI Releases GPT-5"
AI: Looks for "openai" in filenames
Finds: openai-logo-on-television.jpg
Result: ✅ Perfect match!
```

### Priority 2: Conceptual (Secondary)
```
Article: "The Rise of Agentic Metadata"
AI: Understands this is about infrastructure
Finds: motherboard-with-ai-cpu.jpg
Result: ✅ Smart match!
```

### Priority 3: Category (Tertiary)
```
Article: "Tech Industry Trends" (Category: "Gen AI")
AI: Uses category as signal
Finds: ai-icon-head-1.jpg
Result: ✅ Good match!
```

### Fallback: Hash-Based Random
```
Article: "The Future" (no matches)
System: Uses title hash for consistency
Finds: robot-hand-touching-human-hand.jpg
Result: ✅ Always same image for same title!
```

---

## 🔍 Common Scenarios

### Scenario 1: Brand Article
```
Article: "Microsoft Copilot Updates"
Expected: microsoft-building-logo.jpg
Why: Brand name in title → AI picks logo
```

### Scenario 2: Tech Topic
```
Article: "Agentic AI Systems"
Expected: motherboard-with-ai-cpu.jpg
Why: "Agentic" = infrastructure → AI picks tech image
```

### Scenario 3: Economy Article
```
Article: "Stock Markets Rally"
Expected: economy-stock-market-chart.jpg
Why: "Stock" + "Markets" → AI picks finance image
```

### Scenario 4: Generic Article
```
Article: "The Future of Technology"
Expected: ai-robot-future-technology.jpg.svg
Why: Generic keywords → AI picks broad tech image
```

---

## 🧪 Testing Your Images

### Test 1: Verify Discovery
```bash
npm run dev
# Check console: "✅ Discovered XX images"
```

### Test 2: Check Specific Article
```bash
# Look for [AI Match] or [Keyword Match] logs
[AI Match] "Bitcoin..." -> bitcoins-money-dollars.jpg (Confidence: High)
```

### Test 3: Test Visual Diversity
```bash
# Add 3 Microsoft articles
# Verify they use different Microsoft images:
# - microsoft-building-logo.jpg
# - microsoft-teams-logo.jpg
# - microsoft-office365-on-mobile.jpg
```

---

## 💡 Pro Tips

### Tip 1: Brand Images
Add all brand logos for instant matching:
```
google-logo.jpg
apple-logo.jpg
meta-logo.jpg
amazon-logo.jpg
netflix-logo.jpg
```

### Tip 2: Category Images
Add category-specific images:
```
ai-robot-*.jpg        → Gen AI articles
economy-stock-*.jpg   → AI Economy articles
laptop-coding-*.jpg   → Toolbox articles
creative-design-*.jpg → Creative Tech articles
```

### Tip 3: Descriptive Filenames
More keywords = better matching:
```
❌ robot.jpg
✅ ai-robot-future-technology.jpg
```

### Tip 4: Multiple Variations
Add multiple images per brand:
```
microsoft-building-logo.jpg
microsoft-teams-logo.jpg
microsoft-office365-on-mobile.jpg
microsoft-front-office-store.jpg
```

---

## 🐛 Quick Troubleshooting

### "Discovered 0 images"
**Fix:** Check folder exists
```bash
ls public/assets/images/all/
```

### "Image not being used"
**Fix:** Check filename has no spaces
```bash
# Bad
ls "Microsoft Logo.jpg"

# Good
ls microsoft-logo.jpg
```

### "Same image every time"
**Fix:** Add more images for that topic
```bash
# Add multiple variations
cp openai-logo-1.jpg public/assets/images/all/
cp openai-logo-2.jpg public/assets/images/all/
cp openai-logo-3.jpg public/assets/images/all/
```

---

## 📊 System Overview

### Three-Layer Safety Net
```
┌─────────────────────────────────┐
│  TIER 1: GPT-4o-mini AI         │
│  • Brand/logo matching          │
│  • Semantic understanding       │
│  • Cost: ~$0.00004 per article  │
└─────────────────────────────────┘
            ↓ (if fails)
┌─────────────────────────────────┐
│  TIER 2: Keyword Matching       │
│  • +2.0 points per category     │
│  • +1.5 points per keyword      │
│  • -5.0 penalty for used images │
└─────────────────────────────────┘
            ↓ (if score = 0)
┌─────────────────────────────────┐
│  TIER 3: Hash-Based Random      │
│  • Consistent selection         │
│  • 100% coverage guarantee      │
│  • Same article = same image    │
└─────────────────────────────────┘
```

### Result: Every Article Gets an Image ✅

---

## 📚 Documentation

- **Full Implementation:** `AI_CURATOR_IMPLEMENTATION.md`
- **Automatic Discovery:** `AUTOMATIC_DISCOVERY_UPGRADE.md`
- **Setup Guide:** `SETUP_GUIDE.md`
- **Examples:** `IMAGE_MATCHING_EXAMPLES.md`
- **Quick Start:** This file

---

## ✅ Checklist for New Images

- [ ] Filename has no spaces
- [ ] Filename is lowercase
- [ ] Filename has descriptive keywords
- [ ] File is in `/public/assets/images/all/`
- [ ] File extension is valid (.jpg, .png, .svg, etc.)
- [ ] Server restarted (`npm run dev`)
- [ ] Console shows "✅ Discovered X images"
- [ ] Test article uses new image

---

**Remember:** Just add images to the folder. The system handles everything else!

🎉 **Status:** Ready to Use  
🚀 **Maintenance:** Zero  
💰 **Cost:** ~$0.01 per 1,000 articles


