'use strict';
const assert = require('assert');

// Mirrors the exact trim patterns used in submissions.html send payloads:
//   a.student_email?.trim() || ''
//   currentTeacher?.email?.trim() || ''
//   email.trim()   (invite loop — email is always a string from parseEmails)

function studentEmail(raw) {
  return raw?.trim() || '';
}

function teacherEmail(raw) {
  return raw?.trim() || '';
}

function inviteEmail(raw) {
  return raw.trim();
}

const tests = [
  // ── Student email ────────────────────────────────────────────────────────────
  {
    label: 'student: leading space is trimmed',
    fn: () => assert.strictEqual(
      studentEmail(' dwayne.swanson@gmail.com'),
      'dwayne.swanson@gmail.com'
    ),
  },
  {
    label: 'student: trailing space is trimmed',
    fn: () => assert.strictEqual(
      studentEmail('dwayne.swanson@gmail.com '),
      'dwayne.swanson@gmail.com'
    ),
  },
  {
    label: 'student: leading and trailing spaces are trimmed',
    fn: () => assert.strictEqual(
      studentEmail('  dwayne.swanson@gmail.com  '),
      'dwayne.swanson@gmail.com'
    ),
  },
  {
    label: 'student: clean email passes through unchanged',
    fn: () => assert.strictEqual(
      studentEmail('dwayne.swanson@gmail.com'),
      'dwayne.swanson@gmail.com'
    ),
  },
  {
    label: 'student: empty string returns empty string',
    fn: () => assert.strictEqual(studentEmail(''), ''),
  },
  {
    label: 'student: undefined returns empty string (optional chaining)',
    fn: () => assert.strictEqual(studentEmail(undefined), ''),
  },
  {
    label: 'student: null returns empty string (optional chaining)',
    fn: () => assert.strictEqual(studentEmail(null), ''),
  },

  // ── Teacher email ────────────────────────────────────────────────────────────
  {
    label: 'teacher: leading space is trimmed',
    fn: () => assert.strictEqual(
      teacherEmail(' teacher@test-flo.com'),
      'teacher@test-flo.com'
    ),
  },
  {
    label: 'teacher: trailing space is trimmed',
    fn: () => assert.strictEqual(
      teacherEmail('teacher@test-flo.com '),
      'teacher@test-flo.com'
    ),
  },
  {
    label: 'teacher: leading and trailing spaces are trimmed',
    fn: () => assert.strictEqual(
      teacherEmail('  teacher@test-flo.com  '),
      'teacher@test-flo.com'
    ),
  },
  {
    label: 'teacher: clean email passes through unchanged',
    fn: () => assert.strictEqual(
      teacherEmail('teacher@test-flo.com'),
      'teacher@test-flo.com'
    ),
  },
  {
    label: 'teacher: empty string returns empty string',
    fn: () => assert.strictEqual(teacherEmail(''), ''),
  },
  {
    label: 'teacher: undefined returns empty string (optional chaining)',
    fn: () => assert.strictEqual(teacherEmail(undefined), ''),
  },

  // ── Invite email (always a string from parseEmails) ──────────────────────────
  {
    label: 'invite: leading space is trimmed',
    fn: () => assert.strictEqual(
      inviteEmail(' dwayne.swanson@gmail.com'),
      'dwayne.swanson@gmail.com'
    ),
  },
  {
    label: 'invite: trailing space is trimmed',
    fn: () => assert.strictEqual(
      inviteEmail('dwayne.swanson@gmail.com '),
      'dwayne.swanson@gmail.com'
    ),
  },
  {
    label: 'invite: clean email passes through unchanged',
    fn: () => assert.strictEqual(
      inviteEmail('dwayne.swanson@gmail.com'),
      'dwayne.swanson@gmail.com'
    ),
  },
  {
    label: 'invite: empty string returns empty string',
    fn: () => assert.strictEqual(inviteEmail(''), ''),
  },
];

let passed = 0;
let failed = 0;

console.log('\nemail-trim — testing trim patterns used in submissions.html send payloads\n');

for (const { label, fn } of tests) {
  try {
    fn();
    console.log(`  ✓  ${label}`);
    passed++;
  } catch (err) {
    console.error(`  ✗  ${label}`);
    console.error(`     ${err.message}`);
    failed++;
  }
}

console.log(`\n${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
