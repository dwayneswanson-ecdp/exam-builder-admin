import { test, expect } from '@playwright/test';
import { CREDS, IDs, LANG_KEY } from './helpers/constants';
import { getSupabaseSession, injectSession, setLang } from './helpers/auth';

test.describe('Authentication', () => {

  // ── Login via real UI ─────────────────────────────────────────────────────

  test('teacher can log in successfully', async ({ page }) => {
    await page.goto('/login.html');
    await page.locator('#loginEmail').fill(CREDS.teacher.email);
    await page.locator('#loginPassword').fill(CREDS.teacher.password);
    await page.locator('#loginBtn').click();
    await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
    await expect(page.locator('#dashboard')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('#teacherView')).toBeVisible({ timeout: 10_000 });
  });

  test('admin can log in successfully', async ({ page }) => {
    await page.goto('/login.html');
    await page.locator('#loginEmail').fill(CREDS.admin.email);
    await page.locator('#loginPassword').fill(CREDS.admin.password);
    await page.locator('#loginBtn').click();
    await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
    await expect(page.locator('#dashboard')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('#adminView')).toBeVisible({ timeout: 10_000 });
  });

  test('super admin can log in successfully', async ({ page }) => {
    await page.goto('/login.html');
    await page.locator('#loginEmail').fill(CREDS.superadmin.email);
    await page.locator('#loginPassword').fill(CREDS.superadmin.password);
    await page.locator('#loginBtn').click();
    await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
    await expect(page.locator('#dashboard')).toBeVisible({ timeout: 10_000 });
    // Super admin sees institution list, not teacher/admin views
    await expect(page.locator('#superAdminView')).toBeVisible({ timeout: 10_000 });
  });

  // ── Error messages are translated ────────────────────────────────────────

  test('invalid credentials show error message in EN', async ({ page }) => {
    await setLang(page, 'en');
    await page.goto('/login.html');
    await page.locator('#loginEmail').fill('notreal@test-flo.com');
    await page.locator('#loginPassword').fill('WrongPassword999!');
    await page.locator('#loginBtn').click();
    const errEl = page.locator('#loginError');
    await expect(errEl).toBeVisible({ timeout: 10_000 });
    const text = await errEl.textContent();
    // EN error: "Wrong email or password" — must not be blank, must be in English
    expect(text?.trim().length).toBeGreaterThan(0);
    expect(text).not.toMatch(/[àâäéèêëîïôùûüç]/); // no French accents
  });

  test('invalid credentials show error message in FR', async ({ page }) => {
    await setLang(page, 'fr');
    await page.goto('/login.html');
    await page.locator('#loginEmail').fill('notreal@test-flo.com');
    await page.locator('#loginPassword').fill('WrongPassword999!');
    await page.locator('#loginBtn').click();
    const errEl = page.locator('#loginError');
    await expect(errEl).toBeVisible({ timeout: 10_000 });
    const text = await errEl.textContent();
    // FR error contains French text
    expect(text?.trim().length).toBeGreaterThan(0);
  });

  // ── Session survives language switch ─────────────────────────────────────

  test('session persists after language switch — user is not logged out', async ({ page }) => {
    const session = await getSupabaseSession(CREDS.teacher.email, CREDS.teacher.password);
    // submissions.html calls window.location.reload() on langchange
    await injectSession(page, session, 'en');
    await page.goto(`/submissions?exam=${IDs.exam}`);
    await expect(page.locator('#pageContent')).toBeVisible({ timeout: 12_000 });

    // Switch to FR — this triggers a full page reload on submissions.html
    await page.evaluate(`localStorage.setItem('${LANG_KEY}', 'fr')`);
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify still on submissions page, not redirected to login
    expect(page.url()).toContain('submissions');
    await expect(page.locator('#pageContent')).toBeVisible({ timeout: 12_000 });
  });

});
