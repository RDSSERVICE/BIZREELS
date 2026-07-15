# Folder Structure

This document details the folder structure and file organization of the Emergent project.

```
ecommerce-app/
├── backend/                    # Node.js/Express Backend Codebase
│   ├── src/
│   │   ├── config/             # DB connections and environment configurations
│   │   │   ├── db.js           # Mongoose connection initialization
│   │   │   └── index.js        # Environment config schema loader
│   │   ├── middleware/         # Express middleware interceptors
│   │   │   ├── auth.middleware.js  # JWT parser & user session verification
│   │   │   ├── role.middleware.js  # Role checking (customer/vendor/creator/admin)
│   │   │   └── error.middleware.js # Express unified JSON error wrapper
│   │   ├── models/             # Mongoose schemas (22 database models)
│   │   │   ├── User.js         # User profiles, verification, and rating averages
│   │   │   ├── Listing.js      # Product listings, physical coordinates, and variants
│   │   │   ├── Category.js     # Hierarchy and sort orders for listing groups
│   │   │   ├── Chat.js         # ChatThread and ChatMessage models
│   │   │   ├── Deal.js         # Offers history, deals status, negotiation ranges
│   │   │   ├── Proposal.js     # Vendor custom quotes and message bids
│   │   │   ├── Requirement.js  # Customer buying requirements and location boundaries
│   │   │   ├── Phase4.js       # Reviews, notifications, wallets, payments, subs, KYC docs
│   │   │   └── Misc.js         # Reports, audit logs, analytics events, watcher alerts
│   │   ├── routes/             # Express endpoint routers
│   │   │   ├── auth.routes.js  # Mobile OTP and Google login handles
│   │   │   ├── index.js        # Central router attaching version prefixes (/api/v1)
│   │   │   └── ...             # Feature routers (listing, chat, wallet, requirement...)
│   │   ├── services/           # Decoupled business logic modules (45 service files)
│   │   │   ├── ai.service.js   # Multimodal Google Gemini integration logic
│   │   │   ├── trust-plus.service.js # KYC bonuses and atomic wallet credit releases
│   │   │   ├── contact-reveal.service.js # Scraping rate-limits and verification gates
│   │   │   └── ...             # Feature services (payment, deal, category, feed...)
│   │   └── utils/              # Utility helpers and rate limiters
│   │       ├── rateLimit.js    # In-memory sliding window timestamp array limiter
│   │       ├── ApiError.js     # Standard system API error class
│   │       └── helpers.js      # Async express handlers wrappers and validation
│   ├── uploads/                # Local directory for KYC and profile storage fallback
│   ├── server.js               # Entry script. Launches HTTP and Socket.IO server
│   └── app.js                  # Setup for express, CORS, helmet, and body parsers
│
└── frontend/                   # React 19 Frontend Web Application
    ├── src/
    │   ├── components/         # Reusable UI widgets
    │   │   ├── app/            # Domain-specific components (BottomNav, ReelItem, etc.)
    │   │   └── ui/             # Shadcn primitives (Button, Card, Input, Sheet...)
    │   ├── context/            # React global context providers
    │   │   └── AuthContext.js  # Shared user session, role changes, and socket handlers
    │   ├── hooks/              # Custom React hook utilities
    │   │   └── use-toast.js    # Shadcn UI dynamic toasts manager
    │   ├── lib/                # API clients and helpers
    │   │   ├── api.js          # Unified axios client and endpoint helper APIs
    │   │   ├── socket.js       # Client Socket.IO connection manager
    │   │   ├── roleNav.js      # Dynamic bottom nav items mapping based on active role
    │   │   └── utils.js        # Standard tailwind classes merger (cn)
    │   ├── locales/            # Translation keys for local markets
    │   │   ├── en/             # English dictionaries
    │   │   └── hi/             # Hindi dictionaries
    │   ├── pages/              # Primary route screens (40 screen modules)
    │   │   ├── Dashboard.jsx   # Core navigation panel for active users
    │   │   ├── Landing.jsx     # Onboarding landing page
    │   │   ├── Login.jsx       # OTP request layout
    │   │   ├── ListingForm.jsx # Creating and editing listings
    │   │   ├── ChatThread.jsx  # Interactive chat negotiations screen
    │   │   └── ...             # Pages (Admin console, Wallet, Subscriptions, KYC...)
    │   ├── App.js              # Central application client-side route map
    │   └── index.js            # Virtual DOM mount entry point
    ├── index.html              # HTML DOM entry template
    ├── tailwind.config.js      # Custom theme, font mappings, animations config
    └── vite.config.js          # Vite plugins, local servers, and esbuild loaders
```
