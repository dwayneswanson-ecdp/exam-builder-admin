/**
 * Exam Engine tests — student-facing page, no session required.
 *
 * Zone 1: pre-exam screens (login card + confirm card).
 * Zone 2: active exam (questions rendered, anti-translation gate active).
 *
 * All Supabase REST calls are mocked so these tests run offline and fast.
 */

import { test, expect } from '@playwright/test';
import { IDs, SUPABASE_URL } from './helpers/constants';

const SB_BASE    = SUPABASE_URL;
const ENGINE_URL = `/exam-engine?id=${IDs.examShare}`;

const MOCK_EXAM = {
  id:            IDs.exam,
  title:         'Playwright Test Exam',
  share_id:      IDs.examShare,
  access_code:   IDs.examCode,
  lang:          'fr',
  groups:        'Test Group A',
  group_codes:   JSON.stringify({ 'Test Group A': IDs.examGroupCode }),
  instructions:  null,
  teacher_email: 'teacher@test-flo.com',
  duration_mins: 30,
};

const MOCK_QUESTIONS = [
  { id: 'feed0301-0000-4000-8000-000000000001', exam_id: IDs.exam, position: 0, type: 'mcq',
    question_text: 'What is the capital of France?',
    option_a: 'Paris', option_b: 'Lyon', option_c: 'Marseille', option_d: 'Bordeaux',
    correct_index: 0, max_points: 1 },
  { id: 'feed0302-0000-4000-8000-000000000001', exam_id: IDs.exam, position: 1, type: 'mcq',
    question_text: 'In which year did the French Revolution begin?',
    option_a: '1776', option_b: '1789', option_c: '1799', option_d: '1815',
    correct_index: 1, max_points: 1 },
  { id: 'feed0303-0000-4000-8000-000000000001', exam_id: IDs.exam, position: 2, type: 'mcq',
    question_text: 'Who was the last king of France before the Revolution?',
    option_a: 'Louis XIV', option_b: 'Napoleon Bonaparte', option_c: 'Louis XVI', option_d: 'Charles X',
    correct_index: 2, max_points: 1 },
  { id: 'feed0304-0000-4000-8000-000000000001', exam_id: IDs.exam, position: 3, type: 'open',
    question_text: 'Describe the founding and early history of Paris.',
    option_a: null, option_b: null, option_c: null, option_d: null,
    correct_index: null, max_points: 5 },
  { id: 'feed0305-0000-4000-8000-000000000001', exam_id: IDs.exam, position: 4, type: 'open',
    question_text: 'What were the main causes of the French Revolution?',
    option_a: null, option_b: null, option_c: null, option_d: null,
    correct_index: null, max_points: 5 },
];

async function setupExamEngine(page: import('@playwright/test').Page) {
  await page.route(`${SB_BASE}/rest/v1/exams*`, route =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify([MOCK_EXAM]) })
  );
  await page.route(`${SB_BASE}/rest/v1/questions*`, route =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify(MOCK_QUESTIONS) })
  );
  await page.route(`${SB_BASE}/rest/v1/exam_attempts*`, route => {
    if (route.request().method() === 'GET') {
      return route.fulfill({ contentType: 'application/json', body: '[]' });
    }
    return route.fulfill({ contentType: 'application/json',
      body: JSON.stringify([{ id: 'mock-att-001', exam_id: IDs.exam }]) });
  });
}

// ── Helper: complete Zone 1 and enter Zone 2 ─────────────────────────────────

async function completeZone1(
  page: import('@playwright/test').Page,
  opts: { name?: string; email?: string; code?: string } = {},
) {
  const { name = 'Test', email = 'student@test-flo.com', code = IDs.examGroupCode } = opts;

  await page.waitForSelector('#loginScreen', { state: 'visible', timeout: 12_000 });

  // Fill login card
  await page.locator('#inputLastName').fill('PLAYWRIGHT');
  await page.locator('#inputFirstName').fill(name);
  await page.locator('#inputEmail').fill(email);

  // Select group if dropdown is visible
  const groupRow = page.locator('#groupRow');
  if (await groupRow.isVisible()) {
    await page.locator('#inputGroup').selectOption(IDs.examGroup);
  }

  await page.locator('#inputCode').fill(code);
  await page.locator('#loginBtn').click();

  // Confirm screen
  await page.waitForSelector('#confirmScreen', { state: 'visible', timeout: 8_000 });
  await page.locator('#confirmAcknowledge').check();
  await expect(page.locator('#confirmStartBtn')).toBeEnabled({ timeout: 3_000 });
  await page.locator('#confirmStartBtn').click();

  // Wait for exam screen to appear (examScreen is shown after buildQuestions())
  await page.waitForSelector('#examScreen, .q-card', {
    state: 'visible',
    timeout: 10_000,
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// Zone 1 — Language picker on pre-exam screens
// ═════════════════════════════════════════════════════════════════════════════

test('Zone 1 login card renders in French by default', async ({ page }) => {
  await setupExamEngine(page);
  await page.goto(ENGINE_URL);
  await page.waitForSelector('#loginScreen', { state: 'visible', timeout: 12_000 });
  // Default language is FR (exam lang='fr') — loginTitle shows the translated title
  await expect(page.locator('#loginTitle')).toHaveText("Commencer l'épreuve", { timeout: 6_000 });
  // FR button should be active
  await expect(page.locator('#plpFR')).toHaveClass(/active/);
});

test('Zone 1 language toggle switches all pre-exam strings to English', async ({ page }) => {
  await setupExamEngine(page);
  await page.goto(ENGINE_URL);
  await page.waitForSelector('#loginScreen', { state: 'visible', timeout: 12_000 });
  await page.locator('#plpEN').click();
  await expect(page.locator('#loginTitle')).toHaveText('Start the exam', { timeout: 4_000 });
  await expect(page.locator('#plpEN')).toHaveClass(/active/);
  // Confirm label also switches
  await expect(page.locator('#labelCode')).not.toHaveText('Code d\'accès');
});

test('Zone 1 language toggle switches back to French correctly', async ({ page }) => {
  await setupExamEngine(page);
  await page.goto(ENGINE_URL);
  await page.waitForSelector('#loginScreen', { state: 'visible', timeout: 12_000 });
  await page.locator('#plpEN').click();
  await expect(page.locator('#loginTitle')).toHaveText('Start the exam', { timeout: 4_000 });
  await page.locator('#plpFR').click();
  await expect(page.locator('#loginTitle')).toHaveText("Commencer l'épreuve", { timeout: 4_000 });
});

// ═════════════════════════════════════════════════════════════════════════════
// Zone 2 — Active exam
// ═════════════════════════════════════════════════════════════════════════════

test('Zone 2 exam questions render on screen after zone 1 completes', async ({ page }) => {
  await setupExamEngine(page);
  await page.goto(ENGINE_URL);
  await completeZone1(page);
  // MCQ question text from mock data is always visible once exam starts
  await expect(page.locator('body')).toContainText('What is the capital of France?', { timeout: 8_000 });
});

test('Zone 2 language picker (#preLangPicker) is not visible once exam has started', async ({ page }) => {
  await setupExamEngine(page);
  await page.goto(ENGINE_URL);
  await completeZone1(page);
  // After exam starts, the pre-exam lang picker must be hidden
  await expect(page.locator('#preLangPicker')).toBeHidden({ timeout: 5_000 });
});

// ═════════════════════════════════════════════════════════════════════════════
// Zone 2 — Anti-translation gate (can be triggered before starting exam too,
// since the MutationObserver is set up at page load)
// ═════════════════════════════════════════════════════════════════════════════

test('anti-translation: adding .translated-ltr to <html> shows block overlay', async ({ page }) => {
  await setupExamEngine(page);
  await page.goto(ENGINE_URL);
  // Observer is set up at page load — no need to be in Zone 2
  await page.waitForSelector('#loginScreen', { state: 'visible', timeout: 12_000 });
  // Simulate Chrome auto-translate
  await page.evaluate('document.documentElement.classList.add("translated-ltr")');
  await expect(page.locator('#translationBlockOverlay')).toHaveClass(/show/, { timeout: 3_000 });
});

test('anti-translation: incident is logged in sessionEvents when translation detected', async ({ page }) => {
  await setupExamEngine(page);
  await page.goto(ENGINE_URL);
  await page.waitForSelector('#loginScreen', { state: 'visible', timeout: 12_000 });
  await page.evaluate('document.documentElement.classList.add("translated-ltr")');
  // Wait for overlay
  await expect(page.locator('#translationBlockOverlay')).toHaveClass(/show/, { timeout: 3_000 });
  // Check sessionEvents contains the translation event
  // sessionEvents is a const in the page script scope, accessible via evaluate string
  const hasEvent = await page.evaluate(
    'typeof sessionEvents !== "undefined" && sessionEvents.some(e => e.type === "translation_detected")'
  );
  expect(hasEvent).toBe(true);
});

test('anti-translation: student cannot interact with exam after translation detected', async ({ page }) => {
  await setupExamEngine(page);
  await page.goto(ENGINE_URL);
  await page.waitForSelector('#loginScreen', { state: 'visible', timeout: 12_000 });
  await page.evaluate('document.documentElement.classList.add("translated-ltr")');
  await expect(page.locator('#translationBlockOverlay')).toHaveClass(/show/, { timeout: 3_000 });

  // The overlay is full-screen and fixed — verify it covers the viewport
  const overlay = page.locator('#translationBlockOverlay');
  const box = await overlay.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeGreaterThan(0);
  expect(box!.height).toBeGreaterThan(0);

  // Clicks on the login form beneath should NOT reach the input
  // (overlay sits at z-index 99999 and is flex display)
  const loginBtnBox = await page.locator('#loginBtn').boundingBox();
  if (loginBtnBox) {
    const cx = loginBtnBox.x + loginBtnBox.width / 2;
    const cy = loginBtnBox.y + loginBtnBox.height / 2;
    // The element at that point should be the overlay, not the login button
    const topEl = await page.evaluate(
      ({ x, y }) => document.elementFromPoint(x, y)?.id ?? 'unknown',
      { x: cx, y: cy },
    );
    expect(topEl).not.toBe('loginBtn');
  }
});
