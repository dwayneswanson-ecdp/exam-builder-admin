/**
 * submit-debug.js — temporary debug script, do not commit
 */

const { chromium } = require('@playwright/test');

const EXAM_URL  = 'https://exam.test-flo.com/exam-engine.html?id=3w9xexfs';
const SHARE_ID  = '3w9xexfs';
const CODE      = 'Y7LJ8X';
const GROUP     = 'M2 EFI G1';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page    = await context.newPage();

  // Accept all dialogs so confirm() never blocks execution
  page.on('dialog', async dialog => {
    console.log(`[dialog] type=${dialog.type()} message="${dialog.message().slice(0, 120)}"`);
    await dialog.accept();
  });

  page.on('console', msg => console.log(`[console.${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => console.log(`[pageerror] ${err.message}`));

  page.on('response', async res => {
    const url = res.url();
    if (!url.includes('supabase.co/functions')) return;
    let body = '';
    try { body = await res.text(); } catch (_) { body = '(unreadable)'; }
    console.log(`[network] ${res.request().method()} ${url.split('/').pop()} → ${res.status()} ${body.slice(0, 300)}`);
  });

  // Load and clear state
  await page.goto(EXAM_URL, { waitUntil: 'domcontentloaded' });
  await page.evaluate((sid) => {
    ['submitted_','examAttemptId_','examShuffleCache_','examSessionToken_',
     'examDeadline_','poolSelectionCache_','terminated_exam_'].forEach(k =>
      localStorage.removeItem(k + sid));
  }, SHARE_ID);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Login
  await page.waitForSelector('#inputLastName', { timeout: 10000 });
  await page.fill('#inputLastName', 'TEST');
  await page.fill('#inputFirstName', 'Student');
  await page.fill('#inputEmail', 'test@test-flo.com');
  if (await page.isVisible('#groupRow')) await page.selectOption('#inputGroup', { label: GROUP });
  await page.fill('#inputCode', CODE);
  await page.click('#loginBtn');
  await page.waitForTimeout(800);

  // Confirm screen
  if (await page.locator('#confirmContinueBtn').isVisible({ timeout: 5000 }).catch(() => false)) {
    await page.locator('#confirmContinueBtn').click();
    await page.waitForTimeout(600);
  }

  // Rules screen — check acknowledge then start
  await page.waitForSelector('#rulesScreen', { state: 'visible', timeout: 8000 }).catch(() => {});
  if (await page.locator('#confirmAcknowledge').isVisible({ timeout: 3000 }).catch(() => false)) {
    await page.locator('#confirmAcknowledge').check();
    await page.waitForTimeout(300);
  }
  if (await page.locator('#confirmStartBtn').isVisible({ timeout: 3000 }).catch(() => false)) {
    await page.locator('#confirmStartBtn').click({ timeout: 5000 });
  }

  // Wait for exam screen
  await page.waitForSelector('#examScreen', { state: 'visible', timeout: 20000 });
  await page.waitForTimeout(2500);
  console.log('\n--- Exam screen loaded ---');

  // Answer ALL visible questions on page 1
  const options = await page.locator('.q-card:visible .q-option').all();
  if (options.length > 0) {
    await options[0].click();
    console.log('[script] Answered Q1 (MCQ)');
    await page.waitForTimeout(300);
  }

  // Navigate pages
  let pagesNavigated = 0;
  while (pagesNavigated < 10) {
    const nextBtn = page.locator('#pageNextBtn');
    if (!await nextBtn.isVisible().catch(() => false)) break;

    const text = (await nextBtn.textContent().catch(() => '')).trim();
    console.log(`\n[script] Page ${pagesNavigated} — nextBtn text: "${text}"`);

    // Inspect onclick before clicking
    const onclickStr = await page.evaluate(() => {
      const btn = document.getElementById('pageNextBtn');
      return btn ? (btn.onclick ? btn.onclick.toString().slice(0, 150) : 'null') : 'not found';
    });
    console.log(`[script] nextBtn.onclick: ${onclickStr}`);

    const isSubmit = /envoyer|submit/i.test(text);

    if (isSubmit) {
      console.log('\n--- On last page — clicking submit button ---');

      // Answer any visible unanswered open questions first to avoid confirm dialog
      const openTAs = await page.locator('.q-card:visible textarea').all();
      for (const ta of openTAs) {
        await ta.fill('Debug test answer.');
        console.log('[script] Filled open question on last page');
        await page.waitForTimeout(200);
      }

      await nextBtn.click();
      console.log('[script] Clicked submit button');
      break;
    }

    // Answer visible MCQ before advancing
    const visOpts = await page.locator('.q-card:visible .q-option').all();
    if (visOpts.length > 0) { await visOpts[0].click(); await page.waitForTimeout(200); }
    const visTAs = await page.locator('.q-card:visible textarea').all();
    for (const ta of visTAs) { await ta.fill('Debug answer.'); await page.waitForTimeout(100); }

    await nextBtn.click();
    pagesNavigated++;
    await page.waitForTimeout(1200);
  }

  // Wait for result
  await page.waitForTimeout(6000);

  const success = await page.locator('#successScreen').isVisible().catch(() => false);
  const examOn  = await page.locator('#examScreen').isVisible().catch(() => false);
  console.log(`\n[result] successScreen: ${success}, examScreen still visible: ${examOn}`);

  // Check network
  console.log('\n--- Done ---');
  await browser.close();
})();
