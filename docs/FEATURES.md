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

## 8. Flipkart-Style Instant Checkout & Shopping Cart
* **Multi-Step Checkout Flow**: 4-step accordion flow encompassing:
  1. *Delivery Address & Location*: Editable recipient info, pincode, and live GPS geolocation detection.
  2. *Order Summary*: Item details, product/service badges, quantity (+/-) controls, and appointment date/time scheduling for services.
  3. *Coupons & Offers*: Promo code validation and 1-click apply drawer.
  4. *Payment Selection*: Verified vendor UPI/QR (with deep link and copy tools), Cash on Delivery (Pay on visit), and Bank Transfer.
* **Sticky Price Details Breakdown**: Transparent breakdown showing Item Total, Listing Discounts, Applied Coupon Savings, Shiprocket Delivery Fee, Final Payable Amount, and Flipkart-signature savings badge (`🎉 You will save ₹... on this order`).
* **Multi-Vendor Cart**: Groups items by vendor shop with collective checkout, discount distribution, and automatic chat notifications.

## 9. Coupons & Promotional Offers System
* **Real-Time Coupon Validation**: Validates coupon codes against minimum order thresholds, expiration dates, max discount limits, and per-user limits.
* **1-Click Applicable Coupons Drawer**: Auto-discovers eligible discounts for instant apply directly in checkout modals and cart summaries.
* **Vendor & Platform Offers**: Supports both platform-wide promotional discounts and vendor-specific sales campaigns.

## 10. Shiprocket Logistics & Shipping Rates
* **Dynamic Courier Serviceability**: Integrates with Shiprocket API to calculate exact courier charges by delivery pincode and package weight.
* **Automated Free Delivery Rules**: Automatically waives delivery fees for orders exceeding ₹499.
* **Fallback Rate Estimator**: Seamless fallback calculation ensuring uninterrupted checkout if external APIs face network latency.

## 11. Dynamic Subscription Add-Ons System
* **Admin Dynamic Add-Ons Creator**: Allows Admin to attach customized Add-Ons to subscription plans (e.g. Extra Reels Uploads, AI Content Credits, Lead Boosts, Verified Badges, Custom Services) with custom prices and quota types.
* **Inline Add-Ons Management**: Admins can edit add-on details, prices, quotas, and toggle active status on the fly.
* **Subscriber Checkout Add-Ons Selector**: Vendors and Creators can toggle available add-ons with visual checkmarks and real-time total updates (`Base Plan + Addons Total`).
* **Multi-Gateway Subscription Purchases**: Supports instant Razorpay online payment and role-isolated Wallet balance payments with automated bonus quota crediting upon activation.

