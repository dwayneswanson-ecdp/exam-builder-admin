// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');

const TEACHER_EMAIL  = 'dwayne.swanson@e-cdp.com';
const STUDENT_EMAIL  = 'student@mocktest.com';
const ACCESS_CODE    = 'MOCK42';
const SHARE_ID       = 'mock-share-001';

const MOCK_EXAM = {
  id:            'mock-exam-id-001',
  title:         'Mock Exam',
  duration_mins: 30,
  access_code:   ACCESS_CODE,
  lang:          'en',
  groups:        '',
  group_codes:   '{}',
  share_id:      SHARE_ID,
  instructions:  null,
  teacher_email: TEACHER_EMAIL,
};

const MOCK_QUESTIONS = [
  {
    id:            'mock-q-001',
    exam_id:       'mock-exam-id-001',
    position:      1,
    question_text: 'What is 2 + 2?',
    type:          'mcq',
    option_a:      'Three',
    option_b:      'Four',
    option_c:      'Five',
    option_d:      'Six',
    correct_answer: 'B',
  },
];

test('pre-flight: exam page loads without JS errors', async ({ page }) => {
  const jsErrors = [];
  page.on('pageerror', err => jsErrors.push(err.message));

  await page.route('**/emailjs-com@3/**', route =>
    route.fulfill({ contentType: 'application/javascript', body: 'window.emailjs = { init: function(){}, send: function(){ return Promise.resolve({status:200,text:"OK"}); } };' })
  );
  await page.route('**/rest/v1/exams*', route =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify([MOCK_EXAM]) })
  );
  await page.route('**/rest/v1/questions*', route =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify(MOCK_QUESTIONS) })
  );

  const examUrl = 'file://' + path.resolve(__dirname, '../exam-engine.html') + '?id=' + SHARE_ID;
  await page.goto(examUrl);

  await expect(page.locator('#loginScreen')).toBeVisible({ timeout: 10000 });
  expect(jsErrors, 'JS errors on page load: ' + jsErrors.join(', ')).toHaveLength(0);
});

test('login form: fills and reaches confirm screen', async ({ page }) => {
  await page.route('**/emailjs-com@3/**', route =>
    route.fulfill({ contentType: 'application/javascript', body: 'window.emailjs = { init: function(){}, send: function(){ return Promise.resolve({status:200,text:"OK"}); } };' })
  );
  await page.route('**/rest/v1/exams*', route =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify([MOCK_EXAM]) })
  );
  await page.route('**/rest/v1/questions*', route =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify(MOCK_QUESTIONS) })
  );

  const examUrl = 'file://' + path.resolve(__dirname, '../exam-engine.html') + '?id=' + SHARE_ID;
  await page.goto(examUrl);

  await expect(page.locator('#loginScreen')).toBeVisible({ timeout: 10000 });
  await page.fill('#inputLastName',  'SMITH');
  await page.fill('#inputFirstName', 'John');
  await page.fill('#inputEmail',     STUDENT_EMAIL);
  await page.fill('#inputCode',      ACCESS_CODE);
  await page.click('#loginBtn');

  await expect(page.locator('#confirmScreen')).toBeVisible({ timeout: 5000 });

  // Confirm screen shows correct student details
  await expect(page.locator('#confirmName')).toContainText('SMITH');
  await expect(page.locator('#confirmEmail')).toContainText(STUDENT_EMAIL);
});

test('exam screen: questions load and submit button is present', async ({ page }) => {
  await page.route('**/emailjs-com@3/**', route =>
    route.fulfill({ contentType: 'application/javascript', body: 'window.emailjs = { init: function(){}, send: function(){ return Promise.resolve({status:200,text:"OK"}); } };' })
  );
  await page.route('**/rest/v1/exams*', route =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify([MOCK_EXAM]) })
  );
  await page.route('**/rest/v1/questions*', route =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify(MOCK_QUESTIONS) })
  );
  await page.route('**/rest/v1/exam_attempts*', route =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify([{ id: 'mock-attempt-001' }]) })
  );

  const examUrl = 'file://' + path.resolve(__dirname, '../exam-engine.html') + '?id=' + SHARE_ID;
  await page.goto(examUrl);

  await expect(page.locator('#loginScreen')).toBeVisible({ timeout: 10000 });
  await page.fill('#inputLastName',  'SMITH');
  await page.fill('#inputFirstName', 'John');
  await page.fill('#inputEmail',     STUDENT_EMAIL);
  await page.fill('#inputCode',      ACCESS_CODE);
  await page.click('#loginBtn');
  await expect(page.locator('#confirmScreen')).toBeVisible({ timeout: 5000 });
  await page.click('#confirmStartBtn');

  await expect(page.locator('#examScreen')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('#questionsContainer')).not.toBeEmpty();
  await expect(page.locator('#submitBtn')).toBeVisible();
  await expect(page.locator('input[type="radio"]').first()).toBeVisible();
});

test('full submission: success screen and email payload are correct', async ({ page }) => {
  const jsErrors = [];
  page.on('pageerror', err => jsErrors.push(err.message));

  await page.route('**/emailjs-com@3/**', route =>
    route.fulfill({
      contentType: 'application/javascript',
      body: `
        window.emailjs = {
          init: function() {},
          send: function(serviceId, templateId, payload) {
            window.__emailjsCapture = { serviceId, templateId, payload };
            return Promise.resolve({ status: 200, text: 'OK' });
          }
        };
      `,
    })
  );
  await page.route('**/rest/v1/exams*', route =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify([MOCK_EXAM]) })
  );
  await page.route('**/rest/v1/questions*', route =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify(MOCK_QUESTIONS) })
  );
  await page.route('**/rest/v1/exam_attempts*', route =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify([{ id: 'mock-attempt-001' }]) })
  );

  const examUrl = 'file://' + path.resolve(__dirname, '../exam-engine.html') + '?id=' + SHARE_ID;
  await page.goto(examUrl);

  await expect(page.locator('#loginScreen')).toBeVisible({ timeout: 10000 });
  await page.fill('#inputLastName',  'SMITH');
  await page.fill('#inputFirstName', 'John');
  await page.fill('#inputEmail',     STUDENT_EMAIL);
  await page.fill('#inputCode',      ACCESS_CODE);
  await page.click('#loginBtn');

  await expect(page.locator('#confirmScreen')).toBeVisible({ timeout: 5000 });
  await page.click('#confirmStartBtn');

  await expect(page.locator('#examScreen')).toBeVisible({ timeout: 5000 });
  await page.locator('input[type="radio"][name="q0"]').first().click();
  await page.click('#submitBtn');

  // Success screen appears
  await expect(page.locator('#successScreen')).toBeVisible({ timeout: 15000 });
  await expect(page.locator('#successScreen h2')).toBeVisible();

  // Email status shows sent confirmation
  await expect(page.locator('#emailStatus')).toContainText('Résultats envoyés', { timeout: 5000 });

  // Email payload is correct
  const capture = await page.evaluate(() => window.__emailjsCapture);
  expect(capture, 'EmailJS send was never called').not.toBeNull();
  expect(capture.templateId).toBe('template_x7bkb1l');
  expect(capture.payload.to_email).toBe(TEACHER_EMAIL);
  expect(capture.payload.from_email).toBe(STUDENT_EMAIL);
  expect(capture.payload.from_name).toContain('SMITH');
  expect(capture.payload.message_html).toContain('Mock Exam');

  // No JS errors during the entire flow
  expect(jsErrors, 'JS errors during flow: ' + jsErrors.join(', ')).toHaveLength(0);
});
