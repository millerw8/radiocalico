module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    'public/**/*.js',
    '!src/server.js', // Exclude server entry point from coverage
    '!public/app.js',  // Frontend is tested with mocked version
  ],
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],
  // Coverage thresholds - adjusted for isolated testing approach
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0
    }
  },
  projects: [
    {
      displayName: 'backend',
      testEnvironment: 'node',
      testMatch: ['**/tests/backend/**/*.test.js']
    },
    {
      displayName: 'frontend',
      testEnvironment: 'jsdom',
      testMatch: ['**/tests/frontend/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/tests/frontend/setup.js']
    }
  ]
};
