# BizReels Design System Guidelines: Bento-Brutalism Style

This document defines the official design system and architectural rules for BizReels frontend pages. All new pages and refactored views MUST strictly follow these guidelines to ensure design consistency across the application.

---

## Executive Summary & Design Vision

BizReels utilizes a **Warm Editorial Bento-Brutalism** design language. This aesthetic combines:
1. **Bento Grid Architecture**: Asymmetric, high-density modular cells that organize content logically.
2. **Neo-Brutalism Elements**: Bold all-caps typography, solid borders, high-contrast color blocks, icon boxes, and tactile warm palettes.

---

## 1. Color Palette & Design Tokens

### Backgrounds
- **Primary Canvas (Cream)**: `#F2EDE4` (Main background for all page sections)
- **Card Base (Crisp White)**: `#FFFFFF` (Light bento cards and container boxes)
- **Deep Espresso Dark Surface**: `#241B15` / `#2D221A` (Primary dark bento cards, dark feature panels)
- **Deep Card Fill**: `#2F241C` (Product/Reel inner card backgrounds within dark cells)

### Accents & Controls
- **Primary Gold Accent**: `#D99A3D` (Hover: `#C8872B`) (Primary CTAs, section highlights, featured badges)
- **Grid Dividers & Borders**: `#E3DCCB` / `#DDD6C8` (Crisp structural cell borders)
- **Status Amber**: `#C8872B` (Banners, callout blocks)

### Typography Colors
- **Dark Text (Light Backgrounds)**: `#1A1A1A` (Headings), `#4A4A4A` / `#5A5A5A` (Body text)
- **Light Text (Dark Cells)**: `#FFFFFF` (Headings), `#C9C4BB` / `#8A8578` (Subtext)

---

## 2. Typography Rules

### Headings & Block Headlines
- **Font Family**: `'Archivo Black', 'Outfit', sans-serif`
- **Text Style**: UPPERCASE, letter-spacing `-0.5px`, line-height `1.02` to `1.2`.
- **Usage**: Hero statements (`PRODUCTS. SERVICES. REAL RESULTS.`), section titles, metric numbers.

### Body Text, Labels & Buttons
- **Font Family**: `'Manrope', 'Inter', sans-serif`
- **Text Style**: Sentence case, font-weight `500` to `700`, line-height `1.4` to `1.55`.
- **Usage**: Paragraphs, subtexts, button labels, list items.

---

## 3. Structural Layout: Bento Grid Rules

1. **Asymmetric Columns**:
   - Avoid plain uniform 1:1 grids for main sections. Use asymmetrical fractions:
     - **2-Column Split**: `1.15fr 0.85fr` (Hero left headline + Right feature panel)
     - **3-Column Split**: `0.85fr 2.05fr 0.8fr` (Left list + Center feed + Right CTA panel)
     - **4-Column Banner**: `grid-cols-2 md:grid-cols-4` for stats and features.

2. **Container Padding & Limits**:
   - Max width: `maxWidth: 1200px` centered with `margin: '0 auto'`.
   - Section padding: `padding: '0 14px 14px'` inside the 1200px container.
   - Border radius: `6px` to `8px` for cells.

3. **Solid Border Dividers**:
   - Use crisp borders (`border: '1px solid #e3dccb'` or Tailwind `divide-[#ddd6c8]`) instead of soft drop shadows.

---

## 4. Component Patterns & Code Specs

### A. Primary Gold Button
```jsx
<button
  style={{
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '13px 22px',
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 14.5,
    backgroundColor: '#d99a3d',
    color: '#1a1a1a',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'background .15s ease, transform .15s ease'
  }}
>
  Label Text
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
    <line x1="7" y1="17" x2="17" y2="7" />
    <polyline points="7 7 17 7 17 17" />
  </svg>
</button>
```

### B. Neo-Brutalist Icon Box
```jsx
<div style={{
  flexShrink: 0,
  width: 38,
  height: 38,
  border: '1.5px solid #1a1a1a',
  borderRadius: 8,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#1a1a1a'
}}>
  {/* Inline SVG Icon */}
</div>
```

### C. Bento Metric Stat Cell
```jsx
<div className="flex items-center gap-3 p-5">
  <div style={{ width: 36, height: 36, border: '1.5px solid #1a1a1a', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    {iconSvg}
  </div>
  <div>
    <div style={{ fontSize: 20, fontWeight: 800, color: '#1a1a1a', lineHeight: 1.1 }}>{number}</div>
    <div style={{ fontSize: 12, fontWeight: 500, color: '#5a5a5a', marginTop: 2 }}>{label}</div>
  </div>
</div>
```

---

## 5. Page-by-Page Implementation Guide

### 1. `About.jsx`
- **Hero**: Bento 2-column split (Left statement + Right dark video frame).
- **Core Values**: 4-column Bento grid with dark `#1C1A17`, amber `#D99A3D`, and white `#FFFFFF` alternating cards.

### 2. `PublicCreatorMarketplace.jsx` & `PublicLocalReels.jsx`
- **Grid Layout**: `0.85fr 2.05fr 0.8fr` 3-column Bento grid.
  - **Left**: Category filters & trending list in Onyx `#1C1A17`.
  - **Middle**: Product cards with `aspectRatio: '3/4'` media in `#242118` cards.
  - **Right**: Quick upload / hire action panel in Amber Gold `#D99A3D`.

### 3. `Pricing.jsx`
- Bento pricing cards with solid borders (`#e3dccb`), bold all-caps plan titles (`FREE`, `PRO`, `ENTERPRISE`), and gold action buttons.

### 4. Dashboards (`VendorDashboardPage.jsx`, `CreatorDashboardPage.jsx`)
- Use the top stats banner with `bg-white/90` or `#f8f4ec` Bento stat cards, divide borders, and responsive grid layouts.

---

*Keep this design system consistent across all pages. Do not introduce generic white/grey layouts.*
