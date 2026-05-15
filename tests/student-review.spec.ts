/**
 * Student Review page regression tests.
 * Uses ATT3 (Charlotte Leroy) — graded with comments, not yet sent.
 */

import { test, expect } from '@playwright/test';
import { CREDS, IDs } from './helpers/constants';
import { getSupabaseSession, injectSession } from './helpers/auth';
import { mockAISuggest } from './helpers/mock';

let teacherSession: Record<string, unknown>;

test.beforeAll(async () => {
  teacherSession = await getSupabaseSession(CREDS.teacher.email, CREDS.teacher.password);
});

// ATT3 — Charlotte Leroy, all correct, open questions graded with comments
const REVIEW_URL = `/student-review?attempt=${IDs.att3}&exam=${IDs.exam}`;

async function gotoReview(
  page: import('@playwright/test').Page,
  lang: 'en' | 'fr' = 'en',
) {
  await mockAISuggest(page);
  await injectSession(page, teacherSession, lang);
  await page.goto(REVIEW_URL);
  // Wait for comment textareas to render (open questions from DB)
  await page.waitForSelector('textarea.comment-textarea', { timeout: 12_000 });
}

// ── Teacher can view open question responses ──────────────────────────────────

test('teacher can view a student open question response', async ({ page }) => {
  await gotoReview(page);
  // Charlotte's Q4 answer is in ATT3 answers_json
  const responseText = 'Paris was founded as Lutetia';
  await expect(page.locator('body')).toContainText(responseText, { timeout: 8_000 });
});

// ── Teacher can add a comment ─────────────────────────────────────────────────

test('teacher can add a comment to an open question', async ({ page }) => {
  await gotoReview(page);
  // Find the first comment textarea and fill it
  const commentArea = page.locator('textarea.comment-textarea').first();
  await expect(commentArea).toBeVisible();
  await commentArea.fill('Test comment added by Playwright');
  // Save changes — #saveBtn is inside dynamically rendered pageContent
  await page.waitForSelector('#saveBtn', { state: 'visible', timeout: 5_000 });
  await page.locator('#saveBtn').click();
  // Toast confirms save
  const toast = page.locator('#toast');
  await expect(toast).toBeVisible({ timeout: 6_000 });
});

// ── Teacher can assign a score ────────────────────────────────────────────────

test('teacher can assign a score to an open question', async ({ page }) => {
  await gotoReview(page);
  // Score inputs use type="text" with class score-text-input
  const scoreInput = page.locator('input.score-text-input').first();
  await expect(scoreInput).toBeVisible();
  await scoreInput.fill('3');
  // Save
  await page.waitForSelector('#saveBtn', { state: 'visible', timeout: 5_000 });
  await page.locator('#saveBtn').click();
  const toast = page.locator('#toast');
  await expect(toast).toBeVisible({ timeout: 6_000 });
});

// ── AI suggest ────────────────────────────────────────────────────────────────

test('AI suggest button triggers and shows suggestion box', async ({ page }) => {
  await gotoReview(page);
  // Click the first AI suggest button (Charlotte has a non-empty q4 answer)
  const aiBtn = page.locator('button', { hasText: /AI suggest|✦/ }).first();
  await expect(aiBtn).toBeVisible({ timeout: 8_000 });
  await aiBtn.click();
  // AI suggestion box should appear with mocked score
  await expect(page.locator('.ai-suggestion').first()).toBeVisible({ timeout: 8_000 });
  await expect(page.locator('.ai-score-chip').first()).toContainText('4');
});

// ── Language switching ────────────────────────────────────────────────────────

test('all UI strings switch correctly to French', async ({ page }) => {
  await gotoReview(page, 'fr');
  // Check static header elements (backBtn and badge are in static HTML, not dynamic render)
  await expect(page.locator('[data-i18n="backBtn"]')).toHaveText('Toutes les soumissions');
  await expect(page.locator('[data-i18n="badge"]')).toHaveText('Enseignant');
});

test('all UI strings switch correctly to English', async ({ page }) => {
  await gotoReview(page, 'en');
  await expect(page.locator('[data-i18n="backBtn"]')).toHaveText('All submissions');
  await expect(page.locator('[data-i18n="badge"]')).toHaveText('Teacher');
  await expect(page.locator('[data-i18n="saveBtn"]')).toHaveText('Save changes');
});
