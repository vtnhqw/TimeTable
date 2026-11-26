# Customizable timetable labels

Approved plan: full class names without course codes, locations visible, consistent system typography, and shared Style/Preview controls for Full / Short / Initials, Small / Standard / Large text, locations and optional course codes. Editable short names and initials apply to every occurrence of the same original subject; reset restores automatic labels. Save settings without changing original class data. Warn about duplicate labels and crowded blocks; preserve full details. Keep whole subject words together, use explicit ellipses only when necessary, and never vary font size per class.

- [x] Add validated settings defaults and label-generation regression tests.
- [x] Implement cleaned full names, familiar short forms, initials and custom overrides.
- [x] Add shared accessible preview controls, persistence and duplicate warnings.
- [x] Use consistent selected font sizes, word wrapping and compact-card padding.
- [x] Verify long-name screenshots, unit/browser suites, export equality, type checks, formatting, build and code review.

Verification: 37 Node tests plus utility/regression checks passed; all 19 browser tests passed against the production build, including PNG pixel equality, settings persistence, keyboard selection, mobile layout, same-name course editing, and icon centering. TypeScript, formatting, diff checks and build passed. Full/Short/Initials render the 11-class long-name fixture without shortened labels at Standard size. Independent review found no blocking issues; its ambiguous-course editor labels and duplicate-message suggestions were addressed and covered by browser regression.
