# Radio Calico Test Suite

Comprehensive unit testing framework for the Radio Calico ratings system.

## Test Structure

```
tests/
├── backend/
│   └── ratings.test.js       # Backend API and database tests
├── frontend/
│   ├── setup.js              # Frontend test environment setup
│   └── ratings-ui.test.js    # Frontend UI and interaction tests
├── fixtures/
│   └── test.db               # Auto-generated test database
└── README.md                 # This file
```

## Running Tests

### Install Dependencies

```bash
npm install
```

### Run All Tests

```bash
npm test
```

### Run Backend Tests Only

```bash
npm run test:backend
```

### Run Frontend Tests Only

```bash
npm run test:frontend
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Generate Coverage Report

```bash
npm run test:coverage
```

Coverage reports will be generated in the `coverage/` directory.

## Backend Tests (`tests/backend/ratings.test.js`)

### What's Tested

#### POST /rate-song Endpoint
- ✅ Creating new thumbs up ratings
- ✅ Creating new thumbs down ratings
- ✅ Changing votes (thumbs up → thumbs down, and vice versa)
- ✅ Preventing duplicate votes (409 conflict)
- ✅ Validating rating values (must be 1 or -1)
- ✅ Validating required fields
- ✅ Multiple users voting on the same song
- ✅ Separate tracking for different songs

#### GET /user-rating/:userId/:title/:artist Endpoint
- ✅ Returning null for users who haven't rated
- ✅ Returning correct rating value (1 or -1)
- ✅ Reflecting updated ratings after vote changes

### Test Database

- Each test gets a fresh SQLite database
- Database is created in `tests/fixtures/test.db`
- Automatically cleaned up after each test
- Schema matches production database

## Frontend Tests (`tests/frontend/ratings-ui.test.js`)

### What's Tested

#### rateSong Function
- ✅ Alerting when no user ID is set
- ✅ Alerting when no song is playing
- ✅ Preventing duplicate votes with client-side validation
- ✅ Submitting thumbs up ratings
- ✅ Submitting thumbs down ratings
- ✅ Handling 409 conflict responses from server
- ✅ Handling network errors gracefully
- ✅ Allowing vote changes

#### Rating Button UI State
- ✅ Rendering buttons with correct initial state
- ✅ Showing active state for user's current vote
- ✅ Disabling buttons when no user ID is set
- ✅ Displaying correct rating counts

### Test Environment

- Uses jsdom for DOM manipulation
- Mocks `fetch`, `localStorage`, and `alert`
- Isolated test environment per test

## Coverage Thresholds

The test suite enforces minimum coverage thresholds:

- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

Tests will fail if coverage drops below these thresholds.

## Test Patterns

### Backend Test Pattern

```javascript
it('should successfully create a new thumbs up rating', async () => {
  const response = await request(app)
    .post('/rate-song')
    .send({
      title: 'Test Song',
      artist: 'Test Artist',
      rating: 1,
      userId: 'user123'
    });

  expect(response.status).toBe(200);
  expect(response.body.success).toBe(true);
  expect(response.body.ratings.thumbs_up).toBe(1);
});
```

### Frontend Test Pattern

```javascript
it('should successfully submit a thumbs up rating', async () => {
  currentUserId = 'user123';
  currentSong = { title: 'Test Song', artist: 'Test Artist' };
  
  global.fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ success: true, ratings: { thumbs_up: 1, thumbs_down: 0 } })
  });

  const result = await rateSong(1);
  
  expect(result.success).toBe(true);
  expect(currentUserRating).toBe(1);
});
```

## Adding New Tests

### Backend Tests

1. Add test cases to `tests/backend/ratings.test.js`
2. Use the existing `app` and `db` fixtures from `beforeEach`
3. Use `supertest` for HTTP assertions
4. Follow the existing test structure

### Frontend Tests

1. Add test cases to `tests/frontend/ratings-ui.test.js`
2. Mock global functions (`fetch`, `alert`, etc.) as needed
3. Use jsdom for DOM manipulation
4. Test both happy paths and error cases

## Continuous Integration

To integrate with CI/CD:

```yaml
# Example GitHub Actions workflow
- name: Run tests
  run: npm test

- name: Check coverage
  run: npm run test:coverage
```

## Debugging Tests

### Run a Single Test File

```bash
npx jest tests/backend/ratings.test.js
```

### Run a Single Test Case

```bash
npx jest -t "should successfully create a new thumbs up rating"
```

### Enable Verbose Output

```bash
npx jest --verbose
```

## Common Issues

### Database Lock Errors

- Make sure each test properly closes the database connection
- Check that `afterEach` cleanup is running

### Fetch Mock Not Working

- Verify `tests/frontend/setup.js` is being loaded
- Check that mocks are cleared in `beforeEach`

### Test Timeout

- Increase Jest timeout: `jest.setTimeout(10000)`
- Check for unresolved promises

## Best Practices

1. **Isolate Tests**: Each test should be independent
2. **Clean Up**: Always clean up resources in `afterEach`
3. **Mock External Dependencies**: Don't make real network calls
4. **Test Edge Cases**: Include error scenarios
5. **Descriptive Names**: Test names should clearly state what they verify
6. **Arrange-Act-Assert**: Structure tests clearly

## Future Enhancements

- [ ] Integration tests for full user flows
- [ ] Performance tests for database queries
- [ ] E2E tests with Playwright or Cypress
- [ ] Snapshot tests for UI components
- [ ] Load testing for concurrent ratings
