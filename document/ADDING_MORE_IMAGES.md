# 📸 Adding More Images - Quick Guide

**Current Status**: 2 out of 6 categories have real images (Breaking AI, AI Economy)

---

## ✅ What's Working Now

### **Categories with Real JPG Images:**
- ✅ **Breaking AI** (110 articles) → `main-1.jpg`
- ✅ **AI Economy** (86 articles) → `main-1.jpg`

### **Categories Still Using SVG Placeholders:**
- ⏳ **Gen AI** (400 articles) → `main.jpg.svg`
- ⏳ **Creative Tech** (110 articles) → `main.jpg.svg`
- ⏳ **Toolbox** (62 articles) → `main.jpg.svg`
- ⏳ **Future Life** (0 articles) → `main.jpg.svg`

---

## 🚀 How to Add More Images

### **Step 1: Prepare Your Image**

**Specs:**
- **Size**: 1200x630px (optimal for cards and social sharing)
- **Format**: `.jpg`, `.png`, or `.webp`
- **Quality**: High-resolution, professional
- **File size**: < 500KB (optimize with TinyPNG or ImageOptim)

### **Step 2: Save to Category Folder**

Choose the category you want to update:

```bash
# Gen AI
/public/assets/images/categories/gen-ai/main-1.jpg

# Creative Tech
/public/assets/images/categories/creative-tech/main-1.jpg

# Toolbox
/public/assets/images/categories/toolbox/main-1.jpg

# Future Life
/public/assets/images/categories/future-life/main-1.jpg
```

**Important**: Use `main-1.jpg` as the filename (matches the pattern for Breaking AI and AI Economy).

### **Step 3: Update `lib/image-utils.ts`**

Add your category to the real images section:

```typescript
export function getArticleImage(category: string): string {
  const slug = getCategorySlug(category);
  
  // ============================================================================
  // REAL IMAGES (actual JPG files you've uploaded)
  // ============================================================================
  
  // Breaking AI - uses actual JPG image
  if (category === 'Breaking AI') {
    return `/assets/images/categories/breaking-ai/main-1.jpg`;
  }
  
  // AI Economy - uses actual JPG image
  if (category === 'AI Economy') {
    return `/assets/images/categories/ai-economy/main-1.jpg`;
  }
  
  // ADD YOUR NEW CATEGORY HERE:
  if (category === 'Gen AI') {
    return `/assets/images/categories/gen-ai/main-1.jpg`;
  }
  
  // ============================================================================
  // SVG PLACEHOLDERS (temporary - replace when you add more images)
  // ============================================================================
  
  // All other categories use SVG placeholders for now
  return `/assets/images/categories/${slug}/main.jpg.svg`;
}
```

### **Step 4: Test & Deploy**

```bash
# Test locally
npm run dev
# Visit http://localhost:3000 and verify the new image loads

# Build for production
npm run build
# Should pass with 0 errors

# Deploy
npm run deploy
```

---

## 🎯 Quick Copy-Paste Templates

### **For Gen AI:**

```typescript
if (category === 'Gen AI') {
  return `/assets/images/categories/gen-ai/main-1.jpg`;
}
```

### **For Creative Tech:**

```typescript
if (category === 'Creative Tech') {
  return `/assets/images/categories/creative-tech/main-1.jpg`;
}
```

### **For Toolbox:**

```typescript
if (category === 'Toolbox') {
  return `/assets/images/categories/toolbox/main-1.jpg`;
}
```

### **For Future Life:**

```typescript
if (category === 'Future Life') {
  return `/assets/images/categories/future-life/main-1.jpg`;
}
```

---

## 🔄 Adding Multiple Images per Category

Want to rotate between different images for the same category?

### **Step 1: Add Multiple Images**

```bash
/public/assets/images/categories/breaking-ai/
├── main-1.jpg  ← Current
├── main-2.jpg  ← New
└── main-3.jpg  ← New
```

### **Step 2: Update Logic to Rotate**

```typescript
// Random rotation
if (category === 'Breaking AI') {
  const images = ['main-1.jpg', 'main-2.jpg', 'main-3.jpg'];
  const random = images[Math.floor(Math.random() * images.length)];
  return `/assets/images/categories/breaking-ai/${random}`;
}
```

**OR**

```typescript
// Position-based rotation (pass position parameter)
export function getArticleImage(category: string, position: number = 0): string {
  if (category === 'Breaking AI') {
    const imageNumber = (position % 3) + 1; // Cycles through 1, 2, 3
    return `/assets/images/categories/breaking-ai/main-${imageNumber}.jpg`;
  }
  // ... rest of logic
}
```

---

## 📋 Checklist for Each New Image

- [ ] Image is 1200x630px (or 16:9 aspect ratio)
- [ ] Image is optimized (< 500KB)
- [ ] Image is saved as `main-1.jpg` in correct category folder
- [ ] Path starts with `/assets/` (NOT `/public/assets/`)
- [ ] Filename is lowercase and matches exactly (Vercel is case-sensitive)
- [ ] Added `if` statement in `lib/image-utils.ts`
- [ ] Tested locally with `npm run dev`
- [ ] Build passes with `npm run build`
- [ ] Deployed to production

---

## 🎨 Where to Get Images

### **Free Stock Photos (Download & Host Locally):**
- [Pexels](https://www.pexels.com/) - Free, high-quality
- [Pixabay](https://www.pixabay.com/) - Free, no attribution required
- [Unsplash](https://unsplash.com/) - Free, download and host locally

### **Paid Stock Photos:**
- [Shutterstock](https://www.shutterstock.com/) - Professional quality
- [Adobe Stock](https://stock.adobe.com/) - Integrated with Creative Cloud
- [Getty Images](https://www.gettyimages.com/) - Premium selection

### **Custom Graphics:**
- Hire a designer on Fiverr or Upwork
- Use Canva Pro to create custom graphics
- Commission AI-generated art (Midjourney, DALL-E)

### **Important:**
- Always download and host locally (never hotlink)
- Verify you have rights to use the image
- Keep a record of where each image came from

---

## 💡 Pro Tips

### **Consistent Quality:**
- Use the same aspect ratio for all images (1200x630px)
- Maintain similar visual style across categories
- Use consistent color grading

### **Performance:**
- Optimize all images before uploading (use TinyPNG)
- Keep file sizes under 500KB
- Use `.jpg` for photos, `.png` for graphics with transparency

### **Organization:**
- Name files descriptively: `breaking-ai-main-1.jpg`
- Keep a spreadsheet of image sources and licenses
- Back up your images folder regularly

### **Scalability:**
- Start with one image per category
- Add variety later with `main-2.jpg`, `main-3.jpg`, etc.
- Implement rotation logic when you have 3+ images per category

---

## 🚨 Common Mistakes to Avoid

❌ **Using `/public/assets/` in code** → Use `/assets/` instead  
❌ **Uppercase filenames** → Use lowercase (Vercel is case-sensitive)  
❌ **Huge file sizes** → Optimize to < 500KB  
❌ **Wrong aspect ratio** → Stick to 1200x630px or 16:9  
❌ **Hotlinking external URLs** → Always download and host locally  
❌ **Forgetting to update `image-utils.ts`** → Add your category to the function

---

## ✨ Next Steps

1. **Choose your next category** (Gen AI has 400 articles - high impact!)
2. **Find/create a great image** (1200x630px, < 500KB)
3. **Save as `main-1.jpg`** in the category folder
4. **Update `lib/image-utils.ts`** with the new category
5. **Test locally** (`npm run dev`)
6. **Deploy** (`npm run build && deploy`)

**Goal**: Get all 6 categories using real images! 🎯

---

**Questions?** Check `lib/image-utils.ts` to see the current implementation.

**Last Updated**: January 4, 2026 ✅


