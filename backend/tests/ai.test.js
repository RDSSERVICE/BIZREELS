const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const axios = require('axios');
const fs = require('fs');
const authService = require('../src/services/auth.service');

// Mock axios
jest.mock('axios');

// Mock image processing service
jest.mock('../src/services/image-processing.service', () => ({
  processImage: jest.fn().mockResolvedValue({
    width: 800,
    height: 800,
    size: 12345,
    format: 'webp'
  }),
  processedDir: 'mocked-processed-dir'
}));

// Mock storage service
jest.mock('../src/services/storage.service', () => ({
  upload: jest.fn().mockResolvedValue({
    url: '/api/uploads/processed/ai-gen-mocked.webp',
    publicId: 'ai-gen-mocked.webp'
  }),
  delete: jest.fn().mockResolvedValue(true)
}));

// Mock wallet service
jest.mock('../src/services/wallet.service', () => ({
  getOrCreateWallet: jest.fn().mockResolvedValue({ credits: 100 }),
  debit: jest.fn().mockResolvedValue({ success: true }),
}));

// Spy on fs promises to prevent writing files to disk during test
jest.spyOn(fs.promises, 'writeFile').mockResolvedValue(true);
jest.spyOn(fs.promises, 'unlink').mockResolvedValue(true);

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

describe('AI Image Generation API Suite', () => {
  let vendorToken;
  let customerToken;
  let vendorId;
  let customerId;

  beforeEach(() => {
    vendorId = new mongoose.Types.ObjectId().toString();
    customerId = new mongoose.Types.ObjectId().toString();

    getMockDb().users[vendorId] = {
      _id: vendorId,
      name: 'Test Vendor',
      email: 'vendor@example.com',
      roles: ['customer', 'vendor'],
      activeRole: 'vendor',
      toObject: function() { return this; }
    };

    getMockDb().users[customerId] = {
      _id: customerId,
      name: 'Test Customer',
      email: 'customer@example.com',
      roles: ['customer'],
      activeRole: 'customer',
      toObject: function() { return this; }
    };

    vendorToken = authService.generateAccessToken(getMockDb().users[vendorId]);
    customerToken = authService.generateAccessToken(getMockDb().users[customerId]);

    jest.clearAllMocks();

    const { AppSettings } = require('../src/models/Admin');
    jest.spyOn(AppSettings, 'findOne').mockImplementation((query) => {
      const result = query && query.key === 'credit_rates' ? {
        value: {
          aiImage: 2,
          aiVideo30s: 15
        }
      } : null;

      const chain = {
        lean: jest.fn().mockResolvedValue(result),
        then: function(onResolve) {
          return Promise.resolve(result).then(onResolve);
        }
      };
      return chain;
    });
  });

  it('1. Should fail if unauthorized', async () => {
    const res = await request(app)
      .post('/api/v1/ai/generate-image')
      .send({ prompt: 'gaming mouse' });

    expect(res.status).toBe(401);
  });

  it('2. Should fail if authenticated but not a vendor', async () => {
    const res = await request(app)
      .post('/api/v1/ai/generate-image')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ prompt: 'gaming mouse' });

    expect(res.status).toBe(403);
  });

  it('3. Should fail if prompt is missing or empty', async () => {
    const res = await request(app)
      .post('/api/v1/ai/generate-image')
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({ prompt: '' });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Prompt must be at least 3 characters');
  });

  it('4. Should successfully generate an image and return URL', async () => {
    const mockImageBuffer = Buffer.from('fake-image-data');
    axios.get.mockResolvedValue({
      data: mockImageBuffer,
      headers: { 'content-type': 'image/jpeg' }
    });

    const res = await request(app)
      .post('/api/v1/ai/generate-image')
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({ prompt: 'realistic gaming laptop' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.url).toBe('/api/uploads/processed/ai-gen-mocked.webp');
  });

  describe('AI Reel Generation API Suite', () => {
    it('1. Should fail if unauthorized', async () => {
      const res = await request(app)
        .post('/api/v1/ai/generate-reel')
        .send({ prompt: 'Create AC repair promo' });

      expect(res.status).toBe(401);
    });

    it('2. Should fail if prompt is too short', async () => {
      const res = await request(app)
        .post('/api/v1/ai/generate-reel')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({ prompt: 'ab' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Prompt must be at least 3 characters');
    });

    it('3. Should successfully generate script, category, and image URL', async () => {
      const Category = require('../src/models/Category');
      
      let callCount = 0;
      jest.spyOn(Category, 'find').mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve([
            { _id: { toString: () => 'cat1' }, name: 'Home Services' }
          ]);
        }
        return Promise.resolve([
          { _id: { toString: () => 'sub1' }, name: 'AC Repair' }
        ]);
      });

      const mockImageBuffer = Buffer.from('fake-image-data');
      axios.get.mockResolvedValue({
        data: mockImageBuffer,
        headers: { 'content-type': 'image/jpeg' }
      });

      axios.post.mockImplementation((url) => {
        const jsonResponse = {
          caption: '🔥 Get 20% off AC repair services today! 🔥',
          category_id: 'cat1',
          sub_category_id: 'sub1',
          image_prompt: 'A professional technician fixing a residential air conditioning unit, photorealistic'
        };

        if (url && url.includes('openrouter.ai')) {
          return Promise.resolve({
            data: {
              choices: [{
                message: {
                  content: JSON.stringify(jsonResponse)
                }
              }]
            }
          });
        }

        return Promise.resolve({
          data: {
            candidates: [{
              content: {
                parts: [{
                  text: JSON.stringify(jsonResponse)
                }]
              }
            }]
          }
        });
      });

      const res = await request(app)
        .post('/api/v1/ai/generate-reel')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({ prompt: 'Create AC repair promo' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.caption).toContain('AC repair');
      expect(res.body.category_id).toBe('cat1');
      expect(res.body.sub_category_id).toBe('sub1');
      expect(res.body.mediaUrl).toBe('/api/uploads/processed/ai-gen-mocked.webp');
    });

    it('4. Should fail to generate reel if insufficient credits', async () => {
      const walletService = require('../src/services/wallet.service');
      // Mock low credits (e.g. 5, which is less than the required 15 for AI Reel)
      walletService.getOrCreateWallet.mockResolvedValueOnce({ credits: 5 });

      const res = await request(app)
        .post('/api/v1/ai/generate-reel')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({ prompt: 'Create AC repair promo' });

      expect(res.status).toBe(402);
      expect(res.body.message).toContain('Insufficient credits');
    });
  });

  describe('AI Image Generation Credit Check Suite', () => {
    it('1. Should fail to generate image if insufficient credits', async () => {
      const walletService = require('../src/services/wallet.service');
      // Mock low credits (e.g. 1, which is less than the required 2 for AI Image)
      walletService.getOrCreateWallet.mockResolvedValueOnce({ credits: 1 });

      const res = await request(app)
        .post('/api/v1/ai/generate-image')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({ prompt: 'realistic gaming laptop' });

      expect(res.status).toBe(402);
      expect(res.body.message).toContain('Insufficient credits');
    });

    it('2. Should successfully generate image and debit credits when sufficient', async () => {
      const mockImageBuffer = Buffer.from('fake-image-data');
      axios.get.mockResolvedValue({
        data: mockImageBuffer,
        headers: { 'content-type': 'image/jpeg' }
      });

      const res = await request(app)
        .post('/api/v1/ai/generate-image')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({ prompt: 'realistic gaming laptop' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.url).toBe('/api/uploads/processed/ai-gen-mocked.webp');
    });
  });
});
