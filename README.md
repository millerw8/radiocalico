# RadioCalico Web Application

A Node.js/Express web server with SQLite database.

## Setup

1. Dependencies are already installed
2. Configuration is in `.env` file

## Running the Server
/Users/wmiller/code/radiocalico/package.json
```bash
# Start the server
npm start

# Start with auto-reload on file changes
npm run dev
```

The server will run on http://localhost:3000

## API Endpoints

- `GET /` - Welcome message
- `GET /users` - List all users
- `POST /users` - Create a new user (requires JSON body with `username` and `email`)
- `GET /users/:id` - Get a specific user

## Database

- SQLite database file: `./database/app.db`
- Automatically created on first run
- Initial schema includes a `users` table

## Testing the API

```bash
# Get all users
curl http://localhost:3000/users

# Create a user
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"username":"john","email":"john@example.com"}'

# Get specific user
curl http://localhost:3000/users/1
```

## Project Structure

```
.
├── src/
│   ├── server.js      # Express server
│   └── database.js    # SQLite database setup
├── database/
│   └── app.db        # SQLite database file (created on first run)
├── .env              # Environment variables
├── package.json      # Node.js dependencies
└── README.md         # This file
```
