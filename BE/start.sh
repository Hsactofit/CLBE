#!/bin/bash
set -e

# Set default DATABASE_URL if not specified
if [ -z "$DATABASE_URL" ]; then
    echo "No DATABASE_URL specified, setting default..."
    export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/crossing"
fi

# run database migrations
echo "Running database migrations..."
uv run alembic upgrade head

# start application
echo "Starting application..."
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --proxy-headers --reload --log-level debug