const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
const path = require('path');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BizReels API Documentation',
      version: '2.0.0',
      description:
        'Comprehensive REST API Specification for the BizReels Hyperlocal Marketplace & Video Commerce Platform. Includes Vendor Subscription Recharge, Action Credit Charging (WhatsApp Leads & Exotel Telephony), Meta WABA Embedded Signup, Spatial Proximity Search, User Role RBAC, Escrow Wallets, and Admin Backoffice.',
      contact: {
        name: 'BizReels Engineering Team',
        email: 'dev@bizreels.com',
      },
    },
    servers: [
      {
        url: '/api/v1',
        description: 'API v1 Base Path (Relative)',
      },
      {
        url: 'http://localhost:5000/api/v1',
        description: 'Local Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description:
            'Provide JWT access token obtained from POST /auth/login, POST /auth/otp/verify, or POST /auth/google/session-exchange.',
        },
      },
      schemas: {
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operation completed successfully' },
            data: { type: 'object' },
            meta: {
              type: 'object',
              properties: {
                page: { type: 'integer', example: 1 },
                limit: { type: 'integer', example: 20 },
                total: { type: 'integer', example: 100 },
                totalPages: { type: 'integer', example: 5 },
              },
            },
          },
        },
        ApiError: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Invalid request parameters or unauthorized action' },
            errors: {
              type: 'array',
              items: { type: 'string' },
              example: ['Validation failed on field phone: must be valid E.164 phone number'],
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '66b5f400123456789abcdef0' },
            name: { type: 'string', example: 'Rahul Sharma' },
            email: { type: 'string', format: 'email', example: 'rahul.sharma@example.com' },
            phone: { type: 'string', example: '+919876543210' },
            roles: {
              type: 'array',
              items: { type: 'string', enum: ['customer', 'vendor', 'creator', 'admin'] },
              example: ['customer', 'vendor'],
            },
            activeRole: { type: 'string', example: 'vendor' },
            avatar: { type: 'string', example: 'https://res.cloudinary.com/bizreels/image/upload/avatar.jpg' },
            is_verified: { type: 'boolean', example: true },
            is_subscribed_verified: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        VendorProfile: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '66b5f400123456789abcdef1' },
            user_id: { type: 'string', example: '66b5f400123456789abcdef0' },
            business_name: { type: 'string', example: 'Apex Digital Photography Studio' },
            category: { type: 'string', example: 'Photography & Videography' },
            description: { type: 'string', example: 'Full-service studio offering wedding photography, corporate shoots, and 4K commercial reels.' },
            city: { type: 'string', example: 'Mumbai' },
            address: { type: 'string', example: 'Shop 14, Lotus Arcade, Andheri West' },
            location: {
              type: 'object',
              properties: {
                type: { type: 'string', example: 'Point' },
                coordinates: { type: 'array', items: { type: 'number' }, example: [72.8258, 19.1363] },
              },
            },
            rating: { type: 'number', example: 4.8 },
            reviews_count: { type: 'number', example: 42 },
            whatsapp_number: { type: 'string', example: '+919876543210' },
            calls_enabled: { type: 'boolean', example: true },
          },
        },
        Listing: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '66b5f400123456789abcdef3' },
            vendor_id: { type: 'string', example: '66b5f400123456789abcdef1' },
            title: { type: 'string', example: 'Cinematic 4K Wedding Videography & Drone Shoot' },
            description: { type: 'string', example: 'Complete 2-day wedding coverage with 2 camera operators and 4K drone cinematography.' },
            price: { type: 'number', example: 35000 },
            mrp: { type: 'number', example: 45000 },
            discount_percentage: { type: 'number', example: 22 },
            category: { type: 'string', example: 'Videography' },
            images: { type: 'array', items: { type: 'string' }, example: ['https://res.cloudinary.com/bizreels/image/upload/listing1.jpg'] },
            location: {
              type: 'object',
              properties: {
                type: { type: 'string', example: 'Point' },
                coordinates: { type: 'array', items: { type: 'number' }, example: [72.8258, 19.1363] },
              },
            },
            status: { type: 'string', enum: ['active', 'inactive', 'draft'], example: 'active' },
          },
        },
        SubscriptionPlan: {
          type: 'object',
          description: 'Vendor Subscription Recharge Plan. Credits do not expire.',
          properties: {
            _id: { type: 'string', example: '66b5f400123456789abcdef4' },
            title: { type: 'string', example: 'Growth' },
            tier: { type: 'string', enum: ['starter', 'growth', 'business', 'enterprise'], example: 'growth' },
            price_inr: { type: 'number', example: 1199 },
            action_credits: { type: 'number', example: 1599, description: 'Credits loaded into vendor wallet upon purchase' },
            action_rates: {
              type: 'object',
              properties: {
                whatsapp_inbound_credit_rate: { type: 'number', example: 2.5, description: 'Credits deducted per incoming customer WhatsApp message' },
                call_credit_rate: { type: 'number', example: 2.5, description: 'Credits deducted per connected Exotel call' },
              },
            },
            billing_cycle: { type: 'string', enum: ['one_time_recharge', 'monthly', 'yearly'], example: 'one_time_recharge' },
            is_active: { type: 'boolean', example: true },
            badge_text: { type: 'string', example: 'MOST POPULAR' },
            features: {
              type: 'array',
              items: { type: 'string' },
              example: [
                '1,599 Action Credits (Non-expiring)',
                'WhatsApp Lead Capture (2.50 Cr/lead)',
                'Exotel Click-to-Call (2.50 Cr/call)',
                'Verified Vendor Trust+ Badge',
                'Zero Commission on Direct Orders',
              ],
            },
            add_ons: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'addon_credits_500' },
                  title: { type: 'string', example: '500 Extra Action Credits' },
                  price_inr: { type: 'number', example: 399 },
                  quota_type: { type: 'string', example: 'action_credits' },
                  quota_value: { type: 'number', example: 500 },
                },
              },
            },
          },
        },
        UserSubscription: {
          type: 'object',
          description: 'Vendor active subscription state and remaining action credits balance',
          properties: {
            _id: { type: 'string', example: '66b5f400123456789abcdef5' },
            user_id: { type: 'string', example: '66b5f400123456789abcdef0' },
            plan_id: { type: 'string', example: '66b5f400123456789abcdef4' },
            plan_title: { type: 'string', example: 'Growth' },
            status: { type: 'string', enum: ['active', 'cancelled', 'expired'], example: 'active' },
            credits_balance: { type: 'number', example: 1546.5, description: 'Current usable action credit balance' },
            total_credits_purchased: { type: 'number', example: 1599 },
            total_credits_consumed: { type: 'number', example: 52.5 },
            expires_at: { type: 'string', nullable: true, example: null, description: 'Null indicates credits do not expire' },
            last_recharge_at: { type: 'string', format: 'date-time' },
          },
        },
        WhatsAppLead: {
          type: 'object',
          description: 'Customer WhatsApp lead captured for vendor CRM',
          properties: {
            _id: { type: 'string', example: '66b5f400123456789abcdef6' },
            vendor_id: { type: 'string', example: '66b5f400123456789abcdef0' },
            customer_id: { type: 'string', example: '66b5f400123456789abcdef9' },
            customer_phone: { type: 'string', example: '+919876543210' },
            customer_name: { type: 'string', example: 'Amit Kumar' },
            waba_id: { type: 'string', example: '104928374829102' },
            conversation_id: { type: 'string', example: 'wamid.HBgLOTE5ODc2NTQzMjEwFQIAEhg...' },
            status: { type: 'string', enum: ['new', 'contacted', 'converted', 'closed'], example: 'new' },
            cost_credits: { type: 'number', example: 2.5 },
            is_billed: { type: 'boolean', example: true },
            listing_id: { type: 'string', nullable: true, example: '66b5f400123456789abcdef3' },
            reel_id: { type: 'string', nullable: true, example: null },
            last_message_at: { type: 'string', format: 'date-time' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        WhatsAppVendorStatus: {
          type: 'object',
          description: 'Meta WhatsApp Business Account connection and messaging tier status',
          properties: {
            is_connected: { type: 'boolean', example: true },
            waba_id: { type: 'string', example: '104928374829102' },
            phone_number_id: { type: 'string', example: '109827364510928' },
            phone_number: { type: 'string', example: '+919876543210' },
            status: { type: 'string', enum: ['connected', 'pending_verification', 'disconnected'], example: 'connected' },
            messaging_tier: { type: 'string', example: 'TIER_1K' },
            display_name: { type: 'string', example: 'Apex Studio' },
            credits_balance: { type: 'number', example: 1546.5 },
          },
        },
        CallRecord: {
          type: 'object',
          description: 'Exotel bridged call record and customer telephony lead',
          properties: {
            _id: { type: 'string', example: '66b5f400123456789abcdef7' },
            call_sid: { type: 'string', example: 'c2c_exotel_9876543210_abcdef' },
            vendor_id: { type: 'string', example: '66b5f400123456789abcdef0' },
            customer_id: { type: 'string', example: '66b5f400123456789abcdef9' },
            direction: { type: 'string', enum: ['click_to_call', 'inbound', 'outbound'], example: 'click_to_call' },
            status: { type: 'string', enum: ['initiated', 'ringing', 'in-progress', 'completed', 'busy', 'failed', 'no-answer'], example: 'completed' },
            duration_seconds: { type: 'number', example: 145 },
            cost_credits: { type: 'number', example: 2.5 },
            recording_url: { type: 'string', nullable: true, example: 'https://api.exotel.com/v1/Accounts/acc123/Recordings/rec456.mp3' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        WalletLedger: {
          type: 'object',
          description: 'Vendor / Customer escrow wallet ledger balance and transactions',
          properties: {
            balance: { type: 'number', example: 1546.5 },
            bonus_balance: { type: 'number', example: 50 },
            total_credits: { type: 'number', example: 1596.5 },
            transactions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  transaction_id: { type: 'string', example: 'tx_act_dedup_66b5f4' },
                  type: { type: 'string', enum: ['credit', 'debit'], example: 'debit' },
                  amount: { type: 'number', example: 2.5 },
                  reason: { type: 'string', example: 'whatsapp_inbound_lead' },
                  timestamp: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
        Reel: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '66b5f400123456789abcdef8' },
            caption: { type: 'string', example: 'Behind the scenes: 4K Drone shoot over Marine Drive 🌅' },
            videoUrl: { type: 'string', example: 'https://res.cloudinary.com/bizreels/video/upload/v1/reels/reel101.mp4' },
            thumbnailUrl: { type: 'string', example: 'https://res.cloudinary.com/bizreels/video/upload/so_0.5,w_1080,h_1920,c_fill,q_auto,f_jpg/reels/reel101.jpg' },
            likes_count: { type: 'number', example: 284 },
            views_count: { type: 'number', example: 3410 },
            creator: {
              type: 'object',
              properties: {
                _id: { type: 'string', example: '66b5f400123456789abcdef0' },
                name: { type: 'string', example: 'Rahul Sharma' },
                avatar: { type: 'string', example: 'https://res.cloudinary.com/bizreels/image/upload/avatar.jpg' },
              },
            },
            tagged_listing: { type: 'string', nullable: true, example: '66b5f400123456789abcdef3' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    tags: [
      { name: 'Authentication', description: 'User registration, login, OTP verification, Google OAuth 2.0, & session security' },
      { name: 'Users', description: 'User profile, account settings, follower social graph, Trust Score, & activity tracking' },
      { name: 'Vendors', description: 'Vendor business profiles, directory discovery, team management, & sales analytics' },
      { name: 'Creators', description: 'Creator marketplace, portfolio showcase, rate cards, & hiring proposals' },
      { name: 'Listings', description: 'Product & service catalog CRUD, category taxonomy, and geo-proximity search' },
      { name: 'Reels', description: 'Short video feed, upload, video likes/views, and tagged product shop attribution' },
      { name: 'Requirements & Bidding', description: 'Customer RFQ briefs, lead matching, vendor quote proposals, & acceptance' },
      { name: 'Subscriptions', description: 'Vendor subscription recharge tiers (Starter, Growth, Business) and action credit usage' },
      { name: 'WhatsApp & Leads', description: 'Meta WhatsApp Cloud API integration, WABA embedded signup, wa.me tracking links, and inbound 2.50 credit charging' },
      { name: 'Telephony & Calls', description: 'Exotel cloud telephony, click-to-call bridging, availability checking, and call history' },
      { name: 'Webhooks & Integrations', description: 'Incoming webhooks from Meta WhatsApp Cloud API and Exotel Telephony CDR events' },
      { name: 'Wallet & Ledger', description: 'Escrow wallet balance, Razorpay balance top-ups, transactions log, and payouts' },
      { name: 'Cart & Orders', description: 'Shopping cart management, item checkout calculations, order status, & invoices' },
      { name: 'Chat & Messages', description: 'Real-time WebSocket direct messaging, conversation threads, & unread counters' },
      { name: 'Notifications', description: 'In-app and push notification preferences, notifications list, and read states' },
      { name: 'Reviews & Ratings', description: 'Customer store and product ratings, text reviews, and helpful voting' },
      { name: 'AI Services', description: 'Gemini AI copywriting for listing descriptions, smart matching, and SEO optimization' },
      { name: 'Analytics', description: 'Impression and click tracking, vendor time-series analytics, and lead conversion metrics' },
      { name: 'KYC & Compliance', description: 'Government ID verification (Aadhaar, PAN, GST, Bank Account) and Trust+ badges' },
      { name: 'Offers & Campaigns', description: 'Vendor promotional discount codes, coupons, and flash deals' },
      { name: 'Location & Search', description: 'Geocoding, nearby location lookup, & global search autocomplete' },
      { name: 'Admin Operations', description: 'Platform administration, user/vendor approvals, subscription plan CMS, and financial reports' },
      { name: 'Identity', description: 'Individual official document submissions (Aadhaar, PAN, GST, Bank) and Trust+ levels' },
      { name: 'SEO', description: 'Dynamic sitemaps, robots.txt, and product detail SEO metadata' },
      { name: 'Onboarding', description: 'User profile completion checklist, progress tracking, and bonus reward credits' },
      { name: 'General', description: 'Media upload utilities, newsletter subscriptions, contact forms, and system health checks' },
    ],
    paths: {
      // ─── AUTHENTICATION ─────────────────────────────────────────
      '/auth/register': {
        post: {
          tags: ['Authentication'],
          summary: 'Register a new customer, vendor, or creator account',
          description: 'Creates a new user record. Requires phone verification via OTP before full account activation.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'email', 'phone', 'password', 'role'],
                  properties: {
                    name: { type: 'string', example: 'Rahul Sharma' },
                    email: { type: 'string', format: 'email', example: 'rahul@example.com' },
                    phone: { type: 'string', example: '+919876543210' },
                    password: { type: 'string', format: 'password', example: 'Password@123' },
                    role: { type: 'string', enum: ['customer', 'vendor', 'creator'], example: 'vendor' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Account registered successfully', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
            400: { description: 'Email or phone already registered', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } } },
          },
        },
      },
      '/auth/login': {
        post: {
          tags: ['Authentication'],
          summary: 'Authenticate with email/password',
          description: 'Validates credentials and issues JWT access and refresh tokens.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', format: 'email', example: 'rahul@example.com' },
                    password: { type: 'string', format: 'password', example: 'Password@123' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Login successful. Returns tokens and user profile.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
            401: { description: 'Invalid email or password', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } } },
          },
        },
      },
      '/auth/otp/request': {
        post: {
          tags: ['Authentication'],
          summary: 'Request 6-digit SMS OTP',
          description: 'Generates and dispatches a cryptographically secure 6-digit one-time password via SMS to the provided Indian mobile number.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['phone'],
                  properties: {
                    phone: { type: 'string', example: '+919876543210' },
                    purpose: { type: 'string', enum: ['login', 'register', 'verification', 'reset_password'], default: 'login' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'OTP dispatched successfully', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
            429: { description: 'Too many OTP requests. Please wait 60 seconds.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } } },
          },
        },
      },
      '/auth/otp/verify': {
        post: {
          tags: ['Authentication'],
          summary: 'Verify OTP code and establish authenticated session',
          description: 'Validates the submitted 6-digit OTP code against Redis / memory store. On success, returns user profile and sets auth tokens.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['phone', 'otp'],
                  properties: {
                    phone: { type: 'string', example: '+919876543210' },
                    otp: { type: 'string', example: '482910' },
                    purpose: { type: 'string', enum: ['login', 'register', 'verification', 'reset_password'], default: 'login' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'OTP verified. Session established.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
            400: { description: 'Invalid or expired OTP', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } } },
          },
        },
      },
      '/auth/me': {
        get: {
          tags: ['Authentication'],
          summary: 'Fetch currently authenticated user session',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Returns authenticated user document', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
            401: { description: 'Unauthorized — missing or invalid JWT' },
          },
        },
      },
      '/auth/switch-role': {
        patch: {
          tags: ['Authentication'],
          summary: 'Switch active workspace role (customer, vendor, creator)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['targetRole'],
                  properties: {
                    targetRole: { type: 'string', enum: ['customer', 'vendor', 'creator'], example: 'vendor' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Active role updated successfully' },
            400: { description: 'Target role not unlocked by this user' },
          },
        },
      },

      // ─── VENDOR SUBSCRIPTION RECHARGE & ACTION CREDITS ──────────
      '/subscription/plans': {
        get: {
          tags: ['Subscriptions'],
          summary: 'List active vendor subscription recharge tiers and add-ons',
          description: 'Returns the catalog of vendor subscription plans (Starter ₹499/599 Cr, Growth ₹1,199/1,599 Cr, Business ₹2,199/2,999 Cr), per-action charging rates (2.50 Cr for WhatsApp, 2.50 Cr for Calls), and available top-up add-ons.',
          responses: {
            200: {
              description: 'List of active subscription plans',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: { type: 'array', items: { $ref: '#/components/schemas/SubscriptionPlan' } },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/subscription': {
        get: {
          tags: ['Subscriptions'],
          summary: 'Get authenticated vendor current subscription status & action credits balance',
          description: 'Returns the vendor active subscription tier, current non-expiring credit balance, total credits purchased, and total credits consumed.',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Subscription status & wallet credit balance',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: { $ref: '#/components/schemas/UserSubscription' },
                    },
                  },
                },
              },
            },
            401: { description: 'Unauthorized' },
          },
        },
      },
      '/subscription/purchase-razorpay': {
        post: {
          tags: ['Subscriptions'],
          summary: 'Create Razorpay payment order for vendor subscription recharge',
          description: 'Initiates a Razorpay payment order for purchasing or renewing a subscription recharge plan. Calculates the total amount including any selected credit add-on packs.',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['plan_id'],
                  properties: {
                    plan_id: { type: 'string', example: '66b5f400123456789abcdef4', description: 'MongoDB ObjectId or plan tier title ("Growth")' },
                    selected_addons: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string', example: 'addon_credits_500' },
                          title: { type: 'string', example: '500 Extra Action Credits' },
                          price_inr: { type: 'number', example: 399 },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Razorpay order created successfully. Ready for frontend checkout modal.',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'object',
                        properties: {
                          order_id: { type: 'string', example: 'order_OIkjh726Gg72H' },
                          amount_inr: { type: 'number', example: 1199 },
                          amount_paise: { type: 'integer', example: 119900 },
                          currency: { type: 'string', example: 'INR' },
                          key_id: { type: 'string', example: 'rzp_test_123456789' },
                          plan_title: { type: 'string', example: 'Growth' },
                        },
                      },
                    },
                  },
                },
              },
            },
            400: { description: 'Plan not found or duplicate active plan' },
          },
        },
      },

      // ─── META WHATSAPP CLOUD API & LEADS ─────────────────────────
      '/whatsapp/click': {
        post: {
          tags: ['WhatsApp & Leads'],
          summary: 'Generate WhatsApp click tracking context and wa.me direct link',
          description: 'Invoked when a customer clicks the "Chat on WhatsApp" button on a listing or reel. Returns an authenticated wa.me link with prefilled attribution text. Zero credits are charged at click time — charging only occurs when customer sends an inbound message to vendor WABA.',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['vendorId'],
                  properties: {
                    vendorId: { type: 'string', example: '66b5f400123456789abcdef0' },
                    listingId: { type: 'string', example: '66b5f400123456789abcdef3' },
                    reelId: { type: 'string', example: null },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'WhatsApp redirect context generated',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'object',
                        properties: {
                          waUrl: { type: 'string', example: 'https://wa.me/919876543210?text=Hi%2C+I+found+your+listing+on+BizReels' },
                          trackingContextId: { type: 'string', example: 'ctx_wa_66b5f400' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/whatsapp/vendor/status': {
        get: {
          tags: ['WhatsApp & Leads'],
          summary: 'Retrieve vendor WhatsApp Business Account (WABA) connection status',
          description: 'Checks whether the authenticated vendor has completed Meta Embedded Signup or manually connected their WhatsApp Business Account. Returns WABA ID, phone number, messaging tier, and action credit balance.',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'WhatsApp connection status',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: { $ref: '#/components/schemas/WhatsAppVendorStatus' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/whatsapp/vendor/connect': {
        post: {
          tags: ['WhatsApp & Leads'],
          summary: 'Manually configure or update vendor WhatsApp Business Account credentials',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['wabaId', 'phoneNumberId'],
                  properties: {
                    wabaId: { type: 'string', example: '104928374829102' },
                    phoneNumberId: { type: 'string', example: '109827364510928' },
                    status: { type: 'string', enum: ['connected', 'pending_verification'], default: 'pending_verification' },
                    messagingTier: { type: 'string', example: 'TIER_1K' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Connection updated successfully' },
          },
        },
      },
      '/whatsapp/vendor/embedded-signup-callback': {
        post: {
          tags: ['WhatsApp & Leads'],
          summary: 'Meta Embedded Signup OAuth exchange callback',
          description: 'Exchanges the authorization code from the Meta Embedded Signup popup for a permanent System User access token, fetches WABA ID and Phone Number ID, and links them to the vendor profile.',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['code'],
                  properties: {
                    code: { type: 'string', example: 'AQDk...OAuthCodeFromMeta...' },
                    wabaId: { type: 'string', example: '104928374829102' },
                    phoneNumberId: { type: 'string', example: '109827364510928' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'WABA connected successfully via Embedded Signup' },
            400: { description: 'Meta code exchange failed' },
          },
        },
      },
      '/whatsapp/vendor/leads': {
        get: {
          tags: ['WhatsApp & Leads'],
          summary: 'Retrieve paginated WhatsApp leads captured for vendor CRM',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['all', 'new', 'contacted', 'converted', 'closed'] } },
          ],
          responses: {
            200: {
              description: 'Paginated customer leads',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'object',
                        properties: {
                          leads: { type: 'array', items: { $ref: '#/components/schemas/WhatsAppLead' } },
                          pagination: { type: 'object' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/whatsapp/simulate-inbound': {
        post: {
          tags: ['WhatsApp & Leads'],
          summary: 'Simulate inbound customer WhatsApp message (Sandbox / Dev testing)',
          description: 'Simulates an incoming WhatsApp message from a customer to the vendor. Validates the 24-hour deduplication window, records a WhatsAppLead, and atomically deducts 2.50 action credits from the vendor subscription wallet.',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['customerPhone'],
                  properties: {
                    vendorId: { type: 'string', example: '66b5f400123456789abcdef0' },
                    customerPhone: { type: 'string', example: '+919876543210' },
                    customerName: { type: 'string', example: 'Vikram Mehta' },
                    messageText: { type: 'string', example: 'Hi, I need a wedding videographer for Dec 15th.' },
                    listingId: { type: 'string', example: '66b5f400123456789abcdef3' },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Simulation processed. Credit deducted if not deduplicated.',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'object',
                        properties: {
                          lead: { $ref: '#/components/schemas/WhatsAppLead' },
                          isDeduped: { type: 'boolean', example: false },
                          creditsDeducted: { type: 'number', example: 2.5 },
                          remainingCredits: { type: 'number', example: 1544 },
                        },
                      },
                    },
                  },
                },
              },
            },
            402: { description: 'Insufficient action credits balance' },
          },
        },
      },
      '/webhooks/whatsapp': {
        get: {
          tags: ['Webhooks & Integrations'],
          summary: 'Meta Webhook verification challenge handshake',
          description: 'Handshake endpoint invoked by Meta during webhook registration. Validates hub.verify_token and returns hub.challenge.',
          parameters: [
            { name: 'hub.mode', in: 'query', schema: { type: 'string' } },
            { name: 'hub.verify_token', in: 'query', schema: { type: 'string' } },
            { name: 'hub.challenge', in: 'query', schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'Challenge verified and returned' },
            403: { description: 'Verification failed' },
          },
        },
        post: {
          tags: ['Webhooks & Integrations'],
          summary: 'Meta Inbound WhatsApp Cloud API webhook receiver',
          description: 'Receives real-time customer WhatsApp messages from Meta. Validates X-Hub-Signature-256 HMAC-SHA256 signature, deduplicates messages within a 24-hour window, saves customer lead, and deducts 2.50 action credits.',
          parameters: [
            { name: 'X-Hub-Signature-256', in: 'header', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'Webhook received. Always responds HTTP 200 immediately per Meta documentation.' },
          },
        },
      },

      // ─── TELEPHONY & CALLS (EXOTEL) ──────────────────────────────
      '/calls/check-availability': {
        post: {
          tags: ['Telephony & Calls'],
          summary: 'Check if a vendor is currently available to receive voice calls',
          description: 'Verifies whether the vendor has telephony enabled, has sufficient credit balance (>= 2.50 credits), and has a valid phone number configured.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['vendorId'],
                  properties: {
                    vendorId: { type: 'string', example: '66b5f400123456789abcdef0' },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Vendor call availability status',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'object',
                        properties: {
                          isAvailable: { type: 'boolean', example: true },
                          reason: { type: 'string', nullable: true, example: null },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/calls/initiate': {
        post: {
          tags: ['Telephony & Calls'],
          summary: 'Initiate Exotel click-to-call between customer and vendor',
          description: 'Initiates a bridged voice call via Exotel API. Exotel calls the customer first, then connects to the vendor upon customer answer. Caller numbers are masked.',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['vendorId'],
                  properties: {
                    vendorId: { type: 'string', example: '66b5f400123456789abcdef0' },
                    listingId: { type: 'string', example: '66b5f400123456789abcdef3' },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Call initiated via Exotel',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'object',
                        properties: {
                          callSid: { type: 'string', example: 'c2c_exotel_1029384756' },
                          status: { type: 'string', example: 'initiated' },
                          message: { type: 'string', example: 'Connecting your call...' },
                        },
                      },
                    },
                  },
                },
              },
            },
            402: { description: 'Vendor has insufficient credits balance to receive calls' },
          },
        },
      },
      '/calls/vendor-history': {
        get: {
          tags: ['Telephony & Calls'],
          summary: 'Vendor call history and customer voice leads',
          description: 'Returns paginated telephony call records, duration, status, and deduplicated credit consumption.',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          ],
          responses: {
            200: {
              description: 'Call logs history',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'object',
                        properties: {
                          calls: { type: 'array', items: { $ref: '#/components/schemas/CallRecord' } },
                          pagination: { type: 'object' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/calls/webhook': {
        post: {
          tags: ['Webhooks & Integrations'],
          summary: 'Exotel Call Detail Record (CDR) completion webhook',
          description: 'Webhook called by Exotel upon voice call termination. If call was successfully connected and lasted >= 10 seconds, 2.50 credits are deducted from vendor.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    CallSid: { type: 'string', example: 'c2c_exotel_1029384756' },
                    Status: { type: 'string', example: 'completed' },
                    DialDuration: { type: 'string', example: '125' },
                    RecordingUrl: { type: 'string', example: 'https://api.exotel.com/rec.mp3' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Webhook processed successfully' },
          },
        },
      },

      // ─── ADMIN SUBSCRIPTIONS & REVENUE ───────────────────────────
      '/admin/subscription/plans': {
        get: {
          tags: ['Admin Operations'],
          summary: 'List all vendor subscription recharge plans (Admin)',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'List of all plans including inactive/archived' },
          },
        },
        post: {
          tags: ['Admin Operations'],
          summary: 'Create a new vendor subscription recharge plan (Admin)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title', 'tier', 'price_inr', 'action_credits'],
                  properties: {
                    title: { type: 'string', example: 'Mega Business' },
                    tier: { type: 'string', enum: ['starter', 'growth', 'business', 'enterprise'], example: 'business' },
                    price_inr: { type: 'number', example: 4999 },
                    action_credits: { type: 'number', example: 7000 },
                    action_rates: {
                      type: 'object',
                      properties: {
                        whatsapp_inbound_credit_rate: { type: 'number', example: 2.5 },
                        call_credit_rate: { type: 'number', example: 2.5 },
                      },
                    },
                    features: { type: 'array', items: { type: 'string' } },
                    badge_text: { type: 'string', example: 'MAX VALUE' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Plan created' },
          },
        },
      },
      '/admin/subscription/plans/{id}': {
        patch: {
          tags: ['Admin Operations'],
          summary: 'Update subscription recharge plan (Admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Plan updated' } },
        },
        delete: {
          tags: ['Admin Operations'],
          summary: 'Soft-delete subscription plan (Admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Plan deleted' } },
        },
      },
      '/admin/subscription/plans/{id}/activate': {
        post: {
          tags: ['Admin Operations'],
          summary: 'Activate a subscription plan (Admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Plan activated' } },
        },
      },
      '/admin/subscription/plans/{id}/deactivate': {
        post: {
          tags: ['Admin Operations'],
          summary: 'Deactivate a subscription plan (Admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Plan deactivated' } },
        },
      },
      '/admin/subscription/user-subscriptions': {
        get: {
          tags: ['Admin Operations'],
          summary: 'List vendor subscriptions and wallet credit balances (Admin)',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'List of vendor subscriptions' } },
        },
      },
      '/admin/subscription/invoices': {
        get: {
          tags: ['Admin Operations'],
          summary: 'List subscription tax invoices and GST receipts (Admin)',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'List of invoices' } },
        },
      },
      '/admin/subscription/invoices/{id}/pdf': {
        get: {
          tags: ['Admin Operations'],
          summary: 'Download invoice PDF document (Admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: {
              description: 'Invoice PDF binary stream',
              content: { 'application/pdf': { schema: { type: 'string', format: 'binary' } } },
            },
          },
        },
      },
      '/admin/subscription/revenue': {
        get: {
          tags: ['Admin Operations'],
          summary: 'Subscription revenue analytics & credit consumption metrics (Admin)',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Revenue summary and credit usage breakdown' } },
        },
      },

      // ─── LISTINGS & CATALOG ─────────────────────────────────────
      '/listings': {
        get: {
          tags: ['Listings'],
          summary: 'Geolocated catalog proximity search & filters',
          description: 'Finds products and vendor services near a geospatial point (lat/lng) or matches keyword search, category taxonomy, and price range.',
          parameters: [
            { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Keyword search query' },
            { name: 'lat', in: 'query', schema: { type: 'number' }, description: 'Latitude for proximity search' },
            { name: 'lng', in: 'query', schema: { type: 'number' }, description: 'Longitude for proximity search' },
            { name: 'distance', in: 'query', schema: { type: 'number', default: 25 }, description: 'Search radius in kilometers' },
            { name: 'category', in: 'query', schema: { type: 'string' }, description: 'Category taxonomy filter' },
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          ],
          responses: {
            200: {
              description: 'Catalog items array with distance metrics',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: { type: 'array', items: { $ref: '#/components/schemas/Listing' } },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ['Listings'],
          summary: 'Create a new product or service listing',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title', 'description', 'price', 'category'],
                  properties: {
                    title: { type: 'string', example: '4K Commercial Drone Videography Package' },
                    description: { type: 'string', example: 'Full HD & 4K aerial footage with licensed drone pilot.' },
                    price: { type: 'number', example: 15000 },
                    mrp: { type: 'number', example: 18000 },
                    category: { type: 'string', example: 'Videography' },
                    images: { type: 'array', items: { type: 'string' } },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Listing created successfully' } },
        },
      },
      '/listings/{id}': {
        get: {
          tags: ['Listings'],
          summary: 'Get listing details by ID',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Listing details', content: { 'application/json': { schema: { $ref: '#/components/schemas/Listing' } } } },
            404: { description: 'Listing not found' },
          },
        },
        put: {
          tags: ['Listings'],
          summary: 'Update listing details',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Listing updated successfully' } },
        },
        delete: {
          tags: ['Listings'],
          summary: 'Soft-delete a listing',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Listing deleted successfully' } },
        },
      },

      // ─── REELS & VIDEO COMMERCE ─────────────────────────────────
      '/reels': {
        get: {
          tags: ['Reels'],
          summary: 'Paginated social video reels feed',
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
            { name: 'category', in: 'query', schema: { type: 'string' } },
          ],
          responses: {
            200: {
              description: 'Feed video reels array',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: { type: 'array', items: { $ref: '#/components/schemas/Reel' } },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ['Reels'],
          summary: 'Upload and publish a new video reel',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['videoUrl'],
                  properties: {
                    caption: { type: 'string', example: 'Cinematic bridal entrance 🌸' },
                    videoUrl: { type: 'string', example: 'https://res.cloudinary.com/bizreels/video/upload/reel1.mp4' },
                    thumbnailUrl: { type: 'string', example: 'https://res.cloudinary.com/bizreels/image/upload/thumb1.jpg' },
                    tagged_listing: { type: 'string', example: '66b5f400123456789abcdef3' },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Reel published' } },
        },
      },
      '/reels/{id}/product-details': {
        get: {
          tags: ['Reels'],
          summary: 'Fetch full product, service & vendor details for a reel',
          description: 'Returns comprehensive details for a video reel including tagged product/service specs, pricing, MRP, discount percentage, images, and vendor shop profile.',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Product and vendor details tagged to reel' },
            404: { description: 'Reel not found' },
          },
        },
      },
      '/reels/{id}/like': {
        post: {
          tags: ['Reels'],
          summary: 'Toggle like state for video reel',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Like toggled' } },
        },
      },

      // ─── WALLET & ESCROW LEDGER ─────────────────────────────────
      '/wallet/transactions': {
        get: {
          tags: ['Wallet & Ledger'],
          summary: 'Transaction history and balance ledger',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Wallet ledger logs',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/WalletLedger' } } },
            },
          },
        },
      },
      '/wallet/recharge': {
        post: {
          tags: ['Wallet & Ledger'],
          summary: 'Initiate Razorpay wallet balance recharge',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['amount_inr'],
                  properties: {
                    amount_inr: { type: 'number', example: 500 },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Razorpay order created for wallet top-up' },
          },
        },
      },

      // ─── SYSTEM HEALTH & CMS ────────────────────────────────────
      '/health': {
        get: {
          tags: ['General'],
          summary: 'API Health Check & Service Heartbeat',
          responses: {
            200: {
              description: 'Service operational',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'BizReels API is running' },
                      timestamp: { type: 'string', format: 'date-time' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/contact': {
        post: {
          tags: ['General'],
          summary: 'Submit customer support inquiry or feedback',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'email', 'message'],
                  properties: {
                    name: { type: 'string', example: 'Rohit Verma' },
                    email: { type: 'string', format: 'email', example: 'rohit@example.com' },
                    phone: { type: 'string', example: '+919876543210' },
                    subject: { type: 'string', example: 'vendor_support' },
                    message: { type: 'string', example: 'How do I complete WhatsApp Embedded Signup for my studio?' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Contact submission received' },
          },
        },
      },
      '/newsletter/subscribe': {
        post: {
          tags: ['General'],
          summary: 'Subscribe email to BizReels product updates and newsletter',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email'],
                  properties: {
                    email: { type: 'string', format: 'email', example: 'updates@example.com' },
                    source: { type: 'string', example: 'footer' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Subscribed successfully' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js', './src/models/*.js'],
};

const baseSwaggerSpec = swaggerJSDoc(options);

const routeModuleMap = [
  { file: 'upload.routes.js', prefix: '/upload' },
  { file: 'media.routes.js', prefix: '/media' },
  { file: 'cart.routes.js', prefix: '/cart' },
  { file: 'ai.routes.js', prefix: '/ai' },
  { file: 'authRoutes.js', prefix: '/auth' },
  { file: 'reelRoutes.js', prefix: '/reels' },
  { file: 'listingRoutes.js', prefix: '/listings' },
  { file: 'feed.routes.js', prefix: '/feed' },
  { file: 'requirementRoutes.js', prefix: '/requirements' },
  { file: 'chatRoutes.js', prefix: '/chat' },
  { file: 'walletRoutes.js', prefix: '/wallet' },
  { file: 'transaction.routes.js', prefix: '/transactions' },
  { file: 'hireRoutes.js', prefix: '/hires' },
  { file: 'liveRoutes.js', prefix: '/live' },
  { file: 'notificationRoutes.js', prefix: '/notifications' },
  { file: 'offer.routes.js', prefix: '/offers' },
  { file: 'reviewRoutes.js', prefix: '/reviews' },
  { file: 'analyticsRoutes.js', prefix: '/analytics' },
  { file: 'orderRoutes.js', prefix: '/orders' },
  { file: 'inquiryRoutes.js', prefix: '/inquiries' },
  { file: 'user.routes.js', prefix: '/users' },
  { file: 'category.routes.js', prefix: '/categories' },
  { file: 'creatorMarketplaceRoutes.js', prefix: '/creator-marketplace' },
  { file: 'location.routes.js', prefix: '/location' },
  { file: 'search.routes.js', prefix: '/search' },
  { file: 'seo.routes.js', prefix: '/seo' },
  { file: 'identity.routes.js', prefix: '/identity' },
  { file: 'onboarding.routes.js', prefix: '/onboarding' },
  { file: 'vendor.routes.js', prefix: '/vendors' },
  { file: 'creator.routes.js', prefix: '/creator' },
  { file: 'follow.routes.js', prefix: '/follow' },
  { file: 'subscription.routes.js', prefix: '/subscriptions' },
  { file: 'referral.routes.js', prefix: '/referrals' },
  { file: 'admin.routes.js', prefix: '/admin' },
  { file: 'call.routes.js', prefix: '/calls' },
  { file: 'whatsapp.routes.js', prefix: '/whatsapp' },
  { file: 'vendor-offer.routes.js', prefix: '/vendor-offers' },
  { file: 'phase4.routes.js', prefix: '' },
  { file: 'interaction.routes.js', prefix: '' },
  { file: 'report.routes.js', prefix: '' },
  { file: 'kyc.routes.js', prefix: '' },
];

function formatPathForSwagger(expressPath) {
  let cleaned = expressPath.replace(/:([a-zA-Z0-9_]+)/g, '{$1}').replace(/\/+/g, '/');
  if (cleaned.length > 1 && cleaned.endsWith('/')) cleaned = cleaned.slice(0, -1);
  return cleaned;
}

function extractPathParameters(swaggerPath) {
  const params = [];
  const matches = swaggerPath.match(/\{([a-zA-Z0-9_]+)\}/g);
  if (matches) {
    matches.forEach((m) => {
      const name = m.replace('{', '').replace('}', '');
      params.push({
        name,
        in: 'path',
        required: true,
        schema: { type: 'string' },
        description: `URL path parameter: ${name}`,
      });
    });
  }
  return params;
}

function getTagForPath(cleanPath) {
  const segments = cleanPath.split('/').filter(Boolean);
  const rawTag = segments[0] || 'General';
  const tagMap = {
    auth: 'Authentication',
    users: 'Users',
    vendors: 'Vendors',
    vendor: 'Vendors',
    creator: 'Creators',
    'creator-marketplace': 'Creators',
    listings: 'Listings',
    categories: 'Listings',
    reels: 'Reels',
    feed: 'Reels',
    requirements: 'Requirements & Bidding',
    wallet: 'Wallet & Ledger',
    transactions: 'Wallet & Ledger',
    subscription: 'Subscriptions',
    subscriptions: 'Subscriptions',
    cart: 'Cart & Orders',
    orders: 'Cart & Orders',
    'vendor-orders': 'Cart & Orders',
    chat: 'Chat & Messages',
    notifications: 'Notifications',
    reviews: 'Reviews & Ratings',
    ai: 'AI Services',
    analytics: 'Analytics',
    kyc: 'KYC & Compliance',
    offers: 'Offers & Campaigns',
    'vendor-offers': 'Offers & Campaigns',
    location: 'Location & Search',
    search: 'Location & Search',
    seo: 'SEO',
    identity: 'Identity',
    onboarding: 'Onboarding',
    admin: 'Admin Operations',
    follow: 'Users',
    follows: 'Users',
    hires: 'Creators',
    live: 'Reels',
    upload: 'General',
    media: 'General',
    reports: 'Admin Operations',
    whatsapp: 'WhatsApp & Leads',
    calls: 'Telephony & Calls',
    webhooks: 'Webhooks & Integrations',
    newsletter: 'General',
    contact: 'General',
    cms: 'General',
    health: 'General',
  };
  return tagMap[rawTag.toLowerCase()] || (rawTag.charAt(0).toUpperCase() + rawTag.slice(1));
}

function extractRoutesFromRouter(router, prefix = '') {
  const routes = [];
  if (!router || !router.stack) return routes;

  router.stack.forEach((layer) => {
    if (layer.route) {
      let routePath = layer.route.path;
      let fullPath = (prefix + routePath).replace(/\/+/g, '/');
      if (fullPath.length > 1 && fullPath.endsWith('/')) {
        fullPath = fullPath.slice(0, -1);
      }
      const methods = Object.keys(layer.route.methods).filter((m) => layer.route.methods[m]);
      methods.forEach((method) => {
        routes.push({ path: fullPath, method: method.toLowerCase() });
      });
    } else if (layer.name === 'router' && layer.handle && layer.handle.stack) {
      let subPrefix = prefix;
      if (layer.regexp && layer.regexp.source) {
        let match = layer.regexp.source
          .replace('^\\/', '/')
          .replace('^', '')
          .replace('\\/?(?=\\/|$)', '')
          .replace('(?=\\/|$)', '')
          .replace(/\\\//g, '/')
          .replace(/\\/g, '');
        if (match && !match.startsWith('/')) match = '/' + match;
        subPrefix = (prefix + match).replace(/\/+/g, '/');
      }
      routes.push(...extractRoutesFromRouter(layer.handle, subPrefix));
    }
  });

  return routes;
}

/**
 * Traverses Express routers and route modules to ensure 100% of API endpoints are documented in Swagger.
 */
function autoDiscoverExpressRoutes(app, spec) {
  const discoveredPaths = { ...spec.paths };
  const routesDir = path.join(__dirname, '../routes');

  if (!fs.existsSync(routesDir)) return spec;

  const processedFiles = new Set();

  // 1. Process standard route modules with their base prefixes
  routeModuleMap.forEach(({ file, prefix }) => {
    processedFiles.add(file);
    const fullFilePath = path.join(routesDir, file);
    if (!fs.existsSync(fullFilePath)) return;

    try {
      const routerModule = require(fullFilePath);
      const routes = extractRoutesFromRouter(routerModule, prefix);
      routes.forEach(({ path: p, method }) => {
        const cleanPath = formatPathForSwagger(p);
        if (!discoveredPaths[cleanPath]) discoveredPaths[cleanPath] = {};
        if (!discoveredPaths[cleanPath][method]) {
          const pathParams = extractPathParameters(cleanPath);
          const tag = getTagForPath(cleanPath);
          const summary = `${method.toUpperCase()} ${cleanPath}`;

          const operation = {
            tags: [tag],
            summary,
            description: `Auto-documented endpoint: ${method.toUpperCase()} ${cleanPath}`,
            responses: {
              200: {
                description: 'Success',
                content: {
                  'application/json': {
                    schema: { $ref: '#/components/schemas/ApiResponse' },
                  },
                },
              },
              400: { description: 'Bad Request / Validation Error' },
              401: { description: 'Unauthorized' },
            },
          };

          if (pathParams.length > 0) {
            operation.parameters = pathParams;
          }

          const isPublic =
            cleanPath.startsWith('/auth/login') ||
            cleanPath.startsWith('/auth/register') ||
            cleanPath.startsWith('/auth/otp') ||
            cleanPath.startsWith('/auth/phone') ||
            cleanPath.startsWith('/auth/google') ||
            cleanPath.startsWith('/auth/send-otp') ||
            cleanPath.startsWith('/auth/verify-otp') ||
            cleanPath.startsWith('/auth/forgot-password') ||
            cleanPath.startsWith('/auth/reset-password') ||
            cleanPath.startsWith('/auth/dev') ||
            cleanPath.startsWith('/webhooks') ||
            cleanPath === '/health' ||
            cleanPath === '/' ||
            cleanPath.startsWith('/seo');

          if (!isPublic) {
            operation.security = [{ bearerAuth: [] }];
          }

          discoveredPaths[cleanPath][method] = operation;
        }
      });
    } catch (e) {
      // Ignore load errors
    }
  });

  // 2. Scan any remaining files in src/routes not listed in routeModuleMap
  try {
    const filesInDir = fs.readdirSync(routesDir).filter((f) => f.endsWith('.js') && f !== 'index.js');
    filesInDir.forEach((file) => {
      if (processedFiles.has(file)) return;
      const baseName = file.replace('.routes.js', '').replace('Routes.js', '').replace('.js', '');
      const prefix = '/' + baseName;
      try {
        const routerModule = require(path.join(routesDir, file));
        const routes = extractRoutesFromRouter(routerModule, prefix);
        routes.forEach(({ path: p, method }) => {
          const cleanPath = formatPathForSwagger(p);
          if (!discoveredPaths[cleanPath]) discoveredPaths[cleanPath] = {};
          if (!discoveredPaths[cleanPath][method]) {
            const pathParams = extractPathParameters(cleanPath);
            const tag = getTagForPath(cleanPath);
            const summary = `${method.toUpperCase()} ${cleanPath}`;

            const operation = {
              tags: [tag],
              summary,
              description: `Auto-documented endpoint: ${method.toUpperCase()} ${cleanPath}`,
              responses: {
                200: { description: 'Success' },
              },
            };

            if (pathParams.length > 0) operation.parameters = pathParams;
            discoveredPaths[cleanPath][method] = operation;
          }
        });
      } catch (e) {}
    });
  } catch (e) {}

  // 3. Process routes registered directly on routes/index.js
  try {
    const indexRoutes = require(path.join(routesDir, 'index.js'));
    const routes = extractRoutesFromRouter(indexRoutes, '');
    routes.forEach(({ path: p, method }) => {
      const cleanPath = formatPathForSwagger(p);
      if (!discoveredPaths[cleanPath]) discoveredPaths[cleanPath] = {};
      if (!discoveredPaths[cleanPath][method]) {
        const pathParams = extractPathParameters(cleanPath);
        const tag = getTagForPath(cleanPath);
        const summary = `${method.toUpperCase()} ${cleanPath}`;

        const operation = {
          tags: [tag],
          summary,
          description: `Auto-documented endpoint: ${method.toUpperCase()} ${cleanPath}`,
          responses: {
            200: { description: 'Success' },
          },
        };

        if (pathParams.length > 0) operation.parameters = pathParams;
        discoveredPaths[cleanPath][method] = operation;
      }
    });
  } catch (e) {}

  // 4. Fallback inspection of Express app._router stack if passed
  if (app && app._router && app._router.stack) {
    function processLayer(layer, pathPrefix = '') {
      if (layer.route) {
        const fullPath = (pathPrefix + layer.route.path).replace(/\/+/g, '/');
        const cleanPath = fullPath.replace(/^\/api\/v1/, '').replace(/^\/api/, '').replace(/^\/v1/, '') || '/';
        const formattedPath = formatPathForSwagger(cleanPath);

        if (!layer.route.methods) return;

        Object.keys(layer.route.methods).forEach((method) => {
          if (!layer.route.methods[method]) return;
          const httpMethod = method.toLowerCase();

          if (!discoveredPaths[formattedPath]) {
            discoveredPaths[formattedPath] = {};
          }

          if (!discoveredPaths[formattedPath][httpMethod]) {
            const pathParams = extractPathParameters(formattedPath);
            const tag = getTagForPath(formattedPath);
            const summary = `${httpMethod.toUpperCase()} ${formattedPath}`;

            const operation = {
              tags: [tag],
              summary,
              description: `Auto-discovered Express route: ${httpMethod.toUpperCase()} ${formattedPath}`,
              responses: {
                200: { description: 'Success' },
              },
            };

            if (pathParams.length > 0) operation.parameters = pathParams;
            discoveredPaths[formattedPath][httpMethod] = operation;
          }
        });
      } else if (layer.name === 'router' && layer.handle && layer.handle.stack) {
        let prefix = pathPrefix;
        if (layer.regexp && layer.regexp.source) {
          let match = layer.regexp.source
            .replace('^\\/', '/')
            .replace('^', '')
            .replace('\\/?(?=\\/|$)', '')
            .replace('(?=\\/|$)', '')
            .replace(/\\\//g, '/')
            .replace(/\(\?:\(\[\^\\\/\]\+\?\)\)/g, ':id')
            .replace(/\\/g, '');

          if (match && !match.startsWith('/') && match !== '$') {
            match = '/' + match;
          }
          if (match && match !== '/' && match !== '^' && !match.includes('lm?')) {
            prefix = (pathPrefix + match).replace(/\/+/g, '/');
          }
        }
        layer.handle.stack.forEach((subLayer) => processLayer(subLayer, prefix));
      }
    }

    app._router.stack.forEach((layer) => processLayer(layer, ''));
  }

  return {
    ...spec,
    paths: discoveredPaths,
  };
}

/**
 * Returns complete OpenAPI spec with automatic route discovery.
 */
function getSwaggerSpec(app) {
  return autoDiscoverExpressRoutes(app, baseSwaggerSpec);
}

const customUiOptions = {
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .scheme-container { background: #12131a; padding: 15px; border-radius: 8px; border: 1px solid #232738; }
    .swagger-ui .info { margin: 20px 0; }
    .swagger-ui .info .title { color: #f59e0b; font-weight: 800; font-family: system-ui, -apple-system, sans-serif; }
  `,
  customSiteTitle: 'BizReels API Documentation',
};

module.exports = {
  swaggerUi,
  swaggerSpec: baseSwaggerSpec,
  getSwaggerSpec,
  serve: swaggerUi.serve,
  setup: (app) => swaggerUi.setup(getSwaggerSpec(app), customUiOptions),
};
