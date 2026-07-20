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

// Mock RequirementRepository
jest.mock('../src/repositories/requirementRepository', () => {
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
    createRequirement: jest.fn().mockImplementation((reqData) => {
      const mockMongoose = require('mongoose');
      const id = new mockMongoose.Types.ObjectId().toString();
      const requirement = {
        _id: id,
        ...reqData,
        status: 'open',
      };
      getMockDbLocal().requirements[id] = requirement;
      return requirement;
    }),
    findRequirementById: jest.fn().mockImplementation((id) => {
      const req = getMockDbLocal().requirements[id.toString()];
      if (!req) return null;
      // Populate customer
      const customerUser = getMockDbLocal().users[req.customer];
      return {
        ...req,
        customer: customerUser || { _id: req.customer, name: 'Customer' },
      };
    }),
    checkVendorHasQuoted: jest.fn().mockResolvedValue(false),
    createQuote: jest.fn().mockImplementation((quoteData) => {
      const mockMongoose = require('mongoose');
      const id = new mockMongoose.Types.ObjectId().toString();
      const quote = {
        _id: id,
        ...quoteData,
        status: 'pending',
      };
      getMockDbLocal().quotes[id] = quote;
      return quote;
    }),
    findQuoteById: jest.fn().mockImplementation((id) => {
      const quote = getMockDbLocal().quotes[id.toString()];
      if (!quote) return null;
      
      // Populate requirement (keep customer as unpopulated ID string)
      const req = getMockDbLocal().requirements[quote.requirement];
      const reqPopulated = req ? {
        ...req,
        customer: req.customer,
      } : null;

      return {
        ...quote,
        requirement: reqPopulated,
        vendor: getMockDbLocal().users[quote.vendor] || { _id: quote.vendor, name: 'Vendor' },
      };
    }),
    getQuotesForRequirement: jest.fn().mockImplementation((reqId) => {
      const quotes = Object.values(getMockDbLocal().quotes).filter(q => q.requirement === reqId);
      return quotes.map(q => ({
        ...q,
        vendor: getMockDbLocal().users[q.vendor] || { _id: q.vendor, name: 'Vendor' }
      }));
    }),
    updateQuoteStatus: jest.fn().mockImplementation((id, status) => {
      const quote = getMockDbLocal().quotes[id.toString()];
      if (quote) {
        quote.status = status;
        if (status === 'accepted') quote.paymentStatus = 'paid';
      }
      return quote;
    }),
    logAudit: jest.fn().mockResolvedValue(true),
  };
});

// Mock WalletRepository
jest.mock('../src/repositories/walletRepository', () => {
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
    updateWalletBalance: jest.fn().mockImplementation((userId, amount) => {
      const user = getMockDbLocal().users[userId.toString()];
      if (user) {
        user.walletBalance = (user.walletBalance || 0) + amount;
      }
      return { user, transaction: {} };
    }),
  };
});

// Mock Requirement mongoose model updates
jest.mock('../src/models/Requirement', () => {
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
    findByIdAndUpdate: jest.fn().mockImplementation((id, update) => {
      const req = getMockDbLocal().requirements[id.toString()];
      if (req) {
        Object.assign(req, update);
      }
      return req;
    }),
  };
});

// Mock Quote mongoose model updates
jest.mock('../src/models/Quote', () => {
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
    findByIdAndUpdate: jest.fn().mockImplementation((id, update) => {
      const quote = getMockDbLocal().quotes[id.toString()];
      if (quote) {
        Object.assign(quote, update);
      }
      return {
        populate: jest.fn().mockResolvedValue(quote),
      };
    }),
  };
});

// Mock Notification model methods to prevent database calls
jest.mock('../src/models/Notification', () => {
  return {
    create: jest.fn().mockImplementation((data) => {
      return {
        _id: 'mock-notification-id',
        ...data,
      };
    }),
  };
});

describe('Requirements & Quoting Bidding API Suite', () => {
  let customerToken;
  let vendorToken;
  let requirementId;
  let quoteId;
  let customerId;
  let vendorId;

  beforeAll(async () => {
    customerId = new mongoose.Types.ObjectId().toString();
    vendorId = new mongoose.Types.ObjectId().toString();

    global.mockDb = {
      users: {},
      listings: {},
      requirements: {},
      quotes: {},
      reviews: {},
      analytics: [],
    };

    getMockDb().users[customerId] = {
      _id: customerId,
      name: 'Test Customer',
      email: 'testcustomer@example.com',
      roles: ['customer'],
      activeRole: 'customer',
      walletBalance: 10000,
      toObject: function() { return this; },
    };

    getMockDb().users[vendorId] = {
      _id: vendorId,
      name: 'Test Vendor',
      email: 'testvendor@example.com',
      roles: ['vendor'],
      activeRole: 'vendor',
      walletBalance: 0,
      toObject: function() { return this; },
    };

    const authService = require('../src/services/auth.service');
    customerToken = authService.generateAccessToken(getMockDb().users[customerId]);
    vendorToken = authService.generateAccessToken(getMockDb().users[vendorId]);
  });

  it('1. Should post a custom requirement brief successfully', async () => {
    const res = await request(app)
      .post('/api/v1/requirements')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        title: 'Test Requirement Catering Party',
        description: 'Need catering service for 50 people.',
        category: 'Food & Catering',
        budget: 5000,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        lat: 28.6139,
        lng: 77.2090,
        address: 'Connaught Place, New Delhi',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.requirement).toBeDefined();
    expect(res.body.data.requirement.title).toBe('Test Requirement Catering Party');

    requirementId = res.body.data.requirement._id;
  });

  it('2. Should allow a vendor to submit a quote bid on a requirement', async () => {
    const res = await request(app)
      .post('/api/v1/requirements/quotes')
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({
        requirementId,
        price: 4500,
        notes: 'I can provide delicious food for your party.',
        estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      });

    if (res.status !== 201) {
      console.log('Quote post failed validation/execution. Response body:', JSON.stringify(res.body, null, 2));
    }

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.quote).toBeDefined();
    expect(res.body.data.quote.price).toBe(4500);

    quoteId = res.body.data.quote._id;
  });

  it('3. Should fetch quotes submitted for the requirement', async () => {
    const res = await request(app)
      .get(`/api/v1/requirements/${requirementId}/quotes`)
      .set('Authorization', `Bearer ${customerToken}`);

    if (res.status !== 200) {
      console.log('Fetch quotes failed. Response body:', JSON.stringify(res.body, null, 2));
    }

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.quotes).toBeDefined();
  });

  it('4. Should settle payment on quote acceptance', async () => {
    const res = await request(app)
      .patch(`/api/v1/requirements/quotes/${quoteId}`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        status: 'accepted',
      });

    if (res.status !== 200) {
      console.log('Update quote status failed. Response body:', JSON.stringify(res.body, null, 2));
    }

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.quote.status).toBe('accepted');
    expect(res.body.data.quote.paymentStatus).toBe('paid');

    // Verify customer wallet balance was debited
    expect(getMockDb().users[customerId].walletBalance).toBe(5500); // 10000 - 4500

    // Verify vendor wallet balance was credited
    expect(getMockDb().users[vendorId].walletBalance).toBe(4500);
  });
});
