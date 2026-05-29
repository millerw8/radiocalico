# Getting Started with Tests - Radio Calico

## 🎉 You're All Set!

The testing framework is fully configured and all tests are passing.

## ⚡ Quick Start

### 1. Run the Tests

```bash
npm test
```

**Expected output:**
```
PASS backend tests/backend/ratings.test.js
PASS frontend tests/frontend/ratings-ui.test.js

Test Suites: 2 passed, 2 total
Tests:       23 passed, 23 total
Time:        < 1 second
```

### 2. Run Tests in Watch Mode (Recommended for Development)

```bash
npm run test:watch
```

This will:
- Auto-run tests when you save files
- Show only failed tests after the first run
- Let you filter which tests to run
- Press `a` to run all tests
- Press `q` to quit

### 3. Generate Coverage Report

```bash
npm run test:coverage
```

## 📋 What's Included

### Backend Tests (12 tests)

**File:** `tests/backend/ratings.test.js`

Tests the rating system API endpoints:
- Creating ratings (thumbs up/down)
- Changing votes
- Preventing duplicate votes
- Input validation
- Multi-user scenarios
- Rating retrieval

### Frontend Tests (11 tests)

**File:** `tests/frontend/ratings-ui.test.js`

Tests the rating UI and user interactions:
- User authentication checks
- Client-side validation
- API communication
- Error handling
- UI state management
- Button states

## 🔧 Common Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage report
npm run test:coverage

# Run only backend tests
npm run test:backend

# Run only frontend tests
npm run test:frontend

# Run a specific test file
npx jest tests/backend/ratings.test.js

# Run a specific test by name
npx jest -t "should successfully create a new thumbs up rating"

# Run with verbose output (shows all test names)
npx jest --verbose
```

## 📝 Test Structure

```
tests/
├── backend/
│   └── ratings.test.js       # 12 backend tests
└── frontend/
    ├── setup.js              # Test environment setup
    └── ratings-ui.test.js    # 11 frontend tests
```

## ➕ Adding New Tests

### Backend Test Example

Add to `tests/backend/ratings.test.js`:

```javascript
it('should do something new', async () => {
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
});
```

### Frontend Test Example

Add to `tests/frontend/ratings-ui.test.js`:

```javascript
it('should do something new', async () => {
  currentUserId = 'user123';
  currentSong = { title: 'Test Song', artist: 'Test Artist' };

  global.fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ success: true })
  });

  const result = await rateSong(1);
  expect(result.success).toBe(true);
});
```

## 🐞 Debugging Failed Tests

### If a test fails:

1. **Read the error message** - Jest shows exactly what failed
2. **Run that specific test:**
   ```bash
   npx jest -t "name of the failing test"
   ```
3. **Add console.log** in your test to see values:
   ```javascript
   console.log('Response:', response.body);
   ```
4. **Check the test file** - Make sure test data is correct

### Common Issues:

**Backend tests failing:**
- Database not cleaned up properly
- SQL syntax error
- Wrong expected values

**Frontend tests failing:**
- Mocks not set up correctly
- Async operations not awaited
- DOM elements not found

## 📆 Workflow

### During Development:

1. **Start watch mode:**
   ```bash
   npm run test:watch
   ```

2. **Write code** - Tests auto-run on save

3. **Fix failing tests** - Iterate until all pass

4. **Commit** - Only commit when tests pass

### Before Committing:

```bash
# Make sure all tests pass
npm test

# Optional: Check coverage
npm run test:coverage
```

### In CI/CD:

Tests run automatically on:
- Every push to `main` or `develop`
- Every pull request
- Against Node.js 18.x and 20.x

See `.github/workflows/test.yml` for details.

## 📚 Documentation

For more details, see:

- **TESTING.md** - High-level overview
- **tests/README.md** - Detailed guide with examples
- **TEST_SUMMARY.md** - Quick summary of what was built

## ❓ Questions?

### "How do I run just one test?"
```bash
npx jest -t "name of test"
```

### "How do I see what's being tested?"
```bash
npx jest --verbose
```

### "How do I debug a failing test?"
1. Run it in isolation: `npx jest -t "failing test name"`
2. Add `console.log` statements
3. Check the error message carefully

### "Can I run tests automatically?"
Yes! Use watch mode:
```bash
npm run test:watch
```

## ✅ Best Practices

1. **Run tests before committing** - `npm test`
2. **Use watch mode during development** - `npm run test:watch`
3. **Write tests for new features** - Add to the appropriate test file
4. **Keep tests fast** - All tests should run in < 10 seconds
5. **Make tests readable** - Use descriptive test names
6. **One assertion per test** - Easier to debug failures

## 🚀 Next Steps

1. ✅ Tests are already passing - you're good to go!
2. Try running `npm run test:watch` to see auto-rerun in action
3. Make a small change to `src/server.js` and watch tests re-run
4. Add a new test when you add a new feature
5. Keep the tests passing! 🎉

---

**Happy Testing!** 🧪
