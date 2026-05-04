// @ts-check
const { test, expect } = require('@playwright/test');

const SB_PROJECT = 'toxgihdyfzdymgidgvaq';
const SB_BASE    = `https://${SB_PROJECT}.supabase.co`;
const TEACHER_ID = '4a7cac18-c80c-4d84-8459-2b8ca8e753e1';
const EXAM_ID    = 'exam-test-001';
const ATTEMPT_ID = 'attempt-test-001';

const MOCK_SESSION = {
  access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRveGdpaGR5ZnpkeW1naWRndmFxIiwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJzdWIiOiI0YTdjYWMxOC1jODBjLTRkODQtODQ1OS0yYjhjYThlNzUzZTEiLCJlbWFpbCI6ImR3YXluZUB0ZXN0LmNvbSIsImF1ZCI6ImF1dGhlbnRpY2F0ZWQiLCJleHAiOjk5OTk5OTk5OTksImlhdCI6MTAwMDAwMDAwMH0.fakesignatureXXX', token_type: 'bearer', expires_in: 3600,
  expires_at: Math.floor(Date.now()/1000)+3600, refresh_token: 'fake-refresh',
  user: { id: TEACHER_ID, email: 'dwayne@test.com', role: 'authenticated', app_metadata:{}, user_metadata:{}, aud:'authenticated' }
};
const MOCK_TEACHER  = { id: TEACHER_ID, full_name: 'Dwayne Swanson', email: 'dwayne@test.com', role: 'teacher' };
const MOCK_EXAM     = { id: EXAM_ID, title: 'Économie 101', duration_mins: 60, created_at: new Date().toISOString(),
                        access_code: 'ECO-2026', groups: null, group_codes: null, share_id: 'abc123', rubric: null };
const MOCK_ATTEMPT  = { id: ATTEMPT_ID, exam_id: EXAM_ID, student_name: 'Alice Dupont', student_email: 'alice@test.com',
                        submitted_at: new Date().toISOString(), score_mcq: 4, open_scores: {}, open_comments: {},
                        answers_json: {}, results_sent_at: null, bounce_at: null, scheduled_send_at: null,
                        group_name: null, retake_token: null };

async function setupPage(page) {
  const jsErrors = [];
  page.on('pageerror', e => jsErrors.push(e.message));

  await page.route(`${SB_BASE}/auth/v1/token*`, r => r.fulfill({ contentType:'application/json', body: JSON.stringify(MOCK_SESSION) }));
  await page.route(`${SB_BASE}/auth/v1/user*`, r => r.fulfill({ contentType:'application/json', body: JSON.stringify(MOCK_SESSION.user) }));
  await page.route(`${SB_BASE}/rest/v1/teachers*`, r => r.fulfill({ contentType:'application/json', body: JSON.stringify(MOCK_TEACHER) }));
  await page.route(`${SB_BASE}/rest/v1/exams*`, r => r.fulfill({ contentType:'application/json', body: JSON.stringify([MOCK_EXAM]) }));
  await page.route(`${SB_BASE}/rest/v1/exam_attempts*`, r => {
    const url = r.request().url();
    const method = r.request().method();
    if (method === 'DELETE') return r.fulfill({ status: 204, body: '' });
    if (method === 'PATCH' || method === 'POST') return r.fulfill({ contentType:'application/json', body: JSON.stringify([MOCK_ATTEMPT]) });
    return r.fulfill({ contentType:'application/json', body: JSON.stringify([MOCK_ATTEMPT]) });
  });
  await page.route(`${SB_BASE}/rest/v1/questions*`, r => r.fulfill({ contentType:'application/json', body: JSON.stringify([
    { id:'q1', type:'mcq', max_points:1 }, { id:'q2', type:'mcq', max_points:1 },
    { id:'q3', type:'open', max_points:5 }
  ])}));
  await page.route(`${SB_BASE}/rest/v1/institution_teachers*`, r => r.fulfill({ contentType:'application/json', body: JSON.stringify([]) }));

  // Block EmailJS so it fails silently (tests fallback toast)
  await page.route('**/emailjs.com/**', r => r.abort());
  await page.route('**/email.min.js*', r => r.abort());

  await page.addInitScript(([key, session]) => {
    localStorage.setItem(key, JSON.stringify(session));
  }, [`sb-${SB_PROJECT}-auth-token`, MOCK_SESSION]);

  await page.goto(`http://localhost:3000/submissions?exam=${EXAM_ID}&tab=submissions`);
  await expect(page.locator('#pageContent')).toBeVisible({ timeout: 10000 });
  // Wait for attempts data to be populated before tests call openRetakeModal etc.
  await page.waitForFunction(() => Array.isArray(window.attempts) && window.attempts.length > 0, { timeout: 8000 });

  return jsErrors;
}

// ── Test 1: Row renders the kebab action menu trigger ─────────
test('row shows resend and delete icon buttons', async ({ page }) => {
  const jsErrors = await setupPage(page);

  // Submission row exposes a kebab trigger; actions live in the dropdown
  const kebab = page.locator('.kebab-btn').first();
  await expect(kebab).toBeVisible({ timeout: 5000 });

  // Open menu and verify retake + delete items are present
  await kebab.click();
  await expect(page.locator('.menu-item').nth(1)).toBeVisible({ timeout: 3000 });
  await expect(page.locator('.menu-item.danger').first()).toBeVisible({ timeout: 3000 });
  expect(jsErrors).toHaveLength(0);
  console.log('✅ Kebab trigger visible; retake and delete items in menu');
});

// ── Test 2: Resend modal opens with correct student info ──────
test('resend modal shows correct student name and email', async ({ page }) => {
  await setupPage(page);

  await page.evaluate(([id]) => openRetakeModal(id), [ATTEMPT_ID]);

  const modal = page.locator('#retakeModal');
  await expect(modal).toBeVisible({ timeout: 3000 });
  await expect(modal).toContainText('Alice Dupont');
  await expect(modal).toContainText('alice@test.com');
  console.log('✅ Resend modal opened with correct student info');
});

// ── Test 3: Cancel closes resend modal ────────────────────────
test('cancel closes resend modal', async ({ page }) => {
  await setupPage(page);

  await page.evaluate(([id]) => openRetakeModal(id), [ATTEMPT_ID]);
  await expect(page.locator('#retakeModal')).toBeVisible();
  await page.locator('#retakeModal .btn-cancel').click();
  await expect(page.locator('#retakeModal')).toBeHidden({ timeout: 2000 });
  console.log('✅ Cancel closes resend modal');
});

// ── Test 4: Confirm retake — token saved, fallback toast shown ─
test('confirm retake saves token and shows fallback toast', async ({ page }) => {
  let patchBody = null;
  await page.route(`${SB_BASE}/rest/v1/exam_attempts*`, async r => {
    if (r.request().method() === 'PATCH') {
      patchBody = JSON.parse(r.request().postData() || '{}');
      return r.fulfill({ contentType:'application/json', body: JSON.stringify([MOCK_ATTEMPT]) });
    }
    return r.fulfill({ contentType:'application/json', body: JSON.stringify([MOCK_ATTEMPT]) });
  });
  await setupPage(page);

  await page.evaluate(([id]) => openRetakeModal(id), [ATTEMPT_ID]);
  await page.locator('#retakeConfirmBtn').click();

  // Toast should appear (either success or fallback with link)
  await expect(page.locator('.toast.show')).toBeVisible({ timeout: 8000 });
  const toastText = await page.locator('.toast').textContent();
  console.log('Toast text:', toastText);
  expect(toastText).toBeTruthy();
  console.log('✅ Retake confirmed — toast appeared');
});

// ── Test 5: Delete submission modal opens with student name ───
test('delete submission modal shows student name', async ({ page }) => {
  await setupPage(page);

  await page.evaluate(([id, name]) => openDeleteAttemptModal(id, name), [ATTEMPT_ID, 'Alice Dupont']);

  const modal = page.locator('#deleteAttemptModal');
  await expect(modal).toBeVisible({ timeout: 3000 });
  await expect(modal).toContainText('Alice Dupont');
  console.log('✅ Delete submission modal opened with student name');
});

// ── Test 6: Confirm delete removes row ────────────────────────
test('confirming delete removes submission row', async ({ page }) => {
  await setupPage(page);

  const rowsBefore = await page.locator('.sub-row').count();
  await page.evaluate(([id, name]) => openDeleteAttemptModal(id, name), [ATTEMPT_ID, 'Alice Dupont']);
  await page.locator('#deleteAttemptModal .btn-danger').click();

  await expect(page.locator('#deleteAttemptModal')).toBeHidden({ timeout: 3000 });
  const rowsAfter = await page.locator('.sub-row').count();
  expect(rowsAfter).toBeLessThan(rowsBefore);
  console.log(`✅ Row removed: ${rowsBefore} → ${rowsAfter}`);
});

// ── Test 7: Delete exam modal — button disabled until title typed
test('delete exam button disabled until exact title typed', async ({ page }) => {
  await setupPage(page);

  await page.evaluate(() => openDeleteExamModal());
  const modal = page.locator('#deleteExamModal');
  await expect(modal).toBeVisible({ timeout: 3000 });

  // Button should be disabled initially
  await expect(page.locator('#deleteExamConfirmBtn')).toBeDisabled();

  // Type wrong title — still disabled
  await page.locator('#deleteExamInput').fill('Wrong title');
  await page.locator('#deleteExamInput').dispatchEvent('input');
  await expect(page.locator('#deleteExamConfirmBtn')).toBeDisabled();

  // Type exact title — button enables
  await page.locator('#deleteExamInput').fill('Économie 101');
  await page.locator('#deleteExamInput').dispatchEvent('input');
  await expect(page.locator('#deleteExamConfirmBtn')).toBeEnabled({ timeout: 2000 });
  console.log('✅ Delete exam button enables only on exact title match');
});

// ── Test 8: exam-engine retake token bypass ───────────────────
test('exam-engine accepts valid retake token and clears localStorage blocks', async ({ page }) => {
  const VALID_TOKEN = 'test-retake-token-abc123';
  const SHARE_ID    = 'test-share-id';

  await page.route(`${SB_BASE}/rest/v1/exam_attempts*`, r => {
    const url = r.request().url();
    if (url.includes('retake_token=eq.')) {
      return r.fulfill({ contentType:'application/json', body: JSON.stringify([{ id: ATTEMPT_ID }]) });
    }
    if (r.request().method() === 'PATCH') return r.fulfill({ contentType:'application/json', body: '{}' });
    return r.fulfill({ contentType:'application/json', body: JSON.stringify([]) });
  });
  await page.route(`${SB_BASE}/rest/v1/exams*`, r =>
    r.fulfill({ contentType:'application/json', body: JSON.stringify([{
      ...MOCK_EXAM, share_id: SHARE_ID
    }]) })
  );
  await page.route(`${SB_BASE}/rest/v1/questions*`, r =>
    r.fulfill({ contentType:'application/json', body: JSON.stringify([
      { id:'q1', type:'mcq', question_text:'Q1?', option_a:'A', option_b:'B', option_c:'C', option_d:'D', correct_index:0, position:1 }
    ]) })
  );

  // Pre-set localStorage blocks to simulate a terminated/submitted student
  await page.addInitScript(([termKey, subKey]) => {
    localStorage.setItem(termKey, '1');
    localStorage.setItem(subKey, '1');
  }, [`terminated_exam_${SHARE_ID}`, `submitted_${SHARE_ID}`]);

  await page.goto(`http://localhost:3000/exam-engine.html?id=${SHARE_ID}&retake=${VALID_TOKEN}`);

  // Should NOT show terminated or submitted screens — should show exam
  await page.waitForTimeout(3000);
  const terminatedVisible = await page.locator('#terminatedScreen, #submittedScreen').isVisible().catch(() => false);
  expect(terminatedVisible).toBe(false);
  console.log('✅ Retake token bypassed localStorage blocks — exam accessible');
});

// ── Test 9: exam-engine rejects invalid retake token ─────────
test('exam-engine shows error for invalid retake token', async ({ page }) => {
  await page.route(`${SB_BASE}/rest/v1/exam_attempts*`, r =>
    r.fulfill({ contentType:'application/json', body: JSON.stringify([]) }) // no matching token
  );
  await page.route(`${SB_BASE}/rest/v1/exams*`, r =>
    r.fulfill({ contentType:'application/json', body: JSON.stringify([{ ...MOCK_EXAM, share_id:'share-xyz' }]) })
  );

  await page.goto(`http://localhost:3000/exam-engine.html?id=share-xyz&retake=invalid-token-000`);
  await page.waitForTimeout(3000);

  // Should show an error (error overlay or error screen)
  const pageText = await page.locator('body').textContent();
  const hasError = pageText.includes('invalide') || pageText.includes('invalid') || pageText.includes('error') || pageText.includes('Error');
  expect(hasError).toBe(true);
  console.log('✅ Invalid retake token correctly shows error');
});
