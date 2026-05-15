/**
 * Language switching tests — one describe block per page.
 *
 * Strategy:
 *  - Set language via localStorage *before* navigation (avoids reload race on
 *    pages that call window.location.reload() on langchange).
 *  - Check 2-3 concrete data-i18n values per page to confirm translation.
 *  - Persistence test: set FR, navigate, reload, assert still FR.
 *  - Toast test (submissions page): trigger a no-selection send and assert
 *    the toast text is in the active language.
 */

import { test, expect } from '@playwright/test';
import { CREDS, IDs, LANG_KEY } from './helpers/constants';
import { getSupabaseSession, injectSession, setLang } from './helpers/auth';
import { mockEmailSend } from './helpers/mock';

// ── Shared sessions (fetched once per worker) ─────────────────────────────────

let teacherSession: Record<string, unknown>;
let adminSession:   Record<string, unknown>;

test.beforeAll(async () => {
  teacherSession = await getSupabaseSession(CREDS.teacher.email, CREDS.teacher.password);
  adminSession   = await getSupabaseSession(CREDS.admin.email,   CREDS.admin.password);
});

// ── Helper: wait for page init ────────────────────────────────────────────────

async function waitForLangReady(page: import('@playwright/test').Page, selector: string) {
  await page.waitForSelector(selector, { state: 'visible', timeout: 12_000 });
}

// ═════════════════════════════════════════════════════════════════════════════
// login.html — no session required
// ═════════════════════════════════════════════════════════════════════════════

test.describe('login.html', () => {

  test('shows French UI when lang=fr', async ({ page }) => {
    await setLang(page, 'fr');
    await page.goto('/login.html');
    await waitForLangReady(page, '#loginBtn');
    await expect(page.locator('#loginBtn')).toHaveText('Continuer');
    await expect(page.locator('#labelEmail')).toHaveText('Adresse e-mail');
  });

  test('shows English UI when lang=en', async ({ page }) => {
    await setLang(page, 'en');
    await page.goto('/login.html');
    await waitForLangReady(page, '#loginBtn');
    await expect(page.locator('#loginBtn')).toHaveText('Continue');
    await expect(page.locator('#labelEmail')).toHaveText('Email address');
  });

  test('language preference persists on reload', async ({ page }) => {
    await setLang(page, 'fr');
    await page.goto('/login.html');
    await waitForLangReady(page, '#loginBtn');
    await page.reload();
    await waitForLangReady(page, '#loginBtn');
    await expect(page.locator('#loginBtn')).toHaveText('Continuer');
  });

  test('error toast appears in active language (FR)', async ({ page }) => {
    await setLang(page, 'fr');
    await page.goto('/login.html');
    await waitForLangReady(page, '#loginBtn');
    // Trigger validation error by submitting with empty fields
    await page.locator('#loginBtn').click();
    const errEl = page.locator('#loginError');
    await expect(errEl).toBeVisible({ timeout: 6_000 });
    const text = await errEl.textContent();
    // FR validation message — should not be the EN "Please fill in all fields."
    expect(text).not.toBe('Please fill in all fields.');
    expect(text?.trim().length).toBeGreaterThan(0);
  });

});

// ═════════════════════════════════════════════════════════════════════════════
// dashboard.html — teacher session
// ═════════════════════════════════════════════════════════════════════════════

test.describe('dashboard.html', () => {

  test('shows French UI when lang=fr', async ({ page }) => {
    await injectSession(page, teacherSession, 'fr');
    await page.goto('/dashboard.html');
    await waitForLangReady(page, '#teacherView');
    await expect(page.locator('h1[data-i18n="teacherPageTitle"]')).toHaveText('Mes examens');
    await expect(page.locator('[data-i18n="logout"]')).toHaveText('Déconnexion');
  });

  test('shows English UI when lang=en', async ({ page }) => {
    await injectSession(page, teacherSession, 'en');
    await page.goto('/dashboard.html');
    await waitForLangReady(page, '#teacherView');
    await expect(page.locator('h1[data-i18n="teacherPageTitle"]')).toHaveText('My Exams');
    await expect(page.locator('[data-i18n="logout"]')).toHaveText('Sign out');
  });

  test('language preference persists on reload', async ({ page }) => {
    await injectSession(page, teacherSession, 'fr');
    await page.goto('/dashboard.html');
    await waitForLangReady(page, '#teacherView');
    await page.reload();
    await waitForLangReady(page, '#teacherView');
    await expect(page.locator('h1[data-i18n="teacherPageTitle"]')).toHaveText('Mes examens');
  });

});

// ═════════════════════════════════════════════════════════════════════════════
// index.html — teacher session (exam import/builder page)
// ═════════════════════════════════════════════════════════════════════════════

test.describe('index.html', () => {

  test('shows French UI when lang=fr', async ({ page }) => {
    await injectSession(page, teacherSession, 'fr');
    await page.goto('/index.html');
    await page.waitForSelector('[data-i18n="cardTitle"]', { timeout: 10_000 });
    await expect(page.locator('[data-i18n="cardTitle"]')).toHaveText("Importer votre document d'examen");
  });

  test('shows English UI when lang=en', async ({ page }) => {
    await injectSession(page, teacherSession, 'en');
    await page.goto('/index.html');
    await page.waitForSelector('[data-i18n="cardTitle"]', { timeout: 10_000 });
    await expect(page.locator('[data-i18n="cardTitle"]')).toHaveText('Import your exam document');
  });

  test('language preference persists on reload', async ({ page }) => {
    await injectSession(page, teacherSession, 'fr');
    await page.goto('/index.html');
    await page.waitForSelector('[data-i18n="cardTitle"]', { timeout: 10_000 });
    await page.reload();
    await page.waitForSelector('[data-i18n="cardTitle"]', { timeout: 10_000 });
    await expect(page.locator('[data-i18n="cardTitle"]')).toHaveText("Importer votre document d'examen");
  });

});

// ═════════════════════════════════════════════════════════════════════════════
// exam-onboarding.html — teacher session
// ═════════════════════════════════════════════════════════════════════════════

test.describe('exam-onboarding.html', () => {

  test('shows French UI when lang=fr', async ({ page }) => {
    await injectSession(page, teacherSession, 'fr');
    await page.goto('/exam-onboarding.html');
    await page.waitForSelector('[data-i18n="pageTitle"]', { timeout: 10_000 });
    await expect(page.locator('[data-i18n="pageTitle"]')).toHaveText('Configurer votre examen');
    await expect(page.locator('[data-i18n="signOut"]')).toHaveText('Se déconnecter');
  });

  test('shows English UI when lang=en', async ({ page }) => {
    await injectSession(page, teacherSession, 'en');
    await page.goto('/exam-onboarding.html');
    await page.waitForSelector('[data-i18n="pageTitle"]', { timeout: 10_000 });
    await expect(page.locator('[data-i18n="pageTitle"]')).toHaveText('Configure your exam');
    await expect(page.locator('[data-i18n="signOut"]')).toHaveText('Sign out');
  });

  test('language preference persists on reload', async ({ page }) => {
    await injectSession(page, teacherSession, 'fr');
    await page.goto('/exam-onboarding.html');
    await page.waitForSelector('[data-i18n="pageTitle"]', { timeout: 10_000 });
    await page.reload();
    await page.waitForSelector('[data-i18n="pageTitle"]', { timeout: 10_000 });
    await expect(page.locator('[data-i18n="pageTitle"]')).toHaveText('Configurer votre examen');
  });

});

// ═════════════════════════════════════════════════════════════════════════════
// exam-review.html — teacher session + exam param
// ═════════════════════════════════════════════════════════════════════════════

test.describe('exam-review.html', () => {

  test('shows French UI when lang=fr', async ({ page }) => {
    await injectSession(page, teacherSession, 'fr');
    await page.goto(`/exam-review?exam=${IDs.exam}`);
    // step-bar pills are always visible in static HTML; use stepConfigure (no HTML entities)
    await page.waitForSelector('[data-i18n="stepConfigure"]', { timeout: 10_000 });
    await expect(page.locator('[data-i18n="stepConfigure"]')).toHaveText('Configurer');
    await expect(page.locator('[data-i18n="stepBuildQs"]')).toHaveText('Créer les questions');
  });

  test('shows English UI when lang=en', async ({ page }) => {
    await injectSession(page, teacherSession, 'en');
    await page.goto(`/exam-review?exam=${IDs.exam}`);
    await page.waitForSelector('[data-i18n="stepConfigure"]', { timeout: 10_000 });
    await expect(page.locator('[data-i18n="stepConfigure"]')).toHaveText('Configure');
    await expect(page.locator('[data-i18n="stepBuildQs"]')).toHaveText('Build questions');
  });

  test('language preference persists on reload', async ({ page }) => {
    await injectSession(page, teacherSession, 'fr');
    await page.goto(`/exam-review?exam=${IDs.exam}`);
    await page.waitForSelector('[data-i18n="stepConfigure"]', { timeout: 10_000 });
    await page.reload();
    await page.waitForSelector('[data-i18n="stepConfigure"]', { timeout: 10_000 });
    await expect(page.locator('[data-i18n="stepConfigure"]')).toHaveText('Configurer');
  });

});

// ═════════════════════════════════════════════════════════════════════════════
// institution.html — admin session + institution param
// ═════════════════════════════════════════════════════════════════════════════

test.describe('institution.html', () => {

  test('shows French UI when lang=fr', async ({ page }) => {
    await injectSession(page, adminSession, 'fr');
    await page.goto(`/institution?id=${IDs.institution}`);
    await page.waitForSelector('#pageContent', { state: 'visible', timeout: 10_000 });
    await expect(page.locator('[data-i18n="sectionAdmins"]').first()).toHaveText('Administrateurs');
    await expect(page.locator('[data-i18n="logout"]')).toHaveText('Déconnexion');
  });

  test('shows English UI when lang=en', async ({ page }) => {
    await injectSession(page, adminSession, 'en');
    await page.goto(`/institution?id=${IDs.institution}`);
    await page.waitForSelector('#pageContent', { state: 'visible', timeout: 10_000 });
    await expect(page.locator('[data-i18n="sectionAdmins"]').first()).toHaveText('Admins');
    await expect(page.locator('[data-i18n="logout"]')).toHaveText('Sign out');
  });

  test('language preference persists on reload', async ({ page }) => {
    await injectSession(page, adminSession, 'fr');
    await page.goto(`/institution?id=${IDs.institution}`);
    await page.waitForSelector('#pageContent', { state: 'visible', timeout: 10_000 });
    await page.reload();
    await page.waitForSelector('#pageContent', { state: 'visible', timeout: 10_000 });
    await expect(page.locator('[data-i18n="sectionAdmins"]').first()).toHaveText('Administrateurs');
  });

});

// ═════════════════════════════════════════════════════════════════════════════
// submissions.html — teacher session + exam param (reloads on langchange)
// ═════════════════════════════════════════════════════════════════════════════

test.describe('submissions.html', () => {

  test('shows French UI when lang=fr', async ({ page }) => {
    await mockEmailSend(page);
    await injectSession(page, teacherSession, 'fr');
    await page.goto(`/submissions?exam=${IDs.exam}`);
    await waitForLangReady(page, '#pageContent');
    await expect(page.locator('button[data-i18n="tabOverview"]')).toHaveText('Aperçu');
    await expect(page.locator('[data-i18n="badge"]')).toHaveText('Enseignant');
  });

  test('shows English UI when lang=en', async ({ page }) => {
    await mockEmailSend(page);
    await injectSession(page, teacherSession, 'en');
    await page.goto(`/submissions?exam=${IDs.exam}`);
    await waitForLangReady(page, '#pageContent');
    await expect(page.locator('button[data-i18n="tabOverview"]')).toHaveText('Overview');
    await expect(page.locator('[data-i18n="badge"]')).toHaveText('Teacher');
  });

  test('language preference persists on reload', async ({ page }) => {
    await mockEmailSend(page);
    await injectSession(page, teacherSession, 'fr');
    await page.goto(`/submissions?exam=${IDs.exam}`);
    await waitForLangReady(page, '#pageContent');
    await page.reload();
    await waitForLangReady(page, '#pageContent');
    await expect(page.locator('button[data-i18n="tabOverview"]')).toHaveText('Aperçu');
  });

  test('toast appears in French when sending without selection (FR)', async ({ page }) => {
    await mockEmailSend(page);
    await injectSession(page, teacherSession, 'fr');
    await page.goto(`/submissions?exam=${IDs.exam}&tab=submissions`);
    await waitForLangReady(page, '#pageContent');
    // Switch to submissions tab
    await page.locator('button[data-tab="submissions"]').click();
    // Try sending without selecting anyone
    await page.locator('#sendNowBtn').click();
    const toast = page.locator('#toast');
    await expect(toast).toBeVisible({ timeout: 5_000 });
    const text = await toast.textContent();
    // FR: "Sélectionnez au moins une soumission en attente."
    expect(text).toContain('Sélectionnez');
  });

  test('toast appears in English when sending without selection (EN)', async ({ page }) => {
    await mockEmailSend(page);
    await injectSession(page, teacherSession, 'en');
    await page.goto(`/submissions?exam=${IDs.exam}&tab=submissions`);
    await waitForLangReady(page, '#pageContent');
    await page.locator('button[data-tab="submissions"]').click();
    await page.locator('#sendNowBtn').click();
    const toast = page.locator('#toast');
    await expect(toast).toBeVisible({ timeout: 5_000 });
    const text = await toast.textContent();
    expect(text).toContain('Select at least');
  });

});

// ═════════════════════════════════════════════════════════════════════════════
// student-review.html — teacher session + attempt + exam params (reloads on langchange)
// ═════════════════════════════════════════════════════════════════════════════

test.describe('student-review.html', () => {

  test('shows French UI when lang=fr', async ({ page }) => {
    await injectSession(page, teacherSession, 'fr');
    await page.goto(`/student-review?attempt=${IDs.att1}&exam=${IDs.exam}`);
    await page.waitForSelector('[data-i18n="backBtn"]', { timeout: 12_000 });
    await expect(page.locator('[data-i18n="backBtn"]')).toHaveText('Toutes les soumissions');
    await expect(page.locator('[data-i18n="badge"]')).toHaveText('Enseignant');
  });

  test('shows English UI when lang=en', async ({ page }) => {
    await injectSession(page, teacherSession, 'en');
    await page.goto(`/student-review?attempt=${IDs.att1}&exam=${IDs.exam}`);
    await page.waitForSelector('[data-i18n="backBtn"]', { timeout: 12_000 });
    await expect(page.locator('[data-i18n="backBtn"]')).toHaveText('All submissions');
    await expect(page.locator('[data-i18n="badge"]')).toHaveText('Teacher');
  });

  test('language preference persists on reload', async ({ page }) => {
    await injectSession(page, teacherSession, 'fr');
    await page.goto(`/student-review?attempt=${IDs.att1}&exam=${IDs.exam}`);
    await page.waitForSelector('[data-i18n="backBtn"]', { timeout: 12_000 });
    await page.reload();
    await page.waitForSelector('[data-i18n="backBtn"]', { timeout: 12_000 });
    await expect(page.locator('[data-i18n="backBtn"]')).toHaveText('Toutes les soumissions');
  });

});

// ═════════════════════════════════════════════════════════════════════════════
// error.html — no session required
// ═════════════════════════════════════════════════════════════════════════════

test.describe('error.html', () => {

  test('shows French UI when lang=fr', async ({ page }) => {
    await setLang(page, 'fr');
    await page.goto('/error.html');
    await page.waitForSelector('[data-i18n="contactAdmin"]', { timeout: 8_000 });
    await expect(page.locator('[data-i18n="contactAdmin"]')).toContainText("pensez qu'il s'agit");
  });

  test('shows English UI when lang=en', async ({ page }) => {
    await setLang(page, 'en');
    await page.goto('/error.html');
    await page.waitForSelector('[data-i18n="contactAdmin"]', { timeout: 8_000 });
    await expect(page.locator('[data-i18n="contactAdmin"]')).toContainText('contact your administrator');
  });

  test('language preference persists on reload', async ({ page }) => {
    await setLang(page, 'fr');
    await page.goto('/error.html');
    await page.waitForSelector('[data-i18n="contactAdmin"]', { timeout: 8_000 });
    await page.reload();
    await page.waitForSelector('[data-i18n="contactAdmin"]', { timeout: 8_000 });
    await expect(page.locator('[data-i18n="contactAdmin"]')).toContainText("pensez qu'il s'agit");
  });

});

// ═════════════════════════════════════════════════════════════════════════════
// exam-builder-manual.html — teacher session + exam param
// ═════════════════════════════════════════════════════════════════════════════

test.describe('exam-builder-manual.html', () => {

  test('shows French UI when lang=fr', async ({ page }) => {
    await injectSession(page, teacherSession, 'fr');
    await page.goto(`/exam-builder-manual?exam=${IDs.exam}`);
    await page.waitForSelector('[data-i18n="backBtn"]', { timeout: 10_000 });
    await expect(page.locator('[data-i18n="backBtn"]')).toHaveText('Tableau de bord');
    await expect(page.locator('[data-i18n="badge"]')).toHaveText('Enseignant');
  });

  test('shows English UI when lang=en', async ({ page }) => {
    await injectSession(page, teacherSession, 'en');
    await page.goto(`/exam-builder-manual?exam=${IDs.exam}`);
    await page.waitForSelector('[data-i18n="backBtn"]', { timeout: 10_000 });
    await expect(page.locator('[data-i18n="backBtn"]')).toHaveText('Dashboard');
    await expect(page.locator('[data-i18n="badge"]')).toHaveText('Teacher');
  });

  test('language preference persists on reload', async ({ page }) => {
    await injectSession(page, teacherSession, 'fr');
    await page.goto(`/exam-builder-manual?exam=${IDs.exam}`);
    await page.waitForSelector('[data-i18n="backBtn"]', { timeout: 10_000 });
    await page.reload();
    await page.waitForSelector('[data-i18n="backBtn"]', { timeout: 10_000 });
    await expect(page.locator('[data-i18n="backBtn"]')).toHaveText('Tableau de bord');
  });

});
