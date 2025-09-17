# Database Regeneration Guide

## Overview
This guide shows how to clear the database and reload seed data from `seed_data_dump.sql`.

⚠️ **WARNING**: This will delete all existing data.

## Steps

### 1. Delete Existing Data

**For Staging Environment:**
```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO public;
```

**For Local Development:**
```bash
docker compose -f docker-compose.local.yml down -v
```

### 2. Recreate Schema

**For Staging Environment:**
- Trigger GitHub Actions job to redeploy

**For Local Development:**
```bash
docker compose -f docker-compose.local.yml up --build -d
```

### 3. Load Seed Data
Copy and paste the contents of `seed_data_dump.sql` (I-129) into TablePlus and execute.
