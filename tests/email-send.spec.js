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

test('student submission sends email with correct to_email and template', async ({ page }) => {
  // Replace the EmailJS CDN script with a mock that captures the send call
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

  // Mock Supabase exam fetch
  await page.route('**/rest/v1/exams*', route =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify([MOCK_EXAM]) })
  );

  // Mock Supabase questions fetch
  await page.route('**/rest/v1/questions*', route =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify(MOCK_QUESTIONS) })
  );

  // Mock Supabase exam_attempts insert (POST)
  await page.route('**/rest/v1/exam_attempts*', route =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify([{ id: 'mock-attempt-001' }]) })
  );

  const examUrl = 'file://' + path.resolve(__dirname, '../exam-engine.html') + '?id=' + SHARE_ID;
  await page.goto(examUrl);

  // Login screen
  await expect(page.locator('#loginScreen')).toBeVisible({ timeout: 10000 });
  await page.fill('#inputLastName',  'SMITH');
  await page.fill('#inputFirstName', 'John');
  await page.fill('#inputEmail',     STUDENT_EMAIL);
  await page.fill('#inputCode',      ACCESS_CODE);
  await page.click('#loginBtn');

  // Confirm screen
  await expect(page.locator('#confirmScreen')).toBeVisible({ timeout: 5000 });
  await page.click('#confirmStartBtn');

  // Exam screen — answer the MCQ
  await expect(page.locator('#examScreen')).toBeVisible({ timeout: 5000 });
  await page.locator('input[type="radio"][name="q0"]').first().click();

  // Submit
  await page.click('#submitBtn');

  // Success screen
  await expect(page.locator('#successScreen')).toBeVisible({ timeout: 15000 });

  // Verify email payload
  const capture = await page.evaluate(() => window.__emailjsCapture);

  expect(capture, 'EmailJS send was never called').not.toBeNull();
  expect(capture.templateId).toBe('template_x7bkb1l');
  expect(capture.payload.to_email).toBe(TEACHER_EMAIL);
  expect(capture.payload.from_email).toBe(STUDENT_EMAIL);
  expect(capture.payload.from_name).toContain('SMITH');
});
