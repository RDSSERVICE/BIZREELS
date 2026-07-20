const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');

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

// Mock AnalyticsRepository
jest.mock('../src/repositories/analyticsRepository', () => {
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
    logEvent: jest.fn().mockImplementation((eventData) => {
      const mockMongoose = require('mongoose');
      const id = new mockMongoose.Types.ObjectId().toString();
      const event = {
        _id: id,
        ...eventData,
      };
      getMockDbLocal().analytics.push(event);
      return event;
    }),
    fetchEventSummary: jest.fn().mockImplementation(({ type }) => {
      const events = getMockDbLocal().analytics.filter((e) => !type || e.type === type);
      return [
        {
          _id: type || 'listing_click',
          totalCount: events.length,
        },
      ];
    }),
  };
});

describe('Traffic Metrics & Analytics API Suite', () => {
  let adminToken;
  let clientToken;

  beforeAll(async () => {
    const adminId = new mongoose.Types.ObjectId().toString();
    const customerId = new mongoose.Types.ObjectId().toString();

    global.mockDb = {
      users: {},
      listings: {},
      requirements: {},
      quotes: {},
      reviews: {},
      analytics: [],
    };

    // Register Admin & Customer users
    getMockDb().users[adminId] = {
      _id: adminId,
      name: 'Test Admin',
      email: 'testadmin@example.com',
      roles: ['admin'],
      activeRole: 'admin',
      toObject: function() { return this; },
    };

    getMockDb().users[customerId] = {
      _id: customerId,
      name: 'Test Customer',
      email: 'testcustomer@example.com',
      roles: ['customer'],
      activeRole: 'customer',
      toObject: function() { return this; },
    };

    const authService = require('../src/services/auth.service');
    adminToken = authService.generateAccessToken(getMockDb().users[adminId]);
    clientToken = authService.generateAccessToken(getMockDb().users[customerId]);
  });

  it('1. Should allow standard users to track views and click events', async () => {
    const res = await request(app)
      .post('/api/v1/analytics')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        type: 'listing_click',
        targetId: new mongoose.Types.ObjectId().toString(),
        metadata: {
          category: 'Electronics',
        },
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.event).toBeDefined();
    expect(res.body.data.event.type).toBe('listing_click');
  });

  it('2. Should block standard users from reading analytics summaries', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/summary')
      .set('Authorization', `Bearer ${clientToken}`)
      .query({ type: 'listing_click' });

    expect(res.status).toBe(403);
  });

  it('3. Should allow admin users to query metrics summaries successfully', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/summary')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ type: 'listing_click' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.summary).toBeDefined();
    expect(res.body.data.summary.length).toBeGreaterThan(0);
    expect(res.body.data.summary[0]._id).toBe('listing_click');
  });
});
