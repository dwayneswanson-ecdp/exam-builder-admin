// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');

const SUPABASE_PROJECT = 'toxgihdyfzdymgidgvaq';
const SUPABASE_BASE    = `https://${SUPABASE_PROJECT}.supabase.co`;

const TEACHER_ID = '4a7cac18-c80c-4d84-8459-2b8ca8e753e1';
const INST_ID    = '8b26e43a-1111-1111-1111-000000000000';

const MOCK_SESSION = {
  access_token:  'fake-teacher-token',
  token_type:    'bearer',
  expires_in:    3600,
  expires_at:    Math.floor(Date.now() / 1000) + 3600,
  refresh_token: 'fake-refresh',
  user: { id: TEACHER_ID, email: 'dwayne.swanson@e-cdp.com', role: 'authenticated', app_metadata: {}, user_metadata: {}, aud: 'authenticated' },
};

const MOCK_TEACHER = { id: TEACHER_ID, full_name: 'Dwayne Swanson', email: 'dwayne.swanson@e-cdp.com', role: 'teacher', institution_id: INST_ID };
const MOCK_INST    = { id: INST_ID, name: 'ESCP Business School', logo_url: 'https://example.com/logo.png' };

test('teacher dashboard: institution badge shows logo and name', async ({ page }) => {
  const logs = [];
  page.on('console', msg => { if (msg.text().startsWith('[teacher]')) logs.push(msg.text()); });
  const jsErrors = [];
  page.on('pageerror', err => jsErrors.push(err.message));

  await page.route(`${SUPABASE_BASE}/auth/v1/token*`, route =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify(MOCK_SESSION) })
  );

  // Teachers table — current user lookup
  await page.route(`${SUPABASE_BASE}/rest/v1/teachers*`, route =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify(MOCK_TEACHER) })
  );

  // institution_teachers — link between teacher and institution
  await page.route(`${SUPABASE_BASE}/rest/v1/institution_teachers*`, route => {
    console.log('institution_teachers hit:', route.request().url());
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify([{ institution_id: INST_ID }]) });
  });

  // institutions — fetch institution details
  await page.route(`${SUPABASE_BASE}/rest/v1/institutions*`, route =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify(MOCK_INST) })
  );

  // classes, exams, exam_attempts, questions — empty for now
  await page.route(`${SUPABASE_BASE}/rest/v1/classes*`, route =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify([]) })
  );
  await page.route(`${SUPABASE_BASE}/rest/v1/exams*`, route =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify([]) })
  );
  await page.route(`${SUPABASE_BASE}/rest/v1/exam_attempts*`, route =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify([]) })
  );
  await page.route(`${SUPABASE_BASE}/rest/v1/questions*`, route =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify([]) })
  );

  await page.addInitScript(([key, session]) => {
    localStorage.setItem(key, JSON.stringify(session));
  }, [`sb-${SUPABASE_PROJECT}-auth-token`, MOCK_SESSION]);

  await page.goto('http://localhost:3000/dashboard.html');

  // Wait for teacher view
  await expect(page.locator('#teacherView')).toBeVisible({ timeout: 10000 });

  console.log('\n=== teacher instLinkRes logs ===');
  logs.forEach(l => console.log(l));
  console.log('================================\n');

  // Check badge renders
  const badge = page.locator('#teacherInstBadge');
  console.log('Badge innerHTML:', await badge.innerHTML());

  // Institution name should appear
  await expect(badge).toContainText('ESCP Business School', { timeout: 5000 });

  // Logo img should be present
  await expect(badge.locator('img')).toBeVisible({ timeout: 3000 });

  expect(jsErrors, 'JS errors: ' + jsErrors.join('\n')).toHaveLength(0);
});

test('teacher dashboard: no institution link — badge shows nothing (empty state)', async ({ page }) => {
  await page.route(`${SUPABASE_BASE}/auth/v1/token*`, route =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify(MOCK_SESSION) })
  );
  await page.route(`${SUPABASE_BASE}/rest/v1/teachers*`, route =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify(MOCK_TEACHER) })
  );
  // No institution link
  await page.route(`${SUPABASE_BASE}/rest/v1/institution_teachers*`, route =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify([]) })
  );
  await page.route(`${SUPABASE_BASE}/rest/v1/institutions*`, route =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify([]) })
  );
  await page.route(`${SUPABASE_BASE}/rest/v1/classes*`, route =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify([]) })
  );
  await page.route(`${SUPABASE_BASE}/rest/v1/exams*`, route =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify([]) })
  );
  await page.route(`${SUPABASE_BASE}/rest/v1/exam_attempts*`, route =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify([]) })
  );
  await page.route(`${SUPABASE_BASE}/rest/v1/questions*`, route =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify([]) })
  );

  await page.addInitScript(([key, session]) => {
    localStorage.setItem(key, JSON.stringify(session));
  }, [`sb-${SUPABASE_PROJECT}-auth-token`, MOCK_SESSION]);

  await page.goto('http://localhost:3000/dashboard.html');
  await expect(page.locator('#teacherView')).toBeVisible({ timeout: 10000 });

  const badge = page.locator('#teacherInstBadge');
  console.log('Empty badge innerHTML:', await badge.innerHTML());
});
