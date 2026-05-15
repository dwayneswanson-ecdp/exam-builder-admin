/**
 * Shared test constants — all values sourced from .env.test.
 * Never hard-code credentials or IDs in spec files; reference these instead.
 */

export const SUPABASE_URL =
  process.env.SUPABASE_URL ?? 'https://toxgihdyfzdymgidgvaq.supabase.co';
export const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRveGdpaGR5ZnpkeW1naWRndmFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2ODQ0OTYsImV4cCI6MjA5MjI2MDQ5Nn0.FOA3ZA8Eh-g231al2DS4NjGfLjIkpRlmb7_fKXz65Xo';

export const BASE_URL  = process.env.BASE_URL ?? 'http://localhost:3000';
export const SESSION_KEY = 'sb-toxgihdyfzdymgidgvaq-auth-token';
export const LANG_KEY    = 'examBuilderLang';

export const CREDS = {
  superadmin: {
    email:    process.env.TEST_SUPERADMIN_EMAIL    ?? 'superadmin@test-flo.com',
    password: process.env.TEST_SUPERADMIN_PASSWORD ?? 'TestSuperAdmin123!',
  },
  admin: {
    email:    process.env.TEST_ADMIN_EMAIL    ?? 'admin@test-flo.com',
    password: process.env.TEST_ADMIN_PASSWORD ?? 'TestAdmin123!',
  },
  teacher: {
    email:    process.env.TEST_TEACHER_EMAIL    ?? 'teacher@test-flo.com',
    password: process.env.TEST_TEACHER_PASSWORD ?? 'TestTeacher123!',
  },
};

export const IDs = {
  superadmin:   process.env.TEST_SUPERADMIN_ID       ?? 'feed0001-0000-4000-8000-000000000001',
  admin:        process.env.TEST_ADMIN_ID            ?? 'feed0002-0000-4000-8000-000000000001',
  teacher:      process.env.TEST_TEACHER_ID          ?? 'feed0003-0000-4000-8000-000000000001',
  institution:  process.env.TEST_INSTITUTION_ID      ?? 'feed0100-0000-4000-8000-000000000001',
  exam:         process.env.TEST_EXAM_ID             ?? 'feed0200-0000-4000-8000-000000000001',
  examShare:    process.env.TEST_EXAM_SHARE_ID       ?? 'pw-test-exam-001',
  examCode:     process.env.TEST_EXAM_ACCESS_CODE    ?? 'PLAYWRIGHT-2025',
  examGroup:    process.env.TEST_EXAM_GROUP          ?? 'Test Group A',
  examGroupCode:process.env.TEST_EXAM_GROUP_CODE     ?? 'TGPA-2025',
  att1:         process.env.TEST_ATT1_ID             ?? 'feed0501-0000-4000-8000-000000000001',
  att2:         process.env.TEST_ATT2_ID             ?? 'feed0502-0000-4000-8000-000000000001',
  att3:         process.env.TEST_ATT3_ID             ?? 'feed0503-0000-4000-8000-000000000001',
};
