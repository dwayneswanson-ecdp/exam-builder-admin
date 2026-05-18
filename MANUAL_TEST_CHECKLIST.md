# Manual Test Checklist — testflo Platform

Browser-only. No automation. A human runs each test by clicking through the live platform.

**Format:** Precondition → Steps → Expected result → Pass/Fail

---

## Section 1 — Exam Creation

---

### T01 — Create exam with sections and MCQ

**Precondition:** Logged in as teacher. No existing test exam.

**Steps:**
1. Click New Exam on the dashboard.
2. Enter a title (e.g. "Test Exam T01") and set duration to 30 minutes.
3. Add a section header row — enter a section title (e.g. "Part 1").
4. Add 5 MCQ questions. For each, enter question text, 4 options, and select the correct answer.
5. Save the exam.
6. Click Publish.

**Expected result:** Exam appears in the dashboard list with status Published. Exam title and question count are correct.

**Pass / Fail:** `[ ]`

---

### T02 — Create exam with sections, MCQ, and open questions

**Precondition:** Logged in as teacher.

**Steps:**
1. Repeat T01 steps 1–5.
2. After the 5 MCQ questions, add 2 open questions. For each, enter question text and define grading criteria (e.g. "Mention X, Y, Z").
3. Save and Publish.
4. Open exam review for this exam.

**Expected result:** Exam published. All 7 questions (1 section header + 5 MCQ + 2 open) visible in exam review with correct question types indicated.

**Pass / Fail:** `[ ]`

---

## Section 2 — Student Exam Flow

---

### T03 — Student login and confirmation flow

**Precondition:** A published exam exists with a share link. Open exam link in an incognito window.

**Steps:**
1. Open the exam share link in an incognito browser tab.
2. Observe Screen 1 — Login.
3. Enter a student name and email address. Click Continue.
4. Observe Screen 2 — Identity confirmation.
5. Verify the name and email shown match what was entered. Click Continuer.
6. Observe Screen 3 — Instructions / Rules.

**Expected result:** Three screens appear in order — Login → Identity confirmation with Continuer button → Instructions screen with rules, monitoring disclosure, and a privacy checkbox with acknowledge requirement.

**Pass / Fail:** `[ ]`

---

### T04 — Privacy policy link

**Precondition:** Student is on Screen 3 (Instructions) from T03.

**Steps:**
1. Locate the acknowledge checkbox label — it contains the text "politique de confidentialité".
2. Click the "politique de confidentialité" link.

**Expected result:** `privacy.html` opens in a new tab. The page displays a full bilingual (FR/EN) privacy policy with a language toggle. The original exam tab remains open and unchanged.

**Pass / Fail:** `[ ]`

---

### T05 — Language toggle on pre-exam screens

**Precondition:** Exam share link open in browser on Screen 1 (Login).

**Steps:**
1. Locate the language toggle (FR / EN) on Screen 1.
2. Switch from FR to EN.
3. Verify all visible text switches: placeholders, button labels, field labels.
4. Enter student details and continue to Screen 2. Verify Screen 2 text is in English.
5. Continue to Screen 3. Verify rules, monitoring disclosure, checkbox label, and button text are all in English.

**Expected result:** Every visible string on all three pre-exam screens updates to English. No mixed-language elements. Language preference is applied consistently across all three screens.

**Pass / Fail:** `[ ]`

---

### T06 — Complete MCQ exam and submit

**Precondition:** Published MCQ-only exam (no sections). Student logged in and past Screen 3, exam screen visible.

**Steps:**
1. Answer all MCQ questions by selecting an option for each.
2. Click the Submit button.
3. Confirm the submission dialog if one appears.
4. Observe the result screen.

**Expected result:** Submission confirmation screen appears. Score is displayed to the student (e.g. "8 / 10"). No error messages. Exam is locked — reloading the page does not allow re-entry.

**Pass / Fail:** `[ ]`

---

### T07 — Complete exam with sections

**Precondition:** Exam from T01 (1 section header + 5 MCQ). Student logged in and past Screen 3.

**Steps:**
1. Observe that a section header divider is visible before the MCQ questions.
2. Answer all 5 MCQ questions.
3. Submit the exam.
4. Note the score shown on the result screen.

**Expected result:** Section header renders as a visual divider, not as an answerable question. Score is between 0 and 5 — the section does not count as a question, inflate the total, or reduce the score.

**Pass / Fail:** `[ ]`

---

## Section 3 — Score Verification (Critical)

---

### T08 — Score consistency across all views

**Precondition:** A completed submission exists (from T06 or T07). Teacher logged in.

**Steps:**
1. Note the score shown immediately after the student submitted (from the exam engine result screen).
2. Open the submissions dashboard for the exam. Find the student row. Note the score shown in the score column.
3. Click the student row to open student review. Note the total score shown at the top.

**Expected result:** The score is identical in all three locations — exam engine result, submissions dashboard column, and student review total. No discrepancy of any kind.

**Pass / Fail:** `[ ]`

---

### T09 — Score accuracy

**Precondition:** The same submission from T08. Correct answers for the exam are known.

**Steps:**
1. Open student review for the attempt.
2. For each MCQ question, manually verify: is the student's highlighted answer the same as the correct answer shown?
3. Count the number of matches manually.
4. Compare the manual count to the displayed score.

**Expected result:** Displayed score matches the manual count exactly. No off-by-one, no shift caused by section headers.

**Pass / Fail:** `[ ]`

---

## Section 4 — Teacher Dashboard

---

### T10 — Submissions dashboard loads correctly

**Precondition:** At least one submitted attempt exists for an exam. Teacher logged in.

**Steps:**
1. Open the submissions page for the exam (via dashboard or direct link).
2. Observe the student list.
3. Check the student row for: name, email, score, submission status, submission date.

**Expected result:** Student row displays correct name, email, score matching T08, status "Submitted", and a valid submission date. No loading errors or blank fields.

**Pass / Fail:** `[ ]`

---

### T11 — Student review opens correctly

**Precondition:** Submissions page open with at least one submitted attempt.

**Steps:**
1. Click on a student row to open the student review panel.
2. Scroll through all questions.
3. For each MCQ question, verify: question text, student's answer highlighted, correct answer indicated, result indicator (green circle with tick or red circle with X).
4. For any open questions, verify: question text and student response visible.

**Expected result:** All questions display correctly. MCQ result indicators render as filled green/red circles with white tick/X symbols — not as raw Unicode characters. Correct answers are shown. No blank question rows.

**Pass / Fail:** `[ ]`

---

### T12 — Auto-grade with criteria

**Precondition:** Exam from T02 (2 open questions with grading criteria defined). A student has submitted an attempt with responses to the open questions.

**Steps:**
1. Open student review for this attempt.
2. Observe the open question section immediately on page load — do not click anything.
3. Check whether AI grade suggestions appear automatically.
4. Look for a global Confirm all grades button.
5. Click the Confirm all grades button.

**Expected result:** AI grade suggestions load automatically for all open questions that have grading criteria defined, without requiring manual clicking per question. A global confirm button is visible. Clicking it saves all grades — score chips update and confirmed state is persisted.

**Pass / Fail:** `[ ]`

---

### T13 — AI suggest without criteria

**Precondition:** An open question exists in an exam with no grading criteria defined. A student has answered it.

**Steps:**
1. Open student review for the attempt.
2. Locate the open question with no criteria.
3. Click the AI suggest button for that question.

**Expected result:** An inline notice appears first, explaining that defining grading criteria would improve feedback quality. After approximately 2 seconds, an AI suggestion loads below the notice. The suggestion is not blocked — it eventually appears despite no criteria.

**Pass / Fail:** `[ ]`

---

## Section 5 — Email System

---

### T14 — Send results email

**Precondition:** A submitted attempt with a score exists. Teacher logged in. A real email inbox is accessible for testing.

**Steps:**
1. From the submissions dashboard, select the student row.
2. Click Send Results (or equivalent button).
3. Confirm the action if prompted.
4. Open the recipient email inbox and locate the results email.
5. Inspect: score in the email body, teacher contact block at the bottom, testflo logo in the header.

**Expected result:** Email arrives. Score shown matches the dashboard score. Teacher name and contact are visible at the bottom. testflo logo is visible as white-on-dark in the header (not a broken image, not raw text).

**Pass / Fail:** `[ ]`

---

### T15 — Results email score matches dashboard

**Precondition:** Results email received from T14.

**Steps:**
1. Note the score shown in the received results email.
2. Return to the submissions dashboard and note the score in the student row.

**Expected result:** Score in the email is identical to the score in the dashboard. No rounding difference, no off-by-one.

**Pass / Fail:** `[ ]`

---

### T16 — Send retake email

**Precondition:** A student row exists on the submissions dashboard. A real email inbox is accessible.

**Steps:**
1. Click the three-dot menu on a student row.
2. Select Send retake link (or equivalent).
3. Confirm if prompted.
4. Open the recipient inbox and locate the retake email.
5. Inspect: access code block position (must be above the CTA button), teacher contact block at the bottom, automated footer.

**Expected result:** Email arrives. The access code is displayed in a clearly visible block above the CTA button. Teacher contact block is at the bottom. Footer includes automated messaging disclaimer.

**Pass / Fail:** `[ ]`

---

### T17 — Invite email

**Precondition:** A published exam exists with a share link. A real email inbox is accessible.

**Steps:**
1. From the submissions dashboard or exam panel, open Send Invitations.
2. Enter the test email address.
3. Send the invitation.
4. Open the inbox and locate the invitation email.
5. Inspect: exam title, access code, CTA button linking to the exam, teacher contact.

**Expected result:** Email arrives. Exam title is correct. Access code is present. CTA button links to `exam.test-flo.com` (not a GitHub Pages URL). Teacher name and contact visible.

**Pass / Fail:** `[ ]`

---

## Section 6 — PDF Export

---

### T18 — Student report PDF

**Precondition:** A submitted attempt exists. Student review is open.

**Steps:**
1. Click the Download PDF button in the student review.
2. Observe the browser behaviour.
3. Open the downloaded PDF.
4. Inspect: student name, score, question-by-question breakdown, testflo logo in header, institution name or teacher name in footer.

**Expected result:** PDF downloads directly — no print dialog appears. PDF contains the student name, correct score, and a full question table. testflo logo renders as an image (not text). Footer left shows institution name or teacher name (not "testflo"). Footer right shows testflo branding.

**Pass / Fail:** `[ ]`

---

### T19 — Cohort report PDF

**Precondition:** At least 2 submitted attempts exist for an exam. Submissions dashboard is open.

**Steps:**
1. Click Export Report (cohort PDF button) on the submissions dashboard.
2. Observe browser behaviour.
3. Open the downloaded PDF.
4. Verify it contains all students with their scores.

**Expected result:** PDF downloads directly with no print dialog. All submitted students appear with names and scores. No student is missing.

**Pass / Fail:** `[ ]`

---

### T20 — Qualiopi single student PDF

**Precondition:** A submitted attempt exists. Submissions dashboard is open.

**Steps:**
1. Click the three-dot menu on a student row.
2. Select Exporter PDF Qualiopi (or equivalent).
3. Open the downloaded PDF.
4. Inspect: student name, exam title, date taken, score, ACQUIS or NON ACQUIS verdict, Qualiopi footer.

**Expected result:** PDF downloads directly with no print dialog. All fields are populated. ACQUIS/NON ACQUIS reflects the student's score threshold correctly. Qualiopi compliance footer is present.

**Pass / Fail:** `[ ]`

---

### T21 — Qualiopi bulk PDF

**Precondition:** At least 2 submitted attempts exist. Submissions dashboard is open.

**Steps:**
1. Locate the bulk export button (e.g. Exporter tous — Qualiopi PDF) in the dashboard footer or export section.
2. Click it.
3. Open the downloaded PDF.
4. Inspect: all students listed in a table, a summary row, Qualiopi footer.

**Expected result:** PDF downloads directly with no print dialog. All students appear. A summary row is present (e.g. cohort pass rate). Qualiopi footer is present on all pages.

**Pass / Fail:** `[ ]`

---

## Section 7 — Language Switching

---

### T22 — Teacher dashboard language switch

**Precondition:** Teacher logged in. Dashboard visible. Language currently set to FR.

**Steps:**
1. Click the language toggle (globe icon or FR/EN selector) on the dashboard.
2. Switch to EN.
3. Observe all visible text: nav labels, button labels, status badges, column headers.
4. Reload the page.
5. Verify language preference persisted.

**Expected result:** All UI text switches to English immediately on toggle. No mixed-language elements. After page reload, language remains English without needing to toggle again.

**Pass / Fail:** `[ ]`

---

### T23 — Submissions page language switch

**Precondition:** Submissions page open. Language currently set to FR.

**Steps:**
1. Switch language to EN using the toggle on the submissions page.
2. Observe: all labels, buttons, status badges, column headers, and filter options.

**Expected result:** All text on the submissions page switches to English. Status values (e.g. Soumis → Submitted), button labels (e.g. Envoyer les résultats → Send results), and sort options all update correctly.

**Pass / Fail:** `[ ]`

---

## Section 8 — Anti-Cheat

---

### T24 — Session journal logged

**Precondition:** A real exam has been completed and submitted as a student.

**Steps:**
1. Open student review for the submitted attempt as teacher.
2. Scroll to the Session Journal section (collapsible panel at the bottom).
3. Expand it.
4. Read the event log entries.

**Expected result:** Session journal is visible and contains at minimum two events: one for exam start and one for submission. Timestamps are present. No empty journal.

**Pass / Fail:** `[ ]`

---

### T25 — Tab switch violation logged

**Precondition:** An exam is in progress in a browser tab (questions visible, timer running).

**Steps:**
1. During the exam, switch to another browser tab or application.
2. Wait 3–5 seconds.
3. Switch back to the exam tab.
4. Observe the exam screen immediately on return.
5. After submitting, open student review and check the session journal.

**Expected result:** A warning overlay appears on return to the exam tab, indicating a focus loss was detected. The session journal in student review shows the tab switch event with a timestamp and violation count incremented.

**Pass / Fail:** `[ ]`

---

### T26 — Anti-translation gate

**Precondition:** An exam is in progress. Browser translate is available (e.g. Chrome auto-translate or right-click translate).

**Steps:**
1. During the exam questions screen, right-click on the page and select Translate to [language].
2. Observe the exam screen.

**Expected result:** A block screen appears immediately, freezing the exam. A notice informs the student that translation is not permitted. The incident is logged in the session journal visible to the teacher after submission.

**Pass / Fail:** `[ ]`

---

## Section 9 — Security Spot Check

---

### T27 — Answer key not exposed in browser

**Precondition:** An exam is in progress. Browser DevTools open (F12).

**Steps:**
1. Open the Network tab in DevTools before the questions load.
2. Filter by Fetch/XHR requests.
3. Find the response from the `exam-questions` edge function.
4. Click on it and inspect the response body JSON — search for `correct_index`.

**Expected result:** The `correct_index` field does not appear anywhere in the `exam-questions` response. The response contains question text and options only. The correct answer is never sent to the browser.

**Pass / Fail:** `[ ]`

---

### T28 — Direct database access blocked

**Precondition:** An exam is open in the browser. Browser DevTools open. The anon key is visible in the page source (expected — it is a public key).

**Steps:**
1. Open the Console tab in DevTools.
2. Find the Supabase anon key from the page source or Network tab headers.
3. Run the following in the console:
   ```
   fetch('https://toxgihdyfzdymgidgvaq.supabase.co/rest/v1/exam_attempts', {headers: {'apikey': '<anon_key>', 'Authorization': 'Bearer <anon_key>'}}).then(r=>r.json()).then(console.log)
   ```
4. Observe the response.

**Expected result:** The response is an empty array `[]` or a 403 error. No student attempt data is returned. Row Level Security is blocking unauthenticated read access.

**Pass / Fail:** `[ ]`

---

## Section 10 — Mobile Spot Check

---

### T29 — Mobile exam flow

**Precondition:** A published exam exists. A real mobile phone with a browser is available.

**Steps:**
1. Open the exam share link on the mobile browser.
2. Complete the 3-screen pre-exam flow.
3. Answer all questions using the mobile interface.
4. Submit the exam.
5. Observe: progress indicator format, question navigation, and result screen.

**Expected result:** Progress indicator shows "Question X sur N" (or "Question X of N" in EN) — no large numbered squares. Questions are readable and tappable without horizontal scrolling. Keyboard appearing for open question text entry does not trigger a false fullscreen-loss violation. Result screen displays correctly.

**Pass / Fail:** `[ ]`

---

### T30 — Mobile DND notice

**Precondition:** Exam share link open on mobile device. Student is on Screen 3 (Instructions).

**Steps:**
1. On a mobile device, navigate through Screen 1 and Screen 2 to reach Screen 3.
2. Read the full instructions screen without scrolling past the checkbox.
3. Locate the DND (Do Not Disturb) notice.

**Expected result:** A yellow/amber notice is visible above the acknowledge checkbox, advising the student to enable Do Not Disturb on their device before starting. The notice is visible without scrolling. It is not shown on desktop browsers.

**Pass / Fail:** `[ ]`

---

## Section 11 — New Section Features

---

### T31 — Section page break

**Precondition:** An exam built in exam-builder-manual.html with at least two sections, each with the Page break toggle enabled. A student has logged in and reached the exam screen.

**Steps:**
1. Observe the exam screen on load — only the first section's questions should be visible.
2. Verify a Next section button is present at the bottom. Verify no Submit button is visible.
3. Answer at least one question in the first section.
4. Click Next section.
5. Verify the first section's questions are no longer visible and the second section's questions appear.
6. Verify a Previous section button is now present alongside Next section (or Submit on the last page).
7. Click Previous section and verify the first section returns.

**Expected result:** Each page-break section renders as a discrete page. Next/Back navigation advances and retreats between pages correctly. The Submit button only appears on the final page. Questions from other pages are never shown alongside the current page.

**Pass / Fail:** `[ ]`

---

### T32 — Question pool

**Precondition:** An exam with a pool section configured (e.g. 10 questions in pool, pool_draw set to 3). At least two students have submitted attempts from different browsers or devices.

**Steps:**
1. As student A, start and submit the exam. Note which 3 questions were shown.
2. As student B (different browser / incognito), start and submit the exam. Note which 3 questions were shown.
3. Open student review for student A and student B as teacher.

**Expected result:** Students A and B receive different subsets of the pool questions (confirmed by comparing question text in their respective reviews). The pool label in student review reads "Pool — 3 of 10 questions drawn" above the pool section. Questions not drawn for a student do not appear in their review.

**Pass / Fail:** `[ ]`

---

### T33 — Section attachment

**Precondition:** An exam built in exam-builder-manual.html with a section that has an attachment added (test with image, PDF, and audio separately, or whichever type is available).

**Steps:**
1. Add an image attachment to a section in the manual builder. Publish the exam.
2. As a student, log in and reach the exam screen.
3. Verify the image renders at the top of the section, above all questions in that section.
4. Repeat with a PDF attachment — verify it renders as an inline preview frame.
5. Repeat with an audio attachment — verify the custom audio player (play/pause/replay buttons, time display) is present and functional.

**Expected result:** Each attachment type renders at the top of its section before the questions. Image: visible inline. PDF: rendered in an iframe preview. Audio: custom player with play, replay, and time display — not a raw browser audio control. The attachment does not appear in other sections.

**Pass / Fail:** `[ ]`

---

### T34 — AI-generated exam edit — section attachment, pool, and page break on review page

**Precondition:** Logged in as teacher. Use the AI extraction flow (upload a document → extract questions → arrive at the Review & Publish page). The exam must include at least one section header detected by the AI.

**Steps:**
1. On the Review & Publish page, locate a section card. Verify it shows three configuration panels: Section attachment, Question pool, and Start on new page.
2. Upload an image file as a section attachment. Verify the attachment pill appears and the asterisk note is visible below the buttons.
3. Check the Question pool toggle. Verify the Total questions in pool and Questions to serve per student fields appear. Enter values (e.g. 10 and 4).
4. Check the Start on new page toggle.
5. Click Publish exam.
6. Open the published exam as a student and verify: the section renders on its own page with Next section navigation, the image attachment appears at the top of the section, and only 4 of the 10 pool questions are shown.
7. As teacher, open student review for a submitted attempt. Verify the pool label reads "Pool — 4 of 10 questions drawn" above the section.

**Expected result:** All three section configuration panels are visible and interactive on the Review & Publish page. Values entered are persisted through publish. The published exam reflects: page break navigation, the correct pool draw count, and the section attachment rendered above questions. Student review shows the pool label with the correct X of Y count.

**Pass / Fail:** `[ ]`

---

## Results Summary

| Test ID | Name | Result | Notes |
|---------|------|--------|-------|
| T01 | Create exam with sections and MCQ | `[ ]` | |
| T02 | Create exam with sections, MCQ, and open questions | `[ ]` | |
| T03 | Student login and confirmation flow | `[ ]` | |
| T04 | Privacy policy link | `[ ]` | |
| T05 | Language toggle on pre-exam screens | `[ ]` | |
| T06 | Complete MCQ exam and submit | `[ ]` | |
| T07 | Complete exam with sections | `[ ]` | |
| T08 | Score consistency across all views | `[ ]` | |
| T09 | Score accuracy | `[ ]` | |
| T10 | Submissions dashboard loads correctly | `[ ]` | |
| T11 | Student review opens correctly | `[ ]` | |
| T12 | Auto-grade with criteria | `[ ]` | |
| T13 | AI suggest without criteria | `[ ]` | |
| T14 | Send results email | `[ ]` | |
| T15 | Results email score matches dashboard | `[ ]` | |
| T16 | Send retake email | `[ ]` | |
| T17 | Invite email | `[ ]` | |
| T18 | Student report PDF | `[ ]` | |
| T19 | Cohort report PDF | `[ ]` | |
| T20 | Qualiopi single student PDF | `[ ]` | |
| T21 | Qualiopi bulk PDF | `[ ]` | |
| T22 | Teacher dashboard language switch | `[ ]` | |
| T23 | Submissions page language switch | `[ ]` | |
| T24 | Session journal logged | `[ ]` | |
| T25 | Tab switch violation logged | `[ ]` | |
| T26 | Anti-translation gate | `[ ]` | |
| T27 | Answer key not exposed in browser | `[ ]` | |
| T28 | Direct database access blocked | `[ ]` | |
| T29 | Mobile exam flow | `[ ]` | |
| T30 | Mobile DND notice | `[ ]` | |
| T31 | Section page break | `[ ]` | |
| T32 | Question pool | `[ ]` | |
| T33 | Section attachment | `[ ]` | |
| T34 | AI-generated exam edit — section attachment, pool, and page break on review page | `[ ]` | |

---

> **All tests must pass before running student exams. Any failure must be investigated and fixed before proceeding. Critical tests are T08 and T09 — score consistency and accuracy must always pass.**
