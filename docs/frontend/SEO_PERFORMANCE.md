# BizReels — SEO, Performance & Core Web Vitals Optimization Architecture

This document provides a comprehensive technical overview of the production **SEO, Technical SEO, Core Web Vitals, and Performance Engineering** systems implemented across the BizReels platform (`https://bizreels.in`).

---

## 1. Primary Objectives & Compliance

The optimization architecture addresses four core pillars:
1. **Google Indexing & Search Visibility**: Structured Schema.org JSON-LD, crawlable public routes, dynamic sitemaps, and robots directives.
2. **Core Web Vitals & PageSpeed**: Eager LCP prioritization, CLS layout stability, and responsive modern image formats (AVIF/WebP).
3. **JavaScript Bundle Performance**: Modular chunk splitting to eliminate monolithic vendor bundles.
4. **Backend API Throughput & Database Latency**: Parallel query execution (`Promise.all`), multi-tier TTL caching (Redis / in-memory), and pagination count optimizations.

---

## 2. Technical SEO & Meta Architecture

### Dynamic SEO Component (`frontend/src/components/common/SEO.jsx`)
The frontend uses an enhanced, declarative `<SEO>` component that manages `document.title`, standard `<meta>` tags, OpenGraph protocol tags, Twitter / X Cards, canonical links, and Schema.org JSON-LD scripts.

#### Supported Metadata
- **Canonical URLs**: Strictly formatted to `https://bizreels.in/<route>` to prevent duplicate content penalties from URL query parameters.
- **OpenGraph Protocol**: `og:title`, `og:description`, `og:image`, `og:image:width`, `og:image:height`, `og:url`, `og:type`, `og:site_name`, and `og:locale="en_IN"`.
- **Twitter Cards**: `twitter:card="summary_large_image"`, `twitter:title`, `twitter:description`, `twitter:image`.
- **Robots Directives**: `index, follow` on public landing pages; `noindex, follow` on complex filtered search permutations; `noindex, nofollow` on private dashboards and authentication routes.

---

## 3. Schema.org JSON-LD Structured Data

All structured data is verified against standard Schema.org specifications and tested with Google Rich Results criteria:

| Page / Route | Schemas Injected | Purpose |
|---|---|---|
| **Home Page** (`/`) | `WebSite`, `Organization` | Sitelinks Searchbox (`/customer/search?query={search_term_string}`) and brand authority |
| **About Page** (`/about`) | `AboutPage`, `Organization`, `BreadcrumbList` | Company entity recognition and breadcrumb hierarchy |
| **Listing Detail** (`/customer/listings/:id`) | `Product` or `Service`, `Offer`, `BreadcrumbList` | Rich product cards with price in INR, availability, and vendor attribution |
| **Vendor Profile** (`/customer/vendor/:id`) | `LocalBusiness`, `Store`, `ProfessionalService`, `BreadcrumbList` | Local pack visibility, ratings, and physical address |
| **Search & Discovery** (`/customer/search`) | `SearchResultsPage`, `BreadcrumbList` | Search engine indexation of categories |
| **Reels & Video Feed** (`/local-reels`) | `CollectionPage`, `ItemList`, `VideoObject` | Video carousel indexing in Google Video Search |
| **Creator Marketplace** (`/creator-marketplace`) | `CollectionPage`, `ItemList`, `Person`, `BreadcrumbList` | Creator profile indexation |

---

## 4. Crawlability, Robots.txt & Dynamic Sitemaps

### Robots Directives (`frontend/public/robots.txt`)
- Publicly exposes all indexing routes (`/`, `/about`, `/local-reels`, `/creator-marketplace`, `/customer/search`, `/customer/listings/`, `/customer/vendor/`).
- Disallows all internal administrative and personal dashboard routes (`/admin/`, `/auth/`, `/vendor/`, `/creator/`, `/customer/chat`, `/customer/settings`, `/customer/mycart`, `/api/`).
- Explicitly points crawlers to `Sitemap: https://bizreels.in/sitemap.xml`.

### Dynamic Backend Sitemap Engine (`backend/src/services/seo.service.js`)
- **Endpoints**:
  - `GET /sitemap.xml` — Returns a dynamic XML sitemap containing all static pages, active category landing pages, active published listings (`status: 'published'`, `isDeleted: false`), and verified vendors.
  - `GET /sitemap-index.xml` — Returns a sitemap index for chunked large-scale sitemaps.
- **Cache-Control**: `public, max-age=3600, s-maxage=86400` to minimize server load.

---

## 5. Core Web Vitals & Image Optimization

### High-Performance Image Component (`frontend/src/components/common/LazyImage.jsx`)
- **Responsive Srcset**: Automatically builds Cloudinary AVIF/WebP image transforms across 3 breakpoint widths (`400w`, `800w`, `1200w`) with `f_auto,q_auto`.
- **LCP Eager Mode**: For above-the-fold Hero images, sets `priority={true}`, `loading="eager"`, and `fetchpriority="high"` to optimize Largest Contentful Paint.
- **CLS Prevention**: Reserves layout dimensions and aspect ratios (`aspectRatio: '16/9'`, `'4/3'`, `'1/1'`) with an animated shimmer skeleton placeholder.
- **Lazy Loading**: Applies native `loading="lazy"` and `decoding="async"` for all below-the-fold assets.

---

## 6. JavaScript Bundle Optimization (Vite Code Splitting)

The monolithic vendor bundle (`1,047 kB`) was restructured in `frontend/vite.config.js` into fine-grained Rollup manual chunks:

| Chunk | Gzipped Size | Loading Strategy |
|---|---|---|
| `vendor-react` | ~70.6 kB | Critical (Initial Load) |
| `vendor-core` | ~95.8 kB | Critical (Initial Load) |
| `index` | ~39.2 kB | Critical (App Shell) |
| `vendor-icons` | ~10.5 kB | Critical |
| `vendor-ui` | ~13.1 kB | Shared Component UI |
| `vendor-motion` | ~11.3 kB | Shared Animations |
| `vendor-charts` | ~115.6 kB | **Async On-Demand** (Loaded only on Analytics/Chart dashboards) |

---

## 7. Backend Query & Caching Performance

### Query Parallelization (`Promise.all`)
All multi-resource endpoints execute independent MongoDB queries concurrently using `Promise.all` rather than sequential `await` calls:
- In `feed.service.js`: `Listing.find`, `User.countDocuments`, and `Listing.countDocuments` resolve in parallel.
- In `listingRepository.js`: `Listing.aggregate` and `Listing.countDocuments` execute in parallel.

### Multi-Tier TTL Caching (`backend/src/utils/cache.js`)
High-frequency public feeds utilize a 30-to-60 second TTL cache backed by Redis (with memory-store fallback):
- `feed:home_trending`: 60-second TTL
- `feed:5tier:<userId>:<page>:<coords>`: 30s TTL (60s for guests)
- `reels:total_published_count`: 60-second TTL
