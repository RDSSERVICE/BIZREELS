# Database Schema

To maintain compatibility with legacy schemas, all Mongoose models in `backend/src/models` enforce explicit, lowercase collection names.

---

## Model & Collection Summary

| Model | Collection Name | Primary Purpose | File Path |
| :--- | :--- | :--- | :--- |
| **User** | `users` | User profiles, roles, and trust indicators. | `User.js` |
| **Listing** | `listings` | Product and service ads, location data, reels links. | `Listing.js` |
| **Category** | `categories` | Product/service hierarchies. | `Category.js` |
| **ChatThread** | `chat_threads` | Active chat room parameters and read scopes. | `Chat.js` |
| **ChatMessage** | `messages` | Direct chat messages, media payloads, quotes. | `Chat.js` |
| **Deal** | `deals` | Multi-stage price negotiation contracts. | `Deal.js` |
| **Proposal** | `proposals` | Vendor responses to buyer requirements. | `Proposal.js` |
| **Requirement** | `requirements` | Customer demand requests with budget and geolocation. | `Requirement.js` |
| **Follow** | `follows` | Creator/vendor follower relationships. | `Follow.js` |
| **Interaction** | `interactions` | Listing likes and saves. | `Interaction.js` |
| **OtpRequest** | `otp_requests` | Dynamic verification OTP numbers with TTL deletion. | `OtpRequest.js` |
| **RefreshToken** | `refresh_tokens` | JWT refresh tokens with TTL deletion. | `RefreshToken.js` |
| **Review** | `reviews` | Ratings and feedback for listings/vendors. | `Phase4.js` |
| **Notification** | `notifications` | Local in-app alerts and notifications logs. | `Phase4.js` |
| **Wallet** | `wallets` | Ledger accounting for credits and balances. | `Phase4.js` |
| **WalletTransaction** | `wallet_transactions` | Wallet transaction ledger entries. | `Phase4.js` |
| **Payment** | `payments` | Razorpay order records and validation states. | `Phase4.js` |
| **Subscription** | `subscriptions` | Premium membership flags and renewal parameters. | `Phase4.js` |
| **KycDocument** | `kyc_documents` | Official credentials submitted for verification. | `Phase4.js` |
| **Report** | `reports` | Inappropriate content reports and moderation tickets. | `Misc.js` |
| **AuditLog** | `audit_logs` | System administration audit logs. | `Misc.js` |
| **SearchHistory** | `search_history` | Anonymous or user-specific search tracking. | `Misc.js` |
| **ListingEvent** | `listing_events` | View and save tracking logs for vendor analytics. | `Misc.js` |
| **ResponseEvent** | `response_events` | Chat reply speed monitoring entries. | `Misc.js` |
| **WatcherNotification** | `watcher_notifications` | Stock notifications alerts registry. | `Misc.js` |
| **PlatformSettings** | `platform_settings` | Custom system settings configurations. | `Misc.js` |

---

## Detailed Model Schemas

### 1. User (`users`)
* **Fields**:
  * `phone`: String (sparse, unique, default null)
  * `name`: String (default null)
  * `email`: String (sparse, unique, default null)
  * `auth_providers`: Mixed Array (default `[]`)
  * `roles`: String Array (enum: `['customer', 'vendor', 'creator', 'admin']`, default `['customer']`)
  * `current_role`: String (enum: `['customer', 'vendor', 'creator', 'admin']`, default `'customer'`)
  * `kyc_status`: String (enum: `['unverified', 'pending', 'approved', 'rejected']`, default `'unverified'`)
  * `profile_pic`: String (default null)
  * `gender`: String (default null)
  * `dob`: String (default null)
  * `is_active`: Boolean (default true)
  * `is_deleted`: Boolean (default false)
  * `is_test_data`: Boolean (default false)
  * `is_subscribed_verified`: Boolean (default false)
  * `rating_avg`: Number (default 0)
  * `rating_count`: Number (default 0)
  * `trust_score`: Number (default null)
  * `city`: String (default null)
  * `is_banned`: Boolean (default false)
  * `has_received_first_topup_bonus`: Boolean (default false)
  * `fcm_tokens`: Mixed Array (default `[]`)
  * `referral_code`: String (sparse, unique, default null)
  * `avg_response_time_seconds`: Number (default null)
  * `chat_response_rate`: Number (default 0)
  * `total_conversations_responded`: Number (default 0)
  * `has_received_profile_complete_bonus`: Boolean (default false)
* **Indexes**: `{ is_deleted: 1 }`
* **Timestamps**: `created_at`, `updated_at`

### 2. Listing (`listings`)
* **Fields**:
  * `vendor_id`: String (required, index)
  * `type`: String (enum: `['new_product', 'old_product', 'service']`, required)
  * `title`: String (required)
  * `slug`: String (required, unique)
  * `description`: String (default null)
  * `category_id`: String (required, index)
  * `sub_category_id`: String (default null, index)
  * `price`: Number (required)
  * `offer_price`: Number (default null)
  * `is_negotiable`: Boolean (default false)
  * `bulk_price`: Number (default null)
  * `stock`: Number (default null)
  * `condition`: String (enum: `['new', 'like_new', 'good', 'fair', null]`, default null)
  * `warranty`: String (default null)
  * `service_charges_type`: String (enum: `['fixed', 'hourly', 'per_visit', null]`, default null)
  * `experience_years`: Number (default null)
  * `service_area_km`: Number (default null)
  * `images`: Subdocument Array of `{ url: String, public_id: String, width: Number, height: Number }`
  * `reel`: Subdocument of `{ url: String, public_id: String, thumbnail_url: String, duration: Number }`
  * `location`: Subdocument of:
    * `lat`: Number, `lng`: Number, `address`: String, `area`: String (required), `city`: String (required), `state`: String, `pincode`: String (required)
    * `geo`: `{ type: "Point", coordinates: [lng, lat] }`
  * `tags`: String Array
  * `short_description`: String
  * `features`: String Array
  * `variants`: Variant Array of `{ name: String, type: String, options: [String], prices: Mixed, price_hint_inr: Number }`
  * `status`: String (enum: `['active', 'paused', 'sold', 'expired']`, default `'active'`, index)
  * `views_count`: Number (default 0), `saves_count`: Number (default 0)
  * `boost_expires_at`: String (default null), `boost_duration_days`: Number (default null), `boost_activated_at`: String (default null)
  * `is_takendown`: Boolean (default false), `is_active`: Boolean (default true), `is_deleted`: Boolean (default false), `is_test_data`: Boolean (default false)
* **Indexes**:
  * `{ is_deleted: 1 }`
  * `{ 'location.geo': '2dsphere' }`
  * `{ boost_expires_at: 1 }`
  * `{ is_takendown: 1 }`
  * `{ title: 'text', description: 'text', tags: 'text' }` (Text Index: `listings_text`)
* **Timestamps**: `created_at`, `updated_at`

### 3. Deal (`deals`)
* **Fields**:
  * `thread_id`: String (required, index)
  * `listing_id`: String (default null)
  * `requirement_id`: String (default null)
  * `buyer_id`: String (required, index)
  * `seller_id`: String (required, index)
  * `initial_offer`: Number (required)
  * `current_offer`: Number (required)
  * `currency`: String (default `'INR'`)
  * `offers_history`: Mixed Array (default `[]`)
  * `status`: String (enum: `['negotiating', 'accepted', 'rejected', 'expired', 'completed', 'cancelled']`, default `'negotiating'`, index)
  * `expires_at`: String (default 3 days expiry)
  * `completion_pending_from`: String (default null)
  * `followup_sent`: Boolean (default false)
* **Timestamps**: `created_at`, `updated_at`

### 4. Requirement (`requirements`)
* **Fields**:
  * `customer_id`: String (required, index)
  * `title`: String (required)
  * `description`: String (default null)
  * `category_id`: String (required)
  * `sub_category_id`: String (default null)
  * `budget_min`: Number (default null), `budget_max`: Number (default null)
  * `photos`: Media Array, `video`: Media Object
  * `location`: Same schema as ListingLocation
  * `urgency`: String (enum: `['immediate', 'this_week', 'this_month', 'flexible']`, default `'flexible'`)
  * `is_negotiable`: Boolean (default true)
  * `expires_at`: String (default 30 days expiry)
  * `status`: String (enum: `['open', 'closed', 'expired']`, default `'open'`, index)
  * `proposals_count`: Number (default 0), `views_count`: Number (default 0)
  * `is_active`: Boolean (default true), `is_deleted`: Boolean (default false)
* **Indexes**:
  * `{ is_deleted: 1 }`
  * `{ 'location.geo': '2dsphere' }`
  * `{ title: 'text', description: 'text' }` (Text Index: `req_text`)
* **Timestamps**: `created_at`, `updated_at`

### 5. ChatThread (`chat_threads`) & ChatMessage (`messages`)
* **ChatThread**:
  * `participants`: String Array (required, index)
  * `thread_type`: String (enum: `['listing', 'requirement', 'direct']`, required)
  * `context_id`: String (default null)
  * `last_message`: Mixed (default null)
  * `unread_count`: Mixed (default `{}`)
  * `is_archived_by`: Mixed (default `{}`)
  * *Indexes*: `{ participants: 1, context_id: 1, thread_type: 1 }`, `{ updated_at: -1 }`
* **ChatMessage**:
  * `thread_id`: String (required), `sender_id`: String (required), `receiver_id`: String (required)
  * `type`: String (enum: `['text', 'image', 'video', 'listing_card', 'location', 'quote', 'system']`, default `'text'`)
  * `text`: String (default null), `media`: Mixed, `shared_listing_id`: String, `shared_location`: Mixed, `quote`: Mixed
  * `delivered_at`: String, `read_at`: String (default null), `is_deleted`: Boolean (default false)
  * *Indexes*: `{ thread_id: 1, _id: -1 }`, `{ receiver_id: 1 }`

### 6. Wallet (`wallets`) & WalletTransaction (`wallet_transactions`)
* **Wallet**:
  * `user_id`: String (required, unique)
  * `credits`: Number (default 0)
  * `balance_inr_paise`: Number (default 0)
  * `lifetime_earned_credits`: Number (default 0), `lifetime_spent_credits`: Number (default 0)
  * `lifetime_deposited_paise`: Number (default 0), `lifetime_spent_paise`: Number (default 0)
  * `is_frozen`: Boolean (default false)
* **WalletTransaction**:
  * `wallet_id`: String (required), `user_id`: String (required)
  * `type`: String (required)
  * `bucket`: String (enum: `['credits', 'balance_inr']`, required)
  * `amount`: Number (required), `balance_after`: Number (required)
  * `reason`: String, `ref_type`: String, `ref_id`: String
  * `razorpay_order_id`: String, `razorpay_payment_id`: String
  * `status`: String (default `'success'`), `meta`: Mixed
  * *Indexes*: `{ user_id: 1, _id: -1 }`

### 7. OtpRequest (`otp_requests`) & RefreshToken (`refresh_tokens`)
* **OtpRequest**:
  * `phone`: String (required, index), `otp_hash`: String (required)
  * `purpose`: String (default `'login'`), `verified`: Boolean (default false), `attempts`: Number (default 0)
  * `expires_at`: Date (required, index)
  * *TTL index*: `{ expires_at: 1 }` with `expireAfterSeconds: 0`
* **RefreshToken**:
  * `user_id`: String (required, index), `token_hash`: String (required, index), `revoked`: Boolean (default false)
  * `expires_at`: Date (required)
  * *TTL index*: `{ expires_at: 1 }` with `expireAfterSeconds: 0`

### 8. Order (`orders`)
* **Fields**:
  * `orderId`: String (required, unique, index)
  * `customer`: ObjectId ref `User` (required, index)
  * `vendor`: ObjectId ref `User` (required, index)
  * `listing`: ObjectId ref `Listing` (optional, index)
  * `itemTotal`: Number (required)
  * `price`: Number (final payable total amount)
  * `quantity`: Number (default 1)
  * `bookingDate`: Date (optional)
  * `bookingTime`: String (optional)
  * `bookingNotes`: String (optional)
  * `paymentMethod`: String (enum: `['online', 'cod', 'wallet', 'vendor_upi', 'bank_transfer']`, default `'vendor_upi'`)
  * `paymentDetails`: Mixed
  * `couponCode`: String (default null)
  * `couponDiscount`: Number (default 0)
  * `shippingCharges`: Number (default 0)
  * `shippingDetails`: Mixed (courier info, tracking metadata)
  * `address`: String (required)
  * `pincode`: String (default null)
  * `status`: String (enum: `['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'disputed']`, default `'pending'`, index)
* **Timestamps**: `createdAt`, `updatedAt`

### 9. SubscriptionPlan (`subscription_plans`)
* **Fields**:
  * `title`: String (required)
  * `description`: String (default null)
  * `plan_type`: String (enum: `['basic', 'standard', 'premium', 'enterprise', 'custom']`, default `'basic'`)
  * `user_type`: String (enum: `['vendor', 'creator', 'all']`, default `'vendor'`)
  * `billing_cycle`: String (enum: `['monthly', 'quarterly', 'half_yearly', 'yearly']`, required)
  * `price_inr`: Number (required)
  * `duration_days`: Number (default 30)
  * `discount_percentage`: Number (default 0)
  * `product_limit`: Number (default null), `service_limit`: Number (default null)
  * `reels_limit`: Number (default null), `leads_limit`: Number (default null)
  * `ai_credits`: Number (default 0)
  * `verified_badge`: Boolean (default true), `priority_support`: Boolean (default false), `analytics_access`: Boolean (default false)
  * `add_ons`: Array of:
    * `id`: String (required), `title`: String (required), `description`: String
    * `price_inr`: Number (required), `billing_type`: String, `quota_type`: String, `quota_value`: Number, `is_active`: Boolean
  * `is_active`: Boolean (default true), `is_archived`: Boolean (default false), `is_deleted`: Boolean (default false)
* **Timestamps**: `created_at`, `updated_at`

### 10. UserSubscription (`user_subscriptions`)
* **Fields**:
  * `user_id`: String (required, index)
  * `user_name`: String, `user_role`: String (enum: `['vendor', 'creator']`)
  * `plan_id`: String (required), `plan_name`: String (required)
  * `billing_cycle`: String (default `'monthly'`)
  * `start_date`: Date (required), `expiry_date`: Date (required, index)
  * `status`: String (enum: `['active', 'expired', 'cancelled', 'upgraded', 'downgraded', 'suspended']`, default `'active'`, index)
  * `base_plan_price`: Number (default 0), `addons_total`: Number (default 0)
  * `selected_addons`: Array of `{ id: String, title: String, price_inr: Number, quota_type: String, quota_value: Number }`
  * `original_amount`: Number (required), `paid_amount`: Number (required)
  * `payment_method`: String (default `'razorpay'`), `payment_id`: String
* **Timestamps**: `created_at`, `updated_at`

### 11. SubscriptionInvoice (`subscription_invoices`)
* **Fields**:
  * `invoice_number`: String (unique, index)
  * `user_id`: String (required, index), `user_name`: String, `user_email`: String
  * `plan_id`: String, `plan_name`: String
  * `base_amount`: Number, `addons_total`: Number, `addons`: Array of `{ id: String, title: String, price_inr: Number }`
  * `discount_amount`: Number, `coupon_code`: String, `subtotal`: Number
  * `gst_percentage`: Number (default 18), `gst_amount`: Number, `total_amount`: Number
  * `payment_status`: String (enum: `['paid', 'pending', 'failed', 'refunded']`, default `'paid'`, index)
* **Timestamps**: `created_at`, `updated_at`

