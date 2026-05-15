# Visual Audit — testflo
**Date:** 2026-05-11  
**Scope:** All non-mockup application pages  
**Purpose:** Document current visual state only. No changes recommended here.

---

## Pages Audited

1. [login.html](#page-1-loginhtml)
2. [dashboard.html](#page-2-dashboardhtml)
3. [index.html (Exam Builder)](#page-3-indexhtml--exam-builder)
4. [exam-onboarding.html](#page-4-exam-onboardinghtml)
5. [institution.html](#page-5-institutionhtml)
6. [submissions.html](#page-6-submissionshtml)
7. [student-review.html](#page-7-student-reviewhtml)
8. [exam-review.html](#page-8-exam-reviewhtml)
9. [exam-engine.html](#page-9-exam-enginehtml)
10. [error.html](#page-10-errorhtml)

---

## Page 1: login.html

**Purpose:** Teacher/admin authentication

### Layout
- Fixed navy header, 56px, "testflo" text left-aligned
- Centered login container, max-width 380px
- Language toggle fixed top-right corner

### Header
- Background: `#0f172a`
- Height: 56px, padding: `0 40px`
- Border-bottom: `1px solid rgba(255,255,255,0.06)`

### Color Palette
No `:root` CSS variables — all colors are hardcoded inline.
- Navy: `#0f172a`
- Surface: `#f8fafc`
- Border: `#e2e8f0`
- Blue (action): `#2563eb`
- Red (error): `#dc2626`
- Green: `#16a34a`
- Muted: `#64748b`, `#94a3b8`

### Key Components
- **Floating-label inputs** — 52px height, border `1.5px solid #e2e8f0`, label floats on focus/filled
- **Submit button** — background `#2563eb`, width 100%, height 50px, 0.95rem weight 700, hover `#1d4ed8`, disabled opacity 0.55
- **Password eye toggle** — absolute right, color `#94a3b8`
- **Error messages** — flex row with red circle icon, 0.78rem, color `#dc2626`
- **Forgot password link** — 0.8rem weight 500, color `#64748b`
- **Reset confirmation panel** — icon circle 44px with `border-radius: 999px`, background `#f0fdf4`

### Design System Notes
- **Border-radius:** 0px on all form elements and cards; 999px only on confirmation icon
- **No CSS variables** — deviation from all other pages
- Transitions: `0.15s` (faster than the `180ms` standard used elsewhere)

---

## Page 2: dashboard.html

**Purpose:** Role-based dashboard (super admin / admin / teacher)

### Layout
- Sticky header, 56px, navy
- Max-width 1100px container, padding `48px 40px 80px`
- Multi-section layout: stats bar → institution list or exam list → member panels

### CSS Variables (`:root` defined)
```
--black: #0a0a0a   --navy: #0f172a    --ink: #1e293b
--slate: #475569   --muted: #94a3b8   --line: #e2e8f0
--surface: #f8fafc --white: #ffffff   --blue: #2563eb
--green: #16a34a   --amber: #d97706   --red: #dc2626
--radius: 0px      --transition: 180ms ease
```

### Header
- 56px, background `var(--navy)`, padding `0 40px`
- Role badge: 0.58rem, uppercase, letter-spacing 0.12em, border `1px solid rgba(255,255,255,0.15)`, padding `2px 8px`
- Admin badge uses cyan: `#0891b2`

### Key Components
- **Stats bar** — grid (4-col or 3-col), border `1px solid var(--line)`, padding `20px 24px`. Stat value: 1.8rem weight 700
- **Institution rows** — 44px logo box, grid layout, hover background `var(--surface)`, status dot `#16a34a`
- **Exam list** — 6-column grid, col widths `1fr 120px 120px 120px 120px 44px`, hover turns exam name blue
- **Primary button** — background `var(--black)`, color white, hover `var(--blue)`, font 0.7rem uppercase
- **Modal** — backdrop `rgba(15,23,42,0.55)`, max-width 520px, border `1px solid var(--line)`, no border-radius
- **Error/success banners** — red: `#fef2f2`/`#fecaca`; green: `#f0fdf4`/`#86efac`

### Design System Notes
- **Border-radius:** 0px throughout
- **Transitions:** `180ms ease` consistently
- Skeleton loading with gradient animation on initial load

---

## Page 3: index.html — Exam Builder

**Purpose:** Step-by-step exam configuration (title, duration, groups, grading, questions)

### Layout
- Sticky 56px navy header
- Max-width 720px, padding `48px 40px 80px`
- Horizontal step tracker with number indicators and connectors

### CSS Variables
Same full set as dashboard.html, plus `--purple: #7c3aed`.

### Key Components
- **Step tracker** — step circle 26px, border `1.5px`, font 0.62rem. States: inactive (muted), active (black bg), done (green bg + checkmark). Connector: 1px line, turns green when done.
- **Form cards** — border `1px solid var(--line)`, navy card header (padding `14px 24px`, color `rgba(255,255,255,0.85)`)
- **Field labels** — 0.68rem, weight 700, uppercase, letter-spacing 0.09em, color `var(--slate)`, required asterisk `var(--red)`
- **Inputs** — padding `10px 14px`, border `1px solid var(--line)`, 0.88rem, focus border `var(--blue)`
- **Language toggle** — flex, border `1px solid var(--line)`, active tab background `var(--black)` color white
- **Report option cards** — border `1px solid var(--line)`, selected: border `var(--blue)` bg `#eff6ff`
- **AI/info callout** — background `#faf5ff`, border `1px solid #e9d5ff`, color `#4c1d95`. AI chip: `var(--purple)` bg, 0.55rem weight 800
- **Primary button** — background `var(--black)`, hover `var(--navy)`, font 0.72rem uppercase
- **Ghost button** — background white, border `var(--line)`, hover border `var(--slate)`

### Design System Notes
- **Border-radius:** 0px throughout
- **Transitions:** `180ms ease`
- Mobile: button row reverses to column, inputs stack

---

## Page 4: exam-onboarding.html

**Purpose:** Configure exam groups and access codes

### Layout
- Sticky 56px navy header (same as index.html)
- Max-width 720px, padding `48px 40px 80px`
- Step tracker identical to index.html

### Key Components
Nearly identical component structure to index.html:
- Same card / navy-header pattern
- Same form field / label styling
- Group management rows: column labels, add/remove row buttons

- **Add Group button** — background none, border `1px solid rgba(255,255,255,0.2)`, color `rgba(255,255,255,0.55)`, inside navy card header

### Design System Notes
- **Border-radius:** 0px
- Effectively a continuation of index.html's design — visually indistinguishable as a separate page

---

## Page 5: institution.html

**Purpose:** Manage institution members (admins, teachers), classes, and exam list

### Layout
- Header 60px (non-standard), padding `0 32px`
- Max-width 1100px, padding `36px 24px`
- Hero card: institution logo + name + domain
- Three section columns: admins, teachers, exams

### Header — INCONSISTENCY
- Height: **60px** (all other pages: 56px)
- Padding: **`0 32px`** (all other pages: `0 40px`)
- Background: `#0f172a` (correct)

### Color Palette
No `:root` CSS variables — all hardcoded.
- Navy: `#0f172a`
- Border: `#e2e8f0`
- Muted: `#94a3b8`
- Blue: `#2563eb`
- Green: `#16a34a`
- Purple: `#7c3aed`

### Key Components
- **Institution hero** — logo box 64px × 64px, `border-radius: 12px`, border `1px solid #e2e8f0`, background `#f8f9fc`. Name: 1.25rem weight 800. Domain: monospace.
- **Stats bar** — flex (not grid), gap 16px. Cards: `border-radius: 12px`, border `1px solid #e2e8f0`, padding `16px 20px`. Stat value: 1.5rem weight 800.
- **Member list** — background white, border `1px solid #e2e8f0`, `border-radius: 12px`. Rows separated by `1px dashed #e2e8f0`. Avatars: 38px × 38px, `border-radius: 50%`.
- **Class tags** — 0.68rem weight 600, background `#eff6ff`, color `#2563eb`, `border-radius: 999px`
- **Add button** — background `#0f172a`, `border-radius: 8px`, padding `8px 16px`, 0.78rem weight 600
- **Modal** — `border-radius: 16px`, max-width 480px. Input rows: `border-radius: 8px`. Close button: `border-radius: 6px`.

### Design System Notes
- **Border-radius:** 6px–16px throughout — **major outlier** vs every other page's 0px
- **No CSS variables** used
- Header dimensions differ from every other page
- Dashed borders used for row separators (unique to this page)

---

## Page 6: submissions.html

**Purpose:** Teacher view of all student submissions for an exam

### Layout
- Sticky 56px navy header
- Max-width 1100px, padding `48px 40px 80px`
- Exam hero card → tab bar (Submissions / Exam / Overview) → content panel

### CSS Variables
Full `:root` set including `--purple: #7c3aed`.

### Key Components
- **Exam hero** — flex, border `1px solid var(--line)`, padding `28px 32px`. Title: 1.5rem weight 700.
- **Tab bar** — horizontal flex, border-bottom `1px solid var(--line)`. Tabs: 0.68rem uppercase, padding `0 4px 14px`. Active: border-bottom `2px solid var(--black)`.
- **Stats pills** — flex row, each pill: border `1px solid var(--line)`, padding `8px 16px`. Value: 1.1rem weight 700.
- **Filter row** — search input + sort select + send button
- **Group tabs** — pill buttons, active: background `var(--black)` color white
- **Submission list** — grid per row: `36px 1fr 110px 120px 80px 44px`
- **Submission row** — padding `16px 24px`, border-bottom `1px solid var(--line)`, hover background `var(--surface)`
- **Row-sent state** — `opacity: 0.55`
- **Status badges** — 0.6rem uppercase. Pending: yellow. Sent: green. Scheduled: blue. Bounced: red.
- **Kebab menu** — 28px × 28px button, menu `position: fixed`, z-index 9000, background `var(--white)`, border + shadow, menus hoisted to `document.body` on render
- **Modals** — backdrop `rgba(15,23,42,0.5)`, z-index 1000. Modal: border `1px solid var(--line)`, max-width varies
- **Session log** — amber left-border callout for flagged events
- **Toast** — fixed bottom-center, background `var(--navy)`, 0.8rem weight 600

### Design System Notes
- **Border-radius:** 0px
- **Transitions:** `180ms ease`
- Largest file in the project by line count

---

## Page 7: student-review.html

**Purpose:** Teacher reviews and grades a specific student's submission

### Layout
- Sticky 56px navy header
- Max-width 1100px, padding `48px 40px 80px`
- Student info card → MCQ section → open questions → action bar

### CSS Variables
Full `:root` set including `--purple: #7c3aed`.

### Key Components
- **Student card** — flex, justify-content space-between. Name: 1.4rem weight 700, letter-spacing -0.03em. Score block right: 2.6rem weight 700 color `var(--blue)`.
- **Section header** — navy background, padding `14px 24px`. Title: 0.72rem uppercase white. Score: 0.68rem weight 600 `rgba(255,255,255,0.4)`.
- **MCQ table** — thead: `var(--surface)` background, 0.58rem uppercase. Rows: padding `14px 24px`, hover `var(--surface)`.
- **Open question rows** — padding `28px 24px`, border-bottom `1px solid var(--line)`. Answer block: background `var(--surface)`, border `1px solid var(--line)`, padding `14px 16px`, `white-space: pre-wrap`.
- **Score input** — 56px wide, 1.1rem weight 700, center aligned
- **AI suggestion block** — background `#faf5ff`, border `1px solid #e9d5ff`, color `#4c1d95`. AI chip: `var(--purple)` bg.
- **Primary button** — background `var(--blue)` (differs from dashboard/builder which use black)
- **AI button** — background `#f5f3ff`, color `var(--purple)`, border `1px solid #ddd6fe`
- **Toast** — fixed bottom-center, background `var(--navy)`
- **Bottom action bar** — border-top `1px solid var(--line)`, flex, justify-content space-between

### Design System Notes
- **Border-radius:** 0px throughout
- **Primary action button is blue** here vs black in dashboard/builder pages

---

## Page 8: exam-review.html

**Purpose:** Final exam review before publishing

### Layout
- Sticky 56px navy header
- Step pill bar (44px, border-bottom `1px solid var(--line)`)
- Two-column layout: 300px sticky left panel + flexible right preview panel

### CSS Variables
Full `:root` set including `--purple: #7c3aed`.

### Key Components
- **Step bar** — pills: 0.65rem uppercase, padding `0 16px`. Active: border-bottom `2px solid var(--black)`. Done: color `var(--green)`.
- **Left panel** — sticky `top: 116px`, border `1px solid var(--line)`. Header: navy bg. Stats 2×2 grid: border-right/border-bottom separators. Stat value: 1.4rem weight 700.
- **Checklist** — flex rows, gap 10px. Icon: 18px. Check: green ok / amber warning. Text: 0.75rem.
- **Right panel** — simulated exam preview: navy header, section dividers (`var(--surface)` bg), question cards (border `1px solid var(--line)`).
- **Preview badge** — 0.58rem, background `#fef9c3`, color `#92400e`, 0px border-radius
- **Correct option** — border `1.5px solid #86efac`, background `#f0fdf4`, border-left `3px solid var(--green)`
- **CTA bar** — fixed bottom 0, background white, border-top `1px solid var(--line)`, padding `14px 40px`
- **Primary button** — background `var(--blue)` (blue, not black)

### Design System Notes
- **Border-radius:** 0px
- Yellow preview badge `#fef9c3` / `#92400e` — same amber warning pattern used in other pages

---

## Page 9: exam-engine.html

**Purpose:** Student-facing exam taking experience

### Layout
- Fixed 56px navy header
- Max-width 720px, margin `32px auto 80px`, padding `0 24px`
- Login card → confirmation card → exam questions

### CSS Variables
Full `:root` set including `--purple: #7c3aed`.

### Header
- Fixed position, z-index 1000
- Title (h1): 0.82rem weight 700 letter-spacing 0.04em
- Timer: right side, hidden by default. Urgent state: background `var(--red)`

### Key Components
- **Cards** — border `1px solid var(--line)`, padding 36px
- **Login card** — eyebrow: 0.6rem uppercase, title: 1.4rem weight 700, subtitle: 0.85rem muted
- **Name row** — two-column flex on desktop, single column on mobile
- **Confirmation card** — penalty callout: border `1.5px solid #fca5a5`, bg `#fff5f5`, color `#991b1b`. Rules block: bg `var(--surface)`, border `1px solid var(--line)`. Monitoring disclosure: bg `#f8fafc`, border `1px solid #e2e8f0`, left border `3px solid #94a3b8`.
- **Identity verify items** — bg `var(--surface)`, border `1px solid var(--line)`, padding `12px 16px`
- **Acknowledge checkbox row** — border `1.5px solid var(--line)`, transitions to green border when checked
- **Question cards** — border `1.5px solid var(--line)`, padding 24px. Answered state: `#86efac` border, `#f0fdf4` bg.
- **MCQ options** — border `1.5px solid var(--line)`, padding `11px 14px`. Hover: `#93c5fd` border, `#eff6ff` bg. Selected: `var(--blue)` border, `#eff6ff` bg.
- **Open response note** — bg `#faf5ff`, border `1px solid #e9d5ff`, color `var(--purple)`
- **Word count hint** — `.hint-neutral`: bg `#f1f5f9`, `.hint-ok`: bg `#dcfce7` color `#166534`
- **Progress bar** — height 4px, fill `var(--blue)`, transition `width 0.3s`
- **Question nav dots** — 30px × 30px. Answered: green bg. Open: purple bg.
- **Anti-cheat overlay** — fixed, `rgba(15,23,42,0.9)` + `backdrop-filter: blur(12px)`. Card: border-left `4px solid var(--red)`. Countdown: 3rem weight 800 red.
- **Terminated screen** — full-screen `var(--navy)` bg. Content card: border-top `4px solid var(--red)`.
- **Success screen** — padding `60px 20px`, border-top `4px solid var(--green)`
- **Primary button** — background `var(--blue)`, hover `#1d4ed8`

### Design System Notes
- **Border-radius:** 0px throughout (most consistent of all pages)
- `user-select: none` on body; `user-select: text` only on textareas
- Bilingual (FR/EN) via `getUIStrings()`

---

## Page 10: error.html

**Purpose:** Generic error display, content injected via URL params

### Layout
- Fixed 56px navy header, "testflo" text left-aligned
- Max-width 480px, margin `60px auto`, padding `0 24px`
- Single card

### CSS Variables (`:root` defined, minimal set)
```
--black: #0a0a0a   --navy: #0f172a    --ink: #1e293b
--slate: #475569   --muted: #94a3b8   --line: #e2e8f0
--surface: #f8fafc --white: #ffffff   --blue: #2563eb
--red: #dc2626
```

### Key Components
- **Card** — border `1px solid var(--line)`, border-top `4px solid var(--red)`, padding `40px 36px`, text-align center
- **Icon** — 44px SVG, red stroke
- **Title** — 1.4rem weight 700, letter-spacing -0.02em, color `var(--black)` (populated from URL `?title=`)
- **Message** — 0.9rem color `var(--slate)`, line-height 1.7 (populated from URL `?msg=`)
- **Contact note** — 0.82rem color `var(--muted)`, static text
- **Error code** — 0.72rem monospace color `var(--muted)` (populated from URL `?code=`)

### Design System Notes
- **Border-radius:** 0px
- No interactive elements, no buttons
- Minimal variable set compared to other pages

---

## Mobile Fixes

### Mobile keyboard false-positive anti-cheat violations
**Date:** 2026-05-15
**File:** `exam-engine.html`
**Commit:** `dfe1cd2`

**Problem:** On mobile devices, opening the soft keyboard causes `window blur` and `visibilitychange` events to fire even though the student has not left the exam. This was triggering violation warnings and, after 3 occurrences, auto-submitting the exam — a false positive that penalises students for normal typing behaviour.

**Fix:**
- Added `isMobile` flag using `navigator.userAgent` detection (`/Android|iPhone|iPad|iPod|Mobile/i`)
- `blur` listener: on mobile, if `document.activeElement` is a `TEXTAREA` or `INPUT` when the event fires, suppress it entirely — no `logEvent()`, no `askToExit()`
- `visibilitychange` listener: same suppression when a textarea/input is focused; for non-textarea mobile focus loss, a 500ms delay is applied before counting — if `document.hidden` is false after 500ms, the event is discarded (catches brief keyboard dismissals)
- `fullscreenchange` listener: untouched — keyboard does not trigger fullscreen exits on mobile

**What did not change:** All desktop anti-cheat logic, the violation threshold (3), the 15-second grace period, session logging, and session locking are completely unchanged. Genuine tab switches and app switches on mobile still count as violations.

---

## Cross-Page Inconsistency Summary

### 1. Border-Radius
| Page | Border-Radius |
|------|--------------|
| login.html | 0px (999px on one icon only) |
| dashboard.html | 0px |
| index.html | 0px |
| exam-onboarding.html | 0px |
| **institution.html** | **6–16px (major outlier)** |
| submissions.html | 0px |
| student-review.html | 0px |
| exam-review.html | 0px |
| exam-engine.html | 0px |
| error.html | 0px |

### 2. Header Height & Padding
| Page | Height | Padding |
|------|--------|---------|
| All pages except institution.html | 56px | `0 40px` |
| **institution.html** | **60px** | **`0 32px`** |

### 3. CSS Variable Usage
| Page | Uses `:root` Variables |
|------|----------------------|
| login.html | ✗ Hardcoded |
| dashboard.html | ✓ |
| index.html | ✓ |
| exam-onboarding.html | ✓ |
| **institution.html** | **✗ Hardcoded** |
| submissions.html | ✓ |
| student-review.html | ✓ |
| exam-review.html | ✓ |
| exam-engine.html | ✓ |
| error.html | ✓ (partial set) |

### 4. Primary Button Color
| Context | Color |
|---------|-------|
| dashboard.html, index.html, exam-onboarding.html | `var(--black)` `#0a0a0a` |
| login.html, student-review.html, exam-review.html, exam-engine.html | `var(--blue)` `#2563eb` |
| institution.html | `#0f172a` (navy, not black) |

### 5. Stats Bar Layout
| Page | Layout |
|------|--------|
| dashboard.html | CSS Grid, 3–4 columns, shared borders |
| institution.html | Flexbox, gap-based, rounded cards (12px) |
| exam-review.html | CSS Grid, 2×2, shared borders |
| submissions.html | Flex pill row |

### 6. Section Header Cards
Most pages use a navy-background card header with `rgba(255,255,255,0.85)` text inside white-border cards.
institution.html does not use this pattern — section titles are plain text labels above rounded cards.

### 7. Row Separator Style
| Page | Separator |
|------|-----------|
| Most pages | `border-bottom: 1px solid var(--line)` (solid) |
| institution.html | `border-bottom: 1px dashed #e2e8f0` (dashed — unique) |

### 8. Transition Timing
| Page | Transition |
|------|-----------|
| login.html | `0.15s` |
| All others | `180ms ease` |

### 9. Font Size — Base Form Inputs
| Pages | Input font-size |
|-------|----------------|
| index.html, exam-onboarding.html, exam-engine.html | 0.88rem–0.95rem |
| institution.html | 0.88rem (no variable) |
| Consistent across majority | 0.88rem |

### 10. Avatar / Member Representation
| Page | Avatar Style |
|------|-------------|
| dashboard.html | Initials in colored square, no border-radius |
| institution.html | Initials in colored circle (`border-radius: 50%`) |

---

## Summary Table

| Attribute | Standard (majority) | Outliers |
|-----------|-------------------|----------|
| Border-radius | 0px | institution.html (6–16px) |
| Header height | 56px | institution.html (60px) |
| Header padding | `0 40px` | institution.html (`0 32px`) |
| CSS variables | `:root` used | login.html, institution.html (hardcoded) |
| Primary button | Black (`#0a0a0a`) on admin/builder; Blue (`#2563eb`) on student/review | institution.html uses navy `#0f172a` |
| Transition | `180ms ease` | login.html (`0.15s`) |
| Stats layout | Grid with shared borders | institution.html (flex + rounded cards) |
| Row separators | Solid 1px line | institution.html (dashed) |
| Avatars | Square initials | institution.html (circular) |
| Section headers | Navy card header block | institution.html (plain labels) |
