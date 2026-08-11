require('./setup');
const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Reel = require('../src/models/Reel');
const UserSubscription = require('../src/models/UserSubscription.model');
const { AppSettings } = require('../src/models/Admin');
const jwt = require('jsonwebtoken');
const config = require('../src/config');

describe('Reels Validation API Tests', () => {
  let mockUser;
  let token;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUser = {
      _id: '6a7afffbc1e2cf745daefef7',
      name: 'Test Vendor',
      roles: ['vendor'],
      activeRole: 'vendor'
    };

    // Store in global mockDb for the auth middleware
    if (!global.mockDb) {
      global.mockDb = {};
    }
    if (!global.mockDb.users) {
      global.mockDb.users = {};
    }
    global.mockDb.users[mockUser._id] = mockUser;

    token = 'Bearer ' + jwt.sign({ userId: mockUser._id }, config.jwt.accessSecret);

    // Mock auth middleware behavior
    jest.spyOn(User, 'findById').mockImplementation((id) => {
      const user = global.mockDb.users[id.toString()];
      return {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        then: (resolve) => resolve(user || null)
      };
    });

    // Mock UserSubscription to return null (treated as free plan) to bypass SubscriptionPlan findById buffering
    jest.spyOn(UserSubscription, 'findOne').mockResolvedValue(null);

    // Mock Reel.countDocuments to return 0 to bypass reels limit check
    jest.spyOn(Reel, 'countDocuments').mockResolvedValue(0);

    // Mock wallet balance to prevent credit check errors
    const walletService = require('../src/services/wallet.service');
    jest.spyOn(walletService, 'getOrCreateWallet').mockResolvedValue({ credits: 10 });
    jest.spyOn(walletService, 'debit').mockResolvedValue({ success: true });

    // Mock app settings for publishing cost
    jest.spyOn(AppSettings, 'findOne').mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        value: { reelPost: 1 }
      })
    });

    // Mock Reel.create
    jest.spyOn(Reel, 'create').mockImplementation((data) => Promise.resolve({ _id: 'mock-reel-id', ...data }));
  });

  it('should reject reel publishing if scheduledDate is in the past', async () => {
    const response = await request(app)
      .post('/api/v1/reels')
      .set('Authorization', token)
      .send({
        caption: 'Beautiful flowers',
        status: 'scheduled',
        scheduledDate: new Date(Date.now() - 60000).toISOString() // 1 minute in the past
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Scheduled date and time must be in the future.');
  });

  it('should reject reel publishing if status is scheduled but scheduledDate is missing', async () => {
    const response = await request(app)
      .post('/api/v1/reels')
      .set('Authorization', token)
      .send({
        caption: 'Beautiful flowers',
        status: 'scheduled'
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Scheduled date and time is required for scheduling.');
  });

  it('should accept scheduled reel if scheduledDate is in the future', async () => {
    const response = await request(app)
      .post('/api/v1/reels')
      .set('Authorization', token)
      .send({
        caption: 'Beautiful flowers',
        status: 'scheduled',
        scheduledDate: new Date(Date.now() + 3600000).toISOString() // 1 hour in the future
      });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('Reel published successfully.');
  });
});
