// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');

const SUPABASE_PROJECT = 'toxgihdyfzdymgidgvaq';
const SUPABASE_BASE    = `https://${SUPABASE_PROJECT}.supabase.co`;

const INST_ID       = '8b26e43a-0000-0000-0000-000000000000'; // placeholder — overridden by mock
const TEACHER_ID    = '4eae4a99-2cf4-48c2-aca0-7026e0ea3a4f';
const ADMIN_ID      = 'aaaaaaaa-0000-0000-0000-000000000001';

const MOCK_SESSION = {
  access_token:  'fake-access-token-for-test',
  token_type:    'bearer',
  expires_in:    3600,
  expires_at:    Math.floor(Date.now() / 1000) + 3600,
  refresh_token: 'fake-refresh-token',
  user: {
    id:    TEACHER_ID,
    email: 'dwayne.swanson@gmail.com',
    role:  'authenticated',
    app_metadata:  { provider: 'email' },
    user_metadata: {},
    aud:           'authenticated',
  },
};

const MOCK_CURRENT_TEACHER = {
  id:          TEACHER_ID,
  full_name:   'Dwayne Swanson',
  email:       'dwayne.swanson@gmail.com',
  role:        'super_admin',
  institution_id: INST_ID,
};

const MOCK_INSTITUTION = {
  id:       INST_ID,
  name:     'Test University',
  domain:   'test.edu',
  logo_url: null,
};

const MOCK_ADMIN_LINKS = [
  { teacher_id: ADMIN_ID, is_key_contact: true },
];

const MOCK_TEACHER_LINKS = [
  { teacher_id: TEACHER_ID, is_key_contact: false },
];

const MOCK_TEACHERS = [
  { id: ADMIN_ID,   full_name: 'Alice Admin',    email: 'alice@test.edu',  role: 'admin',   phone: '555-0001', job_title: 'Head of Dept' },
  { id: TEACHER_ID, full_name: 'Dwayne Swanson', email: 'dwayne.swanson@gmail.com', role: 'teacher', phone: null, job_title: null },
];

const MOCK_CLASSES = [
  { id: 'cls-001', teacher_id: TEACHER_ID, name: 'Finance L3' },
];

const MOCK_EXAMS = [
  { id: 'exam-001', teacher_id: TEACHER_ID, title: 'Midterm', created_at: '2026-04-01T10:00:00Z' },
];

test('institution page: RLS simulation — empty institution_admins/teachers shows blank lists', async ({ page }) => {
  const consoleLogs = [];
  page.on('console', msg => {
    if (msg.text().startsWith('[loadPage]')) consoleLogs.push(msg.text());
  });

  await page.route(`${SUPABASE_BASE}/auth/v1/token*`, route =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify({ ...MOCK_SESSION }) })
  );
  await page.route(`${SUPABASE_BASE}/rest/v1/teachers*`, route => {
    const url = route.request().url();
    if (url.includes(`id=eq.${TEACHER_ID}`) && !url.includes('in.')) {
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify(MOCK_CURRENT_TEACHER) });
    }
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify(MOCK_TEACHERS) });
  });
  await page.route(`${SUPABASE_BASE}/rest/v1/institutions*`, route =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify(MOCK_INSTITUTION) })
  );
  // Simulate RLS blocking — return empty arrays
  await page.route(`${SUPABASE_BASE}/rest/v1/institution_admins*`, route =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify([]) })
  );
  await page.route(`${SUPABASE_BASE}/rest/v1/institution_teachers*`, route =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify([]) })
  );
  await page.route(`${SUPABASE_BASE}/rest/v1/classes*`, route =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify([]) })
  );
  await page.route(`${SUPABASE_BASE}/rest/v1/exams*`, route =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify([]) })
  );

  await page.addInitScript(([key, session]) => {
    localStorage.setItem(key, JSON.stringify(session));
  }, [`sb-${SUPABASE_PROJECT}-auth-token`, MOCK_SESSION]);

  const url = 'file://' + path.resolve(__dirname, '../institution.html') + '?id=' + INST_ID;
  await page.goto(url);
  await expect(page.locator('#pageContent')).toBeVisible({ timeout: 10000 });

  console.log('\n=== [RLS simulation] debug output ===');
  consoleLogs.forEach(l => console.log(l));
  console.log('=====================================\n');

  // With empty data, lists should show "no members" messages, not teacher names
  await expect(page.locator('#adminList')).not.toContainText('Alice Admin');
  await expect(page.locator('#teacherList')).not.toContainText('Dwayne Swanson');
});

test('institution page: admins and teachers render with mocked data', async ({ page }) => {
  const consoleLogs = [];
  page.on('console', msg => {
    if (msg.text().startsWith('[loadPage]')) consoleLogs.push(msg.text());
  });
  const jsErrors = [];
  page.on('pageerror', err => jsErrors.push(err.message));

  // Mock setSession token refresh
  await page.route(`${SUPABASE_BASE}/auth/v1/token*`, route =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify({ ...MOCK_SESSION }) })
  );

  // Mock current user teacher lookup  (eq id = TEACHER_ID)
  await page.route(`${SUPABASE_BASE}/rest/v1/teachers*`, route => {
    const url = route.request().url();
    if (url.includes(`id=eq.${TEACHER_ID}`) && !url.includes('in.')) {
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify(MOCK_CURRENT_TEACHER) });
    }
    // batch fetch of all member teachers
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify(MOCK_TEACHERS) });
  });

  await page.route(`${SUPABASE_BASE}/rest/v1/institutions*`, route =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify(MOCK_INSTITUTION) })
  );

  await page.route(`${SUPABASE_BASE}/rest/v1/institution_admins*`, route =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify(MOCK_ADMIN_LINKS) })
  );

  await page.route(`${SUPABASE_BASE}/rest/v1/institution_teachers*`, route =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify(MOCK_TEACHER_LINKS) })
  );

  await page.route(`${SUPABASE_BASE}/rest/v1/classes*`, route =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify(MOCK_CLASSES) })
  );

  await page.route(`${SUPABASE_BASE}/rest/v1/exams*`, route =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify(MOCK_EXAMS) })
  );

  // Inject session into localStorage before page scripts run (Supabase v2 stores the raw session)
  await page.addInitScript(([key, session]) => {
    localStorage.setItem(key, JSON.stringify(session));
  }, [`sb-${SUPABASE_PROJECT}-auth-token`, MOCK_SESSION]);

  const url = 'file://' + path.resolve(__dirname, '../institution.html') + '?id=' + INST_ID;
  await page.goto(url);

  // Wait for page content to be visible (auth + load complete)
  await expect(page.locator('#pageContent')).toBeVisible({ timeout: 10000 });

  // Log captured debug lines
  console.log('\n=== [loadPage] debug output ===');
  consoleLogs.forEach(l => console.log(l));
  console.log('================================\n');

  // JS errors
  expect(jsErrors, 'JS errors: ' + jsErrors.join('\n')).toHaveLength(0);

  // Institution name renders
  await expect(page.locator('#instName')).toHaveText('Test University');

  // Admin list should show Alice Admin
  await expect(page.locator('#adminList')).toContainText('Alice Admin');

  // Teacher list should show Dwayne Swanson
  await expect(page.locator('#teacherList')).toContainText('Dwayne Swanson');
});
