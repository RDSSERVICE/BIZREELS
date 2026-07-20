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
    getMockDb().users[id] = {
      _id: id,
      name: 'Test Customer',
      email: 'testcustomer@example.com',
      roles: ['customer', 'vendor'],
      activeRole: 'customer',
      toObject: function() { return this; },
    };

    const authService = require('../src/services/auth.service');
    const token = authService.generateAccessToken(getMockDb().users[id]);

    const res = await request(app)
      .patch('/api/v1/auth/switch-role')
      .set('Authorization', `Bearer ${token}`)
      .send({
        role: 'vendor',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.activeRole).toBe('vendor');
  });

  it('4. Should reject switching to unauthorized roles', async () => {
    // Seed user
    const mockMongoose = require('mongoose');
    const id = new mockMongoose.Types.ObjectId().toString();
    getMockDb().users[id] = {
      _id: id,
      name: 'Test Customer',
      email: 'testcustomer@example.com',
      roles: ['customer'],
      activeRole: 'customer',
      toObject: function() { return this; },
    };

    const authService = require('../src/services/auth.service');
    const token = authService.generateAccessToken(getMockDb().users[id]);

    const res = await request(app)
      .patch('/api/v1/auth/switch-role')
      .set('Authorization', `Bearer ${token}`)
      .send({
        role: 'creator',
      });

    expect(res.status).toBe(400);
  });
});
