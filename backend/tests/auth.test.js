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

// Mock User queries in middleware & services
jest.spyOn(User, 'findById').mockImplementation((id) => {
  const user = getMockDb().users[id.toString()];
  return {
    select: jest.fn().mockReturnThis(),
    lean: jest.fn().mockImplementation(() => {
      if (!user) return null;
      return { ...user, toObject: () => user };
    }),
    session: jest.fn().mockReturnThis(),
  };
});

jest.spyOn(User, 'findOne').mockImplementation((query) => {
  let user;
  if (query.email) {
    user = Object.values(getMockDb().users).find((u) => u.email === query.email);
  }
  return user || null;
});

// Mock AuthRepository to store users in memory
jest.mock('../src/repositories/authRepository', () => {
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
    createUser: jest.fn().mockImplementation((userData) => {
      const mockMongoose = require('mongoose');
      const id = new mockMongoose.Types.ObjectId().toString();
      const user = {
        _id: id,
        ...userData,
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockImplementation(function () {
          getMockDbLocal().users[id] = this;
          return this;
        }),
      };
      getMockDbLocal().users[id] = user;
      return user;
    }),
    findUserByEmail: jest.fn().mockImplementation((email) => {
      return Object.values(getMockDbLocal().users).find((u) => u.email === email) || null;
    }),
    findUserById: jest.fn().mockImplementation((id) => {
      return getMockDbLocal().users[id.toString()] || null;
    }),
    updateUser: jest.fn().mockImplementation((id, data) => {
      const user = getMockDbLocal().users[id.toString()];
      if (user) {
        if (data.$push && data.$push.roles) {
          user.roles.push(data.$push.roles);
        }
        Object.assign(user, data);
      }
      return user;
    }),
    createRefreshToken: jest.fn().mockResolvedValue(true),
    createAuditLog: jest.fn().mockResolvedValue(true),
  };
});

describe('Authentication & Workspace Roles API Suite', () => {
  let accessToken;

  beforeEach(() => {
    getMockDb().users = {};
  });

  it('1. Should register a new user successfully', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Test Customer',
        email: 'testcustomer@example.com',
        password: 'Password123!',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.email).toBe('testcustomer@example.com');
  });

  it('1b. Should register a second user without phone number without phone collision', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'User 2',
        email: 'user2@gmail.com',
        password: 'User@123',
        role: 'customer',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('user2@gmail.com');
  });

  it('2. Should login user successfully and return tokens', async () => {
    // Seed user first
    const mockMongoose = require('mongoose');
    const id = new mockMongoose.Types.ObjectId().toString();
    getMockDb().users[id] = {
      _id: id,
      name: 'Test Customer',
      email: 'testcustomer@example.com',
      password: 'Password123!',
      roles: ['customer'],
      activeRole: 'customer',
      comparePassword: jest.fn().mockResolvedValue(true),
      save: jest.fn().mockResolvedValue(true),
      isLocked: () => false,
    };

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'testcustomer@example.com',
        password: 'Password123!',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    
    accessToken = res.body.data.accessToken;
  });

  it('3. Should switch active role successfully', async () => {
    // Seed user with roles
    const mockMongoose = require('mongoose');
    const id = new mockMongoose.Types.ObjectId().toString();
    const mockUser = {
      _id: id,
      name: 'Test Customer',
      email: 'testcustomer@example.com',
      roles: ['customer', 'vendor'],
      activeRole: 'customer',
      vendorProfile: { shopName: 'Test Shop' },
      toObject: function() { return this; },
      save: jest.fn().mockResolvedValue(this),
    };
    getMockDb().users[id] = mockUser;

    const authService = require('../src/services/auth.service');
    const token = authService.generateAccessToken(mockUser);

    const res = await request(app)
      .patch('/api/v1/auth/switch-role')
      .set('Authorization', `Bearer ${token}`)
      .send({
        role: 'vendor',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.activeRole).toBe('vendor');
    expect(res.body.data.redirectTo).toBe('/vendor/dashboard');
  });

  it('4. Should reject switching to unauthorized or invalid roles', async () => {
    // Seed user
    const mockMongoose = require('mongoose');
    const id = new mockMongoose.Types.ObjectId().toString();
    const mockUser = {
      _id: id,
      name: 'Test Customer',
      email: 'testcustomer@example.com',
      roles: ['customer'],
      activeRole: 'customer',
      toObject: function() { return this; },
      save: jest.fn().mockResolvedValue(this),
    };
    getMockDb().users[id] = mockUser;

    const authService = require('../src/services/auth.service');
    const token = authService.generateAccessToken(mockUser);

    const res = await request(app)
      .patch('/api/v1/auth/switch-role')
      .set('Authorization', `Bearer ${token}`)
      .send({
        role: 'invalid_role',
      });

    expect(res.status).toBe(400);
  });

  it('5. Creator switching to Customer without completed interests should require onboarding', async () => {
    const mockMongoose = require('mongoose');
    const id = new mockMongoose.Types.ObjectId().toString();
    const mockUser = {
      _id: id,
      name: 'Test Creator',
      email: 'creator@example.com',
      roles: ['creator'],
      activeRole: 'creator',
      creatorProfile: { displayName: 'Creator Pro' },
      customerProfile: { interests: [], interestsSelectedAt: null },
      toObject: function() { return this; },
      save: jest.fn().mockResolvedValue(this),
    };
    getMockDb().users[id] = mockUser;

    const authService = require('../src/services/auth.service');
    const token = authService.generateAccessToken(mockUser);

    const res = await request(app)
      .patch('/api/v1/auth/switch-role')
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'customer' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.activeRole).toBe('customer');
    expect(res.body.data.isOnboardingRequired).toBe(true);
    expect(res.body.data.targetOnboardingPath).toBe('/customer/choose-interests');
    expect(res.body.data.redirectTo).toBe('/customer/choose-interests');
  });

  it('6. Creator switching to Customer with completed interests should redirect to Customer Dashboard', async () => {
    const mockMongoose = require('mongoose');
    const id = new mockMongoose.Types.ObjectId().toString();
    const mockUser = {
      _id: id,
      name: 'Test Creator 2',
      email: 'creator2@example.com',
      roles: ['creator'],
      activeRole: 'creator',
      creatorProfile: { displayName: 'Creator Pro 2' },
      customerProfile: { interests: [{ category: 'Fashion' }], interestsSelectedAt: new Date() },
      toObject: function() { return this; },
      save: jest.fn().mockResolvedValue(this),
    };
    getMockDb().users[id] = mockUser;

    const authService = require('../src/services/auth.service');
    const token = authService.generateAccessToken(mockUser);

    const res = await request(app)
      .patch('/api/v1/auth/switch-role')
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'customer' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.activeRole).toBe('customer');
    expect(res.body.data.isOnboardingRequired).toBe(false);
    expect(res.body.data.targetDashboardPath).toBe('/customer/home');
    expect(res.body.data.redirectTo).toBe('/customer/home');
  });

  it('7. Creator switching to Vendor without completed shopName should require vendor onboarding', async () => {
    const mockMongoose = require('mongoose');
    const id = new mockMongoose.Types.ObjectId().toString();
    const mockUser = {
      _id: id,
      name: 'Test Creator 3',
      email: 'creator3@example.com',
      roles: ['creator'],
      activeRole: 'creator',
      creatorProfile: { displayName: 'Creator Pro 3' },
      vendorProfile: null,
      toObject: function() { return this; },
      save: jest.fn().mockResolvedValue(this),
    };
    getMockDb().users[id] = mockUser;

    const authService = require('../src/services/auth.service');
    const token = authService.generateAccessToken(mockUser);

    const res = await request(app)
      .patch('/api/v1/auth/switch-role')
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'vendor' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.activeRole).toBe('vendor');
    expect(res.body.data.isOnboardingRequired).toBe(true);
    expect(res.body.data.targetOnboardingPath).toBe('/vendor/onboarding');
    expect(res.body.data.redirectTo).toBe('/vendor/onboarding');
  });

  it('8. Creator switching to Vendor with completed shopName should redirect to Vendor Dashboard', async () => {
    const mockMongoose = require('mongoose');
    const id = new mockMongoose.Types.ObjectId().toString();
    const mockUser = {
      _id: id,
      name: 'Test Creator 4',
      email: 'creator4@example.com',
      roles: ['creator'],
      activeRole: 'creator',
      creatorProfile: { displayName: 'Creator Pro 4' },
      vendorProfile: { shopName: 'Awesome Shop' },
      toObject: function() { return this; },
      save: jest.fn().mockResolvedValue(this),
    };
    getMockDb().users[id] = mockUser;

    const authService = require('../src/services/auth.service');
    const token = authService.generateAccessToken(mockUser);

    const res = await request(app)
      .patch('/api/v1/auth/switch-role')
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'vendor' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.activeRole).toBe('vendor');
    expect(res.body.data.isOnboardingRequired).toBe(false);
    expect(res.body.data.targetDashboardPath).toBe('/vendor/dashboard');
    expect(res.body.data.redirectTo).toBe('/vendor/dashboard');
  });
});
