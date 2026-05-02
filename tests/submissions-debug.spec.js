// @ts-check
const { test, expect } = require('@playwright/test');

const SUPABASE_PROJECT = 'toxgihdyfzdymgidgvaq';
const SUPABASE_BASE    = `https://${SUPABASE_PROJECT}.supabase.co`;

const TEACHER_ID = '4a7cac18-c80c-4d84-8459-2b8ca8e753e1';
const EXAM_ID    = 'test-exam-id-001';

const MOCK_SESSION = {
  access_token:  'fake-teacher-token',
  token_type:    'bearer',
  expires_in:    3600,
  expires_at:    Math.floor(Date.now() / 1000) + 3600,
  refresh_token: 'fake-refresh',
  user: { id: TEACHER_ID, email: 'dwayne.swanson@e-cdp.com', role: 'authenticated', app_metadata: {}, user_metadata: {}, aud: 'authenticated' },
};

const MOCK_TEACHER = { id: TEACHER_ID, full_name: 'Dwayne Swanson', email: 'dwayne.swanson@e-cdp.com', role: 'teacher' };
const MOCK_EXAM = {
  id: EXAM_ID, title: 'Test Exam', duration_mins: 60,
  created_at: new Date().toISOString(), access_code: 'TEST-2026',
  groups: null, group_codes: null, share_id: 'abc123', rubric: null
};

test('submissions: setSession failure leaves page blank', async ({ page }) => {
  const jsErrors = [];
  page.on('pageerror', err => { jsErrors.push(err.message); console.error('JS ERROR:', err.message); });
  page.on('console', msg => console.log(`[${msg.type()}]`, msg.text()));

  // Simulate setSession (token refresh) FAILING — this is what happens in production
  // when the refresh token is invalid/expired
  await page.route(`${SUPABASE_BASE}/auth/v1/token*`, route => {
    console.log('⚠️  auth/v1/token hit (setSession) — returning error');
    return route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'invalid_grant', error_description: 'Invalid Refresh Token' })
    });
  });

  await page.route(`${SUPABASE_BASE}/rest/v1/teachers*`, route =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify(MOCK_TEACHER) })
  );
  await page.route(`${SUPABASE_BASE}/rest/v1/exams*`, route =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify(MOCK_EXAM) })
  );
  await page.route(`${SUPABASE_BASE}/rest/v1/exam_attempts*`, route =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify([]) })
  );
  await page.route(`${SUPABASE_BASE}/rest/v1/questions*`, route =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify([]) })
  );
  await page.route(`${SUPABASE_BASE}/rest/v1/institution_teachers*`, route =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify([]) })
  );

  await page.addInitScript(([key, session]) => {
    localStorage.setItem(key, JSON.stringify(session));
  }, [`sb-${SUPABASE_PROJECT}-auth-token`, MOCK_SESSION]);

  await page.goto(`http://localhost:3000/submissions.html?exam=${EXAM_ID}`);
  await page.waitForTimeout(4000);

  const isVisible = await page.locator('#pageContent').isVisible();
  const url = page.url();
  console.log('pageContent visible:', isVisible);
  console.log('current URL after wait:', url);
  console.log('JS errors:', jsErrors);
});

test('submissions: no session stored — should redirect to dashboard', async ({ page }) => {
  const jsErrors = [];
  page.on('pageerror', err => jsErrors.push(err.message));

  // No localStorage session injected — simulates unauthenticated state
  await page.goto(`http://localhost:3000/submissions.html?exam=${EXAM_ID}`);
  await page.waitForTimeout(3000);

  const url = page.url();
  const isVisible = await page.locator('#pageContent').isVisible();
  console.log('URL (should be dashboard):', url);
  console.log('pageContent visible (should be false):', isVisible);
  console.log('JS errors:', jsErrors);
});

test('submissions: valid session — pageContent must become visible', async ({ page }) => {
  const jsErrors = [];
  page.on('pageerror', err => { jsErrors.push(err.message); console.error('JS ERROR:', err.message); });
  page.on('console', msg => {
    if (msg.type() === 'error') console.error('CONSOLE ERROR:', msg.text());
  });
  page.on('requestfailed', req => console.error('NETWORK FAIL:', req.url(), req.failure()?.errorText));

  // setSession succeeds (returns new session)
  await page.route(`${SUPABASE_BASE}/auth/v1/token*`, route =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify(MOCK_SESSION) })
  );
  await page.route(`${SUPABASE_BASE}/rest/v1/teachers*`, route =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify(MOCK_TEACHER) })
  );
  await page.route(`${SUPABASE_BASE}/rest/v1/exams*`, route =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify(MOCK_EXAM) })
  );
  await page.route(`${SUPABASE_BASE}/rest/v1/exam_attempts*`, route =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify([]) })
  );
  await page.route(`${SUPABASE_BASE}/rest/v1/questions*`, route =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify([]) })
  );
  await page.route(`${SUPABASE_BASE}/rest/v1/institution_teachers*`, route =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify([]) })
  );

  await page.addInitScript(([key, session]) => {
    localStorage.setItem(key, JSON.stringify(session));
  }, [`sb-${SUPABASE_PROJECT}-auth-token`, MOCK_SESSION]);

  await page.goto(`http://localhost:3000/submissions.html?exam=${EXAM_ID}`);

  await expect(page.locator('#pageContent')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('#examTitle')).toContainText('Test Exam');
  expect(jsErrors).toHaveLength(0);
  console.log('✅ pageContent visible, exam title correct, no JS errors');
});
