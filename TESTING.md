# Radio Calico Testing Framework

## Overview

Comprehensive unit testing framework for the Radio Calico ratings system, covering both backend API logic and frontend UI interactions.

## Quick Start

```bash
# Install dependencies (includes test frameworks)
npm install

# Run all tests
npm test

# Run with coverage report
npm run test:coverage

# Run in watch mode during development
npm run test:watch
```

## Test Results

✅ **23 tests passing** (12 backend + 11 frontend)

```
Test Suites: 2 passed, 2 total
Tests:       23 passed, 23 total
Time:        < 1 second
```

## Architecture

### Backend Testing (Node.js + Express)

**Framework**: Jest + Supertest + better-sqlite3

**Test File**: `tests/backend/ratings.test.js` (12 tests)

**Key Features**:
- Fresh SQLite database for each test (isolated test environment)
- Supertest for HTTP endpoint testing
- Tests the actual database operations (not mocked)
- Validates business logic and edge cases

**What's Covered**:
- ✅ Rating creation (thumbs up/down)
- ✅ Rating updates (changing votes)
- ✅ Duplicate vote prevention (409 conflict)
- ✅ Input validation (rating values, required fields)
- ✅ Multi-user scenarios
- ✅ Song isolation (different songs tracked separately)
- ✅ User rating retrieval

### Frontend Testing (JavaScript + DOM)

**Framework**: Jest + jsdom

**Test Files**: 
- `tests/frontend/ratings-ui.test.js` (11 tests)
- `tests/frontend/setup.js` - Test environment configuration

**Key Features**:
- jsdom for DOM manipulation without a browser
- Mocked `fetch`, `localStorage`, and `alert`
- Tests UI state management and user interactions
- Validates client-side validation logic

**What's Covered**:
- ✅ User authentication state checks
- ✅ Client-side validation (no user ID, no song playing)
- ✅ Duplicate vote prevention (client-side)
- ✅ API communication (fetch calls)
- ✅ Error handling (network errors, 409 conflicts)
- ✅ UI state updates (active buttons, rating counts)
- ✅ Button enable/disable logic

## Test Structure

```
tests/
├── backend/
│   └── ratings.test.js       # Backend API and database tests (12 test cases)
├── frontend/
│   ├── setup.js              # Frontend test environment setup
│   └── ratings-ui.test.js    # Frontend UI tests (11 test cases)
├── fixtures/
│   └── test.db               # Auto-generated test database (cleaned up after tests)
└── README.md                 # Detailed testing documentation
```

## Testing Approach

### Isolated Unit Testing

This framework uses an **isolated unit testing approach**:

- **Backend tests** create a standalone Express app with test database
- **Frontend tests** use extracted/simplified versions of functions
- Tests focus on **logic correctness** rather than code coverage metrics
- Each test is **completely independent** and can run in any order

### Why This Approach?

1. **Fast execution** - Tests run in < 1 second
2. **No dependencies** - Tests don't require the server to be running
3. **Focused testing** - Each test validates specific behavior
4. **Easy debugging** - Failures are isolated and clear
5. **Parallel execution** - Tests can run concurrently

## Test Examples

### Backend Test Example

```javascript
it('should allow user to change their vote from thumbs up to thumbs down', async () => {
  // First vote: thumbs up
  await request(app)
    .post('/rate-song')
    .send({
      title: 'Test Song',
      artist: 'Test Artist',
      rating: 1,
      userId: 'user123'
    });

  // Change vote to thumbs down
  const response = await request(app)
    .post('/rate-song')
    .send({
      title: 'Test Song',
      artist: 'Test Artist',
      rating: -1,
      userId: 'user123'
    });

  expect(response.status).toBe(200);
  expect(response.body.success).toBe(true);
  expect(response.body.changed).toBe(true);
  expect(response.body.ratings.thumbs_up).toBe(0);
  expect(response.body.ratings.thumbs_down).toBe(1);
});
```

### Frontend Test Example

```javascript
it('should successfully submit a thumbs up rating', async () => {
  currentUserId = 'user123';
  currentSong = { title: 'Test Song', artist: 'Test Artist' };
  currentUserRating = null;

  global.fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      success: true,
      ratings: { thumbs_up: 1, thumbs_down: 0 },
      changed: false
    })
  });

  const result = await rateSong(1);

  expect(global.fetch).toHaveBeenCalledWith('/rate-song', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Test Song',
      artist: 'Test Artist',
      rating: 1,
      userId: 'user123'
    })
  });

  expect(result.success).toBe(true);
  expect(currentUserRating).toBe(1);
});
```

## Running Specific Tests

```bash
# Run only backend tests
npm run test:backend

# Run only frontend tests
npm run test:frontend

# Run a specific test file
npx jest tests/backend/ratings.test.js

# Run a specific test case by name
npx jest -t "should successfully create a new thumbs up rating"

# Run with verbose output
npx jest --verbose
```

## Continuous Integration

A GitHub Actions workflow is included at `.github/workflows/test.yml`:

- Runs on push to `main` and `develop` branches
- Runs on pull requests
- Tests against Node.js 18.x and 20.x
- Generates and uploads coverage reports to Codecov

## Key Testing Decisions

### Why Real Database for Backend Tests?

We use a real SQLite database (not mocked) because:
1. **SQL Validation**: Catches SQL syntax errors and constraint violations
2. **Business Logic**: Tests the actual database constraints (UNIQUE, CHECK)
3. **Confidence**: Higher confidence that code works with real database
4. **Performance**: SQLite is fast enough for unit tests (< 1 second total)
5. **Isolation**: Each test gets a fresh database, so tests don't interfere

### Why Mock fetch for Frontend Tests?

We mock `fetch` in frontend tests because:
1. **Speed**: No network latency
2. **Reliability**: Tests don't depend on backend being running
3. **Control**: Can simulate error conditions easily
4. **Isolation**: Frontend tests focus on UI logic, not integration

### Test Data Strategy

- **Simple, Predictable Data**: "Test Song" / "Test Artist" for clarity
- **Edge Cases Covered**: Empty strings, null values, invalid ratings
- **Multiple Users**: Tests verify multi-user scenarios
- **State Management**: Tests verify state changes correctly

## Adding New Tests

### For New Backend Endpoints

1. Add test cases to `tests/backend/ratings.test.js`
2. Use the existing `app` and `db` fixtures
3. Follow the existing describe/it structure
4. Test happy path + error cases

### For New Frontend Features

1. Add test cases to `tests/frontend/ratings-ui.test.js`
2. Mock any new global functions
3. Test UI state changes
4. Test user interactions

## Debugging Failed Tests

### Backend Test Failures

```bash
# Check database state
npx jest tests/backend/ratings.test.js --verbose

# Common issues:
# - Database not cleaned up between tests
# - SQL syntax errors
# - Constraint violations
```

### Frontend Test Failures

```bash
# Check mock calls
npx jest tests/frontend/ratings-ui.test.js --verbose

# Common issues:
# - Mocks not reset between tests
# - DOM not properly set up
# - Async operations not awaited
```

## Best Practices

1. **Write Tests First**: Consider TDD for new features
2. **Keep Tests Fast**: All tests should run in < 10 seconds
3. **Test Behavior, Not Implementation**: Focus on what, not how
4. **Descriptive Test Names**: Should read like documentation
5. **Clean Up Resources**: Always close databases, clear mocks
6. **One Concept Per Test**: Makes failures easier to diagnose

## Future Enhancements

### Short Term
- [ ] Add tests for `/now-playing` endpoint
- [ ] Add tests for user management endpoints
- [ ] Add tests for metadata display logic
- [ ] Add tests for album art handling
- [ ] Add tests for HLS player initialization

### Medium Term
- [ ] Integration tests (full user flows)
- [ ] Performance tests (database query optimization)
- [ ] Load tests (concurrent rating submissions)
- [ ] Add tests for recently played widget

### Long Term
- [ ] E2E tests with Playwright or Cypress
- [ ] Visual regression tests
- [ ] Accessibility tests
- [ ] Security tests (SQL injection, XSS)

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [jsdom Documentation](https://github.com/jsdom/jsdom)
- [Better SQLite3 Documentation](https://github.com/WiseLibs/better-sqlite3)

## Questions?

See `tests/README.md` for more detailed documentation and troubleshooting.
