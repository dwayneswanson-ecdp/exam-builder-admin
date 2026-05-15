import type { Page } from '@playwright/test';
import { SUPABASE_URL, SUPABASE_ANON_KEY, SESSION_KEY, LANG_KEY } from './constants';

/**
 * Obtain a real Supabase session token via the password grant.
 * Call once in beforeAll per spec file; tokens are valid for ~1 hour.
 */
export async function getSupabaseSession(email: string, password: string): Promise<Record<string, unknown>> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Supabase auth failed for ${email}: HTTP ${res.status} — ${body}`);
  }
  return res.json();
}

/**
 * Inject a Supabase session and language preference into localStorage
 * before the page loads. Must be called before page.goto().
 */
export async function injectSession(
  page: Page,
  session: Record<string, unknown>,
  lang: 'en' | 'fr' = 'en',
): Promise<void> {
  await page.addInitScript(
    ({ sessionKey, langKey, sess, l }) => {
      localStorage.setItem(sessionKey, JSON.stringify(sess));
      localStorage.setItem(langKey, l);
    },
    { sessionKey: SESSION_KEY, langKey: LANG_KEY, sess: session, l: lang },
  );
}

/**
 * Set only the language preference in localStorage before page load.
 * Use for pages that don't require an authenticated session.
 */
export async function setLang(page: Page, lang: 'en' | 'fr'): Promise<void> {
  await page.addInitScript(
    ({ langKey, l }) => { localStorage.setItem(langKey, l); },
    { langKey: LANG_KEY, l: lang },
  );
}
