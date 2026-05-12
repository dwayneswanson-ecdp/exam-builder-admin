# Testing Guide

## Overview

Playwright tests run against a **local static file server** (`http://localhost:3000`) and a **shared Supabase project** using a dedicated set of test accounts and seed data. All test data uses fixed, recognisable UUIDs prefixed with `feed0` so they can never be confused with production records.

---

## Prerequisites

| Requirement | Version |
|---|---|
| Node.js | 18 + |
| Playwright browsers | installed via `npx playwright install` |
| A static file server | `npx serve . -p 3000` or equivalent |

---

## First-time setup

### 1. Copy the env template

```bash
cp .env.test.example .env.test
```

### 2. Add the service role key

Open `.env.test` and fill in `SUPABASE_SERVICE_ROLE_KEY`:

- Supabase Dashboard → **Settings** → **API** → **service_role** (the "secret" key, not the anon key)

> ⚠ **Never commit `.env.test`** — it is in `.gitignore`. The service role key has full database access.

### 3. Run the seed script

```bash
node tests/seed.js
```

This creates all test accounts, the test institution, the test exam, and three sample submissions. It is safe to run multiple times — it tears down and recreates the data on each run.

### 4. Start the local server

```bash
npx serve . -p 3000
```

### 5. Run the tests

```bash
npx playwright test
```

---

## Seed script reference

**File:** `tests/seed.js`

```bash
# Default — teardown existing test data, then reseed
node tests/seed.js

# Skip teardown (faster if test data already clean)
node tests/seed.js --no-teardown

# Remove all test data without reseeding
node tests/seed.js --teardown-only
```

The seed script:
- Deletes only rows whose IDs match the fixed `feed0xxx` UUIDs
- Never touches any row outside that ID namespace
- Exits with code 1 and a clear message if the service role key is missing or wrong

---

## Test data reference

### Accounts

| Role | Email | Password |
|---|---|---|
| Super Admin | `superadmin@test-flo.com` | `TestSuperAdmin123!` |
| Admin | `admin@test-flo.com` | `TestAdmin123!` |
| Teacher | `teacher@test-flo.com` | `TestTeacher123!` |
| Student (exam engine) | `student@test-flo.com` | `TestStudent123!` |

> The student account is an auth user for future exam-engine tests. Students do not have a row in the `teachers` table — they access exams via the engine link + access code only.

### Institution

| Field | Value |
|---|---|
| Name | `Test Institution` |
| Domain | `test-flo.com` |
| ID | `feed0100-0000-4000-8000-000000000001` |
| Admin | `admin@test-flo.com` (key contact) |
| Teacher | `teacher@test-flo.com` |

### Exam

| Field | Value |
|---|---|
| Title | `Playwright Test Exam` |
| Duration | 30 minutes |
| Language | English |
| Status | published |
| Share ID (URL) | `pw-test-exam-001` |
| Single access code | `PLAYWRIGHT-2025` |
| Group | `Test Group A` |
| Group code | `TGPA-2025` |
| Exam ID | `feed0200-0000-4000-8000-000000000001` |

**Questions:**

| # | Type | Question | Correct answer |
|---|---|---|---|
| 1 | MCQ | What is the capital of France? | Paris (index 0) |
| 2 | MCQ | In which year did the French Revolution begin? | 1789 (index 1) |
| 3 | MCQ | Who was the last king of France before the Revolution? | Louis XVI (index 2) |
| 4 | Open | Describe the founding and early history of Paris. | Graded (max 5 pts) |
| 5 | Open | Main causes of the French Revolution? (3+) | Graded (max 5 pts) |

**Max total score: 13 pts** (3 MCQ + 10 open)

### Submissions

| ID | Student | MCQ score | Open scores | Results sent? | Notes |
|---|---|---|---|---|---|
| `feed0501…` | Alice Martin | 2/3 | 4+4=8/10 | ✅ sent | Graded, results delivered |
| `feed0502…` | Bob Dupont | 1/3 | ungraded | ❌ not sent | Pending review |
| `feed0503…` | Charlotte Leroy | 3/3 | 5+5=10/10 | ❌ not sent | Graded with comments, awaiting send |

---

## Using test IDs in specs

All IDs are exported from `.env.test` and loaded by `playwright.config.js` into `process.env`. Reference them in test files:

```javascript
const EXAM_ID    = process.env.TEST_EXAM_ID;
const TEACHER_ID = process.env.TEST_TEACHER_ID;
const ATT1_ID    = process.env.TEST_ATT1_ID;
```

Or import directly from the seed script constants (no runtime dependency on the database):

```javascript
// In your spec file
const EXAM_ID = 'feed0200-0000-4000-8000-000000000001';
```

---

## Running seed before every test run (optional)

To auto-seed before the Playwright suite, add a `globalSetup` to `playwright.config.js`:

```javascript
// playwright.config.js — add inside defineConfig({})
globalSetup: './tests/global-setup.js',
```

```javascript
// tests/global-setup.js
const { execSync } = require('child_process');
module.exports = async function globalSetup() {
  execSync('node tests/seed.js', { stdio: 'inherit' });
};
```

---

## Manual DB seed (fallback)

If the seed script's admin API call fails (e.g. the GoTrue version on this project does not accept custom UUIDs), run the equivalent SQL directly in the Supabase SQL editor:

```sql
-- 1. Auth users (requires pgcrypto — available in all Supabase projects)
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous,
  confirmation_token, recovery_token, email_change_token_new,
  email_change, phone_change, phone_change_token,
  reauthentication_token, email_change_token_current
) VALUES
  ('feed0001-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','superadmin@test-flo.com',crypt('TestSuperAdmin123!',gen_salt('bf',10)),NOW(),NOW(),NOW(),'{"provider":"email","providers":["email"]}'::jsonb,'{"full_name":"Test Super Admin"}'::jsonb,false,false,'','','','','','','',''),
  ('feed0002-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','admin@test-flo.com',crypt('TestAdmin123!',gen_salt('bf',10)),NOW(),NOW(),NOW(),'{"provider":"email","providers":["email"]}'::jsonb,'{"full_name":"Test Admin"}'::jsonb,false,false,'','','','','','','',''),
  ('feed0003-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','teacher@test-flo.com',crypt('TestTeacher123!',gen_salt('bf',10)),NOW(),NOW(),NOW(),'{"provider":"email","providers":["email"]}'::jsonb,'{"full_name":"Test Teacher"}'::jsonb,false,false,'','','','','','','',''),
  ('feed0004-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','student@test-flo.com',crypt('TestStudent123!',gen_salt('bf',10)),NOW(),NOW(),NOW(),'{"provider":"email","providers":["email"]}'::jsonb,'{"full_name":"Test Student"}'::jsonb,false,false,'','','','','','','','')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email, encrypted_password = EXCLUDED.encrypted_password, updated_at = NOW();

-- 2. Identities (for email sign-in)
INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES
  (gen_random_uuid(),'feed0001-0000-4000-8000-000000000001','superadmin@test-flo.com','{"sub":"feed0001-0000-4000-8000-000000000001","email":"superadmin@test-flo.com","email_verified":true}'::jsonb,'email',NOW(),NOW(),NOW()),
  (gen_random_uuid(),'feed0002-0000-4000-8000-000000000001','admin@test-flo.com','{"sub":"feed0002-0000-4000-8000-000000000001","email":"admin@test-flo.com","email_verified":true}'::jsonb,'email',NOW(),NOW(),NOW()),
  (gen_random_uuid(),'feed0003-0000-4000-8000-000000000001','teacher@test-flo.com','{"sub":"feed0003-0000-4000-8000-000000000001","email":"teacher@test-flo.com","email_verified":true}'::jsonb,'email',NOW(),NOW(),NOW()),
  (gen_random_uuid(),'feed0004-0000-4000-8000-000000000001','student@test-flo.com','{"sub":"feed0004-0000-4000-8000-000000000001","email":"student@test-flo.com","email_verified":true}'::jsonb,'email',NOW(),NOW(),NOW())
ON CONFLICT (provider_id, provider) DO NOTHING;
```

Then run the remaining steps (teachers, institution, exam, submissions) via the seed script with `--no-teardown`:

```bash
# Skip auth teardown/reseed, only reset DB records
node tests/seed.js --no-teardown
```

---

## Isolation model

This project uses a **single Supabase instance** (no separate test project). Isolation is achieved by:

1. **Namespace UUIDs** — all test records use `feed0xxx` UUIDs; teardown is scoped to exactly those IDs
2. **Test email domain** — all test accounts use `@test-flo.com`; no production account uses this domain
3. **Seed script safety** — teardown only deletes rows whose `id` matches the hardcoded test ID set

> For full isolation (zero risk to production), consider creating a separate Supabase project for CI and setting `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` in your CI environment to point at it.

---

## What NOT to do

- Do not use production credentials in `.env.test`
- Do not run `node tests/seed.js` against a production-only Supabase project without verifying the `feed0` UUIDs don't clash
- Do not commit `.env.test` — it contains the service role key
- Do not modify the fixed UUIDs in `seed.js` or `.env.test.example` — tests reference them by value
