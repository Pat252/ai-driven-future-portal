# AI Driven Future Portal

> **Bloomberg Terminal meets The Matrix** - A modern AI news aggregation portal delivering real-time insights from 30+ industry-leading sources.

[![Next.js](https://img.shields.io/badge/Next.js-16.1.1-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.3-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.17-38bdf8)](https://tailwindcss.com/)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [RSS Feed Sources](#rss-feed-sources)
- [Image System Architecture](#️-image-system-architecture)
- [Deployment](#deployment)
- [Performance](#performance)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## 🎯 Overview

AI Driven Future Portal is a sophisticated news aggregation platform that curates and displays the latest AI industry news from 30+ authoritative sources. Built with Next.js 16 and TypeScript, it features real-time market data, intelligent content interleaving, and a beautiful dark/light mode interface.

### Key Highlights

- **30+ RSS Feed Sources** - Aggregates content from TechCrunch, MIT Tech Review, OpenAI, Google, NVIDIA, Apple, and more
- **AI-Powered Image Curation** - GPT-4o-mini intelligently matches articles to images based on semantic understanding
- **Automatic Image Discovery** - Server-side file system scanning for zero-maintenance image management
- **Intelligent Content Mixing** - Round-robin algorithm prevents source monopolization
- **Real-Time Market Data** - Live crypto prices, stock quotes, and market overview
- **Newsletter Integration** - Resend-powered email subscriptions
- **ISR Caching** - 1-hour incremental static regeneration for optimal performance
- **Copyright Compliant** - 100% local-only image system with owned assets
- **Responsive Design** - Mobile-first with Tailwind CSS
- **Dark Mode** - System-aware theme switching

## ✨ Features

### Content Aggregation
- ✅ Parallel RSS feed fetching (30+ sources)
- ✅ Smart interleaving by category and source
- ✅ Deep buffer strategy (50 items per feed for 2-3 day retention)
- ✅ Robust link validation and error handling
- ✅ Date parsing and relative time formatting
- ✅ HTML sanitization and CDATA handling
- ✅ Fair Use compliance (200 character description limit)

### User Experience
- ✅ Hero section with featured story
- ✅ Trending articles sidebar
- ✅ Category-based navigation (5 categories)
- ✅ Newsletter signup integration
- ✅ Live market ticker
- ✅ TradingView market overview widget (AI Economy page)

### AI-Powered Image System
- ✅ **GPT-4o-mini Integration** - Semantic image matching (~$0.01 per 1,000 articles)
- ✅ **Automatic Image Discovery** - Server-side file system scanning (no hard-coded lists)
- ✅ **Multi-Tier Fallback** - AI curation → Keyword matching → Hash-based selection
- ✅ **Visual Diversity** - Prevents duplicate images in nearby articles
- ✅ **Image Persistence** - Same article always gets same image (bookmarkable UX)
- ✅ **97+ Local Images** - Copyright-compliant owned assets in `/public/assets/images/all/`
- ✅ **Smart Caching** - In-memory cache prevents duplicate AI API calls

### Technical Features
- ✅ Incremental Static Regeneration (ISR)
- ✅ TypeScript for type safety
- ✅ Server and Client Components
- ✅ Image optimization with Next.js Image (AVIF/WebP)
- ✅ Error boundaries and graceful degradation
- ✅ SEO-optimized metadata
- ✅ Server-side only image processing (prevents client-side errors)

## 🛠 Tech Stack

### Core
- **Framework:** [Next.js 16.1.1](https://nextjs.org/) (App Router)
- **UI Library:** [React 19.2.3](https://reactjs.org/)
- **Language:** [TypeScript 5](https://www.typescriptlang.org/)

### Styling & UI
- **CSS Framework:** [Tailwind CSS 3.4.17](https://tailwindcss.com/)
- **Theme Management:** [next-themes 0.4.6](https://github.com/pacocoursey/next-themes)
- **Icons:** [Lucide React 0.562.0](https://lucide.dev/)

### Data & APIs
- **RSS Parser:** [rss-parser 3.13.0](https://www.npmjs.com/package/rss-parser)
- **Email Service:** [Resend 6.6.0](https://resend.com/)
- **Date Utilities:** [date-fns 4.1.0](https://date-fns.org/)
- **AI Integration:** [OpenAI SDK 6.15.0](https://github.com/openai/openai-node) (GPT-4o-mini)

### External Services
- **Crypto Data:** [CoinGecko API](https://www.coingecko.com/en/api) (Free, no key required)
- **Stock Data:** [Finnhub API](https://finnhub.io/) (Optional)
- **Market Widget:** [TradingView](https://www.tradingview.com/widget-docs/)
- **AI Curation:** [OpenAI API](https://platform.openai.com/) (Optional, for smart image matching)

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 20.x or higher
- **npm**, **yarn**, **pnpm**, or **bun** package manager
- **Git** for version control

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-driven-future-portal
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   # or
   bun install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   # Required: Resend Email Service
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   RESEND_AUDIENCE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   
   # Optional: Finnhub Stock API (for ticker component)
   NEXT_PUBLIC_FINNHUB_API_KEY=xxxxxxxxxxxxx
   
   # Optional: OpenAI API (for AI-powered image curation)
   # Without this, system falls back to keyword matching
   OPENAI_API_KEY=sk-xxxxxxxxxxxxx
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   # or
   bun dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔐 Environment Variables

### Required Variables

| Variable | Description | Where to Get It |
|----------|-------------|-----------------|
| `RESEND_API_KEY` | Resend API authentication key | [Resend Dashboard](https://resend.com/api-keys) |
| `RESEND_AUDIENCE_ID` | Target audience/list ID in Resend | [Resend Audiences](https://resend.com/audiences) |

### Optional Variables

| Variable | Description | Where to Get It |
|----------|-------------|-----------------|
| `NEXT_PUBLIC_FINNHUB_API_KEY` | Finnhub API key for stock prices | [Finnhub API](https://finnhub.io/register) |
| `OPENAI_API_KEY` | OpenAI API key for AI-powered image curation | [OpenAI Platform](https://platform.openai.com/api-keys) |

**Notes:**
- Without `NEXT_PUBLIC_FINNHUB_API_KEY`, the ticker will display crypto data and editorial items only (no stock prices).
- Without `OPENAI_API_KEY`, the image system will use keyword matching instead of AI curation (still fully functional).

## 🏃 Getting Started

### Development Mode

```bash
npm run dev
```

The site will be available at `http://localhost:3000` with hot-reload enabled.

### Build for Production

```bash
npm run build
```

This will:
- Fetch all RSS feeds
- Generate static HTML for all pages
- Optimize images and assets
- Create production-ready build

### Start Production Server

```bash
npm start
```

### Linting

```bash
npm run lint
```

## 📁 Project Structure

```
ai-driven-future-portal/
├── app/
│   ├── api/
│   │   └── newsletter/
│   │       └── route.ts          # Newsletter subscription API (Resend)
│   ├── category/
│   │   └── [slug]/
│   │       └── page.tsx          # Dynamic category pages with ISR
│   ├── privacy/
│   │   └── page.tsx              # Privacy policy page
│   ├── globals.css               # Global styles & CSS variables
│   ├── layout.tsx                # Root layout with theme provider
│   ├── page.tsx                  # Homepage (ISR: 1 hour revalidation)
│   └── favicon.ico               # Site favicon
├── components/
│   ├── Footer.tsx                # Site footer with links
│   ├── Header.tsx                # Navigation header with categories
│   ├── Hero.tsx                  # Hero section with featured story
│   ├── MarketOverview.tsx        # TradingView market widget
│   ├── NewsCard.tsx              # Individual news article card
│   ├── NewsGrid.tsx              # News grid with newsletter CTA
│   ├── ThemeProvider.tsx         # Theme context provider (next-themes)
│   ├── ThemeToggle.tsx           # Dark/light mode toggle button
│   └── Ticker.tsx                # Live market ticker (crypto/stocks)
├── lib/
│   ├── rss.ts                    # RSS feed aggregation engine
│   ├── openai.ts                 # OpenAI client & AI curation logic
│   ├── image-utils.ts            # Image selection & discovery system
│   └── image-constants.ts        # Image path constants & helpers
├── public/
│   ├── assets/
│   │   └── images/
│   │       ├── all/              # 97+ local images (auto-discovered)
│   │       ├── categories/       # Category-specific placeholders
│   │       └── defaults/         # Fallback placeholder images
│   ├── logo.jpg                  # Site logo
│   └── [other assets]            # SVG icons, etc.
├── document/                     # Project documentation
│   ├── AI_CURATOR_IMPLEMENTATION.md
│   ├── DEPLOYMENT_GUIDE.md
│   ├── IMAGE_SYSTEM_MIGRATION.md
│   └── [other docs]
├── next.config.ts                # Next.js config (image domains, etc.)
├── tailwind.config.ts            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json                  # Dependencies and scripts
```

### Key Directories Explained

- **`app/`** - Next.js 16 App Router pages and API routes
- **`components/`** - React components (mix of Server and Client Components)
- **`lib/`** - Core business logic (RSS parsing, image curation, AI integration)
- **`public/assets/images/all/`** - Local image library (auto-discovered by system)
- **`document/`** - Project documentation and implementation guides

## 📡 API Documentation

### Newsletter Subscription

**Endpoint:** `POST /api/newsletter`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Success Response (200):**
```json
{
  "message": "Success"
}
```

**Error Responses:**

- `400 Bad Request` - Missing email
- `500 Internal Server Error` - Missing audience ID or Resend API error

**Example:**
```javascript
const response = await fetch('/api/newsletter', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ email: 'user@example.com' }),
});

const data = await response.json();
```

## 📰 RSS Feed Sources

The platform aggregates content from **30+ RSS feeds** across 5 categories:

### Breaking AI (Red Badge)
- TechCrunch AI
- MIT Technology Review
- Ars Technica
- Wired
- ScienceDaily AI

### Gen AI (Cyan Badge)
**Models & Research Labs:**
- OpenAI Blog
- Google Developers (Gemini)
- Hugging Face
- DeepMind
- NVIDIA Blog
- Apple Machine Learning

**IDEs & No-Code Builders:**
- Replit
- Vercel AI (v0)
- GitHub Copilot

**Agents & Orchestration:**
- LangChain
- n8n Automation
- AutoGen (Microsoft)

**Voice & Multimodal AI:**
- AssemblyAI
- Stability AI

**Cloud Infrastructure:**
- Azure AI (Microsoft)
- AWS Machine Learning

**Industry News:**
- TechCrunch GenAI
- Simon Willison's Blog

### AI Economy (Green Badge)
- CNBC Tech
- ZDNet
- Fortune
- The New Stack

### Creative Tech (Purple Badge)
- The Verge
- Mashable
- Engadget

### Toolbox (Orange Badge)
- HackerNoon
- Dev.to AI
- Towards Data Science
- Machine Learning Mastery

**Note:** The system uses intelligent interleaving by source within each category to ensure diverse content representation and prevent any single source from dominating the feed. Each feed fetches up to 50 items for 2-3 day content retention.

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in [Vercel Dashboard](https://vercel.com/new)
3. Add environment variables in project settings
4. Deploy automatically on every push

### Other Platforms

The application can be deployed to any platform that supports Next.js:

- **Netlify**
- **AWS Amplify**
- **Railway**
- **DigitalOcean App Platform**
- **Render**

### Environment Variables in Production

Make sure to configure all required environment variables in your hosting platform's dashboard:

```env
# Required
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_AUDIENCE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Optional
NEXT_PUBLIC_FINNHUB_API_KEY=xxxxxxxxxxxxx
OPENAI_API_KEY=sk-xxxxxxxxxxxxx
```

### Build Configuration

The project uses Next.js ISR (Incremental Static Regeneration) with a 1-hour revalidation period. This means:

- Pages are statically generated at build time
- Content refreshes every hour automatically
- Optimal balance between freshness and performance

## ⚡ Performance

### Caching Strategy

- **ISR Revalidation:** 3600 seconds (1 hour)
- **Image Optimization:** Automatic WebP conversion
- **Font Optimization:** Inter font with `display: swap`
- **Code Splitting:** Automatic per-page chunks

### Optimization Features

- ✅ Parallel RSS feed fetching (all 30+ feeds simultaneously)
- ✅ Image lazy loading with Next.js Image component
- ✅ CSS purging (unused Tailwind styles removed)
- ✅ Static page generation with ISR
- ✅ Client-side error boundaries
- ✅ In-memory image caching (prevents duplicate AI calls)
- ✅ Automatic image discovery (no manual list maintenance)
- ✅ AVIF/WebP format optimization

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Adding New RSS Feeds

To add a new RSS feed source:

1. Open `lib/rss.ts`
2. Add your feed to the `FEED_URLS` array:
   ```typescript
   {
     url: "https://example.com/feed.xml",
     category: "Breaking AI",
     categoryColor: "bg-red-500",
     source: "Example Source"
   }
   ```
3. The system will automatically include it in the aggregation
4. The feed will be fetched in parallel with all other feeds
5. Content will be interleaved by source within the category

### Adding New Images

The image system uses **automatic discovery** - no code changes needed!

1. **Add image to `/public/assets/images/all/`**
   - Use descriptive, keyword-rich filenames (e.g., `ai-robot-automation.jpg`)
   - Supported formats: `.jpg`, `.jpeg`, `.png`, `.webp`, `.svg`, `.gif`
   - No spaces in filenames (use hyphens)

2. **That's it!** The system automatically discovers new images on next build/restart

3. **Best Practices:**
   - Use multiple keywords in filename for better matching
   - Example: `microsoft-logo-building.jpg` matches "Microsoft", "logo", "building"
   - Avoid generic names like `image1.jpg` or `photo.png`

**Note:** The AI curator will automatically use new images if they match article content semantically.

## 📄 License

This project is private and proprietary. All rights reserved.

## 📧 Contact

For questions, support, or content removal requests:

- **Email:** contact@aidrivenfuture.com
- **Privacy Policy:** [/privacy](/privacy)

## 🖼️ Image System Architecture

### AI-Powered Smart Curation

The platform uses a sophisticated 3-tier image selection system:

1. **Tier 1: AI Curation (GPT-4o-mini)**
   - Semantic understanding of article content
   - Brand/logo matching (e.g., "OpenAI" → `openai-logo.jpg`)
   - Conceptual matching (e.g., "Agentic Metadata" → infrastructure images)
   - Cost: ~$0.01 per 1,000 articles
   - Falls back gracefully if API key not configured

2. **Tier 2: Keyword Matching**
   - Weighted scoring system (+2.0 for category match, +1.5 per keyword)
   - Visual diversity penalty (-5.0 for already-used images)
   - Ensures nearby articles use different images

3. **Tier 3: Hash-Based Fallback**
   - Consistent selection based on article title hash
   - Guarantees 100% coverage (every article gets an image)
   - Same article always gets same image (persistence)

### Automatic Discovery

- **Server-side file system scanning** - No hard-coded image lists
- **Caching** - Prevents repeated file system reads
- **Zero maintenance** - Add images to folder, system finds them automatically
- **97+ images** - Large library ensures variety and good matches

### Copyright Compliance

- **100% local-only** - All images are owned assets in `/public/assets/images/all/`
- **No external URLs** - RSS feed images are ignored for copyright safety
- **Fair Use** - Article descriptions truncated to 200 characters

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- AI-powered image curation with [OpenAI GPT-4o-mini](https://platform.openai.com/)
- RSS feeds from various industry-leading publications
- Market data from [CoinGecko](https://www.coingecko.com/) and [Finnhub](https://finnhub.io/)
- Market widget by [TradingView](https://www.tradingview.com/)

---

**Made with ❤️ for the AI community**
