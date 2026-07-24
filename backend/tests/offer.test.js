const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Offer = require('../src/models/Offer');
const { AuditLog } = require('../src/models/Misc');

const getMockDb = () => {
  if (!global.mockDb) {
    global.mockDb = {
      users: {},
      offers: {},
      auditLogs: []
    };
  }
  if (!global.mockDb.offers) global.mockDb.offers = {};
  if (!global.mockDb.auditLogs) global.mockDb.auditLogs = [];
  return global.mockDb;
};

// Mock User finding
jest.spyOn(User, 'findById').mockImplementation((id) => {
  const user = getMockDb().users[id.toString()];
  const queryObj = {
    select: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    then: (resolve) => resolve(user || null)
  };
  return queryObj;
});

// Mock Mongoose Offer model queries
jest.spyOn(Offer, 'find').mockImplementation((query) => {
  let list = Object.values(getMockDb().offers).filter(o => !o.isDeleted);
  if (query && query.status) {
    list = list.filter(o => o.status === query.status);
  }
  if (query && query.targetRoles && query.targetRoles.$in) {
    const roles = query.targetRoles.$in;
    list = list.filter(o => o.targetRoles.some(r => roles.includes(r)));
  }
  
  const queryObj = {
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockImplementation((limitVal) => {
      return {
        lean: jest.fn().mockResolvedValue(list.slice(0, limitVal)),
        then: (resolve) => resolve(list.slice(0, limitVal))
      };
    }),
    lean: jest.fn().mockResolvedValue(list),
    then: (resolve) => resolve(list)
  };
  return queryObj;
});

jest.spyOn(Offer, 'findOne').mockImplementation((query) => {
  const idStr = query._id ? query._id.toString() : '';
  const offer = getMockDb().offers[idStr];
  
  const queryObj = {
    populate: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(offer || null),
    then: (resolve) => resolve(offer || null)
  };
  return queryObj;
});

jest.spyOn(Offer, 'countDocuments').mockImplementation(() => {
  return Promise.resolve(Object.values(getMockDb().offers).filter(o => !o.isDeleted).length);
});

jest.spyOn(Offer, 'updateMany').mockResolvedValue({ acknowledged: true, modifiedCount: 1 });
jest.spyOn(Offer, 'findOneAndUpdate').mockImplementation((query, update) => {
  const idStr = query._id ? query._id.toString() : '';
  const offer = getMockDb().offers[idStr];
  if (!offer) return { then: (resolve) => resolve(null) };
  
  if (update.$inc) {
    if (update.$inc['analytics.clicksCount']) {
      offer.analytics = offer.analytics || { viewsCount: 0, clicksCount: 0 };
      offer.analytics.clicksCount += update.$inc['analytics.clicksCount'];
    }
  }
  return { then: (resolve) => resolve(offer) };
});

// Mock Offer save prototype
jest.spyOn(Offer.prototype, 'save').mockImplementation(function() {
  const id = this._id ? this._id.toString() : new mongoose.Types.ObjectId().toString();
  this._id = id;
  this.id = id;
  
  const now = new Date();
  if (this.startTime && this.endTime) {
    const diffMs = this.endTime.getTime() - this.startTime.getTime();
    if (diffMs > 0) {
      const diffMins = Math.floor(diffMs / 60000);
      const days = Math.floor(diffMins / 1440);
      const hours = Math.floor((diffMins % 1440) / 60);
      const mins = diffMins % 60;
      let durationStr = '';
      if (days > 0) durationStr += `${days}d `;
      if (hours > 0) durationStr += `${hours}h `;
      if (mins > 0 || durationStr === '') durationStr += `${mins}m`;
      this.duration = durationStr.trim();
    } else {
      this.duration = '0m';
    }
  }
  if (this.status !== 'Draft' && this.status !== 'Disabled') {
    if (this.startTime > now) {
      this.status = 'Scheduled';
    } else if (this.startTime <= now && this.endTime > now) {
      this.status = 'Active';
    } else if (this.endTime <= now) {
      this.status = 'Expired';
    }
  }

  const offerObj = {
    _id: this._id,
    id: this.id,
    title: this.title,
    description: this.description,
    code: this.code,
    targetRoles: this.targetRoles,
    discountType: this.discountType,
    discountValue: this.discountValue,
    minOrderAmount: this.minOrderAmount,
    maxDiscountLimit: this.maxDiscountLimit,
    usageLimit: this.usageLimit,
    perUserLimit: this.perUserLimit,
    startTime: this.startTime,
    endTime: this.endTime,
    timezone: this.timezone,
    duration: this.duration,
    status: this.status,
    priority: this.priority,
    terms: this.terms,
    image: this.image,
    applicableCategories: this.applicableCategories,
    applicableProducts: this.applicableProducts,
    applicableServices: this.applicableServices,
    createdBy: this.createdBy,
    usedCount: this.usedCount || 0,
    recipientCount: this.recipientCount || 0,
    analytics: this.analytics || { viewsCount: 0, clicksCount: 0 },
    redemptions: this.redemptions || [],
    notificationStatus: this.notificationStatus || { sent: false, sentAt: null, deliveryRate: 0 },
    isDeleted: this.isDeleted || false
  };

  getMockDb().offers[id] = offerObj;
  return Promise.resolve(this);
});

// Mock AuditLog
jest.spyOn(AuditLog, 'create').mockImplementation((logData) => {
  getMockDb().auditLogs.push(logData);
  return Promise.resolve(logData);
});

describe('Real-Time Offer Campaign Management API Suite', () => {
  let adminToken;
  let customerToken;
  let adminId;
  let customerId;
  let offerId;

  beforeAll(async () => {
    adminId = new mongoose.Types.ObjectId().toString();
    customerId = new mongoose.Types.ObjectId().toString();

    // Setup mock admin user
    getMockDb().users[adminId] = {
      _id: adminId,
      name: 'Super Admin',
      email: 'admin@bizreels.com',
      roles: ['admin', 'customer'],
      activeRole: 'admin'
    };

    // Setup mock customer user
    getMockDb().users[customerId] = {
      _id: customerId,
      name: 'Regular Customer',
      email: 'customer@bizreels.com',
      roles: ['customer'],
      activeRole: 'customer'
    };

    // Generate mock tokens (JWT authentication middleware is verified elsewhere; we use signed tokens)
    const jwt = require('jsonwebtoken');
    const config = require('../src/config');
    adminToken = 'Bearer ' + jwt.sign({ userId: adminId }, config.jwt.accessSecret);
    customerToken = 'Bearer ' + jwt.sign({ userId: customerId }, config.jwt.accessSecret);
  });

  beforeEach(() => {
    getMockDb().offers = {};
    getMockDb().auditLogs = [];
  });

  it('POST /api/v1/offers/admin - Admin creates an offer successfully', async () => {
    const res = await request(app)
      .post('/api/v1/offers/admin')
      .set('Authorization', adminToken)
      .send({
        title: 'Monsoon Special Deal',
        description: 'Get discounts during the monsoons',
        code: 'MONSOON50',
        targetRoles: ['customer'],
        discountType: 'fixed',
        discountValue: 50,
        startTime: new Date(Date.now() + 3600000).toISOString(),
        endTime: new Date(Date.now() + 86400000).toISOString(),
        status: 'Scheduled'
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.offer.title).toEqual('Monsoon Special Deal');
    
    // Check if offer saved in mock DB
    const keys = Object.keys(getMockDb().offers);
    expect(keys.length).toBeGreaterThan(0);
    offerId = keys[0];
  });

  it('POST /api/v1/offers/admin - Rejects creation with missing parameters', async () => {
    const res = await request(app)
      .post('/api/v1/offers/admin')
      .set('Authorization', adminToken)
      .send({
        title: 'Broken Offer'
      });

    expect(res.statusCode).toEqual(400);
  });

  it('POST /api/v1/offers/admin - Rejects non-admin users', async () => {
    const res = await request(app)
      .post('/api/v1/offers/admin')
      .set('Authorization', customerToken)
      .send({
        title: 'Hack Offer',
        description: 'Should fail',
        discountType: 'fixed',
        discountValue: 100,
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString()
      });

    expect(res.statusCode).toEqual(403);
  });

  it('GET /api/v1/offers/active - Client fetches active offers list', async () => {
    // Inject active offer in mock DB
    const mockId = new mongoose.Types.ObjectId().toString();
    const activeOffer = {
      _id: mockId,
      id: mockId,
      title: 'Active Deal 1',
      description: 'Active for all customers',
      targetRoles: ['customer'],
      discountType: 'percentage',
      discountValue: 15,
      startTime: new Date(Date.now() - 3600000),
      endTime: new Date(Date.now() + 3600000),
      status: 'Active',
      isDeleted: false
    };
    
    getMockDb().offers[mockId] = activeOffer;

    const res = await request(app)
      .get('/api/v1/offers/active')
      .set('Authorization', customerToken);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.items.length).toBe(1);
    expect(res.body.items[0].title).toEqual('Active Deal 1');
  });

  it('POST /api/v1/offers/:id/click - Increments clicks in analytics', async () => {
    const mockId = new mongoose.Types.ObjectId().toString();
    getMockDb().offers[mockId] = {
      _id: mockId,
      id: mockId,
      title: 'Active Deal 1',
      description: 'Active',
      targetRoles: ['customer'],
      status: 'Active',
      analytics: { viewsCount: 0, clicksCount: 0 },
      isDeleted: false
    };

    const res = await request(app)
      .post(`/api/v1/offers/${mockId}/click`)
      .set('Authorization', customerToken);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(getMockDb().offers[mockId].analytics.clicksCount).toBe(1);
  });
});
