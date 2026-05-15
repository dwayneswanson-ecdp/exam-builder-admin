# Security Roadmap

Last linter run: 2026-05-15 (post MEDIUM-priority fixes)
Project: toxgihdyfzdymgidgvaq

---

## Phase 3 — RLS & Edge Function Migration (COMPLETE)

All student-facing database operations moved from direct anonymous Supabase calls
to edge functions using the service role key. RLS enabled on all public tables with
deny-all policies for anon on student data.

Tables secured: `exams`, `questions`, `exam_attempts`, `teachers`,
`institutions`, `institution_admins`, `institution_teachers`

Edge functions deployed: `exam-start`, `exam-questions`, `exam-submit`, `exam-retake`

The `questions_public` view was created as an additional defense-in-depth layer. Even if a policy misconfiguration were to accidentally expose the `questions` table to anonymous access in future, the view ensures `correct_index` is never returned to the client. The answer key is also excluded server-side in the `exam-questions` edge function — both protections are independent.

---

## Post-MVP Priority — Full Edge Function Migration

The current edge function migration covers `exam-engine.html` only. All other teacher-facing pages (`dashboard.html`, `submissions.html`, `institution.html`, `student-review.html`, `exam-review.html`, `index.html`, `exam-onboarding.html`, `exam-builder-manual.html`, `login.html`) still use the Supabase anon key directly in client-side JavaScript for teacher operations.

These pages are protected by authenticated RLS policies and teacher login sessions, making the risk lower than the student-facing exposure that was fixed in Phase 3. However a full migration of all pages to edge functions remains the correct long term architecture and should be completed before scaling beyond MVP.

---

## Session 2026-05-15 — Linter Hardening

### RESOLVED

| Item | Lint Rule | Migration | Resolution |
|------|-----------|-----------|------------|
| `questions_public` view had SECURITY DEFINER | `security_definer_view` | `fix_security_linter_warnings` | `ALTER VIEW … SET (security_invoker = on)` |
| `get_my_institution_id` mutable search_path | `function_search_path_mutable` | `fix_security_linter_warnings` | `ALTER FUNCTION … SET search_path = 'public'` |
| `teacher_update_own_exam_attempts` WITH CHECK true | `rls_policy_always_true` | `fix_security_linter_warnings` | WITH CHECK now mirrors USING clause |
| `admin_update_own_institution` WITH CHECK true | `rls_policy_always_true` | `fix_security_linter_warnings` | WITH CHECK now mirrors USING clause |
| `get_my_institution_id` callable by anon | `anon_security_definer_function_executable` | `fix_get_my_institution_id_anon_execute` | `REVOKE FROM PUBLIC; GRANT TO authenticated` (anon revoke from role was a no-op — PUBLIC grant required two-step fix) |

Note: `get_my_institution_id` still appears under `authenticated_security_definer_function_executable`.
This is intentional — authenticated teachers need EXECUTE for RLS policies to function. The function
only returns the calling user's own institution_id; no data from other users is accessible.

---

## Next Priority — Pre-existing Warnings

These existed before Phase 3 and were not introduced by recent changes.
Address in a dedicated session.

### HIGH — RESOLVED

| Item | Lint Rule | Migration | Resolution |
|------|-----------|-----------|------------|
| `is_super_admin()` callable by anon | `anon_security_definer_function_executable` | `fix_security_definer_explicit_role_revokes` | `REVOKE FROM anon` (explicit grant, not PUBLIC) — authenticated retains EXECUTE for RLS |
| `rls_auto_enable()` callable by anon + authenticated | `anon/authenticated_security_definer_function_executable` | `fix_security_definer_explicit_role_revokes` | `REVOKE FROM anon; REVOKE FROM authenticated` — internal utility, no API callers |

Note: `is_super_admin()` still appears under `authenticated_security_definer_function_executable`.
This is intentional — the `admin_update_own_institution` RLS policy calls it, so authenticated
teachers need EXECUTE. No data from other users is accessible via this function.

### MEDIUM — RESOLVED

| Item | Lint Rule | Migration | Resolution |
|------|-----------|-----------|------------|
| `exam-attachments` bucket allows listing | `public_bucket_allows_listing` | `fix_storage_bucket_policies` | Dropped broad SELECT policy — `getPublicUrl()` access unaffected (public bucket serves `/object/public/` URLs without any SELECT policy) |
| `institution-logos` bucket allows listing | `public_bucket_allows_listing` | `fix_storage_bucket_policies` | Dropped broad SELECT policy — same reasoning |

**Bonus finding resolved in same migration:** `exam-attachments` INSERT policy was incorrectly scoped to the `public` role, allowing anonymous file uploads. Dropped and replaced with an `authenticated`-only INSERT policy, matching the correct pattern already in use on `institution-logos`.

### LOW

| Item | Lint Rule | Notes |
|------|-----------|-------|
| `pg_net` extension in public schema | `extension_in_public` | Supabase-managed extension; moving requires support ticket |
| Auth leaked password protection disabled — **BLOCKED — Pro plan required** | `auth_leaked_password_protection` | Prevent use of leaked passwords requires Supabase Pro plan. Not available on current free tier. Revisit when platform scales to paid plan. |

### LOW — COMPLETED

| Item | Resolution |
|------|------------|
| Minimum password length | Increased from 6 to 12 characters |
| Secure password change | Enabled — requires recent login session to change password |
| Require current password when updating | Enabled — prevents account takeover via password change |
