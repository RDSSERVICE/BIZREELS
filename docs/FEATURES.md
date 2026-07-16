# Features Catalog

BizReels includes the following production features:

## 1. Authentication & Onboarding
* **OTP Phone Authentication**: Mobile-first registration and login using SMS OTP verification (powered by MSG91 in production; supports dev mode bypass settings).
* **Google OAuth Session Exchange**: Direct Google OAuth login via token session exchange.
* **Multi-Role Onboarding**: Users register roles (`customer`, `vendor`, `creator`, `admin`) and set active roles. First-time onboarding checklist helps complete profiles.
* **Dev Override Banner**: Local testing banner displaying current mock OTP codes directly when verification is stubbed out.

## 2. Listings Management
* **Listing Classifications**: Structured entries categorized as `new_product`, `old_product`, or `service`.
* **Dynamic Variants**: Supports custom variants (size, color, material, tier) with independent pricing hints.
* **Geospatial Location Pinned**: Users link listings to physical locations (address, area, city, pincode, coordinates). Backed by MongoDB `2dsphere` spatial matching.
* **Listing Status**: Set listings to `active`, `paused`, `sold`, or `expired`.
* **Moderation**: Takedown flagged or policy-violating listings.

## 3. Social Interaction & Reels
* **Video Reels**: Creator-uploaded short video clips showcasing local items, linked directly to listings. Includes video playback interfaces.
* **Social Engagement**: Likes, Saves, and Follow/Unfollow counters updating listings and vendor statistics.
* **Local Social Feed**: Personalized feed showing listings and reels matching location proximity parameters.

## 4. AI-Powered Assistant (Gemini)
* **Listing Content Creator**: Auto-generates product titles, categories, and tags from media attachments and descriptions.
* **Description Improver**: Refines raw listings descriptions to maximize marketplace appeals.
* **Smart Categorizer**: Detects target classification categories automatically.
* **Demand Matcher**: Parses raw customer requirement text and outputs structured matching variables.
* **Smart Negotiator**: Optional AI negotiator assisting buyers in drafting initial offers.

## 5. Requirements & Proposal System
* **Requirement Postings**: Customers post detailed demand tickets (budget ranges, pictures, coordinates, urgency levels).
* **Vendor Matchmaking**: Matches demand tickets against nearby vendor shops based on category matches and geo-boundaries.
* **Custom Proposals**: Matched vendors submit custom price quotes, text messages, and attachment bids.
* **Shortlisting / Actions**: Buyers shortlist, reject, or accept custom proposals.

## 6. Real-time Negotiator Chat & Deals
* **Socket Messaging**: Instant chat threads exchanging text, location markers, custom pricing quotes, and system updates.
* **Dynamic Deals Flow**: Interactive workspace to start offers, record counters, accept/reject bids, and finalize transaction records.
* **Concurrency Lock**: Locking deal completions prevents duplicate payouts.
* **Read Receipts & Alerts**: In-app toast alerts pop up when threads update.

## 7. Wallet, Subscriptions & KYC
* **INR Wallet**: Integrated payments wallet tracking balances in INR paise. Uses Razorpay checkouts.
* **Credits System**: Dual-currency setup tracking platform interaction credits.
* **Contact Reveals**: Vendor phone numbers are masked. Customers reveal phone numbers by spending 5 credits (bypassed if there is an active deal, chat relationship, or if the customer is a premium subscriber).
* **KYC Trust+**: Document verification awards verified trust badges, boosts ratings, and issues atomic bonus credits.
* **Premium Subscriptions**: Pro plans (monthly/yearly) granting free reveals and boosted listing limits.
