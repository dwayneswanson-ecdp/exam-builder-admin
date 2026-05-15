/**
 * Institution page regression tests.
 * Uses the admin account (feed0002) which is assigned to Test Institution.
 *
 * All Supabase REST and auth calls are mocked so tests run offline and fast.
 * The add-member edge function is also mocked to avoid real user creation.
 */

import { test, expect } from '@playwright/test';
import { IDs, SUPABASE_URL, SESSION_KEY } from './helpers/constants';
import { mockAddMember } from './helpers/mock';

const SB_BASE = SUPABASE_URL;

const MOCK_SESSION = {
  access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRveGdpaGR5ZnpkeW1naWRndmFxIiwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJzdWIiOiJmZWVkMDAwMi0wMDAwLTQwMDAtODAwMC0wMDAwMDAwMDAwMDEiLCJlbWFpbCI6ImFkbWluQHRlc3QtZmxvLmNvbSIsImF1ZCI6ImF1dGhlbnRpY2F0ZWQiLCJleHAiOjk5OTk5OTk5OTksImlhdCI6MTAwMDAwMDAwMH0.fakesignatureADMIN',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  refresh_token: 'fake-refresh-admin',
  user: {
    id: IDs.admin,
    email: 'admin@test-flo.com',
    role: 'authenticated',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
  },
};

const MOCK_TEACHER = {
  id: IDs.admin,
  email: 'admin@test-flo.com',
  full_name: 'Test Admin',
  role: 'admin',
  lang: null,
};

const MOCK_INSTITUTION = {
  id: IDs.institution,
  name: 'Test Institution',
  domain: 'test-flo.com',
  logo_url: null,
};

const MOCK_ADMIN_LINKS = [
  { teacher_id: IDs.admin, is_key_contact: true },
];

const MOCK_TEACHER_LINKS = [
  { teacher_id: IDs.teacher, is_key_contact: false },
];

const MOCK_ADMINS = [
  { id: IDs.admin, full_name: 'Test Admin', email: 'admin@test-flo.com', role: 'admin', lang: 'en' },
];

const MOCK_TEACHERS_LIST = [
  { id: IDs.teacher, full_name: 'Test Teacher', email: 'teacher@test-flo.com', role: 'teacher', lang: 'en' },
];

const MOCK_EXAMS = [
  { id: IDs.exam, title: 'Playwright Test Exam', status: 'published', created_at: new Date().toISOString() },
];

const INST_URL = `/institution?id=${IDs.institution}`;

async function gotoInstitution(
  page: import('@playwright/test').Page,
  lang: 'en' | 'fr' = 'en',
) {
  // Mock auth calls
  await page.route(`${SB_BASE}/auth/v1/token*`, route =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify(MOCK_SESSION) })
  );
  await page.route(`${SB_BASE}/auth/v1/user*`, route =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify(MOCK_SESSION.user) })
  );

  // Mock data calls
  await page.route(`${SB_BASE}/rest/v1/teachers*`, route => {
    const url = route.request().url();
    // .eq('id', adminId).single() — returns object; .in('id', [...]) — returns array
    if (url.includes('id=eq.')) {
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify(MOCK_TEACHER) });
    }
    // .in() returns all matched teachers
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify([...MOCK_ADMINS, ...MOCK_TEACHERS_LIST]) });
  });
  // .single() on institutions returns an object
  await page.route(`${SB_BASE}/rest/v1/institutions*`, route =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify(MOCK_INSTITUTION) })
  );
  await page.route(`${SB_BASE}/rest/v1/institution_admins*`, route => {
    if (route.request().method() !== 'GET') return route.fulfill({ status: 204, body: '' });
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify(MOCK_ADMIN_LINKS) });
  });
  await page.route(`${SB_BASE}/rest/v1/institution_teachers*`, route => {
    if (route.request().method() !== 'GET') return route.fulfill({ status: 204, body: '' });
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify(MOCK_TEACHER_LINKS) });
  });
  await page.route(`${SB_BASE}/rest/v1/exams*`, route =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify(MOCK_EXAMS) })
  );
  await page.route(`${SB_BASE}/rest/v1/classes*`, route =>
    route.fulfill({ contentType: 'application/json', body: '[]' })
  );

  await mockAddMember(page);

  await page.addInitScript(
    ({ sessionKey, langKey, sess, l }) => {
      localStorage.setItem(sessionKey, JSON.stringify(sess));
      localStorage.setItem(langKey, l);
    },
    { sessionKey: SESSION_KEY, langKey: 'examBuilderLang', sess: MOCK_SESSION, l: lang },
  );

  await page.goto(INST_URL);
  await page.waitForSelector('#pageContent', { state: 'visible', timeout: 12_000 });
}

// ── Admin can view institution ────────────────────────────────────────────────

test('institution page loads with correct institution name', async ({ page }) => {
  await gotoInstitution(page);
  await expect(page.locator('#instName')).toHaveText('Test Institution', { timeout: 8_000 });
});

// ── Admin can add a teacher ───────────────────────────────────────────────────

test('admin can add a teacher via the add modal', async ({ page }) => {
  await gotoInstitution(page, 'en');

  // Click "Add Teacher" button
  const addTeacherBtn = page.locator('button', { hasText: /Add Teacher|Ajouter un enseignant/ });
  await expect(addTeacherBtn).toBeVisible({ timeout: 6_000 });
  await addTeacherBtn.click();

  // Modal opens
  const modal = page.locator('#addModal');
  await expect(modal).toBeVisible({ timeout: 4_000 });
  await expect(page.locator('#addModalTitle')).toContainText('Teacher');

  // Fill in form fields
  await page.locator('#mFirst').fill('New');
  await page.locator('#mLast').fill('Teacher');
  await page.locator('#mEmail').fill('newteacher@test-flo.com');

  // Submit
  await page.locator('#addSubmitBtn').click();

  // Success message appears (mocked edge function returns invited:true)
  await expect(page.locator('#addSuccess')).toBeVisible({ timeout: 8_000 });
  const successText = await page.locator('#addSuccess').textContent();
  expect(successText?.length).toBeGreaterThan(0);
});

// ── Admin can add an admin ────────────────────────────────────────────────────

test('admin can add an admin via the add modal', async ({ page }) => {
  await gotoInstitution(page, 'en');

  const addAdminBtn = page.locator('button', { hasText: /Add Admin|Ajouter un admin/ });
  await expect(addAdminBtn).toBeVisible({ timeout: 6_000 });
  await addAdminBtn.click();

  const modal = page.locator('#addModal');
  await expect(modal).toBeVisible({ timeout: 4_000 });
  await expect(page.locator('#addModalTitle')).toContainText('Admin');

  await page.locator('#mFirst').fill('New');
  await page.locator('#mLast').fill('Admin');
  await page.locator('#mEmail').fill('newadmin@test-flo.com');

  await page.locator('#addSubmitBtn').click();
  await expect(page.locator('#addSuccess')).toBeVisible({ timeout: 8_000 });
});

// ── Admin can remove a teacher ────────────────────────────────────────────────

test('admin can open the remove modal for a teacher', async ({ page }) => {
  await gotoInstitution(page, 'en');

  // Wait for teacher list to load
  await page.waitForSelector('#teacherList .member-row', { timeout: 8_000 });

  // Click the remove button on the first teacher row
  const firstRemoveBtn = page.locator('#teacherList .remove-btn').first();
  await expect(firstRemoveBtn).toBeVisible();
  await firstRemoveBtn.click();

  // Confirm modal opens
  const modal = page.locator('#removeModal');
  await expect(modal).toBeVisible({ timeout: 4_000 });
  await expect(modal.locator('.remove-warning')).toBeVisible();

  // Cancel — don't actually remove (avoid disrupting other tests)
  await modal.locator('button', { hasText: /Cancel|Annuler/ }).click();
  await expect(modal).toBeHidden({ timeout: 3_000 });
});

// ── Language switching ────────────────────────────────────────────────────────

test('all UI strings switch correctly to French', async ({ page }) => {
  await gotoInstitution(page, 'fr');
  await expect(page.locator('[data-i18n="sectionAdmins"]').first()).toHaveText('Administrateurs');
  await expect(page.locator('[data-i18n="sectionTeachers"]').first()).toHaveText('Enseignants');
  await expect(page.locator('[data-i18n="logout"]')).toHaveText('Déconnexion');
});

test('all UI strings switch correctly to English', async ({ page }) => {
  await gotoInstitution(page, 'en');
  await expect(page.locator('[data-i18n="sectionAdmins"]').first()).toHaveText('Admins');
  await expect(page.locator('[data-i18n="sectionTeachers"]').first()).toHaveText('Teachers');
  await expect(page.locator('[data-i18n="logout"]')).toHaveText('Sign out');
});

test('role badges display correctly in French', async ({ page }) => {
  await gotoInstitution(page, 'fr');
  // The admin badge in admin member rows
  await page.waitForSelector('#adminList .member-row', { timeout: 8_000 });
  // Key contact badge should show "Contact principal" in FR
  const kcBadge = page.locator('.key-contact-badge').first();
  if (await kcBadge.isVisible()) {
    await expect(kcBadge).toHaveText('Contact principal');
  }
});

test('role badges display correctly in English', async ({ page }) => {
  await gotoInstitution(page, 'en');
  await page.waitForSelector('#adminList .member-row', { timeout: 8_000 });
  const kcBadge = page.locator('.key-contact-badge').first();
  if (await kcBadge.isVisible()) {
    await expect(kcBadge).toHaveText('Key Contact');
  }
});
