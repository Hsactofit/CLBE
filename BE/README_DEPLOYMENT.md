# Deployment Guide

### Prerequisites

- **Docker**: [Download Docker Deskstop](https://www.docker.com/products/docker-desktop/)
- **uv**: [Install Guide](https://docs.astral.sh/uv/getting-started/installation/)

### Environment Variables

Create a `.env` file in the root directory:

```env
CLERK_SECRET_KEY=...(Needed only when it's non-dev mode and connect with Clerk)

CLERK_AUTH=False

S3_STORAGE=False
```

### Install Packages

You can skip this step if your goal is just to test rather than develop.
Install packages through uv:

```bash
# Make sure in root folder
cd backend

# Install dependencies
uv sync
```

### Local Database

If you're running postgres locally, create a new database called "crossing" and update the .env file to point to it:

```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/crossing
```

Now launch the process:

```bash
sh start.sh
```

This will run all the migrations against your local db, then start FastAPI on http://localhost:8000. You can view the Swagger docs at http://localhost:8000/docs.

It is currently necessary to manually seed the database. Open the following two files in the IDE of your choice and run them against your local db:

```bash
# add form template master data and the initial non-clerk test user and client
./app/db/seed_data_form.sql

# add all wage data including SOC codes, BLS area codes, mapping, and wage tiers
./app/db/seed_data_wage.sql
```

### Testing

If you just want to test the application quickly:

```bash
# Make sure in root folder
cd backend

# Build and start all services
docker compose -f docker-compose.local.yml up --build -d

# The API will be available at http://localhost:8000
# Database will be available at localhost:5432
```

This will:

- Build the backend Docker image
- Start PostgreSQL database
- Run database migrations automatically
- Start the FastAPI server

### Creating db Migrations

To update data schema, run:

```bash
alembic revision --autogenerate -m "DESCRIPTION"
# Description refers to the purpose of the update,
# make it compact it will be part of the migration file name

```

Now look in the /alembic/versions directory and find your new file. The ORM will not always add all the necessary code to perform a full migration. Make sure that any dropped fields, updated constraints, etc, are present, and write them manually if necessary.
