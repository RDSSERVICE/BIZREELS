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
});
