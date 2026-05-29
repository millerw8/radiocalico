#!/bin/bash

# Setup test database for Radio Calico
# This script creates a separate test database

set -e

echo "Setting up test database..."

# Database connection parameters
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5434}
DB_USER=${DB_USER:-radiocalico}
DB_PASSWORD=${DB_PASSWORD:-radiocalico}
DB_NAME="radiocalico_test"

# Check if PostgreSQL is running
if ! pg_isready -h $DB_HOST -p $DB_PORT > /dev/null 2>&1; then
    echo "PostgreSQL is not running on $DB_HOST:$DB_PORT"
    echo "Start PostgreSQL with: make dev"
    exit 1
fi

# Create test database if it doesn't exist
echo "Creating test database '$DB_NAME'..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME"

echo "✅ Test database setup complete"
echo ""
echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo "User: $DB_USER"
echo ""
echo "Run tests with: npm test"
