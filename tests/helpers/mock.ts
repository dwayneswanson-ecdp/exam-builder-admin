import type { Page } from '@playwright/test';

/** Intercept all calls to the send-email edge function to prevent real sends. */
export async function mockEmailSend(page: Page): Promise<void> {
  await page.route('**/functions/v1/send-email', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'mocked — no email sent' }),
    }),
  );
}

/** Intercept the add-member edge function. Returns an invite-style response by default. */
export async function mockAddMember(
  page: Page,
  response: Record<string, unknown> = { invited: true, user: { id: 'mock-user-id' } },
): Promise<void> {
  await page.route('**/functions/v1/add-member', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response),
    }),
  );
}

/** Intercept the AI open-question grading endpoint. */
export async function mockAISuggest(page: Page): Promise<void> {
  await page.route('**/functions/v1/grade-open-question', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        score: 4,
        rationale: 'Good answer demonstrating clear understanding of the topic.',
        comment: 'Well structured response — add one more example for full marks.',
      }),
    }),
  );
}
