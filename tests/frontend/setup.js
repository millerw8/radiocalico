// Frontend test setup for jsdom environment

// Mock fetch globally
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(() => null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
};

// Reset mocks before each test
beforeEach(() => {
  // Clear mock call history but preserve mock implementations
  jest.clearAllMocks();

  // Re-initialize fetch mock
  global.fetch = jest.fn();
});
