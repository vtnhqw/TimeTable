# Schedule reliability implementation plan

Goal: implement the four fixes requested following the code review.
Architecture: preserve committed schedule state during extraction; assign overlap lanes per day; keep a deletion stack in Review; migrate validated session data to localStorage.
Tech stack: existing Next.js, React, TypeScript, Canvas and Playwright.

- [x] Add browser regressions for failed/empty replacement, undo and persistent saving; observe failures.
- [x] Keep source preview and classes committed until a nonempty extraction succeeds.
- [x] Add persistent storage with validated legacy migration and session fallback; verify storage failures and corruption.
- [x] Add deletion undo that preserves subsequent edits and supports repeated deletion.
- [x] Test overlap grouping (identical, adjacent, nested, chained and separate days); implement shared layout and review warnings.
- [x] Run unit tests, browser workflows, type checks, formatting and production build; review final diff.

Constraints: preserve existing user CSS changes; no new dependencies; no deployment. Persistent saving is local to this browser, not account sync. Dense overlaps may still truncate text at phone wallpaper dimensions.

Verification: npm test passed (26 Node tests plus utility/regression checks); all 12 Playwright browser tests passed against the production build; lint, format:check, git diff --check and build passed. Independent review found a double-storage-failure data loss case and fallback migration gap; both fixed with regressions observed failing then passing. Existing user CSS edits were preserved.
