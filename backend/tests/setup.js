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

// Dynamic mock storage for unit test assertions
global.mockDb = {
  users: {},
  listings: {},
  requirements: {},
  quotes: {},
  reviews: {},
  analytics: [],
};

// Global hooks to clean mocks
beforeEach(() => {
  global.mockDb.users = {};
  global.mockDb.listings = {};
  global.mockDb.requirements = {};
  global.mockDb.quotes = {};
  global.mockDb.reviews = {};
  global.mockDb.analytics = [];
});
