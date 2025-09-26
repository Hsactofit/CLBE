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

Copy and paste the contents of the two seed files into your preferred ID and execute:

```bash
# add form template master data and the initial non-clerk test user and client
./app/db/seed_data_form.sql

# add all wage data including SOC codes, BLS area codes, mapping, and wage tiers
./app/db/seed_data_wage.sql
```
