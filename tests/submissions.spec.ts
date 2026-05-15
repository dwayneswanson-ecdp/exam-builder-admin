/**
 * Submissions page regression tests.
 *
 * Seed is reset at the start of each run via beforeAll so destructive tests
 * (delete) don't affect other tests. The delete test is placed last.
 */

import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import path from 'path';
import { CREDS, IDs, LANG_KEY } from './helpers/constants';
import { getSupabaseSession, injectSession } from './helpers/auth';
import { mockEmailSend } from './helpers/mock';

let teacherSession: Record<string, unknown>;

test.beforeAll(async () => {
  // Reset seed so every run starts from clean state
  execSync(`node ${path.join(__dirname, 'seed.js')}`, { stdio: 'pipe' });
  teacherSession = await getSupabaseSession(CREDS.teacher.email, CREDS.teacher.password);
});

const SUBS_URL = `/submissions?exam=${IDs.exam}`;

async function gotoSubmissions(page: import('@playwright/test').Page, lang: 'en' | 'fr' = 'en') {
  await mockEmailSend(page);
  await injectSession(page, teacherSession, lang);
  await page.goto(SUBS_URL);
  await page.waitForSelector('#pageContent', { state: 'visible', timeout: 12_000 });
  // Navigate to submissions tab
  await page.locator('button[data-tab="submissions"]').click();
  await page.waitForSelector('#subList .sub-row', { timeout: 10_000 });
}

// ── Score display ─────────────────────────────────────────────────────────────

test('score displays correctly combining MCQ and open question scores', async ({ page }) => {
  await gotoSubmissions(page);
  // ATT1: Alice Martin — MCQ score 2, open 4+4=8, total 10/13
  const rows = page.locator('#subList .sub-row');
  await expect(rows).toHaveCount(3, { timeout: 8_000 });

  // Find Alice's row
  const aliceRow = page.locator('#subList .sub-row', { hasText: 'MARTIN Alice' });
  await expect(aliceRow).toBeVisible();
  const scoreEl = aliceRow.locator('.sub-score');
  const scoreText = await scoreEl.textContent();
  // Alice: MCQ 2/3 + open 8/10 = total 10/13
  expect(scoreText).toContain('10');
  expect(scoreText).toContain('13');
});

// ── Send results ──────────────────────────────────────────────────────────────

test('results can be sent to a student successfully', async ({ page }) => {
  await gotoSubmissions(page, 'en');
  // Select Bob's row (ATT2 — pending, not yet sent)
  const bobRow = page.locator('#subList .sub-row', { hasText: 'DUPONT Bob' });
  await expect(bobRow).toBeVisible();
  await bobRow.locator('input[type="checkbox"]').check();

  await page.locator('#sendNowBtn').click();
  // Toast should appear confirming the send action
  const toast = page.locator('#toast');
  await expect(toast).toBeVisible({ timeout: 8_000 });
});

// ── Schedule send ─────────────────────────────────────────────────────────────

test('schedule send sets a scheduled badge on the submission', async ({ page }) => {
  await gotoSubmissions(page, 'en');
  // Select Bob's row
  const bobRow = page.locator('#subList .sub-row', { hasText: 'DUPONT Bob' });
  await bobRow.locator('input[type="checkbox"]').check();

  // Open schedule picker
  await page.locator('#scheduleToggle').click();
  await expect(page.locator('#schedulePicker')).toBeVisible();

  // Set a future date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yyyy = tomorrow.getFullYear();
  const mm   = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const dd   = String(tomorrow.getDate()).padStart(2, '0');
  await page.locator('#schedDate').fill(`${yyyy}-${mm}-${dd}`);

  // Confirm schedule
  await page.locator('button[data-i18n="confirm"]').click();

  // Toast should confirm scheduling
  const toast = page.locator('#toast');
  await expect(toast).toBeVisible({ timeout: 8_000 });

  // Row should now show scheduled badge
  await expect(bobRow.locator('.badge-sched')).toBeVisible({ timeout: 5_000 });
});

// ── Retake link ───────────────────────────────────────────────────────────────

test('retake link can be copied from row menu', async ({ page }) => {
  await gotoSubmissions(page, 'en');
  // Open row menu for Alice (ATT1)
  const aliceRow = page.locator('#subList .sub-row', { hasText: 'MARTIN Alice' });
  await aliceRow.locator('.kebab-btn').click();
  const menu = page.locator(`#menu-${IDs.att1}`);
  await expect(menu).toBeVisible({ timeout: 5_000 });

  // Grant clipboard permission
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

  // Click "Copy retake link"
  const copyBtn = menu.locator('button', { hasText: 'Copy retake link' });
  await expect(copyBtn).toBeVisible();
  await copyBtn.click();

  const toast = page.locator('#toast');
  await expect(toast).toBeVisible({ timeout: 6_000 });
  await expect(toast).toContainText('copied');
});

// ── Language — UI strings ─────────────────────────────────────────────────────

test('all UI strings switch correctly to French', async ({ page }) => {
  await gotoSubmissions(page, 'fr');
  await expect(page.locator('button[data-i18n="tabOverview"]')).toHaveText('Aperçu');
  await expect(page.locator('[data-i18n="badge"]')).toHaveText('Enseignant');
  await expect(page.locator('[data-i18n="sendNow"] >> ..').first()).toContainText('Envoyer');
});

test('all UI strings switch correctly to English', async ({ page }) => {
  await gotoSubmissions(page, 'en');
  await expect(page.locator('button[data-i18n="tabOverview"]')).toHaveText('Overview');
  await expect(page.locator('[data-i18n="badge"]')).toHaveText('Teacher');
  await expect(page.locator('[data-i18n="sendNow"]').first()).toContainText('Send now');
});

// ── Toast in correct language ─────────────────────────────────────────────────

test('toast message is in French when language is FR', async ({ page }) => {
  await gotoSubmissions(page, 'fr');
  // Click send without selecting — triggers French toast
  await page.locator('#sendNowBtn').click();
  await expect(page.locator('#toast')).toBeVisible({ timeout: 5_000 });
  await expect(page.locator('#toast')).toContainText('Sélectionnez');
});

// ── Delete submission (destructive — placed last) ─────────────────────────────

test('submission can be deleted', async ({ page }) => {
  await gotoSubmissions(page, 'en');
  // Open row menu for Bob (ATT2)
  const bobRow = page.locator('#subList .sub-row', { hasText: 'DUPONT Bob' });
  await expect(bobRow).toBeVisible();
  await bobRow.locator('.kebab-btn').click();
  const menu = page.locator(`#menu-${IDs.att2}`);
  await expect(menu).toBeVisible({ timeout: 5_000 });

  // Click "Delete submission"
  await menu.locator('button.danger', { hasText: 'Delete submission' }).click();

  // Confirm in modal
  const modal = page.locator('#deleteAttemptModal');
  await expect(modal).toBeVisible({ timeout: 5_000 });
  await modal.locator('.btn-danger').click();

  // Bob's row should be gone
  await expect(page.locator('#subList .sub-row', { hasText: 'DUPONT Bob' })).toHaveCount(0, { timeout: 6_000 });

  // Toast confirms
  await expect(page.locator('#toast')).toBeVisible({ timeout: 5_000 });
});
