'use strict';
/**
 * Test data seed script for Playwright test suite.
 *
 * Usage:
 *   node tests/seed.js              — teardown then reseed (default)
 *   node tests/seed.js --no-teardown — seed without wiping first
 *   node tests/seed.js --teardown-only — wipe test data and exit
 *
 * Requires .env.test at the project root with SUPABASE_SERVICE_ROLE_KEY set.
 * Never commits .env.test — it is in .gitignore.
 */

const fs   = require('fs');
const path = require('path');

// ── Load .env.test ────────────────────────────────────────────────────────────

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvFile(path.join(__dirname, '..', '.env.test'));

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY || SERVICE_KEY === 'your-service-role-key-here') {
  console.error('\n❌  Missing or placeholder SUPABASE_SERVICE_ROLE_KEY in .env.test');
  console.error('   Get it from: Supabase Dashboard → Settings → API → service_role secret\n');
  process.exit(1);
}

// ── Fixed test IDs — deterministic, never change these ───────────────────────
//
// All UUIDs use the prefix feed0xxx to be easily recognisable in logs and DB.
// Every test ID is scoped to this namespace — teardown only touches these rows.

const ID = {
  SUPERADMIN:   'feed0001-0000-4000-8000-000000000001',
  ADMIN:        'feed0002-0000-4000-8000-000000000001',
  TEACHER:      'feed0003-0000-4000-8000-000000000001',
  STUDENT_AUTH: 'feed0004-0000-4000-8000-000000000001',
  INSTITUTION:  'feed0100-0000-4000-8000-000000000001',
  EXAM:         'feed0200-0000-4000-8000-000000000001',
  Q1:           'feed0301-0000-4000-8000-000000000001',
  Q2:           'feed0302-0000-4000-8000-000000000001',
  Q3:           'feed0303-0000-4000-8000-000000000001',
  Q4:           'feed0304-0000-4000-8000-000000000001',
  Q5:           'feed0305-0000-4000-8000-000000000001',
  CLASS:        'feed0400-0000-4000-8000-000000000001',
  ATT1:         'feed0501-0000-4000-8000-000000000001',
  ATT2:         'feed0502-0000-4000-8000-000000000001',
  ATT3:         'feed0503-0000-4000-8000-000000000001',
  INST_ADMIN:   'feed0601-0000-4000-8000-000000000001',
  INST_TEACHER: 'feed0701-0000-4000-8000-000000000001',
};

// ── HTTP helpers ──────────────────────────────────────────────────────────────

const dbHeaders = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'apikey': SERVICE_KEY,
  'Prefer': 'return=minimal',
};

const authAdminHeaders = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'apikey': SERVICE_KEY,
};

async function dbDelete(table, filter) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${filter}`;
  const res = await fetch(url, { method: 'DELETE', headers: dbHeaders });
  if (!res.ok && res.status !== 404) {
    const body = await res.text();
    throw new Error(`DELETE ${table}?${filter} → HTTP ${res.status}: ${body}`);
  }
}

async function dbUpsert(table, rows) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...dbHeaders, 'Prefer': 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(Array.isArray(rows) ? rows : [rows]),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`UPSERT ${table} → HTTP ${res.status}: ${body}`);
  }
}

async function authAdminDelete(userId) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
    method: 'DELETE',
    headers: authAdminHeaders,
  });
  if (!res.ok && res.status !== 404) {
    const body = await res.text();
    console.warn(`  ⚠  Could not delete auth user ${userId}: HTTP ${res.status} — ${body}`);
  }
}

async function authAdminCreate(id, email, password, fullName) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: authAdminHeaders,
    body: JSON.stringify({
      id,                          // custom UUID — accepted by GoTrue admin endpoint
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Create auth user ${email} → HTTP ${res.status}: ${body}`);
  }
  const user = await res.json();
  if (user.id && user.id !== id) {
    throw new Error(
      `Auth user ${email} was created but got ID ${user.id} instead of ${id}.\n` +
      `  GoTrue on this project may not support custom UUIDs via the admin API.\n` +
      `  Run the SQL fallback in TESTING.md section "Manual DB seed" instead.`
    );
  }
  return user;
}

// ── Teardown ──────────────────────────────────────────────────────────────────
//
// Deletes only rows whose IDs are in the ID map above.
// Safe to run against the shared production DB — it never touches other rows.

async function teardown() {
  console.log('\n🧹  Tearing down previous test data…');

  const attIds  = [ID.ATT1, ID.ATT2, ID.ATT3].join(',');
  const examIds = ID.EXAM;
  const instId  = ID.INSTITUTION;
  const tIds    = [ID.SUPERADMIN, ID.ADMIN, ID.TEACHER].join(',');

  await dbDelete('exam_attempts',        `id=in.(${attIds})`);
  await dbDelete('questions',            `exam_id=eq.${examIds}`);
  await dbDelete('classes',              `id=eq.${ID.CLASS}`);
  await dbDelete('exams',                `id=eq.${examIds}`);
  await dbDelete('institution_admins',   `id=eq.${ID.INST_ADMIN}`);
  await dbDelete('institution_teachers', `id=eq.${ID.INST_TEACHER}`);
  await dbDelete('teachers',             `id=in.(${tIds})`);
  await dbDelete('institutions',         `id=eq.${instId}`);

  const authIds = [ID.SUPERADMIN, ID.ADMIN, ID.TEACHER, ID.STUDENT_AUTH];
  for (const uid of authIds) await authAdminDelete(uid);

  console.log('   ✓ Teardown complete');
}

// ── Seed — Step 1: Auth accounts ─────────────────────────────────────────────

async function seedAuth() {
  console.log('\n[Step 1] Creating auth accounts…');

  const accounts = [
    [ID.SUPERADMIN,   'superadmin@test-flo.com', 'TestSuperAdmin123!', 'Test Super Admin'],
    [ID.ADMIN,        'admin@test-flo.com',       'TestAdmin123!',      'Test Admin'],
    [ID.TEACHER,      'teacher@test-flo.com',     'TestTeacher123!',    'Test Teacher'],
    [ID.STUDENT_AUTH, 'student@test-flo.com',     'TestStudent123!',    'Test Student'],
  ];

  for (const [id, email, password, name] of accounts) {
    await authAdminCreate(id, email, password, name);
    console.log(`   ✓ ${email}`);
  }
}

// ── Seed — Step 2: Institution & teacher profiles ─────────────────────────────

async function seedInstitution() {
  console.log('\n[Step 2] Creating institution and teacher profiles…');

  await dbUpsert('teachers', [
    { id: ID.SUPERADMIN, email: 'superadmin@test-flo.com', full_name: 'Test Super Admin', role: 'super_admin', lang: null },
    { id: ID.ADMIN,      email: 'admin@test-flo.com',      full_name: 'Test Admin',        role: 'admin',       lang: null },
    { id: ID.TEACHER,    email: 'teacher@test-flo.com',    full_name: 'Test Teacher',       role: 'teacher',     lang: null },
  ]);
  console.log('   ✓ 3 teacher profiles');

  await dbUpsert('institutions', {
    id: ID.INSTITUTION, name: 'Test Institution', domain: 'test-flo.com',
  });
  console.log('   ✓ Test Institution');

  await dbUpsert('institution_admins', {
    id: ID.INST_ADMIN, institution_id: ID.INSTITUTION,
    teacher_id: ID.ADMIN, is_key_contact: true,
  });
  await dbUpsert('institution_teachers', {
    id: ID.INST_TEACHER, institution_id: ID.INSTITUTION,
    teacher_id: ID.TEACHER,
  });
  console.log('   ✓ Institution memberships assigned');

  await dbUpsert('classes', {
    id: ID.CLASS, teacher_id: ID.TEACHER, name: 'Test Class A',
  });
  console.log('   ✓ Test Class A');
}

// ── Seed — Step 3: Exam & questions ──────────────────────────────────────────

async function seedExam() {
  console.log('\n[Step 3] Creating test exam and questions…');

  await dbUpsert('exams', {
    id:           ID.EXAM,
    teacher_id:   ID.TEACHER,
    title:        'Playwright Test Exam',
    duration_mins: 30,
    lang:         'en',
    status:       'published',
    share_id:     'pw-test-exam-001',
    access_code:  'PLAYWRIGHT-2025',
    groups:       'Test Group A',
    group_codes:  '{"Test Group A":"TGPA-2025"}',
    teacher_email: 'teacher@test-flo.com',
    instructions: 'Playwright automated test exam. Do not submit real answers.',
  });
  console.log('   ✓ Playwright Test Exam');

  await dbUpsert('questions', [
    {
      id: ID.Q1, exam_id: ID.EXAM, position: 0, type: 'mcq',
      question_text: 'What is the capital of France?',
      option_a: 'Paris', option_b: 'Lyon', option_c: 'Marseille', option_d: 'Bordeaux',
      correct_index: 0, max_points: 1, grading_criteria: null,
    },
    {
      id: ID.Q2, exam_id: ID.EXAM, position: 1, type: 'mcq',
      question_text: 'In which year did the French Revolution begin?',
      option_a: '1776', option_b: '1789', option_c: '1799', option_d: '1815',
      correct_index: 1, max_points: 1, grading_criteria: null,
    },
    {
      id: ID.Q3, exam_id: ID.EXAM, position: 2, type: 'mcq',
      question_text: 'Who was the last king of France before the Revolution?',
      option_a: 'Louis XIV', option_b: 'Napoleon Bonaparte',
      option_c: 'Louis XVI', option_d: 'Charles X',
      correct_index: 2, max_points: 1, grading_criteria: null,
    },
    {
      id: ID.Q4, exam_id: ID.EXAM, position: 3, type: 'open',
      question_text: 'Describe the founding and early history of Paris.',
      option_a: null, option_b: null, option_c: null, option_d: null,
      correct_index: null, max_points: 5,
      grading_criteria: 'Award points for: Parisii tribe (1pt), Lutetia/Roman period (1pt), medieval growth (1pt), Seine island origin (1pt), Frankish kingdom (1pt).',
    },
    {
      id: ID.Q5, exam_id: ID.EXAM, position: 4, type: 'open',
      question_text: 'What were the main causes of the French Revolution? Give at least three.',
      option_a: null, option_b: null, option_c: null, option_d: null,
      correct_index: null, max_points: 5,
      grading_criteria: 'Award 1pt each for: financial crisis, social inequality between estates, Enlightenment ideas, food shortages, weak leadership of Louis XVI.',
    },
  ]);
  console.log('   ✓ 3 MCQ questions (correct indices: 0, 1, 2)');
  console.log('   ✓ 2 open questions with grading criteria (5 pts each)');
}

// ── Seed — Step 4: Submissions ────────────────────────────────────────────────

async function seedSubmissions() {
  console.log('\n[Step 4] Creating test submissions…');

  const now     = new Date();
  const twoDays = new Date(now - 2 * 86_400_000).toISOString();
  const oneDay  = new Date(now - 1 * 86_400_000).toISOString();
  const threeHr = new Date(now - 3 * 3_600_000).toISOString();

  await dbUpsert('exam_attempts', [
    // ATT1 — fully graded + results sent
    {
      id: ID.ATT1, exam_id: ID.EXAM,
      student_name: 'Alice Martin', student_email: 'alice@test-flo.com',
      access_code: 'TGPA-2025', group_name: 'Test Group A', status: 'completed',
      answers_json: {
        q0: 0, q1: 0, q2: 2,
        q3: 'Paris was founded by the Parisii tribe on an island in the Seine River, known to the Romans as Lutetia.',
        q4: 'The French Revolution was caused by financial crisis, social inequality, and Enlightenment philosophy.',
      },
      score_mcq: 2,
      open_scores:   { 3: 4, 4: 4 },
      open_comments: {
        3: 'Good answer. Mention the medieval period for full marks.',
        4: 'Well argued. Add one more specific example next time.',
      },
      submitted_at:    twoDays,
      results_sent_at: oneDay,
    },
    // ATT2 — submitted, not graded, not sent
    {
      id: ID.ATT2, exam_id: ID.EXAM,
      student_name: 'Bob Dupont', student_email: 'bob@test-flo.com',
      access_code: 'TGPA-2025', group_name: 'Test Group A', status: 'completed',
      answers_json: {
        q0: 1, q1: 1, q2: 0,
        q3: 'I think Paris has a long history going back to ancient times.',
        q4: 'People were unhappy with the king and wanted more freedom.',
      },
      score_mcq: 1,
      open_scores:     null,
      open_comments:   null,
      submitted_at:    oneDay,
      results_sent_at: null,
    },
    // ATT3 — graded with teacher comments, not yet sent
    {
      id: ID.ATT3, exam_id: ID.EXAM,
      student_name: 'Charlotte Leroy', student_email: 'charlotte@test-flo.com',
      access_code: 'TGPA-2025', group_name: 'Test Group A', status: 'completed',
      answers_json: {
        q0: 0, q1: 1, q2: 2,
        q3: 'Paris was founded as Lutetia by the Parisii and became the capital of the Frankish kingdom under Clovis.',
        q4: 'The Revolution was driven by Enlightenment ideas, financial bankruptcy, food shortages, and the injustice of the Ancien Regime.',
      },
      score_mcq: 3,
      open_scores:   { 3: 5, 4: 5 },
      open_comments: {
        3: 'Excellent — comprehensive and accurate account of early Paris.',
        4: 'Outstanding. All key causes identified with strong historical reasoning.',
      },
      submitted_at:    threeHr,
      results_sent_at: null,
    },
  ]);

  console.log('   ✓ ATT1: graded + results sent          (Alice Martin,    score 2/3 MCQ + 8/10 open)');
  console.log('   ✓ ATT2: pending / ungraded             (Bob Dupont,      score 1/3 MCQ, open ungraded)');
  console.log('   ✓ ATT3: graded with comments, unsent   (Charlotte Leroy, score 3/3 MCQ + 10/10 open)');
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const args          = process.argv.slice(2);
  const noTeardown    = args.includes('--no-teardown');
  const teardownOnly  = args.includes('--teardown-only');

  console.log('╔══════════════════════════════════════╗');
  console.log('║     testflo — Playwright seed        ║');
  console.log('╚══════════════════════════════════════╝');
  console.log(`Project: ${SUPABASE_URL}`);

  try {
    if (!noTeardown) {
      await teardown();
    }
    if (teardownOnly) {
      console.log('\n✅  Teardown complete. Exiting without reseed.\n');
      return;
    }

    await seedAuth();
    await seedInstitution();
    await seedExam();
    await seedSubmissions();

    console.log('\n╔══════════════════════════════════════╗');
    console.log('║  ✅  Seed complete — ready to test   ║');
    console.log('╚══════════════════════════════════════╝');
    console.log('\nTest IDs for use in specs:');
    console.log(`  Exam ID:         ${ID.EXAM}`);
    console.log(`  Exam share_id:   pw-test-exam-001`);
    console.log(`  Teacher ID:      ${ID.TEACHER}`);
    console.log(`  Institution ID:  ${ID.INSTITUTION}`);
    console.log(`  Submission 1:    ${ID.ATT1}  (Alice — sent)`);
    console.log(`  Submission 2:    ${ID.ATT2}  (Bob — pending)`);
    console.log(`  Submission 3:    ${ID.ATT3}  (Charlotte — graded, unsent)`);
    console.log('\nRun tests:  npx playwright test\n');
  } catch (err) {
    console.error('\n❌  Seed failed:', err.message);
    process.exit(1);
  }
}

main();
