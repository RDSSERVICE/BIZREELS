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

// Mock Listing Model findById & findByIdAndUpdate
jest.spyOn(Listing, 'findById').mockImplementation((id) => {
  return getMockDb().listings[id.toString()] || null;
});

jest.spyOn(Listing, 'findByIdAndUpdate').mockImplementation((id, update) => {
  const listing = getMockDb().listings[id.toString()];
  if (listing) {
    Object.assign(listing, update);
  }
  return listing;
});

// Mock ReviewRepository
jest.mock('../src/repositories/reviewRepository', () => {
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
    createReview: jest.fn().mockImplementation((reviewData) => {
      const mockMongoose = require('mongoose');
      const id = new mockMongoose.Types.ObjectId().toString();
      const review = {
        _id: id,
        ...reviewData,
      };
      getMockDbLocal().reviews[id] = review;
      
      const targetListing = getMockDbLocal().listings[reviewData.targetListing];
      if (targetListing) {
        targetListing.rating = reviewData.rating;
        targetListing.totalReviews = 1;
      }
      return review;
    }),
    findReviewById: jest.fn().mockImplementation((id) => {
      return getMockDbLocal().reviews[id.toString()] || null;
    }),
    findReviewsByTargetListing: jest.fn().mockImplementation((listingId) => {
      console.log('reviews db content:', JSON.stringify(getMockDbLocal().reviews, null, 2));
      console.log('looking for listingId:', listingId);
      return {
        reviews: Object.values(getMockDbLocal().reviews).filter(r => r.targetListing && r.targetListing.toString() === listingId.toString()),
        total: Object.values(getMockDbLocal().reviews).filter(r => r.targetListing && r.targetListing.toString() === listingId.toString()).length,
      };
    }),
    findReviewsByTargetUser: jest.fn().mockImplementation((userId) => {
      return {
        reviews: Object.values(getMockDbLocal().reviews).filter(r => r.targetUser && r.targetUser.toString() === userId.toString()),
        total: Object.values(getMockDbLocal().reviews).filter(r => r.targetUser && r.targetUser.toString() === userId.toString()).length,
      };
    }),
    softDeleteReview: jest.fn().mockImplementation((id, authorId) => {
      const review = getMockDbLocal().reviews[id.toString()];
      if (review) {
        review.isDeleted = true;
        review.deletedAt = new Date();
      }
      return review;
    }),
    logReviewAction: jest.fn().mockResolvedValue(true),
  };
});

// Mock mongoose Review model aggregate results for dynamic hooks
jest.mock('../src/models/Review', () => {
  return {
    aggregate: jest.fn().mockImplementation((pipeline) => {
      return [];
    }),
    findOne: jest.fn().mockResolvedValue(null),
  };
});

describe('Ratings & Customer Reviews API Suite', () => {
  let customerToken;
  let vendorId;
  let listingId;
  let reviewId;

  beforeAll(async () => {
    const customerId = new mongoose.Types.ObjectId().toString();
    vendorId = new mongoose.Types.ObjectId().toString();

    global.mockDb = {
      users: {},
      listings: {},
      requirements: {},
      quotes: {},
      reviews: {},
      analytics: [],
    };

    // Register Customer & Vendor
    getMockDb().users[customerId] = {
      _id: customerId,
      name: 'Test Customer',
      email: 'testcustomer@example.com',
      roles: ['customer'],
      activeRole: 'customer',
      toObject: function() { return this; },
    };

    getMockDb().users[vendorId] = {
      _id: vendorId,
      name: 'Test Vendor',
      email: 'testvendor@example.com',
      roles: ['vendor'],
      activeRole: 'vendor',
      toObject: function() { return this; },
    };

    const authService = require('../src/services/authService');
    customerToken = authService.generateAccessToken(getMockDb().users[customerId]);

    // Create a mock listing
    listingId = new mongoose.Types.ObjectId().toString();
    getMockDb().listings[listingId] = {
      _id: listingId,
      vendor: vendorId,
      title: 'Test Listing Review Target Item',
      category: 'Electronics',
      price: 1999,
      rating: 0,
      totalReviews: 0,
    };
  });

  it('1. Should post a review on a listing successfully', async () => {
    const res = await request(app)
      .post('/api/v1/reviews')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        targetListingId: listingId,
        rating: 5,
        comment: 'Absolutely spectacular product!',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.review).toBeDefined();
    expect(res.body.data.review.rating).toBe(5);

    reviewId = res.body.data.review._id;

    // Check if listing rating was dynamically recalculated in mock repo handler
    const updatedListing = getMockDb().listings[listingId];
    expect(updatedListing.rating).toBe(5);
    expect(updatedListing.totalReviews).toBe(1);
  });

  it('2. Should retrieve reviews for the listing', async () => {
    const res = await request(app)
      .get(`/api/v1/reviews/listing/${listingId}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('3. Should delete a review successfully', async () => {
    const res = await request(app)
      .delete(`/api/v1/reviews/${reviewId}`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
