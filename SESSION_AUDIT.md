# Session Audit — testflo

Last updated: 2026-05-15
Project: toxgihdyfzdymgidgvaq (Supabase) · dwayneswanson-ecdp/exam-builder-admin (GitHub Pages)

---

## Section 1 — Completed this session

### RLS & Database Security

| Change | Migration | Files affected |
|--------|-----------|----------------|
| Enabled RLS on all 7 public tables with deny-all anon policies | `enable_rls_deny_anon_student_tables` | DB only |
| Added teacher write policies on questions and exam_attempts | same | DB only |
| Enabled RLS on institution_admins, institution_teachers, institutions, teachers | `rls_institution_admins`, `rls_institution_teachers`, `rls_institutions`, `fix_rls_recursion_teachers` | DB only |
| Fixed infinite recursion on teachers RLS — created `get_my_institution_id()` SECURITY DEFINER function | `fix_rls_recursion_teachers` | DB only |
| Created `questions_public` view — excludes correct_index, correct_option, grading_criteria | `create_questions_public_view` | DB only |
| Fixed `questions_public` SECURITY DEFINER → SECURITY INVOKER | `fix_security_linter_warnings` | DB only |
| Fixed `get_my_institution_id` mutable search_path | `fix_security_linter_warnings` | DB only |
| Fixed `teacher_update_own_exam_attempts` WITH CHECK always true | `fix_security_linter_warnings` | DB only |
| Fixed `admin_update_own_institution` WITH CHECK always true | `fix_security_linter_warnings` | DB only |
| Revoked anon EXECUTE on `get_my_institution_id` (REVOKE FROM PUBLIC + GRANT TO authenticated) | `fix_get_my_institution_id_anon_execute` | DB only |
| Revoked anon EXECUTE on `is_super_admin()` | `fix_security_definer_explicit_role_revokes` | DB only |
| Revoked anon + authenticated EXECUTE on `rls_auto_enable()` | `fix_security_definer_explicit_role_revokes` | DB only |
| Dropped broad SELECT policies on exam-attachments and institution-logos buckets | `fix_storage_bucket_policies` | DB only |
| Fixed exam-attachments INSERT policy — was public role, now authenticated only | `fix_storage_bucket_policies` | DB only |
| Added session_token column to exam_attempts | `add_session_token_to_exam_attempts` | DB only |
| Added shuffle_map JSONB column to exam_attempts | `add_shuffle_map_to_exam_attempts` | DB only |
| Password security: min length 12, secure password change, require current password | Supabase Dashboard | DB / Auth |

### Edge Functions

| Function | Version | Change |
|----------|---------|--------|
| `exam-start` | new | Created — validates access code server-side, creates attempt, returns session_token. Metadata mode (share_id only) returns public exam info without credentials |
| `exam-questions` | new | Created — verifies session_token, returns questions excluding correct_index/correct_option/grading_criteria |
| `exam-submit` | new | Created — verifies session_token, grades MCQ server-side, stores server-computed score_mcq |
| `exam-retake` | new | Created — validates retake_token, generates new session_token, nulls retake_token atomically |
| `send-email` | v23 → v27 | Multiple updates — see email template changes below. Final deploy: v27 |

### Email Template Changes (`send-email/index.ts`)

**resultsHtml:**
- Removed student email from header (showed `student_name · email` — email removed)
- Extracted `teacher_email` from payload (was sent but never rendered)
- Added teacher contact block above footer: teacher name bold + clickable mailto link
- FR/EN via existing `lang` field

**retakeHtml:**
- Added `access_code` extraction and styled display block — moved above CTA button (final order: code → button → fallback → single-use → contact → footer)
- Added `teacher_email` extraction and teacher contact line
- Fixed greeting: extracts last word of `to_name` as first name (`SWANSON Dwayne` → `Bonjour Dwayne,`). Falls back to `Bonjour,` if single word or empty
- Added automated footer line inside white content div (FR/EN)
- Added `accessCodeLabel` and `contactLabel` i18n keys to both FR and EN objects

**inviteHtml:**
- Added `teacher_email` extraction
- Added `contactLabel` i18n key to both FR and EN objects
- Added teacher contact block with separator above it

**submissions.html payload fixes:**
- Retake payload: added `teacher_email`, `access_code`
- Invite payload: added `teacher_email`, `lang` (was missing — caused invite emails to always render in FR regardless of exam language)

**LOGO_URL:**
- Updated from `https://dwayneswanson-ecdp.github.io/exam-builder-admin/testflo-dark.svg` → `https://exam.test-flo.com/testflo-dark.svg`

### exam-engine.html Changes

| Change | Type |
|--------|------|
| Removed hardcoded Supabase anon key (`SUPABASE_KEY`) | Security |
| Replaced all direct `sbFetch()` Supabase calls with `efFetch()` edge function calls | Security |
| Added `exam-start` (metadata + full modes), `exam-questions`, `exam-submit`, `exam-retake` integration | Security |
| Added `sessionToken` state variable | Security |
| Added `isMobile` flag — suppresses blur/visibilitychange violations when TEXTAREA/INPUT focused | Anti-cheat fix |
| Added MCQ Fisher-Yates shuffle via `SHUFFLE_MAP` — stored in DB, scored server-side via `data-original-index` | Feature |
| Redesigned confirmation screen — monitoring card → red warning → session journal → identity → checkbox | UI |
| Removed green background from `.q-card.answered` — card stays neutral white when answered | UI |
| Added mobile progress indicator (`q-progress-mobile`) — replaces numbered squares on ≤768px | UI |
| Added `IntersectionObserver`-based scroll tracking for mobile progress text | UI |
| Updated `jumpToQuestion()` to call `updateProgressText()` | UI |
| Added `questionOf` key to `getUIStrings()` (FR: sur, EN: of) | i18n |
| Added `mobileNotifNotice` key to `getUIStrings()` — Do Not Disturb notice, FR/EN | i18n |
| Added mobile DND warning div above acknowledge checkbox — hidden on desktop, visible ≤768px | UI/Mobile |
| Added `autocomplete="off"`, `autocorrect="off"`, `autocapitalize="off"`, `spellcheck="false"` to open question textarea | UX |
| Changed `examDeadline_` localStorage key from `EXAM.id` to `EXAM.share_id` | Bug fix |
| `terminateExam()` clears `examSessionToken_` localStorage key | Security |

### Security Documentation

- Created `SECURITY_ROADMAP.md` — full history of all migrations, resolutions, and remaining items
- Added defense-in-depth note for `questions_public` view
- Added Post-MVP section flagging teacher-facing pages still using anon key directly

### URL Replacements (7 occurrences — `dwayneswanson-ecdp.github.io/exam-builder-admin` → `exam.test-flo.com`)

| File | Line | What changed |
|------|------|-------------|
| `index.html` | 1988 | Logo img src in email template |
| `exam-review.html` | 532 | `baseUrl` fallback for exam engine link |
| `exam-builder-manual.html` | 889 | `baseUrl` fallback — share link |
| `exam-builder-manual.html` | 927 | `baseUrl` fallback — copy link |
| `exam-builder-manual.html` | 961 | `baseUrl` fallback — QR/preview |
| `submissions.html` | 2117 | `LOGO` constant in PDF report |
| `supabase/functions/send-email/index.ts` | 6 | `LOGO_URL` constant in all email templates |

No `window.location` references or dynamically-generated URLs were touched.

---

## Section 2 — Custom Domain Migration Workflow

Target: `https://exam.test-flo.com` → GitHub Pages repo `dwayneswanson-ecdp/exam-builder-admin`

### Phase 1 — GitHub Pages custom domain configuration

1. Go to GitHub repo → **Settings → Pages**
2. Under **Custom domain**, enter: `exam.test-flo.com`
3. Click **Save** — GitHub will create a `CNAME` file in the repo root
4. Leave **Enforce HTTPS** unchecked for now (enable after DNS propagates)

### Phase 2 — DNS records to add at registrar

Add the following records at your DNS provider (where `test-flo.com` is registered):

**Option A — CNAME (recommended for subdomains):**

| Type | Name | Value | TTL |
|------|------|-------|-----|
| CNAME | `exam` | `dwayneswanson-ecdp.github.io` | 3600 |

**Option B — A records (apex domain or if CNAME is not supported for subdomain):**

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | `exam` | `185.199.108.153` | 3600 |
| A | `exam` | `185.199.109.153` | 3600 |
| A | `exam` | `185.199.110.153` | 3600 |
| A | `exam` | `185.199.111.153` | 3600 |

Use Option A (CNAME) unless your registrar does not support CNAME on subdomains.

### Phase 3 — DNS propagation verification

1. Wait 15–60 minutes after adding DNS records
2. Check propagation at: https://dnschecker.org/#CNAME/exam.test-flo.com
3. Confirm the CNAME resolves to `dwayneswanson-ecdp.github.io` across most regions
4. GitHub Pages will automatically verify the custom domain once DNS resolves

### Phase 4 — Enable HTTPS in GitHub Pages

1. Return to GitHub repo → **Settings → Pages**
2. Once DNS is verified, the **Enforce HTTPS** checkbox becomes available
3. Check **Enforce HTTPS**
4. Wait 5–10 minutes for the TLS certificate to provision (Let's Encrypt via GitHub)
5. Confirm `https://exam.test-flo.com` loads the site with a valid certificate

### Phase 5 — Update Supabase URL configuration and redirect URLs

1. Go to **Supabase Dashboard → Authentication → URL Configuration**
2. Update **Site URL** from `https://dwayneswanson-ecdp.github.io/exam-builder-admin` to `https://exam.test-flo.com`
3. Under **Redirect URLs**, add: `https://exam.test-flo.com/**`
4. Keep the GitHub Pages URL in redirect URLs during transition to avoid breaking existing sessions
5. Remove the GitHub Pages redirect URL only after fully confirmed the custom domain is stable

### Phase 6 — Verify Resend sending domain for test-flo.com

1. Log into Resend → **Domains**
2. Confirm `test-flo.com` is verified (status: green)
3. Confirm `RESEND_FROM` Supabase secret is set to `noreply@test-flo.com`
4. Send a test invite email from the app and confirm delivery from `noreply@test-flo.com`
5. Confirm email logo renders from `https://exam.test-flo.com/testflo-dark.svg` (updated in v27)

### Phase 7 — Final end-to-end test checklist

- [ ] `https://exam.test-flo.com` loads teacher login page
- [ ] `https://exam.test-flo.com/exam-engine.html?id=<share_id>` loads student exam page
- [ ] Teacher can log in and reach dashboard
- [ ] Exam share links generated in exam-builder-manual.html point to `exam.test-flo.com`
- [ ] Student can start an exam via the custom domain URL
- [ ] Student can submit an exam — score stored correctly in Supabase
- [ ] Teacher can send results email — logo renders from `exam.test-flo.com`
- [ ] Teacher can send retake email — retake link uses `exam.test-flo.com`
- [ ] Teacher can send invitation email — exam link uses `exam.test-flo.com`
- [ ] Institution logo uploads to `institution-logos` bucket and renders correctly
- [ ] Exam attachments upload to `exam-attachments` bucket and render in exam
- [ ] GitHub Pages old URL (`dwayneswanson-ecdp.github.io/exam-builder-admin`) either still works or redirects — confirm expected behaviour

---

## Section 3 — Next Session Priorities

### 1. Custom domain migration
Execute Phase 1–7 workflow above. DNS configuration is the external dependency — everything in the codebase is already updated.

### 2. Post-student test debrief
Three rounds of student testing completed. Fixes to implement — to be detailed by teacher at session start. Known areas: mobile layout, exam flow edge cases.

### 3. Remaining LOW security items from SECURITY_ROADMAP.md
- `pg_net` in public schema — requires Supabase support ticket; low priority
- Auth leaked password protection — blocked on Pro plan; flag when billing scales

### 4. Mobile responsive layout pass
- Confirm all pages render correctly on iOS/Android
- Known issue: question navigation replaced with progress text on ≤768px — verify scroll behaviour on real device
- Check confirmation screen DND notice displays correctly on mobile

### 5. Playwright test suite
- Current status: tests exist but need updating post-security migration (anon key removed from exam-engine, edge functions now handle all student ops)
- Priority: exam start → answer → submit flow
- Priority: anti-cheat overlay behaviour
- Priority: retake flow

---

## Section 4 — Do Not Touch Without Discussion

### Anti-cheat logic in `exam-engine.html`
The `askToExit()`, `blur`, `visibilitychange`, and `exitOverlay` logic is sensitive and has been calibrated across multiple sessions including a mobile false-positive fix. Any change requires explicit discussion of what specifically needs to change and why.

### RLS policies without auditing first
All 7 public tables now have RLS enabled. Before modifying any policy: read the current policy state from Supabase, identify exactly which rows and roles are affected, and confirm no recursion risk (teachers ↔ institution_admins recursion was already fixed via `get_my_institution_id()` SECURITY DEFINER pattern).

### Edge functions without showing code before applying
All four student edge functions (`exam-start`, `exam-questions`, `exam-submit`, `exam-retake`) handle security-critical operations. `send-email` handles transactional email. Any change must be shown in full before deployment. Pattern followed this session: show exact diff → confirm → apply → deploy → verify via Resend message ID.
