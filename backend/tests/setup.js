process.env.REDIS_ENABLED = 'false';
process.env.NODE_ENV = 'test';
process.env.SMS_PROVIDER = 'mock';
process.env.WHATSAPP_PROVIDER = 'mock';

const mongoose = require('mongoose');
const connection = require('../src/database/connection');

// Mock connection logic globally
jest.spyOn(connection, 'connectDB').mockImplementation(async () => {
  return {
    connection: {
      host: 'mock-host',
      name: 'mock-db',
    },
  };
});

jest.spyOn(connection, 'disconnectDB').mockImplementation(async () => {
  return true;
});

// Mock mongoose connect function
mongoose.connect = jest.fn().mockResolvedValue({
  connection: {
    host: 'mock-host',
    name: 'mock-db',
  },
});

// Mock AppSettings model queries globally to prevent connection buffering timeouts
const { AppSettings } = require('../src/models/Admin');
jest.spyOn(AppSettings, 'findOne').mockImplementation((query) => {
  if (query.key === 'max_listing_images') {
    return Promise.resolve({ value: 5 });
  }
  if (query.key === 'max_listing_videos') {
    return Promise.resolve({ value: 1 });
  }
  return Promise.resolve(null);
});

// Mock UserSubscription model queries globally to prevent connection buffering timeouts
const UserSubscription = require('../src/models/UserSubscription.model');
jest.spyOn(UserSubscription, 'findOne').mockImplementation(() => {
  return Promise.resolve({
    status: 'active',
    expiry_date: new Date(Date.now() + 86400 * 1000 * 30),
  });
});

// Dynamic mock storage for unit test assertions
global.mockDb = {
  users: {},
  listings: {},
  requirements: {},
  quotes: {},
  reviews: {},
  analytics: [],
};

// Initialise shared mock storage once per test file. Several integration-style
// suites create authenticated users in beforeAll and intentionally reuse them
// across their ordered requests, so resetting this store before every test
// invalidates their tokens and turns subsequent requests into false 401s.
beforeAll(() => {
  global.mockDb.users = {};
  global.mockDb.listings = {};
  global.mockDb.requirements = {};
  global.mockDb.quotes = {};
  global.mockDb.reviews = {};
  global.mockDb.analytics = [];
});
