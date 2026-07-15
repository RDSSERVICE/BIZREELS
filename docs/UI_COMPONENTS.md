# UI Components & Design System

Emergent follows a strict mobile-first design system optimized for modern social interactions, utilizing a dark theme with vibrant brand gradient highlights.

---

## 1. Design System Tokens & Guidelines

Reflecting the specifications in `design_guidelines.json`:

### Typography
* **Primary Headings**: **Outfit** (loaded via Google Fonts). Used for headers, hero overlays, large digits, and active CTA titles to establish a modern, tech-focused look.
* **Body & Forms**: **Manrope** (loaded via Google Fonts). Used for body content, descriptions, input text fields, and list labels to maximize readability on small viewports.

### Palette
* **Backgrounds**: `#000000` (primary canvas), `#0A0A0A` (cards container backing), `#121212` (floating surfaces).
* **Text**: `#FFFFFF` (primary titles), `#A1A1AA` (secondary descriptions), `#000000` (inverse states).
* **Brand Gradient**: Purple-to-Pink-to-Orange (`linear-gradient(135deg, #a855f7, #ec4899, #f97316)`). Reserved for active buttons, tab indicator markers, and picture profile rings. *Never used as page backgrounds.*
* **Borders**: Sub-pixel borders using semi-transparent white: `rgba(255, 255, 255, 0.1)` (`border-white/10`).

### Layout Philosophy
* **Mobile-First Shell**: The desktop layout centers the application canvas in a mobile container (`max-w-md mx-auto min-h-screen border-x border-white/10 bg-black`) using the `<PhoneScreen>` wrapper.
* **Glassmorphism**: Sticky bottom navigations, overlays, and drawer components utilize `backdrop-blur-xl bg-white/5 border-white/10`.
* **Rounded Corners**: Content containers and action cards use rounded borders (`rounded-2xl` or `rounded-3xl`).
* **Micro-Animations**: Custom hover transformations (`scale-105`), active tab transitions, and animated skeleton loaders (`animate-pulse bg-white/10`) replace default spinner configurations.

---

## 2. Key Custom Components (`components/app`)

* **`PhoneScreen.jsx`**  
  Desktop viewport emulator. Wraps page routes to force mobile dimensions on wide screens.
* **`BottomNav.jsx`**  
  Sticky bottom navigation bar. Uses the active role to load and color icons (Home, Feed, Chat, Wallet, Dashboard, Admin) mapping to the route schemes in `lib/roleNav.js`.
* **`RoleSwitcherChip.jsx`**  
  Top-positioned switcher bubble allowing multi-role users to instantly toggle their active role context.
* **`DevOtpBanner.jsx`**  
  Top-anchored alert banner visible only when `MSG91_DEV_MODE` is enabled, displaying generated OTP verification codes on screen.
* **`ReelItem.jsx`**  
  Full-screen video player supporting auto-play, muted toggles, liking, saving, creator follows, and tagged listing tags.
* **`CartDrawer.jsx`**  
  Slide-out bottom sheet displaying shopping cart items, modifying quantities, and triggering checkouts.
* **`BoostModal.jsx`**  
  Vendor modal overlay allowing sellers to boost listings for 3, 7, or 15 days, using wallet balance or credit tokens.
* **`TrustBadge.jsx`**  
  A visual verified badge rendered beside names or listings when KYC has been reviewed and approved by the admin.
