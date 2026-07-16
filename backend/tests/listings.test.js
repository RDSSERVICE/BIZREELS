const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Listing = require('../src/models/Listing');

const getMockDb = () => {
  if (!global.mockDb) {
    global.mockDb = {
      users: {},
      listings: {},
      requirements: {},
      quotes: {},
      reviews: {},
      analytics: [],
    };
  }
  return global.mockDb;
};

// Mock User queries in middleware
jest.spyOn(User, 'findById').mockImplementation((id) => {
  const user = getMockDb().users[id.toString()];
  return {
    select: jest.fn().mockReturnThis(),
    lean: jest.fn().mockImplementation(() => {
      if (!user) return null;
      return user;
    }),
  };
});

// Mock ListingRepository
jest.mock('../src/repositories/listingRepository', () => {
  const getMockDbLocal = () => {
    if (!global.mockDb) {
      global.mockDb = {
        users: {},
        listings: {},
        requirements: {},
        quotes: {},
        reviews: {},
        analytics: [],
      };
    }
    return global.mockDb;
  };

  return {
    createListing: jest.fn().mockImplementation((listingData) => {
      const mockMongoose = require('mongoose');
      const id = new mockMongoose.Types.ObjectId().toString();
      const listing = {
        _id: id,
        ...listingData,
        createdAt: new Date(),
      };
      getMockDbLocal().listings[id] = listing;
      return listing;
    }),
    findListingById: jest.fn().mockImplementation((id) => {
      return getMockDbLocal().listings[id.toString()] || null;
    }),
    updateListing: jest.fn().mockImplementation((id, vendorId, updateData) => {
      const listing = getMockDbLocal().listings[id.toString()];
      if (listing) {
        Object.assign(listing, updateData);
      }
      return listing;
    }),
    softDeleteListing: jest.fn().mockImplementation((id, vendorId) => {
      const listing = getMockDbLocal().listings[id.toString()];
      if (listing) {
        listing.isDeleted = true;
        listing.deletedAt = new Date();
      }
      return listing;
    }),
    queryListings: jest.fn().mockImplementation(() => {
      return {
        listings: Object.values(getMockDbLocal().listings).filter(l => !l.isDeleted),
        total: Object.values(getMockDbLocal().listings).filter(l => !l.isDeleted).length,
      };
    }),
    logListingAction: jest.fn().mockResolvedValue(true),
  };
});

describe('Product & Service Catalog Listings API Suite', () => {
  let vendorToken;
  let listingId;

  beforeAll(async () => {
    // Register and login mock vendor
    const vendorId = new mongoose.Types.ObjectId().toString();
    getMockDb().users[vendorId] = {
      _id: vendorId,
      name: 'Test Vendor',
      email: 'testvendor@example.com',
      roles: ['vendor'],
      activeRole: 'vendor',
      toObject: function() { return this; },
    };

    const authService = require('../src/services/authService');
    vendorToken = authService.generateAccessToken(getMockDb().users[vendorId]);
  });

  it('1. Should create a new listing product successfully', async () => {
    const res = await request(app)
      .post('/api/v1/listings')
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({
        type: 'product',
        title: 'Test Listing Wireless Speaker',
        category: 'Electronics',
        price: 2999,
        description: 'A premium speaker with deep bass.',
        condition: 'new',
        lat: 28.6139,
        lng: 77.2090,
        address: 'Connaught Place, New Delhi',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.listing).toBeDefined();
    expect(res.body.data.listing.title).toBe('Test Listing Wireless Speaker');
    
    listingId = res.body.data.listing._id;
  });

  it('2. Should retrieve listings with proximity filters', async () => {
    const res = await request(app)
      .get('/api/v1/listings')
      .query({
        lat: 28.6139,
        lng: 77.2090,
        distance: 10,
        type: 'product',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });

  it('3. Should fetch single listing details successfully', async () => {
    const res = await request(app)
      .get(`/api/v1/listings/${listingId}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.listing._id).toBe(listingId);
  });

  it('4. Should soft delete a listing successfully', async () => {
    const res = await request(app)
      .delete(`/api/v1/listings/${listingId}`)
      .set('Authorization', `Bearer ${vendorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/deleted successfully/i);
  });
});
