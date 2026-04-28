---
status: complete
phase: 03-email-capture-form-stub-action
source: [03-01-SUMMARY.md, 03-02-SUMMARY.md, 03-03-SUMMARY.md, 03-04-SUMMARY.md, 03-05-SUMMARY.md, 03-06-SUMMARY.md, 03-07-SUMMARY.md]
started: 2026-04-28T16:55:00Z
updated: 2026-04-28T17:04:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Form is visible with correct copy
expected: |
  Visit `/`. Scroll to the waitlist form. Section shows H2 "Be first when Quibly
  opens up.", sub-copy "Drop your email and we'll ping you the moment Quibly's
  ready.", an email input (`you@example.com` placeholder), and a teal pill
  button labeled "Join the waitlist".
result: pass

### 2. Hero CTA scrolls to form
expected: |
  At the top of the page, click the hero "Join the waitlist" pill button. The
  page smooth-scrolls DOWN to the waitlist form section (URL becomes
  `/#waitlist`). The form is in viewport.
result: pass

### 3. Secondary CTA scrolls back to form
expected: |
  Scroll to the bottom of the page. Click the secondary CTA pill labeled
  "Don't miss launch — join the waitlist". The page smooth-scrolls UP to the
  waitlist form section. The form is in viewport.
result: pass

### 4. Successful signup replaces form in place
expected: |
  Type any valid email (e.g., `you@yourdomain.com`) and click "Join the
  waitlist". The form is replaced in place — same section position — by a
  success block:
    - Green check icon
    - Heading: "You're on the list."
    - Body: "Check your inbox (and spam folder) for confirmation."
  No page navigation, no URL change beyond the optional `#waitlist` anchor.
result: pass

### 5. Invalid email shows inline error AND preserves typed value
expected: |
  Type `bad-email` (no @ sign) and click submit. An inline error message
  appears below the input. The typed value `bad-email` REMAINS in the input —
  it is NOT cleared. (This is the load-bearing FORM-06 / Pitfall 1 fix —
  React 19 normally auto-resets uncontrolled inputs after a Server Action.)
result: pass

### 6. Pending state UX during slow submission
expected: |
  Type `slow@example.com` and click submit. Within ~1.5 seconds:
    - Button label changes to "Joining..." with a spinner icon
    - Both the input and the button are disabled (cannot type, cannot click)
  Then it resolves to the success block from test 4.
result: pass

### 7. Server error shows toast (form stays visible)
expected: |
  Type `err@example.com` and click submit. A toast notification appears
  (bottom-right corner by default) showing a server-error message. The form
  remains visible — no success block. The toast auto-dismisses after a few
  seconds.
result: pass

### 8. Already-subscribed renders identical success block
expected: |
  Type `dup@example.com` and click submit. The SAME success block appears as
  a fresh signup (test 4) — same green check, same "You're on the list."
  heading, same body copy. NO "already subscribed", "duplicate", or any
  wording that would reveal the email was already on the list. (Anti-
  enumeration defense, POST-03.)
result: pass

### 9. Enter key submits form
expected: |
  Type any valid email and press the Enter key (do NOT click the button).
  The form submits exactly like clicking — proceeds to success block.
result: pass

## Summary

total: 9
passed: 9
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps
