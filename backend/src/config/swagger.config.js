const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
const path = require('path');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BizReels API Documentation',
      version: '1.0.0',
      description: 'BizReels Platform REST API Specification',
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
          description: 'Provide JWT bearer token obtained from POST /auth/login or POST /auth/otp/verify',
        },
      },
      schemas: {
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operation completed successfully' },
            data: { type: 'object' },
            meta: { type: 'object' },
          },
        },
        ApiError: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Invalid request parameters' },
            errors: { type: 'array', items: { type: 'string' } },
          },
        },
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '66b5f400123456789abcdef0' },
            name: { type: 'string', example: 'Jane Doe' },
            email: { type: 'string', format: 'email', example: 'jane.doe@example.com' },
            phone: { type: 'string', example: '+919876543210' },
            roles: {
              type: 'array',
              items: { type: 'string', enum: ['customer', 'vendor', 'creator', 'admin'] },
              example: ['customer', 'vendor'],
            },
            activeRole: { type: 'string', example: 'vendor' },
            avatar: { type: 'string', example: 'https://res.cloudinary.com/bizreels/image/upload/avatar.jpg' },
            is_verified: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        VendorProfile: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '66b5f400123456789abcdef1' },
            user_id: { type: 'string', example: '66b5f400123456789abcdef0' },
            business_name: { type: 'string', example: 'Apex Digital Studio' },
            category: { type: 'string', example: 'Photography & Videography' },
            description: { type: 'string', example: 'Professional commercial photography studio.' },
            city: { type: 'string', example: 'Mumbai' },
            rating: { type: 'number', example: 4.8 },
            reviews_count: { type: 'number', example: 42 },
          },
        },
        Listing: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '66b5f400123456789abcdef3' },
            title: { type: 'string', example: '4K Commercial Drone Videography Package' },
            price: { type: 'number', example: 15000 },
            category: { type: 'string', example: 'Videography' },
          },
        },
      },
    },
    tags: [
      { name: 'Authentication', description: 'User registration, login, OTP verification, OAuth, & session security' },
      { name: 'Users', description: 'User profile, settings, follow/unfollow, and activity management' },
      { name: 'Vendors', description: 'Vendor business profiles, catalog setup, team management, & vendor dashboard' },
      { name: 'Creators', description: 'Creator profile, portfolio, packages, rate card, & brand collaborations' },
      { name: 'Listings', description: 'Product & service catalog CRUD, geo-location search, & filters' },
      { name: 'Reels', description: 'Short video feeds, video uploads, likes, view analytics, & reel boosts' },
      { name: 'Requirements & Bidding', description: 'Customer RFQs, lead distribution, vendor bidding, & quote acceptance' },
      { name: 'Wallet & Ledger', description: 'Wallet balance, Razorpay top-ups, transaction log, & escrows' },
      { name: 'Subscriptions', description: 'Platform subscription plans, features, and recurring billing' },
      { name: 'Cart & Orders', description: 'Shopping cart items, checkout calculations, order status, & invoices' },
      { name: 'Chat & Messages', description: 'Direct messaging, multi-user conversations, & unread counters' },
      { name: 'Notifications', description: 'In-app & push notification preferences & history' },
      { name: 'Reviews & Ratings', description: 'Customer ratings, written feedback, & response moderation' },
      { name: 'AI Services', description: 'AI copywriting, smart listing optimization, & search recommendation' },
      { name: 'Analytics', description: 'Event tracking, impression counters, performance dashboards' },
      { name: 'KYC & Compliance', description: 'Government ID verification, business registration, & KYC workflow' },
      { name: 'Offers & Campaigns', description: 'Coupons, flash deals, and promotional advertising campaigns' },
      { name: 'Location & Search', description: 'Geocoding, nearby location lookup, & global search autocomplete' },
      { name: 'Admin Operations', description: 'Platform administration, user/vendor approval, & financial reports' },
      { name: 'Identity', description: 'Individual official document submissions (Aadhaar, PAN, GST, Bank) and Trust+ levels' },
      { name: 'SEO', description: 'Dynamic sitemaps, robots.txt, and product detail SEO metadata' },
      { name: 'Onboarding', description: 'User profile completion checklist, progress tracking, and bonus reward credits' },
      { name: 'General', description: 'Media upload utilities, system health, and status checks' },
    ],
    paths: {
      '/auth/register': { post: { tags: ['Authentication'], summary: 'Register account', responses: { 201: { description: 'Success' } } } },
      '/auth/login': { post: { tags: ['Authentication'], summary: 'User login', responses: { 200: { description: 'Success' } } } },
      '/auth/otp/request': { post: { tags: ['Authentication'], summary: 'Request OTP', responses: { 200: { description: 'Success' } } } },
      '/auth/otp/verify': { post: { tags: ['Authentication'], summary: 'Verify OTP', responses: { 200: { description: 'Success' } } } },
      '/auth/google': { get: { tags: ['Authentication'], summary: 'Initiate Google OAuth 2.0 authentication flow', description: 'Redirects client to Google OAuth consent screen with profile and email scope.', responses: { 302: { description: 'Redirect to Google OAuth consent page' } } } },
      '/auth/google/callback': { get: { tags: ['Authentication'], summary: 'Google OAuth 2.0 authentication callback', description: 'Receives authorization code from Google, authenticates user session, sets auth cookies, and redirects to frontend client URL.', responses: { 302: { description: 'Redirect to frontend /auth/callback with JWT credentials' } } } },
      '/auth/google/session-exchange': { post: { tags: ['Authentication'], summary: 'Exchange Google OAuth session token for JWT credentials', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['session_id'], properties: { session_id: { type: 'string' } } } } } }, responses: { 200: { description: 'Success - returns access and refresh tokens' } } } },
      '/auth/forgot-password': { post: { tags: ['Authentication'], summary: 'Request password reset OTP via email/phone', responses: { 200: { description: 'Success' } } } },
      '/auth/reset-password': { post: { tags: ['Authentication'], summary: 'Reset password using verified OTP token', responses: { 200: { description: 'Success' } } } },
      '/auth/refresh-token': { post: { tags: ['Authentication'], summary: 'Rotate access token using refresh token cookie or body payload', responses: { 200: { description: 'Success' } } } },
      '/auth/me': { get: { tags: ['Authentication'], summary: 'Get profile session', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Success' } } } },
      '/auth/switch-role': { patch: { tags: ['Authentication'], summary: 'Switch role', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Success' } } } },
      '/users/me': { get: { tags: ['Users'], summary: 'Get current user profile', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Success' } } }, patch: { tags: ['Users'], summary: 'Update profile', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Success' } } } },
      '/users/me/onboarding-checklist': { get: { tags: ['Onboarding'], summary: 'Get onboarding complete checklist and status', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Success' } } } },
      '/users': { get: { tags: ['Users'], summary: 'Browse user directory', responses: { 200: { description: 'Success' } } } },
      '/users/{id}': { get: { tags: ['Users'], summary: 'Get user profile by ID', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Success' } } } },
      '/users/{id}/follow': { post: { tags: ['Users'], summary: 'Follow user', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Success' } } } },
      '/users/{id}/unfollow': { post: { tags: ['Users'], summary: 'Unfollow user', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Success' } } } },
      '/users/{id}/followers': { get: { tags: ['Users'], summary: 'Get followers', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Success' } } } },
      '/users/{id}/following': { get: { tags: ['Users'], summary: 'Get following profiles', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Success' } } } },
      '/users/{user_id}/trust-score': { get: { tags: ['Users'], summary: 'Fetch user Trust Score metrics', parameters: [{ name: 'user_id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Success' } } } },
      '/onboarding': { get: { tags: ['Onboarding'], summary: 'Evaluate onboarding profile-completion bonus credits eligibility', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Success' } } } },
      '/search': { get: { tags: ['Location & Search'], summary: 'Unified geolocated spatial query matching listings, vendors, creators and reels', parameters: [{ name: 'q', in: 'query', schema: { type: 'string' } }, { name: 'lat', in: 'query', schema: { type: 'number' } }, { name: 'lng', in: 'query', schema: { type: 'number' } }, { name: 'radius', in: 'query', schema: { type: 'number' } }], responses: { 200: { description: 'Success' } } } },
      '/search/suggest': { get: { tags: ['Location & Search'], summary: 'Unified autocomplete query suggestions', parameters: [{ name: 'q', in: 'query', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Success' } } } },
      '/seo/listing/{slug}': { get: { tags: ['SEO'], summary: 'Retrieve structured HTML meta headers payload for listings indexing', parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Success' } } } },
      '/seo/sitemap.xml': { get: { tags: ['SEO'], summary: 'Retrieve dynamic sitemap XML document mapping listings catalog', responses: { 200: { description: 'XML Content' } } } },
      '/seo/robots.txt': { get: { tags: ['SEO'], summary: 'Retrieve public robots crawling allowances config', responses: { 200: { description: 'Text Config' } } } },
      '/identity/aadhaar/verify': { post: { tags: ['Identity'], summary: 'Submit Aadhaar card document details', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['aadhaar_number', 'doc_url'], properties: { aadhaar_number: { type: 'string', pattern: '^\\d{12}$' }, doc_url: { type: 'string' } } } } } }, responses: { 200: { description: 'Success' } } } },
      '/identity/pan/verify': { post: { tags: ['Identity'], summary: 'Submit PAN card document details', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['pan_number', 'doc_url'], properties: { pan_number: { type: 'string', pattern: '^[A-Z]{5}\\d{4}[A-Z]$' }, doc_url: { type: 'string' } } } } } }, responses: { 200: { description: 'Success' } } } },
      '/identity/gst/verify': { post: { tags: ['Identity'], summary: 'Submit GST registration certificate', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['gst_number', 'doc_url'], properties: { gst_number: { type: 'string', pattern: '^\\d{2}[A-Z]{5}\\d{4}[A-Z][A-Z0-9][Z][A-Z0-9]$' }, doc_url: { type: 'string' } } } } } }, responses: { 200: { description: 'Success' } } } },
      '/identity/bank/verify': { post: { tags: ['Identity'], summary: 'Submit bank account details for payout KYC verification', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['account_number', 'ifsc', 'holder_name', 'doc_url'], properties: { account_number: { type: 'string' }, ifsc: { type: 'string' }, holder_name: { type: 'string' }, bank_name: { type: 'string' }, doc_url: { type: 'string' } } } } } }, responses: { 200: { description: 'Success' } } } },
      '/identity/trust-plus/me': { get: { tags: ['Identity'], summary: 'Get current user Trust+ level, badges and rules progress summary', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Success' } } } },
      '/identity/me/status': { get: { tags: ['Identity'], summary: 'Get summary of all identity documents status', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Success' } } } },
      '/identity/me/docs': { get: { tags: ['Identity'], summary: 'List user submitted verification documents', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Success' } } } },
      '/identity/docs/{doc_id}': { delete: { tags: ['Identity'], summary: 'Remove a specific identity document', security: [{ bearerAuth: [] }], parameters: [{ name: 'doc_id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Success' } } } },
      '/kyc/me/submit': { post: { tags: ['KYC & Compliance'], summary: 'Submit standard KYC documents (Self-Serve)', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['doc_type', 'doc_number', 'doc_url'], properties: { doc_type: { type: 'string', enum: ['aadhaar', 'pan', 'driving_license', 'passport'] }, doc_number: { type: 'string' }, doc_url: { type: 'string' }, selfie_url: { type: 'string' } } } } } }, responses: { 200: { description: 'Success' } } } },
      '/kyc/me': { get: { tags: ['KYC & Compliance'], summary: 'Retrieve caller KYC submission details', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Success' } } } },
      '/admin/kyc': { get: { tags: ['Admin Operations'], summary: 'Retrieve pending KYC documents verification queue', security: [{ bearerAuth: [] }], parameters: [{ name: 'status', in: 'query', schema: { type: 'string', enum: ['pending', 'approved', 'rejected'] } }], responses: { 200: { description: 'Success' } } } },
      '/admin/kyc/{kid}/approve': { post: { tags: ['Admin Operations'], summary: 'Approve a pending KYC verification document', security: [{ bearerAuth: [] }], parameters: [{ name: 'kid', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Success' } } } },
      '/admin/kyc/{kid}/reject': { post: { tags: ['Admin Operations'], summary: 'Reject a pending KYC verification document', security: [{ bearerAuth: [] }], parameters: [{ name: 'kid', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { reason: { type: 'string' } } } } } }, responses: { 200: { description: 'Success' } } } },
      '/vendors': { get: { tags: ['Vendors'], summary: 'Browse vendors', responses: { 200: { description: 'Success' } } } },
      '/vendors/{id}': { get: { tags: ['Vendors'], summary: 'Get vendor details', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Success' } } } },
      '/vendors/profile': { patch: { tags: ['Vendors'], summary: 'Update vendor profile', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Success' } } } },
      '/vendor/dashboard': { get: { tags: ['Vendors'], summary: 'Vendor dashboard KPIs', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Success' } } } },
      '/vendor/analytics/overview': { get: { tags: ['Vendors'], summary: 'Vendor sales analytics', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Success' } } } },
      '/creator-marketplace': { get: { tags: ['Creators'], summary: 'Browse creator marketplace', responses: { 200: { description: 'Success' } } } },
      '/creator-marketplace/{id}': { get: { tags: ['Creators'], summary: 'Get creator details', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Success' } } } },
      '/creator/portfolio': { get: { tags: ['Creators'], summary: 'Get portfolio', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Success' } } }, post: { tags: ['Creators'], summary: 'Add portfolio item', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Success' } } } },
      '/creator/rates': { patch: { tags: ['Creators'], summary: 'Update rates', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Success' } } } },
      '/creator/hire': { post: { tags: ['Creators'], summary: 'Hire creator proposal', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Success' } } } },
      '/listings': { get: { tags: ['Listings'], summary: 'Proximity search catalog', responses: { 200: { description: 'Success' } } }, post: { tags: ['Listings'], summary: 'Create listing', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Success' } } } },
      '/listings/{id}': { get: { tags: ['Listings'], summary: 'Listing details', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Success' } } }, put: { tags: ['Listings'], summary: 'Update listing', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Success' } } }, delete: { tags: ['Listings'], summary: 'Delete listing', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Success' } } } },
      '/categories': { get: { tags: ['Listings'], summary: 'Categories taxonomy', responses: { 200: { description: 'Success' } } } },
      '/subscription/plans': { get: { tags: ['Subscriptions'], summary: 'Subscription plans', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Success' } } } },
      '/subscription': { get: { tags: ['Subscriptions'], summary: 'Subscription status', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Success' } } } },
      '/subscription/change': { post: { tags: ['Subscriptions'], summary: 'Change subscription', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Success' } } } },
      '/subscription/purchase-razorpay': { post: { tags: ['Subscriptions'], summary: 'Purchase subscription Razorpay', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Success' } } } },
      '/cart': { get: { tags: ['Cart & Orders'], summary: 'Fetch cart', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Success' } } }, delete: { tags: ['Cart & Orders'], summary: 'Clear cart', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Success' } } } },
      '/cart/add': { post: { tags: ['Cart & Orders'], summary: 'Add to cart', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Success' } } } },
      '/cart/items/{itemId}': { put: { tags: ['Cart & Orders'], summary: 'Update cart quantity', security: [{ bearerAuth: [] }], parameters: [{ name: 'itemId', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Success' } } }, delete: { tags: ['Cart & Orders'], summary: 'Remove cart item', security: [{ bearerAuth: [] }], parameters: [{ name: 'itemId', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Success' } } } },
      '/orders': { get: { tags: ['Cart & Orders'], summary: 'List orders', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Success' } } }, post: { tags: ['Cart & Orders'], summary: 'Checkout order', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Success' } } } },
      '/orders/vendor/me': { get: { tags: ['Cart & Orders'], summary: 'List vendor orders', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Success' } } } },
      '/orders/{id}': { get: { tags: ['Cart & Orders'], summary: 'Order details', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Success' } } } },
      '/orders/{id}/status': { patch: { tags: ['Cart & Orders'], summary: 'Update order status', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Success' } } } },
      '/orders/{id}/cancel': { patch: { tags: ['Cart & Orders'], summary: 'Cancel order', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Success' } } } },
      '/chat/conversations': { get: { tags: ['Chat & Messages'], summary: 'Get conversations', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Success' } } }, post: { tags: ['Chat & Messages'], summary: 'Create conversation', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Success' } } } },
      '/chat/{conversationId}/messages': { get: { tags: ['Chat & Messages'], summary: 'Load thread messages', security: [{ bearerAuth: [] }], parameters: [{ name: 'conversationId', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Success' } } } },
      '/chat/messages': { post: { tags: ['Chat & Messages'], summary: 'Send direct message', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Success' } } } },
      '/notifications': { get: { tags: ['Notifications'], summary: 'Get notifications', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Success' } } } },
      '/notifications/{id}/read': { patch: { tags: ['Notifications'], summary: 'Mark notification read', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Success' } } } },
      '/notifications/read-all': { patch: { tags: ['Notifications'], summary: 'Mark all read', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Success' } } } },
      '/notifications/settings': { get: { tags: ['Notifications'], summary: 'Get notification preferences', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Success' } } }, patch: { tags: ['Notifications'], summary: 'Update notification preferences', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Success' } } } },
      '/reviews': { post: { tags: ['Reviews & Ratings'], summary: 'Submit review', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Success' } } } },
      '/reviews/vendor/{vendorId}': { get: { tags: ['Reviews & Ratings'], summary: 'Get vendor reviews', parameters: [{ name: 'vendorId', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Success' } } } },
      '/reviews/listing/{listingId}': { get: { tags: ['Reviews & Ratings'], summary: 'Get listing reviews', parameters: [{ name: 'listingId', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Success' } } } },
      '/reviews/{id}': { delete: { tags: ['Reviews & Ratings'], summary: 'Delete review', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Success' } } } },
      '/reviews/{id}/helpful': { post: { tags: ['Reviews & Ratings'], summary: 'Vote review helpful', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Success' } } } },
      '/reels': { get: { tags: ['Reels'], summary: 'Video reels feed', responses: { 200: { description: 'Success' } } }, post: { tags: ['Reels'], summary: 'Upload reel', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Success' } } } },
      '/reels/{id}/product-details': { get: { tags: ['Reels'], summary: 'Fetch full product, service & vendor details for a reel', description: 'Returns comprehensive details for a video reel including tagged product/service specs, pricing, MRP, discount percentage, images, and vendor shop profile.', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Success' }, 404: { description: 'Reel not found' } } } },
      '/requirements': { post: { tags: ['Requirements & Bidding'], summary: 'Post requirement brief', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Success' } } }, get: { tags: ['Requirements & Bidding'], summary: 'Browse open briefs', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Success' } } } },
      '/requirements/quotes': { post: { tags: ['Requirements & Bidding'], summary: 'Submit vendor quote', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Success' } } } },
      '/wallet/transactions': { get: { tags: ['Wallet & Ledger'], summary: 'Transaction history', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Success' } } } },
      '/wallet/recharge': { post: { tags: ['Wallet & Ledger'], summary: 'Recharge wallet Razorpay', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Success' } } } },
      '/ai/generate-copy': { post: { tags: ['AI Services'], summary: 'Generate AI description copy', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Success' } } } },
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
        description: `URL path parameter ${name}`,
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
    chat: 'Chat & Messages',
    notifications: 'Notifications',
    reviews: 'Reviews & Ratings',
    ai: 'AI Services',
    analytics: 'Analytics',
    kyc: 'KYC & Compliance',
    offers: 'Offers & Campaigns',
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
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'BizReels API Documentation',
};

module.exports = {
  swaggerUi,
  swaggerSpec: baseSwaggerSpec,
  getSwaggerSpec,
  serve: swaggerUi.serve,
  setup: (app) => swaggerUi.setup(getSwaggerSpec(app), customUiOptions),
};

