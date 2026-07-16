module.exports = {
  testEnvironment: 'node',
  moduleNameMapper: {
    '^uuid$': '<rootDir>/tests/mocks/uuid.js',
  },
  setupFiles: [],
  testTimeout: 30000,
};
