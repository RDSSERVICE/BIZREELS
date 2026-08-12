const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
const path = require('path');

// Eager load all router modules so Express route stack is fully populated
try {
  const routesDir = path.join(__dirname, '../routes');
  if (fs.existsSync(routesDir)) {
    fs.readdirSync(routesDir).forEach((file) => {
      if (file.endsWith('.js') && file !== 'index.js') {
        try { require(path.join(routesDir, file)); } catch (e) {}
      }
    });
  }
} catch (e) {}

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
    ],
    paths: {
      '/auth/register': { post: { tags: ['Authentication'], summary: 'Register account', responses: { 201: { description: 'Success' } } } },
      '/auth/login': { post: { tags: ['Authentication'], summary: 'User login', responses: { 200: { description: 'Success' } } } },
      '/auth/otp/request': { post: { tags: ['Authentication'], summary: 'Request OTP', responses: { 200: { description: 'Success' } } } },
      '/auth/otp/verify': { post: { tags: ['Authentication'], summary: 'Verify OTP', responses: { 200: { description: 'Success' } } } },
      '/auth/me': { get: { tags: ['Authentication'], summary: 'Get profile session', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Success' } } } },
      '/auth/switch-role': { patch: { tags: ['Authentication'], summary: 'Switch role', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Success' } } } },
      '/users/me': { get: { tags: ['Users'], summary: 'Get current user profile', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Success' } } }, patch: { tags: ['Users'], summary: 'Update profile', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Success' } } } },
      '/users': { get: { tags: ['Users'], summary: 'Browse user directory', responses: { 200: { description: 'Success' } } } },
      '/users/{id}': { get: { tags: ['Users'], summary: 'Get user profile by ID', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Success' } } } },
      '/users/{id}/follow': { post: { tags: ['Users'], summary: 'Follow user', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Success' } } } },
      '/users/{id}/unfollow': { post: { tags: ['Users'], summary: 'Unfollow user', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Success' } } } },
      '/users/{id}/followers': { get: { tags: ['Users'], summary: 'Get followers', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Success' } } } },
      '/users/{id}/following': { get: { tags: ['Users'], summary: 'Get following profiles', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Success' } } } },
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
      '/orders/{id}': { get: { tags: ['Cart & Orders'], summary: 'Order details', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Success' } } } },
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

/**
 * Recursively inspects Express app router stack to auto-document any present or future API routes.
 */
function autoDiscoverExpressRoutes(app, spec) {
  if (!app || !app._router || !app._router.stack) return spec;

  const discoveredPaths = { ...spec.paths };

  function processLayer(layer, pathPrefix = '') {
    if (layer.route) {
      const fullPath = (pathPrefix + layer.route.path).replace(/\/+/g, '/');
      const cleanPath = fullPath.replace(/^\/api\/v1/, '').replace(/^\/api/, '').replace(/^\/v1/, '') || '/';

      if (!layer.route.methods) return;

      Object.keys(layer.route.methods).forEach((method) => {
        if (!layer.route.methods[method]) return;
        const httpMethod = method.toLowerCase();

        if (!discoveredPaths[cleanPath]) {
          discoveredPaths[cleanPath] = {};
        }

        if (!discoveredPaths[cleanPath][httpMethod]) {
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
            admin: 'Admin Operations',
          };

          const tag = tagMap[rawTag.toLowerCase()] || (rawTag.charAt(0).toUpperCase() + rawTag.slice(1));
          const formattedSummary = `${httpMethod.toUpperCase()} ${cleanPath}`;

          discoveredPaths[cleanPath][httpMethod] = {
            tags: [tag],
            summary: formattedSummary,
            description: `Auto-discovered route: ${httpMethod.toUpperCase()} ${cleanPath}`,
            responses: {
              200: {
                description: 'Successful response',
                content: {
                  'application/json': {
                    schema: { $ref: '#/components/schemas/ApiResponse' },
                  },
                },
              },
              400: { description: 'Validation error' },
              401: { description: 'Unauthorized' },
            },
          };

          if (!cleanPath.startsWith('/auth/login') && !cleanPath.startsWith('/auth/register') && cleanPath !== '/health' && cleanPath !== '/') {
            discoveredPaths[cleanPath][httpMethod].security = [{ bearerAuth: [] }];
          }
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
